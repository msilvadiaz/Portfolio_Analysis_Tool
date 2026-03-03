import { useEffect, useMemo, useState } from "react";
import type { GuestStock } from "../types";
import PortfolioHistoryChart from "./PortfolioHistoryChart";
import EfficientFrontierChart from "./EfficientFrontierChart";
import OptimizationRecommendations from "./models/OptimizationRecommendations";

type Props = {
  currentUser: string | null;
  guestStocks: GuestStock[];
  refreshVersion: number;
  onLoadingChange?: (loading: boolean) => void;
};

export default function Models({
  currentUser,
  guestStocks,
  refreshVersion,
  onLoadingChange,
}: Props) {
  const [historyLoading, setHistoryLoading] = useState(false);
  const [frontierLoading, setFrontierLoading] = useState(false);
  const [optimizationLoading, setOptimizationLoading] = useState(false);

  const modelLoading = useMemo(
    () => historyLoading || frontierLoading || optimizationLoading,
    [historyLoading, frontierLoading, optimizationLoading],
  );

  useEffect(() => {
    onLoadingChange?.(modelLoading);
  }, [modelLoading, onLoadingChange]);

  return (
    <div className="min-vh-100">
      <div className="container py-4">
        <h1 className="mb-3">Models</h1>

        {!currentUser ? (
          guestStocks.length === 0 ? (
            <p className="text-secondary mb-0">
              Add one or more guest positions in StockBoard to view model outputs here.
            </p>
          ) : (
            <>
              <PortfolioHistoryChart
                guestStocks={guestStocks}
                refreshVersion={refreshVersion}
                onLoadingChange={setHistoryLoading}
              />
              <EfficientFrontierChart
                guestStocks={guestStocks}
                refreshVersion={refreshVersion}
                onLoadingChange={setFrontierLoading}
              />
              <OptimizationRecommendations
                guestStocks={guestStocks}
                refreshVersion={refreshVersion}
                onLoadingChange={setOptimizationLoading}
              />
            </>
          )
        ) : (
          <>
            <PortfolioHistoryChart
              currentUser={currentUser}
              refreshVersion={refreshVersion}
              onLoadingChange={setHistoryLoading}
            />
            <EfficientFrontierChart
              currentUser={currentUser}
              refreshVersion={refreshVersion}
              onLoadingChange={setFrontierLoading}
            />
            <OptimizationRecommendations
              currentUser={currentUser}
              refreshVersion={refreshVersion}
              onLoadingChange={setOptimizationLoading}
            />
          </>
        )}
      </div>
    </div>
  );
}
