import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publicKey) {
    throw new Error("Missing Supabase browser credentials.");
  }

  return createClient<Database>(url, publicKey);
}
