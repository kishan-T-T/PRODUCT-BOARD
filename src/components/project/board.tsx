"use client";

import { Calendar, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorMessage } from "@/lib/api-client";
import { STATUSES, type Status } from "@/lib/constants";
import type { TaskItem } from "@/lib/types";
import { cn, isOverdue, shortDate } from "@/lib/utils";
import { Avatar, UnassignedAvatar } from "../avatar";
import { LabelPill, PriorityIcon, StatusIcon } from "../icons";
import { useToast } from "../toast";
import { useTaskModal } from "./task-modal";

type Over = { status: Status; beforeId: string | null } | null;

export function Board({ tasks, projectId, canEdit }: { tasks: TaskItem[]; projectId: string; canEdit: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const { openNewTask } = useTaskModal();
  const [items, setItems] = useState(tasks);
  const [prev, setPrev] = useState(tasks);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<Over>(null);
  if (tasks !== prev) {
    setPrev(tasks);
    setItems(tasks);
  }

  const columns = STATUSES.map((s) => ({
    ...s,
    tasks: items.filter((t) => t.status === s.value).sort((a, b) => a.position - b.position),
  }));

  const drop = async (status: Status, beforeId: string | null) => {
    const id = dragId;
    setDragId(null);
    setOver(null);
    if (!id || beforeId === id) return;
    const task = items.find((t) => t.id === id);
    if (!task) return;

    const column = items.filter((t) => t.status === status && t.id !== id).sort((a, b) => a.position - b.position);
    let position: number;
    const idx = beforeId ? column.findIndex((t) => t.id === beforeId) : -1;
    if (idx === 0) position = column[0].position - 1024;
    else if (idx > 0) position = (column[idx - 1].position + column[idx].position) / 2;
    else position = column.length ? column[column.length - 1].position + 1024 : 1024;

    const patch = task.status === status ? { position } : { status, position };
    setItems((all) => all.map((t) => (t.id === id ? { ...t, status, position } : t)));
    try {
      await api(`/api/projects/${projectId}/tasks/${id}`, "PATCH", patch);
      router.refresh();
    } catch (error) {
      setItems(tasks);
      toast({ tone: "error", title: "Couldn't move task", description: errorMessage(error) });
    }
  };

  return (
    <div className="thin-scroll flex h-full gap-3 overflow-x-auto p-4 sm:px-6">
      {columns.map((col) => {
        const columnActive = !!dragId && over?.status === col.value && over.beforeId === null;
        return (
          <div
            key={col.value}
            className={cn(
              "flex h-full w-[280px] shrink-0 flex-col rounded-xl bg-gray-50 ring-1 ring-gray-100 transition",
              columnActive && "bg-indigo-50/60 ring-2 ring-indigo-300",
            )}
            onDragOver={(e) => {
              if (!dragId) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (over?.status !== col.value || over.beforeId !== null) setOver({ status: col.value, beforeId: null });
            }}
            onDrop={(e) => {
              e.preventDefault();
              drop(col.value, null);
            }}
          >
            <div className="flex items-center gap-2 px-3 py-2.5">
              <StatusIcon status={col.value} />
              <span className="text-[13px] font-semibold text-gray-800">{col.label}</span>
              <span className="text-xs text-gray-400">{col.tasks.length}</span>
              {canEdit && (
                <button
                  onClick={() => openNewTask({ status: col.value })}
                  className="ml-auto rounded p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
                  title={`New task in ${col.label}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="thin-scroll flex-1 space-y-2 overflow-y-auto px-2 pb-3">
              {col.tasks.map((t) => {
                const overdue = isOverdue(t.dueDate, t.status);
                return (
                  <div
                    key={t.id}
                    onDragOver={(e) => {
                      if (!dragId) return;
                      e.preventDefault();
                      e.stopPropagation();
                      if (over?.beforeId !== t.id) setOver({ status: col.value, beforeId: t.id });
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      drop(col.value, t.id);
                    }}
                  >
                    {dragId && over?.beforeId === t.id && dragId !== t.id && (
                      <div className="mb-2 h-0.5 rounded-full bg-indigo-500" />
                    )}
                    <Link
                      href={`/projects/${projectId}/tasks/${t.id}`}
                      draggable={canEdit}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", t.id);
                        setDragId(t.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOver(null);
                      }}
                      className={cn(
                        "block rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:border-gray-300 hover:shadow-md",
                        dragId === t.id && "opacity-40",
                        canEdit && "cursor-grab active:cursor-grabbing",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-gray-400">{t.key}</span>
                        {t.assignee ? (
                          <Avatar name={t.assignee.name} color={t.assignee.avatarColor} size="sm" />
                        ) : (
                          <UnassignedAvatar size="sm" />
                        )}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-snug text-gray-900">{t.title}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded border border-gray-200"
                          title={`Priority: ${t.priority}`}
                        >
                          <PriorityIcon priority={t.priority} size={12} />
                        </span>
                        <LabelPill label={t.label} />
                        {t.dueDate && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px]",
                              overdue ? "border-red-200 bg-red-50 text-red-600" : "border-gray-200 text-gray-500",
                            )}
                            suppressHydrationWarning
                          >
                            <Calendar className="h-3 w-3" />
                            {shortDate(t.dueDate)}
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}
              {col.tasks.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-xs text-gray-400">
                  {canEdit ? "Drop tasks here" : "No tasks"}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
