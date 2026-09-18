import Image from "next/image";
import { notFound } from "next/navigation";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { CreateDocumentItemForm } from "@/components/admin/create-document-item-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { DocumentShareActions } from "@/components/admin/document-share-actions";
import { DuplicateDocumentButton } from "@/components/admin/duplicate-document-button";
import { InlineEditField } from "@/components/admin/inline-edit-field";
import { InlineSelectField } from "@/components/admin/inline-select-field";
import { SaveDocumentPresetButton } from "@/components/admin/save-document-preset-button";
import { SetupNotice } from "@/components/admin/setup-notice";
import { StatusChip } from "@/components/admin/status-chip";
import { companyProfile } from "@/lib/admin/company-profile";
import { getDocumentImagePath, getDocumentSharePath } from "@/lib/admin/document-utils";
import { getDocumentDetail } from "@/lib/admin/data";
import { formatCurrency, formatDate, formatPhoneHref } from "@/lib/admin/format";
import { isMissingClientSchemaError } from "@/lib/admin/setup";
import {
  documentStatusLabels,
  documentStatuses,
  documentTypeLabels,
  documentTypes,
  serviceTypeLabels,
} from "@/lib/admin/schema";
import {
  getAdminMetricCardClass,
  getAdminRecordRowClass,
} from "@/lib/visual-system";

