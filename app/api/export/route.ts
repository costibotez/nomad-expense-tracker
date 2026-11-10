import { asc, eq } from "drizzle-orm";
import { categoryOf } from "@/lib/constants";
import { db } from "@/lib/db";
import { expenses, legs } from "@/lib/db/schema";

function cell(value: string | number) {
  let s = String(value);
  // Stop spreadsheet programs from running a note as a formula.
  if (/^[=+\-@\t\r]/.test(s) && typeof value === "string") s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const rows = await db
    .select({
      date: expenses.date,
      category: expenses.category,
      note: expenses.note,
      amount: expenses.amount,
      currency: expenses.currency,
      rate: expenses.rate,
      amountEur: expenses.amountEur,
      country: legs.country,
      cities: legs.cities,
    })
    .from(expenses)
    .leftJoin(legs, eq(expenses.legId, legs.id))
    .orderBy(asc(expenses.date), asc(expenses.id));

  const header = ["Date", "Country", "Cities", "Category", "Note", "Amount", "Currency", "Rate per euro", "Amount in euro"];
  const lines = [header.join(",")].concat(
    rows.map((r) =>
      [
        r.date,
        cell(r.country ?? ""),
        cell(r.cities ?? ""),
        cell(categoryOf(r.category).label),
        cell(r.note),
        r.amount,
        r.currency,
        Number(r.rate),
        r.amountEur,
      ].join(","),
    ),
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nomad-expenses-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
