"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** Polls the project's activity stamp and refreshes server data when teammates change something. */
export function LiveRefresher({ projectId }: { projectId: string }) {
  const router = useRouter();
  const last = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    last.current = null;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/projects/${projectId}/activity`, { cache: "no-store" });
        if (!active) return;
        if (res.status === 404) {
          router.push("/projects");
          return;
        }
        if (!res.ok) return;
        const { latest } = (await res.json()) as { latest: string };
        if (last.current && latest !== last.current) router.refresh();
        last.current = latest;
      } catch {
        // ignore transient errors
      }
    };
    tick();
    const timer = setInterval(tick, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [projectId, router]);

  return null;
}
