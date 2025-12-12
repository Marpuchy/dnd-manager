// src/app/campaigns/[id]/player/playerShared.ts
import { abilityMod } from "@/lib/dndMath";

export type Member = {
    role: "PLAYER" | "DM";
};

export type Stats = {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
};

export type Armor = {
    id?: string | null;
    name: string;
    bonus: number;
    ability?: string | null;
    stat_ability?: string | null;
    stat_modifier?: number | null;
    equipped?: boolean | null;
    description?: string | null; // añadido para persistir/mostrar descripciones
    modifiers?: { ability: keyof Stats | string; modifier: number; note?: string }[] | null; // añadidos modificadores extra
};

export type Weapon = {
    id?: string | null;
    name: string;
    damage?: string | null;
    stat_ability?: string | null;
    modifier?: number | null;
    is_proficient?: boolean | null;
    description?: string | null;
    equipped?: boolean | null;
    meta?: any;
};

export type HitDie = {
    sides: number; // 6, 8, 10, 12...
};

export type Spells = {
    level0?: string;
    level1?: string;
    level2?: string;
    level3?: string;
    level4?: string;
    level5?: string;
    level6?: string;
    level7?: string;
    level8?: string;
    level9?: string;
};

export type SpellMeta = {
    index: string;
    name: string;
    level: number;
    range?: string;
    casting_time?: string;
    duration?: string;
    school?: string;
    components?: string[];
    material?: string;
    concentration?: boolean;
    ritual?: boolean;
    shortDesc?: string;
    fullDesc?: string;
};

export type Details = {
    armors?: Armor[];
    weaponEquipped?: {
        name: string;
        damage?: string;
        description?: string;
    };
    current_hp?: number | null;
    max_hp?: number | null;
    inventory?: string;
    equipment?: string;
    abilities?: string;
    weaponsExtra?: string;
    notes?: string;
    hitDie?: HitDie;
    spells?: Spells;
    spellDetails?: Record<string, SpellMeta>;

    /** Clase personalizada: nombre visible */
    customClassName?: string;
    /** Clase personalizada: estadística de lanzamiento (STR/DEX/CON/INT/WIS/CHA) */
    customCastingAbility?: keyof Stats;
};

export type Character = {
    id: string;
    name: string;
    class: string | null;
    level: number | null;
    race: string | null;
    experience: number | null;
    max_hp: number | null;
    current_hp: number | null;
    armor_class: number | null;
    speed: number | null;
    stats: Stats | null;
    details: Details | null;
};

export type Mode = "view" | "create" | "edit";
export type Tab = "stats" | "spells" | "inventory";

export type LearnedSpellLine = {
    raw: string;
    name: string;
    note?: string;
};

export type SpellSummary = SpellMeta;

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
export type PassiveModifier = {
    id: string; // uuid o cualquier id único (puedes generarlo cliente-side)
    ability: "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";
    value: number; // +1, -1, etc.
    note?: string;
    source?: string; // "arma", "armadura", etc.
};

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

export function countPreparedSpells(spells?: Spells): number {
    if (!spells) return 0;
    let count = 0;
    for (let lvl = 1; lvl <= 9; lvl++) {
        const key = `level${lvl}` as keyof Spells;
        const text = (spells[key] ?? "") as string;
        if (!text) continue;
        count += text
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean).length;
    }
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
