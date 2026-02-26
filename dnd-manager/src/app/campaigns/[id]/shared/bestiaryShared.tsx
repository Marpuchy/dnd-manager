"use client";

import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
    type SyntheticEvent,
} from "react";

import StatsHexagon from "@/app/components/StatsHexagon";

export type AbilityKey = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";

export type AbilityScores = Record<AbilityKey, number>;

export type BestiaryBlock = {
    name: string;
    desc: string;
};

export type CreatureSheetData = {
    name: string;
    subtitle?: string | null;
    sourceLabel?: string | null;
    imageUrl?: string | null;
    isPlayerVisible?: boolean;
    creatureSize?: string | null;
    creatureType?: string | null;
    alignment?: string | null;
    challengeRating?: number | null;
    xp?: number | null;
    proficiencyBonus?: number | null;
    armorClass?: number | null;
    hitPoints?: number | null;
    hitDice?: string | null;
    speed?: Record<string, unknown>;
    senses?: Record<string, unknown>;
    savingThrows?: Record<string, unknown>;
    skills?: Record<string, unknown>;
    languages?: string | null;
    flavor?: string | null;
    notes?: string | null;
    tags?: string[];
    abilityScores: AbilityScores;
    traits?: BestiaryBlock[];
    actions?: BestiaryBlock[];
    bonusActions?: BestiaryBlock[];
    reactions?: BestiaryBlock[];
    legendaryActions?: BestiaryBlock[];
    lairActions?: BestiaryBlock[];
};

type CreatureSheetStatsMode = "grid" | "hex";
type CreatureImageFitMode = "unknown" | "portrait" | "landscape" | "square";

export const ABILITY_KEYS: AbilityKey[] = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

