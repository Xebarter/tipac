# TIPAC Ticketing System — Rebuild Specification (Frontend + Backend + Database + Payments)

This document is intended to be **sufficient on its own** for an AI agent (or engineer) to rebuild a replica of the TIPAC ticketing subsystem.

It describes:
- **Database schema** (Supabase Postgres tables, columns, constraints, policies)
- **Backend API contracts** (Next.js Route Handlers)
- **Payment integration** (PesaPal API v3 + callback + IPN + polling)
- **Frontend flows** (ticket purchase, payment completion, PDF generation)
- **Admin flows** (ticket list, batch generation, QR verification/entry scanning)
- **Operational notes** (env vars, deployment, security posture, known inconsistencies)

---

## 1) High-level Architecture

### 1.1 Runtime / Framework
- **Web framework**: Next.js (App Router)
- **Language**: TypeScript
- **UI**: React + Tailwind + shadcn/ui components

### 1.2 Data Stores
This codebase uses **two different persistence stacks**:

- **Supabase Postgres (authoritative for ticketing)**
  - Tables used by ticketing:
    - `events`
    - `ticket_types`
    - `tickets`
    - `batches`
    - `sponsors` and `event_sponsors` (used to decorate ticket PDF)

- **MongoDB (legacy/admin demo APIs)**
  - There are admin API routes under `src/app/admin/api/*` that operate on MongoDB collections (`events`, `tickets`).
  - The *currently active ticketing UI and APIs* use Supabase, not MongoDB.
  - If rebuilding a replica of the ticketing system, implement Supabase as authoritative and either:
    - drop MongoDB admin ticket routes, or
    - keep them as legacy/demo, clearly separated.

### 1.3 Trust Boundaries
- Public pages and public API routes are reachable by anyone.
- Admin pages are guarded by a **simple cookie presence check** (`admin_session`), set client-side.
- Supabase RLS/policies vary by SQL script; some scripts are permissive.

---

## 2) Core Domain Model

### 2.1 Entities
- **Event**: a performance or program for which tickets are sold.
- **Ticket Type**: price tier per event (e.g., VIP, Regular, Free).
- **Ticket**: a single redeemable admission token. Can be:
  - **Online** (paid via PesaPal, or free online)
  - **Physical batch** (printed as QR codes and distributed offline)
- **Batch**: an admin-generated group of physical tickets.

### 2.2 Ticket Status vs Usage
Ticket records have two related concepts:

- **`status`** (purchase/payment lifecycle):
  - `pending` (created before payment confirmation)
  - `confirmed` (payment completed OR free ticket created)
  - `failed` (payment failed/cancelled)

- **`used`** (entrance scan lifecycle):
  - `false` initially
  - `true` once scanned and accepted

### 2.3 Purchase Channels
- `purchase_channel = 'online'`
- `purchase_channel = 'physical_batch'`

For physical tickets, a related `batches` row (via `batch_code`) controls whether the batch is active.

---

## 3) Database (Supabase Postgres) — Schema

### 3.1 Authoritative SQL Sources in Repo
Use the SQL files in the repo as the source of truth. The important ones for ticketing are:
- `supabase_schema.sql` (includes `events`, `tickets`, `batches`, RLS policies)
- `supabase_ticket_types.sql`
- `supabase_ticket_migration.sql` (adds offline ticket fields + batches)
- `supabase_add_ticket_type_id.sql`
- `supabase_add_batch_code_to_tickets.sql`
- `supabase_sponsors_setup.sql` and `supabase_events_organizer_sponsors.sql`

**Note**: There are multiple “setup” SQL files with different RLS configurations. If rebuilding, choose one consistent approach (recommended below).

### 3.2 Table: `events`
Minimum columns used by ticketing:
- `id uuid primary key default gen_random_uuid()`
- `created_at timestamptz default now()`
- `title text`
- `description text`
- `date date`
- `time time`
- `location text`
- `image_url text`
- `is_published boolean default true`

Branding columns (used for ticket PDFs / batch PDFs):
- `organizer_name text null`
- `organizer_logo_url text null`
- `sponsor_logos jsonb null` *(legacy format; current fetch endpoint uses `event_sponsors` too)*

