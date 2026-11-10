import { formatCompact, formatEuro } from "@/lib/format";

export type ColumnItem = { key: string; label: string; value: number };

/** Vertical columns for spending over time. */
export function ColumnChart({ items, label }: { items: ColumnItem[]; label: string }) {
  const max = Math.max(...items.map((i) => i.value), 0);
  return (
    <div role="img" aria-label={label}>
      <ul className="flex h-40 items-stretch gap-1" aria-hidden>
        {items.map((item) => (
          <li
            key={item.key}
            className="flex min-w-0 flex-1 flex-col items-center justify-end"
            title={`${item.label}: ${formatEuro(item.value)}`}
          >
            <span className="tabular mb-1.5 text-[10px] leading-none text-muted">
              {item.value > 0 ? formatCompact(item.value) : ""}
            </span>
            <span
              className="w-full max-w-7 rounded-t-lg rounded-b-sm bg-accent"
              style={{ height: max > 0 ? `${(item.value / max) * 80}%` : 0 }}
            />
          </li>
        ))}
      </ul>
      <ul className="mt-2 flex gap-1 border-t border-line pt-2" aria-hidden>
        {items.map((item) => (
          <li key={item.key} className="min-w-0 flex-1 truncate text-center text-[10px] text-muted">
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
