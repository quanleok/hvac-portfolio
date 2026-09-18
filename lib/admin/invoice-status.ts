import type { DocumentStatus, DocumentType, PaymentStatus } from "@/lib/admin/schema";

const OPEN_INVOICE_DOCUMENT_STATUSES = ["sent", "approved", "past_due"] as const;
const SETTLED_INVOICE_DOCUMENT_STATUSES = ["sent", "approved", "paid", "past_due"] as const;

export function isLegacyOpenPaymentStatus(status: PaymentStatus) {
  return status !== "paid";
}

export function isOpenInvoiceDocumentStatus(status: DocumentStatus) {
  return (OPEN_INVOICE_DOCUMENT_STATUSES as readonly string[]).includes(status);
}

export function isOpenInvoiceDocument(input: {
  document_type: DocumentType;
  status: DocumentStatus;
  balance_due: number;
}) {
  return (
    input.document_type === "invoice" &&
    input.balance_due > 0 &&
    isOpenInvoiceDocumentStatus(input.status)
  );
}

export function isSettledInvoiceDocument(input: {
  document_type: DocumentType;
  status: DocumentStatus;
  balance_due: number;
}) {
  return (
    input.document_type === "invoice" &&
    input.balance_due <= 0 &&
    (SETTLED_INVOICE_DOCUMENT_STATUSES as readonly string[]).includes(input.status)
  );
}

export function shouldSuppressLegacyServicePayment(input: {
  document_type: DocumentType;
  status: DocumentStatus;
  balance_due: number;
}) {
  if (input.document_type !== "invoice") {
    return false;
  }

  return input.status === "paid" || isOpenInvoiceDocument(input) || isSettledInvoiceDocument(input);
}
