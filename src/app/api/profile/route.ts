import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { DEMO_DOMAIN } from "@/lib/constants";
import { ApiError, COLOR_RE, EMAIL_RE, readBody, requireApiUser, route, str } from "@/lib/server/access";
import { hashPassword, verifyPassword } from "@/lib/server/auth";

export async function GET() {
  return route(async () => {
    const user = await requireApiUser();
    return Response.json({ user });
  });
}

export async function PATCH(req: Request) {
  return route(async () => {
    const user = await requireApiUser();
    const body = await readBody(req);
    const isDemo = user.email.endsWith(DEMO_DOMAIN);
    const patch: Partial<typeof users.$inferInsert> = {};

    if ("name" in body) {
      const name = str(body.name, 60);
      if (name.length < 2) throw new ApiError(400, "Name must be at least 2 characters");
      patch.name = name;
    }
    if ("jobTitle" in body) patch.jobTitle = str(body.jobTitle, 60);
    if ("avatarColor" in body) {
      if (typeof body.avatarColor !== "string" || !COLOR_RE.test(body.avatarColor)) {
        throw new ApiError(400, "Invalid avatar color");
      }
      patch.avatarColor = body.avatarColor;
    }
    if ("email" in body) {
      const email = str(body.email, 120).toLowerCase();
      if (email !== user.email) {
        if (isDemo) throw new ApiError(403, "Demo accounts can't change their email");
        if (!EMAIL_RE.test(email)) throw new ApiError(400, "Please enter a valid email address");
        if (email.endsWith(DEMO_DOMAIN)) throw new ApiError(400, "That email domain is reserved");
        const [taken] = await db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.email, email), ne(users.id, user.id)))
          .limit(1);
        if (taken) throw new ApiError(409, "That email is already in use");
        patch.email = email;
      }
    }
    if ("newPassword" in body) {
      if (isDemo) throw new ApiError(403, "Demo accounts can't change their password");
      const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
      const next = typeof body.newPassword === "string" ? body.newPassword : "";
      if (next.length < 6) throw new ApiError(400, "New password must be at least 6 characters");
      const [row] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
      if (!row || !verifyPassword(current, row.hash)) throw new ApiError(400, "Current password is incorrect");
      patch.passwordHash = hashPassword(next);
    }

    if (Object.keys(patch).length) await db.update(users).set(patch).where(eq(users.id, user.id));
    return Response.json({ ok: true });
  });
}
