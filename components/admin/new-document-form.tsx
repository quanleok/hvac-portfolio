"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { createDocumentRecord } from "@/app/admin/actions";
import { getAdminTodayDateString } from "@/lib/admin/date";
import {
  type DocumentPresetMap,
  type DocumentPresetLineItem,
} from "@/lib/admin/document-presets";
import { getDefaultDueDate } from "@/lib/admin/document-utils";
import {
  documentTypeLabels,
  documentTypes,
  type DocumentType,
} from "@/lib/admin/schema";
import { getAdminChoiceChipClass } from "@/lib/visual-system";

interface NewDocumentFormProps {
  clientId: string;
  defaultType?: DocumentType;
  presets?: DocumentPresetMap;
}

interface DocumentFormState {
  documentType: DocumentType;
  title: string;
  summary: string;
  notes: string;
  terms: string;
  issueDate: string;
  dueDate: string;
  expiresOn: string;
  taxRate: string;
  discountAmount: string;
  depositAmount: string;
  presetItems: DocumentPresetLineItem[];
}

function formatNumberInput(value: number) {
  return value === 0 ? "" : String(value);
}

function clonePresetItems(items: DocumentPresetLineItem[] = []) {
  return items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }));
}

function buildInitialState(
  documentType: DocumentType,
  issueDate: string,
  presets: DocumentPresetMap,
  usePreset: boolean
): DocumentFormState {
  const preset = usePreset ? presets[documentType] : undefined;

  return {
    documentType,
    title: preset?.title ?? "",
    summary: preset?.summary ?? "",
    notes: preset?.notes ?? "",
    terms: preset?.terms ?? "",
    issueDate,
    dueDate: documentType === "invoice" ? getDefaultDueDate("invoice", issueDate) : "",
    expiresOn: documentType === "quote" ? getDefaultDueDate("quote", issueDate) : "",
    taxRate: formatNumberInput(preset?.tax_rate ?? 0),
    discountAmount: formatNumberInput(preset?.discount_amount ?? 0),
    depositAmount: formatNumberInput(preset?.deposit_amount ?? 0),
    presetItems: clonePresetItems(preset?.line_items),
  };
}

