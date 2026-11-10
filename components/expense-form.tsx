"use client";

import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import { saveExpense } from "@/app/actions";
import { CATEGORIES, CURRENCIES } from "@/lib/constants";
import { formatEuro, formatShortDate } from "@/lib/format";

export type FormLeg = {
  id: number;
  country: string;
  flag: string;
  cities: string;
  startDate: string;
  endDate: string;
  currency: string;
};

export type FormExpense = {
  id: number;
  date: string;
  amount: string;
  currency: string;
  category: string;
  note: string;
  legId: number | null;
  rate: string;
};

function localToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

const subscribeNever = () => () => {};

function parseNumber(raw: string) {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  return /^\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : NaN;
}

function trimRate(rate: number) {
  return String(Number(rate.toPrecision(8)));
}

type Lookup = { key: string; rate: number | null };

export function ExpenseForm({
  legs,
  expense,
  serverToday,
}: {
  legs: FormLeg[];
  expense?: FormExpense;
  serverToday: string;
}) {
  const [state, action, pending] = useActionState(saveExpense, undefined);

  // The phone knows the local calendar date, the server only knows its own.
  const today = useSyncExternalStore(subscribeNever, localToday, () => serverToday);

  const [amount, setAmount] = useState(expense ? String(Number(expense.amount)) : "");
  const [category, setCategory] = useState(expense?.category ?? "");
  const [note, setNote] = useState(expense?.note ?? "");
  const [dateChoice, setDateChoice] = useState<string | null>(expense?.date ?? null);
  // undefined means "follow the date", null means "not tied to a leg".
  const [legChoice, setLegChoice] = useState<number | null | undefined>(
    expense ? expense.legId : undefined,
  );
  const [currencyChoice, setCurrencyChoice] = useState<string | null>(expense?.currency ?? null);
  const [rateChoice, setRateChoice] = useState<string | null>(
    expense && expense.currency !== "EUR" ? trimRate(Number(expense.rate)) : null,
  );
  const [lookup, setLookup] = useState<Lookup | null>(null);

  const date = dateChoice ?? today;
  const legByDate = legs.find((l) => l.startDate <= date && date <= l.endDate) ?? null;
  const legId = legChoice === undefined ? (legByDate?.id ?? null) : legChoice;
  const leg = legs.find((l) => l.id === legId) ?? null;
  const currency = currencyChoice ?? leg?.currency ?? "EUR";

  const lookupKey = `${currency}|${date}`;
  const needsLookup = currency !== "EUR" && rateChoice === null;

  useEffect(() => {
    if (!needsLookup) return;
    const [lookupCurrency, lookupDate] = lookupKey.split("|");
    const controller = new AbortController();
    fetch(`/api/rate?currency=${lookupCurrency}&date=${lookupDate}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { rate: null }))
      .then((json: { rate: number | null }) => setLookup({ key: lookupKey, rate: json.rate }))
      .catch((error: unknown) => {
        if ((error as Error).name !== "AbortError") setLookup({ key: lookupKey, rate: null });
      });
    return () => controller.abort();
  }, [lookupKey, needsLookup]);

  const lookupDone = lookup?.key === lookupKey;
  const lookedUpRate = lookupDone ? lookup.rate : null;
  const rateText =
    currency === "EUR" ? "1" : (rateChoice ?? (lookedUpRate ? trimRate(lookedUpRate) : ""));
  const rate = parseNumber(rateText);
  const amountNumber = parseNumber(amount);
  const euro =
    Number.isFinite(amountNumber) && Number.isFinite(rate) && rate > 0 ? amountNumber / rate : null;

  let rateHint = "";
  if (currency !== "EUR") {
    if (rateChoice !== null) rateHint = "Your own rate";
    else if (!lookupDone) rateHint = "Looking up the rate";
    else if (lookedUpRate) rateHint = `Rate for ${formatShortDate(date)}`;
    else rateHint = "No rate found, type it in";
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {expense && <input type="hidden" name="id" value={expense.id} />}
      <input type="hidden" name="category" value={category} />

      <div className="card p-4">
        <div className="flex gap-2">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium">
            Amount
            <input
              className="field tabular text-2xl font-semibold"
              style={{ fontSize: 24 }}
              name="amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <label className="flex w-28 flex-col gap-1 text-sm font-medium">
            Currency
            <select
              className="field h-full"
              name="currency"
              value={currency}
              onChange={(e) => {
                setCurrencyChoice(e.target.value);
                setRateChoice(null);
              }}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="tabular mt-2 min-h-5 text-sm text-muted" aria-live="polite">
          {currency === "EUR"
            ? "Paid in euro"
            : euro !== null
              ? `About ${formatEuro(euro)}`
              : CURRENCIES.find((c) => c.code === currency)?.name}
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Category</legend>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((c) => {
            const selected = c.id === category;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(c.id)}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-center text-xs leading-tight ${
                  selected
                    ? "border-accent bg-accent font-semibold text-accent-ink"
                    : "border-line bg-surface text-ink"
                }`}
              >
                <span aria-hidden className="text-lg">
                  {c.icon}
                </span>
                {c.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Note
        <input
          className="field"
          name="note"
          maxLength={300}
          autoComplete="off"
          placeholder="Optional"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
          Date
          <input
            className="field"
            type="date"
            name="date"
            value={date}
            onChange={(e) => {
              setDateChoice(e.target.value || null);
              if (!expense) {
                // A new date may fall in another leg with another currency.
                setLegChoice(undefined);
              }
            }}
            required
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
          Trip leg
          <select
            className="field"
            name="legId"
            value={legId ?? ""}
            onChange={(e) => {
              setLegChoice(e.target.value ? Number(e.target.value) : null);
              if (!expense) {
                setCurrencyChoice(null);
                setRateChoice(null);
              }
            }}
          >
            <option value="">Not tied to a leg</option>
            {legs.map((l) => (
              <option key={l.id} value={l.id}>
                {l.flag} {l.country}: {l.cities} ({formatShortDate(l.startDate)})
              </option>
            ))}
          </select>
        </label>
      </div>

      {currency !== "EUR" && (
        <label className="flex flex-col gap-1 text-sm font-medium">
          {currency} for one euro
          <input
            className="field tabular"
            name="rate"
            inputMode="decimal"
            autoComplete="off"
            value={rateText}
            onChange={(e) => setRateChoice(e.target.value)}
          />
          <span className="flex items-center justify-between text-xs font-normal text-muted">
            <span aria-live="polite">{rateHint}</span>
            {rateChoice !== null && (
              <button type="button" className="underline" onClick={() => setRateChoice(null)}>
                Look up the rate again
              </button>
            )}
          </span>
        </label>
      )}

      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-xl bg-accent text-base font-semibold text-accent-ink disabled:opacity-60"
      >
        {pending ? "Saving" : expense ? "Save changes" : "Add expense"}
      </button>
    </form>
  );
}
