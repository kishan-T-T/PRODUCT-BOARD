"use client";

import {
  Check,
  ChevronDown,
  CircleHelp,
  Columns3,
  FolderKanban,
  History,
  List,
  Menu,
  SquarePen,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LABELS, PRIORITIES, ROLES, roleLabel, type Role } from "@/lib/constants";
import type { CurrentUserInfo, ProjectSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LabelDot, PriorityIcon, ProjectBadge } from "../icons";
import { NotificationBell } from "../notification-bell";
import { Dropdown, Modal } from "../ui";
import { UserMenu } from "../user-menu";
import { useTaskModal } from "./task-modal";

export function Sidebar({
  project,
  role,
  user,
  projects,
}: {
  project: ProjectSummary;
  role: Role;
  user: CurrentUserInfo;
  projects: ProjectSummary[];
}) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const router = useRouter();
  const { openNewTask, canEdit } = useTaskModal();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [groups, setGroups] = useState({ priority: true, label: true });
  const [helpOpen, setHelpOpen] = useState(false);

  const base = `/projects/${project.id}`;
  const onView = pathname === `${base}/tasks` || pathname === `${base}/board`;
  const viewBase = onView ? pathname : `${base}/tasks`;
  const close = () => setMobileOpen(false);

  const hrefWith = (key: string, value: string, mode: "toggle" | "set") => {
    const params = new URLSearchParams(onView ? sp.toString() : "");
    if (mode === "toggle") {
      const current = (params.get(key) ?? "").split(",").filter(Boolean);
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      if (next.length) params.set(key, next.join(","));
      else params.delete(key);
    } else if (params.get(key) === value) params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    return qs ? `${viewBase}?${qs}` : viewBase;
  };
  const isFilterActive = (key: string, value: string) => onView && (sp.get(key) ?? "").split(",").includes(value);

  const navItem = (href: string, icon: ReactNode, label: string, active: boolean) => (
    <Link
      href={href}
      onClick={close}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition",
        active ? "bg-gray-200/80 text-gray-900" : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900",
      )}
    >
      <span className="text-gray-500">{icon}</span>
      {label}
    </Link>
  );

  const filterItem = (key: string, value: string, icon: ReactNode, label: string) => {
    const active = isFilterActive(key, value);
    return (
      <Link
        key={value}
        href={hrefWith(key, value, "toggle")}
        onClick={close}
        scroll={false}
        className={cn(
          "flex items-center gap-2.5 rounded-md py-1.5 pl-7 pr-2 text-[13px] transition",
          active ? "bg-indigo-50 font-medium text-indigo-700" : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900",
        )}
      >
        {icon}
        <span className="flex-1 truncate">{label}</span>
        {active && <Check className="h-3.5 w-3.5" />}
      </Link>
    );
  };

  const groupToggle = (key: "priority" | "label", label: string) => (
    <button
      onClick={() => setGroups((g) => ({ ...g, [key]: !g[key] }))}
      className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-200/50"
    >
      <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition", !groups[key] && "-rotate-90")} />
      {label}
    </button>
  );

  const mineActive = isFilterActive("assignee", "me");

  return (
    <>
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-3 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <ProjectBadge title={project.title} color={project.color} />
        <span className="truncate text-sm font-semibold text-gray-900">{project.title}</span>
      </div>

      {mobileOpen && <div className="fixed inset-0 z-40 bg-gray-900/30 lg:hidden" onClick={close} />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-gray-200 bg-gray-50 transition-transform duration-200 lg:relative lg:z-30 lg:w-60 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-0.5 px-2.5 pb-2 pt-3">
          <Dropdown
            options={[
              ...projects.map((p) => ({
                value: p.id,
                label: p.title,
                icon: <ProjectBadge title={p.title} color={p.color} />,
              })),
              { value: "__all", label: "View all projects", icon: <FolderKanban className="h-4 w-4 text-gray-400" /> },
            ]}
            value={project.id}
            header="Switch project"
            width={240}
            onChange={(v) => {
              close();
              router.push(v === "__all" ? "/projects" : `/projects/${v}/board`);
            }}
            triggerClassName="min-w-0 flex-1 gap-2 rounded-md px-1.5 py-1 hover:bg-gray-200/60"
            renderTrigger={() => (
              <>
                <ProjectBadge title={project.title} color={project.color} />
                <span className="truncate text-[13px] font-semibold text-gray-900">{project.title}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              </>
            )}
          />
          <NotificationBell />
          <UserMenu user={user} align="left" />
          <button onClick={close} className="rounded-md p-1 text-gray-500 hover:bg-gray-200 lg:hidden" aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3">
          <button
            onClick={() => {
              close();
              openNewTask();
            }}
            disabled={!canEdit}
            title={canEdit ? "Create a task (C)" : "Viewers can't create tasks"}
            className="flex w-full items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[13px] font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SquarePen className="h-4 w-4 text-gray-500" /> New Task
            <kbd className="ml-auto rounded border border-gray-200 bg-gray-50 px-1.5 font-sans text-[10px] text-gray-400">C</kbd>
          </button>
        </div>

        <nav className="thin-scroll mt-3 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {navItem(`${base}/history`, <History className="h-4 w-4" />, "History", pathname === `${base}/history`)}
          {navItem(`${base}/tasks`, <List className="h-4 w-4" />, "Tasks", pathname.startsWith(`${base}/tasks`))}
          {navItem(`${base}/board`, <Columns3 className="h-4 w-4" />, "Board", pathname === `${base}/board`)}

          <p className="px-2 pb-1 pt-5 text-[11px] font-medium uppercase tracking-wide text-gray-400">Your Tasks</p>
          <Link
            href={hrefWith("assignee", "me", "set")}
            onClick={close}
            scroll={false}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition",
              mineActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900",
            )}
          >
            <UserRound className="h-4 w-4 text-gray-500" />
            <span className="flex-1">Assigned to me</span>
            {mineActive && <Check className="h-3.5 w-3.5" />}
          </Link>

          {groupToggle("priority", "Priority")}
          {groups.priority &&
            PRIORITIES.map((p) => filterItem("priority", p.value, <PriorityIcon priority={p.value} />, p.label))}

          {groupToggle("label", "Label")}
          {groups.label && LABELS.map((l) => filterItem("label", l.value, <LabelDot color={l.color} />, l.label))}
        </nav>

        <div className="space-y-0.5 border-t border-gray-200 px-3 py-3">
          {navItem(`${base}/members`, <Users className="h-4 w-4" />, "Manage Members", pathname === `${base}/members`)}
          <button
            onClick={() => setHelpOpen(true)}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-gray-600 transition hover:bg-gray-200/50 hover:text-gray-900"
          >
            <CircleHelp className="h-4 w-4 text-gray-500" /> Help &amp; Feedback
          </button>
          <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live sync
            </span>
            <span className="rounded bg-gray-200/70 px-1.5 py-0.5 font-medium text-gray-600">{roleLabel(role)}</span>
          </div>
        </div>
      </aside>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Help & Feedback" description="Tips to move faster in Product Board.">
        <div className="space-y-5 text-sm">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Keyboard shortcuts</p>
            <ul className="space-y-1.5 text-gray-700">
              {[
                ["C", "Create a new task"],
                ["Ctrl / ⌘ + Enter", "Save the open task"],
                ["Esc", "Close menus and dialogs"],
              ].map(([key, label]) => (
                <li key={key} className="flex items-center justify-between">
                  <span>{label}</span>
                  <kbd className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-500">{key}</kbd>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Roles</p>
            <ul className="space-y-1.5">
              {ROLES.map((r) => (
                <li key={r.value} className="text-gray-600">
                  <span className="font-medium text-gray-900">{r.label}:</span> {r.description}
                </li>
              ))}
            </ul>
          </div>
          <p className="rounded-lg bg-indigo-50 px-3 py-2.5 text-indigo-800">
            Drag cards on the <b>Board</b> to change status, and use the sidebar filters to focus on what matters.
            Feedback? Write to{" "}
            <a className="font-medium underline" href="mailto:hello@productboard.app">
              hello@productboard.app
            </a>
            .
          </p>
        </div>
      </Modal>
    </>
  );
}
