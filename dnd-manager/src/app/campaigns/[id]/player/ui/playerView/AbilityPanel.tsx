"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    Character,
    Details,
    Stats,
    SpellMeta,
    Spells,
    LearnedSpellRef,
    migrateOldSpells,
    countPreparedSpells,
} from "../../playerShared";

import { getPreparedSpellsInfo } from "../../playerShared";
import { getClassMagicExtras } from "../../playerShared";
import {
    getClassAbilityTimeline,
    getClassSubclasses,
} from "@/lib/dnd/classAbilities";
import { ClassAbility } from "@/lib/dnd/classAbilities/types";
import { useClientLocale } from "@/lib/i18n/useClientLocale";
import { getLocalizedText, normalizeLocalizedText } from "@/lib/character/items";
import { tr } from "@/lib/i18n/translate";
import {
    findClientSpellByName,
    getClientSpellByIndex,
} from "@/lib/dnd/clientLocalData";

import AbilityPanelView from "../../sections/AbilityPanelView";
import type { CustomFeatureEntry, CustomSpellEntry } from "@/lib/types/dnd";

/* ---------------------------
   Props
--------------------------- */
type Props = {
    character: Character;
    stats: Stats;
    details: Details;
    onDetailsChange?: (d: Details) => void;
    onOpenSpellManager: () => void;
    viewMode?: "full" | "classOnly" | "spellsOnly";
};

const CUSTOM_SPELL_PREFIX = "custom-spell:";
const CUSTOM_CLASS_ABILITY_PREFIX = "custom-classAbility:";
const CUSTOM_TRAIT_PREFIX = "custom-trait:";

function clampSpellLevel(value: number | undefined): number {
    const parsed = Number(value ?? 0);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.min(9, Math.floor(parsed)));
}

function customSpellIndex(id: string): string {
    return `${CUSTOM_SPELL_PREFIX}${id}`;
}

