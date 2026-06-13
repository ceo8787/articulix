-- Articulix — Schéma Supabase
-- Copiez-collez ce SQL dans l'éditeur SQL de Supabase

-- Table des modèles
create table models (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  stock_normal integer default 0,
  stock_gold integer default 0,
  created_at timestamp with time zone default now()
);

-- Table des points de vente
create table venues (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text default '',
  contact text default '',
  sachets_current integer default 0,
  sachets_target integer default 80,
  last_reorder timestamp with time zone,
  notes text default '',
  created_at timestamp with time zone default now()
);

-- Table des réassorts
create table reorders (
  id uuid default gen_random_uuid() primary key,
  venue_id uuid references venues(id) on delete cascade,
  sachets_count integer default 80,
  status text default 'planifié' check (status in ('planifié', 'préparé', 'livré')),
  planned_date date,
  notes text default '',
  created_at timestamp with time zone default now()
);

-- Activer l'accès public (pour commencer sans authentification)
alter table models enable row level security;
alter table venues enable row level security;
alter table reorders enable row level security;

create policy "Public access models" on models for all using (true) with check (true);
create policy "Public access venues" on venues for all using (true) with check (true);
create policy "Public access reorders" on reorders for all using (true) with check (true);
