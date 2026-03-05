export type SupportedCurrency = "USD" | "CAD";

// Display conversion rate used when showing USD-backed values in CAD.
// Keeps UI toggles deterministic without requiring a live FX endpoint.
const USD_TO_CAD_RATE = 1.35;

export function convertUsdToCurrency(value: number, currency: SupportedCurrency): number {
  if (currency === "CAD") return value * USD_TO_CAD_RATE;
  return value;
}

export function formatCurrency(value: number, currency: SupportedCurrency): string {
  const locale = currency === "CAD" ? "en-CA" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatConvertedCurrency(valueInUsd: number, currency: SupportedCurrency): string {
  return formatCurrency(convertUsdToCurrency(valueInUsd, currency), currency);
}
