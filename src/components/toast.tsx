"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { createContext, useCallback, useContext, useRef, useState } from "react";

import { spring } from "@/lib/motion";

type ToastFn = (message: string) => void;
const ToastContext = createContext<ToastFn>(() => {});

export const useToast = () => useContext(ToastContext);

/** Aviso curto de confirmação. Usa a mesma palavra da ação: "Salvar" → "Despesa salva". */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback<ToastFn>((message) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message });
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 sm:bottom-8"
      >
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={spring}
              className="pointer-events-auto flex items-center gap-2 rounded-full bg-foreground py-2.5 pr-5 pl-3 text-sm font-medium text-background shadow-lg"
            >
              <span className="grid size-5 place-items-center rounded-full bg-income text-white">
                <Check className="size-3" strokeWidth={3} />
              </span>
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