### 3.3 Table: `ticket_types`
From `supabase_ticket_types.sql`:
- `id uuid primary key default gen_random_uuid()`
- `created_at timestamptz default now()`
- `event_id uuid references events(id) on delete cascade`
- `name text not null`
- `price integer default 0` *(stored as whole UGX amount)*
- `is_active boolean default true`

Index:
- `CREATE INDEX ticket_types_event_id_idx ON ticket_types(event_id)`

### 3.4 Table: `tickets`
From `supabase_schema.sql` (plus migrations):
- `id uuid primary key default gen_random_uuid()`
- `created_at timestamptz default now()`
- `event_id uuid references events(id)`
- `ticket_type_id uuid references ticket_types(id)` *(added by migration)*
- `email text null`
- `quantity integer default 1`
- `status text default 'confirmed'` *(used values: `pending`, `confirmed`, `failed`)*
- `pesapal_transaction_id text null`
- `pesapal_status text null`
- `price integer default 0` *(price per ticket; online paid flow sets price = total/quantity rounded)*

Offline/physical support:
- `purchase_channel text default 'online'` *(values: `online` or `physical_batch`)*
- `batch_code text null`
- `is_active boolean default true` *(physical tickets may be toggled by batch management)*
- `qr_code text null` *(stored as data URL for batch tickets)*

Buyer fields:
- `buyer_name text null`
- `buyer_phone text null`

Scan usage:
- `used boolean default false`

Indexes recommended (some provided by migrations):
- `CREATE INDEX tickets_ticket_type_id_idx ON tickets(ticket_type_id)`
- `CREATE INDEX idx_tickets_batch_code ON tickets(batch_code)`

### 3.5 Table: `batches`
From `supabase_schema.sql` and `supabase_batches_table.sql`:
- `id uuid primary key default gen_random_uuid()`
- `created_at timestamptz default now()`
- `batch_code text unique`
- `event_id uuid references events(id)`
- `num_tickets integer`
- `is_active boolean default true`

### 3.6 Tables: `sponsors`, `event_sponsors`
From `supabase_sponsors_setup.sql`:

`sponsors`
- `id uuid primary key default gen_random_uuid()`
- `created_at timestamptz default now()`
- `name text not null`
- `logo_url text null`
- `website_url text null`
- `is_active boolean default true`

`event_sponsors`
- `id uuid primary key default gen_random_uuid()`
- `event_id uuid references events(id)`
- `sponsor_id uuid references sponsors(id)`
- `sponsor_type text default 'regular'` *(e.g. `organizer`, `regular`)*
- `created_at timestamptz default now()`
- `UNIQUE(event_id, sponsor_id)`

### 3.7 RLS / Policies (Important)
The repository contains multiple conflicting approaches:

- Some scripts **enable RLS** and allow only `authenticated`.
- Others disable RLS on custom tables and make storage permissive.
- Some scripts add policies for `anon` as well.

**Replica recommendation** (for a safe real-world rebuild):
- Enable RLS.
- Use Supabase Auth; restrict admin operations to admin role.

**Replica recommendation** (to match this repo behavior most closely):
- Keep policies permissive for simplicity.
- Allow `anon` read of published events and creation of online tickets.
- Protect admin features with the existing cookie middleware (still not secure).

---

## 4) Backend APIs (Next.js Route Handlers)

All endpoints below are implemented in `src/app/api/**`.

### 4.1 Ticket Purchase — PesaPal Order Creation
**Endpoint**: `POST /api/tickets/pesapal`

**Purpose**:
- Create a `tickets` record in `pending` state.
- Create a PesaPal order with `id = ticket.id` (merchant reference).
- Return `redirect_url` to send the browser to PesaPal checkout.

