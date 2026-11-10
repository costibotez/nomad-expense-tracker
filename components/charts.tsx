import { formatCompact, formatEuro } from "@/lib/format";

export type BarItem = { key: string; label: string; icon?: string; value: number; detail?: string };

/** Horizontal bars for comparing amounts. One colour, since length carries the value. */
export function BarList({ items, total }: { items: BarItem[]; total: number }) {
  const max = Math.max(...items.map((i) => i.value), 0);
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const share = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <li key={item.key} title={`${item.label}: ${formatEuro(item.value)} (${share}%)`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">
                {item.icon && <span aria-hidden>{item.icon} </span>}
                {item.label}
              </span>
              <span className="tabular shrink-0">
                <span className="font-semibold">{formatEuro(item.value)}</span>
                <span className="ml-2 inline-block w-9 text-right text-xs text-muted">{share}%</span>
              </span>
            </div>
            <div className="mt-1 h-2.5 rounded-r bg-track" aria-hidden>
              <div
                className="h-full rounded-r bg-accent"
                style={{ width: max > 0 ? `${Math.max((item.value / max) * 100, 0.5)}%` : 0 }}
              />
            </div>
            {item.detail && <p className="tabular mt-1 text-xs text-muted">{item.detail}</p>}
          </li>
        );
      })}
    </ul>
  );
}

export type ColumnItem = { key: string; label: string; value: number };

/** Vertical columns for spending over time. */
export function ColumnChart({ items, label }: { items: ColumnItem[]; label: string }) {
  const max = Math.max(...items.map((i) => i.value), 0);
  return (
    <div role="img" aria-label={label}>
      <ul className="flex h-44 items-stretch gap-0.5 border-b border-line" aria-hidden>
        {items.map((item) => (
          <li
            key={item.key}
            className="flex min-w-0 flex-1 flex-col items-center justify-end"
            title={`${item.label}: ${formatEuro(item.value)}`}
          >
            <span className="tabular mb-1 text-[10px] leading-none text-muted">
              {item.value > 0 ? formatCompact(item.value) : ""}
            </span>
            <span
              className="w-full max-w-6 rounded-t bg-accent"
              style={{ height: max > 0 ? `${(item.value / max) * 82}%` : 0 }}
            />
          </li>
        ))}
      </ul>
      <ul className="mt-1 flex gap-0.5" aria-hidden>
        {items.map((item) => (
          <li key={item.key} className="min-w-0 flex-1 truncate text-center text-[10px] text-muted">
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
