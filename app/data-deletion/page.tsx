import Link from "next/link";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Data Deletion Request · Double Le HVAC",
  description:
    "Request deletion of your personal data from Double Le Heat and Air. Email us with the subject 'Data deletion request'.",
};

export default function DataDeletionPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="space-y-2">
          <span className="eyebrow">Legal</span>
          <h1 className="heading-display mt-5 text-white">Data deletion request</h1>
          <p className="text-sm text-[var(--copy-muted)]">Last updated: April 20, 2026</p>
        </div>

        <p className="copy-soft mt-8 leading-7">
          To request deletion of your personal data from Double Le Heat and Air&apos;s systems, email{" "}
          <a
            href="mailto:doublelehvac@gmail.com?subject=Data%20deletion%20request"
            className="text-[var(--brand-300)] underline underline-offset-2 hover:text-white transition-colors"
          >
            doublelehvac@gmail.com
          </a>{" "}
          with:
        </p>

        <ul className="mt-4 space-y-2 pl-5 list-disc marker:text-[var(--brand-300)]">
          <li className="text-sm leading-7 text-[rgba(236,242,247,0.88)]">
            Subject line: <strong className="text-white">Data deletion request</strong>
          </li>
          <li className="text-sm leading-7 text-[rgba(236,242,247,0.88)]">
            The phone number or email address you originally used to contact us
          </li>
        </ul>

        <p className="mt-6 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
          We will confirm deletion within 30 days.
        </p>

        <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
          For more detail on what data we collect and how we store it, see our{" "}
          <Link
            href="/privacy"
            className="text-[var(--brand-300)] underline underline-offset-2 hover:text-white transition-colors"
          >
            Privacy Policy
          </Link>.
        </p>

        <div className="mt-10 rounded-[1.6rem] border border-[rgba(143,193,237,0.22)] bg-[rgba(7,17,28,0.55)] p-6 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ice-soft)]">Quick links</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link
                href="/privacy"
                className="text-[var(--brand-300)] underline underline-offset-2 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="text-[var(--brand-300)] underline underline-offset-2 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
            </li>
            <li className="text-[rgba(236,242,247,0.88)]">
              Contact:{" "}
              <a
                href="mailto:doublelehvac@gmail.com"
                className="text-[var(--brand-300)] hover:text-white transition-colors"
              >
                doublelehvac@gmail.com
              </a>{" "}
              &middot;{" "}
              <a
                href="tel:+14053615014"
                className="text-[var(--brand-300)] hover:text-white transition-colors"
              >
                (405) 361-5014
              </a>
            </li>
          </ul>
        </div>
      </section>
    </SiteShell>
  );
}
