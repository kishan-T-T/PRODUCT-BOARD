import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { comments, history, members, notifications, projects, tasks, users } from "@/db/schema";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  roleLabel,
  statusLabel,
  type Label,
  type Priority,
  type Role,
  type Status,
} from "@/lib/constants";
import { toISODate } from "@/lib/utils";
import { hashPassword } from "./auth";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const TEAM = [
  { email: DEMO_EMAIL, name: "Demo User", jobTitle: "Product Lead", avatarColor: "#4f46e5" },
  { email: "masoom@productboard.app", name: "Masoom Kumar", jobTitle: "Frontend Engineer", avatarColor: "#0ea5e9" },
  { email: "vishwajeet@productboard.app", name: "Vishwajeet Raj", jobTitle: "Backend Engineer", avatarColor: "#10b981" },
  { email: "neha@productboard.app", name: "Neha Soni", jobTitle: "Product Designer", avatarColor: "#ec4899" },
  { email: "alex@productboard.app", name: "Alex Rivera", jobTitle: "Stakeholder", avatarColor: "#f59e0b" },
  { email: "priya@productboard.app", name: "Priya Sharma", jobTitle: "QA Engineer", avatarColor: "#8b5cf6" },
  { email: "sam@productboard.app", name: "Sam Lee", jobTitle: "DevOps Engineer", avatarColor: "#14b8a6" },
];

const nameOf = (email: string) => TEAM.find((u) => u.email === email)?.name ?? email;
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISODate(d);
};
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);

type SeedTask = {
  title: string;
  status: Status;
  priority: Priority;
  label: Label;
  assignee: string | null;
  author: string;
  age: number; // hours since creation
  movedAfter?: number; // hours after creation the status changed
  start?: number;
  due?: number;
  description?: string;
};

type SeedProject = {
  title: string;
  key: string;
  color: string;
  description: string;
  owner: string;
  age: number;
  members: Array<[string, Role]>;
  tasks: SeedTask[];
};

const M = "masoom@productboard.app";
const V = "vishwajeet@productboard.app";
const N = "neha@productboard.app";
const A = "alex@productboard.app";
const S = "sam@productboard.app";
const D = DEMO_EMAIL;

