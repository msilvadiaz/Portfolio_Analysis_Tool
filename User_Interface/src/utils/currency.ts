export type SupportedCurrency = "USD" | "CAD";

export function formatCurrency(value: number, currency: SupportedCurrency): string {
  const locale = currency === "CAD" ? "en-CA" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
