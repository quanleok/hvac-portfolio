"use client";

import { useEffect, useState } from "react";
import { getActivePromo } from "@/lib/promo/rotation";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function splitRemaining(ms: number) {
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export function HeroPromoCode() {
  const [now, setNow] = useState(() => Date.now());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional hydration guard
    setMounted(true);
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const p = getActivePromo(now);
  const remaining = p.expiresAt - now;
  // Before hydration render zeros so SSR and client HTML match exactly.
  const { days, hours, minutes, seconds } = mounted
    ? splitRemaining(remaining)
    : { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return (
    <div className="space-y-3 rounded-md border border-[#f07a33] bg-[#2a0f04] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-[#f07a33]">
          Active code
        </span>
        <code className="rounded-sm bg-white px-2 py-1 font-mono text-base font-extrabold text-[#c53030]">
          {p.code}
        </code>
        <span className="rounded-sm bg-[#c53030] px-2 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-white">
          {p.spotsLeft} spot{p.spotsLeft === 1 ? "" : "s"} left
        </span>
      </div>

      <div>
        <p className="mb-1.5 text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-[#f07a33]">
          Expires in
        </p>
        <div className="flex items-center gap-1.5 text-white">
          <div className="flex flex-col items-center rounded-sm bg-[#1a0a06] px-2 py-1 tabular-nums sm:px-3 sm:py-1.5">
            <span className="text-xl font-extrabold leading-none sm:text-2xl">{pad(days)}</span>
            <span className="mt-0.5 text-[0.55rem] font-bold uppercase tracking-[0.15em] text-[#f07a33]">Days</span>
          </div>
          <span className="text-xl font-extrabold text-[#f07a33] sm:text-2xl">:</span>
          <div className="flex flex-col items-center rounded-sm bg-[#1a0a06] px-2 py-1 tabular-nums sm:px-3 sm:py-1.5">
            <span className="text-xl font-extrabold leading-none sm:text-2xl">{pad(hours)}</span>
            <span className="mt-0.5 text-[0.55rem] font-bold uppercase tracking-[0.15em] text-[#f07a33]">Hrs</span>
          </div>
          <span className="text-xl font-extrabold text-[#f07a33] sm:text-2xl">:</span>
          <div className="flex flex-col items-center rounded-sm bg-[#1a0a06] px-2 py-1 tabular-nums sm:px-3 sm:py-1.5">
            <span className="text-xl font-extrabold leading-none sm:text-2xl">{pad(minutes)}</span>
            <span className="mt-0.5 text-[0.55rem] font-bold uppercase tracking-[0.15em] text-[#f07a33]">Min</span>
          </div>
          <span className="text-xl font-extrabold text-[#f07a33] sm:text-2xl">:</span>
          <div className="flex flex-col items-center rounded-sm bg-[#1a0a06] px-2 py-1 tabular-nums sm:px-3 sm:py-1.5">
            <span className="text-xl font-extrabold leading-none sm:text-2xl">{pad(seconds)}</span>
            <span className="mt-0.5 text-[0.55rem] font-bold uppercase tracking-[0.15em] text-[#f07a33]">Sec</span>
          </div>
        </div>
      </div>
    </div>
  );
}
