import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members, projects } from "@/db/schema";
import { ApiError, COLOR_RE, readBody, requireProjectRole, route, str } from "@/lib/server/access";
import { logHistory, notify } from "@/lib/server/activity";
import { getProject } from "@/lib/server/queries";

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  return route(async () => {
    const { projectId } = await params;
    const { membership } = await requireProjectRole(projectId, "viewer");
    return Response.json({ project: await getProject(projectId), role: membership.role });
  });
}

export async function PATCH(req: Request, { params }: Ctx) {
  return route(async () => {
    const { projectId } = await params;
    const { user } = await requireProjectRole(projectId, "admin");
    const body = await readBody(req);
    const patch: Partial<typeof projects.$inferInsert> = {};

    if ("title" in body) {
      const title = str(body.title, 80);
      if (title.length < 2) throw new ApiError(400, "Project name must be at least 2 characters");
      patch.title = title;
    }
    if ("description" in body) patch.description = str(body.description, 500);
    if ("color" in body) {
      if (typeof body.color !== "string" || !COLOR_RE.test(body.color)) throw new ApiError(400, "Invalid color");
      patch.color = body.color;
    }
    if (!Object.keys(patch).length) return Response.json({ ok: true });

    const current = await getProject(projectId);
    const [project] = await db
      .update(projects)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .returning();
    const renamed = patch.title && patch.title !== current?.title;
    await logHistory(projectId, [
      { userId: user.id, action: "project", message: renamed ? `Renamed project to ${patch.title}` : "Updated project details" },
    ]);
    return Response.json({ project });
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return route(async () => {
    const { projectId } = await params;
    const { user } = await requireProjectRole(projectId, "admin");
    const project = await getProject(projectId);
    const people = await db.select({ userId: members.userId }).from(members).where(eq(members.projectId, projectId));
    await db.delete(projects).where(eq(projects.id, projectId));
    await notify({
      userIds: people.map((p) => p.userId),
      actorId: user.id,
      projectId: null,
      message: `deleted the project ${project?.title ?? ""}`.trim(),
    });
    return Response.json({ ok: true });
  });
}
