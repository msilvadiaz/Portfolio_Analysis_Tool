import { TOP_BROKERS } from "./brokers";

/**
 * Add real logo files with these exact names to `public/broker-icons/`.
 * Once files are present, the app will render them automatically.
 */
export const BROKER_ICONS: Record<string, string> = {
  Wealthsimple: "/broker-icons/wealthsimple.svg",
  Questrade: "/broker-icons/questrade.svg",
  "Interactive Brokers": "/broker-icons/interactive-brokers.svg",
  Fidelity: "/broker-icons/fidelity.svg",
  "Charles Schwab": "/broker-icons/charles-schwab.svg",
  Vanguard: "/broker-icons/vanguard.svg",
  "E*TRADE": "/broker-icons/etrade.svg",
  "TD Ameritrade": "/broker-icons/td-ameritrade.svg",
  Robinhood: "/broker-icons/robinhood.svg",
  Webull: "/broker-icons/webull.svg",
  Merrill: "/broker-icons/merrill.svg",
  "J.P. Morgan Self-Directed": "/broker-icons/jp-morgan-self-directed.svg",
  "Ally Invest": "/broker-icons/ally-invest.svg",
  "SoFi Invest": "/broker-icons/sofi-invest.svg",
  Wealthfront: "/broker-icons/wealthfront.svg",
  Betterment: "/broker-icons/betterment.svg",
  Public: "/broker-icons/public.svg",
  Moomoo: "/broker-icons/moomoo.svg",
  tastytrade: "/broker-icons/tastytrade.svg",
  Firstrade: "/broker-icons/firstrade.svg",
  TradeZero: "/broker-icons/tradezero.svg",
  "CIBC Investor's Edge": "/broker-icons/cibc-investors-edge.svg",
  "RBC Direct Investing": "/broker-icons/rbc-direct-investing.svg",
  "BMO InvestorLine": "/broker-icons/bmo-investorline.svg",
  "Scotia iTRADE": "/broker-icons/scotia-itrade.svg",
};

export const GENERIC_BROKER_ICON = "/broker-icons/generic-broker.svg";

export const BROKER_ICON_FILES = TOP_BROKERS.map((broker) =>
  (BROKER_ICONS[broker.name] ?? GENERIC_BROKER_ICON).replace("/broker-icons/", ""),
);
