"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Markdown } from "./markdown";

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Add a description… (Markdown supported)",
  rows = 7,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/60 px-2">
        <div className="flex">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "-mb-px border-b-2 px-2.5 py-1.5 text-xs font-medium capitalize transition",
                tab === t ? "border-indigo-600 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-gray-400">**bold** _italic_ - [ ] task</span>
      </div>
      {tab === "write" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          autoFocus={autoFocus}
          className="block w-full resize-y bg-transparent px-3 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
        />
      ) : (
        <div className="min-h-[150px] px-3 py-2">
          {value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-gray-400">Nothing to preview yet.</p>}
        </div>
      )}
    </div>
  );
}
