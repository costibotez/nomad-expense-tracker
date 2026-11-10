const euro = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" });
const euroWhole = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const plain = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat("en-GB", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatEuro = (n: number) => euro.format(n);
export const formatEuroWhole = (n: number) => euroWhole.format(n);
export const formatAmount = (n: number, currency: string) => `${plain.format(n)} ${currency}`;
export const formatCompact = (n: number) => compact.format(n);

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const shortFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });

/** All dates in the app are plain calendar dates in the form 2027-03-14. */
export const formatDay = (iso: string) => dayFormat.format(new Date(`${iso}T00:00:00Z`));
export const formatShortDate = (iso: string) => shortFormat.format(new Date(`${iso}T00:00:00Z`));
export const formatMonth = (yearMonth: string) =>
  monthFormat.format(new Date(`${yearMonth}-01T00:00:00Z`));

export function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Number of calendar days from start to end, counting both. */
export function daysBetween(start: string, end: string) {
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  return Math.round(ms / 86_400_000) + 1;
}
