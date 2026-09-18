import type { ReactNode } from "react";
import Link from "next/link";
import { AdminListControls } from "@/components/admin/admin-list-controls";
import { ClearFollowUpButton } from "@/components/admin/clear-follow-up-button";
import { SetupNotice } from "@/components/admin/setup-notice";
import { StatusChip } from "@/components/admin/status-chip";
import {
  getDashboardData,
  type ClientListItem,
  type FollowUpItem,
  type OpenPaymentItem,
} from "@/lib/admin/data";
import {
  getOpenInvoiceDocumentStatusTone,
  getOpenInvoiceStatusLabel,
  getOpenInvoiceStatusTone,
} from "@/lib/admin/payment-display";
import { formatCurrency, formatDate, formatPhoneHref } from "@/lib/admin/format";
import { isMissingClientSchemaError } from "@/lib/admin/setup";
import {
  clientStatusLabels,
  documentStatusLabels,
  serviceTypeLabels,
} from "@/lib/admin/schema";

type AttentionView = "all" | "leads" | "open-payments" | "follow-ups";

interface AttentionPageProps {
  searchParams: Promise<{
    q?: string;
    view?: string;
  }>;
}

function getRequestedView(value?: string): AttentionView {
  if (value === "leads" || value === "open-payments" || value === "follow-ups") {
    return value;
  }

  return "all";
}

function QueueActionButtons({
  clientId,
  phone,
  children,
}: {
  clientId: string;
  phone: string;
  children?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
      <a
        href={formatPhoneHref(phone)}
        className="admin-action-button admin-action-button--call admin-action-button--compact"
      >
        Call
      </a>
      <Link
        href={`/admin/clients/${clientId}`}
        className="admin-action-button admin-action-button--open admin-action-button--compact"
      >
        Open client
      </Link>
      {children}
    </div>
  );
}

