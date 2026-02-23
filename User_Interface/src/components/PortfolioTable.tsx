import { useEffect, useState } from "react";
import type { StockRow } from "../types";

type Props = {
  rows: StockRow[];
  portfolioTotal: number | null;
  onDelete: (ticker: string, broker: string) => Promise<void> | void;
  disabled?: boolean;
};

export default function PortfolioTable({
  rows,
  portfolioTotal,
  onDelete,
  disabled,
}: Props) {
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    const latestPrices: Record<string, number> = {};
    for (const row of rows) {
      if (typeof row.price === "number") {
        latestPrices[`${row.ticker}__${row.broker}`] = row.price;
      }
    }
    setPreviousPrices(latestPrices);
  }, [rows]);

  function getPriceDirection(row: StockRow): "up" | "down" | "flat" {
    if (typeof row.price !== "number") return "flat";
    const previous = previousPrices[`${row.ticker}__${row.broker}`];
    if (previous == null || row.price === previous) return "flat";
    return row.price > previous ? "up" : "down";
  }

  function valueColor(direction: "up" | "down" | "flat"): string | undefined {
    if (direction === "up") return "#2de26d";
    if (direction === "down") return "#ff6b7d";
    return undefined;
  }

  return (
    <div className="table-responsive">
      <table className="table table-dark table-bordered align-middle">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Broker</th>
            <th>Shares</th>
            <th>Price of stock $USD</th>
            <th>Total $USD</th>
            <th style={{ width: 120 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-secondary">
                No stocks yet.
              </td>
            </tr>
          ) : (
            rows.map((s) => {
              const direction = getPriceDirection(s);
              const color = valueColor(direction);
              const directionSymbol =
                direction === "up" ? "▲ " : direction === "down" ? "▼ " : "";

              return (
                <tr key={`${s.ticker}__${s.broker}`}>
                  <td>{s.ticker}</td>
                  <td>{s.broker}</td>
                  <td>{s.shares}</td>
                  <td style={{ color }}>
                    {typeof s.price === "number"
                      ? `${directionSymbol}$${s.price.toFixed(4)}`
                      : "-"}
                  </td>
                  <td style={{ color }}>
                    {typeof s.total_value === "number"
                      ? `${directionSymbol}$${s.total_value.toFixed(2)}`
                      : "-"}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm"
                      style={{
                        backgroundColor: "#bfbfbf",
                        borderColor: "#bfbfbf",
                        color: "#111",
                      }}
                      onClick={() => onDelete(s.ticker, s.broker)}
                      disabled={disabled}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="text-end fw-bold">
              Total invested money:
            </td>
            <td className="fw-bold">{portfolioTotal ?? "—"}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
