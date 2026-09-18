import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Service Area · Double Le HVAC | OKC Heating & Air",
  description:
    "Double Le HVAC covers the Oklahoma City metro: Edmond, Moore, Norman, Yukon, Mustang, Midwest City, Del City and OKC proper.",
};

const cities = [
  { name: "Oklahoma City", slug: "oklahoma-city" },
  { name: "Edmond", slug: "edmond" },
  { name: "Moore", slug: "moore" },
  { name: "Norman", slug: "norman" },
  { name: "Yukon", slug: "yukon" },
  { name: "Mustang", slug: "mustang" },
  { name: "Midwest City", slug: "midwest-city" },
  { name: "Del City", slug: "del-city" },
];

export default function ServiceAreaPage() {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <span className="eyebrow">Where we go</span>
            <h1 className="heading-display mt-5 max-w-3xl text-white">
              Eight cities. <span className="accent">One metro</span>.
            </h1>
            <p className="copy-soft mt-5 max-w-2xl text-lg leading-8">
              If your place is in one of these towns, we&apos;ll come out. Most
              daytime calls are at the door within a few hours.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="tel:+14053615014"
                className="primary-button btn-gloss tabular-nums inline-flex items-center justify-center rounded-full px-7 py-4 text-sm font-extrabold"
              >
                Call (405) 361-5014
              </a>
              <Link
                href="/contact"
                className="ghost-button inline-flex items-center justify-center rounded-full px-7 py-4 text-sm font-extrabold uppercase tracking-[0.12em]"
              >
                Send a request
              </Link>
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-[rgba(143,193,237,0.2)] bg-[rgba(7,17,28,0.6)] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ice-soft)]">
              Covered cities
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {cities.map((city) => (
                <Link key={city.slug} href={`/service-area/${city.slug}`} className="city-ribbon">
                  <span className="city-pin" aria-hidden="true" />
                  <span>{city.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[1.8rem] border border-[rgba(143,193,237,0.22)] bg-[rgba(7,17,28,0.55)]">
          <div className="relative aspect-[16/11] sm:aspect-[16/8]">
            <Image
              src="/media/generated/okc-map.jpg"
              alt="Service area map of the Oklahoma City metro"
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-8 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[rgba(143,193,237,0.22)] bg-[rgba(7,17,28,0.55)] p-8 text-center sm:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ember)]">Outside this list?</p>
          <p className="display-heading mt-4 text-3xl text-white sm:text-4xl">Call and ask.</p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[rgba(236,242,247,0.88)]">
            We&apos;ll often go beyond the metro for established customers or
            larger jobs. Easiest way to know is to call.
          </p>
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
