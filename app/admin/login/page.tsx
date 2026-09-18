import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getAdminSession, getSafeNextPath } from "@/lib/admin/auth";
import { hasSupabasePublicCredentials } from "@/lib/supabase/config";

interface LoginPageProps {
  searchParams: Promise<{
    next?: string;
  }>;
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  if (!hasSupabasePublicCredentials()) {
    return (
      <main className="admin-auth-shell">
        <div className="admin-auth-panel">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9aafc5]">
            Admin setup
          </p>
          <h1 className="display-heading mt-4 text-3xl font-extrabold text-white">Supabase env vars still need to be added.</h1>
          <p className="mt-4 text-base leading-6 text-[#9aafc5]">
            Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            to <code>.env.local</code>, then refresh this page.
          </p>
          <Link href="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-[#1a2c44] px-4 py-2 text-sm font-bold text-white hover:bg-[#243654] border border-[#25344a]">
            Back to website
          </Link>
        </div>
      </main>
    );
  }

  const session = await getAdminSession();

  if (session) {
    redirect("/admin");
  }

  return (
    <main className="admin-auth-shell">
      <div className="admin-auth-panel">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9aafc5]">
          Double Le HVAC
        </p>
        <h1 className="display-heading mt-4 text-3xl font-extrabold text-white">Admin login</h1>

        <div className="mt-6">
          <LoginForm nextPath={getSafeNextPath(params.next)} />
        </div>
      </div>
    </main>
  );
}