const PRODUCT_BOARD: SeedProject = {
  title: "Product Board",
  key: "PB",
  color: "#f59e0b",
  description: "A hassle-free project management platform for individuals and small teams.",
  owner: D,
  age: 80,
  members: [
    [D, "admin"],
    [M, "admin"],
    [V, "member"],
    [N, "member"],
    [A, "viewer"],
  ],
  tasks: [
    { title: "Setup Github Repo and Team", status: "done", priority: "high", label: "improvement", assignee: V, author: D, age: 78, movedAfter: 3 },
    { title: "Product Board Team Setup", status: "done", priority: "medium", label: "none", assignee: D, author: D, age: 77, movedAfter: 2 },
    {
      title: "Backend Stack [MERN || MEAN || PERN || Django]",
      status: "done",
      priority: "urgent",
      label: "feature",
      assignee: V,
      author: M,
      age: 76,
      movedAfter: 6,
      description:
        "## Decision\nWe compared four stacks and picked **Node + PostgreSQL** for relational task history.\n\n| Stack | Verdict |\n| --- | --- |\n| MERN | Great DX, weak relations |\n| PERN | ✅ Chosen |\n| Django | Solid, team less familiar |",
    },
    {
      title: "Backend Data Modeling",
      status: "done",
      priority: "high",
      label: "feature",
      assignee: V,
      author: V,
      age: 70,
      movedAfter: 20,
      start: -3,
      due: -1,
      description:
        "Model **projects, members, tasks and history**.\n\n- [x] Users & sessions\n- [x] Projects & members (roles)\n- [x] Tasks with status, priority, label\n- [x] History entries that survive task deletion",
    },
    { title: "Backend Routing", status: "in_progress", priority: "high", label: "feature", assignee: V, author: V, age: 60, movedAfter: 10, start: -2, due: 2 },
    { title: "Backend Controllers", status: "in_progress", priority: "medium", label: "feature", assignee: M, author: V, age: 58, movedAfter: 12, start: -1, due: 4 },
    {
      title: "Realtime notifications for members",
      status: "in_progress",
      priority: "urgent",
      label: "feature",
      assignee: D,
      author: M,
      age: 40,
      movedAfter: 8,
      start: -1,
      due: 1,
      description:
        "## Goal\nNotify members instantly when tasks change.\n\n- [x] Notification model\n- [x] Bell with unread count\n- [ ] Toasts for incoming events\n\n> Keep payloads small and only send what changed.",
    },
    {
      title: "Boards: drag and drop between columns",
      status: "todo",
      priority: "high",
      label: "feature",
      assignee: M,
      author: D,
      age: 36,
      due: 5,
      description: "Cards should move between **Backlog → Todo → In Progress → Done** and keep their order.",
    },
    {
      title: "Role-based access for members",
      status: "todo",
      priority: "urgent",
      label: "feature",
      assignee: D,
      author: M,
      age: 30,
      due: 3,
      description:
        "Three roles:\n\n1. **Admin** manages the project and members\n2. **Member** works on tasks\n3. **Viewer** has read-only access",
    },
    { title: "Avatar overflows in sidebar on small screens", status: "todo", priority: "low", label: "bug", assignee: N, author: N, age: 26 },
    { title: "History page shows wrong timestamps", status: "todo", priority: "high", label: "bug", assignee: V, author: A, age: 20, due: -1 },
    { title: "Advanced filters for tasks", status: "todo", priority: "medium", label: "improvement", assignee: M, author: D, age: 18, due: 7 },
    { title: "Landing page polish", status: "backlog", priority: "medium", label: "improvement", assignee: N, author: N, age: 14 },
    { title: "Email reminders for due dates", status: "backlog", priority: "low", label: "feature", assignee: null, author: D, age: 10 },
    { title: "Infinite scroll for tasks and history", status: "backlog", priority: "none", label: "improvement", assignee: null, author: V, age: 8 },
    { title: "Comments on tasks", status: "done", priority: "medium", label: "feature", assignee: M, author: D, age: 50, movedAfter: 30 },
    { title: "Get more developers on board", status: "cancelled", priority: "low", label: "none", assignee: D, author: D, age: 75, movedAfter: 40 },
  ],
};

const MARKETING: SeedProject = {
  title: "Marketing Website",
  key: "MW",
  color: "#10b981",
  description: "Launch site, docs and blog for Product Board.",
  owner: N,
  age: 48,
  members: [
    [N, "admin"],
    [D, "member"],
    [S, "member"],
  ],
  tasks: [
    { title: "Write launch blog post", status: "todo", priority: "high", label: "feature", assignee: D, author: N, age: 40, due: 6 },
    { title: "Pricing page copy", status: "in_progress", priority: "medium", label: "improvement", assignee: N, author: N, age: 38, movedAfter: 5 },
    { title: "Broken link in footer", status: "todo", priority: "low", label: "bug", assignee: S, author: D, age: 20 },
    { title: "SEO meta tags", status: "backlog", priority: "medium", label: "improvement", assignee: null, author: N, age: 16 },
    { title: "Hero illustration", status: "done", priority: "medium", label: "feature", assignee: N, author: N, age: 44, movedAfter: 12 },
  ],
};

