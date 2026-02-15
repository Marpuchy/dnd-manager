// src/app/campaigns/[id]/player/playerShared.ts
import { abilityMod } from "@/lib/dndMath";
import { tr } from "@/lib/i18n/translate";

export type Member = import("@/lib/types/ui").Member;
export type LearnedSpellRef = import("@/lib/types/dnd").LearnedSpellRef;
export type Spells = import("@/lib/types/dnd").Spells;
export type Stats = import("@/lib/types/dnd").Stats;
export type Armor = import("@/lib/types/dnd").Armor;
export type Weapon = import("@/lib/types/dnd").Weapon;
export type HitDie = import("@/lib/types/dnd").HitDie;
export type SpellMeta = import("@/lib/types/dnd").SpellMeta;
export type Details = import("@/lib/types/dnd").Details;
export type Character = import("@/lib/types/dnd").Character;
export type Mode = import("@/lib/types/ui").Mode;
export type Tab = import("@/lib/types/ui").Tab;
export type LearnedSpellLine = import("@/lib/types/dnd").LearnedSpellLine;
export type SpellSummary = import("@/lib/types/dnd").SpellSummary;

export const DND_CLASS_OPTIONS = [
  { id: "barbarian", label: "Barbaro", labelEn: "Barbarian" },
  { id: "bard", label: "Bardo", labelEn: "Bard" },
  { id: "cleric", label: "Clerigo", labelEn: "Cleric" },
  { id: "druid", label: "Druida", labelEn: "Druid" },
  { id: "fighter", label: "Guerrero", labelEn: "Fighter" },
  { id: "monk", label: "Monje", labelEn: "Monk" },
  { id: "paladin", label: "Paladin", labelEn: "Paladin" },
  { id: "ranger", label: "Explorador", labelEn: "Ranger" },
  { id: "rogue", label: "Picaro", labelEn: "Rogue" },
  { id: "sorcerer", label: "Hechicero", labelEn: "Sorcerer" },
  { id: "warlock", label: "Brujo", labelEn: "Warlock" },
  { id: "wizard", label: "Mago", labelEn: "Wizard" },
  { id: "artificer", label: "Artificiero", labelEn: "Artificer" },
  { id: "custom", label: "Clase personalizada", labelEn: "Custom class" },
] as const;

export const CLASS_LABELS: Record<string, string> = Object.fromEntries(
  DND_CLASS_OPTIONS.map((c) => [c.id, c.label])
);

export const CLASS_LABELS_EN: Record<string, string> = Object.fromEntries(
  DND_CLASS_OPTIONS.map((c) => [c.id, c.labelEn])
);

export const CLASS_API_ALIASES: Record<string, string> = {
  barbaro: "barbarian",
  bardo: "bard",
  clerigo: "cleric",
  druida: "druid",
  guerrero: "fighter",
  monje: "monk",
  paladin: "paladin",
  paladino: "paladin",
  explorador: "ranger",
  ranger: "ranger",
  picaro: "rogue",
  hechicero: "sorcerer",
  brujo: "warlock",
  mago: "wizard",
  artificiero: "artificer",
  artificer: "artificer",
};

export function normalizeClassForApi(raw: string | null): string {
  if (!raw) return "";
  const key = raw.toLowerCase().trim();
  const normalizedKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (CLASS_LABELS[key] || CLASS_LABELS_EN[key]) return key;
  if (CLASS_LABELS[normalizedKey] || CLASS_LABELS_EN[normalizedKey]) {
    return normalizedKey;
  }
  return CLASS_API_ALIASES[key] ?? CLASS_API_ALIASES[normalizedKey] ?? normalizedKey;
}

export function prettyClassLabel(raw: string | null, locale = "es"): string {
  if (!raw) return tr(locale, "Sin clase", "No class");
  const api = normalizeClassForApi(raw);
  if (!api) return raw;
  if (api === "custom") return tr(locale, "Clase personalizada", "Custom class");
  return locale === "en" ? CLASS_LABELS_EN[api] ?? raw : CLASS_LABELS[api] ?? raw;
}

