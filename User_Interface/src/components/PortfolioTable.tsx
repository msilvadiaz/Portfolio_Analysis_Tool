import BrokerIcon from "./BrokerIcon";
import { BROKER_ICONS } from "../data/brokerIcons";
import type { StockRow } from "../types";
import type { SupportedCurrency } from "../utils/currency";
import { formatCurrency } from "../utils/currency";

type Props = {
  rows: StockRow[];
  portfolioTotal: number | null;
  currency: SupportedCurrency;
  onDelete: (ticker: string, broker: string) => Promise<void> | void;
  disabled?: boolean;
};

type Direction = "up" | "down" | "flat";

function getDirection(row: StockRow): Direction {
  if (typeof row.price !== "number" || typeof row.previous_close !== "number") {
    return "flat";
  }

  if (row.price > row.previous_close) return "up";
  if (row.price < row.previous_close) return "down";
  return "flat";
}

function directionColor(direction: Direction): string | undefined {
  if (direction === "up") return "#2de26d";
  if (direction === "down") return "#ff6b7d";
  return undefined;
}

function directionTriangle(direction: Direction): string {
  if (direction === "up") return "▲";
  if (direction === "down") return "▼";
  return "";
}

export default function PortfolioTable({
  rows,
  portfolioTotal,
  currency,
  onDelete,
  disabled,
}: Props) {
  return (
    <div className="table-responsive">
      <table className="table table-dark table-bordered align-middle">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Broker</th>
            <th>Shares</th>
            <th>Price of stock {currency}</th>
            <th>Total {currency}</th>
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
              const direction = getDirection(s);
              const color = directionColor(direction);
              const triangle = directionTriangle(direction);

              return (
                <tr key={`${s.ticker}__${s.broker}`}>
                  <td>{s.ticker}</td>
                  <td>
                    <div className="brokerCell">
                      <BrokerIcon
                        className="brokerIcon brokerIconTable"
                        src={BROKER_ICONS[s.broker]}
                      />
                      <span>{s.broker}</span>
                    </div>
                  </td>
                  <td>{s.shares}</td>
                  <td style={{ color }}>
                    {typeof s.price === "number" ? (
                      <>
                        {formatCurrency(s.price, currency)}
                        {triangle ? (
                          <span style={{ marginLeft: 6, color }}>
                            {triangle}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={{ color }}>
                    {typeof s.total_value === "number" ? (
                      <>
                        {formatCurrency(s.total_value, currency)}
                        {triangle ? (
                          <span style={{ marginLeft: 6, color }}>
                            {triangle}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      "-"
                    )}
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
              Total invested amount:
            </td>
            <td className="fw-bold">
              {portfolioTotal != null ? formatCurrency(portfolioTotal, currency) : "_"}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
