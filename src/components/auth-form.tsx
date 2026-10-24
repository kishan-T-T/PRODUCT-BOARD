"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api, errorMessage } from "@/lib/api-client";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/constants";
import { DemoButton } from "./demo-button";
import { Button, Field, inputClass } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isSignup = mode === "signup";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api<{ redirect: string }>(`/api/auth/${mode}`, "POST", { name, email, password });
      router.push(res.redirect);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        {isSignup ? "Create your workspace" : "Welcome back"}
      </h1>
      <p className="mt-1.5 text-sm text-gray-500">
        {isSignup
          ? "Start organizing your work in less than a minute."
          : "Sign in to pick up right where you left off."}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        {isSignup && (
          <Field label="Full name">
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              autoComplete="name"
              required
            />
          </Field>
        )}
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            required
          />
        </Field>
        <Field label="Password" hint={isSignup ? "At least 6 characters." : undefined}>
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={isSignup ? 6 : undefined}
          />
        </Field>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <Button type="submit" size="lg" loading={loading} className="w-full">
          {isSignup ? "Create account" : "Sign in"} <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
        <span className="h-px flex-1 bg-gray-200" /> or <span className="h-px flex-1 bg-gray-200" />
      </div>

      <DemoButton className="w-full">
        <Sparkles className="h-4 w-4 text-indigo-500" /> Explore the live demo
      </DemoButton>
      <p className="mt-3 text-center text-xs text-gray-400">
        Demo login: {DEMO_EMAIL} / {DEMO_PASSWORD}
      </p>

      <p className="mt-8 text-center text-sm text-gray-500">
        {isSignup ? "Already have an account? " : "New to Product Board? "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-indigo-600 hover:text-indigo-500">
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
