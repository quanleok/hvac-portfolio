"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import {
  clientSources,
  clientStatuses,
  documentStatuses,
  documentTypeLabels,
  documentTypes,
  equipmentTypes,
  paymentStatuses,
  serviceTypes,
} from "@/lib/admin/schema";
import type {
  Database,
  ClientInsert,
  ClientUpdate,
  DocumentInsert,
  DocumentItemInsert,
  DocumentItemRow,
  DocumentPresetInsert,
  DocumentItemUpdate,
  DocumentUpdate,
  EquipmentInsert,
  EquipmentUpdate,
  NoteInsert,
  NoteUpdate,
  ServiceInsert,
  ServiceUpdate,
} from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseBrowserCredentials } from "@/lib/supabase/config";
import { normalizeOwnerLoginIdentifier } from "@/lib/admin/account";
import { companyProfile } from "@/lib/admin/company-profile";
import { getAdminTodayDateString } from "@/lib/admin/date";
import {
  sanitizeDocumentPresetLineItems,
  type DocumentPresetLineItem,
} from "@/lib/admin/document-presets";
import {
  isOpenInvoiceDocument,
  isOpenInvoiceDocumentStatus,
  isSettledInvoiceDocument,
} from "@/lib/admin/invoice-status";
import {
  buildDocumentTotalsUpdate,
  calculateDocumentTotals,
  calculateLineTotal,
  getDefaultDueDate,
  getDocumentImagePath,
  getDocumentPrefix,
  getDocumentSharePath,
} from "@/lib/admin/document-utils";
import { formatCurrency } from "@/lib/admin/format";
import {
  buildGoogleReviewRequestMessage,
  getGoogleReviewUrl,
} from "@/lib/admin/review-request";
import { sendSms } from "@/lib/notifications/sms";

type TableName =
  | "clients"
  | "documents"
  | "document_items"
  | "equipment"
  | "notes"
  | "services";

export type ActionResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

interface LoginInput {
  email: string;
  password: string;
}

interface ChangePasswordInput {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

interface CreateClientInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  zip?: string;
  source?: string;
  status?: string;
}

interface CreateEquipmentInput {
  clientId: string;
  unitType: string;
  brand?: string;
  model?: string;
  installYear?: string;
  warrantyExpires?: string;
  notes?: string;
}

interface CreateNoteInput {
  clientId: string;
  noteText: string;
}

interface CreateServiceInput {
  clientId: string;
  serviceDate: string;
  serviceType: string;
  description?: string;
  cost?: string;
  paymentStatus?: string;
  followUpDate?: string;
  followUpNote?: string;
}

interface CreateDocumentInput {
  clientId: string;
  documentType: string;
  title?: string;
  summary?: string;
  notes?: string;
  terms?: string;
  issueDate?: string;
  dueDate?: string;
  expiresOn?: string;
  taxRate?: string;
  discountAmount?: string;
  depositAmount?: string;
  linkedServiceId?: string;
  presetItems?: DocumentPresetLineItem[];
}

interface CreateDocumentItemInput {
  clientId: string;
  documentId: string;
  description: string;
  quantity?: string;
  unitPrice?: string;
}

interface DuplicateDocumentInput {
  clientId: string;
  documentId: string;
  targetType?: string;
}

interface SendDocumentSmsInput {
  clientId: string;
  documentId: string;
}

interface SendReviewRequestSmsInput {
  clientId: string;
}

interface SaveDocumentPresetInput {
  clientId: string;
  documentId: string;
}

interface DeleteRecordInput {
  table: TableName;
  id: string;
  clientId: string;
}

interface UpdateRecordInput {
  table: TableName;
  id: string;
  clientId: string;
  values: Record<string, unknown>;
}

interface ClearServiceFollowUpInput {
  serviceId: string;
  clientId: string;
}

function asRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function asOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asOptionalDate(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    throw new Error("Use a valid date.");
  }

  return value.trim();
}

function asOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;

  if (!Number.isFinite(numberValue)) {
    throw new Error("Use a valid number.");
  }

  return numberValue;
}

function asOptionalInteger(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isInteger(numberValue)) {
    throw new Error("Use a valid year.");
  }

  return numberValue;
}

function asOptionalBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }

  throw new Error("Use a valid yes or no value.");
}

function asEnumValue<T extends readonly string[]>(
  value: unknown,
  allowedValues: T,
  fieldName: string
): T[number] {
  if (typeof value !== "string" || !allowedValues.includes(value as T[number])) {
    throw new Error(`Use a valid ${fieldName}.`);
  }

  return value as T[number];
}

function buildClientInsert(input: CreateClientInput): ClientInsert {
  return {
    name: asRequiredString(input.name, "Name"),
    phone: asRequiredString(input.phone, "Phone"),
    email: asOptionalString(input.email),
    address: asOptionalString(input.address),
    city: asOptionalString(input.city),
    zip: asOptionalString(input.zip),
    source: input.source
      ? asEnumValue(input.source, clientSources, "source")
      : "manual",
    status: input.status
      ? asEnumValue(input.status, clientStatuses, "status")
      : "active",
  };
}

