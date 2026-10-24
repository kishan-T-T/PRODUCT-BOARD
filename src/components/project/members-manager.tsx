"use client";

import { Crown, Eye, LoaderCircle, LogOut, Search, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api, errorMessage } from "@/lib/api-client";
import { ROLES, roleLabel, type Role } from "@/lib/constants";
import type { MemberInfo } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { Avatar } from "../avatar";
import { useToast } from "../toast";
import { Button, ConfirmDialog, Dropdown, Modal, inputClass } from "../ui";

type Row = MemberInfo & { openTasks: number };
type Candidate = { id: string; name: string; email: string; avatarColor: string; jobTitle: string };

const ROLE_ICONS: Record<Role, ReactNode> = {
  admin: <Crown className="h-4 w-4 text-amber-500" />,
  member: <ShieldCheck className="h-4 w-4 text-indigo-500" />,
  viewer: <Eye className="h-4 w-4 text-gray-400" />,
};

const ROLE_BADGE: Record<Role, string> = {
  admin: "bg-amber-50 text-amber-700 ring-amber-200",
  member: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  viewer: "bg-gray-100 text-gray-600 ring-gray-200",
};

const roleOptions = ROLES.map((r) => ({ value: r.value, label: r.label, icon: ROLE_ICONS[r.value] }));

