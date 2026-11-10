"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { TripCard } from "./ui";

export type CarouselItem = {
  key: string;
  href: string;
  label: string;
  name: string;
  mark: string;
  markCaption: string;
};

/**
 * Swipe between the whole trip and each country. Settling on a card opens it,
 * so the totals below always match the card in front.
 */
export function CardCarousel({ items, activeKey }: { items: CarouselItem[]; activeKey: string }) {
  const router = useRouter();
  const scroller = useRef<HTMLUListElement>(null);
  const settled = useRef(activeKey);

  // Bring the selected card into view, instantly on first load and smoothly after.
  const firstRun = useRef(true);
  useEffect(() => {
    settled.current = activeKey;
    const list = scroller.current;
    const target = list?.querySelector<HTMLElement>(`[data-key="${CSS.escape(activeKey)}"]`);
    if (!list || !target) return;
    const left = target.offsetLeft - (list.clientWidth - target.clientWidth) / 2;
    list.scrollTo({ left, behavior: firstRun.current ? "instant" : "smooth" });
    firstRun.current = false;
  }, [activeKey]);

  useEffect(() => {
    const list = scroller.current;
    if (!list) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const middle = list.scrollLeft + list.clientWidth / 2;
        let best: HTMLElement | null = null;
        let bestDistance = Infinity;
        for (const child of list.children as HTMLCollectionOf<HTMLElement>) {
          const distance = Math.abs(child.offsetLeft + child.clientWidth / 2 - middle);
          if (distance < bestDistance) {
            best = child;
            bestDistance = distance;
          }
        }
        const key = best?.dataset.key;
        const item = items.find((i) => i.key === key);
        if (item && key !== settled.current) {
          settled.current = key!;
          router.replace(item.href, { scroll: false });
        }
      }, 160);
    };
    list.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      list.removeEventListener("scroll", onScroll);
    };
  }, [items, router]);

  return (
    <ul
      ref={scroller}
      aria-label="Trip and countries"
      className="no-scrollbar -mx-5 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[7%]"
    >
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <li key={item.key} data-key={item.key} className="w-[86%] shrink-0 snap-center">
            <Link
              href={item.href}
              scroll={false}
              replace
              aria-current={active ? "true" : undefined}
              aria-label={`${item.label}: show totals`}
              className={`block transition-opacity ${active ? "" : "opacity-60"}`}
            >
              <TripCard
                label={item.label}
                name={item.name}
                mark={item.mark}
                markCaption={item.markCaption}
                stacked
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