function buildClientUpdate(values: Record<string, unknown>): ClientUpdate {
  const update: ClientUpdate = {};

  if ("name" in values) {
    update.name = asRequiredString(values.name, "Name");
  }

  if ("phone" in values) {
    update.phone = asRequiredString(values.phone, "Phone");
  }

  if ("email" in values) {
    update.email = asOptionalString(values.email);
  }

  if ("address" in values) {
    update.address = asOptionalString(values.address);
  }

  if ("city" in values) {
    update.city = asOptionalString(values.city);
  }

  if ("zip" in values) {
    update.zip = asOptionalString(values.zip);
  }

  if ("source" in values) {
    update.source = asEnumValue(values.source, clientSources, "source");
  }

  if ("status" in values) {
    update.status = asEnumValue(values.status, clientStatuses, "status");
  }

  return update;
}

function buildEquipmentInsert(input: CreateEquipmentInput): EquipmentInsert {
  return {
    client_id: input.clientId,
    unit_type: asEnumValue(input.unitType, equipmentTypes, "equipment type"),
    brand: asOptionalString(input.brand),
    model: asOptionalString(input.model),
    install_year: asOptionalInteger(input.installYear),
    warranty_expires: asOptionalDate(input.warrantyExpires),
    notes: asOptionalString(input.notes),
  };
}

function buildEquipmentUpdate(values: Record<string, unknown>): EquipmentUpdate {
  const update: EquipmentUpdate = {};

  if ("unit_type" in values) {
    update.unit_type = asEnumValue(values.unit_type, equipmentTypes, "equipment type");
  }

  if ("brand" in values) {
    update.brand = asOptionalString(values.brand);
  }

  if ("model" in values) {
    update.model = asOptionalString(values.model);
  }

  if ("install_year" in values) {
    update.install_year = asOptionalInteger(values.install_year);
  }

  if ("warranty_expires" in values) {
    update.warranty_expires = asOptionalDate(values.warranty_expires);
  }

  if ("notes" in values) {
    update.notes = asOptionalString(values.notes);
  }

  return update;
}

function buildNoteInsert(input: CreateNoteInput): NoteInsert {
  return {
    client_id: input.clientId,
    note_text: asRequiredString(input.noteText, "Note"),
  };
}

function buildNoteUpdate(values: Record<string, unknown>): NoteUpdate {
  const update: NoteUpdate = {};

  if ("note_text" in values) {
    update.note_text = asRequiredString(values.note_text, "Note");
  }

  return update;
}

function buildServiceInsert(input: CreateServiceInput): ServiceInsert {
  return {
    client_id: input.clientId,
    service_date: asOptionalDate(input.serviceDate) ?? getAdminTodayDateString(),
    service_type: asEnumValue(input.serviceType, serviceTypes, "service type"),
    description: asOptionalString(input.description),
    cost: asOptionalNumber(input.cost),
    payment_status: input.paymentStatus
      ? asEnumValue(input.paymentStatus, paymentStatuses, "payment status")
      : "paid",
    follow_up_date: asOptionalDate(input.followUpDate),
    follow_up_note: asOptionalString(input.followUpNote),
  };
}

function buildServiceUpdate(values: Record<string, unknown>): ServiceUpdate {
  const update: ServiceUpdate = {};

  if ("service_date" in values) {
    update.service_date = asOptionalDate(values.service_date) ?? getAdminTodayDateString();
  }

  if ("service_type" in values) {
    update.service_type = asEnumValue(values.service_type, serviceTypes, "service type");
  }

  if ("description" in values) {
    update.description = asOptionalString(values.description);
  }

  if ("cost" in values) {
    update.cost = asOptionalNumber(values.cost);
  }

  if ("payment_status" in values) {
    update.payment_status = asEnumValue(values.payment_status, paymentStatuses, "payment status");
  }

  if ("follow_up_date" in values) {
    update.follow_up_date = asOptionalDate(values.follow_up_date);
  }

  if ("follow_up_note" in values) {
    update.follow_up_note = asOptionalString(values.follow_up_note);
  }

  return update;
}

function buildDocumentInsert(
  input: CreateDocumentInput,
  documentNumber: string
): DocumentInsert {
  const documentType = asEnumValue(input.documentType, documentTypes, "document type");
  const issueDate = asOptionalDate(input.issueDate) ?? getAdminTodayDateString();
  const taxRate = asOptionalNumber(input.taxRate) ?? 0;
  const discountAmount = asOptionalNumber(input.discountAmount) ?? 0;
  const depositAmount = asOptionalNumber(input.depositAmount) ?? 0;
  const totals = calculateDocumentTotals({
    items: [],
    taxRate,
    discountAmount,
    depositAmount,
  });

  return {
    client_id: input.clientId,
    linked_service_id: asOptionalString(input.linkedServiceId),
    document_type: documentType,
    status: "draft",
    document_number: documentNumber,
    title: asOptionalString(input.title),
    summary: asOptionalString(input.summary),
    notes: asOptionalString(input.notes),
    terms: asOptionalString(input.terms),
    issue_date: issueDate,
    due_date:
      documentType === "invoice"
        ? asOptionalDate(input.dueDate) ?? getDefaultDueDate(documentType, issueDate)
        : null,
    expires_on:
      documentType === "quote"
        ? asOptionalDate(input.expiresOn) ?? getDefaultDueDate(documentType, issueDate)
        : null,
    tax_rate: taxRate,
    discount_amount: discountAmount,
    deposit_amount: depositAmount,
    ...totals,
  };
}