export const DEFAULT_ABILITY_SCORES: AbilityScores = {
    STR: 10,
    DEX: 10,
    CON: 10,
    INT: 10,
    WIS: 10,
    CHA: 10,
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function label(locale: string, es: string, en: string): string {
    return locale === "en" ? en : es;
}

function toNumberOrNull(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const parsed = Number(trimmed);
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
}

function readAbilityValue(record: Record<string, unknown>, key: AbilityKey): unknown {
    const aliases: Record<AbilityKey, string[]> = {
        STR: ["STR", "str", "strength", "fuerza", "FUE"],
        DEX: ["DEX", "dex", "dexterity", "destreza", "DES"],
        CON: ["CON", "con", "constitution", "constitucion"],
        INT: ["INT", "int", "intelligence", "inteligencia"],
        WIS: ["WIS", "wis", "wisdom", "sabiduria", "SAB"],
        CHA: ["CHA", "cha", "charisma", "carisma", "CAR"],
    };

    for (const alias of aliases[key]) {
        if (alias in record) return record[alias];
    }
    return null;
}

export function normalizeAbilityScores(raw: unknown): AbilityScores {
    if (!isRecord(raw)) {
        return { ...DEFAULT_ABILITY_SCORES };
    }

    const next: AbilityScores = { ...DEFAULT_ABILITY_SCORES };
    for (const key of ABILITY_KEYS) {
        const parsed = toNumberOrNull(readAbilityValue(raw, key));
        next[key] = parsed == null ? 10 : Math.round(parsed);
    }

    return next;
}

export function abilityModifier(score: number): number {
    return Math.floor((score - 10) / 2);
}

export function formatModifier(modifier: number): string {
    return modifier >= 0 ? `+${modifier}` : String(modifier);
}

export function toLooseRecord(raw: unknown): Record<string, unknown> {
    if (!isRecord(raw)) return {};
    return raw;
}

export function toBestiaryBlocks(raw: unknown): BestiaryBlock[] {
    if (!Array.isArray(raw)) return [];

    const parsed: BestiaryBlock[] = [];
    for (const entry of raw) {
        if (typeof entry === "string") {
            const desc = entry.trim();
            if (desc) parsed.push({ name: "", desc });
            continue;
        }

        if (!isRecord(entry)) continue;

        const nameValue = entry.name;
        const descValue = entry.desc ?? entry.description;
        const name = typeof nameValue === "string" ? nameValue.trim() : "";
        const desc = typeof descValue === "string" ? descValue.trim() : "";
        if (!name && !desc) continue;

        parsed.push({
            name,
            desc,
        });
    }

    return parsed;
}

export function normalizeImageUrl(rawUrl: string | null | undefined): string | null {
    const value = String(rawUrl ?? "").trim();
    if (!value) return null;

    if (value.startsWith("http://") || value.startsWith("https://")) {
        return value;
    }

    if (value.startsWith("/api/images/")) {
        return `https://www.dnd5eapi.co${value}`;
    }

    return value;
}

function toTextValue(value: unknown): string {
    if (value == null) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return "";
}

type ModifierDefinition = {
    id: string;
    labelEs: string;
    labelEn: string;
    ability?: AbilityKey;
    aliases: string[];
};

type ModifierRow = {
    key: string;
    label: string;
    valueText: string;
    ability: AbilityKey | null;
};

const SAVING_THROW_DEFINITIONS: ModifierDefinition[] = [
    {
        id: "save-str",
        labelEs: "Fuerza",
        labelEn: "Strength",
        ability: "STR",
        aliases: ["str", "strength", "fue", "fuerza", "savestr", "savingthrowstr", "savefuerza"],
    },
    {
        id: "save-dex",
        labelEs: "Destreza",
        labelEn: "Dexterity",
        ability: "DEX",
        aliases: ["dex", "dexterity", "des", "destreza", "savedex", "savingthrowdex", "savedestreza"],
    },
    {
        id: "save-con",
        labelEs: "Constitución",
        labelEn: "Constitution",
        ability: "CON",
        aliases: ["con", "constitution", "constitucion", "savecon", "savingthrowcon", "saveconstitucion"],
    },
    {
        id: "save-int",
        labelEs: "Inteligencia",
        labelEn: "Intelligence",
        ability: "INT",
        aliases: ["int", "intelligence", "inteligencia", "saveint", "savingthrowint", "saveinteligencia"],
    },
    {
        id: "save-wis",
        labelEs: "Sabiduría",
        labelEn: "Wisdom",
        ability: "WIS",
        aliases: ["wis", "wisdom", "sab", "sabiduria", "savewis", "savingthrowwis", "savesabiduria"],
    },
    {
        id: "save-cha",
        labelEs: "Carisma",
        labelEn: "Charisma",
        ability: "CHA",
        aliases: ["cha", "charisma", "car", "carisma", "savecha", "savingthrowcha", "savecarisma"],
    },
];

const SKILL_DEFINITIONS: ModifierDefinition[] = [
    {
        id: "skill-athletics",
        labelEs: "Atletismo",
        labelEn: "Athletics",
        ability: "STR",
        aliases: ["athletics", "atletismo"],
    },
    {
        id: "skill-acrobatics",
        labelEs: "Acrobacias",
        labelEn: "Acrobatics",
        ability: "DEX",
        aliases: ["acrobatics", "acrobacias"],
    },
    {
        id: "skill-sleight-of-hand",
        labelEs: "Juego de manos",
        labelEn: "Sleight of Hand",
        ability: "DEX",
        aliases: ["sleightofhand", "juegodemanos", "prestidigitacion"],
    },
    {
        id: "skill-stealth",
        labelEs: "Sigilo",
        labelEn: "Stealth",
        ability: "DEX",
        aliases: ["stealth", "sigilo"],
    },
    {
        id: "skill-arcana",
        labelEs: "Arcanos",
        labelEn: "Arcana",
        ability: "INT",
        aliases: ["arcana", "arcanos"],
    },
    {
        id: "skill-history",
        labelEs: "Historia",
        labelEn: "History",
        ability: "INT",
        aliases: ["history", "historia"],
    },
    {
        id: "skill-investigation",
        labelEs: "Investigacion",
        labelEn: "Investigation",
        ability: "INT",
        aliases: ["investigation", "investigacion"],
    },
    {
        id: "skill-nature",
        labelEs: "Naturaleza",
        labelEn: "Nature",
        ability: "INT",
        aliases: ["nature", "naturaleza"],
    },
    {
        id: "skill-religion",
        labelEs: "Religion",
        labelEn: "Religion",
        ability: "INT",
        aliases: ["religion"],
    },
    {
        id: "skill-animal-handling",
        labelEs: "Trato con animales",
        labelEn: "Animal Handling",
        ability: "WIS",
        aliases: ["animalhandling", "tratoanimales"],
    },
    {
        id: "skill-insight",
        labelEs: "Perspicacia",
        labelEn: "Insight",
        ability: "WIS",
        aliases: ["insight", "perspicacia"],
    },
    {
        id: "skill-medicine",
        labelEs: "Medicina",
        labelEn: "Medicine",
        ability: "WIS",
        aliases: ["medicine", "medicina"],
    },
    {
        id: "skill-perception",
        labelEs: "Percepción",
        labelEn: "Perception",
        ability: "WIS",
        aliases: ["perception", "percepcion"],
    },
    {
        id: "skill-survival",
        labelEs: "Supervivencia",
        labelEn: "Survival",
        ability: "WIS",
        aliases: ["survival", "supervivencia"],
    },
    {
        id: "skill-deception",
        labelEs: "Engaño",
        labelEn: "Deception",
        ability: "CHA",
        aliases: ["deception", "engano"],
    },
    {
        id: "skill-intimidation",
        labelEs: "Intimidación",
        labelEn: "Intimidation",
        ability: "CHA",
        aliases: ["intimidation", "intimidacion", "intimidación"],
    },
    {
        id: "skill-performance",
        labelEs: "Interpretacion",
        labelEn: "Performance",
        ability: "CHA",
        aliases: ["performance", "interpretacion"],
    },
    {
        id: "skill-persuasion",
        labelEs: "Persuasión",
        labelEn: "Persuasion",
        ability: "CHA",
        aliases: ["persuasion"],
    },
];

function normalizeLookupKey(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

function prettifyRecordKey(rawKey: string): string {
    const merged = rawKey
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (!merged) return rawKey;

    return merged
        .split(" ")
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part))
        .join(" ");
}

function parseModifierNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string") {
        const trimmed = value.trim().replace(",", ".");
        if (!trimmed) return null;
        const direct = Number(trimmed);
        if (Number.isFinite(direct)) return direct;
        const extracted = trimmed.match(/[-+]?\d+(?:\.\d+)?/);
        if (!extracted) return null;
        const parsed = Number(extracted[0]);
        return Number.isFinite(parsed) ? parsed : null;
    }

    if (isRecord(value)) {
        return (
            parseModifierNumber(value.value) ??
            parseModifierNumber(value.modifier) ??
            parseModifierNumber(value.bonus)
        );
    }

    return null;
}

function formatModifierValue(value: unknown): string {
    const parsed = parseModifierNumber(value);
    if (parsed != null) {
        return formatModifier(Math.round(parsed));
    }
    return toTextValue(value) || "-";
}

function abilityShortLabel(ability: AbilityKey, locale: string): string {
    if (locale === "en") return ability;
    if (ability === "STR") return "FUE";
    if (ability === "DEX") return "DES";
    if (ability === "WIS") return "SAB";
    if (ability === "CHA") return "CAR";
    return ability;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function rgbToHex(red: number, green: number, blue: number): string {
    const toHex = (channel: number) =>
        clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0");
    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function resolveBestiaryHexPowerColor(
    abilityScores: AbilityScores
): { stroke: string; fill: string } {
    const totalScore = ABILITY_KEYS.reduce(
        (sum, ability) => sum + (abilityScores[ability] ?? DEFAULT_ABILITY_SCORES[ability]),
        0
    );
    const minTotal = 10;
    const maxTotal = 180;
    const intensity = clamp((totalScore - minTotal) / (maxTotal - minTotal), 0, 1);

    // Desaturated blood-red to near-black for a cleaner enemy palette.
    const startRed = 212;
    const startGreen = 118;
    const startBlue = 108;

    const endRed = 10;
    const endGreen = 8;
    const endBlue = 8;

    const red = startRed + (endRed - startRed) * intensity;
    const green = startGreen + (endGreen - startGreen) * intensity;
    const blue = startBlue + (endBlue - startBlue) * intensity;

    const fillAlpha = 0.24 + intensity * 0.26;

    return {
        stroke: rgbToHex(red, green, blue),
        fill: `rgba(${Math.round(red)},${Math.round(green)},${Math.round(blue)},${fillAlpha.toFixed(2)})`,
    };
}

function collectModifierRows(
    rawRecord: Record<string, unknown>,
    definitions: ModifierDefinition[],
    locale: string
): ModifierRow[] {
    const entries = Object.entries(rawRecord);
    if (entries.length === 0) return [];

    const consumed = new Set<string>();
    const orderedRows: ModifierRow[] = [];

    for (const definition of definitions) {
        const matched = entries.find(([rawKey]) => {
            if (consumed.has(rawKey)) return false;
            const normalizedKey = normalizeLookupKey(rawKey);
            return definition.aliases.some((alias) => alias === normalizedKey);
        });

        if (!matched) continue;
        const [rawKey, rawValue] = matched;
        consumed.add(rawKey);
        orderedRows.push({
            key: definition.id,
            label: label(locale, definition.labelEs, definition.labelEn),
            valueText: formatModifierValue(rawValue),
            ability: definition.ability ?? null,
        });
    }

    const fallbackRows = entries
        .filter(([rawKey]) => !consumed.has(rawKey))
        .map(([rawKey, rawValue]) => ({
            key: rawKey,
            label: prettifyRecordKey(rawKey),
            valueText: formatModifierValue(rawValue),
            ability: null,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, locale));

    return [...orderedRows, ...fallbackRows];
}

function toHexagonStats(
    abilityScores: AbilityScores
): Record<"FUE" | "DES" | "CON" | "INT" | "SAB" | "CAR", number> {
    return {
        FUE: abilityScores.STR ?? 10,
        DES: abilityScores.DEX ?? 10,
        CON: abilityScores.CON ?? 10,
        INT: abilityScores.INT ?? 10,
        SAB: abilityScores.WIS ?? 10,
        CAR: abilityScores.CHA ?? 10,
    };
}

function abilityProgressPercent(score: number): number {
    const safeScore = Math.max(1, Math.min(30, Number.isFinite(score) ? score : 10));
    return Math.max(8, Math.round((safeScore / 30) * 100));
}

function formatRecordInline(record: Record<string, unknown>): string {
    const entries = Object.entries(record)
        .map(([key, rawValue]) => {
            const value = toTextValue(rawValue);
            if (!value) return null;
            return `${key}: ${value}`;
        })
        .filter((entry): entry is string => Boolean(entry));

    return entries.join(" · ");
}

function formatSummaryNumber(value: number | null | undefined): string {
    if (value == null || !Number.isFinite(value)) return "-";
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(2).replace(/\.00$/, "");
}

function formatHitDiceInline(value: string | null | undefined): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed
        .replace(/\s+/g, "")
        .replace(/\+/g, " +")
        .replace(/-(\d)/g, " -$1")
        .trim();
}

function hasCombatQualityTrait(
    traits: BestiaryBlock[] | undefined,
    kind: "weakness" | "resistance"
): boolean {
    if (!traits || traits.length === 0) return false;
    return traits.some((entry) => {
        const name = entry.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
        if (!name) return false;
        if (kind === "weakness") {
            return (
                name.includes("debilidad") ||
                name.includes("weakness") ||
                name.includes("vulnerabilidad")
            );
        }
        return name.includes("resistencia") || name.includes("resistance");
    });
}

function stripDerivedCombatQualityNotes(
    notes: string | null | undefined,
    traits: BestiaryBlock[] | undefined
): string | null {
    if (!notes) return null;
    const hasWeaknessTrait = hasCombatQualityTrait(traits, "weakness");
    const hasResistanceTrait = hasCombatQualityTrait(traits, "resistance");
    if (!hasWeaknessTrait && !hasResistanceTrait) {
        return notes.trim() || null;
    }

    const nextLines = notes
        .replace(/\r/g, "")
        .split("\n")
        .filter((line) => {
            const trimmed = line.trim();
            if (!trimmed) return true;
            if (
                hasWeaknessTrait &&
                /^(?:debilidad(?:es)?|weakness(?:es)?|vulnerabilidad(?:es)?|vulnerabilities?)\s*:/i.test(
                    trimmed
                )
            ) {
                return false;
            }
            if (
                hasResistanceTrait &&
                /^(?:resistencia(?:s)?|resistances?)\s*:/i.test(trimmed)
            ) {
                return false;
            }
            return true;
        });

    const merged = nextLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    return merged || null;
}

function renderBlocks(
    locale: string,
    titleEs: string,
    titleEn: string,
    blocks: BestiaryBlock[] | undefined
): ReactNode {
    if (!blocks || blocks.length === 0) return null;

    return (
        <section className="rounded-md bg-[#fff8eb]/85 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7d2018]">
                {label(locale, titleEs, titleEn)}
            </h4>
            <div className="mt-1 h-[1.5px] w-full bg-gradient-to-r from-[#8f3328]/75 via-[#b15344]/50 to-transparent" />
            <div className="mt-2 space-y-2 text-[13px] leading-5 text-[#2e221b]">
                {blocks.map((block, index) => (
                    <div key={`${titleEn}-${index}`}>
                        {block.name && block.desc ? (
                            <p className="whitespace-pre-wrap">
                                <span className="font-semibold italic text-[#4e1d17]">{block.name}. </span>
                                {block.desc}
                            </p>
                        ) : block.name ? (
                            <p className="font-semibold italic text-[#4e1d17]">{block.name}</p>
                        ) : block.desc ? (
                            <p className="whitespace-pre-wrap">{block.desc}</p>
                        ) : null}
                    </div>
                ))}
            </div>
        </section>
    );
}

type CreatureSheetProps = {
    data: CreatureSheetData;
    locale: string;
    className?: string;
    footer?: ReactNode;
    headerRight?: ReactNode;
    statsMode?: CreatureSheetStatsMode;
};

export function CreatureSheet({
    data,
    locale,
    className,
    footer,
    headerRight,
    statsMode = "grid",
}: CreatureSheetProps) {
    const speedText = formatRecordInline(data.speed ?? {});
    const sensesText = formatRecordInline(data.senses ?? {});
    const imageUrl = normalizeImageUrl(data.imageUrl);
    const hitDiceText = formatHitDiceInline(data.hitDice);
    const notesText = stripDerivedCombatQualityNotes(data.notes, data.traits);
    const hpNumberText = formatSummaryNumber(data.hitPoints);
    const hpSummaryText =
        hitDiceText && hpNumberText !== "-"
            ? `${hpNumberText} HP (${hitDiceText})`
            : hpNumberText;
    const subtitleText =
        data.subtitle?.trim() ||
        [data.creatureSize, data.creatureType, data.alignment].filter(Boolean).join(", ");
    const tags = Array.from(
        new Set((data.tags ?? []).map((tag) => String(tag ?? "").trim()).filter(Boolean))
    ).slice(0, 6);

    const armorClassLabel = label(locale, "Clase de armadura", "Armor Class");
    const hitPointsLabel = label(locale, "Puntos de golpe", "Hit Points");
    const speedLabel = label(locale, "Velocidad", "Speed");
    const sensesLabel = label(locale, "Sentidos", "Senses");
    const languagesLabel = label(locale, "Idiomas", "Languages");
    const attributesLabel = label(locale, "Atributos y habilidades", "Attributes and skills");
    const rulesLabel = label(locale, "Reglas de combate", "Combat details");
    const noImageLabel = label(locale, "Sin imagen", "No image");
    const noTagsLabel = label(locale, "Sin etiquetas", "No tags");
    const [imageFitMode, setImageFitMode] = useState<CreatureImageFitMode>("unknown");
    const imageRef = useRef<HTMLImageElement | null>(null);

    const resolveImageBounds = useCallback((mode: CreatureImageFitMode) => {
        if (mode === "portrait") {
            return { maxWidthPx: 300, maxHeightPx: 410 };
        }
        if (mode === "landscape") {
            return { maxWidthPx: 520, maxHeightPx: 300 };
        }
        return { maxWidthPx: 360, maxHeightPx: 360 };
    }, []);

    useEffect(() => {
        setImageFitMode("unknown");
    }, [imageUrl]);

    const updateImageMetrics = useCallback((image: HTMLImageElement) => {
        const { naturalWidth, naturalHeight } = image;
        if (!naturalWidth || !naturalHeight) return;
        const ratio = naturalWidth / naturalHeight;
        const nextMode: CreatureImageFitMode =
            ratio >= 1.18 ? "landscape" : ratio <= 0.82 ? "portrait" : "square";
        setImageFitMode((current) => (current === nextMode ? current : nextMode));
    }, []);

    const handleImageLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
        updateImageMetrics(event.currentTarget);
    }, [updateImageMetrics]);

    const setImageNode = useCallback((node: HTMLImageElement | null) => {
        imageRef.current = node;
        if (!node) return;
        if (node.complete) {
            updateImageMetrics(node);
        }
    }, [updateImageMetrics]);

    useLayoutEffect(() => {
        const node = imageRef.current;
        if (!node) return;
        if (node.complete) {
            updateImageMetrics(node);
        }

        if (typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(() => {
            if (imageRef.current) {
                updateImageMetrics(imageRef.current);
            }
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, [imageUrl, updateImageMetrics]);

    const hasImage = Boolean(imageUrl);

    const imageBounds = useMemo(() => resolveImageBounds(imageFitMode), [imageFitMode, resolveImageBounds]);

    const imageMaxSize = useMemo(
        () => ({
            maxWidth: `min(100%, ${imageBounds.maxWidthPx}px)`,
            maxHeight: `${imageBounds.maxHeightPx}px`,
        }),
        [imageBounds]
    );

    const rulesGridClass = !imageUrl
        ? "md:grid-cols-3"
        : imageFitMode === "landscape"
          ? "md:grid-cols-1 lg:grid-cols-2"
          : "md:grid-cols-2";
    const contentLayoutClass = hasImage
        ? "md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-x-8 md:gap-y-4"
        : "";
    const imageShellClass = hasImage
        ? "mb-5 inline-block overflow-hidden rounded-xl border border-[#c8a47a]/70 bg-white md:col-start-2 md:row-start-1 md:mb-0 md:justify-self-end"
        : "mb-5 inline-block overflow-hidden rounded-xl border border-[#c8a47a]/70 bg-white";
    const rulesSectionClass = "rounded-md bg-[#fff8ea]/85 px-3 py-2.5";
    const attributesSectionClass = "rounded-md bg-[#fff8eb]/85 px-3 py-2.5";
    const flowClass = `${hasImage ? "md:col-start-1 md:row-start-1" : ""} min-w-0 space-y-4 text-[#2e221b]`.trim();
    const trailingBlocksClass = `${hasImage ? "mt-4 md:mt-0 md:col-span-2 md:row-start-2" : "mt-4"} min-w-0 space-y-4 text-[#2e221b]`.trim();

    return (
        <article
            className={`relative overflow-hidden rounded-lg bg-[linear-gradient(180deg,#fcf6ea_0%,#f2e5d0_100%)] shadow-[0_20px_48px_rgba(44,26,16,0.22)] ${className ?? ""}`.trim()}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_80%_at_50%_-10%,rgba(255,255,255,0.55),transparent_72%)]" />

            <div className="relative px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="font-display text-2xl font-semibold uppercase tracking-[0.06em] text-[#7d2018] sm:text-3xl">
                            {data.name}
                        </h3>
                        {subtitleText ? (
                            <p className="mt-1 text-sm italic text-[#4c372a]">{subtitleText}</p>
                        ) : null}
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {data.sourceLabel ? (
                            <span className="inline-flex items-center rounded-sm bg-[#fff4e2] px-2 py-0.5 text-[11px] text-[#5a4234]">
                                {data.sourceLabel}
                            </span>
                        ) : null}
                        {typeof data.isPlayerVisible === "boolean" ? (
                            <span
                                className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] ${
                                    data.isPlayerVisible
                                        ? "bg-emerald-100/80 text-emerald-900"
                                        : "bg-amber-100/80 text-amber-900"
                                }`}
                            >
                                {data.isPlayerVisible
                                    ? label(locale, "Visible para jugadores", "Visible to players")
                                    : label(locale, "Solo DM", "DM only")}
                            </span>
                        ) : null}
                        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
                    </div>
                </div>

                <div className="mt-3 h-[2px] w-full bg-gradient-to-r from-[#8f3328]/85 via-[#b55345]/55 to-transparent" />

                <div className="mt-3 space-y-1 text-[13px] leading-5 text-[#2e211b]">
                    <p>
                        <span className="font-semibold text-[#7d2018]">{armorClassLabel}</span>{" "}
                        {formatSummaryNumber(data.armorClass)}
                    </p>
                    <p>
                        <span className="font-semibold text-[#7d2018]">{hitPointsLabel}</span>{" "}
                        {hpSummaryText}
                    </p>
                    <p>
                        <span className="font-semibold text-[#7d2018]">{speedLabel}</span>{" "}
                        {speedText || "-"}
                    </p>
                </div>

                <div className="mt-3 h-[2px] w-full bg-gradient-to-r from-[#8f3328]/85 via-[#b55345]/55 to-transparent" />

                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                    <span className="inline-flex items-center rounded-sm bg-[#fff5e4] px-2 py-1 text-[#4f382c]">
                        CR {formatSummaryNumber(data.challengeRating)}
                    </span>
                    <span className="inline-flex items-center rounded-sm bg-[#fff5e4] px-2 py-1 text-[#4f382c]">
                        XP {formatSummaryNumber(data.xp)}
                    </span>
                    <span className="inline-flex items-center rounded-sm bg-[#fff5e4] px-2 py-1 text-[#4f382c]">
                        PB {formatSummaryNumber(data.proficiencyBonus)}
                    </span>
                    {tags.length === 0 ? (
                        <span className="inline-flex items-center rounded-sm bg-[#fff5e4]/70 px-2 py-1 text-[#7a6354]">
                            {noTagsLabel}
                        </span>
                    ) : (
                        tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center rounded-sm bg-[#fff5e4]/70 px-2 py-1 text-[#7a6354]"
                            >
                                {tag}
                            </span>
                        ))
                    )}
                </div>
            </div>

            <div className="relative mt-3 p-4">
                <div className={contentLayoutClass}>
                    <div className={imageShellClass}>
                        {imageUrl ? (
                            <img
                                key={imageUrl}
                                src={imageUrl}
                                alt={data.name}
                                className="block h-auto w-auto leading-none"
                                loading="lazy"
                                ref={setImageNode}
                                onLoad={handleImageLoad}
                                style={imageMaxSize}
                            />
                        ) : (
                            <div className="px-4 text-center text-sm text-[#6f5849]">
                                {noImageLabel}
                            </div>
                        )}
                    </div>

                    <div className={flowClass}>
                        <section className={rulesSectionClass}>
                            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7d2018]">
                                {rulesLabel}
                            </h4>
                            <div className="mt-1 h-[1.5px] w-full bg-gradient-to-r from-[#8f3328]/75 via-[#b15344]/50 to-transparent" />
                            <div
                                className={`mt-2 grid grid-cols-1 gap-2 text-[13px] leading-5 ${rulesGridClass}`}
                            >
                                <p>
                                    <span className="font-semibold text-[#7d2018]">{speedLabel}</span>{" "}
                                    {speedText || "-"}
                                </p>
                                <p>
                                    <span className="font-semibold text-[#7d2018]">{sensesLabel}</span>{" "}
                                    {sensesText || "-"}
                                </p>
                                <p>
                                    <span className="font-semibold text-[#7d2018]">{languagesLabel}</span>{" "}
                                    {data.languages?.trim() || "-"}
                                </p>
                            </div>
                        </section>

                        <section className={attributesSectionClass}>
                            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7d2018]">
                                {attributesLabel}
                            </h4>
                            <div className="mt-1 h-[1.5px] w-full bg-gradient-to-r from-[#8f3328]/75 via-[#b15344]/50 to-transparent" />
                            <div className="mt-2 space-y-2">
                                {ABILITY_KEYS.map((ability) => {
                                    const score = data.abilityScores[ability] ?? 10;
                                    const modifier = abilityModifier(score);
                                    const percentage = abilityProgressPercent(score);

                                    return (
                                        <div
                                            key={`bar-${ability}`}
                                            className="rounded-sm bg-[#fff6e7] px-2.5 py-2"
                                        >
                                            <div className="flex items-center justify-between text-[12px]">
                                                <span className="font-semibold text-[#5f493b]">
                                                    {abilityShortLabel(ability, locale)}
                                                </span>
                                                <span className="font-semibold text-[#4e1d17]">
                                                    {score} ({formatModifier(modifier)})
                                                </span>
                                            </div>
                                            <div className="mt-1.5 h-2 w-full rounded-full bg-[#e7d4bb]">
                                                <div
                                                    className="h-2 rounded-full bg-[#7d2018]/72"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    <div className={trailingBlocksClass}>
                        {data.flavor ? (
                            <section className="rounded-md bg-[#fff8eb]/85 px-3 py-2.5">
                                <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7d2018]">
                                    {label(locale, "Descripción", "Description")}
                                </h4>
                                <div className="mt-1 h-[1.5px] w-full bg-gradient-to-r from-[#8f3328]/75 via-[#b15344]/50 to-transparent" />
                                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-5">{data.flavor}</p>
                            </section>
                        ) : null}

                        {notesText ? (
                            <section className="rounded-md bg-[#fff8eb]/85 px-3 py-2.5">
                                <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7d2018]">
                                    {label(locale, "Notas", "Notes")}
                                </h4>
                                <div className="mt-1 h-[1.5px] w-full bg-gradient-to-r from-[#8f3328]/75 via-[#b15344]/50 to-transparent" />
                                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-5">{notesText}</p>
                            </section>
                        ) : null}

                        {renderBlocks(locale, "Rasgos", "Traits", data.traits)}
                        {renderBlocks(locale, "Acciones", "Actions", data.actions)}
                        {renderBlocks(locale, "Acciones bonus", "Bonus actions", data.bonusActions)}
                        {renderBlocks(locale, "Reacciones", "Reactions", data.reactions)}
                        {renderBlocks(locale, "Acciones legendarias", "Legendary actions", data.legendaryActions)}
                        {renderBlocks(locale, "Acciones de guarida", "Lair actions", data.lairActions)}
                    </div>
                </div>

                {footer ? <div className="mt-4">{footer}</div> : null}
            </div>
        </article>
    );
}
