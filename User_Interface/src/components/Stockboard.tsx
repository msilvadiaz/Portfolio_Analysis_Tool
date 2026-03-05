import { useEffect, useMemo, useRef, useState } from "react";
import AuthBar from "./AuthBar";
import AddStockForm from "./AddStockForm";
import PortfolioTable from "./PortfolioTable";
import Message from "./Message";
import NamePromptModal from "./NamePromptModal";
import type { GuestStock, StockRow } from "../types";
import * as api from "../api";
import type { SupportedCurrency } from "../utils/currency";

type Props = {
  currentUser: string | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<string | null>>;
  guestStocks: GuestStock[];
  setGuestStocks: React.Dispatch<React.SetStateAction<GuestStock[]>>;
  currency: SupportedCurrency;
  onToggleCurrency: () => void;
  onPortfolioUpdated: () => void;
  onLoadingChange?: (loading: boolean) => void;
};

export default function Stockboard({
  currentUser,
  setCurrentUser,
  guestStocks,
  setGuestStocks,
  currency,
  onToggleCurrency,
  onPortfolioUpdated,
  onLoadingChange,
}: Props) {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [portfolioTotal, setPortfolioTotal] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{
    text: string | null;
    variant?: "danger" | "success" | "info";
  }>({ text: null });
  const latestLoadId = useRef(0);
  const [nameModalMode, setNameModalMode] = useState<"save" | "load" | null>(
    null,
  );
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    onLoadingChange?.(busy);
  }, [busy, onLoadingChange]);

  const title = useMemo(
    () => (currentUser ? `StockBoard: ${currentUser}` : "StockBoard (Guest)"),
    [currentUser],
  );

  async function drawGuest() {
    const out: StockRow[] = [];
    for (const s of guestStocks) {
      try {
        const quote = await api.quote(s.ticker);
        const total = Math.round(quote.price * s.shares * 100) / 100;
        out.push({
          ticker: s.ticker.toUpperCase(),
          broker: s.broker,
          shares: s.shares,
          price: quote.price,
          previous_close: quote.previous_close,
          total_value: total,
        });
      } catch {
        out.push({
          ticker: s.ticker.toUpperCase(),
          broker: s.broker,
          shares: s.shares,
          price: null,
          previous_close: null,
          total_value: null,
        });
      }
    }

    const grand = out.reduce(
      (acc, r) => acc + (typeof r.total_value === "number" ? r.total_value : 0),
      0,
    );

    setRows(out);
    onPortfolioUpdated();
    setPortfolioTotal(
      out.some((r) => r.total_value != null)
        ? Math.round(grand * 100) / 100
        : null,
    );
  }

  async function drawUser(username: string) {
    const data = await api.getUser(username);
    setRows(data.stocks || []);
    setPortfolioTotal(data.portfolio_total ?? null);
    onPortfolioUpdated();
  }

  async function refresh() {
    const loadId = ++latestLoadId.current;
    setMsg({ text: null });
    setBusy(true);
    try {
      if (!currentUser) await drawGuest();
      else await drawUser(currentUser);
    } catch {
      setMsg({ text: "Refresh failed", variant: "danger" });
    } finally {
      if (loadId === latestLoadId.current) setBusy(false);
    }
  }

  async function handleAdd(ticker: string, shares: number, broker: string) {
    setBusy(true);
    try {
      if (!currentUser) {
        await api.quote(ticker);
        setGuestStocks((prev) => [...prev, { ticker, broker, shares }]);
        onPortfolioUpdated();
      } else {
        const data = await api.addStock({
          user: currentUser,
          ticker,
          broker,
          shares,
        });
        setRows(data.stocks || []);
        setPortfolioTotal(data.portfolio_total ?? null);
        onPortfolioUpdated();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(ticker: string, broker: string) {
    if (!currentUser) {
      setGuestStocks((prev) =>
        prev.filter((s) => !(s.ticker === ticker && s.broker === broker)),
      );
      onPortfolioUpdated();
    } else {
      const data = await api.deleteStock({ user: currentUser, ticker, broker });
      setRows(data.stocks || []);
      setPortfolioTotal(data.portfolio_total ?? null);
      onPortfolioUpdated();
    }
  }

  function makeUsernameFlow() {
    setMsg({ text: null });
    setNameInput(currentUser ?? "");
    setNameModalMode("save");
  }

  function haveUsernameFlow() {
    setMsg({ text: null });
    setNameInput(currentUser ?? "");
    setNameModalMode("load");
  }

  function cancelNameModal() {
    if (busy) return;
    setNameModalMode(null);
    setNameInput("");
  }

  async function submitNameModal() {
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setMsg({ text: "Portfolio name cannot be empty.", variant: "danger" });
      return;
    }

    setBusy(true);
    setMsg({ text: null });
    try {
      if (nameModalMode === "save") {
        const payload = guestStocks.map((s) => ({
          ticker: s.ticker,
          broker: s.broker,
          shares: s.shares,
        }));
        const data = await api.addProfile(trimmedName, payload);
        localStorage.setItem("stockboard_username", trimmedName);
        setCurrentUser(trimmedName);
        setGuestStocks([]);
        setRows(data.stocks || []);
        setPortfolioTotal(data.portfolio_total ?? null);
        onPortfolioUpdated();
      } else if (nameModalMode === "load") {
        await drawUser(trimmedName);
        localStorage.setItem("stockboard_username", trimmedName);
        setCurrentUser(trimmedName);
      }

      setNameModalMode(null);
      setNameInput("");
    } catch {
      setMsg({
        text:
          nameModalMode === "save"
            ? "Unable to save portfolio with that name."
            : "Unable to load portfolio with that name.",
        variant: "danger",
      });
    } finally {
      setBusy(false);
    }
  }

  function handleSignOut() {
    localStorage.removeItem("stockboard_username");
    setCurrentUser(null);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      void refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestStocks]);

  return (
    <div>
      <div className="container py-4">
        <h1 className="mb-3 text-white">{title}</h1>

        <AuthBar
          isGuest={!currentUser}
          onMakeUsername={makeUsernameFlow}
          onHaveUsername={haveUsernameFlow}
        />

        <Message
          variant={msg.variant ?? "danger"}
          text={msg.text}
          onClose={() => setMsg({ text: null })}
        />

        <AddStockForm
          onAdd={handleAdd}
          onRefresh={refresh}
          onToggleCurrency={onToggleCurrency}
          toggleCurrencyLabel={currency === "USD" ? "Switch to CAD" : "Switch to USD"}
          onSignOut={currentUser ? handleSignOut : undefined}
          disabled={busy}
        />

        <PortfolioTable
          rows={rows}
          portfolioTotal={portfolioTotal}
          currency={currency}
          onDelete={handleDelete}
          disabled={busy}
        />

        <NamePromptModal
          isOpen={nameModalMode !== null}
          title={
            nameModalMode === "save"
              ? "Name the portfolio to save"
              : "Enter portfolio name"
          }
          value={nameInput}
          setValue={setNameInput}
          onConfirm={submitNameModal}
          onCancel={cancelNameModal}
          isLoading={busy}
          disabled={busy}
          confirmLabel={nameModalMode === "save" ? "Save" : "Load"}
        />
      </div>
    </div>
  );
}
