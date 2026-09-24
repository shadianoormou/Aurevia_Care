# Aurevia Care

> A premium, safety-first digital pharmacy and local-care discovery platform for Bangladesh.

<p align="center">
  <a href="https://aurevia-care.vercel.app/"><strong>Open the live product →</strong></a>
  ·
  <a href="https://github.com/shadianoormou/aurevia-care">View the repository</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react&logoColor=white" alt="React and Vite" />
  <img src="https://img.shields.io/badge/API-Express%205-111827?logo=express&logoColor=white" alt="Express 5" />
  <img src="https://img.shields.io/badge/Production-Neon%20PostgreSQL-00E699?logo=postgresql&logoColor=111827" alt="Neon PostgreSQL" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Local%20DB-SQL%20Server-CC2927?logo=microsoftsqlserver&logoColor=white" alt="SQL Server" />
  <img src="https://img.shields.io/badge/license-Private%20client%20project-5B2C6F" alt="Private client project" />
</p>

Aurevia Care combines an editorial pharmacy storefront, prescription-aware fulfilment, and a source-attributed care navigator in one responsive experience. It is designed for a pharmacist-led operating model: the product helps people discover essentials and local services, but it never diagnoses, prescribes, or replaces professional medical judgement.

## Product at a glance

| Resource | Link |
| --- | --- |
| Live production site | [aurevia-care.vercel.app](https://aurevia-care.vercel.app/) |
| Source repository | [github.com/shadianoormou/aurevia-care](https://github.com/shadianoormou/aurevia-care) |
| Deployment history | [GitHub Actions](https://github.com/shadianoormou/aurevia-care/actions) |
| Frontend preview | [localhost:5173](http://127.0.0.1:5173) when running locally |

## What is included

- **Premium storefront** — calm editorial layouts, responsive navigation, category-first discovery, product imagery, cart, checkout, reviews, resilient image fallbacks, and mobile-friendly interactions.
- **Five pharmacy collections** — Medicines & Wellness, Skin Care, Hair & Scalp, Oral & Dental, and Creams & First Aid, with nested everyday-care subcategories.
- **Prescription centre** — authenticated image/PDF scan upload or manual entry, protected file access, pharmacist review states, approval expiry, and prescription-only order gating.
- **Care Concierge** — Bangla/English text and browser voice input with symptom-to-specialty routing, safety guidance, location filters, and source-attributed results.
- **Nationwide location model** — division and district selection across Bangladesh, with directory queries scoped to the chosen location instead of a single-city hardcode.
- **Local-care directory** — hospitals, doctors, diagnostics, blood-support services, emergency contacts, source URLs, verification dates, and archive workflows.
- **Professional authentication** — email/password, Bangladesh phone/password, optional Google Identity Services, unique identity indexes, HTTP-only sessions, and rate-limited auth endpoints.
- **Operations studio** — role-aware admin workspaces for products, images, categories, inventory, orders, prescriptions, users, and directory verification.
- **Fulfilment controls** — transaction-safe stock reservation, cancellation rollback, immutable order snapshots, status history, and optional order-status email notifications.
- **Dual database adapter** — Neon PostgreSQL for the hosted Vercel product and Microsoft SQL Server for local or Azure deployments, using the same domain layer.

## Safety and trust model

Aurevia Care is a care-navigation and pharmacy-operations product, not a medical diagnosis engine.

- The Care Concierge suggests an appropriate care specialty and verified local options; it does not diagnose or provide medication doses.
- Prescription OCR, when configured, extracts text only. A pharmacist must review and approve a prescription before a restricted product can be fulfilled.
- Provider schedules, phone numbers, blood availability, and emergency services must be confirmed directly with the provider.
- Directory records carry a source URL and verification date. If a district has no verified record, the interface points to the official [DGHS Facility Registry](https://hrm.dghs.gov.bd/public/facility-registry) instead of inventing a provider.
- Product publishing remains an operator responsibility: licence, supplier authority, price, stock, packaging rights, and prescription classification must be verified before sale.

## Architecture

```mermaid
flowchart TB
    Browser[Customer and staff browser]

    subgraph Experience[React + Vite experience]
        Storefront[Storefront / Catalogue / Cart / Checkout]
        Care[Care Concierge / Bangla-English / Voice]
        Prescription[Prescription Centre / Scan / Manual entry]
        Admin[Protected operations studio]
    end

    subgraph Service[Express application service]
        Security[HTTP-only cookies / Roles / Rate limits / Validation]
        Commerce[Catalogue / Reviews / Orders / Inventory]
        Clinical[Prescription workflow / Pharmacist approval]
        Navigator[Location-aware care routing / Directory]
    end

    subgraph Data[Production: Neon PostgreSQL | Local: SQL Server]
        Core[(Users / Products / Categories / Orders / Reviews)]
        Protected[(Prescriptions / Audit history)]
        Directory[(Bangladesh locations / Providers / Sources)]
    end

    subgraph Optional[Optional integrations]
        Google[Google Identity Services]
        OCR[Azure AI Document Intelligence]
        Media[Cloudinary product media]
        Mail[SMTP order notifications]
    end

    Browser --> Storefront
    Browser --> Care
    Browser --> Prescription
    Browser --> Admin
    Storefront --> Security
    Care --> Security
    Prescription --> Security
    Admin --> Security
    Security --> Commerce
    Security --> Clinical
    Security --> Navigator
    Commerce --> Core
    Clinical --> Protected
    Navigator --> Directory
    Security -. optional sign-in .-> Google
    Clinical -. assistive extraction .-> OCR
    Commerce -. optional images .-> Media
    Commerce -. status email .-> Mail
```

### Request lifecycle

The live Vercel deployment serves the React build and Express API on one HTTPS origin. The browser calls `/api`; the API applies authentication, validation, rate limits, and role checks before reading or writing Neon PostgreSQL. The database URL and all operational credentials remain server-side. Vercel's build step runs the PostgreSQL migration/bootstrap before the application is served.

## Technology stack

| Layer | Implementation |
| --- | --- |
| Web app | React 18, React Router, Vite, Tailwind CSS |
| API | Node.js 20+, Express 5, Helmet, CORS, express-rate-limit, express-validator |
| Persistence | Neon PostgreSQL in production; Microsoft SQL Server/LocalDB for local development |
| Authentication | JWT-backed HTTP-only cookies, email/phone accounts, optional Google Identity Services |
| Documents | Protected prescription uploads with optional Azure AI Document Intelligence OCR |
| Media and notifications | Optional Cloudinary product images and SMTP order-status emails |
| Delivery | Vercel serverless API + static client, GitHub source control and Actions |

## Repository layout

```text
client/
  src/pages/              Customer, care, checkout, auth, and admin views
  src/components/         Shared navigation, concierge, forms, and admin UI
  src/context/            Cart and authentication state
  public/                 Brand marks and favicon assets
server/
  controllers/            Domain and workflow logic
  routes/                 API route definitions
  middleware/             Authentication, validation, and error handling
  migrations/             SQL Server schema migrations
  migrations-postgres/    PostgreSQL schema migration
  config/                 Database adapters and hosted bootstrap catalogue
  data/                   Symptom map and directory import schema
  scripts/                Migration and verified directory import tools
api/index.mjs             Vercel entrypoint for the Express API
scripts/vercel-build.mjs  Production migration, bootstrap, and client build
vercel.json               Vercel build and same-origin routing rules
```

## Run locally

### Prerequisites

- Node.js 20 or later
- Microsoft SQL Server 2022+, SQL Server LocalDB, or another SQL Server instance
- A database named `aurevia_care` and a login allowed to run migrations

### 1. Configure the API

```powershell
cd server
Copy-Item .env.example .env
npm install
```

Set the SQL Server values and a unique JWT secret in `server/.env`, then migrate and seed development data:

```powershell
npm run db:migrate
npm run seed
```

`npm run seed` is for development/bootstrap data and is blocked in production unless explicitly enabled. Never commit `.env`, database credentials, OAuth secrets, or administrator passwords.

### 2. Start the API and client

In one terminal:

```powershell
cd server
npm run dev
```

In another terminal:

```powershell
cd client
Copy-Item .env.example .env
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Vite proxies `/api` to the local API on port 5000.

### Hosted PostgreSQL workflow

For a managed PostgreSQL database such as Neon, set `DATABASE_URL` and run the PostgreSQL migration from the repository root:

```powershell
$env:DATABASE_URL = "postgresql://user:password@host/database?sslmode=require"
cd server
npm run db:migrate:postgres
```

The production Vercel build performs this migration/bootstrap automatically when `DATABASE_URL` is available.

## Environment configuration

The complete templates are in [`server/.env.example`](server/.env.example) and [`client/.env.example`](client/.env.example). Common production values are:

```env
NODE_ENV=production
DATABASE_URL=postgresql://managed-by-neon
JWT_SECRET=a-unique-secret-at-least-32-characters-long
COOKIE_SAME_SITE=lax
CLIENT_URL=https://aurevia-care.vercel.app
VITE_API_URL=/api
```

Optional capabilities use `GOOGLE_CLIENT_ID`/`VITE_GOOGLE_CLIENT_ID`, Cloudinary variables, SMTP variables, and Azure Document Intelligence variables. For Google sign-in, configure both `http://127.0.0.1:5173` and the production HTTPS origin as authorised JavaScript origins.

## Production deployment

The live project is deployed through Vercel with Neon PostgreSQL:

1. Import the GitHub repository into Vercel.
2. Connect the `aurevia-care-db` Neon resource to Production and Preview.
3. Add `DATABASE_URL`, a strong `JWT_SECRET`, and `COOKIE_SAME_SITE=lax` to the Vercel environment.
4. Keep the project build settings from [`vercel.json`](vercel.json); they install the root and client dependencies, migrate/bootstrap PostgreSQL, and build the Vite client.
5. Push to `main` to trigger a new Vercel deployment.

The current production URL is [https://aurevia-care.vercel.app](https://aurevia-care.vercel.app). The API health check is available at [`/api/health`](https://aurevia-care.vercel.app/api/health).

An optional Azure App Service + Azure SQL template remains in [`infra/azure/`](infra/azure/) for teams with an Azure subscription. The primary no-subscription deployment path is Vercel + Neon.

## API quick reference

```text
GET  /api/health
GET  /api/categories
GET  /api/products?limit=12
GET  /api/care-navigator/locations
GET  /api/care-navigator/directory?division=Rajshahi&district=Rajshahi
POST /api/care-navigator/ask  { "message": "কাশি হলে কোন ডাক্তার দেখাব?" }
POST /api/prescriptions/scan  (authenticated multipart upload)
POST /api/prescriptions/manual (authenticated manual submission)
GET  /api/orders/my-orders    (authenticated customer history)
GET  /api/admin/stats         (authenticated admin dashboard)
```

## Admin operations

Admins can work from `/admin/dashboard` after signing in with an account that has the `admin` role. The protected workspace includes:

- category and product CRUD, media uploads, stock, featured placement, and soft-delete/archive behaviour;
- order queue, status transitions, customer notification attempts, and order history;
- prescription review, approval expiry, and pharmacist-only access to protected files;
- customer/staff access management and role-aware navigation;
- care-directory publishing, source URL, verification date, location scope, and archive controls.

Order email delivery is optional and configured through SMTP. If delivery is unavailable, the order transition remains intact and the failure is logged for operational follow-up.

## Care-directory data operations

The location layer is ready for Bangladesh's 8 divisions and 64 districts. Concierge routing covers dental, respiratory, orthopaedic leg/knee/ankle pain, vascular swelling, neurological symptoms, women's health, paediatrics, dermatology, ophthalmology, cardiology, diabetes, mental health, and urinary/kidney care.

Only verified, source-attributed records should be imported. Use [`server/data/care-directory.import.example.json`](server/data/care-directory.import.example.json) as the schema:

```powershell
cd server
npm run directory:import -- C:\path\to\verified-care-directory.json
```

The importer rejects unknown locations, missing addresses, non-HTTPS sources, unsupported record kinds, and missing verification dates. Matching `Name + Kind` records are updated; new records are inserted in one transaction.

## Quality and security checks

```powershell
cd client
npm run build

cd ../server
node --check server.js
npm audit --omit=dev
```

Security controls include HTTP-only cookies, role checks, request validation, rate limits, Helmet headers, parameterised SQL, allowlisted catalogue filters, protected prescription ownership checks, and audit timestamps. Product and user removal preserve operational history through archive/deactivation semantics.

## Licensing

This is a private client project. The code, design, content, and operational data may not be reused, redistributed, or deployed without the project owner's written permission.

---

Built as a professional foundation for a pharmacist-led digital care business in Bangladesh.
