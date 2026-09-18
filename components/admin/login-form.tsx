"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { loginOwner } from "@/app/admin/actions";

interface LoginFormProps {
  nextPath: string;
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await loginOwner({ email, password });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push(nextPath);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="admin-email">
          Account
        </label>
        <input
          id="admin-email"
          type="text"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="admin-input"
          placeholder="Account"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="admin-input"
          placeholder="Password"
          required
        />
      </div>

      {error ? (
        <p className="text-sm text-amber-200" aria-live="polite" role="status">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-md bg-[#1f6feb] px-4 py-2 text-sm font-bold text-white hover:bg-[#3178e6] disabled:opacity-70"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
