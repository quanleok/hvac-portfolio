import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  getSupabaseBrowserCredentials,
  getSupabaseServiceRoleKey,
} from "@/lib/supabase/config";

export function createSupabaseAdminClient() {
  const { url } = getSupabaseBrowserCredentials();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
