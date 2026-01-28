"use client";

import React from "react";
import { LearnedSpellRef, SpellMeta } from "./playerShared";
import Markdown from "@/app/components/Markdown";
import { getLocalizedText } from "@/lib/character/items";
import { getClientLocale } from "@/lib/i18n/getClientLocale";

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
        <div className="border border-ring rounded-lg p-3">
            {label && (
                <h4 className="text-sm font-semibold text-ink mb-2">
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
    const locale = getClientLocale();

    /* ---------------------------
       SIN METADATA
    --------------------------- */
    if (!meta) {
        return (
            <div className="border border-ring rounded-md p-2">
                <p className="text-sm font-semibold text-ink">
                    {spell.name}
                </p>
                <p className="text-[11px] text-ink-muted">
                    {typeLabel}
                </p>
            </div>
        );
    }

    /* ---------------------------
       CON METADATA
    --------------------------- */
    const shortDesc = getLocalizedText(meta.shortDesc, locale);
    const fullDesc = getLocalizedText(meta.fullDesc, locale);

    return (
        <div className="border border-ring rounded-md p-3 bg-white/80">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                        {meta.name}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                        {typeLabel}
                        {meta.school ? ` Â· ${meta.school}` : ""}
                    </p>
                </div>

                <div className="text-right text-xs text-ink-muted whitespace-nowrap">
                    <div>{meta.range ?? "â€”"}</div>
                    <div>{meta.duration ?? "â€”"}</div>
                </div>
            </div>

            <div className="mt-2 text-xs text-ink-muted space-y-1">
                <p>
                    <span className="font-semibold">
                        Tiempo de lanzamiento:
                    </span>{" "}
                    {meta.casting_time ?? "â€”"}
                </p>

                <p>
                    <span className="font-semibold">
                        Componentes:
                    </span>{" "}
                    {meta.components?.length
                        ? meta.components.join(", ")
                        : "â€”"}
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
                        ConcentraciÃ³n:
                    </span>{" "}
                    {meta.concentration ? "SÃ­" : "No"}
                </p>

                <p>
                    <span className="font-semibold">
                        Ritual:
                    </span>{" "}
                    {meta.ritual ? "SÃ­" : "No"}
                </p>
            </div>

            {(fullDesc || shortDesc) && (
                <details className="mt-2 text-xs text-ink-muted">
                    <summary className="cursor-pointer text-[11px] text-ink-muted">
                        Ver descripciÃ³n completa
                    </summary>

                    <div className="mt-2">
                        <Markdown
                            content={fullDesc || shortDesc || ""}
                            className="text-ink-muted"
                        />
                    </div>
                </details>
            )}
        </div>
    );
}

export default LearnedSpellLevelBlock;

