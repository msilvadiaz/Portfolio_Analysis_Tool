import { useState } from "react";
import type { StockRow } from "../types";
import DashboardSelector from "./DashboardSelector";
import PortfolioPanel from "./panels/PortfolioPanel";
import ModelsPanel from "./panels/ModelsPanel";

export type DashboardMode = "portfolio" | "models";

export default function Dashboard({
  rows,
  portfolioTotal,
  onAdd,
  onDelete,
  onRefresh,
  disabled,
}: {
  rows: StockRow[];
  portfolioTotal: number | null;
  onAdd: (ticker: string, shares: number, broker: string) => Promise<void>;
  onDelete: (ticker: string, broker: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}) {
  const [mode, setMode] = useState<DashboardMode>("portfolio");

  return (
    <div className="dashLayout">
      <div className="dashMain">
        {mode === "portfolio" && (
          <PortfolioPanel
            rows={rows}
            portfolioTotal={portfolioTotal}
            onAdd={onAdd}
            onDelete={onDelete}
            onRefresh={onRefresh}
            disabled={disabled}
          />
        )}

        {mode === "models" && <ModelsPanel />}
      </div>

      <div className="dashRight">
        <DashboardSelector mode={mode} onChange={setMode} disabled={disabled} />
      </div>
    </div>
  );
}
