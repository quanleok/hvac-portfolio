"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { mobileNavLinks } from "@/lib/site-navigation";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const canUsePortal = typeof document !== "undefined";

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close menu" : "Open menu"}
        className="relative inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-full border border-[rgba(143,193,237,0.32)] bg-[rgba(46,136,210,0.14)] text-white md:hidden"
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <span aria-hidden="true" className="relative block h-4 w-5">
          <span
            className={`absolute left-0 top-0 h-0.5 w-full bg-current transition-transform duration-200 ${
              open ? "translate-y-[7px] rotate-45" : ""
            }`}
          />
          <span
            className={`absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-current transition-opacity duration-200 ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute bottom-0 left-0 h-0.5 w-full bg-current transition-transform duration-200 ${
              open ? "-translate-y-[7px] -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {open && canUsePortal
        ? createPortal(
            <div
              id="mobile-nav-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              className="fixed inset-0 z-[1000] flex overscroll-contain bg-[rgba(5,11,17,0.98)] text-white backdrop-blur-xl md:hidden"
            >
              <div className="flex min-h-0 w-full flex-col">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <p className="display-heading text-2xl leading-none">Menu</p>
                    <p className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[var(--copy-muted)]">
                      Double Le HVAC
                    </p>
                  </div>
                  <button
                    type="button"
                    autoFocus
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-full border border-[rgba(143,193,237,0.32)] bg-[rgba(46,136,210,0.14)] text-white"
                    aria-label="Close menu"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <path d="M4 4l10 10M14 4 4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                <nav
                  aria-label="Primary mobile navigation"
                  className="flex flex-1 overscroll-contain flex-col gap-1 overflow-y-auto px-5 py-6"
                >
                  {mobileNavLinks.map((link) => {
                    const isActive =
                      link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={`touch-manipulation rounded-2xl border px-4 py-4 text-lg font-extrabold uppercase tracking-[0.12em] transition ${
                          isActive
                            ? "border-[rgba(143,193,237,0.38)] bg-[rgba(46,136,210,0.18)] text-white"
                            : "border-transparent text-white hover:border-[rgba(143,193,237,0.32)] hover:bg-[rgba(46,136,210,0.14)]"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="flex flex-col gap-3 border-t border-white/10 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5">
                  <Link
                    href="/contact"
                    onClick={() => setOpen(false)}
                    className="ink-button btn-gloss inline-flex touch-manipulation items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold uppercase tracking-[0.12em]"
                  >
                    Send a request
                  </Link>
                  <a
                    href="tel:+14053615014"
                    onClick={() => setOpen(false)}
                    className="primary-button btn-gloss tabular-nums inline-flex touch-manipulation items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold"
                  >
                    Call (405) 361-5014
                  </a>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
