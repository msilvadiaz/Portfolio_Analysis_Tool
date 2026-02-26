from flask import Flask, request, jsonify, render_template
import yfinance as yf, os
from sqlalchemy import create_engine, Integer, String, ForeignKey, UniqueConstraint, Float
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, Session
from dotenv import load_dotenv
from flask_cors import CORS
import pandas as pd
import time
from models.efficient_frontier import DEFAULT_RISK_FREE_RATE, build_efficient_frontier_response

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    raise RuntimeError("nonexistent")

stockboard= Flask(__name__, template_folder="docs")
engine = create_engine(DB_URL, future=True, echo=False)

#helper classes
class Base(DeclarativeBase):
    pass
class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    stocks: Mapped[list["Stock"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Stock(Base):
    __tablename__ = "stocks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    ticker: Mapped[str] = mapped_column(String(16), nullable=False)
    broker: Mapped[str] = mapped_column(String(80), nullable=False)
    shares: Mapped[float] = mapped_column(Float, nullable=False)
    user: Mapped[User] = relationship(back_populates="stocks")

    __table_args__ = (
        UniqueConstraint("user_id", "ticker", "broker", name="uq_user_ticker_broker"),
    )

Base.metadata.create_all(engine)

HISTORY_CACHE_TTL_SECONDS = 600
portfolio_history_cache: dict[tuple[str, str], tuple[float, list[dict[str, str | float]]]] = {}


def latest_price(ticker: str) -> float:
    price, _ = price_snapshot(ticker)
    return price


def price_snapshot(ticker: str) -> tuple[float, float | None]:
    t = yf.Ticker(ticker)
    fast_info = getattr(t, "fast_info", {}) or {}

    price = fast_info.get("last_price")
    previous_close = fast_info.get("previous_close")

    if price is None or previous_close is None:
        hist = t.history(period="5d")
        closes = hist.get("Close") if hist is not None else None
        if closes is not None:
            closes = closes.dropna()
            if price is None and not closes.empty:
                price = closes.iloc[-1]
            if previous_close is None and len(closes) >= 2:
                previous_close = closes.iloc[-2]

    if price is None:
        raise ValueError(f"No market price found for ticker {ticker}")

    return float(price), float(previous_close) if previous_close is not None else None


def stock_row(s: Stock, price: float | None, previous_close: float | None) -> dict:
    if price is None:
        return {
            "ticker": s.ticker,
            "broker": s.broker,
            "shares": s.shares,
            "price": None,
            "previous_close": previous_close,
            "total_value": None,
        }

    p = float(price)
    return {
        "ticker": s.ticker,
        "broker": s.broker,
        "shares": float(f"{s.shares:.4f}"),
        "price": round(p, 4),
        "previous_close": round(float(previous_close), 4) if previous_close is not None else None,
        "total_value": round(p * s.shares, 2),
    }

def compute_user_portfolio(session: Session, username_lower: str) -> tuple[list[dict], float]:
    u = session.query(User).filter_by(username=username_lower).first()
    if not u:
        return [], 0.0

    rows, total = [], 0.0
    for s in u.stocks:
        try:
            p, prev_close = price_snapshot(s.ticker)
            r = stock_row(s, p, prev_close)
            rows.append(r)
            total += r["total_value"]
        except Exception:
            rows.append(stock_row(s, None, None))
    rows.sort(key=lambda r: r["total_value"] if r["total_value"] is not None else float("inf"))
    return rows, round(total, 2)


def get_user_holdings(session: Session, username_lower: str) -> dict[str, float]:
    u = session.query(User).filter_by(username=username_lower).first()
    if not u:
        return {}

    holdings: dict[str, float] = {}
    for s in u.stocks:
        ticker = (s.ticker or "").strip().upper()
        if not ticker or s.shares <= 0:
            continue
        holdings[ticker] = holdings.get(ticker, 0.0) + float(s.shares)
    return holdings


def compute_portfolio_history(holdings: dict[str, float], period: str = "1y") -> list[dict[str, str | float]]:
    if not holdings:
        return []

    tickers = sorted(holdings.keys())
    hist = yf.download(
        tickers=tickers,
        period=period,
        interval="1d",
        auto_adjust=True,
        progress=False,
    )
    if hist is None or hist.empty:
        return []

    if isinstance(hist.columns, pd.MultiIndex):
        if "Close" in hist.columns.get_level_values(0):
            close_df = hist["Close"].copy()
        else:
            close_df = pd.DataFrame(index=hist.index)
    else:
        close_df = hist[["Close"]].copy()
        close_df.columns = tickers[:1]

    if close_df.empty:
        return []

    close_df = close_df.ffill().dropna(how="all")
    if close_df.empty:
        return []

    missing_cols = [t for t in tickers if t not in close_df.columns]
    for t in missing_cols:
        close_df[t] = pd.NA

    close_df = close_df[tickers].ffill().dropna(how="all")
    if close_df.empty:
        return []

    shares_series = pd.Series(holdings, index=tickers, dtype="float64")
    portfolio_series = close_df.mul(shares_series, axis=1).sum(axis=1, min_count=1).dropna()

    out: list[dict[str, str | float]] = []
    for idx, value in portfolio_series.items():
        out.append({
            "date": idx.strftime("%Y-%m-%d"),
            "value": round(float(value), 2),
        })
    return out


def get_cached_portfolio_history(username_lower: str, period: str) -> list[dict[str, str | float]] | None:
    key = (username_lower, period)
    item = portfolio_history_cache.get(key)
    if not item:
        return None
    created_at, payload = item
    if time.time() - created_at > HISTORY_CACHE_TTL_SECONDS:
        portfolio_history_cache.pop(key, None)
        return None
    return payload


def set_cached_portfolio_history(username_lower: str, period: str, payload: list[dict[str, str | float]]) -> None:
    portfolio_history_cache[(username_lower, period)] = (time.time(), payload)


def clear_cached_portfolio_history(username_lower: str) -> None:
    keys_to_remove = [key for key in portfolio_history_cache if key[0] == username_lower]
    for key in keys_to_remove:
        portfolio_history_cache.pop(key, None)

#routes
#@stockboard.route("/")
#def home():
#    return render_template("index.html")

@stockboard.route("/api/user/<username>", methods=["GET"])
def api_get_user(username: str):
    username_lower = (username or "").strip().lower()
    with Session(engine) as s:
        u = s.query(User).filter_by(username=username_lower).first()
        if not u:
            return jsonify({"error": "user not found"}), 404
        rows, total = compute_user_portfolio(s, username_lower)
        return jsonify({"user": u.username, "stocks": rows, "portfolio_total": total})

@stockboard.route("/api/add-profile", methods=["POST"])
def api_add_profile():
    data = request.get_json(force=True) or {}
    username_lower = (data.get("user") or "").strip().lower()
    payload = data.get("stocks") or []

    if not username_lower:
        return jsonify({"error": "user is required"}), 400

    # First: validate all provided tickers map to Yahoo, and shares/broker are sane.
    invalid = []
    valid_items = []
    for item in payload:
        t = (item.get("ticker") or "").strip().upper()
        b = (item.get("broker") or "").strip()
        sh_raw = item.get("shares")
        try:
            sh = float(sh_raw)
        except (TypeError, ValueError):
            continue
        if not (t and b and sh > 0):
            continue
        try:
            _ = latest_price(t)
        except Exception:
            invalid.append(t)
            continue
        valid_items.append((t, b, sh))

    if invalid:
        return jsonify({"error": "could not locate company for tickers", "tickers": invalid}), 400

    with Session(engine) as s:
        u = s.query(User).filter_by(username=username_lower).first()
        if u:
            return jsonify({"error": "Username already exists"}), 409
        if not u:
            u = User(username=username_lower)
            s.add(u)
            s.flush()

        s.query(Stock).filter_by(user_id=u.id).delete()

        for t, b, sh in valid_items:
            s.add(Stock(user_id=u.id, ticker=t, broker=b, shares=sh))

        s.commit()
        clear_cached_portfolio_history(username_lower)
        rows, total = compute_user_portfolio(s, username_lower)
        return jsonify({"user": u.username, "stocks": rows, "portfolio_total": total}), 201


@stockboard.route("/api/add-stock", methods=["POST"])
def api_add_stock():
    data = request.get_json(force=True) or {}
    username_lower = (data.get("user") or "").strip().lower()
    ticker = (data.get("ticker") or "").strip().upper()
    broker = (data.get("broker") or "").strip()
    sh_raw = data.get("shares")

    try:
        shares = float(sh_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "shares must be a number > 0"}), 400

    if not username_lower or not ticker or not broker or shares <= 0:
        return jsonify({"error": "user, ticker, broker, shares (>0) required"}), 400

    with Session(engine) as s:
        u = s.query(User).filter_by(username=username_lower).first()
        if not u:
            return jsonify({"error": "user not found"}), 404

        st = s.query(Stock).filter_by(user_id=u.id, ticker=ticker, broker=broker).first()
        # validate ticker maps to Yahoo (has a price) before adding/updating
        try:
            _ = latest_price(ticker)
        except Exception:
            return jsonify({"error": "could not locate company attributed to the ticker", "ticker": ticker}), 400

        if st:
            st.shares = shares
        else:
            s.add(Stock(user_id=u.id, ticker=ticker, broker=broker, shares=shares))

        s.commit()
        clear_cached_portfolio_history(username_lower)
        rows, total = compute_user_portfolio(s, username_lower)
        return jsonify({"user": u.username, "stocks": rows, "portfolio_total": total}), 201


@stockboard.route("/api/delete-stock", methods=["DELETE"])
def api_delete_stock():
    data = request.get_json(force=True) or {}
    username_lower = (data.get("user") or "").strip().lower()
    ticker = (data.get("ticker") or "").strip().upper()
    broker = (data.get("broker") or "").strip()

    if not username_lower or not ticker or not broker:
        return jsonify({"error": "user, ticker, broker required"}), 400

    with Session(engine) as s:
        u = s.query(User).filter_by(username=username_lower).first()
        if not u:
            return jsonify({"error": "user not found"}), 404

        st = s.query(Stock).filter_by(user_id=u.id, ticker=ticker, broker=broker).first()
        if not st:
            return jsonify({"error": "stock not found"}), 404

        s.delete(st)
        s.commit()
        clear_cached_portfolio_history(username_lower)

        rows, total = compute_user_portfolio(s, username_lower)
        return jsonify({"message": "deleted", "user": u.username, "stocks": rows, "portfolio_total": total})

@stockboard.route("/api/stocks", methods=["GET"])
def api_list_all_stocks():
    with Session(engine) as s:
        all_rows = s.query(Stock).join(User).all()
        out = []
        for row in all_rows:
            try:
                p, prev_close = price_snapshot(row.ticker)
                out.append({**stock_row(row, p, prev_close), "user": row.user.username})
            except Exception:
                out.append({**stock_row(row, None, None), "user": row.user.username})
        out.sort(key=lambda r: r["total_value"] if r["total_value"] is not None else float("inf"))
        return jsonify({"stocks": out})

@stockboard.route("/api/quote/<ticker>", methods=["GET"])
def api_quote(ticker: str):
    t = (ticker or "").strip().upper()
    if not t:
        return jsonify({"error": "ticker required"}), 400
    try:
        p, prev_close = price_snapshot(t)
        return jsonify({
            "ticker": t,
            "price": round(float(p), 4),
            "previous_close": round(float(prev_close), 4) if prev_close is not None else None,
        })
    except Exception as e:
        return jsonify({"ticker": t, "price": None, "previous_close": None, "error": str(e)}), 502




@stockboard.route("/api/portfolio/history/guest", methods=["POST"])
def api_portfolio_history_guest():
    data = request.get_json(force=True) or {}
    payload = data.get("stocks")
    period = (data.get("period") or "1y").strip().lower()

    if period != "1y":
        return jsonify({"error": "only period=1y is currently supported"}), 400

    if not isinstance(payload, list):
        return jsonify({"error": "stocks must be an array"}), 400

    holdings: dict[str, float] = {}
    for item in payload:
        if not isinstance(item, dict):
            return jsonify({"error": "each stock must be an object"}), 400

        ticker = (item.get("ticker") or "").strip().upper()
        shares_raw = item.get("shares")

        try:
            shares = float(shares_raw)
        except (TypeError, ValueError):
            return jsonify({"error": "shares must be a number > 0"}), 400

        if not ticker:
            return jsonify({"error": "ticker is required"}), 400

        if shares <= 0:
            return jsonify({"error": "shares must be a number > 0"}), 400

        holdings[ticker] = holdings.get(ticker, 0.0) + shares

    if not holdings:
        return jsonify([])

    try:
        series = compute_portfolio_history(holdings, period)
        return jsonify(series)
    except Exception as e:
        return jsonify({"error": f"failed to compute portfolio history: {str(e)}"}), 502

@stockboard.route("/api/portfolio/history", methods=["GET"])
def api_portfolio_history():
    username_lower = (request.args.get("user") or "").strip().lower()
    period = (request.args.get("period") or "1y").strip().lower()

    if not username_lower:
        return jsonify({"error": "user is required"}), 400

    if period != "1y":
        return jsonify({"error": "only period=1y is currently supported"}), 400

    cached = get_cached_portfolio_history(username_lower, period)
    if cached is not None:
        return jsonify(cached)

    try:
        with Session(engine) as s:
            holdings = get_user_holdings(s, username_lower)
        if not holdings:
            set_cached_portfolio_history(username_lower, period, [])
            return jsonify([])

        series = compute_portfolio_history(holdings, period)
        set_cached_portfolio_history(username_lower, period, series)
        return jsonify(series)
    except Exception as e:
        return jsonify({"error": f"failed to compute portfolio history: {str(e)}"}), 502


@stockboard.route("/api/models/efficient-frontier", methods=["GET"])
def api_efficient_frontier():
    username_lower = (request.args.get("user") or "").strip().lower()
    user_id_raw = (request.args.get("userId") or "").strip()
    risk_free_rate_raw = request.args.get("rf")

    risk_free_rate = DEFAULT_RISK_FREE_RATE
    if risk_free_rate_raw is not None:
        try:
            risk_free_rate = float(risk_free_rate_raw)
        except (TypeError, ValueError):
            return jsonify({"error": "rf must be a numeric value"}), 400

    with Session(engine) as s:
        if user_id_raw:
            try:
                user_id = int(user_id_raw)
            except ValueError:
                return jsonify({"error": "userId must be an integer"}), 400
            user = s.query(User).filter_by(id=user_id).first()
            if not user:
                return jsonify({"error": "user not found"}), 404
            username_lower = user.username

        if not username_lower:
            return jsonify({"error": "user or userId is required"}), 400

        holdings = get_user_holdings(s, username_lower)

    try:
        payload = build_efficient_frontier_response(
            holdings=holdings,
            risk_free_rate=risk_free_rate,
        )
        return jsonify(payload)
    except Exception as e:
        return jsonify({"error": f"failed to compute efficient frontier: {str(e)}"}), 502
    
CORS(stockboard, resources={r"/api/*": {"origins": "*"}})

if __name__ == "__main__":
    stockboard.run(debug=True)
