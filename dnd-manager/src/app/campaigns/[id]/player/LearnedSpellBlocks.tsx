"use client";

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { LearnedSpellRef, SpellMeta } from "./playerShared";
import Markdown from "@/app/components/Markdown";
import { getLocalizedText } from "@/lib/character/items";
import { useClientLocale } from "@/lib/i18n/useClientLocale";
import { tr } from "@/lib/i18n/translate";

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
    const locale = useClientLocale();
    const typeLabel =
        level === 0
            ? tr(locale, "Truco (cantrip)", "Cantrip")
            : `${tr(locale, "Hechizo de nivel", "Level")} ${level} ${tr(locale, "hechizo", "spell")}`;
    const isCustomSpell =
        Boolean(meta?.isCustom) || spell.index?.startsWith("custom-spell:");

    /* ---------------------------
       SIN METADATA
    --------------------------- */
    if (!meta) {
        return (
            <div className="border border-ring rounded-md p-2">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{spell.name}</p>
                    {isCustomSpell && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-400/70 text-amber-700 bg-amber-50">
                            {tr(locale, "Personalizado", "Custom")}
                        </span>
                    )}
                </div>
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
                <p className="text-sm font-semibold text-ink min-w-0 break-words">
                    {meta.name}
                </p>
                {isCustomSpell && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-400/70 text-amber-700 bg-amber-50 shrink-0">
                        {tr(locale, "Personalizado", "Custom")}
                    </span>
                )}
            </summary>

            <div className="px-3 pb-3 text-xs text-ink-muted space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] text-ink-muted min-w-0 break-words">
                        {typeLabel}
                        {meta.school ? ` · ${meta.school}` : ""}
                    </p>
                    <div className="text-right text-[11px] text-ink-muted shrink-0">
                        <div>{meta.range ?? "—"}</div>
                        <div>{meta.duration ?? "—"}</div>
                    </div>
                </div>

                <div className="space-y-1">
                    <p>
                        <span className="font-semibold">{tr(locale, "Tiempo de lanzamiento", "Casting time")}:</span>{" "}
                        {meta.casting_time ?? "—"}
                    </p>

                    <p>
                        <span className="font-semibold">{tr(locale, "Componentes", "Components")}:</span>{" "}
                        {meta.components?.length
                            ? meta.components.join(", ")
                            : "—"}
                    </p>

                    {meta.material && (
                        <p>
                            <span className="font-semibold">{tr(locale, "Material", "Material")}:</span>{" "}
                            {meta.material}
                        </p>
                    )}

                    <p>
                        <span className="font-semibold">{tr(locale, "Concentracion", "Concentration")}:</span>{" "}
                        {meta.concentration ? tr(locale, "Si", "Yes") : tr(locale, "No", "No")}
                    </p>

                    <p>
                        <span className="font-semibold">{tr(locale, "Ritual", "Ritual")}:</span>{" "}
                        {meta.ritual ? tr(locale, "Si", "Yes") : tr(locale, "No", "No")}
                    </p>
                </div>

                {description && (
                    <div className="pt-2 border-t border-ring/60">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                            {tr(locale, "Descripcion", "Description")}
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

