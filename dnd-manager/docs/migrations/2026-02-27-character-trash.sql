-- Soft-trash for campaign characters.

begin;

alter table public.characters
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

create index if not exists characters_campaign_deleted_idx
  on public.characters (campaign_id, deleted_at);

commit;
