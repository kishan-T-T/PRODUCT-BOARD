import { eq } from "drizzle-orm";
import { db } from "@/db";
import { history, notifications, projects } from "@/db/schema";

type HistoryInput = Omit<typeof history.$inferInsert, "projectId">;

/** Bumps the project's updatedAt — clients poll this to refresh in real time. */
export async function touchProject(projectId: string) {
  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId));
}

export async function logHistory(projectId: string, entries: HistoryInput[]) {
  if (entries.length) await db.insert(history).values(entries.map((e) => ({ ...e, projectId })));
  await touchProject(projectId);
}

export async function notify(opts: {
  userIds: Array<string | null | undefined>;
  actorId: string;
  projectId: string | null;
  message: string;
  link?: string;
}) {
  const ids = [...new Set(opts.userIds.filter((id): id is string => !!id && id !== opts.actorId))];
  if (!ids.length) return;
  await db.insert(notifications).values(
    ids.map((userId) => ({
      userId,
      actorId: opts.actorId,
      projectId: opts.projectId,
      message: opts.message,
      link: opts.link ?? null,
    })),
  );
}
