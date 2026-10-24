"use client";

import { Check, KeyRound, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api, errorMessage } from "@/lib/api-client";
import { AVATAR_COLORS } from "@/lib/constants";
import type { CurrentUserInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";
import { useToast } from "./toast";
import { Button, Field, inputClass } from "./ui";

export function ProfileForm({ user, isDemo }: { user: CurrentUserInfo; isDemo: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [jobTitle, setJobTitle] = useState(user.jobTitle);
  const [avatarColor, setAvatarColor] = useState(user.avatarColor);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/profile", "PATCH", { name, email, jobTitle, avatarColor });
      toast({ tone: "success", title: "Profile updated" });
      router.refresh();
    } catch (error) {
      toast({ tone: "error", title: "Couldn't save profile", description: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await api("/api/profile", "PATCH", { currentPassword, newPassword });
      toast({ tone: "success", title: "Password changed" });
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast({ tone: "error", title: "Couldn't change password", description: errorMessage(error) });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={saveProfile} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
          <UserRound className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Personal information</h2>
        </div>
        <div className="space-y-5 px-6 py-5">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar name={name || user.name} color={avatarColor} size="xl" />
            <div>
              <p className="mb-2 text-[13px] font-medium text-gray-700">Avatar color</p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className="flex h-7 w-7 items-center justify-center rounded-full transition hover:scale-110"
                    style={{ backgroundColor: c }}
                    aria-label={`Avatar color ${c}`}
                  >
                    {avatarColor === c && <Check className="h-4 w-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} maxLength={60} required />
            </Field>
            <Field label="Job title">
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className={inputClass}
                maxLength={60}
                placeholder="e.g. Product Designer"
              />
            </Field>
          </div>
          <Field label="Email" hint={isDemo ? "Demo accounts can't change their email." : undefined}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              disabled={isDemo}
              required
            />
          </Field>
        </div>
        <div className="flex justify-end rounded-b-2xl border-t border-gray-100 bg-gray-50/70 px-6 py-3">
          <Button type="submit" loading={saving}>
            Save profile
          </Button>
        </div>
      </form>

      <form onSubmit={savePassword} className={cn("rounded-2xl border border-gray-200 bg-white shadow-sm", isDemo && "opacity-70")}>
        <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
          <KeyRound className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Password</h2>
        </div>
        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <Field label="Current password">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
              disabled={isDemo}
              required
            />
          </Field>
          <Field label="New password" hint="At least 6 characters.">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
              minLength={6}
              disabled={isDemo}
              required
            />
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-b-2xl border-t border-gray-100 bg-gray-50/70 px-6 py-3">
          <span className="text-xs text-gray-500">{isDemo ? "Password changes are disabled for demo accounts." : ""}</span>
          <Button type="submit" variant="secondary" loading={savingPassword} disabled={isDemo}>
            Change password
          </Button>
        </div>
      </form>
    </div>
  );
}
