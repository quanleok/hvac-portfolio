"use client";

import { useEffect, useRef, useState } from "react";

interface BarRow {
  label: string;
  value: number;
  valueText: string;
  widthPct: number;
  tone: "red" | "amber" | "green";
}

interface Block {
  title: string;
  rows: BarRow[];
  payoff: string;
  source: string;
}

const BLOCKS: Block[] = [
  {
    title: "Summer electric bill · 2,000 sqft OKC home",
    rows: [
      { label: "10 SEER (old)", value: 340, valueText: "$340/mo", widthPct: 100, tone: "red" },
      { label: "14 SEER (standard)", value: 235, valueText: "$235/mo", widthPct: 69, tone: "amber" },
      { label: "17 SEER + proper install", value: 165, valueText: "$165/mo", widthPct: 49, tone: "green" },
    ],
    payoff: "Save $175/mo — that's $21,000 over 10 years.",
    source: "Typical OKC summer (Jun–Sep). Real numbers vary by home.",
  },
  {
    title: "How long your AC actually lasts",
    rows: [
      { label: "Neglected, no tune-ups", value: 8, valueText: "8 yrs", widthPct: 40, tone: "red" },
      { label: "Occasional service", value: 12, valueText: "12 yrs", widthPct: 60, tone: "amber" },
      { label: "Proper install + annual tune-ups", value: 20, valueText: "20 yrs", widthPct: 100, tone: "green" },
    ],
    payoff: "An extra 12 years before you replace — that's another system you didn't buy.",
    source: "Industry averages + Oklahoma climate adjustment.",
  },
  {
    title: "5-year total cost · cheap vs. done right",
    rows: [
      { label: "Cheap install + repairs + utilities", value: 22800, valueText: "$22,800", widthPct: 91, tone: "red" },
      { label: "Double Le install + maintenance", value: 13200, valueText: "$13,200", widthPct: 53, tone: "green" },
    ],
    payoff: "$9,600 saved. That's a family vacation, an HSA top-up, or the next system's down payment.",
    source: "Assumes 2,000 sqft OKC home, 5 yrs ownership.",
  },
];

const TONE_COLOR: Record<"red" | "amber" | "green", string> = {
  red: "#c53030",
  amber: "#e46322",
  green: "#2f9e44",
};

function useCountUp(target: number, active: boolean, durationMs = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let rafId: number;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, active, durationMs]);
  return value;
}

function formatCountUp(row: BarRow, animated: number): string {
  const rounded = Math.round(animated);
  if (row.valueText.startsWith("$") && row.valueText.includes(",")) {
    return `$${rounded.toLocaleString()}`;
  }
  if (row.valueText.startsWith("$")) {
    return `$${rounded}${row.valueText.includes("/mo") ? "/mo" : ""}`;
  }
  if (row.valueText.endsWith("yrs")) {
    return `${rounded} yrs`;
  }
  return rounded.toString();
}

function BarRowDisplay({
  row,
  active,
  staggerIndex,
  prefersReducedMotion,
}: {
  row: BarRow;
  active: boolean;
  staggerIndex: number;
  prefersReducedMotion: boolean;
}) {
  const animated = useCountUp(row.value, active && !prefersReducedMotion);
  const displayValue = prefersReducedMotion ? row.valueText : formatCountUp(row, animated);
  const barWidth = (active || prefersReducedMotion) ? row.widthPct + "%" : "0%";
  const transitionDelay = prefersReducedMotion ? "0ms" : `${staggerIndex * 150}ms`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs sm:text-sm text-white leading-tight">{row.label}</span>
        <span
          className="text-xs sm:text-sm font-extrabold tabular-nums shrink-0"
          style={{ color: TONE_COLOR[row.tone] }}
        >
          {displayValue}
        </span>
      </div>
      <div className="h-3 rounded-sm" style={{ backgroundColor: "#1a2c44" }}>
        <div
          className="h-full rounded-sm"
          style={{
            backgroundColor: TONE_COLOR[row.tone],
            width: barWidth,
            transition: prefersReducedMotion
              ? "none"
              : `width 1200ms cubic-bezier(0.22, 1, 0.36, 1) ${transitionDelay}`,
          }}
        />
      </div>
    </div>
  );
}

