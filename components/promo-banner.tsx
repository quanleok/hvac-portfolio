"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getActivePromo } from "@/lib/promo/rotation";

function getTimeLeft() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { hours, minutes, seconds };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function PromoBanner() {
  const [time, setTime] = useState(getTimeLeft);
  const [today, setToday] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [secPulse, setSecPulse] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    // Runs once on mount — sets the date string that can only be resolved client-side
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional hydration guard
    setMounted(true);
    setNow(Date.now());
    const timer = setTimeout(() => setToday(formatDate()), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      setTime(getTimeLeft());
      setSecPulse((p) => !p);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (dismissed) return null;

  const activePromo = getActivePromo(mounted ? now : 0);

  return (
    <div className="promo-banner promo-slide-in">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">
          <Image
            src="/media/generated/tool-wrench.png"
            alt=""
            width={56}
            height={56}
            aria-hidden="true"
            className="hidden h-8 w-8 flex-shrink-0 sm:block"
            style={{ transform: "rotate(-14deg)", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }}
          />
          <span className="promo-eyebrow">Today&apos;s offers</span>
          <div className="flex items-baseline gap-1.5">
            <span className="promo-hero-price">$49</span>
            <span className="promo-hero-label">diagnostic</span>
          </div>
          <span className="promo-micro hidden sm:inline">or install savings from $4,999</span>
          <span className="hidden md:inline-flex">
            <span className="promo-code-chip">
              <span className="promo-code-chip__label">Code</span>
              <span className="promo-code-chip__value">{activePromo.code}</span>
            </span>
          </span>
          {today && (
            <span className="promo-micro hidden opacity-60 lg:inline">· {today}</span>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-x-2.5 gap-y-1">
          <div className="hidden sm:block">
            <div
              className="promo-tile-clock"
              aria-label="Time remaining today"
            >
              <span className="promo-tile-digit">{mounted ? pad(time.hours) : "--"}</span>
              <span className="promo-tile-sep">:</span>
              <span className="promo-tile-digit">{mounted ? pad(time.minutes) : "--"}</span>
              <span className="promo-tile-sep">:</span>
              <span
                className={`promo-tile-digit promo-tile-digit--sec${secPulse ? " promo-sec-pulse" : ""}`}
              >
                {mounted ? pad(time.seconds) : "--"}
              </span>
            </div>
          </div>

          {/* CTA with shimmer */}
          <Link
            href="/promo"
            style={{ color: "#e46322" }}
            className="promo-cta-shimmer"
          >
            Claim
          </Link>

          <button
            onClick={() => setDismissed(true)}
            className="promo-dismiss"
            aria-label="Dismiss promotion"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
