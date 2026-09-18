"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";

function getTimeLeft() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  return {
    hours: Math.floor(diff / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

const promoNavLinks = [
  { href: "/services-detail", label: "Services" },
  { href: "/service-area", label: "Service area" },
  { href: "/testimonials", label: "Reviews" },
];

export function PromoPage() {
  const [time, setTime] = useState(getTimeLeft);
  const [today, setToday] = useState("");

  useEffect(() => {
    // Runs once on mount — sets the date string that can only be resolved client-side
    const timer = setTimeout(
      () =>
        setToday(
          new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })
        ),
      0
    );
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="promo-page relative min-h-screen overflow-x-hidden bg-[var(--background)]">
      {/* Minimal top bar */}
      <div className="border-b border-white/8 bg-[rgba(5,11,17,0.9)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/media/generated/dl-mark.png"
              alt="Double Le HVAC"
              width={36}
              height={36}
              priority
              className="h-9 w-9 rounded-xl"
            />
            <p className="display-heading text-xl text-white">Double Le</p>
          </Link>
          <nav className="hidden items-center gap-4 text-xs font-extrabold uppercase tracking-[0.14em] text-[rgba(236,242,247,0.7)] md:flex">
            {promoNavLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
          <a
            href="tel:+14053615014"
            className="primary-button btn-gloss tabular-nums inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-extrabold"
          >
            <span className="hidden sm:inline">Call (405) 361-5014</span>
            <span className="sm:hidden">Call now</span>
          </a>
        </div>
        <nav className="mx-auto flex w-full max-w-5xl gap-2 overflow-x-auto px-5 pb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[rgba(236,242,247,0.72)] sm:px-6 md:hidden">
          {promoNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Hero urgency block */}
      <section className="promo-hero relative overflow-hidden">
        <div className="promo-hero-bg" aria-hidden="true" />
        <div className="relative z-[1] mx-auto w-full max-w-5xl px-5 py-12 text-center sm:px-6 sm:py-16">
          <div className="inline-flex items-center gap-2.5 rounded-full border-2 border-[var(--flame)] bg-[rgba(240,122,51,0.12)] px-5 py-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--flame)]" />
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--flame)]">
              {today} only
            </span>
          </div>

          <h1 className="display-heading mx-auto mt-6 max-w-3xl text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            <span className="text-[var(--flame)]">$49</span> diagnostic.{" "}
            Real quote before we touch anything.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[rgba(236,242,247,0.88)]">
            No trip fee games. No &quot;well, now that we&apos;re here&quot; upsells.
            We show up, find the problem, and tell you what it costs. You decide.
          </p>

          {/* Countdown */}
          <div className="mt-8 inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-[rgba(7,17,28,0.7)] px-6 py-4 backdrop-blur">
            <span className="mr-2 text-xs font-bold uppercase tracking-[0.16em] text-white/60">
              Expires in
            </span>
            <span className="promo-digit-lg">{pad(time.hours)}</span>
            <span className="text-xl font-bold text-[var(--flame)]">:</span>
            <span className="promo-digit-lg">{pad(time.minutes)}</span>
            <span className="text-xl font-bold text-[var(--flame)]">:</span>
            <span className="promo-digit-lg">{pad(time.seconds)}</span>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="tel:+14053615014"
              className="promo-call-btn tabular-nums inline-flex w-full items-center justify-center gap-2.5 sm:w-auto"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Call (405) 361-5014
            </a>
            <a
              href="#form"
              className="ink-button btn-gloss inline-flex w-full items-center justify-center rounded-full px-8 py-4 text-sm font-extrabold uppercase tracking-[0.14em] sm:w-auto"
            >
              Fill the form below
            </a>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: "1",
              title: "On-site diagnostic",
              desc: "Our tech comes out, checks the whole system, and finds the actual problem. Not a guess over the phone.",
            },
            {
              icon: "2",
              title: "Flat price quote",
              desc: "You get the real number before we start. No hourly surprises, no parts markups you can't see.",
            },
            {
              icon: "3",
              title: "Your call",
              desc: "You say yes, we fix it right then. You say no, you owe $49 for the diagnostic. That's it.",
            },
          ].map((step) => (
            <div
              key={step.icon}
              className="rounded-[1.6rem] border border-[rgba(143,193,237,0.18)] bg-[rgba(7,17,28,0.6)] p-6"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center bg-[var(--flame)] display-heading text-xl text-[#1a0c05]">
                {step.icon}
              </span>
              <p className="display-heading mt-4 text-lg text-white">{step.title}</p>
              <p className="mt-2 text-sm leading-7 text-[rgba(236,242,247,0.88)]">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof strip */}
      <section className="border-y border-white/8 bg-[rgba(7,17,28,0.5)] py-6">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="18" height="18" viewBox="0 0 20 20" fill="#f0a03c"><path d="M10 1l2.39 4.84L18 6.71l-4 3.9.94 5.5L10 13.68l-4.94 2.43.94-5.5-4-3.9 5.61-.87z"/></svg>
              ))}
            </div>
            <span className="text-sm font-bold text-white">4.9 / 5</span>
          </div>
          <span className="text-sm text-white/60">47+ verified reviews</span>
          <span className="hidden text-sm text-white/40 sm:inline" aria-hidden="true">|</span>
          <span className="text-sm text-white/60">8 cities served</span>
          <span className="hidden text-sm text-white/40 sm:inline" aria-hidden="true">|</span>
          <span className="text-sm text-white/60">Same-day service available</span>
        </div>
      </section>

      {/* The closer — form section */}
      <section id="form" className="scroll-mt-8 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            {/* Left: urgency + reasons */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--flame)]/30 bg-[var(--flame)]/8 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--flame)]">
                Limited availability
              </span>
              <h2 className="display-heading mt-5 text-3xl text-white sm:text-4xl">
                Lock in the <span className="text-[var(--flame)]">$49 rate</span> right now.
              </h2>
              <p className="mt-4 text-base leading-7 text-[rgba(236,242,247,0.88)]">
                Fill the form or call. We&apos;ll confirm your appointment today.
                Most folks get same-day or next-morning.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Diagnostic fee waived if you approve the repair",
                  "No overtime charges during business hours",
                  "All major brands: Carrier, Trane, Lennox, Goodman, Rheem",
                  "Parts on the truck for most common fixes",
                  "30-day workmanship guarantee",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-500/20">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 5-5" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    <span className="text-sm leading-6 text-[rgba(236,242,247,0.92)]">{item}</span>
                  </div>
                ))}
              </div>

              {/* Big phone CTA */}
              <div className="mt-8 rounded-[1.6rem] border-2 border-[var(--flame)]/30 bg-[rgba(240,122,51,0.08)] p-6 text-center">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--flame)]">
                  Prefer to call?
                </p>
                <a
                  href="tel:+14053615014"
                  className="display-heading tabular-nums mt-3 block text-3xl text-white transition hover:text-[var(--flame)] sm:text-4xl"
                >
                  (405) 361-5014
                </a>
                <p className="mt-2 text-sm text-white/60">
                  Mention &quot;$49 diagnostic&quot; when you call
                </p>
              </div>
            </div>

            {/* Right: the form */}
            <div className="promo-form-card rounded-[2rem] p-6 sm:p-8">
              <div className="mb-1 flex items-center gap-2">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">
                  Spots available today
                </span>
              </div>
              <p className="display-heading mt-3 text-2xl text-white sm:text-3xl">
                Grab your $49 diagnostic.
              </p>
              <p className="mt-2 text-sm leading-7 text-[rgba(236,242,247,0.8)]">
                Tell us what&apos;s going on. We&apos;ll call back fast to lock in your time.
              </p>
              <ContactForm className="mt-5" />
              <p className="mt-4 text-center text-xs text-white/40">
                No spam. No selling your info. Just us calling you back.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA bar */}
      <section className="border-t border-white/8 bg-[rgba(240,122,51,0.06)] py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-5 text-center sm:px-6">
          <p className="display-heading text-2xl text-white sm:text-3xl">
            AC out? Furnace quit? Don&apos;t wait.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:+14053615014"
              className="promo-call-btn tabular-nums inline-flex items-center justify-center gap-2.5"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              (405) 361-5014
            </a>
            <a
              href="#form"
              className="ink-button btn-gloss inline-flex items-center justify-center rounded-full px-7 py-4 text-sm font-extrabold uppercase tracking-[0.12em]"
            >
              Fill the form
            </a>
          </div>
          <p className="text-xs text-white/50">
            Oklahoma City · Edmond · Moore · Norman · Yukon · Mustang · Midwest City · Del City
          </p>
        </div>
      </section>
    </div>
  );
}
