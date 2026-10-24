import Link from "next/link";
import { labelInfo } from "@/lib/constants";
import { cn } from "@/lib/utils";

type IconProps = { size?: number; className?: string };

export function StatusIcon({ status, size = 14, className }: IconProps & { status: string }) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 14 14",
    className: cn("shrink-0", className),
    "aria-hidden": true,
  } as const;
  switch (status) {
    case "backlog":
      return (
        <svg {...p}>
          <circle cx="7" cy="7" r="6" fill="none" stroke="#95a2b3" strokeWidth="1.5" strokeDasharray="1.4 1.74" />
        </svg>
      );
    case "in_progress":
      return (
        <svg {...p}>
          <circle cx="7" cy="7" r="6" fill="none" stroke="#f2c94c" strokeWidth="1.5" />
          <path d="M7 3.5 A3.5 3.5 0 0 1 7 10.5 Z" fill="#f2c94c" />
        </svg>
      );
    case "done":
      return (
        <svg {...p}>
          <circle cx="7" cy="7" r="6.5" fill="#5e6ad2" />
          <path
            d="M4.3 7.2l1.8 1.8 3.6-3.8"
            fill="none"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "cancelled":
      return (
        <svg {...p}>
          <circle cx="7" cy="7" r="6.5" fill="#95a2b3" />
          <path d="M5 5l4 4M9 5l-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <circle cx="7" cy="7" r="6" fill="none" stroke="#b8bfc8" strokeWidth="1.5" />
        </svg>
      );
  }
}

function Bars({ filled, size, className }: { filled: number } & IconProps) {
  const on = "#6b6f76";
  const off = "#d4d7dc";
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" className={cn("shrink-0", className)} aria-hidden>
      <rect x="1.5" y="8" width="2.6" height="4.5" rx="0.6" fill={filled >= 1 ? on : off} />
      <rect x="5.7" y="5" width="2.6" height="7.5" rx="0.6" fill={filled >= 2 ? on : off} />
      <rect x="9.9" y="2" width="2.6" height="10.5" rx="0.6" fill={filled >= 3 ? on : off} />
    </svg>
  );
}

export function PriorityIcon({ priority, size = 14, className }: IconProps & { priority: string }) {
  switch (priority) {
    case "urgent":
      return (
        <svg width={size} height={size} viewBox="0 0 14 14" className={cn("shrink-0", className)} aria-hidden>
          <rect x="1" y="1" width="12" height="12" rx="3" fill="#f2994a" />
          <path d="M7 3.8v4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="7" cy="10.1" r="0.9" fill="#fff" />
        </svg>
      );
    case "high":
      return <Bars filled={3} size={size} className={className} />;
    case "medium":
      return <Bars filled={2} size={size} className={className} />;
    case "low":
      return <Bars filled={1} size={size} className={className} />;
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 14 14" className={cn("shrink-0", className)} aria-hidden>
          <circle cx="3" cy="7" r="1.1" fill="#95a2b3" />
          <circle cx="7" cy="7" r="1.1" fill="#95a2b3" />
          <circle cx="11" cy="7" r="1.1" fill="#95a2b3" />
        </svg>
      );
  }
}

export function LabelDot({ color, className }: { color: string; className?: string }) {
  return (
    <span className={cn("inline-block h-2 w-2 shrink-0 rounded-full", className)} style={{ backgroundColor: color }} />
  );
}

export function LabelPill({ label, className }: { label: string; className?: string }) {
  const info = labelInfo(label);
  if (info.value === "none") return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600",
        className,
      )}
    >
      <LabelDot color={info.color} />
      {info.label}
    </span>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M16 3 L29 10 L16 17 L3 10 Z" fill="currentColor" />
      <path
        d="M3 15.5 L16 22.5 L29 15.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M3 21.5 L16 28.5 L29 21.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function Logo({ href = "/", className, light }: { href?: string; className?: string; light?: boolean }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      <LogoMark className={cn("h-7 w-7", light ? "text-white" : "text-indigo-600")} />
      <span className={cn("text-[17px] font-bold tracking-tight", light ? "text-white" : "text-gray-900")}>
        Product Board
      </span>
    </Link>
  );
}

export function ProjectBadge({
  title,
  color,
  size = "sm",
}: {
  title: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "h-5 w-5 text-[11px] rounded", md: "h-8 w-8 text-sm rounded-md", lg: "h-10 w-10 text-base rounded-lg" };
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center font-bold text-white", sizes[size])}
      style={{ backgroundColor: color }}
    >
      {title.trim().charAt(0).toUpperCase() || "P"}
    </span>
  );
}
