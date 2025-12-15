"use client";

import React from "react";
import { Character, Details, Stats, Tab } from "../playerShared";
import { sumArmorBonus } from "@/lib/dndMath";

// Panels
import StatsPanel from "./playerView/StatsPanel";
import AbilityPanel from "./playerView/AbilityPanel";
import InventoryPanel from "./playerView/InventoryPanel";

/* ---------------------------
   Helpers: ability bonuses (MISMA LÓGICA QUE FUNCIONABA)
--------------------------- */
type AbilityKey = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";

function accumulateBonus(
    bonuses: Record<AbilityKey, number>,
    ability: AbilityKey | undefined,
    value: unknown
) {
    if (!ability) return;
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) return;
    bonuses[ability] += num;
}

function getAbilityBonusesFromDetails(details: Details | undefined) {
    const bonuses: Record<AbilityKey, number> = {
        STR: 0,
        DEX: 0,
        CON: 0,
        INT: 0,
        WIS: 0,
        CHA: 0,
    };
    if (!details) return bonuses;

    const textSources = [
        details.inventory,
        details.equipment,
        details.weaponsExtra,
    ];

    for (const source of textSources) {
        if (!source) continue;
        const lines = source.split("\n").map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
            if (!line.startsWith("{")) continue;
            try {
                const item = JSON.parse(line);
                if (item.ability && typeof item.modifier === "number") {
                    accumulateBonus(bonuses, item.ability, item.modifier);
                }
                if (Array.isArray(item.modifiers)) {
                    for (const m of item.modifiers) {
                        accumulateBonus(bonuses, m.ability, m.modifier);
                    }
                }
            } catch {}
        }
    }

    if (Array.isArray(details.armors)) {
        for (const a of details.armors as any[]) {
            accumulateBonus(bonuses, a.statAbility, a.statModifier);
            if (Array.isArray(a.modifiers)) {
                for (const m of a.modifiers) {
                    accumulateBonus(bonuses, m.ability, m.modifier);
                }
            }
        }
    }

    const w = (details as any)?.weaponEquipped;
    if (w) {
        accumulateBonus(bonuses, w.statAbility, w.statModifier);
        if (Array.isArray(w.modifiers)) {
            for (const m of w.modifiers) {
                accumulateBonus(bonuses, m.ability, m.modifier);
            }
        }
    }

    return bonuses;
}

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
            <p className="text-sm text-zinc-500 p-4">
                Selecciona un personaje.
            </p>
        );
    }

    const details = character.details || {};
    const baseStats: Stats = character.stats ?? {
        str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    };

    const bonuses = getAbilityBonusesFromDetails(details);

    // Totales finales (ESTO ES LO QUE QUIERE StatsPanel)
    const totalStr = Number(baseStats.str) + bonuses.STR;
    const totalDex = Number(baseStats.dex) + bonuses.DEX;
    const totalCon = Number(baseStats.con) + bonuses.CON;
    const totalInt = Number(baseStats.int) + bonuses.INT;
    const totalWis = Number(baseStats.wis) + bonuses.WIS;
    const totalCha = Number(baseStats.cha) + bonuses.CHA;

    // Stats row para inputs / displays
    const statsRow = {
        str: totalStr,
        dex: totalDex,
        con: totalCon,
        int: totalInt,
        wis: totalWis,
        cha: totalCha,
    };

    const armors = Array.isArray(details.armors) ? details.armors : [];
    const totalAC =
        (character.armor_class ?? 10) + sumArmorBonus(armors);

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="border-b border-zinc-800 flex gap-4 text-sm">
                <button
                    onClick={() => onTabChange("stats")}
                    className={`pb-2 border-b-2 ${
                        activeTab === "stats"
                            ? "border-purple-500 text-purple-300"
                            : "border-transparent text-zinc-500"
                    }`}
                >
                    Estadísticas
                </button>
                <button
                    onClick={() => onTabChange("spells")}
                    className={`pb-2 border-b-2 ${
                        activeTab === "spells"
                            ? "border-purple-500 text-purple-300"
                            : "border-transparent text-zinc-500"
                    }`}
                >
                    Habilidades
                </button>
                <button
                    onClick={() => onTabChange("inventory")}
                    className={`pb-2 border-b-2 ${
                        activeTab === "inventory"
                            ? "border-purple-500 text-purple-300"
                            : "border-transparent text-zinc-500"
                    }`}
                >
                    Inventario
                </button>
            </div>

            {activeTab === "stats" && (
                <StatsPanel
                    character={character}
                    details={details}
                    statsRow={statsRow}
                    totalAC={totalAC}
                    totalStr={totalStr}
                    totalDex={totalDex}
                    totalCon={totalCon}
                    totalInt={totalInt}
                    totalWis={totalWis}
                    totalCha={totalCha}
                    onDetailsChange={onDetailsChange}
                />
            )}

            {activeTab === "spells" && (
                <AbilityPanel
                    character={character}
                    stats={baseStats}
                    details={details}
                    onDetailsChange={onDetailsChange}
                    onOpenSpellManager={onOpenSpellManager}
                />
            )}

            {activeTab === "inventory" && (
                <InventoryPanel details={details} />
            )}
        </div>
    );
}
