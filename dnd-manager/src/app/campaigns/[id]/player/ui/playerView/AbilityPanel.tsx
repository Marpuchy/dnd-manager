"use client";

import React, { useEffect, useRef, useState } from "react";
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

import AbilityPanelView from "../../sections/AbilityPanelView";
import CreateCustomSpellModal from "../../modals/CreateCustomSpellModal";

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

    const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
    const [showCustomSpell, setShowCustomSpell] = useState(false);

    const builtRef = useRef(false);

    /* ---------------------------
       LOAD SRD METADATA (BY INDEX)
       ⚠️ FIX: CLONE SPELLS TO AVOID MUTATION
    --------------------------- */
    useEffect(() => {
        if (!details.spells) return;

        // ✅ CLONE to force new reference (React re-render)
        const spellsByLevel: Spells = structuredClone(
            migrateOldSpells(details.spells)
        );
        const refs: LearnedSpellRef[] = [];

        // 1️⃣ Collect all spells
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
            // 2️⃣ Resolve missing indexes (legacy)
            for (const spell of refs) {
                if (spell.index) continue;

                const searchRes = await fetch(
                    `https://www.dnd5eapi.co/api/spells?name=${encodeURIComponent(
                        spell.name
                    )}`
                );

                if (!searchRes.ok) continue;

                const searchData = await searchRes.json();
                const match = searchData?.results?.[0];

                if (match?.index) {
                    spell.index = match.index;
                    indexResolved = true;
                }
            }

            // 3️⃣ Load SRD metadata by index
            for (const spell of refs) {
                if (!spell.index) continue;
                if (merged[spell.index]) continue;

                const res = await fetch(
                    `https://www.dnd5eapi.co/api/spells/${spell.index}`
                );
                if (!res.ok) continue;

                const apiData = await res.json();

                /* 🔥 MAPEO CORRECTO A TU SpellMeta */
                const mapped: SpellMeta = {
                    index: apiData.index,
                    name: apiData.name,
                    level: apiData.level,
                    range: apiData.range,
                    casting_time: apiData.casting_time,
                    duration: apiData.duration,
                    school: apiData.school?.name,
                    components: apiData.components,
                    material: apiData.material,
                    concentration: apiData.concentration,
                    ritual: apiData.ritual,

                    shortDesc: Array.isArray(apiData.desc)
                        ? apiData.desc[0]
                        : undefined,

                    fullDesc: [
                        ...(apiData.desc ?? []),
                        ...(apiData.higher_level ?? []),
                    ].join("\n\n"),
                };

                merged[spell.index] = mapped;
                changed = true;

            }

            // 4️⃣ Save ONLY if something changed
            if (changed || indexResolved) {
                onDetailsChange?.({
                    ...details,
                    spells: spellsByLevel, // ✅ NEW reference
                    spellDetails: merged,
                });
            }
        })();
    }, [details.spells]);

    /* ---------------------------
       ADD CUSTOM SPELL
    --------------------------- */
    function addCustomSpell(spell: SpellMeta) {
        const levelKey = `level${spell.level}` as keyof Spells;
        const current = normalizedSpells[levelKey];

        const updatedLevel: LearnedSpellRef[] = Array.isArray(current)
            ? [...current]
            : [];

        updatedLevel.push({
            index: spell.index,
            name: spell.name,
        });

        onDetailsChange?.({
            ...details,
            spells: {
                ...normalizedSpells,
                [levelKey]: updatedLevel,
            },
            spellDetails: {
                ...(details.spellDetails || {}),
                [spell.index]: spell,
            },
        });
    }

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
                onCreateCustomSpell={() => setShowCustomSpell(true)}
            />

            {showCustomSpell && (
                <CreateCustomSpellModal
                    onClose={() => setShowCustomSpell(false)}
                    onCreate={addCustomSpell}
                />
            )}
        </>
    );
}
