import Image from "next/image";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact · Double Le HVAC | OKC Heating & Air",
  description:
    "Reach Double Le HVAC. Call us direct at (405) 361-5014 or send a request and we usually respond within the hour during business hours.",
};

export default function ContactPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-6 max-w-3xl sm:mb-8">
          <span className="eyebrow">Get in touch</span>
          <h1 className="heading-display mt-5 text-white">
            Talk to a real <span className="accent">person</span>.
          </h1>
          <p className="copy-soft mt-5 max-w-2xl text-lg leading-8">
            No call center. No automated tree. Call direct or send the form and
            we&apos;ll get right back to you.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="order-2 lg:order-1">
            <div className="mt-8 space-y-5">
              <div className="rounded-[1.6rem] border border-[rgba(143,193,237,0.18)] bg-[rgba(7,17,28,0.6)] p-6 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ice-soft)]">
                  Call us direct
                </p>
                <a
                  href="tel:+14053615014"
                  className="display-heading tabular-nums mt-3 block text-4xl text-white sm:text-5xl"
                >
                  (405) 361-5014
                </a>
                <p className="copy-soft mt-3 leading-7">
                  Open weekdays. Emergencies welcome. AC out in a heat wave or
                  furnace quit on a cold night, that&apos;s what we&apos;re here for.
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-[rgba(240,122,51,0.22)] bg-[rgba(240,122,51,0.06)] p-6 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--flame)]">
                  Service area
                </p>
                <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.92)]">
                  Oklahoma City · Edmond · Moore · Norman · Yukon · Mustang ·
                  Midwest City · Del City
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-[rgba(143,193,237,0.18)] bg-[rgba(7,17,28,0.45)] p-6 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ice-soft)]">
                  Hours
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-[rgba(236,242,247,0.92)]">
                  <li className="flex justify-between gap-4"><span>Mon – Fri</span><span className="tabular-nums text-[var(--copy-soft)]">7:00 AM – 6:00 PM</span></li>
                  <li className="flex justify-between gap-4"><span>Saturday</span><span className="tabular-nums text-[var(--copy-soft)]">8:00 AM – 2:00 PM</span></li>
                  <li className="flex justify-between gap-4"><span>Sunday</span><span className="tabular-nums text-[var(--copy-soft)]">Emergency only</span></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="call-card relative order-1 overflow-hidden rounded-[2rem] p-6 sm:p-7 lg:order-2 lg:sticky lg:top-28">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--copy-muted)]">
              Send a request
            </p>
            <p className="display-heading mt-2 text-3xl text-white sm:text-4xl">
              Tell us what&apos;s going on.
            </p>
            <p className="copy-soft mt-3 text-sm leading-7">
              Fill what&apos;s below and we&apos;ll call you back. Usually within the
              hour during business hours.
            </p>
            <ContactForm className="mt-6" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[1.8rem] border border-[rgba(143,193,237,0.18)] bg-[rgba(7,17,28,0.55)]">
          <div className="relative aspect-[16/9]">
            <Image
              src="/media/generated/okc-map.jpg"
              alt="Service area map of the Oklahoma City metro"
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
