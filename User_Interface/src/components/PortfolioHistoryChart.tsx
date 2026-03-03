import { useEffect, useMemo, useState } from "react";
import { getGuestPortfolioHistory, getPortfolioHistory } from "../api";
import type { GuestStock, PortfolioHistoryPoint } from "../types";

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

function currencyFormatter(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function PortfolioHistoryChart(props: Props) {
  const [points, setPoints] = useState<PortfolioHistoryPoint[]>([]);
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

    async function load() {
      setLoading(true);
      setError(null);
      try {
        let data: PortfolioHistoryPoint[];
        if (typeof props.currentUser === "string") {
          data = await getPortfolioHistory(props.currentUser, "1y");
        } else {
          data = await getGuestPortfolioHistory(props.guestStocks ?? [], "1y");
        }
        if (!cancelled) setPoints(data);
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load chart data";
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
  }, [props.currentUser, props.guestStocks, props.refreshVersion]);

  const chart = useMemo(() => {
    if (!points.length) return null;

    const width = 960;
    const height = 320;
    const margin = { top: 12, right: 16, bottom: 28, left: 72 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const ySpan = max - min || 1;

    const toX = (index: number) =>
      margin.left + (index / Math.max(points.length - 1, 1)) * innerWidth;
    const toY = (value: number) =>
      margin.top + (1 - (value - min) / ySpan) * innerHeight;

    const pathData = points
      .map(
        (p, idx) =>
          `${idx === 0 ? "M" : "L"} ${toX(idx).toFixed(2)} ${toY(p.value).toFixed(2)}`,
      )
      .join(" ");

    const ticks = 5;
    const yTicks = Array.from({ length: ticks }, (_, i) => {
      const ratio = i / (ticks - 1);
      const value = max - ratio * ySpan;
      return { y: margin.top + ratio * innerHeight, value };
    });

    const startDate = points[0].date;
    const midDate = points[Math.floor(points.length / 2)].date;
    const endDate = points[points.length - 1].date;

    return {
      width,
      height,
      margin,
      pathData,
      yTicks,
      startDate,
      midDate,
      endDate,
    };
  }, [points]);

  const subtitle =
    typeof props.currentUser === "string"
      ? "Portfolio value over last 1Y (using current holdings)."
      : "Portfolio value over last 1Y (using current guest holdings).";

  const latest = points.length > 0 ? points[points.length - 1] : null;

  return (
    <div className="mt-4">
      <h2 className="h4 mb-2">Historical Data</h2>
      <div className="text-secondary mb-3">{subtitle}</div>

      {loading ? <p className="text-secondary mb-0">Loading portfolio history…</p> : null}
      {error ? <p className="text-danger mb-0">{error}</p> : null}
      {!loading && !error && !points.length ? (
        <p className="text-secondary mb-0">No holdings found to plot over the last year.</p>
      ) : null}

      {!loading && !error && chart && latest ? (
        <>
          <div className="mb-2 text-secondary small">
            Latest: {latest.date} • {currencyFormatter(latest.value)}
          </div>
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            width="100%"
            role="img"
            aria-label="Portfolio performance over 1 year"
          >
            <rect
              x="0"
              y="0"
              width={chart.width}
              height={chart.height}
              fill="#0f0f0f"
              rx="8"
            />
            {chart.yTicks.map((tick) => (
              <g key={tick.y}>
                <line
                  x1={chart.margin.left}
                  x2={chart.width - chart.margin.right}
                  y1={tick.y}
                  y2={tick.y}
                  stroke="#2c2c2c"
                  strokeWidth="1"
                />
                <text
                  x={chart.margin.left - 8}
                  y={tick.y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#a6a6a6"
                >
                  {currencyFormatter(tick.value)}
                </text>
              </g>
            ))}
            <path d={chart.pathData} fill="none" stroke="#4da3ff" strokeWidth="2.5" />

            <text
              x={chart.margin.left}
              y={chart.height - 8}
              textAnchor="start"
              fontSize="11"
              fill="#a6a6a6"
            >
              {chart.startDate}
            </text>
            <text
              x={chart.width / 2}
              y={chart.height - 8}
              textAnchor="middle"
              fontSize="11"
              fill="#a6a6a6"
            >
              {chart.midDate}
            </text>
            <text
              x={chart.width - chart.margin.right}
              y={chart.height - 8}
              textAnchor="end"
              fontSize="11"
              fill="#a6a6a6"
            >
              {chart.endDate}
            </text>
          </svg>
          <div className="small text-secondary mt-2 mb-0">
            Hover-free sparkline view of daily portfolio value points for the last year.
          </div>
        </>
      ) : null}

      {!loading && !error && !chart && points.length > 0 ? (
        <p className="text-secondary mb-0">No holdings found to plot over the last year.</p>
      ) : null}
    </div>
  );
}
