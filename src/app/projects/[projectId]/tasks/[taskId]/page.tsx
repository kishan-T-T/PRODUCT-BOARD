import { and, asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { ChevronRight, History, MessageSquare, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { LabelDot, PriorityIcon, ProjectBadge, StatusIcon } from "@/components/icons";
import { Markdown } from "@/components/markdown";
import { CommentComposer, TaskActions, TaskProperties } from "@/components/project/task-detail-client";
import { TimeAgo } from "@/components/time-ago";
import { db } from "@/db";
import { comments, history, tasks, users } from "@/db/schema";
import { labelInfo } from "@/lib/constants";
import { getMembership, hasRole, isUuid } from "@/lib/server/access";
import { requireUser } from "@/lib/server/auth";
import { getProject, getProjectMembers, toTaskItem } from "@/lib/server/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Task" };

type FeedItem =
  | { kind: "comment"; id: string; at: string; name: string; color: string | null; body: string }
  | {
      kind: "history";
      id: string;
      at: string;
      name: string;
      color: string | null;
      action: string;
      field: string | null;
      toValue: string | null;
      message: string;
    };

function historyIcon(item: Extract<FeedItem, { kind: "history" }>) {
  if (item.field === "status" && item.toValue) return <StatusIcon status={item.toValue} size={12} />;
  if (item.field === "priority" && item.toValue) return <PriorityIcon priority={item.toValue} size={12} />;
  if (item.field === "label" && item.toValue) return <LabelDot color={labelInfo(item.toValue).color} />;
  if (item.action === "created") return <Plus className="h-3 w-3 text-emerald-600" />;
  if (item.action === "commented") return <MessageSquare className="h-3 w-3 text-indigo-500" />;
  return <Pencil className="h-3 w-3 text-gray-400" />;
}

export default async function TaskPage({ params }: { params: Promise<{ projectId: string; taskId: string }> }) {
  const { projectId, taskId } = await params;
  const user = await requireUser();
  const membership = await getMembership(projectId, user.id);
  const project = await getProject(projectId);
  if (!membership || !project || !isUuid(taskId)) notFound();

  const author = alias(users, "author");
  const [row] = await db
    .select({
      task: tasks,
      assigneeName: users.name,
      assigneeColor: users.avatarColor,
      authorName: author.name,
      authorColor: author.avatarColor,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .leftJoin(author, eq(tasks.authorId, author.id))
    .where(and(eq(tasks.id, taskId), eq(tasks.projectId, project.id)))
    .limit(1);
  if (!row) notFound();

  const task = toTaskItem(row.task, project.key, { name: row.assigneeName, avatarColor: row.assigneeColor });
  const [commentRows, historyRows, members] = await Promise.all([
    db
      .select({ id: comments.id, body: comments.body, createdAt: comments.createdAt, name: users.name, color: users.avatarColor })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.taskId, task.id))
      .orderBy(asc(comments.createdAt)),
    db
      .select({ h: history, name: users.name, color: users.avatarColor })
      .from(history)
      .leftJoin(users, eq(history.userId, users.id))
      .where(and(eq(history.taskId, task.id), eq(history.projectId, project.id)))
      .orderBy(asc(history.createdAt)),
    getProjectMembers(project.id),
  ]);

  const feed: FeedItem[] = [
    ...commentRows.map((c) => ({
      kind: "comment" as const,
      id: c.id,
      at: c.createdAt.toISOString(),
      name: c.name ?? "Deleted user",
      color: c.color,
      body: c.body,
    })),
    ...historyRows
      .filter(({ h }) => h.action !== "commented")
      .map(({ h, name, color }) => ({
        kind: "history" as const,
        id: h.id,
        at: h.createdAt.toISOString(),
        name: name ?? "Deleted user",
        color,
        action: h.action,
        field: h.field,
        toValue: h.toValue,
        message: h.message,
      })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  const canEdit = hasRole(membership.role, "member");
  const tasksHref = `/projects/${project.id}/tasks`;

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-2.5 sm:px-6">
        <nav className="flex min-w-0 items-center gap-1.5 text-[13px] text-gray-500">
          <Link href={tasksHref} className="flex min-w-0 items-center gap-1.5 hover:text-gray-900">
            <ProjectBadge title={project.title} color={project.color} />
            <span className="hidden truncate sm:inline">{project.title}</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
          <Link href={tasksHref} className="hover:text-gray-900">
            Tasks
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
          <span className="font-medium text-gray-900">{task.key}</span>
        </nav>
        <TaskActions task={task} projectId={project.id} canEdit={canEdit} />
      </header>

      <div className="thin-scroll flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <div className="thin-scroll min-w-0 flex-1 lg:overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
              <StatusIcon status={task.status} size={12} />
              <span>{task.key}</span>
              <span>·</span>
              <span>
                Opened by <span className="text-gray-600">{row.authorName ?? "a former member"}</span>
              </span>
              <TimeAgo date={task.createdAt} />
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{task.title}</h1>
            <div className="mt-5">
              {task.description.trim() ? (
                <Markdown>{task.description}</Markdown>
              ) : (
                <p className="text-sm italic text-gray-400">No description provided.</p>
              )}
            </div>

            <div className="mt-10 border-t border-gray-100 pt-6">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <History className="h-4 w-4 text-gray-400" /> Activity
                <span className="font-normal text-gray-400">{feed.length}</span>
              </h2>
              <ol className="relative mt-5 space-y-4 before:absolute before:bottom-2 before:left-[9px] before:top-2 before:w-px before:bg-gray-200">
                {feed.map((item) =>
                  item.kind === "comment" ? (
                    <li key={item.id} className="relative flex gap-3">
                      <Avatar name={item.name} color={item.color} size="sm" className="relative mt-2.5 ring-4 ring-white" />
                      <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 text-xs">
                          <span className="font-semibold text-gray-900">{item.name}</span>
                          <span className="text-gray-400">commented</span>
                          <TimeAgo date={item.at} className="ml-auto text-gray-400" />
                        </div>
                        <div className="px-3 py-2.5">
                          <Markdown>{item.body}</Markdown>
                        </div>
                      </div>
                    </li>
                  ) : (
                    <li key={item.id} className="relative flex items-center gap-3 text-[13px]">
                      <span className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white ring-4 ring-white">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
                          {historyIcon(item)}
                        </span>
                      </span>
                      <p className="min-w-0 flex-1 text-gray-500">
                        <span className="font-medium text-gray-800">{item.name}</span> · {item.message}
                      </p>
                      <TimeAgo date={item.at} className="shrink-0 text-xs text-gray-400" />
                    </li>
                  ),
                )}
              </ol>
              <div className="mt-8">
                {canEdit ? (
                  <CommentComposer projectId={project.id} taskId={task.id} user={user} />
                ) : (
                  <p className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500">
                    You have viewer access. Ask a project admin for member access to comment.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="order-first shrink-0 border-b border-gray-200 bg-gray-50/60 px-4 py-5 lg:order-last lg:w-80 lg:overflow-y-auto lg:border-b-0 lg:border-l lg:px-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Properties</p>
          <TaskProperties task={task} projectId={project.id} members={members} canEdit={canEdit} />
          <div className="mt-6 space-y-2.5 border-t border-gray-200 pt-4 text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <span>Reporter</span>
              <span className="flex items-center gap-1.5 text-gray-700">
                <Avatar name={row.authorName ?? "?"} color={row.authorColor} size="xs" />
                {row.authorName ?? "Former member"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Created</span>
              <span className="text-gray-700">{formatDate(task.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last updated</span>
              <TimeAgo date={task.updatedAt} className="text-gray-700" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
