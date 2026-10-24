"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { api, errorMessage } from "@/lib/api-client";
import type { Label, Priority, Status } from "@/lib/constants";
import type { MemberInfo, TaskItem } from "@/lib/types";
import { MarkdownEditor } from "../markdown-editor";
import { useToast } from "../toast";
import { Button, Modal, inputClass } from "../ui";
import { PropertyPicker, assigneeOptions, labelOptions, priorityOptions, statusOptions } from "./property-pickers";

export type TaskDraft = {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  label: Label;
  assigneeId: string;
  startDate: string;
  dueDate: string;
};

type ModalState = { mode: "create"; defaults: Partial<TaskDraft> } | { mode: "edit"; task: TaskItem };

type TaskModalContextValue = {
  openNewTask: (defaults?: Partial<TaskDraft>) => void;
  openEditTask: (task: TaskItem) => void;
  canEdit: boolean;
};

const TaskModalContext = createContext<TaskModalContextValue | null>(null);

export function useTaskModal() {
  const ctx = useContext(TaskModalContext);
  if (!ctx) throw new Error("useTaskModal must be used inside TaskModalProvider");
  return ctx;
}

export function TaskModalProvider({
  projectId,
  projectKey,
  members,
  canEdit,
  children,
}: {
  projectId: string;
  projectKey: string;
  members: MemberInfo[];
  canEdit: boolean;
  children: ReactNode;
}) {
  const [state, setState] = useState<ModalState | null>(null);
  const [instance, setInstance] = useState(0);

  const openNewTask = useCallback(
    (defaults: Partial<TaskDraft> = {}) => {
      if (!canEdit) return;
      setInstance((i) => i + 1);
      setState({ mode: "create", defaults });
    },
    [canEdit],
  );

  const openEditTask = useCallback(
    (task: TaskItem) => {
      if (!canEdit) return;
      setInstance((i) => i + 1);
      setState({ mode: "edit", task });
    },
    [canEdit],
  );

  useEffect(() => {
    if (!canEdit) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "c" || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      if (document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      openNewTask();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canEdit, openNewTask]);

  const value = useMemo(() => ({ openNewTask, openEditTask, canEdit }), [openNewTask, openEditTask, canEdit]);

  return (
    <TaskModalContext.Provider value={value}>
      {children}
      {state && (
        <TaskModal
          key={instance}
          state={state}
          projectId={projectId}
          projectKey={projectKey}
          members={members}
          onClose={() => setState(null)}
        />
      )}
    </TaskModalContext.Provider>
  );
}

function TaskModal({
  state,
  projectId,
  projectKey,
  members,
  onClose,
}: {
  state: ModalState;
  projectId: string;
  projectKey: string;
  members: MemberInfo[];
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState<TaskDraft>(() =>
    state.mode === "edit"
      ? {
          title: state.task.title,
          description: state.task.description,
          status: state.task.status,
          priority: state.task.priority,
          label: state.task.label,
          assigneeId: state.task.assigneeId ?? "",
          startDate: state.task.startDate ?? "",
          dueDate: state.task.dueDate ?? "",
        }
      : {
          title: "",
          description: "",
          status: "todo",
          priority: "none",
          label: "none",
          assigneeId: "",
          startDate: "",
          dueDate: "",
          ...state.defaults,
        },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (saving) return;
    if (!draft.title.trim()) {
      setError("Give your task a title");
      return;
    }
    if (draft.startDate && draft.dueDate && draft.dueDate < draft.startDate) {
      setError("Due date can't be before the start date");
      return;
    }
    setSaving(true);
    setError("");
    const body = {
      ...draft,
      title: draft.title.trim(),
      assigneeId: draft.assigneeId || null,
      startDate: draft.startDate || null,
      dueDate: draft.dueDate || null,
    };
    try {
      if (state.mode === "create") {
        const res = await api<{ task: { id: string; number: number } }>(`/api/projects/${projectId}/tasks`, "POST", body);
        toast({
          tone: "success",
          title: `${projectKey}-${res.task.number} created`,
          description: body.title,
          href: `/projects/${projectId}/tasks/${res.task.id}`,
        });
      } else {
        await api(`/api/projects/${projectId}/tasks/${state.task.id}`, "PATCH", body);
        toast({ tone: "success", title: `${state.task.key} updated` });
      }
      onClose();
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={state.mode === "create" ? "New task" : `Edit ${state.task.key}`}
      description={state.mode === "create" ? "Capture the work, then refine it on the board." : undefined}
      footer={
        <>
          <span className="mr-auto hidden text-xs text-gray-400 sm:block">Ctrl / ⌘ + Enter to save</span>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => submit()} loading={saving}>
            {state.mode === "create" ? "Create task" : "Save changes"}
          </Button>
        </>
      }
    >
      <form
        onSubmit={submit}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
        }}
        className="space-y-4"
      >
        <input
          autoFocus
          value={draft.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Task title"
          maxLength={200}
          className="w-full border-0 bg-transparent px-0 text-lg font-semibold text-gray-900 outline-none placeholder:text-gray-300"
        />
        <MarkdownEditor value={draft.description} onChange={(v) => set("description", v)} />
        <div className="flex flex-wrap items-center gap-2">
          <PropertyPicker
            options={statusOptions}
            value={draft.status}
            onChange={(v) => set("status", v as Status)}
            header="Status"
          />
          <PropertyPicker
            options={priorityOptions}
            value={draft.priority}
            onChange={(v) => set("priority", v as Priority)}
            header="Priority"
          />
          <PropertyPicker
            options={labelOptions}
            value={draft.label}
            onChange={(v) => set("label", v as Label)}
            header="Label"
          />
          <PropertyPicker
            options={assigneeOptions(members)}
            value={draft.assigneeId}
            onChange={(v) => set("assigneeId", v)}
            header="Assign to"
            searchable
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Start date</span>
            <input
              type="date"
              value={draft.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Due date</span>
            <input
              type="date"
              value={draft.dueDate}
              min={draft.startDate || undefined}
              onChange={(e) => set("dueDate", e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

export function NewTaskButton({ status }: { status?: Status }) {
  const { openNewTask, canEdit } = useTaskModal();
  if (!canEdit) return null;
  return (
    <Button size="sm" onClick={() => openNewTask(status ? { status } : {})}>
      <Plus className="h-3.5 w-3.5" /> New task
    </Button>
  );
}
