"use client";

import { Bell, CircleAlert, CircleCheck, Info, X } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "info" | "notification";
type Toast = { id: number; title: string; description?: string; tone: Tone; href?: string };
type PushToast = (toast: { title: string; description?: string; tone?: Tone; href?: string }) => void;

const ToastContext = createContext<PushToast>(() => {});

const ICONS = {
  success: <CircleCheck className="h-4 w-4 text-emerald-500" />,
  error: <CircleAlert className="h-4 w-4 text-red-500" />,
  info: <Info className="h-4 w-4 text-indigo-500" />,
  notification: <Bell className="h-4 w-4 text-indigo-500" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const push = useCallback<PushToast>(
    (toast) => {
      const id = Date.now() + Math.random();
      setToasts((all) => [...all.slice(-3), { tone: "info", ...toast, id }]);
      setTimeout(() => dismiss(id), toast.tone === "notification" ? 6000 : 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const body = (
            <>
              <span className="mt-0.5">{ICONS[t.tone]}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-gray-900">{t.title}</span>
                {t.description && <span className="mt-0.5 block text-[13px] text-gray-600">{t.description}</span>}
              </span>
            </>
          );
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex animate-slide-up items-start gap-3 rounded-lg border bg-white p-3 shadow-lg shadow-gray-900/10",
                t.tone === "error" ? "border-red-200" : "border-gray-200",
              )}
            >
              {t.href ? (
                <Link href={t.href} onClick={() => dismiss(t.id)} className="flex min-w-0 flex-1 items-start gap-3">
                  {body}
                </Link>
              ) : (
                <div className="flex min-w-0 flex-1 items-start gap-3">{body}</div>
              )}
              <button
                onClick={() => dismiss(t.id)}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
