import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { getSiteUrl } from "@/lib/site";

type CityKey =
  | "oklahoma-city"
  | "edmond"
  | "moore"
  | "norman"
  | "yukon"
  | "mustang"
  | "midwest-city"
  | "del-city";

const cities: Record<CityKey, { name: string; tagline: string; intro: string; landmark: string }> = {
  "oklahoma-city": {
    name: "Oklahoma City",
    tagline: "OKC's local heating and air shop.",
    intro:
      "We're based right here in OKC. Most calls inside the city we're at the door within a couple hours during the day. Real techs in marked trucks, no call center.",
    landmark: "From Bricktown to the Paseo, the Asian District to Capitol Hill, we know these neighborhoods.",
  },
  edmond: {
    name: "Edmond",
    tagline: "AC repair and furnace work in Edmond, OK.",
    intro:
      "Edmond is one of our most-served cities. Whether you're up by UCO, off Coffee Creek, or out near the lake, we've been there before.",
    landmark: "From the Bryant corridor to Coffee Creek to the lakefront subdivisions, we've worked in most of Edmond.",
  },
  moore: {
    name: "Moore",
    tagline: "Heating and air service for Moore, OK homes.",
    intro:
      "Moore homes get hammered by Oklahoma summers. We service every major brand and most repairs are done same visit.",
    landmark: "From the I-35 corridor to the older neighborhoods around Central, we cover all of Moore.",
  },
  norman: {
    name: "Norman",
    tagline: "AC and furnace repair in Norman, Oklahoma.",
    intro:
      "Norman calls are a regular part of our week. Campus rentals, family homes, lake-area properties — we work on all of it.",
    landmark: "From Campus Corner to Brookhaven to the lake side, we know Norman.",
  },
  yukon: {
    name: "Yukon",
    tagline: "Yukon, OK heating and air specialists.",
    intro:
      "Yukon's grown a lot and so have the calls. Same-day service when we can, real quotes before we start anything bigger.",
    landmark: "From Mustang Road to Czech Hall to the new builds out west, we cover Yukon.",
  },
  mustang: {
    name: "Mustang",
    tagline: "AC repair and furnace service in Mustang, OK.",
    intro:
      "Mustang's a quick run from the shop. Most repairs done the same visit, real quote before we start anything bigger.",
    landmark: "From the schools area to the newer subdivisions out west, we know Mustang well.",
  },
  "midwest-city": {
    name: "Midwest City",
    tagline: "Heating and air for Midwest City, Oklahoma.",
    intro:
      "Midwest City is right next door. We service the older brick homes and the newer builds alike, all the major HVAC brands.",
    landmark: "From Tinker AFB neighborhoods to Soldier Creek to Reno corridor, we've worked all over MWC.",
  },
  "del-city": {
    name: "Del City",
    tagline: "Del City, OK AC and furnace repair.",
    intro:
      "Del City calls are a regular run for us. Honest pricing, real quotes, and a real person on the phone every time.",
    landmark: "From Sooner Road over to Sunnylane and across to the older Vickie Drive area, we cover Del City.",
  },
};

const cityKeys = Object.keys(cities) as CityKey[];

