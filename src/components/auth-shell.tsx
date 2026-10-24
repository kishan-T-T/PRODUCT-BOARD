import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "./avatar";
import { LabelPill, Logo, PriorityIcon, StatusIcon } from "./icons";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-12">{children}</div>
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} Product Board</p>
      </div>
      <div className="relative hidden overflow-hidden bg-indigo-600 lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Product Board</p>
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white">
            We&apos;re here to manage your productivity, hassle-free.
          </h2>
          <ul className="mt-8 space-y-3 text-indigo-100">
            {[
              "Lists and drag & drop boards",
              "Role-based access for every member",
              "Realtime notifications and full history",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-10 w-80 rotate-[-2deg] rounded-xl bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">PB-9</span>
              <Avatar name="Demo User" color="#4f46e5" size="sm" />
            </div>
            <p className="mt-1.5 text-sm font-medium text-gray-900">Role-based access for members</p>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded border border-gray-200">
                <PriorityIcon priority="urgent" size={12} />
              </span>
              <LabelPill label="feature" />
              <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-500">
                <StatusIcon status="todo" size={12} /> Todo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
