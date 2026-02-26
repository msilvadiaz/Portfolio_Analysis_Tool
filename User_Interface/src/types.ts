export type StockRow = {
  ticker: string;
  broker: string;
  shares: number;
  price: number | null;
  previous_close: number | null;
  total_value: number | null;
};

export type UserPortfolioResponse = {
  user: string;
  stocks: StockRow[];
  portfolio_total: number | null;
};

export type ApiError = {
  error?: string;
  message?: string;
  tickers?: string[];
  ticker?: string;
};

export type GuestStock = {
  ticker: string;
  broker: string;
  shares: number;
};

export type PortfolioHistoryPoint = {
  date: string;
  value: number;
};

export type EfficientFrontierPoint = {
  volatility: number;
  expectedReturn: number;
  sharpe: number;
};

export type EfficientFrontierPortfolio = {
  expectedReturn: number;
  volatility: number;
  variance: number;
  sharpe: number;
  weights: Array<{ ticker: string; weight: number }>;
};

export type EfficientFrontierResponse = {
  tickers: string[];
  portfolio: EfficientFrontierPortfolio;
  frontier: EfficientFrontierPoint[];
  maxSharpe?: EfficientFrontierPoint;
  minVolatility?: EfficientFrontierPoint;
  meta: {
    riskFreeRate: number;
    tradingDays: number;
    nSim: number;
    warnings?: string[];
  };
};