export function getPreparedSpellsInfo(
  charClass: string | null,
  stats: Stats,
  level: number | null,
  details?: Details | null,
  locale = "es"
) {
  if (!charClass || !level || level < 1) return null;

  const apiClass = normalizeClassForApi(charClass);
  if (!apiClass) return null;

  let abilityKey: keyof Stats | null = null;
  let baseCount = 0;

  switch (apiClass) {
    case "cleric":
    case "druid":
      abilityKey = "wis";
      baseCount = level;
      break;
    case "wizard":
      abilityKey = "int";
      baseCount = level;
      break;
    case "paladin":
      abilityKey = "cha";
      baseCount = Math.floor(level / 2);
      break;
    case "artificer":
      abilityKey = "int";
      baseCount = Math.floor(level / 2);
      break;
    case "custom": {
      const ability = details?.customCastingAbility ?? "int";
      abilityKey = ability;
      baseCount = level;
      break;
    }
    default:
      return null;
  }

  const abilityScore = stats[abilityKey] ?? 10;
  const mod = abilityMod(abilityScore);
  let total = baseCount + mod;
  if (total < 1) total = 1;

  const abilityName =
    abilityKey === "wis"
      ? tr(locale, "Sabiduria (SAB)", "Wisdom (WIS)")
      : abilityKey === "int"
      ? tr(locale, "Inteligencia (INT)", "Intelligence (INT)")
      : abilityKey === "cha"
      ? tr(locale, "Carisma (CAR)", "Charisma (CHA)")
      : abilityKey === "str"
      ? tr(locale, "Fuerza (FUE)", "Strength (STR)")
      : abilityKey === "dex"
      ? tr(locale, "Destreza (DES)", "Dexterity (DEX)")
      : tr(locale, "Constitucion (CON)", "Constitution (CON)");

  return { total, abilityName, apiClass };
}

export type PassiveModifier = import("@/lib/types/dnd").PassiveModifier;

export function getClassMagicExtras(
  charClass: string | null,
  level: number | null,
  locale = "es"
) {
  if (!charClass || !level || level < 1) return null;
  const apiClass = normalizeClassForApi(charClass);
  if (!apiClass) return null;

  if (apiClass === "druid") {
    const lines: string[] = [];
    lines.push(
      tr(
        locale,
        "Usos de Forma Salvaje: 2 por descanso corto/largo.",
        "Wild Shape uses: 2 per short/long rest."
      )
    );

    if (level >= 8) {
      lines.push(
        tr(
          locale,
          "CR max. 1. Puedes adoptar formas con velocidad de nadar y volar.",
          "Max CR 1. You can take forms with swim and fly speeds."
        )
      );
    } else if (level >= 4) {
      lines.push(
        tr(
          locale,
          "CR max. 1/2. Puedes adoptar formas con velocidad de nadar, pero sin volar.",
          "Max CR 1/2. You can take forms with swim speed, but not fly speed."
        )
      );
    } else if (level >= 2) {
      lines.push(
        tr(
          locale,
          "CR max. 1/4. No puedes adoptar formas con velocidad de nadar ni volar.",
          "Max CR 1/4. You cannot take forms with swim or fly speeds."
        )
      );
    } else {
      lines.push(
        tr(
          locale,
          "Aun no tienes acceso a Forma Salvaje (druida < nivel 2).",
          "You do not have access to Wild Shape yet (druid < level 2)."
        )
      );
    }

    return {
      title: tr(locale, "Formas salvajes (Druida)", "Wild Shape (Druid)"),
      lines,
    };
  }

  return null;
}

export function formatCastingTime(ct?: string, locale = "es"): string {
  if (!ct) return "-";
  const lower = ct.toLowerCase();
  if (lower.includes("bonus action")) {
    return locale === "en" ? `Bonus action (${ct})` : `Accion adicional (${ct})`;
  }
  if (lower.includes("reaction")) {
    return locale === "en" ? `Reaction (${ct})` : `Reaccion (${ct})`;
  }
  if (lower.includes("action")) {
    return locale === "en" ? `Action (${ct})` : `Accion (${ct})`;
  }
  return ct;
}

export function formatComponents(
  components?: string[],
  material?: string
): string {
  if (!components || components.length === 0) return "-";
  const base = components.join(", ");
  if (material) return `${base} (material: ${material})`;
  return base;
}

export function countPreparedSpells(spells: Spells): number {
  let count = 0;

  Object.entries(spells).forEach(([key, level]) => {
    if (key === "level0") return;
    if (Array.isArray(level)) {
      count += level.length;
    }
  });

  return count;
}

export function parseSpellLines(text?: string): LearnedSpellLine[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((raw) => {
      const parts = raw.split(/—|â€”/);
      const name = parts[0]?.trim() ?? "";
      const note = parts.slice(1).join(" — ").trim();
      return {
        raw,
        name,
        note: note || undefined,
      };
    });
}

export function migrateOldSpells(spells?: Spells): Spells {
  if (!spells) return {};

  const out: Spells = {};

  for (const [level, value] of Object.entries(spells)) {
    if (Array.isArray(value)) {
      out[level as keyof Spells] = value;
      continue;
    }

    if (typeof value === "string") {
      out[level as keyof Spells] = value
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({
          index: "",
          name,
        }));
    }
  }

  return out;
}
