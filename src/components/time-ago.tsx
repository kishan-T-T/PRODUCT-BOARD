"use client";

import { useEffect, useState } from "react";
import { formatDate, timeAgo } from "@/lib/utils";

export function TimeAgo({ date, className }: { date: string; className?: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);
  return (
    <time dateTime={date} title={formatDate(date)} className={className} suppressHydrationWarning>
      {timeAgo(date)}
    </time>
  );
}
