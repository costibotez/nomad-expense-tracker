# Nomad Expenses

A small mobile-first web app for tracking travel spending across countries and currencies. Every expense is stored in the currency that was paid and in euro, so totals per category, per country and per trip leg are always available.

## Features

- Add an expense in a few taps. The trip leg and currency follow the date.
- The exchange rate is looked up for the day of the expense and saved with it, so old totals never shift. You can type your own rate at any time.
- Expense list grouped by day with filters, editing and deleting.
- Dashboard with totals by category, by month, by country and by trip leg.
- Editable itinerary and a spreadsheet export.
- One password protects the whole app.

## Deploy on Vercel

1. Import this repository as a new Vercel project.
2. In the project, open Storage and add a Neon Postgres database. This sets `DATABASE_URL` for you.
3. In Settings, Environment Variables, add `APP_PASSWORD` with a long password of your choice.
4. Deploy. The build creates the tables and loads the itinerary the first time.
5. Open the site on your phone and choose Add to Home Screen.

## Run locally

Copy `.env.example` to `.env.local`, fill in both values, then:

```bash
npm install
npm run db:migrate
npm run dev
```

## Notes

- Built with Next.js, Tailwind, Drizzle and Postgres.
- Rates come from free public services (the fawazahmed0 currency data set with the open.er-api.com service as a fallback). No key is needed.
- After changing `lib/db/schema.ts`, run `npm run db:generate` and commit the new file in `drizzle`.
- The itinerary seed lives in `scripts/legs-seed.json` and is only loaded into an empty database.
