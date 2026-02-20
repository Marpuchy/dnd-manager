-- Global AI learning digests and subscriptions.
-- Safe to run multiple times.

begin;

create extension if not exists pgcrypto;

create table if not exists public.ai_global_learning_digests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  generated_at timestamptz not null default now(),
  frequency text not null check (frequency in ('daily', 'weekly')),
  period_start date not null,
  period_end date not null,
  source_event_count integer not null default 0 check (source_event_count >= 0),
  edit_feedback_count integer not null default 0 check (edit_feedback_count >= 0),
  summary_markdown text not null,
  summary_json jsonb not null default '{}'::jsonb check (jsonb_typeof(summary_json) = 'object'),
  delivered_to text[] not null default '{}'::text[],
  email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'skipped', 'failed')),
  email_error text
);

create unique index if not exists ai_global_learning_digests_frequency_period_uidx
  on public.ai_global_learning_digests (frequency, period_start, period_end);

create index if not exists ai_global_learning_digests_period_idx
  on public.ai_global_learning_digests (period_end desc, frequency);

create table if not exists public.ai_global_learning_subscribers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  frequency text not null default 'weekly' check (frequency in ('daily', 'weekly')),
  is_active boolean not null default true,
  note text
);

create unique index if not exists ai_global_learning_subscribers_email_frequency_uidx
  on public.ai_global_learning_subscribers (lower(email), frequency);

create index if not exists ai_global_learning_subscribers_active_frequency_idx
  on public.ai_global_learning_subscribers (is_active, frequency);

alter table public.ai_global_learning_digests enable row level security;
alter table public.ai_global_learning_subscribers enable row level security;

revoke all on table public.ai_global_learning_digests from public;
revoke all on table public.ai_global_learning_digests from anon;
revoke all on table public.ai_global_learning_digests from authenticated;

revoke all on table public.ai_global_learning_subscribers from public;
revoke all on table public.ai_global_learning_subscribers from anon;
revoke all on table public.ai_global_learning_subscribers from authenticated;

commit;

