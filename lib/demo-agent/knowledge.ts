/**
 * What the demo guide knows about the product. Restates the README, the
 * landing page (app/page.tsx) and the security page (app/security/page.tsx);
 * keep it in sync when those change. Plain data, no server imports.
 */
import { CATEGORIES, CURRENCIES } from "@/lib/constants";
import { DEPLOY_URL, NOMADWEALTH_URL } from "@/lib/brand";

export const PRODUCT_TOPICS = [
  "overview",
  "features",
  "currencies_and_rates",
  "privacy_and_security",
  "setup_and_cost",
  "sharing_and_export",
  "demo_mode",
  "roadmap",
  "nomadwealth_pro",
] as const;
export type ProductTopic = (typeof PRODUCT_TOPICS)[number];

const FACTS: Record<ProductTopic, unknown> = {
  overview: [
    "Nomad Expenses is a small, free, self-hosted, mobile-first web app for long trips across many countries and currencies.",
    "You log an expense in whatever currency you paid; it is converted to euro at that day's rate. You then see what the whole trip cost by category, month, country and trip leg.",
    "It was built for a real nine-month journey from Chiang Mai to Almaty through nine countries and nine currencies; the demo's sample trip is that itinerary.",
    "It is part of the NomadWealth family. It is free and needs no license key.",
    "There are no bank connections, no receipts scanning and no budgets yet: data is entered by hand in a few taps.",
  ],
  features: {
    quickEntry: [
      "Amount, category, save: three taps for a typical expense.",
      "The trip leg and currency follow the date: an expense dated during the Thailand leg picks Thailand and Thai baht on its own.",
      "Any expense can use another currency (flights and bookings are often in euro or dollars).",
      `Categories: ${CATEGORIES.map((c) => c.label).join(", ")}.`,
      "Live euro preview while typing, the five most recent expenses under the form, repeat any of them dated today in one tap, with Undo.",
      "Swipe an expense left to uncover a delete button.",
    ],
    expenseList: "Grouped by day with a total for each day, filters by category and country, tap to edit or delete; each row shows the amount paid and its euro value.",
    overview:
      "A card for the whole trip and one per country, swipe between them and every number follows: spent so far, cost per day, progress through the trip, by category (segmented bar and list), by month, by country and by trip leg. Light and dark mode follow the phone.",
    itinerary:
      "Editable legs: country, places, dates and default currency (suggested from 160+). Add, delete (expenses stay, untied), drag to reorder (dates follow). Current leg highlighted, each leg shows its cost so far. A first-run walkthrough asks for your name and first leg; a sample trip is one tap away.",
    feelsLikeAnApp: "Add to the phone home screen for a full-screen app with its own icon; large touch targets and a floating bottom navigation for one-handed use.",
  },
  currencies_and_rates: [
    `Currencies in the picker: ${CURRENCIES.map((c) => c.name).join(", ")}. Trip legs can be given any of 160+ currencies.`,
    "The rate is looked up for the date of the expense and saved with it, so old totals never shift when rates move.",
    "Three free rate sources are tried in turn (fawazahmed0 currency data via jsDelivr, then Cloudflare Pages, then open.er-api.com); none needs a key.",
    "No signal or no rate? Type your own rate, and switch back to the looked-up one at any time.",
    "All totals are in euro (the home currency).",
  ],
  privacy_and_security: [
    "Self-hosted: it runs on the owner's own Vercel and stores data in their own Postgres database (Neon). Nobody else, including NomadWealth, can see it.",
    "One shared password protects every page and data route (no individual accounts). Changing it signs every device out.",
    "No analytics, no trackers, no advertising and no third-party accounts in the app. The only outside requests are exchange-rate lookups, which carry a currency and a date, never amounts or notes.",
    "Share links show aggregate totals and charts only, never single expenses or notes; they can be revoked on the Trip screen.",
    "The tracker and share views ask search engines not to index them.",
    "The operator is responsible for their hosting, database access, backups and updates.",
  ],
  setup_and_cost: {
    price: "Free. No license key, no subscription. Vercel's and Neon's free tiers are enough for personal use.",
    deployUrl: DEPLOY_URL,
    steps: [
      "Press 'Deploy with Vercel': Vercel copies the repository to the visitor's own GitHub and Vercel, adds a Neon Postgres database and asks for APP_PASSWORD.",
      "Deploy. The build creates the tables; no terminal needed. Under 5 minutes.",
      "First sign-in opens a short walkthrough: your name, then your first trip leg (both skippable).",
      "Open the site on the phone, sign in and choose Add to Home Screen.",
    ],
    manualAlternative: "Import the repository on Vercel, add Neon from Storage, set APP_PASSWORD, deploy.",
  },
  sharing_and_export: [
    "Read-only share links: create one on the Trip screen and send it to family or friends. It opens trip totals and charts without a password and without any way to change data. Create many, switch any off at any time.",
    "Spreadsheet export: one CSV with every expense (date, country, places, category, note, amount paid, currency, rate and euro amount); opens in Excel, Numbers and Google Sheets.",
  ],
  demo_mode: [
    "This live demo is the real app with sample data and no password. Nothing can be changed: adding, editing or deleting is refused with a notice.",
    "All amounts in the demo are invented; the sample trip is dated around the day the demo was deployed.",
    "To keep your own expenses, deploy your own free copy.",
  ],
  roadmap: [
    "Planned, not available yet: offline entry that syncs when a connection returns; budgets per leg and per category; receipt photos attached to an expense.",
    "Never promise dates for these.",
  ],
  nomadwealth_pro: {
    what: "NomadWealth is the sister product: a self-hosted net-worth and investment cockpit for people whose money spans countries and currencies. It tracks stocks, ETFs, crypto, real estate, private loans, cash and businesses, on the buyer's own Vercel and Neon, so the vendor never sees the data.",
    price: "NomadWealth Pro is a one-time payment of €149 with free updates for life (prices can change with promotions; the site shows the current one). There is also a free Lite plan.",
    url: NOMADWEALTH_URL,
    fit: "Only relevant for visitors who also hold investments, property or loans to track. Nomad Expenses itself stays free and does not need it.",
  },
};

export function productInfo(topic: ProductTopic): unknown {
  return FACTS[topic];
}
