"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { createEquipmentRecord } from "@/app/admin/actions";
import { equipmentTypeLabels, equipmentTypes } from "@/lib/admin/schema";

interface CreateEquipmentFormProps {
  clientId: string;
}

export function CreateEquipmentForm({ clientId }: CreateEquipmentFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    unitType: "ac",
    brand: "",
    model: "",
    installYear: "",
    warrantyExpires: "",
    notes: "",
  });

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createEquipmentRecord({ clientId, ...form });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setForm({
        unitType: "ac",
        brand: "",
        model: "",
        installYear: "",
        warrantyExpires: "",
        notes: "",
      });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={form.unitType}
          onChange={(event) => updateField("unitType", event.target.value)}
          className="admin-input"
        >
          {equipmentTypes.map((equipmentType) => (
            <option key={equipmentType} value={equipmentType}>
              {equipmentTypeLabels[equipmentType]}
            </option>
          ))}
        </select>

        <input
          value={form.brand}
          onChange={(event) => updateField("brand", event.target.value)}
          className="admin-input"
          placeholder="Brand"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={form.model}
          onChange={(event) => updateField("model", event.target.value)}
          className="admin-input"
          placeholder="Model"
        />
        <input
          inputMode="numeric"
          value={form.installYear}
          onChange={(event) => updateField("installYear", event.target.value)}
          className="admin-input"
          placeholder="Install year"
        />
      </div>

      <input
        type="date"
        value={form.warrantyExpires}
        onChange={(event) => updateField("warrantyExpires", event.target.value)}
        className="admin-input"
      />

      <textarea
        rows={3}
        value={form.notes}
        onChange={(event) => updateField("notes", event.target.value)}
        className="admin-input"
        placeholder="Notes"
      />

      {error ? <p className="text-sm text-amber-200">{error}</p> : null}

      <button type="submit" disabled={isPending} className="inline-flex items-center justify-center rounded-md bg-[#1a2c44] px-4 py-2 text-sm font-bold text-white hover:bg-[#243654] border border-[#25344a] disabled:opacity-70">
        {isPending ? "Adding…" : "Add equipment"}
      </button>
    </form>
  );
}
