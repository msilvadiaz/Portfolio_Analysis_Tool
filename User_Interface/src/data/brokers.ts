export type BrokerItem = {
  id: string;
  name: string;
};

export const TOP_BROKERS: BrokerItem[] = [
  { id: "fidelity", name: "Fidelity" },
  { id: "charles-schwab", name: "Charles Schwab" },
  { id: "vanguard", name: "Vanguard" },
  { id: "etrade", name: "E*TRADE" },
  { id: "td-ameritrade", name: "TD Ameritrade" },
  { id: "interactive-brokers", name: "Interactive Brokers" },
  { id: "robinhood", name: "Robinhood" },
  { id: "webull", name: "Webull" },
  { id: "merrill", name: "Merrill" },
  { id: "jpmorgan", name: "J.P. Morgan Self-Directed" },
  { id: "ally-invest", name: "Ally Invest" },
  { id: "sofi", name: "SoFi Invest" },
  { id: "wealthfront", name: "Wealthfront" },
  { id: "betterment", name: "Betterment" },
  { id: "public", name: "Public" },
  { id: "moomoo", name: "Moomoo" },
  { id: "tastytrade", name: "tastytrade" },
  { id: "firstrade", name: "Firstrade" },
  { id: "tradezero", name: "TradeZero" },
  { id: "questrade", name: "Questrade" },
  { id: "wealthsimple", name: "Wealthsimple" },
  { id: "cibc-investors-edge", name: "CIBC Investor's Edge" },
  { id: "rbc-direct-investing", name: "RBC Direct Investing" },
  { id: "bmo-investorline", name: "BMO InvestorLine" },
  { id: "scotia-itrade", name: "Scotia iTRADE" },
];

export const OTHER_BROKER: BrokerItem = { id: "other", name: "Other…" };
