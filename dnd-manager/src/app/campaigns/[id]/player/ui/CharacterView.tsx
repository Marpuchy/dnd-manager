"use client";

import React from "react";
import { Character, Details, Stats, Tab, prettyClassLabel } from "../playerShared";
import { abilityModifier } from "./playerView/statsHelpers";
import { ensureDetailsItems, getModifierTotal } from "@/lib/character/items";
import { getSubclassName } from "@/lib/dnd/classAbilities";
import { useClientLocale } from "@/lib/i18n/useClientLocale";
import { tr } from "@/lib/i18n/translate";

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
                                          renderTabs = true,
                                      }: {
    character: Character | null;
    companions?: Character[];
    activeTab: Tab;
    onTabChange: (t: Tab) => void;
    onDetailsChange?: (d: Details) => void;
    onImageUpdated?: () => void;
    onOpenSpellManager: () => void;
    renderTabs?: boolean;
}) {
    const locale = useClientLocale();
    const t = (es: string, en: string) => tr(locale, es, en);

    if (!character) {
        return (
            <p className="text-sm text-ink-muted p-4">
                {t("Selecciona un personaje.", "Select a character.")}
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
        const proficiencyBonus =
            baseProficiency + getModifierTotal(derivedDetails, "PROFICIENCY");
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
    function classLabelWithSubclass(target: Character): string {
        const className = prettyClassLabel(target.class, locale);
        const customSubclassName =
            target.details?.classSubclassId &&
            Array.isArray(target.details?.customSubclasses)
                ? target.details.customSubclasses.find(
                      (subclass) => subclass.id === target.details?.classSubclassId
                  )?.name
                : undefined;
        const subclassName =
            getSubclassName(
                target.class,
                target.details?.classSubclassId ?? null,
                locale
            ) ??
            customSubclassName ??
            target.details?.classSubclassName;
        return subclassName ? `${className} (${subclassName})` : className;
    }

    function classProgressionLabel(target: Character): string {
        const baseLabel = classLabelWithSubclass(target);
        const customSubclassById = new Map(
            Array.isArray(target.details?.customSubclasses)
                ? target.details.customSubclasses
                      .filter(
                          (subclass) =>
                              subclass &&
                              typeof subclass.id === "string" &&
                              typeof subclass.name === "string" &&
                              subclass.name.trim().length > 0
                      )
                      .map((subclass) => [subclass.id, subclass.name.trim()])
                : []
        );
        const multiclassList = Array.isArray(target.details?.multiclass)
            ? target.details.multiclass
                  .filter(
                      (entry) =>
                          entry &&
                          typeof entry.classId === "string" &&
                          entry.classId.trim().length > 0 &&
                          Number.isFinite(Number(entry.level)) &&
                          Number(entry.level) > 0
                  )
                  .map((entry) => ({
                      classId: String(entry.classId).trim(),
                      level: Math.max(1, Math.floor(Number(entry.level) || 1)),
                      subclassId:
                          typeof entry.subclassId === "string"
                              ? entry.subclassId.trim()
                              : "",
                      subclassName:
                          typeof entry.subclassName === "string"
                              ? entry.subclassName.trim()
                              : "",
                  }))
            : [];
        if (multiclassList.length === 0) {
            return baseLabel;
        }
        const totalLevel = Math.max(1, Math.floor(Number(target.level) || 1));
        const secondaryTotal = multiclassList.reduce(
            (sum, entry) => sum + entry.level,
            0
        );
        const storedPrimary = Number(target.details?.primaryClassLevel);
        const primaryLevel =
            Number.isFinite(storedPrimary) && storedPrimary >= 0
                ? Math.floor(storedPrimary)
                : Math.max(0, totalLevel - secondaryTotal);
        const parts = [`${baseLabel} ${primaryLevel}`];
        for (const entry of multiclassList) {
            const resolvedSubclassName =
                (entry.subclassId
                    ? getSubclassName(entry.classId, entry.subclassId, locale) ??
                      customSubclassById.get(entry.subclassId)
                    : undefined) ??
                (entry.subclassName || undefined);
            const classLabel = prettyClassLabel(entry.classId, locale);
            const classWithSubclass = resolvedSubclassName
                ? `${classLabel} (${resolvedSubclassName})`
                : classLabel;
            parts.push(`${classWithSubclass} ${entry.level}`);
        }
        return parts.join(" / ");
    }

    function CompanionMenu() {
        if (!companionsToShow.length) return null;

        return (
            <div className="border border-ring rounded-2xl bg-panel/80 overflow-hidden">
                <div className="px-3 py-2 border-b border-ring bg-white/70 text-ink text-xs uppercase tracking-[0.3em]">
                    {t("Compañeros", "Companions")}
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
                                            {companion.race || t("Sin raza", "No race")} · {classProgressionLabel(companion)} · {t("Nivel", "Level")} {companion.level ?? "?"}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                                        <span>{t("PV", "HP")} {totalCurrentHp}/{totalMaxHp}</span>
                                        <span>{t("CA", "AC")} {totalAC}</span>
                                        <span>{t("VEL", "SPD")} {totalSpeed}</span>
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
        <div className="space-y-4 min-w-0">
            {renderTabs && (
                <div className="border-b border-ring flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 text-sm sm:overflow-x-auto sm:whitespace-nowrap styled-scrollbar pb-0 mb-0">
                    <button
                        onClick={() => onTabChange("stats")}
                        className={`pt-2 pb-0 mb-0 border-b-2 transition-colors ${
                            activeTab === "stats"
                                ? "border-accent text-ink"
                                : "border-transparent text-ink-muted hover:text-ink"
                        }`}
                    >
                        {t("Hoja", "Sheet")}
                    </button>
                    <button
                        onClick={() => onTabChange("spells")}
                        className={`pt-2 pb-0 mb-0 border-b-2 transition-colors ${
                            activeTab === "spells"
                                ? "border-accent text-ink"
                                : "border-transparent text-ink-muted hover:text-ink"
                        }`}
                    >
                        {t("Reverso · Acciones y hechizos", "Back · Actions and spells")}
                    </button>
                    <button
                        onClick={() => onTabChange("classFeatures")}
                        className={`pt-2 pb-0 mb-0 border-b-2 transition-colors ${
                            activeTab === "classFeatures"
                                ? "border-accent text-ink"
                                : "border-transparent text-ink-muted hover:text-ink"
                        }`}
                    >
                        {t("Habilidades de clase", "Class features")}
                    </button>
                    <button
                        onClick={() => onTabChange("inventory")}
                        className={`pt-2 pb-0 mb-0 border-b-2 transition-colors ${
                            activeTab === "inventory"
                                ? "border-accent text-ink"
                                : "border-transparent text-ink-muted hover:text-ink"
                        }`}
                    >
                        {t("Reverso · Inventario", "Back · Inventory")}
                    </button>
                    {companionsToShow.length > 0 && (
                        <button
                            onClick={() => onTabChange("companions")}
                            className={`pt-2 pb-0 mb-0 border-b-2 transition-colors ${
                                activeTab === "companions"
                                    ? "border-accent text-ink"
                                    : "border-transparent text-ink-muted hover:text-ink"
                            }`}
                        >
                            {t("Compañeros", "Companions")}
                        </button>
                    )}
                </div>
            )}

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
                        {t("Acciones y hechizos", "Actions and spells")}
                    </div>
                    <AbilityPanel
                        character={character}
                        stats={derived.baseStats}
                        details={derived.details}
                        onDetailsChange={onDetailsChange}
                        onOpenSpellManager={onOpenSpellManager}
                        viewMode="spellsOnly"
                    />
                </>
            )}

            {activeTab === "classFeatures" && (
                <>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-ink-muted">
                        {t("Escalado de clase", "Class progression")}
                    </div>
                    <AbilityPanel
                        character={character}
                        stats={derived.baseStats}
                        details={derived.details}
                        onDetailsChange={onDetailsChange}
                        onOpenSpellManager={onOpenSpellManager}
                        viewMode="classOnly"
                    />
                </>
            )}

            {activeTab === "inventory" && (
                <>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-ink-muted">
                        {t("Reverso de la hoja", "Back of the sheet")}
                    </div>
                    <InventoryPanel details={derived.details} />
                </>
            )}

            {activeTab === "companions" && <CompanionMenu />}
        </div>
    );
}



