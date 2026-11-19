/**
 * Read-only views of the live demo's sample trip for the guide. Same tables
 * the screens read; in demo mode they hold only the invented sample data that
 * scripts/demo-seed.mjs writes. The guide route refuses to run outside demo
 * mode, so this never reads a personal install's expenses.
 */
import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { categoryOf } from "@/lib/constants";
import { db } from "@/lib/db";
import { expenses, legs } from "@/lib/db/schema";
import { daysBetween } from "@/lib/format";
import { getLegs, serverToday } from "@/lib/queries";

export const DEMO_SECTIONS = ["trip_summary", "by_category", "by_month", "by_country", "legs", "recent_expenses"] as const;
export type DemoSection = (typeof DEMO_SECTIONS)[number];

const total = sql<string>`coalesce(sum(${expenses.amountEur}), 0)`;
const count = sql<number>`count(*)::int`;
const month = sql<string>`to_char(${expenses.date}, 'YYYY-MM')`;
const eur = (v: string | number) => Math.round(Number(v) * 100) / 100;

async function legRows() {
  const [allLegs, byLeg] = await Promise.all([
    getLegs(),
    db.select({ legId: expenses.legId, total, count }).from(expenses).groupBy(expenses.legId),
  ]);
  const totals = new Map(byLeg.map((r) => [r.legId, { total: eur(r.total), count: r.count }]));
  const today = serverToday();
  return {
    today,
    noLeg: totals.get(null) ?? { total: 0, count: 0 },
    legs: allLegs.map((l) => {
      const elapsed = today < l.startDate ? 0 : daysBetween(l.startDate, today < l.endDate ? today : l.endDate);
      return {
        country: l.country,
        places: l.cities,
        currency: l.currency,
        startDate: l.startDate,
        endDate: l.endDate,
        days: daysBetween(l.startDate, l.endDate),
        daysElapsed: elapsed,
        status: today < l.startDate ? "upcoming" : today > l.endDate ? "done" : "current",
        spentEur: totals.get(l.id)?.total ?? 0,
        expenses: totals.get(l.id)?.count ?? 0,
      };
    }),
  };
}

export async function demoSection(section: DemoSection): Promise<unknown> {
  switch (section) {
    case "legs":
      return (await legRows()).legs;
    case "trip_summary": {
      const { today, legs: rows, noLeg } = await legRows();
      const spent = eur(rows.reduce((s, l) => s + l.spentEur, 0) + noLeg.total);
      const elapsed = rows.reduce((s, l) => s + l.daysElapsed, 0);
      const current = rows.find((l) => l.status === "current");
      return {
        today,
        start: rows[0]?.startDate,
        end: rows[rows.length - 1]?.endDate,
        tripDays: rows.reduce((s, l) => s + l.days, 0),
        daysElapsed: elapsed,
        countries: [...new Set(rows.map((l) => l.country))].length,
        currencies: [...new Set(rows.map((l) => l.currency))],
        spentSoFarEur: spent,
        costPerDayEur: elapsed > 0 ? eur(spent / elapsed) : null,
        currentLeg: current ? `${current.country} (${current.places})` : null,
        expenseCount: rows.reduce((s, l) => s + l.expenses, 0) + noLeg.count,
      };
    }
    case "by_category": {
      const rows = await db.select({ category: expenses.category, total, count }).from(expenses).groupBy(expenses.category);
      return rows
        .map((r) => ({ category: categoryOf(r.category).label, totalEur: eur(r.total), expenses: r.count }))
        .sort((a, b) => b.totalEur - a.totalEur);
    }
    case "by_month": {
      const rows = await db.select({ month, total }).from(expenses).groupBy(month).orderBy(month);
      return rows.map((r) => ({ month: r.month, totalEur: eur(r.total) }));
    }
    case "by_country": {
      const rows = await db
        .select({ country: legs.country, total, count })
        .from(expenses)
        .leftJoin(legs, eq(expenses.legId, legs.id))
        .groupBy(legs.country);
      return rows
        .map((r) => ({ country: r.country ?? "Not tied to a leg", totalEur: eur(r.total), expenses: r.count }))
        .sort((a, b) => b.totalEur - a.totalEur);
    }
    case "recent_expenses": {
      const rows = await db
        .select({
          date: expenses.date,
          amount: expenses.amount,
          currency: expenses.currency,
          amountEur: expenses.amountEur,
          category: expenses.category,
          note: expenses.note,
          country: legs.country,
        })
        .from(expenses)
        .leftJoin(legs, eq(expenses.legId, legs.id))
        .orderBy(desc(expenses.date), desc(expenses.id))
        .limit(12);
      return rows.map((r) => ({
        ...r,
        amount: Number(r.amount),
        amountEur: eur(r.amountEur),
        category: categoryOf(r.category).label,
      }));
    }
  }
}
