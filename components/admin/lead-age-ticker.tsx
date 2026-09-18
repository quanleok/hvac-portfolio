"use client";

import { useEffect, useState } from "react";
import { formatLeadAge, isHotLead } from "@/lib/admin/lead-heat";

export function LeadAgeTicker({ createdAt, status }: { createdAt: string; status: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const hot = isHotLead({ created_at: createdAt, status }, now);
  return (
    <span
      className={
        hot
          ? "inline-flex items-center gap-1 rounded-sm border border-[#c53030] bg-[#3a0f14] px-2 py-0.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[#ff6166]"
          : "text-xs text-[#6c8096]"
      }
    >
      {hot ? <span aria-hidden="true">🔥</span> : null}
      {formatLeadAge(createdAt, now)}
    </span>
  );
}
