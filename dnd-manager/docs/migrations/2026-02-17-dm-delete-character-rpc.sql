-- RPC delete helper for DM character deletion.
-- Use this if direct DELETE policies are still failing.
-- Run in Supabase SQL editor.

begin;

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

create or replace function public.dnd_manager_dm_delete_character(
  _campaign_id uuid,
  _character_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _deleted_count integer := 0;
begin
  if not public.dnd_manager_is_campaign_dm(_campaign_id) then
    raise exception 'not_authorized_dm_delete'
      using errcode = '42501';
  end if;

  delete from public.character_stats where character_id = _character_id;
  delete from public.character_spells where character_id = _character_id;
  delete from public.character_weapons where character_id = _character_id;
  delete from public.character_armors where character_id = _character_id;
  delete from public.character_equipments where character_id = _character_id;

  delete from public.characters
  where id = _character_id
    and campaign_id = _campaign_id;

  get diagnostics _deleted_count = row_count;
  return _deleted_count > 0;
end;
$$;

revoke all on function public.dnd_manager_dm_delete_character(uuid, uuid) from public;
grant execute on function public.dnd_manager_dm_delete_character(uuid, uuid) to authenticated;

commit;
