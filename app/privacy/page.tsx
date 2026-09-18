import Link from "next/link";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Privacy Policy · Double Le HVAC",
  description:
    "Privacy Policy for Double Le Heat and Air. Learn what information we collect, how we use it, and your choices.",
};

export default function PrivacyPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="space-y-2">
          <span className="eyebrow">Legal</span>
          <h1 className="heading-display mt-5 text-white">Privacy Policy</h1>
          <p className="text-sm text-[var(--copy-muted)]">Last updated: April 27, 2026</p>
        </div>

        <p className="copy-soft mt-8 leading-7">
          Double Le Heat and Air (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the website{" "}
          <a
            href="https://www.double-le-hvac.com"
            className="text-[var(--brand-300)] underline underline-offset-2 hover:text-white transition-colors"
          >
            double-le-hvac.com
          </a>{" "}
          (the &ldquo;Service&rdquo;). This Privacy Policy explains what information we collect, how we use it, and your choices.
        </p>

        <div className="mt-10 space-y-8">
          {/* Information we collect */}
          <div>
            <h2 className="heading-section text-white">Information we collect</h2>
            <ul className="mt-4 space-y-3 list-none">
              <li className="rounded-[1.4rem] border border-[rgba(143,193,237,0.18)] bg-[rgba(7,17,28,0.55)] p-5">
                <p className="text-sm font-bold text-[var(--copy-soft)]">Contact form submissions</p>
                <p className="mt-1 text-sm leading-7 text-[rgba(236,242,247,0.82)]">
                  When you submit a service request, we collect your name, phone number, optional email address, city, and the message you write.
                </p>
              </li>
              <li className="rounded-[1.4rem] border border-[rgba(143,193,237,0.18)] bg-[rgba(7,17,28,0.55)] p-5">
                <p className="text-sm font-bold text-[var(--copy-soft)]">Admin accounts (employees only)</p>
                <p className="mt-1 text-sm leading-7 text-[rgba(236,242,247,0.82)]">
                  For authorized admins, we store a username / email and hashed password via our authentication provider.
                </p>
              </li>
              <li className="rounded-[1.4rem] border border-[rgba(143,193,237,0.18)] bg-[rgba(7,17,28,0.55)] p-5">
                <p className="text-sm font-bold text-[var(--copy-soft)]">Connected social accounts (admin only)</p>
                <p className="mt-1 text-sm leading-7 text-[rgba(236,242,247,0.82)]">
                  When an admin connects a Facebook Page or YouTube Channel, we store an OAuth access token that allows us to publish posts on your behalf. No personal data from your social followers is collected or stored.
                </p>
              </li>
            </ul>
          </div>

          {/* How we use information */}
          <div>
            <h2 className="heading-section text-white">How we use information</h2>
            <ul className="mt-4 space-y-2 pl-5 list-disc marker:text-[var(--brand-300)]">
              <li className="text-sm leading-7 text-[rgba(236,242,247,0.88)]">
                Respond to service requests by phone, SMS, or email.
              </li>
              <li className="text-sm leading-7 text-[rgba(236,242,247,0.88)]">
                Schedule appointments and track follow-ups internally.
              </li>
              <li className="text-sm leading-7 text-[rgba(236,242,247,0.88)]">
                Post marketing content to connected social channels at your direction.
              </li>
            </ul>
            <p className="mt-4 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              We do <strong className="text-white">not</strong> sell or rent personal information to third parties.
            </p>
          </div>

          {/* Third-party processors */}
          <div>
            <h2 className="heading-section text-white">Third-party processors</h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              We rely on the following services to operate the site:
            </p>
            <ul className="mt-4 space-y-2 list-none">
              {[
                { name: "Supabase", detail: "database + authentication" },
                { name: "Resend", detail: "outbound transactional email" },
                { name: "Twilio", detail: "outbound SMS notifications" },
                { name: "Vercel", detail: "site hosting" },
                { name: "Meta Platforms", detail: "when a Facebook Page is connected, for publishing only" },
                { name: "Google", detail: "when a YouTube Channel is connected, for publishing only" },
              ].map(({ name, detail }) => (
                <li
                  key={name}
                  className="flex flex-wrap items-baseline gap-2 rounded-[1.2rem] border border-[rgba(143,193,237,0.14)] bg-[rgba(7,17,28,0.4)] px-5 py-3"
                >
                  <span className="text-sm font-bold text-[var(--copy-soft)]">{name}</span>
                  <span className="text-sm text-[rgba(236,242,247,0.7)]">&mdash; {detail}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-7 text-[rgba(236,242,247,0.82)]">
              Each processor receives only the information required to perform its service.
            </p>
          </div>

          {/* SMS communications */}
          <div>
            <h2 className="heading-section text-white">SMS communications</h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              We operate an internal SMS notification program that sends lead alerts from our website
              contact form to authorized personnel at Double Le Heat and Air. Recipients of this
              program are limited to our own staff who have provided express written consent to
              receive these messages.
            </p>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              Mobile phone numbers and SMS opt-in information collected for this program are used
              solely to deliver these notifications. We do{" "}
              <strong className="text-white">not</strong> share, sell, rent, or transfer mobile
              numbers or SMS opt-in data to any third party or affiliate for marketing or
              promotional purposes. The only third party that processes this data is our SMS
              delivery provider, Twilio, and only for the purpose of delivering the message itself.
            </p>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              Recipients can stop messages at any time by replying{" "}
              <strong className="text-white">STOP</strong> or get help by replying{" "}
              <strong className="text-white">HELP</strong>. Full disclosures, frequency, and cost
              information are available on our{" "}
              <Link
                href="/sms-terms"
                className="text-[var(--brand-300)] underline underline-offset-2 hover:text-white transition-colors"
              >
                SMS Terms
              </Link>{" "}
              page.
            </p>
          </div>

          {/* Data retention */}
          <div>
            <h2 className="heading-section text-white">Data retention</h2>
            <ul className="mt-4 space-y-2 pl-5 list-disc marker:text-[var(--brand-300)]">
              <li className="text-sm leading-7 text-[rgba(236,242,247,0.88)]">
                Contact form records are retained for up to 7 years for service-history purposes, then deleted.
              </li>
              <li className="text-sm leading-7 text-[rgba(236,242,247,0.88)]">
                OAuth tokens for connected social accounts are retained until the admin disconnects the account in our admin dashboard.
              </li>
            </ul>
          </div>

          {/* Data deletion requests */}
          <div>
            <h2 className="heading-section text-white">Data deletion requests</h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              To request deletion of your personal data, email{" "}
              <a
                href="mailto:doublelehvac@gmail.com"
                className="text-[var(--brand-300)] underline underline-offset-2 hover:text-white transition-colors"
              >
                doublelehvac@gmail.com
              </a>{" "}
              with the subject line &ldquo;Data deletion request&rdquo; and include the phone number or email you originally contacted us with. We will confirm deletion within 30 days.
            </p>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              Admins can request immediate deletion of connected social account tokens by disconnecting the account in the Marketing admin or emailing us.
            </p>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              You can also visit our dedicated{" "}
              <Link
                href="/data-deletion"
                className="text-[var(--brand-300)] underline underline-offset-2 hover:text-white transition-colors"
              >
                Data Deletion page
              </Link>{" "}
              for a quick-reference guide.
            </p>
          </div>

          {/* Children's privacy */}
          <div>
            <h2 className="heading-section text-white">Children&apos;s privacy</h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              Our Service is not directed to children under 13. We do not knowingly collect personal information from children.
            </p>
          </div>

          {/* Changes to this policy */}
          <div>
            <h2 className="heading-section text-white">Changes to this policy</h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top will reflect the most recent revision.
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
