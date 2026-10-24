import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { DEMO_DOMAIN } from "@/lib/constants";
import { ApiError, readBody, route, str } from "@/lib/server/access";
import { createSession, verifyPassword } from "@/lib/server/auth";
import { ensureDemoAccount } from "@/lib/server/seed";

export async function POST(req: Request) {
  return route(async () => {
    const body = await readBody(req);
    const email = str(body.email, 120).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) throw new ApiError(400, "Enter your email and password");

    // Demo accounts are created lazily so they always exist on a fresh database.
    if (email.endsWith(DEMO_DOMAIN)) await ensureDemoAccount();

    const [user] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new ApiError(401, "Incorrect email or password");
    }

    await createSession(user.id);
    return Response.json({ ok: true, redirect: "/projects" });
  });
}
