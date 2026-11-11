"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

import { easeOut, spring } from "@/lib/motion";

/**
 * Diálogo animado. No celular é uma folha que sobe da base da tela;
 * no desktop, uma caixa centralizada que "cresce" levemente.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: easeOut }}
              />
            </DialogPrimitive.Overlay>
            <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
              <DialogPrimitive.Content asChild forceMount aria-describedby={undefined}>
                <motion.div
                  layoutRoot
                  className="pointer-events-auto relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-card p-6 shadow-2xl outline-none sm:max-w-md sm:rounded-[28px]"
                  initial={{ opacity: 0, y: 48, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 32, scale: 0.98 }}
                  transition={spring}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <DialogPrimitive.Title className="font-display text-xl font-semibold tracking-tight">
                      {title}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Close
                      aria-label="Fechar"
                      className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <X className="size-5" />
                    </DialogPrimitive.Close>
                  </div>
                  {children}
                </motion.div>
              </DialogPrimitive.Content>
            </div>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
