export type StockRow = {
  ticker: string;
  broker: string;
  shares: number;
  price: number | null;
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
