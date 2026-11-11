import { LayoutDashboard, ListOrdered, PiggyBank } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/transactions", label: "Transações", icon: ListOrdered },
  { href: "/plan", label: "Planejar", icon: PiggyBank },
] as const;
