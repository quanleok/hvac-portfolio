"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { createDocumentItemRecord } from "@/app/admin/actions";

interface CreateDocumentItemFormProps {
  clientId: string;
  documentId: string;
}

export function CreateDocumentItemForm({
  clientId,
  documentId,
}: CreateDocumentItemFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    description: "",
    quantity: "1",
    unitPrice: "",
  });

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createDocumentItemRecord({
        clientId,
        documentId,
        ...form,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setForm({
        description: "",
        quantity: "1",
        unitPrice: "",
      });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px_160px]">
        <input
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
          className="admin-input"
          placeholder="Line item description"
          required
        />
        <input
          inputMode="decimal"
          value={form.quantity}
          onChange={(event) => updateField("quantity", event.target.value)}
          className="admin-input"
          placeholder="Qty"
        />
        <input
          inputMode="decimal"
          value={form.unitPrice}
          onChange={(event) => updateField("unitPrice", event.target.value)}
          className="admin-input"
          placeholder="Unit price"
        />
      </div>

      {error ? (
        <p className="text-sm text-amber-200" aria-live="polite" role="status">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className="admin-secondary-button w-full sm:w-auto">
        {isPending ? "Adding…" : "Add line item"}
      </button>
    </form>
  );
}
