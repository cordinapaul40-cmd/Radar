-- Radar : jetons personnels du connecteur Claude (MCP).
-- On ne stocke que l'empreinte SHA-256 du jeton ; le jeton lui-même n'est montré qu'une fois.
-- RLS activée sans politique : seul le serveur (service role) y accède.
create table public.jetons_connecteur (
  user_id uuid primary key references auth.users on delete cascade,
  empreinte text not null unique,
  created_at timestamptz default now(),
  dernier_usage timestamptz
);
alter table public.jetons_connecteur enable row level security;

