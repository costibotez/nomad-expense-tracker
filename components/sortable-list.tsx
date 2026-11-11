"use client";

import { startTransition, useEffect, useOptimistic, useRef, useState } from "react";

/** How long a finger rests on a row before the row lifts. */
const HOLD_MS = 280;
/** Movement that turns a press into a scroll or a tap instead of a hold. */
const SLOP = 8;
/** Distance from the screen edge where a drag starts to scroll the page. */
const EDGE = 88;
const SETTLE_MS = 200;

type Drag = {
  id: number;
  from: number;
  to: number;
  /** How far the lifted row has moved from its place. */
  dy: number;
  heights: number[];
  /** True once the finger is up and the row glides into its new place. */
  settling: boolean;
};

type Gesture = {
  id: number;
  pointerId: number;
  startY: number;
  startScroll: number;
  lastY: number;
  timer: number | null;
  frame: number | null;
  /** Removes the window listeners of this gesture. */
  stop: () => void;
  tops: number[];
  heights: number[];
  active: boolean;
};

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

/**
 * A list whose rows can be dragged into a new order. A row lifts when you
 * drag the element marked with data-drag-handle, or press and hold its
 * summary. On the handle the up and down arrow keys move the row too.
 */
export function SortableList({
  items,
  footer,
  reorderAction,
  className,
}: {
  items: { id: number; label: string; content: React.ReactNode }[];
  /** A last row that stays in place. */
  footer?: React.ReactNode;
  reorderAction: (ids: number[]) => Promise<void>;
  className?: string;
}) {
  const [order, setOrder] = useOptimistic(items.map((item) => item.id));
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const suppressClick = useRef(false);

  const byId = new Map(items.map((item) => [item.id, item]));
  const shown = order.flatMap((id) => byId.get(id) ?? []);

  const update = (next: Drag | null) => {
    dragRef.current = next;
    setDrag(next);
  };

  const commit = (ids: number[]) => {
    startTransition(async () => {
      setOrder(ids);
      await reorderAction(ids);
    });
  };

  // A touch that has lifted a row must not scroll the page as well.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const block = (event: TouchEvent) => {
      if (gesture.current?.active) event.preventDefault();
    };
    list.addEventListener("touchmove", block, { passive: false });
    return () => list.removeEventListener("touchmove", block);
  }, []);

  useEffect(() => () => endGesture(), []);

  function endGesture() {
    const g = gesture.current;
    if (!g) return;
    if (g.timer !== null) window.clearTimeout(g.timer);
    if (g.frame !== null) cancelAnimationFrame(g.frame);
    g.stop();
    gesture.current = null;
  }

  function rows() {
    return Array.from(listRef.current?.querySelectorAll<HTMLElement>(":scope > li[data-sortable-id]") ?? []);
  }

  function lift() {
    const g = gesture.current;
    if (!g) return;
    g.timer = null;
    const elements = rows();
    const from = elements.findIndex((el) => Number(el.dataset.sortableId) === g.id);
    if (from < 0) return endGesture();
    // An open row closes, so the row that moves is the short one.
    elements[from].querySelector("details")?.removeAttribute("open");
    const rects = elements.map((el) => el.getBoundingClientRect());
    g.tops = rects.map((rect) => rect.top + window.scrollY);
    g.heights = rects.map((rect) => rect.height);
    g.active = true;
    suppressClick.current = true;
    window.getSelection()?.removeAllRanges();
    update({ id: g.id, from, to: from, dy: 0, heights: g.heights, settling: false });
    g.frame = requestAnimationFrame(tick);
  }

  function follow() {
    const g = gesture.current;
    const d = dragRef.current;
    if (!g || !d || d.settling) return;
    const last = g.tops.length - 1;
    const raw = g.lastY - g.startY + (window.scrollY - g.startScroll);
    const dy = Math.max(
      g.tops[0] - g.tops[d.from],
      Math.min(g.tops[last] + g.heights[last] - g.tops[d.from] - g.heights[d.from], raw),
    );
    // The row takes a new place once its leading edge passes the middle of a neighbour.
    const top = g.tops[d.from] + dy;
    const bottom = top + g.heights[d.from];
    let to = d.from;
    for (let j = d.from - 1; j >= 0 && top < g.tops[j] + g.heights[j] / 2; j--) to = j;
    for (let j = d.from + 1; j <= last && bottom > g.tops[j] + g.heights[j] / 2; j++) to = j;
    if (dy !== d.dy || to !== d.to) update({ ...d, dy, to });
  }

  // Runs while a row is lifted, so the page scrolls when the row nears an edge.
  function tick() {
    const g = gesture.current;
    if (!g?.active) return;
    const fromBottom = window.innerHeight - g.lastY;
    if (g.lastY < EDGE) window.scrollBy(0, -Math.ceil((EDGE - g.lastY) / 6));
    else if (fromBottom < EDGE) window.scrollBy(0, Math.ceil((EDGE - fromBottom) / 6));
    follow();
    g.frame = requestAnimationFrame(tick);
  }

  function onMove(event: PointerEvent) {
    const g = gesture.current;
    if (!g || event.pointerId !== g.pointerId) return;
    g.lastY = event.clientY;
    if (g.active) return follow();
    // Moving before the row lifts means a scroll, not a drag.
    if (Math.abs(event.clientY - g.startY) > SLOP) endGesture();
  }

  function onUp(event: PointerEvent) {
    const g = gesture.current;
    if (!g || event.pointerId !== g.pointerId) return;
    finish(true);
  }

  function onCancel(event: PointerEvent) {
    const g = gesture.current;
    if (!g || event.pointerId !== g.pointerId) return;
    finish(false);
  }

  function finish(keep: boolean) {
    const active = gesture.current?.active;
    const d = dragRef.current;
    endGesture();
    if (!active || !d) return;
    const to = keep ? d.to : d.from;
    // Glide to the exact place, then hand the new order over.
    let dy = 0;
    for (let j = d.from + 1; j <= to; j++) dy += d.heights[j];
    for (let j = to; j < d.from; j++) dy -= d.heights[j];
    update({ ...d, to, dy, settling: true });
    window.setTimeout(() => {
      const ids = move(order, d.from, to);
      update(null);
      if (to !== d.from) {
        commit(ids);
        setAnnouncement(`${byId.get(d.id)?.label ?? "Row"} moved to place ${to + 1} of ${ids.length}.`);
      }
      // The click that follows a drag has fired by now.
      window.setTimeout(() => (suppressClick.current = false), 50);
    }, SETTLE_MS);
  }

  function onPointerDown(event: React.PointerEvent<HTMLOListElement>) {
    if (gesture.current || dragRef.current || shown.length < 2) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target as HTMLElement;
    const row = target.closest<HTMLElement>("li[data-sortable-id]");
    if (!row || row.parentElement !== listRef.current) return;
    const handle = target.closest("[data-drag-handle]");
    if (!handle && !target.closest("summary")) return;

    gesture.current = {
      id: Number(row.dataset.sortableId),
      pointerId: event.pointerId,
      startY: event.clientY,
      startScroll: window.scrollY,
      lastY: event.clientY,
      timer: null,
      frame: null,
      stop: () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
      },
      tops: [],
      heights: [],
      active: false,
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    // The handle lifts the row at once. Anywhere else it takes a short hold.
    if (handle) lift();
    else gesture.current.timer = window.setTimeout(lift, HOLD_MS);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLOListElement>) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    const target = event.target as HTMLElement;
    if (!target.closest("[data-drag-handle]") || dragRef.current) return;
    const row = target.closest<HTMLElement>("li[data-sortable-id]");
    const from = order.indexOf(Number(row?.dataset.sortableId));
    if (from < 0) return;
    event.preventDefault();
    const to = from + (event.key === "ArrowUp" ? -1 : 1);
    if (to < 0 || to >= order.length) return;
    commit(move(order, from, to));
    setAnnouncement(`${byId.get(order[from])?.label ?? "Row"} moved to place ${to + 1} of ${order.length}.`);
  }

  return (
    <>
      <ol
        ref={listRef}
        className={className}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        onContextMenu={(event) => {
          // A long press on a phone must lift the row, not open a menu.
          if (gesture.current || dragRef.current) event.preventDefault();
        }}
        onClickCapture={(event) => {
          const onHandle = (event.target as HTMLElement).closest("[data-drag-handle]");
          // The handle never opens the row, and neither does the end of a drag.
          if (onHandle || suppressClick.current) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        {shown.map((item, index) => {
          const lifted = drag?.id === item.id;
          let shift = 0;
          if (drag && !lifted) {
            if (index >= drag.to && index < drag.from) shift = drag.heights[drag.from];
            else if (index <= drag.to && index > drag.from) shift = -drag.heights[drag.from];
          }
          return (
            <li
              key={item.id}
              data-sortable-id={item.id}
              className={`relative bg-surface ${lifted ? "z-10 rounded-2xl" : ""}`}
              style={
                drag
                  ? {
                      transform: `translateY(${lifted ? drag.dy : shift}px)${lifted && !drag.settling ? " scale(1.02)" : ""}`,
                      transition: lifted
                        ? drag.settling
                          ? `transform ${SETTLE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow ${SETTLE_MS}ms`
                          : "box-shadow 150ms"
                        : `transform ${SETTLE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
                      boxShadow: lifted && !drag.settling ? "0 14px 32px -10px rgba(0, 0, 0, 0.35)" : undefined,
                      userSelect: "none",
                      WebkitUserSelect: "none",
                    }
                  : undefined
              }
            >
              {item.content}
            </li>
          );
        })}
        {footer}
      </ol>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
