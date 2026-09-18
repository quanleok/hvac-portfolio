"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { logoutOwner } from "@/app/admin/actions";

export function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError("");

          startTransition(async () => {
            const result = await logoutOwner();

            if (!result.ok) {
              setError(result.error);
              return;
            }

            router.push("/admin/login");
            router.refresh();
          });
        }}
        className="flex h-10 items-center justify-center rounded-md bg-[#1a2c44] px-3 text-sm font-bold text-white hover:bg-[#243654] border border-[#25344a] disabled:opacity-70"
      >
        {isPending ? "Signing out…" : "Sign out"}
      </button>
      {error ? (
        <p className="text-sm text-amber-200" aria-live="polite" role="status">
          {error}
        </p>
      ) : null}
    </div>
  );
}
