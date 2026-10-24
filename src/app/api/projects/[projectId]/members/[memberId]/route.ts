import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { members, tasks, users } from "@/db/schema";
import { isRole, roleLabel } from "@/lib/constants";
import {
  ApiError,
  getMembership,
  isUuid,
  readBody,
  requireApiUser,
  requireProjectRole,
  route,
} from "@/lib/server/access";
import { logHistory, notify } from "@/lib/server/activity";
import { getProject } from "@/lib/server/queries";

type Ctx = { params: Promise<{ projectId: string; memberId: string }> };

async function loadMember(projectId: string, memberId: string) {
  if (!isUuid(memberId)) throw new ApiError(404, "Member not found");
  const [row] = await db
    .select({ id: members.id, userId: members.userId, role: members.role, name: users.name })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(and(eq(members.id, memberId), eq(members.projectId, projectId)))
    .limit(1);
  if (!row) throw new ApiError(404, "Member not found");
  return row;
}

async function adminCount(projectId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(members)
    .where(and(eq(members.projectId, projectId), eq(members.role, "admin")));
  return row?.n ?? 0;
}

export async function PATCH(req: Request, { params }: Ctx) {
  return route(async () => {
    const { projectId, memberId } = await params;
    const { user } = await requireProjectRole(projectId, "admin");
    const target = await loadMember(projectId, memberId);
    const body = await readBody(req);
    if (!isRole(body.role)) throw new ApiError(400, "Invalid role");
    const role = body.role;
    if (role === target.role) return Response.json({ ok: true });
    if (target.role === "admin" && (await adminCount(projectId)) <= 1) {
      throw new ApiError(400, "A project needs at least one admin");
    }

    await db.update(members).set({ role }).where(eq(members.id, target.id));
    await logHistory(projectId, [
      { userId: user.id, action: "member", message: `Changed ${target.name}'s role to ${roleLabel(role)}` },
    ]);
    const project = await getProject(projectId);
    await notify({
      userIds: [target.userId],
      actorId: user.id,
      projectId,
      message: `changed your role in ${project?.title ?? "a project"} to ${roleLabel(role)}`,
      link: `/projects/${projectId}/members`,
    });
    return Response.json({ ok: true });
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return route(async () => {
    const { projectId, memberId } = await params;
    const user = await requireApiUser();
    const actor = await getMembership(projectId, user.id);
    if (!actor) throw new ApiError(404, "Project not found");
    const target = await loadMember(projectId, memberId);
    const self = target.userId === user.id;
    if (!self && actor.role !== "admin") throw new ApiError(403, "Only project admins can remove members");
    if (target.role === "admin" && (await adminCount(projectId)) <= 1) {
      throw new ApiError(400, self ? "You're the last admin. Promote someone else before leaving." : "A project needs at least one admin");
    }

    await db.delete(members).where(eq(members.id, target.id));
    await db
      .update(tasks)
      .set({ assigneeId: null })
      .where(and(eq(tasks.projectId, projectId), eq(tasks.assigneeId, target.userId)));
    await logHistory(projectId, [
      { userId: user.id, action: "member", message: self ? `${target.name} left the project` : `Removed ${target.name}` },
    ]);
    if (!self) {
      const project = await getProject(projectId);
      await notify({
        userIds: [target.userId],
        actorId: user.id,
        projectId: null,
        message: `removed you from ${project?.title ?? "a project"}`,
      });
    }
    return Response.json({ ok: true });
  });
}
