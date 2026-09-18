import Link from "next/link";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { TestimonialVideoRotator } from "@/components/testimonial-video-rotator";

export const metadata: Metadata = {
  title: "Reviews · Double Le HVAC | OKC Heating & Air",
  description:
    "Hear from real Oklahoma City customers about their experience with Double Le HVAC.",
};

export default function TestimonialsPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
        <span className="eyebrow">What folks say</span>
        <h1 className="heading-display mt-5 max-w-3xl text-white">
          Hear from <span className="accent">real customers</span>.
        </h1>
        <p className="copy-soft mt-6 max-w-2xl text-lg leading-8">
          Quick takes from neighbors around the OKC metro. Tap a video to play.
        </p>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-12 sm:px-6 lg:px-8">
        <TestimonialVideoRotator />
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-12 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[rgba(143,193,237,0.22)] bg-[rgba(7,17,28,0.55)] p-8 text-center sm:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ember)]">Want to be next?</p>
          <p className="display-heading mt-4 text-3xl text-white sm:text-4xl">Let&apos;s get you taken care of.</p>
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
