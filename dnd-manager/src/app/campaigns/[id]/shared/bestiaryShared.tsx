import type { ReactNode } from "react";

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
    languages?: string | null;
    flavor?: string | null;
    notes?: string | null;
    abilityScores: AbilityScores;
    traits?: BestiaryBlock[];
    actions?: BestiaryBlock[];
    bonusActions?: BestiaryBlock[];
    reactions?: BestiaryBlock[];
    legendaryActions?: BestiaryBlock[];
    lairActions?: BestiaryBlock[];
};

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
        <section className="rounded-xl border border-ring bg-panel/65 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-ink/90">
                {label(locale, titleEs, titleEn)}
            </h4>
            <div className="mt-2 space-y-2 text-sm text-ink/90">
                {blocks.map((block, index) => (
                    <div key={`${titleEn}-${index}`}>
                        {block.name ? <p className="font-medium text-ink">{block.name}</p> : null}
                        {block.desc ? <p className="text-ink-muted whitespace-pre-wrap">{block.desc}</p> : null}
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
};

export function CreatureSheet({ data, locale, className, footer, headerRight }: CreatureSheetProps) {
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

    return (
        <article
            className={`rounded-xl border border-ring bg-panel/70 overflow-hidden ${className ?? ""}`.trim()}
        >
            <div className="border-b border-ring bg-panel/95 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-ink">{data.name}</h3>
                        {data.sourceLabel ? (
                            <span className="inline-flex items-center rounded-full border border-ring bg-white/80 px-2 py-0.5 text-[11px] text-ink-muted">
                                {data.sourceLabel}
                            </span>
                        ) : null}
                        {typeof data.isPlayerVisible === "boolean" ? (
                            <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                                    data.isPlayerVisible
                                        ? "border-emerald-400/70 bg-emerald-100 text-emerald-700"
                                        : "border-amber-400/70 bg-amber-100 text-amber-800"
                                }`}
                            >
                                {data.isPlayerVisible
                                    ? label(locale, "Visible para jugadores", "Visible to players")
                                    : label(locale, "Solo DM", "DM only")}
                            </span>
                        ) : null}
                    </div>
                    {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
                </div>
                {data.subtitle ? <p className="mt-1 text-xs text-ink-muted">{data.subtitle}</p> : null}
            </div>

            <div className="p-4 overflow-x-hidden">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,34%)] items-start">
                    <div className="min-w-0 space-y-4">
                        <div className="flex flex-wrap gap-2 text-xs">
                            {data.creatureSize ? (
                                <span className="rounded-full border border-ring bg-white/80 px-2 py-1 text-ink">
                                    {data.creatureSize}
                                </span>
                            ) : null}
                            {data.creatureType ? (
                                <span className="rounded-full border border-ring bg-white/80 px-2 py-1 text-ink">
                                    {data.creatureType}
                                </span>
                            ) : null}
                            {data.alignment ? (
                                <span className="rounded-full border border-ring bg-white/80 px-2 py-1 text-ink">
                                    {data.alignment}
                                </span>
                            ) : null}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                            <div className="rounded-lg border border-ring bg-white/80 px-2 py-2">
                                <p className="text-ink-muted">AC</p>
                                <p className="text-sm font-semibold text-ink">{formatSummaryNumber(data.armorClass)}</p>
                            </div>
                            <div className="rounded-lg border border-ring bg-white/80 px-2 py-2">
                                <p className="text-ink-muted">HP</p>
                                <p className="text-sm font-semibold text-ink">{hpSummaryText}</p>
                            </div>
                            <div className="rounded-lg border border-ring bg-white/80 px-2 py-2">
                                <p className="text-ink-muted">CR</p>
                                <p className="text-sm font-semibold text-ink">{formatSummaryNumber(data.challengeRating)}</p>
                            </div>
                            <div className="rounded-lg border border-ring bg-white/80 px-2 py-2">
                                <p className="text-ink-muted">XP</p>
                                <p className="text-sm font-semibold text-ink">{formatSummaryNumber(data.xp)}</p>
                            </div>
                            <div className="rounded-lg border border-ring bg-white/80 px-2 py-2">
                                <p className="text-ink-muted">PB</p>
                                <p className="text-sm font-semibold text-ink">{formatSummaryNumber(data.proficiencyBonus)}</p>
                            </div>
                        </div>

                        <section className="rounded-xl border border-ring bg-panel/65 p-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-ink/90">
                                {label(locale, "Caracteristicas", "Abilities")}
                            </h4>
                            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {ABILITY_KEYS.map((ability) => {
                                    const score = data.abilityScores[ability] ?? 10;
                                    const modifier = abilityModifier(score);
                                    return (
                                        <div
                                            key={ability}
                                            className="rounded-lg border border-ring bg-white/80 px-2 py-2"
                                        >
                                            <p className="text-[11px] font-semibold text-ink-muted">{ability}</p>
                                            <p className="text-sm font-semibold text-ink">
                                                {score} ({formatModifier(modifier)})
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            <div className="rounded-lg border border-ring bg-white/75 px-3 py-2 text-xs text-ink-muted">
                                <p className="font-medium uppercase tracking-wide text-ink/80">
                                    {label(locale, "Velocidad", "Speed")}
                                </p>
                                <p className="mt-1 text-ink">{speedText || "-"}</p>
                            </div>
                            <div className="rounded-lg border border-ring bg-white/75 px-3 py-2 text-xs text-ink-muted">
                                <p className="font-medium uppercase tracking-wide text-ink/80">
                                    {label(locale, "Sentidos", "Senses")}
                                </p>
                                <p className="mt-1 text-ink">{sensesText || "-"}</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-ring bg-white/75 px-3 py-2 text-xs text-ink-muted">
                            <p className="font-medium uppercase tracking-wide text-ink/80">
                                {label(locale, "Idiomas", "Languages")}
                            </p>
                            <p className="mt-1 text-ink">{data.languages?.trim() || "-"}</p>
                        </div>

                        {data.flavor ? (
                            <section className="rounded-xl border border-ring bg-panel/65 p-3">
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-ink/90">
                                    {label(locale, "Descripcion", "Description")}
                                </h4>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">{data.flavor}</p>
                            </section>
                        ) : null}

                        {notesText ? (
                            <section className="rounded-xl border border-ring bg-panel/65 p-3">
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-ink/90">
                                    {label(locale, "Notas", "Notes")}
                                </h4>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">{notesText}</p>
                            </section>
                        ) : null}

                        {renderBlocks(locale, "Rasgos", "Traits", data.traits)}
                        {renderBlocks(locale, "Acciones", "Actions", data.actions)}
                        {renderBlocks(locale, "Acciones bonus", "Bonus actions", data.bonusActions)}
                        {renderBlocks(locale, "Reacciones", "Reactions", data.reactions)}
                        {renderBlocks(locale, "Acciones legendarias", "Legendary actions", data.legendaryActions)}
                        {renderBlocks(locale, "Acciones de guarida", "Lair actions", data.lairActions)}
                    </div>

                    <div className="min-w-0">
                        <div className="rounded-xl border border-ring bg-white/70 overflow-hidden min-h-[320px] h-full flex items-center justify-center">
                            {imageUrl ? (
                                // Keep object-contain to avoid horizontal scroll while preserving large visual footprint.
                                <img
                                    src={imageUrl}
                                    alt={data.name}
                                    className="block h-full max-h-[620px] w-full object-contain"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="px-4 text-center text-sm text-ink-muted">
                                    {label(locale, "Sin imagen", "No image")}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {footer ? <div className="mt-4">{footer}</div> : null}
            </div>
        </article>
    );
}
