-- Campaign bestiary: player visibility + managed image storage cleanup.
-- Safe to run multiple times.

begin;

alter table public.campaign_bestiary_entries
  add column if not exists is_player_visible boolean not null default false,
  add column if not exists image_storage_bucket text,
  add column if not exists image_storage_path text;

create index if not exists campaign_bestiary_entries_campaign_player_visible_idx
  on public.campaign_bestiary_entries (campaign_id, is_player_visible, sort_order, created_at);

with parsed as (
  select
    id,
    regexp_match(coalesce(image_url, ''), '/storage/v1/object/public/([^/]+)/(.+)$') as m
  from public.campaign_bestiary_entries
  where image_url is not null
    and trim(image_url) <> ''
)
update public.campaign_bestiary_entries cbe
set
  image_storage_bucket = coalesce(cbe.image_storage_bucket, parsed.m[1]),
  image_storage_path = coalesce(cbe.image_storage_path, parsed.m[2])
from parsed
where cbe.id = parsed.id
  and parsed.m is not null;

create or replace function public.dnd_manager_cleanup_campaign_bestiary_image()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket text;
  v_path text;
  v_match text[];
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
      v_match := regexp_match(old.image_url, '/storage/v1/object/public/([^/]+)/(.+)$');
      if v_match is not null then
        v_bucket := coalesce(v_bucket, v_match[1]);
        v_path := coalesce(v_path, v_match[2]);
      end if;
    end if;

    if v_bucket is not null and v_path is not null and trim(v_bucket) <> '' and trim(v_path) <> '' then
      if to_regprocedure('public.dnd_manager_delete_storage_object(text,text)') is not null then
        perform public.dnd_manager_delete_storage_object(v_bucket, v_path);
      elsif to_regclass('storage.objects') is not null then
        delete from storage.objects
        where bucket_id = v_bucket
          and name = v_path;
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_campaign_bestiary_entries_cleanup_image on public.campaign_bestiary_entries;
create trigger trg_campaign_bestiary_entries_cleanup_image
before update or delete on public.campaign_bestiary_entries
for each row execute function public.dnd_manager_cleanup_campaign_bestiary_image();

drop policy if exists campaign_bestiary_entries_member_select on public.campaign_bestiary_entries;
drop policy if exists campaign_bestiary_entries_dm_select on public.campaign_bestiary_entries;
drop policy if exists campaign_bestiary_entries_player_select on public.campaign_bestiary_entries;

create policy campaign_bestiary_entries_dm_select
on public.campaign_bestiary_entries
for select
to authenticated
using (public.dnd_manager_is_campaign_dm(campaign_id));

create policy campaign_bestiary_entries_player_select
on public.campaign_bestiary_entries
for select
to authenticated
using (
  public.dnd_manager_is_campaign_member(campaign_id)
  and is_player_visible = true
);

commit;