function LeadQueueCard({ client }: { client: ClientListItem }) {
  return (
    <div className="rounded-md border border-[#25344a] border-l-4 border-l-[#62c8ff] bg-[#0f1c2d] px-4 py-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/clients/${client.id}`} className="inline-block max-w-full">
              <p className="display-heading break-words text-xl leading-tight text-white">{client.name}</p>
            </Link>
            <StatusChip
              label={clientStatusLabels[client.status]}
              tone={client.status}
              variant="text"
            />
          </div>
          <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-sm text-[#9aafc5]">
            <span>{client.phone}</span>
            <span>{client.city || "No city"}</span>
            <span>Created {formatDate(client.created_at.slice(0, 10))}</span>
          </div>
        </div>

        <QueueActionButtons clientId={client.id} phone={client.phone} />
      </div>
    </div>
  );
}

function PaymentQueueCard({ item }: { item: OpenPaymentItem }) {
  const { client } = item;

  if (item.kind === "document") {
    const { document, service } = item;
    const accent =
      document.status === "past_due"
        ? "border-l-[#c53030]"
        : document.status === "approved"
          ? "border-l-[#e46322]"
          : "border-l-[#62c8ff]";

    return (
      <div className={`rounded-md border border-[#25344a] border-l-4 bg-[#0f1c2d] px-4 py-3 ${accent}`}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/admin/clients/${client.id}`} className="inline-block max-w-full">
                <p className="display-heading break-words text-xl leading-tight text-white">{client.name}</p>
              </Link>
              <StatusChip
                label={documentStatusLabels[document.status]}
                tone={getOpenInvoiceDocumentStatusTone(document.status)}
                variant="text"
              />
            </div>
            <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-sm text-[#9aafc5]">
              <span>{formatCurrency(document.balance_due)}</span>
              <span>{document.document_number}</span>
              <span>Due {formatDate(document.due_date)}</span>
              {service ? <span>{serviceTypeLabels[service.service_type]}</span> : null}
            </div>
          </div>

          <QueueActionButtons clientId={client.id} phone={client.phone}>
            <Link
              href={`/admin/documents/${document.id}`}
              className="admin-action-button admin-action-button--open admin-action-button--compact"
            >
              Open invoice
            </Link>
          </QueueActionButtons>
        </div>
      </div>
    );
  }

  const { service } = item;
  const accent =
    service.payment_status === "invoiced"
      ? "border-l-[#c53030]"
      : service.payment_status === "pending"
        ? "border-l-[#e46322]"
        : "border-l-[#77d4a1]";

  return (
    <div className={`rounded-md border border-[#25344a] border-l-4 bg-[#0f1c2d] px-4 py-3 ${accent}`}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/clients/${client.id}`} className="inline-block max-w-full">
              <p className="display-heading break-words text-xl leading-tight text-white">{client.name}</p>
            </Link>
            <StatusChip
              label={getOpenInvoiceStatusLabel(service.payment_status)}
              tone={getOpenInvoiceStatusTone(service.payment_status)}
              variant="text"
            />
          </div>
          <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-sm text-[#9aafc5]">
            <span>{formatCurrency(service.cost)}</span>
            <span>{serviceTypeLabels[service.service_type]}</span>
            <span>{formatDate(service.service_date)}</span>
          </div>
        </div>

        <QueueActionButtons clientId={client.id} phone={client.phone} />
      </div>
    </div>
  );
}

function getOpenPaymentItemKey(item: OpenPaymentItem) {
  return item.kind === "document" ? item.document.id : item.service.id;
}

function FollowUpQueueCard({ item }: { item: FollowUpItem }) {
  const { client, service } = item;

  return (
    <div className="rounded-md border border-[#25344a] border-l-4 border-l-[#ca8a04] bg-[#0f1c2d] px-4 py-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/clients/${client.id}`} className="inline-block max-w-full">
              <p className="display-heading break-words text-xl leading-tight text-white">{client.name}</p>
            </Link>
            <StatusChip label="Needs follow-up" tone="follow_up" variant="text" />
          </div>
          <p className="text-sm text-[#9aafc5]">
            {service.follow_up_note?.trim() || serviceTypeLabels[service.service_type]}
          </p>
          <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-sm text-[#6c8096]">
            <span>Due {formatDate(service.follow_up_date)}</span>
            <span>{client.phone}</span>
          </div>
        </div>

        <QueueActionButtons clientId={client.id} phone={client.phone}>
          <ClearFollowUpButton
            serviceId={service.id}
            clientId={client.id}
            label="Done"
            className="admin-action-button admin-action-button--done admin-action-button--compact"
          />
        </QueueActionButtons>
      </div>
    </div>
  );
}

function AttentionSection({
  title,
  count,
  tone,
  emptyMessage,
  children,
}: {
  title: string;
  count: number;
  tone: "cooling" | "warning" | "danger";
  emptyMessage: string;
  children: ReactNode;
}) {
  const badgeTone =
    tone === "cooling"
      ? "bg-[#0b2236] border-[#62c8ff] text-[#7fd8ff]"
      : tone === "warning"
        ? "bg-[#2a2010] border-[#ca8a04] text-[#fbbf24]"
        : "bg-[#3a0f14] border-[#c53030] text-[#ff6166]";
  const divider =
    tone === "cooling"
      ? "border-[#62c8ff]"
      : tone === "warning"
        ? "border-[#ca8a04]"
        : "border-[#c53030]";
  return (
    <section className="space-y-3">
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b-2 pb-3 ${divider}`}>
        <h2 className="display-heading text-xl font-bold text-white">{title}</h2>
        <span
          className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-extrabold uppercase tracking-[0.08em] ${badgeTone}`}
        >
          {count}
        </span>
      </div>

      {count === 0 ? (
        <div className="admin-empty-state">{emptyMessage}</div>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  );
}

export default async function AttentionPage({ searchParams }: AttentionPageProps) {
  const params = await searchParams;
  const searchTerm = typeof params.q === "string" ? params.q : "";
  const view = getRequestedView(params.view);
  let dashboard;

  try {
    dashboard = await getDashboardData(searchTerm, "all");
  } catch (error) {
    if (isMissingClientSchemaError(error)) {
      return <SetupNotice />;
    }

    throw error;
  }

  const totalAttentionItems =
    dashboard.leads.length + dashboard.openPayments.length + dashboard.followUps.length;

  const filterOptions: Array<{
    label: string;
    value: AttentionView;
    count: number;
    tone: "neutral" | "cooling" | "warning" | "danger";
  }> = [
    {
      label: "All",
      value: "all",
      count: totalAttentionItems,
      tone: "neutral",
    },
    { label: "Leads", value: "leads", count: dashboard.leads.length, tone: "cooling" },
    { label: "Open invoices", value: "open-payments", count: dashboard.openPayments.length, tone: "danger" },
    { label: "Needs follow-up", value: "follow-ups", count: dashboard.followUps.length, tone: "warning" },
  ];

  const showLeadsSection = (view === "all" && dashboard.leads.length > 0) || view === "leads";
  const showOpenPaymentsSection =
    (view === "all" && dashboard.openPayments.length > 0) || view === "open-payments";
  const showFollowUpsSection =
    (view === "all" && dashboard.followUps.length > 0) || view === "follow-ups";

  return (
    <div className="space-y-6">
      <section>
        <h1 className="display-heading text-2xl font-extrabold text-white">Attention</h1>
      </section>

      <AdminListControls
        basePath="/admin/attention"
        searchLabel="Search attention items"
        searchPlaceholder="Search leads, invoices, or follow-ups by client name, phone, address, city, or email…"
        searchTerm={searchTerm}
        currentView={view}
        options={filterOptions}
      />

      <section id="attention-list" className="scroll-mt-24 space-y-6">
        {totalAttentionItems === 0 ? (
          <div className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-6 text-center">
            <p className="text-base text-[#9aafc5]">
              {searchTerm ? "No attention items match this search." : "Nothing needs attention right now."}
            </p>
          </div>
        ) : null}

        {showLeadsSection ? (
          <AttentionSection
            title="New leads"
            count={dashboard.leads.length}
            tone="cooling"
            emptyMessage={searchTerm ? "No matching leads." : "No leads need action."}
          >
            {dashboard.leads.map((client) => (
              <LeadQueueCard key={client.id} client={client} />
            ))}
          </AttentionSection>
        ) : null}

        {showOpenPaymentsSection ? (
          <AttentionSection
            title="Open invoices"
            count={dashboard.openPayments.length}
            tone="danger"
            emptyMessage={searchTerm ? "No matching open invoices." : "No open invoices."}
          >
            {dashboard.openPayments.map((item) => (
              <PaymentQueueCard key={getOpenPaymentItemKey(item)} item={item} />
            ))}
          </AttentionSection>
        ) : null}

        {showFollowUpsSection ? (
          <AttentionSection
            title="Needs follow-up"
            count={dashboard.followUps.length}
            tone="warning"
            emptyMessage={searchTerm ? "No matching follow-ups." : "No follow-ups need action."}
          >
            {dashboard.followUps.map((item) => (
              <FollowUpQueueCard key={item.service.id} item={item} />
            ))}
          </AttentionSection>
        ) : null}
      </section>
    </div>
  );
}
