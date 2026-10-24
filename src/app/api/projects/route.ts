import { db } from "@/db";
import { history, members, projects } from "@/db/schema";
import { PROJECT_COLORS } from "@/lib/constants";
import { ApiError, COLOR_RE, readBody, requireApiUser, route, str } from "@/lib/server/access";
import { getProjectCards } from "@/lib/server/queries";
import { deriveProjectKey } from "@/lib/utils";

export async function GET() {
  return route(async () => {
    const user = await requireApiUser();
    return Response.json({ projects: await getProjectCards(user.id) });
  });
}

export async function POST(req: Request) {
  return route(async () => {
    const user = await requireApiUser();
    const body = await readBody(req);
    const title = str(body.title, 80);
    if (title.length < 2) throw new ApiError(400, "Project name must be at least 2 characters");
    const description = str(body.description, 500);
    const color = typeof body.color === "string" && COLOR_RE.test(body.color) ? body.color : PROJECT_COLORS[1];

    const project = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(projects)
        .values({ title, description, color, key: deriveProjectKey(title), ownerId: user.id })
        .returning();
      await tx.insert(members).values({ projectId: created.id, userId: user.id, role: "admin" });
      await tx
        .insert(history)
        .values({ projectId: created.id, userId: user.id, action: "project", message: `Created project ${title}` });
      return created;
    });

    return Response.json({ project }, { status: 201 });
  });
}
