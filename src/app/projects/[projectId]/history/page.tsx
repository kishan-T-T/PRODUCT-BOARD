import { and, desc, eq, inArray, type SQL } from "drizzle-orm";
import { MessageSquare, Pencil, Plus, Trash2, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar } from "@/components/avatar";
import { LabelDot, PriorityIcon, StatusIcon } from "@/components/icons";
import { TimeAgo } from "@/components/time-ago";
import { db } from "@/db";
import { history, tasks, users } from "@/db/schema";
import { labelInfo } from "@/lib/constants";
import { getMembership } from "@/lib/server/access";
import { requireUser } from "@/lib/server/auth";
import { getProject, type SearchParams } from "@/lib/server/queries";
import { cn, dayLabel, taskKey } from "@/lib/utils";

export const metadata: Metadata = { title: "Project History" };

const TABS = [
  { value: "all", label: "All activity" },
  { value: "tasks", label: "Tasks" },
  { value: "comments", label: "Comments" },
  { value: "members", label: "Members" },
];

function actionIcon(action: string, field: string | null, toValue: string | null): ReactNode {
  if (action === "updated" && field === "status" && toValue) return <StatusIcon status={toValue} size={12} />;
  if (action === "updated" && field === "priority" && toValue) return <PriorityIcon priority={toValue} size={12} />;
  if (action === "updated" && field === "label" && toValue) return <LabelDot color={labelInfo(toValue).color} />;
  if (action === "created") return <Plus className="h-3 w-3 text-emerald-600" />;
  if (action === "deleted") return <Trash2 className="h-3 w-3 text-red-500" />;
  if (action === "commented") return <MessageSquare className="h-3 w-3 text-indigo-500" />;
  if (action === "member") return <Users className="h-3 w-3 text-amber-600" />;
  return <Pencil className="h-3 w-3 text-gray-400" />;
}

export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { projectId } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  const membership = await getMembership(projectId, user.id);
  const project = await getProject(projectId);
  if (!membership || !project) notFound();

  const type = typeof sp.type === "string" && TABS.some((t) => t.value === sp.type) ? sp.type : "all";
  const limit = Math.min(1000, Math.max(50, Number(sp.limit) || 100));

  const conds: SQL[] = [eq(history.projectId, project.id)];
  if (type === "tasks") conds.push(inArray(history.action, ["created", "updated", "deleted"]));
  if (type === "comments") conds.push(eq(history.action, "commented"));
  if (type === "members") conds.push(inArray(history.action, ["member", "project"]));

  const rows = await db
    .select({ h: history, name: users.name, color: users.avatarColor })
    .from(history)
    .leftJoin(users, eq(history.userId, users.id))
    .where(and(...conds))
    .orderBy(desc(history.createdAt))
    .limit(limit + 1);
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);

  const taskIds = [...new Set(items.map((r) => r.h.taskId).filter((id): id is string => !!id))];
  const existing = taskIds.length
    ? await db.select({ id: tasks.id }).from(tasks).where(inArray(tasks.id, taskIds))
    : [];
  const alive = new Set(existing.map((t) => t.id));

  const groups: Array<{ day: string; rows: typeof items }> = [];
  for (const row of items) {
    const day = dayLabel(row.h.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.rows.push(row);
    else groups.push({ day, rows: [row] });
  }

  const hrefFor = (t: string, l?: number) => {
    const params = new URLSearchParams();
    if (t !== "all") params.set("type", t);
    if (l) params.set("limit", String(l));
    const qs = params.toString();
    return `/projects/${project.id}/history${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 pt-3 sm:px-6">
        <div className="flex items-center gap-2">
          <h1 className="text-[15px] font-semibold text-gray-900">Project History</h1>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {items.length}
            {hasMore ? "+" : ""}
          </span>
        </div>
        <nav className="mt-2 flex gap-4 overflow-x-auto text-[13px]">
          {TABS.map((t) => (
            <Link
              key={t.value}
              href={hrefFor(t.value)}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 pb-2.5 pt-1 font-medium transition",
                type === t.value ? "border-indigo-600 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto pb-16">
        {groups.length === 0 && (
          <p className="px-6 py-20 text-center text-sm text-gray-500">No activity yet. Changes to this project will show up here.</p>
        )}
        {groups.map((g) => (
          <section key={g.day}>
            <div className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50/95 px-4 py-1.5 text-xs font-semibold text-gray-500 backdrop-blur sm:px-6">
              {g.day}
            </div>
            {g.rows.map(({ h, name, color }) => {
              const key = h.taskNumber ? taskKey(project.key, h.taskNumber) : null;
              const exists = !!h.taskId && alive.has(h.taskId);
              return (
                <div
                  key={h.id}
                  className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 text-[13px] transition hover:bg-gray-50 sm:px-6"
                >
                  <div className="flex w-40 shrink-0 items-center gap-2 sm:w-48">
                    <Avatar name={name ?? "Deleted user"} color={color} size="sm" />
                    <span className="truncate font-medium text-gray-900">{name ?? "Deleted user"}</span>
                  </div>
                  <span className="hidden w-16 shrink-0 sm:block">
                    {key ? (
                      exists ? (
                        <Link href={`/projects/${project.id}/tasks/${h.taskId}`} className="text-gray-500 hover:text-indigo-600">
                          {key}
                        </Link>
                      ) : (
                        <span className="text-gray-300 line-through" title="Task deleted">
                          {key}
                        </span>
                      )
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-gray-700">
                      {actionIcon(h.action, h.field, h.toValue)}
                      <span className="truncate">{h.message}</span>
                    </span>
                    {h.action !== "created" && h.action !== "deleted" && h.taskTitle && (
                      <span className="hidden truncate text-gray-400 md:inline">{h.taskTitle}</span>
                    )}
                  </div>
                  <TimeAgo date={h.createdAt.toISOString()} className="shrink-0 text-xs text-gray-400" />
                </div>
              );
            })}
          </section>
        ))}
        {hasMore && (
          <div className="flex justify-center py-6">
            <Link
              href={hrefFor(type, limit + 100)}
              scroll={false}
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Load older activity
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