function buildDocumentUpdate(values: Record<string, unknown>): DocumentUpdate {
  const update: DocumentUpdate = {};

  if ("linked_service_id" in values) {
    update.linked_service_id = asOptionalString(values.linked_service_id);
  }

  if ("document_type" in values) {
    update.document_type = asEnumValue(values.document_type, documentTypes, "document type");
  }

  if ("status" in values) {
    update.status = asEnumValue(values.status, documentStatuses, "document status");
  }

  if ("document_number" in values) {
    update.document_number = asRequiredString(values.document_number, "Document number");
  }

  if ("title" in values) {
    update.title = asOptionalString(values.title);
  }

  if ("summary" in values) {
    update.summary = asOptionalString(values.summary);
  }

  if ("notes" in values) {
    update.notes = asOptionalString(values.notes);
  }

  if ("terms" in values) {
    update.terms = asOptionalString(values.terms);
  }

  if ("issue_date" in values) {
    update.issue_date = asOptionalDate(values.issue_date) ?? getAdminTodayDateString();
  }

  if ("due_date" in values) {
    update.due_date = asOptionalDate(values.due_date);
  }

  if ("expires_on" in values) {
    update.expires_on = asOptionalDate(values.expires_on);
  }

  if ("tax_rate" in values) {
    update.tax_rate = asOptionalNumber(values.tax_rate) ?? 0;
  }

  if ("discount_amount" in values) {
    update.discount_amount = asOptionalNumber(values.discount_amount) ?? 0;
  }

  if ("deposit_amount" in values) {
    update.deposit_amount = asOptionalNumber(values.deposit_amount) ?? 0;
  }

  if ("share_enabled" in values) {
    update.share_enabled = asOptionalBoolean(values.share_enabled);
  }

  return update;
}

function buildDocumentItemInsert(
  input: CreateDocumentItemInput,
  sortOrder: number
): DocumentItemInsert {
  const quantity = asOptionalNumber(input.quantity) ?? 1;
  const unitPrice = asOptionalNumber(input.unitPrice) ?? 0;

  return {
    document_id: input.documentId,
    sort_order: sortOrder,
    description: asRequiredString(input.description, "Item description"),
    quantity,
    unit_price: unitPrice,
    line_total: calculateLineTotal(quantity, unitPrice),
  };
}

function buildDocumentItemUpdate(values: Record<string, unknown>): DocumentItemUpdate {
  const update: DocumentItemUpdate = {};
  let quantity: number | null | undefined;
  let unitPrice: number | null | undefined;

  if ("description" in values) {
    update.description = asRequiredString(values.description, "Item description");
  }

  if ("quantity" in values) {
    quantity = asOptionalNumber(values.quantity);
    update.quantity = quantity ?? 1;
  }

  if ("unit_price" in values) {
    unitPrice = asOptionalNumber(values.unit_price);
    update.unit_price = unitPrice ?? 0;
  }

  if ("sort_order" in values) {
    update.sort_order = asOptionalInteger(values.sort_order) ?? 0;
  }

  if (quantity !== undefined || unitPrice !== undefined) {
    update.line_total = calculateLineTotal(
      quantity ?? 1,
      unitPrice ?? 0
    );
  }

  return update;
}

function assertHasValues(update: Record<string, unknown>) {
  if (Object.keys(update).length === 0) {
    throw new Error("Nothing changed.");
  }
}

async function generateDocumentNumber(
  supabase: Awaited<ReturnType<typeof getVerifiedSupabaseClient>>,
  documentType: DocumentInsert["document_type"]
) {
  const prefix = getDocumentPrefix(documentType);
  const stamp = getAdminTodayDateString().replaceAll("-", "");
  const likePrefix = `${prefix}-${stamp}-%`;
  const { data, error } = await supabase
    .from("documents")
    .select("document_number")
    .eq("document_type", documentType)
    .like("document_number", likePrefix)
    .order("document_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const current = data?.document_number?.split("-").at(-1);
  const nextCount = current ? Number.parseInt(current, 10) + 1 : 1;
  return `${prefix}-${stamp}-${String(nextCount).padStart(3, "0")}`;
}

function buildDocumentStatusTimestamps(
  currentStatus: string,
  nextStatus: string
): Pick<DocumentUpdate, "sent_at" | "approved_at" | "paid_at"> {
  const now = new Date().toISOString();
  const update: Pick<DocumentUpdate, "sent_at" | "approved_at" | "paid_at"> = {};

  if (nextStatus === "sent" && currentStatus !== "sent") {
    update.sent_at = now;
  }

  if (nextStatus === "approved" && currentStatus !== "approved") {
    update.approved_at = now;
  }

  if (nextStatus === "paid" && currentStatus !== "paid") {
    update.paid_at = now;
  }

  return update;
}

function normalizePhoneForSms(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("+")) {
    const normalized = `+${trimmed.slice(1).replace(/\D/g, "")}`;
    return /^\+\d{10,15}$/.test(normalized) ? normalized : null;
  }

  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return null;
}