function ChartBlock({
  block,
  active,
  fadeActive,
  staggerIndex,
  prefersReducedMotion,
}: {
  block: Block;
  active: boolean;
  fadeActive: boolean;
  staggerIndex: number;
  prefersReducedMotion: boolean;
}) {
  const fadeDelay = prefersReducedMotion ? "0ms" : `${staggerIndex * 100}ms`;

  return (
    <figure
      className="rounded-md p-5 lg:p-6"
      style={{
        backgroundColor: "#0f1c2d",
        border: "1px solid #25344a",
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        opacity: fadeActive || prefersReducedMotion ? 1 : 0,
        transform: fadeActive || prefersReducedMotion ? "translateY(0)" : "translateY(20px)",
        transition: prefersReducedMotion
          ? "none"
          : `opacity 600ms cubic-bezier(0.22, 1, 0.36, 1) ${fadeDelay}, transform 600ms cubic-bezier(0.22, 1, 0.36, 1) ${fadeDelay}`,
      }}
    >
      <figcaption className="mb-5 text-sm font-semibold text-[#99a7b8] uppercase tracking-[0.12em] leading-tight">
        {block.title}
      </figcaption>

      <div className="space-y-4">
        {block.rows.map((row, i) => (
          <BarRowDisplay
            key={row.label}
            row={row}
            active={active}
            staggerIndex={i}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </div>

      <p
        className="mt-5 text-base font-bold text-white sm:text-lg pl-3"
        style={{ borderLeft: "2px solid var(--flame)" }}
      >
        {block.payoff}
      </p>
      <p className="mt-2 text-xs text-[#6c8096]">{block.source}</p>
    </figure>
  );
}

export function SavingsChartSection() {
  const sectionRef = useRef<HTMLElement>(null);
  // Start inactive so animation plays on scroll-in; section is invisible until
  // hydration (opacity:0 via sectionFadeStyle). This avoids a visible flash
  // because the IntersectionObserver fires shortly after mount if section is
  // already in view, and avoids showing half-grown bars.
  //
  // `mounted` stays false during SSR/hydration so we render a stable placeholder
  // without any time-dependent or client-only values.
  const [mounted, setMounted] = useState(false);
  const [barsActive, setBarsActive] = useState(false);
  const [fadeActive, setFadeActive] = useState(false);
  // Read matchMedia synchronously on first client render (lazy initializer never
  // runs on the server) so we avoid a synchronous setState call inside an effect.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  // Effect: subscribe to reduced-motion changes and mark the component as mounted.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional hydration guard
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Separate effect: set up IntersectionObserver once prefersReducedMotion is known.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    if (prefersReducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- respond to media query state; no infinite loop risk
      setBarsActive(true);
      setFadeActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setFadeActive(true);
          setBarsActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -100px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  // Before hydration (mounted=false) render with no inline style so the
  // server-rendered HTML is visible (important for no-JS / crawlers).
  // After hydration, start opacity:0 and let the observer drive the fade-in.
  const sectionFadeStyle =
    !mounted || prefersReducedMotion
      ? {}
      : {
          opacity: fadeActive ? 1 : 0,
          transform: fadeActive ? "translateY(0)" : "translateY(20px)",
          transition:
            "opacity 600ms cubic-bezier(0.22, 1, 0.36, 1), transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
        };

  return (
    <section
      id="savings-math"
      ref={sectionRef}
      className="relative mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-10 sm:px-6 sm:py-14 lg:px-8"
      style={sectionFadeStyle}
    >
      <div className="text-center mb-10">
        <span className="eyebrow">The math</span>
        <h2 className="heading-section mx-auto mt-5 max-w-3xl text-white">
          Why the right install pays you back
        </h2>
        <p className="mt-4 mx-auto max-w-2xl text-base sm:text-lg leading-7 text-[#99a7b8]">
          Cheap installs cost you 4× over 5 years. Oklahoma weather makes it worse. Here are the numbers, not the hype.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {BLOCKS.map((block, i) => (
          <ChartBlock
            key={block.title}
            block={block}
            active={barsActive}
            fadeActive={fadeActive}
            staggerIndex={i}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </div>
    </section>
  );
}
