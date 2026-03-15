-- AgentQualify by Norry — Schéma Supabase
-- Exécuter ce script dans l'éditeur SQL de Supabase pour créer les tables

-- Clients de Norry
create table clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  website_url text,
  contact_email text,
  is_active boolean default true,

  -- Config agent
  agent_name text default 'Alex',
  agent_greeting text,
  business_description text,
  business_offers text,
  icp text,
  disqualify_criteria text,
  qualification_questions jsonb default '[]',
  rdv_link text,
  notification_email text,

  -- Widget
  widget_color text default '#1a1917',
  widget_position text default 'bottom-right',

  -- Déclencheurs (règles d'ouverture de l'overlay)
  triggers jsonb default '[]'
);

-- Leads qualifiés
create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  client_id uuid references clients(id) on delete cascade,

  -- Données prospect
  name text,
  email text,
  company text,
  role text,
  team_size text,
  main_challenge text,
  budget text,

  -- Qualification
  score integer,
  status text check (status in ('hot', 'warm', 'cold')),
  summary text,
  rdv_proposed boolean default false,
  rdv_booked boolean default false,

  -- Source
  conversation_id uuid
);

-- Conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  client_id uuid references clients(id) on delete cascade,
  lead_id uuid references leads(id),
  messages jsonb default '[]',
  is_qualified boolean default false,
  visitor_info jsonb default '{}'
);

-- Index pour les requêtes fréquentes
create index idx_leads_client_id on leads(client_id);
create index idx_leads_created_at on leads(created_at desc);
create index idx_conversations_client_id on conversations(client_id);
create index idx_conversations_lead_id on conversations(lead_id);

-- RLS : accès réservé au service role (dashboard et API). Pas d'accès anon direct.
alter table clients enable row level security;
alter table leads enable row level security;
alter table conversations enable row level security;
-- Aucune policy pour anon/auth : seul le service role (bypass RLS) peut lire/écrire.
