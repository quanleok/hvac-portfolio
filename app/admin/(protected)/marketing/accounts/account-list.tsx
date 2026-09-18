"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { disconnectAccount } from "./actions";

interface AccountItem {
  id: string;
  name: string;
  accountId: string;
  connectedAt: string;
}

interface Props {
  accounts: AccountItem[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AccountList({ accounts }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDisconnect(id: string, name: string) {
    if (!confirm(`Disconnect ${name}? You can reconnect later.`)) return;
    startTransition(async () => {
      const result = await disconnectAccount({ id });
      if (result.ok) router.refresh();
    });
  }

  return (
    <ul className="space-y-2">
      {accounts.map((a) => (
        <li
          key={a.id}
          className="flex items-center gap-3 rounded-md border border-[#25344a] bg-[#0f1c2d] p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{a.name}</p>
            <p className="text-xs text-[#9aafc5]">
              ID {a.accountId} · Connected {formatDate(a.connectedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDisconnect(a.id, a.name)}
            disabled={pending}
            className="rounded-md border border-[#25344a] bg-[#1a2c44] px-3 py-2 text-xs font-extrabold text-white hover:bg-[#5a1a1a] disabled:opacity-60"
          >
            {pending ? "…" : "Disconnect"}
          </button>
        </li>
      ))}
    </ul>
  );
}
