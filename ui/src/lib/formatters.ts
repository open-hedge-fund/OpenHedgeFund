export function formatDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

export function formatQty(val: number | null): string {
  if (val == null) return "";
  return Number(val).toLocaleString();
}

export function formatDecimal2(val: number | null): string {
  if (val == null) return "";
  return Number(val).toFixed(2);
}

export function formatDecimal6(val: number | null): string {
  if (val == null) return "";
  return Number(val).toFixed(6);
}
