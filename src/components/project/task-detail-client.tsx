"use client";

import { Link2, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { api, errorMessage } from "@/lib/api-client";
import type { CurrentUserInfo, MemberInfo, TaskItem } from "@/lib/types";
import { Avatar } from "../avatar";
import { MarkdownEditor } from "../markdown-editor";
import { useToast } from "../toast";
import { Button, ConfirmDialog } from "../ui";
import { PropertyPicker, assigneeOptions, labelOptions, priorityOptions, statusOptions } from "./property-pickers";
import { useTaskModal } from "./task-modal";

export function TaskActions({ task, projectId, canEdit }: { task: TaskItem; projectId: string; canEdit: boolean }) {
  const { openEditTask } = useTaskModal();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ tone: "success", title: "Link copied to clipboard" });
    } catch {
      toast({ tone: "error", title: "Couldn't copy the link" });
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api(`/api/projects/${projectId}/tasks/${task.id}`, "DELETE");
      toast({ tone: "success", title: `${task.key} deleted` });
      router.push(`/projects/${projectId}/tasks`);
      router.refresh();
    } catch (error) {
      toast({ tone: "error", title: "Couldn't delete task", description: errorMessage(error) });
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" onClick={copy} title="Copy link">
        <Link2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Copy link</span>
      </Button>
      {canEdit && (
        <>
          <Button variant="secondary" size="sm" onClick={() => openEditTask(task)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirm(true)}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            title="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
        loading={deleting}
        danger
        title={`Delete ${task.key}?`}
        confirmLabel="Delete task"
        description={
          <>
            <b className="text-gray-900">{task.title}</b> will be permanently deleted. Its history stays in the project log.
          </>
        }
      />
    </div>
  );
}

export function TaskProperties({
  task,
  projectId,
  members,
  canEdit,
}: {
  task: TaskItem;
  projectId: string;
  members: MemberInfo[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [current, setCurrent] = useState(task);
  const [prev, setPrev] = useState(task);
  if (task !== prev) {
    setPrev(task);
    setCurrent(task);
  }

  const update = async (patch: Partial<Pick<TaskItem, "status" | "priority" | "label" | "assigneeId" | "startDate" | "dueDate">>) => {
    setCurrent((c) => ({ ...c, ...patch }));
    try {
      await api(`/api/projects/${projectId}/tasks/${task.id}`, "PATCH", patch);
      router.refresh();
    } catch (error) {
      setCurrent(task);
      toast({ tone: "error", title: "Update failed", description: errorMessage(error) });
    }
  };

  const row = (label: string, control: ReactNode) => (
    <div className="grid grid-cols-[88px_1fr] items-center gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="min-w-0">{control}</div>
    </div>
  );
  const dateClass =
    "h-8 w-full rounded-md bg-transparent px-2 text-[13px] text-gray-800 outline-none transition hover:bg-gray-100 focus:ring-2 focus:ring-indigo-500/20 disabled:hover:bg-transparent";

  return (
    <div className="space-y-1">
      {row(
        "Status",
        <PropertyPicker variant="field" options={statusOptions} value={current.status} onChange={(v) => update({ status: v as TaskItem["status"] })} disabled={!canEdit} header="Set status" />,
      )}
      {row(
        "Priority",
        <PropertyPicker variant="field" options={priorityOptions} value={current.priority} onChange={(v) => update({ priority: v as TaskItem["priority"] })} disabled={!canEdit} header="Set priority" />,
      )}
      {row(
        "Assignee",
        <PropertyPicker variant="field" options={assigneeOptions(members)} value={current.assigneeId ?? ""} onChange={(v) => update({ assigneeId: v || null })} disabled={!canEdit} searchable header="Assign to" />,
      )}
      {row(
        "Label",
        <PropertyPicker variant="field" options={labelOptions} value={current.label} onChange={(v) => update({ label: v as TaskItem["label"] })} disabled={!canEdit} header="Set label" />,
      )}
      {row(
        "Start date",
        <input
          type="date"
          value={current.startDate ?? ""}
          max={current.dueDate ?? undefined}
          onChange={(e) => update({ startDate: e.target.value || null })}
          disabled={!canEdit}
          className={dateClass}
        />,
      )}
      {row(
        "Due date",
        <input
          type="date"
          value={current.dueDate ?? ""}
          min={current.startDate ?? undefined}
          onChange={(e) => update({ dueDate: e.target.value || null })}
          disabled={!canEdit}
          className={dateClass}
        />,
      )}
    </div>
  );
}

export function CommentComposer({
  projectId,
  taskId,
  user,
}: {
  projectId: string;
  taskId: string;
  user: CurrentUserInfo;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const submit = async () => {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await api(`/api/projects/${projectId}/tasks/${taskId}/comments`, "POST", { body });
      setBody("");
      router.refresh();
    } catch (error) {
      toast({ tone: "error", title: "Couldn't post comment", description: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-3">
      <Avatar name={user.name} color={user.avatarColor} size="md" className="mt-1" />
      <div
        className="min-w-0 flex-1 space-y-2"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
        }}
      >
        <MarkdownEditor value={body} onChange={setBody} rows={3} placeholder="Leave a comment… (Markdown supported)" />
        <div className="flex justify-end">
          <Button size="sm" onClick={submit} loading={saving} disabled={!body.trim()}>
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
