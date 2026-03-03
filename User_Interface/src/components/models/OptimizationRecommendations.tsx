import { useEffect, useMemo, useState } from "react";
import { getGuestPortfolioOptimization, getPortfolioOptimization } from "../../api";
import type {
  GuestStock,
  OptimizationObjective,
  PortfolioOptimizationResponse,
  RiskPreset,
} from "../../types";

type Props =
  | {
      currentUser: string;
      guestStocks?: never;
      refreshVersion: number;
      onLoadingChange?: (loading: boolean) => void;
    }
  | {
      currentUser?: never;
      guestStocks: GuestStock[];
      refreshVersion: number;
      onLoadingChange?: (loading: boolean) => void;
    };

function pct(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export default function OptimizationRecommendations(props: Props) {
  const [objective, setObjective] = useState<OptimizationObjective>("max_sharpe");
  const [targetReturn, setTargetReturn] = useState(0.15);
  const [preset, setPreset] = useState<RiskPreset>("balanced");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxWeight, setMaxWeight] = useState(0.4);

  const [data, setData] = useState<PortfolioOptimizationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    props.onLoadingChange?.(loading);

    return () => {
      props.onLoadingChange?.(false);
    };
  }, [loading, props.onLoadingChange]);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = props.currentUser
          ? await getPortfolioOptimization({
              user: props.currentUser,
              objective,
              targetReturn: objective === "target_return" ? targetReturn : undefined,
              preset: objective === "risk_preset" ? preset : undefined,
              maxWeight,
            })
          : await getGuestPortfolioOptimization({
              stocks: props.guestStocks ?? [],
              objective,
              targetReturn: objective === "target_return" ? targetReturn : undefined,
              preset: objective === "risk_preset" ? preset : undefined,
              maxWeight,
            });
        if (!cancelled) setData(payload);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load optimization recommendations";
          setError(message);
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [props.currentUser, props.guestStocks, maxWeight, objective, preset, props.refreshVersion, targetReturn]);

  const sortedWeights = useMemo(() => {
    if (!data) return [];
    return [...data.recommended.weights].sort((a, b) => b.weight - a.weight);
  }, [data]);

  return (
    <div className="mt-4 rounded componentSurface p-3">
      <h2 className="h4 mb-3">Optimization Recommendations</h2>

      <div className="row g-3 align-items-end mb-3">
        <div className="col-md-4">
          <label className="form-label small text-secondary mb-1">Optimization Goal</label>
          <select className="form-select form-select-sm bg-dark text-light border-secondary" value={objective} onChange={(e) => setObjective(e.target.value as OptimizationObjective)}>
            <option value="max_sharpe">Max Sharpe</option>
            <option value="min_vol">Min Volatility</option>
            <option value="target_return">Target Return</option>
            <option value="risk_preset">Risk Preset</option>
          </select>
        </div>

        {objective === "target_return" ? (
          <div className="col-md-4">
            <label className="form-label small text-secondary mb-1">Target Return ({pct(targetReturn, 0)})</label>
            <input
              type="range"
              className="form-range"
              min={0}
              max={0.6}
              step={0.01}
              value={targetReturn}
              onChange={(e) => setTargetReturn(Number(e.target.value))}
            />
          </div>
        ) : null}

        {objective === "risk_preset" ? (
          <div className="col-md-4">
            <label className="form-label small text-secondary mb-1">Risk Preset</label>
            <select className="form-select form-select-sm bg-dark text-light border-secondary" value={preset} onChange={(e) => setPreset(e.target.value as RiskPreset)}>
              <option value="conservative">Conservative</option>
              <option value="balanced">Balanced</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
        ) : null}

        <div className="col-md-4">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowAdvanced((v) => !v)}>
            {showAdvanced ? "Hide" : "Show"} Constraints
          </button>
        </div>
      </div>

      {showAdvanced ? (
        <div className="mb-3">
          <label className="form-label small text-secondary mb-1">Max Weight per Asset ({pct(maxWeight, 0)})</label>
          <input
            type="range"
            className="form-range"
            min={0.1}
            max={0.6}
            step={0.01}
            value={maxWeight}
            onChange={(e) => setMaxWeight(Number(e.target.value))}
          />
        </div>
      ) : null}

      {loading ? <p className="text-secondary mb-0">Computing optimization…</p> : null}
      {error ? <p className="text-danger mb-0">{error}</p> : null}

      {!loading && !error && data ? (
        <>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <div className="p-2 border border-secondary rounded">
                <div className="small text-secondary mb-1">Current Portfolio</div>
                <div className="small">Return {pct(data.current.expectedReturn)} • Vol {pct(data.current.volatility)} • Sharpe {data.current.sharpe.toFixed(2)}</div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-2 border border-secondary rounded">
                <div className="small text-secondary mb-1">Recommended Portfolio</div>
                <div className="small">Return {pct(data.recommended.expectedReturn)} • Vol {pct(data.recommended.volatility)} • Sharpe {data.recommended.sharpe.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="table-responsive mb-3">
            <div className="small text-secondary mb-2">Recommended Allocation</div>
            <table className="table table-dark table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th className="text-end">Weight</th>
                </tr>
              </thead>
              <tbody>
                {sortedWeights.map((row) => (
                  <tr key={`w-${row.ticker}`}>
                    <td>{row.ticker}</td>
                    <td className="text-end">{pct(row.weight, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-responsive">
            <div className="small text-secondary mb-2">Rebalancing Guidance</div>
            <table className="table table-dark table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th className="text-end">Current</th>
                  <th className="text-end">Recommended</th>
                  <th className="text-end">Delta</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.rebalance.map((row) => (
                  <tr key={`r-${row.ticker}`}>
                    <td>{row.ticker}</td>
                    <td className="text-end">{pct(row.current, 1)}</td>
                    <td className="text-end">{pct(row.recommended, 1)}</td>
                    <td className={`text-end ${row.delta > 0 ? "text-success" : row.delta < 0 ? "text-danger" : "text-secondary"}`}>
                      {row.delta > 0 ? "+" : ""}
                      {pct(row.delta, 1)}
                    </td>
                    <td>{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.warnings?.length ? (
            <ul className="small text-warning mt-3 mb-0">
              {data.warnings.map((warning, idx) => (
                <li key={`${warning}-${idx}`}>{warning}</li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
