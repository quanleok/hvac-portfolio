"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteRecord } from "@/app/admin/actions";

type TableName =
  | "clients"
  | "documents"
  | "document_items"
  | "equipment"
  | "notes"
  | "services";

interface DeleteButtonProps {
  table: TableName;
  id: string;
  clientId: string;
  label: string;
  redirectTo?: string;
}

export function DeleteButton({
  table,
  id,
  clientId,
  label,
  redirectTo,
}: DeleteButtonProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-md border border-[#c53030] bg-transparent px-3 py-1.5 text-sm font-semibold text-[#ff6166] transition hover:bg-[#3a0f14] disabled:opacity-70"
        onClick={() => {
          const confirmed = window.confirm(`Delete this ${label.toLowerCase()}?`);

          if (!confirmed) {
            return;
          }

          setError("");

          startTransition(async () => {
            const result = await deleteRecord({ table, id, clientId });

            if (!result.ok) {
              setError(result.error);
              return;
            }

            if (redirectTo) {
              router.push(redirectTo);
            }

            router.refresh();
          });
        }}
      >
        {isPending ? "Deleting…" : `Delete ${label}`}
      </button>
      {error ? <p className="text-sm text-amber-200">{error}</p> : null}
    </div>
  );
}