async function seedProject(tx: Tx, ids: Record<string, string>, spec: SeedProject) {
  const [project] = await tx
    .insert(projects)
    .values({
      title: spec.title,
      key: spec.key,
      color: spec.color,
      description: spec.description,
      ownerId: ids[spec.owner],
      taskCounter: spec.tasks.length,
      createdAt: hoursAgo(spec.age),
      updatedAt: new Date(),
    })
    .returning();

  await tx.insert(members).values(
    spec.members.map(([email, role], i) => ({
      projectId: project.id,
      userId: ids[email],
      role,
      createdAt: hoursAgo(spec.age - i * 0.2),
    })),
  );

  const entries: Array<typeof history.$inferInsert> = spec.members.slice(1).map(([email, role], i) => ({
    projectId: project.id,
    userId: ids[spec.owner],
    action: "member",
    message: `Added ${nameOf(email)} as ${roleLabel(role)}`,
    createdAt: hoursAgo(spec.age - 0.1 - i * 0.2),
  }));

  const inserted = await tx
    .insert(tasks)
    .values(
      spec.tasks.map((t, i) => ({
        projectId: project.id,
        number: i + 1,
        title: t.title,
        description: t.description ?? "",
        status: t.status,
        priority: t.priority,
        label: t.label,
        assigneeId: t.assignee ? ids[t.assignee] : null,
        authorId: ids[t.author],
        startDate: t.start !== undefined ? daysFromNow(t.start) : null,
        dueDate: t.due !== undefined ? daysFromNow(t.due) : null,
        position: (i + 1) * 1024,
        createdAt: hoursAgo(t.age),
        updatedAt: hoursAgo(t.movedAfter !== undefined ? t.age - t.movedAfter : t.age),
      })),
    )
    .returning({ id: tasks.id, number: tasks.number, title: tasks.title });

  spec.tasks.forEach((t, i) => {
    const row = inserted.find((r) => r.number === i + 1);
    if (!row) return;
    const base = { projectId: project.id, taskId: row.id, taskNumber: row.number, taskTitle: row.title };
    entries.push({ ...base, userId: ids[t.author], action: "created", message: `Created Task: ${t.title}`, createdAt: hoursAgo(t.age) });
    if (t.movedAfter !== undefined) {
      entries.push({
        ...base,
        userId: ids[t.assignee ?? t.author],
        action: "updated",
        field: "status",
        fromValue: "todo",
        toValue: t.status,
        message: `Updated Task Status to ${statusLabel(t.status)}`,
        createdAt: hoursAgo(t.age - t.movedAfter),
      });
    }
  });

  await tx.insert(history).values(entries);
  return { project, tasks: inserted };
}

