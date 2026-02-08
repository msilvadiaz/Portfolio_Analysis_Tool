import { useEffect, useMemo, useState } from "react";
import AuthBar from "./AuthBar";
import AddStockForm from "./AddStockForm";
import PortfolioTable from "./PortfolioTable";
import Message from "./Message";
import type { StockRow } from "../types";
import * as api from "../api";

type GuestStock = { ticker: string; broker: string; shares: number };

export default function Stockboard() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [guestStocks, setGuestStocks] = useState<GuestStock[]>([]);
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
    const anyTotals = out.some((r) => r.total_value != null);
    setRows(out);
    setPortfolioTotal(anyTotals ? Math.round(grand * 100) / 100 : null);
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
    } catch (e) {
      setMsg({
        text: e instanceof Error ? e.message : "Refresh failed",
        variant: "danger",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd(ticker: string, shares: number, broker: string) {
    setMsg({ text: null });
    setBusy(true);
    try {
      if (!currentUser) {
        // Validate ticker on Yahoo before adding (same as old HTML)
        await api.quote(ticker);

        setGuestStocks((prev) => {
          const t = ticker.toUpperCase();
          const idx = prev.findIndex(
            (x) => x.ticker.toUpperCase() === t && x.broker === broker,
          );
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], shares };
            return copy;
          }
          return [...prev, { ticker: t, broker, shares }];
        });
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
    } catch (e) {
      setMsg({
        text: e instanceof Error ? e.message : "Add failed",
        variant: "danger",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(ticker: string, broker: string) {
    setMsg({ text: null });
    setBusy(true);
    try {
      if (!currentUser) {
        setGuestStocks((prev) =>
          prev.filter(
            (s) =>
              !(
                s.ticker.toUpperCase() === ticker.toUpperCase() &&
                s.broker === broker
              ),
          ),
        );
      } else {
        const data = await api.deleteStock({
          user: currentUser,
          ticker,
          broker,
        });
        setRows(data.stocks || []);
        setPortfolioTotal(data.portfolio_total ?? null);
      }
    } catch (e) {
      setMsg({
        text: e instanceof Error ? e.message : "Delete failed",
        variant: "danger",
      });
    } finally {
      setBusy(false);
    }
  }

  async function makeUsernameFlow() {
    const name = window.prompt(
      "Choose a username (backend stores lowercased):",
    );
    if (!name?.trim()) return;

    setMsg({ text: null });
    setBusy(true);
    try {
      const payload = guestStocks.map((s) => ({
        ticker: s.ticker,
        broker: s.broker,
        shares: s.shares,
      }));
      const data = await api.addProfile(name.trim(), payload);

      setCurrentUser(name.trim());
      setGuestStocks([]);
      setRows(data.stocks || []);
      setPortfolioTotal(data.portfolio_total ?? null);
      setMsg({
        text: `Profile created. Welcome ${name.trim()}!`,
        variant: "success",
      });
    } catch (e) {
      setMsg({
        text: e instanceof Error ? e.message : "Profile creation failed",
        variant: "danger",
      });
    } finally {
      setBusy(false);
    }
  }

  async function haveUsernameFlow() {
    const name = window.prompt("Enter your username:");
    if (!name?.trim()) return;

    setMsg({ text: null });
    setBusy(true);
    try {
      await drawUser(name.trim());
      setCurrentUser(name.trim());
      setMsg({ text: `Welcome back ${name.trim()}!`, variant: "info" });
    } catch (e) {
      setMsg({
        text: e instanceof Error ? e.message : "User not found",
        variant: "danger",
      });
    } finally {
      setBusy(false);
    }
  }

  // keep guest table in sync when guestStocks changes
  useEffect(() => {
    if (!currentUser) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestStocks, currentUser]);

  return (
    <div
      className="min-vh-100"
      style={{
        background:
          "linear-gradient(180deg, rgba(130, 0, 0, 0.95), rgba(81, 2, 2, 0.5))",
      }}
    >
      <div className="container py-4">
        <h1 className="mb-3 text-white">{title}</h1>

        <AuthBar
          isGuest={!currentUser}
          onMakeUsername={makeUsernameFlow}
          onHaveUsername={haveUsernameFlow}
        />

        <hr className="border-secondary" />

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
