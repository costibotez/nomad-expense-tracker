import { HOME_CURRENCY } from "./constants";

const TIMEOUT_MS = 4000;

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.json();
}

/** Finds the rate for a currency in a table keyed by currency code in any letter case. */
function pick(table: unknown, currency: string): number | null {
  if (!table || typeof table !== "object") return null;
  const record = table as Record<string, unknown>;
  const value = record[currency.toLowerCase()] ?? record[currency.toUpperCase()];
  const rate = typeof value === "string" ? Number(value) : value;
  return typeof rate === "number" && Number.isFinite(rate) && rate > 0 ? rate : null;
}

/**
 * Returns how many units of `currency` one euro buys on the given date,
 * or null when no rate service could answer. Three free sources are tried in turn.
 * The first two keep daily history, the last one only knows the latest rate.
 */
export async function fetchRate(currency: string, date: string): Promise<number | null> {
  if (currency === HOME_CURRENCY) return 1;

  const today = new Date().toISOString().slice(0, 10);
  const version = date >= today ? "latest" : date;
  const base = HOME_CURRENCY.toLowerCase();

  const sources: Array<() => Promise<number | null>> = [
    async () => {
      const json = (await getJson(
        `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${version}/v1/currencies/${base}.json`,
      )) as Record<string, unknown>;
      return pick(json[base], currency);
    },
    async () => {
      const json = (await getJson(
        `https://${version}.currency-api.pages.dev/v1/currencies/${base}.json`,
      )) as Record<string, unknown>;
      return pick(json[base], currency);
    },
    async () => {
      const json = (await getJson(
        `https://open.er-api.com/v6/latest/${HOME_CURRENCY}`,
      )) as Record<string, unknown>;
      return pick(json.rates, currency);
    },
  ];

  for (const source of sources) {
    try {
      const rate = await source();
      if (rate) return rate;
    } catch {
      // Try the next source.
    }
  }
  return null;
}
