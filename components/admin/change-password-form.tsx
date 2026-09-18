"use client";

import { useState, useTransition, type FormEvent } from "react";
import { changeOwnerPassword } from "@/app/admin/actions";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await changeOwnerPassword({
        currentPassword,
        password,
        confirmPassword,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      setSuccess("Password updated.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          className="text-sm font-semibold text-[#9aafc5]"
          htmlFor="admin-current-password"
        >
          Current password
        </label>
        <input
          id="admin-current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="admin-input"
          placeholder="Current password…"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="admin-new-password">
          New password
        </label>
        <input
          id="admin-new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="admin-input"
          placeholder="New password…"
          required
        />
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-semibold text-[#9aafc5]"
          htmlFor="admin-confirm-password"
        >
          Confirm password
        </label>
        <input
          id="admin-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="admin-input"
          placeholder="Confirm password…"
          required
        />
      </div>

      {error ? (
        <p className="text-sm text-amber-200" aria-live="polite" role="status">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-300" aria-live="polite" role="status">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-md bg-[#1f6feb] px-4 py-2 text-sm font-bold text-white hover:bg-[#3178e6] disabled:opacity-70"
      >
        {isPending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
