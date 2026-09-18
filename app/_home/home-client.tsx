"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { TestimonialRotator } from "@/components/testimonial-rotator";
import { MobileNav } from "@/components/mobile-nav";
import { PromoBanner } from "@/components/promo-banner";
import { HeroPromoCode } from "@/components/hero-promo-code";
import { publicNavLinks } from "@/lib/site-navigation";
import { MediaStrip } from "@/components/media/media-strip";
import { SavingsChartSection } from "@/components/savings-chart-section";
import type { SectionPayload } from "@/lib/media/data";

type ServiceTone = "cooling" | "heating" | "replacement" | "maintenance";

const services: Array<{
  eyebrow: string;
  title: string;
  description: string;
  tone: ServiceTone;
  icon: ReactNode;
}> = [
  {
    eyebrow: "Cooling",
    title: "AC repair",
    description:
      "AC quit in the middle of July? We'll come out, find what's wrong, and tell you straight what it takes to fix it.",
    tone: "cooling",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
        <path d="M12 3v18" />
        <path d="M3 12h18" />
        <path d="m5.6 5.6 12.8 12.8" />
        <path d="m18.4 5.6-12.8 12.8" />
      </svg>
    ),
  },
  {
    eyebrow: "Heating",
    title: "Furnace & heat",
    description:
      "When the cold snap hits and your furnace won't start, call us. We service gas, electric, and heat pump. Most repairs same day.",
    tone: "heating",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
        <path d="M12 3c1.2 2.4 3.6 3.9 3.6 7.2a3.6 3.6 0 0 1-7.2 0C8.4 7.8 10.8 6.2 12 3Z" />
        <path d="M12 21a5 5 0 0 0 5-5c0-2.4-2-3.5-3-5.2.4 2.8-2 4-2 4s-2.4-1.2-2-4c-1 1.7-3 2.8-3 5.2a5 5 0 0 0 5 5Z" />
      </svg>
    ),
  },
  {
    eyebrow: "Replacement",
    title: "New system install",
    description:
      "If your unit's on its last leg, we'll walk you through what fits your home and your budget. No upsell, no pressure.",
    tone: "replacement",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
        <path d="M21 12a9 9 0 0 1-15.3 6.4" />
        <path d="M3 12a9 9 0 0 1 15.3-6.4" />
        <path d="M21 4v5h-5" />
        <path d="M3 20v-5h5" />
      </svg>
    ),
  },
  {
    eyebrow: "Maintenance",
    title: "Tune-ups",
    description:
      "A spring AC check and a fall furnace check catches problems before they leave you without heat or cooling.",
    tone: "maintenance",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
        <path d="M14.7 6.3a4 4 0 0 0-5 5l-6.4 6.4a2 2 0 0 0 2.8 2.8l6.4-6.4a4 4 0 0 0 5-5l-2.7 2.7-2.3-.5-.5-2.3z" />
      </svg>
    ),
  },
];

const trustSignals: Array<{ label: string; icon: ReactNode }> = [
  {
    label: "Local shop in OKC",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
        <path d="M12 22s-7-6.1-7-12a7 7 0 0 1 14 0c0 5.9-7 12-7 12Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    label: "Our trucks, our techs",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
        <path d="M3 16V8a1 1 0 0 1 1-1h9v9" />
        <path d="M13 10h4l3 3v3h-7" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    ),
  },
  {
    label: "You call, we pick up",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
        <path d="M22 16.9v2.6a2 2 0 0 1-2.2 2A19 19 0 0 1 2.5 4.2 2 2 0 0 1 4.5 2h2.6a1.9 1.9 0 0 1 1.9 1.6 11 11 0 0 0 .6 2.6 1.9 1.9 0 0 1-.4 2L8 9.4a16 16 0 0 0 6.6 6.6l1.2-1.2a1.9 1.9 0 0 1 2-.4 11 11 0 0 0 2.6.6 1.9 1.9 0 0 1 1.6 1.9Z" />
      </svg>
    ),
  },
];

const companyPoints: Array<{ title: string; detail: string; icon: ReactNode }> = [
  {
    title: "We live here too",
    detail:
      "Our shop is in OKC. When you call, you're talking to the same people who'll show up at your door.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
        <path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="8" r="3.2" />
        <path d="M21 20v-2a4 4 0 0 0-3-3.87" />
        <path d="M15 4.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: "We show up",
    detail:
      "You'll get a real time window, a text when we're on the way, and work that's done right the first time.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
        <path d="M9 12l2 2 4-4" />
        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    title: "No games on pricing",
    detail:
      "We tell you what's wrong, what it costs, and whether it's worth fixing. You decide from there.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
        <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
      </svg>
    ),
  },
];

const contactSteps = [
  "Tell us what's going on. AC won't cool, furnace won't start, something else.",
  "Drop your name, number, and part of town so we can get out to you.",
  "In a hurry? Just call. Same number, someone's on the other end.",
];

const serviceAreas = [
  "Oklahoma City",
  "Edmond",
  "Moore",
  "Norman",
  "Yukon",
  "Mustang",
  "Midwest City",
  "Del City",
];

