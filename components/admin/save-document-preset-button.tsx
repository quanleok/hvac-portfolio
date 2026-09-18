"use client";

import { useState, useTransition } from "react";
import { saveDocumentAsPresetAction } from "@/app/admin/actions";
import { documentTypeLabels, type DocumentType } from "@/lib/admin/schema";

interface SaveDocumentPresetButtonProps {
  clientId: string;
  documentId: string;
  documentType: DocumentType;
}

export function SaveDocumentPresetButton({
  clientId,
  documentId,
  documentType,
}: SaveDocumentPresetButtonProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        className="admin-secondary-button"
        onClick={() => {
          setError("");
          setSuccess("");
          startTransition(async () => {
            const result = await saveDocumentAsPresetAction({
              clientId,
              documentId,
            });

            if (!result.ok) {
              setError(result.error);
              return;
            }

            setSuccess(`Default ${documentTypeLabels[documentType].toLowerCase()} template saved.`);
          });
        }}
      >
        {isPending
          ? "Saving template…"
          : `Save as default ${documentTypeLabels[documentType].toLowerCase()} template`}
      </button>
      {error ? <p className="text-sm text-amber-200">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
    </div>
  );
}
