// src/app/campaigns/[id]/player/SpellManagerPanel.tsx
import { useState } from "react";
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
} from "./playerShared";

type Props = {
    character: Character;
    onDetailsChange?: (details: Details) => void;
    onClose: () => void;
};

type StatusFilter = "all" | "learned" | "unlearned";

export function SpellManagerPanel({ character, onDetailsChange, onClose }: Props) {
    const stats: Stats =
        character.stats ??
        ({
            str: 10,
            dex: 10,
            con: 10,
            int: 10,
            wis: 10,
            cha: 10,
        } as Stats);

    const details: Details = character.details || {};
    const level = character.level ?? null;
    const apiClass = normalizeClassForApi(character.class ?? null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [spells, setSpells] = useState<SpellSummary[]>([]);
    const [savingId, setSavingId] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortMode, setSortMode] = useState<"level" | "alpha">("level");
    const [levelFilter, setLevelFilter] = useState<"all" | number>("all");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    // Para clase personalizada: de qué clase de la SRD queremos ver la lista
    const [sourceClass, setSourceClass] = useState<string>(
        apiClass === "custom" ? "wizard" : apiClass
    );

    if (!apiClass || !level || level < 1) {
        return (
            <div className="border border-zinc-800 rounded-xl bg-zinc-950/80 p-4 h-full">
                <p className="text-xs text-zinc-500">
                    Esta clase / nivel no tiene habilidades de conjuro gestionables.
                </p>
                <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 text-xs px-3 py-2 rounded-md border border-zinc-600 hover:bg-zinc-900"
                >
                    Volver a la hoja de personaje
                </button>
            </div>
        );
    }

    const preparedInfo = getPreparedSpellsInfo(character.class, stats, level, details);
    const currentPreparedCount = countPreparedSpells(details.spells);

    async function loadSpells() {
        try {
            setLoading(true);
            setError(null);
            setSpells([]);

            // Si es clase personalizada, usamos la clase origen seleccionada
            const classForApi = apiClass === "custom" ? sourceClass : apiClass;

            const res = await fetch(
                `/api/dnd/spells?class=${encodeURIComponent(classForApi)}&level=${level}`
            );
            if (!res.ok) {
                throw new Error("No se ha podido cargar la lista de habilidades.");
            }
            const data: SpellSummary[] = await res.json();
            setSpells(data);

            // cachear en spellDetails
            const currentDetailsMap = details.spellDetails ?? {};
            const merged: Record<string, SpellSummary> = { ...currentDetailsMap };
            for (const s of data) {
                merged[s.index] = {
                    ...currentDetailsMap[s.index],
                    ...s,
                };
            }
            const updatedDetails: Details = {
                ...details,
                spellDetails: merged,
            };

            const { error: updateError } = await supabase
                .from("characters")
                .update({ details: updatedDetails })
                .eq("id", character.id);

            if (updateError) {
                console.error(updateError);
            } else {
                onDetailsChange?.(updatedDetails);
            }
        } catch (e: any) {
            setError(e?.message ?? "Error cargando habilidades.");
        } finally {
            setLoading(false);
        }
    }

    function isSpellLearned(spell: SpellSummary): boolean {
        const currentSpells: Spells = details.spells || {};
        const levelKey = `level${spell.level}` as keyof Spells;
        const currentTextRaw = (currentSpells[levelKey] ?? "") as string;

        const names = currentTextRaw
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
            .map((l) => l.split("—")[0].trim());

        return names.includes(spell.name);
    }

    async function handleLearnSpell(spell: SpellSummary) {
        try {
            setSavingId(spell.index);
            setError(null);

            const currentSpells: Spells = details.spells || {};
            const levelKey = `level${spell.level}` as keyof Spells;

            if (spell.level >= 1 && preparedInfo) {
                const currentCount = countPreparedSpells(currentSpells);
                if (currentCount >= preparedInfo.total) {
                    setError(
                        `Has alcanzado tu máximo de ${preparedInfo.total} conjuros preparados de nivel 1+ según las reglas de 5e.`
                    );
                    setSavingId(null);
                    return;
                }
            }

            const currentTextRaw = (currentSpells[levelKey] ?? "") as string;
            const currentLines = currentTextRaw
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean);

            const existingNames = currentLines
                .map((l) => l.split("—")[0].trim())
                .filter(Boolean);

            if (existingNames.includes(spell.name)) {
                setError("Esa habilidad ya está en tu lista para ese nivel.");
                setSavingId(null);
                return;
            }

            const newLine = `${spell.name}${
                spell.shortDesc ? ` — ${spell.shortDesc}` : ""
            }`;

            const newText =
                currentLines.length > 0
                    ? `${currentTextRaw.trim()}\n${newLine}`
                    : newLine;

            const updatedSpells: Spells = {
                ...currentSpells,
                [levelKey]: newText,
            };

            const currentDetailsMap = details.spellDetails ?? {};
            const updatedDetailsMap: Record<string, SpellSummary> = {
                ...currentDetailsMap,
                [spell.index]: {
                    ...currentDetailsMap[spell.index],
                    ...spell,
                },
            };

            const updatedDetails: Details = {
                ...details,
                spells: updatedSpells,
                spellDetails: updatedDetailsMap,
            };

            const { error: updateError } = await supabase
                .from("characters")
                .update({ details: updatedDetails })
                .eq("id", character.id);

            if (updateError) {
                console.error(updateError);
                throw new Error("No se ha podido guardar la habilidad en tu hoja.");
            }

            onDetailsChange?.(updatedDetails);
        } catch (e: any) {
            console.error(e);
            setError(e?.message ?? "Error añadiendo la habilidad a tu hoja.");
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
            const currentTextRaw = (currentSpells[levelKey] ?? "") as string;

            const newLines = currentTextRaw
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
                .filter((line) => {
                    const name = line.split("—")[0].trim();
                    return name !== spell.name;
                });

            const newText = newLines.length > 0 ? newLines.join("\n") : undefined;

            const updatedSpells: Spells = {
                ...currentSpells,
                [levelKey]: newText,
            };

            const updatedDetails: Details = {
                ...details,
                spells: updatedSpells,
            };

            const { error: updateError } = await supabase
                .from("characters")
                .update({ details: updatedDetails })
                .eq("id", character.id);

            if (updateError) {
                console.error(updateError);
                throw new Error("No se ha podido eliminar la habilidad de tu hoja.");
            }

            onDetailsChange?.(updatedDetails);
        } catch (e: any) {
            console.error(e);
            setError(e?.message ?? "Error eliminando la habilidad de tu hoja.");
        } finally {
            setSavingId(null);
        }
    }

    const availableLevels = Array.from(new Set(spells.map((s) => s.level))).sort(
        (a, b) => a - b
    );

    const filteredAndSorted = spells
        .filter((s) => {
            if (levelFilter !== "all" && s.level !== levelFilter) return false;
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
            if (sortMode === "alpha") {
                return a.name.localeCompare(b.name);
            }
            if (a.level !== b.level) return a.level - b.level;
            return a.name.localeCompare(b.name);
        });

    return (
        <div className="border border-zinc-800 rounded-xl bg-zinc-950/90 h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-purple-200">
                        Gestor de habilidades · {character.name}
                    </h2>
                    <p className="text-[11px] text-zinc-400">
                        Clase:{" "}
                        {CLASS_LABELS[apiClass] ??
                            details.customClassName ??
                            apiClass}{" "}
                        · Nivel {level}
                    </p>
                    {preparedInfo && (
                        <p className="text-[11px] text-zinc-400">
                            Conjuros preparados nivel 1+: {currentPreparedCount}/
                            {preparedInfo.total}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={loadSpells}
                        className="text-[11px] px-3 py-2 rounded-md border border-zinc-600 hover:bg-zinc-900"
                    >
                        {loading ? "Actualizando..." : "Recargar"}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[11px] px-3 py-2 rounded-md border border-zinc-600 hover:bg-zinc-900"
                    >
                        Volver a la hoja
                    </button>
                </div>
            </div>

            {/* Controles búsqueda / filtro / orden */}
            <div className="px-6 py-4 border-b border-zinc-800 flex flex-wrap gap-4 items-end bg-zinc-950">
                <div className="flex-1 min-w-[220px]">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-purple-500"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400">Ordenar por</label>
                    <select
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value as "level" | "alpha")}
                        className="rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs outline-none focus:border-purple-500"
                    >
                        <option value="level">Nivel → Nombre</option>
                        <option value="alpha">Nombre (A-Z)</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400">Filtrar por nivel</label>
                    <select
                        value={levelFilter === "all" ? "all" : String(levelFilter)}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === "all") setLevelFilter("all");
                            else setLevelFilter(Number(value));
                        }}
                        className="rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs outline-none focus:border-purple-500"
                    >
                        <option value="all">Todos</option>
                        {availableLevels.map((lvl) => (
                            <option key={lvl} value={lvl}>
                                {lvl === 0 ? "Trucos (0)" : `Nivel ${lvl}`}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400">Estado</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        className="rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs outline-none focus:border-purple-500"
                    >
                        <option value="all">Todos</option>
                        <option value="learned">Aprendidos</option>
                        <option value="unlearned">No aprendidos</option>
                    </select>
                </div>

                {/* Solo para clase personalizada: filtrar "por clase" (origen SRD) */}
                {apiClass === "custom" && (
                    <div className="space-y-1">
                        <label className="text-[11px] text-zinc-400">Por clase (SRD)</label>
                        <select
                            value={sourceClass}
                            onChange={(e) => setSourceClass(e.target.value)}
                            className="rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs outline-none focus:border-purple-500"
                        >
                            {DND_CLASS_OPTIONS.filter((c) => c.id !== "custom").map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto px-6 py-4 space-y-2 text-sm styled-scrollbar">
                    {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

                    {!loading && spells.length === 0 && !error && (
                        <p className="text-xs text-zinc-500">
                            No hay habilidades cargadas. Pulsa “Recargar” para consultar la
                            SRD.
                        </p>
                    )}

                    {loading && (
                        <p className="text-xs text-zinc-400">
                            Cargando lista de habilidades...
                        </p>
                    )}

                    {!loading &&
                        filteredAndSorted.map((s) => {
                            const learned = isSpellLearned(s);
                            const typeLabel =
                                s.level === 0
                                    ? "Truco (cantrip)"
                                    : `Hechizo de nivel ${s.level}`;
                            const castingTime = formatCastingTime(s.casting_time);
                            const range = s.range || "—";

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
                                            <p className="font-medium text-zinc-100">{s.name}</p>
                                            <p className="text-[11px] text-zinc-500">
                                                {typeLabel} · {range} · {castingTime}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                learned ? handleForgetSpell(s) : handleLearnSpell(s)
                                            }
                                            className={`text-[11px] px-3 py-1 rounded-md border hover:bg-opacity-40 disabled:opacity-50 ${
                                                learned
                                                    ? "border-red-500/70 hover:bg-red-900/40"
                                                    : "border-emerald-500/70 hover:bg-emerald-900/40"
                                            }`}
                                            disabled={savingId === s.index}
                                        >
                                            {savingId === s.index
                                                ? "Guardando..."
                                                : learned
                                                    ? "Olvidar"
                                                    : "Aprender"}
                                        </button>
                                    </div>
                                    {s.shortDesc && (
                                        <p className="text-xs text-zinc-400">{s.shortDesc}</p>
                                    )}

                                    {/* Descripción extendida al estilo inventario */}
                                    <details className="mt-1 text-xs text-zinc-300 whitespace-pre-wrap">
                                        <summary className="cursor-pointer text-[11px] text-zinc-400">
                                            Ver descripción completa
                                        </summary>
                                        <div className="mt-1">
                                            <p className="text-[11px] text-zinc-400 mb-1">
                                                <span className="font-semibold">Componentes:</span>{" "}
                                                {formatComponents(s.components, s.material)}
                                            </p>
                                            <p className="text-[11px] text-zinc-400 mb-1">
                                                <span className="font-semibold">Duración:</span>{" "}
                                                {s.duration ?? "—"}
                                            </p>
                                            <p className="text-[11px] text-zinc-400 mb-1">
                                                <span className="font-semibold">Escuela:</span>{" "}
                                                {s.school ?? "—"}
                                            </p>
                                            <p className="text-[11px] text-zinc-400 mb-1">
                                                <span className="font-semibold">Concentración:</span>{" "}
                                                {s.concentration ? "Sí" : "No"}
                                            </p>
                                            <p className="text-[11px] text-zinc-400 mb-2">
                                                <span className="font-semibold">Ritual:</span>{" "}
                                                {s.ritual ? "Sí" : "No"}
                                            </p>
                                            <div>
                                                {s.fullDesc ??
                                                    s.shortDesc ??
                                                    "Sin descripción ampliada disponible en la SRD."}
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Estilos scrollbar */}
            <style jsx global>{`
                .styled-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #7c3aed #020617;
                }
                .styled-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .styled-scrollbar::-webkit-scrollbar-track {
                    background: #020617;
                }
                .styled-scrollbar::-webkit-scrollbar-thumb {
                    background: #4c1d95;
                    border-radius: 9999px;
                }
                .styled-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #7c3aed;
                }
            `}</style>
        </div>
    );
}
