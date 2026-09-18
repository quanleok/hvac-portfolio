import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Terms of Service · Double Le HVAC",
  description:
    "Terms of Service for Double Le Heat and Air. Governs your use of double-le-hvac.com and related services.",
};

export default function TermsPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="space-y-2">
          <span className="eyebrow">Legal</span>
          <h1 className="heading-display mt-5 text-white">Terms of Service</h1>
          <p className="text-sm text-[var(--copy-muted)]">Last updated: April 20, 2026</p>
        </div>

        <p className="copy-soft mt-8 leading-7">
          These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the website{" "}
          <span className="text-[var(--copy-soft)]">double-le-hvac.com</span> and related services operated by Double Le Heat and Air (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;). By using the Service you agree to these Terms.
        </p>

        <div className="mt-10 space-y-8">
          {/* Services */}
          <div>
            <h2 className="heading-section text-white">Services</h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              We provide residential and light-commercial HVAC installation, repair, and maintenance services in the Oklahoma City metropolitan area. Service requests submitted through the Service are responded to as soon as reasonably possible but we do not guarantee response times.
            </p>
          </div>

          {/* Acceptable use */}
          <div>
            <h2 className="heading-section text-white">Acceptable use</h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">You agree not to:</p>
            <ul className="mt-3 space-y-2 pl-5 list-disc marker:text-[var(--brand-300)]">
              <li className="text-sm leading-7 text-[rgba(236,242,247,0.88)]">
                Submit false or misleading information via the Service.
              </li>
              <li className="text-sm leading-7 text-[rgba(236,242,247,0.88)]">
                Attempt to access any non-public area of the Service without authorization.
              </li>
              <li className="text-sm leading-7 text-[rgba(236,242,247,0.88)]">
                Use the Service to distribute spam or unlawful content.
              </li>
            </ul>
          </div>

          {/* Intellectual property */}
          <div>
            <h2 className="heading-section text-white">Intellectual property</h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              All content on the Service &mdash; including text, images, logos, and code &mdash; is owned by Double Le Heat and Air or its licensors and is protected by copyright and trademark law. You may not reproduce or distribute any part of the Service without our prior written permission.
            </p>
          </div>

          {/* Disclaimer of warranties */}
          <div>
            <h2 className="heading-section text-white">Disclaimer of warranties</h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, error-free, or free of harmful components.
            </p>
          </div>

          {/* Limitation of liability */}
          <div>
            <h2 className="heading-section text-white">Limitation of liability</h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              To the maximum extent permitted by law, Double Le Heat and Air is not liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the Service.
            </p>
          </div>

          {/* Governing law */}
          <div>
            <h2 className="heading-section text-white">Governing law</h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              These Terms are governed by the laws of the State of Oklahoma, without regard to conflict-of-law principles. Any dispute arising under these Terms will be resolved in the state or federal courts located in Oklahoma County, Oklahoma.
            </p>
          </div>

          {/* Changes to these Terms */}
          <div>
            <h2 className="heading-section text-white">Changes to these Terms</h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(236,242,247,0.88)]">
              We may revise these Terms at any time. Your continued use of the Service after changes take effect constitutes acceptance of the revised Terms.
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
