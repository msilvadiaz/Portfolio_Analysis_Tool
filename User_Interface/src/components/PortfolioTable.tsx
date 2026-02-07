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
            rows.map((s) => (
              <tr key={`${s.ticker}__${s.broker}`}>
                <td>{s.ticker}</td>
                <td>{s.broker}</td>
                <td>{s.shares}</td>
                <td>{s.price ?? "-"}</td>
                <td>{s.total_value ?? "-"}</td>
                <td>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => onDelete(s.ticker, s.broker)}
                    disabled={disabled}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
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
