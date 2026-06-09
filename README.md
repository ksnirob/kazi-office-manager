This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Kazi Office — Cash Management PWA

A modern, mobile-first Progressive Web App for a Kazi (Marriage Registrar) Office to manage income, expenses, and financial reporting.

## Features

- **Dashboard** — Hero stats, monthly bar chart, profit/loss line chart, category pie chart, recent transactions
- **Income Management** — CRUD with categories, search, filter by category/date, pagination
- **Expense Management** — CRUD with categories, search, filter, pagination
- **Reports** — Daily / weekly / monthly / yearly / custom range reports with charts and CSV export
- **Analytics** — KPI cards, trend charts, category breakdowns
- **Settings** — Theme (dark/light), language (Bengali/English), custom category management
- **PWA** — Installable, offline-capable, service worker caching
- **Auth** — NextAuth v5 with Credentials provider, JWT sessions, role-based access (ADMIN / USER)
- **i18n** — Bengali (`bn`) and English (`en`) with live toggle
- **Security** — CSRF protection, security headers, bcrypt password hashing

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (base-ui) |
| Auth | NextAuth v5 (beta) |
| ORM | Prisma v5 |
| Database | PostgreSQL |
| State / Data Fetching | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| PWA | Custom service worker |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or update `DATABASE_URL` in `.env`)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/kazi_office?schema=public"
NEXTAUTH_SECRET="your-super-secret-key-change-in-production-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

Replace `postgres:password` with your actual PostgreSQL credentials.

### 3. Create the database

In your PostgreSQL client:

```sql
CREATE DATABASE kazi_office;
```

### 4. Push schema & seed data

```bash
# Push schema to database
npm run db:push

# Seed default categories, admin user, and sample data
npm run db:seed
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Default Admin Credentials

| Field | Value |
|---|---|
| Email | `admin@kazioffice.com` |
| Password | `admin123` |

> **Change the admin password** after first login in production.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:push` | Push Prisma schema to DB (dev) |
| `npm run db:migrate` | Run migrations (production) |
| `npm run db:seed` | Seed database with default data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:generate` | Regenerate Prisma client |

---

## Project Structure

```
cash-management/
├── app/
│   ├── (app)/                  # Protected routes (auth required)
│   │   ├── dashboard/
│   │   ├── income/
│   │   ├── expenses/
│   │   ├── reports/
│   │   ├── analytics/
│   │   ├── settings/
│   │   └── layout.tsx
│   ├── api/                    # API routes
│   │   ├── auth/[...nextauth]/
│   │   ├── dashboard/
│   │   ├── income/
│   │   ├── expenses/
│   │   ├── categories/
│   │   └── reports/
│   ├── login/
│   ├── forgot-password/
│   ├── offline/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── dashboard/
│   ├── income/
│   ├── expenses/
│   ├── layout/
│   └── ui/                     # shadcn/ui components
├── contexts/
│   └── language-context.tsx
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── translations.ts
│   ├── utils.ts
│   └── validations.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── icons/                  # PWA icons (SVG placeholders)
│   ├── manifest.json
│   └── sw.js
├── scripts/
│   └── generate-icons.mjs
├── types/
│   └── index.ts
└── proxy.ts                    # Auth proxy (Next.js 16 middleware)
```

---

## Production Deployment

1. Set `NEXTAUTH_SECRET` to a strong random value (32+ chars)
2. Set `NEXTAUTH_URL` to your production domain
3. Update `DATABASE_URL` to your production PostgreSQL URL
4. Replace `public/icons/*.svg` with proper PNG icons
5. Run `npm run db:migrate` (not `db:push`) in production
6. Run `npm run build && npm run start`

---

## Language Support

Toggle between Bengali and English using the language button in the header or in Settings. The selection persists in `localStorage`.

## PWA Installation

On mobile Chrome/Edge: tap the browser menu → "Add to Home Screen". The app works offline for cached pages.

## Getting Started (original Next.js docs)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
