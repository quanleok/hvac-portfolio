import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildGoogleAuthorizeUrl,
  generateState,
  isGoogleConfigured,
} from "@/lib/marketing/oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGoogleConfigured()) {
    return NextResponse.json(
      { error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." },
      { status: 503 }
    );
  }

  const state = generateState();
  const url = buildGoogleAuthorizeUrl(state);

  const response = NextResponse.redirect(url);
  response.cookies.set("oauth_state_google", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/api/auth/google",
  });
  return response;
}