export function generateStaticParams() {
  return cityKeys.map((city) => ({ city }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const data = cities[city as CityKey];
  if (!data) return {};
  const siteUrl = getSiteUrl();
  return {
    title: `${data.name} AC Repair & Heating Service`,
    description: `${data.tagline} Same-day service when we can across ${data.name}. AC repair, furnace work, new installs by Double Le HVAC.`,
    alternates: { canonical: `/service-area/${city}` },
    openGraph: {
      title: `${data.name} HVAC · Double Le`,
      description: data.tagline,
      url: `${siteUrl}/service-area/${city}`,
      type: "website",
    },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const data = cities[city as CityKey];
  if (!data) notFound();

  const otherCities = cityKeys.filter((k) => k !== city).slice(0, 6);
  const siteUrl = getSiteUrl();
  const cityUrl = `${siteUrl}/service-area/${city}`;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${cityUrl}#service`,
    name: `HVAC Service in ${data.name}, OK`,
    serviceType: "HVAC repair, installation, and maintenance",
    provider: { "@id": `${siteUrl}/#business` },
    areaServed: {
      "@type": "City",
      name: data.name,
      containedInPlace: { "@type": "State", name: "Oklahoma" },
    },
    url: cityUrl,
    description: `${data.tagline} Same-day AC repair, furnace work, and new installs in ${data.name}, Oklahoma.`,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${data.name} HVAC services`,
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: `AC repair in ${data.name}` } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: `Furnace repair in ${data.name}` } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: `HVAC installation in ${data.name}` } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: `Seasonal HVAC tune-up in ${data.name}` } },
      ],
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Service Area", item: `${siteUrl}/service-area` },
      { "@type": "ListItem", position: 3, name: data.name, item: cityUrl },
    ],
  };

  return (
    <SiteShell>
      <Script
        id={`ld-service-${city}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <Script
        id={`ld-breadcrumbs-${city}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
        <span className="eyebrow">{data.name}, OK</span>
        <h1 className="heading-display mt-5 max-w-3xl text-white">
          {data.tagline.replace(data.name, "").trim() || data.tagline}
        </h1>
        <p className="copy-soft mt-6 max-w-3xl text-lg leading-8">{data.intro}</p>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[1.8rem] border border-[rgba(143,193,237,0.22)] bg-[rgba(7,17,28,0.55)]">
          <div className="relative aspect-[4/3] sm:aspect-[16/9]">
            <Image
              src="/media/generated/okc-map.jpg"
              alt={`Service area map showing ${data.name} in the OKC metro`}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.6rem] border border-[rgba(143,193,237,0.2)] bg-[rgba(7,17,28,0.55)] p-6 sm:p-7">
            <p className="display-heading text-2xl text-white sm:text-3xl">{data.name} neighborhoods</p>
            <p className="mt-3 text-base leading-7 text-[rgba(236,242,247,0.92)]">{data.landmark}</p>
          </div>
          <div className="rounded-[1.6rem] border border-[rgba(240,122,51,0.32)] bg-[rgba(240,122,51,0.06)] p-6 sm:p-7">
            <p className="display-heading text-2xl text-[var(--ember)] sm:text-3xl">Same-day, when we can</p>
            <p className="mt-3 text-base leading-7 text-[rgba(236,242,247,0.92)]">
              Most {data.name} repairs we wrap the same visit. Bigger jobs get a
              real quote before we start. Call (405) 361-5014 or send the form.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-12 sm:px-6 lg:px-8">
        <p className="display-heading text-xl text-white sm:text-2xl">What we handle in {data.name}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { tag: "Cooling", title: "AC repair", body: "Quick diagnosis, fair price, most fixes done the same visit." },
            { tag: "Heating", title: "Furnace & heat", body: "Gas, electric, heat pump. Real diagnosis, no scare tactics." },
            { tag: "Replacement", title: "New system install", body: "Right-sized for your home, up-front pricing, real workmanship." },
            { tag: "Maintenance", title: "Seasonal tune-ups", body: "Spring AC + fall furnace checks catch problems early." },
          ].map((s) => (
            <div key={s.title} className="rounded-[1.4rem] border border-[rgba(143,193,237,0.2)] bg-[rgba(7,17,28,0.55)] p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--ice-soft)]">{s.tag}</p>
              <p className="display-heading mt-2 text-lg text-white">{s.title}</p>
              <p className="mt-2 text-sm leading-6 text-[rgba(236,242,247,0.88)]">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-12 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-[rgba(143,193,237,0.22)] bg-[rgba(7,17,28,0.55)] p-8 text-center sm:p-12">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--ember)]">Need work in {data.name}?</p>
          <p className="display-heading mt-4 text-3xl text-white sm:text-4xl">Call us. We answer.</p>
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

      <section className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-6 lg:px-8">
        <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-[var(--copy-muted)]">Other cities we cover</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {otherCities.map((k) => (
            <Link
              key={k}
              href={`/service-area/${k}`}
              className="city-ribbon"
            >
              <span className="city-pin" aria-hidden="true" />
              <span>{cities[k].name}</span>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
