"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    Character,
    Details,
    Stats,
    parseSpellLines,
    getPreparedSpellsInfo,
    getClassMagicExtras,
    countPreparedSpells,
    LearnedSpellLine,
    SpellMeta,
    normalizeClassForApi,
} from "../../playerShared";
import { LearnedSpellLevelBlock } from "../../LearnedSpellBlocks";

/* ---------------------------
   Cache
--------------------------- */
const CACHE_KEY = "dnd_spell_description_cache";

function readCache(): Record<string, SpellMeta> {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return {};
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function writeCache(data: Record<string, SpellMeta>) {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {}
}

/* ---------------------------
   Helpers
--------------------------- */
function spellKeyFromLine(line: string) {
    return line
        .split(/—|–|\||:|\/|\\/)[0]
        .replace(/\(.*\)$/g, "")
        .toLowerCase()
        .trim();
}

function abilityAllowed(
    meta: SpellMeta | undefined,
    charClass: string,
    charLevel: number
) {
    if (!meta) return true;
    if (typeof meta.level === "number" && meta.level > charLevel) return false;
    return true;
}

/* ---------------------------
   Props
--------------------------- */
type Props = {
    character: Character;
    stats: Stats;
    details: Details;
    onDetailsChange?: (d: Details) => void;
    onOpenSpellManager: () => void;
};

/* ---------------------------
   COMPONENT
--------------------------- */
export default function AbilityPanel({
                                         character,
                                         stats,
                                         details,
                                         onDetailsChange,
                                         onOpenSpellManager,
                                     }: Props) {
    const spells = details.spells || {};
    const preparedInfo = getPreparedSpellsInfo(
        character.class,
        stats,
        character.level,
        details
    );
    const preparedCount = countPreparedSpells(spells);
    const extras = getClassMagicExtras(character.class, character.level);

    const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
    const builtRef = useRef(false);

    const levels = [
        { lvl: 0, label: "Trucos", text: spells.level0 },
        { lvl: 1, label: "Nivel 1", text: spells.level1 },
        { lvl: 2, label: "Nivel 2", text: spells.level2 },
        { lvl: 3, label: "Nivel 3", text: spells.level3 },
        { lvl: 4, label: "Nivel 4", text: spells.level4 },
        { lvl: 5, label: "Nivel 5", text: spells.level5 },
        { lvl: 6, label: "Nivel 6", text: spells.level6 },
        { lvl: 7, label: "Nivel 7", text: spells.level7 },
        { lvl: 8, label: "Nivel 8", text: spells.level8 },
        { lvl: 9, label: "Nivel 9", text: spells.level9 },
    ];

    /* ---------------------------
       Auto-fetch SRD (solo mount)
    --------------------------- */
    useEffect(() => {
        if (builtRef.current) return;
        builtRef.current = true;

        const apiClass =
            normalizeClassForApi(character.class) === "custom"
                ? "wizard"
                : normalizeClassForApi(character.class);

        if (!apiClass) return;

        const cache = readCache();
        const existing = (details as any).spellDetails || {};
        const merged = { ...existing };

        (async () => {
            for (const { lvl, text } of levels) {
                if (!text) continue;
                for (const line of parseSpellLines(text)) {
                    const name = typeof line === "string" ? line : line.name;
                    const key = spellKeyFromLine(name);
                    if (merged[key] || cache[key]) continue;

                    const res = await fetch(
                        `/api/dnd/spells?class=${apiClass}&level=${lvl}`
                    );
                    if (!res.ok) continue;

                    const data = (await res.json()) as SpellMeta[];
                    for (const s of data) {
                        if (s?.index) {
                            merged[s.index] = s;
                            cache[s.index] = s;
                        }
                    }
                }
            }

            writeCache(cache);
            onDetailsChange?.({
                ...(details || {}),
                spellDetails: merged,
            });
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function filtered(level: number, raw?: string | null): LearnedSpellLine[] {
        if (!raw) return [];
        const parsed = parseSpellLines(raw);
        const sd: Record<string, SpellMeta> =
            (details as any)?.spellDetails || {};

        return parsed
            .map((l) => {
                const name = typeof l === "string" ? l : l.name;
                const meta = sd[spellKeyFromLine(name)];
                if (
                    !abilityAllowed(
                        meta,
                        character.class ?? "",
                        character.level ?? 0
                    )
                )
                    return null;
                return typeof l === "string"
                    ? { name, raw: l }
                    : { ...l, name };
            })
            .filter(Boolean) as LearnedSpellLine[];
    }

    /* ---------------------------
       RENDER
    --------------------------- */
    return (
        <div className="space-y-4">
            {preparedInfo && (
                <div className="border border-zinc-800 rounded-lg p-3">
                    <p className="text-xs text-zinc-300">
                        Preparados:{" "}
                        <span className="font-semibold">
                            {preparedCount}/{preparedInfo.total}
                        </span>
                    </p>
                </div>
            )}

            {extras && (
                <div className="border border-zinc-800 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-zinc-300 mb-1">
                        {extras.title}
                    </h4>
                    <ul className="text-xs list-disc list-inside">
                        {extras.lines.map((l, i) => (
                            <li key={i}>{l}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex justify-between">
                <div className="flex gap-2">
                    <button
                        className="text-xs border px-2 py-1 rounded"
                        onClick={() => setCollapsed({})}
                    >
                        Expandir todo
                    </button>
                    <button
                        className="text-xs border px-2 py-1 rounded"
                        onClick={() =>
                            setCollapsed(
                                Object.fromEntries(
                                    Array.from({ length: 10 }, (_, i) => [
                                        i,
                                        true,
                                    ])
                                )
                            )
                        }
                    >
                        Plegar todo
                    </button>
                </div>
                <button
                    className="text-xs border px-3 py-1 rounded"
                    onClick={onOpenSpellManager}
                >
                    Abrir gestor SRD
                </button>
            </div>

            {levels.map(({ lvl, label, text }) => {
                const lines = filtered(lvl, text);
                if (!lines.length) return null;

                return (
                    <details
                        key={lvl}
                        open={!collapsed[lvl]}
                        className="border border-zinc-800 rounded-lg"
                    >
                        <summary className="px-3 py-2 cursor-pointer bg-zinc-900/30 flex justify-between">
                            <span>{label}</span>
                            <span className="text-xs text-zinc-400">
                                ({lines.length})
                            </span>
                        </summary>
                        <div className="p-3">
                            <LearnedSpellLevelBlock
                                level={lvl}
                                label=""
                                lines={lines}
                                spellDetails={
                                    (details as any)?.spellDetails || {}
                                }
                            />
                        </div>
                    </details>
                );
            })}
        </div>
    );
}
