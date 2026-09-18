"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getActivePromo, ROTATION_MS } from "@/lib/promo/rotation";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function getCountdownParts(ms: number) {
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export function ReplacementPromoBanner() {
  const [now, setNow] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional hydration guard
    setMounted(true);
    // Bumped to 1s so countdown and progress bar are smooth
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  if (dismissed) return null;

  const active = getActivePromo(now);
  const remaining = active.expiresAt - now;
  // Before hydration, render zeros so SSR and client HTML match exactly.
  const { days, hours, minutes, seconds } = mounted
    ? getCountdownParts(remaining)
    : { days: 0, hours: 0, minutes: 0, seconds: 0 };

  // Progress bar: fraction of the 14-day window that has elapsed (0 → 1)
  const elapsed = ROTATION_MS - remaining;
  const progressPct = mounted
    ? Math.min(100, Math.max(0, (elapsed / ROTATION_MS) * 100))
    : 0;

  return (
    <div
      className="promo-replacement promo-slide-in"
      style={{ boxShadow: "0 4px 20px rgba(197,48,48,0.25)" }}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-2 sm:px-6 lg:px-8">
        {/* Left: eyebrow + hero + chips */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Image
            src="/media/generated/ac-unit-1.webp"
            alt=""
            width={80}
            height={80}
            aria-hidden="true"
            className="hidden h-10 w-10 flex-shrink-0 rounded-sm object-cover sm:block"
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}
          />
          {/* Eyebrow pill with pulsing dot */}
          <span className="promo-replacement-eyebrow">
            <span className="promo-pulse-dot" aria-hidden="true" />
            Replacement sale
          </span>

          {/* Hero price */}
          <div className="flex items-baseline gap-1.5">
            <span className="promo-replacement-hero">From $4,999</span>
            <span className="promo-replacement-sub">new system</span>
          </div>

          {/* Code chip */}
          <span className="promo-code-chip">
            <span className="promo-code-chip__label">Code</span>
            <span className="promo-code-chip__value">{active.code}</span>
          </span>

          {/* Spots chip */}
          <span className="promo-spots-chip">
            {active.spotsLeft} spot{active.spotsLeft === 1 ? "" : "s"} left
          </span>
        </div>

        {/* Right: countdown + CTA + dismiss */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {/* Tile countdown DD:HH:MM:SS */}
          <div
            className="promo-tile-clock promo-tile-clock--red"
            aria-label="Time remaining on offer"
          >
            <span className="promo-tile-digit">{pad(days)}</span>
            <span className="promo-tile-sep">:</span>
            <span className="promo-tile-digit">{pad(hours)}</span>
            <span className="promo-tile-sep">:</span>
            <span className="promo-tile-digit">{pad(minutes)}</span>
            <span className="promo-tile-sep">:</span>
            <span className="promo-tile-digit">{pad(seconds)}</span>
          </div>

          {/* CTA with shimmer */}
          <Link
            href="/contact"
            style={{ color: "#c53030" }}
            className="promo-cta-shimmer promo-cta-shimmer--red"
          >
            Claim $500 off →
          </Link>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="promo-dismiss promo-dismiss--red"
            aria-label="Dismiss promotion"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar: fills as the 14-day window elapses */}
      <div
        className="promo-progress-bar"
        style={{ width: `${progressPct}%` }}
        role="presentation"
      />
    </div>
  );
}
