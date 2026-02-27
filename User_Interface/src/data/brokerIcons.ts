import { TOP_BROKERS } from "./brokers";

/**
 * Add real logo files with these exact names to `public/broker-icons/`.
 * Once files are present, the app will render them automatically.
 */
export const BROKER_ICONS: Record<string, string> = {
  Wealthsimple: "/broker-icons/wealthsimple.png",
  Questrade: "/broker-icons/questrade.png",
  "Interactive Brokers": "/broker-icons/interactive_brokers.png",
  Fidelity: "/broker-icons/fidelity.png",
  "Charles Schwab": "/broker-icons/charles-schwab.svg",
  Vanguard: "/broker-icons/vanguard.png",
  "E*TRADE": "/broker-icons/etrade.png",
  "TD Ameritrade": "/broker-icons/td-ameritrade.svg",
  Robinhood: "/broker-icons/robinhood.png",
  Webull: "/broker-icons/webull.png",
  Merrill: "/broker-icons/merill.png",
  "J.P. Morgan Self-Directed": "/broker-icons/jpmorgan.png",
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
