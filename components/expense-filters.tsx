"use client";

type Option = { value: string; label: string };

/** Two dropdowns that apply as soon as one changes. Without scripts the Filter button still works. */
export function ExpenseFilters({
  category,
  country,
  categories,
  countries,
  noLegValue,
}: {
  category: string;
  country: string;
  categories: Option[];
  countries: Option[];
  noLegValue: string;
}) {
  return (
    <form method="get" className="grid grid-cols-2 gap-2">
      <select
        className="field"
        name="category"
        defaultValue={category}
        aria-label="Category"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <select
        className="field"
        name="country"
        defaultValue={country}
        aria-label="Country"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="">All countries</option>
        {countries.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
        <option value={noLegValue}>Not tied to a leg</option>
      </select>
      <noscript>
        <button className="col-span-2 min-h-12 w-full rounded-full bg-accent font-semibold text-accent-ink">
          Filter
        </button>
      </noscript>
    </form>
  );
}
