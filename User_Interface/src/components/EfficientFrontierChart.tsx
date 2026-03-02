import { useEffect, useMemo, useState } from "react";
import { getEfficientFrontier } from "../api";
import type { EfficientFrontierResponse } from "../types";

type Props = {
  currentUser: string;
  refreshVersion: number;
};

function pct(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export default function EfficientFrontierChart({ currentUser, refreshVersion }: Props) {
  const [data, setData] = useState<EfficientFrontierResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const payload = await getEfficientFrontier(currentUser);
        if (!cancelled) setData(payload);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load efficient frontier data";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [currentUser, refreshVersion]);

  const chart = useMemo(() => {
    if (!data || !data.frontier.length) return null;

    const width = 960;
    const height = 360;
    const margin = { top: 20, right: 22, bottom: 52, left: 78 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const volVals = data.frontier.map((p) => p.volatility).concat(data.portfolio.volatility);
    const retVals = data.frontier.map((p) => p.expectedReturn).concat(data.portfolio.expectedReturn);

    const minVol = Math.min(...volVals);
    const maxVol = Math.max(...volVals);
    const minRet = Math.min(...retVals);
    const maxRet = Math.max(...retVals);

    const volPad = (maxVol - minVol || 0.02) * 0.1;
    const retPad = (maxRet - minRet || 0.02) * 0.1;

    const xMin = Math.max(0, minVol - volPad);
    const xMax = maxVol + volPad;
    const yMin = minRet - retPad;
    const yMax = maxRet + retPad;

    const xSpan = xMax - xMin || 1;
    const ySpan = yMax - yMin || 1;

    const toX = (volatility: number) => margin.left + ((volatility - xMin) / xSpan) * innerWidth;
    const toY = (expectedReturn: number) => margin.top + (1 - (expectedReturn - yMin) / ySpan) * innerHeight;

    const xTicks = 5;
    const yTicks = 5;

    const frontierDots = data.frontier.map((point, idx) => ({
      key: `f-${idx}`,
      cx: toX(point.volatility),
      cy: toY(point.expectedReturn),
      point,
    }));

    const portfolioDot = {
      cx: toX(data.portfolio.volatility),
      cy: toY(data.portfolio.expectedReturn),
    };

    const maxSharpeDot = data.maxSharpe
      ? {
          cx: toX(data.maxSharpe.volatility),
          cy: toY(data.maxSharpe.expectedReturn),
          point: data.maxSharpe,
        }
      : null;

    const minVolDot = data.minVolatility
      ? {
          cx: toX(data.minVolatility.volatility),
          cy: toY(data.minVolatility.expectedReturn),
          point: data.minVolatility,
        }
      : null;

    return {
      width,
      height,
      margin,
      xMin,
      xMax,
      yMin,
      yMax,
      xTicks,
      yTicks,
      toX,
      toY,
      frontierDots,
      portfolioDot,
      maxSharpeDot,
      minVolDot,
    };
  }, [data]);

  if (loading) return <p className="text-secondary">Loading efficient frontier…</p>;
  if (error) return <p className="text-danger mb-0">{error}</p>;
  if (!data) return null;

  const warnings = data.meta.warnings ?? [];

  return (
    <div className="mt-4">
      <h2 className="h4 mb-2">Efficient Frontier</h2>
      <div className="small text-secondary mb-2">
        Current portfolio: return {pct(data.portfolio.expectedReturn)} • volatility {pct(data.portfolio.volatility)} • Sharpe {data.portfolio.sharpe.toFixed(2)}
      </div>

      {!chart ? (
        <p className="text-secondary mb-0">Not enough valid holdings to generate frontier points.</p>
      ) : (
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} width="100%" role="img" aria-label="Efficient frontier chart">
          <rect x="0" y="0" width={chart.width} height={chart.height} fill="#0f0f0f" rx="8" />

          {Array.from({ length: chart.xTicks }, (_, i) => {
            const value = chart.xMin + (i / (chart.xTicks - 1)) * (chart.xMax - chart.xMin);
            const x = chart.toX(value);
            return (
              <g key={`x-${value}`}>
                <line x1={x} x2={x} y1={chart.margin.top} y2={chart.height - chart.margin.bottom} stroke="#252525" strokeWidth="1" />
                <text x={x} y={chart.height - chart.margin.bottom + 18} textAnchor="middle" fontSize="11" fill="#a6a6a6">
                  {pct(value)}
                </text>
              </g>
            );
          })}

          {Array.from({ length: chart.yTicks }, (_, i) => {
            const value = chart.yMax - (i / (chart.yTicks - 1)) * (chart.yMax - chart.yMin);
            const y = chart.toY(value);
            return (
              <g key={`y-${value}`}>
                <line x1={chart.margin.left} x2={chart.width - chart.margin.right} y1={y} y2={y} stroke="#252525" strokeWidth="1" />
                <text x={chart.margin.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#a6a6a6">
                  {pct(value)}
                </text>
              </g>
            );
          })}

          {chart.frontierDots.map((dot) => (
            <circle key={dot.key} cx={dot.cx} cy={dot.cy} r="2" fill="#4da3ff" opacity="0.6">
              <title>{`Frontier: Vol ${pct(dot.point.volatility)} | Return ${pct(dot.point.expectedReturn)} | Sharpe ${dot.point.sharpe.toFixed(2)}`}</title>
            </circle>
          ))}

          <circle cx={chart.portfolioDot.cx} cy={chart.portfolioDot.cy} r="5.5" fill="#ff4d4f">
            <title>{`Current Portfolio: Vol ${pct(data.portfolio.volatility)} | Return ${pct(data.portfolio.expectedReturn)} | Sharpe ${data.portfolio.sharpe.toFixed(2)}`}</title>
          </circle>

          {chart.maxSharpeDot ? (
            <circle cx={chart.maxSharpeDot.cx} cy={chart.maxSharpeDot.cy} r="4" fill="#f5c542">
              <title>{`Max Sharpe: Vol ${pct(chart.maxSharpeDot.point.volatility)} | Return ${pct(chart.maxSharpeDot.point.expectedReturn)} | Sharpe ${chart.maxSharpeDot.point.sharpe.toFixed(2)}`}</title>
            </circle>
          ) : null}

          {chart.minVolDot ? (
            <circle cx={chart.minVolDot.cx} cy={chart.minVolDot.cy} r="4" fill="#6ea8fe">
              <title>{`Min Volatility: Vol ${pct(chart.minVolDot.point.volatility)} | Return ${pct(chart.minVolDot.point.expectedReturn)} | Sharpe ${chart.minVolDot.point.sharpe.toFixed(2)}`}</title>
            </circle>
          ) : null}

          <text x={chart.width / 2} y={chart.height - 10} textAnchor="middle" fontSize="12" fill="#cfcfcf">
            Volatility (Annualized)
          </text>
          <text x="18" y={chart.height / 2} textAnchor="middle" fontSize="12" fill="#cfcfcf" transform={`rotate(-90 18 ${chart.height / 2})`}>
            Expected Return (Annualized)
          </text>
        </svg>
      )}

      <div className="small mt-2" style={{ color: "#a6a6a6" }}>
        <span className="me-3"><span style={{ color: "#4da3ff" }}>●</span> Frontier</span>
        <span className="me-3"><span style={{ color: "#ff4d4f" }}>●</span> Current Portfolio</span>
        {data.maxSharpe ? <span className="me-3"><span style={{ color: "#f5c542" }}>●</span> Max Sharpe</span> : null}
        {data.minVolatility ? <span><span style={{ color: "#6ea8fe" }}>●</span> Min Volatility</span> : null}
      </div>

      {warnings.length > 0 ? (
        <ul className="small text-warning mt-2 mb-0">
          {warnings.map((warning, idx) => (
            <li key={`${warning}-${idx}`}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
