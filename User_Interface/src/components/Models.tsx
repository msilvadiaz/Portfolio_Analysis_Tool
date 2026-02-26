import type { GuestStock } from "../types";
import PortfolioHistoryChart from "./PortfolioHistoryChart";
import EfficientFrontierChart from "./EfficientFrontierChart";

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
          guestStocks.length === 0 ? (
            <p className="text-secondary mb-0">
              Add one or more guest positions in StockBoard to view portfolio history here.
            </p>
          ) : (
            <>
              <p className="text-secondary mb-3">
                Portfolio value over last 1Y (using current guest holdings).
              </p>
              <PortfolioHistoryChart guestStocks={guestStocks} />
              <p className="text-secondary mt-4 mb-0">
                Efficient frontier is available for saved users after sign in.
              </p>
            </>
          )
        ) : (
          <>
            <p className="text-secondary mb-3">
              Portfolio value over last 1Y (using current holdings).
            </p>
            <PortfolioHistoryChart currentUser={currentUser} />
            <EfficientFrontierChart currentUser={currentUser} />
          </>
        )}
      </div>
    </div>
  );
}
