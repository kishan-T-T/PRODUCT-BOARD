export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function toParts(value: string | Date) {
  if (typeof value === "string" && DATE_ONLY.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return { y, m: m - 1, d };
  }
  const date = typeof value === "string" ? new Date(value) : value;
  return { y: date.getFullYear(), m: date.getMonth(), d: date.getDate() };
}

/** "Aug 28, 2021" */
export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const { y, m, d } = toParts(value);
  return `${MONTHS[m]} ${d}, ${y}`;
}

/** "Aug 28" (adds the year only when it differs from the current year) */
export function shortDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const { y, m, d } = toParts(value);
  return y === new Date().getFullYear() ? `${MONTHS[m]} ${d}` : `${MONTHS[m]} ${d}, ${y}`;
}

export function timeAgo(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${Math.max(1, minutes)} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return formatDate(date);
}

export function toISODate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function isOverdue(due: string | null, status: string) {
  return !!due && status !== "done" && status !== "cancelled" && due < todayISO();
}

export function dayLabel(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const iso = toISODate(date);
  const today = new Date();
  if (iso === toISODate(today)) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (iso === toISODate(yesterday)) return "Yesterday";
  return formatDate(date);
}

export function taskKey(projectKey: string, n: number) {
  return `${projectKey}-${n}`;
}

export function deriveProjectKey(title: string) {
  const words = title
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean);
  if (words.length >= 2) return words.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
  return (words[0] ?? "PRJ").slice(0, 3).toUpperCase() || "PRJ";
}
