"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { duplicateDocumentRecord } from "@/app/admin/actions";

interface DuplicateDocumentButtonProps {
  clientId: string;
  documentId: string;
  targetType?: "quote" | "invoice";
}

export function DuplicateDocumentButton({
  clientId,
  documentId,
  targetType = "invoice",
}: DuplicateDocumentButtonProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        className="admin-secondary-button"
        onClick={() => {
          setError("");
          startTransition(async () => {
            const result = await duplicateDocumentRecord({
              clientId,
              documentId,
              targetType,
            });

            if (!result.ok) {
              setError(result.error);
              return;
            }

            router.push(`/admin/documents/${result.id}`);
            router.refresh();
          });
        }}
      >
        {isPending ? "Converting…" : targetType === "invoice" ? "Convert to invoice" : "Duplicate"}
      </button>
      {error ? <p className="text-sm text-amber-200">{error}</p> : null}
    </div>
  );
}
