-- Modular world/story manager schema for campaigns.
-- Run in Supabase SQL editor or migration pipeline.

begin;

create extension if not exists pgcrypto;

create or replace function public.dnd_manager_is_campaign_member(_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaigns c
    where c.id = _campaign_id
      and c.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.campaign_members cm
    where cm.campaign_id = _campaign_id
      and cm.user_id = auth.uid()
  );
$$;

create or replace function public.dnd_manager_is_campaign_dm(_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaigns c
    where c.id = _campaign_id
      and c.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.campaign_members cm
    where cm.campaign_id = _campaign_id
      and cm.user_id = auth.uid()
      and cm.role = 'DM'
  );
$$;

revoke all on function public.dnd_manager_is_campaign_member(uuid) from public;
revoke all on function public.dnd_manager_is_campaign_dm(uuid) from public;
grant execute on function public.dnd_manager_is_campaign_member(uuid) to authenticated;
grant execute on function public.dnd_manager_is_campaign_dm(uuid) to authenticated;

create or replace function public.dnd_manager_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.dnd_manager_parse_storage_public_url(_url text)
returns table(bucket text, object_path text)
language sql
immutable
as $$
  select
    m[1]::text as bucket,
    m[2]::text as object_path
  from regexp_match(coalesce(_url, ''), '/storage/v1/object/public/([^/]+)/(.+)$') as m;
$$;

create or replace function public.dnd_manager_delete_storage_object(_bucket text, _path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if _bucket is null or _path is null or trim(_bucket) = '' or trim(_path) = '' then
    return;
  end if;

  if to_regclass('storage.objects') is null then
    return;
  end if;

  delete from storage.objects
  where bucket_id = _bucket
    and name = _path;
exception
  when others then
    raise notice 'dnd_manager_delete_storage_object: %', sqlerrm;
end;
$$;

create or replace function public.dnd_manager_cleanup_campaign_map_image()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket text;
  v_path text;
begin
  if tg_op = 'DELETE'
     or (
       tg_op = 'UPDATE'
       and (
         new.image_url is distinct from old.image_url
         or new.image_storage_bucket is distinct from old.image_storage_bucket
         or new.image_storage_path is distinct from old.image_storage_path
       )
     ) then

    v_bucket := old.image_storage_bucket;
    v_path := old.image_storage_path;

    if (v_bucket is null or v_path is null) and old.image_url is not null then
      select p.bucket, p.object_path
      into v_bucket, v_path
      from public.dnd_manager_parse_storage_public_url(old.image_url) p
      limit 1;
    end if;

    perform public.dnd_manager_delete_storage_object(v_bucket, v_path);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create table if not exists public.campaign_acts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  title text not null,
  slug text,
  act_number integer not null,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED')),
  summary text,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, act_number)
);

create index if not exists campaign_acts_campaign_sort_idx
  on public.campaign_acts (campaign_id, sort_order, act_number);

create unique index if not exists campaign_acts_campaign_slug_uidx
  on public.campaign_acts (campaign_id, slug)
  where slug is not null;

create table if not exists public.campaign_story_nodes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  act_id uuid references public.campaign_acts(id) on delete set null,
  parent_id uuid references public.campaign_story_nodes(id) on delete cascade,
  node_type text not null check (
    node_type in (
      'WORLD',
      'MODULE',
      'REGION',
      'CITY',
      'DISTRICT',
      'LOCATION',
      'DUNGEON',
      'SCENE',
      'EVENT',
      'NPC',
      'FACTION',
      'QUEST',
      'ITEM',
      'NOTE',
      'CUSTOM'
    )
  ),
  title text not null,
  slug text,
  summary text,
  sort_order integer not null default 0,
  is_hidden boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_id is null or parent_id <> id)
);

create index if not exists campaign_story_nodes_campaign_parent_sort_idx
  on public.campaign_story_nodes (campaign_id, parent_id, sort_order, created_at);

create index if not exists campaign_story_nodes_campaign_type_idx
  on public.campaign_story_nodes (campaign_id, node_type);

create index if not exists campaign_story_nodes_campaign_act_idx
  on public.campaign_story_nodes (campaign_id, act_id);

create unique index if not exists campaign_story_nodes_campaign_slug_uidx
  on public.campaign_story_nodes (campaign_id, slug)
  where slug is not null;

create unique index if not exists campaign_story_nodes_world_root_uidx
  on public.campaign_story_nodes (campaign_id)
  where parent_id is null and node_type = 'WORLD';