export function HomeClient({ media }: { media: Record<string, SectionPayload | null> }) {
  const heroRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    message: "",
    company: "",
  });
  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [formMessage, setFormMessage] = useState("");

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]")
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    function handleScroll() {
      const scrolled = window.scrollY > 24;
      header?.setAttribute("data-scrolled", scrolled ? "true" : "false");
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const target = document.querySelector<HTMLElement>("[data-burn]");
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            el.classList.add("is-burning");
          } else {
            el.classList.remove("is-burning");
          }
        });
      },
      { threshold: 0.24, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const videos = Array.from(document.querySelectorAll<HTMLVideoElement>("video"));

    function rateFor(v: HTMLVideoElement) {
      if (v.closest("#proof")) return 0.45;
      if (v.closest("#services")) return 0.55;
      if (v.closest("#contact")) return 0.7;
      return 1;
    }

    if (reducedMotion) {
      videos.forEach((v) => {
        v.pause();
        v.removeAttribute("autoplay");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            v.playbackRate = rateFor(v);
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        });
      },
      { threshold: 0.18, rootMargin: "120px 0px" }
    );

    videos.forEach((v) => {
      v.pause();
      v.playbackRate = rateFor(v);
      observer.observe(v);
    });

    return () => observer.disconnect();
  }, []);

  function handleHeroPointer(event: MouseEvent<HTMLElement>) {
    const hero = heroRef.current;
    if (!hero) return;

    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    hero.style.setProperty("--hero-x", `${x}%`);
    hero.style.setProperty("--hero-y", `${y}%`);
  }

  function resetHeroPointer() {
    const hero = heroRef.current;
    if (!hero) return;
    hero.style.setProperty("--hero-x", "68%");
    hero.style.setProperty("--hero-y", "24%");
  }

  function updateField(name: keyof typeof formData, value: string) {
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) {
      setFormState("error");
      setFormMessage("We need your name, number, and a few words on what's going on.");
      return;
    }

    setFormState("submitting");
    setFormMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok) {
        setFormState("error");
        setFormMessage(data.error || "Couldn't send that. Give us a call at (405) 361-5014.");
        return;
      }

      setFormState("success");
      setFormMessage("Got it, we'll be in touch shortly.");
      setFormData({
        name: "",
        phone: "",
        email: "",
        city: "",
        message: "",
        company: "",
      });
    } catch {
      setFormState("error");
      setFormMessage("Something glitched. Just call us at (405) 361-5014.");
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--ink)]">
      <header
        ref={headerRef}
        className="site-header fixed inset-x-0 top-0 z-50 border-b border-[rgba(197,223,247,0.18)] backdrop-blur-xl"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-55"
          style={{
            backgroundImage: "url('/media/generated/brand-overlay-clean.png')",
            backgroundSize: "260px auto",
            backgroundRepeat: "repeat",
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,17,0.86)_0%,rgba(5,11,17,0.92)_100%)]" />
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <a href="#top" className="group flex items-center gap-3">
            <Image
              src="/media/generated/dl-mark.png"
              alt="Double Le HVAC"
              width={44}
              height={44}
              priority
              className="h-11 w-11 rounded-2xl shadow-[0_14px_28px_rgba(13,62,114,0.36)] transition group-hover:shadow-[0_18px_36px_rgba(13,62,114,0.52)] group-hover:scale-105"
            />
            <div>
              <p className="display-heading text-2xl leading-none text-white">
                Double Le
              </p>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.26em] text-[var(--copy-muted)]">
                HVAC · OKC
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--copy-soft)] md:flex">
            {publicNavLinks.map((link) => (
              <Link key={link.href} className="transition hover:text-white" href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-3 sm:flex">
              <a
                href="#contact"
                className="ink-button btn-gloss inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold uppercase tracking-[0.12em]"
              >
                Send a request
              </a>
              <a
                href="tel:+14053615014"
                className="primary-button btn-gloss tabular-nums inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold"
              >
                Call (405) 361-5014
              </a>
            </div>

            <MobileNav />
          </div>
        </div>
        <PromoBanner />
      </header>

      <div className="brick-sidebar brick-sidebar--left" aria-hidden="true" />
      <div className="brick-sidebar brick-sidebar--right" aria-hidden="true" />

      <main id="top" tabIndex={-1}>
        <section
          ref={heroRef}
          onMouseMove={handleHeroPointer}
          onMouseLeave={resetHeroPointer}
          className="hero-stage relative min-h-[100svh] overflow-hidden"
        >
          <video
            className="hero-video absolute inset-0 h-full w-full object-cover object-center"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/media/hero-video-poster.jpg"
          >
            <source src="/media/hero-video.mp4" type="video/mp4" />
          </video>

          <div className="hero-overlay absolute inset-0" />
          <div className="ambient-layer" aria-hidden="true">
            <div className="beam beam--cold" />
            <div className="beam beam--warm" />
            <div className="beam beam--mid" />
            <div className="particles" />
            <div className="scan-line" />
          </div>
          <div className="hero-interactive-glow pointer-events-none absolute inset-0" />
          <div className="hero-grid pointer-events-none absolute inset-0 opacity-55" />

          <div className="relative mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col justify-end px-5 pb-10 pt-28 sm:px-6 sm:pb-12 lg:px-8 lg:pb-16 lg:pt-32">
            <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div data-reveal className="reveal">
                <div className="flex flex-wrap items-center gap-4">
                  <span
                    className="credential-badge credential-badge--shop"
                    role="img"
                    aria-label="Established OKC small shop"
                  />
                </div>
                <h1 className="heading-display display-heading mt-6 max-w-4xl text-white">
                  Heating and air that <span className="accent">actually works</span> in Oklahoma City homes.
                </h1>
                <p className="copy-soft mt-6 max-w-2xl text-lg leading-8 sm:text-xl">
                  Local shop, honest pricing, same-day service when we can.
                  AC repair, furnace work, new installs. Give us a call.
                </p>

                <div className="mt-8 hidden gap-3 sm:flex sm:flex-row">
                  <a
                    href="#contact"
                    className="primary-button btn-gloss inline-flex items-center justify-center rounded-full px-7 py-4 text-sm font-extrabold uppercase tracking-[0.12em]"
                  >
                    Send a request
                  </a>
                  <a
                    href="tel:+14053615014"
                    className="ghost-button inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-sm font-extrabold uppercase tracking-[0.12em]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                      <path d="M22 16.9v2.6a2 2 0 0 1-2.2 2A19 19 0 0 1 2.5 4.2 2 2 0 0 1 4.5 2h2.6a1.9 1.9 0 0 1 1.9 1.6 11 11 0 0 0 .6 2.6 1.9 1.9 0 0 1-.4 2L8 9.4a16 16 0 0 0 6.6 6.6l1.2-1.2a1.9 1.9 0 0 1 2-.4 11 11 0 0 0 2.6.6 1.9 1.9 0 0 1 1.6 1.9Z" />
                    </svg>
                    Call (405) 361-5014
                  </a>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <a
                    href="#proof"
                    className="inline-flex min-h-[44px] items-center px-2 py-2 font-semibold text-[rgba(236,242,247,0.84)] transition hover:text-white"
                  >
                    About us
                  </a>
                  <span aria-hidden="true" className="text-[rgba(236,242,247,0.34)]">•</span>
                  <a
                    href="#areas"
                    className="inline-flex min-h-[44px] items-center px-2 py-2 font-semibold text-[rgba(236,242,247,0.84)] transition hover:text-white"
                  >
                    Where we go
                  </a>
                </div>

                <div className="trust-strip mt-10 grid sm:grid-cols-3 lg:max-w-3xl">
                  {trustSignals.map((item, index) => (
                    <div
                      key={item.label}
                      className="trust-item reveal"
                      data-reveal
                      data-reveal-stagger={String(index + 1)}
                    >
                      <span className="trust-badge">{item.icon}</span>
                      <p className="text-sm font-semibold leading-snug text-[rgba(236,242,247,0.9)]">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-10 hidden items-center gap-4 text-[0.62rem] font-bold uppercase tracking-[0.32em] text-[rgba(236,242,247,0.46)] sm:flex">
                  <Image
                    src="/media/generated/dl-crest-clean.png"
                    alt="Double Le HVAC crest"
                    width={64}
                    height={64}
                    className="h-16 w-16 opacity-95 drop-shadow-[0_10px_28px_rgba(46,136,210,0.34)]"
                  />
                  <div className="h-px flex-1 max-w-[6rem] bg-gradient-to-r from-transparent via-[rgba(197,223,247,0.34)] to-transparent" />
                  <span>Family-run · Oklahoma City · Est. in heat + cold</span>
                </div>
              </div>

              <aside data-reveal className="call-card call-card--hot interactive-panel edge-trace reveal relative rounded-[2rem] p-4 sm:p-5">
                <Image
                  src="/media/generated/quality-stamp-clean.png"
                  alt="Actually works since day one"
                  width={160}
                  height={160}
                  className="quality-stamp pointer-events-none absolute -right-2 -top-4 z-[3] h-20 w-20 -rotate-12 sm:-right-4 sm:-top-6 sm:h-28 sm:w-28"
                  aria-hidden="true"
                />
                <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10">
                  <div className="relative aspect-[16/10]">
                    <Image
                      src="/media/building-front.jpg"
                      alt="Double Le HVAC office front"
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 360px"
                    />
                  </div>
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,15,24,0.06),rgba(7,15,24,0.48))]" />
                  <div className="absolute left-4 top-4 inline-flex items-center border-2 border-[var(--flame)] bg-[var(--flame)] px-3 py-1.5 text-[0.66rem] font-extrabold uppercase tracking-[0.24em] text-[#1a0c05]">
                    Oklahoma City Area
                  </div>
                </div>

                <div className="px-2 pb-2 pt-5">
                  <p className="inline-block bg-[#fff5ea] px-2.5 py-1 text-sm font-extrabold uppercase tracking-[0.18em] text-[#8a2d05]">
                    Call us direct
                  </p>
                  <a
                    href="tel:+14053615014"
                    className="display-heading tabular-nums mt-3 block text-4xl text-white sm:text-[3.25rem]"
                  >
                    (405) 361-5014
                  </a>
                  <p className="copy-soft mt-4 leading-7">
                    Anywhere in the OKC metro. Usually same day, always a
                    straight answer.
                  </p>
                  <div className="soft-divider mt-6 pt-6">
                    <p className="text-sm font-semibold text-white">
                      Open weekdays, emergencies welcome
                    </p>
                    <p className="copy-muted mt-2 text-sm leading-6">
                      AC&apos;s out in a heat wave? Furnace quit on a cold night?
                      That&apos;s what we&apos;re here for.
                    </p>
                  </div>
                  <div className="mt-6 flex flex-col gap-3">
                    <a
                      href="tel:+14053615014"
                      className="primary-button btn-gloss inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold uppercase tracking-[0.12em]"
                    >
                      Call now
                    </a>
                    <a
                      href="#contact"
                      className="ghost-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold uppercase tracking-[0.12em]"
                    >
                      Request service
                    </a>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          <a
            href="#proof"
            aria-label="Scroll to next section"
            className="hero-scroll-indicator hidden sm:flex"
          >
            <span>Scroll</span>
          </a>
        </section>

        {/* Unit replacement promo — bigger-ticket offer, residential + commercial */}
        <section
          id="replacement-promo"
          className="relative mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-12 sm:scroll-mt-28 sm:px-6 sm:py-16 lg:px-8"
        >
          <div className="relative overflow-hidden rounded-md border border-[#3d2008] bg-[#12200f] p-8 sm:p-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              aria-hidden="true"
              style={{
                backgroundImage: "url('/media/generated/brand-overlay-clean.png')",
                backgroundSize: "320px auto",
                backgroundRepeat: "repeat",
              }}
            />
            <div className="relative z-[1] grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-sm border border-[#f07a33] bg-[#2a0f04] px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--flame)]">
                  <span className="h-2 w-2 animate-pulse rounded-sm bg-[var(--flame)]" />
                  Full system upgrade
                </span>
                <h2 className="display-heading mt-5 text-4xl leading-[1.05] text-white sm:text-5xl">
                  New system <span className="text-[var(--flame)]">starting at $4,999</span>
                </h2>
                <p className="copy-soft mt-5 max-w-xl text-lg leading-8">
                  Residential or commercial — we handle the whole swap. Old unit out,
                  new one in, startup, warranty registered. No third parties, no
                  handoffs, no surprise add-ons. <strong className="text-white">Final price depends on your
                  system and home</strong> — we quote the exact number before any work starts.
                </p>

                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    "Free in-home or on-site estimate",
                    "Financing available with approved credit",
                    "Carrier, Trane, Lennox, Goodman, Rheem, Daikin",
                    "Same-week install on most jobs",
                    "10-year parts warranty on qualifying systems",
                    "Commercial rooftop / split systems quoted same day",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[rgba(236,242,247,0.92)]">
                      <span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-500/20">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                          <path d="M2.5 6l2.5 2.5 5-5" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a
                    href="/contact#promo-apply"
                    className="primary-button btn-gloss tabular-nums inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold uppercase tracking-[0.14em] shadow-[0_18px_38px_rgba(13,62,114,0.5)]"
                  >
                    Claim $500 off — enter code below
                  </a>
                  <a
                    href="tel:+14053615014"
                    className="ink-button btn-gloss inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-extrabold uppercase tracking-[0.14em] ring-1 ring-white/15"
                  >
                    Call for estimate
                  </a>
                </div>
                <p className="copy-soft mt-4 text-xs">
                  Starting price is for standard residential air-conditioning replacement. Commercial, high-efficiency, and heat-pump systems quoted after on-site assessment.
                </p>
              </div>

              <div className="relative">
                <div className="relative overflow-hidden rounded-md border border-[#25344a] bg-[#0f1c2d] p-6 sm:p-8">
                  <span className="text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--flame)]">
                    Starting price
                  </span>
                  <p className="display-heading mt-3 flex items-baseline gap-2 text-5xl text-white sm:text-6xl">
                    <span className="text-base font-extrabold uppercase tracking-[0.12em] text-[var(--flame)]">From</span>
                    $4,999<span className="text-xl text-[var(--copy-muted)]">+</span>
                  </p>
                  <p className="copy-soft mt-2 text-sm leading-7">
                    That&apos;s the starting price for a basic 3-ton single-stage AC, existing ductwork
                    intact, slab install. Most OKC homes land between <strong className="text-white">$4,999 and $12,000</strong> depending
                    on tonnage, efficiency, and ducts. Final price after the free in-home
                    estimate — no games, no hidden fees.
                  </p>

                  <div className="mt-5">
                    <HeroPromoCode />
                  </div>

                  <div className="mt-5 border-t border-white/10 pt-4">
                    <span className="text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--ice-soft)]">
                      Commercial
                    </span>
                    <p className="copy-soft mt-2 text-sm leading-7">
                      Rooftop units, split-system VRF, and light commercial
                      replacements — priced after a site walk. We handle small office,
                      retail, and restaurant HVAC across the OKC metro.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-5 pt-4 sm:px-6 lg:px-8" aria-hidden="true">
          <div className="ornamental-divider-row">
            <div className="ornamental-divider ornamental-divider--blueprint" />
          </div>
        </div>

        <section
          id="proof"
          className="mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-8 sm:scroll-mt-28 sm:px-6 lg:px-8 lg:py-12"
        >
          <div className="grid items-start gap-5 lg:grid-cols-[0.86fr_1.14fr]">
            <div data-reveal className="paper-shell interactive-panel reveal rounded-[2rem] p-6 sm:p-8 lg:p-10">
              <span className="eyebrow">Local company</span>
              <h2 className="heading-section mt-5 lg:max-w-xl">
                Small shop. Real trucks. People who answer the phone.
              </h2>
              <p className="copy-soft mt-5 text-lg leading-8">
                We&apos;re a small OKC heating and air company. No 1-800 number,
                no dispatcher who doesn&apos;t know what a furnace is. Just us.
              </p>

              <div className="mt-8">
                {companyPoints.map((point, index) => (
                  <div
                    key={point.title}
                    data-reveal
                    data-reveal-stagger={String(index + 1)}
                    className="proof-point reveal"
                  >
                    <span className="proof-bullet">{point.icon}</span>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--cool)]">
                        {point.title}
                      </p>
                      <p className="mt-1.5 text-sm leading-7 text-[rgba(236,242,247,0.92)]">
                        {point.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-[var(--paper-deep)] bg-[rgba(46,136,210,0.06)] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--blue-600)]">Hours</p>
                <div className="mt-3 space-y-1.5 text-sm text-[var(--paper-muted)]">
                  <div className="flex justify-between"><span>Mon – Fri</span><span className="tabular-nums font-bold text-[var(--paper-ink)]">7 AM – 6 PM</span></div>
                  <div className="flex justify-between"><span>Saturday</span><span className="tabular-nums font-bold text-[var(--paper-ink)]">8 AM – 2 PM</span></div>
                  <div className="flex justify-between"><span>Sunday</span><span className="tabular-nums font-bold text-[var(--paper-ink)]">Emergency only</span></div>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <article data-reveal className="section-shell interactive-panel reveal col-span-2 overflow-hidden rounded-[1.6rem]">
                <div className="relative aspect-[16/7]">
                  <Image
                    src="/media/generated/okc-neighborhood.jpg"
                    alt="Oklahoma brick ranch homes with service van in driveway"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 55vw"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(7,17,28,0.7)_100%)]" />
                  <div className="absolute bottom-3 left-4 sm:bottom-4 sm:left-5">
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--ice)]">Your neighborhood</p>
                  </div>
                </div>
              </article>

              <article data-reveal data-reveal-stagger="1" className="section-shell interactive-panel reveal overflow-hidden rounded-[1.6rem]">
                <div className="relative aspect-[4/3]">
                  <Image
                    src="/media/office-wide.jpg"
                    alt="Double Le Heat & Air branded service van"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 28vw"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(7,17,28,0.7)_100%)]" />
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--ice)]">Loaded up</p>
                  </div>
                </div>
              </article>

              <article data-reveal data-reveal-stagger="2" className="section-shell interactive-panel reveal overflow-hidden rounded-[1.6rem]">
                <div className="relative aspect-[4/3]">
                  <Image
                    src="/media/team.jpg"
                    alt="Double Le HVAC team"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 28vw"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(7,17,28,0.7)_100%)]" />
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--ice)]">The crew</p>
                  </div>
                </div>
              </article>

              <article data-reveal data-reveal-stagger="3" className="section-shell interactive-panel reveal overflow-hidden rounded-[1.6rem]">
                <div className="relative aspect-[4/3]">
                  <Image
                    src="/media/generated/okc-tech-ac.jpg"
                    alt="HVAC technician servicing AC condenser at Oklahoma home"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 28vw"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(7,17,28,0.7)_100%)]" />
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--flame)]">On the job</p>
                  </div>
                </div>
              </article>

              <article data-reveal data-reveal-stagger="4" className="section-shell interactive-panel reveal overflow-hidden rounded-[1.6rem]">
                <div className="relative aspect-[4/3]">
                  <Image
                    src="/media/generated/van-interior.jpg"
                    alt="Organized HVAC service van interior with tools and parts"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 28vw"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(7,17,28,0.7)_100%)]" />
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--ice)]">Parts ready</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
        <MediaStrip payload={media["office-more"] ?? null} />

        <div className="brick-divider" aria-hidden="true" />

        <section id="trust" className="relative mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-8 sm:scroll-mt-28 sm:px-6 lg:px-8">
          <Image
            src="/media/generated/tool-drill.png"
            alt=""
            width={140}
            height={140}
            aria-hidden="true"
            className="tool-prop right-2 top-0 h-24 w-24 lg:h-32 lg:w-32"
            style={{ ["--tilt" as string]: "-18deg", animationDelay: "0.4s" }}
          />
          <Image
            src="/media/generated/tool-multimeter.png"
            alt=""
            width={120}
            height={120}
            aria-hidden="true"
            className="tool-prop -bottom-6 left-2 h-20 w-20 lg:h-28 lg:w-28"
            style={{ ["--tilt" as string]: "14deg", animationDelay: "1.2s" }}
          />
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <span className="eyebrow">Who you&apos;re hiring</span>
              <h2 className="heading-section mt-4 max-w-3xl text-white">
                Real people. Real trucks. Real work.
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-3 sm:gap-4">
            <article data-reveal className="reveal relative col-span-6 overflow-hidden rounded-[1.8rem] border border-[rgba(143,193,237,0.18)] md:col-span-4">
              <div className="relative aspect-[16/10]">
                <Image
                  src="/media/generated/tech-portrait.jpg"
                  alt="Double Le HVAC technician with multimeter beside an outdoor AC unit"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,29,58,0)_40%,rgba(7,29,58,0.88)_100%)]" />
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6">
                  <p className="text-base font-extrabold uppercase tracking-[0.16em] text-[#1a0c05] bg-[var(--flame)] px-2.5 py-1 inline-block">Your tech</p>
                  <p className="mt-1 text-lg font-bold text-white">Shows up ready to figure it out</p>
                </div>
              </div>
            </article>

            <article data-reveal data-reveal-stagger="1" className="reveal relative col-span-3 overflow-hidden rounded-[1.8rem] border border-[rgba(143,193,237,0.18)] md:col-span-2">
              <div className="relative aspect-[4/5] md:aspect-[4/5]">
                <Image
                  src="/media/generated/handshake.jpg"
                  alt="Double Le HVAC technician shaking hands with a homeowner"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,29,58,0)_50%,rgba(7,29,58,0.86)_100%)]" />
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6">
                  <p className="text-base font-extrabold uppercase tracking-[0.16em] text-[#041326] bg-[var(--ice)] px-2.5 py-1 inline-block">Follow-through</p>
                  <p className="mt-1 text-base font-bold text-white">Stand behind the work</p>
                </div>
              </div>
            </article>

            <article data-reveal data-reveal-stagger="2" className="reveal relative col-span-3 overflow-hidden rounded-[1.8rem] border border-[rgba(143,193,237,0.18)] md:col-span-2">
              <div className="relative aspect-[4/5]">
                <Image
                  src="/media/generated/van-interior.jpg"
                  alt="Organized HVAC service van interior with tools and parts"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,29,58,0)_50%,rgba(7,29,58,0.86)_100%)]" />
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6">
                  <p className="text-base font-extrabold uppercase tracking-[0.16em] text-[#041326] bg-[var(--ice)] px-2.5 py-1 inline-block">Loaded up</p>
                  <p className="mt-1 text-base font-bold text-white">Parts we use most, on the truck</p>
                </div>
              </div>
            </article>

            <article data-reveal data-reveal-stagger="3" className="reveal relative col-span-6 overflow-hidden rounded-[1.8rem] border border-[rgba(143,193,237,0.18)] md:col-span-4">
              <div className="relative aspect-[16/9]">
                <Image
                  src="/media/generated/family-comfort.jpg"
                  alt="An Oklahoma family comfortable in their living room"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,29,58,0.15)_0%,rgba(7,29,58,0)_40%,rgba(7,29,58,0.8)_100%)]" />
                <div className="absolute bottom-4 right-4 max-w-xs text-right sm:bottom-6 sm:right-6">
                  <p className="text-base font-extrabold uppercase tracking-[0.16em] text-[#1a0c05] bg-[var(--flame)] px-2.5 py-1 inline-block">The point</p>
                  <p className="mt-1 text-lg font-bold text-white">A house that&apos;s actually comfortable</p>
                </div>
              </div>
            </article>
          </div>
        </section>
        <MediaStrip payload={media["team-at-work"] ?? null} />

        <section id="testimonials" className="relative mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-8 sm:scroll-mt-28 sm:px-6 lg:px-8">
          <Image src="/media/generated/tool-wrench.png" alt="" width={140} height={140} aria-hidden="true" className="tool-prop tool-prop--blend -top-6 right-4 h-20 w-20 lg:h-28 lg:w-28" style={{ ["--tilt" as string]: "25deg", animationDelay: "1.8s" }} />
          <div className="brick-panel mb-6 flex flex-wrap items-end justify-between gap-4 p-6 sm:p-8">
            <div>
              <span className="eyebrow">What folks say</span>
              <h2 className="heading-section mt-4 max-w-3xl text-white">
                Real customers. Real comfort.
              </h2>
            </div>
            <Link
              href="/testimonials"
              className="primary-button btn-gloss inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold uppercase tracking-[0.14em] shadow-[0_18px_38px_rgba(13,62,114,0.5)] ring-2 ring-white/20 hover:ring-white/40"
            >
              <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[0.7rem]">▶</span>
              Watch full reviews
            </Link>
          </div>
          <TestimonialRotator />
        </section>

        <div className="brick-divider" aria-hidden="true" />

        {/* Oklahoma weather — why your system matters */}
        <section className="relative mx-auto w-full max-w-7xl px-5 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Image src="/media/generated/tool-gauges.png" alt="" width={140} height={140} aria-hidden="true" className="tool-prop tool-prop--blend -top-4 left-3 h-24 w-24 lg:h-32 lg:w-32" style={{ ["--tilt" as string]: "-15deg", animationDelay: "0.6s" }} />
          <Image src="/media/generated/tool-screws.png" alt="" width={120} height={120} aria-hidden="true" className="tool-prop tool-prop--blend -bottom-4 right-4 h-20 w-20 lg:h-24 lg:w-24" style={{ ["--tilt" as string]: "8deg", animationDelay: "2.4s" }} />
          <div className="text-center">
            <span className="eyebrow">Built for Oklahoma</span>
            <h2 className="heading-section mx-auto mt-5 max-w-3xl text-white">
              110° summers. Ice storms in January. Your system can&apos;t take a day off.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Summer highs",
                stat: "110°+",
                desc: "Oklahoma summers push AC units past their limits. We keep them running.",
                tone: "flame" as const,
                bg: "/media/generated/oklahoma-summer.webp",
              },
              {
                label: "Winter lows",
                stat: "10°F",
                desc: "When an ice storm hits, your furnace is the only thing between you and frozen pipes.",
                tone: "ice" as const,
                bg: "/media/generated/oklahoma-storm.webp",
              },
              {
                label: "Severe weather days",
                stat: "55+",
                desc: "Hail, wind, power surges. Oklahoma weather wears equipment down faster than anywhere.",
                tone: "flame" as const,
                bg: "/media/generated/oklahoma-home-brick.webp",
              },
              {
                label: "Avg. system lifespan here",
                stat: "12 yrs",
                desc: "Shorter than the national average. Tune-ups stretch that number. Neglect shrinks it.",
                tone: "ice" as const,
                bg: "/media/generated/okc-skyline-night.webp",
              },
            ].map((item) => (
              <div key={item.label} className="relative overflow-hidden rounded-[1.6rem] border border-[rgba(143,193,237,0.18)] p-6 text-center">
                <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url('${item.bg}')` }} />
                <div className="absolute inset-0 bg-[rgba(7,17,28,0.55)]" />
                <div className="relative z-[1]">
                  <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-[var(--copy-muted)]">{item.label}</p>
                  <p className={`display-heading mt-3 text-4xl sm:text-5xl ${item.tone === "flame" ? "text-[var(--flame)]" : "text-[var(--ice)]"}`}>{item.stat}</p>
                  <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.85)]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <SavingsChartSection />

        <div className="brick-divider" aria-hidden="true" />

        <section
          id="services"
          className="ambient-bg-section ambient-bg-section--frost relative mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-8 sm:scroll-mt-28 sm:px-6 lg:px-8"
        >
          <Image
            src="/media/generated/tool-capacitor.png"
            alt=""
            width={140}
            height={140}
            aria-hidden="true"
            className="tool-prop -top-4 right-6 h-24 w-24 lg:h-32 lg:w-32"
            style={{ ["--tilt" as string]: "22deg", animationDelay: "0s" }}
          />
          <Image
            src="/media/generated/tool-thermostat.png"
            alt=""
            width={120}
            height={120}
            aria-hidden="true"
            className="tool-prop -bottom-4 left-2 h-20 w-20 lg:-bottom-8 lg:left-6 lg:h-28 lg:w-28"
            style={{ ["--tilt" as string]: "-12deg", animationDelay: "2.2s" }}
          />
          <video
            className="ambient-bg-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src="/media/generated/frost-bg.mp4" type="video/mp4" />
          </video>
          <div className="ambient-bg-veil" aria-hidden="true" />
          <div className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
            <div data-reveal className="section-shell reveal rounded-[2rem] p-6 sm:p-8 lg:p-10">
              <span className="eyebrow">What we help with</span>
              <h2 className="heading-section mt-5 text-white">
                What we do, and what we don&apos;t.
              </h2>
              <p className="copy-soft mt-5 text-lg leading-8">
                We fix what&apos;s broken, install what needs replacing, and keep
                what&apos;s working running longer. That&apos;s it.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((service, index) => (
                <div
                  key={service.title}
                  data-reveal
                  data-reveal-stagger={String((index % 3) + 1)}
                  className={`service-card service-card--${service.tone} edge-trace reveal rounded-[1.6rem] border border-[rgba(175,205,230,0.14)] bg-[rgba(255,255,255,0.04)] px-6 py-6`}
                >
                  <div className="relative z-10">
                    <span
                      className={`icon-sheet icon-sheet--${service.tone}`}
                      role="img"
                      aria-label={`${service.eyebrow} icon`}
                    />
                    <p className="service-eyebrow mt-5 text-xs font-bold uppercase tracking-[0.18em]">
                      {service.eyebrow}
                    </p>
                    <p className="heading-card mt-2 text-white">{service.title}</p>
                    <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.92)]">
                      {service.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="Brands and equipment we service" className="relative mx-auto w-full max-w-7xl px-0 py-10 sm:py-14">
          <div className="px-5 pb-6 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="eyebrow">We service</span>
                <p className="display-heading mt-3 text-2xl text-white sm:text-3xl">All major brands. All major equipment.</p>
              </div>
              <p className="max-w-md text-sm leading-7 text-[rgba(236,242,247,0.84)]">
                Doesn&apos;t matter what&apos;s installed at your place. Odds are we&apos;ve
                worked on it before.
              </p>
            </div>
          </div>

          <div className="brand-marquee py-3" aria-label="Brands we service">
            <div className="brand-marquee-track">
              {Array.from({ length: 3 }).flatMap((_, r) =>
                ["Carrier", "Trane", "Goodman", "Lennox", "Rheem", "York", "Bryant", "American Standard", "Ruud", "Daikin", "Mitsubishi", "Heil"].map((b) => (
                  <span key={`${b}-${r}`} className="brand-marquee-item">{b}</span>
                ))
              )}
            </div>
          </div>

          <div className="unit-marquee mt-4" aria-label="Equipment we service">
            <div className="unit-marquee-track">
              {Array.from({ length: 4 }).flatMap((_, r) =>
                [
                  { src: "/media/generated/ac-unit-1.webp", alt: "Trane condenser" },
                  { src: "/media/generated/ac-unit-2.webp", alt: "Lennox furnace" },
                  { src: "/media/generated/ac-unit-3.webp", alt: "Mitsubishi mini-split" },
                  { src: "/media/generated/ac-unit-4.webp", alt: "Carrier condenser" },
                  { src: "/media/generated/ac-unit-5.webp", alt: "Bryant gas furnace" },
                  { src: "/media/generated/ac-unit-6.webp", alt: "Ruud package unit" },
                ].map((u, i) => (
                  <div key={`${r}-${i}`} className="unit-card">
                    {/* eslint-disable-next-line @next/next/no-img-element -- marquee loop clones many copies; native img avoids redundant next/image requests */}
                    <img src={u.src} alt={u.alt} className="unit-card-img" loading="lazy" />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
        <MediaStrip payload={media["equipment-installed"] ?? null} />

        <section aria-label="On the job" className="mx-auto w-full max-w-7xl px-5 pt-6 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(143,193,237,0.18)] bg-black">
            <video
              className="block h-[22vh] min-h-[12rem] w-full object-cover sm:h-[26vh] sm:min-h-[14rem] lg:h-[30vh]"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            >
              <source src="/media/generated/tech-hands.mp4" type="video/mp4" />
            </video>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(10,8,6,0.72)_0%,rgba(10,8,6,0.08)_42%,rgba(10,8,6,0.08)_58%,rgba(10,8,6,0.72)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,8,6,0)_40%,rgba(10,8,6,0.48)_100%)]" />
            <div className="absolute left-5 top-5 inline-flex items-center border-2 border-[var(--flame)] bg-[var(--flame)] px-3.5 py-2 text-[0.66rem] font-extrabold uppercase tracking-[0.24em] text-[#1a0c05] sm:left-7 sm:top-7">
              Live · On the job
            </div>
            <div className="absolute bottom-5 right-5 text-right sm:bottom-7 sm:right-7">
              <p className="text-[0.64rem] font-bold uppercase tracking-[0.26em] text-[rgba(255,255,255,0.64)]">Handled right, first time</p>
              <p className="mt-1 text-base font-bold text-white sm:text-lg">Real work, real tools, real results.</p>
            </div>
          </div>
        </section>

        <div className="brick-divider" aria-hidden="true" />

        <section id="how" className="relative mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-8 sm:scroll-mt-28 sm:px-6 lg:px-8">
          <Image
            src="/media/generated/tool-battery.png"
            alt=""
            width={130}
            height={130}
            aria-hidden="true"
            className="tool-prop -top-3 left-3 h-24 w-24 lg:left-8 lg:h-32 lg:w-32"
            style={{ ["--tilt" as string]: "-22deg", animationDelay: "1.6s" }}
          />
          <Image
            src="/media/generated/tool-duct.png"
            alt=""
            width={150}
            height={150}
            aria-hidden="true"
            className="tool-prop -bottom-2 right-2 h-28 w-28 lg:-bottom-6 lg:right-8 lg:h-36 lg:w-36"
            style={{ ["--tilt" as string]: "12deg", animationDelay: "0.8s" }}
          />
          <article
            data-reveal
            className="section-shell interactive-panel edge-trace reveal relative overflow-hidden rounded-[2.4rem] border border-[rgba(170,198,223,0.14)]"
          >
            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative aspect-[16/11] lg:aspect-auto">
                <Image
                  src="/media/generated/hero-technician.png"
                  alt="Double Le HVAC technician servicing an outdoor AC unit at an Oklahoma home"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,29,58,0.2)_0%,rgba(7,29,58,0)_40%,rgba(7,29,58,0.45)_100%)] lg:bg-[linear-gradient(90deg,rgba(7,29,58,0)_58%,rgba(7,29,58,0.88)_100%)]" />
                <div className="absolute left-6 top-6 inline-flex items-center border-2 border-[var(--ice)] bg-[var(--ice)] px-3.5 py-2 text-[0.66rem] font-extrabold uppercase tracking-[0.24em] text-[#041326] sm:left-8 sm:top-8">
                  On a job
                </div>
              </div>

              <div className="brick-panel flex flex-col justify-center gap-6 p-6 sm:p-8 lg:p-10">
                <span className="eyebrow">How we work</span>
                <h2 className="heading-section text-white">
                  Show up, diagnose, fix. No runaround.
                </h2>
                <ol className="space-y-6">
                  <li className="flex items-start gap-5">
                    <span className="inline-flex h-14 w-14 flex-none items-center justify-center bg-[var(--ice)] display-heading text-2xl text-[#041326] shadow-[0_10px_24px_rgba(13,62,114,0.42)]">1</span>
                    <div>
                      <p className="display-heading text-xl text-white sm:text-2xl">Call or send the form.</p>
                      <p className="mt-2 text-base leading-7 text-[rgba(236,242,247,0.94)]">Tell us what&apos;s going on. We&apos;ll book a time that works. Usually same day.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-5">
                    <span className="inline-flex h-14 w-14 flex-none items-center justify-center bg-[var(--ice)] display-heading text-2xl text-[#041326] shadow-[0_10px_24px_rgba(13,62,114,0.42)]">2</span>
                    <div>
                      <p className="display-heading text-xl text-white sm:text-2xl">We show up in a marked truck.</p>
                      <p className="mt-2 text-base leading-7 text-[rgba(236,242,247,0.94)]">Our tech runs through your system, finds the actual issue, and tells you what it&apos;ll take.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-5">
                    <span className="inline-flex h-14 w-14 flex-none items-center justify-center bg-[var(--flame)] display-heading text-2xl text-[#1a0c05] shadow-[0_10px_24px_rgba(160,58,14,0.42)]">3</span>
                    <div>
                      <p className="display-heading text-xl text-white sm:text-2xl">Fix it right, move on.</p>
                      <p className="mt-2 text-base leading-7 text-[rgba(236,242,247,0.94)]">Most repairs done the same visit. Bigger jobs get a real quote before we start.</p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </article>
        </section>

        <section id="areas" className="mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-8 sm:scroll-mt-28 sm:px-6 lg:px-8">
          <article
            data-reveal
            className="section-shell interactive-panel edge-trace reveal relative min-h-[26rem] overflow-hidden rounded-[2.4rem] border border-[rgba(170,198,223,0.12)]"
          >
            <video
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/media/okc.jpg"
              aria-label="Double Le HVAC technician video across Oklahoma City locations"
            >
              <source src="/media/okc-location-loop.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(111,170,215,0.2),transparent_30%),linear-gradient(180deg,rgba(7,15,24,0.08)_0%,rgba(7,15,24,0.22)_24%,rgba(7,15,24,0.58)_62%,rgba(7,15,24,0.94)_100%)]" />

            <div className="relative z-10 flex min-h-[26rem] flex-col justify-end gap-6 p-6 sm:p-8 lg:p-10">
              <div className="max-w-3xl">
                <span className="eyebrow">Service area</span>
                <h2 className="heading-section mt-5 max-w-2xl text-white">
                  We cover the OKC metro.
                </h2>
                <p className="copy-soft mt-5 max-w-2xl text-lg leading-8 text-[rgba(233,240,246,0.92)]">
                  If your place is in one of these towns, we&apos;ll come out.
                  Call and tell us what&apos;s going on. We&apos;ll take it from there.
                </p>
              </div>
            </div>
          </article>

          <div className="city-marquee mt-5" aria-label="Cities we cover">
            <div className="city-marquee-track">
              {[...serviceAreas, ...serviceAreas, ...serviceAreas].map((area, i) => (
                <div key={`${area}-${i}`} className="city-ribbon city-marquee-item">
                  <span className="city-pin" aria-hidden="true" />
                  <span>{area}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <MediaStrip payload={media["field-locations"] ?? null} />

        <div className="brick-divider" aria-hidden="true" />

        <section id="faq" className="relative mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-12 sm:scroll-mt-28 sm:px-6 lg:px-8">
          <Image src="/media/generated/tool-torch.png" alt="" width={120} height={120} aria-hidden="true" className="tool-prop tool-prop--blend -bottom-4 right-6 h-20 w-20 lg:h-26 lg:w-26" style={{ ["--tilt" as string]: "18deg", animationDelay: "0.2s" }} />
          <span className="eyebrow">Common questions</span>
          <h2 className="heading-section mt-5 max-w-3xl text-white">
            Folks ask us this a lot.
          </h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {[
              {
                q: "Do you offer same-day AC repair in Oklahoma City?",
                a: "Yes. Most AC repair calls in the OKC metro we handle the same day during business hours. Call (405) 361-5014 or send a request and we'll book a real time window, not 'all day'.",
              },
              {
                q: "What cities do you service around Oklahoma City?",
                a: "We cover Oklahoma City, Edmond, Moore, Norman, Yukon, Mustang, Midwest City, and Del City. If your home is in the OKC metro, give us a call.",
              },
              {
                q: "Do you work on all HVAC brands?",
                a: "Yes. We service Carrier, Trane, Goodman, Lennox, Rheem, York, Bryant, American Standard, Ruud, Daikin, Mitsubishi, Heil, and most other major residential and commercial brands.",
              },
              {
                q: "How much does an AC repair typically cost?",
                a: "Most common AC repairs in the OKC area run between $150 and $600 depending on the part. We diagnose first and give you the price before we start work. No surprise charges.",
              },
              {
                q: "When should I replace my AC instead of repairing it?",
                a: "If your unit is over 12 years old, uses R-22 refrigerant, or the repair quote is more than half the cost of a new system, replacement usually makes sense. We'll tell you straight either way, no upsell pressure.",
              },
              {
                q: "Do you handle emergency furnace repair after hours?",
                a: "Yes. If your furnace quits on a cold night, call (405) 361-5014. We answer evenings and weekends for emergencies.",
              },
              {
                q: "How much does a new AC unit cost in Oklahoma City?",
                a: "New residential AC system installs start at $4,999 for a basic 3-ton single-stage with existing ductwork. Most homes land between $4,999 and $12,000 — final price depends on tonnage, efficiency rating, whether you're replacing just the condenser or the whole system, and the state of your ducts. Light-commercial jobs (rooftop units, small office splits) are priced after a site walk. Every job gets a load calculation and an exact price up front before we touch anything.",
              },
              {
                q: "What HVAC brands do you install in Oklahoma?",
                a: "We install and service Carrier, Trane, Goodman, Lennox, Rheem, York, Bryant, American Standard, Ruud, Daikin, Mitsubishi, and Heil. We help you pick the right system for your home and budget.",
              },
              {
                q: "How long does an AC repair take?",
                a: "Most AC repairs in the OKC metro take 30 minutes to 2 hours once our tech is on site. We carry common parts on the truck so most jobs get done in a single visit.",
              },
            ].map((item) => (
              <details key={item.q} className="group rounded-[1.4rem] border border-[rgba(143,193,237,0.22)] bg-[rgba(7,17,28,0.55)] p-5 sm:p-6">
                <summary className="display-heading flex cursor-pointer list-none items-start justify-between gap-4 text-lg text-white sm:text-xl">
                  <span>{item.q}</span>
                  <span className="mt-1 inline-flex h-7 w-7 flex-none items-center justify-center bg-[var(--ice)] text-[#041326] transition group-open:rotate-45">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className="h-4 w-4"><path d="M12 5v14M5 12h14" /></svg>
                  </span>
                </summary>
                <p className="mt-4 text-base leading-7 text-[rgba(236,242,247,0.92)]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Licensed & insured trust strip */}
        <section className="border-y border-white/8 bg-[rgba(7,17,28,0.5)] py-10">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.24em] text-[var(--copy-muted)]">Why homeowners trust us</p>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { stat: "Licensed", desc: "Oklahoma HVAC license" },
                { stat: "Insured", desc: "Full liability coverage" },
                { stat: "4.9 ★", desc: "Across 47+ reviews" },
                { stat: "Same-day", desc: "Most calls, same visit" },
                { stat: "30-day", desc: "Workmanship guarantee" },
              ].map((item) => (
                <div key={item.stat} className="brick-panel rounded-[1.2rem] p-5 text-center">
                  <p className="display-heading text-xl text-white sm:text-2xl">{item.stat}</p>
                  <p className="mt-1 text-xs text-[rgba(236,242,247,0.7)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="brick-divider" aria-hidden="true" />

        <section
          id="contact"
          className="ambient-bg-section ambient-bg-section--fire mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-8 pb-28 sm:scroll-mt-28 sm:px-6 lg:px-8"
        >
          <video
            className="ambient-bg-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src="/media/generated/fire-bg.mp4" type="video/mp4" />
          </video>
          <div className="ambient-bg-veil" aria-hidden="true" />
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
            <div className="burn-glow order-2 lg:order-1">
              <div data-reveal data-burn className="paper-shell reveal rounded-[2rem] p-6 sm:p-8 lg:p-10">
              <span className="eyebrow">Call now · We answer</span>
              <h2 className="heading-display mt-5 text-[3.4rem] leading-[0.98] sm:text-[4.2rem] lg:text-[4.8rem]">
                Got a <span className="accent">problem?</span>
                <br />
                <span className="inline-flex items-baseline gap-3">
                  Let&apos;s talk.
                </span>
              </h2>
              <p className="copy-soft mt-6 max-w-2xl text-lg leading-8">
                <span className="font-bold text-[var(--paper-ink)]">Fastest way is to call.</span>
                {" "}We answer. Or send the form and we&apos;ll get back to you same day.
              </p>

              <div className="mt-8 rounded-[1.6rem] border border-[rgba(208,75,21,0.22)] bg-white/60 p-6 shadow-[0_20px_40px_rgba(208,75,21,0.08)] sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--flame)]">
                  Best way to send a request
                </p>
                <ol className="mt-5 space-y-3">
                  {contactSteps.map((step, index) => (
                    <li
                      key={step}
                      className="flex items-start gap-3 text-sm leading-6 text-[var(--paper-ink)]"
                    >
                      <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border border-[rgba(208,75,21,0.42)] bg-[rgba(239,106,43,0.14)] text-xs font-bold text-[var(--flame)]">
                        {index + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              </div>
            </div>

            <div
              data-reveal
              className="call-card interactive-panel reveal order-1 rounded-[2rem] p-6 sm:p-7 lg:order-2 lg:sticky lg:top-28 lg:h-fit lg:self-start"
            >
                <p className="inline-block bg-[var(--ice)] px-2.5 py-1 text-sm font-extrabold uppercase tracking-[0.18em] text-[#041326]">
                  Or call us
                </p>
                <a
                  href="tel:+14053615014"
                  className="display-heading tabular-nums mt-3 block text-4xl text-white sm:text-[3.15rem]"
                >
                  (405) 361-5014
                </a>
                <p className="copy-soft mt-4 text-sm leading-7">
                  Fill out what&apos;s below and we&apos;ll call you back. Usually within the hour during business hours.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={(event) => updateField("company", event.target.value)}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label htmlFor="contact-name" className="sr-only">
                      Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      autoComplete="name"
                      placeholder="Name…"
                      className="contact-input"
                    />
                    <label htmlFor="contact-phone" className="sr-only">
                      Phone number
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="Phone number…"
                      className="contact-input"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label htmlFor="contact-email" className="sr-only">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      autoComplete="email"
                      placeholder="Email…"
                      spellCheck={false}
                      className="contact-input"
                    />
                    <label htmlFor="contact-city" className="sr-only">
                      City
                    </label>
                    <input
                      id="contact-city"
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={(event) => updateField("city", event.target.value)}
                      autoComplete="address-level2"
                      placeholder="City…"
                      className="contact-input"
                    />
                  </div>

                  <label htmlFor="contact-message" className="sr-only">
                    Service request details
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={formData.message}
                    onChange={(event) => updateField("message", event.target.value)}
                    placeholder="What's going on. AC not cooling, furnace won't start, etc."
                    rows={5}
                    className="contact-input contact-textarea"
                  />

                  {formMessage ? (
                    <p
                      className={`text-sm leading-6 ${
                        formState === "success" ? "text-emerald-300" : "text-amber-200"
                      }`}
                      aria-live="polite"
                      role="status"
                    >
                      {formMessage}
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={formState === "submitting"}
                      className="primary-button btn-gloss inline-flex flex-1 items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold uppercase tracking-[0.12em] disabled:opacity-70"
                    >
                      {formState === "submitting" ? "Sending…" : "Send it"}
                    </button>
                    <a
                      href="#top"
                      className="ghost-button inline-flex flex-1 items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold uppercase tracking-[0.12em]"
                    >
                      Back to top
                    </a>
                  </div>
                </form>
              </div>
            </div>
        </section>
      </main>

      <footer className="overflow-hidden border-t border-white/8 bg-[rgba(5,11,17,0.7)]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="relative">
            {/* Decorative tool props — hidden on mobile via .tool-prop media query */}
            <Image
              src="/media/generated/tool-capacitor.png"
              alt=""
              aria-hidden="true"
              width={140}
              height={140}
              className="tool-prop tool-prop--blend -top-2 right-6 h-32 w-32 opacity-35"
              style={{ ["--tilt" as string]: "18deg", animationDelay: "0.5s", filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.5)) blur(0.5px)" }}
            />
            <Image
              src="/media/generated/tool-drill.png"
              alt=""
              aria-hidden="true"
              width={140}
              height={140}
              className="tool-prop tool-prop--blend bottom-10 right-2 h-32 w-32 opacity-30"
              style={{ ["--tilt" as string]: "-12deg", animationDelay: "1.8s", filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.5)) blur(0.5px)" }}
            />
            <Image
              src="/media/generated/tool-battery.png"
              alt=""
              aria-hidden="true"
              width={130}
              height={130}
              className="tool-prop tool-prop--blend bottom-28 right-16 h-28 w-28 opacity-25"
              style={{ ["--tilt" as string]: "6deg", animationDelay: "3.0s", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.45)) blur(0.5px)" }}
            />
            <Image
              src="/media/generated/tool-multimeter.png"
              alt=""
              aria-hidden="true"
              width={120}
              height={120}
              className="tool-prop tool-prop--blend -bottom-2 right-20 h-24 w-24 opacity-25"
              style={{ ["--tilt" as string]: "-22deg", animationDelay: "2.5s", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.45)) blur(0.5px)" }}
            />
            <Image
              src="/media/generated/wordmark-clean.png"
              alt="Double Le · Heating and Air"
              width={480}
              height={96}
              className="h-16 w-auto max-w-full drop-shadow-[0_12px_32px_rgba(13,62,114,0.4)] sm:h-20"
            />
            <p className="mt-5 max-w-xl text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              A small Oklahoma City shop fixing heat and air for regular folks.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2" aria-hidden="true">
              <span className="inline-block bg-[var(--ember)] px-2.5 py-1 text-sm font-extrabold uppercase tracking-[0.18em] text-[#1a0c05]">Find us</span>
              <a href="/contact" aria-label="Facebook" className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d="M24 12.073C24 5.446 18.627.073 12 .073S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="/contact" aria-label="Instagram" className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919C8.416 2.175 8.796 2.163 12 2.163zM12 0C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.332 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
              <a href="/contact" aria-label="X" className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="/contact" aria-label="YouTube" className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
            <a
              href="tel:+14053615014"
              className="tabular-nums mt-5 inline-flex min-h-[44px] items-center rounded-full border border-[rgba(143,193,237,0.32)] bg-[rgba(46,136,210,0.14)] px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-[var(--ice-soft)] transition hover:border-[rgba(143,193,237,0.6)] hover:bg-[rgba(46,136,210,0.22)]"
            >
              (405) 361-5014
            </a>
            <div className="brand-sigil mt-8 max-w-xl">
              <span>Family-run · Oklahoma City</span>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="relative overflow-hidden rounded-[1.6rem] border border-[rgba(143,193,237,0.22)] bg-[rgba(7,17,28,0.6)] shadow-[0_18px_38px_rgba(0,0,0,0.42)]">
              <div className="relative aspect-[4/3]">
                <Image
                  src="/media/generated/okc-map.jpg"
                  alt="Service area map of the Oklahoma City metro"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,28,0)_60%,rgba(7,17,28,0.78)_100%)]" />
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3 sm:bottom-4 sm:left-5 sm:right-5">
                  <div>
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.28em] text-[var(--ember)]">Service area</p>
                    <p className="mt-1 text-base font-bold text-white sm:text-lg">OKC metro · 8 cities covered</p>
                  </div>
                  <span className="inline-flex items-center border-2 border-[var(--flame)] bg-[var(--flame)] px-2.5 py-1.5 text-[0.62rem] font-extrabold uppercase tracking-[0.24em] text-[#1a0c05]">
                    Live
                  </span>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {serviceAreas.slice(0, 8).map((area) => (
                <div key={area} className="city-ribbon">
                  <span className="city-pin" aria-hidden="true" />
                  <span>{area}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <div className="fixed inset-x-4 bottom-4 z-50 flex gap-3 rounded-full border border-[rgba(170,198,223,0.12)] bg-[rgba(7,15,24,0.94)] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:hidden">
        <a
          href="tel:+14053615014"
          className="primary-button btn-gloss inline-flex flex-1 items-center justify-center rounded-full px-4 py-3 text-sm font-extrabold uppercase tracking-[0.12em]"
        >
          Call
        </a>
        <a
          href="#contact"
          className="ghost-button inline-flex flex-1 items-center justify-center rounded-full px-4 py-3 text-sm font-extrabold uppercase tracking-[0.12em]"
        >
          Request
        </a>
      </div>
    </div>
  );
}
