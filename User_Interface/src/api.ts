import type { ApiError, PortfolioHistoryPoint, UserPortfolioResponse } from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // In case backend returns empty / non-json
    return {} as T;
  }
}

function apiUrl(path: string): string {
  if (!API_BASE) return path; // same-origin dev (proxy) fallback
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function getUser(username: string): Promise<UserPortfolioResponse> {
  const res = await fetch(apiUrl(`/api/user/${encodeURIComponent(username)}`));
  const data = await readJson<UserPortfolioResponse & ApiError>(res);
  if (!res.ok) throw new Error(data.error || "Failed to load user");
  return data;
}

export async function quote(ticker: string): Promise<number> {
  const t = ticker.trim().toUpperCase();
  const res = await fetch(apiUrl(`/api/quote/${encodeURIComponent(t)}`));
  const data = await readJson<{ ticker: string; price: number | null } & ApiError>(res);
  if (!res.ok || typeof data.price !== "number") throw new Error(data.error || "Quote failed");
  return data.price;
}

export async function addProfile(
  user: string,
  stocks: Array<{ ticker: string; broker: string; shares: number }>
): Promise<UserPortfolioResponse> {
  const res = await fetch(apiUrl("/api/add-profile"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, stocks }),
  });
  const data = await readJson<UserPortfolioResponse & ApiError>(res);
  if (!res.ok) {
    if (data.error === "Username already exists") throw new Error("That username is already taken.");
    if (data.tickers?.length) throw new Error(`Could not locate companies for: ${data.tickers.join(", ")}`);
    throw new Error(data.error || "Failed to create profile");
  }
  return data;
}

export async function addStock(payload: {
  user: string;
  ticker: string;
  broker: string;
  shares: number;
}): Promise<UserPortfolioResponse> {
  const res = await fetch(apiUrl("/api/add-stock"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readJson<UserPortfolioResponse & ApiError>(res);
  if (!res.ok) throw new Error(data.error || "Failed to add stock");
  return data;
}

export async function deleteStock(payload: {
  user: string;
  ticker: string;
  broker: string;
}): Promise<UserPortfolioResponse> {
  const res = await fetch(apiUrl("/api/delete-stock"), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readJson<UserPortfolioResponse & ApiError>(res);
  if (!res.ok) throw new Error(data.error || data.message || "Delete failed");
  return data;
}

export async function getPortfolioHistory(user: string, period = "1y"): Promise<PortfolioHistoryPoint[]> {
  const res = await fetch(apiUrl(`/api/portfolio/history?user=${encodeURIComponent(user)}&period=${encodeURIComponent(period)}`));
  const data = await readJson<Array<PortfolioHistoryPoint> & ApiError>(res);
  if (!res.ok) throw new Error(data.error || "Failed to load portfolio history");
  if (!Array.isArray(data)) return [];
  return data;
}