**Request JSON** (as called by `src/app/tickets/page.tsx`):
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "07xxxxxxxx",
  "amount": "50000",
  "eventId": "<uuid>",
  "quantity": 2
}
```

**Validation**:
- In the API route: requires all fields including `email`.
- On the tickets page: email is optional, but paid flow still sends it.

**Side effects**:
- Inserts into `tickets`:
  - `status = 'pending'`
  - `price = round(totalAmount / quantity)`
  - `purchase_channel = 'online'`
  - `buyer_name`, `buyer_phone`

**Response JSON**:
```json
{ "url": "https://...pesapal.../redirect" }
```

**Env vars required**:
- `PESAPAL_CONSUMER_KEY`
- `PESAPAL_CONSUMER_SECRET`
- `PESAPAL_CALLBACK_URL` (points to `/payment-complete`)
- `PESAPAL_BASE_URL` (prod or sandbox)
- `PESAPAL_IPN_ID` (registered IPN ID)


### 4.2 Ticket Payment Status Polling (Server-to-PesaPal)
**Endpoint**: `GET /api/tickets/pesapal-status?orderTrackingId=...`

**Purpose**:
- Query PesaPal transaction status via `GetTransactionStatus`.
- Update local ticket `status` and `pesapal_status` if a matching ticket is found.

**Lookup logic**:
- Finds ticket where `pesapal_transaction_id == orderTrackingId`.

**State mapping**:
- If status description contains `completed` or `successful` => `tickets.status = 'confirmed'`
- If contains `failed` or `cancelled` => `tickets.status = 'failed'`
- Else => `pending`

**Response JSON**:
```json
{
  "status": "...",
  "payment_status_description": "COMPLETED",
  "payment_method": "...",
  "confirmation_code": "..."
}
```


### 4.3 Payment Callback Handling (Client)
**Page**: `/payment-complete` (`src/app/payment-complete/PaymentCompleteContent.tsx`)

**Purpose**:
- Read `OrderTrackingId` (various casing variants) from querystring.
- Poll `/api/tickets/pesapal-status` up to 6 times with 3s delay.
- If paid and successful, fetch ticket details and attempt to auto-download PDF.

Ticket retrieval attempt order:
1. `GET /api/tickets/fetch/{orderTrackingId}`
2. Fallback: `GET /api/tickets/verify/{orderTrackingId}` *(this may have side-effects if it marks `used`; see below)*


### 4.4 Fetch Ticket for PDF Download (No “use” side effects)
**Endpoint**: `GET /api/tickets/fetch/{ticket_id}`

**Purpose**:
- Return a ticket payload shaped exactly for the PDF generator.
- Supports lookup by:
  - `tickets.id == ticket_id` OR
  - `tickets.pesapal_transaction_id == ticket_id`

**Joins**:
- Joins `events` (title, date, location, organizer fields)
- Joins `ticket_types` (name)
- Queries `event_sponsors` and `sponsors` to attach sponsor logos.

**Response JSON shape**:
```json
{
  "id": "<ticket-uuid>",
  "event": {
    "title": "...",
    "date": "...",
    "location": "...",
    "organizer_name": "...",
    "organizer_logo_url": "...",
    "sponsor_logos": [{"url":"...","name":"..."}]
  },
  "buyer_name": "...",
  "buyer_phone": "...",
  "purchase_channel": "online",
  "confirmation_code": "<pesapal_transaction_id or confirmation_code>"
}
```


### 4.5 Verify Ticket (Scanner) + Mark Used
There are two verify route implementations in the repo:

#### A) `GET /api/tickets/verify/{ticket_id}` and `PUT /api/tickets/verify/{ticket_id}`
File: `src/app/api/tickets/verify/[ticket_id]/route.ts`

**GET behavior**:
- Fetches ticket + event.
- If `ticket.used` => returns `valid: false` with “Ticket already used”.
- If `purchase_channel == 'physical_batch'`:
  - Ensures matching `batches.batch_code` is active; otherwise invalid.
- Returns `valid: true` with ticket info.

**PUT behavior**:
- Body: `{ "used": true }`
- Updates `tickets.used`.

This is what the admin QR scanner uses.

#### B) `GET /api/tickets/verify` (non-parameter route)
File: `src/app/api/tickets/verify/route.ts`

There is also a non-parameter route that marks tickets as used in its own logic.
For a clean rebuild, prefer the dynamic `[ticket_id]` route as the canonical verifier.


### 4.6 Activate Physical Ticket (Optional ownership fields)
**Endpoint**: `POST /api/tickets/activate`

**Purpose**:
- For `purchase_channel='physical_batch'`, optionally set `buyer_name`/`buyer_phone`.
- If no buyer info provided, only verifies the ticket exists and returns it.

**Request**:
```json
{ "ticket_id": "<uuid>", "buyer_name": "...", "buyer_phone": "..." }
```


### 4.7 Generate Physical Batch Tickets (Server-side PDF)
**Endpoint**: `POST /api/tickets/generate-batch`

**Purpose**:
- Create a `batches` row.
- Create N `tickets` rows with:
  - `purchase_channel='physical_batch'`
  - `status='confirmed'`
  - `is_active=true`
  - `batch_code` set to created batch code
  - `qr_code` stored as a PNG data URL containing JSON:
    - `{ ticket_id, batch_code, event_id }`
- Generate a PDF containing all tickets and QR codes.
- Return the PDF response directly.

**Request JSON**:
```json
{ "event_id": "<uuid>", "num_tickets": 100, "batch_code": "BATCH-...", "price": 20000 }
```

**Important implementation note**:
- The route attempts to insert `batches` with the provided `batch_code`. If it collides, it appends `-${Date.now()}-${attempt}` up to 5 times.

**Response**:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename=tickets-<batch_code>.pdf`


