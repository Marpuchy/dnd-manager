-- Optional global AI training events (explicit user opt-in).
-- Run in Supabase SQL editor.

begin;

create extension if not exists pgcrypto;

create table if not exists public.ai_global_training_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  role text not null check (role in ('DM', 'PLAYER')),
  assistant_mode text not null check (assistant_mode in ('normal', 'training')),
  training_submode text check (training_submode in ('ai_prompt', 'sandbox_object')),
  instruction text not null,
  context_hint text,
  notice_accepted boolean not null default false
);

create index if not exists ai_global_training_events_created_at_idx
  on public.ai_global_training_events (created_at desc);

create index if not exists ai_global_training_events_mode_idx
  on public.ai_global_training_events (assistant_mode, training_submode);

alter table public.ai_global_training_events enable row level security;

-- No direct client access. Server/service role handles writes/reads.
revoke all on table public.ai_global_training_events from public;
revoke all on table public.ai_global_training_events from anon;
revoke all on table public.ai_global_training_events from authenticated;

commit;
