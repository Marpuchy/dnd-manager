"use client";

import React, { useEffect, useState } from "react";
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
import { getClassAbilities } from "@/lib/dnd/classAbilities";
import { ClassAbility } from "@/lib/dnd/classAbilities/types";
import { getClientLocale } from "@/lib/i18n/getClientLocale";
import { normalizeLocalizedText } from "@/lib/character/items";

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
};

export default function AbilityPanel({
                                         character,
                                         stats,
                                         details,
                                         onDetailsChange,
                                         onOpenSpellManager,
                                     }: Props) {
    /* ---------------------------
       NORMALIZE SPELLS (MIGRATION)
    --------------------------- */
    const normalizedSpells: Spells = migrateOldSpells(details.spells);

    const preparedInfo = getPreparedSpellsInfo(
        character.class,
        stats,
        character.level,
        { ...details, spells: normalizedSpells }
    );

    const preparedCount = countPreparedSpells(normalizedSpells);
    const extras = getClassMagicExtras(character.class, character.level);
    const locale = getClientLocale();

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
            // 2ï¸âƒ£ Resolve missing indexes (legacy)
            for (const spell of refs) {
                if (spell.index) continue;

                try {
                    const searchRes = await fetch(
                        `/api/dnd/spells/search?name=${encodeURIComponent(spell.name)}`
                    );

                    if (!searchRes.ok) continue;

                    const searchData = await searchRes.json();
                    const results = Array.isArray(searchData?.results)
                        ? searchData.results
                        : [];
                    const normalizedName = spell.name?.trim().toLowerCase();
                    const exact =
                        normalizedName && results.length
                            ? results.find(
                                  (r: any) =>
                                      typeof r?.name === "string" &&
                                      r.name.trim().toLowerCase() ===
                                          normalizedName
                              )
                            : undefined;
                    const match = exact ?? results[0];

                    if (match?.index) {
                        spell.index = match.index;
                        indexResolved = true;
                    }
                } catch (err) {
                    console.warn(
                        "No se pudo resolver el índice del hechizo:",
                        spell.name,
                        err
                    );
                }
            }

            // 3ï¸âƒ£ Load SRD metadata by index
            for (const spell of refs) {
                if (!spell.index) continue;
                if (merged[spell.index]) continue;

                let apiData: any;
                try {
                    const res = await fetch(
                        `/api/dnd/spells/${encodeURIComponent(spell.index)}?locale=${locale}`
                    );
                    if (!res.ok) continue;
                    apiData = await res.json();
                } catch (err) {
                    console.warn("No se pudo cargar el hechizo:", spell.index, err);
                    continue;
                }

                /* MAPEO CORRECTO A TU SpellMeta */
                const shortDescSource = (
                    apiData.shortDesc ??
                    (Array.isArray(apiData.desc) ? apiData.desc[0] : undefined)
                );
                const fullDescSource = (
                    apiData.fullDesc ??
                    (Array.isArray(apiData.desc) || Array.isArray(apiData.higher_level)
                        ? [...(apiData.desc ?? []), ...(apiData.higher_level ?? [])].join(
                              "\n\n"
                          )
                        : undefined)
                );
                const mapped: SpellMeta = {
                    index: apiData.index,
                    name: apiData.name,
                    level: apiData.level,
                    range: apiData.range,
                    casting_time: apiData.casting_time,
                    duration: apiData.duration,
                    school: apiData.school?.name ?? apiData.school,
                    components: apiData.components,
                    material: apiData.material,
                    concentration: apiData.concentration,
                    ritual: apiData.ritual,

                    shortDesc: normalizeLocalizedText(shortDescSource, locale),

                    fullDesc: normalizeLocalizedText(fullDescSource, locale),
                };

                merged[spell.index] = mapped;
                changed = true;

            }

            // 4ï¸âƒ£ Save ONLY if something changed
            if (changed || indexResolved) {
                onDetailsChange?.({
                    ...details,
                    spells: spellsByLevel, // âœ… NEW reference
                    spellDetails: merged,
                });
            }
        })();
    }, [details.spells, locale]);

    /* ---------------------------
       BUILD LEVELS FOR VIEW
    --------------------------- */
    const levels = Array.from({ length: 10 }, (_, lvl) => {
        const key = `level${lvl}` as keyof Spells;
        const value = normalizedSpells[key];

        return {
            lvl,
            label: lvl === 0 ? "Trucos" : `Nivel ${lvl}`,
            spells: Array.isArray(value) ? value : [],
        };
    });

    const classAbilities: ClassAbility[] =
        character.class && character.level != null
            ? getClassAbilities(character.class, character.level)
            : [];

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
                levels={levels}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                spellDetails={details.spellDetails || {}}
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
            />
        </>
    );
}



