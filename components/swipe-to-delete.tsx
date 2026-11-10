"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { deleteExpense } from "@/app/actions";

/** Width of the delete button that the swipe uncovers. */
const REVEAL = 88;

function DeleteButton({ label, onFocus, onBlur }: { label: string; onFocus: () => void; onBlur: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={label}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{ width: REVEAL }}
      className="flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold text-surface disabled:opacity-60"
    >
      <Trash2 size={18} aria-hidden />
      {pending ? "Deleting" : "Delete"}
    </button>
  );
}

/**
 * Swipe a row to the left to uncover a delete button. The swipe only uncovers
 * it, a tap on the button does the deleting, so a stray swipe removes nothing.
 */
export function SwipeToDelete({
  id,
  label,
  category = "",
  country = "",
  children,
}: {
  id: number;
  label: string;
  /** The filters in use, so the list comes back the same after the delete. */
  category?: string;
  country?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // Offset while a finger is down. Null means the row rests open or closed.
  const [drag, setDrag] = useState<number | null>(null);
  const gesture = useRef<{ x: number; y: number; from: number; swiping: boolean } | null>(null);
  const moved = useRef(false);

  const offset = drag ?? (open ? -REVEAL : 0);
  // 0 while closed, 1 once the delete button is fully uncovered.
  const progress = Math.min(1, -offset / REVEAL);

  return (
    <div className="relative overflow-hidden">
      {/* The whole row turns red behind the expense and fades in with the swipe. */}
      <form
        action={deleteExpense}
        className="absolute inset-0 flex justify-end bg-danger"
        style={{
          opacity: progress,
          transition: drag === null ? "opacity 180ms ease-out" : "none",
        }}
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="category" value={category} />
        <input type="hidden" name="country" value={country} />
        {/* Focus opens the row so the button is never used while hidden. */}
        <DeleteButton label={label} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} />
      </form>
      <div
        className="relative touch-pan-y bg-surface"
        style={{
          transform: `translateX(${offset}px)`,
          transition: drag === null ? "transform 180ms ease-out" : "none",
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse" && event.button !== 0) return;
          gesture.current = { x: event.clientX, y: event.clientY, from: open ? -REVEAL : 0, swiping: false };
          moved.current = false;
        }}
        onPointerMove={(event) => {
          const g = gesture.current;
          if (!g) return;
          const dx = event.clientX - g.x;
          const dy = event.clientY - g.y;
          if (!g.swiping) {
            if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
            g.swiping = true;
            moved.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          setDrag(Math.max(-REVEAL, Math.min(0, g.from + dx)));
        }}
        onPointerUp={() => {
          if (gesture.current?.swiping) setOpen((drag ?? 0) < -REVEAL / 2);
          gesture.current = null;
          setDrag(null);
        }}
        onPointerCancel={() => {
          gesture.current = null;
          setDrag(null);
        }}
        onDragStart={(event) => event.preventDefault()}
        onClickCapture={(event) => {
          // A swipe must not open the expense, and a tap on an open row closes it.
          if (moved.current || open) {
            event.preventDefault();
            event.stopPropagation();
            if (!moved.current) setOpen(false);
            moved.current = false;
          }
        }}
      >
        {children}
        {/* A red wash over the expense itself, so the whole row reads as red. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-danger"
          style={{
            opacity: progress * 0.16,
            transition: drag === null ? "opacity 180ms ease-out" : "none",
          }}
        />
      </div>
    </div>
  );
}
