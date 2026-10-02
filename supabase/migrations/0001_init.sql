-- Radar : schéma initial
-- Chaque utilisateur ne voit que ses propres données (Row Level Security).

create table public.profils (
  user_id uuid primary key references auth.users on delete cascade,
  nom text,
  activite text,           -- ce que fait la personne / son entreprise
  secteurs text[] default '{}',
  ambitions text,          -- ce qu'elle cherche (opportunités, risques, idées...)
  cle_api_apercu text,     -- 4 derniers caractères de la clé, pour l'affichage
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Clé API Anthropic chiffrée côté serveur (AES-256-GCM).
-- RLS activée sans aucune politique : seul le serveur (service role) y accède,
-- la clé ne part jamais vers le navigateur.
create table public.cles_api (
  user_id uuid primary key references auth.users on delete cascade,
  chiffree text not null,
  updated_at timestamptz default now()
);

create table public.veilles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nom text not null,
  description text not null,          -- le sujet de la veille, en langage libre
  themes text[] default '{}',
  sources_preferees text[] default '{}',
  langue text default 'fr',
  frequence text not null default 'hebdo' check (frequence in ('hebdo', 'manuelle')),
  active boolean not null default true,
  derniere_execution timestamptz,
  created_at timestamptz default now()
);

create table public.executions (
  id uuid primary key default gen_random_uuid(),
  veille_id uuid not null references public.veilles on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  statut text not null default 'en_cours' check (statut in ('en_cours', 'ok', 'erreur')),
  nb_signaux int default 0,
  erreur text,
  started_at timestamptz default now(),
  finished_at timestamptz
);

-- Même structure qu'un signal de l'artéfact « Radar des signaux faibles ».
create table public.signaux (
  id uuid primary key default gen_random_uuid(),
  veille_id uuid not null references public.veilles on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  execution_id uuid references public.executions on delete set null,
  date date not null default current_date,
  titre text not null,
  categorie text not null check (categorie in ('entreprise', 'societal', 'innovation', 'legislation')),
  synthese text,
  pourquoi text,
  fait text,
  signal text,
  consequences jsonb default '{}'::jsonb,   -- { an1, an3, an5 }
  opportunites jsonb default '[]'::jsonb,   -- [{ titre, cible, modele, premierPas }]
  indicateurs text[] default '{}',
  themes text[] default '{}',
  secteurs text[] default '{}',
  sources jsonb default '[]'::jsonb,        -- [{ label, url }]
  radar jsonb default '{}'::jsonb,          -- { nouveaute, impact, vitesse, certitude, accessibilite } de 1 à 5
  statut text not null default 'nouvelle' check (statut in ('nouvelle', 'a_creuser', 'en_cours', 'ecartee')),
  notes text,
  created_at timestamptz default now()
);

create index on public.veilles (user_id);
create index on public.signaux (user_id, date desc);
create index on public.signaux (veille_id, date desc);
create index on public.executions (veille_id, started_at desc);

alter table public.profils enable row level security;
alter table public.cles_api enable row level security;
alter table public.veilles enable row level security;
alter table public.executions enable row level security;
alter table public.signaux enable row level security;

create policy "profil : le sien" on public.profils
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "veilles : les siennes" on public.veilles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "executions : lecture des siennes" on public.executions
  for select using (auth.uid() = user_id);
create policy "signaux : les siens" on public.signaux
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Crée le profil vide à l'inscription.
create function public.creer_profil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profils (user_id) values (new.id);
  return new;
end;
$$;

create trigger a_l_inscription after insert on auth.users
  for each row execute function public.creer_profil();
