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


export type OptimizationObjective = "max_sharpe" | "min_vol" | "target_return" | "risk_preset";
export type RiskPreset = "conservative" | "balanced" | "aggressive";

export type PortfolioMetricSet = {
  expectedReturn: number;
  volatility: number;
  sharpe: number;
  weights: Array<{ ticker: string; weight: number }>;
};

export type PortfolioOptimizationResponse = {
  tickers: string[];
  objective: OptimizationObjective;
  inputs: {
    riskFreeRate: number;
    targetReturn: number | null;
    preset: RiskPreset | null;
    nSim: number;
    constraints: {
      minWeight: number;
      maxWeight: number;
    };
  };
  current: PortfolioMetricSet;
  recommended: PortfolioMetricSet;
  rebalance: Array<{
    ticker: string;
    current: number;
    recommended: number;
    delta: number;
    action: "Increase" | "Reduce" | "Hold";
  }>;
  warnings?: string[];
};
