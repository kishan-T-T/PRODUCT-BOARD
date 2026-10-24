import { route } from "@/lib/server/access";
import { createSession } from "@/lib/server/auth";
import { ensureDemoAccount } from "@/lib/server/seed";

export async function POST() {
  return route(async () => {
    const { userId, projectId } = await ensureDemoAccount();
    await createSession(userId);
    return Response.json({ ok: true, redirect: projectId ? `/projects/${projectId}/board` : "/projects" });
  });
}
