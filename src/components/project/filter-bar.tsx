"use client";

import { ArrowUpDown, Columns3, List, Search, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import type { MemberInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, UnassignedAvatar } from "../avatar";
import { Dropdown } from "../ui";
import { labelOptions, priorityOptions, statusOptions } from "./property-pickers";
import { NewTaskButton } from "./task-modal";

const SORTS = [
  { value: "priority", label: "Priority" },
  { value: "created", label: "Newest" },
  { value: "updated", label: "Recently updated" },
  { value: "due", label: "Due date" },
  { value: "title", label: "Title" },
];

const chip = (active: boolean) =>
  cn(
    "h-7 gap-1.5 rounded-md border px-2.5 text-xs font-medium transition",
    active
      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900",
  );

export function FilterBar({
  view,
  members,
  title,
  count,
}: {
  view: "list" | "board";
  members: MemberInfo[];
  title: string;
  count: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const replace = (params: URLSearchParams) => {
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const listOf = (key: string) => (sp.get(key) ?? "").split(",").filter(Boolean);
  const toggle = (key: string, value: string) => {
    const params = new URLSearchParams(sp.toString());
    const current = listOf(key);
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    if (next.length) params.set(key, next.join(","));
    else params.delete(key);
    replace(params);
  };
  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    replace(params);
  };
  const onSearch = (value: string) => {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setParam("q", value.trim()), 300);
  };

  const statusSel = listOf("status");
  const prioritySel = listOf("priority");
  const labelSel = listOf("label");
  const assignee = sp.get("assignee") ?? "";
  const sort = sp.get("sort") ?? "priority";
  const activeCount =
    (view === "list" ? statusSel.length : 0) +
    prioritySel.length +
    labelSel.length +
    (assignee ? 1 : 0) +
    (sp.get("q") ? 1 : 0);

  const qs = sp.toString();
  const listHref = pathname.replace(/\/board$/, "/tasks") + (qs ? `?${qs}` : "");
  const boardHref = pathname.replace(/\/tasks$/, "/board") + (qs ? `?${qs}` : "");

  const assigneeOptions = [
    { value: "", label: "Anyone", icon: <UserRound className="h-4 w-4 text-gray-400" /> },
    { value: "me", label: "Assigned to me", icon: <UserRound className="h-4 w-4 text-indigo-500" /> },
    { value: "unassigned", label: "Unassigned", icon: <UnassignedAvatar size="sm" /> },
    ...members.map((m) => ({
      value: m.userId,
      label: m.name,
      icon: <Avatar name={m.name} color={m.avatarColor} size="sm" />,
    })),
  ];

  const countBadge = (n: number) =>
    n > 0 ? <span className="rounded bg-indigo-600 px-1 text-[10px] font-semibold text-white">{n}</span> : null;

  return (
    <div className="shrink-0 border-b border-gray-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 px-4 pt-3 sm:px-6">
        <div className="flex items-center gap-2">
          <h1 className="text-[15px] font-semibold text-gray-900">{title}</h1>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{count}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-md border border-gray-200 bg-gray-50 p-0.5">
            <Link
              href={listHref}
              scroll={false}
              className={cn(
                "flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium",
                view === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800",
              )}
            >
              <List className="h-3.5 w-3.5" /> List
            </Link>
            <Link
              href={boardHref}
              scroll={false}
              className={cn(
                "flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium",
                view === "board" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800",
              )}
            >
              <Columns3 className="h-3.5 w-3.5" /> Board
            </Link>
          </div>
          <NewTaskButton />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search tasks…"
            className="h-7 w-full rounded-md border border-gray-200 bg-white pl-8 pr-2 text-xs outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        {view === "list" && (
          <Dropdown
            multi
            options={statusOptions}
            value={statusSel}
            onChange={(v) => toggle("status", v)}
            header="Filter by status"
            triggerClassName={chip(statusSel.length > 0)}
            renderTrigger={() => <>Status {countBadge(statusSel.length)}</>}
          />
        )}
        <Dropdown
          multi
          options={priorityOptions}
          value={prioritySel}
          onChange={(v) => toggle("priority", v)}
          header="Filter by priority"
          triggerClassName={chip(prioritySel.length > 0)}
          renderTrigger={() => <>Priority {countBadge(prioritySel.length)}</>}
        />
        <Dropdown
          multi
          options={labelOptions}
          value={labelSel}
          onChange={(v) => toggle("label", v)}
          header="Filter by label"
          triggerClassName={chip(labelSel.length > 0)}
          renderTrigger={() => <>Label {countBadge(labelSel.length)}</>}
        />
        <Dropdown
          options={assigneeOptions}
          value={assignee}
          onChange={(v) => setParam("assignee", v)}
          header="Filter by assignee"
          searchable
          width={240}
          triggerClassName={chip(!!assignee)}
          renderTrigger={(opt) => <>{assignee && opt ? opt.label : "Assignee"}</>}
        />
        {view === "list" && (
          <Dropdown
            options={SORTS}
            value={sort}
            onChange={(v) => setParam("sort", v === "priority" ? "" : v)}
            header="Sort by"
            align="right"
            triggerClassName={chip(false)}
            renderTrigger={(opt) => (
              <>
                <ArrowUpDown className="h-3.5 w-3.5" /> {opt?.label ?? "Priority"}
              </>
            )}
          />
        )}
        {activeCount > 0 && (
          <button
            onClick={() => {
              setQ("");
              const params = new URLSearchParams();
              if (view === "list" && sp.get("sort")) params.set("sort", sp.get("sort") ?? "");
              replace(params);
            }}
            className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
