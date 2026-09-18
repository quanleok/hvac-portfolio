import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { getSiteUrl } from "@/lib/site";
import { services, cities, serviceKeys, cityKeys, type ServiceKey, type CityKey } from "@/lib/seo-data";

export function generateStaticParams() {
  return serviceKeys.flatMap((service) =>
    cityKeys.map((city) => ({ service, city })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; city: string }>;
}): Promise<Metadata> {
  const { service, city } = await params;
  const s = services[service as ServiceKey];
  const c = cities[city as CityKey];
  if (!s || !c) return {};
  const siteUrl = getSiteUrl();
  return {
    title: `${s.name} in ${c.name}, OK`,
    description: `${s.short} for ${c.name}, Oklahoma homes. Same-day service when we can. ${s.intro.slice(0, 100)}`,
    alternates: { canonical: `/services/${service}/${city}` },
    openGraph: {
      title: `${s.name} · ${c.name}, OK`,
      description: s.intro,
      url: `${siteUrl}/services/${service}/${city}`,
      type: "website",
    },
  };
}

export default async function ServiceCityPage({
  params,
}: {
  params: Promise<{ service: string; city: string }>;
}) {
  const { service, city } = await params;
  const s = services[service as ServiceKey];
  const c = cities[city as CityKey];
  if (!s || !c) notFound();
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/services/${service}/${city}`;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: `${s.name} in ${c.name}, OK`,
    serviceType: s.name,
    description: `${s.short} for ${c.name}, Oklahoma homes. ${s.intro}`,
    provider: { "@id": `${siteUrl}/#business` },
    areaServed: {
      "@type": "City",
      name: c.name,
      containedInPlace: { "@type": "State", name: "Oklahoma" },
    },
    url,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Services", item: `${siteUrl}/services-detail` },
      { "@type": "ListItem", position: 3, name: s.name, item: `${siteUrl}/services/${service}` },
      { "@type": "ListItem", position: 4, name: c.name, item: url },
    ],
  };

  const otherCities = cityKeys.filter((k) => k !== city).slice(0, 6);
  const otherServices = serviceKeys.filter((k) => k !== service);

  return (
    <SiteShell>
      <Script id={`ld-svc-${service}-${city}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Script id={`ld-bc-${service}-${city}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
        <span className="eyebrow">{s.eyebrow} · {c.name}</span>
        <h1 className="heading-display mt-5 max-w-3xl text-white">
          {s.name} in <span className="accent">{c.name}</span>, OK.
        </h1>
        <p className="copy-soft mt-6 max-w-3xl text-lg leading-8">{s.intro}</p>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.6rem] border border-[rgba(143,193,237,0.2)] bg-[rgba(7,17,28,0.55)] p-6 sm:p-7">
            <p className="display-heading text-xl text-white sm:text-2xl">{c.name} neighborhoods</p>
            <p className="mt-3 text-base leading-7 text-[rgba(236,242,247,0.92)]">{c.landmark}</p>
          </div>
          <div className="rounded-[1.6rem] border border-[rgba(240,122,51,0.32)] bg-[rgba(240,122,51,0.06)] p-6 sm:p-7">
            <p className="display-heading text-xl text-[var(--ember)] sm:text-2xl">{s.priceHint}</p>
            <p className="mt-3 text-base leading-7 text-[rgba(236,242,247,0.92)]">Real diagnostic first, real price quote before any work. No upsell.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <p className="display-heading text-xl text-white sm:text-2xl">Common {s.short.toLowerCase()} calls in {c.name}</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {s.problems.map((p) => (
            <li key={p} className="flex items-start gap-3 rounded-[1.2rem] border border-[rgba(143,193,237,0.18)] bg-[rgba(7,17,28,0.5)] p-4">
              <span className="mt-1 inline-block h-2 w-2 flex-none bg-[var(--ice)]" />
              <span className="text-sm leading-6 text-[rgba(236,242,247,0.94)]">{p}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <p className="display-heading text-xl text-white sm:text-2xl">What&apos;s included on every {c.name} visit</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {s.included.map((p) => (
            <li key={p} className="flex items-start gap-3 rounded-[1.2rem] border border-[rgba(240,122,51,0.22)] bg-[rgba(240,122,51,0.05)] p-4">
              <span className="mt-1 inline-block h-2 w-2 flex-none bg-[var(--flame)]" />
              <span className="text-sm leading-6 text-[rgba(236,242,247,0.94)]">{p}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[rgba(143,193,237,0.22)] bg-[rgba(7,17,28,0.55)] p-8 text-center sm:p-12">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--ember)]">{c.name} {s.short.toLowerCase()}</p>
          <p className="display-heading mt-4 text-3xl text-white sm:text-4xl">{s.cta}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="tel:+14053615014" className="primary-button btn-gloss tabular-nums inline-flex items-center justify-center rounded-full px-7 py-4 text-sm font-extrabold">Call (405) 361-5014</a>
            <Link href="/contact" className="ink-button btn-gloss inline-flex items-center justify-center rounded-full px-7 py-4 text-sm font-extrabold uppercase tracking-[0.12em]">Send a request</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-8 sm:px-6 lg:px-8">
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-[var(--copy-muted)]">{s.short} in other cities</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {otherCities.map((k) => (
            <Link key={k} href={`/services/${service}/${k}`} className="city-ribbon">
              <span className="city-pin" aria-hidden="true" />
              <span>{cities[k].name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-6 lg:px-8">
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-[var(--copy-muted)]">Other services in {c.name}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {otherServices.map((k) => (
            <Link key={k} href={`/services/${k}/${city}`} className="rounded-[1.4rem] border border-[rgba(143,193,237,0.2)] bg-[rgba(7,17,28,0.55)] p-5 transition hover:border-[rgba(143,193,237,0.5)]">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--ice-soft)]">{services[k].eyebrow}</p>
              <p className="display-heading mt-2 text-lg text-white">{services[k].name} in {c.name}</p>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
