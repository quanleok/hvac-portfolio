# SEO Setup Checklist

The site code is fully prepped for ranking in OKC/Oklahoma searches. Below is what's already shipped and what you need to do manually (Google won't let an agent authenticate as you).

---

## ✅ Already in code (no action needed)

- **Local business JSON-LD** (`HVACBusiness` schema) in `app/layout.tsx` — name, phone `(405) 361-5014`, all 8 service-area cities tagged with state, opening hours (M–F 7–6, Sat 8–2), service catalog (AC repair / furnace / install / tune-up), GeoCoordinates centered on OKC.
- **Page-level metadata** with location keywords for every standalone page (`/`, `/about`, `/services-detail`, `/service-area`, `/testimonials`, `/contact`).
- **Geo meta tags** (`geo.region: US-OK`, `geo.placename: Oklahoma City`, `geo.position: 35.4676;-97.5164`, ICBM).
- **Open Graph + Twitter cards** with custom 1200x630 OG banner — link previews look branded everywhere.
- **`robots.ts`** allows everything except `/admin` + `/api`, declares sitemap.
- **`sitemap.ts`** lists all 5 public pages with priority weights.
- **GSC verification slot** wired via env var `NEXT_PUBLIC_GSC_VERIFICATION` — paste your token in Vercel env vars and it auto-renders the meta tag.

---

## 🔧 What you (the owner) must do

### 1. Google Search Console (10 min)
1. Go to https://search.google.com/search-console/welcome
2. Choose **URL prefix** property: `https://www.double-le-hvac.com`
3. Verification method: **HTML tag** — copy the content value (looks like `abc123def...`)
4. In Vercel: project → Settings → Environment Variables → add:
   - Key: `NEXT_PUBLIC_GSC_VERIFICATION`
   - Value: the token from step 3
   - Environment: Production
5. Redeploy (commit any change to main, or hit "Redeploy" in Vercel dashboard)
6. Back in GSC, click **Verify** — should pass instantly
7. In GSC sidebar: **Sitemaps** → add `sitemap.xml` → submit

### 2. Google Business Profile (CRITICAL for local pack — 30 min)
This is what gets you in the **map** results when someone searches "AC repair near me" in OKC. More important than GSC for local HVAC.

1. Go to https://business.google.com
2. Create profile: **Double Le HVAC**
3. Category: **HVAC Contractor** (primary), add **Air Conditioning Contractor** + **Furnace Repair Service** as secondary
4. Service area business: list all 8 cities (Oklahoma City, Edmond, Moore, Norman, Yukon, Mustang, Midwest City, Del City)
5. Phone: `(405) 361-5014`
6. Website: `https://www.double-le-hvac.com`
7. Hours: Mon–Fri 7am–6pm, Sat 8am–2pm
8. Verify by **postcard** (Google mails a code to the shop address — takes 1–2 weeks). Phone verification is sometimes available; try that first.
9. **Upload 5–10 real photos** — exterior of shop, vans, techs at work. Avoid AI-generated photos here; Google can sometimes detect them.
10. Add **services** matching the site's services list.
11. Ask first 5 customers for a Google review with the direct review link.

### 3. Ongoing SEO wins
- **Local backlinks**: get listed on Yelp, Angi, BBB Oklahoma, NextDoor business profile, Better Business Bureau OK, Oklahoma chambers of commerce. Each citation = trust signal.
- **Service area pages**: consider adding `/service-area/edmond`, `/service-area/norman` etc. Each can rank for "AC repair Edmond OK" type searches. Easy to extend the existing `/service-area` template.
- **Reviews flow**: when a customer is happy on the phone, immediately text them the GBP review link. Aim for 1–2 new reviews/week.
- **Content**: a `/blog` with practical posts ("why does my AC freeze up in summer", "is it worth fixing a 15-year-old furnace") earns long-tail traffic.

### 4. Verify in tools (after deploy)
- **Schema validator**: https://validator.schema.org/ → paste `https://www.double-le-hvac.com` → confirm HVACBusiness object renders
- **Rich Results Test**: https://search.google.com/test/rich-results → enter homepage URL
- **PageSpeed Insights**: https://pagespeed.web.dev/ → check Core Web Vitals (LCP/CLS/INP)

---

## Common pitfalls
- **Don't add fake reviews** — Google detects and penalizes. The avatar4/Veo testimonials are FINE on the site as social proof but never paste them as Google reviews.
- **Don't keyword-stuff** — the metadata already has the right keywords; don't add more.
- **NAP consistency**: Name / Address / Phone must match exactly across GBP, GSC, Yelp, BBB, etc. Even formatting differences ("Suite 100" vs "Ste 100") hurt rankings.

That's it. Code side is done; the rest is account setup + reputation building over weeks.
