import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { members, projects, tasks, users } from "@/db/schema";
import {
  PRIORITY_RANK,
  isLabel,
  isPriority,
  isStatus,
  type Label,
  type Priority,
  type Role,
  type Status,
} from "@/lib/constants";
import type { MemberInfo, ProjectCard, ProjectSummary, TaskItem } from "@/lib/types";
import { taskKey } from "@/lib/utils";
import { isUuid } from "./access";

export type SearchParams = Record<string, string | string[] | undefined>;

export type TaskFilters = {
  status: Status[];
  priority: Priority[];
  label: Label[];
  assignee: string;
  q: string;
  sort: string;
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const list = (v: string | string[] | undefined) =>
  first(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export function parseTaskFilters(sp: SearchParams): TaskFilters {
  return {
    status: list(sp.status).filter(isStatus),
    priority: list(sp.priority).filter(isPriority),
    label: list(sp.label).filter(isLabel),
    assignee: first(sp.assignee),
    q: first(sp.q).trim().slice(0, 100),
    sort: first(sp.sort) || "priority",
  };
}

export function hasActiveFilters(f: TaskFilters, ignoreStatus = false) {
  return (
    (!ignoreStatus && f.status.length > 0) ||
    f.priority.length > 0 ||
    f.label.length > 0 ||
    !!f.assignee ||
    !!f.q
  );
}

export const getProject = cache(async (projectId: string) => {
  if (!isUuid(projectId)) return null;
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return project ?? null;
});

export const getProjectMembers = cache(async (projectId: string): Promise<MemberInfo[]> => {
  const rows = await db
    .select({
      memberId: members.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      avatarColor: users.avatarColor,
      jobTitle: users.jobTitle,
      role: members.role,
      joinedAt: members.createdAt,
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(eq(members.projectId, projectId))
    .orderBy(asc(members.createdAt));
  return rows.map((r) => ({ ...r, role: r.role as Role, joinedAt: r.joinedAt.toISOString() }));
});

export async function getUserProjects(userId: string): Promise<ProjectSummary[]> {
  return db
    .select({ id: projects.id, title: projects.title, key: projects.key, color: projects.color })
    .from(members)
    .innerJoin(projects, eq(members.projectId, projects.id))
    .where(eq(members.userId, userId))
    .orderBy(desc(projects.updatedAt));
}

export async function getProjectCards(userId: string): Promise<ProjectCard[]> {
  const rows = await db
    .select({ project: projects, role: members.role, memberId: members.id })
    .from(members)
    .innerJoin(projects, eq(members.projectId, projects.id))
    .where(eq(members.userId, userId))
    .orderBy(desc(projects.updatedAt));
  const ids = rows.map((r) => r.project.id);
  if (!ids.length) return [];

  const [stats, people] = await Promise.all([
    db
      .select({
        projectId: tasks.projectId,
        total: count(),
        done: sql<number>`count(*) filter (where ${tasks.status} = 'done')`.mapWith(Number),
      })
      .from(tasks)
      .where(inArray(tasks.projectId, ids))
      .groupBy(tasks.projectId),
    db
      .select({ projectId: members.projectId, id: users.id, name: users.name, avatarColor: users.avatarColor })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(inArray(members.projectId, ids))
      .orderBy(asc(members.createdAt)),
  ]);

  return rows.map(({ project, role, memberId }) => {
    const s = stats.find((x) => x.projectId === project.id);
    return {
      id: project.id,
      title: project.title,
      key: project.key,
      color: project.color,
      description: project.description,
      role: role as Role,
      memberId,
      members: people
        .filter((p) => p.projectId === project.id)
        .map((p) => ({ id: p.id, name: p.name, avatarColor: p.avatarColor })),
      total: s?.total ?? 0,
      done: s?.done ?? 0,
      updatedAt: project.updatedAt.toISOString(),
    };
  });
}

type TaskRow = typeof tasks.$inferSelect;

export function toTaskItem(
  t: TaskRow,
  projectKey: string,
  assignee: { name: string | null; avatarColor: string | null },
): TaskItem {
  return {
    id: t.id,
    number: t.number,
    key: taskKey(projectKey, t.number),
    title: t.title,
    description: t.description,
    status: (isStatus(t.status) ? t.status : "todo") as Status,
    priority: (isPriority(t.priority) ? t.priority : "none") as Priority,
    label: (isLabel(t.label) ? t.label : "none") as Label,
    assigneeId: t.assigneeId,
    assignee:
      t.assigneeId && assignee.name
        ? { id: t.assigneeId, name: assignee.name, avatarColor: assignee.avatarColor ?? "#64748b" }
        : null,
    startDate: t.startDate,
    dueDate: t.dueDate,
    position: t.position,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export function sortTasks(items: TaskItem[], sort: string) {
  const sorted = [...items];
  switch (sort) {
    case "manual":
      return sorted.sort((a, b) => a.position - b.position);
    case "created":
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "updated":
      return sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case "due":
      return sorted.sort((a, b) => {
        if (a.dueDate === b.dueDate) return b.createdAt.localeCompare(a.createdAt);
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    case "title":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted.sort(
        (a, b) =>
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.createdAt.localeCompare(a.createdAt),
      );
  }
}

export async function fetchTasks(
  projectId: string,
  projectKey: string,
  filters: TaskFilters,
  userId: string,
  options: { ignoreStatus?: boolean; sort?: string } = {},
) {
  const conds: SQL[] = [eq(tasks.projectId, projectId)];
  if (!options.ignoreStatus && filters.status.length) conds.push(inArray(tasks.status, filters.status));
  if (filters.priority.length) conds.push(inArray(tasks.priority, filters.priority));
  if (filters.label.length) conds.push(inArray(tasks.label, filters.label));
  if (filters.assignee === "me") conds.push(eq(tasks.assigneeId, userId));
  else if (filters.assignee === "unassigned") conds.push(isNull(tasks.assigneeId));
  else if (isUuid(filters.assignee)) conds.push(eq(tasks.assigneeId, filters.assignee));
  if (filters.q) {
    const like = `%${filters.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    const match = or(ilike(tasks.title, like), ilike(tasks.description, like));
    if (match) conds.push(match);
  }

  const rows = await db
    .select({ task: tasks, assigneeName: users.name, assigneeColor: users.avatarColor })
    .from(tasks)
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(and(...conds));

  const items = rows.map((r) =>
    toTaskItem(r.task, projectKey, { name: r.assigneeName, avatarColor: r.assigneeColor }),
  );
  return sortTasks(items, options.sort ?? filters.sort);
}

export async function countProjectTasks(projectId: string) {
  const [row] = await db.select({ n: count() }).from(tasks).where(eq(tasks.projectId, projectId));
  return row?.n ?? 0;
}
