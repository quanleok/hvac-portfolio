import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { ClearFollowUpButton } from "@/components/admin/clear-follow-up-button";
import { CreateEquipmentForm } from "@/components/admin/create-equipment-form";
import { CreateNoteForm } from "@/components/admin/create-note-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { InlineEditField } from "@/components/admin/inline-edit-field";
import { InlineSelectField } from "@/components/admin/inline-select-field";
import { ReviewRequestPanel } from "@/components/admin/review-request-panel";
import { SetupNotice } from "@/components/admin/setup-notice";
import { StatusChip } from "@/components/admin/status-chip";
import { getDocumentSharePath } from "@/lib/admin/document-utils";
import { formatCurrency, formatDate, formatDateTime, formatPhoneHref } from "@/lib/admin/format";
import { getClientDetail } from "@/lib/admin/data";
import { isOpenInvoiceDocument, isSettledInvoiceDocument } from "@/lib/admin/invoice-status";
import { isMissingClientSchemaError } from "@/lib/admin/setup";
import {
  clientSourceLabels,
  clientSources,
  clientStatusLabels,
  clientStatuses,
  documentStatusLabels,
  documentTypeLabels,
  equipmentTypeLabels,
  equipmentTypes,
  paymentStatusLabels,
  paymentStatuses,
  serviceTypeLabels,
  serviceTypes,
} from "@/lib/admin/schema";
import {
  getAdminRecordRowClass,
  getDocumentStatusTone,
  getPaymentStatusTone,
} from "@/lib/visual-system";

