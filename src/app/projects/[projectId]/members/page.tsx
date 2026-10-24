import { and, count, eq, notInArray } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MembersManager } from "@/components/project/members-manager";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { getMembership, hasRole } from "@/lib/server/access";
import { requireUser } from "@/lib/server/auth";
import { getProject, getProjectMembers } from "@/lib/server/queries";

export const metadata: Metadata = { title: "Manage Members" };

export default async function MembersPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const user = await requireUser();
  const membership = await getMembership(projectId, user.id);
  const project = await getProject(projectId);
  if (!membership || !project) notFound();

  const [members, open] = await Promise.all([
    getProjectMembers(project.id),
    db
      .select({ assigneeId: tasks.assigneeId, n: count() })
      .from(tasks)
      .where(and(eq(tasks.projectId, project.id), notInArray(tasks.status, ["done", "cancelled"])))
      .groupBy(tasks.assigneeId),
  ]);

  const rows = members.map((m) => ({ ...m, openTasks: open.find((o) => o.assigneeId === m.userId)?.n ?? 0 }));

  return (
    <MembersManager
      projectId={project.id}
      projectTitle={project.title}
      members={rows}
      currentUserId={user.id}
      canManage={hasRole(membership.role, "admin")}
    />
  );
}
