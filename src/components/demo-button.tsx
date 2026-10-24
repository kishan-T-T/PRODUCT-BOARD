"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { api, errorMessage } from "@/lib/api-client";
import { useToast } from "./toast";
import { Button } from "./ui";

export function DemoButton({
  children,
  className,
  variant = "secondary",
  size = "lg",
}: {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const start = async () => {
    setLoading(true);
    try {
      const { redirect } = await api<{ redirect: string }>("/api/auth/demo", "POST");
      router.push(redirect);
      router.refresh();
    } catch (error) {
      toast({ tone: "error", title: "Couldn't start the demo", description: errorMessage(error) });
      setLoading(false);
    }
  };

  return (
    <Button variant={variant} size={size} loading={loading} onClick={start} className={className}>
      {children}
    </Button>
  );
}
