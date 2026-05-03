export function fmt(n) {
  if (n == null) return "—";
  return (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
