"use client";

import React from "react";
import {
    Character,
    LearnedSpellRef,
    SpellMeta,
} from "../playerShared";

import { LearnedSpellLevelBlock } from "../LearnedSpellBlocks";
import { ClassAbility } from "@/lib/dnd/classAbilities/types";
import Markdown from "@/app/components/Markdown";
import CustomContentManager from "./CustomContentManager";
import { CustomFeatureEntry, CustomSpellEntry } from "@/lib/types/dnd";

type Props = {
    character: Character;
    preparedInfo: any;
    preparedCount: number;
    extras: any;
    classAbilities: ClassAbility[];
    levels: {
        lvl: number;
        label: string;
        spells: LearnedSpellRef[];
    }[];
    collapsed: Record<number, boolean>;
    setCollapsed: (v: Record<number, boolean>) => void;
    spellDetails: Record<string, SpellMeta>;
    onOpenSpellManager: () => void;
    locale: string;
    customSpells: CustomSpellEntry[];
    setCustomSpells: (v: CustomSpellEntry[]) => void;
    customCantrips: CustomSpellEntry[];
    setCustomCantrips: (v: CustomSpellEntry[]) => void;
    customTraits: CustomFeatureEntry[];
    setCustomTraits: (v: CustomFeatureEntry[]) => void;
    customClassAbilities: CustomFeatureEntry[];
    setCustomClassAbilities: (v: CustomFeatureEntry[]) => void;
};

export default function AbilityPanelView({
                                             character,
                                             preparedInfo,
                                             preparedCount,
                                             extras,
                                             classAbilities,
                                             levels,
                                             collapsed,
                                             setCollapsed,
                                             spellDetails,
                                             onOpenSpellManager,
                                             locale,
                                             customSpells,
                                             setCustomSpells,
                                             customCantrips,
                                             setCustomCantrips,
                                             customTraits,
                                             setCustomTraits,
                                             customClassAbilities,
                                             setCustomClassAbilities,
                                         }: Props) {
    return (
        <div className="space-y-4">
            <CustomContentManager
                locale={locale}
                customSpells={customSpells}
                setCustomSpells={setCustomSpells}
                customCantrips={customCantrips}
                setCustomCantrips={setCustomCantrips}
                customTraits={customTraits}
                setCustomTraits={setCustomTraits}
                customClassAbilities={customClassAbilities}
                setCustomClassAbilities={setCustomClassAbilities}
            />

            {preparedInfo && (
                <div className="border border-ring rounded-2xl bg-panel/80 p-3 text-xs">
                    <h4 className="font-semibold text-ink mb-1">
                        Hechizos preparados
                    </h4>

                    <p className="text-ink">
                        Preparados:{" "}
                        <strong>{preparedCount}</strong> /{" "}
                        <strong>{preparedInfo.total}</strong>
                    </p>

                    <p className="text-ink-muted mt-1">
                        Característica de lanzamiento:{" "}
                        <strong>{preparedInfo.abilityName}</strong>
                    </p>

                    {Array.isArray(extras?.lines) && extras.lines.length > 0 && (
                        <div className="text-ink-muted mt-1 space-y-1">
                            {extras.lines.map((l: string, i: number) => (
                                <p key={i}>{l}</p>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {classAbilities.length > 0 && (
                <details className="border border-ring rounded-2xl bg-panel/80">
                    <summary className="px-3 py-2 cursor-pointer bg-white/70 text-ink">
                        Habilidades de clase ({classAbilities.length})
                    </summary>

                    <div className="p-3 space-y-3 text-xs">
                        {classAbilities.map((a) => (
                            <details
                                key={a.id}
                                className="border border-ring rounded-xl bg-white/70 p-3"
                            >
                                <summary className="cursor-pointer font-semibold text-ink">
                                    {a.name} (Nivel {a.level})
                                </summary>

                                {a.description ? (
                                    <Markdown
                                        content={a.description}
                                        className="text-ink-muted mt-2"
                                    />
                                ) : (
                                    <p className="text-[11px] text-ink-muted mt-2">
                                        Sin descripción.
                                    </p>
                                )}
                            </details>
                        ))}
                    </div>
                </details>
            )}

            <div className="flex flex-wrap justify-between gap-2">
                <div className="flex gap-2">
                    <button
                        className="text-xs border border-ring px-2 py-1 rounded bg-white/70 text-ink hover:bg-white"
                        onClick={() => setCollapsed({})}
                    >
                        Expandir todo
                    </button>
                    <button
                        className="text-xs border border-ring px-2 py-1 rounded bg-white/70 text-ink hover:bg-white"
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

                <div className="flex gap-2">
                    <button
                        className="text-xs border border-ring px-3 py-1 rounded bg-white/70 text-ink hover:bg-white"
                        onClick={onOpenSpellManager}
                    >
                        Abrir gestor SRD
                    </button>
                </div>
            </div>

            {levels.map(({ lvl, label, spells }) => {
                if (!spells.length) return null;

                return (
                    <details
                        key={lvl}
                        open={!collapsed[lvl]}
                        className="border border-ring rounded-2xl bg-panel/80"
                    >
                        <summary className="px-3 py-2 cursor-pointer bg-white/70 flex justify-between text-ink">
                            <span>{label}</span>
                            <span className="text-xs text-ink-muted">
                                ({spells.length})
                            </span>
                        </summary>

                        <div className="p-3">
                            <LearnedSpellLevelBlock
                                level={lvl}
                                label=""
                                lines={spells}
                                spellDetails={spellDetails}
                            />
                        </div>
                    </details>
                );
            })}
        </div>
    );
}
