"use client";

import { routes } from "@/lib/routes";
import { ChartPie, Map, Plus, ReceiptText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: routes.overview, label: "Overview", Icon: ChartPie },
  { href: routes.expenses, label: "Expenses", Icon: ReceiptText },
  { href: routes.app, label: "Add expense", Icon: Plus },
  { href: routes.trip, label: "Trip", Icon: Map },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+14px)] z-10 flex justify-center"
    >
      <ul
        className="flex items-center gap-2 rounded-full bg-pill p-1.5 shadow-[0_12px_32px_-10px_rgba(0,0,0,0.55)]"
        style={{ border: "1px solid var(--pill-line)" }}
      >
        {ITEMS.map(({ href, label, Icon }) => {
          const active = href === routes.app ? pathname === routes.app : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`flex size-[52px] items-center justify-center rounded-full transition-colors ${
                  active ? "bg-white text-[#0a0a0a]" : "text-white/70"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