/** Creates (once) the shared demo workspace and returns the demo user + landing project. */
export async function ensureDemoAccount(): Promise<{ userId: string; projectId: string | null }> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(727274)`);
    const emails = TEAM.map((u) => u.email);
    let team = await tx.select({ id: users.id, email: users.email }).from(users).where(inArray(users.email, emails));
    if (team.length < TEAM.length) {
      const passwordHash = hashPassword(DEMO_PASSWORD);
      await tx
        .insert(users)
        .values(TEAM.map((u) => ({ ...u, passwordHash })))
        .onConflictDoNothing({ target: users.email });
      team = await tx.select({ id: users.id, email: users.email }).from(users).where(inArray(users.email, emails));
    }
    const ids = Object.fromEntries(team.map((u) => [u.email, u.id])) as Record<string, string>;
    const demoId = ids[DEMO_EMAIL];

    const [existing] = await tx
      .select({ projectId: members.projectId })
      .from(members)
      .innerJoin(projects, eq(projects.id, members.projectId))
      .where(eq(members.userId, demoId))
      .orderBy(asc(projects.createdAt))
      .limit(1);
    if (existing) return { userId: demoId, projectId: existing.projectId };

    const pb = await seedProject(tx, ids, PRODUCT_BOARD);
    const mw = await seedProject(tx, ids, MARKETING);
    const pbTask = (n: number) => pb.tasks.find((t) => t.number === n)!;
    const realtime = pbTask(7);
    const rbac = pbTask(9);

    await tx.insert(comments).values([
      {
        taskId: realtime.id,
        authorId: ids[M],
        body: "Socket events are wired up for task updates. Should we debounce board moves?",
        createdAt: hoursAgo(20),
      },
      {
        taskId: realtime.id,
        authorId: ids[D],
        body: "Yes, let's batch moves within **300ms** and only refresh what changed.",
        createdAt: hoursAgo(19),
      },
      { taskId: rbac.id, authorId: ids[N], body: "Added mockups for the members screen in Figma 🎨", createdAt: hoursAgo(6) },
    ]);
    await tx.insert(history).values([
      { projectId: pb.project.id, taskId: realtime.id, taskNumber: 7, taskTitle: realtime.title, userId: ids[M], action: "commented", message: "Commented on Task", createdAt: hoursAgo(20) },
      { projectId: pb.project.id, taskId: realtime.id, taskNumber: 7, taskTitle: realtime.title, userId: ids[D], action: "commented", message: "Commented on Task", createdAt: hoursAgo(19) },
      { projectId: pb.project.id, taskId: rbac.id, taskNumber: 9, taskTitle: rbac.title, userId: ids[N], action: "commented", message: "Commented on Task", createdAt: hoursAgo(6) },
    ]);

    await tx.insert(notifications).values([
      {
        userId: demoId,
        actorId: ids[N],
        projectId: pb.project.id,
        message: `commented on PB-9: ${rbac.title}`,
        link: `/projects/${pb.project.id}/tasks/${rbac.id}`,
        createdAt: hoursAgo(6),
      },
      {
        userId: demoId,
        actorId: ids[M],
        projectId: pb.project.id,
        message: `assigned you PB-9: ${rbac.title}`,
        link: `/projects/${pb.project.id}/tasks/${rbac.id}`,
        createdAt: hoursAgo(29),
      },
      {
        userId: demoId,
        actorId: ids[N],
        projectId: mw.project.id,
        message: "added you to Marketing Website as Member",
        link: `/projects/${mw.project.id}/board`,
        read: true,
        createdAt: hoursAgo(47),
      },
    ]);

    return { userId: demoId, projectId: pb.project.id };
  });
}

const STARTER_TASKS: Array<{ title: string; status: Status; priority: Priority; label: Label; description?: string }> = [
  {
    title: "👋 Welcome to Product Board",
    status: "done",
    priority: "none",
    label: "none",
    description:
      "Product Board keeps your work **straightforward and maintainable**.\n\n- Use **Tasks** for a dense list view\n- Use **Board** to drag cards between columns\n- Check **History** to see every change\n\nPress `C` anywhere in a project to create a task.",
  },
  { title: "Drag this card to In Progress", status: "todo", priority: "medium", label: "feature" },
  { title: "Invite a teammate from Manage Members", status: "todo", priority: "high", label: "improvement" },
  { title: "Open a task to write markdown and comment", status: "in_progress", priority: "low", label: "feature" },
  { title: "Try filters: click Urgent in the sidebar", status: "backlog", priority: "urgent", label: "none" },
];

export async function createStarterProject(userId: string) {
  return db.transaction(async (tx) => {
    const [project] = await tx
      .insert(projects)
      .values({
        title: "My First Project",
        key: "MFP",
        color: "#4f46e5",
        description: "A sandbox to explore Product Board. Rename it or create a new project anytime.",
        ownerId: userId,
        taskCounter: STARTER_TASKS.length,
      })
      .returning();
    await tx.insert(members).values({ projectId: project.id, userId, role: "admin" });
    const inserted = await tx
      .insert(tasks)
      .values(
        STARTER_TASKS.map((t, i) => ({
          projectId: project.id,
          number: i + 1,
          title: t.title,
          description: t.description ?? "",
          status: t.status,
          priority: t.priority,
          label: t.label,
          assigneeId: userId,
          authorId: userId,
          position: (i + 1) * 1024,
        })),
      )
      .returning({ id: tasks.id, number: tasks.number, title: tasks.title });
    await tx.insert(history).values(
      inserted.map((t) => ({
        projectId: project.id,
        taskId: t.id,
        taskNumber: t.number,
        taskTitle: t.title,
        userId,
        action: "created",
        message: `Created Task: ${t.title}`,
      })),
    );
    return project;
  });
}
