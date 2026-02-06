"use client";

import React from "react";
import { Character, Details, Stats, Tab } from "../playerShared";
import { abilityModifier } from "./playerView/statsHelpers";
import { ensureDetailsItems, getModifierTotal } from "@/lib/character/items";

// Panels
import StatsPanel from "./playerView/StatsPanel";
import AbilityPanel from "./playerView/AbilityPanel";
import InventoryPanel from "./playerView/InventoryPanel";

/* ---------------------------
   COMPONENT
--------------------------- */
export default function CharacterView({
                                          character,
                                          companions = [],
                                          activeTab,
                                          onTabChange,
                                          onDetailsChange,
                                          onImageUpdated,
                                          onOpenSpellManager,
                                      }: {
    character: Character | null;
    companions?: Character[];
    activeTab: Tab;
    onTabChange: (t: Tab) => void;
    onDetailsChange?: (d: Details) => void;
    onImageUpdated?: () => void;
    onOpenSpellManager: () => void;
}) {
    if (!character) {
        return (
            <p className="text-sm text-ink-muted p-4">
                Selecciona un personaje.
            </p>
        );
    }

    function buildDerived(target: Character) {
        const derivedDetails = ensureDetailsItems(target.details || {});
        const baseStats: Stats = target.stats ?? {
            str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
        };

        const totalStr = Number(baseStats.str) + getModifierTotal(derivedDetails, "STR");
        const totalDex = Number(baseStats.dex) + getModifierTotal(derivedDetails, "DEX");
        const totalCon = Number(baseStats.con) + getModifierTotal(derivedDetails, "CON");
        const totalInt = Number(baseStats.int) + getModifierTotal(derivedDetails, "INT");
        const totalWis = Number(baseStats.wis) + getModifierTotal(derivedDetails, "WIS");
        const totalCha = Number(baseStats.cha) + getModifierTotal(derivedDetails, "CHA");

        const statsRow = {
            str: totalStr,
            dex: totalDex,
            con: totalCon,
            int: totalInt,
            wis: totalWis,
            cha: totalCha,
        };

        const totalAC = (target.armor_class ?? 10) + getModifierTotal(derivedDetails, "AC");
        const totalSpeed = (target.speed ?? 30) + getModifierTotal(derivedDetails, "SPEED");
        const totalMaxHp =
            (target.max_hp ?? derivedDetails.max_hp ?? 0) +
            getModifierTotal(derivedDetails, "HP_MAX");
        const totalCurrentHp =
            (target.current_hp ?? derivedDetails.current_hp ?? totalMaxHp) +
            getModifierTotal(derivedDetails, "HP_CURRENT");
        const baseProficiency = Math.max(
            2,
            2 + Math.floor(((target.level ?? 1) - 1) / 4)
        );
        const proficiencyBonus = baseProficiency + getModifierTotal(derivedDetails, "PROFICIENCY");
        const initiative = abilityModifier(totalDex) + getModifierTotal(derivedDetails, "INITIATIVE");
        const passivePerception =
            10 + abilityModifier(totalWis) + getModifierTotal(derivedDetails, "PASSIVE_PERCEPTION");

        return {
            details: derivedDetails,
            baseStats,
            totalStr,
            totalDex,
            totalCon,
            totalInt,
            totalWis,
            totalCha,
            statsRow,
            totalAC,
            totalSpeed,
            totalMaxHp,
            totalCurrentHp,
            proficiencyBonus,
            initiative,
            passivePerception,
        };
    }

    const derived = buildDerived(character);

    const ownedCompanions = companions.filter(
        (companion) =>
            companion.character_type === "companion" &&
            companion.details?.companionOwnerId === character.id
    );
    const unassignedCompanions = companions.filter(
        (companion) =>
            companion.character_type === "companion" &&
            !companion.details?.companionOwnerId
    );
    const companionsToShow =
        ownedCompanions.length > 0 ? ownedCompanions : unassignedCompanions;

    function CompanionMenu() {
        if (!companionsToShow.length) return null;

        return (
            <div className="border border-ring rounded-2xl bg-panel/80 overflow-hidden">
                <div className="px-3 py-2 border-b border-ring bg-white/70 text-ink text-xs uppercase tracking-[0.3em]">
                    Compañeros
                </div>
                <div className="p-3 space-y-3">
                    {companionsToShow.map((companion) => {
                        const companionDerived = buildDerived(companion);
                        const { baseStats, totalMaxHp, totalCurrentHp, totalAC, totalSpeed } =
                            companionDerived;

                        return (
                            <details
                                key={companion.id}
                                className="group border border-ring rounded-xl bg-white/80 overflow-hidden"
                            >
                                <summary className="px-3 py-2 cursor-pointer flex items-center justify-between gap-3 list-none [&::-webkit-details-marker]:hidden">
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-ink truncate">
                                            {companion.name}
                                        </div>
                                        <div className="text-[11px] text-ink-muted truncate">
                                            {companion.race || "Sin raza"} · {companion.class || "Sin clase"} · Nivel {companion.level ?? "?"}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-ink-muted whitespace-nowrap">
                                        <span>PV {totalCurrentHp}/{totalMaxHp}</span>
                                        <span>CA {totalAC}</span>
                                        <span>VEL {totalSpeed}</span>
                                    </div>
                                </summary>

                                <div className="p-3 border-t border-ring text-xs space-y-4">
                                    <StatsPanel
                                        character={companion}
                                        details={companionDerived.details}
                                        statsRow={companionDerived.statsRow}
                                        totalAC={companionDerived.totalAC}
                                        totalSpeed={companionDerived.totalSpeed}
                                        totalMaxHp={companionDerived.totalMaxHp}
                                        totalCurrentHp={companionDerived.totalCurrentHp}
                                        proficiencyBonus={companionDerived.proficiencyBonus}
                                        initiative={companionDerived.initiative}
                                        passivePerception={companionDerived.passivePerception}
                                        totalStr={companionDerived.totalStr}
                                        totalDex={companionDerived.totalDex}
                                        totalCon={companionDerived.totalCon}
                                        totalInt={companionDerived.totalInt}
                                        totalWis={companionDerived.totalWis}
                                        totalCha={companionDerived.totalCha}
                                    />
                                    <AbilityPanel
                                        character={companion}
                                        stats={companionDerived.baseStats}
                                        details={companionDerived.details}
                                        onOpenSpellManager={() => {}}
                                    />
                                    <InventoryPanel details={companionDerived.details} />
                                </div>
                            </details>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="border-b border-ring flex flex-nowrap items-center gap-3 text-sm overflow-x-auto whitespace-nowrap styled-scrollbar">
                <button
                    onClick={() => onTabChange("stats")}
                    className={`pb-2 border-b-2 transition-colors ${
                        activeTab === "stats"
                            ? "border-accent text-ink"
                            : "border-transparent text-ink-muted hover:text-ink"
                    }`}
                >
                    Hoja
                </button>
                <button
                    onClick={() => onTabChange("spells")}
                    className={`pb-2 border-b-2 transition-colors ${
                        activeTab === "spells"
                            ? "border-accent text-ink"
                            : "border-transparent text-ink-muted hover:text-ink"
                    }`}
                >
                    Reverso · Magia y rasgos
                </button>
                <button
                    onClick={() => onTabChange("inventory")}
                    className={`pb-2 border-b-2 transition-colors ${
                        activeTab === "inventory"
                            ? "border-accent text-ink"
                            : "border-transparent text-ink-muted hover:text-ink"
                    }`}
                >
                    Reverso · Inventario
                </button>
                {companionsToShow.length > 0 && (
                    <button
                        onClick={() => onTabChange("companions")}
                        className={`pb-2 border-b-2 transition-colors ${
                            activeTab === "companions"
                                ? "border-accent text-ink"
                                : "border-transparent text-ink-muted hover:text-ink"
                        }`}
                    >
                        Compañeros
                    </button>
                )}
            </div>

            {activeTab === "stats" && (
                <StatsPanel
                    character={character}
                    details={derived.details}
                    statsRow={derived.statsRow}
                    totalAC={derived.totalAC}
                    totalSpeed={derived.totalSpeed}
                    totalMaxHp={derived.totalMaxHp}
                    totalCurrentHp={derived.totalCurrentHp}
                    proficiencyBonus={derived.proficiencyBonus}
                    initiative={derived.initiative}
                    passivePerception={derived.passivePerception}
                    totalStr={derived.totalStr}
                    totalDex={derived.totalDex}
                    totalCon={derived.totalCon}
                    totalInt={derived.totalInt}
                    totalWis={derived.totalWis}
                    totalCha={derived.totalCha}
                    onImageUpdated={onImageUpdated}
                />
            )}

            {activeTab === "spells" && (
                <>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-ink-muted">
                        Reverso de la hoja
                    </div>
                    <AbilityPanel
                        character={character}
                        stats={derived.baseStats}
                        details={derived.details}
                        onDetailsChange={onDetailsChange}
                        onOpenSpellManager={onOpenSpellManager}
                    />
                </>
            )}

            {activeTab === "inventory" && (
                <>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-ink-muted">
                        Reverso de la hoja
                    </div>
                    <InventoryPanel details={derived.details} />
                </>
            )}

            {activeTab === "companions" && <CompanionMenu />}
        </div>
    );
}



