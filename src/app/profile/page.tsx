import { and, count, eq, notInArray } from "drizzle-orm";
import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { Avatar } from "@/components/avatar";
import { ProfileForm } from "@/components/profile-form";
import { db } from "@/db";
import { members, tasks } from "@/db/schema";
import { DEMO_DOMAIN } from "@/lib/constants";
import { requireUser } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Edit profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const [[projectCount], [openCount], [doneCount]] = await Promise.all([
    db.select({ n: count() }).from(members).where(eq(members.userId, user.id)),
    db
      .select({ n: count() })
      .from(tasks)
      .where(and(eq(tasks.assigneeId, user.id), notInArray(tasks.status, ["done", "cancelled"]))),
    db.select({ n: count() }).from(tasks).where(and(eq(tasks.assigneeId, user.id), eq(tasks.status, "done"))),
  ]);

  const stats = [
    { label: "Projects", value: projectCount?.n ?? 0 },
    { label: "Open tasks", value: openCount?.n ?? 0 },
    { label: "Completed", value: doneCount?.n ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={user.name} color={user.avatarColor} size="xl" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-500">
              {user.jobTitle ? `${user.jobTitle} · ` : ""}
              {user.email}
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <ProfileForm user={user} isDemo={user.email.endsWith(DEMO_DOMAIN)} />
        </div>
      </main>
    </div>
  );
}
