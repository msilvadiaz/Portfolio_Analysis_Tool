export type BrokerItem = { id: string; name: string; icon?: string };

export const TOP_BROKERS: BrokerItem[] = [
  { id: "wealthsimple", name: "Wealthsimple" },
  { id: "questrade", name: "Questrade" },
  { id: "fidelity", name: "Fidelity" },
  { id: "charles-schwab", name: "Charles Schwab" },
  { id: "td-ameritrade", name: "TD Ameritrade" },
  { id: "etrade", name: "E*TRADE" },
  { id: "robinhood", name: "Robinhood" },
  { id: "interactive-brokers", name: "Interactive Brokers" },
  { id: "merrill-edge", name: "Merrill Edge" },
  { id: "vanguard", name: "Vanguard" },
  { id: "webull", name: "Webull" },
  { id: "tradestation", name: "TradeStation" },
  { id: "sofi-invest", name: "SoFi Invest" },
  { id: "ally-invest", name: "Ally Invest" },
  { id: "moomoo", name: "Moomoo" },
  { id: "tastytrade", name: "Tastytrade" },
  { id: "firstrade", name: "Firstrade" },
  { id: "public", name: "Public.com" },
  { id: "bmo-investorline", name: "BMO InvestorLine" },
  { id: "rbc-direct-investing", name: "RBC Direct Investing" },
  { id: "td-direct-investing", name: "TD Direct Investing" },
  { id: "cibc-investors-edge", name: "CIBC Investor's Edge" },
  { id: "scotia-itrade", name: "Scotia iTRADE" },
  { id: "nbdb", name: "National Bank Direct Brokerage" },
  { id: "desjardins", name: "Desjardins Online Brokerage" },
];

export const OTHER_BROKER: BrokerItem = { id: "other", name: "Other…" };
