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
                                          activeTab,
                                          onTabChange,
                                          onDetailsChange,
                                          onOpenSpellManager,
                                      }: {
    character: Character | null;
    activeTab: Tab;
    onTabChange: (t: Tab) => void;
    onDetailsChange?: (d: Details) => void;
    onOpenSpellManager: () => void;
}) {
    if (!character) {
        return (
            <p className="text-sm text-ink-muted p-4">
                Selecciona un personaje.
            </p>
        );
    }

    const details = ensureDetailsItems(character.details || {});
    const baseStats: Stats = character.stats ?? {
        str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    };

    const totalStr = Number(baseStats.str) + getModifierTotal(details, "STR");
    const totalDex = Number(baseStats.dex) + getModifierTotal(details, "DEX");
    const totalCon = Number(baseStats.con) + getModifierTotal(details, "CON");
    const totalInt = Number(baseStats.int) + getModifierTotal(details, "INT");
    const totalWis = Number(baseStats.wis) + getModifierTotal(details, "WIS");
    const totalCha = Number(baseStats.cha) + getModifierTotal(details, "CHA");

    // Stats row para inputs / displays
    const statsRow = {
        str: totalStr,
        dex: totalDex,
        con: totalCon,
        int: totalInt,
        wis: totalWis,
        cha: totalCha,
    };

    const totalAC = (character.armor_class ?? 10) + getModifierTotal(details, "AC");
    const totalSpeed = (character.speed ?? 30) + getModifierTotal(details, "SPEED");
    const totalMaxHp = (character.max_hp ?? details.max_hp ?? 0) + getModifierTotal(details, "HP_MAX");
    const totalCurrentHp =
        (character.current_hp ?? details.current_hp ?? totalMaxHp) +
        getModifierTotal(details, "HP_CURRENT");
    const baseProficiency = Math.max(
        2,
        2 + Math.floor(((character.level ?? 1) - 1) / 4)
    );
    const proficiencyBonus = baseProficiency + getModifierTotal(details, "PROFICIENCY");
    const initiative = abilityModifier(totalDex) + getModifierTotal(details, "INITIATIVE");
    const passivePerception =
        10 + abilityModifier(totalWis) + getModifierTotal(details, "PASSIVE_PERCEPTION");

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="border-b border-ring flex flex-wrap gap-3 text-sm">
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
            </div>

            {activeTab === "stats" && (
                <StatsPanel
                    character={character}
                    details={details}
                    statsRow={statsRow}
                    totalAC={totalAC}
                    totalSpeed={totalSpeed}
                    totalMaxHp={totalMaxHp}
                    totalCurrentHp={totalCurrentHp}
                    proficiencyBonus={proficiencyBonus}
                    initiative={initiative}
                    passivePerception={passivePerception}
                    totalStr={totalStr}
                    totalDex={totalDex}
                    totalCon={totalCon}
                    totalInt={totalInt}
                    totalWis={totalWis}
                    totalCha={totalCha}
                />
            )}

            {activeTab === "spells" && (
                <>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-ink-muted">
                        Reverso de la hoja
                    </div>
                    <AbilityPanel
                        character={character}
                        stats={baseStats}
                        details={details}
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
                    <InventoryPanel details={details} />
                </>
            )}
        </div>
    );
}
