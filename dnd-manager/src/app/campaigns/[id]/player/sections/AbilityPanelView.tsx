"use client";

import React from "react";
import {
    Character,
    LearnedSpellRef,
    SpellMeta,
} from "../playerShared";

import { LearnedSpellLevelBlock } from "../LearnedSpellBlocks";
import { ClassAbility } from "@/lib/dnd/classAbilities/types";

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
    onCreateCustomSpell: () => void;
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
                                             onCreateCustomSpell,
                                         }: Props) {
    return (
        <div className="space-y-4">
            {preparedInfo && (
                <div className="border border-zinc-800 rounded-lg p-3 text-xs">
                    <h4 className="font-semibold text-zinc-200 mb-1">
                        Hechizos preparados
                    </h4>

                    <p className="text-zinc-300">
                        Preparados:{" "}
                        <strong>{preparedCount}</strong> /{" "}
                        <strong>{preparedInfo.total}</strong>
                    </p>

                    <p className="text-zinc-400 mt-1">
                        Característica de lanzamiento:{" "}
                        <strong>{preparedInfo.abilityName}</strong>
                    </p>

                    {Array.isArray(extras?.lines) && extras.lines.length > 0 && (
                        <div className="text-zinc-500 mt-1 space-y-1">
                            {extras.lines.map((l: string, i: number) => (
                                <p key={i}>{l}</p>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {classAbilities.length > 0 && (
                <details className="border border-zinc-800 rounded-lg">
                    <summary className="px-3 py-2 cursor-pointer bg-zinc-900/30">
                        Habilidades de clase ({classAbilities.length})
                    </summary>

                    <div className="p-3 space-y-3 text-xs">
                        {classAbilities.map((a) => (
                            <div
                                key={a.id}
                                className="border-b border-zinc-800 pb-2"
                            >
                                <p className="font-semibold text-zinc-100">
                                    {a.name} (Nivel {a.level})
                                </p>

                                {a.description && (
                                    <p className="text-zinc-300 mt-1">
                                        {a.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </details>
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

                <div className="flex gap-2">
                    <button
                        className="text-xs border px-3 py-1 rounded"
                        onClick={onOpenSpellManager}
                    >
                        Abrir gestor SRD
                    </button>
                    <button
                        className="text-xs border px-3 py-1 rounded"
                        onClick={onCreateCustomSpell}
                    >
                        Crear hechizo personalizado
                    </button>
                </div>
            </div>

            {levels.map(({ lvl, label, spells }) => {
                if (!spells.length) return null;

                return (
                    <details
                        key={lvl}
                        open={!collapsed[lvl]}
                        className="border border-zinc-800 rounded-lg"
                    >
                        <summary className="px-3 py-2 cursor-pointer bg-zinc-900/30 flex justify-between">
                            <span>{label}</span>
                            <span className="text-xs text-zinc-400">
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
