import {
  clientStatuses,
  documentStatuses,
  paymentStatuses,
  type ClientStatus,
  type DocumentStatus,
  type PaymentStatus,
} from "@/lib/admin/schema";

export type StatusTone = ClientStatus | PaymentStatus | DocumentStatus | "follow_up" | "unpaid";

function isClientStatus(value: string): value is ClientStatus {
  return (clientStatuses as readonly string[]).includes(value);
}

function isPaymentStatus(value: string): value is PaymentStatus {
  return (paymentStatuses as readonly string[]).includes(value);
}

function isDocumentStatus(value: string): value is DocumentStatus {
  return (documentStatuses as readonly string[]).includes(value);
}

export function getStatusToneForField(table: string, field: string, value: string): StatusTone | null {
  if (table === "clients" && field === "status" && isClientStatus(value)) {
    return value;
  }

  if (table === "services" && field === "payment_status" && isPaymentStatus(value)) {
    return value;
  }

  if (table === "documents" && field === "status" && isDocumentStatus(value)) {
    return value;
  }

  return null;
}
