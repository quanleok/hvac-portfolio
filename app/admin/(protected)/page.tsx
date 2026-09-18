import Link from "next/link";
import { AdminListControls } from "@/components/admin/admin-list-controls";
import { LeadAgeTicker } from "@/components/admin/lead-age-ticker";
import { SetupNotice } from "@/components/admin/setup-notice";
import { StatusChip } from "@/components/admin/status-chip";
import {
  getDashboardData,
  type DashboardView,
  type OpenPaymentItem,
} from "@/lib/admin/data";
import { isHotLead } from "@/lib/admin/lead-heat";
import {
  getOpenInvoiceDocumentRowTone,
  getOpenInvoiceDocumentStatusTone,
  getOpenInvoiceRowTone,
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
import {
  getAdminMetricCardClass,
  getAdminRecordRowClass,
  getClientStatusTone,
} from "@/lib/visual-system";

interface DashboardPageProps {
  searchParams: Promise<{
    q?: string;
    view?: string;
  }>;
}

function getRequestedView(value?: string): DashboardView {
  if (value === "active" || value === "leads" || value === "open-payments" || value === "inactive") {
    return value;
  }

  return "all";
}

function getClientSectionTitle(view: DashboardView, searchTerm: string) {
  if (view === "active") {
    return "Active clients";
  }

  if (view === "leads") {
    return "Lead clients";
  }

  if (view === "open-payments") {
    return "Open invoices";
  }

  if (view === "inactive") {
    return "Inactive clients";
  }

  return searchTerm ? "Search results" : "Clients";
}

function getClientEmptyMessage(view: DashboardView, searchTerm: string) {
  if (view === "active") {
    return "No active clients match this view.";
  }

  if (view === "leads") {
    return "No leads match this view.";
  }

  if (view === "open-payments") {
    return "No open invoices match this view.";
  }

  if (view === "inactive") {
    return "No inactive clients match this view.";
  }

  return searchTerm ? "No clients found." : "No clients yet.";
}

function OpenPaymentRow({ item }: { item: OpenPaymentItem }) {
  const { client } = item;

  if (item.kind === "document") {
    const { document, service } = item;

    return (
      <article className={`${getAdminRecordRowClass(getOpenInvoiceDocumentRowTone(document.status))} px-4 py-3`}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_auto] xl:items-center">
          <div className="min-w-0">
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

            <div className="mt-2 flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-sm text-[#9aafc5]">
              <span>{client.phone}</span>
              <span className="break-all">{client.email || "No email"}</span>
              <span>{client.city || "No city"}</span>
            </div>
          </div>

          <div className="grid gap-3 text-sm text-[#9aafc5] sm:grid-cols-3 xl:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6c8096]">Balance</p>
              <p className="mt-2 text-white">{formatCurrency(document.balance_due)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6c8096]">Invoice</p>
              <p className="mt-2 text-white">{document.title || document.document_number}</p>
              <p className="mt-1 text-xs text-[#6c8096]">
                {document.document_number}
                {service ? ` · ${serviceTypeLabels[service.service_type]}` : ""}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6c8096]">Due</p>
              <p className="mt-2 text-white">{formatDate(document.due_date)}</p>
              <p className="mt-1 text-xs text-[#6c8096]">Issued {formatDate(document.issue_date)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:justify-end">
            <a href={formatPhoneHref(client.phone)} className="admin-action-button admin-action-button--call">
              Call
            </a>
            <Link href={`/admin/documents/${document.id}`} className="admin-action-button admin-action-button--open">
              Open invoice
            </Link>
          </div>
        </div>
      </article>
    );
  }

  const { service } = item;

  return (
    <article className={`${getAdminRecordRowClass(getOpenInvoiceRowTone(service.payment_status))} px-4 py-3`}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_auto] xl:items-center">
        <div className="min-w-0">
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

          <div className="mt-2 flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-sm text-[#9aafc5]">
            <span>{client.phone}</span>
            <span className="break-all">{client.email || "No email"}</span>
            <span>{client.city || "No city"}</span>
          </div>
        </div>

        <div className="grid gap-3 text-sm text-[#9aafc5] sm:grid-cols-3 xl:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6c8096]">Amount</p>
            <p className="mt-2 text-white">{formatCurrency(service.cost)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6c8096]">Invoice</p>
            <p className="mt-2 text-white">{serviceTypeLabels[service.service_type]}</p>
            <p className="mt-1 text-xs text-[#6c8096]">{formatDate(service.service_date)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6c8096]">Client</p>
            <p className="mt-2 text-white">{client.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:justify-end">
          <a href={formatPhoneHref(client.phone)} className="admin-action-button admin-action-button--call">
            Call
          </a>
          <Link href={`/admin/clients/${client.id}`} className="admin-action-button admin-action-button--open">
            Open client
          </Link>
        </div>
      </div>
    </article>
  );
}

