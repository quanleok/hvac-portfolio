import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseBrowserCredentials } from "@/lib/supabase/config";

const ADMIN_HOME_PATH = "/admin";
const LOGIN_PATH = "/admin/login";

function buildLoginRedirect(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  redirectUrl.pathname = LOGIN_PATH;
  redirectUrl.search = "";

  if (nextPath !== LOGIN_PATH) {
    redirectUrl.searchParams.set("next", nextPath);
  }

  return redirectUrl;
}

export async function updateSession(request: NextRequest) {
  let credentials;

  try {
    credentials = getSupabaseBrowserCredentials();
  } catch {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(credentials.url, credentials.publicKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims?.sub);
  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === LOGIN_PATH;
  const isProtectedAdminRoute = pathname.startsWith("/admin") && !isLoginPage;

  if (!isLoggedIn && isProtectedAdminRoute) {
    return NextResponse.redirect(buildLoginRedirect(request));
  }

  if (isLoggedIn && isLoginPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = ADMIN_HOME_PATH;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
