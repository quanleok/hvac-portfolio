import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { PromoBanner } from "@/components/promo-banner";
import { footerNavLinks, publicNavLinks } from "@/lib/site-navigation";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--ink)]">
      <header className="site-header sticky inset-x-0 top-0 z-50 border-b border-[rgba(197,223,247,0.18)] backdrop-blur-xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage: "url('/media/generated/brand-overlay-clean.png')",
            backgroundSize: "260px auto",
            backgroundRepeat: "repeat",
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,17,0.86)_0%,rgba(5,11,17,0.92)_100%)]" />
        <div className="relative z-[1] mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <Image
              src="/media/generated/dl-mark.png"
              alt="Double Le HVAC"
              width={44}
              height={44}
              priority
              className="h-11 w-11 rounded-2xl shadow-[0_14px_28px_rgba(13,62,114,0.36)] transition group-hover:shadow-[0_18px_36px_rgba(13,62,114,0.52)] group-hover:scale-105"
            />
            <div>
              <p className="display-heading text-2xl leading-none text-white">Double Le</p>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.26em] text-[var(--copy-muted)]">
                HVAC · OKC
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--copy-soft)] md:flex">
            {publicNavLinks.map((link) => (
              <Link key={link.href} className="transition hover:text-white" href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="/contact"
                className="ink-button btn-gloss inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold uppercase tracking-[0.12em]"
              >
                Send a request
              </Link>
              <a
                href="tel:+14053615014"
                className="primary-button btn-gloss tabular-nums inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold"
              >
                Call (405) 361-5014
              </a>
            </div>

            <a
              href="tel:+14053615014"
              className="primary-button inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] sm:hidden"
            >
              Call
            </a>

            <MobileNav />
          </div>
        </div>
        <PromoBanner />
      </header>

      <main id="top" tabIndex={-1}>
        {children}
      </main>

      <footer className="overflow-hidden border-t border-white/8 bg-[rgba(5,11,17,0.7)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-10 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
          <div className="relative">
            {/* Decorative tool props — hidden on mobile via .tool-prop media query */}
            <Image
              src="/media/generated/tool-torch.png"
              alt=""
              aria-hidden="true"
              width={120}
              height={120}
              className="tool-prop tool-prop--blend -top-2 right-8 h-28 w-28 opacity-35"
              style={{ ["--tilt" as string]: "20deg", animationDelay: "0.3s", filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.5)) blur(0.5px)" }}
            />
            <Image
              src="/media/generated/tool-wrench.png"
              alt=""
              aria-hidden="true"
              width={140}
              height={140}
              className="tool-prop tool-prop--blend -bottom-2 right-0 h-32 w-32 opacity-30"
              style={{ ["--tilt" as string]: "-14deg", animationDelay: "1.4s", filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.5)) blur(0.5px)" }}
            />
            <Image
              src="/media/generated/tool-screws.png"
              alt=""
              aria-hidden="true"
              width={120}
              height={120}
              className="tool-prop tool-prop--blend bottom-12 right-20 h-24 w-24 opacity-25"
              style={{ ["--tilt" as string]: "8deg", animationDelay: "2.1s", filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.45)) blur(0.5px)" }}
            />
            <Image
              src="/media/generated/wordmark-clean.png"
              alt="Double Le · Heating and Air"
              width={360}
              height={72}
              className="h-14 w-auto max-w-full drop-shadow-[0_12px_32px_rgba(13,62,114,0.4)] sm:h-16"
            />
            <p className="mt-4 max-w-md text-sm leading-7 text-[rgba(236,242,247,0.84)]">
              A small Oklahoma City shop fixing heat and air for regular folks.
            </p>
            <a
              href="tel:+14053615014"
              className="tabular-nums mt-4 inline-flex min-h-[44px] items-center rounded-full border border-[rgba(143,193,237,0.32)] bg-[rgba(46,136,210,0.14)] px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-[var(--ice-soft)]"
            >
              (405) 361-5014
            </a>
          </div>
          <nav className="flex flex-col gap-2 text-sm text-[var(--copy-soft)]">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.28em] text-[var(--copy-muted)]">Pages</p>
            {footerNavLinks.map((link) => (
              <Link key={link.href} className="transition hover:text-white" href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <nav className="flex flex-col gap-2 text-sm text-[var(--copy-soft)]">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.28em] text-[var(--copy-muted)]">Legal</p>
            <Link className="transition hover:text-white" href="/privacy">Privacy Policy</Link>
            <Link className="transition hover:text-white" href="/terms">Terms of Service</Link>
            <Link className="transition hover:text-white" href="/data-deletion">Data Deletion</Link>
          </nav>
          <div className="brand-sigil max-w-xs">
            <span>Family-run · Oklahoma City</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
