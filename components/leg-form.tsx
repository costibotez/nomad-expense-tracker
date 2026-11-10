"use client";

import { useActionState } from "react";
import { updateLeg } from "@/app/actions";
import { CURRENCIES } from "@/lib/constants";
import type { FormLeg } from "./expense-form";

export function LegForm({ leg }: { leg: FormLeg }) {
  const [state, action, pending] = useActionState(updateLeg, undefined);
  return (
    <form action={action} className="flex flex-col gap-3 border-t border-line p-5">
      <input type="hidden" name="id" value={leg.id} />
      <label className="flex flex-col gap-1 text-sm font-medium">
        Places
        <input className="field" name="cities" defaultValue={leg.cities} maxLength={200} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
          From
          <input className="field" type="date" name="startDate" defaultValue={leg.startDate} required />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
          To
          <input className="field" type="date" name="endDate" defaultValue={leg.endDate} required />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Default currency
        <select className="field" name="currency" defaultValue={leg.currency}>
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}: {c.name}
            </option>
          ))}
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
        {pending ? "Saving" : "Save leg"}
      </button>
    </form>
  );
}
