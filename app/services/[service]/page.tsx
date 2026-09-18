import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { getSiteUrl } from "@/lib/site";
import { services, cities, serviceKeys, cityKeys, type ServiceKey } from "@/lib/seo-data";

export function generateStaticParams() {
  return serviceKeys.map((service) => ({ service }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string }>;
}): Promise<Metadata> {
  const { service } = await params;
  const data = services[service as ServiceKey];
  if (!data) return {};
  const siteUrl = getSiteUrl();
  return {
    title: `${data.name} in Oklahoma City`,
    description: `${data.intro.slice(0, 155)}`,
    alternates: { canonical: `/services/${service}` },
    openGraph: {
      title: `${data.name} · Double Le HVAC OKC`,
      description: data.intro,
      url: `${siteUrl}/services/${service}`,
      type: "website",
    },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service } = await params;
  const data = services[service as ServiceKey];
  if (!data) notFound();
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/services/${service}`;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: `${data.name} · Oklahoma City`,
    serviceType: data.name,
    description: data.intro,
    provider: { "@id": `${siteUrl}/#business` },
    areaServed: cityKeys.map((k) => ({
      "@type": "City",
      name: cities[k].name,
      containedInPlace: { "@type": "State", name: "Oklahoma" },
    })),
    url,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Services", item: `${siteUrl}/services-detail` },
      { "@type": "ListItem", position: 3, name: data.name, item: url },
    ],
  };

  const otherServices = serviceKeys.filter((k) => k !== service);

  return (
    <SiteShell>
      <Script id={`ld-service-${service}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Script id={`ld-breadcrumb-${service}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
        <span className="eyebrow">{data.eyebrow}</span>
        <h1 className="heading-display mt-5 max-w-3xl text-white">
          {data.name} <span className="accent">in Oklahoma City</span>
        </h1>
        <p className="copy-soft mt-6 max-w-3xl text-lg leading-8">{data.intro}</p>
      </section>

      <Block title="Common problems we see" items={data.problems} tone="ice" />
      <Block title="What we fix" items={data.fixes} tone="flame" />
      <Block title="What's included on every visit" items={data.included} tone="ice" />

      <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <p className="display-heading text-xl text-white sm:text-2xl">Pricing</p>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[rgba(236,242,247,0.92)]">{data.priceHint} Final price comes after on-site diagnostic, before we start work. No surprise add-ons.</p>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <p className="display-heading text-xl text-white sm:text-2xl">{data.short} by city</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {cityKeys.map((c) => (
            <Link key={c} href={`/services/${service}/${c}`} className="city-ribbon">
              <span className="city-pin" aria-hidden="true" />
              <span>{cities[c].name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-12 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[rgba(143,193,237,0.22)] bg-[rgba(7,17,28,0.55)] p-8 text-center sm:p-12">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--ember)]">{data.cta.split("·")[0].trim()}</p>
          <p className="display-heading mt-4 text-3xl text-white sm:text-4xl">{data.cta}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="tel:+14053615014" className="primary-button btn-gloss tabular-nums inline-flex items-center justify-center rounded-full px-7 py-4 text-sm font-extrabold">Call (405) 361-5014</a>
            <Link href="/contact" className="ink-button btn-gloss inline-flex items-center justify-center rounded-full px-7 py-4 text-sm font-extrabold uppercase tracking-[0.12em]">Send a request</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-6 lg:px-8">
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-[var(--copy-muted)]">Other services we handle</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {otherServices.map((k) => (
            <Link key={k} href={`/services/${k}`} className="rounded-[1.4rem] border border-[rgba(143,193,237,0.2)] bg-[rgba(7,17,28,0.55)] p-5 transition hover:border-[rgba(143,193,237,0.5)]">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--ice-soft)]">{services[k].eyebrow}</p>
              <p className="display-heading mt-2 text-lg text-white">{services[k].name}</p>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}

function Block({ title, items, tone }: { title: string; items: string[]; tone: "ice" | "flame" }) {
  const accent = tone === "ice" ? "var(--ice)" : "var(--flame)";
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <p className="display-heading text-xl text-white sm:text-2xl">{title}</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 rounded-[1.2rem] border border-[rgba(143,193,237,0.18)] bg-[rgba(7,17,28,0.5)] p-4">
            <span className="mt-1 inline-block h-2 w-2 flex-none" style={{ background: accent }} />
            <span className="text-sm leading-6 text-[rgba(236,242,247,0.94)]">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