### 4.8 PesaPal IPN Receiver
**Endpoint**: `POST /api/pesapal-ipn`

**Purpose**:
- Receive asynchronous payment notification.
- Update `tickets.status`.

**Behavior**:
- If `OrderNotificationType == PAYMENT_COMPLETED` => sets `status='confirmed'`.
- If `PAYMENT_FAILED` or `PAYMENT_CANCELLED` => sets `status='failed'`.

**Important mismatch**:
- It updates `tickets` where `id == OrderTrackingId`.
  - In `/api/tickets/pesapal`, the order id is `ticket.id`, so this matches.


### 4.9 PesaPal IPN Registration (Utility)
**Endpoint**:
- `POST /api/pesapal/register-ipn`
- `GET /api/pesapal/register-ipn`

**Purpose**:
- Programmatically register the IPN URL with PesaPal and get back an IPN ID.

**Env var**:
- `PESAPAL_IPN_URL` (your public `/api/pesapal-ipn` URL)


---

## 5) Frontend (User) Ticket Purchase Flow

### 5.1 Main Purchase Page
**Route**: `/tickets`
File: `src/app/tickets/page.tsx`

**Data fetching** (client-side via Supabase JS):
- Loads published events:
  - `supabase.from('events').select('*').eq('is_published', true).order('date')`
- Loads active ticket types:
  - `supabase.from('ticket_types').select('*').eq('is_active', true)`

**Selection logic**:
- If query string contains `?event=<eventId>` it scrolls to that event.
- Auto-selects first ticket type for event if present, else first overall.

### 5.2 Form Inputs
- `firstName` (required)
- `lastName` (required)
- `email` (optional on this page)
- `phone` (required)
  - Must match regex `^07[0-9]{8}$`
- `quantity` (required)
  - min 1, max 10

### 5.3 Pricing
- Total = `ticketType.price * quantity`.
- Currency is treated as UGX.

### 5.4 Free Ticket Flow
If `totalPrice == 0`:
- Inserts **one row per ticket** into `tickets` with `quantity=1` for each row.
- Builds `ticketsToDownload` from inserted rows and event data.
- Attempts to download:
  1. Single multi-ticket PDF via `generateMultiTicketPDF`.
  2. If that fails, downloads each ticket PDF individually.
- Keeps the generated tickets available for manual download in UI.

### 5.5 Paid Ticket Flow
If `totalPrice > 0`:
- Calls `POST /api/tickets/pesapal`.
- Redirects browser to returned `url`.


---

## 6) Frontend (User) Ticket PDF Generation

File: `src/lib/ticketGenerator.ts`

### 6.1 Functions
- `generateTicketPDF(ticketData) => Promise<Blob>`
- `generateMultiTicketPDF(ticketsData[]) => Promise<Blob>`

### 6.2 QR Code Content
- Ticket PDF QR code encodes **ticket UUID only** (`ticketData.id`).
- Batch tickets store QR code differently on server: JSON with multiple fields.
- Admin scanner handles both raw UUID and JSON payloads.

### 6.3 Required TicketData Shape
The generator expects:
```ts
{
  id: string,
  event: {
    title: string,
    date: string,
    location: string,
    organizer_name?: string,
    organizer_logo_url?: string,
    sponsor_logos?: {url: string, name: string}[]
  },
  buyer_name: string,
  buyer_phone: string,
  purchase_channel: string,
  confirmation_code?: string
}
```

---

## 7) Admin Features

### 7.1 Admin Authentication (Current Implementation)
- Login page: `/admin/login`
- Credentials are hardcoded in UI:
  - email: `admin@tipac.com`
  - password: `Admin123`
- Successful login sets a cookie:
  - `admin_session=authenticated; path=/; max-age=3600`

