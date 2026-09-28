export type CurrencyCode = "QAR" | "USD" | "EUR" | "TND";

// Static approximate rates relative to 1 QAR. These are indicative only —
// not live market rates. Users can still view everything in QAR (primary).
export const QAR_RATES: Record<CurrencyCode, number> = {
  QAR: 1,
  USD: 0.2747,
  EUR: 0.2524,
  TND: 0.8514,
};

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  QAR: "ر.ق",
  USD: "$",
  EUR: "€",
  TND: "د.ت",
};

export function convertFromQAR(amountQAR: number, to: CurrencyCode): number {
  return amountQAR * QAR_RATES[to];
}

export function formatCurrency(amountQAR: number, currency: CurrencyCode = "QAR"): string {
  const value = convertFromQAR(amountQAR, currency);
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));

  if (currency === "QAR") return `QAR ${formatted}`;
  if (currency === "USD") return `$${formatted}`;
  if (currency === "EUR") return `€${formatted}`;
  return `${formatted} ${CURRENCY_SYMBOLS[currency]}`;
}

export function formatCurrencyPrecise(amountQAR: number, currency: CurrencyCode = "QAR"): string {
  const value = convertFromQAR(amountQAR, currency);
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  if (currency === "QAR") return `QAR ${formatted}`;
  if (currency === "USD") return `$${formatted}`;
  if (currency === "EUR") return `€${formatted}`;
  return `${formatted} ${CURRENCY_SYMBOLS[currency]}`;
}
