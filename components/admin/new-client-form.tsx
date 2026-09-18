"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { createClientRecord } from "@/app/admin/actions";
import {
  clientSourceLabels,
  clientSources,
  clientStatusLabels,
  clientStatuses,
} from "@/lib/admin/schema";
import { getAdminChoiceChipClass, getClientStatusTone } from "@/lib/visual-system";

export function NewClientForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    zip: "",
    source: "manual",
    status: "active",
  });

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createClientRecord(form);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push(`/admin/clients/${result.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="client-name">
          Name
        </label>
        <input
          id="client-name"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          className="admin-input"
          placeholder="Full name"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="client-phone">
          Phone
        </label>
        <input
          id="client-phone"
          type="tel"
          value={form.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          className="admin-input"
          placeholder="(405) 555-0123"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="client-email">
          Email
        </label>
        <input
          id="client-email"
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          className="admin-input"
          placeholder="Optional"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="client-city">
          City
        </label>
        <input
          id="client-city"
          value={form.city}
          onChange={(event) => updateField("city", event.target.value)}
          className="admin-input"
          placeholder="Optional"
        />
      </div>

      <div className="space-y-2 lg:col-span-2">
        <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="client-address">
          Address
        </label>
        <input
          id="client-address"
          value={form.address}
          onChange={(event) => updateField("address", event.target.value)}
          className="admin-input"
          placeholder="Street address"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="client-zip">
          ZIP
        </label>
        <input
          id="client-zip"
          value={form.zip}
          onChange={(event) => updateField("zip", event.target.value)}
          className="admin-input"
          placeholder="Optional"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#9aafc5]" htmlFor="client-source">
            Source
          </label>
          <select
            id="client-source"
            value={form.source}
            onChange={(event) => updateField("source", event.target.value)}
            className="admin-input"
          >
            {clientSources.map((source) => (
              <option key={source} value={source}>
                {clientSourceLabels[source]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#9aafc5]">
            Status
          </p>
          <div role="group" aria-label="Status" className="flex flex-wrap gap-2">
            {clientStatuses.map((status) => (
              <button
                key={status}
                type="button"
                aria-pressed={form.status === status}
                onClick={() => updateField("status", status)}
                className={getAdminChoiceChipClass(
                  form.status === status,
                  getClientStatusTone(status)
                )}
              >
                {clientStatusLabels[status]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-amber-200 lg:col-span-2" aria-live="polite" role="status">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 lg:col-span-2 sm:flex-row">
        <button type="submit" disabled={isPending} className="inline-flex w-full items-center justify-center rounded-md bg-[#1f6feb] px-4 py-2 text-sm font-bold text-white hover:bg-[#3178e6] disabled:opacity-70 sm:w-auto">
          {isPending ? "Saving…" : "Create client"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="inline-flex w-full items-center justify-center rounded-md border border-[#25344a] bg-[#1a2c44] px-4 py-2 text-sm font-bold text-white hover:bg-[#243654] sm:w-auto"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