Middleware:
- `src/middleware.ts` protects `/admin/*` routes by checking cookie existence.

**Security note**: this is not secure and should be replaced by real auth in a production rebuild.

### 7.2 Admin Tickets Dashboard (Supabase)
**Route**: `/admin/tickets`
File: `src/app/admin/tickets/page.tsx`

Uses Supabase client directly from the browser.

Features:
- Load `events`, `tickets`, `batches`.
- Stats:
  - total tickets (row count)
  - online tickets count
  - batch tickets count
  - used tickets count
  - total revenue = sum of `price * quantity` for online tickets with `status == 'confirmed'`

Tabs:
- Active Tickets (tickets where `used == false`)
- Ticket Batches
- Generate Batch (calls `/api/tickets/generate-batch` and downloads returned PDF)
- Used Tickets (tickets where `used == true`)
- Customers (groups online tickets by `buyer_name + buyer_phone`)

Batch actions:
- Toggle batch `is_active` and also update all tickets in that batch `is_active`.
- “Activate Tickets” button sets all tickets in batch to `is_active=true`.

### 7.3 Admin Batch Generation Page (Supabase)
**Route**: `/admin/tickets/generate`
File: `src/app/admin/tickets/generate/page.tsx`

- Loads events
- Loads ticket types for selected event
- Calls `/api/tickets/generate-batch`

### 7.4 Admin Ticket Verification / Scanner (Entrance)
**Route**: `/admin/verify`
File: `src/app/admin/verify/page.tsx`

- Uses `@yudiel/react-qr-scanner`.
- Extracts `ticket_id` from scanned QR payload:
  - handles raw UUID, JSON payload, or querystring-like strings.

Verification:
- `GET /api/tickets/verify/{ticketId}`

Mark as used:
- `PUT /api/tickets/verify/{ticketId}` with `{ used: true }`

UI behavior:
- Shows a popup with validity and ticket details.
- If valid and not used, allows “Mark as Used”, then resumes scanning.

---

## 8) Payment Integration Details (PesaPal v3)

### 8.1 Endpoints Used Against PesaPal
- `POST {PESAPAL_BASE_URL}/api/Auth/RequestToken`
- `POST {PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`
- `GET  {PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=...`
- `POST {PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`
- `GET  {PESAPAL_BASE_URL}/api/URLSetup/GetIpnList`

### 8.2 Order Identity Strategy
- For ticket purchases, the system uses:
  - `orderTrackingId = ticket.id` (Supabase UUID)
- After submit order request, it stores:
  - `tickets.pesapal_transaction_id = data.order_tracking_id`

### 8.3 Confirmation Paths
There are **two** confirmation paths:
- **IPN push**: `/api/pesapal-ipn` updates ticket by `id`.
- **Client polling**: `/payment-complete` polls `/api/tickets/pesapal-status`, which updates by `pesapal_transaction_id`.

In a rebuild, keep both:
- IPN is the authoritative async confirmation.
- Polling improves UX when IPN is delayed.

---

## 9) Environment Variables

### 9.1 Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 9.2 PesaPal
From `PESAPAL_ENV.md`:
- `PESAPAL_CONSUMER_KEY`
- `PESAPAL_CONSUMER_SECRET`
- `PESAPAL_CALLBACK_URL` (e.g., `https://yourdomain.com/payment-complete`)
- `PESAPAL_IPN_ID`
- `PESAPAL_IPN_URL` (e.g., `https://yourdomain.com/api/pesapal-ipn`)
- `PESAPAL_BASE_URL`

---

## 10) Known Inconsistencies / Quirks (Important for Replica)

- **Email optional vs required**:
  - `/tickets` page treats email as optional.
  - `/api/tickets/pesapal` currently requires email.

- **Paid ticket quantity modeling**:
  - Paid flow creates **one `tickets` row** with `quantity = N`.
  - Free flow creates **N rows**, each with `quantity = 1`.
  - Admin revenue calculations use `price * quantity` which matches paid flow.
  - PDF generation for paid flow currently fetches a single ticket; it does not generate N distinct IDs for paid quantity.

- **Verify endpoints duplication**:
  - There are multiple `/api/tickets/verify*` implementations.
  - Admin scanner uses `/api/tickets/verify/[ticket_id]` and should remain canonical.

