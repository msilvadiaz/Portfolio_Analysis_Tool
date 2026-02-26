from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
import yfinance as yf

TRADING_DAYS = 252
DEFAULT_RISK_FREE_RATE = 0.02
DEFAULT_N_SIM = 20000


@dataclass
class FrontierPoint:
    volatility: float
    expected_return: float
    sharpe: float

    def to_dict(self) -> dict[str, float]:
        return {
            "volatility": float(self.volatility),
            "expectedReturn": float(self.expected_return),
            "sharpe": float(self.sharpe),
        }


def _download_adjusted_close_series(ticker: str, period: str = "1y") -> pd.Series:
    history = yf.Ticker(ticker).history(period=period, interval="1d", auto_adjust=True)
    if history is None or history.empty or "Close" not in history.columns:
        raise ValueError(f"No adjusted close history found for {ticker}")

    close_series = history["Close"].dropna()
    if close_series.empty:
        raise ValueError(f"No close prices found for {ticker}")

    close_series.name = ticker
    return close_series


def _portfolio_metrics(weights: np.ndarray, mu: np.ndarray, sigma: np.ndarray, risk_free_rate: float) -> FrontierPoint:
    expected_return = float(weights @ mu)
    variance = float(weights @ sigma @ weights)
    volatility = float(np.sqrt(max(variance, 0.0)))
    sharpe = float((expected_return - risk_free_rate) / volatility) if volatility > 0 else 0.0
    return FrontierPoint(volatility=volatility, expected_return=expected_return, sharpe=sharpe)


def build_efficient_frontier_response(
    holdings: dict[str, float],
    risk_free_rate: float = DEFAULT_RISK_FREE_RATE,
    n_sim: int = DEFAULT_N_SIM,
    period: str = "1y",
) -> dict[str, Any]:
    tickers = sorted([ticker for ticker, shares in holdings.items() if shares > 0])
    warnings: list[str] = []

    if not tickers:
        return {
            "tickers": [],
            "portfolio": {
                "expectedReturn": 0.0,
                "volatility": 0.0,
                "variance": 0.0,
                "sharpe": 0.0,
                "weights": [],
            },
            "frontier": [],
            "meta": {
                "riskFreeRate": float(risk_free_rate),
                "tradingDays": TRADING_DAYS,
                "nSim": int(n_sim),
                "warnings": ["No holdings were found for this user."],
            },
        }

    valid_series: list[pd.Series] = []
    valid_tickers: list[str] = []
    for ticker in tickers:
        try:
            valid_series.append(_download_adjusted_close_series(ticker=ticker, period=period))
            valid_tickers.append(ticker)
        except Exception as exc:
            warnings.append(f"Excluded {ticker}: {exc}")

    if not valid_tickers:
        return {
            "tickers": [],
            "portfolio": {
                "expectedReturn": 0.0,
                "volatility": 0.0,
                "variance": 0.0,
                "sharpe": 0.0,
                "weights": [],
            },
            "frontier": [],
            "meta": {
                "riskFreeRate": float(risk_free_rate),
                "tradingDays": TRADING_DAYS,
                "nSim": int(n_sim),
                "warnings": warnings or ["No valid ticker history could be downloaded."],
            },
        }

    close_df = pd.concat(valid_series, axis=1).dropna(how="all").ffill().dropna()
    log_returns = np.log(close_df / close_df.shift(1)).dropna()

    latest_prices = close_df.iloc[-1]
    market_values = np.array([holdings[ticker] * float(latest_prices[ticker]) for ticker in valid_tickers], dtype=np.float64)
    total_value = float(np.sum(market_values))

    if total_value <= 0:
        raise ValueError("Portfolio market value is zero; unable to compute weights.")

    weights = market_values / total_value
    mu = log_returns.mean().to_numpy(dtype=np.float64) * TRADING_DAYS
    sigma = log_returns.cov().to_numpy(dtype=np.float64) * TRADING_DAYS

    portfolio_point = _portfolio_metrics(weights=weights, mu=mu, sigma=sigma, risk_free_rate=risk_free_rate)
    portfolio_variance = float(weights @ sigma @ weights)

    frontier: list[dict[str, float]] = []
    max_sharpe_point: dict[str, float] | None = None
    min_volatility_point: dict[str, float] | None = None

    if len(valid_tickers) >= 2 and len(log_returns) >= 2:
        random_weights = np.random.random((n_sim, len(valid_tickers)))
        random_weights /= random_weights.sum(axis=1)[:, np.newaxis]

        expected_returns = random_weights @ mu
        variances = np.einsum("ij,jk,ik->i", random_weights, sigma, random_weights)
        volatilities = np.sqrt(np.maximum(variances, 0.0))
        sharpes = np.divide(
            expected_returns - risk_free_rate,
            volatilities,
            out=np.zeros_like(expected_returns),
            where=volatilities > 0,
        )

        frontier = [
            {
                "volatility": float(vol),
                "expectedReturn": float(ret),
                "sharpe": float(sr),
            }
            for vol, ret, sr in zip(volatilities, expected_returns, sharpes)
        ]

        max_sharpe_idx = int(np.argmax(sharpes))
        min_vol_idx = int(np.argmin(volatilities))
        max_sharpe_point = frontier[max_sharpe_idx]
        min_volatility_point = frontier[min_vol_idx]
    else:
        warnings.append("At least two valid tickers with sufficient history are required to generate frontier points.")

    response: dict[str, Any] = {
        "tickers": valid_tickers,
        "portfolio": {
            "expectedReturn": float(portfolio_point.expected_return),
            "volatility": float(portfolio_point.volatility),
            "variance": float(portfolio_variance),
            "sharpe": float(portfolio_point.sharpe),
            "weights": [
                {"ticker": ticker, "weight": float(weight)}
                for ticker, weight in zip(valid_tickers, weights)
            ],
        },
        "frontier": frontier,
        "meta": {
            "riskFreeRate": float(risk_free_rate),
            "tradingDays": TRADING_DAYS,
            "nSim": int(n_sim),
            "warnings": warnings,
        },
    }

    if max_sharpe_point is not None:
        response["maxSharpe"] = max_sharpe_point
    if min_volatility_point is not None:
        response["minVolatility"] = min_volatility_point

    return response
