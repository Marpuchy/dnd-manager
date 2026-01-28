import type {
  CharacterItem,
  Details,
  ItemCategory,
  ItemModifier,
  LocalizedText,
} from "@/lib/types/dnd";
import { parseInventoryText } from "@/lib/character/inventoryParser";

export type ModifierTargetOption = {
  key: string;
  label: string;
};

export const MODIFIER_TARGETS: ModifierTargetOption[] = [
  { key: "STR", label: "Fuerza (STR)" },
  { key: "DEX", label: "Destreza (DEX)" },
  { key: "CON", label: "Constitución (CON)" },
  { key: "INT", label: "Inteligencia (INT)" },
  { key: "WIS", label: "Sabiduría (WIS)" },
  { key: "CHA", label: "Carisma (CHA)" },
  { key: "AC", label: "Clase de armadura (AC)" },
  { key: "HP_MAX", label: "Vida máxima" },
  { key: "HP_CURRENT", label: "Vida actual" },
  { key: "SPEED", label: "Velocidad" },
  { key: "INITIATIVE", label: "Iniciativa" },
  { key: "PROFICIENCY", label: "Bonificador de competencia" },
  { key: "PASSIVE_PERCEPTION", label: "Percepción pasiva" },
  { key: "SPELL_ATTACK", label: "Ataque de conjuro" },
  { key: "SPELL_DC", label: "CD de conjuro" },
  { key: "ATTACK_BONUS", label: "Bono de ataque" },
  { key: "DAMAGE_BONUS", label: "Bono de daño" },
  { key: "SAVE_STR", label: "Tirada de salvación STR" },
  { key: "SAVE_DEX", label: "Tirada de salvación DEX" },
  { key: "SAVE_CON", label: "Tirada de salvación CON" },
  { key: "SAVE_INT", label: "Tirada de salvación INT" },
  { key: "SAVE_WIS", label: "Tirada de salvación WIS" },
  { key: "SAVE_CHA", label: "Tirada de salvación CHA" },
  { key: "SKILL_ACROBATICS", label: "Habilidad: Acrobacias" },
  { key: "SKILL_ANIMAL_HANDLING", label: "Habilidad: Trato con animales" },
  { key: "SKILL_ARCANA", label: "Habilidad: Arcano" },
  { key: "SKILL_ATHLETICS", label: "Habilidad: Atletismo" },
  { key: "SKILL_DECEPTION", label: "Habilidad: Engaño" },
  { key: "SKILL_HISTORY", label: "Habilidad: Historia" },
  { key: "SKILL_INSIGHT", label: "Habilidad: Perspicacia" },
  { key: "SKILL_INTIMIDATION", label: "Habilidad: Intimidación" },
  { key: "SKILL_INVESTIGATION", label: "Habilidad: Investigación" },
  { key: "SKILL_MEDICINE", label: "Habilidad: Medicina" },
  { key: "SKILL_NATURE", label: "Habilidad: Naturaleza" },
  { key: "SKILL_PERCEPTION", label: "Habilidad: Percepción" },
  { key: "SKILL_PERFORMANCE", label: "Habilidad: Interpretación" },
  { key: "SKILL_PERSUASION", label: "Habilidad: Persuasión" },
  { key: "SKILL_RELIGION", label: "Habilidad: Religión" },
  { key: "SKILL_SLEIGHT_OF_HAND", label: "Habilidad: Juego de manos" },
  { key: "SKILL_STEALTH", label: "Habilidad: Sigilo" },
  { key: "SKILL_SURVIVAL", label: "Habilidad: Supervivencia" },
];

const TARGET_ALIASES: Record<string, string> = {
  ARMOR_CLASS: "AC",
  ARMORCLASS: "AC",
  CA: "AC",
  HP: "HP_MAX",
  VIDA: "HP_MAX",
  SPEED: "SPEED",
  VELOCIDAD: "SPEED",
  INIT: "INITIATIVE",
  INICIATIVA: "INITIATIVE",
  PROFICIENCY_BONUS: "PROFICIENCY",
  BONO_COMPETENCIA: "PROFICIENCY",
  PASIVE_PERCEPTION: "PASSIVE_PERCEPTION",
  PERCEPCION_PASIVA: "PASSIVE_PERCEPTION",
};

export function normalizeTarget(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, "_").toUpperCase();
  return TARGET_ALIASES[cleaned] ?? cleaned;
}

export function normalizeLocalizedText(
  value: string | LocalizedText | undefined,
  lang = "es"
): LocalizedText | undefined {
  if (!value) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return { text: trimmed, lang };
  }
  if (!value.text?.trim()) return undefined;
  return value;
}

export function getLocalizedText(
  value: string | LocalizedText | undefined,
  locale?: string
): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const target = locale ?? value.lang;
  if (target && value.translations && value.translations[target]) {
    return value.translations[target]?.text ?? value.text;
  }
  return value.text ?? "";
}

export function buildItemBase(
  name = "Nuevo objeto",
  category: ItemCategory = "misc"
): CharacterItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    category,
    equippable: false,
    equipped: false,
    modifiers: [],
  };
}

export function getEquippedItems(details?: Details | null): CharacterItem[] {
  const items = Array.isArray(details?.items) ? details?.items : [];
  return items.filter((item) => item.equipped);
}

