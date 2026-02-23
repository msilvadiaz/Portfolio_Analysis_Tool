import { useEffect, useMemo, useState } from "react";
import { getPortfolioHistory } from "../api";
import type { PortfolioHistoryPoint } from "../types";

type Props = {
  currentUser: string;
};

const WIDTH = 900;
const HEIGHT = 320;
const PAD_X = 30;
const PAD_Y = 20;

export default function PortfolioHistoryChart({ currentUser }: Props) {
  const [series, setSeries] = useState<PortfolioHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSeries = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getPortfolioHistory(currentUser, "1y");
        if (!cancelled) {
          setSeries(result);
        }
      } catch (e) {
        if (!cancelled) {
          setSeries([]);
          setError(e instanceof Error ? e.message : "Failed to load chart");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSeries();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const chartData = useMemo(() => {
    if (!series.length)
      return {
        path: "",
        points: [] as Array<{
          x: number;
          y: number;
          date: string;
          value: number;
        }>,
      };

    const values = series.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const innerW = WIDTH - PAD_X * 2;
    const innerH = HEIGHT - PAD_Y * 2;

    const points = series.map((point, idx) => {
      const x = PAD_X + (idx / Math.max(series.length - 1, 1)) * innerW;
      const y = PAD_Y + innerH - ((point.value - min) / span) * innerH;
      return { x, y, date: point.date, value: point.value };
    });

    const path = points
      .map(
        (p, idx) =>
          `${idx === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`,
      )
      .join(" ");

    return { path, points };
  }, [series]);

  if (loading)
    return (
      <p className="text-secondary">Loading portfolio performance chart…</p>
    );
  if (error) return <p className="text-danger">{error}</p>;
  if (!series.length)
    return (
      <p className="text-secondary">
        No holdings found for portfolio analytics.
      </p>
    );

  return (
    <div>
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          border: "1px solid #1e1e1e",
          borderRadius: 8,
          padding: 6,
        }}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          height="320"
          role="img"
          aria-label="Portfolio performance last 1Y"
        >
          <line
            x1={PAD_X}
            y1={HEIGHT - PAD_Y}
            x2={WIDTH - PAD_X}
            y2={HEIGHT - PAD_Y}
            stroke="#4a4a4a"
          />
          <line
            x1={PAD_X}
            y1={PAD_Y}
            x2={PAD_X}
            y2={HEIGHT - PAD_Y}
            stroke="#4a4a4a"
          />
          <path
            d={chartData.path}
            fill="none"
            stroke="#4cc9f0"
            strokeWidth="2"
          />
          {chartData.points
            .filter(
              (_, idx) =>
                idx % Math.ceil(chartData.points.length / 8) === 0 ||
                idx === chartData.points.length - 1,
            )
            .map((p) => (
              <text
                key={p.date}
                x={p.x}
                y={HEIGHT - 4}
                textAnchor="middle"
                fill="#9aa0a6"
                fontSize="10"
              >
                {p.date.slice(5)}
              </text>
            ))}
          <text x={PAD_X + 6} y={PAD_Y + 12} fill="#9aa0a6" fontSize="10">
            ${Math.max(...series.map((p) => p.value)).toLocaleString()}
          </text>
          <text
            x={PAD_X + 6}
            y={HEIGHT - PAD_Y - 6}
            fill="#9aa0a6"
            fontSize="10"
          >
            ${Math.min(...series.map((p) => p.value)).toLocaleString()}
          </text>
        </svg>
      </div>
      <p className="text-secondary mt-2 mb-0" style={{ fontSize: 12 }}>
        Daily points are computed as Σ(shares × adjusted close) using your
        current holdings over the past year.
      </p>
    </div>
  );
}