export function NewDocumentForm({
  clientId,
  defaultType = "quote",
  presets = {},
}: NewDocumentFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [useSavedTemplate, setUseSavedTemplate] = useState(Boolean(presets[defaultType]));
  const [form, setForm] = useState(() => {
    const issueDate = getAdminTodayDateString();
    return buildInitialState(defaultType, issueDate, presets, Boolean(presets[defaultType]));
  });

  const deadlineLabel = form.documentType === "quote" ? "Valid through" : "Due date";
  const activePreset = presets[form.documentType];

  const helperText = useMemo(() => {
    if (!activePreset) {
      return form.documentType === "quote"
        ? "No saved quote template yet. Build one once, then save it from the document page."
        : "No saved invoice template yet. Build one once, then save it from the document page.";
    }

    return form.documentType === "quote"
      ? "Start from a saved estimate template or build a fresh quote."
      : "Start from a saved invoice template or build a fresh invoice.";
  }, [activePreset, form.documentType]);

  function updateField(name: keyof DocumentFormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function applyStartingPoint(documentType: DocumentType, usePreset: boolean) {
    const issueDate = form.issueDate || getAdminTodayDateString();
    setUseSavedTemplate(usePreset);
    setForm(buildInitialState(documentType, issueDate, presets, usePreset));
  }

  function updateType(nextType: DocumentType) {
    applyStartingPoint(nextType, Boolean(presets[nextType]));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createDocumentRecord({ clientId, ...form });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push(`/admin/documents/${result.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-[#9aafc5]">Document type</p>
        <div className="flex flex-wrap gap-2">
          {documentTypes.map((documentType) => {
            const active = form.documentType === documentType;
            const tone = documentType === "quote" ? "cooling" : "replacement";

            return (
              <button
                key={documentType}
                type="button"
                onClick={() => updateType(documentType)}
                aria-pressed={active}
                className={getAdminChoiceChipClass(active, tone)}
              >
                {documentTypeLabels[documentType]}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-[#6c8096]">{helperText}</p>
      </div>

      <div className="rounded-md border border-[#25344a] bg-[#101b2b] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c8096]">
              Template
            </p>
            <p className="text-base font-semibold text-white">
              {activePreset
                ? `Saved ${documentTypeLabels[form.documentType].toLowerCase()} template ready`
                : `No saved ${documentTypeLabels[form.documentType].toLowerCase()} template yet`}
            </p>
            <p className="text-sm text-[#9aafc5]">
              {activePreset
                ? `Loads title, summary, notes, terms, pricing defaults, and ${activePreset.line_items.length} line item${activePreset.line_items.length === 1 ? "" : "s"}.`
                : `Create a ${documentTypeLabels[form.documentType].toLowerCase()}, tune it once, then save it as the default template.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {activePreset ? (
              <button
                type="button"
                onClick={() => applyStartingPoint(form.documentType, true)}
                className={getAdminChoiceChipClass(useSavedTemplate, "brand")}
                aria-pressed={useSavedTemplate}
              >
                Use saved template
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => applyStartingPoint(form.documentType, false)}
              className={getAdminChoiceChipClass(!useSavedTemplate, "neutral")}
              aria-pressed={!useSavedTemplate}
            >
              Start blank
            </button>
          </div>
        </div>

        {activePreset && useSavedTemplate && form.presetItems.length > 0 ? (
          <div className="mt-4 rounded-md border border-[#25344a] bg-[#0b1420] p-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c8096]">
              Included line items
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {form.presetItems.slice(0, 4).map((item, index) => (
                <span
                  key={`${item.description}-${index}`}
                  className="rounded-full border border-[#2a3f5b] px-3 py-1 text-sm text-[#cfe6ff]"
                >
                  {item.description}
                </span>
              ))}
              {form.presetItems.length > 4 ? (
                <span className="rounded-full border border-[#2a3f5b] px-3 py-1 text-sm text-[#9aafc5]">
                  +{form.presetItems.length - 4} more
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="document-title">
            Title
          </label>
          <input
            id="document-title"
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            className="admin-input"
            placeholder={
              form.documentType === "quote"
                ? "System replacement quote"
                : "Install invoice"
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="document-issue-date">
            Issue date
          </label>
          <input
            id="document-issue-date"
            type="date"
            value={form.issueDate}
            onChange={(event) => updateField("issueDate", event.target.value)}
            className="admin-input"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="document-deadline">
            {deadlineLabel}
          </label>
          <input
            id="document-deadline"
            type="date"
            value={form.documentType === "quote" ? form.expiresOn : form.dueDate}
            onChange={(event) =>
              updateField(
                form.documentType === "quote" ? "expiresOn" : "dueDate",
                event.target.value
              )
            }
            className="admin-input"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="document-tax-rate">
              Tax %
            </label>
            <input
              id="document-tax-rate"
              inputMode="decimal"
              value={form.taxRate}
              onChange={(event) => updateField("taxRate", event.target.value)}
              className="admin-input"
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="document-discount">
              Discount
            </label>
            <input
              id="document-discount"
              inputMode="decimal"
              value={form.discountAmount}
              onChange={(event) => updateField("discountAmount", event.target.value)}
              className="admin-input"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="document-deposit">
              Deposit
            </label>
            <input
              id="document-deposit"
              inputMode="decimal"
              value={form.depositAmount}
              onChange={(event) => updateField("depositAmount", event.target.value)}
              className="admin-input"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="document-summary">
          Summary
        </label>
        <textarea
          id="document-summary"
          rows={4}
          value={form.summary}
          onChange={(event) => updateField("summary", event.target.value)}
          className="admin-input"
          placeholder="Short overview of the work, equipment, or scope."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="document-notes">
            Notes
          </label>
          <textarea
            id="document-notes"
            rows={5}
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            className="admin-input"
            placeholder="Optional notes visible on the document."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="document-terms">
            Terms
          </label>
          <textarea
            id="document-terms"
            rows={5}
            value={form.terms}
            onChange={(event) => updateField("terms", event.target.value)}
            className="admin-input"
            placeholder="Optional payment or scheduling terms."
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-amber-200" aria-live="polite" role="status">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" disabled={isPending} className="admin-primary-button w-full sm:w-auto">
          {isPending ? "Creating…" : `Create ${documentTypeLabels[form.documentType].toLowerCase()}`}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/admin/clients/${clientId}`)}
          className="admin-secondary-button w-full sm:w-auto"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
