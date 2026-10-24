import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { ProjectsView } from "@/components/projects/projects-view";
import { requireUser } from "@/lib/server/auth";
import { getProjectCards } from "@/lib/server/queries";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await getProjectCards(user.id);
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} />
      <ProjectsView projects={projects} firstName={user.name.split(" ")[0] ?? user.name} />
    </div>
  );
}