interface ClientDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;
  let detail;

  try {
    detail = await getClientDetail(id);
  } catch (error) {
    if (isMissingClientSchemaError(error)) {
      return <SetupNotice />;
    }

    throw error;
  }

  if (!detail) {
    notFound();
  }

  const { client, documents, equipment, notes, services } = detail;
  const linkedDocumentByServiceId = new Map<string, (typeof documents)[number]>();

  for (const document of documents) {
    if (!document.linked_service_id) {
      continue;
    }

    const existing = linkedDocumentByServiceId.get(document.linked_service_id);

    if (!existing || (existing.document_type !== "invoice" && document.document_type === "invoice")) {
      linkedDocumentByServiceId.set(document.linked_service_id, document);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <AdminBreadcrumbs
            items={[{ label: "Clients", href: "/admin" }, { label: client.name }]}
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8096]">
              Client detail
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="display-heading text-2xl font-extrabold text-white">{client.name}</h1>
              <StatusChip label={clientStatusLabels[client.status]} tone={client.status} variant="text" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-[#9aafc5]">
            <a href={formatPhoneHref(client.phone)} className="rounded-sm border border-[#25344a] bg-[#0f1c2d] px-2 py-0.5 text-white hover:bg-[#1a2c44]">
              {client.phone}
            </a>
            {client.email ? (
              <a href={`mailto:${client.email}`} className="rounded-sm border border-[#25344a] bg-[#0f1c2d] px-2 py-0.5 text-white hover:bg-[#1a2c44]">
                {client.email}
              </a>
            ) : null}
            <span className="rounded-sm border border-[#25344a] bg-[#0f1c2d] px-2 py-0.5 text-[#9aafc5]">
              Added {formatDate(client.created_at.slice(0, 10))}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={`/admin/clients/${client.id}/service/new`} className="inline-flex items-center justify-center rounded-md bg-[#1f6feb] px-4 py-2 text-sm font-bold text-white hover:bg-[#3178e6]">
            Log service
          </Link>
          <DeleteButton table="clients" id={client.id} clientId={client.id} label="Client" redirectTo="/admin" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <article className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8096]">
                  Quotes and invoices
                </p>
                <h2 className="display-heading mt-2 text-2xl font-bold text-white">
                  {documents.length} document{documents.length === 1 ? "" : "s"}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Link
                  href={`/admin/clients/${client.id}/documents/new?type=quote`}
                  className="inline-flex items-center justify-center rounded-md bg-[#1a2c44] px-3 py-2 text-sm font-bold text-white hover:bg-[#243654] border border-[#25344a]"
                >
                  New quote
                </Link>
                <Link
                  href={`/admin/clients/${client.id}/documents/new?type=invoice`}
                  className="inline-flex items-center justify-center rounded-md bg-[#1f6feb] px-3 py-2 text-sm font-bold text-white hover:bg-[#3178e6]"
                >
                  New invoice
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              {documents.length === 0 ? (
                <div className="rounded-md border border-dashed border-[#25344a] p-4 text-[#9aafc5]">
                  No quote or invoice records yet.
                </div>
              ) : (
                documents.map((document) => {
                  const deadlineLabel = document.document_type === "quote" ? "Valid through" : "Due";
                  const deadlineValue =
                    document.document_type === "quote" ? document.expires_on : document.due_date;

                  return (
                    <div
                      key={document.id}
                      className={`${getAdminRecordRowClass(getDocumentStatusTone(document.status))} px-4 py-3`}
                    >
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] xl:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/admin/documents/${document.id}`} className="inline-block max-w-full">
                              <p className="display-heading break-words text-xl leading-tight text-white">
                                {document.title || document.document_number}
                              </p>
                            </Link>
                            <span className="text-sm font-semibold text-[#9aafc5]">
                              {documentTypeLabels[document.document_type]}
                            </span>
                            <StatusChip
                              label={documentStatusLabels[document.status]}
                              tone={document.status}
                              variant="text"
                            />
                          </div>

                          <div className="mt-2 flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-sm text-[#9aafc5]">
                            <span>{document.document_number}</span>
                            <span>{document.item_count} item{document.item_count === 1 ? "" : "s"}</span>
                            <span>Issued {formatDate(document.issue_date)}</span>
                            <span>
                              {deadlineLabel} {formatDate(deadlineValue)}
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-3 text-sm text-[#9aafc5] sm:grid-cols-3 xl:grid-cols-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6c8096]">
                              Subtotal
                            </p>
                            <p className="mt-2 text-white">{formatCurrency(document.subtotal)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6c8096]">
                              Total
                            </p>
                            <p className="mt-2 text-white">{formatCurrency(document.total)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6c8096]">
                              Balance
                            </p>
                            <p className="mt-2 text-white">{formatCurrency(document.balance_due)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap xl:justify-end">
                          {document.share_enabled ? (
                            <Link
                              href={getDocumentSharePath(document.public_token)}
                              target="_blank"
                              className="admin-action-button admin-action-button--call"
                            >
                              View share
                            </Link>
                          ) : null}
                          <Link
                            href={`/admin/documents/${document.id}`}
                            className="admin-action-button admin-action-button--open"
                          >
                            Open document
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </article>

          <article className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8096]">
                Contact info
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InlineEditField
                table="clients"
                id={client.id}
                clientId={client.id}
                field="name"
                label="Name"
                value={client.name}
                required
              />
              <InlineEditField
                table="clients"
                id={client.id}
                clientId={client.id}
                field="phone"
                label="Phone"
                value={client.phone}
                type="tel"
                required
              />
              <InlineEditField
                table="clients"
                id={client.id}
                clientId={client.id}
                field="email"
                label="Email"
                value={client.email}
                type="email"
              />
              <InlineEditField
                table="clients"
                id={client.id}
                clientId={client.id}
                field="city"
                label="City"
                value={client.city}
              />
              <InlineEditField
                table="clients"
                id={client.id}
                clientId={client.id}
                field="address"
                label="Address"
                value={client.address}
              />
              <InlineEditField
                table="clients"
                id={client.id}
                clientId={client.id}
                field="zip"
                label="ZIP"
                value={client.zip}
              />
              <InlineSelectField
                table="clients"
                id={client.id}
                clientId={client.id}
                field="source"
                label="Source"
                value={client.source}
                options={clientSources.map((source) => ({
                  label: clientSourceLabels[source],
                  value: source,
                }))}
              />
              <InlineSelectField
                table="clients"
                id={client.id}
                clientId={client.id}
                field="status"
                label="Status"
                value={client.status}
                options={clientStatuses.map((status) => ({
                  label: clientStatusLabels[status],
                  value: status,
                }))}
              />
            </div>
          </article>

          <article className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8096]">
                  Service history
                </p>
                <h2 className="display-heading mt-2 text-2xl font-bold text-white">{services.length} records</h2>
              </div>
              <Link href={`/admin/clients/${client.id}/service/new`} className="inline-flex items-center justify-center rounded-md bg-[#1a2c44] px-3 py-2 text-sm font-bold text-white hover:bg-[#243654] border border-[#25344a]">
                Add service
              </Link>
            </div>

            <div className="space-y-3">
              {services.length === 0 ? (
                <div className="rounded-md border border-dashed border-[#25344a] p-4 text-[#9aafc5]">
                  No service history yet.
                </div>
              ) : (
                services.map((service) => {
                  const linkedDocument = linkedDocumentByServiceId.get(service.id);
                  const managingInvoice =
                    linkedDocument?.document_type === "invoice" ? linkedDocument : null;
                  const displayPaymentStatus = managingInvoice
                    ? isOpenInvoiceDocument({
                        document_type: managingInvoice.document_type,
                        status: managingInvoice.status,
                        balance_due: managingInvoice.balance_due,
                      })
                      ? "invoiced"
                      : managingInvoice.status === "paid" ||
                          isSettledInvoiceDocument({
                            document_type: managingInvoice.document_type,
                            status: managingInvoice.status,
                            balance_due: managingInvoice.balance_due,
                          })
                        ? "paid"
                        : service.payment_status
                    : service.payment_status;

                  return (
                    <div
                      key={service.id}
                      className={`${getAdminRecordRowClass(getPaymentStatusTone(displayPaymentStatus))} p-4`}
                    >
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <StatusChip
                            label={paymentStatusLabels[displayPaymentStatus]}
                            tone={displayPaymentStatus}
                            variant="text"
                          />
                          <p className="text-sm font-semibold text-[#9aafc5]">
                            {serviceTypeLabels[service.service_type]}
                          </p>
                          {linkedDocument ? (
                            <Link
                              href={`/admin/documents/${linkedDocument.id}`}
                              className="text-sm font-semibold text-[#88b8ff] hover:text-white"
                            >
                              {documentTypeLabels[linkedDocument.document_type]} {linkedDocument.document_number}
                            </Link>
                          ) : null}
                        </div>
                        {service.follow_up_date || service.follow_up_note ? (
                          <ClearFollowUpButton
                            serviceId={service.id}
                            clientId={client.id}
                            label="Clear follow-up"
                            className="admin-action-button admin-action-button--done"
                          />
                        ) : null}
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <InlineSelectField
                          table="services"
                          id={service.id}
                          clientId={client.id}
                          field="service_type"
                          label="Service type"
                          value={service.service_type}
                          options={serviceTypes.map((serviceType) => ({
                            label: serviceTypeLabels[serviceType],
                            value: serviceType,
                          }))}
                        />
                        <InlineEditField
                          table="services"
                          id={service.id}
                          clientId={client.id}
                          field="service_date"
                          label="Service date"
                          value={service.service_date}
                          type="date"
                        />
                        <InlineEditField
                          table="services"
                          id={service.id}
                          clientId={client.id}
                          field="description"
                          label="Description"
                          value={service.description}
                          type="textarea"
                        />
                        <InlineEditField
                          table="services"
                          id={service.id}
                          clientId={client.id}
                          field="cost"
                          label="Cost"
                          value={service.cost}
                          type="number"
                          numberFormat="currency"
                        />
                        {managingInvoice ? (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c8096]">
                              Payment
                            </p>
                            <div className="admin-inline-display">
                              <div className="flex flex-wrap items-center gap-2">
                                <StatusChip
                                  label={paymentStatusLabels[displayPaymentStatus]}
                                  tone={displayPaymentStatus}
                                  variant="text"
                                />
                                <Link
                                  href={`/admin/documents/${managingInvoice.id}`}
                                  className="text-sm font-semibold text-[#88b8ff] hover:text-white"
                                >
                                  Managed by invoice {managingInvoice.document_number}
                                </Link>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <InlineSelectField
                            table="services"
                            id={service.id}
                            clientId={client.id}
                            field="payment_status"
                            label="Payment"
                            value={service.payment_status}
                            options={paymentStatuses.map((paymentStatus) => ({
                              label: paymentStatusLabels[paymentStatus],
                              value: paymentStatus,
                            }))}
                          />
                        )}
                        <InlineEditField
                          table="services"
                          id={service.id}
                          clientId={client.id}
                          field="follow_up_date"
                          label="Follow-up date"
                          value={service.follow_up_date}
                          type="date"
                        />
                        <div className="lg:col-span-2">
                          <InlineEditField
                            table="services"
                            id={service.id}
                            clientId={client.id}
                            field="follow_up_note"
                            label="Follow-up note"
                            value={service.follow_up_note}
                            type="textarea"
                          />
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#25344a] pt-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6c8096]">
                          Updated {formatDateTime(service.updated_at)}
                        </p>
                        <DeleteButton table="services" id={service.id} clientId={client.id} label="Service" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </article>
        </div>

        <div className="space-y-4">
          <ReviewRequestPanel
            clientId={client.id}
            clientName={client.name}
            clientEmail={client.email}
          />

          <article className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8096]">
                Equipment
              </p>
            </div>

            <div className="space-y-3">
              {equipment.length === 0 ? (
                <div className="rounded-md border border-dashed border-[#25344a] p-4 text-[#9aafc5]">
                  No equipment recorded yet.
                </div>
              ) : (
                equipment.map((unit) => (
                  <div key={unit.id} className={`${getAdminRecordRowClass("neutral")} p-4`}>
                    <div className="grid gap-4">
                      <InlineSelectField
                        table="equipment"
                        id={unit.id}
                        clientId={client.id}
                        field="unit_type"
                        label="Unit type"
                        value={unit.unit_type}
                        options={equipmentTypes.map((equipmentType) => ({
                          label: equipmentTypeLabels[equipmentType],
                          value: equipmentType,
                        }))}
                      />
                      <InlineEditField
                        table="equipment"
                        id={unit.id}
                        clientId={client.id}
                        field="brand"
                        label="Brand"
                        value={unit.brand}
                      />
                      <InlineEditField
                        table="equipment"
                        id={unit.id}
                        clientId={client.id}
                        field="model"
                        label="Model"
                        value={unit.model}
                      />
                      <InlineEditField
                        table="equipment"
                        id={unit.id}
                        clientId={client.id}
                        field="install_year"
                        label="Install year"
                        value={unit.install_year}
                        type="number"
                      />
                      <InlineEditField
                        table="equipment"
                        id={unit.id}
                        clientId={client.id}
                        field="warranty_expires"
                        label="Warranty expires"
                        value={unit.warranty_expires}
                        type="date"
                      />
                      <InlineEditField
                        table="equipment"
                        id={unit.id}
                        clientId={client.id}
                        field="notes"
                        label="Equipment notes"
                        value={unit.notes}
                        type="textarea"
                      />
                    </div>

                    <div className="mt-5 border-t border-[#25344a] pt-4">
                      <DeleteButton table="equipment" id={unit.id} clientId={client.id} label="Equipment" />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 border-t border-[#25344a] pt-4">
              <CreateEquipmentForm clientId={client.id} />
            </div>
          </article>

          <article className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8096]">
                Notes
              </p>
            </div>

            <div className="space-y-3">
              {notes.length === 0 ? (
                <div className="rounded-md border border-dashed border-[#25344a] p-4 text-[#9aafc5]">
                  No notes yet.
                </div>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className={`${getAdminRecordRowClass("neutral")} p-4`}>
                    <InlineEditField
                      table="notes"
                      id={note.id}
                      clientId={client.id}
                      field="note_text"
                      label={`Note from ${formatDateTime(note.created_at)}`}
                      value={note.note_text}
                      type="textarea"
                      required
                    />
                    <div className="mt-5 border-t border-[#25344a] pt-4">
                      <DeleteButton table="notes" id={note.id} clientId={client.id} label="Note" />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 border-t border-[#25344a] pt-4">
              <CreateNoteForm clientId={client.id} />
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
