import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { ContextualExport } from "@/components/admin/contextual-export";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { HotLeadBeacon } from "@/components/admin/hot-lead-beacon";
import { requireAdminSession } from "@/lib/admin/auth";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminSession();
  const headerActions = (
    <>
      <ContextualExport />
      <Link
        href="/admin/account"
        aria-label="Settings"
        className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1a2c44] text-white hover:bg-[#243654] border border-[#25344a]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </Link>
      <SignOutButton />
    </>
  );

  return (
    <div className="min-h-screen bg-[#07101c] text-white">
      <header className="border-b border-[#25344a] bg-[#07101c] backdrop-blur-xl">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-5 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <HotLeadBeacon />
              <Link href="/admin" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1f6feb] text-sm font-extrabold text-white">
                  DL
                </div>
                <div>
                  <p className="display-heading text-xl leading-none text-white">Double Le</p>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8096]">
                    Admin
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end lg:hidden">{headerActions}</div>
          </div>

          <div className="lg:justify-self-end">
            <div className="hidden flex-wrap gap-2 lg:flex">{headerActions}</div>
          </div>

          <div className="lg:col-span-2 overflow-visible">
            <AdminNav />
          </div>
        </div>
      </header>

      <main id="top" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
