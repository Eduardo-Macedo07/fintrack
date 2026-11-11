"use client";

import { motion } from "motion/react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useTransactionDialog } from "@/features/transactions/components/transaction-dialog";
import { cn } from "@/lib/utils";

import { NAV_ITEMS } from "./nav-items";

/** Barra de abas do celular, com o botão "+" sempre ao alcance do polegar. */
export function BottomNav() {
  const pathname = usePathname();
  const { openNew } = useTransactionDialog();
  const [first, second, third] = NAV_ITEMS;

  const tab = (item: (typeof NAV_ITEMS)[number]) => {
    const active = pathname.startsWith(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors outline-none focus-visible:text-foreground",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="size-6" strokeWidth={active ? 2.4 : 2} />
        {item.label}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 items-end px-2">
        {tab(first)}
        {tab(second)}
        <div className="flex justify-center">
          <motion.button
            type="button"
            aria-label="Nova transação"
            onClick={() => openNew()}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.04 }}
            className="-mt-6 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Plus className="size-7" strokeWidth={2.4} />
          </motion.button>
        </div>
        {tab(third)}
      </div>
    </nav>
  );
}