interface DocumentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { id } = await params;
  let detail;

  try {
    detail = await getDocumentDetail(id);
  } catch (error) {
    if (isMissingClientSchemaError(error)) {
      return <SetupNotice />;
    }

    throw error;
  }

  if (!detail) {
    notFound();
  }

  const { client, document, items, services } = detail;
  const sharePath = getDocumentSharePath(document.public_token);
  const imagePath = getDocumentImagePath(document.public_token);
  const deadlineLabel = document.document_type === "quote" ? "Valid through" : "Due date";

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <AdminBreadcrumbs
            items={[
              { label: "Clients", href: "/admin" },
              { label: client.name, href: `/admin/clients/${client.id}` },
              { label: document.document_number },
            ]}
          />
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8096]">
              {documentTypeLabels[document.document_type]}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="display-heading text-2xl font-extrabold text-white">
                {document.title || document.document_number}
              </h1>
              <StatusChip
                label={documentStatusLabels[document.status]}
                tone={document.status}
                variant="text"
              />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#9aafc5]">
              <span>{document.document_number}</span>
              <span>Issued {formatDate(document.issue_date)}</span>
              <span>{deadlineLabel} {formatDate(document.document_type === "quote" ? document.expires_on : document.due_date)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:items-end">
          <DocumentShareActions
            clientId={client.id}
            documentId={document.id}
            documentNumber={document.document_number}
            sharePath={sharePath}
            imagePath={imagePath}
          />
          {document.document_type === "quote" ? (
            <DuplicateDocumentButton clientId={client.id} documentId={document.id} />
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <article className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8096]">
                Document setup
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <InlineEditField
                table="documents"
                id={document.id}
                clientId={client.id}
                field="title"
                label="Title"
                value={document.title}
              />
              <InlineEditField
                table="documents"
                id={document.id}
                clientId={client.id}
                field="document_number"
                label="Document number"
                value={document.document_number}
                required
              />
              <InlineSelectField
                table="documents"
                id={document.id}
                clientId={client.id}
                field="document_type"
                label="Type"
                value={document.document_type}
                options={documentTypes.map((documentType) => ({
                  label: documentTypeLabels[documentType],
                  value: documentType,
                }))}
              />
              <InlineSelectField
                table="documents"
                id={document.id}
                clientId={client.id}
                field="status"
                label="Status"
                value={document.status}
                options={documentStatuses.map((status) => ({
                  label: documentStatusLabels[status],
                  value: status,
                }))}
              />
              <InlineEditField
                table="documents"
                id={document.id}
                clientId={client.id}
                field="issue_date"
                label="Issue date"
                value={document.issue_date}
                type="date"
              />
              <InlineEditField
                table="documents"
                id={document.id}
                clientId={client.id}
                field={document.document_type === "quote" ? "expires_on" : "due_date"}
                label={deadlineLabel}
                value={document.document_type === "quote" ? document.expires_on : document.due_date}
                type="date"
              />
              <InlineSelectField
                table="documents"
                id={document.id}
                clientId={client.id}
                field="linked_service_id"
                label="Linked service"
                value={document.linked_service_id ?? ""}
                options={[
                  { label: "Not linked", value: "" },
                  ...services.map((service) => ({
                    label: `${serviceTypeLabels[service.service_type]} · ${formatDate(service.service_date)}`,
                    value: service.id,
                  })),
                ]}
              />
              <InlineSelectField
                table="documents"
                id={document.id}
                clientId={client.id}
                field="share_enabled"
                label="Public share"
                value={String(document.share_enabled)}
                options={[
                  { label: "Enabled", value: "true" },
                  { label: "Hidden", value: "false" },
                ]}
              />
              <div className="lg:col-span-2">
                <InlineEditField
                  table="documents"
                  id={document.id}
                  clientId={client.id}
                  field="summary"
                  label="Summary"
                  value={document.summary}
                  type="textarea"
                />
              </div>
              <InlineEditField
                table="documents"
                id={document.id}
                clientId={client.id}
                field="tax_rate"
                label="Tax %"
                value={document.tax_rate}
                type="number"
              />
              <InlineEditField
                table="documents"
                id={document.id}
                clientId={client.id}
                field="discount_amount"
                label="Discount"
                value={document.discount_amount}
                type="number"
                numberFormat="currency"
              />
              <InlineEditField
                table="documents"
                id={document.id}
                clientId={client.id}
                field="deposit_amount"
                label="Deposit"
                value={document.deposit_amount}
                type="number"
                numberFormat="currency"
              />
              <div className="lg:col-span-2">
                <InlineEditField
                  table="documents"
                  id={document.id}
                  clientId={client.id}
                  field="notes"
                  label="Notes"
                  value={document.notes}
                  type="textarea"
                />
              </div>
              <div className="lg:col-span-2">
                <InlineEditField
                  table="documents"
                  id={document.id}
                  clientId={client.id}
                  field="terms"
                  label="Terms"
                  value={document.terms}
                  type="textarea"
                />
              </div>
            </div>

            <div className="mt-6 border-t border-[#25344a] pt-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c8096]">
                    Default template
                  </p>
                  <p className="text-sm text-[#9aafc5]">
                    Save this {documentTypeLabels[document.document_type].toLowerCase()} as the
                    starting template for future {documentTypeLabels[document.document_type].toLowerCase()}s.
                  </p>
                </div>
                <SaveDocumentPresetButton
                  clientId={client.id}
                  documentId={document.id}
                  documentType={document.document_type}
                />
              </div>
            </div>
          </article>

          <article className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8096]">
                  Line items
                </p>
                <h2 className="display-heading mt-2 text-2xl font-bold text-white">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="admin-empty-state">
                  Add line items to build pricing. Totals update automatically.
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className={`${getAdminRecordRowClass("neutral")} p-4`}>
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_120px_160px_140px] lg:items-start">
                      <InlineEditField
                        table="document_items"
                        id={item.id}
                        clientId={client.id}
                        field="description"
                        label="Description"
                        value={item.description}
                        required
                      />
                      <InlineEditField
                        table="document_items"
                        id={item.id}
                        clientId={client.id}
                        field="quantity"
                        label="Qty"
                        value={item.quantity}
                        type="number"
                      />
                      <InlineEditField
                        table="document_items"
                        id={item.id}
                        clientId={client.id}
                        field="unit_price"
                        label="Unit price"
                        value={item.unit_price}
                        type="number"
                        numberFormat="currency"
                      />
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c8096]">
                          Line total
                        </p>
                        <div className="admin-inline-display">
                          <span className="text-white">{formatCurrency(item.line_total)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-[#25344a] pt-4">
                      <DeleteButton
                        table="document_items"
                        id={item.id}
                        clientId={client.id}
                        label="Line item"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 border-t border-[#25344a] pt-4">
              <CreateDocumentItemForm clientId={client.id} documentId={document.id} />
            </div>
          </article>
        </div>

        <div className="space-y-4">
          <article className="rounded-[1.75rem] border border-[#2d425d] bg-[linear-gradient(180deg,#102134_0%,#0d1827_100%)] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="relative h-10 w-[160px]">
                  <Image
                    src="/media/generated/wordmark-clean.png"
                    alt="Double Le HVAC"
                    fill
                    className="object-contain object-left"
                    sizes="160px"
                  />
                </div>
                <div className="space-y-1 text-sm text-[#9aafc5]">
                  <p>{companyProfile.cityStateZip}</p>
                  <a href={companyProfile.phoneHref} className="text-white hover:text-[#cfe6ff]">
                    {companyProfile.phoneDisplay}
                  </a>
                </div>
              </div>
              <div className="rounded-full border border-[#305272] bg-[#13263a] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-[#7ec8ff]">
                {documentTypeLabels[document.document_type]}
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <div className={`${getAdminMetricCardClass("neutral")} px-4 py-3`}>
                <p className="text-sm font-semibold text-[#9aafc5]">Subtotal</p>
                <p className="mt-2 text-2xl font-extrabold text-white">{formatCurrency(document.subtotal)}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className={`${getAdminMetricCardClass("cooling")} px-4 py-3`}>
                  <p className="text-sm font-semibold text-[#9aafc5]">Tax</p>
                  <p className="mt-2 text-xl font-extrabold text-white">{formatCurrency(document.tax_amount)}</p>
                </div>
                {document.discount_amount > 0 ? (
                  <div className={`${getAdminMetricCardClass("danger")} px-4 py-3`}>
                    <p className="text-sm font-semibold text-[#9aafc5]">Discount</p>
                    <p className="mt-2 text-xl font-extrabold text-white">
                      - {formatCurrency(document.discount_amount)}
                    </p>
                  </div>
                ) : null}
                <div className={`${getAdminMetricCardClass("warning")} px-4 py-3`}>
                  <p className="text-sm font-semibold text-[#9aafc5]">Deposit</p>
                  <p className="mt-2 text-xl font-extrabold text-white">{formatCurrency(document.deposit_amount)}</p>
                </div>
              </div>
              <div className={`${getAdminMetricCardClass("replacement")} px-4 py-3`}>
                <p className="text-sm font-semibold text-[#9aafc5]">Total</p>
                <p className="mt-2 text-3xl font-extrabold text-white">{formatCurrency(document.total)}</p>
                <p className="mt-2 text-sm text-[#9aafc5]">Balance due {formatCurrency(document.balance_due)}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[#25344a] bg-[#09131f] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c8096]">
                Client
              </p>
              <p className="mt-3 text-xl font-bold text-white">{client.name}</p>
              <div className="mt-3 space-y-1 text-sm text-[#9aafc5]">
                <a href={formatPhoneHref(client.phone)} className="text-white hover:text-[#cfe6ff]">
                  {client.phone}
                </a>
                {client.email ? <p>{client.email}</p> : null}
                {client.address ? <p>{client.address}</p> : null}
                {client.city || client.zip ? (
                  <p>{[client.city, client.zip].filter(Boolean).join(", ")}</p>
                ) : null}
              </div>
            </div>
          </article>

          <article className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8096]">
                Lifecycle
              </p>
            </div>

            <div className="space-y-3 text-sm text-[#9aafc5]">
              <div className="flex items-center justify-between gap-3">
                <span>Status</span>
                <StatusChip
                  label={documentStatusLabels[document.status]}
                  tone={document.status}
                  variant="text"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Sent</span>
                <span>{formatDate(document.sent_at?.slice(0, 10))}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Viewed</span>
                <span>{formatDate(document.viewed_at?.slice(0, 10))}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Approved</span>
                <span>{formatDate(document.approved_at?.slice(0, 10))}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Paid</span>
                <span>{formatDate(document.paid_at?.slice(0, 10))}</span>
              </div>
            </div>

            <div className="mt-4 border-t border-[#25344a] pt-4">
              <DeleteButton
                table="documents"
                id={document.id}
                clientId={client.id}
                label={documentTypeLabels[document.document_type]}
                redirectTo={`/admin/clients/${client.id}`}
              />
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
