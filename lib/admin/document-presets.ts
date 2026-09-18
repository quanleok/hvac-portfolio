import type { DocumentType } from "@/lib/admin/schema";
import type { DocumentPresetRow } from "@/lib/supabase/database.types";

export interface DocumentPresetLineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface DocumentPresetTemplate
  extends Omit<DocumentPresetRow, "document_type" | "line_items"> {
  document_type: DocumentType;
  line_items: DocumentPresetLineItem[];
}

export type DocumentPresetMap = Partial<Record<DocumentType, DocumentPresetTemplate>>;

export function sanitizeDocumentPresetLineItems(value: unknown): DocumentPresetLineItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as Record<string, unknown>;
    const description =
      typeof record.description === "string" ? record.description.trim() : "";
    const quantity =
      typeof record.quantity === "number"
        ? record.quantity
        : typeof record.quantity === "string"
          ? Number.parseFloat(record.quantity)
          : Number.NaN;
    const unitPrice =
      typeof record.unit_price === "number"
        ? record.unit_price
        : typeof record.unit_price === "string"
          ? Number.parseFloat(record.unit_price)
          : Number.NaN;

    if (!description || !Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
      return [];
    }

    return [
      {
        description,
        quantity,
        unit_price: unitPrice,
      } satisfies DocumentPresetLineItem,
    ];
  });
}
