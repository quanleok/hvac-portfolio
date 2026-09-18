import Link from "next/link";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "SMS Terms · Double Le HVAC",
  description:
    "SMS messaging terms, opt-in disclosures, and consent information for the Double Le Heat and Air internal lead-notification program.",
};

export default function SmsTermsPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="space-y-2">
          <span className="eyebrow">Legal</span>
          <h1 className="heading-display mt-5 text-white">SMS Terms &amp; Opt-In Disclosure</h1>
          <p className="text-sm text-[var(--copy-muted)]">Last updated: April 27, 2026</p>
        </div>

        <p className="copy-soft mt-8 leading-7">
          This page describes the SMS messaging program operated by Double Le Heat and Air
          (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;), the disclosures required of all
          recipients before they enroll, and how recipients can stop or get help with the program.
        </p>

        <div className="mt-10 space-y-8">
          {/* Program */}
          <div>
            <h2 className="heading-section text-white">Program</h2>
            <ul className="mt-4 space-y-3 list-none">
              <li className="rounded-[1.4rem] border border-[rgba(143,193,237,0.18)] bg-[rgba(7,17,28,0.55)] p-5">
                <p className="text-sm font-bold text-[var(--copy-soft)]">Program name</p>
                <p className="mt-1 text-sm leading-7 text-[rgba(236,242,247,0.82)]">
                  Double Le HVAC Lead Notifications
                </p>
              </li>
              <li className="rounded-[1.4rem] border border-[rgba(143,193,237,0.18)] bg-[rgba(7,17,28,0.55)] p-5">
                <p className="text-sm font-bold text-[var(--copy-soft)]">Sender (toll-free)</p>
                <p className="mt-1 text-sm leading-7 text-[rgba(236,242,247,0.82)]">
                  +1 (855) 513-0259
                </p>
              </li>
              <li className="rounded-[1.4rem] border border-[rgba(143,193,237,0.18)] bg-[rgba(7,17,28,0.55)] p-5">
                <p className="text-sm font-bold text-[var(--copy-soft)]">Message content</p>
                <p className="mt-1 text-sm leading-7 text-[rgba(236,242,247,0.82)]">
                  Internal account notifications generated automatically when a customer submits the
                  contact form on{" "}
                  <a
                    href="https://www.double-le-hvac.com/contact"
                    className="text-[var(--brand-300)] underline underline-offset-2 hover:text-white transition-colors"
                  >
                    double-le-hvac.com/contact
                  </a>
                  . Each message contains the lead&rsquo;s name, phone number, city, and request
                  summary so the business owner can follow up.
                </p>
              </li>
              <li className="rounded-[1.4rem] border border-[rgba(143,193,237,0.18)] bg-[rgba(7,17,28,0.55)] p-5">
                <p className="text-sm font-bold text-[var(--copy-soft)]">Recipients</p>
                <p className="mt-1 text-sm leading-7 text-[rgba(236,242,247,0.82)]">
                  Authorized personnel of Double Le Heat and Air only. This program does{" "}
                  <strong className="text-white">not</strong> send SMS to customers, prospects, or
                  the general public. Customers who fill out our contact form do not receive SMS
                  through this program.
                </p>
              </li>
              <li className="rounded-[1.4rem] border border-[rgba(143,193,237,0.18)] bg-[rgba(7,17,28,0.55)] p-5">
                <p className="text-sm font-bold text-[var(--copy-soft)]">Frequency</p>
                <p className="mt-1 text-sm leading-7 text-[rgba(236,242,247,0.82)]">
                  Up to 10 messages per day, depending on inquiry volume. Recipients only receive a
                  message when a customer submits the website contact form.
                </p>
              </li>
              <li className="rounded-[1.4rem] border border-[rgba(143,193,237,0.18)] bg-[rgba(7,17,28,0.55)] p-5">
                <p className="text-sm font-bold text-[var(--copy-soft)]">Cost</p>
                <p className="mt-1 text-sm leading-7 text-[rgba(236,242,247,0.82)]">
                  Message and data rates may apply. We do not charge a fee to receive these
                  messages, but your wireless carrier&rsquo;s standard rates apply.
                </p>
              </li>
            </ul>
          </div>

          {/* Opt-in */}
          <div>
            <h2 className="heading-section text-white">How recipients opt in</h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              Recipients are limited to authorized personnel of Double Le Heat and Air. Each
              recipient provides express written consent before any messages are sent by signing an
              internal consent form acknowledging this disclosure. The consent form includes the
              recipient&rsquo;s full name, mobile number, the date of consent, and an
              acknowledgement of the program disclosures listed on this page.
            </p>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              No customer or member of the public is enrolled in this program. The website&rsquo;s
              public contact form does <strong className="text-white">not</strong> opt anyone into
              SMS &mdash; it only collects the information used to compose the internal notification
              sent to authorized personnel.
            </p>
          </div>

          {/* Stop & Help */}
          <div>
            <h2 className="heading-section text-white">How to stop or get help</h2>
            <ul className="mt-4 space-y-2 pl-5 list-disc marker:text-[var(--brand-300)]">
              <li className="text-sm leading-7 text-[rgba(236,242,247,0.88)]">
                Reply <strong className="text-white">STOP</strong> to any message to opt out
                immediately. We will send one final confirmation message and then stop all further
                messages to that number.
              </li>
              <li className="text-sm leading-7 text-[rgba(236,242,247,0.88)]">
                Reply <strong className="text-white">HELP</strong> for assistance, or contact us
                directly at{" "}
                <a
                  href="tel:+14053615014"
                  className="text-[var(--brand-300)] underline underline-offset-2 hover:text-white transition-colors"
                >
                  (405) 361-5014
                </a>{" "}
                or{" "}
                <a
                  href="mailto:doublelehvac@gmail.com"
                  className="text-[var(--brand-300)] underline underline-offset-2 hover:text-white transition-colors"
                >
                  doublelehvac@gmail.com
                </a>
                .
              </li>
            </ul>
          </div>

          {/* Privacy */}
          <div>
            <h2 className="heading-section text-white">Privacy</h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              Mobile phone numbers and SMS opt-in information are used solely to deliver the
              internal lead notifications described above. We do{" "}
              <strong className="text-white">not</strong> share, sell, rent, or transfer mobile
              numbers or SMS opt-in data to any third party or affiliate for marketing or
              promotional purposes. The only third party that processes this data is our SMS
              delivery provider, Twilio, and only to deliver the message itself.
            </p>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              See our{" "}
              <Link
                href="/privacy"
                className="text-[var(--brand-300)] underline underline-offset-2 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/terms"
                className="text-[var(--brand-300)] underline underline-offset-2 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>{" "}
              for additional detail.
            </p>
          </div>

          {/* Contact */}
          <div className="rounded-[1.6rem] border border-[rgba(143,193,237,0.22)] bg-[rgba(7,17,28,0.55)] p-6 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ice-soft)]">Contact</p>
            <p className="mt-3 text-sm font-bold text-white">Double Le Heat and Air</p>
            <address className="mt-2 not-italic space-y-1 text-sm text-[rgba(236,242,247,0.88)]">
              <p>Oklahoma City, OK 73170</p>
              <p>
                Phone:{" "}
                <a
                  href="tel:+14053615014"
                  className="text-[var(--brand-300)] hover:text-white transition-colors"
                >
                  (405) 361-5014
                </a>
              </p>
              <p>
                Email:{" "}
                <a
                  href="mailto:doublelehvac@gmail.com"
                  className="text-[var(--brand-300)] hover:text-white transition-colors"
                >
                  doublelehvac@gmail.com
                </a>
              </p>
            </address>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
