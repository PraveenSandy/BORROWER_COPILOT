/** Rupee helpers. Every amount shown to a borrower goes through here. */

export function roundToWholeRupee(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount);
}

export function neverNegative(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return amount;
}

/** ₹1,10,000 — Indian digit grouping, no paise. */
export function formatRupees(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(roundToWholeRupee(amount));
}

export function formatPercent(rate: number, decimalPlaces = 1): string {
  return `${rate.toFixed(decimalPlaces)}%`;
}
