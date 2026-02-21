import { useEffect, useMemo, useState } from "react";
import AuthBar from "./AuthBar";
import AddStockForm from "./AddStockForm";
import PortfolioTable from "./PortfolioTable";
import Message from "./Message";
import type { StockRow } from "../types";
import * as api from "../api";

export type GuestStock = { ticker: string; broker: string; shares: number };

type Props = {
  currentUser: string | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<string | null>>;
  guestStocks: GuestStock[];
  setGuestStocks: React.Dispatch<React.SetStateAction<GuestStock[]>>;
};

export default function Stockboard({
  currentUser,
  setCurrentUser,
  guestStocks,
  setGuestStocks,
}: Props) {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [portfolioTotal, setPortfolioTotal] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{
    text: string | null;
    variant?: "danger" | "success" | "info";
  }>({ text: null });

  const title = useMemo(
    () =>
      currentUser
        ? `StockBoard — Welcome ${currentUser}`
        : "StockBoard (Guest)",
    [currentUser],
  );

  async function drawGuest() {
    const out: StockRow[] = [];
    for (const s of guestStocks) {
      try {
        const p = await api.quote(s.ticker);
        const total = Math.round(p * s.shares * 100) / 100;
        out.push({
          ticker: s.ticker.toUpperCase(),
          broker: s.broker,
          shares: s.shares,
          price: p,
          total_value: total,
        });
      } catch {
        out.push({
          ticker: s.ticker.toUpperCase(),
          broker: s.broker,
          shares: s.shares,
          price: null,
          total_value: null,
        });
      }
    }

    const grand = out.reduce(
      (acc, r) => acc + (typeof r.total_value === "number" ? r.total_value : 0),
      0,
    );

    setRows(out);
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
  }

  async function refresh() {
    setMsg({ text: null });
    setBusy(true);
    try {
      if (!currentUser) await drawGuest();
      else await drawUser(currentUser);
    } catch {
      setMsg({ text: "Refresh failed", variant: "danger" });
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd(ticker: string, shares: number, broker: string) {
    setBusy(true);
    try {
      if (!currentUser) {
        await api.quote(ticker);
        setGuestStocks((prev) => [...prev, { ticker, broker, shares }]);
      } else {
        const data = await api.addStock({
          user: currentUser,
          ticker,
          broker,
          shares,
        });
        setRows(data.stocks || []);
        setPortfolioTotal(data.portfolio_total ?? null);
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
    } else {
      const data = await api.deleteStock({ user: currentUser, ticker, broker });
      setRows(data.stocks || []);
      setPortfolioTotal(data.portfolio_total ?? null);
    }
  }

  async function makeUsernameFlow() {
    const name = window.prompt("Choose a username:");
    if (!name) return;

    const payload = guestStocks.map((s) => ({
      ticker: s.ticker,
      broker: s.broker,
      shares: s.shares,
    }));

    const data = await api.addProfile(name, payload);
    setCurrentUser(name);
    setGuestStocks([]);
    setRows(data.stocks || []);
    setPortfolioTotal(data.portfolio_total ?? null);
  }

  async function haveUsernameFlow() {
    const name = window.prompt("Enter your username:");
    if (!name) return;

    await drawUser(name);
    setCurrentUser(name);
  }

  useEffect(() => {
    if (!currentUser) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestStocks, currentUser]);

  return (
    <div
      className="min-vh-100"
      style={{
        background:
          "linear-gradient(180deg, rgba(130,0,0,.95), rgba(81,2,2,.5))",
      }}
    >
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

        <AddStockForm onAdd={handleAdd} onRefresh={refresh} disabled={busy} />

        <PortfolioTable
          rows={rows}
          portfolioTotal={portfolioTotal}
          onDelete={handleDelete}
          disabled={busy}
        />
      </div>
    </div>
  );
}
