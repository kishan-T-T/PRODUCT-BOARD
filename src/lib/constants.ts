export const STATUSES = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const PRIORITIES = [
  { value: "none", label: "No Priority" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;

export const LABELS = [
  { value: "bug", label: "Bug", color: "#eb5757" },
  { value: "feature", label: "Feature", color: "#bb87fc" },
  { value: "improvement", label: "Improvement", color: "#4ea7fc" },
  { value: "none", label: "No Label", color: "#95a2b3" },
] as const;

export const ROLES = [
  {
    value: "admin",
    label: "Admin",
    description: "Full control: edit the project, manage members and every task.",
  },
  { value: "member", label: "Member", description: "Create, edit, move and comment on tasks." },
  { value: "viewer", label: "Viewer", description: "Read-only access to tasks, boards and history." },
] as const;

export type Status = (typeof STATUSES)[number]["value"];
export type Priority = (typeof PRIORITIES)[number]["value"];
export type Label = (typeof LABELS)[number]["value"];
export type Role = (typeof ROLES)[number]["value"];

export const ROLE_RANK: Record<Role, number> = { viewer: 0, member: 1, admin: 2 };
export const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };

export const isStatus = (v: unknown): v is Status =>
  typeof v === "string" && STATUSES.some((s) => s.value === v);
export const isPriority = (v: unknown): v is Priority =>
  typeof v === "string" && PRIORITIES.some((s) => s.value === v);
export const isLabel = (v: unknown): v is Label => typeof v === "string" && LABELS.some((s) => s.value === v);
export const isRole = (v: unknown): v is Role => typeof v === "string" && ROLES.some((s) => s.value === v);

export const statusLabel = (v: string) => STATUSES.find((s) => s.value === v)?.label ?? v;
export const priorityLabel = (v: string) => PRIORITIES.find((s) => s.value === v)?.label ?? v;
export const labelInfo = (v: string) => LABELS.find((s) => s.value === v) ?? LABELS[3];
export const roleLabel = (v: string) => ROLES.find((s) => s.value === v)?.label ?? v;

export const AVATAR_COLORS = [
  "#4f46e5",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#64748b",
];

export const PROJECT_COLORS = [
  "#f59e0b",
  "#4f46e5",
  "#10b981",
  "#ef4444",
  "#0ea5e9",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
];

export const DEMO_EMAIL = "demo@productboard.app";
export const DEMO_PASSWORD = "demo1234";
export const DEMO_DOMAIN = "@productboard.app";
