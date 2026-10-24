import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requireProjectRole, route } from "@/lib/server/access";

type Ctx = { params: Promise<{ projectId: string }> };

/** Lightweight "has anything changed?" stamp polled by clients for live updates. */
export async function GET(_req: Request, { params }: Ctx) {
  return route(async () => {
    const { projectId } = await params;
    await requireProjectRole(projectId, "viewer");
    const [project] = await db
      .select({ updatedAt: projects.updatedAt })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    return Response.json(
      { latest: project?.updatedAt.toISOString() ?? null },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}
