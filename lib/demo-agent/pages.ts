/**
 * The /app screens the demo guide can open. Client-safe (no server imports):
 * the chat panel maps navigate calls to hrefs with it. Keep in sync with the
 * items in components/nav.tsx.
 */
import { routes } from "@/lib/routes";

export const APP_SCREENS = {
  overview: {
    href: routes.overview,
    label: "Overview",
    shows:
      "Trip card (swipe for one card per country), spent so far with cost per day, by category, by month, by country and by trip leg",
  },
  expenses: {
    href: routes.expenses,
    label: "Expenses",
    shows: "Every expense grouped by day with daily totals, filters by category and country, amount paid and its euro value",
  },
  trip: {
    href: routes.trip,
    label: "Trip",
    shows: "The itinerary: legs with country, places, dates, currency and cost so far; add, edit, reorder legs; share links",
  },
  add_expense: {
    href: routes.app,
    label: "Add expense",
    shows: "The quick entry form: amount, currency (picked from the date's leg), category, live euro preview, recent expenses with repeat",
  },
} as const;

export type AppScreen = keyof typeof APP_SCREENS;
export const APP_SCREEN_KEYS = Object.keys(APP_SCREENS) as [AppScreen, ...AppScreen[]];

/** Endpoints BotID protects (client tagging in the shell layout, check in the routes). */
export const DEMO_AGENT_PROTECTED_ROUTES = [
  { path: "/api/demo-agent", method: "POST" },
  { path: "/api/demo-agent/lead", method: "POST" },
];
