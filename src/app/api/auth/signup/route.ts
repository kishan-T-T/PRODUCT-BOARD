import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AVATAR_COLORS, DEMO_DOMAIN } from "@/lib/constants";
import { ApiError, EMAIL_RE, readBody, route, str } from "@/lib/server/access";
import { createSession, hashPassword } from "@/lib/server/auth";
import { createStarterProject } from "@/lib/server/seed";

export async function POST(req: Request) {
  return route(async () => {
    const body = await readBody(req);
    const name = str(body.name, 60);
    const email = str(body.email, 120).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (name.length < 2) throw new ApiError(400, "Please enter your full name");
    if (!EMAIL_RE.test(email)) throw new ApiError(400, "Please enter a valid email address");
    if (email.endsWith(DEMO_DOMAIN)) throw new ApiError(400, "That email domain is reserved for demo accounts");
    if (password.length < 6) throw new ApiError(400, "Password must be at least 6 characters");

    const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (exists) throw new ApiError(409, "An account with this email already exists");

    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const [user] = await db
      .insert(users)
      .values({ name, email, passwordHash: hashPassword(password), avatarColor })
      .returning({ id: users.id });

    const project = await createStarterProject(user.id);
    await createSession(user.id);
    return Response.json({ ok: true, redirect: `/projects/${project.id}/board` }, { status: 201 });
  });
}
