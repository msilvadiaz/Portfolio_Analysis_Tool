import type { GuestStock } from "../types";
import PortfolioHistoryChart from "./PortfolioHistoryChart";
import EfficientFrontierChart from "./EfficientFrontierChart";
import OptimizationRecommendations from "./models/OptimizationRecommendations";

type Props = {
  currentUser: string | null;
  guestStocks: GuestStock[];
  refreshVersion: number;
};

export default function Models({ currentUser, guestStocks, refreshVersion }: Props) {
  return (
    <div className="min-vh-100">
      <div className="container py-4">
        <h1 className="mb-3">Models</h1>

        {!currentUser ? (
          guestStocks.length === 0 ? (
            <p className="text-secondary mb-0">
              Add one or more guest positions in StockBoard to view portfolio history here.
            </p>
          ) : (
            <>
              <PortfolioHistoryChart guestStocks={guestStocks} refreshVersion={refreshVersion} />
              <p className="text-secondary mt-4 mb-0">
                Efficient frontier is available for saved users after sign in.
              </p>
            </>
          )
        ) : (
          <>
            <PortfolioHistoryChart currentUser={currentUser} refreshVersion={refreshVersion} />
            <EfficientFrontierChart currentUser={currentUser} refreshVersion={refreshVersion} />
            <OptimizationRecommendations currentUser={currentUser} refreshVersion={refreshVersion} />
          </>
        )}
      </div>
    </div>
  );
}
