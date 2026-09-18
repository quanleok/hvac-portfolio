"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface HotLeadResponse {
  count?: number;
}

export function HotLeadBeacon() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCount() {
      try {
        const response = await fetch("/admin/api/hot-leads", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok) {
          if (!cancelled) setCount(0);
          return;
        }
        const data = (await response.json()) as HotLeadResponse;
        if (!cancelled) {
          setCount(typeof data.count === "number" ? data.count : 0);
        }
      } catch {
        if (!cancelled) setCount(0);
      }
    }

    void loadCount();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (count === null) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#25344a] bg-[#101d2d] text-xs font-black text-[#9aafc5]"
      >
        ...
      </span>
    );
  }

  if (count <= 0) return null;

  return (
    <Link
      href="/admin#hot-leads"
      aria-label={`${count} hot ${count === 1 ? "lead" : "leads"} — jump to list`}
      prefetch
      className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full border border-[#7c2329] bg-[#4a171c] px-3 text-sm font-black leading-none text-[#ffd7da] transition hover:bg-[#5a1c22]"
    >
      {count}
    </Link>
  );
}
