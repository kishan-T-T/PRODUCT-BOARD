import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { comments, tasks, users } from "@/db/schema";
import { ApiError, isUuid, readBody, requireProjectRole, route, str } from "@/lib/server/access";
import { logHistory, notify } from "@/lib/server/activity";
import { getProject } from "@/lib/server/queries";

type Ctx = { params: Promise<{ projectId: string; taskId: string }> };

async function loadTask(projectId: string, taskId: string) {
  if (!isUuid(taskId)) throw new ApiError(404, "Task not found");
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))
    .limit(1);
  if (!task) throw new ApiError(404, "Task not found");
  return task;
}

export async function GET(_req: Request, { params }: Ctx) {
  return route(async () => {
    const { projectId, taskId } = await params;
    await requireProjectRole(projectId, "viewer");
    const task = await loadTask(projectId, taskId);
    const rows = await db
      .select({ id: comments.id, body: comments.body, createdAt: comments.createdAt, author: users.name })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.taskId, task.id))
      .orderBy(asc(comments.createdAt));
    return Response.json({ comments: rows });
  });
}

export async function POST(req: Request, { params }: Ctx) {
  return route(async () => {
    const { projectId, taskId } = await params;
    const { user } = await requireProjectRole(projectId, "member");
    const task = await loadTask(projectId, taskId);
    const body = await readBody(req);
    const text = str(body.body, 10000);
    if (!text) throw new ApiError(400, "Comment can't be empty");

    const [comment] = await db.insert(comments).values({ taskId: task.id, authorId: user.id, body: text }).returning();
    await logHistory(projectId, [
      {
        taskId: task.id,
        taskNumber: task.number,
        taskTitle: task.title,
        userId: user.id,
        action: "commented",
        message: "Commented on Task",
      },
    ]);
    const project = await getProject(projectId);
    await notify({
      userIds: [task.assigneeId, task.authorId],
      actorId: user.id,
      projectId,
      message: `commented on ${project?.key ?? "TASK"}-${task.number}: ${task.title}`,
      link: `/projects/${projectId}/tasks/${task.id}`,
    });
    return Response.json({ comment }, { status: 201 });
  });
}
