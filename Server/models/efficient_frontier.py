from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
import yfinance as yf

TRADING_DAYS = 252
DEFAULT_RISK_FREE_RATE = 0.02
DEFAULT_N_SIM = 20000
DEFAULT_MIN_WEIGHT = 0.00
DEFAULT_MAX_WEIGHT = 0.40
MAX_SAMPLING_RETRIES = 25

RISK_PRESET_BANDS: dict[str, tuple[float, float]] = {
    "conservative": (0.12, 0.18),
    "balanced": (0.18, 0.25),
    "aggressive": (0.25, 0.35),
}


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


def _prepare_portfolio_inputs(
    holdings: dict[str, float],
    period: str,
) -> dict[str, Any]:
    tickers = sorted([ticker for ticker, shares in holdings.items() if shares > 0])
    warnings: list[str] = []

    if not tickers:
        return {
            "tickers": [],
            "warnings": ["No holdings were found for this user."],
            "close_df": pd.DataFrame(),
            "log_returns": pd.DataFrame(),
            "weights": np.array([], dtype=np.float64),
            "mu": np.array([], dtype=np.float64),
            "sigma": np.array([[]], dtype=np.float64),
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
            "warnings": warnings or ["No valid ticker history could be downloaded."],
            "close_df": pd.DataFrame(),
            "log_returns": pd.DataFrame(),
            "weights": np.array([], dtype=np.float64),
            "mu": np.array([], dtype=np.float64),
            "sigma": np.array([[]], dtype=np.float64),
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

    return {
        "tickers": valid_tickers,
        "warnings": warnings,
        "close_df": close_df,
        "log_returns": log_returns,
        "weights": weights,
        "mu": mu,
        "sigma": sigma,
    }


def _sample_constrained_weights(n_assets: int, n_sim: int, min_weight: float, max_weight: float) -> np.ndarray:
    if n_assets <= 0:
        return np.empty((0, 0), dtype=np.float64)

    if min_weight * n_assets > 1.0:
        raise ValueError("constraints infeasible: minWeight is too high for the number of assets")
    if max_weight * n_assets < 1.0:
        raise ValueError("constraints infeasible: maxWeight is too low for the number of assets")

    accepted: list[np.ndarray] = []
    remaining = n_sim

    for _ in range(MAX_SAMPLING_RETRIES):
        if remaining <= 0:
            break
        candidate_count = max(remaining * 5, 1000)
        candidates = np.random.random((candidate_count, n_assets))
        candidates /= candidates.sum(axis=1)[:, np.newaxis]

        mask = (candidates >= min_weight).all(axis=1) & (candidates <= max_weight).all(axis=1)
        feasible = candidates[mask]
        if feasible.size == 0:
            continue

        take = min(remaining, feasible.shape[0])
        accepted.append(feasible[:take])
        remaining -= take

    if remaining > 0:
        raise ValueError("unable to sample sufficient constrained portfolios; relax minWeight/maxWeight constraints")

    return np.vstack(accepted)


def build_efficient_frontier_response(
    holdings: dict[str, float],
    risk_free_rate: float = DEFAULT_RISK_FREE_RATE,
    n_sim: int = DEFAULT_N_SIM,
    period: str = "1y",
) -> dict[str, Any]:
    prepared = _prepare_portfolio_inputs(holdings=holdings, period=period)
    tickers = prepared["tickers"]
    warnings = prepared["warnings"]

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

    valid_tickers = tickers
    log_returns = prepared["log_returns"]
    weights = prepared["weights"]
    mu = prepared["mu"]
    sigma = prepared["sigma"]

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


def build_portfolio_optimization_response(
    holdings: dict[str, float],
    objective: str,
    risk_free_rate: float = DEFAULT_RISK_FREE_RATE,
    n_sim: int = DEFAULT_N_SIM,
    target_return: float | None = None,
    preset: str | None = None,
    min_weight: float = DEFAULT_MIN_WEIGHT,
    max_weight: float = DEFAULT_MAX_WEIGHT,
    period: str = "1y",
) -> dict[str, Any]:
    prepared = _prepare_portfolio_inputs(holdings=holdings, period=period)
    tickers = prepared["tickers"]
    warnings = prepared["warnings"]

    safe_response: dict[str, Any] = {
        "tickers": tickers,
        "objective": objective,
        "inputs": {
            "riskFreeRate": float(risk_free_rate),
            "targetReturn": float(target_return) if target_return is not None else None,
            "preset": preset,
            "nSim": int(n_sim),
            "constraints": {
                "minWeight": float(min_weight),
                "maxWeight": float(max_weight),
            },
        },
        "current": {
            "expectedReturn": 0.0,
            "volatility": 0.0,
            "sharpe": 0.0,
            "weights": [],
        },
        "recommended": {
            "expectedReturn": 0.0,
            "volatility": 0.0,
            "sharpe": 0.0,
            "weights": [],
        },
        "rebalance": [],
        "warnings": warnings,
    }

    if len(tickers) < 2:
        safe_response["error"] = "At least two valid tickers are required to optimize a portfolio."
        return safe_response

    log_returns = prepared["log_returns"]
    if len(log_returns) < 2:
        safe_response["error"] = "Insufficient historical data to optimize portfolio."
        return safe_response

    current_weights = prepared["weights"]
    mu = prepared["mu"]
    sigma = prepared["sigma"]

    current_metrics = _portfolio_metrics(weights=current_weights, mu=mu, sigma=sigma, risk_free_rate=risk_free_rate)
    safe_response["current"] = {
        "expectedReturn": float(current_metrics.expected_return),
        "volatility": float(current_metrics.volatility),
        "sharpe": float(current_metrics.sharpe),
        "weights": [
            {"ticker": ticker, "weight": float(weight)}
            for ticker, weight in zip(tickers, current_weights)
        ],
    }

    sample_weights = _sample_constrained_weights(
        n_assets=len(tickers),
        n_sim=n_sim,
        min_weight=min_weight,
        max_weight=max_weight,
    )

    expected_returns = sample_weights @ mu
    variances = np.einsum("ij,jk,ik->i", sample_weights, sigma, sample_weights)
    volatilities = np.sqrt(np.maximum(variances, 0.0))
    sharpes = np.divide(
        expected_returns - risk_free_rate,
        volatilities,
        out=np.zeros_like(expected_returns),
        where=volatilities > 0,
    )

    selected_idx: int | None = None
    if objective == "max_sharpe":
        selected_idx = int(np.argmax(sharpes))
    elif objective == "min_vol":
        selected_idx = int(np.argmin(volatilities))
    elif objective == "target_return":
        if target_return is None:
            raise ValueError("targetReturn is required for objective=target_return")
        eligible = np.where(expected_returns >= target_return)[0]
        if eligible.size:
            selected_idx = int(eligible[np.argmin(volatilities[eligible])])
        else:
            closest_idx = int(np.argmin(np.abs(expected_returns - target_return)))
            selected_idx = closest_idx
            warnings.append("Target return was not reachable; selected closest-return portfolio.")
    elif objective == "risk_preset":
        if preset not in RISK_PRESET_BANDS:
            raise ValueError("preset must be conservative, balanced, or aggressive for objective=risk_preset")

        low, high = RISK_PRESET_BANDS[preset]
        in_band = np.where((volatilities >= low) & (volatilities <= high))[0]

        if preset == "conservative":
            sharpe_cutoff = np.quantile(sharpes, 0.7)
            top_sharpe = np.where(sharpes >= sharpe_cutoff)[0]
            if top_sharpe.size:
                selected_idx = int(top_sharpe[np.argmin(volatilities[top_sharpe])])
            else:
                mid = (low + high) / 2
                selected_idx = int(np.argmin(np.abs(volatilities - mid)))
        else:
            if in_band.size:
                selected_idx = int(in_band[np.argmax(sharpes[in_band])])
            else:
                mid = (low + high) / 2
                selected_idx = int(np.argmin(np.abs(volatilities - mid)))
                warnings.append(f"No simulated portfolios found in the {preset} risk band; selected closest volatility profile.")
    else:
        raise ValueError("objective must be one of max_sharpe, min_vol, target_return, risk_preset")

    if selected_idx is None:
        raise ValueError("Unable to select optimized portfolio for the provided objective")

    recommended_weights = sample_weights[selected_idx]
    recommended_metrics = _portfolio_metrics(
        weights=recommended_weights,
        mu=mu,
        sigma=sigma,
        risk_free_rate=risk_free_rate,
    )

    recommended_weight_rows = [
        {"ticker": ticker, "weight": float(weight)}
        for ticker, weight in zip(tickers, recommended_weights)
    ]

    rebalance_rows = []
    for ticker, current, recommended in zip(tickers, current_weights, recommended_weights):
        delta = float(recommended - current)
        action = "Hold"
        if delta > 0.0001:
            action = "Increase"
        elif delta < -0.0001:
            action = "Reduce"

        rebalance_rows.append(
            {
                "ticker": ticker,
                "current": float(current),
                "recommended": float(recommended),
                "delta": delta,
                "action": action,
            }
        )

    safe_response["recommended"] = {
        "expectedReturn": float(recommended_metrics.expected_return),
        "volatility": float(recommended_metrics.volatility),
        "sharpe": float(recommended_metrics.sharpe),
        "weights": recommended_weight_rows,
    }
    safe_response["rebalance"] = rebalance_rows
    safe_response["warnings"] = warnings
    return safe_response
