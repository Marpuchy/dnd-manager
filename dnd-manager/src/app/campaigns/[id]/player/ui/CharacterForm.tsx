// src/app/campaigns/[id]/player/ui/CharacterForm.tsx
"use client";

import React, { FormEvent } from "react";
import { useParams } from "next/navigation";
import { abilityMod, computeMaxHp } from "@/lib/dndMath";
import { formatModifier, proficiencyBonusFromLevel } from "@/lib/ability";
import { getModifierTotal } from "@/lib/character/items";
import {
    getSkillLabel,
    SKILL_DEFINITIONS,
    type SkillDefinition,
} from "@/lib/dnd/skills";
import type { AbilityKey, CustomSubclassEntry, SkillKey } from "@/lib/types/dnd";
import { Mode, Stats, DND_CLASS_OPTIONS } from "../playerShared";
import { InfoBox } from "./InfoBox";
import { StatInput } from "./StatInput";
import { TextField, NumberField, MarkdownField } from "./FormFields";
import ImageCropModal from "@/app/components/ImageCropModal";
import { tr } from "@/lib/i18n/translate";

import { SpellSection } from "../sections/SpellSection";
import ItemManagerSection from "../sections/ItemManagerSection";
import CustomContentManager from "../sections/CustomContentManager";
import type { CharacterFormFields } from "../hooks/useCharacterForm";
import { useClientLocale } from "@/lib/i18n/useClientLocale";

import {
    upsertStats,
    createOrUpdateCharacterRow,
    updateCharacterDetails,
} from "../services/characters.api";
import { inspectError } from "../utils/inspectError";
import { supabase } from "@/lib/supabaseClient";
import { getClassSubclasses, getSubclassName } from "@/lib/dnd/classAbilities";

type CharacterFormProps = {
    mode: Mode;
    onSubmit?: (e: FormEvent) => void;
    onCancel: () => void;
    onSaved?: (characterId: string) => void | Promise<void>;
    fields: CharacterFormFields;
    autoSave?: boolean;
    autoSaveDelayMs?: number;
    ownerOptions?: { id: string; name: string }[];
    characterId?: string | null;
    profileImage?: string | null;
    onImageUpdated?: () => void;
};

