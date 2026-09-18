"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const items = [
  {
    name: "Linh N.",
    city: "Edmond, OK",
    tag: "AC repair",
    quote:
      "AC went out in the middle of a heat wave. I called Saturday morning and they had a tech here that same day. Real person on the phone. Found a bad capacitor, fixed in about an hour, fair price.",
    photo: "/media/generated/portrait-linh.jpg",
  },
  {
    name: "Carlos R.",
    city: "Moore, OK",
    tag: "Furnace repair",
    quote:
      "Two other companies tried to sell me a whole new system. Double Le took one look, said it was just the igniter · fifteen minute fix. Saved me four thousand dollars.",
    photo: "/media/generated/portrait-carlos.jpg",
  },
  {
    name: "Sarah M.",
    city: "Norman, OK",
    tag: "AC service",
    quote:
      "What I appreciate is they actually call you back. Got a call in ten minutes. Walked me through what was probably wrong over the phone. Felt like talking to a neighbor.",
    photo: "/media/generated/portrait-sarah.jpg",
  },
  {
    name: "Tom H.",
    city: "Yukon, OK",
    tag: "Furnace fix",
    quote:
      "I'm pretty handy. Furnace went out, couldn't figure it out. Tech came, showed me what was wrong, didn't try to upsell. Fixed it and went on his way. That's how it should be.",
    photo: "/media/generated/portrait-tom.jpg",
  },
];

export function TestimonialRotator() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 8000);
    return () => window.clearInterval(id);
  }, [paused]);

  const t = items[index];
  const next = () => setIndex((i) => (i + 1) % items.length);
  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);

  return (
    <div
      className="testimonial-rotator relative overflow-hidden border-2 border-[var(--ice)] bg-[var(--ink-900)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(46,136,210,0.18)_0%,transparent_50%,rgba(240,122,51,0.12)_100%)]" aria-hidden="true" />

      <div className="relative grid gap-0 md:grid-cols-[0.46fr_0.54fr]">
        <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[34rem]">
          <Image
            key={t.photo}
            src={t.photo}
            alt={`${t.name} from ${t.city}`}
            fill
            className="testimonial-photo object-cover"
            sizes="(max-width: 768px) 100vw, 46vw"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,28,0)_55%,rgba(7,17,28,0.95)_100%)] md:bg-[linear-gradient(90deg,rgba(7,17,28,0)_60%,rgba(7,17,28,0.55)_100%)]" />
          <div className="absolute left-5 top-5">
            <span className="inline-flex items-center gap-2 border-2 border-[var(--flame)] bg-[var(--flame)] px-3.5 py-2 text-[0.66rem] font-extrabold uppercase tracking-[0.24em] text-[#1a0c05]">
              {t.tag}
            </span>
          </div>
        </div>

        <div className="relative flex flex-col justify-center gap-7 p-8 sm:p-10 lg:p-14">
          <span className="inline-flex w-fit border-2 border-[var(--ice)] px-3 py-1.5 text-[0.62rem] font-extrabold uppercase tracking-[0.32em] text-[var(--ice-soft)]">
            Verified review
          </span>
          <blockquote>
            <span aria-hidden="true" className="display-heading block text-[5rem] leading-none text-[var(--flame)] sm:text-[6rem]">
              &ldquo;
            </span>
            <p
              key={t.quote}
              className="testimonial-quote display-heading mt-1 text-2xl leading-[1.28] text-white sm:text-[1.85rem] sm:leading-[1.24]"
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
              <button
                type="button"
                onClick={prev}
                aria-label="Previous testimonial"
                className="testimonial-arrow"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span className="display-heading tabular-nums text-2xl text-white">
                {String(index + 1).padStart(2, "0")}
                <span className="text-[var(--copy-muted)]">/{String(items.length).padStart(2, "0")}</span>
              </span>
              <button
                type="button"
                onClick={next}
                aria-label="Next testimonial"
                className="testimonial-arrow"
              >
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
        </div>
      </div>
    </div>
  );
}
