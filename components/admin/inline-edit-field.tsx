"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateRecord } from "@/app/admin/actions";
import { formatCurrency, formatDate, formatFieldValue } from "@/lib/admin/format";

type TableName =
  | "clients"
  | "documents"
  | "document_items"
  | "equipment"
  | "notes"
  | "services";

interface InlineEditFieldProps {
  table: TableName;
  id: string;
  clientId: string;
  field: string;
  label: string;
  value: number | string | null;
  type?: "date" | "email" | "number" | "tel" | "text" | "textarea";
  numberFormat?: "plain" | "currency";
  placeholder?: string;
  required?: boolean;
}

function toDraftValue(value: number | string | null) {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function InlineEditField({
  table,
  id,
  clientId,
  field,
  label,
  value,
  type = "text",
  numberFormat = "plain",
  placeholder = "Click to add",
  required = false,
}: InlineEditFieldProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(toDraftValue(value));
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDraft(toDraftValue(value));
  }, [value]);

  const hasValue = value !== null && value !== undefined && String(value).trim().length > 0;
  const displayValue =
    type === "date"
      ? formatDate(typeof value === "string" ? value : null)
      : type === "number"
        ? numberFormat === "currency"
          ? formatCurrency(typeof value === "number" ? value : null)
          : formatFieldValue(value)
        : formatFieldValue(value);

  function save() {
    if (required && !draft.trim()) {
      setError(`${label} is required.`);
      return;
    }

    startTransition(async () => {
      const result = await updateRecord({
        table,
        id,
        clientId,
        values: { [field]: draft },
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
    const sharedProps = {
      autoFocus: true,
      className: "admin-input min-h-12",
      disabled: isPending,
      onBlur: save,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setDraft(event.target.value);
      },
      onKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (event.key === "Escape") {
          setDraft(toDraftValue(value));
          setError("");
          setIsEditing(false);
        }

        if (event.key === "Enter" && type !== "textarea" && !event.shiftKey) {
          event.preventDefault();
          save();
        }
      },
      placeholder,
      value: draft,
    };

    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c8096]">
          {label}
        </p>
        {type === "textarea" ? (
          <textarea rows={4} {...sharedProps} />
        ) : (
          <input type={type} {...sharedProps} />
        )}
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
        className="admin-inline-display w-full text-left"
      >
        <span className={hasValue ? "text-white" : "text-[#6c8096]"}>{displayValue}</span>
      </button>
      {error ? <p className="text-sm text-amber-200">{error}</p> : null}
    </div>
  );
}
