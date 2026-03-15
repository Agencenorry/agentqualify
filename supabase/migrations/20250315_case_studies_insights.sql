-- Réalisations clients (case studies) + Stats & insights
create table if not exists case_studies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  client_id uuid references clients(id) on delete cascade not null,
  sector text not null,
  sector_keywords text[] default '{}',
  company_name text not null,
  result text not null,
  description text,
  logo_url text,
  case_url text,
  is_active boolean default true
);

create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  client_id uuid references clients(id) on delete cascade not null,
  challenge_keywords text[] not null default '{}',
  stat text not null,
  context text not null,
  source text,
  is_active boolean default true
);

create index if not exists idx_case_studies_client_id on case_studies(client_id);
create index if not exists idx_insights_client_id on insights(client_id);
