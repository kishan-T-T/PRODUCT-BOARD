import { route } from "@/lib/server/access";
import { destroySession } from "@/lib/server/auth";

export async function POST() {
  return route(async () => {
    await destroySession();
    return Response.json({ ok: true });
  });
}
