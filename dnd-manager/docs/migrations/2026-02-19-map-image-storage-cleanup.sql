-- Persist map image metadata in DB and auto-clean Storage files when rows are deleted/updated.
-- Run in Supabase SQL editor (after campaign world modules migration).

begin;

alter table public.campaign_maps
  add column if not exists image_storage_bucket text,
  add column if not exists image_storage_path text;

-- Backfill map storage metadata from existing public URLs when possible.
with parsed as (
  select
    id,
    regexp_match(image_url, '/storage/v1/object/public/([^/]+)/(.+)$') as m
  from public.campaign_maps
  where image_url is not null
)
update public.campaign_maps cm
set
  image_storage_bucket = coalesce(cm.image_storage_bucket, parsed.m[1]),
  image_storage_path = coalesce(cm.image_storage_path, parsed.m[2])
from parsed
where cm.id = parsed.id
  and parsed.m is not null;

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
    -- Cleanup failures should not block app writes/deletes.
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

create or replace function public.dnd_manager_cleanup_character_profile_image()
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
       and new.profile_image is distinct from old.profile_image
     ) then

    if old.profile_image is not null then
      select p.bucket, p.object_path
      into v_bucket, v_path
      from public.dnd_manager_parse_storage_public_url(old.profile_image) p
      limit 1;

      perform public.dnd_manager_delete_storage_object(v_bucket, v_path);
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_campaign_maps_cleanup_image on public.campaign_maps;
create trigger trg_campaign_maps_cleanup_image
before update or delete on public.campaign_maps
for each row execute function public.dnd_manager_cleanup_campaign_map_image();

drop trigger if exists trg_characters_cleanup_profile_image on public.characters;
create trigger trg_characters_cleanup_profile_image
before update of profile_image or delete on public.characters
for each row execute function public.dnd_manager_cleanup_character_profile_image();

revoke all on function public.dnd_manager_parse_storage_public_url(text) from public;
revoke all on function public.dnd_manager_delete_storage_object(text, text) from public;
revoke all on function public.dnd_manager_cleanup_campaign_map_image() from public;
revoke all on function public.dnd_manager_cleanup_character_profile_image() from public;

commit;
