"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { createNoteRecord } from "@/app/admin/actions";

interface CreateNoteFormProps {
  clientId: string;
}

export function CreateNoteForm({ clientId }: CreateNoteFormProps) {
  const router = useRouter();
  const [noteText, setNoteText] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createNoteRecord({ clientId, noteText });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setNoteText("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        rows={4}
        value={noteText}
        onChange={(event) => setNoteText(event.target.value)}
        className="admin-input"
        placeholder="Add a note for this client…"
      />

      {error ? (
        <p className="text-sm text-amber-200" aria-live="polite" role="status">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className="inline-flex items-center justify-center rounded-md bg-[#1a2c44] px-4 py-2 text-sm font-bold text-white hover:bg-[#243654] border border-[#25344a] disabled:opacity-70">
        {isPending ? "Saving…" : "Add note"}
      </button>
    </form>
  );
}