function getOpenPaymentItemKey(item: OpenPaymentItem) {
  return item.kind === "document" ? item.document.id : item.service.id;
}

export default async function AdminDashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const searchTerm = typeof params.q === "string" ? params.q : "";
  const view = getRequestedView(params.view);
  let dashboard;

  try {
    dashboard = await getDashboardData(searchTerm, view);
  } catch (error) {
    if (isMissingClientSchemaError(error)) {
      return (
        <div className="space-y-6">
          <section className="flex items-center justify-between gap-4">
            <h1 className="display-heading text-3xl text-white sm:text-4xl">Client management</h1>
          </section>

          <SetupNotice />
        </div>
      );
    }

    throw error;
  }

  // eslint-disable-next-line react-hooks/purity -- server component; Date.now() is the request timestamp, not a hook
  const now = Date.now();
  const clientsWithOpenPayments = new Set(dashboard.openPayments.map((item) => item.client.id));
  const clientsWithFollowUps = new Set(dashboard.followUps.map((item) => item.client.id));

  const filterOptions: Array<{
    label: string;
    value: DashboardView;
    count: number;
    tone: "brand" | "success" | "cooling" | "danger" | "neutral";
  }> = [
    { label: "All", value: "all", count: dashboard.matchedClientCount, tone: "brand" },
    { label: "Active", value: "active", count: dashboard.matchedStatusCounts.active, tone: "success" },
    { label: "Leads", value: "leads", count: dashboard.matchedStatusCounts.lead, tone: "cooling" },
    { label: "Open invoices", value: "open-payments", count: dashboard.openPayments.length, tone: "danger" },
    { label: "Inactive", value: "inactive", count: dashboard.matchedStatusCounts.inactive, tone: "neutral" },
  ];
  const metricCards = [
    { label: "Total clients", value: dashboard.stats.totalClients, tone: "replacement" as const, mobileSpan: "" },
    { label: "Active", value: dashboard.stats.activeCount, tone: "success" as const, mobileSpan: "" },
    { label: "Leads", value: dashboard.stats.leadCount, tone: "cooling" as const, mobileSpan: "" },
    { label: "Follow-ups", value: dashboard.stats.dueFollowUps, tone: "warning" as const, mobileSpan: "" },
    { label: "Open invoices", value: dashboard.stats.pendingPayments, tone: "danger" as const, mobileSpan: "col-span-2 xl:col-span-1" },
  ];
  const sectionCount = view === "open-payments" ? dashboard.openPayments.length : dashboard.clients.length;
  const isOpenPaymentsView = view === "open-payments";

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="display-heading text-2xl font-extrabold text-white">Client management</h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/admin/clients/new" className="inline-flex items-center justify-center rounded-md bg-[#1f6feb] px-4 py-2 text-sm font-bold text-white hover:bg-[#3178e6]">
            New client
          </Link>
        </div>
      </section>

      <AdminListControls
        basePath="/admin"
        searchLabel="Search clients"
        searchPlaceholder="Search clients by name, phone, address, city, or email…"
        searchTerm={searchTerm}
        currentView={view}
        options={filterOptions}
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {metricCards.map((card) => (
          <article
            key={card.label}
            className={`${getAdminMetricCardClass(card.tone)} ${card.mobileSpan} px-4 py-3`}
          >
            <p className="text-sm font-semibold text-[#9aafc5]">{card.label}</p>
            <p className="display-heading mt-3 text-2xl font-extrabold text-white sm:text-3xl">{card.value}</p>
          </article>
        ))}
      </section>

      <section id="client-list" className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="display-heading text-xl font-bold text-white">
            {getClientSectionTitle(view, searchTerm)}
          </h2>
          <span className="text-sm font-semibold text-[#6c8096]">{sectionCount}</span>
        </div>

        {sectionCount === 0 ? (
          <div className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-6 text-center">
            <p className="text-base text-[#9aafc5]">{getClientEmptyMessage(view, searchTerm)}</p>
          </div>
        ) : isOpenPaymentsView ? (
          <div className="grid gap-3">
            {dashboard.openPayments.map((item) => (
              <OpenPaymentRow key={getOpenPaymentItemKey(item)} item={item} />
            ))}
          </div>
        ) : (
          <div className="grid gap-3">
            {dashboard.clients.map((client, index) => {
              const hot = isHotLead(client, now);
              const hasOpenPayment = clientsWithOpenPayments.has(client.id);
              const hasFollowUp = clientsWithFollowUps.has(client.id);
              const isFirstHot = hot && dashboard.clients.findIndex((c) => isHotLead(c, now)) === index;
              const rowHighlight = hot
                ? " ring-2 ring-[#c53030] bg-[#3a0f14] border-[#c53030]"
                : hasOpenPayment
                  ? " !bg-[#c53030] !border-[#8a1f1f] ring-1 ring-[#8a1f1f] text-white"
                  : hasFollowUp
                    ? " ring-1 ring-[#ca8a04] bg-[#2e2610] border-[#ca8a04]"
                    : "";
              return (
                <article
                  key={client.id}
                  id={isFirstHot ? "hot-leads" : undefined}
                  className={`${getAdminRecordRowClass(getClientStatusTone(client.status))} px-4 py-3${rowHighlight}`}
                >
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_auto] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/admin/clients/${client.id}`} className="inline-block max-w-full">
                          <p className="display-heading break-words text-xl leading-tight text-white">
                            {client.name}
                          </p>
                        </Link>
                        <StatusChip
                          label={clientStatusLabels[client.status]}
                          tone={client.status}
                          variant="text"
                        />
                        {client.status === "lead" ? (
                          <LeadAgeTicker createdAt={client.created_at} status={client.status} />
                        ) : null}
                        {clientsWithOpenPayments.has(client.id) ? (
                          <StatusChip label="Unpaid" tone="unpaid" variant="text" />
                        ) : null}
                        {clientsWithFollowUps.has(client.id) ? (
                          <StatusChip label="Follow-up" tone="follow_up" variant="text" />
                        ) : null}
                      </div>

                      <div className="mt-2 flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-sm text-[#9aafc5]">
                        <span>{client.phone}</span>
                        <span className="break-all">{client.email || "No email"}</span>
                        <span>{client.city || "No city"}</span>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm text-[#9aafc5] sm:grid-cols-4 xl:grid-cols-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6c8096]">
                          Latest
                        </p>
                        <p className="mt-2 text-white">
                          {client.latest_service_date ? formatDate(client.latest_service_date) : "No service yet"}
                        </p>
                        <p className="mt-1 text-xs text-[#6c8096]">
                          {client.latest_service_type
                            ? serviceTypeLabels[client.latest_service_type]
                            : "Still a new record"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6c8096]">
                          Services
                        </p>
                        <p className="mt-2 text-white">{client.service_count}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6c8096]">
                          Equipment
                        </p>
                        <p className="mt-2 text-white">{client.equipment_count}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6c8096]">
                          Notes
                        </p>
                        <p className="mt-2 text-white">{client.note_count}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:justify-end">
                      <a href={formatPhoneHref(client.phone)} className="admin-action-button admin-action-button--call">
                        Call
                      </a>
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="admin-action-button admin-action-button--open"
                      >
                        Open client
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
