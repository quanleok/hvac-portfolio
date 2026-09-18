# HVAC Service Management

Next.js business website and service-management application with scheduling, customer records, estimates, and an admin workspace.

## Project overview

**Stack:** Next.js, React, TypeScript and Supabase.

**Implemented work:** Business website, service scheduling, customer and job records, and administrative workflows.

**Status and limits:** Business data, consent records, service credentials, and operational notes must stay private. This repository is not a public sample dataset.

## Development documentation

Standalone Next.js marketing site for an Oklahoma City area heating and air service business.

### Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- App Router

### Local development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in the browser. If that port is in use, Next.js will automatically choose the next available port.

### Production checks

```bash
npm run lint
npm run build
```

### Contact form setup

Set these in Vercel when you are ready to deliver form submissions:

```bash
RESEND_API_KEY=your_resend_api_key
CONTACT_RECIPIENT_EMAIL=contact@example.com
CONTACT_FROM_EMAIL="Website <onboarding@resend.dev>"
NEXT_PUBLIC_SITE_URL=https://example.com
```

Replace the example recipient and site URL with your own values. `CONTACT_FROM_EMAIL` must be a sender allowed by your Resend account and verified domain setup. Keep private workspace notes, credentials, customer records and consent evidence outside the repository.

### What is in place

- Custom homepage for Double Le HVAC
- Oklahoma City service-area positioning
- Strong hero, services, trust, coverage, FAQ, and contact sections
- Mobile sticky call-to-action bar
- Real business phone number wired in
- Contact form recipient default wired to the client inbox

### Next recommended pass

- Add client photography or technician/team imagery
- Tighten copy around real guarantees, financing, and maintenance plans
- Add dedicated service pages for SEO if needed

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
