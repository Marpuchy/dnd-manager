-- Soft-trash for campaign map zones + DM-only visibility for trashed rows.

begin;

alter table public.campaign_map_zones
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

create index if not exists campaign_map_zones_campaign_deleted_idx
  on public.campaign_map_zones (campaign_id, deleted_at);

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

commit;
