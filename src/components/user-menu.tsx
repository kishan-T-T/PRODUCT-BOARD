"use client";

import { FolderKanban, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import type { CurrentUserInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";

export function UserMenu({
  user,
  align = "right",
  showName,
}: {
  user: CurrentUserInfo;
  align?: "left" | "right";
  showName?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const logout = async () => {
    await api("/api/auth/logout", "POST").catch(() => {});
    router.push("/");
    router.refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md p-1 transition hover:bg-gray-100"
        aria-label="Account menu"
      >
        <span className="relative">
          <Avatar name={user.name} color={user.avatarColor} size="md" />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </span>
        {showName && <span className="max-w-[120px] truncate text-sm font-medium text-gray-700">{user.name}</span>}
      </button>
      {open && (
        <div
          className={cn(
            "absolute top-11 z-50 w-60 animate-pop overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-2xl shadow-gray-900/10 max-lg:fixed max-lg:inset-x-3 max-lg:top-14 max-lg:w-auto",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <div className="flex items-center gap-3 border-b border-gray-100 px-3 py-3">
            <Avatar name={user.name} color={user.avatarColor} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="py-1 text-[13px]">
            <Link
              href="/projects"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100"
            >
              <FolderKanban className="h-4 w-4 text-gray-400" /> All projects
            </Link>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100"
            >
              <User className="h-4 w-4 text-gray-400" /> Edit profile
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4 text-gray-400" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
