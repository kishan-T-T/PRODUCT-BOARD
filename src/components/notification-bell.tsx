"use client";

import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";
import { TimeAgo } from "./time-ago";
import { useToast } from "./toast";

type Item = {
  id: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
  actorName: string | null;
  actorColor: string | null;
  projectTitle: string | null;
};

export function NotificationBell({ align = "left" }: { align?: "left" | "right" }) {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const seen = useRef<Set<string> | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { unread: number; items: Item[] };
      const known = seen.current;
      if (known) {
        data.items
          .filter((n) => !n.read && !known.has(n.id))
          .slice(0, 3)
          .forEach((n) =>
            toast({
              tone: "notification",
              title: n.actorName ?? "Product Board",
              description: n.message,
              href: n.link ?? undefined,
            }),
          );
      }
      seen.current = new Set(data.items.map((n) => n.id));
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      // network hiccup: try again on the next tick
    }
  }, [toast]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 6000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const markRead = async (ids?: string[]) => {
    setItems((all) => all.map((n) => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)));
    setUnread((u) => (ids ? Math.max(0, u - ids.length) : 0));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids ? { ids } : { all: true }),
    }).catch(() => {});
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
        aria-label="Notifications"
      >
        <Bell className="h-[17px] w-[17px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          className={cn(
            "absolute top-10 z-50 w-[340px] animate-pop overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10 max-lg:fixed max-lg:inset-x-3 max-lg:top-14 max-lg:w-auto",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">{unread ? `${unread} unread` : "You're all caught up"}</p>
            </div>
            {unread > 0 && (
              <button
                onClick={() => markRead()}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="thin-scroll max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-gray-500">
                <Inbox className="h-6 w-6 text-gray-300" />
                No notifications yet
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.read) markRead([n.id]);
                    setOpen(false);
                    if (n.link) router.push(n.link);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50",
                    !n.read && "bg-indigo-50/40",
                  )}
                >
                  <Avatar name={n.actorName ?? "Product Board"} color={n.actorColor} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] leading-snug text-gray-700">
                      <span className="font-semibold text-gray-900">{n.actorName ?? "Someone"}</span> {n.message}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-400">
                      {n.projectTitle && <span className="truncate">{n.projectTitle} ·</span>}
                      <TimeAgo date={n.createdAt} />
                    </span>
                  </span>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
