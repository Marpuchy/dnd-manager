"use client";

import React, { useMemo } from "react";
import { Details, Stats } from "../../playerShared";
import {
  Award,
  Brain,
  Dice5,
  Dumbbell,
  Eye,
  Feather,
  Heart,
  HeartPulse,
  Shield,
  Star,
  Wind,
  Zap,
} from "lucide-react";
import StatsHexagon from "../../../../../components/StatsHexagon";
import Markdown from "@/app/components/Markdown";
import SpellSlotsPanel from "@/app/components/SpellSlotsPanel";
import { abilityModifier, formatModifier } from "./statsHelpers";
import {
  MODIFIER_TARGETS,
  getLocalizedText,
  getModifierTotal,
  getModifierSources,
  normalizeTarget,
} from "@/lib/character/items";
import { useClientLocale } from "@/lib/i18n/useClientLocale";
import {
  SKILL_DEFINITIONS,
  getSkillLabel,
  type SkillDefinition,
} from "@/lib/dnd/skills";
import type { AbilityKey, CustomFeatureEntry, SkillKey } from "@/lib/types/dnd";
import { tr } from "@/lib/i18n/translate";

type MetricCardProps = {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
};

function MetricCard({ label, value, sub, icon }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-ring bg-panel/80 px-3 py-2 flex items-center gap-3">
      {icon ? (
        <div className="h-9 w-9 rounded-full border border-accent/20 bg-accent/10 text-accent-strong flex items-center justify-center">
          {icon}
        </div>
      ) : null}
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-ink-muted">
          {label}
        </div>
        <div className="mt-1 text-lg font-semibold text-ink">{value}</div>
        {sub ? (
          <div className="text-[11px] text-ink-muted mt-1">{sub}</div>
        ) : null}
      </div>
    </div>
  );
}

function MetricCardCompact({ label, value, icon }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-ring bg-panel/80 px-2 py-1.5 flex items-center gap-2 w-full min-w-0">
      {icon ? (
        <div className="h-7 w-7 rounded-full border border-accent/20 bg-accent/10 text-accent-strong flex items-center justify-center">
          {icon}
        </div>
      ) : null}
      <div>
        <div className="text-[9px] uppercase tracking-[0.2em] text-ink-muted">
          {label}
        </div>
        <div className="text-sm font-semibold text-ink">{value}</div>
      </div>
    </div>
  );
}

const targetLabelMap = new Map(
  MODIFIER_TARGETS.map((entry) => [entry.key, entry.label])
);

const targetLabelEnMap = new Map<string, string>([
  ["STR", "Strength (STR)"],
  ["DEX", "Dexterity (DEX)"],
  ["CON", "Constitution (CON)"],
  ["INT", "Intelligence (INT)"],
  ["WIS", "Wisdom (WIS)"],
  ["CHA", "Charisma (CHA)"],
  ["AC", "Armor Class (AC)"],
  ["HP_MAX", "Maximum HP"],
  ["HP_CURRENT", "Current HP"],
  ["SPEED", "Speed"],
  ["INITIATIVE", "Initiative"],
  ["PROFICIENCY", "Proficiency Bonus"],
  ["PASSIVE_PERCEPTION", "Passive Perception"],
  ["SPELL_ATTACK", "Spell Attack"],
  ["SPELL_DC", "Spell DC"],
  ["ATTACK_BONUS", "Attack Bonus"],
  ["DAMAGE_BONUS", "Damage Bonus"],
  ["SAVE_STR", "Saving Throw STR"],
  ["SAVE_DEX", "Saving Throw DEX"],
  ["SAVE_CON", "Saving Throw CON"],
  ["SAVE_INT", "Saving Throw INT"],
  ["SAVE_WIS", "Saving Throw WIS"],
  ["SAVE_CHA", "Saving Throw CHA"],
  ["SKILL_ACROBATICS", "Skill: Acrobatics"],
  ["SKILL_ANIMAL_HANDLING", "Skill: Animal Handling"],
  ["SKILL_ARCANA", "Skill: Arcana"],
  ["SKILL_ATHLETICS", "Skill: Athletics"],
  ["SKILL_DECEPTION", "Skill: Deception"],
  ["SKILL_HISTORY", "Skill: History"],
  ["SKILL_INSIGHT", "Skill: Insight"],
  ["SKILL_INTIMIDATION", "Skill: Intimidation"],
  ["SKILL_INVESTIGATION", "Skill: Investigation"],
  ["SKILL_MEDICINE", "Skill: Medicine"],
  ["SKILL_NATURE", "Skill: Nature"],
  ["SKILL_PERCEPTION", "Skill: Perception"],
  ["SKILL_PERFORMANCE", "Skill: Performance"],
  ["SKILL_PERSUASION", "Skill: Persuasion"],
  ["SKILL_RELIGION", "Skill: Religion"],
  ["SKILL_SLEIGHT_OF_HAND", "Skill: Sleight of Hand"],
  ["SKILL_STEALTH", "Skill: Stealth"],
  ["SKILL_SURVIVAL", "Skill: Survival"],
]);

