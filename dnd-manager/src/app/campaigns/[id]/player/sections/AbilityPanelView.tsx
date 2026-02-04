"use client";

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
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
import SpellSlotsPanel from "@/app/components/SpellSlotsPanel";

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

function ClassAbilityCard({ ability }: { ability: ClassAbility }) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <details
            open={isOpen}
            onToggle={(event) => setIsOpen(event.currentTarget.open)}
            className="group border border-ring rounded-xl bg-white/70 p-3 overflow-hidden"
        >
            <summary className="cursor-pointer font-semibold text-ink flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
                <ChevronRight className="h-4 w-4 text-ink-muted transition-transform group-open:rotate-90" />
                <span>
                    {ability.name} (Nivel {ability.level})
                </span>
            </summary>

            {ability.description ? (
                <Markdown
                    content={ability.description}
                    className="text-ink-muted mt-2"
                />
            ) : (
                <p className="text-[11px] text-ink-muted mt-2">
                    Sin descripción.
                </p>
            )}
        </details>
    );
}

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
    const [customCreateOpen, setCustomCreateOpen] = useState(false);
    const [classAbilitiesOpen, setClassAbilitiesOpen] = useState(true);

    return (
        <div className="space-y-4">
            <div className="flex">
                <button
                    type="button"
                    onClick={() => setCustomCreateOpen(true)}
                    className="text-[11px] px-3 py-2 rounded-md border border-accent/60 bg-accent/10 hover:bg-accent/20"
                >
                    Crear magia/rasgos personalizados
                </button>
            </div>
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
                createOpen={customCreateOpen}
                onToggleCreate={setCustomCreateOpen}
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

            <SpellSlotsPanel
                characterClass={character.class}
                characterLevel={character.level}
            />

            {classAbilities.length > 0 && (
                <details
                    open={classAbilitiesOpen}
                    onToggle={(event) =>
                        setClassAbilitiesOpen(event.currentTarget.open)
                    }
                    className="group border border-ring rounded-2xl bg-panel/80 overflow-hidden"
                >
                    <summary className="px-3 py-2 cursor-pointer bg-white/70 text-ink flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
                        <ChevronRight className="h-4 w-4 text-ink-muted transition-transform group-open:rotate-90" />
                        <span className="font-semibold">
                            Habilidades de clase ({classAbilities.length})
                        </span>
                    </summary>

                    <div className="p-3 space-y-3 text-xs">
                        {classAbilities.map((ability) => (
                            <ClassAbilityCard
                                key={ability.id}
                                ability={ability}
                            />
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

                const isCollapsed = Boolean(collapsed[lvl]);
                const spellNames = spells.map((spell) => spell.name).join(", ");

                return (
                    <details
                        key={lvl}
                        open={!collapsed[lvl]}
                        onToggle={(event) => {
                            const isOpen = event.currentTarget.open;
                            setCollapsed({ ...collapsed, [lvl]: !isOpen });
                        }}
                        className="group border border-ring rounded-2xl bg-panel/80 overflow-hidden"
                    >
                        <summary className="px-3 py-2 cursor-pointer bg-white/70 flex items-start gap-3 text-ink list-none [&::-webkit-details-marker]:hidden">
                            <ChevronRight className="mt-0.5 h-4 w-4 text-ink-muted transition-transform group-open:rotate-90" />
                            <div className="min-w-0 flex-1">
                                <div className="font-semibold">{label}</div>
                                {isCollapsed && spellNames.length > 0 && (
                                    <div className="text-[11px] text-ink-muted break-words">
                                        {spellNames}
                                    </div>
                                )}
                            </div>
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