export function CharacterForm({
    mode,
    onSubmit,
    onCancel,
    onSaved,
    fields,
    autoSave = false,
    autoSaveDelayMs = 500,
    ownerOptions = [],
    characterId = null,
    profileImage = null,
    onImageUpdated,
}: CharacterFormProps) {
    const params = useParams();
    const routeCampaignId = (params as any)?.id ?? null;
    const locale = useClientLocale();
    const t = (es: string, en: string) => tr(locale, es, en);

    const {
        // Datos básicos
        charName,
        setCharName,
        characterType,
        charClass,
        setCharClass,
        classSubclassId,
        setClassSubclassId,
        charLevel,
        setCharLevel,
        race,
        setRace,
        experience,
        setExperience,
        armorClass,
        setArmorClass,
        speed,
        setSpeed,

        // Vida
        currentHp,
        setCurrentHp,
        hitDieSides,
        setHitDieSides,

        // Stats base
        str,
        setStr,
        dex,
        setDex,
        con,
        setCon,
        intStat,
        setIntStat,
        wis,
        setWis,
        cha,
        setCha,

        // Armaduras
        armors,
        addArmor,
        removeArmor,
        updateArmor,

        // Arma equipada (datos básicos; los modificadores se gestionan en la sección)
        weaponId,
        setWeaponId,
        weaponName,
        setWeaponName,
        weaponDamage,
        setWeaponDamage,
        weaponDescription,
        setWeaponDescription,
        weaponStatAbility,
        setWeaponStatAbility,
        weaponStatModifier,
        setWeaponStatModifier,
        weaponProficient,
        setWeaponProficient,
        weaponEquipped,
        setWeaponEquipped,
        weaponPassiveModifiers,
        setWeaponPassiveModifiers,

        // Texto libre
        inventory,
        setInventory,
        equipment,
        setEquipment,
        abilities,
        setAbilities,
        weaponsExtra,
        setWeaponsExtra,
        notes,
        setNotes,
        portraitNote,
        setPortraitNote,
        background,
        setBackground,
        alignment,
        setAlignment,
        personalityTraits,
        setPersonalityTraits,
        ideals,
        setIdeals,
        bonds,
        setBonds,
        flaws,
        setFlaws,
        appearance,
        setAppearance,
        backstory,
        setBackstory,
        languages,
        setLanguages,
        proficiencies,
        setProficiencies,
        skillProficiencies,
        setSkillProficiencies,
        customSections,
        setCustomSections,
        items,
        setItems,
        customSpells,
        setCustomSpells,
        customCantrips,
        setCustomCantrips,
        customTraits,
        setCustomTraits,
        customClassAbilities,
        setCustomClassAbilities,
        customSubclasses,
        setCustomSubclasses,
        companionOwnerId,
        setCompanionOwnerId,

        // Hechizos por nivel
        spellsL0,
        setSpellsL0,
        spellsL1,
        setSpellsL1,
        spellsL2,
        setSpellsL2,
        spellsL3,
        setSpellsL3,
        spellsL4,
        setSpellsL4,
        spellsL5,
        setSpellsL5,
        spellsL6,
        setSpellsL6,
        spellsL7,
        setSpellsL7,
        spellsL8,
        setSpellsL8,
        spellsL9,
        setSpellsL9,

        // Clase personalizada
        customClassName,
        setCustomClassName,
        customCastingAbility,
        setCustomCastingAbility,

        // Identificadores que venga desde el padre (si editamos)
        characterId: candidateCharacterId,
        id: candidateId,
        charId: candidateCharId,

        // Opcional: campaign id si lo pasas desde el padre
        campaignId: candidateCampaignId,
        campaign_id: candidateCampaign_id,
        campaign: candidateCampaignObj,
    } = fields;

    const incomingCharacterId = candidateCharacterId || candidateId || candidateCharId || null;

    const [cropSrc, setCropSrc] = React.useState<string | null>(null);
    const [cropFileName, setCropFileName] = React.useState<string>("personaje.jpg");

    // Retenemos localmente el id para siguientes guardados
    const [localCharacterId, setLocalCharacterId] = React.useState<string | null | undefined>(incomingCharacterId ?? undefined);
    const resolvedCharacterId = characterId || localCharacterId || incomingCharacterId || null;

    // Bloqueo de envío para evitar dobles llamadas
    const [saving, setSaving] = React.useState(false);
    const [customCreateOpen, setCustomCreateOpen] = React.useState(false);
    const customContentRef = React.useRef<HTMLDivElement | null>(null);
    const [subclassDraftName, setSubclassDraftName] = React.useState("");
    const [subclassDraftUnlock, setSubclassDraftUnlock] = React.useState(3);
    const [isCreatingCustomSubclass, setIsCreatingCustomSubclass] = React.useState(false);
    const CREATE_SUBCLASS_OPTION = "__create_custom_subclass__";
    const autoSaveSkipRef = React.useRef(true);

    // Resolver campaign id (prioridad: fields -> nested -> route)
    const campaignIdFromFields =
        candidateCampaignId ||
        candidateCampaign_id ||
        (candidateCampaignObj && (candidateCampaignObj.id || candidateCampaignObj.campaign_id)) ||
        null;
    const campaignId = campaignIdFromFields || routeCampaignId || null;

    // Debug
    console.debug("CharacterForm init:", { incomingCharacterId, localCharacterId, campaignId });

    const conMod = abilityMod(con);
    const previewMaxHp = computeMaxHp(charLevel, con, hitDieSides);
    const isCustomClass = charClass === "custom";
    const builtInSubclasses = React.useMemo(
        () => getClassSubclasses(charClass, undefined, locale),
        [charClass, locale]
    );
    const customSubclassesSafe = React.useMemo(
        () => (Array.isArray(customSubclasses) ? customSubclasses : []),
        [customSubclasses]
    );
    const customClassSubclasses = React.useMemo(
        () =>
            customSubclassesSafe
                .filter(
                    (subclass) =>
                        typeof subclass?.classId === "string" &&
                        subclass.classId === charClass &&
                        typeof subclass?.name === "string" &&
                        subclass.name.trim().length > 0
                )
                .map((subclass) => ({
                    id: subclass.id,
                    name: subclass.name.trim(),
                    classId: subclass.classId,
                    unlockLevel:
                        Number.isFinite(Number(subclass.unlockLevel)) &&
                        Number(subclass.unlockLevel) > 0
                            ? Number(subclass.unlockLevel)
                            : 3,
                    source: subclass.source || "Personalizada",
                    features: [],
                })),
        [charClass, customSubclassesSafe]
    );
    const availableSubclasses = React.useMemo(() => {
        const merged = [...builtInSubclasses];
        const existingIds = new Set(merged.map((subclass) => subclass.id));
        for (const customSubclass of customClassSubclasses) {
            if (!existingIds.has(customSubclass.id)) {
                merged.push(customSubclass);
            }
        }
        return merged.sort((a, b) => {
            if (a.unlockLevel !== b.unlockLevel) {
                return a.unlockLevel - b.unlockLevel;
            }
            return a.name.localeCompare(b.name);
        });
    }, [builtInSubclasses, customClassSubclasses]);
    const subclassUnlockLevel = availableSubclasses.reduce((minLevel, subclass) => {
        const unlock = Number.isFinite(Number(subclass.unlockLevel))
            ? Number(subclass.unlockLevel)
            : 3;
        return Math.min(minLevel, unlock);
    }, 20);
    const canChooseSubclass = availableSubclasses.some(
        (subclass) => charLevel >= Number(subclass.unlockLevel ?? 3)
    );

    React.useEffect(() => {
        if (!setClassSubclassId) return;
        if (!classSubclassId) return;
        const exists = availableSubclasses.some(
            (subclass) => subclass.id === classSubclassId
        );
        if (!exists) {
            setClassSubclassId("");
        }
    }, [availableSubclasses, classSubclassId, setClassSubclassId]);

    React.useEffect(() => {
        setIsCreatingCustomSubclass(false);
        setSubclassDraftName("");
        setSubclassDraftUnlock(3);
    }, [charClass]);

    const customSectionsSafe = Array.isArray(customSections) ? customSections : [];
    const ownerOptionsSafe = Array.isArray(ownerOptions) ? ownerOptions : [];
    const detailsForMods = React.useMemo(() => ({ items }), [items]);
    const proficiencyBonus =
        proficiencyBonusFromLevel(charLevel) + getModifierTotal(detailsForMods, "PROFICIENCY");

    const autoSaveSignature = React.useMemo(
        () =>
            JSON.stringify({
                charName,
                characterType,
                companionOwnerId,
                charClass,
                classSubclassId,
                charLevel,
                race,
                experience,
                armorClass,
                speed,
                currentHp,
                hitDieSides,
                str,
                dex,
                con,
                intStat,
                wis,
                cha,
                weaponName,
                weaponDamage,
                weaponDescription,
                weaponStatAbility,
                weaponStatModifier,
                weaponProficient,
                weaponEquipped,
                weaponPassiveModifiers,
                inventory,
                equipment,
                abilities,
                weaponsExtra,
                notes,
                portraitNote,
                background,
                alignment,
                personalityTraits,
                ideals,
                bonds,
                flaws,
                appearance,
                backstory,
                languages,
                proficiencies,
                skillProficiencies,
                customSections,
                items,
                customSpells,
                customCantrips,
                customTraits,
                customClassAbilities,
                customSubclasses,
                spellsL0,
                spellsL1,
                spellsL2,
                spellsL3,
                spellsL4,
                spellsL5,
                spellsL6,
                spellsL7,
                spellsL8,
                spellsL9,
                customClassName,
                customCastingAbility,
                armors,
            }),
        [
            charName,
            characterType,
            companionOwnerId,
            charClass,
            classSubclassId,
            charLevel,
            race,
            experience,
            armorClass,
            speed,
            currentHp,
            hitDieSides,
            str,
            dex,
            con,
            intStat,
            wis,
            cha,
            weaponName,
            weaponDamage,
            weaponDescription,
            weaponStatAbility,
            weaponStatModifier,
            weaponProficient,
            weaponEquipped,
            weaponPassiveModifiers,
            inventory,
            equipment,
            abilities,
            weaponsExtra,
            notes,
            portraitNote,
            background,
            alignment,
            personalityTraits,
            ideals,
            bonds,
            flaws,
            appearance,
            backstory,
            languages,
            proficiencies,
            skillProficiencies,
            customSections,
            items,
            customSpells,
            customCantrips,
            customTraits,
            customClassAbilities,
            customSubclasses,
            spellsL0,
            spellsL1,
            spellsL2,
            spellsL3,
            spellsL4,
            spellsL5,
            spellsL6,
            spellsL7,
            spellsL8,
            spellsL9,
            customClassName,
            customCastingAbility,
            armors,
        ]
    );

    React.useEffect(() => {
        autoSaveSkipRef.current = true;
    }, [mode, resolvedCharacterId]);

    React.useEffect(() => {
        if (!autoSave) return;
        if (mode !== "edit") return;
        if (!resolvedCharacterId) return;
        if (!charName.trim()) return;

        if (autoSaveSkipRef.current) {
            autoSaveSkipRef.current = false;
            return;
        }

        const timer = window.setTimeout(() => {
            const form = document.getElementById("character-form") as HTMLFormElement | null;
            form?.requestSubmit();
        }, autoSaveDelayMs);

        return () => {
            window.clearTimeout(timer);
        };
    }, [
        autoSave,
        autoSaveDelayMs,
        mode,
        resolvedCharacterId,
        charName,
        autoSaveSignature,
    ]);
    const abilityTotals: Record<AbilityKey, number> = {
        STR: Number(str) + getModifierTotal(detailsForMods, "STR"),
        DEX: Number(dex) + getModifierTotal(detailsForMods, "DEX"),
        CON: Number(con) + getModifierTotal(detailsForMods, "CON"),
        INT: Number(intStat) + getModifierTotal(detailsForMods, "INT"),
        WIS: Number(wis) + getModifierTotal(detailsForMods, "WIS"),
        CHA: Number(cha) + getModifierTotal(detailsForMods, "CHA"),
    };
    const abilityShort: Record<AbilityKey, string> =
        locale === "en"
            ? {
                  STR: "STR",
                  DEX: "DEX",
                  CON: "CON",
                  INT: "INT",
                  WIS: "WIS",
                  CHA: "CHA",
              }
            : {
                  STR: "FUE",
                  DEX: "DES",
                  CON: "CON",
                  INT: "INT",
                  WIS: "SAB",
                  CHA: "CAR",
              };

    const skillOrder: SkillKey[] = [
        "acrobatics",
        "animalHandling",
        "arcana",
        "athletics",
        "deception",
        "history",
        "insight",
        "intimidation",
        "investigation",
        "medicine",
        "nature",
        "perception",
        "performance",
        "persuasion",
        "religion",
        "sleightOfHand",
        "stealth",
        "survival",
    ];
    const classLabelById: Record<string, { es: string; en: string }> = {
        barbarian: { es: "Barbaro", en: "Barbarian" },
        bard: { es: "Bardo", en: "Bard" },
        cleric: { es: "Clerigo", en: "Cleric" },
        druid: { es: "Druida", en: "Druid" },
        fighter: { es: "Guerrero", en: "Fighter" },
        monk: { es: "Monje", en: "Monk" },
        paladin: { es: "Paladin", en: "Paladin" },
        ranger: { es: "Explorador", en: "Ranger" },
        rogue: { es: "Picaro", en: "Rogue" },
        sorcerer: { es: "Hechicero", en: "Sorcerer" },
        warlock: { es: "Brujo", en: "Warlock" },
        wizard: { es: "Mago", en: "Wizard" },
        artificer: { es: "Artificiero", en: "Artificer" },
        custom: { es: "Clase personalizada", en: "Custom class" },
    };

    const orderedSkills = skillOrder
        .map((key) => SKILL_DEFINITIONS.find((skill) => skill.key === key))
        .filter(Boolean) as SkillDefinition[];

    function getSkillBonusValue(key: SkillKey): number {
        const raw = skillProficiencies?.[key];
        if (raw === true) return 2;
        if (typeof raw === "number") return raw === 2 ? 2 : 1;
        return 0;
    }

    function setSkillBonus(key: SkillKey, value: number) {
        if (!setSkillProficiencies) return;
        const next = { ...(skillProficiencies ?? {}) } as Record<string, number | boolean>;
        if (!value) {
            delete next[key];
        } else {
            next[key] = value === 2 ? 2 : 1;
        }
        setSkillProficiencies(next);
    }

    function getSkillTotal(skill: SkillDefinition) {
        const base = abilityMod(abilityTotals[skill.ability] ?? 10);
        const prof = getSkillBonusValue(skill.key);
        const itemBonus = getModifierTotal(detailsForMods, skill.modifierTarget);
        return base + prof + itemBonus;
    }

    function updateCustomSection(index: number, patch: Partial<{ title: string; content: string }>) {
        if (!setCustomSections) return;
        const next = [...customSectionsSafe];
        const current = next[index];
        if (!current) return;
        next[index] = { ...current, ...patch };
        setCustomSections(next);
    }

    function addCustomSection() {
        if (!setCustomSections) return;
        const next = [
            ...customSectionsSafe,
            {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                title: t("Nueva seccion", "New section"),
                content: "",
            },
        ];
        setCustomSections(next);
    }

    function removeCustomSection(id: string) {
        if (!setCustomSections) return;
        setCustomSections(customSectionsSafe.filter((section) => section.id !== id));
    }

    function openCustomCreator() {
        setCustomCreateOpen(true);
        if (customContentRef.current) {
            requestAnimationFrame(() => {
                customContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        }
    }

    function buildCustomSubclassId(classId: string, name: string): string {
        const slug = name
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 48);
        const safeSlug = slug || "subclass";
        return `custom:${classId}:${safeSlug}:${Date.now()}`;
    }

    function addCustomSubclass() {
        if (!setCustomSubclasses) return;
        const classId = charClass?.trim();
        const name = subclassDraftName.trim();
        if (!classId || !name) return;

        const unlockLevel = Math.max(1, Math.min(20, Number(subclassDraftUnlock) || 3));
        const nextEntry: CustomSubclassEntry = {
            id: buildCustomSubclassId(classId, name),
            classId,
            name,
            unlockLevel,
            source: "Personalizada",
        };

        const list = Array.isArray(customSubclasses) ? customSubclasses : [];
        const duplicated = list.some(
            (subclass) =>
                subclass.classId === classId &&
                subclass.name.trim().toLowerCase() === name.toLowerCase()
        );
        if (duplicated) return;

        const next = [...list, nextEntry];
        setCustomSubclasses(next);
        setClassSubclassId?.(nextEntry.id);
        setSubclassDraftName("");
        setSubclassDraftUnlock(3);
        setIsCreatingCustomSubclass(false);
    }

    function removeCustomSubclass(id: string) {
        if (!setCustomSubclasses) return;
        const list = Array.isArray(customSubclasses) ? customSubclasses : [];
        const next = list.filter((subclass) => subclass.id !== id);
        setCustomSubclasses(next);
        if (classSubclassId === id) {
            setClassSubclassId?.("");
        }
    }

    function handleSubclassChange(nextValue: string) {
        if (nextValue === CREATE_SUBCLASS_OPTION) {
            setIsCreatingCustomSubclass(true);
            setClassSubclassId?.("");
            return;
        }
        setIsCreatingCustomSubclass(false);
        setClassSubclassId?.(nextValue);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        // NEW: if parent provided onSubmit, delegate and don't run internal persistence to avoid double-create
        if (typeof onSubmit === "function") {
            try {
                // Call parent handler in a typesafe way
                (onSubmit as ((ev: FormEvent) => void) | undefined)?.(e);
            } catch (err) {
                console.error("Error delegating onSubmit to parent:", err);
            }
            return;
        }

        if (saving) {
            console.debug("handleSubmit: already saving — ignoring duplicate submit");
            return;
        }
        setSaving(true);

        try {
            // session / user
            const { data: sessData, error: sessErr } = await supabase.auth.getSession();
            if (sessErr) {
                console.error("Error obteniendo sesión:", inspectError(sessErr));
                alert(
                    `${t("Error obteniendo sesion", "Error fetching session")}: ${inspectError(sessErr)}`
                );
                setSaving(false);
                return;
            }
            const session = (sessData as any)?.session ?? null;
            const userId = session?.user?.id ?? null;
            if (!userId) {
                alert(
                    t(
                        "No estas autenticado. Ve al login antes de guardar un personaje.",
                        "You are not authenticated. Login before saving a character."
                    )
                );
                setSaving(false);
                return;
            }

            if (!campaignId) {
                const msg = t(
                    "No se resolvio campaign_id. Pasa campaignId en fields o usa la ruta /campaigns/[id]/player.",
                    "campaign_id was not resolved. Pass campaignId in fields or use /campaigns/[id]/player."
                );
                console.error(msg);
                alert(msg);
                setSaving(false);
                return;
            }

            // 1) create or update characters row
            const isExistingCharacter = Boolean(localCharacterId ?? incomingCharacterId);
            const statsPayload = {
                str: Number(str ?? 8),
                dex: Number(dex ?? 8),
                con: Number(con ?? 8),
                int: Number(intStat ?? 8),
                wis: Number(wis ?? 8),
                cha: Number(cha ?? 8),
            };
            const basePayload: Record<string, any> = {
                campaign_id: campaignId,
                character_type: characterType ?? "character",
                name: charName ?? null,
                class: charClass ?? null,
                level: Number(charLevel ?? 1),
                race: race ?? null,
                experience: Number(experience ?? 0),
                armor_class: armorClass !== undefined && armorClass !== null ? Number(armorClass) : null,
                speed: speed !== undefined && speed !== null ? Number(speed) : null,
                max_hp: previewMaxHp !== undefined && previewMaxHp !== null ? Number(previewMaxHp) : null,
                current_hp: currentHp !== undefined && currentHp !== null ? Number(currentHp) : null,
                stats: statsPayload,
                details: {} // actualizaremos después
            };
            if (!isExistingCharacter) {
                basePayload.user_id = userId ?? null;
            }

            try {
                const charRes = await createOrUpdateCharacterRow(localCharacterId ?? null, userId, campaignId, basePayload);
                console.debug("createOrUpdateCharacterRow response (raw):", charRes);

                if ((charRes as any).error) {
                    console.error("Error en createOrUpdateCharacterRow:", inspectError((charRes as any).error));
                    alert(
                        `${t("Error al crear/actualizar personaje", "Error creating/updating character")}: ${inspectError((charRes as any).error)}`
                    );
                    setSaving(false);
                    return;
                }

                // Extract id from response or fallback to local/incoming
                let cid: string | null = null;
                if ((charRes as any).data) {
                    const d = (charRes as any).data;
                    cid = Array.isArray(d) ? (d[0]?.id ?? null) : (d?.id ?? null);
                }
                if (!cid && (localCharacterId || incomingCharacterId)) {
                    cid = localCharacterId ?? incomingCharacterId ?? null;
                }

                if (!cid) {
                    console.error("createOrUpdateCharacterRow no devolvió id y no tenemos fallback. Respuesta:", charRes);
                    alert(
                        t(
                            "Error: no se obtuvo id del personaje. Revisa consola (posible RLS).",
                            "Error: character id was not returned. Check console (possible RLS)."
                        )
                    );
                    setSaving(false);
                    return;
                }

                // Persist local id so next saves are UPDATE
                setLocalCharacterId(cid);
                console.debug("Local character id set:", cid);

                // Notify parent if setter exists (typesafe call)
                try {
                    const maybeSetter = (fields as unknown as { setCharacterId?: (id: string) => void }).setCharacterId;
                    maybeSetter?.(cid);
                } catch (err) {
                    console.debug("No se pudo notificar setCharacterId al padre (no existe o falló).", err);
                }

                // 2) upsert stats
                const statsRes = await upsertStats(cid, statsPayload);
                if ((statsRes as any).error) {
                    // Non-blocking: characters.stats already persisted in basePayload.
                    console.warn(
                        "upsertStats failed; continuing with characters.stats as source of truth:",
                        inspectError((statsRes as any).error)
                    );
                }

                // 3) update details JSON (items + contenido personalizado)
                const orderedItems = Array.isArray(items)
                    ? items.map((item, index) => ({ ...item, sortOrder: index }))
                    : [];
                const resolvedSubclassId = classSubclassId?.trim() || null;
                const resolvedCustomSubclass = resolvedSubclassId
                    ? (customSubclassesSafe.find(
                          (subclass) => subclass.id === resolvedSubclassId
                      ) ?? null)
                    : null;
                const resolvedSubclassName = resolvedSubclassId
                    ? getSubclassName(charClass, resolvedSubclassId, locale) ??
                      resolvedCustomSubclass?.name ??
                      null
                    : null;

                const detailsPatch: any = {
                    abilities: abilities ?? null,
                    notes: notes ?? null,
                    portraitNote: portraitNote ?? null,
                    armors: Array.isArray(armors) ? armors : [],
                    weaponEquipped:
                        weaponName ||
                        weaponDamage ||
                        weaponDescription ||
                        weaponStatAbility !== "none" ||
                        weaponStatModifier != null ||
                        (weaponPassiveModifiers?.length ?? 0) > 0
                            ? {
                                name: weaponName?.trim() || "Arma",
                                damage: weaponDamage?.trim() || undefined,
                                description: weaponDescription?.trim() || undefined,
                                statAbility:
                                    weaponStatAbility !== "none"
                                        ? weaponStatAbility
                                        : undefined,
                                statModifier: weaponStatModifier ?? undefined,
                                isProficient: !!weaponProficient,
                                equipped: weaponEquipped !== false,
                                modifiers:
                                    (weaponPassiveModifiers?.length ?? 0) > 0
                                        ? (weaponPassiveModifiers ?? []).map((mod) => ({
                                            ability: mod.ability,
                                            modifier: mod.value,
                                            note: mod.note,
                                        }))
                                        : undefined,
                            }
                            : null,
                    background: background ?? null,
                    alignment: alignment ?? null,
                    personalityTraits: personalityTraits ?? null,
                    ideals: ideals ?? null,
                    bonds: bonds ?? null,
                    flaws: flaws ?? null,
                    appearance: appearance ?? null,
                    backstory: backstory ?? null,
                    languages: languages ?? null,
                    proficiencies: proficiencies ?? null,
                    skillProficiencies: skillProficiencies ?? null,
                    customSections: customSectionsSafe ?? null,
                    items: orderedItems,
                    customSpells: Array.isArray(customSpells) ? customSpells : [],
                    customCantrips: Array.isArray(customCantrips) ? customCantrips : [],
                    customTraits: Array.isArray(customTraits) ? customTraits : [],
                    customClassAbilities: Array.isArray(customClassAbilities)
                        ? customClassAbilities
                        : [],
                    classSubclassId: resolvedSubclassId,
                    classSubclassName: resolvedSubclassName,
                    customSubclasses:
                        customSubclassesSafe.length > 0
                            ? customSubclassesSafe
                            : null,
                    spells: {
                        level0: spellsL0 ?? null,
                        level1: spellsL1 ?? null,
                        level2: spellsL2 ?? null,
                        level3: spellsL3 ?? null,
                        level4: spellsL4 ?? null,
                        level5: spellsL5 ?? null,
                        level6: spellsL6 ?? null,
                        level7: spellsL7 ?? null,
                        level8: spellsL8 ?? null,
                        level9: spellsL9 ?? null,
                    },
                    customClassName: customClassName ?? null,
                    customCastingAbility: customCastingAbility ?? null,
                };

                if (characterType === "companion") {
                    detailsPatch.companionOwnerId = companionOwnerId ?? null;
                } else {
                    detailsPatch.companionOwnerId = null;
                }

                const { data: detailsData, error: detailsErr } = await updateCharacterDetails(cid, detailsPatch);
                if (detailsErr) {
                    console.error("Error actualizando details:", inspectError(detailsErr));
                    alert(
                        `${t("Error al actualizar detalles del personaje", "Error updating character details")}: ${inspectError(detailsErr)}`
                    );
                    setSaving(false);
                    return;
                }

                console.log("Personaje guardado correctamente", { characterId: cid });
                if (typeof onSaved === "function") {
                    try {
                        await onSaved(cid);
                    } catch (savedErr) {
                        console.warn("onSaved callback failed:", savedErr);
                    }
                }

                // final: if parent provided onSubmit we already delegated earlier; still call if present
                if (typeof onSubmit === "function") {
                    try {
                        (onSubmit as ((ev: FormEvent) => void) | undefined)?.(e);
                    } catch {}
                }
            } catch (err) {
                console.error("Error during persistence flow:", err);
                throw err;
            }
        } catch (err: any) {
            console.error("Unhandled error en handleSubmit:", inspectError(err), err);
            alert(
                `${t("Error inesperado al guardar personaje", "Unexpected error saving character")}: ${inspectError(err)}`
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleSaveCroppedImage(blob: Blob) {
        if (!resolvedCharacterId) {
            alert(
                t(
                    "Guarda el personaje antes de subir una imagen.",
                    "Save the character before uploading an image."
                )
            );
            return;
        }

        const formData = new FormData();
        formData.append("file", blob, cropFileName);
        formData.append("characterId", resolvedCharacterId);

        const res = await fetch("/api/dnd/characters/upload-image", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            console.error("Error subiendo imagen");
            alert(t("No se pudo subir la imagen.", "Could not upload the image."));
            return;
        }

        setCropSrc(null);
        onImageUpdated?.();
    }

    function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!resolvedCharacterId) {
            alert(
                t(
                    "Guarda el personaje antes de subir una imagen.",
                    "Save the character before uploading an image."
                )
            );
            e.target.value = "";
            return;
        }

        setCropFileName(file.name || "personaje.jpg");
        const reader = new FileReader();
        reader.onload = () => {
            setCropSrc(reader.result as string);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    }

    /* ---------------------------
       render (mantengo tu UI)
    --------------------------- */

    return (
        <div className="border border-ring bg-panel/80 rounded-xl p-[var(--panel-pad)] space-y-[var(--panel-gap)] min-w-0 overflow-x-hidden">
            {cropSrc && (
                <ImageCropModal
                    src={cropSrc}
                    aspect={3 / 4}
                    onClose={() => setCropSrc(null)}
                    onSave={handleSaveCroppedImage}
                />
            )}
            {/* Header */}
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div />
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-xs px-3 py-1 rounded-md border border-ring hover:bg-white/80"
                    >
                        {t("Cancelar", "Cancel")}
                    </button>
                    <button
                        type="submit"
                        form="character-form"
                        disabled={saving}
                        className="text-xs px-3 py-1 rounded-md border border-accent/60 bg-accent/10 hover:bg-accent/20 disabled:opacity-50"
                    >
                        {mode === "edit"
                            ? saving
                                ? t("Guardando...", "Saving...")
                                : t("Guardar cambios", "Save changes")
                            : saving
                              ? t("Creando...", "Creating...")
                              : t("Crear personaje", "Create character")}
                    </button>
                </div>
            </header>

            <form id="character-form" onSubmit={handleSubmit} className="space-y-6 min-w-0">
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-ink">
                        {t("Imagen y datos basicos", "Image and basics")}
                    </h3>
                    <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)] gap-4 items-start">
                        <div className="space-y-3">
                            <div className="rounded-xl border border-ring bg-white/70 p-2 space-y-2">
                                <div className="w-full max-w-[190px] sm:max-w-[220px] mx-auto aspect-[4/5] rounded-xl overflow-hidden bg-white/70 border border-ring">
                                    {profileImage?.startsWith("http") ? (
                                        <img
                                            src={profileImage}
                                            alt={t("Imagen del personaje", "Character image")}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted">
                                            {t("Sin imagen", "No image")}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-ink-muted">
                                    {t(
                                        "Ajusta y sube la imagen desde el editor.",
                                        "Adjust and upload the image from the editor."
                                    )}
                                </p>
                                <label className="inline-flex text-xs cursor-pointer text-accent-strong hover:underline">
                                    {t("Cambiar imagen", "Change image")}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={handleImageUpload}
                                    />
                                </label>
                                {!resolvedCharacterId && (
                                    <p className="text-[11px] text-ink-muted">
                                        {t(
                                            "Guarda el personaje para poder subir imagen.",
                                            "Save the character before uploading an image."
                                        )}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-ink-muted">
                                    {t("Nota bajo imagen", "Note under image")}
                                </label>
                                <textarea
                                    value={portraitNote ?? ""}
                                    onChange={(event) => setPortraitNote?.(event.target.value)}
                                    rows={3}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                    placeholder={t(
                                        "Titulo, lema o nota personal...",
                                        "Title, motto, or personal note..."
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <TextField
                                    label={t("Nombre", "Name")}
                                    value={charName}
                                    onChange={setCharName}
                                    required
                                />

                                <div className="flex flex-col gap-1 text-sm">
                                    <label className="text-sm text-ink">{t("Clase", "Class")}</label>
                                    <select
                                        value={charClass}
                                        onChange={(e) => setCharClass(e.target.value)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm outline-none focus:border-accent"
                                    >
                                        <option value="">{t("Sin clase", "No class")}</option>
                                        {DND_CLASS_OPTIONS.map((c: any) => (
                                            <option key={c.id} value={c.id}>
                                                {classLabelById[c.id]
                                                    ? t(
                                                          classLabelById[c.id].es,
                                                          classLabelById[c.id].en
                                                      )
                                                    : c.label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[11px] text-ink-muted">
                                        {t(
                                            "Se usa para calcular espacios de conjuro y cargar habilidades.",
                                            "Used to calculate spell slots and class features."
                                        )}
                                    </p>
                                </div>

                                {charClass && (
                                    <div className="space-y-2 md:col-span-2">
                                        <div className="min-w-0">
                                            <label className="text-sm text-ink">
                                                {t("Subclase / Circulo", "Subclass / Circle")}
                                            </label>
                                            <p className="text-[11px] text-ink-muted">
                                                {canChooseSubclass
                                                    ? t(
                                                          "Se aplican sus rasgos por nivel automaticamente.",
                                                          "Its features are applied automatically by level."
                                                      )
                                                    : t(
                                                          `Disponible a partir del nivel ${subclassUnlockLevel}.`,
                                                          `Available from level ${subclassUnlockLevel}.`
                                                      )}
                                            </p>
                                        </div>

                                        <select
                                            value={
                                                isCreatingCustomSubclass
                                                    ? CREATE_SUBCLASS_OPTION
                                                    : classSubclassId ?? ""
                                            }
                                            onChange={(e) => handleSubclassChange(e.target.value)}
                                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm outline-none focus:border-accent"
                                        >
                                            <option value="">{t("Sin subclase", "No subclass")}</option>
                                            <option value={CREATE_SUBCLASS_OPTION}>
                                                {t(
                                                    "Subclase personalizada...",
                                                    "Custom subclass..."
                                                )}
                                            </option>
                                            {availableSubclasses.map((subclass) => {
                                                const unlockLevel = Number(subclass.unlockLevel ?? 3);
                                                const locked = charLevel < unlockLevel;
                                                const isCustomSubclass = subclass.id.startsWith("custom:");
                                                const lockSuffix = locked
                                                    ? t(
                                                          ` (nivel ${unlockLevel})`,
                                                          ` (level ${unlockLevel})`
                                                      )
                                                    : "";
                                                const customSuffix = isCustomSubclass
                                                    ? t(" [personalizada]", " [custom]")
                                                    : "";
                                                return (
                                                    <option
                                                        key={subclass.id}
                                                        value={subclass.id}
                                                        disabled={locked}
                                                    >
                                                        {`${subclass.name}${customSuffix}${lockSuffix}`}
                                                    </option>
                                                );
                                            })}
                                        </select>

                                        {isCreatingCustomSubclass && (
                                            <div className="rounded-lg border border-ring bg-panel/80 p-3 space-y-2">
                                                <p className="text-[11px] text-ink-muted">
                                                    {t(
                                                        "Crear subclase personalizada",
                                                        "Create custom subclass"
                                                    )}
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_160px_auto] gap-2 items-end">
                                                    <div className="space-y-1">
                                                        <label className="text-[11px] text-ink-muted">
                                                            {t("Nombre de subclase", "Subclass name")}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={subclassDraftName}
                                                            onChange={(event) =>
                                                                setSubclassDraftName(event.target.value)
                                                            }
                                                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm outline-none focus:border-accent"
                                                            placeholder={t(
                                                                "Ej. Juramento de la Tormenta",
                                                                "e.g. Oath of Storms"
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[11px] text-ink-muted">
                                                            {t("Nivel de desbloqueo", "Unlock level")}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={20}
                                                            value={subclassDraftUnlock}
                                                            onChange={(event) =>
                                                                setSubclassDraftUnlock(
                                                                    Number(event.target.value) || 1
                                                                )
                                                            }
                                                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm outline-none focus:border-accent"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={addCustomSubclass}
                                                            disabled={!subclassDraftName.trim()}
                                                            className="text-[11px] px-3 py-2 rounded-md border border-accent/60 bg-accent/10 hover:bg-accent/20"
                                                        >
                                                            {t("Crear subclase", "Create subclass")}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsCreatingCustomSubclass(false);
                                                                setSubclassDraftName("");
                                                                setSubclassDraftUnlock(3);
                                                            }}
                                                            className="text-[11px] px-3 py-2 rounded-md border border-ring bg-white/70 hover:bg-white"
                                                        >
                                                            {t("Cancelar", "Cancel")}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {customClassSubclasses.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {customClassSubclasses.map((subclass) => (
                                                    <span
                                                        key={subclass.id}
                                                        className="inline-flex items-center gap-2 rounded-full border border-ring bg-white/80 px-2 py-1 text-[11px] text-ink"
                                                    >
                                                        {subclass.name}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeCustomSubclass(subclass.id)
                                                            }
                                                            className="text-red-600 hover:text-red-500"
                                                        >
                                                            {t("Eliminar", "Delete")}
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <TextField
                                    label={t("Raza / Origen", "Race / Origin")}
                                    value={race}
                                    onChange={setRace}
                                />

                                {characterType === "companion" && (
                                    <div className="flex flex-col gap-1 text-sm">
                                        <label className="text-sm text-ink">
                                            {t("Dueno", "Owner")}
                                        </label>
                                        <select
                                            value={companionOwnerId ?? ""}
                                            onChange={(e) => setCompanionOwnerId?.(e.target.value)}
                                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm outline-none focus:border-accent"
                                            required
                                        >
                                            <option value="">
                                                {t("Selecciona dueno", "Select owner")}
                                            </option>
                                            {ownerOptionsSafe.map((owner) => (
                                                <option key={owner.id} value={owner.id}>
                                                    {owner.name}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[11px] text-ink-muted">
                                            {t(
                                                "El companero debe estar asignado a un personaje de la campana.",
                                                "The companion must be assigned to a campaign character."
                                            )}
                                        </p>
                                        {ownerOptionsSafe.length === 0 && (
                                            <p className="text-[11px] text-red-700">
                                                {t(
                                                    "No hay personajes disponibles. Crea un personaje primero.",
                                                    "No characters available. Create one first."
                                                )}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {isCustomClass && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-ring rounded-lg p-3 bg-panel/80">
                                    <TextField
                                        label={t(
                                            "Nombre de la clase personalizada",
                                            "Custom class name"
                                        )}
                                        value={customClassName}
                                        onChange={setCustomClassName}
                                    />
                                    <div className="space-y-1">
                                        <label className="text-sm text-ink">
                                            {t("Caracteristica de conjuro", "Spellcasting ability")}
                                        </label>
                                        <select
                                            value={customCastingAbility}
                                            onChange={(e) => setCustomCastingAbility(e.target.value as keyof Stats)}
                                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm outline-none focus:border-accent"
                                        >
                                            <option value="int">
                                                {t("Inteligencia (INT)", "Intelligence (INT)")}
                                            </option>
                                            <option value="wis">
                                                {t("Sabiduria (SAB)", "Wisdom (WIS)")}
                                            </option>
                                            <option value="cha">
                                                {t("Carisma (CAR)", "Charisma (CHA)")}
                                            </option>
                                            <option value="str">
                                                {t("Fuerza (FUE)", "Strength (STR)")}
                                            </option>
                                            <option value="dex">
                                                {t("Destreza (DES)", "Dexterity (DEX)")}
                                            </option>
                                            <option value="con">
                                                {t("Constitucion (CON)", "Constitution (CON)")}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <NumberField
                                    label={t("Nivel", "Level")}
                                    value={charLevel}
                                    onChange={setCharLevel}
                                    min={1}
                                    max={20}
                                />
                                <NumberField
                                    label={t("Experiencia (XP)", "Experience (XP)")}
                                    value={experience}
                                    onChange={setExperience}
                                    min={0}
                                />
                                <NumberField
                                    label={t("CA base", "Base AC")}
                                    value={armorClass}
                                    onChange={setArmorClass}
                                    min={0}
                                />
                                <NumberField
                                    label={t("Velocidad (ft)", "Speed (ft)")}
                                    value={speed}
                                    onChange={setSpeed}
                                    min={0}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-sm text-ink">
                                        {t("Dado de golpe por nivel", "Hit die per level")}
                                    </label>
                                    <select
                                        value={hitDieSides}
                                        onChange={(e) => setHitDieSides(Number(e.target.value) || 8)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm outline-none focus:border-accent"
                                    >
                                        <option value={6}>d6</option>
                                        <option value={8}>d8</option>
                                        <option value={10}>d10</option>
                                        <option value={12}>d12</option>
                                    </select>
                                </div>

                                <NumberField
                                    label={t("Vida actual", "Current hit points")}
                                    value={currentHp}
                                    onChange={setCurrentHp}
                                    min={0}
                                />

                                <InfoBox
                                    label={t("Vida maxima (calculada)", "Max hit points (calculated)")}
                                    value={previewMaxHp}
                                    sub={t(
                                        `(${hitDieSides} x nivel) + ${conMod >= 0 ? `+${conMod}` : conMod}`,
                                        `(${hitDieSides} x level) + ${conMod >= 0 ? `+${conMod}` : conMod}`
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats base */}
                <section className="space-y-2">
                    <h3 className="text-sm font-semibold text-ink">
                        {t("Atributos (stats)", "Attributes (stats)")}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        <StatInput
                            label={t("FUE (STR)", "STR")}
                            value={str}
                            onChange={setStr}
                        />
                        <StatInput
                            label={t("DES (DEX)", "DEX")}
                            value={dex}
                            onChange={setDex}
                        />
                        <StatInput label="CON" value={con} onChange={setCon} />
                        <StatInput label="INT" value={intStat} onChange={setIntStat} />
                        <StatInput
                            label={t("SAB (WIS)", "WIS")}
                            value={wis}
                            onChange={setWis}
                        />
                        <StatInput
                            label={t("CAR (CHA)", "CHA")}
                            value={cha}
                            onChange={setCha}
                        />
                    </div>
                </section>

                <section className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-ink">
                            {t("Habilidades (skills)", "Skills")}
                        </h3>
                        <span className="text-[11px] text-ink-muted">
                            {t("Elige +1 o +2 por habilidad", "Choose +1 or +2 per skill")}
                        </span>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                        {orderedSkills.map((skill) => {
                            const bonus = getSkillBonusValue(skill.key);
                            const total = getSkillTotal(skill);
                            return (
                                <div
                                    key={skill.key}
                                    className="flex items-center justify-between rounded-lg border border-ring bg-white/80 px-3 py-2 text-xs text-ink"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {getSkillLabel(skill, locale)}
                                        </span>
                                        <span className="text-[10px] text-ink-muted">
                                            ({abilityShort[skill.ability]})
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={bonus}
                                            onChange={(event) =>
                                                setSkillBonus(skill.key, Number(event.target.value))
                                            }
                                            className="rounded-md border border-ring bg-white/90 px-2 py-1 text-[11px] text-ink"
                                        >
                                            <option value={0}>—</option>
                                            <option value={1}>+1</option>
                                            <option value={2}>+2</option>
                                        </select>
                                        <span className="font-mono text-ink">
                                            {formatModifier(total)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Inventario y equipamiento */}
                <ItemManagerSection items={items} setItems={setItems} />

                <div ref={customContentRef}>
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
                        subclassOptions={availableSubclasses.map((subclass) => ({
                            id: subclass.id,
                            name: subclass.name,
                        }))}
                        createOpen={customCreateOpen}
                        onToggleCreate={setCustomCreateOpen}
                    />
                </div>

                {/* Conjuros (chips + buscador) */}
                <SpellSection
                    charClass={charClass}
                    charLevel={charLevel}
                    spellsL0={spellsL0}
                    setSpellsL0={setSpellsL0}
                    spellsL1={spellsL1}
                    setSpellsL1={setSpellsL1}
                    spellsL2={spellsL2}
                    setSpellsL2={setSpellsL2}
                    spellsL3={spellsL3}
                    setSpellsL3={setSpellsL3}
                    spellsL4={spellsL4}
                    setSpellsL4={setSpellsL4}
                    spellsL5={spellsL5}
                    setSpellsL5={setSpellsL5}
                    spellsL6={spellsL6}
                    setSpellsL6={setSpellsL6}
                    spellsL7={spellsL7}
                    setSpellsL7={setSpellsL7}
                    spellsL8={spellsL8}
                    setSpellsL8={setSpellsL8}
                    spellsL9={spellsL9}
                    setSpellsL9={setSpellsL9}
                    onOpenCustomCreate={openCustomCreator}
                />

                {/* Perfil y notas */}
                <section className="space-y-3">
                    <details className="rounded-2xl border border-ring bg-panel/80 p-3">
                        <summary className="cursor-pointer text-sm font-semibold text-ink">
                            {t("Notas y rasgos libres", "Notes and free traits")}
                        </summary>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <MarkdownField
                                label={t("Rasgos adicionales", "Additional traits")}
                                value={abilities}
                                onChange={setAbilities}
                                helper={t("Markdown soportado.", "Markdown supported.")}
                            />
                            <MarkdownField
                                label={t("Notas generales", "General notes")}
                                value={notes}
                                onChange={setNotes}
                                helper={t(
                                    "Anotaciones libres del personaje.",
                                    "Free-form character notes."
                                )}
                            />
                        </div>
                    </details>
                </section>

                <section className="space-y-3">
                    <details className="rounded-2xl border border-ring bg-panel/80 p-3">
                        <summary className="cursor-pointer text-sm font-semibold text-ink">
                            {t("Perfil y trasfondo", "Profile and backstory")}
                        </summary>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextField
                                label={t("Trasfondo", "Background")}
                                value={background ?? ""}
                                onChange={setBackground ?? (() => {})}
                            />
                            <TextField
                                label={t("Alineamiento", "Alignment")}
                                value={alignment ?? ""}
                                onChange={setAlignment ?? (() => {})}
                            />
                            <MarkdownField
                                label={t("Rasgos de personalidad", "Personality traits")}
                                value={personalityTraits ?? ""}
                                onChange={setPersonalityTraits ?? (() => {})}
                            />
                            <MarkdownField
                                label={t("Ideales", "Ideals")}
                                value={ideals ?? ""}
                                onChange={setIdeals ?? (() => {})}
                            />
                            <MarkdownField
                                label={t("Vinculos", "Bonds")}
                                value={bonds ?? ""}
                                onChange={setBonds ?? (() => {})}
                            />
                            <MarkdownField
                                label={t("Defectos", "Flaws")}
                                value={flaws ?? ""}
                                onChange={setFlaws ?? (() => {})}
                            />
                            <MarkdownField
                                label={t("Apariencia", "Appearance")}
                                value={appearance ?? ""}
                                onChange={setAppearance ?? (() => {})}
                                helper={t(
                                    "Descripcion fisica, rasgos visibles, marcas, etc.",
                                    "Physical description, visible features, marks, etc."
                                )}
                            />
                            <MarkdownField
                                label={t("Historia / Backstory", "History / Backstory")}
                                value={backstory ?? ""}
                                onChange={setBackstory ?? (() => {})}
                                helper={t(
                                    "Contexto del personaje, motivaciones, eventos clave.",
                                    "Character context, motivations, key events."
                                )}
                                rows={6}
                            />
                            <MarkdownField
                                label={t("Idiomas", "Languages")}
                                value={languages ?? ""}
                                onChange={setLanguages ?? (() => {})}
                                helper={t("Lista de idiomas conocidos.", "Known languages list.")}
                            />
                            <MarkdownField
                                label={t("Competencias", "Proficiencies")}
                                value={proficiencies ?? ""}
                                onChange={setProficiencies ?? (() => {})}
                                helper={t(
                                    "Armas, herramientas, armaduras, etc.",
                                    "Weapons, tools, armor, etc."
                                )}
                            />
                        </div>
                    </details>
                </section>

                <section className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-ink">
                            {t("Secciones personalizadas", "Custom sections")}
                        </h3>
                        <button
                            type="button"
                            onClick={addCustomSection}
                            className="text-[11px] px-3 py-1 rounded-md border border-emerald-400/70 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        >
                            {t("Anadir seccion", "Add section")}
                        </button>
                    </div>

                    {customSectionsSafe.length === 0 ? (
                        <p className="text-xs text-ink-muted">
                            {t(
                                "Aun no has creado secciones personalizadas.",
                                "You have not created custom sections yet."
                            )}
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {customSectionsSafe.map((section, index) => (
                                <div key={section.id} className="rounded-lg border border-ring bg-panel/80 p-3 space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <TextField
                                            label={t("Titulo", "Title")}
                                            value={section.title}
                                            onChange={(value) => updateCustomSection(index, { title: value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeCustomSection(section.id)}
                                            className="text-[11px] px-3 py-1 rounded-md border border-red-400/70 text-red-600 bg-red-50 hover:bg-red-100"
                                        >
                                            {t("Eliminar", "Delete")}
                                        </button>
                                    </div>
                                    <MarkdownField
                                        label={t("Contenido", "Content")}
                                        value={section.content}
                                        onChange={(value) => updateCustomSection(index, { content: value })}
                                        helper={t("Markdown soportado.", "Markdown supported.")}
                                        rows={5}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <div className="flex justify-end pt-1">
                    <button type="submit" className="rounded-md bg-accent hover:bg-accent-strong px-4 py-2 text-sm font-medium" disabled={saving}>
                        {saving
                            ? mode === "edit"
                                ? t("Guardando...", "Saving...")
                                : t("Creando...", "Creating...")
                            : mode === "edit"
                              ? t("Guardar personaje", "Save character")
                              : t("Crear personaje", "Create character")}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CharacterForm;


