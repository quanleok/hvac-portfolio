"use client";

import { useEffect, useRef, useState } from "react";

const items = [
  {
    name: "Linh N.",
    city: "Edmond, OK",
    tag: "AC repair",
    file: "/media/generated/testimonial-linh.mp4",
    poster: "/media/generated/portrait-linh.jpg",
    quote:
      "AC went out in the middle of a heat wave. I called Saturday morning, they had a tech here that same day. Real person on the phone. Found a bad capacitor, fixed in about an hour, fair price.",
  },
  {
    name: "Carlos R.",
    city: "Moore, OK",
    tag: "Furnace repair",
    file: "/media/generated/testimonial-carlos.mp4",
    poster: "/media/generated/portrait-carlos.jpg",
    quote:
      "Two other companies tried to sell me a whole new system. Double Le took one look, said it was just the igniter. Fifteen minute fix. Saved me four thousand dollars.",
  },
  {
    name: "Sarah M.",
    city: "Norman, OK",
    tag: "AC service",
    file: "/media/generated/testimonial-sarah.mp4",
    poster: "/media/generated/portrait-sarah.jpg",
    quote:
      "What I appreciate is they actually call you back. Got a call in ten minutes. Walked me through what was probably wrong over the phone. Felt like talking to a neighbor.",
  },
  {
    name: "Tom H.",
    city: "Yukon, OK",
    tag: "Furnace fix",
    file: "/media/generated/testimonial-tom.mp4",
    poster: "/media/generated/portrait-tom.jpg",
    quote:
      "I'm pretty handy. Furnace went out, couldn't figure it out. Tech came, showed me what was wrong, didn't try to upsell. Fixed it and went on his way. That's how it should be.",
  },
];

const ADVANCE_MS = 12000;

export function TestimonialVideoRotator() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [paused, index]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  }, [index]);

  const t = items[index];
  const next = () => setIndex((i) => (i + 1) % items.length);
  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);

  return (
    <div
      className="testimonial-video-rotator overflow-hidden border-2 border-[var(--ice)] bg-[var(--ink-900)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="grid gap-0 lg:grid-cols-[0.55fr_0.45fr]">
        <div className="relative aspect-[9/16] bg-black sm:aspect-[4/5] lg:aspect-auto lg:min-h-[34rem]">
          <video
            ref={videoRef}
            key={t.file}
            className="absolute inset-0 h-full w-full object-cover"
            src={t.file}
            poster={t.poster}
            controls
            autoPlay
            playsInline
            preload="metadata"
          />
          <div className="pointer-events-none absolute left-5 top-5 z-10">
            <span className="inline-flex items-center gap-2 border-2 border-[var(--flame)] bg-[var(--flame)] px-3.5 py-2 text-[0.66rem] font-extrabold uppercase tracking-[0.24em] text-[#1a0c05]">
              {t.tag}
            </span>
          </div>
        </div>

        <div className="relative flex flex-col justify-center gap-7 p-8 sm:p-10 lg:p-12">
          <span className="inline-flex w-fit border-2 border-[var(--ice)] px-3 py-1.5 text-[0.62rem] font-extrabold uppercase tracking-[0.32em] text-[var(--ice-soft)]">
            Verified review
          </span>
          <blockquote>
            <span aria-hidden="true" className="display-heading block text-[5rem] leading-none text-[var(--flame)] sm:text-[6rem]">
              &ldquo;
            </span>
            <p
              key={t.quote}
              className="display-heading mt-1 text-2xl leading-[1.28] text-white sm:text-[1.85rem] sm:leading-[1.24]"
            >
              {t.quote}
            </p>
          </blockquote>
          <div className="flex flex-wrap items-end justify-between gap-4 border-t-2 border-[rgba(143,193,237,0.32)] pt-5">
            <div>
              <p className="display-heading text-2xl text-white sm:text-3xl">{t.name}</p>
              <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--ice-soft)]">{t.city}</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={prev} aria-label="Previous review" className="testimonial-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span className="display-heading tabular-nums text-2xl text-white">
                {String(index + 1).padStart(2, "0")}
                <span className="text-[var(--copy-muted)]">/{String(items.length).padStart(2, "0")}</span>
              </span>
              <button type="button" onClick={next} aria-label="Next review" className="testimonial-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </div>
          </div>
          <div className="flex h-1 w-full overflow-hidden bg-[rgba(143,193,237,0.16)]">
            {items.map((_, i) => (
              <div
                key={i}
                className="h-full flex-1 transition-all duration-500"
                style={{ background: i === index ? "var(--flame)" : "transparent" }}
              />
            ))}
          </div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[var(--copy-muted)]">
            {paused ? "Paused" : "Auto-advancing"} · {items.length} reviews
          </p>
        </div>
      </div>
    </div>
  );
}
