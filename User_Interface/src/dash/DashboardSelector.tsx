import type { DashboardMode } from "./Dashboard";

export default function DashboardSelector({
  mode,
  onChange,
  disabled,
}: {
  mode: DashboardMode;
  onChange: (m: DashboardMode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="dashSelector">
      <div className="dashSelectorTitle">Views</div>

      <button
        type="button"
        className={`dashPill ${mode === "portfolio" ? "active" : ""}`}
        onClick={() => onChange("portfolio")}
        disabled={disabled}
      >
        Portfolio
      </button>

      <button
        type="button"
        className={`dashPill ${mode === "models" ? "active" : ""}`}
        onClick={() => onChange("models")}
        disabled={disabled}
      >
        Models
      </button>
    </div>
  );
}
