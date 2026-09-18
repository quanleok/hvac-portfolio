"use client";

import { usePathname } from "next/navigation";

function showOnPath(pathname: string): boolean {
  // Export CSV is client-focused, so only show on client-related routes.
  if (pathname === "/admin") return true;
  if (pathname.startsWith("/admin/clients")) return true;
  if (pathname.startsWith("/admin/documents")) return true;
  if (pathname === "/admin/attention") return true;
  return false;
}

export function ContextualExport() {
  const pathname = usePathname();
  if (!showOnPath(pathname)) return null;

  return (
    <a
      href="/admin/export/clients.csv"
      aria-label="Export clients CSV"
      className="flex h-10 items-center justify-center rounded-md bg-[#1a2c44] px-3 text-sm font-bold text-white hover:bg-[#243654] border border-[#25344a]"
      title="Download clients as CSV"
    >
      <span className="hidden sm:inline">Export clients</span>
      <span className="sm:hidden" aria-hidden="true">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </span>
    </a>
  );
}