create table if not exists public.campaign_story_links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  from_node_id uuid not null references public.campaign_story_nodes(id) on delete cascade,
  to_node_id uuid not null references public.campaign_story_nodes(id) on delete cascade,
  link_type text not null check (link_type in ('RELATED', 'LEADS_TO', 'LOCATED_IN', 'REQUIRES', 'REWARDS', 'LORE', 'CUSTOM')),
  label text,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (from_node_id, to_node_id, link_type, label)
);

create index if not exists campaign_story_links_campaign_from_idx
  on public.campaign_story_links (campaign_id, from_node_id, sort_order);

create index if not exists campaign_story_links_campaign_to_idx
  on public.campaign_story_links (campaign_id, to_node_id);

create table if not exists public.campaign_maps (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  node_id uuid references public.campaign_story_nodes(id) on delete set null,
  parent_map_id uuid references public.campaign_maps(id) on delete set null,
  name text not null,
  description text,
  image_url text not null,
  image_storage_bucket text,
  image_storage_path text,
  width_px integer,
  height_px integer,
  initial_zoom numeric(6,2) not null default 1.00,
  min_zoom numeric(6,2) not null default 0.50,
  max_zoom numeric(6,2) not null default 4.00,
  is_grid_enabled boolean not null default false,
  grid_size integer,
  fog_enabled boolean not null default false,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (grid_size is null or grid_size > 0),
  check (initial_zoom >= min_zoom and initial_zoom <= max_zoom)
);

alter table public.campaign_maps
  add column if not exists image_storage_bucket text,
  add column if not exists image_storage_path text;

create index if not exists campaign_maps_campaign_node_idx
  on public.campaign_maps (campaign_id, node_id);

create index if not exists campaign_maps_campaign_parent_idx
  on public.campaign_maps (campaign_id, parent_map_id, sort_order);

create table if not exists public.campaign_map_zones (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  map_id uuid not null references public.campaign_maps(id) on delete cascade,
  parent_zone_id uuid references public.campaign_map_zones(id) on delete cascade,
  node_id uuid references public.campaign_story_nodes(id) on delete set null,
  name text not null,
  shape_type text not null check (shape_type in ('polygon', 'rect', 'circle', 'ellipse', 'path')),
  geometry jsonb not null,
  action_type text not null default 'OPEN_NODE' check (action_type in ('OPEN_NODE', 'OPEN_MAP', 'OPEN_URL', 'NONE')),
  target_node_id uuid references public.campaign_story_nodes(id) on delete set null,
  target_map_id uuid references public.campaign_maps(id) on delete set null,
  target_url text,
  zoom_on_open numeric(6,2),
  style jsonb not null default '{}'::jsonb,
  is_visible boolean not null default true,
  is_locked boolean not null default false,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(geometry) = 'object'),
  check (
    (action_type = 'OPEN_NODE' and target_node_id is not null and target_map_id is null and target_url is null)
    or (action_type = 'OPEN_MAP' and target_map_id is not null and target_node_id is null and target_url is null)
    or (action_type = 'OPEN_URL' and target_url is not null and target_node_id is null and target_map_id is null)
    or (action_type = 'NONE' and target_node_id is null and target_map_id is null and target_url is null)
  )
);

alter table public.campaign_map_zones
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

create index if not exists campaign_map_zones_campaign_map_sort_idx
  on public.campaign_map_zones (campaign_id, map_id, sort_order);

create index if not exists campaign_map_zones_campaign_target_node_idx
  on public.campaign_map_zones (campaign_id, target_node_id);

create index if not exists campaign_map_zones_campaign_target_map_idx
  on public.campaign_map_zones (campaign_id, target_map_id);

create index if not exists campaign_map_zones_campaign_deleted_idx
  on public.campaign_map_zones (campaign_id, deleted_at);

create table if not exists public.campaign_documents (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  node_id uuid references public.campaign_story_nodes(id) on delete set null,
  title text not null,
  doc_type text not null default 'LORE' check (doc_type in ('LORE', 'SESSION_SCRIPT', 'HANDOUT', 'GM_ONLY', 'PLAYER_NOTE', 'CUSTOM')),
  visibility text not null default 'CAMPAIGN' check (visibility in ('DM_ONLY', 'CAMPAIGN', 'PUBLIC')),
  editor_format text not null default 'TIPTAP_JSON' check (editor_format in ('TIPTAP_JSON', 'MARKDOWN', 'HTML', 'PLAIN_TEXT', 'YJS')),
  content jsonb not null default '{}'::jsonb,
  plain_text text not null default '',
  latest_revision integer not null default 1,
  is_archived boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(plain_text, ''))
  ) stored,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaign_documents_campaign_node_idx
  on public.campaign_documents (campaign_id, node_id, updated_at desc);

