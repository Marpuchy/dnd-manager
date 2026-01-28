// src/app/campaigns/[id]/player/playerShared.ts
import { abilityMod } from "@/lib/dndMath";

export type Member = import("@/lib/types/ui").Member;

// Hechizo aprendido por el personaje
export type LearnedSpellRef = import("@/lib/types/dnd").LearnedSpellRef;

// Ahora los spells del personaje pueden ser:
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

/* ─────────────────────────────────────────────
   Configuración de clases
   ───────────────────────────────────────────── */

export const DND_CLASS_OPTIONS = [
    { id: "barbarian", label: "Bárbaro" },
    { id: "bard", label: "Bardo" },
    { id: "cleric", label: "Clérigo" },
    { id: "druid", label: "Druida" },
    { id: "fighter", label: "Guerrero" },
    { id: "monk", label: "Monje" },
    { id: "paladin", label: "Paladín" },
    { id: "ranger", label: "Explorador" },
    { id: "rogue", label: "Pícaro" },
    { id: "sorcerer", label: "Hechicero" },
    { id: "warlock", label: "Brujo" },
    { id: "wizard", label: "Mago" },
    { id: "artificer", label: "Artificiero" },
    { id: "custom", label: "Clase personalizada" },
];

export const CLASS_LABELS: Record<string, string> = Object.fromEntries(
    DND_CLASS_OPTIONS.map((c) => [c.id, c.label])
);

export const CLASS_API_ALIASES: Record<string, string> = {
    bárbaro: "barbarian",
    barbaro: "barbarian",
    bardo: "bard",
    clérigo: "cleric",
    clerigo: "cleric",
    druida: "druid",
    guerrero: "fighter",
    monje: "monk",
    paladín: "paladin",
    paladin: "paladin",
    paladino: "paladin",
    explorador: "ranger",
    ranger: "ranger",
    pícaro: "rogue",
    picaro: "rogue",
    hechicero: "sorcerer",
    brujo: "warlock",
    mago: "wizard",
    artificiero: "artificer",
    artificer: "artificer",
    // "custom" no se mapea a nada especial, se trata aparte
};

export function normalizeClassForApi(raw: string | null): string {
    if (!raw) return "";
    const key = raw.toLowerCase().trim();
    // si ya es uno de los ids internos, lo devolvemos
    if (CLASS_LABELS[key]) return key;
    return CLASS_API_ALIASES[key] ?? key;
}

export function prettyClassLabel(raw: string | null): string {
    if (!raw) return "Sin clase";
    const api = normalizeClassForApi(raw);
    if (!api) return raw;
    if (api === "custom") return "Clase personalizada";
    return CLASS_LABELS[api] ?? raw;
}

/* ─────────────────────────────────────────────
   Reglas de conjuros preparados (5e)
   ───────────────────────────────────────────── */

// (el resto de tu archivo permanece exactamente igual — lo mantuve tal como me lo pegaste)
export function getPreparedSpellsInfo(
    charClass: string | null,
    stats: Stats,
    level: number | null,
    details?: Details | null
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
            // Clase personalizada: siempre escala 1 × nivel + mod de la estadística elegida
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
            ? "Sabiduría (SAB)"
            : abilityKey === "int"
                ? "Inteligencia (INT)"
                : abilityKey === "cha"
                    ? "Carisma (CAR)"
                    : abilityKey === "str"
                        ? "Fuerza (FUE)"
                        : abilityKey === "dex"
                            ? "Destreza (DES)"
                            : "Constitución (CON)";

    return { total, abilityName, apiClass };
}

// en src/app/campaigns/[id]/player/playerShared.ts (añadelo en la sección de tipos)
export type PassiveModifier = import("@/lib/types/dnd").PassiveModifier;

export function getClassMagicExtras(
    charClass: string | null,
    level: number | null
) {
    if (!charClass || !level || level < 1) return null;
    const apiClass = normalizeClassForApi(charClass);
    if (!apiClass) return null;

    if (apiClass === "druid") {
        const lines: string[] = [];
        lines.push("Usos de Forma Salvaje: 2 por descanso corto/largo.");

        if (level >= 8) {
            lines.push(
                "CR máx. 1. Puedes adoptar formas con velocidad de nadar y volar."
            );
        } else if (level >= 4) {
            lines.push(
                "CR máx. 1/2. Puedes adoptar formas con velocidad de nadar, pero sin volar."
            );
        } else if (level >= 2) {
            lines.push(
                "CR máx. 1/4. No puedes adoptar formas con velocidad de nadar ni volar."
            );
        } else {
            lines.push("Aún no tienes acceso a Forma Salvaje (druida < nivel 2).");
        }

        return {
            title: "Formas salvajes (Druida)",
            lines,
        };
    }

    return null;
}

export function formatCastingTime(ct?: string): string {
    if (!ct) return "—";
    const lower = ct.toLowerCase();
    if (lower.includes("bonus action")) return `Acción adicional (${ct})`;
    if (lower.includes("reaction")) return `Reacción (${ct})`;
    if (lower.includes("action")) return `Acción (${ct})`;
    return ct;
}

export function formatComponents(
    components?: string[],
    material?: string
): string {
    if (!components || components.length === 0) return "—";
    const base = components.join(", ");
    if (material) return `${base} (material: ${material})`;
    return base;
}

export function countPreparedSpells(spells: Spells): number {
    let count = 0;

    Object.entries(spells).forEach(([key, level]) => {
        // ❌ Ignorar cantrips (level0)
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
            const [namePart, ...rest] = raw.split("—");
            const name = namePart.trim();
            const note = rest.join("—").trim();
            return {
                raw,
                name,
                note: note || undefined,
            };
        });
}

// 🔽 AÑADE ESTO AL FINAL DEL ARCHIVO (o donde prefieras entre helpers)
export function migrateOldSpells(spells?: Spells): Spells {
    if (!spells) return {};

    const out: Spells = {};

    for (const [level, value] of Object.entries(spells)) {
        // 🟢 YA ES FORMATO NUEVO → NO TOCAR
        if (Array.isArray(value)) {
            out[level as keyof Spells] = value;
            continue;
        }

        // 🟡 FORMATO ANTIGUO → MIGRAR
        if (typeof value === "string") {
            out[level as keyof Spells] = value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((name) => ({
                    index: "", // ⚠️ legacy, se resolverá después
                    name,
                }));
        }
    }

    return out;
}


