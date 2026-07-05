# Energy Concerns — Job Management

A web app for managing solar PV installation jobs across three portals:

- **Admin** (`/admin`) — CEO/office control: insights, active jobs, to-do list, invite contractors
  and customers, assign contractors, move jobs through the pipeline.
- **Contractor** (`/contractor`) — see assigned jobs, upload installation photos, message the
  office, notify the customer of arrival, schedule a return visit, capture the customer's
  sign-off, mark a job complete.
- **Customer** (`/customer`) — track their job through Deposit → DNO → Installation → Handover,
  chat with the team, see installation photos.

Stack: Next.js 16 (App Router) + Tailwind CSS, Supabase (Postgres, Auth, Storage, Realtime).

## Setup

### 1. Create a Supabase project

Create a free project at [supabase.com](https://supabase.com). In the SQL editor, run the entire
contents of [`supabase/schema.sql`](./supabase/schema.sql). This creates all tables, Row Level
Security policies, and the `project-photos` storage bucket.

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the values from your Supabase project
settings (Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/public key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

The service role key is only used server-side (to invite new contractor/customer accounts from
the People page) — never expose it to the browser.

By default Supabase sends invite emails from its own domain. For production, set up a custom SMTP
sender under Authentication → Settings so invites arrive from your own address.

### 3. Create your own admin account

Since every other account is invited from the People page, you need to bootstrap the first admin
manually:

1. In Supabase, go to Authentication → Users → Add user, create yourself with an email/password.
2. In the SQL editor, run:
   ```sql
   insert into profiles (id, role, full_name)
   values ('<your-user-id-from-step-1>', 'admin', 'Your Name');
   ```
3. Sign in at `/login` — you'll land on `/admin`.

### 4. Run locally

```bash
npm install
npm run dev
```

## Job pipeline

Jobs move through five stages: `deposit → dno → installation → handover → complete`. Admins and
contractors can move a job forward from its detail page. Marking a job `complete` automatically
adds an office to-do to send the handover email, book scaffolding/waste removal, and raise the
invoice.

## Phase 2 (not yet built)

These need your own accounts/API credentials before they can be wired up — say the word when
you're ready and they can be added:

- **Xero** — auto-raise an invoice when a job is marked complete (needs a Xero developer app +
  OAuth connection).
- **WhatsApp / SMS** — send the automated "thank you", "on my way", and "sorry for the delay"
  messages by WhatsApp/text as well as in-app chat (needs Twilio or the WhatsApp Business API).
- **Calendar sync** — two-way sync of return-visit scheduling with Google/Outlook Calendar.
- **Email automation** — currently sign-off and completion events show up in the in-app chat and
  office to-do list; wiring these to actually send emails needs an email provider (e.g. Resend,
  Postmark) and templates for each step of DEPOSIT → DNO → INSTALLATION → HANDOVER.

## Deploying

This app lives in the `/app` subfolder of the `website` repo so it doesn't interfere with the
marketing site. Deploy it as its own Vercel project with the **root directory** set to `app/`, and
add the same environment variables there.
