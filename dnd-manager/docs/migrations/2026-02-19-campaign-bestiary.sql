-- Campaign bestiary schema.
-- Run after campaign world/story modules migration.

begin;

create table if not exists public.campaign_bestiary_entries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null,
  source_type text not null default 'CUSTOM' check (source_type in ('CUSTOM', 'SRD', 'IMPORTED')),
  source_index text,
  source_name text,
  entry_kind text not null default 'ENCOUNTER' check (
    entry_kind in ('ENCOUNTER', 'BOSS', 'ENEMY', 'NPC', 'HAZARD', 'BEAST', 'CUSTOM')
  ),
  act_label text,
  location text,
  creature_size text,
  creature_type text,
  alignment text,
  challenge_rating numeric(6,2),
  xp integer,
  proficiency_bonus integer,
  armor_class integer,
  hit_points integer,
  hit_dice text,
  speed jsonb not null default '{}'::jsonb,
  ability_scores jsonb not null default '{}'::jsonb,
  saving_throws jsonb not null default '{}'::jsonb,
  skills jsonb not null default '{}'::jsonb,
  senses jsonb not null default '{}'::jsonb,
  languages text,
  damage_vulnerabilities text[] not null default '{}'::text[],
  damage_resistances text[] not null default '{}'::text[],
  damage_immunities text[] not null default '{}'::text[],
  condition_immunities text[] not null default '{}'::text[],
  traits jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  bonus_actions jsonb not null default '[]'::jsonb,
  reactions jsonb not null default '[]'::jsonb,
  legendary_actions jsonb not null default '[]'::jsonb,
  lair_actions jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  flavor text,
  notes text,
  image_url text,
  quantity integer not null default 1,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(speed) = 'object'),
  check (jsonb_typeof(ability_scores) = 'object'),
  check (jsonb_typeof(saving_throws) = 'object'),
  check (jsonb_typeof(skills) = 'object'),
  check (jsonb_typeof(senses) = 'object'),
  check (jsonb_typeof(traits) = 'array'),
  check (jsonb_typeof(actions) = 'array'),
  check (jsonb_typeof(bonus_actions) = 'array'),
  check (jsonb_typeof(reactions) = 'array'),
  check (jsonb_typeof(legendary_actions) = 'array'),
  check (jsonb_typeof(lair_actions) = 'array'),
  check (jsonb_typeof(weaknesses) = 'array')
);

create index if not exists campaign_bestiary_entries_campaign_sort_idx
  on public.campaign_bestiary_entries (campaign_id, sort_order, created_at);

create index if not exists campaign_bestiary_entries_campaign_source_idx
  on public.campaign_bestiary_entries (campaign_id, source_type, source_index);

drop trigger if exists trg_campaign_bestiary_entries_updated_at on public.campaign_bestiary_entries;
create trigger trg_campaign_bestiary_entries_updated_at
before update on public.campaign_bestiary_entries
for each row execute function public.dnd_manager_set_updated_at();

alter table public.campaign_bestiary_entries enable row level security;

grant select on table public.campaign_bestiary_entries to authenticated;
grant insert, update, delete on table public.campaign_bestiary_entries to authenticated;

drop policy if exists campaign_bestiary_entries_member_select on public.campaign_bestiary_entries;
create policy campaign_bestiary_entries_member_select
on public.campaign_bestiary_entries
for select
to authenticated
using (public.dnd_manager_is_campaign_member(campaign_id));

drop policy if exists campaign_bestiary_entries_dm_insert on public.campaign_bestiary_entries;
create policy campaign_bestiary_entries_dm_insert
on public.campaign_bestiary_entries
for insert
to authenticated
with check (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_bestiary_entries_dm_update on public.campaign_bestiary_entries;
create policy campaign_bestiary_entries_dm_update
on public.campaign_bestiary_entries
for update
to authenticated
using (public.dnd_manager_is_campaign_dm(campaign_id))
with check (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_bestiary_entries_dm_delete on public.campaign_bestiary_entries;
create policy campaign_bestiary_entries_dm_delete
on public.campaign_bestiary_entries
for delete
to authenticated
using (public.dnd_manager_is_campaign_dm(campaign_id));

commit;
