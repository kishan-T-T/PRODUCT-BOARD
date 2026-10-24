import { and, asc, eq, ilike, inArray, notInArray, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { members, users } from "@/db/schema";
import { requireProjectRole, route } from "@/lib/server/access";

type Ctx = { params: Promise<{ projectId: string }> };

/** People an admin can add: search everyone by name/email, or suggest teammates from other projects. */
export async function GET(req: Request, { params }: Ctx) {
  return route(async () => {
    const { projectId } = await params;
    const { user } = await requireProjectRole(projectId, "admin");
    const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 100);

    const inProject = db.select({ id: members.userId }).from(members).where(eq(members.projectId, projectId));
    const conds: SQL[] = [notInArray(users.id, inProject)];
    if (q) {
      const like = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
      const match = or(ilike(users.name, like), ilike(users.email, like));
      if (match) conds.push(match);
    } else {
      const myProjects = db.select({ id: members.projectId }).from(members).where(eq(members.userId, user.id));
      const teammates = db.selectDistinct({ id: members.userId }).from(members).where(inArray(members.projectId, myProjects));
      conds.push(inArray(users.id, teammates));
    }

    const rows = await db
      .select({ id: users.id, name: users.name, email: users.email, avatarColor: users.avatarColor, jobTitle: users.jobTitle })
      .from(users)
      .where(and(...conds))
      .orderBy(asc(users.name))
      .limit(8);
    return Response.json({ users: rows });
  });
}
