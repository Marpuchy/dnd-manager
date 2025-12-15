// src/app/campaigns/[id]/player/SpellManagerPanel.tsx
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
    normalizeClassForApi,
    getPreparedSpellsInfo,
    countPreparedSpells,
    formatCastingTime,
    formatComponents,
} from "../playerShared";

type Props = {
    character: Character;
    onDetailsChange?: (details: Details) => void;
    onClose: () => void;
};

type StatusFilter = "all" | "learned" | "unlearned";

export function SpellManagerPanel({ character, onDetailsChange, onClose }: Props) {
    const stats: Stats =
        character.stats ?? {
            str: 10, dex: 10, con: 10,
            int: 10, wis: 10, cha: 10,
        };

    const details: Details = character.details || {};
    const charLevel = character.level ?? 0;
    const apiClass = normalizeClassForApi(character.class ?? null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [spells, setSpells] = useState<SpellSummary[]>([]);
    const [savingId, setSavingId] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortMode, setSortMode] = useState<"level" | "alpha">("level");
    const [levelFilter, setLevelFilter] = useState<"all" | number>("all");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    const [sourceClass, setSourceClass] = useState(
        apiClass === "custom" ? "wizard" : apiClass
    );

    const preparedInfo = getPreparedSpellsInfo(
        character.class,
        stats,
        charLevel,
        details
    );
    const currentPreparedCount = countPreparedSpells(details.spells);

    /* ---------------------------
       CARGA CORRECTA SRD
    --------------------------- */
    useEffect(() => {
        if (!apiClass) return;
        loadAllSpells();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiClass, sourceClass, charLevel]);

    async function loadAllSpells() {
        try {
            setLoading(true);
            setError(null);

            const classForApi = apiClass === "custom" ? sourceClass : apiClass;
            const collected: SpellSummary[] = [];

            for (let lvl = 0; lvl <= charLevel; lvl++) {
                const res = await fetch(
                    `/api/dnd/spells?class=${encodeURIComponent(
                        classForApi
                    )}&level=${lvl}`
                );
                if (!res.ok) continue;

                const data: SpellSummary[] = await res.json();
                collected.push(...data);
            }

            const unique = Object.values(
                Object.fromEntries(collected.map((s) => [s.index, s]))
            );

            setSpells(unique);
        } catch (e: any) {
            setError(e?.message ?? "Error cargando habilidades.");
        } finally {
            setLoading(false);
        }
    }

    function isSpellLearned(spell: SpellSummary): boolean {
        const currentSpells: Spells = details.spells || {};
        const levelKey = `level${spell.level}` as keyof Spells;
        const text = (currentSpells[levelKey] ?? "") as string;

        return text
            .split("\n")
            .map((l) => l.split("—")[0].trim())
            .includes(spell.name);
    }

    async function handleLearnSpell(spell: SpellSummary) {
        try {
            setSavingId(spell.index);
            setError(null);

            const currentSpells: Spells = details.spells || {};
            const levelKey = `level${spell.level}` as keyof Spells;

            if (spell.level >= 1 && preparedInfo) {
                const count = countPreparedSpells(currentSpells);
                if (count >= preparedInfo.total) {
                    setError(
                        `Has alcanzado tu máximo de ${preparedInfo.total} conjuros preparados.`
                    );
                    return;
                }
            }

            const currentText = (currentSpells[levelKey] ?? "") as string;
            if (currentText.includes(spell.name)) return;

            const newLine = `${spell.name}${
                spell.shortDesc ? ` — ${spell.shortDesc}` : ""
            }`;

            const updatedSpells: Spells = {
                ...currentSpells,
                [levelKey]: currentText
                    ? `${currentText}\n${newLine}`
                    : newLine,
            };

            const updatedDetails: Details = {
                ...details,
                spells: updatedSpells,
            };

            await supabase
                .from("characters")
                .update({ details: updatedDetails })
                .eq("id", character.id);

            onDetailsChange?.(updatedDetails);
        } catch {
            setError("Error añadiendo la habilidad.");
        } finally {
            setSavingId(null);
        }
    }

    async function handleForgetSpell(spell: SpellSummary) {
        try {
            setSavingId(spell.index);
            setError(null);

            const currentSpells: Spells = details.spells || {};
            const levelKey = `level${spell.level}` as keyof Spells;

            const newText = (currentSpells[levelKey] ?? "")
                .split("\n")
                .filter((l) => !l.startsWith(spell.name))
                .join("\n");

            const updatedDetails: Details = {
                ...details,
                spells: {
                    ...currentSpells,
                    [levelKey]: newText || undefined,
                },
            };

            await supabase
                .from("characters")
                .update({ details: updatedDetails })
                .eq("id", character.id);

            onDetailsChange?.(updatedDetails);
        } catch {
            setError("Error eliminando la habilidad.");
        } finally {
            setSavingId(null);
        }
    }

    const availableLevels = Array.from(new Set(spells.map((s) => s.level))).sort(
        (a, b) => a - b
    );

    const filteredAndSorted = spells
        .filter((s) => {
            if (levelFilter !== "all" && s.level !== Number(levelFilter)) return false;

            const term = searchTerm.trim().toLowerCase();
            if (term) {
                const inName = s.name.toLowerCase().includes(term);
                const inDesc =
                    s.shortDesc?.toLowerCase().includes(term) ||
                    s.fullDesc?.toLowerCase().includes(term);
                if (!inName && !inDesc) return false;
            }

            const learned = isSpellLearned(s);
            if (statusFilter === "learned" && !learned) return false;
            if (statusFilter === "unlearned" && learned) return false;

            return true;
        })
        .sort((a, b) => {
            if (sortMode === "alpha") return a.name.localeCompare(b.name);
            if (a.level !== b.level) return a.level - b.level;
            return a.name.localeCompare(b.name);
        });

    return (
        <div className="border border-zinc-800 rounded-xl bg-zinc-950/90 h-full flex flex-col">
            {/* HEADER */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-purple-200">
                        Gestor de habilidades · {character.name}
                    </h2>
                    <p className="text-[11px] text-zinc-400">
                        {CLASS_LABELS[apiClass] ?? apiClass} · Nivel {charLevel}
                    </p>
                    {preparedInfo && (
                        <p className="text-[11px] text-zinc-400">
                            Preparados nivel 1+: {currentPreparedCount}/
                            {preparedInfo.total}
                        </p>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="text-[11px] px-3 py-2 rounded-md border border-zinc-600 hover:bg-zinc-900"
                >
                    Volver
                </button>
            </div>

            {/* CONTROLES */}
            <div className="px-6 py-4 border-b border-zinc-800 flex flex-wrap gap-4 bg-zinc-950">
                <input
                    type="text"
                    placeholder="Buscar por nombre o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-[220px] rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm"
                />

                <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as any)}
                    className="rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs"
                >
                    <option value="level">Nivel → Nombre</option>
                    <option value="alpha">Nombre (A-Z)</option>
                </select>

                <select
                    value={levelFilter === "all" ? "all" : String(levelFilter)}
                    onChange={(e) =>
                        setLevelFilter(
                            e.target.value === "all"
                                ? "all"
                                : Number(e.target.value)
                        )
                    }
                    className="rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs"
                >
                    <option value="all">Todos</option>
                    {availableLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>
                            {lvl === 0 ? "Trucos (0)" : `Nivel ${lvl}`}
                        </option>
                    ))}
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs"
                >
                    <option value="all">Todos</option>
                    <option value="learned">Aprendidos</option>
                    <option value="unlearned">No aprendidos</option>
                </select>

                {apiClass === "custom" && (
                    <select
                        value={sourceClass}
                        onChange={(e) => setSourceClass(e.target.value)}
                        className="rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs"
                    >
                        {DND_CLASS_OPTIONS.filter((c) => c.id !== "custom").map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* LISTA */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                {loading && (
                    <p className="text-xs text-zinc-400">
                        Cargando lista de habilidades…
                    </p>
                )}
                {error && <p className="text-xs text-red-400">{error}</p>}

                {!loading &&
                    filteredAndSorted.map((s) => {
                        const learned = isSpellLearned(s);
                        const typeLabel =
                            s.level === 0
                                ? "Truco (cantrip)"
                                : `Hechizo de nivel ${s.level}`;

                        return (
                            <div
                                key={s.index}
                                className={`border rounded-md p-2 space-y-1 ${
                                    learned
                                        ? "border-emerald-500/60 bg-emerald-900/10"
                                        : "border-zinc-700 bg-zinc-950/40"
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="font-medium text-zinc-100">
                                            {s.name}
                                        </p>
                                        <p className="text-[11px] text-zinc-500">
                                            {typeLabel} ·{" "}
                                            {formatCastingTime(s.casting_time)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            learned
                                                ? handleForgetSpell(s)
                                                : handleLearnSpell(s)
                                        }
                                        disabled={savingId === s.index}
                                        className={`text-[11px] px-3 py-1 rounded-md border ${
                                            learned
                                                ? "border-red-500/70 hover:bg-red-900/40"
                                                : "border-emerald-500/70 hover:bg-emerald-900/40"
                                        }`}
                                    >
                                        {learned ? "Olvidar" : "Aprender"}
                                    </button>
                                </div>

                                {s.shortDesc && (
                                    <p className="text-xs text-zinc-400">
                                        {s.shortDesc}
                                    </p>
                                )}

                                <details className="mt-1 text-xs text-zinc-300 whitespace-pre-wrap">
                                    <summary className="cursor-pointer text-[11px] text-zinc-400">
                                        Ver descripción completa
                                    </summary>
                                    <div className="mt-1">
                                        <p className="text-[11px] text-zinc-400 mb-1">
                                            <span className="font-semibold">
                                                Componentes:
                                            </span>{" "}
                                            {formatComponents(
                                                s.components,
                                                s.material
                                            )}
                                        </p>
                                        <p className="text-[11px] text-zinc-400 mb-1">
                                            <span className="font-semibold">
                                                Duración:
                                            </span>{" "}
                                            {s.duration ?? "—"}
                                        </p>
                                        <p className="text-[11px] text-zinc-400 mb-1">
                                            <span className="font-semibold">
                                                Escuela:
                                            </span>{" "}
                                            {s.school ?? "—"}
                                        </p>
                                        <p className="text-[11px] text-zinc-400 mb-1">
                                            <span className="font-semibold">
                                                Concentración:
                                            </span>{" "}
                                            {s.concentration ? "Sí" : "No"}
                                        </p>
                                        <p className="text-[11px] text-zinc-400 mb-2">
                                            <span className="font-semibold">
                                                Ritual:
                                            </span>{" "}
                                            {s.ritual ? "Sí" : "No"}
                                        </p>
                                        <div>
                                            {s.fullDesc ??
                                                s.shortDesc ??
                                                "Sin descripción ampliada disponible."}
                                        </div>
                                    </div>
                                </details>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
