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
import { tr } from "@/lib/i18n/translate";

type Props = {
    character: Character;
    preparedInfo: any;
    preparedCount: number;
    extras: any;
    classAbilities: ClassAbility[];
    upcomingClassAbilities: ClassAbility[];
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
    subclassOptions: { id: string; name: string }[];
    viewMode?: "full" | "classOnly" | "spellsOnly";
};

function ClassAbilityCard({
    ability,
    locale,
}: {
    ability: ClassAbility;
    locale: string;
}) {
    const [isOpen, setIsOpen] = useState(true);
    const isCustomTrait = ability.id.startsWith("custom-trait:");
    const isCustomClassAbility = ability.id.startsWith("custom-classAbility:");
    const isCustom = isCustomTrait || isCustomClassAbility;
    const isSubclassFeature = Boolean(ability.subclassName && ability.subclassId);

    return (
        <details
            open={isOpen}
            onToggle={(event) => setIsOpen(event.currentTarget.open)}
            className="group border border-ring rounded-xl bg-white/70 p-3 overflow-hidden"
        >
            <summary className="cursor-pointer font-semibold text-ink flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
                <ChevronRight className="h-4 w-4 text-ink-muted transition-transform group-open:rotate-90" />
                <span className="flex flex-wrap items-center gap-2">
                    <span>
                        {ability.name}
                        {ability.level > 0
                            ? ` (${tr(locale, "Nivel", "Level")} ${ability.level})`
                            : ""}
                    </span>
                    {isCustom && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-400/70 text-amber-700 bg-amber-50">
                            {isCustomTrait
                                ? tr(locale, "Rasgo personalizado", "Custom trait")
                                : tr(locale, "Habilidad personalizada", "Custom ability")}
                        </span>
                    )}
                    {isSubclassFeature && !isCustom && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-sky-400/70 text-sky-700 bg-sky-50">
                            {ability.subclassName}
                        </span>
                    )}
                </span>
            </summary>

            {ability.description ? (
                <Markdown
                    content={ability.description}
                    className="text-ink-muted mt-2"
                />
            ) : (
                <p className="text-[11px] text-ink-muted mt-2">
                    {tr(locale, "Sin descripcion.", "No description.")}
                </p>
            )}
        </details>
    );
}

function ClassAbilityBlock({
    title,
    abilities,
    open,
    onToggle,
    locale,
}: {
    title: string;
    abilities: ClassAbility[];
    open: boolean;
    onToggle: (next: boolean) => void;
    locale: string;
}) {
    if (!abilities.length) return null;
    return (
        <details
            open={open}
            onToggle={(event) => onToggle(event.currentTarget.open)}
            className="group border border-ring rounded-2xl bg-panel/80 overflow-hidden"
        >
            <summary className="px-3 py-2 cursor-pointer bg-white/70 text-ink flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
                <ChevronRight className="h-4 w-4 text-ink-muted transition-transform group-open:rotate-90" />
                <span className="font-semibold">
                    {title} ({abilities.length})
                </span>
            </summary>

            <div className="p-3 space-y-3 text-xs">
                {abilities.map((ability) => (
                    <ClassAbilityCard key={ability.id} ability={ability} locale={locale} />
                ))}
            </div>
        </details>
    );
}

