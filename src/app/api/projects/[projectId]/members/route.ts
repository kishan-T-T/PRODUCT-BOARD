import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members, users } from "@/db/schema";
import { isRole, roleLabel } from "@/lib/constants";
import { ApiError, getMembership, isUuid, readBody, requireProjectRole, route, str } from "@/lib/server/access";
import { logHistory, notify } from "@/lib/server/activity";
import { getProject, getProjectMembers } from "@/lib/server/queries";

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  return route(async () => {
    const { projectId } = await params;
    await requireProjectRole(projectId, "viewer");
    return Response.json({ members: await getProjectMembers(projectId) });
  });
}

export async function POST(req: Request, { params }: Ctx) {
  return route(async () => {
    const { projectId } = await params;
    const { user } = await requireProjectRole(projectId, "admin");
    const body = await readBody(req);
    const role = body.role ?? "member";
    if (!isRole(role)) throw new ApiError(400, "Invalid role");

    let target: { id: string; name: string } | undefined;
    if (isUuid(body.userId)) {
      [target] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, body.userId)).limit(1);
    } else if (typeof body.email === "string") {
      const email = str(body.email, 120).toLowerCase();
      [target] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.email, email)).limit(1);
    }
    if (!target) throw new ApiError(404, "No account found. They need to sign up first.");
    if (await getMembership(projectId, target.id)) throw new ApiError(409, `${target.name} is already a member`);

    const [member] = await db.insert(members).values({ projectId, userId: target.id, role }).returning();
    const project = await getProject(projectId);
    await logHistory(projectId, [{ userId: user.id, action: "member", message: `Added ${target.name} as ${roleLabel(role)}` }]);
    await notify({
      userIds: [target.id],
      actorId: user.id,
      projectId,
      message: `added you to ${project?.title ?? "a project"} as ${roleLabel(role)}`,
      link: `/projects/${projectId}/board`,
    });
    return Response.json({ member }, { status: 201 });
  });
}