function getTargetLabel(target: string, locale: string) {
  const normalized = normalizeTarget(target);
  if (locale === "en") {
    return targetLabelEnMap.get(normalized) ?? target;
  }
  return targetLabelMap.get(normalized) ?? target;
}

export default function StatsPanel({
  character,
  details,
  statsRow,
  totalAC,
  totalSpeed,
  totalCurrentHp,
  totalMaxHp,
  proficiencyBonus,
  initiative,
  passivePerception,
  totalStr,
  totalDex,
  totalCon,
  totalInt,
  totalWis,
  totalCha,
  onImageUpdated,
}: {
  character: any;
  details: Details | null;
  statsRow: Partial<Stats> | Record<string, number>;
  totalAC: number;
  totalSpeed: number;
  totalCurrentHp: number;
  totalMaxHp: number;
  proficiencyBonus: number;
  initiative: number;
  passivePerception: number;
  totalStr: number;
  totalDex: number;
  totalCon: number;
  totalInt: number;
  totalWis: number;
  totalCha: number;
  onImageUpdated?: () => void;
}) {
  const items = Array.isArray(details?.items) ? details.items : [];
  const equippedItems = items.filter((item) => item.equipped);
  const locale = useClientLocale();
  const isEnglish = locale === "en";
  const customTraits = Array.isArray(details?.customTraits) ? details.customTraits : [];
  const customClassAbilities = Array.isArray(details?.customClassAbilities)
    ? details.customClassAbilities
    : [];
  const customNonActionClassAbilities = customClassAbilities.filter(
    (ability) => ability.actionType !== "action"
  );
  const actionTypeLabel: Record<string, string> = {
    action: tr(locale, "Accion", "Action"),
    bonus: tr(locale, "Accion bonus", "Bonus action"),
    reaction: tr(locale, "Reaccion", "Reaction"),
    passive: tr(locale, "Pasiva", "Passive"),
  };
  const skillProficiencies = details?.skillProficiencies ?? {};
  const spellSlotModifiers = useMemo(() => {
    const next: Record<string, number> = {};
    const adjustments = Array.isArray(details?.manualAdjustments)
      ? details.manualAdjustments
      : [];
    for (const adjustment of adjustments) {
      const target = String(adjustment?.target ?? "").toUpperCase();
      if (!target.startsWith("SPELL_SLOT_")) continue;
      const level = target.replace("SPELL_SLOT_", "").trim();
      const numericLevel = Number(level);
      if (!Number.isFinite(numericLevel) || numericLevel < 1 || numericLevel > 9) continue;
      const value = Number(adjustment?.value ?? 0);
      if (!Number.isFinite(value) || value === 0) continue;
      next[level] = (next[level] ?? 0) + value;
    }
    return next;
  }, [details?.manualAdjustments]);

  const classLabels: Record<string, { es: string; en: string }> = {
    barbarian: { es: "Barbaro", en: "Barbarian" },
    bard: { es: "Bardo", en: "Bard" },
    cleric: { es: "Clerigo", en: "Cleric" },
    druid: { es: "Druida", en: "Druid" },
    fighter: { es: "Guerrero", en: "Fighter" },
    monk: { es: "Monje", en: "Monk" },
    paladin: { es: "Paladin", en: "Paladin" },
    ranger: { es: "Explorador", en: "Ranger" },
    rogue: { es: "Picaro", en: "Rogue" },
    sorcerer: { es: "Hechicero", en: "Sorcerer" },
    warlock: { es: "Brujo", en: "Warlock" },
    wizard: { es: "Mago", en: "Wizard" },
    artificer: { es: "Artificiero", en: "Artificer" },
    custom: { es: "Clase personalizada", en: "Custom class" },
  };

  function getFeatureContent(
    feature: CustomFeatureEntry,
    includeActionType: boolean
  ): string {
    const desc = getLocalizedText(feature.description, locale)?.trim() ?? "";
    const lines: string[] = [];
    const pushMarkdownField = (
      label: string,
      value: string | number | null | undefined
    ) => {
      const text = value == null ? "" : String(value).trim();
      if (!text) return;
      lines.push(`**${label}:**\n\n${text}`);
    };

    if (includeActionType && feature.actionType) {
      pushMarkdownField(
        tr(locale, "Tipo", "Type"),
        actionTypeLabel[feature.actionType] ?? feature.actionType
      );
    }
    if (feature.requirements) {
      pushMarkdownField(
        tr(locale, "Requisitos", "Requirements"),
        feature.requirements
      );
    }
    if (feature.effect) {
      pushMarkdownField(tr(locale, "Efecto", "Effect"), feature.effect);
    }
    if (feature.resourceCost) {
      const parts: string[] = [];
      if (feature.resourceCost.usesSpellSlot) {
        parts.push(
          tr(locale, "Gasta espacio de conjuro", "Uses spell slot") +
            (feature.resourceCost.slotLevel
              ? ` (${tr(locale, "nivel", "level")} ${feature.resourceCost.slotLevel})`
              : "")
        );
      }
      if (feature.resourceCost.charges != null) {
        const rechargeText =
          feature.resourceCost.recharge === "long"
            ? tr(locale, "descanso largo", "long rest")
            : tr(locale, "descanso corto", "short rest");
        parts.push(
          `${feature.resourceCost.charges} ${tr(
            locale,
            feature.resourceCost.charges === 1 ? "carga" : "cargas",
            feature.resourceCost.charges === 1 ? "charge" : "charges"
          )}${feature.resourceCost.recharge ? ` / ${rechargeText}` : ""}`
        );
      }
      if (feature.resourceCost.points != null) {
        parts.push(
          `${feature.resourceCost.points} ${
            feature.resourceCost.pointsLabel || tr(locale, "puntos", "points")
          }`
        );
      }
      if (parts.length > 0) {
        pushMarkdownField(tr(locale, "Coste", "Cost"), parts.join(", "));
      }
    }
    pushMarkdownField(tr(locale, "Descripcion", "Description"), desc);

    return lines.join("\n\n");
  }
  const classId = String(character?.class ?? "")
    .toLowerCase()
    .trim();
  const localizedClassName =
    classLabels[classId]?.[isEnglish ? "en" : "es"] ??
    (character?.class || tr(locale, "Sin clase", "No class"));

  const abilityScores: Record<AbilityKey, number> = {
    STR: totalStr,
    DEX: totalDex,
    CON: totalCon,
    INT: totalInt,
    WIS: totalWis,
    CHA: totalCha,
  };
  const abilityShort: Record<AbilityKey, string> = {
    STR: isEnglish ? "STR" : "FUE",
    DEX: isEnglish ? "DEX" : "DES",
    CON: "CON",
    INT: "INT",
    WIS: isEnglish ? "WIS" : "SAB",
    CHA: isEnglish ? "CHA" : "CAR",
  };

  const skillOrder: SkillKey[] = [
    "acrobatics",
    "animalHandling",
    "arcana",
    "athletics",
    "deception",
    "history",
    "insight",
    "intimidation",
    "investigation",
    "medicine",
    "nature",
    "perception",
    "performance",
    "persuasion",
    "religion",
    "sleightOfHand",
    "stealth",
    "survival",
  ];
  const orderedSkills: SkillDefinition[] = skillOrder
    .map((key) => SKILL_DEFINITIONS.find((skill) => skill.key === key))
    .filter(Boolean) as SkillDefinition[];

  function getSkillBonusValue(skill: SkillDefinition): number {
    const raw = (skillProficiencies as Record<string, number | boolean>)[skill.key];
    if (raw === true) return 2;
    if (typeof raw === "number") return raw === 2 ? 2 : 1;
    return 0;
  }

  function getSkillTotal(skill: SkillDefinition) {
    const base = abilityModifier(abilityScores[skill.ability] ?? 10);
    const proficiency = getSkillBonusValue(skill);
    const itemBonus = getModifierTotal(details ?? undefined, skill.modifierTarget);
    return base + proficiency + itemBonus;
  }

  const profileImage = character?.profile_image;

  const bonusSources = useMemo(() => {
    const keys = ["STR", "DEX", "CON", "INT", "WIS", "CHA"] as const;
    return Object.fromEntries(
      keys.map((key) => [key, getModifierSources(details ?? undefined, key)])
    ) as Record<
      (typeof keys)[number],
      { total: number; sources: { source: string; value: number }[] }
    >;
  }, [details]);

  function getBonusDetails(stat: keyof typeof bonusSources) {
    return bonusSources[stat]?.sources ?? [];
  }

  function hasBonus(stat: keyof typeof bonusSources) {
    return getBonusDetails(stat).length > 0;
  }

  const statEntries = [
    {
      key: abilityShort.STR,
      label: tr(locale, "Fuerza", "Strength"),
      value: totalStr,
      raw: "STR",
      icon: Dumbbell,
    },
    {
      key: abilityShort.DEX,
      label: tr(locale, "Destreza", "Dexterity"),
      value: totalDex,
      raw: "DEX",
      icon: Feather,
    },
    {
      key: abilityShort.CON,
      label: tr(locale, "Constitucion", "Constitution"),
      value: totalCon,
      raw: "CON",
      icon: Heart,
    },
    {
      key: abilityShort.INT,
      label: tr(locale, "Inteligencia", "Intelligence"),
      value: totalInt,
      raw: "INT",
      icon: Brain,
    },
    {
      key: abilityShort.WIS,
      label: tr(locale, "Sabiduria", "Wisdom"),
      value: totalWis,
      raw: "WIS",
      icon: Eye,
    },
    {
      key: abilityShort.CHA,
      label: tr(locale, "Carisma", "Charisma"),
      value: totalCha,
      raw: "CHA",
      icon: Star,
    },
  ] as const;

  return (
    <div className="space-y-6 min-w-0 overflow-x-hidden">
      <section className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="rounded-3xl border border-ring bg-panel/90 p-4">
          <div className="w-full max-w-[220px] lg:max-w-none mx-auto aspect-[4/5] rounded-2xl overflow-hidden bg-white/70 border border-ring">
            {profileImage?.startsWith("http") ? (
              <img
                src={profileImage}
                alt={tr(locale, "Imagen del personaje", "Character image")}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted">
                {tr(locale, "Sin imagen", "No image")}
              </div>
            )}
          </div>
          {details?.portraitNote && (
            <div className="mt-3 rounded-xl border border-ring bg-white/70 p-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                {tr(locale, "Nota personal", "Personal note")}
              </p>
              <Markdown content={details.portraitNote} className="text-xs text-ink mt-1" />
            </div>
          )}
        </div>

        <div className="space-y-3 min-w-0">
          <div className="rounded-3xl border border-ring bg-panel/90 p-[var(--panel-pad)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.35em] text-ink-muted">
                  {tr(locale, "Hoja de personaje", "Character sheet")}
                </div>
                <h2 className="text-2xl font-display font-semibold text-ink">
                  {character?.name ?? tr(locale, "Personaje", "Character")}
                </h2>
                <p className="text-sm text-ink-muted">
                  {character?.race ?? tr(locale, "Sin raza", "No race")} · {localizedClassName} · {tr(locale, "Nivel", "Level")}{" "}
                  {character?.level ?? "?"}
                </p>
              </div>
              <div className="grid gap-3 text-xs text-ink-muted sm:grid-cols-2 min-w-0">
                {details?.background && (
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em]">
                      {tr(locale, "Trasfondo", "Background")}
                    </span>
                    <div className="text-ink">{details.background}</div>
                  </div>
                )}
                {details?.alignment && (
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em]">
                      {tr(locale, "Alineamiento", "Alignment")}
                    </span>
                    <div className="text-ink">{details.alignment}</div>
                  </div>
                )}
                {character?.experience != null && (
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em]">XP</span>
                    <div className="text-ink">{character.experience}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricCardCompact
              label={tr(locale, "Clase de armadura", "Armor class")}
              value={totalAC}
              icon={<Shield className="h-3.5 w-3.5" />}
            />
            <MetricCardCompact
              label={tr(locale, "Iniciativa", "Initiative")}
              value={formatModifier(initiative)}
              icon={<Zap className="h-3.5 w-3.5" />}
            />
            <MetricCardCompact
              label={tr(locale, "Velocidad", "Speed")}
              value={`${totalSpeed} ft`}
              icon={<Wind className="h-3.5 w-3.5" />}
            />
            <MetricCardCompact
              label={tr(locale, "Competencia", "Proficiency")}
              value={`+${proficiencyBonus}`}
              icon={<Award className="h-3.5 w-3.5" />}
            />
            <MetricCardCompact
              label={tr(locale, "Vida actual", "Current life")}
              value={totalCurrentHp ?? "?"}
              icon={<HeartPulse className="h-3.5 w-3.5" />}
            />
            <MetricCardCompact
              label={tr(locale, "Vida maxima", "Maximum life")}
              value={totalMaxHp ?? "?"}
              icon={<Heart className="h-3.5 w-3.5" />}
            />
            <MetricCardCompact
              label={tr(locale, "Percepcion pasiva", "Passive perception")}
              value={passivePerception}
              icon={<Eye className="h-3.5 w-3.5" />}
            />
            <MetricCardCompact
              label={tr(locale, "Dado de golpe", "Hit die")}
              value={`d${details?.hitDie?.sides ?? 8}`}
              icon={<Dice5 className="h-3.5 w-3.5" />}
            />
          </div>

          <SpellSlotsPanel
            characterClass={character?.class}
            characterLevel={character?.level}
            spellSlotModifiers={spellSlotModifiers}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-ring bg-panel/90 p-[var(--panel-pad)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-display font-semibold text-ink">
            {tr(locale, "Atributos", "Attributes")}
          </h3>
          <p className="text-xs text-ink-muted">
            {tr(locale, "Vista hexagonal estilo videojuego", "Video game style hex view")}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)_260px] items-start">
          <div className="rounded-2xl border border-ring bg-white/80 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink">{tr(locale, "Habilidades", "Skills")}</p>
              <span className="text-[10px] text-ink-muted">{tr(locale, "Bonus: +1 / +2", "Bonus: +1 / +2")}</span>
            </div>
            <div className="space-y-2">
              {orderedSkills.map((skill) => {
                const bonusValue = getSkillBonusValue(skill);
                const total = getSkillTotal(skill);
                return (
                  <div
                    key={skill.key}
                    className="flex items-center justify-between text-xs text-ink"
                  >
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={bonusValue > 0} readOnly />
                      <span>
                        {getSkillLabel(skill, locale)}{" "}
                        <span className="text-[10px] text-ink-muted">
                          ({abilityShort[skill.ability]})
                        </span>
                      </span>
                    </label>
                    <span className="font-mono text-ink">{formatModifier(total)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 w-full">
            <div className="w-full max-w-[320px] sm:max-w-[360px] md:max-w-[420px]">
              <StatsHexagon
                characterClass={character?.class}
                stats={{
                  FUE: totalStr,
                  DES: totalDex,
                  CON: totalCon,
                  INT: totalInt,
                  SAB: totalWis,
                  CAR: totalCha,
                }}
                bonuses={{
                  FUE: hasBonus("STR"),
                  DES: hasBonus("DEX"),
                  CON: hasBonus("CON"),
                  INT: hasBonus("INT"),
                  SAB: hasBonus("WIS"),
                  CAR: hasBonus("CHA"),
                }}
                labels={{
                  FUE: abilityShort.STR,
                  DES: abilityShort.DEX,
                  CON: abilityShort.CON,
                  INT: abilityShort.INT,
                  SAB: abilityShort.WIS,
                  CAR: abilityShort.CHA,
                }}
                bonusDetails={{
                  FUE: getBonusDetails("STR"),
                  DES: getBonusDetails("DEX"),
                  CON: getBonusDetails("CON"),
                  INT: getBonusDetails("INT"),
                  SAB: getBonusDetails("WIS"),
                  CAR: getBonusDetails("CHA"),
                }}
              />
            </div>
            <p className="text-[11px] text-ink-muted">
              {tr(
                locale,
                "Pasa el raton por cada atributo para ver los bonus activos.",
                "Hover over each attribute to see active bonuses."
              )}
            </p>
          </div>

          <div className="space-y-2">
            {statEntries.map((stat) => {
              const mod = abilityModifier(stat.value);
              const bonuses = getBonusDetails(stat.raw as keyof typeof bonusSources);
              const Icon = stat.icon;
              return (
                <div
                  key={stat.key}
                  className="rounded-2xl border border-ring bg-white/80 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-full border border-accent/20 bg-accent/10 text-accent-strong flex items-center justify-center">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                          {stat.key}
                        </div>
                        <div className="text-sm font-semibold text-ink">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-ink-muted">{formatModifier(mod)}</div>
                      <div className="text-lg font-semibold text-ink">{stat.value}</div>
                    </div>
                  </div>
                  {bonuses.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {bonuses.map((bonus, i) => (
                        <span
                          key={`${bonus.source}-${i}`}
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            bonus.value >= 0
                              ? "border-emerald-500/40 text-emerald-700 bg-emerald-50"
                              : "border-rose-500/40 text-rose-700 bg-rose-50"
                          }`}
                        >
                          {bonus.source}: {bonus.value >= 0 ? `+${bonus.value}` : bonus.value}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-ink-muted mt-2">
                      {tr(locale, "Sin bonus activos", "No active bonuses")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-ring bg-panel/90 p-[var(--panel-pad)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-display font-semibold text-ink">
            {tr(locale, "Equipados", "Equipped")}
          </h3>
          <span className="text-[11px] text-ink-muted">
            {equippedItems.length}{" "}
            {tr(
              locale,
              `objeto${equippedItems.length === 1 ? "" : "s"}`,
              `item${equippedItems.length === 1 ? "" : "s"}`
            )}
          </span>
        </div>

        {equippedItems.length === 0 ? (
          <p className="text-xs text-ink-muted">
            {tr(locale, "No hay objetos equipados.", "No equipped items.")}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {equippedItems.map((item) => {
              const description = getLocalizedText(item.description, locale);
              const modifiers = Array.isArray(item.modifiers) ? item.modifiers : [];
              const attachments = Array.isArray((item as any).attachments)
                ? ((item as any).attachments as Array<any>)
                : [];
              const tags = [
                item.category ? item.category : null,
                item.rarity ? item.rarity : null,
                ...(item.tags ?? []),
              ].filter(Boolean) as string[];

              return (
                <details
                  key={item.id}
                  className="rounded-2xl border border-ring bg-white/80 p-3"
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-ink">{item.name}</p>
                        <p className="text-[11px] text-ink-muted capitalize">
                          {item.category === "weapon"
                            ? tr(locale, "Arma", "Weapon")
                            : item.category === "armor"
                              ? tr(locale, "Armadura", "Armor")
                              : item.category === "accessory"
                                ? tr(locale, "Accesorio", "Accessory")
                                : item.category === "consumable"
                                  ? tr(locale, "Consumible", "Consumable")
                                  : item.category === "tool"
                                    ? tr(locale, "Herramienta", "Tool")
                                    : tr(locale, "Miscelaneo", "Miscellaneous")}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/50 text-emerald-700 bg-emerald-50">
                        {tr(locale, "Equipado", "Equipped")}
                      </span>
                    </div>
                  </summary>

                  <div className="mt-3 space-y-2 text-xs text-ink-muted">
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full border border-ring text-[10px] text-ink-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {modifiers.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {modifiers.map((mod, i) => (
                          <span
                            key={`${mod.target}-${i}`}
                            className={`text-[10px] px-2 py-0.5 rounded-full border ${
                              mod.value >= 0
                                ? "border-emerald-500/50 text-emerald-700 bg-emerald-50"
                                : "border-rose-500/50 text-rose-700 bg-rose-50"
                            }`}
                          >
                            {getTargetLabel(mod.target, locale)}{" "}
                            {mod.value >= 0 ? `+${mod.value}` : mod.value}
                            {mod.note ? ` · ${mod.note}` : ""}
                          </span>
                        ))}
                      </div>
                    )}

                    {description && (
                      <Markdown content={description} className="text-ink-muted text-xs" />
                    )}

                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                          {tr(locale, "Adjuntos", "Attachments")}
                        </p>
                        {attachments.map((attachment) => {
                          const attachmentDescription = getLocalizedText(
                            attachment.description,
                            locale
                          );
                          return (
                            <div
                              key={attachment.id}
                              className="rounded-md border border-ring bg-panel/70 p-2"
                            >
                              <p className="text-xs font-semibold text-ink">
                                {attachment.name}
                                {typeof attachment.level === "number"
                                  ? ` · ${tr(locale, "Nivel", "Level")} ${attachment.level}`
                                  : ""}
                              </p>
                              <p className="text-[11px] text-ink-muted">
                                {attachment.type === "action"
                                  ? tr(locale, "Accion", "Action")
                                  : attachment.type === "ability"
                                  ? tr(locale, "Habilidad", "Ability")
                                  : attachment.type === "trait"
                                  ? tr(locale, "Rasgo", "Trait")
                                  : attachment.type === "spell"
                                  ? tr(locale, "Hechizo", "Spell")
                                  : attachment.type === "cantrip"
                                  ? tr(locale, "Truco", "Cantrip")
                                  : attachment.type === "classFeature"
                                  ? tr(locale, "Rasgo de clase", "Class feature")
                                  : tr(locale, "Otro", "Other")}
                              </p>
                              {attachmentDescription && (
                                <Markdown
                                  content={attachmentDescription}
                                  className="mt-1 text-ink-muted text-xs"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <div className="rounded-3xl border border-ring bg-panel/90 p-[var(--panel-pad)]">
          <h3 className="text-sm font-display font-semibold text-ink">
            {tr(locale, "Dotes y rasgos", "Gifts and traits")}
          </h3>

          <div className="mt-3 space-y-2">
            {customTraits.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.3em] text-ink-muted">
                  {tr(locale, "Rasgos personalizados", "Custom traits")}
                </p>
                {customTraits.map((trait) => {
                  const content = getFeatureContent(trait, false);
                  return (
                    <details
                      key={trait.id}
                      className="rounded-xl border border-ring bg-white/80 p-3"
                    >
                      <summary className="cursor-pointer text-sm font-semibold text-ink">
                        {trait.name}
                      </summary>
                      {content ? (
                        <Markdown content={content} className="text-ink-muted text-xs mt-2" />
                      ) : (
                        <p className="text-[11px] text-ink-muted mt-2">
                          {tr(locale, "Sin descripcion.", "No description.")}
                        </p>
                      )}
                    </details>
                  );
                })}
              </div>
            )}

            {customNonActionClassAbilities.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.3em] text-ink-muted">
                  {tr(locale, "Habilidades personalizadas", "Custom abilities")}
                </p>
                {customNonActionClassAbilities.map((ability) => {
                  const content = getFeatureContent(ability, true);
                  return (
                    <details
                      key={ability.id}
                      className="rounded-xl border border-ring bg-white/80 p-3"
                    >
                      <summary className="cursor-pointer text-sm font-semibold text-ink">
                        {ability.name}
                        {ability.level != null
                          ? ` · ${tr(locale, "Nivel", "Level")} ${ability.level}`
                          : ""}
                      </summary>
                      {content ? (
                        <Markdown content={content} className="text-ink-muted text-xs mt-2" />
                      ) : (
                        <p className="text-[11px] text-ink-muted mt-2">
                          {tr(locale, "Sin descripcion.", "No description.")}
                        </p>
                      )}
                    </details>
                  );
                })}
              </div>
            )}

            {details?.abilities ? (
              <Markdown content={details.abilities} className="text-ink-muted" />
            ) : null}

            {!details?.abilities &&
              customTraits.length === 0 &&
              customNonActionClassAbilities.length === 0 && (
              <p className="text-xs text-ink-muted">
                {tr(
                  locale,
                  "No se han registrado dotes o rasgos.",
                  "No gifts or traits have been recorded."
                )}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
