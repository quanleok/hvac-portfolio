"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { revokeServiceToken } from "./actions";

interface TokenItem {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

interface Props {
  tokens: TokenItem[];
}

function formatDate(iso: string | null): string {
  if (!iso) return "never";
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function TokenList({ tokens }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onRevoke(id: string, name: string) {
    if (!confirm(`Revoke "${name}"? Any agent using it will stop working.`)) return;
    startTransition(async () => {
      const result = await revokeServiceToken({ id });
      if (result.ok) router.refresh();
    });
  }

  return (
    <ul className="space-y-2">
      {tokens.map((t) => (
        <li
          key={t.id}
          className="flex items-center gap-3 rounded-md border border-[#25344a] bg-[#0f1c2d] p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{t.name}</p>
            <p className="text-xs text-[#9aafc5]">
              {t.prefix}… · created {formatDate(t.createdAt)} · last used {formatDate(t.lastUsedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRevoke(t.id, t.name)}
            disabled={pending}
            className="rounded-md border border-[#25344a] bg-[#1a2c44] px-3 py-2 text-xs font-extrabold text-white hover:bg-[#5a1a1a] disabled:opacity-60"
          >
            {pending ? "…" : "Revoke"}
          </button>
        </li>
      ))}
    </ul>
  );
}