function buildDocumentSmsBody(input: {
  clientName: string;
  documentType: DocumentInsert["document_type"];
  documentNumber: string;
  total: number;
  shareUrl: string;
}) {
  const lines = [
    `Double Le HVAC for ${input.clientName}: your ${documentTypeLabels[input.documentType].toLowerCase()} ${input.documentNumber} is ready.`,
  ];

  if (input.documentType === "invoice" && input.total > 0) {
    lines.push(`Amount: ${formatCurrency(input.total)}`);
  }

  lines.push(`View and save: ${input.shareUrl}`);
  lines.push(`Questions: ${companyProfile.phoneDisplay}`);
  return lines.join("\n");
}

async function syncDocumentTotals(
  supabase: Awaited<ReturnType<typeof getVerifiedSupabaseClient>>,
  documentId: string
) {
  const [{ data: document, error: documentError }, { data: items, error: itemsError }] =
    await Promise.all([
      supabase
        .from("documents")
        .select("id, tax_rate, discount_amount, deposit_amount")
        .eq("id", documentId)
        .single(),
      supabase
        .from("document_items")
        .select("id, quantity, unit_price, line_total")
        .eq("document_id", documentId),
    ]);

  if (documentError) {
    throw new Error(documentError.message);
  }

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const totals = buildDocumentTotalsUpdate({
    items: (items ?? []) as DocumentItemRow[],
    taxRate: document.tax_rate,
    discountAmount: document.discount_amount,
    depositAmount: document.deposit_amount,
  });

  const { error: updateError } = await supabase
    .from("documents")
    .update(totals)
    .eq("id", documentId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

async function deleteDocumentOnFailure(
  supabase: Awaited<ReturnType<typeof getVerifiedSupabaseClient>>,
  documentId: string
) {
  const { error } = await supabase.from("documents").delete().eq("id", documentId);

  if (error) {
    throw new Error(`Document cleanup failed: ${error.message}`);
  }
}

async function getVerifiedSupabaseClient() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    throw new Error("Your admin session expired. Sign in again.");
  }

  return supabase;
}

async function syncServicePaymentStatusFromLinkedInvoices(
  supabase: Awaited<ReturnType<typeof getVerifiedSupabaseClient>>,
  serviceId: string
) {
  const [{ data: service, error: serviceError }, { data: documents, error: documentsError }] =
    await Promise.all([
      supabase
        .from("services")
        .select("id, cost, payment_status")
        .eq("id", serviceId)
        .maybeSingle(),
      supabase
        .from("documents")
        .select("status, balance_due")
        .eq("document_type", "invoice")
        .eq("linked_service_id", serviceId),
    ]);

  if (serviceError) {
    throw new Error(`Linked service could not be loaded: ${serviceError.message}`);
  }

  if (documentsError) {
    throw new Error(`Linked invoice lookup failed: ${documentsError.message}`);
  }

  if (!service) {
    return;
  }

  const hasOpenInvoice = (documents ?? []).some((document) =>
    isOpenInvoiceDocument({
      document_type: "invoice",
      status: document.status,
      balance_due: document.balance_due,
    })
  );
  const hasSettledInvoice = (documents ?? []).some(
    (document) =>
      document.status === "paid" ||
      isSettledInvoiceDocument({
        document_type: "invoice",
        status: document.status,
        balance_due: document.balance_due,
      })
  );

  let paymentStatus = service.payment_status;

  if (hasOpenInvoice) {
    paymentStatus = "invoiced";
  } else if (hasSettledInvoice) {
    paymentStatus = "paid";
  } else if (service.payment_status === "invoiced") {
    paymentStatus = (service.cost ?? 0) > 0 ? "pending" : "paid";
  }

  if (paymentStatus === service.payment_status) {
    return;
  }

  const { error } = await supabase
    .from("services")
    .update({ payment_status: paymentStatus })
    .eq("id", serviceId);

  if (error) {
    throw new Error(`Linked service could not be synced: ${error.message}`);
  }
}