export function MembersManager({
  projectId,
  projectTitle,
  members,
  currentUserId,
  canManage,
}: {
  projectId: string;
  projectTitle: string;
  members: Row[];
  currentUserId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const counts = { all: members.length, admin: 0, member: 0, viewer: 0 } as Record<"all" | Role, number>;
  members.forEach((m) => (counts[m.role] += 1));

  const q = query.trim().toLowerCase();
  const filtered = members.filter(
    (m) =>
      (roleFilter === "all" || m.role === roleFilter) &&
      (!q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.jobTitle.toLowerCase().includes(q)),
  );

  const changeRole = async (m: Row, role: string) => {
    try {
      await api(`/api/projects/${projectId}/members/${m.memberId}`, "PATCH", { role });
      toast({ tone: "success", title: `${m.name} is now ${roleLabel(role)}` });
      router.refresh();
    } catch (error) {
      toast({ tone: "error", title: "Couldn't change role", description: errorMessage(error) });
    }
  };

  const remove = async () => {
    if (!removing) return;
    setBusy(true);
    const self = removing.userId === currentUserId;
    try {
      await api(`/api/projects/${projectId}/members/${removing.memberId}`, "DELETE");
      toast({ tone: "success", title: self ? `You left ${projectTitle}` : `${removing.name} was removed` });
      setRemoving(null);
      if (self) router.push("/projects");
      router.refresh();
    } catch (error) {
      toast({ tone: "error", title: "Couldn't remove member", description: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="thin-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">Manage Members</h1>
            <p className="mt-1 text-sm text-gray-500">
              {members.length} {members.length === 1 ? "person has" : "people have"} access to {projectTitle}.
            </p>
          </div>
          {canManage && (
            <Button onClick={() => setAddOpen(true)}>
              <UserPlus className="h-4 w-4" /> Add member
            </Button>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRoleFilter(roleFilter === r.value ? "all" : r.value)}
              className={cn(
                "rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-indigo-200",
                roleFilter === r.value ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-200",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  {ROLE_ICONS[r.value]} {r.label}s
                </span>
                <span className="text-lg font-semibold text-gray-900">{counts[r.value]}</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{r.description}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email or title"
              className={cn(inputClass, "pl-9")}
            />
          </div>
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs font-medium">
            {(["all", "admin", "member", "viewer"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={cn(
                  "rounded-md px-3 py-1.5 capitalize transition",
                  roleFilter === r ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800",
                )}
              >
                {r === "all" ? "All" : `${roleLabel(r)}s`} <span className="text-gray-400">{counts[r]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1fr_140px_100px_120px_48px] gap-4 border-b border-gray-100 bg-gray-50 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-gray-500 md:grid">
            <span>Member</span>
            <span>Role</span>
            <span>Open tasks</span>
            <span>Joined</span>
            <span />
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-sm text-gray-500">
              <Users className="h-6 w-6 text-gray-300" /> No members match your filters.
            </div>
          )}
          {filtered.map((m) => {
            const self = m.userId === currentUserId;
            const lastAdmin = m.role === "admin" && counts.admin <= 1;
            return (
              <div
                key={m.memberId}
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-gray-100 px-5 py-3 last:border-b-0 md:grid-cols-[1fr_140px_100px_120px_48px] md:gap-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={m.name} color={m.avatarColor} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {m.name} {self && <span className="text-xs font-normal text-gray-400">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {m.email}
                      {m.jobTitle && <span className="hidden sm:inline"> · {m.jobTitle}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:contents">
                  <div>
                    {canManage ? (
                      <Dropdown
                        options={roleOptions}
                        value={m.role}
                        onChange={(v) => changeRole(m, v)}
                        header="Change role"
                        width={200}
                        triggerClassName={cn(
                          "gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition hover:opacity-80",
                          ROLE_BADGE[m.role],
                        )}
                        renderTrigger={(opt) => <>{opt?.label ?? m.role} ▾</>}
                      />
                    ) : (
                      <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", ROLE_BADGE[m.role])}>
                        {roleLabel(m.role)}
                      </span>
                    )}
                  </div>
                  <span className="hidden text-sm text-gray-700 md:block">{m.openTasks}</span>
                  <span className="hidden text-sm text-gray-500 md:block">{formatDate(m.joinedAt)}</span>
                  <div className="flex justify-end">
                    {(canManage || self) && (
                      <button
                        onClick={() => setRemoving(m)}
                        disabled={lastAdmin}
                        title={lastAdmin ? "A project needs at least one admin" : self ? "Leave project" : "Remove member"}
                        className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                      >
                        {self ? <LogOut className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {!canManage && (
          <p className="mt-4 text-center text-xs text-gray-400">Only project admins can add members or change roles.</p>
        )}
      </div>

      {addOpen && <AddMemberModal projectId={projectId} onClose={() => setAddOpen(false)} />}
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        loading={busy}
        danger
        title={removing?.userId === currentUserId ? "Leave project?" : "Remove member?"}
        confirmLabel={removing?.userId === currentUserId ? "Leave project" : "Remove"}
        description={
          removing?.userId === currentUserId
            ? `You'll lose access to ${projectTitle}. Tasks assigned to you will be unassigned.`
            : `${removing?.name} will lose access to ${projectTitle}. Their tasks will be unassigned.`
        }
      />
    </div>
  );
}

function AddMemberModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [results, setResults] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/candidates?q=${encodeURIComponent(q.trim())}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = (await res.json()) as { users?: Candidate[] };
        setResults(data.users ?? []);
        setLoading(false);
      } catch {
        // aborted or failed: the next keystroke retries
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, projectId]);

  const add = async (user: Candidate) => {
    setAdding(user.id);
    try {
      await api(`/api/projects/${projectId}/members`, "POST", { userId: user.id, role });
      toast({ tone: "success", title: `${user.name} added as ${roleLabel(role)}` });
      setResults((all) => all.filter((u) => u.id !== user.id));
      router.refresh();
    } catch (error) {
      toast({ tone: "error", title: "Couldn't add member", description: errorMessage(error) });
    } finally {
      setAdding(null);
    }
  };

  return (
    <Modal open onClose={onClose} title="Add members" description="Search people with a Product Board account by name or email.">
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people…" className={cn(inputClass, "pl-9")} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-gray-500">Add as</span>
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs font-medium">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition",
                  role === r.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="thin-scroll max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
          {loading && results.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
              <LoaderCircle className="h-4 w-4 animate-spin" /> Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">
              {q
                ? "No people found. They need to sign up first."
                : "Everyone you've worked with is already here. Search by name or email to find others."}
            </div>
          ) : (
            results.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-3 py-2.5">
                <Avatar name={u.name} color={u.avatarColor} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {u.email}
                    {u.jobTitle && ` · ${u.jobTitle}`}
                  </p>
                </div>
                <Button size="sm" variant="secondary" loading={adding === u.id} onClick={() => add(u)}>
                  <UserPlus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
