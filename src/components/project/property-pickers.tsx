"use client";

import { ChevronDown } from "lucide-react";
import { LABELS, PRIORITIES, STATUSES } from "@/lib/constants";
import type { MemberInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, UnassignedAvatar } from "../avatar";
import { LabelDot, PriorityIcon, StatusIcon } from "../icons";
import { Dropdown, type DropdownOption } from "../ui";

export const statusOptions: DropdownOption[] = STATUSES.map((s) => ({
  value: s.value,
  label: s.label,
  icon: <StatusIcon status={s.value} />,
}));

export const priorityOptions: DropdownOption[] = PRIORITIES.map((p) => ({
  value: p.value,
  label: p.label,
  icon: <PriorityIcon priority={p.value} />,
}));

export const labelOptions: DropdownOption[] = LABELS.map((l) => ({
  value: l.value,
  label: l.label,
  icon: <LabelDot color={l.color} />,
}));

export function assigneeOptions(members: MemberInfo[]): DropdownOption[] {
  return [
    { value: "", label: "Unassigned", icon: <UnassignedAvatar size="sm" /> },
    ...members.map((m) => ({
      value: m.userId,
      label: m.name,
      icon: <Avatar name={m.name} color={m.avatarColor} size="sm" />,
    })),
  ];
}

const TRIGGERS = {
  icon: "h-6 w-6 shrink-0 justify-center rounded hover:bg-gray-200/70",
  pill: "h-7 gap-1.5 rounded-md border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50",
  field: "h-8 w-full gap-2 rounded-md px-2 text-[13px] text-gray-800 hover:bg-gray-100",
} as const;

export function PropertyPicker({
  options,
  value,
  onChange,
  disabled,
  variant = "pill",
  searchable,
  title,
  header,
  align,
}: {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  variant?: keyof typeof TRIGGERS;
  searchable?: boolean;
  title?: string;
  header?: string;
  align?: "left" | "right";
}) {
  return (
    <Dropdown
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
      searchable={searchable}
      title={title}
      header={header}
      align={align}
      triggerClassName={cn(TRIGGERS[variant], disabled && "hover:bg-transparent")}
      renderTrigger={(opt) =>
        variant === "icon" ? (
          opt?.icon
        ) : (
          <>
            {opt?.icon}
            <span className={cn("truncate", variant === "field" && "flex-1 text-left")}>{opt?.label ?? "Select"}</span>
            {variant === "field" && !disabled && <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />}
          </>
        )
      }
    />
  );
}
