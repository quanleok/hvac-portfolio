import type { Metadata } from "next";
import Script from "next/script";
import { Bree_Serif, Source_Sans_3 } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const headingFont = Bree_Serif({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400"],
});

const bodyFont = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const siteUrl = getSiteUrl();

const gscToken = process.env.NEXT_PUBLIC_GSC_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Double Le HVAC | Oklahoma City AC Repair, Heating & Air",
    template: "%s | Double Le HVAC · OKC",
  },
  description:
    "Local Oklahoma City heating and air shop. AC repair, furnace work, new installs across OKC, Edmond, Norman, Moore, Yukon, Mustang, Midwest City and Del City. Same-day service when we can.",
  keywords: [
    "HVAC Oklahoma City",
    "OKC AC repair",
    "AC repair near me Oklahoma City",
    "Edmond AC repair",
    "Norman furnace repair",
    "Moore HVAC",
    "Oklahoma City heating and air",
    "OKC AC installation",
    "furnace repair Oklahoma City",
    "heat pump OKC",
    "HVAC contractor Oklahoma",
    "same day AC repair OKC",
    "emergency AC repair Oklahoma City",
    "air conditioner repair OKC",
    "HVAC service Edmond OK",
    "furnace repair near me OKC",
    "AC tune up Oklahoma City",
    "heating repair Yukon OK",
    "air conditioning Midwest City",
    "HVAC company Del City OK",
    "AC not cooling Oklahoma City",
    "new AC unit installation OKC",
    "best HVAC company Oklahoma City",
  ],
  authors: [{ name: "Double Le HVAC" }],
  category: "HVAC Service",
  alternates: {
    canonical: "/",
  },
  other: {
    "geo.region": "US-OK",
    "geo.placename": "Oklahoma City",
    "geo.position": "35.4676;-97.5164",
    ICBM: "35.4676, -97.5164",
  },
  ...(gscToken
    ? {
        verification: {
          google: gscToken,
        },
      }
    : {}),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "Double Le HVAC | OKC Heating & Air",
    description:
      "Local OKC shop for AC repair, furnace work, and new installs. You call, we pick up. Honest pricing, same-day when we can.",
    url: siteUrl,
    siteName: "Double Le HVAC",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/media/generated/og-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Double Le HVAC · Oklahoma City Heating and Air",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Double Le HVAC | OKC Heating & Air",
    description:
      "Small OKC shop for AC and furnace work. You call, we pick up. Honest pricing, same-day when we can.",
    images: ["/media/generated/og-banner.jpg"],
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "HVACBusiness",
  "@id": `${siteUrl}/#business`,
  name: "Double Le HVAC",
  image: `${siteUrl}/media/generated/og-banner.jpg`,
  logo: `${siteUrl}/icon.png`,
  url: siteUrl,
  telephone: "+1-405-361-5014",
  priceRange: "$$",
  description:
    "Family-run Oklahoma City heating and air shop. AC repair, furnace work, new installs and seasonal tune-ups across the OKC metro.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Oklahoma City",
    addressRegion: "OK",
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 35.4676,
    longitude: -97.5164,
  },
  areaServed: [
    "Oklahoma City",
    "Edmond",
    "Moore",
    "Norman",
    "Yukon",
    "Mustang",
    "Midwest City",
    "Del City",
  ].map((city) => ({
    "@type": "City",
    name: city,
    containedInPlace: { "@type": "State", name: "Oklahoma" },
  })),
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "07:00",
      closes: "18:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "08:00",
      closes: "14:00",
    },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "HVAC Services",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "AC repair" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Furnace repair" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "HVAC system installation" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Seasonal HVAC tune-up" } },
    ],
  },
  knowsAbout: [
    "AC repair",
    "Furnace repair",
    "HVAC installation",
    "Heat pump service",
    "Mini-split installation",
    "Air conditioner maintenance",
    "Gas furnace troubleshooting",
    "Refrigerant leak diagnosis",
  ],
  brand: { "@type": "Brand", name: "Double Le HVAC" },
  slogan: "Heating and air that actually works.",
  sameAs: [
    "https://g.page/r/Cd8EVs2OPqvBEAI",
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${siteUrl}/#faq`,
  mainEntity: [
    {
      "@type": "Question",
      name: "Do you offer same-day AC repair in Oklahoma City?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Yes. Most AC repair calls in the OKC metro we handle the same day during business hours. Call (405) 361-5014 or send a request and we'll book a real time window, not 'all day'.",
      },
    },
    {
      "@type": "Question",
      name: "What cities do you service around Oklahoma City?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "We cover Oklahoma City, Edmond, Moore, Norman, Yukon, Mustang, Midwest City, and Del City. If your home is in the OKC metro, give us a call.",
      },
    },
    {
      "@type": "Question",
      name: "Do you work on all HVAC brands?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Yes. We service Carrier, Trane, Goodman, Lennox, Rheem, York, Bryant, American Standard, Ruud, Daikin, Mitsubishi, Heil, and most other major residential and commercial brands.",
      },
    },
    {
      "@type": "Question",
      name: "How much does an AC repair typically cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Most common AC repairs in the OKC area run between $150 and $600 depending on the part. We diagnose first and give you the price before we start work. No surprise charges.",
      },
    },
    {
      "@type": "Question",
      name: "When should I replace my AC instead of repairing it?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "If your unit is over 12 years old, uses R-22 refrigerant, or the repair quote is more than half the cost of a new system, replacement usually makes sense. We'll tell you straight either way, no upsell pressure.",
      },
    },
    {
      "@type": "Question",
      name: "Do you handle emergency furnace repair after hours?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Yes. If your furnace quits on a cold night, call (405) 361-5014. We answer evenings and weekends for emergencies.",
      },
    },
    {
      "@type": "Question",
      name: "How much does a new AC unit cost in Oklahoma City?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "New residential AC system installs start at $4,999 for a basic 3-ton single-stage with existing ductwork. Most homes land between $4,999 and $12,000 — final price depends on tonnage, efficiency rating, whether you're replacing just the condenser or the whole system, and the state of your ducts. Light-commercial jobs (rooftop units, small office splits) are priced after a site walk. Every job gets a load calculation and an exact price up front before we touch anything.",
      },
    },
    {
      "@type": "Question",
      name: "What HVAC brands do you install in Oklahoma?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "We install and service Carrier, Trane, Goodman, Lennox, Rheem, York, Bryant, American Standard, Ruud, Daikin, Mitsubishi, and Heil. We help you pick the right system for your home and budget, not the biggest invoice.",
      },
    },
    {
      "@type": "Question",
      name: "How long does an AC repair take?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Most AC repairs in the OKC metro take 30 minutes to 2 hours once our tech is on site. We carry common parts on the truck so most jobs get done in a single visit. Larger repairs or part orders may need a follow-up.",
      },
    },
  ],
};

const reviewSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": `${siteUrl}/#service-rating`,
  name: "Double Le HVAC service",
  brand: { "@type": "Brand", name: "Double Le HVAC" },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "47",
    bestRating: "5",
    worstRating: "1",
  },
  review: [
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Linh N." },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "AC went out in a heat wave. Called Saturday morning, tech was here that same day. Found a bad capacitor, fixed in about an hour, fair price. Easiest service call I've had.",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Carlos R." },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "Two other companies tried to sell me a whole new system. Double Le took one look and said it was just the igniter. Fifteen-minute fix. Saved me four thousand dollars.",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Sarah M." },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "They actually call you back. Walked me through what was probably wrong over the phone, gave me a heads-up on the cost. Felt like talking to a neighbor.",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Tom H." },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "I'm pretty handy. Tech came out, actually showed me what was wrong, didn't try to upsell. Fixed it and went on his way. That's how it should be.",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${headingFont.variable} ${bodyFont.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="ld-local-business"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <Script
          id="ld-faq"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <Script
          id="ld-reviews"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
        />
        <a href="#top" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
