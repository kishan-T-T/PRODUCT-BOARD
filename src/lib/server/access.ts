import { and, eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { members } from "@/db/schema";
import { ROLE_RANK, type Role } from "@/lib/constants";
import { getCurrentUser } from "./auth";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

export function hasRole(role: string, min: Role) {
  return (ROLE_RANK[role as Role] ?? -1) >= ROLE_RANK[min];
}

export const getMembership = cache(async (projectId: string, userId: string) => {
  if (!isUuid(projectId)) return null;
  const [row] = await db
    .select()
    .from(members)
    .where(and(eq(members.projectId, projectId), eq(members.userId, userId)))
    .limit(1);
  return row ?? null;
});

export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Please sign in to continue");
  return user;
}

export async function requireProjectRole(projectId: string, min: Role) {
  const user = await requireApiUser();
  const membership = await getMembership(projectId, user.id);
  if (!membership) throw new ApiError(404, "Project not found");
  if (!hasRole(membership.role, min)) {
    throw new ApiError(403, min === "admin" ? "Only project admins can do that" : "You have read-only access");
  }
  return { user, membership };
}

export async function route(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status });
    console.error(error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const data: unknown = await req.json();
    return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function str(v: unknown, max = 5000) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const COLOR_RE = /^#[0-9a-f]{6}$/i;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export function dateOrNull(v: unknown, field: string): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v !== "string" || !DATE_RE.test(v) || Number.isNaN(Date.parse(v))) {
    throw new ApiError(400, `${field} must be a valid date`);
  }
  return v;
}