create index if not exists campaign_documents_campaign_visibility_idx
  on public.campaign_documents (campaign_id, visibility);

create index if not exists campaign_documents_search_idx
  on public.campaign_documents using gin (search_vector);

create table if not exists public.campaign_document_revisions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  document_id uuid not null references public.campaign_documents(id) on delete cascade,
  revision integer not null,
  editor_format text not null default 'TIPTAP_JSON' check (editor_format in ('TIPTAP_JSON', 'MARKDOWN', 'HTML', 'PLAIN_TEXT', 'YJS')),
  content jsonb not null,
  plain_text text,
  change_summary text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, revision)
);

create index if not exists campaign_document_revisions_campaign_doc_idx
  on public.campaign_document_revisions (campaign_id, document_id, revision desc);

create table if not exists public.campaign_document_comments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  document_id uuid not null references public.campaign_documents(id) on delete cascade,
  anchor jsonb not null default '{}'::jsonb,
  body text not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(anchor) = 'object')
);

create index if not exists campaign_document_comments_campaign_doc_idx
  on public.campaign_document_comments (campaign_id, document_id, created_at desc);

create index if not exists campaign_document_comments_author_idx
  on public.campaign_document_comments (author_id, created_at desc);

-- Auto-update updated_at columns.
drop trigger if exists trg_campaign_acts_updated_at on public.campaign_acts;
create trigger trg_campaign_acts_updated_at
before update on public.campaign_acts
for each row execute function public.dnd_manager_set_updated_at();

drop trigger if exists trg_campaign_story_nodes_updated_at on public.campaign_story_nodes;
create trigger trg_campaign_story_nodes_updated_at
before update on public.campaign_story_nodes
for each row execute function public.dnd_manager_set_updated_at();

drop trigger if exists trg_campaign_maps_updated_at on public.campaign_maps;
create trigger trg_campaign_maps_updated_at
before update on public.campaign_maps
for each row execute function public.dnd_manager_set_updated_at();

drop trigger if exists trg_campaign_maps_cleanup_image on public.campaign_maps;
create trigger trg_campaign_maps_cleanup_image
before update or delete on public.campaign_maps
for each row execute function public.dnd_manager_cleanup_campaign_map_image();

drop trigger if exists trg_campaign_map_zones_updated_at on public.campaign_map_zones;
create trigger trg_campaign_map_zones_updated_at
before update on public.campaign_map_zones
for each row execute function public.dnd_manager_set_updated_at();

drop trigger if exists trg_campaign_documents_updated_at on public.campaign_documents;
create trigger trg_campaign_documents_updated_at
before update on public.campaign_documents
for each row execute function public.dnd_manager_set_updated_at();

drop trigger if exists trg_campaign_document_comments_updated_at on public.campaign_document_comments;
create trigger trg_campaign_document_comments_updated_at
before update on public.campaign_document_comments
for each row execute function public.dnd_manager_set_updated_at();

-- RLS + grants.
alter table public.campaign_acts enable row level security;
alter table public.campaign_story_nodes enable row level security;
alter table public.campaign_story_links enable row level security;
alter table public.campaign_maps enable row level security;
alter table public.campaign_map_zones enable row level security;
alter table public.campaign_documents enable row level security;
alter table public.campaign_document_revisions enable row level security;
alter table public.campaign_document_comments enable row level security;

grant select on table public.campaign_acts to authenticated;
grant select on table public.campaign_story_nodes to authenticated;
grant select on table public.campaign_story_links to authenticated;
grant select on table public.campaign_maps to authenticated;
grant select on table public.campaign_map_zones to authenticated;
grant select on table public.campaign_documents to authenticated;
grant select on table public.campaign_document_revisions to authenticated;
grant select on table public.campaign_document_comments to authenticated;

grant insert, update, delete on table public.campaign_acts to authenticated;
grant insert, update, delete on table public.campaign_story_nodes to authenticated;
grant insert, update, delete on table public.campaign_story_links to authenticated;
grant insert, update, delete on table public.campaign_maps to authenticated;
grant insert, update, delete on table public.campaign_map_zones to authenticated;
grant insert, update, delete on table public.campaign_documents to authenticated;
grant insert, update, delete on table public.campaign_document_revisions to authenticated;
grant insert, update, delete on table public.campaign_document_comments to authenticated;

-- Member read policies.
drop policy if exists campaign_acts_member_select on public.campaign_acts;
create policy campaign_acts_member_select
on public.campaign_acts
for select
to authenticated
using (public.dnd_manager_is_campaign_member(campaign_id));

