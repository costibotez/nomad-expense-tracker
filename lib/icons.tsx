import {
  BedDouble,
  Bus,
  Package,
  Pill,
  Plane,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  Utensils,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  flights: Plane,
  accommodation: BedDouble,
  food: Utensils,
  transport: Bus,
  activities: Ticket,
  visas: ShieldCheck,
  shopping: ShoppingBag,
  health: Pill,
  other: Package,
};

export function CategoryIcon({ id, size = 20 }: { id: string; size?: number }) {
  const Icon = CATEGORY_ICONS[id] ?? Package;
  return <Icon size={size} strokeWidth={1.75} aria-hidden />;
}
