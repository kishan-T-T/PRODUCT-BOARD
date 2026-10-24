import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { isLabel, isPriority, isStatus } from "@/lib/constants";
import {
  ApiError,
  dateOrNull,
  getMembership,
  isUuid,
  readBody,
  requireProjectRole,
  route,
  str,
} from "@/lib/server/access";
import { logHistory, notify } from "@/lib/server/activity";
import { fetchTasks, getProject, parseTaskFilters } from "@/lib/server/queries";

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(req: Request, { params }: Ctx) {
  return route(async () => {
    const { projectId } = await params;
    const { user } = await requireProjectRole(projectId, "viewer");
    const project = await getProject(projectId);
    if (!project) throw new ApiError(404, "Project not found");
    const filters = parseTaskFilters(Object.fromEntries(new URL(req.url).searchParams.entries()));
    return Response.json({ tasks: await fetchTasks(project.id, project.key, filters, user.id) });
  });
}

export async function POST(req: Request, { params }: Ctx) {
  return route(async () => {
    const { projectId } = await params;
    const { user } = await requireProjectRole(projectId, "member");
    const body = await readBody(req);

    const title = str(body.title, 200);
    if (!title) throw new ApiError(400, "Title is required");
    const status = body.status ?? "todo";
    const priority = body.priority ?? "none";
    const label = body.label ?? "none";
    if (!isStatus(status)) throw new ApiError(400, "Invalid status");
    if (!isPriority(priority)) throw new ApiError(400, "Invalid priority");
    if (!isLabel(label)) throw new ApiError(400, "Invalid label");

    const assigneeId = body.assigneeId ? String(body.assigneeId) : null;
    if (assigneeId && (!isUuid(assigneeId) || !(await getMembership(projectId, assigneeId)))) {
      throw new ApiError(400, "Assignee must be a member of this project");
    }
    const startDate = dateOrNull(body.startDate, "Start date");
    const dueDate = dateOrNull(body.dueDate, "Due date");
    if (startDate && dueDate && dueDate < startDate) throw new ApiError(400, "Due date can't be before the start date");

    const [counter] = await db
      .update(projects)
      .set({ taskCounter: sql`${projects.taskCounter} + 1`, updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .returning({ n: projects.taskCounter, key: projects.key });
    const [top] = await db
      .select({ v: sql<number>`coalesce(min(${tasks.position}), 1024)`.mapWith(Number) })
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), eq(tasks.status, status)));

    const [task] = await db
      .insert(tasks)
      .values({
        projectId,
        number: counter.n,
        title,
        description: str(body.description, 20000),
        status,
        priority,
        label,
        assigneeId,
        authorId: user.id,
        startDate,
        dueDate,
        position: (top?.v ?? 1024) - 1024,
      })
      .returning();

    await logHistory(projectId, [
      {
        taskId: task.id,
        taskNumber: task.number,
        taskTitle: task.title,
        userId: user.id,
        action: "created",
        message: `Created Task: ${task.title}`,
      },
    ]);
    if (assigneeId) {
      await notify({
        userIds: [assigneeId],
        actorId: user.id,
        projectId,
        message: `assigned you ${counter.key}-${task.number}: ${task.title}`,
        link: `/projects/${projectId}/tasks/${task.id}`,
      });
    }
    return Response.json({ task }, { status: 201 });
  });
}
