"use client";

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
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
    const [isOpen, setIsOpen] = useState(true);
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
    const description = fullDesc || shortDesc;

    return (
        <details
            open={isOpen}
            onToggle={(event) => setIsOpen(event.currentTarget.open)}
            className="group border border-ring rounded-md bg-white/80 overflow-hidden"
        >
            <summary className="cursor-pointer px-3 py-2 bg-white/70 text-ink flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
                <ChevronRight className="h-4 w-4 text-ink-muted transition-transform group-open:rotate-90" />
                <p className="text-sm font-semibold text-ink">{meta.name}</p>
            </summary>

            <div className="px-3 pb-3 text-xs text-ink-muted space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] text-ink-muted">
                        {typeLabel}
                        {meta.school ? ` · ${meta.school}` : ""}
                    </p>
                    <div className="text-right text-[11px] text-ink-muted whitespace-nowrap">
                        <div>{meta.range ?? "—"}</div>
                        <div>{meta.duration ?? "—"}</div>
                    </div>
                </div>

                <div className="space-y-1">
                    <p>
                        <span className="font-semibold">Tiempo de lanzamiento:</span>{" "}
                        {meta.casting_time ?? "—"}
                    </p>

                    <p>
                        <span className="font-semibold">Componentes:</span>{" "}
                        {meta.components?.length
                            ? meta.components.join(", ")
                            : "—"}
                    </p>

                    {meta.material && (
                        <p>
                            <span className="font-semibold">Material:</span>{" "}
                            {meta.material}
                        </p>
                    )}

                    <p>
                        <span className="font-semibold">Concentración:</span>{" "}
                        {meta.concentration ? "Sí" : "No"}
                    </p>

                    <p>
                        <span className="font-semibold">Ritual:</span>{" "}
                        {meta.ritual ? "Sí" : "No"}
                    </p>
                </div>

                {description && (
                    <div className="pt-2 border-t border-ring/60">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                            Descripción
                        </p>
                        <div className="mt-2">
                            <Markdown
                                content={description}
                                className="text-ink-muted"
                            />
                        </div>
                    </div>
                )}
            </div>
        </details>
    );
}

export default LearnedSpellLevelBlock;

