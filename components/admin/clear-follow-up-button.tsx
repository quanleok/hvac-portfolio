"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { clearServiceFollowUp } from "@/app/admin/actions";

interface ClearFollowUpButtonProps {
  serviceId: string;
  clientId: string;
  label?: string;
  className?: string;
}

export function ClearFollowUpButton({
  serviceId,
  clientId,
  label = "Done",
  className,
}: ClearFollowUpButtonProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        className={className ?? "inline-flex items-center justify-center rounded-md bg-[#1a2c44] px-4 py-2 text-sm font-bold text-white hover:bg-[#243654] border border-[#25344a]"}
        onClick={() => {
          setError("");

          startTransition(async () => {
            const result = await clearServiceFollowUp({ serviceId, clientId });

            if (!result.ok) {
              setError(result.error);
              return;
            }

            router.refresh();
          });
        }}
      >
        {isPending ? "Saving…" : label}
      </button>
      {error ? (
        <p className="text-sm text-amber-200" aria-live="polite" role="status">
          {error}
        </p>
      ) : null}
    </div>
  );
}