- **RLS/policies vary across SQL files**:
  - Decide one approach when rebuilding.

- **MongoDB admin routes are present but not used by the Supabase admin UI**:
  - Keep or remove depending on replica goals.

---

## 11) Rebuild Checklist (Step-by-step)

### 11.1 Database
1. Create Supabase project.
2. Apply schema for:
   - `events`, `tickets` (use `supabase_schema.sql` as base)
   - `ticket_types` (`supabase_ticket_types.sql`)
   - offline additions and batches (`supabase_ticket_migration.sql`)
   - sponsors tables (`supabase_sponsors_setup.sql`)
3. Ensure indexes exist (`ticket_types_event_id_idx`, `tickets_ticket_type_id_idx`, `idx_tickets_batch_code`).
4. Configure RLS/policies (pick one strategy).

### 11.2 Backend
1. Implement Next.js route handlers:
   - `/api/tickets/pesapal`
   - `/api/tickets/pesapal-status`
   - `/api/tickets/fetch/[ticket_id]`
   - `/api/tickets/verify/[ticket_id]` (GET + PUT)
   - `/api/tickets/activate`
   - `/api/tickets/generate-batch`
   - `/api/pesapal-ipn`
   - `/api/pesapal/register-ipn` (optional helper)
2. Ensure server has access to env vars.

### 11.3 Frontend
1. Build `/tickets` page:
   - list events
   - list ticket types per event
   - purchase form + validation
   - free flow insert + PDF download
   - paid flow redirect
2. Build `/payment-complete` page:
   - read `OrderTrackingId`
   - poll status
   - fetch ticket for PDF
3. Build ticket PDF generator:
   - `generateTicketPDF`, `generateMultiTicketPDF`.

### 11.4 Admin
1. Implement cookie-based login `/admin/login` + middleware gate.
2. Implement `/admin/tickets` (Supabase-based): stats, lists, batch management, batch generation.
3. Implement `/admin/verify` scanner:
   - scan QR
   - verify
   - mark used

---

## 12) Minimal Test Plan

- **DB**:
  - **[events]** insert event, insert ticket types
  - **[tickets]** insert online free tickets and ensure `used` toggles
  - **[batches]** create batch and ensure `batch_code` unique

- **Online paid**:
  - Initiate payment => ticket row created `pending`
  - Complete payment => ticket becomes `confirmed` via IPN or polling
  - Payment-complete page downloads PDF

- **Offline batch**:
  - Generate batch => PDF downloads + N ticket rows created with QR codes
  - Scanner reads QR => valid
  - Mark as used => ticket becomes `used=true`
  - Re-scan => invalid “already used”
  - Deactivate batch => tickets invalid

---

## 13) Source Map (Where Things Live)

- **User tickets UI**: `src/app/tickets/page.tsx`
- **Payment completion UI**: `src/app/payment-complete/PaymentCompleteContent.tsx`
- **Ticket PDF generator**: `src/lib/ticketGenerator.ts`

- **Ticket payment creation (PesaPal)**: `src/app/api/tickets/pesapal/route.ts`
- **Ticket payment status**: `src/app/api/tickets/pesapal-status/route.ts`
- **Ticket fetch for PDF**: `src/app/api/tickets/fetch/[ticket_id]/route.ts`
- **Ticket verify + mark used**: `src/app/api/tickets/verify/[ticket_id]/route.ts`
- **Ticket activation (physical)**: `src/app/api/tickets/activate/route.ts`
- **Batch generation**: `src/app/api/tickets/generate-batch/route.ts`

- **PesaPal IPN receiver**: `src/app/api/pesapal-ipn/route.ts`
- **PesaPal IPN registration**: `src/app/api/pesapal/register-ipn/route.ts`

- **Admin tickets dashboard**: `src/app/admin/tickets/page.tsx`
- **Admin batch generation page**: `src/app/admin/tickets/generate/page.tsx`
- **Admin scanner**: `src/app/admin/verify/page.tsx`

---

## 14) Completion Criteria for a “Replica”
A rebuild should be considered a faithful replica if it supports:
- Event listing + ticket type selection
- Free online checkout => DB tickets created + downloadable PDFs
- Paid checkout via PesaPal => redirect + confirmation + downloadable PDF
- Admin batch generation => printable PDFs with QR codes + batch/ticket persistence
- Admin verification scanner => validate + mark as used + reject used tickets
