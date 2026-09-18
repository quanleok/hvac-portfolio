export function getSupabaseBrowserCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !publicKey) {
    throw new Error(
      "Missing Supabase public credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)."
    );
  }

  return { url, publicKey };
}

export function getSupabaseServiceRoleKey() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return serviceRoleKey;
}

export function hasSupabasePublicCredentials() {
  try {
    getSupabaseBrowserCredentials();
    return true;
  } catch {
    return false;
  }
}

export function hasSupabaseServiceRoleKey() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}
