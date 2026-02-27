import type {
  ApiError,
  EfficientFrontierResponse,
  OptimizationObjective,
  PortfolioOptimizationResponse,
  RiskPreset,
  GuestStock,
  PortfolioHistoryPoint,
  UserPortfolioResponse,
} from "./types";

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

export type QuoteResponse = {
  ticker: string;
  price: number;
  previous_close: number | null;
};

export async function quote(ticker: string): Promise<QuoteResponse> {
  const t = ticker.trim().toUpperCase();
  const res = await fetch(apiUrl(`/api/quote/${encodeURIComponent(t)}`));
  const data = await readJson<{
    ticker: string;
    price: number | null;
    previous_close: number | null;
  } & ApiError>(res);
  if (!res.ok || typeof data.price !== "number") throw new Error(data.error || "Quote failed");
  return {
    ticker: data.ticker,
    price: data.price,
    previous_close: typeof data.previous_close === "number" ? data.previous_close : null,
  };
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


export async function getGuestPortfolioHistory(stocks: GuestStock[], period = "1y"): Promise<PortfolioHistoryPoint[]> {
  const res = await fetch(apiUrl("/api/portfolio/history/guest"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stocks, period }),
  });
  const data = await readJson<(PortfolioHistoryPoint[] & ApiError) | ApiError>(res);
  if (!res.ok) throw new Error((data as ApiError).error || "Failed to load guest portfolio history");
  return Array.isArray(data) ? (data as PortfolioHistoryPoint[]) : [];
}

export async function getPortfolioHistory(username: string, period = "1y"): Promise<PortfolioHistoryPoint[]> {
  const params = new URLSearchParams({ user: username, period });
  const res = await fetch(apiUrl(`/api/portfolio/history?${params.toString()}`));
  const data = await readJson<(PortfolioHistoryPoint[] & ApiError) | ApiError>(res);
  if (!res.ok) throw new Error((data as ApiError).error || "Failed to load portfolio history");
  return Array.isArray(data) ? (data as PortfolioHistoryPoint[]) : [];
}

export async function getEfficientFrontier(username: string, riskFreeRate?: number): Promise<EfficientFrontierResponse> {
  const params = new URLSearchParams({ user: username });
  if (typeof riskFreeRate === "number") {
    params.set("rf", String(riskFreeRate));
  }

  const res = await fetch(apiUrl(`/api/models/efficient-frontier?${params.toString()}`));
  const data = await readJson<EfficientFrontierResponse & ApiError>(res);
  if (!res.ok) throw new Error(data.error || "Failed to load efficient frontier");
  return data;
}


export type PortfolioOptimizationParams = {
  user: string;
  objective: OptimizationObjective;
  targetReturn?: number;
  preset?: RiskPreset;
  rf?: number;
  nSim?: number;
  minWeight?: number;
  maxWeight?: number;
};

export async function getPortfolioOptimization(params: PortfolioOptimizationParams): Promise<PortfolioOptimizationResponse> {
  const query = new URLSearchParams({
    user: params.user,
    objective: params.objective,
  });

  if (typeof params.targetReturn === "number") query.set("targetReturn", String(params.targetReturn));
  if (typeof params.preset === "string") query.set("preset", params.preset);
  if (typeof params.rf === "number") query.set("rf", String(params.rf));
  if (typeof params.nSim === "number") query.set("nSim", String(params.nSim));
  if (typeof params.minWeight === "number") query.set("minWeight", String(params.minWeight));
  if (typeof params.maxWeight === "number") query.set("maxWeight", String(params.maxWeight));

  const res = await fetch(apiUrl(`/api/models/portfolio-optimization?${query.toString()}`));
  const data = await readJson<PortfolioOptimizationResponse & ApiError>(res);
  if (!res.ok) throw new Error(data.error || "Failed to load portfolio optimization");
  return data;
}
