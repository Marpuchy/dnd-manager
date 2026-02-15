"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
    Character,
    Details,
    SpellSummary,
    Spells,
    Stats,
    DND_CLASS_OPTIONS,
    LearnedSpellRef,
    normalizeClassForApi,
    getPreparedSpellsInfo,
    countPreparedSpells,
    formatCastingTime,
} from "../playerShared";
import { getMaxSpellLevelForClass } from "@/lib/spells/spellLevels";
import { useClientLocale } from "@/lib/i18n/useClientLocale";
import { getLocalizedText } from "@/lib/character/items";
import { tr } from "@/lib/i18n/translate";
import Markdown from "@/app/components/Markdown";
import CustomContentManager from "../sections/CustomContentManager";

type Props = {
    character: Character;
    onDetailsChange?: (details: Details) => void;
    onClose: () => void;
};

type StatusFilter = "all" | "learned" | "unlearned";

/* ---------------------------
   HELPERS
--------------------------- */
function normalizeSpellName(name: string) {
    return name.split("—")[0].trim();
}

/* ---------------------------
   COMPONENT
--------------------------- */
export function SpellManagerPanel({
                                      character,
                                      onDetailsChange,
                                      onClose,
                                  }: Props) {
    const stats: Stats =
        character.stats ?? {
            str: 10,
            dex: 10,
            con: 10,
            int: 10,
            wis: 10,
            cha: 10,
        };

    const details: Details = character.details || {};
    const charLevel = character.level ?? 0;
    const apiClass = normalizeClassForApi(character.class ?? null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [spells, setSpells] = useState<SpellSummary[]>([]);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [customCreateOpen, setCustomCreateOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortMode, setSortMode] = useState<"level" | "alpha">("level");
    const [levelFilter, setLevelFilter] = useState<"all" | number>("all");
    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("all");

    const [sourceClass, setSourceClass] = useState(
        apiClass === "custom" ? "wizard" : apiClass
    );

    const locale = useClientLocale();
    const t = (es: string, en: string) => tr(locale, es, en);
    const classLabelById = useMemo(
        () =>
            Object.fromEntries(
                DND_CLASS_OPTIONS.map((option) => [
                    option.id,
                    locale === "en" ? option.labelEn : option.label,
                ])
            ) as Record<string, string>,
        [locale]
    );
    const maxLearnableSpellLevel = getMaxSpellLevelForClass(
        apiClass === "custom" ? sourceClass : apiClass,
        charLevel
    );

    const customSpells = Array.isArray(details.customSpells) ? details.customSpells : [];
    const customCantrips = Array.isArray(details.customCantrips) ? details.customCantrips : [];
    const customTraits = Array.isArray(details.customTraits) ? details.customTraits : [];
    const customClassAbilities = Array.isArray(details.customClassAbilities)
        ? details.customClassAbilities
        : [];

    const preparedInfo = getPreparedSpellsInfo(
        character.class,
        stats,
        charLevel,
        details,
        locale
    );
    const currentPreparedCount = countPreparedSpells(details.spells ?? ({} as Spells))


    /* ---------------------------
       LOAD SPELLS
    --------------------------- */
    useEffect(() => {
        if (!apiClass) return;
        loadAllSpells();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiClass, sourceClass, charLevel, locale]);

    async function loadAllSpells() {
        try {
            setLoading(true);
            setError(null);

            const classForApi =
                apiClass === "custom" ? sourceClass : apiClass;
            const collected: SpellSummary[] = [];

            for (let charLvl = 1; charLvl <= charLevel; charLvl++) {
                const res = await fetch(
                    `/api/dnd/spells?class=${encodeURIComponent(
                        classForApi
                    )}&level=${charLvl}&locale=${locale}`
                );

                if (!res.ok) continue;

                const data: SpellSummary[] = await res.json();
                collected.push(...data);
            }

            const unique = Object.values(
                Object.fromEntries(collected.map((s) => [s.index, s]))
            );

            const filtered = unique.filter(
                (s) =>
                    typeof s.level === "number" &&
                    s.level <= maxLearnableSpellLevel
            );

            setSpells(filtered);
        } catch (e: any) {
            setError(e?.message ?? t("Error cargando hechizos.", "Error loading spells."));
        } finally {
            setLoading(false);
        }
    }

    async function patchDetails(patch: Partial<Details>) {
        try {
            const updatedDetails: Details = {
                ...details,
                ...patch,
            };

            await supabase
                .from("characters")
                .update({ details: updatedDetails })
                .eq("id", character.id);

            onDetailsChange?.(updatedDetails);
        } catch (err: any) {
            setError(
                err?.message ??
                    t(
                        "Error guardando contenido personalizado.",
                        "Error saving custom content."
                    )
            );
        }
    }

    /* ---------------------------
       LEARNED STATE (FIX)
    --------------------------- */
    function isSpellLearned(spell: SpellSummary): boolean {
        const currentSpells: Spells = details.spells || {};
        const levelKey = `level${spell.level}` as keyof Spells;
        const value = currentSpells[levelKey];

        if (Array.isArray(value)) {
            return value.some(
                (s: LearnedSpellRef) => s.index === spell.index
            );
        }

        if (typeof value === "string") {
            return value
                .split("\n")
                .map(normalizeSpellName)
                .includes(spell.name);
        }

        return false;
    }

    /* ---------------------------
       LEARN SPELL (FIX)
    --------------------------- */
    async function handleLearnSpell(spell: SpellSummary) {
        try {
            setSavingId(spell.index);
            setError(null);

            const currentSpells: Spells = details.spells || {};
            const levelKey = `level${spell.level}` as keyof Spells;
            const value = currentSpells[levelKey];

            if (spell.level >= 1 && preparedInfo) {
                const count = countPreparedSpells(currentSpells);
                if (count >= preparedInfo.total) {
                    setError(
                        t(
                            `Has alcanzado tu maximo de ${preparedInfo.total} conjuros preparados.`,
                            `You reached your maximum of ${preparedInfo.total} prepared spells.`
                        )
                    );
                    return;
                }
            }

            let updatedLevel: string | LearnedSpellRef[];

            if (Array.isArray(value)) {
                if (
                    value.some(
                        (s) => s.index === spell.index
                    )
                )
                    return;

                updatedLevel = [
                    ...value,
                    { index: spell.index, name: spell.name },
                ];
            } else {
                const lines =
                    typeof value === "string"
                        ? value
                            .split("\n")
                            .map(normalizeSpellName)
                            .filter(Boolean)
                        : [];

                if (lines.includes(spell.name)) return;

                updatedLevel = [...lines, spell.name].join("\n");
            }

            const updatedDetails: Details = {
                ...details,
                spells: {
                    ...currentSpells,
                    [levelKey]: updatedLevel,
                },
            };

            await supabase
                .from("characters")
                .update({ details: updatedDetails })
                .eq("id", character.id);

            onDetailsChange?.(updatedDetails);
        } catch {
            setError(t("Error aprendiendo el hechizo.", "Error learning spell."));
        } finally {
            setSavingId(null);
        }
    }

    /* ---------------------------
       FORGET SPELL (FIX)
    --------------------------- */
    async function handleForgetSpell(spell: SpellSummary) {
        try {
            setSavingId(spell.index);
            setError(null);

            const currentSpells: Spells = details.spells || {};
            const levelKey = `level${spell.level}` as keyof Spells;
            const value = currentSpells[levelKey];

            let updatedLevel: string | LearnedSpellRef[] | undefined;

            if (Array.isArray(value)) {
                const filtered = value.filter(
                    (s) => s.index !== spell.index
                );
                updatedLevel =
                    filtered.length > 0 ? filtered : undefined;
            } else if (typeof value === "string") {
                const filtered = value
                    .split("\n")
                    .map(normalizeSpellName)
                    .filter(
                        (l: string) => l !== spell.name
                    );

                updatedLevel =
                    filtered.length > 0
                        ? filtered.join("\n")
                        : undefined;
            }

            const updatedDetails: Details = {
                ...details,
                spells: {
                    ...currentSpells,
                    [levelKey]: updatedLevel,
                },
            };

            await supabase
                .from("characters")
                .update({ details: updatedDetails })
                .eq("id", character.id);

            onDetailsChange?.(updatedDetails);
        } catch {
            setError(t("Error olvidando el hechizo.", "Error forgetting spell."));
        } finally {
            setSavingId(null);
        }
    }

    /* ---------------------------
       FILTER + SORT (TU CÓDIGO)
    --------------------------- */
    const availableLevels = Array.from(
        new Set(spells.map((s) => s.level))
    ).sort((a, b) => a - b);

    const filteredAndSorted = spells
        .filter((s) => {
            if (levelFilter !== "all" && s.level !== levelFilter)
                return false;

            if (
                s.level > maxLearnableSpellLevel ||
                s.level < 0
            )
                return false;

            const term = searchTerm.trim().toLowerCase();
            if (term) {
                const inName = s.name.toLowerCase().includes(term);
                const shortDesc = getLocalizedText(s.shortDesc as any, locale).toLowerCase();
                const fullDesc = getLocalizedText(s.fullDesc as any, locale).toLowerCase();
                const inDesc = shortDesc.includes(term) || fullDesc.includes(term);
                if (!inName && !inDesc) return false;
            }

            const learned = isSpellLearned(s);
            if (statusFilter === "learned" && !learned)
                return false;
            if (statusFilter === "unlearned" && learned)
                return false;

            return true;
        })
        .sort((a, b) => {
            if (sortMode === "alpha")
                return a.name.localeCompare(b.name);
            if (a.level !== b.level) return a.level - b.level;
            return a.name.localeCompare(b.name);
        });

    /* ---------------------------
       RENDER (100% TUYO)
    --------------------------- */
    return (
        <div className="border border-ring rounded-xl bg-panel/90 h-full flex flex-col">
            <div className="px-6 py-4 border-b border-ring flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-sm font-semibold text-ink">
                        {t("Gestor de hechizos", "Spell manager")} · {character.name}
                    </h2>
                    <p className="text-[11px] text-ink-muted">
                        {(apiClass ? classLabelById[apiClass] : "") ?? apiClass} · {t("Nivel", "Level")}{" "}
                        {charLevel}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                        {t("Max nivel de hechizo", "Max spell level")}: {maxLearnableSpellLevel}
                    </p>
                    {preparedInfo && (
                        <p className="text-[11px] text-ink-muted">
                            {t("Preparados", "Prepared")}: {currentPreparedCount}/
                            {preparedInfo.total}
                        </p>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="text-[11px] px-3 py-2 rounded-md border border-ring hover:bg-white/80"
                >
                    {t("Volver", "Back")}
                </button>
            </div>

            <div className="px-6 py-4 border-b border-ring space-y-3">
                <div className="flex">
                    <button
                        type="button"
                        onClick={() => setCustomCreateOpen(true)}
                        className="text-[11px] px-3 py-2 rounded-md border border-accent/60 bg-accent/10 hover:bg-accent/20"
                    >
                        {t("Crear hechizo personalizado", "Create custom spell")}
                    </button>
                </div>

                {customCreateOpen && (
                    <CustomContentManager
                        locale={locale}
                        customSpells={customSpells}
                        setCustomSpells={(next) => patchDetails({ customSpells: next })}
                        customCantrips={customCantrips}
                        setCustomCantrips={(next) => patchDetails({ customCantrips: next })}
                        customTraits={customTraits}
                        setCustomTraits={(next) => patchDetails({ customTraits: next })}
                        customClassAbilities={customClassAbilities}
                        setCustomClassAbilities={(next) =>
                            patchDetails({ customClassAbilities: next })
                        }
                        createOpen={customCreateOpen}
                        onToggleCreate={setCustomCreateOpen}
                        createAsModal
                    />
                )}

                <div className="flex flex-wrap gap-4">
                    <input
                        type="text"
                        placeholder={t("Buscar hechizo...", "Search spell...")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:flex-1 min-w-0 sm:min-w-[220px] rounded-md bg-white/80 border border-ring px-3 py-2 text-sm"
                    />

                    <select
                        value={sortMode}
                        onChange={(e) =>
                            setSortMode(e.target.value as any)
                        }
                        className="rounded-md bg-white/80 border border-ring px-3 py-2 text-xs"
                    >
                        <option value="level">{t("Nivel -> Nombre", "Level -> Name")}</option>
                        <option value="alpha">{t("Nombre (A-Z)", "Name (A-Z)")}</option>
                    </select>

                    <select
                        value={
                            levelFilter === "all"
                                ? "all"
                                : String(levelFilter)
                        }
                        onChange={(e) =>
                            setLevelFilter(
                                e.target.value === "all"
                                    ? "all"
                                    : Number(e.target.value)
                            )
                        }
                        className="rounded-md bg-white/80 border border-ring px-3 py-2 text-xs"
                    >
                        <option value="all">{t("Todos", "All")}</option>
                        {availableLevels.map((lvl) => (
                            <option key={lvl} value={lvl}>
                                {lvl === 0
                                    ? t("Trucos", "Cantrips")
                                    : `${t("Nivel", "Level")} ${lvl}`}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value as StatusFilter
                            )
                        }
                        className="rounded-md bg-white/80 border border-ring px-3 py-2 text-xs"
                    >
                        <option value="all">{t("Todos", "All")}</option>
                        <option value="learned">{t("Aprendidos", "Learned")}</option>
                        <option value="unlearned">{t("No aprendidos", "Unlearned")}</option>
                    </select>

                    {apiClass === "custom" && (
                        <select
                            value={sourceClass}
                            onChange={(e) =>
                                setSourceClass(e.target.value)
                            }
                            className="rounded-md bg-white/80 border border-ring px-3 py-2 text-xs"
                        >
                            {DND_CLASS_OPTIONS.filter(
                                (c) => c.id !== "custom"
                            ).map((c) => (
                                <option key={c.id} value={c.id}>
                                    {locale === "en" ? c.labelEn : c.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                {error && (
                    <p className="text-xs text-red-400">{error}</p>
                )}

                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={`loading-${i}`}
                                className="border rounded-md p-2 space-y-2 border-ring bg-white/70 animate-pulse"
                            >
                                <div className="flex justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="h-4 w-40 rounded bg-ink-muted/20" />
                                        <div className="h-3 w-32 rounded bg-ink-muted/20" />
                                    </div>
                                    <div className="h-6 w-20 rounded bg-ink-muted/20" />
                                </div>
                                <div className="space-y-1">
                                    <div className="h-3 w-full rounded bg-ink-muted/20" />
                                    <div className="h-3 w-5/6 rounded bg-ink-muted/20" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    filteredAndSorted.map((s) => {
                        const learned = isSpellLearned(s);
                        const shortDesc = getLocalizedText(s.shortDesc as any, locale);
                        const fullDesc = getLocalizedText(s.fullDesc as any, locale);
                        const description = fullDesc || shortDesc;

                        return (
                            <div
                                key={s.index}
                                className={`border rounded-md p-2 space-y-2 ${
                                    learned
                                        ? "border-emerald-500/60 bg-emerald-900/10"
                                        : "border-ring bg-white/70"
                                }`}
                            >
                                <div className="flex justify-between gap-3">
                                    <div>
                                        <p className="font-medium">
                                            {s.name}
                                        </p>
                                        <p className="text-[11px] text-ink-muted">
                                            {t("Nivel", "Level")} {s.level} ·{" "}
                                            {formatCastingTime(
                                                s.casting_time,
                                                locale
                                            )}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() =>
                                            learned
                                                ? handleForgetSpell(s)
                                                : handleLearnSpell(s)
                                        }
                                        disabled={
                                            savingId === s.index
                                        }
                                        className="text-[11px] px-3 py-1 rounded-md border"
                                    >
                                        {learned
                                            ? t("Olvidar", "Forget")
                                            : t("Aprender", "Learn")}
                                    </button>
                                </div>

                                {description && (
                                    <div className="pt-2 border-t border-ring/60">
                                        <Markdown
                                            content={description}
                                            className="text-ink-muted text-xs"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default SpellManagerPanel;

