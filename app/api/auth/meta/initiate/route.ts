import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildMetaAuthorizeUrl, generateState, isMetaConfigured } from "@/lib/marketing/oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isMetaConfigured()) {
    return NextResponse.json(
      { error: "Meta OAuth not configured. Set META_APP_ID and META_APP_SECRET." },
      { status: 503 }
    );
  }

  const state = generateState();
  const url = buildMetaAuthorizeUrl(state);

  const response = NextResponse.redirect(url);
  response.cookies.set("oauth_state_meta", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/api/auth/meta",
  });
  return response;
}
