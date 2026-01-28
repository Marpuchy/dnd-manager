"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
    Character,
    Details,
    SpellSummary,
    Spells,
    Stats,
    CLASS_LABELS,
    DND_CLASS_OPTIONS,
    LearnedSpellRef,
    normalizeClassForApi,
    getPreparedSpellsInfo,
    countPreparedSpells,
    formatCastingTime,
} from "../playerShared";
import { getMaxSpellLevelForClass } from "@/lib/spells/spellLevels";
import { getClientLocale } from "@/lib/i18n/getClientLocale";
import { getLocalizedText } from "@/lib/character/items";
import Markdown from "@/app/components/Markdown";

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
    return name.split("â€”")[0].trim();
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

    const maxLearnableSpellLevel = getMaxSpellLevelForClass(
        apiClass,
        charLevel
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [spells, setSpells] = useState<SpellSummary[]>([]);
    const [savingId, setSavingId] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortMode, setSortMode] = useState<"level" | "alpha">("level");
    const [levelFilter, setLevelFilter] = useState<"all" | number>("all");
    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("all");

    const [sourceClass, setSourceClass] = useState(
        apiClass === "custom" ? "wizard" : apiClass
    );

    const locale = getClientLocale();

    const preparedInfo = getPreparedSpellsInfo(
        character.class,
        stats,
        charLevel,
        details
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
            setError(e?.message ?? "Error cargando hechizos.");
        } finally {
            setLoading(false);
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
                        `Has alcanzado tu mÃ¡ximo de ${preparedInfo.total} conjuros preparados.`
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
            setError("Error aprendiendo el hechizo.");
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
            setError("Error olvidando el hechizo.");
        } finally {
            setSavingId(null);
        }
    }

    /* ---------------------------
       FILTER + SORT (TU CÃ“DIGO)
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
                        Gestor de hechizos Â· {character.name}
                    </h2>
                    <p className="text-[11px] text-ink-muted">
                        {CLASS_LABELS[apiClass] ?? apiClass} Â· Nivel{" "}
                        {charLevel}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                        MÃ¡x nivel de hechizo: {maxLearnableSpellLevel}
                    </p>
                    {preparedInfo && (
                        <p className="text-[11px] text-ink-muted">
                            Preparados: {currentPreparedCount}/
                            {preparedInfo.total}
                        </p>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="text-[11px] px-3 py-2 rounded-md border border-ring hover:bg-white/80"
                >
                    Volver
                </button>
            </div>

            <div className="px-6 py-4 border-b border-ring flex flex-wrap gap-4">
                <input
                    type="text"
                    placeholder="Buscar hechizo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-[220px] rounded-md bg-white/80 border border-ring px-3 py-2 text-sm"
                />

                <select
                    value={sortMode}
                    onChange={(e) =>
                        setSortMode(e.target.value as any)
                    }
                    className="rounded-md bg-white/80 border border-ring px-3 py-2 text-xs"
                >
                    <option value="level">Nivel â†’ Nombre</option>
                    <option value="alpha">Nombre (A-Z)</option>
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
                    <option value="all">Todos</option>
                    {availableLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>
                            {lvl === 0
                                ? "Trucos"
                                : `Nivel ${lvl}`}
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
                    <option value="all">Todos</option>
                    <option value="learned">Aprendidos</option>
                    <option value="unlearned">No aprendidos</option>
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
                                {c.label}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                {loading && (
                    <p className="text-xs text-ink-muted">
                        Cargando hechizosâ€¦
                    </p>
                )}
                {error && (
                    <p className="text-xs text-red-400">{error}</p>
                )}

                {!loading &&
                    filteredAndSorted.map((s) => {
                        const learned = isSpellLearned(s);
                        const shortDesc = getLocalizedText(s.shortDesc as any, locale);
                        const fullDesc = getLocalizedText(s.fullDesc as any, locale);

                        return (
                            <div
                                key={s.index}
                                className={`border rounded-md p-2 space-y-1 ${
                                    learned
                                        ? "border-emerald-500/60 bg-emerald-900/10"
                                        : "border-ring bg-white/70"
                                }`}
                            >
                                <div className="flex justify-between">
                                    <div>
                                        <p className="font-medium">
                                            {s.name}
                                        </p>
                                        <p className="text-[11px] text-ink-muted">
                                            Nivel {s.level} Â·{" "}
                                            {formatCastingTime(
                                                s.casting_time
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
                                            ? "Olvidar"
                                            : "Aprender"}
                                    </button>
                                </div>

                                {shortDesc && (
                                    <Markdown
                                        content={shortDesc}
                                        className="text-ink-muted text-xs"
                                    />
                                )}

                                <details className="text-xs">
                                    <summary className="cursor-pointer text-ink-muted">
                                        Ver descripciÃ³n
                                    </summary>
                                    <div className="mt-2">
                                        <Markdown
                                            content={fullDesc || shortDesc || ""}
                                            className="text-ink-muted text-xs"
                                        />
                                    </div>
                                </details>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

export default SpellManagerPanel;

