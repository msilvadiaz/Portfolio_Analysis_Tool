export type BrokerItem = {
  id: string;
  name: string;
  aliases?: string[];
};

export const TOP_BROKERS: BrokerItem[] = [
  { id: "wealthsimple", name: "Wealthsimple", aliases: ["ws", "wealth simple"] },
  { id: "questrade", name: "Questrade", aliases: ["qt"] },
  { id: "interactive-brokers", name: "Interactive Brokers", aliases: ["ib", "ibkr", "interactive"] },
  { id: "fidelity", name: "Fidelity", aliases: ["fido"] },
  { id: "charles-schwab", name: "Charles Schwab", aliases: ["schwab"] },
  { id: "vanguard", name: "Vanguard" },
  { id: "etrade", name: "E*TRADE", aliases: ["etrade"] },
  { id: "td-ameritrade", name: "TD Ameritrade", aliases: ["tda", "td"] },
  { id: "robinhood", name: "Robinhood", aliases: ["rh"] },
  { id: "webull", name: "Webull" },
  { id: "merrill", name: "Merrill", aliases: ["merrill edge"] },
  { id: "jpmorgan", name: "J.P. Morgan Self-Directed", aliases: ["jpm", "chase"] },
  { id: "ally-invest", name: "Ally Invest", aliases: ["ally"] },
  { id: "sofi", name: "SoFi Invest", aliases: ["sofi"] },
  { id: "wealthfront", name: "Wealthfront" },
  { id: "betterment", name: "Betterment" },
  { id: "public", name: "Public", aliases: ["public.com"] },
  { id: "moomoo", name: "Moomoo" },
  { id: "tastytrade", name: "tastytrade", aliases: ["tastyworks"] },
  { id: "firstrade", name: "Firstrade" },
  { id: "tradezero", name: "TradeZero" },
  { id: "cibc-investors-edge", name: "CIBC Investor's Edge", aliases: ["cibc"] },
  { id: "rbc-direct-investing", name: "RBC Direct Investing", aliases: ["rbc"] },
  { id: "bmo-investorline", name: "BMO InvestorLine", aliases: ["bmo"] },
  { id: "scotia-itrade", name: "Scotia iTRADE", aliases: ["scotia", "itrade"] },
];

export const OTHER_BROKER: BrokerItem = { id: "other", name: "Other…" };
