"use client";

import { Calendar, ChevronDown, ListTodo, Plus, SearchX } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorMessage } from "@/lib/api-client";
import { STATUSES, type Priority, type Status } from "@/lib/constants";
import type { MemberInfo, TaskItem } from "@/lib/types";
import { cn, isOverdue, shortDate } from "@/lib/utils";
import { LabelPill, StatusIcon } from "../icons";
import { useToast } from "../toast";
import { Button, EmptyState } from "../ui";
import { PropertyPicker, assigneeOptions, priorityOptions, statusOptions } from "./property-pickers";
import { useTaskModal } from "./task-modal";

type Patch = Partial<Pick<TaskItem, "status" | "priority" | "assigneeId">>;

export function TaskList({
  tasks,
  members,
  projectId,
  canEdit,
  hasFilters,
}: {
  tasks: TaskItem[];
  members: MemberInfo[];
  projectId: string;
  canEdit: boolean;
  hasFilters: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const { openNewTask } = useTaskModal();
  const [items, setItems] = useState(tasks);
  const [prev, setPrev] = useState(tasks);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  if (tasks !== prev) {
    setPrev(tasks);
    setItems(tasks);
  }

  const update = async (task: TaskItem, patch: Patch) => {
    setItems((all) =>
      all.map((t) => {
        if (t.id !== task.id) return t;
        const next = { ...t, ...patch };
        if ("assigneeId" in patch) {
          const m = members.find((x) => x.userId === patch.assigneeId);
          next.assignee = m ? { id: m.userId, name: m.name, avatarColor: m.avatarColor } : null;
        }
        return next;
      }),
    );
    try {
      await api(`/api/projects/${projectId}/tasks/${task.id}`, "PATCH", patch);
      router.refresh();
    } catch (error) {
      setItems(tasks);
      toast({ tone: "error", title: "Update failed", description: errorMessage(error) });
    }
  };

  if (!items.length) {
    return hasFilters ? (
      <EmptyState
        icon={<SearchX className="h-6 w-6" />}
        title="No tasks match these filters"
        description="Try removing a filter or searching for something else."
        action={
          <Button variant="secondary" onClick={() => router.replace(pathname)}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={<ListTodo className="h-6 w-6" />}
        title="No tasks yet"
        description="Create the first task for this project. Press C anytime to add one."
        action={
          canEdit ? (
            <Button onClick={() => openNewTask()}>
              <Plus className="h-4 w-4" /> Create a task
            </Button>
          ) : undefined
        }
      />
    );
  }

  const groups = STATUSES.map((s) => ({ ...s, tasks: items.filter((t) => t.status === s.value) })).filter(
    (g) => g.tasks.length > 0,
  );
  const people = assigneeOptions(members);

  return (
    <div className="thin-scroll h-full overflow-y-auto pb-24">
      {groups.map((g) => (
        <section key={g.value}>
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-100 bg-gray-50/95 px-4 py-2 backdrop-blur sm:px-6">
            <button
              onClick={() => setCollapsed((c) => ({ ...c, [g.value]: !c[g.value] }))}
              className="flex items-center gap-2 text-[13px] font-medium text-gray-800"
            >
              <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition", collapsed[g.value] && "-rotate-90")} />
              <StatusIcon status={g.value} />
              {g.label}
              <span className="font-normal text-gray-400">{g.tasks.length}</span>
            </button>
            {canEdit && (
              <button
                onClick={() => openNewTask({ status: g.value as Status })}
                className="ml-auto rounded p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
                title={`New task in ${g.label}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {!collapsed[g.value] &&
            g.tasks.map((t) => {
              const href = `/projects/${projectId}/tasks/${t.id}`;
              const overdue = isOverdue(t.dueDate, t.status);
              return (
                <div
                  key={t.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(href)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") router.push(href);
                  }}
                  className="group flex h-11 cursor-pointer items-center gap-2 border-b border-gray-100 px-4 text-[13px] transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-none sm:px-6"
                >
                  <PropertyPicker
                    variant="icon"
                    options={priorityOptions}
                    value={t.priority}
                    onChange={(v) => update(t, { priority: v as Priority })}
                    disabled={!canEdit}
                    title="Change priority"
                    header="Set priority"
                  />
                  <span className="hidden w-14 shrink-0 text-gray-400 sm:block">{t.key}</span>
                  <PropertyPicker
                    variant="icon"
                    options={statusOptions}
                    value={t.status}
                    onChange={(v) => update(t, { status: v as Status })}
                    disabled={!canEdit}
                    title="Change status"
                    header="Set status"
                  />
                  <Link
                    href={href}
                    onClick={(e) => e.stopPropagation()}
                    className="min-w-0 flex-1 truncate font-medium text-gray-900"
                  >
                    {t.title}
                  </Link>
                  <LabelPill label={t.label} className="hidden md:inline-flex" />
                  {t.dueDate && (
                    <span
                      className={cn(
                        "hidden shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] sm:inline-flex",
                        overdue ? "border-red-200 bg-red-50 text-red-600" : "border-gray-200 text-gray-500",
                      )}
                      title={overdue ? "Overdue" : "Due date"}
                      suppressHydrationWarning
                    >
                      <Calendar className="h-3 w-3" />
                      {shortDate(t.dueDate)}
                    </span>
                  )}
                  <PropertyPicker
                    variant="icon"
                    options={people}
                    value={t.assigneeId ?? ""}
                    onChange={(v) => update(t, { assigneeId: v || null })}
                    disabled={!canEdit}
                    searchable
                    align="right"
                    title={t.assignee ? `Assigned to ${t.assignee.name}` : "Assign"}
                    header="Assign to"
                  />
                  <span className="hidden w-14 shrink-0 text-right text-xs text-gray-400 lg:block" suppressHydrationWarning>
                    {shortDate(t.createdAt)}
                  </span>
                </div>
              );
            })}
        </section>
      ))}
    </div>
  );
}