export default function AbilityPanel({
                                         character,
                                         stats,
                                         details,
                                         onDetailsChange,
                                         onOpenSpellManager,
                                         viewMode = "full",
                                     }: Props) {
    const locale = useClientLocale();
    const t = (es: string, en: string) => tr(locale, es, en);

    /* ---------------------------
       NORMALIZE SPELLS (MIGRATION)
    --------------------------- */
    const normalizedSpells: Spells = migrateOldSpells(details.spells);

    const preparedInfo = getPreparedSpellsInfo(
        character.class,
        stats,
        character.level,
        { ...details, spells: normalizedSpells },
        locale
    );

    const preparedCount = countPreparedSpells(normalizedSpells);
    const extras = getClassMagicExtras(character.class, character.level, locale);

    const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

    const customSpells: CustomSpellEntry[] = Array.isArray(details.customSpells)
        ? details.customSpells
        : [];
    const customCantrips: CustomSpellEntry[] = Array.isArray(details.customCantrips)
        ? details.customCantrips
        : [];
    const customTraits: CustomFeatureEntry[] = Array.isArray(details.customTraits)
        ? details.customTraits
        : [];
    const customClassAbilities: CustomFeatureEntry[] = Array.isArray(
        details.customClassAbilities
    )
        ? details.customClassAbilities
        : [];
    const spellSlotModifiers = useMemo(() => {
        const next: Record<string, number> = {};
        const adjustments = Array.isArray(details.manualAdjustments)
            ? details.manualAdjustments
            : [];
        for (const adjustment of adjustments) {
            const target = String(adjustment?.target ?? "").toUpperCase();
            if (!target.startsWith("SPELL_SLOT_")) continue;
            const level = target.replace("SPELL_SLOT_", "").trim();
            const numericLevel = Number(level);
            if (!Number.isFinite(numericLevel) || numericLevel < 1 || numericLevel > 9) {
                continue;
            }
            const value = Number(adjustment?.value ?? 0);
            if (!Number.isFinite(value) || value === 0) continue;
            next[level] = (next[level] ?? 0) + value;
        }
        return next;
    }, [details.manualAdjustments]);

    const customSpellEntries = useMemo(() => {
        const spells = Array.isArray(customSpells) ? customSpells : [];
        const cantrips = Array.isArray(customCantrips) ? customCantrips : [];
        return [...cantrips, ...spells].filter(
            (entry) => typeof entry?.name === "string" && entry.name.trim().length > 0
        );
    }, [customSpells, customCantrips]);

    const customSpellsByLevel = useMemo(() => {
        const byLevel = new Map<number, LearnedSpellRef[]>();
        for (const entry of customSpellEntries) {
            const level = clampSpellLevel(entry.level);
            const index = customSpellIndex(entry.id);
            const ref: LearnedSpellRef = {
                index,
                name: entry.name.trim(),
            };
            const existing = byLevel.get(level) ?? [];
            if (!existing.some((spell) => spell.index === ref.index)) {
                existing.push(ref);
                byLevel.set(level, existing);
            }
        }
        return byLevel;
    }, [customSpellEntries]);

    const spellDetailsForView = useMemo(() => {
        const merged: Record<string, SpellMeta> = { ...(details.spellDetails || {}) };

        for (const entry of customSpellEntries) {
            const index = customSpellIndex(entry.id);
            const componentList: string[] = [];
            if (entry.components?.verbal) componentList.push("V");
            if (entry.components?.somatic) componentList.push("S");
            if (entry.components?.material) componentList.push("M");
            const castingTime =
                typeof entry.castingTime === "string"
                    ? entry.castingTime
                    : entry.castingTime
                        ? `${entry.castingTime.value}${entry.castingTime.note ? ` (${entry.castingTime.note})` : ""}`
                        : undefined;

            merged[index] = {
                index,
                name: entry.name,
                level: clampSpellLevel(entry.level),
                range: entry.range,
                casting_time: castingTime,
                duration: entry.duration,
                school: entry.school,
                components: componentList.length > 0 ? componentList : undefined,
                material: entry.materials,
                concentration: entry.concentration,
                ritual: entry.ritual,
                shortDesc: entry.description,
                fullDesc: entry.description,
                isCustom: true,
            };
        }

        return merged;
    }, [details.spellDetails, customSpellEntries]);

    const actionTypeLabel: Record<string, string> = {
        action: t("Accion", "Action"),
        bonus: t("Accion bonus", "Bonus action"),
        reaction: t("Reaccion", "Reaction"),
        passive: t("Pasiva", "Passive"),
    };
    const baseSubclassOptions = useMemo(
        () =>
            getClassSubclasses(character.class, undefined, locale).map((subclass) => ({
                id: subclass.id,
                name: subclass.name,
            })),
        [character.class, locale]
    );
    const customSubclassOptions = useMemo(() => {
        const currentClass = typeof character.class === "string" ? character.class : "";
        const list = Array.isArray(details.customSubclasses)
            ? details.customSubclasses
            : [];
        return list
            .filter(
                (subclass) =>
                    subclass?.classId === currentClass &&
                    typeof subclass?.id === "string" &&
                    subclass.id &&
                    typeof subclass?.name === "string" &&
                    subclass.name.trim().length > 0
            )
            .map((subclass) => ({
                id: subclass.id,
                name: subclass.name.trim(),
            }));
    }, [character.class, details.customSubclasses]);
    const subclassOptions = useMemo(() => {
        const merged = [...baseSubclassOptions];
        const existingIds = new Set(merged.map((subclass) => subclass.id));
        for (const customSubclass of customSubclassOptions) {
            if (!existingIds.has(customSubclass.id)) {
                merged.push(customSubclass);
            }
        }
        return merged;
    }, [baseSubclassOptions, customSubclassOptions]);
    const subclassNameById = useMemo(
        () => Object.fromEntries(subclassOptions.map((subclass) => [subclass.id, subclass.name])),
        [subclassOptions]
    );
    const selectedSubclassId = useMemo(() => {
        const rawId =
            typeof details.classSubclassId === "string"
                ? details.classSubclassId.trim()
                : "";
        if (rawId && subclassOptions.some((subclass) => subclass.id === rawId)) {
            return rawId;
        }

        const rawName =
            typeof details.classSubclassName === "string"
                ? details.classSubclassName.trim()
                : "";
        if (!rawName) return undefined;

        const normalizeToken = (value: string) =>
            value
                .toLowerCase()
                .trim()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

        const byName = subclassOptions.find(
            (subclass) => normalizeToken(subclass.name) === normalizeToken(rawName)
        );
        return byName?.id;
    }, [details.classSubclassId, details.classSubclassName, subclassOptions]);

    const classAbilityTimeline = useMemo(
        () =>
            character.class && character.level != null
                ? getClassAbilityTimeline(
                      character.class,
                      character.level,
                      selectedSubclassId,
                      locale
                  )
                : { learned: [], upcoming: [] },
        [character.class, character.level, selectedSubclassId, locale]
    );

    const mappedCustomClassAbilities = useMemo(
        () =>
            customClassAbilities
                // Custom actions belong to "Acciones y hechizos", not class progression.
                .filter((ability) => ability.actionType !== "action")
                .filter((ability) => {
                    if (!ability.subclassId) return true;
                    return ability.subclassId === selectedSubclassId;
                })
                .map((ability) => {
                    const desc = getLocalizedText(ability.description, locale);
                    const detailsLines: string[] = [];
                    if (ability.actionType) {
                        detailsLines.push(
                            `**${t("Tipo", "Type")}:** ${actionTypeLabel[ability.actionType] ?? ability.actionType}`
                        );
                    }
                    if (ability.requirements) {
                        detailsLines.push(`**${t("Requisitos", "Requirements")}:** ${ability.requirements}`);
                    }
                    if (ability.effect) {
                        detailsLines.push(`**${t("Efecto", "Effect")}:** ${ability.effect}`);
                    }
                    if (ability.resourceCost) {
                        const costParts: string[] = [];
                        if (ability.resourceCost.usesSpellSlot) {
                            costParts.push(
                                t("usa espacio", "uses slot") +
                                    (ability.resourceCost.slotLevel
                                        ? ` (${t("nivel", "level")} ${ability.resourceCost.slotLevel})`
                                        : "")
                            );
                        }
                        if (ability.resourceCost.charges != null) {
                            costParts.push(
                                `${ability.resourceCost.charges} ${t(
                                    ability.resourceCost.charges === 1 ? "carga" : "cargas",
                                    ability.resourceCost.charges === 1 ? "charge" : "charges"
                                )}`
                            );
                        }
                        if (ability.resourceCost.recharge) {
                            costParts.push(
                                ability.resourceCost.recharge === "short"
                                    ? t("recarga en descanso corto", "recharges on short rest")
                                    : t("recarga en descanso largo", "recharges on long rest")
                            );
                        }
                        if (ability.resourceCost.points != null) {
                            costParts.push(
                                `${ability.resourceCost.points} ${
                                    ability.resourceCost.pointsLabel ||
                                    t("puntos", "points")
                                }`
                            );
                        }
                        if (costParts.length > 0) {
                            detailsLines.push(`**${t("Coste", "Cost")}:** ${costParts.join(", ")}`);
                        }
                    }

                    const level = Number.isFinite(Number(ability.level))
                        ? Number(ability.level)
                        : 0;
                    const subclassName =
                        ability.subclassName ??
                        (ability.subclassId
                            ? subclassNameById[ability.subclassId]
                            : undefined);

                    return {
                        id: `${CUSTOM_CLASS_ABILITY_PREFIX}${ability.id}`,
                        class: "custom",
                        name: ability.name,
                        level,
                        subclassId: ability.subclassId,
                        subclassName,
                        description:
                            [desc, ...detailsLines].filter(Boolean).join("\n\n") ||
                            undefined,
                    } as ClassAbility;
                }),
        [customClassAbilities, locale, selectedSubclassId, subclassNameById]
    );

    const mappedCustomTraits = useMemo(
        () =>
            customTraits.map((trait) => {
                const desc = getLocalizedText(trait.description, locale);
                const level = Number.isFinite(Number(trait.level))
                    ? Number(trait.level)
                    : 0;
                return {
                    id: `${CUSTOM_TRAIT_PREFIX}${trait.id}`,
                    class: "custom",
                    name: trait.name,
                    level,
                    description: desc || undefined,
                } as ClassAbility;
            }),
        [customTraits, locale]
    );

    const classAbilities: ClassAbility[] = useMemo(() => {
        const currentLevel = Math.max(1, Math.floor(Number(character.level) || 1));
        return [
            ...classAbilityTimeline.learned,
            ...mappedCustomTraits.filter((ability) => ability.level <= currentLevel),
            ...mappedCustomClassAbilities.filter(
                (ability) => ability.level <= currentLevel
            ),
        ].sort((a, b) => {
            if (a.level !== b.level) return a.level - b.level;
            return a.name.localeCompare(b.name);
        });
    }, [
        character.level,
        classAbilityTimeline.learned,
        mappedCustomClassAbilities,
        mappedCustomTraits,
    ]);

    const upcomingClassAbilities: ClassAbility[] = useMemo(() => {
        const currentLevel = Math.max(1, Math.floor(Number(character.level) || 1));
        return [
            ...classAbilityTimeline.upcoming,
            ...mappedCustomTraits.filter((ability) => ability.level > currentLevel),
            ...mappedCustomClassAbilities.filter(
                (ability) => ability.level > currentLevel
            ),
        ].sort((a, b) => {
            if (a.level !== b.level) return a.level - b.level;
            return a.name.localeCompare(b.name);
        });
    }, [
        character.level,
        classAbilityTimeline.upcoming,
        mappedCustomClassAbilities,
        mappedCustomTraits,
    ]);

    function patchDetails(patch: Partial<Details>) {
        onDetailsChange?.({
            ...details,
            ...patch,
        });
    }

    /* ---------------------------
       LOAD SRD METADATA (BY INDEX)
       âš ï¸ FIX: CLONE SPELLS TO AVOID MUTATION
    --------------------------- */
    useEffect(() => {
        if (!details.spells) return;

        // âœ… CLONE to force new reference (React re-render)
        const spellsByLevel: Spells = structuredClone(
            migrateOldSpells(details.spells)
        );
        const refs: LearnedSpellRef[] = [];

        // 1ï¸âƒ£ Collect all spells
        Object.values(spellsByLevel).forEach((level) => {
            if (Array.isArray(level)) {
                level.forEach((s) => refs.push(s));
            }
        });

        if (!refs.length) return;

        const existing = details.spellDetails || {};
        const merged: Record<string, SpellMeta> = { ...existing };

        let changed = false;
        let indexResolved = false;

        (async () => {
            // Resolve missing indexes (legacy) using local snapshots.
            for (const spell of refs) {
                if (spell.index) continue;

                try {
                    const match = await findClientSpellByName(spell.name, locale);
                    if (match?.index) {
                        spell.index = match.index;
                        if (match.name && spell.name !== match.name) {
                            spell.name = match.name;
                        }
                        indexResolved = true;
                    }
                } catch (err) {
                    console.warn(
                        "No se pudo resolver el indice del hechizo local:",
                        spell.name,
                        err
                    );
                }
            }

            // Load local spell metadata by index.
            for (const spell of refs) {
                if (!spell.index) continue;

                const existingMeta = merged[spell.index];
                const shouldRefreshMeta = !existingMeta || locale === "es";
                if (!shouldRefreshMeta) {
                    continue;
                }

                let localSpell: any;
                try {
                    localSpell = await getClientSpellByIndex(spell.index, locale);
                    if (!localSpell) continue;
                } catch (err) {
                    console.warn("No se pudo cargar el hechizo local:", spell.index, err);
                    continue;
                }

                const shortDescSource = (
                    localSpell.shortDesc ??
                    (Array.isArray(localSpell.desc) ? localSpell.desc[0] : undefined)
                );
                const fullDescSource = (
                    localSpell.fullDesc ??
                    (Array.isArray(localSpell.desc) || Array.isArray(localSpell.higher_level)
                        ? [...(localSpell.desc ?? []), ...(localSpell.higher_level ?? [])].join(
                              "\n\n"
                          )
                        : undefined)
                );
                const mapped: SpellMeta = {
                    index: localSpell.index,
                    name: localSpell.name,
                    level: localSpell.level,
                    range: localSpell.range,
                    casting_time: localSpell.casting_time,
                    duration: localSpell.duration,
                    school: localSpell.school?.name ?? localSpell.school,
                    components: localSpell.components,
                    material: localSpell.material,
                    concentration: localSpell.concentration,
                    ritual: localSpell.ritual,

                    shortDesc: normalizeLocalizedText(shortDescSource, locale),

                    fullDesc: normalizeLocalizedText(fullDescSource, locale),
                };

                if (spell.name !== mapped.name) {
                    spell.name = mapped.name;
                    indexResolved = true;
                }

                if (
                    !existingMeta ||
                    JSON.stringify(existingMeta) !== JSON.stringify(mapped)
                ) {
                    merged[spell.index] = mapped;
                    changed = true;
                }

            }

            // Save only if something changed.
            if (changed || indexResolved) {
                onDetailsChange?.({
                    ...details,
                    spells: spellsByLevel,
                    spellDetails: merged,
                });
            }
        })();
    }, [details.spells, locale]);

    /* ---------------------------
       BUILD LEVELS FOR VIEW
    --------------------------- */
    const levels = useMemo(
        () =>
            Array.from({ length: 10 }, (_, lvl) => {
                const key = `level${lvl}` as keyof Spells;
                const value = normalizedSpells[key];
                const baseSpells = Array.isArray(value) ? value : [];
                const customLevelSpells = customSpellsByLevel.get(lvl) ?? [];
                const mergedSpells = [...baseSpells];

                for (const customSpell of customLevelSpells) {
                    if (!mergedSpells.some((spell) => spell.index === customSpell.index)) {
                        mergedSpells.push(customSpell);
                    }
                }

                return {
                    lvl,
                    label:
                        lvl === 0
                            ? tr(locale, "Trucos", "Cantrips")
                            : `${tr(locale, "Nivel", "Level")} ${lvl}`,
                    spells: mergedSpells,
                };
            }),
        [normalizedSpells, customSpellsByLevel, locale]
    );

    /* ---------------------------
       RENDER
    --------------------------- */
    return (
        <>
            <AbilityPanelView
                character={character}
                preparedInfo={preparedInfo}
                preparedCount={preparedCount}
                extras={extras}
                classAbilities={classAbilities}
                upcomingClassAbilities={upcomingClassAbilities}
                levels={levels}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                spellDetails={spellDetailsForView}
                onOpenSpellManager={onOpenSpellManager}
                locale={locale}
                customSpells={customSpells}
                setCustomSpells={(next) => patchDetails({ customSpells: next })}
                customCantrips={customCantrips}
                setCustomCantrips={(next) => patchDetails({ customCantrips: next })}
                customTraits={customTraits}
                setCustomTraits={(next) => patchDetails({ customTraits: next })}
                customClassAbilities={customClassAbilities}
                setCustomClassAbilities={(next) =>
                    patchDetails({ customClassAbilities: next })
                }
                subclassOptions={subclassOptions}
                spellSlotModifiers={spellSlotModifiers}
                viewMode={viewMode}
            />
        </>
    );
}



