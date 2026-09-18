"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateRecord } from "@/app/admin/actions";
import { getStatusToneForField } from "@/lib/admin/status-tone";

type TableName = "clients" | "documents" | "equipment" | "services";

interface InlineSelectFieldProps {
  table: TableName;
  id: string;
  clientId: string;
  field: string;
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
}

export function InlineSelectField({
  table,
  id,
  clientId,
  field,
  label,
  value,
  options,
}: InlineSelectFieldProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const currentLabel = options.find((option) => option.value === value)?.label ?? value;
  const tone = getStatusToneForField(table, field, isEditing ? draft : value);
  const isTonedField = tone !== null;

  function save(nextValue: string) {
    startTransition(async () => {
      const result = await updateRecord({
        table,
        id,
        clientId,
        values: { [field]: nextValue },
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setError("");
      setIsEditing(false);
      router.refresh();
    });
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c8096]">
          {label}
        </p>
        <select
          autoFocus
          value={draft}
          onBlur={() => save(draft)}
          onChange={(event) => setDraft(event.target.value)}
          disabled={isPending}
          data-status-tone={tone ?? undefined}
          className="admin-input"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error ? <p className="text-sm text-amber-200">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c8096]">
        {label}
      </p>
      <button
        type="button"
        onClick={() => {
          setError("");
          setIsEditing(true);
        }}
        data-status-tone={tone ?? undefined}
        className="admin-inline-display w-full text-left"
      >
        {isTonedField ? (
          <span className="admin-status-label">
            <span className="admin-status-dot" aria-hidden="true" />
            {currentLabel}
          </span>
        ) : (
          <span className="text-white">{currentLabel}</span>
        )}
      </button>
      {error ? <p className="text-sm text-amber-200">{error}</p> : null}
    </div>
  );
}
