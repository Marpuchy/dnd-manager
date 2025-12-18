"use client";

import React from "react";
import { LearnedSpellRef, SpellMeta } from "./playerShared";

/* ---------------------------
   TYPES
--------------------------- */

type LevelBlockProps = {
    level: number;
    label: string;
    lines: LearnedSpellRef[];
    spellDetails: Record<string, SpellMeta>;
};

/* ---------------------------
   LEVEL BLOCK
--------------------------- */

export function LearnedSpellLevelBlock({
                                           level,
                                           label,
                                           lines,
                                           spellDetails,
                                       }: LevelBlockProps) {
    if (!lines.length) return null;

    return (
        <div className="border border-zinc-800 rounded-lg p-3">
            {label && (
                <h4 className="text-sm font-semibold text-zinc-200 mb-2">
                    {label}
                </h4>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {lines.map((spell) => {
                    const meta =
                        spell.index != null
                            ? spellDetails[String(spell.index)]
                            : undefined;

                    return (
                        <LearnedSpellCard
                            key={spell.index || spell.name}
                            level={level}
                            spell={spell}
                            meta={meta}
                        />
                    );
                })}
            </div>
        </div>
    );
}

/* ---------------------------
   SPELL CARD
--------------------------- */

type CardProps = {
    level: number;
    spell: LearnedSpellRef;
    meta?: SpellMeta;
};

function LearnedSpellCard({ level, spell, meta }: CardProps) {
    const typeLabel =
        level === 0 ? "Truco (cantrip)" : `Hechizo de nivel ${level}`;

    /* ---------------------------
       SIN METADATA
    --------------------------- */
    if (!meta) {
        return (
            <div className="border border-zinc-700 rounded-md p-2">
                <p className="text-sm font-semibold text-zinc-100">
                    {spell.name}
                </p>
                <p className="text-[11px] text-zinc-500">
                    {typeLabel}
                </p>
            </div>
        );
    }

    /* ---------------------------
       CON METADATA
    --------------------------- */
    return (
        <div className="border border-zinc-700 rounded-md p-3 bg-zinc-900/40">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-100">
                        {meta.name}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                        {typeLabel}
                        {meta.school ? ` · ${meta.school}` : ""}
                    </p>
                </div>

                <div className="text-right text-xs text-zinc-400 whitespace-nowrap">
                    <div>{meta.range ?? "—"}</div>
                    <div>{meta.duration ?? "—"}</div>
                </div>
            </div>

            <div className="mt-2 text-xs text-zinc-300 space-y-1">
                <p>
                    <span className="font-semibold">
                        Tiempo de lanzamiento:
                    </span>{" "}
                    {meta.casting_time ?? "—"}
                </p>

                <p>
                    <span className="font-semibold">
                        Componentes:
                    </span>{" "}
                    {meta.components?.length
                        ? meta.components.join(", ")
                        : "—"}
                </p>

                {meta.material && (
                    <p>
                        <span className="font-semibold">
                            Material:
                        </span>{" "}
                        {meta.material}
                    </p>
                )}

                <p>
                    <span className="font-semibold">
                        Concentración:
                    </span>{" "}
                    {meta.concentration ? "Sí" : "No"}
                </p>

                <p>
                    <span className="font-semibold">
                        Ritual:
                    </span>{" "}
                    {meta.ritual ? "Sí" : "No"}
                </p>
            </div>

            {(meta.fullDesc || meta.shortDesc) && (
                <details className="mt-2 text-xs text-zinc-300 whitespace-pre-wrap">
                    <summary className="cursor-pointer text-[11px] text-zinc-400">
                        Ver descripción completa
                    </summary>

                    <div className="mt-1 space-y-2">
                        {meta.fullDesc && <p>{meta.fullDesc}</p>}
                        {!meta.fullDesc && meta.shortDesc && (
                            <p>{meta.shortDesc}</p>
                        )}
                    </div>
                </details>
            )}
        </div>
    );
}

export default LearnedSpellLevelBlock;
