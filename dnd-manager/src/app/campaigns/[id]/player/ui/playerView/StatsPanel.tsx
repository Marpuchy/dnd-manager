"use client";

import React, { useMemo, useState } from "react";
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
import ImageCropModal from "@/app/components/ImageCropModal";
import {
  MODIFIER_TARGETS,
  getLocalizedText,
  getModifierTotal,
  getModifierSources,
  normalizeTarget,
} from "@/lib/character/items";
import { getClientLocale } from "@/lib/i18n/getClientLocale";
import { SKILL_DEFINITIONS, type SkillDefinition } from "@/lib/dnd/skills";
import type { AbilityKey, SkillKey } from "@/lib/types/dnd";

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

function getTargetLabel(target: string) {
  const normalized = normalizeTarget(target);
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
  const locale = getClientLocale();
  const customTraits = Array.isArray(details?.customTraits) ? details.customTraits : [];
  const customClassAbilities = Array.isArray(details?.customClassAbilities)
    ? details.customClassAbilities
    : [];
  const skillProficiencies = details?.skillProficiencies ?? {};

  const abilityScores: Record<AbilityKey, number> = {
    STR: totalStr,
    DEX: totalDex,
    CON: totalCon,
    INT: totalInt,
    WIS: totalWis,
    CHA: totalCha,
  };
  const abilityShort: Record<AbilityKey, string> = {
    STR: "FUE",
    DEX: "DES",
    CON: "CON",
    INT: "INT",
    WIS: "SAB",
    CHA: "CAR",
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
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState<string>("personaje.jpg");

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCropFileName(file.name || "personaje.jpg");
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleSaveCroppedImage(blob: Blob) {
    if (!character?.id) return;
    const formData = new FormData();
    formData.append("file", blob, cropFileName);
    formData.append("characterId", character.id);

    const res = await fetch("/api/dnd/characters/upload-image", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      console.error("Error subiendo imagen");
      return;
    }

    setCropSrc(null);
    onImageUpdated?.();
  }

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
    { key: "FUE", label: "Fuerza", value: totalStr, raw: "STR", icon: Dumbbell },
    { key: "DES", label: "Destreza", value: totalDex, raw: "DEX", icon: Feather },
    { key: "CON", label: "Constitución", value: totalCon, raw: "CON", icon: Heart },
    { key: "INT", label: "Inteligencia", value: totalInt, raw: "INT", icon: Brain },
    { key: "SAB", label: "Sabiduría", value: totalWis, raw: "WIS", icon: Eye },
    { key: "CAR", label: "Carisma", value: totalCha, raw: "CHA", icon: Star },
  ] as const;

  return (
    <div className="space-y-6">
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          aspect={3 / 5}
          onClose={() => setCropSrc(null)}
          onSave={handleSaveCroppedImage}
        />
      )}
      <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-3xl border border-ring bg-panel/90 p-4">
          <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-white/70 border border-ring">
            {profileImage?.startsWith("http") ? (
              <img
                src={profileImage}
                alt="Imagen del personaje"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted">
                Sin imagen
              </div>
            )}
          </div>

          <label className="mt-3 block text-xs text-center cursor-pointer text-accent-strong hover:underline">
            Cambiar imagen
            <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
          </label>
        </div>

        <div className="space-y-3">
          <div className="rounded-3xl border border-ring bg-panel/90 p-[var(--panel-pad)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.35em] text-ink-muted">
                  Hoja de personaje
                </div>
                <h2 className="text-2xl font-display font-semibold text-ink">
                  {character?.name ?? "Personaje"}
                </h2>
                <p className="text-sm text-ink-muted">
                  {character?.race ?? "Sin raza"} · {character?.class ?? "Sin clase"} · Nivel{" "}
                  {character?.level ?? "?"}
                </p>
              </div>
              <div className="grid gap-3 text-xs text-ink-muted sm:grid-cols-2">
                {details?.background && (
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em]">
                      Trasfondo
                    </span>
                    <div className="text-ink">{details.background}</div>
                  </div>
                )}
                {details?.alignment && (
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em]">
                      Alineamiento
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
              label="Clase de armadura"
              value={totalAC}
              icon={<Shield className="h-3.5 w-3.5" />}
            />
            <MetricCardCompact
              label="Iniciativa"
              value={formatModifier(initiative)}
              icon={<Zap className="h-3.5 w-3.5" />}
            />
            <MetricCardCompact
              label="Velocidad"
              value={`${totalSpeed} ft`}
              icon={<Wind className="h-3.5 w-3.5" />}
            />
            <MetricCardCompact
              label="Competencia"
              value={`+${proficiencyBonus}`}
              icon={<Award className="h-3.5 w-3.5" />}
            />
            <MetricCardCompact
              label="Vida actual"
              value={totalCurrentHp ?? "?"}
              icon={<HeartPulse className="h-3.5 w-3.5" />}
            />
            <MetricCardCompact
              label="Vida máxima"
              value={totalMaxHp ?? "?"}
              icon={<Heart className="h-3.5 w-3.5" />}
            />
            <MetricCardCompact
              label="Percepción pasiva"
              value={passivePerception}
              icon={<Eye className="h-3.5 w-3.5" />}
            />
            <MetricCardCompact
              label="Dado de golpe"
              value={`d${details?.hitDie?.sides ?? 8}`}
              icon={<Dice5 className="h-3.5 w-3.5" />}
            />
          </div>

          <SpellSlotsPanel
            characterClass={character?.class}
            characterLevel={character?.level}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-ring bg-panel/90 p-[var(--panel-pad)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-display font-semibold text-ink">Atributos</h3>
          <p className="text-xs text-ink-muted">Vista hexagonal estilo videojuego</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)_260px] items-start">
          <div className="rounded-2xl border border-ring bg-white/80 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink">Habilidades</p>
              <span className="text-[10px] text-ink-muted">Bonus: +1 / +2</span>
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
                        {skill.label}{" "}
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
              Pasa el ratón por cada atributo para ver los bonus activos.
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
                    <p className="text-[11px] text-ink-muted mt-2">Sin bonus activos</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-ring bg-panel/90 p-[var(--panel-pad)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-display font-semibold text-ink">Equipados</h3>
          <span className="text-[11px] text-ink-muted">
            {equippedItems.length} objeto{equippedItems.length === 1 ? "" : "s"}
          </span>
        </div>

        {equippedItems.length === 0 ? (
          <p className="text-xs text-ink-muted">No hay objetos equipados.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {equippedItems.map((item) => {
              const description = getLocalizedText(item.description, locale);
              const modifiers = Array.isArray(item.modifiers) ? item.modifiers : [];
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
                            ? "Arma"
                            : item.category === "armor"
                              ? "Armadura"
                              : item.category === "accessory"
                                ? "Accesorio"
                                : item.category === "consumable"
                                  ? "Consumible"
                                  : item.category === "tool"
                                    ? "Herramienta"
                                    : "Misceláneo"}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/50 text-emerald-700 bg-emerald-50">
                        Equipado
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
                            {getTargetLabel(mod.target)}{" "}
                            {mod.value >= 0 ? `+${mod.value}` : mod.value}
                            {mod.note ? ` · ${mod.note}` : ""}
                          </span>
                        ))}
                      </div>
                    )}

                    {description && (
                      <Markdown content={description} className="text-ink-muted text-xs" />
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
          <h3 className="text-sm font-display font-semibold text-ink">Dotes y rasgos</h3>

          <div className="mt-3 space-y-2">
            {customTraits.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.3em] text-ink-muted">
                  Rasgos personalizados
                </p>
                {customTraits.map((trait) => {
                  const desc = getLocalizedText(trait.description, locale);
                  return (
                    <details
                      key={trait.id}
                      className="rounded-xl border border-ring bg-white/80 p-3"
                    >
                      <summary className="cursor-pointer text-sm font-semibold text-ink">
                        {trait.name}
                      </summary>
                      {desc ? (
                        <Markdown content={desc} className="text-ink-muted text-xs mt-2" />
                      ) : (
                        <p className="text-[11px] text-ink-muted mt-2">
                          Sin descripción.
                        </p>
                      )}
                    </details>
                  );
                })}
              </div>
            )}

            {customClassAbilities.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.3em] text-ink-muted">
                  Habilidades personalizadas
                </p>
                {customClassAbilities.map((ability) => {
                  const desc = getLocalizedText(ability.description, locale);
                  return (
                    <details
                      key={ability.id}
                      className="rounded-xl border border-ring bg-white/80 p-3"
                    >
                      <summary className="cursor-pointer text-sm font-semibold text-ink">
                        {ability.name}
                        {ability.level != null ? ` · Nivel ${ability.level}` : ""}
                      </summary>
                      {desc ? (
                        <Markdown content={desc} className="text-ink-muted text-xs mt-2" />
                      ) : (
                        <p className="text-[11px] text-ink-muted mt-2">
                          Sin descripción.
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

            {!details?.abilities && customTraits.length === 0 && customClassAbilities.length === 0 && (
              <p className="text-xs text-ink-muted">No se han registrado dotes o rasgos.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
