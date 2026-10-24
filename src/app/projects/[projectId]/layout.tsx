import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { LiveRefresher } from "@/components/live-refresher";
import { Sidebar } from "@/components/project/sidebar";
import { TaskModalProvider } from "@/components/project/task-modal";
import type { Role } from "@/lib/constants";
import { getMembership, hasRole } from "@/lib/server/access";
import { requireUser } from "@/lib/server/auth";
import { getProject, getProjectMembers, getUserProjects } from "@/lib/server/queries";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const membership = await getMembership(projectId, user.id);
  if (!membership) notFound();
  const project = await getProject(projectId);
  if (!project) notFound();

  const [members, projects] = await Promise.all([getProjectMembers(project.id), getUserProjects(user.id)]);
  const role = membership.role as Role;
  const summary = { id: project.id, title: project.title, key: project.key, color: project.color };

  return (
    <TaskModalProvider projectId={project.id} projectKey={project.key} members={members} canEdit={hasRole(role, "member")}>
      <div className="flex h-dvh flex-col bg-white lg:flex-row">
        <Suspense fallback={<div className="hidden w-60 shrink-0 border-r border-gray-200 bg-gray-50 lg:block" />}>
          <Sidebar project={summary} role={role} user={user} projects={projects} />
        </Suspense>
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
      <LiveRefresher projectId={project.id} />
    </TaskModalProvider>
  );
}
