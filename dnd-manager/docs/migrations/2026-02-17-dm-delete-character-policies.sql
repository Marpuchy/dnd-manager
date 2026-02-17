-- Grant DM delete permissions over campaign characters and child rows.
-- Run this in Supabase SQL editor (or your migration pipeline).

begin;

alter table public.characters enable row level security;
alter table public.character_stats enable row level security;
alter table public.character_spells enable row level security;
alter table public.character_weapons enable row level security;
alter table public.character_armors enable row level security;
alter table public.character_equipments enable row level security;

insert into public.campaign_members (user_id, campaign_id, role)
select c.owner_id, c.id, 'DM'
from public.campaigns c
on conflict (user_id, campaign_id) do update
set role = excluded.role;

grant delete on table public.characters to authenticated;
grant delete on table public.character_stats to authenticated;
grant delete on table public.character_spells to authenticated;
grant delete on table public.character_weapons to authenticated;
grant delete on table public.character_armors to authenticated;
grant delete on table public.character_equipments to authenticated;

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

create or replace function public.dnd_manager_is_character_dm(_character_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.characters c
    where c.id = _character_id
      and public.dnd_manager_is_campaign_dm(c.campaign_id)
  );
$$;

revoke all on function public.dnd_manager_is_campaign_dm(uuid) from public;
revoke all on function public.dnd_manager_is_character_dm(uuid) from public;
grant execute on function public.dnd_manager_is_campaign_dm(uuid) to authenticated;
grant execute on function public.dnd_manager_is_character_dm(uuid) to authenticated;

drop policy if exists dnd_manager_dm_delete_characters on public.characters;
create policy dnd_manager_dm_delete_characters
on public.characters
for delete
to authenticated
using (public.dnd_manager_is_campaign_dm(campaign_id));

drop policy if exists dnd_manager_dm_delete_character_stats on public.character_stats;
create policy dnd_manager_dm_delete_character_stats
on public.character_stats
for delete
to authenticated
using (public.dnd_manager_is_character_dm(character_id));

drop policy if exists dnd_manager_dm_delete_character_spells on public.character_spells;
create policy dnd_manager_dm_delete_character_spells
on public.character_spells
for delete
to authenticated
using (public.dnd_manager_is_character_dm(character_id));

drop policy if exists dnd_manager_dm_delete_character_weapons on public.character_weapons;
create policy dnd_manager_dm_delete_character_weapons
on public.character_weapons
for delete
to authenticated
using (public.dnd_manager_is_character_dm(character_id));

drop policy if exists dnd_manager_dm_delete_character_armors on public.character_armors;
create policy dnd_manager_dm_delete_character_armors
on public.character_armors
for delete
to authenticated
using (public.dnd_manager_is_character_dm(character_id));

drop policy if exists dnd_manager_dm_delete_character_equipments on public.character_equipments;
create policy dnd_manager_dm_delete_character_equipments
on public.character_equipments
for delete
to authenticated
using (public.dnd_manager_is_character_dm(character_id));

commit;
