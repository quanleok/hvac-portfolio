"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createServiceToken } from "./actions";

export function TokenCreator() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    if (!name.trim()) return setError("Name the token (e.g., 'Hermes bot').");
    startTransition(async () => {
      const result = await createServiceToken({ name: name.trim() });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRevealed(result.plaintext);
      setName("");
      router.refresh();
    });
  }

  function copy() {
    if (!revealed) return;
    navigator.clipboard
      .writeText(revealed)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setCopied(false));
  }

  function dismiss() {
    setRevealed(null);
    setCopied(false);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4 space-y-3">
        <label className="block">
          <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9aafc5]">
            New token
          </span>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Hermes bot"
              maxLength={80}
              className="flex-1 rounded-md border border-[#25344a] bg-[#0f1c2d] p-3 text-sm text-white placeholder:text-[#6c8096] focus:border-[#3a4e6e] focus:outline-none"
            />
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="rounded-md bg-[#1f6feb] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#1a5ed1] disabled:opacity-60"
            >
              {pending ? "…" : "Create"}
            </button>
          </div>
        </label>
        {error && (
          <p className="rounded-md border border-[#c53030] bg-[#5a1a1a] p-3 text-sm text-white">
            {error}
          </p>
        )}
      </div>

      {revealed && (
        <div className="rounded-md border border-[#2a7a3a] bg-[#0f1c2d] p-4 space-y-3">
          <p className="text-sm font-bold text-white">
            Token created — copy it now. It won&apos;t be shown again.
          </p>
          <pre className="overflow-x-auto rounded bg-[#07101c] p-3 text-xs text-[#d7e2f0]">
            {revealed}
          </pre>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copy}
              className="rounded-md bg-[#1f6feb] px-4 py-2 text-sm font-extrabold text-white hover:bg-[#1a5ed1]"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md border border-[#25344a] bg-[#1a2c44] px-4 py-2 text-sm font-extrabold text-white hover:bg-[#243654]"
            >
              I&apos;ve saved it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
