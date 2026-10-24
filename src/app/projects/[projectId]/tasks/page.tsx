import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FilterBar } from "@/components/project/filter-bar";
import { TaskList } from "@/components/project/task-list";
import { getMembership, hasRole } from "@/lib/server/access";
import { requireUser } from "@/lib/server/auth";
import {
  fetchTasks,
  getProject,
  getProjectMembers,
  hasActiveFilters,
  parseTaskFilters,
  type SearchParams,
} from "@/lib/server/queries";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const membership = await getMembership(projectId, user.id);
  const project = await getProject(projectId);
  if (!membership || !project) notFound();

  const filters = parseTaskFilters(await searchParams);
  const [tasks, members] = await Promise.all([
    fetchTasks(project.id, project.key, filters, user.id),
    getProjectMembers(project.id),
  ]);

  return (
    <div className="flex h-full flex-col">
      <Suspense>
        <FilterBar
          view="list"
          members={members}
          title={filters.assignee === "me" ? "My Tasks" : "All Tasks"}
          count={tasks.length}
        />
      </Suspense>
      <div className="min-h-0 flex-1">
        <TaskList
          tasks={tasks}
          members={members}
          projectId={project.id}
          canEdit={hasRole(membership.role, "member")}
          hasFilters={hasActiveFilters(filters)}
        />
      </div>
    </div>
  );
}
