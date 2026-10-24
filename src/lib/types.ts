import type { Label, Priority, Role, Status } from "./constants";

export type UserLite = { id: string; name: string; avatarColor: string };

export type CurrentUserInfo = {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  avatarColor: string;
};

export type MemberInfo = {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  avatarColor: string;
  jobTitle: string;
  role: Role;
  joinedAt: string;
};

export type TaskItem = {
  id: string;
  number: number;
  key: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  label: Label;
  assigneeId: string | null;
  assignee: UserLite | null;
  startDate: string | null;
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectSummary = { id: string; title: string; key: string; color: string };

export type ProjectCard = ProjectSummary & {
  description: string;
  role: Role;
  memberId: string;
  members: UserLite[];
  total: number;
  done: number;
  updatedAt: string;
};
