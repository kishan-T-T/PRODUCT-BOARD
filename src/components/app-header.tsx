import Link from "next/link";
import type { CurrentUserInfo } from "@/lib/types";
import { Logo } from "./icons";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";

export function AppHeader({ user }: { user: CurrentUserInfo }) {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo href="/projects" />
          <nav className="hidden items-center gap-1 text-sm sm:flex">
            <Link href="/projects" className="rounded-md px-2.5 py-1.5 font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
              Projects
            </Link>
            <Link href="/profile" className="rounded-md px-2.5 py-1.5 font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
              Profile
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-1.5">
          <NotificationBell align="right" />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
