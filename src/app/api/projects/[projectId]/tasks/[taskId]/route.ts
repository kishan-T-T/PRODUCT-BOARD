import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks, users } from "@/db/schema";
import { isLabel, isPriority, isStatus, labelInfo, priorityLabel, statusLabel } from "@/lib/constants";
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
import { logHistory, notify, touchProject } from "@/lib/server/activity";
import { getProject } from "@/lib/server/queries";
import { formatDate } from "@/lib/utils";

type Ctx = { params: Promise<{ projectId: string; taskId: string }> };
type Change = { field: string; from: string | null; to: string | null; message: string };

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
    return Response.json({ task: await loadTask(projectId, taskId) });
  });
}

export async function PATCH(req: Request, { params }: Ctx) {
  return route(async () => {
    const { projectId, taskId } = await params;
    const { user } = await requireProjectRole(projectId, "member");
    const task = await loadTask(projectId, taskId);
    const body = await readBody(req);
    const patch: Partial<typeof tasks.$inferInsert> = {};
    const changes: Change[] = [];

    if ("title" in body) {
      const title = str(body.title, 200);
      if (!title) throw new ApiError(400, "Title is required");
      if (title !== task.title) {
        patch.title = title;
        changes.push({ field: "title", from: task.title, to: title, message: `Renamed Task to ${title}` });
      }
    }
    if ("description" in body) {
      const description = str(body.description, 20000);
      if (description !== task.description) {
        patch.description = description;
        changes.push({ field: "description", from: null, to: null, message: "Updated Task Description" });
      }
    }
    if ("status" in body) {
      if (!isStatus(body.status)) throw new ApiError(400, "Invalid status");
      if (body.status !== task.status) {
        patch.status = body.status;
        changes.push({ field: "status", from: task.status, to: body.status, message: `Updated Task Status to ${statusLabel(body.status)}` });
      }
    }
    if ("priority" in body) {
      if (!isPriority(body.priority)) throw new ApiError(400, "Invalid priority");
      if (body.priority !== task.priority) {
        patch.priority = body.priority;
        changes.push({ field: "priority", from: task.priority, to: body.priority, message: `Updated Task Priority to ${priorityLabel(body.priority)}` });
      }
    }
    if ("label" in body) {
      if (!isLabel(body.label)) throw new ApiError(400, "Invalid label");
      if (body.label !== task.label) {
        patch.label = body.label;
        changes.push({ field: "label", from: task.label, to: body.label, message: `Updated Task Label to ${labelInfo(body.label).label}` });
      }
    }
    if ("assigneeId" in body) {
      const next = body.assigneeId ? String(body.assigneeId) : null;
      if (next !== task.assigneeId) {
        let name = "";
        if (next) {
          if (!isUuid(next) || !(await getMembership(projectId, next))) {
            throw new ApiError(400, "Assignee must be a member of this project");
          }
          const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, next)).limit(1);
          name = u?.name ?? "a member";
        }
        patch.assigneeId = next;
        changes.push({ field: "assignee", from: task.assigneeId, to: next, message: next ? `Assigned Task to ${name}` : "Unassigned Task" });
      }
    }
    if ("startDate" in body) {
      const value = dateOrNull(body.startDate, "Start date");
      if (value !== task.startDate) {
        patch.startDate = value;
        changes.push({ field: "startDate", from: task.startDate, to: value, message: value ? `Updated Start Date to ${formatDate(value)}` : "Removed Start Date" });
      }
    }
    if ("dueDate" in body) {
      const value = dateOrNull(body.dueDate, "Due date");
      if (value !== task.dueDate) {
        patch.dueDate = value;
        changes.push({ field: "dueDate", from: task.dueDate, to: value, message: value ? `Updated Due Date to ${formatDate(value)}` : "Removed Due Date" });
      }
    }
    const start = patch.startDate !== undefined ? patch.startDate : task.startDate;
    const due = patch.dueDate !== undefined ? patch.dueDate : task.dueDate;
    if (start && due && due < start) throw new ApiError(400, "Due date can't be before the start date");

    if ("position" in body) {
      if (typeof body.position !== "number" || !Number.isFinite(body.position)) throw new ApiError(400, "Invalid position");
      patch.position = body.position;
    }

    if (!Object.keys(patch).length) return Response.json({ task });

    const [updated] = await db
      .update(tasks)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(tasks.id, task.id))
      .returning();

    if (changes.length) {
      await logHistory(
        projectId,
        changes.map((c) => ({
          taskId: task.id,
          taskNumber: task.number,
          taskTitle: updated.title,
          userId: user.id,
          action: "updated",
          field: c.field,
          fromValue: c.from,
          toValue: c.to,
          message: c.message,
        })),
      );
    } else {
      await touchProject(projectId);
    }

    const project = await getProject(projectId);
    const key = `${project?.key ?? "TASK"}-${task.number}`;
    const link = `/projects/${projectId}/tasks/${task.id}`;
    if (patch.assigneeId) {
      await notify({ userIds: [patch.assigneeId], actorId: user.id, projectId, message: `assigned you ${key}: ${updated.title}`, link });
    }
    if (patch.status) {
      await notify({
        userIds: [updated.assigneeId, task.authorId].filter((id) => id !== patch.assigneeId),
        actorId: user.id,
        projectId,
        message: `moved ${key} to ${statusLabel(patch.status)}`,
        link,
      });
    }

    return Response.json({ task: updated });
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return route(async () => {
    const { projectId, taskId } = await params;
    const { user } = await requireProjectRole(projectId, "member");
    const task = await loadTask(projectId, taskId);
    await db.delete(tasks).where(eq(tasks.id, task.id));
    await logHistory(projectId, [
      {
        taskId: task.id,
        taskNumber: task.number,
        taskTitle: task.title,
        userId: user.id,
        action: "deleted",
        message: `Deleted Task: ${task.title}`,
      },
    ]);
    return Response.json({ ok: true });
  });
}
