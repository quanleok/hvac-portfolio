import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "About · Double Le HVAC | OKC Heating & Air",
  description:
    "Family-run Oklahoma City heating and air shop. Real techs, real trucks, no call center. Meet the team behind Double Le HVAC.",
};

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <span className="eyebrow">About us</span>
            <h1 className="heading-display mt-5 text-white">
              A small shop that <span className="accent">picks up the phone</span>.
            </h1>
            <p className="copy-soft mt-6 max-w-2xl text-lg leading-8">
              Double Le HVAC is a family-run heating and air business serving
              the Oklahoma City metro. We&apos;re not a franchise. We don&apos;t have a
              call center. When you ring the number, you&apos;re talking to one of
              the same people who&apos;ll show up at your door.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Stat title="Local" detail="Shop based in Oklahoma City. We live where we work." />
              <Stat title="Honest" detail="No upsells, no scare tactics, real quotes before we start." />
              <Stat title="Fast" detail="Most repairs done same visit. Real time windows, not 'all day'." />
              <Stat title="Standby" detail="Emergency calls answered weekends and after hours." />
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-[rgba(143,193,237,0.18)]">
            <Image
              src="/media/generated/hero-technician.png"
              alt="Double Le HVAC technician working on an outdoor unit"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,28,0)_45%,rgba(7,17,28,0.92)_100%)]" />
            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.28em] text-[var(--ember)]">On the job</p>
              <p className="mt-2 text-lg font-bold text-white">Same techs from the first call to the fix.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <h2 className="heading-section text-white">How we got here.</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Block
            title="Started small"
            body="Began with one truck and a goal: do the work right and treat people fair. Word got around, and it still works."
          />
          <Block
            title="Stayed small on purpose"
            body="We keep the team tight so every job gets the same care. No middlemen, no rotating crews, no hand-offs."
          />
          <Block
            title="Built around the metro"
            body="Most of our calls are within 30 minutes of the shop. We know these neighborhoods because we live in them."
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-12 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[rgba(143,193,237,0.22)] bg-[rgba(7,17,28,0.55)] p-8 text-center sm:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ember)]">Need work done?</p>
          <p className="display-heading mt-4 text-3xl text-white sm:text-4xl">Let&apos;s get it handled.</p>
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

function Stat({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[1.4rem] border border-[rgba(143,193,237,0.2)] bg-[rgba(7,17,28,0.55)] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ice-soft)]">{title}</p>
      <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.92)]">{detail}</p>
    </div>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.6rem] border border-[rgba(143,193,237,0.18)] bg-[rgba(7,17,28,0.55)] p-6 sm:p-7">
      <p className="heading-card text-white">{title}</p>
      <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">{body}</p>
    </div>
  );
}
