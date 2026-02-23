import type { GuestStock } from "./Stockboard";
import PortfolioHistoryChart from "./PortfolioHistoryChart";

type Props = {
  currentUser: string | null;
  guestStocks: GuestStock[];
};

export default function Models({ currentUser, guestStocks }: Props) {
  return (
    <div
      className="min-vh-100"
      style={{ backgroundColor: "#000", color: "aliceblue" }}
    >
      <div className="container py-4">
        <h1 className="mb-3">Models</h1>

        {!currentUser ? (
          <>
            <p className="text-secondary">
              Guest tickers: {guestStocks.map((s) => s.ticker.toUpperCase()).join(", ") || "none"}
            </p>
            <p className="text-secondary">Login to view portfolio analytics.</p>
          </>
        ) : (
          <>
            <p className="text-secondary mb-2">
              Portfolio value over last 1Y (using current holdings).
            </p>
            <PortfolioHistoryChart currentUser={currentUser} />
          </>
        )}
      </div>
    </div>
  );
}
