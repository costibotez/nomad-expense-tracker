"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isCorrectPassword, isValidSession, SESSION_COOKIE, sessionToken } from "@/lib/auth";
import { CATEGORY_IDS, CURRENCY_CODES } from "@/lib/constants";
import { db } from "@/lib/db";
import { expenses, legs } from "@/lib/db/schema";
import { isIsoDate } from "@/lib/format";
import { fetchRate } from "@/lib/rates";

export type FormState = { error?: string } | undefined;

async function requireSession() {
  const store = await cookies();
  if (!isValidSession(store.get(SESSION_COOKIE)?.value)) redirect("/login");
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Accepts both 12.50 and 12,50 and ignores spaces used as thousands separators. */
function parseNumber(raw: string) {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return NaN;
  return Number(cleaned);
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = sessionToken();
  if (!token) {
    return { error: "No password is configured. Set APP_PASSWORD in the project settings." };
  }
  if (!isCorrectPassword(text(formData, "password"))) {
    // Slow down guessing.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { error: "Wrong password." };
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function saveExpense(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();

  const idRaw = text(formData, "id");
  const id = idRaw ? Number(idRaw) : null;
  const amount = parseNumber(text(formData, "amount"));
  const currency = text(formData, "currency");
  const category = text(formData, "category");
  const date = text(formData, "date");
  const note = text(formData, "note").slice(0, 300);
  const legRaw = text(formData, "legId");
  const rateRaw = text(formData, "rate");

  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter an amount above zero." };
  if (amount >= 1e13) return { error: "That amount is too large." };
  if (!CURRENCY_CODES.includes(currency)) return { error: "Choose a currency." };
  if (!CATEGORY_IDS.includes(category)) return { error: "Choose a category." };
  if (!isIsoDate(date)) return { error: "Choose a valid date." };
  if (id !== null && !Number.isInteger(id)) return { error: "Unknown expense." };

  let legId: number | null = null;
  if (legRaw) {
    legId = Number(legRaw);
    const [leg] = Number.isInteger(legId)
      ? await db.select({ id: legs.id }).from(legs).where(eq(legs.id, legId))
      : [];
    if (!leg) return { error: "Choose a valid trip leg." };
  }

  let rate: number | null;
  if (currency === "EUR") {
    rate = 1;
  } else if (rateRaw) {
    rate = parseNumber(rateRaw);
    if (!Number.isFinite(rate) || rate <= 0) return { error: "The exchange rate must be above zero." };
  } else {
    rate = await fetchRate(currency, date);
    if (!rate) {
      return {
        error: `Could not look up the ${currency} rate. Type how many ${currency} one euro buys.`,
      };
    }
  }

  const amountEur = Math.round((amount / rate) * 100) / 100;
  if (amountEur >= 1e12) return { error: "That amount is too large." };

  const values = {
    date,
    amount: amount.toFixed(2),
    currency,
    category,
    note,
    legId,
    rate: rate.toFixed(8),
    amountEur: amountEur.toFixed(2),
  };

  let savedId = id;
  if (id === null) {
    const [row] = await db.insert(expenses).values(values).returning({ id: expenses.id });
    savedId = row.id;
  } else {
    const updated = await db
      .update(expenses)
      .set(values)
      .where(eq(expenses.id, id))
      .returning({ id: expenses.id });
    if (updated.length === 0) return { error: "This expense no longer exists." };
  }

  revalidatePath("/", "layout");
  redirect(id === null ? `/?saved=${savedId}` : "/expenses");
}

export async function deleteExpense(formData: FormData) {
  await requireSession();
  const id = Number(text(formData, "id"));
  if (Number.isInteger(id)) {
    await db.delete(expenses).where(eq(expenses.id, id));
  }
  revalidatePath("/", "layout");
  redirect("/expenses");
}

export async function updateLeg(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession();
  const id = Number(text(formData, "id"));
  const cities = text(formData, "cities").slice(0, 200);
  const startDate = text(formData, "startDate");
  const endDate = text(formData, "endDate");
  const currency = text(formData, "currency");

  if (!Number.isInteger(id)) return { error: "Unknown trip leg." };
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) return { error: "Choose valid dates." };
  if (endDate < startDate) return { error: "The end date is before the start date." };
  if (!CURRENCY_CODES.includes(currency)) return { error: "Choose a currency." };

  await db.update(legs).set({ cities, startDate, endDate, currency }).where(eq(legs.id, id));
  revalidatePath("/", "layout");
  redirect("/trip");
}
