"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { createServiceRecord } from "@/app/admin/actions";
import {
  paymentStatusLabels,
  paymentStatuses,
  serviceTypeLabels,
  serviceTypes,
} from "@/lib/admin/schema";
import {
  getAdminChoiceChipClass,
  getPaymentStatusTone,
  getServiceTypeTone,
} from "@/lib/visual-system";
import { getAdminTodayDateString } from "@/lib/admin/date";

interface NewServiceFormProps {
  clientId: string;
}

export function NewServiceForm({ clientId }: NewServiceFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(() => ({
    serviceDate: getAdminTodayDateString(),
    serviceType: "ac_repair",
    description: "",
    cost: "",
    paymentStatus: "paid",
    followUpDate: "",
    followUpNote: "",
  }));
  const [hasFollowUp, setHasFollowUp] = useState(false);

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createServiceRecord({ clientId, ...form });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push(`/admin/clients/${clientId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="service-date">
          Service date
        </label>
        <input
          id="service-date"
          type="date"
          value={form.serviceDate}
          onChange={(event) => updateField("serviceDate", event.target.value)}
          className="admin-input"
          required
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-[#9aafc5]">Service type</p>
        <div className="flex flex-wrap gap-2">
          {serviceTypes.map((serviceType) => {
            const active = form.serviceType === serviceType;

            return (
              <button
                key={serviceType}
                type="button"
                onClick={() => updateField("serviceType", serviceType)}
                aria-pressed={active}
                className={getAdminChoiceChipClass(active, getServiceTypeTone(serviceType))}
              >
                {serviceTypeLabels[serviceType]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="service-description">
          Description
        </label>
        <textarea
          id="service-description"
          rows={5}
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
          className="admin-input"
          placeholder="What was done, what was found, what changed."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="service-cost">
            Cost
          </label>
          <input
            id="service-cost"
            inputMode="decimal"
            value={form.cost}
            onChange={(event) => updateField("cost", event.target.value)}
            className="admin-input"
            placeholder="Optional"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#9aafc5]">Payment status</p>
          <div role="group" aria-label="Payment status" className="flex flex-wrap gap-2">
            {paymentStatuses.map((status) => {
              const active = form.paymentStatus === status;

              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={active}
                  onClick={() => updateField("paymentStatus", status)}
                  className={getAdminChoiceChipClass(active, getPaymentStatusTone(status))}
                >
                  {paymentStatusLabels[status]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-[#9aafc5]">Follow-up</p>
        <div role="group" aria-label="Follow-up" className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={!hasFollowUp}
            onClick={() => {
              setHasFollowUp(false);
              setForm((current) => ({
                ...current,
                followUpDate: "",
                followUpNote: "",
              }));
            }}
            className={getAdminChoiceChipClass(!hasFollowUp, "neutral")}
          >
            None
          </button>
          <button
            type="button"
            aria-pressed={hasFollowUp}
            onClick={() => setHasFollowUp(true)}
            className={getAdminChoiceChipClass(hasFollowUp, "maintenance")}
          >
            Set follow-up
          </button>
        </div>
      </div>

      {hasFollowUp ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="service-follow-up-date">
              Follow-up date
            </label>
            <input
              id="service-follow-up-date"
              type="date"
              value={form.followUpDate}
              onChange={(event) => updateField("followUpDate", event.target.value)}
              className="admin-input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="service-follow-up-note">
              Follow-up note
            </label>
            <input
              id="service-follow-up-note"
              value={form.followUpNote}
              onChange={(event) => updateField("followUpNote", event.target.value)}
              className="admin-input"
              placeholder="Optional"
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-amber-200" aria-live="polite" role="status">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" disabled={isPending} className="inline-flex w-full items-center justify-center rounded-md bg-[#1f6feb] px-4 py-2 text-sm font-bold text-white hover:bg-[#3178e6] disabled:opacity-70 sm:w-auto">
          {isPending ? "Saving…" : "Save service"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/admin/clients/${clientId}`)}
          className="inline-flex w-full items-center justify-center rounded-md border border-[#25344a] bg-[#1a2c44] px-4 py-2 text-sm font-bold text-white hover:bg-[#243654] sm:w-auto"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
