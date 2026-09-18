import type { DocumentStatus, PaymentStatus } from "@/lib/admin/schema";
import type { StatusTone } from "@/lib/admin/status-tone";
import type { Tone } from "@/lib/visual-system";

export function getOpenInvoiceStatusLabel(status: PaymentStatus) {
  if (status === "invoiced") {
    return "Unpaid";
  }

  if (status === "pending") {
    return "Pending";
  }

  return "Paid";
}

export function getOpenInvoiceStatusTone(status: PaymentStatus): StatusTone {
  if (status === "invoiced") {
    return "unpaid";
  }

  return status;
}

export function getOpenInvoiceRowTone(status: PaymentStatus): Tone {
  if (status === "pending") {
    return "warning";
  }

  if (status === "invoiced") {
    return "danger";
  }

  return "success";
}

export function getOpenInvoiceDocumentStatusTone(status: DocumentStatus): StatusTone {
  if (status === "approved") {
    return "pending";
  }

  return status;
}

export function getOpenInvoiceDocumentRowTone(status: DocumentStatus): Tone {
  if (status === "past_due") {
    return "danger";
  }

  if (status === "approved") {
    return "warning";
  }

  return "cooling";
}
