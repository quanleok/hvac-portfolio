import Link from "next/link";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Services · Double Le HVAC | OKC Heating & Air",
  description:
    "AC repair, furnace service, new system installs, and seasonal tune-ups across the Oklahoma City metro.",
};

const services = [
  {
    eyebrow: "Cooling",
    title: "AC repair",
    body: "AC quit in the middle of July? We come out, find what's wrong, and tell you straight what it takes to fix it. Most repairs done same visit.",
    bullets: ["Capacitor / contactor replacements", "Refrigerant leak diagnostics", "Coil and condenser cleaning", "Thermostat troubleshooting"],
    tone: "cooling" as const,
  },
  {
    eyebrow: "Heating",
    title: "Furnace & heat",
    body: "Cold snap hits and your furnace won't start, call us. We service gas, electric, and heat pump. Most repairs same day.",
    bullets: ["Igniter / flame sensor", "Heat exchanger inspection", "Blower motor service", "Heat pump diagnostics"],
    tone: "heating" as const,
  },
  {
    eyebrow: "Replacement",
    title: "New system install",
    body: "If your unit's on its last leg, we'll walk you through what fits your home and your budget. No upsell, no pressure.",
    bullets: ["Right-sizing for your home", "Up-front pricing on the system + install", "Removal and disposal of old unit", "Workmanship guarantee on installs"],
    tone: "replacement" as const,
  },
  {
    eyebrow: "Maintenance",
    title: "Seasonal tune-ups",
    body: "A spring AC check and a fall furnace check catches problems before they leave you without heat or cooling.",
    bullets: ["System cleaning and inspection", "Filter replacement", "Refrigerant level check", "Safety + efficiency report"],
    tone: "maintenance" as const,
  },
];

const quickActions = [
  "AC not cooling",
  "Furnace will not start",
  "$49 diagnostic",
  "Install estimate",
];

export default function ServicesPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <span className="eyebrow">What we do</span>
            <h1 className="heading-display mt-5 max-w-3xl text-white">
              Repair, install, <span className="accent">maintain</span>.
            </h1>
            <p className="copy-soft mt-5 max-w-2xl text-lg leading-8">
              Residential and light-commercial heating and air across the OKC metro.
              Pick the problem, then call or send the request.
            </p>
          </div>

          <div className="rounded-[1.6rem] border border-[rgba(143,193,237,0.2)] bg-[rgba(7,17,28,0.6)] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ice-soft)]">
              Fast routes
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {quickActions.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-[rgba(236,242,247,0.86)]"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <a
                href="tel:+14053615014"
                className="primary-button btn-gloss inline-flex flex-1 items-center justify-center rounded-full px-4 py-3 text-xs font-extrabold uppercase tracking-[0.12em]"
              >
                Call
              </a>
              <Link
                href="/contact"
                className="ghost-button inline-flex flex-1 items-center justify-center rounded-full px-4 py-3 text-xs font-extrabold uppercase tracking-[0.12em]"
              >
                Request
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          {services.map((s) => (
            <article
              key={s.title}
              className={`service-card service-card--${s.tone} edge-trace rounded-[1.8rem] border px-7 py-7`}
            >
              <div className="relative z-10">
                <span className={`icon-sheet icon-sheet--${s.tone}`} role="img" aria-label={`${s.eyebrow} icon`} />
                <p className="service-eyebrow mt-5 text-xs font-bold uppercase tracking-[0.18em]">{s.eyebrow}</p>
                <p className="heading-card mt-2 text-white">{s.title}</p>
                <p className="mt-3 text-sm leading-7 text-[rgba(244,248,253,0.92)]">{s.body}</p>
                <ul className="mt-5 space-y-2">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm leading-6 text-[rgba(244,248,253,0.92)]">
                      <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-none rounded-full bg-[rgb(var(--tone-rgb))]" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-12 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[rgba(143,193,237,0.22)] bg-[rgba(7,17,28,0.55)] p-8 text-center sm:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ember)]">Ready to book?</p>
          <p className="display-heading mt-4 text-3xl text-white sm:text-4xl">Tell us what&apos;s going on.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:+14053615014"
              className="primary-button btn-gloss tabular-nums inline-flex items-center justify-center rounded-full px-7 py-4 text-sm font-extrabold"
            >
              Call (405) 361-5014
            </a>
            <Link
              href="/contact"
              className="ink-button btn-gloss inline-flex items-center justify-center rounded-full px-7 py-4 text-sm font-extrabold uppercase tracking-[0.12em]"
            >
              Send a request
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
