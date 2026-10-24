import { and, count, desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { notifications, projects, users } from "@/db/schema";
import { isUuid, readBody, requireApiUser, route } from "@/lib/server/access";

export async function GET() {
  return route(async () => {
    const user = await requireApiUser();
    const actor = alias(users, "actor");
    const [rows, [unread]] = await Promise.all([
      db
        .select({
          id: notifications.id,
          message: notifications.message,
          link: notifications.link,
          read: notifications.read,
          createdAt: notifications.createdAt,
          actorName: actor.name,
          actorColor: actor.avatarColor,
          projectTitle: projects.title,
        })
        .from(notifications)
        .leftJoin(actor, eq(notifications.actorId, actor.id))
        .leftJoin(projects, eq(notifications.projectId, projects.id))
        .where(eq(notifications.userId, user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(20),
      db
        .select({ n: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, user.id), eq(notifications.read, false))),
    ]);
    return Response.json(
      { unread: unread?.n ?? 0, items: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}

export async function PATCH(req: Request) {
  return route(async () => {
    const user = await requireApiUser();
    const body = await readBody(req);
    const ids: string[] = Array.isArray(body.ids) ? body.ids.filter(isUuid) : [];
    if (body.all === true) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));
    } else if (ids.length) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.userId, user.id), inArray(notifications.id, ids)));
    }
    return Response.json({ ok: true });
  });
}
