import { cn, initials } from "@/lib/utils";

const SIZES = {
  xs: "h-4 w-4 text-[7px]",
  sm: "h-5 w-5 text-[9px]",
  md: "h-7 w-7 text-[11px]",
  lg: "h-9 w-9 text-[13px]",
  xl: "h-16 w-16 text-xl",
} as const;

export function Avatar({
  name,
  color,
  size = "sm",
  className,
  title,
}: {
  name: string;
  color?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title ?? name}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold leading-none text-white",
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: color ?? "#94a3b8" }}
    >
      {initials(name)}
    </span>
  );
}

export function UnassignedAvatar({ size = "sm", className }: { size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      title="Unassigned"
      className={cn("inline-flex shrink-0 rounded-full border border-dashed border-gray-300 bg-white", SIZES[size], className)}
    />
  );
}

export function AvatarStack({
  users,
  max = 4,
  size = "md",
}: {
  users: Array<{ id: string; name: string; avatarColor: string }>;
  max?: number;
  size?: keyof typeof SIZES;
}) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <div className="flex -space-x-1.5">
      {shown.map((u) => (
        <Avatar key={u.id} name={u.name} color={u.avatarColor} size={size} className="ring-2 ring-white" />
      ))}
      {rest > 0 && (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-gray-100 font-medium text-gray-600 ring-2 ring-white",
            SIZES[size],
          )}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}
