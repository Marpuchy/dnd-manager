-- Ensure imported campaign bestiary creatures always include the 6 base D&D abilities.
-- Safe to run multiple times.

begin;

with source_rows as (
  select
    id,
    coalesce(ability_scores->>'STR', ability_scores->>'str', ability_scores->>'strength', ability_scores->>'fuerza', ability_scores->>'FUE') as str_raw,
    coalesce(ability_scores->>'DEX', ability_scores->>'dex', ability_scores->>'dexterity', ability_scores->>'destreza', ability_scores->>'DES') as dex_raw,
    coalesce(ability_scores->>'CON', ability_scores->>'con', ability_scores->>'constitution', ability_scores->>'constitucion') as con_raw,
    coalesce(ability_scores->>'INT', ability_scores->>'int', ability_scores->>'intelligence', ability_scores->>'inteligencia') as int_raw,
    coalesce(ability_scores->>'WIS', ability_scores->>'wis', ability_scores->>'wisdom', ability_scores->>'sabiduria', ability_scores->>'SAB') as wis_raw,
    coalesce(ability_scores->>'CHA', ability_scores->>'cha', ability_scores->>'charisma', ability_scores->>'carisma', ability_scores->>'CAR') as cha_raw
  from public.campaign_bestiary_entries
  where source_type in ('SRD', 'IMPORTED')
),
normalized as (
  select
    id,
    case when coalesce(str_raw, '') ~ '^-?[0-9]+([.][0-9]+)?$' then str_raw::numeric else 10 end as str_score,
    case when coalesce(dex_raw, '') ~ '^-?[0-9]+([.][0-9]+)?$' then dex_raw::numeric else 10 end as dex_score,
    case when coalesce(con_raw, '') ~ '^-?[0-9]+([.][0-9]+)?$' then con_raw::numeric else 10 end as con_score,
    case when coalesce(int_raw, '') ~ '^-?[0-9]+([.][0-9]+)?$' then int_raw::numeric else 10 end as int_score,
    case when coalesce(wis_raw, '') ~ '^-?[0-9]+([.][0-9]+)?$' then wis_raw::numeric else 10 end as wis_score,
    case when coalesce(cha_raw, '') ~ '^-?[0-9]+([.][0-9]+)?$' then cha_raw::numeric else 10 end as cha_score
  from source_rows
)
update public.campaign_bestiary_entries as cbe
set
  ability_scores = jsonb_build_object(
    'STR', n.str_score,
    'DEX', n.dex_score,
    'CON', n.con_score,
    'INT', n.int_score,
    'WIS', n.wis_score,
    'CHA', n.cha_score
  ),
  updated_at = now()
from normalized as n
where cbe.id = n.id;

commit;