drop policy if exists campaign_story_nodes_member_select on public.campaign_story_nodes;
create policy campaign_story_nodes_member_select
on public.campaign_story_nodes
for select
to authenticated
using (public.dnd_manager_is_campaign_member(campaign_id));

drop policy if exists campaign_story_links_member_select on public.campaign_story_links;
create policy campaign_story_links_member_select
on public.campaign_story_links
for select
to authenticated
using (public.dnd_manager_is_campaign_member(campaign_id));

drop policy if exists campaign_maps_member_select on public.campaign_maps;
create policy campaign_maps_member_select
on public.campaign_maps
for select
to authenticated
using (public.dnd_manager_is_campaign_member(campaign_id));

drop policy if exists campaign_map_zones_member_select on public.campaign_map_zones;
create policy campaign_map_zones_member_select
on public.campaign_map_zones
for select
to authenticated
using (
  public.dnd_manager_is_campaign_member(campaign_id)
  and (
    deleted_at is null
    or public.dnd_manager_is_campaign_dm(campaign_id)
  )
);

drop policy if exists campaign_documents_member_select on public.campaign_documents;
create policy campaign_documents_member_select
on public.campaign_documents
for select
to authenticated
using (
  public.dnd_manager_is_campaign_member(campaign_id)
  and (
    visibility in ('CAMPAIGN', 'PUBLIC')
    or public.dnd_manager_is_campaign_dm(campaign_id)
  )
);

drop policy if exists campaign_document_revisions_member_select on public.campaign_document_revisions;
create policy campaign_document_revisions_member_select
on public.campaign_document_revisions
for select
to authenticated
using (
  public.dnd_manager_is_campaign_member(campaign_id)
  and exists (
    select 1
    from public.campaign_documents d
    where d.id = campaign_document_revisions.document_id
      and d.campaign_id = campaign_document_revisions.campaign_id
      and (
        d.visibility in ('CAMPAIGN', 'PUBLIC')
        or public.dnd_manager_is_campaign_dm(campaign_document_revisions.campaign_id)
      )
  )
);

drop policy if exists campaign_document_comments_member_select on public.campaign_document_comments;
create policy campaign_document_comments_member_select
on public.campaign_document_comments
for select
to authenticated
using (
  public.dnd_manager_is_campaign_member(campaign_id)
  and exists (
    select 1
    from public.campaign_documents d
    where d.id = campaign_document_comments.document_id
      and d.campaign_id = campaign_document_comments.campaign_id
      and (
        d.visibility in ('CAMPAIGN', 'PUBLIC')
        or public.dnd_manager_is_campaign_dm(campaign_document_comments.campaign_id)
      )
  )
);

