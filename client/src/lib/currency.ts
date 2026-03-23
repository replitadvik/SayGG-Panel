const CURRENCY_SYMBOL = import.meta.env.VITE_DEFAULT_CURRENCY_SYMBOL || "₹";

export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === "string" ? (parseFloat(amount) || 0) : (amount ?? 0);
  return `${CURRENCY_SYMBOL}${num}`;
}
