import type {
  ClientRow,
  DocumentItemRow,
  DocumentRow,
  EquipmentRow,
  NoteRow,
  ServiceRow,
} from "@/lib/supabase/database.types";
import type { DocumentType } from "@/lib/admin/schema";
import { getAdminTodayDateString } from "@/lib/admin/date";
import {
  sanitizeDocumentPresetLineItems,
  type DocumentPresetMap,
} from "@/lib/admin/document-presets";
import {
  isLegacyOpenPaymentStatus,
  isOpenInvoiceDocument,
  shouldSuppressLegacyServicePayment,
} from "@/lib/admin/invoice-status";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HOT_LEAD_WINDOW_MS } from "@/lib/admin/lead-heat";

export type DashboardView = "all" | "active" | "leads" | "open-payments" | "inactive";

export async function getHotLeadCount(): Promise<number> {
  try {
    const supabase = await createSupabaseServerClient();
    const cutoff = new Date(Date.now() - HOT_LEAD_WINDOW_MS).toISOString();
    const { count, error } = await supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("status", "lead")
      .gte("created_at", cutoff);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export interface ClientListItem extends ClientRow {
  latest_service_date: string | null;
  latest_service_type: ServiceRow["service_type"] | null;
  equipment_count: number;
  note_count: number;
  service_count: number;
}

export type OpenPaymentItem =
  | {
      kind: "service";
      client: ClientRow;
      service: ServiceRow;
      document: null;
    }
  | {
      kind: "document";
      client: ClientRow;
      service: ServiceRow | null;
      document: DocumentRow;
    };

export interface ClientDocumentSummary extends DocumentRow {
  item_count: number;
}

export interface FollowUpItem {
  client: ClientRow;
  service: ServiceRow;
}

export interface DashboardData {
  clients: ClientListItem[];
  matchedClientCount: number;
  leads: ClientListItem[];
  openPayments: OpenPaymentItem[];
  followUps: FollowUpItem[];
  matchedStatusCounts: {
    active: number;
    lead: number;
    inactive: number;
  };
  stats: {
    totalClients: number;
    leadCount: number;
    activeCount: number;
    dueFollowUps: number;
    pendingPayments: number;
  };
}

export interface ClientDetailData {
  client: ClientRow;
  documents: ClientDocumentSummary[];
  equipment: EquipmentRow[];
  notes: NoteRow[];
  services: ServiceRow[];
}

export interface DocumentDetailData {
  client: ClientRow;
  document: DocumentRow;
  items: DocumentItemRow[];
  services: ServiceRow[];
}

export interface PublicDocumentData {
  client: ClientRow;
  document: DocumentRow;
  items: DocumentItemRow[];
}

function buildDocumentPresetMap(
  presets: Array<{
    id: string;
    document_type: DocumentType;
    title: string | null;
    summary: string | null;
    notes: string | null;
    terms: string | null;
    tax_rate: number;
    discount_amount: number;
    deposit_amount: number;
    line_items: unknown;
    created_at: string;
    updated_at: string;
  }>
): DocumentPresetMap {
  return presets.reduce<DocumentPresetMap>((map, preset) => {
    map[preset.document_type] = {
      ...preset,
      line_items: sanitizeDocumentPresetLineItems(preset.line_items),
    };
    return map;
  }, {});
}

function sortByMostRecentService(a: ClientListItem, b: ClientListItem) {
  const aDate = a.latest_service_date ?? a.updated_at ?? a.created_at;
  const bDate = b.latest_service_date ?? b.updated_at ?? b.created_at;
  return new Date(bDate).getTime() - new Date(aDate).getTime();
}

function normalizeSearchTerm(value: string) {
  return value.replace(/[,%()]/g, " ").trim();
}

function sortByMostRecentPayment(a: OpenPaymentItem, b: OpenPaymentItem) {
  const aDate =
    a.kind === "document"
      ? a.document.due_date ??
        a.document.sent_at ??
        a.document.updated_at ??
        a.document.created_at ??
        a.document.issue_date
      : a.service.updated_at ?? a.service.created_at ?? a.service.service_date;
  const bDate =
    b.kind === "document"
      ? b.document.due_date ??
        b.document.sent_at ??
        b.document.updated_at ??
        b.document.created_at ??
        b.document.issue_date
      : b.service.updated_at ?? b.service.created_at ?? b.service.service_date;
  return new Date(bDate).getTime() - new Date(aDate).getTime();
}

function sortBySoonestFollowUp(a: FollowUpItem, b: FollowUpItem) {
  const aDate = a.service.follow_up_date ?? a.service.service_date;
  const bDate = b.service.follow_up_date ?? b.service.service_date;
  return new Date(aDate).getTime() - new Date(bDate).getTime();
}

function isFollowUpDue(followUpDate: string | null | undefined, today: string) {
  return followUpDate ? followUpDate <= today : false;
}

function getDocumentManagedServiceIds(
  documents: Array<
    Pick<DocumentRow, "linked_service_id" | "document_type" | "status" | "balance_due">
  >
) {
  const serviceIds = new Set<string>();

  for (const document of documents) {
    if (
      document.linked_service_id &&
      shouldSuppressLegacyServicePayment({
        document_type: document.document_type,
        status: document.status,
        balance_due: document.balance_due,
      })
    ) {
      serviceIds.add(document.linked_service_id);
    }
  }

  return serviceIds;
}

function buildOpenPayments(
  clients: ClientRow[],
  services: ServiceRow[],
  documents: DocumentRow[]
) {
  const clientById = new Map(clients.map((client) => [client.id, client]));
  const serviceById = new Map(services.map((service) => [service.id, service]));
  const documentManagedServiceIds = getDocumentManagedServiceIds(documents);

  const documentItems = documents
    .filter((document) =>
      isOpenInvoiceDocument({
        document_type: document.document_type,
        status: document.status,
        balance_due: document.balance_due,
      })
    )
    .map((document) => {
      const client = clientById.get(document.client_id);

      if (!client) {
        return null;
      }

      return {
        kind: "document",
        client,
        document,
        service: document.linked_service_id
          ? serviceById.get(document.linked_service_id) ?? null
          : null,
      } satisfies OpenPaymentItem;
    })
    .filter((item): item is Extract<OpenPaymentItem, { kind: "document" }> => Boolean(item));

  const legacyServiceItems = services
    .filter(
      (service) =>
        isLegacyOpenPaymentStatus(service.payment_status) &&
        !documentManagedServiceIds.has(service.id)
    )
    .map((service) => {
      const client = clientById.get(service.client_id);

      if (!client) {
        return null;
      }

      return {
        kind: "service",
        client,
        service,
        document: null,
      } satisfies OpenPaymentItem;
    })
    .filter((item): item is Extract<OpenPaymentItem, { kind: "service" }> => Boolean(item));

  return [...documentItems, ...legacyServiceItems].sort(sortByMostRecentPayment);
}

function buildClientList(
  clients: ClientRow[],
  services: ServiceRow[],
  equipment: EquipmentRow[],
  notes: NoteRow[]
) {
  const latestServiceByClient = new Map<
    string,
    { latestServiceDate: string; latestServiceType: ServiceRow["service_type"] }
  >();
  const serviceCountByClient = new Map<string, number>();
  const equipmentCountByClient = new Map<string, number>();
  const noteCountByClient = new Map<string, number>();

  for (const service of services) {
    serviceCountByClient.set(
      service.client_id,
      (serviceCountByClient.get(service.client_id) ?? 0) + 1
    );

    const previous = latestServiceByClient.get(service.client_id);

    if (!previous || new Date(service.service_date) > new Date(previous.latestServiceDate)) {
      latestServiceByClient.set(service.client_id, {
        latestServiceDate: service.service_date,
        latestServiceType: service.service_type,
      });
    }
  }

  for (const unit of equipment) {
    equipmentCountByClient.set(unit.client_id, (equipmentCountByClient.get(unit.client_id) ?? 0) + 1);
  }

  for (const note of notes) {
    noteCountByClient.set(note.client_id, (noteCountByClient.get(note.client_id) ?? 0) + 1);
  }

  return clients
    .map((client) => {
      const latestService = latestServiceByClient.get(client.id);

      return {
        ...client,
        latest_service_date: latestService?.latestServiceDate ?? null,
        latest_service_type: latestService?.latestServiceType ?? null,
        equipment_count: equipmentCountByClient.get(client.id) ?? 0,
        note_count: noteCountByClient.get(client.id) ?? 0,
        service_count: serviceCountByClient.get(client.id) ?? 0,
      } satisfies ClientListItem;
    })
    .sort(sortByMostRecentService);
}

export async function getDashboardData(searchTerm?: string, view: DashboardView = "all"): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();
  const trimmedSearch = searchTerm?.trim() ?? "";

  let clientQuery = supabase.from("clients").select("*");

  if (trimmedSearch) {
    const safeSearch = normalizeSearchTerm(trimmedSearch);
    clientQuery = clientQuery.or(
      [
        `name.ilike.%${safeSearch}%`,
        `phone.ilike.%${safeSearch}%`,
        `address.ilike.%${safeSearch}%`,
        `city.ilike.%${safeSearch}%`,
        `email.ilike.%${safeSearch}%`,
      ].join(",")
    );
  }

  const [
    { data: clients, error: clientError },
    { data: allClients, error: allClientError },
    { data: allServices, error: allServiceError },
    { data: allDocuments, error: allDocumentsError },
  ] =
    await Promise.all([
      clientQuery.order("updated_at", { ascending: false }),
      supabase.from("clients").select("id, status"),
      supabase.from("services").select("id, client_id, follow_up_date, payment_status"),
      supabase
        .from("documents")
        .select("id, client_id, linked_service_id, document_type, status, balance_due")
        .eq("document_type", "invoice"),
    ]);

  if (clientError) {
    throw new Error(clientError.message);
  }

  if (allClientError) {
    throw new Error(allClientError.message);
  }

  if (allServiceError) {
    throw new Error(allServiceError.message);
  }

  if (allDocumentsError) {
    throw new Error(allDocumentsError.message);
  }

  const clientIds = (clients ?? []).map((client) => client.id);
  let services: ServiceRow[] = [];
  let equipment: EquipmentRow[] = [];
  let notes: NoteRow[] = [];
  let documents: DocumentRow[] = [];

  if (clientIds.length > 0) {
    const [
      { data: servicesData, error: servicesError },
      { data: equipmentData, error: equipmentError },
      { data: notesData, error: notesError },
      { data: documentsData, error: documentsError },
    ] = await Promise.all([
      supabase
        .from("services")
        .select("*")
        .in("client_id", clientIds)
        .order("service_date", { ascending: false }),
      supabase
        .from("equipment")
        .select("*")
        .in("client_id", clientIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("notes")
        .select("*")
        .in("client_id", clientIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("documents")
        .select("*")
        .eq("document_type", "invoice")
        .in("client_id", clientIds)
        .order("created_at", { ascending: false }),
    ]);

    if (servicesError) {
      throw new Error(servicesError.message);
    }

    if (equipmentError) {
      throw new Error(equipmentError.message);
    }

    if (notesError) {
      throw new Error(notesError.message);
    }

    if (documentsError) {
      throw new Error(documentsError.message);
    }

    services = servicesData ?? [];
    equipment = equipmentData ?? [];
    notes = notesData ?? [];
    documents = documentsData ?? [];
  }

  const clientList = buildClientList(clients ?? [], services, equipment, notes);
  const clientById = new Map((clients ?? []).map((client) => [client.id, client]));
  const today = getAdminTodayDateString();
  const openPayments = buildOpenPayments(clients ?? [], services, documents);
  const clientsWithOpenPayments = new Set(openPayments.map((item) => item.client.id));
  const followUps = services
    .filter((service) => isFollowUpDue(service.follow_up_date, today))
    .map((service) => {
      const client = clientById.get(service.client_id);

      if (!client) {
        return null;
      }

      return {
        client,
        service,
      } satisfies FollowUpItem;
    })
    .filter((item): item is FollowUpItem => Boolean(item))
    .sort(sortBySoonestFollowUp);
  const leadClientIds = new Set(clientList.filter((client) => client.status === "lead").map((client) => client.id));
  const allDocumentManagedServiceIds = getDocumentManagedServiceIds(
    (allDocuments ?? []) as Array<
      Pick<DocumentRow, "linked_service_id" | "document_type" | "status" | "balance_due">
    >
  );
  const openDocumentCount =
    (allDocuments ?? []).filter((document) =>
      isOpenInvoiceDocument({
        document_type: document.document_type,
        status: document.status,
        balance_due: document.balance_due,
      })
    ).length;
  const legacyOpenServiceCount =
    (allServices ?? []).filter(
      (service) =>
        isLegacyOpenPaymentStatus(service.payment_status) &&
        !allDocumentManagedServiceIds.has(service.id)
    ).length;
  const visibleClients =
    view === "active"
      ? clientList.filter((client) => client.status === "active")
      : view === "inactive"
        ? clientList.filter((client) => client.status === "inactive")
      : view === "open-payments"
        ? clientList.filter((client) => clientsWithOpenPayments.has(client.id))
      : view === "leads"
        ? clientList.filter((client) => leadClientIds.has(client.id))
        : clientList;

  return {
    clients: visibleClients,
    matchedClientCount: clientList.length,
    leads: clientList.filter((client) => client.status === "lead"),
    openPayments,
    followUps,
    matchedStatusCounts: {
      active: clientList.filter((client) => client.status === "active").length,
      lead: clientList.filter((client) => client.status === "lead").length,
      inactive: clientList.filter((client) => client.status === "inactive").length,
    },
    stats: {
      totalClients: allClients?.length ?? 0,
      leadCount: allClients?.filter((client) => client.status === "lead").length ?? 0,
      activeCount: allClients?.filter((client) => client.status === "active").length ?? 0,
      dueFollowUps:
        allServices?.filter((service) => isFollowUpDue(service.follow_up_date, today)).length ?? 0,
      pendingPayments: openDocumentCount + legacyOpenServiceCount,
    },
  };
}

export async function getClientDetail(clientId: string): Promise<ClientDetailData | null> {
  const supabase = await createSupabaseServerClient();

  const [
    { data: client, error: clientError },
    { data: documents, error: documentsError },
    { data: equipment, error: equipmentError },
    { data: notes, error: notesError },
    { data: services, error: servicesError },
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("id", clientId).maybeSingle(),
    supabase.from("documents").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
    supabase.from("equipment").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
    supabase.from("notes").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
    supabase.from("services").select("*").eq("client_id", clientId).order("service_date", { ascending: false }),
  ]);

  if (clientError) {
    throw new Error(clientError.message);
  }

  if (!client) {
    return null;
  }

  if (equipmentError) {
    throw new Error(equipmentError.message);
  }

  if (documentsError) {
    throw new Error(documentsError.message);
  }

  if (notesError) {
    throw new Error(notesError.message);
  }

  if (servicesError) {
    throw new Error(servicesError.message);
  }

  const documentIds = (documents ?? []).map((document) => document.id);
  const { data: documentItems, error: documentItemsError } =
    documentIds.length > 0
      ? await supabase.from("document_items").select("id, document_id").in("document_id", documentIds)
      : { data: [], error: null };

  if (documentItemsError) {
    throw new Error(documentItemsError.message);
  }

  const itemCounts = new Map<string, number>();

  for (const item of documentItems ?? []) {
    itemCounts.set(item.document_id, (itemCounts.get(item.document_id) ?? 0) + 1);
  }

  return {
    client,
    documents: (documents ?? []).map((document) => ({
      ...document,
      item_count: itemCounts.get(document.id) ?? 0,
    })),
    equipment: equipment ?? [],
    notes: notes ?? [],
    services: services ?? [],
  };
}

export async function getDocumentDetail(documentId: string): Promise<DocumentDetailData | null> {
  const supabase = await createSupabaseServerClient();
  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle();

  if (documentError) {
    throw new Error(documentError.message);
  }

  if (!document) {
    return null;
  }

  const [
    { data: client, error: clientError },
    { data: items, error: itemsError },
    { data: services, error: servicesError },
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("id", document.client_id).single(),
    supabase
      .from("document_items")
      .select("*")
      .eq("document_id", documentId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("services")
      .select("*")
      .eq("client_id", document.client_id)
      .order("service_date", { ascending: false }),
  ]);

  if (clientError) {
    throw new Error(clientError.message);
  }

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  if (servicesError) {
    throw new Error(servicesError.message);
  }

  return {
    client,
    document,
    items: items ?? [],
    services: services ?? [],
  };
}

export async function getDocumentPresets(): Promise<DocumentPresetMap> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("document_presets")
    .select("*")
    .order("document_type", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return buildDocumentPresetMap((data ?? []) as Array<{
    id: string;
    document_type: DocumentType;
    title: string | null;
    summary: string | null;
    notes: string | null;
    terms: string | null;
    tax_rate: number;
    discount_amount: number;
    deposit_amount: number;
    line_items: unknown;
    created_at: string;
    updated_at: string;
  }>);
}

export async function getPublicDocument(
  token: string,
  options?: { markViewed?: boolean }
): Promise<PublicDocumentData | null> {
  const supabase = createSupabaseAdminClient();
  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("*")
    .eq("public_token", token)
    .eq("share_enabled", true)
    .maybeSingle();

  if (documentError) {
    throw new Error(documentError.message);
  }

  if (!document) {
    return null;
  }

  if (options?.markViewed !== false && !document.viewed_at) {
    await supabase
      .from("documents")
      .update({ viewed_at: new Date().toISOString() })
      .eq("id", document.id)
      .is("viewed_at", null);
    document.viewed_at = new Date().toISOString();
  }

  const [
    { data: client, error: clientError },
    { data: items, error: itemsError },
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("id", document.client_id).single(),
    supabase
      .from("document_items")
      .select("*")
      .eq("document_id", document.id)
      .order("sort_order", { ascending: true }),
  ]);

  if (clientError) {
    throw new Error(clientError.message);
  }

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return {
    client,
    document,
    items: items ?? [],
  };
}
