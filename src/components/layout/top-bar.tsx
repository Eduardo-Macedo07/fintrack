"use client";

import { LayoutGroup, motion } from "motion/react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { useTransactionDialog } from "@/features/transactions/components/transaction-dialog";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { NAV_ITEMS } from "./nav-items";

export function Wordmark() {
  return (
    <Link
      href="/dashboard"
      className="font-display flex items-center gap-2 text-xl font-bold tracking-tight"
    >
      <span aria-hidden className="size-3 rounded-full bg-primary" />
      fintrack
    </Link>
  );
}

export function TopBar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const { openNew } = useTransactionDialog();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-4 px-4">
        <Wordmark />

        <LayoutGroup id="top-nav">
          <nav aria-label="Principal" className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      transition={spring}
                      className="absolute inset-0 -z-10 rounded-full bg-muted"
                    />
                  )}
                  {label}
                </Link>
              );
            })}
          </nav>
        </LayoutGroup>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => openNew()}
            className="hidden rounded-full sm:inline-flex"
          >
            <Plus /> Nova transação
          </Button>
          <span className="hidden max-w-32 truncate text-sm text-muted-foreground md:inline">
            {userName}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
