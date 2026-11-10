"use client";

import { useActionState, useState } from "react";
import { deleteLeg, saveLeg } from "@/app/actions";
import { ConfirmButton } from "./confirm-button";

export type LegCountry = { code: string; name: string; flag: string; currency: string };
export type LegCurrency = { code: string; name: string };

export type LegFormLeg = {
  id: number;
  country: string;
  cities: string;
  startDate: string;
  endDate: string;
  currency: string;
};

export function LegForm({
  leg,
  countries,
  currencies,
  defaults,
  setup = false,
}: {
  leg?: LegFormLeg;
  countries: LegCountry[];
  currencies: { main: LegCurrency[]; other: LegCurrency[] };
  defaults?: { startDate: string; endDate: string };
  /** Used inside the first run walkthrough, which continues after the save. */
  setup?: boolean;
}) {
  const [state, action, pending] = useActionState(saveLeg, undefined);
  const initialCode = leg ? (countries.find((c) => c.name === leg.country)?.code ?? "") : "";
  const [code, setCode] = useState(initialCode);
  const [currency, setCurrency] = useState(leg?.currency ?? "EUR");
  // Picking a country suggests its currency until you choose one yourself.
  const [currencyTouched, setCurrencyTouched] = useState(Boolean(leg));

  const known = [...currencies.main, ...currencies.other].some((c) => c.code === currency);

  return (
    <div className={`flex flex-col gap-3 p-5 ${setup ? "" : "border-t border-line"}`}>
      <form action={action} className="flex flex-col gap-3">
        {leg && <input type="hidden" name="id" value={leg.id} />}
        {setup && <input type="hidden" name="from" value="setup" />}
        <label className="flex flex-col gap-1 text-sm font-medium">
          Country
          <select
            className="field"
            name="country"
            value={code}
            required
            onChange={(e) => {
              setCode(e.target.value);
              const picked = countries.find((c) => c.code === e.target.value);
              if (picked && !currencyTouched) setCurrency(picked.currency);
            }}
          >
            <option value="" disabled>
              Choose a country
            </option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Places
          <input
            className="field"
            name="cities"
            defaultValue={leg?.cities ?? ""}
            maxLength={200}
            placeholder="Cities or regions"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
            From
            <input
              className="field"
              type="date"
              name="startDate"
              defaultValue={leg?.startDate ?? defaults?.startDate}
              required
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
            To
            <input
              className="field"
              type="date"
              name="endDate"
              defaultValue={leg?.endDate ?? defaults?.endDate}
              required
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Default currency
          <select
            className="field"
            name="currency"
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              setCurrencyTouched(true);
            }}
          >
            {!known && <option value={currency}>{currency}</option>}
            <optgroup label="Trip currencies">
              {currencies.main.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}: {c.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="All currencies">
              {currencies.other.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}: {c.name}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        {state?.error && (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-full bg-accent font-semibold text-accent-ink disabled:opacity-60"
        >
          {pending ? "Saving" : leg ? "Save leg" : "Add leg"}
        </button>
      </form>
      {leg && (
        <form action={deleteLeg}>
          <input type="hidden" name="id" value={leg.id} />
          <ConfirmButton
            message="Delete this leg? Its expenses stay and become not tied to a leg."
            className="min-h-12 w-full rounded-full border border-line text-sm font-medium text-danger"
          >
            Delete leg
          </ConfirmButton>
        </form>
      )}
    </div>
  );
}
