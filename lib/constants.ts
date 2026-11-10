export const HOME_CURRENCY = "EUR";

export const CATEGORIES = [
  { id: "flights", label: "Flights", icon: "✈️" },
  { id: "accommodation", label: "Accommodation", icon: "🏠" },
  { id: "food", label: "Food", icon: "🍜" },
  { id: "transport", label: "Local transport", icon: "🚌" },
  { id: "activities", label: "Activities", icon: "🎟️" },
  { id: "visas", label: "Visas and insurance", icon: "🛂" },
  { id: "shopping", label: "Shopping", icon: "🛍️" },
  { id: "health", label: "Health", icon: "💊" },
  { id: "other", label: "Other", icon: "📦" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const CATEGORY_IDS: string[] = CATEGORIES.map((c) => c.id);

export function categoryOf(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

export const CURRENCIES = [
  { code: "EUR", name: "Euro" },
  { code: "USD", name: "United States dollar" },
  { code: "RON", name: "Romanian leu" },
  { code: "THB", name: "Thai baht" },
  { code: "VND", name: "Vietnamese dong" },
  { code: "JPY", name: "Japanese yen" },
  { code: "CNY", name: "Chinese yuan" },
  { code: "UZS", name: "Uzbek som" },
  { code: "TJS", name: "Tajik somoni" },
  { code: "KGS", name: "Kyrgyz som" },
  { code: "KZT", name: "Kazakh tenge" },
] as const;

export const CURRENCY_CODES: string[] = CURRENCIES.map((c) => c.code);
