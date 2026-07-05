-- Energy Concerns Job Management — database schema
-- Run this in the Supabase SQL editor for a fresh project.

-- ============================================================
-- Enums
-- ============================================================
create type user_role as enum ('admin', 'contractor', 'customer');
create type project_stage as enum ('deposit', 'dno', 'installation', 'handover', 'complete');
create type task_status as enum ('open', 'done');

-- ============================================================
-- Profiles (extends Supabase auth.users)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'customer',
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Projects (one solar PV installation job)
-- ============================================================
create table projects (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique, -- e.g. EC-2026-014
  customer_id uuid references profiles (id) on delete set null,
  site_address text not null,
  equipment_summary text, -- e.g. "12x 440W panels, 5kW inverter, battery"
  stage project_stage not null default 'deposit',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contractors assigned to a project (many-to-many, usually one primary contractor)
create table project_contractors (
  project_id uuid not null references projects (id) on delete cascade,
  contractor_id uuid not null references profiles (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (project_id, contractor_id)
);

-- ============================================================
-- Photos (installation photos uploaded by contractors)
-- Files live in the `project-photos` storage bucket under {project_id}/{filename}
-- ============================================================
create table photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  uploaded_by uuid not null references profiles (id),
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Messages (per-project chat: admin <-> contractor <-> customer)
-- ============================================================
create table messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  sender_id uuid not null references profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Tasks (admin/reception to-do list, often auto-created on stage changes)
-- ============================================================
create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects (id) on delete cascade,
  title text not null,
  status task_status not null default 'open',
  assigned_to uuid references profiles (id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Sign-offs (customer e-signature confirming completed work)
-- ============================================================
create table signoffs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  signed_by_name text not null,
  signature_data_url text not null, -- PNG data URL captured from the signature pad
  signed_at timestamptz not null default now()
);

-- ============================================================
-- updated_at trigger for projects
-- ============================================================
create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();

-- ============================================================
-- Helper: current user's role (avoids recursive RLS lookups)
-- ============================================================
create function auth_role() returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_contractors enable row level security;
alter table photos enable row level security;
alter table messages enable row level security;
alter table tasks enable row level security;
alter table signoffs enable row level security;

-- Profiles: everyone can read their own profile; admins read all
create policy profiles_self_select on profiles for select
  using (id = auth.uid() or auth_role() = 'admin');
create policy profiles_self_update on profiles for update
  using (id = auth.uid());
create policy profiles_admin_insert on profiles for insert
  with check (auth_role() = 'admin' or id = auth.uid());

-- Projects: admins see all; contractors see assigned; customers see their own
create policy projects_select on projects for select
  using (
    auth_role() = 'admin'
    or customer_id = auth.uid()
    or exists (
      select 1 from project_contractors pc
      where pc.project_id = projects.id and pc.contractor_id = auth.uid()
    )
  );
create policy projects_admin_write on projects for insert with check (auth_role() = 'admin');
create policy projects_update on projects for update
  using (
    auth_role() = 'admin'
    or exists (
      select 1 from project_contractors pc
      where pc.project_id = projects.id and pc.contractor_id = auth.uid()
    )
  );

-- project_contractors: admins manage; contractors can see their own assignments
create policy project_contractors_select on project_contractors for select
  using (
    auth_role() = 'admin'
    or contractor_id = auth.uid()
    or exists (select 1 from projects p where p.id = project_id and p.customer_id = auth.uid())
  );
create policy project_contractors_admin_write on project_contractors for insert with check (auth_role() = 'admin');
create policy project_contractors_admin_delete on project_contractors for delete using (auth_role() = 'admin');

-- Photos: visible to anyone attached to the project; only admin/contractor can upload
create policy photos_select on photos for select
  using (
    auth_role() = 'admin'
    or exists (select 1 from projects p where p.id = project_id and p.customer_id = auth.uid())
    or exists (select 1 from project_contractors pc where pc.project_id = project_id and pc.contractor_id = auth.uid())
  );
create policy photos_insert on photos for insert
  with check (
    auth_role() = 'admin'
    or exists (select 1 from project_contractors pc where pc.project_id = project_id and pc.contractor_id = auth.uid())
  );

-- Messages: visible/writable by anyone attached to the project
create policy messages_select on messages for select
  using (
    auth_role() = 'admin'
    or exists (select 1 from projects p where p.id = project_id and p.customer_id = auth.uid())
    or exists (select 1 from project_contractors pc where pc.project_id = project_id and pc.contractor_id = auth.uid())
  );
create policy messages_insert on messages for insert
  with check (
    sender_id = auth.uid()
    and (
      auth_role() = 'admin'
      or exists (select 1 from projects p where p.id = project_id and p.customer_id = auth.uid())
      or exists (select 1 from project_contractors pc where pc.project_id = project_id and pc.contractor_id = auth.uid())
    )
  );

-- Tasks: admin only (internal reception/office to-do list)
create policy tasks_admin_all on tasks for all
  using (auth_role() = 'admin')
  with check (auth_role() = 'admin');

-- Sign-offs: readable by admin/contractor/customer on the project; insertable by contractor/admin
create policy signoffs_select on signoffs for select
  using (
    auth_role() = 'admin'
    or exists (select 1 from projects p where p.id = project_id and p.customer_id = auth.uid())
    or exists (select 1 from project_contractors pc where pc.project_id = project_id and pc.contractor_id = auth.uid())
  );
create policy signoffs_insert on signoffs for insert
  with check (
    auth_role() = 'admin'
    or exists (select 1 from project_contractors pc where pc.project_id = project_id and pc.contractor_id = auth.uid())
  );

-- ============================================================
-- Realtime (so the in-app chat updates live)
-- ============================================================
alter publication supabase_realtime add table messages;

-- ============================================================
-- Storage bucket for installation photos
-- ============================================================
insert into storage.buckets (id, name, public) values ('project-photos', 'project-photos', false)
  on conflict (id) do nothing;

create policy "project-photos read" on storage.objects for select
  using (bucket_id = 'project-photos');
create policy "project-photos insert" on storage.objects for insert
  with check (bucket_id = 'project-photos' and auth.role() = 'authenticated');