async function syncLinkedServicesForDocument(
  supabase: Awaited<ReturnType<typeof getVerifiedSupabaseClient>>,
  input: {
    documentId: string;
    extraServiceIds?: Array<string | null | undefined>;
  }
) {
  const { data: document, error } = await supabase
    .from("documents")
    .select("linked_service_id")
    .eq("id", input.documentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Linked invoice lookup failed: ${error.message}`);
  }

  const serviceIds = new Set<string>();

  for (const serviceId of [...(input.extraServiceIds ?? []), document?.linked_service_id]) {
    if (serviceId) {
      serviceIds.add(serviceId);
    }
  }

  for (const serviceId of serviceIds) {
    await syncServicePaymentStatusFromLinkedInvoices(supabase, serviceId);
  }
}

async function syncInvoiceDocumentsFromServicePaymentStatus(
  supabase: Awaited<ReturnType<typeof getVerifiedSupabaseClient>>,
  input: {
    serviceId: string;
    paymentStatus: Database["public"]["Tables"]["services"]["Row"]["payment_status"];
  }
) {
  if (input.paymentStatus !== "paid") {
    return;
  }

  const { data: documents, error } = await supabase
    .from("documents")
    .select("id, status")
    .eq("document_type", "invoice")
    .eq("linked_service_id", input.serviceId);

  if (error) {
    throw new Error(`Linked invoice lookup failed: ${error.message}`);
  }

  for (const document of documents ?? []) {
    if (!isOpenInvoiceDocumentStatus(document.status)) {
      continue;
    }

    const update: DocumentUpdate = {
      status: "paid",
      ...buildDocumentStatusTimestamps(document.status, "paid"),
    };

    const { error: updateError } = await supabase
      .from("documents")
      .update(update)
      .eq("id", document.id);

    if (updateError) {
      throw new Error(`Linked invoice could not be synced: ${updateError.message}`);
    }
  }
}

function revalidateAdminPaths(clientId?: string, documentId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/attention");

  if (clientId) {
    revalidatePath(`/admin/clients/${clientId}`);
    revalidatePath(`/admin/clients/${clientId}/service/new`);
    revalidatePath(`/admin/clients/${clientId}/documents/new`);
  }

  if (documentId) {
    revalidatePath(`/admin/documents/${documentId}`);
  }
}

export async function loginOwner(input: LoginInput): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const email = normalizeOwnerLoginIdentifier(asRequiredString(input.email, "Email or account"));
    const password = asRequiredString(input.password, "Password");
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Sign-in failed.",
    };
  }
}

export async function logoutOwner(): Promise<ActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Sign-out failed.",
    };
  }
}

export async function changeOwnerPassword(
  input: ChangePasswordInput
): Promise<ActionResult> {
  try {
    const supabase = await getVerifiedSupabaseClient();
    const currentPassword = asRequiredString(input.currentPassword, "Current password");
    const password = asRequiredString(input.password, "New password");
    const confirmPassword = asRequiredString(input.confirmPassword, "Confirm password");

    if (password.length < 8) {
      return { ok: false, error: "Password must be at least 8 characters." };
    }

    if (password !== confirmPassword) {
      return { ok: false, error: "Passwords do not match." };
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return { ok: false, error: userError.message };
    }

    if (!user?.email) {
      return { ok: false, error: "Admin account email is missing." };
    }

    const { url, publicKey } = getSupabaseBrowserCredentials();
    const verifyClient = createClient<Database>(url, publicKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
    const { error: verifyError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return { ok: false, error: "Current password is incorrect." };
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/admin/account");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Password could not be updated.",
    };
  }
}

export async function createClientRecord(
  input: CreateClientInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await getVerifiedSupabaseClient();
    const payload = buildClientInsert(input);
    const { data, error } = await supabase
      .from("clients")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Client could not be created." };
    }

    revalidateAdminPaths(data.id);
    return { ok: true, id: data.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Client could not be created.",
    };
  }
}

export async function createEquipmentRecord(input: CreateEquipmentInput): Promise<ActionResult> {
  try {
    const supabase = await getVerifiedSupabaseClient();
    const payload = buildEquipmentInsert(input);
    const { error } = await supabase.from("equipment").insert(payload);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidateAdminPaths(input.clientId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Equipment could not be added.",
    };
  }
}

export async function createNoteRecord(input: CreateNoteInput): Promise<ActionResult> {
  try {
    const supabase = await getVerifiedSupabaseClient();
    const payload = buildNoteInsert(input);
    const { error } = await supabase.from("notes").insert(payload);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidateAdminPaths(input.clientId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Note could not be added.",
    };
  }
}

export async function createServiceRecord(input: CreateServiceInput): Promise<ActionResult> {
  try {
    const supabase = await getVerifiedSupabaseClient();
    const payload = buildServiceInsert(input);
    const { error } = await supabase.from("services").insert(payload);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidateAdminPaths(input.clientId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Service record could not be added.",
    };
  }
}

export async function createDocumentRecord(
  input: CreateDocumentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await getVerifiedSupabaseClient();
    const documentType = asEnumValue(input.documentType, documentTypes, "document type");
    const documentNumber = await generateDocumentNumber(supabase, documentType);
    const payload = buildDocumentInsert({ ...input, documentType }, documentNumber);
    const { data, error } = await supabase
      .from("documents")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Document could not be created." };
    }

    try {
      const presetItems = sanitizeDocumentPresetLineItems(input.presetItems);

      if (presetItems.length > 0) {
        const itemPayloads = presetItems.map((item, index) =>
          buildDocumentItemInsert(
            {
              clientId: input.clientId,
              documentId: data.id,
              description: item.description,
              quantity: String(item.quantity),
              unitPrice: String(item.unit_price),
            },
            index
          )
        );
        const { error: itemsError } = await supabase.from("document_items").insert(itemPayloads);

        if (itemsError) {
          throw new Error(itemsError.message);
        }

        await syncDocumentTotals(supabase, data.id);
      }
    } catch (error) {
      await deleteDocumentOnFailure(supabase, data.id);
      throw error;
    }

    revalidateAdminPaths(input.clientId, data.id);
    return { ok: true, id: data.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Document could not be created.",
    };
  }
}

export async function saveDocumentAsPresetAction(
  input: SaveDocumentPresetInput
): Promise<ActionResult<{ documentType: string }>> {
  try {
    const supabase = await getVerifiedSupabaseClient();
    const [{ data: document, error: documentError }, { data: items, error: itemsError }] =
      await Promise.all([
        supabase
          .from("documents")
          .select(
            "id, client_id, document_type, title, summary, notes, terms, tax_rate, discount_amount, deposit_amount"
          )
          .eq("id", input.documentId)
          .eq("client_id", input.clientId)
          .single(),
        supabase
          .from("document_items")
          .select("description, quantity, unit_price")
          .eq("document_id", input.documentId)
          .order("sort_order", { ascending: true }),
      ]);

    if (documentError || !document) {
      return { ok: false, error: documentError?.message ?? "Document not found." };
    }

    if (itemsError) {
      return { ok: false, error: itemsError.message };
    }

    const payload: DocumentPresetInsert = {
      document_type: document.document_type,
      title: document.title,
      summary: document.summary,
      notes: document.notes,
      terms: document.terms,
      tax_rate: document.tax_rate,
      discount_amount: document.discount_amount,
      deposit_amount: document.deposit_amount,
      line_items: (items ?? []).map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    };

    const { error: presetError } = await supabase
      .from("document_presets")
      .upsert(payload, { onConflict: "document_type" });

    if (presetError) {
      return { ok: false, error: presetError.message };
    }

    revalidateAdminPaths(input.clientId, input.documentId);
    return { ok: true, documentType: document.document_type };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Template could not be saved.",
    };
  }
}

export async function createDocumentItemRecord(
  input: CreateDocumentItemInput
): Promise<ActionResult> {
  try {
    const supabase = await getVerifiedSupabaseClient();
    const { data: existingItems, error: countError } = await supabase
      .from("document_items")
      .select("sort_order")
      .eq("document_id", input.documentId)
      .order("sort_order", { ascending: false })
      .limit(1);

    if (countError) {
      return { ok: false, error: countError.message };
    }

    const sortOrder = (existingItems?.[0]?.sort_order ?? -1) + 1;
    const payload = buildDocumentItemInsert(input, sortOrder);
    const { error } = await supabase.from("document_items").insert(payload);

    if (error) {
      return { ok: false, error: error.message };
    }

    await syncDocumentTotals(supabase, input.documentId);
    await syncLinkedServicesForDocument(supabase, {
      documentId: input.documentId,
    });
    revalidateAdminPaths(input.clientId, input.documentId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Line item could not be created.",
    };
  }
}

export async function duplicateDocumentRecord(
  input: DuplicateDocumentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await getVerifiedSupabaseClient();
    const targetType = input.targetType
      ? asEnumValue(input.targetType, documentTypes, "document type")
      : "invoice";
    const [{ data: source, error: sourceError }, { data: items, error: itemsError }] =
      await Promise.all([
        supabase.from("documents").select("*").eq("id", input.documentId).single(),
        supabase
          .from("document_items")
          .select("*")
          .eq("document_id", input.documentId)
          .order("sort_order", { ascending: true }),
      ]);

    if (sourceError || !source) {
      return { ok: false, error: sourceError?.message ?? "Source document not found." };
    }

    if (itemsError) {
      return { ok: false, error: itemsError.message };
    }

    const issueDate = getAdminTodayDateString();
    const documentNumber = await generateDocumentNumber(supabase, targetType);
    const cloneInsert: DocumentInsert = {
      client_id: source.client_id,
      linked_service_id: source.linked_service_id,
      document_type: targetType,
      status: "draft",
      document_number: documentNumber,
      title: source.title,
      summary: source.summary,
      notes: source.notes,
      terms: source.terms,
      issue_date: issueDate,
      due_date: targetType === "invoice" ? getDefaultDueDate(targetType, issueDate) : null,
      expires_on: targetType === "quote" ? getDefaultDueDate(targetType, issueDate) : null,
      tax_rate: source.tax_rate,
      discount_amount: source.discount_amount,
      deposit_amount: source.deposit_amount,
      subtotal: 0,
      tax_amount: 0,
      total: 0,
      balance_due: 0,
      share_enabled: true,
    };

    const { data: created, error: createError } = await supabase
      .from("documents")
      .insert(cloneInsert)
      .select("id")
      .single();

    if (createError || !created) {
      return { ok: false, error: createError?.message ?? "Document could not be duplicated." };
    }

    try {
      const cloneItems = (items ?? []).map((item) => ({
        document_id: created.id,
        sort_order: item.sort_order,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: calculateLineTotal(item.quantity, item.unit_price),
      }));

      if (cloneItems.length > 0) {
        const { error: itemsInsertError } = await supabase.from("document_items").insert(cloneItems);
        if (itemsInsertError) {
          throw new Error(itemsInsertError.message);
        }
      }

      await syncDocumentTotals(supabase, created.id);
    } catch (error) {
      await deleteDocumentOnFailure(supabase, created.id);
      throw error;
    }

    revalidateAdminPaths(input.clientId, created.id);
    return { ok: true, id: created.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Document could not be duplicated.",
    };
  }
}

export async function sendDocumentSmsAction(
  input: SendDocumentSmsInput
): Promise<ActionResult<{ recipient: string }>> {
  try {
    const supabase = await getVerifiedSupabaseClient();
    const [{ data: document, error: documentError }, { data: client, error: clientError }] =
      await Promise.all([
        supabase
          .from("documents")
          .select("id, client_id, linked_service_id, document_type, document_number, public_token, share_enabled, status, sent_at, total")
          .eq("id", input.documentId)
          .eq("client_id", input.clientId)
          .single(),
        supabase.from("clients").select("id, name, phone").eq("id", input.clientId).single(),
      ]);

    if (documentError || !document) {
      return { ok: false, error: documentError?.message ?? "Document not found." };
    }

    if (clientError || !client) {
      return { ok: false, error: clientError?.message ?? "Client not found." };
    }

    if (!document.share_enabled) {
      return { ok: false, error: "Enable public share before sending this document." };
    }

    const recipient = normalizePhoneForSms(client.phone);

    if (!recipient) {
      return { ok: false, error: "Client phone must be a valid US mobile or E.164 number." };
    }

    const shareUrl = `${companyProfile.website}${getDocumentSharePath(document.public_token)}`;
    const smsBody = buildDocumentSmsBody({
      clientName: client.name,
      documentType: document.document_type,
      documentNumber: document.document_number,
      total: document.total,
      shareUrl,
    });
    const smsResult = await sendSms({ body: smsBody, to: recipient });

    if (!smsResult.sent) {
      if (smsResult.skipped === "unconfigured") {
        return { ok: false, error: "Twilio is not configured for outbound SMS yet." };
      }

      if (smsResult.skipped === "no-recipient") {
        return { ok: false, error: "Client phone is missing." };
      }

      return { ok: false, error: smsResult.error ?? "SMS could not be sent." };
    }

    const nextStatus = document.status === "draft" ? "sent" : document.status;
    const timestampUpdate = buildDocumentStatusTimestamps(document.status, nextStatus);
    const documentUpdate: DocumentUpdate = {};

    if (document.status === "draft") {
      documentUpdate.status = nextStatus;
    }

    if (!document.sent_at) {
      documentUpdate.sent_at = new Date().toISOString();
    }

    Object.assign(documentUpdate, timestampUpdate);

    if (Object.keys(documentUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from("documents")
        .update(documentUpdate)
        .eq("id", document.id);

      if (updateError) {
        return { ok: false, error: updateError.message };
      }
    }

    await syncLinkedServicesForDocument(supabase, {
      documentId: document.id,
      extraServiceIds: [document.linked_service_id],
    });

    revalidateAdminPaths(input.clientId, input.documentId);
    revalidatePath(getDocumentSharePath(document.public_token));
    revalidatePath(getDocumentImagePath(document.public_token));

    return { ok: true, recipient: client.phone };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "SMS could not be sent.",
    };
  }
}

export async function sendReviewRequestSmsAction(
  input: SendReviewRequestSmsInput
): Promise<ActionResult<{ recipient: string }>> {
  try {
    const supabase = await getVerifiedSupabaseClient();
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, name, phone")
      .eq("id", input.clientId)
      .single();

    if (clientError || !client) {
      return { ok: false, error: clientError?.message ?? "Client not found." };
    }

    const recipient = normalizePhoneForSms(client.phone);

    if (!recipient) {
      return { ok: false, error: "Client phone must be a valid US mobile or E.164 number." };
    }

    const smsBody = buildGoogleReviewRequestMessage({
      clientName: client.name,
      reviewUrl: getGoogleReviewUrl(),
    });
    const smsResult = await sendSms({ body: smsBody, to: recipient });

    if (!smsResult.sent) {
      if (smsResult.skipped === "unconfigured") {
        return { ok: false, error: "Twilio is not configured for outbound SMS yet." };
      }

      if (smsResult.skipped === "no-recipient") {
        return { ok: false, error: "Client phone is missing." };
      }

      return { ok: false, error: smsResult.error ?? "Review request SMS could not be sent." };
    }

    return { ok: true, recipient: client.phone };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Review request SMS could not be sent.",
    };
  }
}

export async function updateRecord(input: UpdateRecordInput): Promise<ActionResult> {
  try {
    const supabase = await getVerifiedSupabaseClient();

    if (!input.id) {
      throw new Error("Record id is required.");
    }

    if (!input.clientId) {
      throw new Error("Client id is required.");
    }

    switch (input.table) {
      case "clients": {
        const payload = buildClientUpdate(input.values);
        assertHasValues(payload);
        const { error } = await supabase.from("clients").update(payload).eq("id", input.id);
        if (error) return { ok: false, error: error.message };
        revalidateAdminPaths(input.id);
        return { ok: true };
      }
      case "equipment": {
        const payload = buildEquipmentUpdate(input.values);
        assertHasValues(payload);
        const { error } = await supabase.from("equipment").update(payload).eq("id", input.id);
        if (error) return { ok: false, error: error.message };
        revalidateAdminPaths(input.clientId);
        return { ok: true };
      }
      case "notes": {
        const payload = buildNoteUpdate(input.values);
        assertHasValues(payload);
        const { error } = await supabase.from("notes").update(payload).eq("id", input.id);
        if (error) return { ok: false, error: error.message };
        revalidateAdminPaths(input.clientId);
        return { ok: true };
      }
      case "documents": {
        const [{ data: current, error: currentError }, payload] = await Promise.all([
          supabase
            .from("documents")
            .select("status, document_type, linked_service_id")
            .eq("id", input.id)
            .single(),
          Promise.resolve(buildDocumentUpdate(input.values)),
        ]);
        assertHasValues(payload);
        if (currentError) return { ok: false, error: currentError.message };
        if (payload.status) {
          Object.assign(payload, buildDocumentStatusTimestamps(current.status, payload.status));
        }
        const { error } = await supabase.from("documents").update(payload).eq("id", input.id);
        if (error) return { ok: false, error: error.message };
        await syncDocumentTotals(supabase, input.id);
        await syncLinkedServicesForDocument(supabase, {
          documentId: input.id,
          extraServiceIds: [current.linked_service_id],
        });
        revalidateAdminPaths(input.clientId, input.id);
        return { ok: true };
      }
      case "document_items": {
        const { data: currentItem, error: currentItemError } = await supabase
          .from("document_items")
          .select("id, document_id, quantity, unit_price")
          .eq("id", input.id)
          .single();
        if (currentItemError) return { ok: false, error: currentItemError.message };
        const payload = buildDocumentItemUpdate({
          quantity: currentItem.quantity,
          unit_price: currentItem.unit_price,
          ...input.values,
        });
        assertHasValues(payload);
        const { error } = await supabase.from("document_items").update(payload).eq("id", input.id);
        if (error) return { ok: false, error: error.message };
        await syncDocumentTotals(supabase, currentItem.document_id);
        await syncLinkedServicesForDocument(supabase, {
          documentId: currentItem.document_id,
        });
        revalidateAdminPaths(input.clientId, currentItem.document_id);
        return { ok: true };
      }
      case "services": {
        const payload = buildServiceUpdate(input.values);
        assertHasValues(payload);
        const { error } = await supabase.from("services").update(payload).eq("id", input.id);
        if (error) return { ok: false, error: error.message };
        if (payload.payment_status) {
          await syncInvoiceDocumentsFromServicePaymentStatus(supabase, {
            serviceId: input.id,
            paymentStatus: payload.payment_status,
          });
          await syncServicePaymentStatusFromLinkedInvoices(supabase, input.id);
        }
        revalidateAdminPaths(input.clientId);
        return { ok: true };
      }
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Record could not be updated.",
    };
  }
}

export async function clearServiceFollowUp(
  input: ClearServiceFollowUpInput
): Promise<ActionResult> {
  try {
    const supabase = await getVerifiedSupabaseClient();
    const serviceId = asRequiredString(input.serviceId, "Service");
    const clientId = asRequiredString(input.clientId, "Client");

    const { error } = await supabase
      .from("services")
      .update({
        follow_up_date: null,
        follow_up_note: null,
      })
      .eq("id", serviceId)
      .eq("client_id", clientId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidateAdminPaths(clientId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Follow-up could not be cleared.",
    };
  }
}

export async function deleteRecord(input: DeleteRecordInput): Promise<ActionResult> {
  try {
    const supabase = await getVerifiedSupabaseClient();

    if (!input.id) {
      throw new Error("Record id is required.");
    }

    if (!input.clientId) {
      throw new Error("Client id is required.");
    }

    if (input.table === "document_items") {
      const { data: currentItem, error: currentItemError } = await supabase
        .from("document_items")
        .select("document_id")
        .eq("id", input.id)
        .single();

      if (currentItemError) {
        return { ok: false, error: currentItemError.message };
      }

      const { error } = await supabase.from("document_items").delete().eq("id", input.id);

      if (error) {
        return { ok: false, error: error.message };
      }

      await syncDocumentTotals(supabase, currentItem.document_id);
      await syncLinkedServicesForDocument(supabase, {
        documentId: currentItem.document_id,
      });
      revalidateAdminPaths(input.clientId, currentItem.document_id);
      return { ok: true };
    }

    if (input.table === "documents") {
      const { data: currentDocument, error: currentDocumentError } = await supabase
        .from("documents")
        .select("linked_service_id")
        .eq("id", input.id)
        .single();

      if (currentDocumentError) {
        return { ok: false, error: currentDocumentError.message };
      }

      const { error } = await supabase.from("documents").delete().eq("id", input.id);

      if (error) {
        return { ok: false, error: error.message };
      }

      if (currentDocument.linked_service_id) {
        await syncServicePaymentStatusFromLinkedInvoices(
          supabase,
          currentDocument.linked_service_id
        );
      }

      revalidateAdminPaths(input.clientId);
      return { ok: true };
    }

    const { error } = await supabase.from(input.table).delete().eq("id", input.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    if (input.table === "clients") {
      revalidatePath("/admin");
    } else {
      revalidateAdminPaths(input.clientId);
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Record could not be deleted.",
    };
  }
}
