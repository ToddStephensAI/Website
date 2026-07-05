# Energy Concerns — Job Management App: Plan

Status check first: this app already exists. It was built and merged to `main` in
PR #1 ("Add solar PV contractor job management app", commit `ee0e4e9`), and it
covers nearly all of the brief below. This document turns Mike's brief into a
phased plan — Phase 1 is what's live, Phase 2 is what's next — so it's easy to
see what's done and what to tackle once the team is using it day to day.

Code lives in [`app/`](./app), stack is Next.js + Supabase. See
[`app/README.md`](./app/README.md) for setup/deploy instructions.

## The brief, simplified

Cutting the original brief down to its essentials, in the order a job actually
moves through the business:

1. **CEO dashboard** — see active projects, insights, a to-do list.
2. **Contractor journey** — see job + customer + equipment details, upload
   install photos, message the office about problems ("we broke a tile"),
   notify the customer on arrival (GPS), get the customer to sign off
   on-site, schedule a return visit, mark the job complete.
3. **Customer journey** — track the job through Deposit → DNO →
   Installation → Handover, chat with the team, see photos as they're
   uploaded.
4. **Automations on completion** — thank-you message to the customer,
   "next steps" (scaffolding/waste removal booking), an office to-do for
   admin/reception, and eventually an invoice in Xero.

## Phase 1 — MVP (built, in `app/`)

| Brief item | Where it lives |
|---|---|
| CEO control dashboard: insights + to-dos | `/admin` |
| Invite contractors/customers, assign to jobs | `/admin` → People |
| Job pipeline: Deposit → DNO → Installation → Handover → Complete | job detail pages, both `/admin` and `/contractor` |
| Contractor: job/customer/equipment details | `/contractor` |
| Contractor: upload installation photos | `/contractor` (Supabase Storage) |
| Contractor: message office about issues | in-app chat, job detail page |
| Contractor: notify customer via GPS | "Notify customer" button, `/contractor` |
| Contractor: capture customer sign-off | sign-off flow, `/contractor` |
| Contractor: schedule a return visit | `/contractor`, logs a to-do + chat note |
| Contractor: mark job complete | `/contractor`, triggers office to-do (handover email, scaffolding/waste booking, invoice) |
| Customer: track job stage | `/customer` |
| Customer: chat, ask questions | `/customer` |
| Customer: see installation photos | `/customer` |

What's simplified for now, on purpose:
- "Automated" messages/emails currently land as in-app chat entries + office
  to-dos, not real WhatsApp/SMS/email sends.
- GPS notify and return-visit scheduling log the action and notify the office;
  they don't yet hit a live maps API or an external calendar.
- No Xero connection yet — completion creates an invoicing to-do instead of a
  real invoice.

This was a deliberate cut: get the pipeline, roles, and data model right first,
wire up outside services once the team's actually using it.

## Phase 2 — Integrations (needs your accounts/API keys)

Each of these needs a credential from Mike/office before it can be built —
say which one to do first:

1. **Xero** — auto-raise a customer invoice the moment a contractor marks a
   job complete. Needs a Xero developer app + OAuth connection to your Xero
   organisation.
2. **WhatsApp / SMS** — send the "thank you for your hospitality", "on our
   way" (GPS), and "sorry for the delay" (return visit) messages as real
   WhatsApp/text messages, not just in-app chat. Needs Twilio or the WhatsApp
   Business API.
3. **Calendar sync** — two-way sync of return-visit scheduling with a real
   Google/Outlook calendar, so contractors book straight into it.
4. **Email automation** — real emails for each pipeline stage (deposit taken,
   DNO submitted, installation booked, handover, next steps) via an email
   provider (Resend or Postmark), not just office to-dos.
5. **Live GPS tracking** — upgrade the "notify customer" button from a
   one-off ping to a live ETA/location share, if that's wanted.

## Phase 3 — later ideas (not costed yet)

- Deeper CEO insights (job duration trends, contractor performance, revenue
  pipeline).
- Customer-facing photo gallery/report they can download after handover.
- Mobile-optimised contractor flow (camera-first) or a wrapped native app.
- Role/permission refinements (e.g. reception-only task view).

## Suggested next steps

1. Stand up Supabase (see `app/README.md`) and deploy `app/` to Vercel.
2. Bootstrap Mike's admin account, invite one pilot contractor and one pilot
   customer, run one real job end to end through Deposit → Handover.
3. Use that pilot to decide which Phase 2 integration is most valuable first
   — likely Xero (saves admin time immediately) or WhatsApp/SMS (customers
   notice it immediately).
4. Build that one integration, ship it, then move to the next.
