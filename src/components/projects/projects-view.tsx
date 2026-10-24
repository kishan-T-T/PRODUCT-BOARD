"use client";

import { Ellipsis, FolderKanban, LogOut, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorMessage } from "@/lib/api-client";
import { PROJECT_COLORS, roleLabel } from "@/lib/constants";
import type { ProjectCard } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AvatarStack } from "../avatar";
import { ProjectBadge } from "../icons";
import { TimeAgo } from "../time-ago";
import { useToast } from "../toast";
import { Button, ConfirmDialog, Dropdown, EmptyState, Field, Modal, inputClass } from "../ui";

type ModalState = { mode: "create" } | { mode: "edit"; project: ProjectCard } | null;
type ConfirmState = { type: "delete" | "leave"; project: ProjectCard } | null;

export function ProjectsView({ projects, firstName }: { projects: ProjectCard[]; firstName: string }) {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [busy, setBusy] = useState(false);

  const q = query.trim().toLowerCase();
  const shown = projects.filter(
    (p) => !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
  );
  const openTasks = projects.reduce((sum, p) => sum + (p.total - p.done), 0);

  const runConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.type === "delete") await api(`/api/projects/${confirm.project.id}`, "DELETE");
      else await api(`/api/projects/${confirm.project.id}/members/${confirm.project.memberId}`, "DELETE");
      toast({
        tone: "success",
        title: confirm.type === "delete" ? `${confirm.project.title} deleted` : `You left ${confirm.project.title}`,
      });
      setConfirm(null);
      router.refresh();
    } catch (error) {
      toast({ tone: "error", title: "Something went wrong", description: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-indigo-600">Hi {firstName} 👋</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Your projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            {projects.length} {projects.length === 1 ? "project" : "projects"} · {openTasks} open tasks across your workspace
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects"
              className={cn(inputClass, "pl-9")}
            />
          </div>
          <Button onClick={() => setModal({ mode: "create" })}>
            <Plus className="h-4 w-4" /> New project
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white">
          <EmptyState
            icon={<FolderKanban className="h-6 w-6" />}
            title="Create your first project"
            description="Projects hold your tasks, boards, members and history. Start with one, you can always add more."
            action={
              <Button onClick={() => setModal({ mode: "create" })}>
                <Plus className="h-4 w-4" /> New project
              </Button>
            }
          />
        </div>
      ) : shown.length === 0 ? (
        <p className="mt-16 text-center text-sm text-gray-500">No projects match “{query}”.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => {
            const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
            const actions =
              p.role === "admin"
                ? [
                    { value: "edit", label: "Edit project", icon: <Pencil className="h-4 w-4 text-gray-400" /> },
                    { value: "delete", label: "Delete project", icon: <Trash2 className="h-4 w-4" />, danger: true },
                  ]
                : [{ value: "leave", label: "Leave project", icon: <LogOut className="h-4 w-4" />, danger: true }];
            return (
              <div
                key={p.id}
                className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <ProjectBadge title={p.title} color={p.color} size="lg" />
                  <Dropdown
                    options={actions}
                    onChange={(v) => {
                      if (v === "edit") setModal({ mode: "edit", project: p });
                      else setConfirm({ type: v as "delete" | "leave", project: p });
                    }}
                    align="right"
                    width={180}
                    title="Project actions"
                    triggerClassName="relative z-10 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    renderTrigger={() => <Ellipsis className="h-4 w-4" />}
                  />
                </div>
                <Link
                  href={`/projects/${p.id}`}
                  className="mt-4 text-base font-semibold text-gray-900 after:absolute after:inset-0 after:rounded-2xl group-hover:text-indigo-700"
                >
                  {p.title}
                </Link>
                <p className="mt-1 line-clamp-2 min-h-[40px] text-sm text-gray-500">{p.description || "No description yet."}</p>
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {p.done}/{p.total} tasks done
                    </span>
                    <span className="font-medium text-gray-700">{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                  <AvatarStack users={p.members} size="md" />
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600">{roleLabel(p.role)}</span>
                    <TimeAgo date={p.updatedAt} />
                  </div>
                </div>
              </div>
            );
          })}
          <button
            onClick={() => setModal({ mode: "create" })}
            className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 text-sm font-medium text-gray-500 transition hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-600"
          >
            <Plus className="h-5 w-5" /> New project
          </button>
        </div>
      )}

      {modal && <ProjectModal state={modal} onClose={() => setModal(null)} />}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
        loading={busy}
        danger
        title={confirm?.type === "delete" ? "Delete project?" : "Leave project?"}
        confirmLabel={confirm?.type === "delete" ? "Delete project" : "Leave project"}
        description={
          confirm?.type === "delete" ? (
            <>
              <b className="text-gray-900">{confirm.project.title}</b> and all of its tasks, comments and history will be
              permanently deleted for every member.
            </>
          ) : (
            <>You will lose access to {confirm?.project.title}. An admin can add you back later.</>
          )
        }
      />
    </main>
  );
}

function ProjectModal({ state, onClose }: { state: NonNullable<ModalState>; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const editing = state.mode === "edit" ? state.project : null;
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [color, setColor] = useState(editing?.color ?? PROJECT_COLORS[1]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (title.trim().length < 2) {
      setError("Project name must be at least 2 characters");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await api(`/api/projects/${editing.id}`, "PATCH", { title, description, color });
        toast({ tone: "success", title: "Project updated" });
        onClose();
        router.refresh();
      } else {
        const res = await api<{ project: { id: string } }>("/api/projects", "POST", { title, description, color });
        toast({ tone: "success", title: `${title.trim()} created`, description: "Add tasks and invite your team." });
        router.push(`/projects/${res.project.id}/board`);
      }
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Edit project" : "Create a project"}
      description={editing ? "Update the name, description and color." : "A home for your team's tasks, boards and history."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            {editing ? "Save changes" : "Create project"}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Project name">
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="e.g. Mobile App Launch" className={inputClass} />
        </Field>
        <Field label="Description" hint="Optional: what is this project about?">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Goals, scope, links…"
            className={cn(inputClass, "resize-none")}
          />
        </Field>
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-gray-700">Color</span>
          <div className="flex flex-wrap items-center gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn("h-7 w-7 rounded-lg transition", color === c ? "ring-2 ring-offset-2" : "hover:scale-110")}
                style={{ backgroundColor: c, ["--tw-ring-color" as string]: c }}
                aria-label={`Use color ${c}`}
              />
            ))}
            <span className="ml-2 flex items-center gap-2 text-xs text-gray-500">
              <ProjectBadge title={title || "P"} color={color} size="md" /> Preview
            </span>
          </div>
        </div>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