-- DM write policies.
drop policy if exists campaign_acts_dm_insert on public.campaign_acts;
create policy campaign_acts_dm_insert
on public.campaign_acts
for insert
to authenticated
with check (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_acts_dm_update on public.campaign_acts;
create policy campaign_acts_dm_update
on public.campaign_acts
for update
to authenticated
using (public.dnd_manager_is_campaign_dm(campaign_id))
with check (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_acts_dm_delete on public.campaign_acts;
create policy campaign_acts_dm_delete
on public.campaign_acts
for delete
to authenticated
using (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_story_nodes_dm_insert on public.campaign_story_nodes;
create policy campaign_story_nodes_dm_insert
on public.campaign_story_nodes
for insert
to authenticated
with check (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_story_nodes_dm_update on public.campaign_story_nodes;
create policy campaign_story_nodes_dm_update
on public.campaign_story_nodes
for update
to authenticated
using (public.dnd_manager_is_campaign_dm(campaign_id))
with check (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_story_nodes_dm_delete on public.campaign_story_nodes;
create policy campaign_story_nodes_dm_delete
on public.campaign_story_nodes
for delete
to authenticated
using (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_story_links_dm_insert on public.campaign_story_links;
create policy campaign_story_links_dm_insert
on public.campaign_story_links
for insert
to authenticated
with check (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_story_links_dm_update on public.campaign_story_links;
create policy campaign_story_links_dm_update
on public.campaign_story_links
for update
to authenticated
using (public.dnd_manager_is_campaign_dm(campaign_id))
with check (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_story_links_dm_delete on public.campaign_story_links;
create policy campaign_story_links_dm_delete
on public.campaign_story_links
for delete
to authenticated
using (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_maps_dm_insert on public.campaign_maps;
create policy campaign_maps_dm_insert
on public.campaign_maps
for insert
to authenticated
with check (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_maps_dm_update on public.campaign_maps;
create policy campaign_maps_dm_update
on public.campaign_maps
for update
to authenticated
using (public.dnd_manager_is_campaign_dm(campaign_id))
with check (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_maps_dm_delete on public.campaign_maps;
create policy campaign_maps_dm_delete
on public.campaign_maps
for delete
to authenticated
using (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_map_zones_dm_insert on public.campaign_map_zones;
create policy campaign_map_zones_dm_insert
on public.campaign_map_zones
for insert
to authenticated
with check (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_map_zones_dm_update on public.campaign_map_zones;
create policy campaign_map_zones_dm_update
on public.campaign_map_zones
for update
to authenticated
using (public.dnd_manager_is_campaign_dm(campaign_id))
with check (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_map_zones_dm_delete on public.campaign_map_zones;
create policy campaign_map_zones_dm_delete
on public.campaign_map_zones
for delete
to authenticated
using (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_documents_dm_insert on public.campaign_documents;
create policy campaign_documents_dm_insert
on public.campaign_documents
for insert
to authenticated
with check (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_documents_dm_update on public.campaign_documents;
create policy campaign_documents_dm_update
on public.campaign_documents
for update
to authenticated
using (public.dnd_manager_is_campaign_dm(campaign_id))
with check (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_documents_dm_delete on public.campaign_documents;
create policy campaign_documents_dm_delete
on public.campaign_documents
for delete
to authenticated
using (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_document_revisions_dm_insert on public.campaign_document_revisions;
create policy campaign_document_revisions_dm_insert
on public.campaign_document_revisions
for insert
to authenticated
with check (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_document_revisions_dm_update on public.campaign_document_revisions;
create policy campaign_document_revisions_dm_update
on public.campaign_document_revisions
for update
to authenticated
using (public.dnd_manager_is_campaign_dm(campaign_id))
with check (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists campaign_document_revisions_dm_delete on public.campaign_document_revisions;
create policy campaign_document_revisions_dm_delete
on public.campaign_document_revisions
for delete
to authenticated
using (public.dnd_manager_is_campaign_dm(campaign_id));

-- Member comment policies.
drop policy if exists campaign_document_comments_member_insert on public.campaign_document_comments;
create policy campaign_document_comments_member_insert
on public.campaign_document_comments
for insert
to authenticated
with check (
  public.dnd_manager_is_campaign_member(campaign_id)
  and author_id = auth.uid()
  and exists (
    select 1
    from public.campaign_documents d
    where d.id = campaign_document_comments.document_id
      and d.campaign_id = campaign_document_comments.campaign_id
      and (
        d.visibility in ('CAMPAIGN', 'PUBLIC')
        or public.dnd_manager_is_campaign_dm(campaign_document_comments.campaign_id)
      )
  )
);

drop policy if exists campaign_document_comments_member_update on public.campaign_document_comments;
create policy campaign_document_comments_member_update
on public.campaign_document_comments
for update
to authenticated
using (
  (
    author_id = auth.uid()
    or public.dnd_manager_is_campaign_dm(campaign_id)
  )
  and exists (
    select 1
    from public.campaign_documents d
    where d.id = campaign_document_comments.document_id
      and d.campaign_id = campaign_document_comments.campaign_id
      and (
        d.visibility in ('CAMPAIGN', 'PUBLIC')
        or public.dnd_manager_is_campaign_dm(campaign_document_comments.campaign_id)
      )
  )
)
with check (
  (
    (author_id = auth.uid() and public.dnd_manager_is_campaign_member(campaign_id))
    or public.dnd_manager_is_campaign_dm(campaign_id)
  )
  and exists (
    select 1
    from public.campaign_documents d
    where d.id = campaign_document_comments.document_id
      and d.campaign_id = campaign_document_comments.campaign_id
      and (
        d.visibility in ('CAMPAIGN', 'PUBLIC')
        or public.dnd_manager_is_campaign_dm(campaign_document_comments.campaign_id)
      )
  )
);

drop policy if exists campaign_document_comments_member_delete on public.campaign_document_comments;
create policy campaign_document_comments_member_delete
on public.campaign_document_comments
for delete
to authenticated
using (
  (
    author_id = auth.uid()
    or public.dnd_manager_is_campaign_dm(campaign_id)
  )
  and exists (
    select 1
    from public.campaign_documents d
    where d.id = campaign_document_comments.document_id
      and d.campaign_id = campaign_document_comments.campaign_id
      and (
        d.visibility in ('CAMPAIGN', 'PUBLIC')
        or public.dnd_manager_is_campaign_dm(campaign_document_comments.campaign_id)
      )
  )
);

commit;