export function collectItemModifiers(details?: Details | null) {
  const items = Array.isArray(details?.items) ? details.items : [];
  const modifiers: { target: string; value: number; source: string }[] = [];

  for (const item of items) {
    if (!item.equipped) continue;
    if (!Array.isArray(item.modifiers)) continue;
    for (const mod of item.modifiers) {
      if (!mod) continue;
      const numeric = Number(mod.value);
      if (Number.isNaN(numeric)) continue;
      const target = normalizeTarget(mod.target || "");
      if (!target) continue;
      modifiers.push({
        target,
        value: numeric,
        source: item.name,
      });
    }
  }

  return modifiers;
}

export function getModifierTotal(details: Details | undefined, target: string): number {
  const normalized = normalizeTarget(target);
  const mods = collectItemModifiers(details).filter((m) => m.target === normalized);
  const total = mods.reduce((sum, m) => sum + m.value, 0);
  return Math.min(total, 30);
}

export function getModifierSources(details: Details | undefined, target: string) {
  const normalized = normalizeTarget(target);
  const mods = collectItemModifiers(details).filter((m) => m.target === normalized);
  const total = mods.reduce((sum, m) => sum + m.value, 0);
  const capped = Math.min(total, 30);
  if (total !== capped) {
    return {
      total: capped,
      sources: [...mods, { source: "Cap +30", value: capped - total }],
    };
  }
  return { total: capped, sources: mods };
}

function toCategory(raw?: string | null): ItemCategory {
  const value = (raw ?? "").toLowerCase();
  if (value.includes("arma") || value.includes("weapon")) return "weapon";
  if (value.includes("armadura") || value.includes("armor")) return "armor";
  if (value.includes("consum")) return "consumable";
  if (value.includes("herramient") || value.includes("tool")) return "tool";
  if (value.includes("acces")) return "accessory";
  return "misc";
}

export function migrateLegacyItems(details?: Details | null): CharacterItem[] {
  if (Array.isArray(details?.items) && details?.items?.length) return details.items;

  const items: CharacterItem[] = [];

  const legacyTextSources = [details?.inventory, details?.equipment, details?.weaponsExtra];
  for (const source of legacyTextSources) {
    if (!source) continue;
    const parsed = parseInventoryText(source);
    for (const entry of parsed) {
      if (entry.kind === "json") {
        const legacy = entry.item as any;
        const modifiers: ItemModifier[] = [];
        if (legacy.ability && typeof legacy.modifier === "number") {
          modifiers.push({ target: legacy.ability, value: legacy.modifier });
        }
        if (Array.isArray(legacy.modifiers)) {
          for (const mod of legacy.modifiers) {
            modifiers.push({
              target: mod.ability ?? mod.statAbility ?? mod.stat_ability,
              value: Number(mod.modifier ?? mod.value ?? 0),
              note: mod.note,
            });
          }
        }
        items.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: legacy.name ?? entry.raw,
          category: toCategory(legacy.type),
          equippable: false,
          equipped: false,
          description: normalizeLocalizedText(legacy.description, "es"),
          modifiers,
          quantity: legacy.quantity,
          rarity: legacy.rarity,
          tags: legacy.tags,
          properties: legacy.properties,
          effects: legacy.effects,
          attunement: legacy.attunement,
          weight: legacy.weight,
          value: legacy.value,
          charges: legacy.charges,
          slot: legacy.slot,
          source: legacy.source,
        });
      } else if (entry.raw) {
        items.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: entry.raw,
          category: "misc",
          equippable: false,
          equipped: false,
        });
      }
    }
  }

  if (Array.isArray(details?.armors)) {
    for (const armor of details.armors) {
      const modifiers: ItemModifier[] = [];
      if (armor.statAbility && typeof armor.statModifier === "number") {
        modifiers.push({ target: armor.statAbility, value: armor.statModifier });
      }
      if (Array.isArray(armor.modifiers)) {
        for (const mod of armor.modifiers) {
          modifiers.push({ target: mod.ability, value: mod.modifier, note: mod.note });
        }
      }
      items.push({
        id: armor.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: armor.name,
        category: "armor",
        equippable: true,
        equipped: !!armor.equipped,
        description: normalizeLocalizedText(armor.description ?? armor.ability, "es"),
        modifiers,
      });
    }
  }

  if (details?.weaponEquipped?.name) {
    const weapon = details.weaponEquipped as any;
    const modifiers: ItemModifier[] = [];
    if (weapon.statAbility && typeof weapon.statModifier === "number") {
      modifiers.push({ target: weapon.statAbility, value: weapon.statModifier });
    }
    if (Array.isArray(weapon.modifiers)) {
      for (const mod of weapon.modifiers) {
        modifiers.push({ target: mod.ability, value: mod.modifier, note: mod.note });
      }
    }
    items.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: weapon.name,
      category: "weapon",
      equippable: true,
      equipped: weapon.equipped !== false,
      description: normalizeLocalizedText(weapon.description, "es"),
      modifiers,
    });
  }

  return items;
}

export function ensureDetailsItems(details?: Details | null): Details {
  const safe: Details = details ? { ...details } : {};
  return {
    ...safe,
    items: migrateLegacyItems(safe),
  };
}