export default function AbilityPanelView({
                                             character,
                                             preparedInfo,
                                             preparedCount,
                                             extras,
                                             classAbilities,
                                             upcomingClassAbilities,
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
                                             subclassOptions,
                                             viewMode = "full",
                                     }: Props) {
    const [customCreateOpen, setCustomCreateOpen] = useState(false);
    const [classAbilitiesOpen, setClassAbilitiesOpen] = useState(true);
    const [upcomingClassAbilitiesOpen, setUpcomingClassAbilitiesOpen] =
        useState(false);

    if (viewMode === "classOnly") {
        return (
            <div className="space-y-4">
                <div className="flex">
                    <button
                        type="button"
                        onClick={() => setCustomCreateOpen(true)}
                        className="text-[11px] px-3 py-2 rounded-md border border-accent/60 bg-accent/10 hover:bg-accent/20"
                    >
                        {tr(locale, "Crear rasgo/habilidad de clase", "Create class trait/ability")}
                    </button>
                </div>

                <ClassAbilityBlock
                    title={tr(locale, "Habilidades de clase aprendidas", "Learned class abilities")}
                    abilities={classAbilities}
                    open={classAbilitiesOpen}
                    onToggle={setClassAbilitiesOpen}
                    locale={locale}
                />
                <ClassAbilityBlock
                    title={tr(locale, "Habilidades de clase por desbloquear", "Upcoming class abilities")}
                    abilities={upcomingClassAbilities}
                    open={upcomingClassAbilitiesOpen}
                    onToggle={setUpcomingClassAbilitiesOpen}
                    locale={locale}
                />

                {classAbilities.length === 0 && upcomingClassAbilities.length === 0 && (
                    <div className="border border-ring rounded-2xl bg-panel/80 p-4 text-xs text-ink-muted">
                        {tr(
                            locale,
                            "Esta clase no tiene rasgos disponibles para este nivel.",
                            "This class has no available traits at this level."
                        )}
                    </div>
                )}

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
                    subclassOptions={subclassOptions}
                    allowedTypes={["trait", "classAbility"]}
                    defaultFormType="classAbility"
                    createOpen={customCreateOpen}
                    onToggleCreate={setCustomCreateOpen}
                    createAsModal
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex">
                <button
                    type="button"
                    onClick={() => setCustomCreateOpen(true)}
                    className="text-[11px] px-3 py-2 rounded-md border border-accent/60 bg-accent/10 hover:bg-accent/20"
                >
                    {tr(locale, "Crear magia/rasgos personalizados", "Create custom magic/traits")}
                </button>
            </div>

            {preparedInfo && (
                <div className="border border-ring rounded-2xl bg-panel/80 p-3 text-xs">
                    <h4 className="font-semibold text-ink mb-1">
                        {tr(locale, "Hechizos preparados", "Prepared spells")}
                    </h4>

                    <p className="text-ink">
                        {tr(locale, "Preparados", "Prepared")}:{" "}
                        <strong>{preparedCount}</strong> /{" "}
                        <strong>{preparedInfo.total}</strong>
                    </p>

                    <p className="text-ink-muted mt-1">
                        {tr(locale, "Caracteristica de lanzamiento", "Casting ability")}:{" "}
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

            {viewMode !== "spellsOnly" && (
                <>
                    <ClassAbilityBlock
                        title={tr(locale, "Habilidades de clase aprendidas", "Learned class abilities")}
                        abilities={classAbilities}
                        open={classAbilitiesOpen}
                        onToggle={setClassAbilitiesOpen}
                        locale={locale}
                    />
                    <ClassAbilityBlock
                        title={tr(locale, "Habilidades de clase por desbloquear", "Upcoming class abilities")}
                        abilities={upcomingClassAbilities}
                        open={upcomingClassAbilitiesOpen}
                        onToggle={setUpcomingClassAbilitiesOpen}
                        locale={locale}
                    />
                </>
            )}

            <div className="flex flex-wrap justify-between gap-2">
                <div className="flex gap-2">
                    <button
                        className="text-xs border border-ring px-2 py-1 rounded bg-white/70 text-ink hover:bg-white"
                        onClick={() => setCollapsed({})}
                    >
                        {tr(locale, "Expandir todo", "Expand all")}
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
                        {tr(locale, "Plegar todo", "Collapse all")}
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        className="text-xs border border-ring px-3 py-1 rounded bg-white/70 text-ink hover:bg-white"
                        onClick={onOpenSpellManager}
                    >
                        {tr(locale, "Abrir gestor SRD", "Open SRD manager")}
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
                subclassOptions={subclassOptions}
                createOpen={customCreateOpen}
                onToggleCreate={setCustomCreateOpen}
                createAsModal
            />
        </div>
    );
}
