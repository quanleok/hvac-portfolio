# HVAC Service Management

Next.js application combining an HVAC business website with an authenticated workspace for customers, service jobs, estimates, documents and marketing content.

**Public portfolio source:** [quanleok/hvac-portfolio](https://github.com/quanleok/hvac-portfolio)

## Implemented work

- Responsive business pages, service-area content and contact forms.
- Customer and service records, document creation, estimates and administrative workflows.
- Media management and integrations for email, SMS and marketing tools.
- Supabase authentication, storage and database migrations.

Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4 and Supabase. This repository is a source portfolio snapshot; running the full application requires your own development services. It does not include deployed accounts or a customer dataset.

## Repository guide

- `app/` contains public pages, admin routes and API handlers.
- `components/` contains public and administrative interface components.
- `lib/` contains domain logic, authentication and service integrations.
- `supabase/migrations/` contains database schema changes.
- `.env.example` documents configuration with placeholder values.

## Local development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open [localhost:3000](http://localhost:3000). Configure a separate development Supabase project and its schema for the admin workflows. Use your own development user and service credentials; this copy does not provide a shared admin login.

Before testing outbound messages, set your own `CONTACT_RECIPIENT_EMAIL`, allowed `CONTACT_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL` and provider credentials. The source retains public business branding and some business defaults, so review those settings before running integrations. Optional SMS, OAuth, media and marketing services are described in `.env.example`.

## Checks

```bash
npm run lint
npm run build
```

These commands check source quality and compilation. They do not validate live messaging, database permissions or production readiness.

## Source boundary

Credentials belong in ignored environment files or a provider secret store. Customer records, consent evidence, private workspace notes, recovery material and admin captures are excluded from this portfolio source and must stay outside Git. Use synthetic records in development. Included public-facing business content is not permission to reuse private business data or third-party media.
