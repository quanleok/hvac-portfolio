import type {
  DocumentItemInsert,
  DocumentItemRow,
  DocumentUpdate,
} from "@/lib/supabase/database.types";
import { type DocumentStatus, type DocumentType } from "@/lib/admin/schema";

export interface DocumentTotals {
  subtotal: number;
  tax_amount: number;
  total: number;
  balance_due: number;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function getDefaultDueDate(type: DocumentType, dateString: string) {
  const base = new Date(`${dateString}T12:00:00`);
  const offset = type === "quote" ? 14 : 7;
  base.setDate(base.getDate() + offset);
  return base.toISOString().slice(0, 10);
}

export function calculateLineTotal(quantity: number, unitPrice: number) {
  return roundCurrency(quantity * unitPrice);
}

export function calculateDocumentTotals(input: {
  items: Array<Pick<DocumentItemRow, "quantity" | "unit_price">> | Array<Pick<DocumentItemInsert, "quantity" | "unit_price">>;
  taxRate: number;
  discountAmount: number;
  depositAmount: number;
}): DocumentTotals {
  const subtotal = roundCurrency(
    input.items.reduce((sum, item) => {
      const quantity = Number(item.quantity ?? 0);
      const unitPrice = Number(item.unit_price ?? 0);
      return sum + quantity * unitPrice;
    }, 0)
  );
  const taxAmount = roundCurrency(subtotal * (input.taxRate / 100));
  const total = roundCurrency(Math.max(subtotal + taxAmount - input.discountAmount, 0));
  const balanceDue = roundCurrency(Math.max(total - input.depositAmount, 0));

  return {
    subtotal,
    tax_amount: taxAmount,
    total,
    balance_due: balanceDue,
  };
}

export function buildDocumentTotalsUpdate(input: {
  items: DocumentItemRow[];
  taxRate: number;
  discountAmount: number;
  depositAmount: number;
}): Pick<DocumentUpdate, "subtotal" | "tax_amount" | "total" | "balance_due"> {
  return calculateDocumentTotals(input);
}

export function getDocumentPrefix(type: DocumentType) {
  return type === "quote" ? "Q" : "INV";
}

export function getDocumentSharePath(token: string) {
  return `/d/${token}`;
}

export function getDocumentImagePath(token: string) {
  return `${getDocumentSharePath(token)}/image`;
}

export function isDocumentStatus(value: string): value is DocumentStatus {
  return (
    value === "draft" ||
    value === "sent" ||
    value === "approved" ||
    value === "rejected" ||
    value === "paid" ||
    value === "past_due" ||
    value === "void"
  );
}
