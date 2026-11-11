import { LayoutDashboard, ListOrdered } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/transactions", label: "Transações", icon: ListOrdered },
] as const;
