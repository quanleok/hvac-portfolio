import type {
  ClientRow,
  DocumentItemRow,
  DocumentRow,
  EquipmentRow,
  NoteRow,
  ServiceRow,
} from "@/lib/supabase/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface AdminBackupData {
  exported_at: string;
  counts: {
    clients: number;
    documents: number;
    document_items: number;
    services: number;
    equipment: number;
    notes: number;
  };
  clients: ClientRow[];
  documents: DocumentRow[];
  document_items: DocumentItemRow[];
  services: ServiceRow[];
  equipment: EquipmentRow[];
  notes: NoteRow[];
}

export async function getAdminBackupData(): Promise<AdminBackupData> {
  const supabase = createSupabaseAdminClient();
  const [
    { data: clients, error: clientsError },
    { data: documents, error: documentsError },
    { data: documentItems, error: documentItemsError },
    { data: services, error: servicesError },
    { data: equipment, error: equipmentError },
    { data: notes, error: notesError },
  ] = await Promise.all([
    supabase.from("clients").select("*").order("created_at", { ascending: true }),
    supabase.from("documents").select("*").order("created_at", { ascending: true }),
    supabase
      .from("document_items")
      .select("*")
      .order("document_id", { ascending: true })
      .order("sort_order", { ascending: true }),
    supabase
      .from("services")
      .select("*")
      .order("service_date", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("equipment")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase.from("notes").select("*").order("created_at", { ascending: true }),
  ]);

  if (clientsError) {
    throw new Error(clientsError.message);
  }

  if (servicesError) {
    throw new Error(servicesError.message);
  }

  if (documentsError) {
    throw new Error(documentsError.message);
  }

  if (documentItemsError) {
    throw new Error(documentItemsError.message);
  }

  if (equipmentError) {
    throw new Error(equipmentError.message);
  }

  if (notesError) {
    throw new Error(notesError.message);
  }

  return {
    exported_at: new Date().toISOString(),
    counts: {
      clients: clients?.length ?? 0,
      documents: documents?.length ?? 0,
      document_items: documentItems?.length ?? 0,
      services: services?.length ?? 0,
      equipment: equipment?.length ?? 0,
      notes: notes?.length ?? 0,
    },
    clients: clients ?? [],
    documents: documents ?? [],
    document_items: documentItems ?? [],
    services: services ?? [],
    equipment: equipment ?? [],
    notes: notes ?? [],
  };
}
