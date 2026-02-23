import { useMemo, useState } from "react";

type Props = {
  onAdd: (
    ticker: string,
    shares: number,
    broker: string,
  ) => Promise<void> | void;
  onRefresh: () => Promise<void> | void;
  onSignOut?: () => void;
  disabled?: boolean;
};

export default function AddStockForm({
  onAdd,
  onRefresh,
  onSignOut,
  disabled,
}: Props) {
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState<string>("");
  const [broker, setBroker] = useState("");

  const sharesNum = useMemo(() => Number(shares), [shares]);
  const canSubmit = ticker.trim() && broker.trim() && sharesNum > 0;

  async function handleAdd() {
    if (!canSubmit) return;
    await onAdd(ticker.trim(), sharesNum, broker.trim());
    setTicker("");
    setShares("");
    setBroker("");
  }

  return (
    <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
      <input
        className="form-control bg-gray text-black"
        style={{ maxWidth: 200 }}
        placeholder="ticker"
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        disabled={disabled}
      />
      <input
        className="form-control bg-gray text-black"
        style={{ maxWidth: 160 }}
        type="number"
        step="any"
        min={0}
        placeholder="shares"
        value={shares}
        onChange={(e) => setShares(e.target.value)}
        disabled={disabled}
      />
      <input
        className="form-control bg-gray text-black"
        style={{ maxWidth: 240 }}
        placeholder="broker"
        value={broker}
        onChange={(e) => setBroker(e.target.value)}
        disabled={disabled}
      />

      <button
        className="btn btn-dark"
        onClick={handleAdd}
        disabled={disabled || !canSubmit}
      >
        Add stock
      </button>
      <button
        className="btn btn-dark"
        onClick={() => onRefresh()}
        disabled={disabled}
      >
        Refresh
      </button>
      {onSignOut ? (
        <button className="btn btn-dark" onClick={onSignOut} disabled={disabled}>
          Sign out
        </button>
      ) : null}
    </div>
  );
}
