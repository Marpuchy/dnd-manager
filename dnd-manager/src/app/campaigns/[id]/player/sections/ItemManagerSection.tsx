"use client";

import React, { useMemo, useState } from "react";
import type {
    AbilityKey,
    AbilityResourceCost,
    CharacterItem,
    ItemConfiguration,
    ItemAttachmentEntry,
    ItemCategory,
    ItemModifier,
    SpellCastingTime,
    SpellComponentSet,
    SpellDamageConfig,
    SpellResourceCost,
    SpellSaveConfig,
} from "@/lib/types/dnd";
import {
    MODIFIER_TARGETS,
    buildItemBase,
    getLocalizedText,
    normalizeLocalizedText,
    normalizeTarget,
} from "@/lib/character/items";
import {
    formatItemAttachmentMarkdown,
    getItemAttachmentTypeLabel,
} from "@/lib/character/itemAttachments";
import Markdown from "@/app/components/Markdown";
import { useClientLocale } from "@/lib/i18n/useClientLocale";
import { tr } from "@/lib/i18n/translate";

const CATEGORY_LABELS: Record<ItemCategory, { es: string; en: string }> = {
    weapon: { es: "Arma", en: "Weapon" },
    armor: { es: "Armadura", en: "Armor" },
    accessory: { es: "Accesorio", en: "Accessory" },
    consumable: { es: "Consumible", en: "Consumable" },
    tool: { es: "Herramienta", en: "Tool" },
    misc: { es: "Miscelaneo", en: "Misc" },
};

const ATTACHMENT_TYPE_OPTIONS: Array<{
    value: ItemAttachmentEntry["type"];
    es: string;
    en: string;
}> = [
    { value: "action", es: "Accion", en: "Action" },
    { value: "ability", es: "Habilidad", en: "Ability" },
    { value: "trait", es: "Rasgo", en: "Trait" },
    { value: "spell", es: "Hechizo", en: "Spell" },
    { value: "cantrip", es: "Truco", en: "Cantrip" },
    { value: "classFeature", es: "Rasgo de clase", en: "Class feature" },
    { value: "other", es: "Otro", en: "Other" },
];

const SPELL_SCHOOLS = [
    "Abjuracion",
    "Adivinacion",
    "Conjuracion",
    "Encantamiento",
    "Evocacion",
    "Ilusion",
    "Nigromancia",
    "Transmutacion",
];

const CASTING_TIME_OPTIONS = [
    { es: "Accion", en: "Action" },
    { es: "Accion adicional", en: "Bonus action" },
    { es: "Reaccion", en: "Reaction" },
    { es: "1 minuto", en: "1 minute" },
    { es: "10 minutos", en: "10 minutes" },
    { es: "1 hora", en: "1 hour" },
    { es: "Especial", en: "Special" },
];

const SAVE_ABILITIES: { value: AbilityKey; es: string; en: string }[] = [
    { value: "STR", es: "Fuerza (STR)", en: "Strength (STR)" },
    { value: "DEX", es: "Destreza (DEX)", en: "Dexterity (DEX)" },
    { value: "CON", es: "Constitucion (CON)", en: "Constitution (CON)" },
    { value: "INT", es: "Inteligencia (INT)", en: "Intelligence (INT)" },
    { value: "WIS", es: "Sabiduria (WIS)", en: "Wisdom (WIS)" },
    { value: "CHA", es: "Carisma (CHA)", en: "Charisma (CHA)" },
];

const ATTACHMENT_ACTION_TYPES: Array<{
    value: NonNullable<ItemAttachmentEntry["actionType"]>;
    es: string;
    en: string;
}> = [
    { value: "action", es: "Accion", en: "Action" },
    { value: "bonus", es: "Accion bonus", en: "Bonus action" },
    { value: "reaction", es: "Reaccion", en: "Reaction" },
    { value: "passive", es: "Pasiva", en: "Passive" },
];

const TARGET_LABEL_EN: Record<string, string> = {
    STR: "Strength (STR)",
    DEX: "Dexterity (DEX)",
    CON: "Constitution (CON)",
    INT: "Intelligence (INT)",
    WIS: "Wisdom (WIS)",
    CHA: "Charisma (CHA)",
    AC: "Armor class (AC)",
    HP_MAX: "Max hit points",
    HP_CURRENT: "Current hit points",
    SPEED: "Speed",
    INITIATIVE: "Initiative",
    PROFICIENCY: "Proficiency bonus",
    PASSIVE_PERCEPTION: "Passive perception",
    SPELL_ATTACK: "Spell attack",
    SPELL_DC: "Spell save DC",
    ATTACK_BONUS: "Attack bonus",
    DAMAGE_BONUS: "Damage bonus",
    SAVE_STR: "Saving throw STR",
    SAVE_DEX: "Saving throw DEX",
    SAVE_CON: "Saving throw CON",
    SAVE_INT: "Saving throw INT",
    SAVE_WIS: "Saving throw WIS",
    SAVE_CHA: "Saving throw CHA",
    SKILL_ACROBATICS: "Skill: Acrobatics",
    SKILL_ANIMAL_HANDLING: "Skill: Animal Handling",
    SKILL_ARCANA: "Skill: Arcana",
    SKILL_ATHLETICS: "Skill: Athletics",
    SKILL_DECEPTION: "Skill: Deception",
    SKILL_HISTORY: "Skill: History",
    SKILL_INSIGHT: "Skill: Insight",
    SKILL_INTIMIDATION: "Skill: Intimidation",
    SKILL_INVESTIGATION: "Skill: Investigation",
    SKILL_MEDICINE: "Skill: Medicine",
    SKILL_NATURE: "Skill: Nature",
    SKILL_PERCEPTION: "Skill: Perception",
    SKILL_PERFORMANCE: "Skill: Performance",
    SKILL_PERSUASION: "Skill: Persuasion",
    SKILL_RELIGION: "Skill: Religion",
    SKILL_SLEIGHT_OF_HAND: "Skill: Sleight of Hand",
    SKILL_STEALTH: "Skill: Stealth",
    SKILL_SURVIVAL: "Skill: Survival",
};

const targetLabelMap = new Map(MODIFIER_TARGETS.map((entry) => [entry.key, entry.label]));

function getTargetLabel(target: string, locale: string) {
    const normalized = normalizeTarget(target);
    if (locale === "en" && TARGET_LABEL_EN[normalized]) return TARGET_LABEL_EN[normalized];
    return targetLabelMap.get(normalized) ?? target;
}

function getAttachmentTypeLabel(type: ItemAttachmentEntry["type"], locale: string) {
    return getItemAttachmentTypeLabel(type, locale);
}

function buildItemConfigurationBase(name = "Configuracion A"): ItemConfiguration {
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
    };
}

type ItemManagerSectionProps = {
    items: CharacterItem[];
    setItems: (items: CharacterItem[]) => void;
};

export default function ItemManagerSection({ items, setItems }: ItemManagerSectionProps) {
    const locale = useClientLocale();
    const t = (es: string, en: string) => tr(locale, es, en);
    const equippedItems = useMemo(() => items.filter((item) => item.equipped), [items]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [category, setCategory] = useState<ItemCategory>("misc");
    const [equippable, setEquippable] = useState(false);
    const [equipped, setEquipped] = useState(false);
    const [description, setDescription] = useState("");
    const [quantity, setQuantity] = useState<number>(1);
    const [rarity, setRarity] = useState("");
    const [tags, setTags] = useState("");
    const [modifiers, setModifiers] = useState<ItemModifier[]>([]);
    const [modTarget, setModTarget] = useState(MODIFIER_TARGETS[0]?.key ?? "STR");
    const [modValue, setModValue] = useState("1");
    const [modNote, setModNote] = useState("");
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [attachments, setAttachments] = useState<ItemAttachmentEntry[]>([]);
    const [configurations, setConfigurations] = useState<ItemConfiguration[]>([]);
    const [activeConfigurationId, setActiveConfigurationId] = useState("");
    const [attachmentTargetId, setAttachmentTargetId] = useState("item");
    const [attachmentType, setAttachmentType] =
        useState<ItemAttachmentEntry["type"]>("action");
    const [attachmentName, setAttachmentName] = useState("");
    const [attachmentLevel, setAttachmentLevel] = useState("");
    const [attachmentDescription, setAttachmentDescription] = useState("");
    const [attachmentSchool, setAttachmentSchool] = useState("");
    const [attachmentCastingTime, setAttachmentCastingTime] = useState(
        CASTING_TIME_OPTIONS[0]?.es ?? "Accion"
    );
    const [attachmentCastingTimeNote, setAttachmentCastingTimeNote] = useState("");
    const [attachmentRange, setAttachmentRange] = useState("");
    const [attachmentDuration, setAttachmentDuration] = useState("");
    const [attachmentComponents, setAttachmentComponents] = useState<SpellComponentSet>({
        verbal: false,
        somatic: false,
        material: false,
    });
    const [attachmentMaterials, setAttachmentMaterials] = useState("");
    const [attachmentConcentration, setAttachmentConcentration] = useState(false);
    const [attachmentRitual, setAttachmentRitual] = useState(false);
    const [attachmentSpellUsesSlot, setAttachmentSpellUsesSlot] = useState(false);
    const [attachmentSpellSlotLevel, setAttachmentSpellSlotLevel] = useState(1);
    const [attachmentSpellCharges, setAttachmentSpellCharges] = useState("");
    const [attachmentSpellPoints, setAttachmentSpellPoints] = useState("");
    const [attachmentSaveType, setAttachmentSaveType] = useState<"attack" | "save" | "none">(
        "none"
    );
    const [attachmentSaveAbility, setAttachmentSaveAbility] = useState<AbilityKey>("WIS");
    const [attachmentDcType, setAttachmentDcType] = useState<"fixed" | "stat">("stat");
    const [attachmentDcValue, setAttachmentDcValue] = useState("");
    const [attachmentDcStat, setAttachmentDcStat] = useState<AbilityKey>("WIS");
    const [attachmentDamageType, setAttachmentDamageType] = useState("");
    const [attachmentDamageDice, setAttachmentDamageDice] = useState("");
    const [attachmentDamageScaling, setAttachmentDamageScaling] = useState("");
    const [attachmentActionType, setAttachmentActionType] = useState<
        NonNullable<ItemAttachmentEntry["actionType"]>
    >("action");
    const [attachmentAbilityUsesSlot, setAttachmentAbilityUsesSlot] = useState(false);
    const [attachmentAbilitySlotLevel, setAttachmentAbilitySlotLevel] = useState(1);
    const [attachmentAbilityCharges, setAttachmentAbilityCharges] = useState("");
    const [attachmentAbilityRecharge, setAttachmentAbilityRecharge] = useState<"short" | "long">(
        "short"
    );
    const [attachmentAbilityPointsLabel, setAttachmentAbilityPointsLabel] = useState("");
    const [attachmentAbilityPoints, setAttachmentAbilityPoints] = useState("");
    const [attachmentRequirements, setAttachmentRequirements] = useState("");
    const [attachmentEffect, setAttachmentEffect] = useState("");
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    const isAttachmentSpellLike =
        attachmentType === "spell" || attachmentType === "cantrip";
    const isAttachmentAbilityLike =
        attachmentType === "action" ||
        attachmentType === "ability" ||
        attachmentType === "classFeature";
    const attachmentTargetOptions = useMemo(
        () => [
            { id: "item", label: t("Objeto base", "Base item") },
            ...configurations.map((config) => ({
                id: config.id,
                label: `${t("Configuración", "Configuration")}: ${config.name}`,
            })),
        ],
        [configurations, t]
    );
    const selectedAttachmentList =
        attachmentTargetId === "item"
            ? attachments
            : configurations.find((config) => config.id === attachmentTargetId)
                  ?.attachments ?? [];

    const applyItemOrder = (list: CharacterItem[]) =>
        list.map((item, index) => ({ ...item, sortOrder: index }));

    function resetAttachmentEditor() {
        setAttachmentType("action");
        setAttachmentName("");
        setAttachmentLevel("");
        setAttachmentDescription("");
        setAttachmentSchool("");
        setAttachmentCastingTime(CASTING_TIME_OPTIONS[0]?.es ?? "Accion");
        setAttachmentCastingTimeNote("");
        setAttachmentRange("");
        setAttachmentDuration("");
        setAttachmentComponents({
            verbal: false,
            somatic: false,
            material: false,
        });
        setAttachmentMaterials("");
        setAttachmentConcentration(false);
        setAttachmentRitual(false);
        setAttachmentSpellUsesSlot(false);
        setAttachmentSpellSlotLevel(1);
        setAttachmentSpellCharges("");
        setAttachmentSpellPoints("");
        setAttachmentSaveType("none");
        setAttachmentSaveAbility("WIS");
        setAttachmentDcType("stat");
        setAttachmentDcValue("");
        setAttachmentDcStat("WIS");
        setAttachmentDamageType("");
        setAttachmentDamageDice("");
        setAttachmentDamageScaling("");
        setAttachmentActionType("action");
        setAttachmentAbilityUsesSlot(false);
        setAttachmentAbilitySlotLevel(1);
        setAttachmentAbilityCharges("");
        setAttachmentAbilityRecharge("short");
        setAttachmentAbilityPointsLabel("");
        setAttachmentAbilityPoints("");
        setAttachmentRequirements("");
        setAttachmentEffect("");
    }

    function resetForm() {
        setEditingId(null);
        setName("");
        setCategory("misc");
        setEquippable(false);
        setEquipped(false);
        setDescription("");
        setQuantity(1);
        setRarity("");
        setTags("");
        setModifiers([]);
        setModTarget(MODIFIER_TARGETS[0]?.key ?? "STR");
        setModValue("1");
        setModNote("");
        setAdvancedOpen(false);
        setAttachments([]);
        setConfigurations([]);
        setActiveConfigurationId("");
        setAttachmentTargetId("item");
        resetAttachmentEditor();
    }

    function openEditItem(item: CharacterItem) {
        setEditingId(item.id);
        setName(item.name ?? "");
        setCategory(item.category ?? "misc");
        setEquippable(!!item.equippable);
        setEquipped(!!item.equipped);
        setDescription(getLocalizedText(item.description, locale));
        setQuantity(item.quantity ?? 1);
        setRarity(item.rarity ?? "");
        setTags(Array.isArray(item.tags) ? item.tags.join(", ") : "");
        setModifiers(Array.isArray(item.modifiers) ? item.modifiers : []);
        setAttachments(Array.isArray(item.attachments) ? item.attachments : []);
        const itemConfigurations = Array.isArray(item.configurations)
            ? item.configurations.map((config, index) => ({
                  ...config,
                  id: config.id ?? `${item.id}-cfg-${index}`,
                  name: config.name ?? `${t("Configuración", "Configuration")} ${index + 1}`,
                  attachments: Array.isArray(config.attachments)
                      ? config.attachments
                      : [],
              }))
            : [];
        setConfigurations(itemConfigurations);
        setActiveConfigurationId(
            typeof item.activeConfigurationId === "string"
                ? item.activeConfigurationId
                : itemConfigurations[0]?.id ?? ""
        );
        setAttachmentTargetId("item");
        setIsFormOpen(true);
    }

    function saveItem() {
        const trimmed = name.trim();
        if (!trimmed) {
            setIsFormOpen(false);
            resetForm();
            return;
        }

        const parsedTags = tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);

        const item: CharacterItem = {
            ...(editingId
                ? (items.find((entry) => entry.id === editingId) ?? buildItemBase(trimmed, category))
                : buildItemBase(trimmed, category)),
            name: trimmed,
            category,
            equippable,
            equipped: equippable ? equipped : false,
            description: normalizeLocalizedText(description, locale),
            modifiers,
            quantity: quantity ?? 1,
            rarity: rarity.trim() || undefined,
            tags: parsedTags.length > 0 ? parsedTags : undefined,
            attachments: attachments.length > 0 ? attachments : undefined,
            configurations:
                configurations.length > 0
                    ? configurations.map((config) => ({
                          ...config,
                          description: normalizeLocalizedText(
                              getLocalizedText(config.description, locale),
                              locale
                          ),
                          usage: config.usage?.trim() || undefined,
                          damage: config.damage?.trim() || undefined,
                          range: config.range?.trim() || undefined,
                          magicBonus:
                              typeof config.magicBonus === "number" &&
                              Number.isFinite(config.magicBonus)
                                  ? config.magicBonus
                                  : undefined,
                          attachments:
                              Array.isArray(config.attachments) &&
                              config.attachments.length > 0
                                  ? config.attachments
                                  : undefined,
                      }))
                    : undefined,
            activeConfigurationId:
                configurations.length > 0 &&
                activeConfigurationId &&
                configurations.some((config) => config.id === activeConfigurationId)
                    ? activeConfigurationId
                    : configurations[0]?.id,
        };

        if (editingId) {
            setItems(applyItemOrder(items.map((entry) => (entry.id === editingId ? item : entry))));
        } else {
            setItems(applyItemOrder([...items, item]));
        }
        setIsFormOpen(false);
        resetForm();
    }

    function removeItem(id: string) {
        setItems(applyItemOrder(items.filter((entry) => entry.id !== id)));
    }

    function toggleEquip(id: string) {
        setItems(
            items.map((entry) => {
                if (entry.id !== id) return entry;
                if (!entry.equippable) return entry;
                return { ...entry, equipped: !entry.equipped };
            })
        );
    }

    function onDragStart(event: React.DragEvent, id: string) {
        setDraggingId(id);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
    }

    function onDragOver(event: React.DragEvent, id: string) {
        event.preventDefault();
        if (id !== dragOverId) setDragOverId(id);
    }

    function onDrop(event: React.DragEvent, id: string) {
        event.preventDefault();
        const sourceId = draggingId ?? event.dataTransfer.getData("text/plain");
        if (!sourceId || sourceId === id) {
            setDragOverId(null);
            return;
        }
        const fromIndex = items.findIndex((entry) => entry.id === sourceId);
        const toIndex = items.findIndex((entry) => entry.id === id);
        if (fromIndex === -1 || toIndex === -1) return;

        const next = [...items];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        setItems(applyItemOrder(next));
        setDraggingId(null);
        setDragOverId(null);
    }

    function addModifier() {
        const numeric = Number(modValue);
        if (Number.isNaN(numeric)) return;
        const target = modTarget.trim();
        if (!target) return;
        setModifiers([
            ...modifiers,
            { target, value: numeric, note: modNote.trim() || undefined },
        ]);
        setModValue("1");
        setModNote("");
    }

    function setConfigurationField(
        configId: string,
        field: keyof Omit<ItemConfiguration, "id" | "attachments">,
        value: string
    ) {
        setConfigurations((prev) =>
            prev.map((config) => {
                if (config.id !== configId) return config;
                if (field === "magicBonus") {
                    const trimmed = value.trim();
                    if (!trimmed) {
                        return {
                            ...config,
                            magicBonus: undefined,
                        };
                    }
                    const parsed = Number(trimmed);
                    return {
                        ...config,
                        magicBonus: Number.isFinite(parsed) ? parsed : undefined,
                    };
                }
                if (field === "description") {
                    return {
                        ...config,
                        description: normalizeLocalizedText(value, locale),
                    };
                }
                return {
                    ...config,
                    [field]: value,
                };
            })
        );
    }

    function addConfiguration() {
        const nextIndex = configurations.length + 1;
        const next = buildItemConfigurationBase(
            `${t("Configuración", "Configuration")} ${nextIndex}`
        );
        setConfigurations((prev) => [...prev, next]);
        setActiveConfigurationId(next.id);
        setAttachmentTargetId(next.id);
    }

    function removeConfiguration(configId: string) {
        setConfigurations((prev) => {
            const next = prev.filter((config) => config.id !== configId);
            const fallbackId = next[0]?.id ?? "";
            setActiveConfigurationId((active) =>
                active === configId ? fallbackId : active
            );
            setAttachmentTargetId((target) => {
                if (target !== configId) return target;
                return fallbackId || "item";
            });
            return next;
        });
    }

    function setConfigurationAttachments(
        configId: string,
        nextAttachments: ItemAttachmentEntry[]
    ) {
        setConfigurations((prev) =>
            prev.map((config) =>
                config.id === configId
                    ? {
                          ...config,
                          attachments: nextAttachments,
                      }
                    : config
            )
        );
    }

    function addAttachment() {
        const trimmedName = attachmentName.trim();
        const trimmedDescription = attachmentDescription.trim();
        if (!trimmedName) return;

        const parsedLevel = Number(attachmentLevel);
        const shouldUseLevel =
            (attachmentType === "spell" ||
                attachmentType === "cantrip" ||
                attachmentType === "ability" ||
                attachmentType === "classFeature" ||
                attachmentType === "action") &&
            Number.isFinite(parsedLevel);

        const normalizedLevel =
            attachmentType === "cantrip"
                ? 0
                : shouldUseLevel
                ? Math.max(0, Math.min(20, Math.floor(parsedLevel)))
                : undefined;

        const parseOptionalNumber = (value: string) => {
            const trimmed = value.trim();
            if (!trimmed) return undefined;
            const numeric = Number(trimmed);
            if (!Number.isFinite(numeric)) return undefined;
            return numeric;
        };

        const spellCostCharges = parseOptionalNumber(attachmentSpellCharges);
        const spellCostPoints = parseOptionalNumber(attachmentSpellPoints);
        const spellResourceCost: SpellResourceCost | undefined =
            attachmentSpellUsesSlot ||
            spellCostCharges != null ||
            spellCostPoints != null
                ? {
                      usesSpellSlot: attachmentSpellUsesSlot || undefined,
                      slotLevel: attachmentSpellUsesSlot
                          ? Number(attachmentSpellSlotLevel) || (normalizedLevel ?? 1)
                          : undefined,
                      charges: spellCostCharges,
                      points: spellCostPoints,
                  }
                : undefined;

        const spellComponents: SpellComponentSet | undefined =
            attachmentComponents.verbal ||
            attachmentComponents.somatic ||
            attachmentComponents.material
                ? { ...attachmentComponents }
                : undefined;

        const spellCastingTime: SpellCastingTime | undefined =
            attachmentCastingTime || attachmentCastingTimeNote
                ? {
                      value: attachmentCastingTime || (CASTING_TIME_OPTIONS[0]?.es ?? "Accion"),
                      note: attachmentCastingTimeNote.trim() || undefined,
                  }
                : undefined;

        const spellSave: SpellSaveConfig | undefined =
            attachmentSaveType === "none"
                ? undefined
                : {
                      type: attachmentSaveType,
                      saveAbility: attachmentSaveType === "save" ? attachmentSaveAbility : undefined,
                      dcType: attachmentSaveType === "save" ? attachmentDcType : undefined,
                      dcValue:
                          attachmentSaveType === "save" && attachmentDcType === "fixed"
                              ? parseOptionalNumber(attachmentDcValue)
                              : undefined,
                      dcStat:
                          attachmentSaveType === "save" && attachmentDcType === "stat"
                              ? attachmentDcStat
                              : undefined,
                  };

        const spellDamage: SpellDamageConfig | undefined =
            attachmentDamageType.trim() ||
            attachmentDamageDice.trim() ||
            attachmentDamageScaling.trim()
                ? {
                      damageType: attachmentDamageType.trim() || undefined,
                      dice: attachmentDamageDice.trim() || undefined,
                      scaling: attachmentDamageScaling.trim() || undefined,
                  }
                : undefined;

        const abilityCharges = parseOptionalNumber(attachmentAbilityCharges);
        const abilityPoints = parseOptionalNumber(attachmentAbilityPoints);
        const abilityCost: AbilityResourceCost | undefined =
            attachmentAbilityUsesSlot ||
            abilityCharges != null ||
            abilityPoints != null ||
            attachmentAbilityPointsLabel.trim()
                ? {
                      usesSpellSlot: attachmentAbilityUsesSlot || undefined,
                      slotLevel: attachmentAbilityUsesSlot
                          ? Number(attachmentAbilitySlotLevel) || undefined
                          : undefined,
                      charges: abilityCharges,
                      recharge: attachmentAbilityUsesSlot
                          ? undefined
                          : attachmentAbilityRecharge,
                      pointsLabel: attachmentAbilityPointsLabel.trim() || undefined,
                      points: abilityPoints,
                  }
                : undefined;

        const entry: ItemAttachmentEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: attachmentType,
            name: trimmedName,
            level: normalizedLevel,
            description: normalizeLocalizedText(trimmedDescription, locale),
            school: isAttachmentSpellLike ? attachmentSchool.trim() || undefined : undefined,
            castingTime: isAttachmentSpellLike ? spellCastingTime : undefined,
            range: isAttachmentSpellLike ? attachmentRange.trim() || undefined : undefined,
            components: isAttachmentSpellLike ? spellComponents : undefined,
            materials:
                isAttachmentSpellLike && attachmentComponents.material
                    ? attachmentMaterials.trim() || undefined
                    : undefined,
            duration: isAttachmentSpellLike ? attachmentDuration.trim() || undefined : undefined,
            concentration: isAttachmentSpellLike ? attachmentConcentration || undefined : undefined,
            ritual: isAttachmentSpellLike ? attachmentRitual || undefined : undefined,
            save: isAttachmentSpellLike ? spellSave : undefined,
            damage: isAttachmentSpellLike ? spellDamage : undefined,
            actionType: isAttachmentAbilityLike ? attachmentActionType : undefined,
            resourceCost: isAttachmentSpellLike
                ? spellResourceCost
                : isAttachmentAbilityLike
                ? abilityCost
                : undefined,
            requirements: isAttachmentAbilityLike
                ? attachmentRequirements.trim() || undefined
                : undefined,
            effect: isAttachmentAbilityLike ? attachmentEffect.trim() || undefined : undefined,
        };

        if (attachmentTargetId === "item") {
            setAttachments((prev) => [...prev, entry]);
        } else {
            const target = configurations.find((config) => config.id === attachmentTargetId);
            if (!target) {
                setAttachments((prev) => [...prev, entry]);
            } else {
                const currentAttachments = Array.isArray(target.attachments)
                    ? target.attachments
                    : [];
                setConfigurationAttachments(attachmentTargetId, [
                    ...currentAttachments,
                    entry,
                ]);
            }
        }
        const keepType = attachmentType;
        resetAttachmentEditor();
        setAttachmentType(keepType);
        if (keepType === "cantrip") {
            setAttachmentLevel("0");
        }
    }

    function removeAttachment(id: string) {
        if (attachmentTargetId === "item") {
            setAttachments((prev) => prev.filter((entry) => entry.id !== id));
            return;
        }
        const target = configurations.find((config) => config.id === attachmentTargetId);
        if (!target) {
            setAttachments((prev) => prev.filter((entry) => entry.id !== id));
            return;
        }
        setConfigurationAttachments(
            attachmentTargetId,
            (target.attachments ?? []).filter((entry) => entry.id !== id)
        );
    }

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="text-sm font-semibold text-ink">
                        {t("Inventario y equipamiento", "Inventory and equipment")}
                    </h3>
                    <p className="text-[11px] text-ink-muted">
                        {t(
                            "Todo esta en objetos. Los modificadores solo aplican si el objeto esta equipado.",
                            "Everything is item-based. Modifiers apply only when the item is equipped."
                        )}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        resetForm();
                        setIsFormOpen(true);
                    }}
                    className="text-xs px-3 py-1 rounded-md border border-accent/60 bg-accent/10 hover:bg-accent/20"
                >
                    {t("Anadir objeto", "Add item")}
                </button>
            </div>

            {isFormOpen && (
                <div className="rounded-2xl border border-ring bg-panel/80 p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-ink">
                            {editingId ? t("Editar objeto", "Edit item") : t("Nuevo objeto", "New item")}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsFormOpen(false);
                                    resetForm();
                                }}
                                className="text-[11px] px-3 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                            >
                                {t("Cancelar", "Cancel")}
                            </button>
                            <button
                                type="button"
                                onClick={saveItem}
                                className="text-[11px] px-3 py-1 rounded-md border border-emerald-500/60 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            >
                                {t("Guardar", "Save")}
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-xs text-ink-muted">{t("Nombre", "Name")}</label>
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-ink-muted">
                                {t("Categoria", "Category")}
                            </label>
                            <select
                                value={category}
                                onChange={(event) => setCategory(event.target.value as ItemCategory)}
                                className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                            >
                                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {t(label.es, label.en)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex items-center gap-2 text-xs text-ink-muted">
                            <input
                                type="checkbox"
                                checked={equippable}
                                onChange={(event) => {
                                    setEquippable(event.target.checked);
                                    if (!event.target.checked) setEquipped(false);
                                }}
                            />
                            {t("Es equipable", "Equippable")}
                        </label>
                        <label className="flex items-center gap-2 text-xs text-ink-muted">
                            <input
                                type="checkbox"
                                checked={equipped}
                                disabled={!equippable}
                                onChange={(event) => setEquipped(event.target.checked)}
                            />
                            {t("Esta equipado", "Equipped")}
                        </label>
                    </div>

                    <details className="rounded-xl border border-ring bg-white/80 p-3">
                        <summary className="cursor-pointer text-xs text-ink-muted">
                            {t("Descripcion (Markdown)", "Description (Markdown)")}
                        </summary>
                        <div className="mt-2">
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                rows={4}
                                className="w-full rounded-md bg-white/90 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                            />
                        </div>
                    </details>

                    <div className="rounded-xl border border-ring bg-white/80 p-3 space-y-2">
                        <p className="text-xs font-semibold text-ink">{t("Modificadores", "Modifiers")}</p>
                        {modifiers.length === 0 ? (
                            <p className="text-[11px] text-ink-muted">{t("Aun no hay modificadores.", "No modifiers yet.")}</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {modifiers.map((mod, index) => (
                                    <span
                                        key={`${mod.target}-${index}`}
                                        className="text-[10px] px-2 py-0.5 rounded-full border border-ring text-ink"
                                    >
                                        {getTargetLabel(mod.target, locale)} {mod.value >= 0 ? `+${mod.value}` : mod.value}
                                        {mod.note ? ` · ${mod.note}` : ""}
                                        <button
                                            type="button"
                                            onClick={() => setModifiers(modifiers.filter((_, i) => i !== index))}
                                            className="ml-2 text-ink-muted hover:text-ink"
                                        >
                                            x
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="grid gap-2 md:grid-cols-3">
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">{t("Destino", "Target")}</label>
                                <input
                                    list="modifier-targets"
                                    value={modTarget}
                                    onChange={(event) => setModTarget(event.target.value)}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                />
                                <datalist id="modifier-targets">
                                    {MODIFIER_TARGETS.map((target) => (
                                        <option key={target.key} value={target.key}>
                                            {getTargetLabel(target.key, locale)}
                                        </option>
                                    ))}
                                </datalist>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">{t("Valor", "Value")}</label>
                                <input
                                    type="number"
                                    value={modValue}
                                    onChange={(event) => setModValue(event.target.value)}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">{t("Nota", "Note")}</label>
                                <input
                                    value={modNote}
                                    onChange={(event) => setModNote(event.target.value)}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={addModifier}
                            className="text-[11px] px-3 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                        >
                            {t("Anadir modificador", "Add modifier")}
                        </button>
                    </div>

                    <div className="rounded-xl border border-ring bg-white/80 p-3 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-ink">
                                {t("Configuraciones modulares", "Modular configurations")}
                            </p>
                            <button
                                type="button"
                                onClick={addConfiguration}
                                className="text-[11px] px-3 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                            >
                                {t("Añadir configuración", "Add configuration")}
                            </button>
                        </div>
                        <p className="text-[11px] text-ink-muted">
                            {t(
                                "Úsalo para armas u objetos con modos A/B (cada configuración tiene sus propios adjuntos).",
                                "Use this for A/B weapon or item modes (each configuration has its own attachments)."
                            )}
                        </p>
                        {configurations.length === 0 ? (
                            <p className="text-[11px] text-ink-muted">
                                {t(
                                    "Este objeto no tiene configuraciones modulares.",
                                    "This item has no modular configurations."
                                )}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {configurations.map((config, index) => (
                                    <details
                                        key={config.id}
                                        className="rounded-lg border border-ring bg-panel/80 p-2"
                                        open={activeConfigurationId === config.id}
                                    >
                                        <summary className="cursor-pointer list-none">
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-xs font-semibold text-ink">
                                                        {config.name || `${t("Configuración", "Configuration")} ${index + 1}`}
                                                    </p>
                                                    <p className="text-[11px] text-ink-muted">
                                                        {(config.attachments?.length ?? 0)}{" "}
                                                        {t("adjuntos", "attachments")}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            setActiveConfigurationId(config.id);
                                                            setAttachmentTargetId(config.id);
                                                        }}
                                                        className={`text-[10px] px-2 py-1 rounded-md border ${
                                                            activeConfigurationId === config.id
                                                                ? "border-emerald-500/70 text-emerald-700 bg-emerald-50"
                                                                : "border-ring bg-white/70 hover:bg-white"
                                                        }`}
                                                    >
                                                        {activeConfigurationId === config.id
                                                            ? t("Activa", "Active")
                                                            : t("Activar", "Set active")}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            removeConfiguration(config.id);
                                                        }}
                                                        className="text-[10px] px-2 py-1 rounded-md border border-red-400/70 text-red-600 bg-red-50 hover:bg-red-100"
                                                    >
                                                        {t("Eliminar", "Delete")}
                                                    </button>
                                                </div>
                                            </div>
                                        </summary>

                                        <div className="mt-2 space-y-2">
                                            <div className="space-y-1">
                                                <label className="text-[11px] text-ink-muted">
                                                    {t("Nombre", "Name")}
                                                </label>
                                                <input
                                                    value={config.name}
                                                    onChange={(event) =>
                                                        setConfigurationField(
                                                            config.id,
                                                            "name",
                                                            event.target.value
                                                        )
                                                    }
                                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                                />
                                            </div>
                                            <div className="grid gap-2 md:grid-cols-2">
                                                <div className="space-y-1">
                                                    <label className="text-[11px] text-ink-muted">
                                                        {t("Uso", "Usage")}
                                                    </label>
                                                    <input
                                                        value={config.usage ?? ""}
                                                        onChange={(event) =>
                                                            setConfigurationField(
                                                                config.id,
                                                                "usage",
                                                                event.target.value
                                                            )
                                                        }
                                                        className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                                        placeholder={t("Ej. dos manos", "e.g. two-handed")}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[11px] text-ink-muted">
                                                        {t("Daño", "Damage")}
                                                    </label>
                                                    <input
                                                        value={config.damage ?? ""}
                                                        onChange={(event) =>
                                                            setConfigurationField(
                                                                config.id,
                                                                "damage",
                                                                event.target.value
                                                            )
                                                        }
                                                        className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                                        placeholder="2d6 contundente"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[11px] text-ink-muted">
                                                        {t("Alcance", "Range")}
                                                    </label>
                                                    <input
                                                        value={config.range ?? ""}
                                                        onChange={(event) =>
                                                            setConfigurationField(
                                                                config.id,
                                                                "range",
                                                                event.target.value
                                                            )
                                                        }
                                                        className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                                        placeholder={t("Ej. 3 m", "e.g. 10 ft")}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[11px] text-ink-muted">
                                                        {t("Bono mágico", "Magic bonus")}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={
                                                            typeof config.magicBonus === "number"
                                                                ? config.magicBonus
                                                                : ""
                                                        }
                                                        onChange={(event) =>
                                                            setConfigurationField(
                                                                config.id,
                                                                "magicBonus",
                                                                event.target.value
                                                            )
                                                        }
                                                        className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[11px] text-ink-muted">
                                                    {t("Descripción", "Description")}
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={getLocalizedText(config.description, locale)}
                                                    onChange={(event) =>
                                                        setConfigurationField(
                                                            config.id,
                                                            "description",
                                                            event.target.value
                                                        )
                                                    }
                                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                                />
                                            </div>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-ring bg-white/80 p-3 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-ink">
                                {t(
                                    "Contenido adjunto al objeto",
                                    "Content attached to item"
                                )}
                            </p>
                            <span className="text-[11px] text-ink-muted">
                                {selectedAttachmentList.length}{" "}
                                {selectedAttachmentList.length === 1
                                    ? t("adjunto", "attachment")
                                    : t("adjuntos", "attachments")}
                            </span>
                        </div>
                        <p className="text-[11px] text-ink-muted">
                            {t(
                                "Puedes adjuntar una accion, habilidad, rasgo, hechizo o cualquier contenido personalizado del objeto.",
                                "Attach an action, ability, trait, spell, or any custom content to this item."
                            )}
                        </p>

                        {selectedAttachmentList.length === 0 ? (
                            <p className="text-[11px] text-ink-muted">
                                {t(
                                    "Aun no has anadido contenido adjunto.",
                                    "No attached content yet."
                                )}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {selectedAttachmentList.map((attachment) => {
                                    const attachmentMarkdown = formatItemAttachmentMarkdown(
                                        attachment,
                                        locale
                                    );
                                    return (
                                        <details
                                            key={attachment.id}
                                            className="rounded-lg border border-ring bg-panel/80 p-2"
                                        >
                                            <summary className="cursor-pointer list-none">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-xs font-semibold text-ink">
                                                            {attachment.name}
                                                            {typeof attachment.level === "number"
                                                                ? ` · ${t("Nivel", "Level")} ${attachment.level}`
                                                                : ""}
                                                        </p>
                                                        <p className="text-[11px] text-ink-muted">
                                                            {getAttachmentTypeLabel(
                                                                attachment.type,
                                                                locale
                                                            )}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            removeAttachment(attachment.id);
                                                        }}
                                                        className="text-[10px] px-2 py-1 rounded-md border border-red-400/70 text-red-600 bg-red-50 hover:bg-red-100"
                                                    >
                                                        {t("Eliminar", "Delete")}
                                                    </button>
                                                </div>
                                            </summary>
                                            {attachmentMarkdown && (
                                                <div className="mt-2">
                                                    <Markdown
                                                        content={attachmentMarkdown}
                                                        className="text-ink-muted text-xs"
                                                    />
                                                </div>
                                            )}
                                        </details>
                                    );
                                })}
                            </div>
                        )}

                        <div className="grid gap-2 md:grid-cols-4">
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">
                                    {t("Destino", "Target")}
                                </label>
                                <select
                                    value={attachmentTargetId}
                                    onChange={(event) => setAttachmentTargetId(event.target.value)}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                >
                                    {attachmentTargetOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">
                                    {t("Tipo", "Type")}
                                </label>
                                <select
                                    value={attachmentType}
                                    onChange={(event) => {
                                        const nextType =
                                            event.target.value as ItemAttachmentEntry["type"];
                                        setAttachmentType(nextType);
                                        if (nextType === "cantrip") {
                                            setAttachmentLevel("0");
                                        } else if (attachmentLevel === "0") {
                                            setAttachmentLevel("1");
                                        }
                                        if (nextType === "action") {
                                            setAttachmentActionType("action");
                                        }
                                    }}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                >
                                    {ATTACHMENT_TYPE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {t(option.es, option.en)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">
                                    {t("Nombre", "Name")}
                                </label>
                                <input
                                    value={attachmentName}
                                    onChange={(event) => setAttachmentName(event.target.value)}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                    placeholder={t(
                                        "Ej. Robar una carta",
                                        "e.g. Draw a card"
                                    )}
                                />
                            </div>
                            {(isAttachmentSpellLike || isAttachmentAbilityLike) && (
                                <div className="space-y-1">
                                    <label className="text-[11px] text-ink-muted">
                                        {t("Nivel (opcional)", "Level (optional)")}
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={20}
                                        value={attachmentLevel}
                                        onChange={(event) =>
                                            setAttachmentLevel(event.target.value)
                                        }
                                        className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                        placeholder={
                                            attachmentType === "cantrip" ? "0" : "1"
                                        }
                                    />
                                </div>
                            )}
                        </div>
                        {isAttachmentAbilityLike && (
                            <>
                                <div className="grid gap-2 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">
                                            {t("Tipo de accion", "Action type")}
                                        </label>
                                        <select
                                            value={attachmentActionType}
                                            onChange={(event) =>
                                                setAttachmentActionType(
                                                    event.target
                                                        .value as NonNullable<ItemAttachmentEntry["actionType"]>
                                                )
                                            }
                                            className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                        >
                                            {ATTACHMENT_ACTION_TYPES.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {t(option.es, option.en)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">
                                            {t("Requisitos", "Requirements")}
                                        </label>
                                        <input
                                            value={attachmentRequirements}
                                            onChange={(event) =>
                                                setAttachmentRequirements(event.target.value)
                                            }
                                            className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] text-ink-muted">
                                        {t("Efecto", "Effect")}
                                    </label>
                                    <input
                                        value={attachmentEffect}
                                        onChange={(event) =>
                                            setAttachmentEffect(event.target.value)
                                        }
                                        className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                    />
                                </div>
                                <details className="rounded-lg border border-ring bg-white/85 p-2">
                                    <summary className="cursor-pointer text-[11px] text-ink-muted">
                                        {t("Coste / recursos", "Cost / resources")}
                                    </summary>
                                    <div className="mt-2 space-y-2">
                                        <label className="flex items-center gap-2 text-[11px] text-ink">
                                            <input
                                                type="checkbox"
                                                checked={attachmentAbilityUsesSlot}
                                                onChange={(event) =>
                                                    setAttachmentAbilityUsesSlot(event.target.checked)
                                                }
                                            />
                                            {t("Usa espacio de conjuro", "Use spell slot")}
                                        </label>
                                        {attachmentAbilityUsesSlot && (
                                            <div className="space-y-1">
                                                <label className="text-[11px] text-ink-muted">
                                                    {t("Nivel de espacio", "Slot level")}
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={9}
                                                    value={attachmentAbilitySlotLevel}
                                                    onChange={(event) =>
                                                        setAttachmentAbilitySlotLevel(
                                                            Number(event.target.value) || 0
                                                        )
                                                    }
                                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                                />
                                            </div>
                                        )}
                                        <div className="grid gap-2 md:grid-cols-2">
                                            <div className="space-y-1">
                                                <label className="text-[11px] text-ink-muted">
                                                    {t("Cargas", "Charges")}
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={attachmentAbilityCharges}
                                                    onChange={(event) =>
                                                        setAttachmentAbilityCharges(event.target.value)
                                                    }
                                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[11px] text-ink-muted">
                                                    {t("Recarga", "Recharge")}
                                                </label>
                                                <select
                                                    value={attachmentAbilityRecharge}
                                                    onChange={(event) =>
                                                        setAttachmentAbilityRecharge(
                                                            event.target.value as "short" | "long"
                                                        )
                                                    }
                                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                                >
                                                    <option value="short">
                                                        {t("Descanso corto", "Short rest")}
                                                    </option>
                                                    <option value="long">
                                                        {t("Descanso largo", "Long rest")}
                                                    </option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid gap-2 md:grid-cols-2">
                                            <div className="space-y-1">
                                                <label className="text-[11px] text-ink-muted">
                                                    {t("Etiqueta de puntos", "Points label")}
                                                </label>
                                                <input
                                                    value={attachmentAbilityPointsLabel}
                                                    onChange={(event) =>
                                                        setAttachmentAbilityPointsLabel(
                                                            event.target.value
                                                        )
                                                    }
                                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                                    placeholder={t(
                                                        "ki, mana...",
                                                        "ki, mana..."
                                                    )}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[11px] text-ink-muted">
                                                    {t("Puntos", "Points")}
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={attachmentAbilityPoints}
                                                    onChange={(event) =>
                                                        setAttachmentAbilityPoints(event.target.value)
                                                    }
                                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </details>
                            </>
                        )}
                        {isAttachmentSpellLike && (
                            <>
                                <div className="grid gap-2 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">
                                            {t("Escuela", "School")}
                                        </label>
                                        <input
                                            list="item-attachment-schools"
                                            value={attachmentSchool}
                                            onChange={(event) =>
                                                setAttachmentSchool(event.target.value)
                                            }
                                            className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                        />
                                        <datalist id="item-attachment-schools">
                                            {SPELL_SCHOOLS.map((school) => (
                                                <option key={school} value={school} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">
                                            {t("Alcance", "Range")}
                                        </label>
                                        <input
                                            value={attachmentRange}
                                            onChange={(event) =>
                                                setAttachmentRange(event.target.value)
                                            }
                                            className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                            placeholder={t("9 m / 30 ft", "30 ft / 9 m")}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">
                                            {t("Tiempo de lanzamiento", "Casting time")}
                                        </label>
                                        <select
                                            value={attachmentCastingTime}
                                            onChange={(event) =>
                                                setAttachmentCastingTime(event.target.value)
                                            }
                                            className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                        >
                                            {CASTING_TIME_OPTIONS.map((option) => (
                                                <option key={option.es} value={option.es}>
                                                    {t(option.es, option.en)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">
                                            {t("Nota de lanzamiento", "Casting note")}
                                        </label>
                                        <input
                                            value={attachmentCastingTimeNote}
                                            onChange={(event) =>
                                                setAttachmentCastingTimeNote(event.target.value)
                                            }
                                            className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] text-ink-muted">
                                        {t("Duracion", "Duration")}
                                    </label>
                                    <input
                                        value={attachmentDuration}
                                        onChange={(event) =>
                                            setAttachmentDuration(event.target.value)
                                        }
                                        className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                    />
                                </div>
                                <div className="grid gap-2 md:grid-cols-3">
                                    <label className="flex items-center gap-2 text-[11px] text-ink">
                                        <input
                                            type="checkbox"
                                            checked={!!attachmentComponents.verbal}
                                            onChange={(event) =>
                                                setAttachmentComponents((prev) => ({
                                                    ...prev,
                                                    verbal: event.target.checked,
                                                }))
                                            }
                                        />
                                        V
                                    </label>
                                    <label className="flex items-center gap-2 text-[11px] text-ink">
                                        <input
                                            type="checkbox"
                                            checked={!!attachmentComponents.somatic}
                                            onChange={(event) =>
                                                setAttachmentComponents((prev) => ({
                                                    ...prev,
                                                    somatic: event.target.checked,
                                                }))
                                            }
                                        />
                                        S
                                    </label>
                                    <label className="flex items-center gap-2 text-[11px] text-ink">
                                        <input
                                            type="checkbox"
                                            checked={!!attachmentComponents.material}
                                            onChange={(event) =>
                                                setAttachmentComponents((prev) => ({
                                                    ...prev,
                                                    material: event.target.checked,
                                                }))
                                            }
                                        />
                                        M
                                    </label>
                                </div>
                                {attachmentComponents.material && (
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">
                                            {t("Materiales", "Materials")}
                                        </label>
                                        <input
                                            value={attachmentMaterials}
                                            onChange={(event) =>
                                                setAttachmentMaterials(event.target.value)
                                            }
                                            className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                        />
                                    </div>
                                )}
                                <div className="grid gap-2 md:grid-cols-2">
                                    <label className="flex items-center gap-2 text-[11px] text-ink">
                                        <input
                                            type="checkbox"
                                            checked={attachmentConcentration}
                                            onChange={(event) =>
                                                setAttachmentConcentration(event.target.checked)
                                            }
                                        />
                                        {t("Concentracion", "Concentration")}
                                    </label>
                                    <label className="flex items-center gap-2 text-[11px] text-ink">
                                        <input
                                            type="checkbox"
                                            checked={attachmentRitual}
                                            onChange={(event) =>
                                                setAttachmentRitual(event.target.checked)
                                            }
                                        />
                                        {t("Ritual", "Ritual")}
                                    </label>
                                </div>

                                <details className="rounded-lg border border-ring bg-white/85 p-2">
                                    <summary className="cursor-pointer text-[11px] text-ink-muted">
                                        {t("Coste / recursos", "Cost / resources")}
                                    </summary>
                                    <div className="mt-2 space-y-2">
                                        <label className="flex items-center gap-2 text-[11px] text-ink">
                                            <input
                                                type="checkbox"
                                                checked={attachmentSpellUsesSlot}
                                                onChange={(event) =>
                                                    setAttachmentSpellUsesSlot(event.target.checked)
                                                }
                                            />
                                            {t("Usa espacio de conjuro", "Use spell slot")}
                                        </label>
                                        {attachmentSpellUsesSlot && (
                                            <div className="space-y-1">
                                                <label className="text-[11px] text-ink-muted">
                                                    {t("Nivel de espacio", "Slot level")}
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={9}
                                                    value={attachmentSpellSlotLevel}
                                                    onChange={(event) =>
                                                        setAttachmentSpellSlotLevel(
                                                            Number(event.target.value) || 0
                                                        )
                                                    }
                                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                                />
                                            </div>
                                        )}
                                        <div className="grid gap-2 md:grid-cols-2">
                                            <div className="space-y-1">
                                                <label className="text-[11px] text-ink-muted">
                                                    {t("Cargas", "Charges")}
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={attachmentSpellCharges}
                                                    onChange={(event) =>
                                                        setAttachmentSpellCharges(event.target.value)
                                                    }
                                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[11px] text-ink-muted">
                                                    {t("Puntos", "Points")}
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={attachmentSpellPoints}
                                                    onChange={(event) =>
                                                        setAttachmentSpellPoints(event.target.value)
                                                    }
                                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </details>

                                <details className="rounded-lg border border-ring bg-white/85 p-2">
                                    <summary className="cursor-pointer text-[11px] text-ink-muted">
                                        {t("Tirada / salvacion", "Roll / save")}
                                    </summary>
                                    <div className="mt-2 space-y-2">
                                        <div className="space-y-1">
                                            <label className="text-[11px] text-ink-muted">
                                                {t("Tipo", "Type")}
                                            </label>
                                            <select
                                                value={attachmentSaveType}
                                                onChange={(event) =>
                                                    setAttachmentSaveType(
                                                        event.target.value as "attack" | "save" | "none"
                                                    )
                                                }
                                                className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                            >
                                                <option value="none">{t("Ninguno", "None")}</option>
                                                <option value="attack">{t("Ataque", "Attack")}</option>
                                                <option value="save">
                                                    {t("Salvacion", "Saving throw")}
                                                </option>
                                            </select>
                                        </div>
                                        {attachmentSaveType === "save" && (
                                            <div className="grid gap-2 md:grid-cols-2">
                                                <div className="space-y-1">
                                                    <label className="text-[11px] text-ink-muted">
                                                        {t("Atributo", "Attribute")}
                                                    </label>
                                                    <select
                                                        value={attachmentSaveAbility}
                                                        onChange={(event) =>
                                                            setAttachmentSaveAbility(
                                                                event.target.value as AbilityKey
                                                            )
                                                        }
                                                        className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                                    >
                                                        {SAVE_ABILITIES.map((ability) => (
                                                            <option
                                                                key={ability.value}
                                                                value={ability.value}
                                                            >
                                                                {t(ability.es, ability.en)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[11px] text-ink-muted">
                                                        CD
                                                    </label>
                                                    <select
                                                        value={attachmentDcType}
                                                        onChange={(event) =>
                                                            setAttachmentDcType(
                                                                event.target.value as "fixed" | "stat"
                                                            )
                                                        }
                                                        className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                                    >
                                                        <option value="stat">
                                                            {t("Basada en stat", "Based on stat")}
                                                        </option>
                                                        <option value="fixed">
                                                            {t("Fija", "Fixed")}
                                                        </option>
                                                    </select>
                                                </div>
                                                {attachmentDcType === "fixed" && (
                                                    <div className="space-y-1">
                                                        <label className="text-[11px] text-ink-muted">
                                                            {t("CD fija", "Fixed DC")}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={attachmentDcValue}
                                                            onChange={(event) =>
                                                                setAttachmentDcValue(
                                                                    event.target.value
                                                                )
                                                            }
                                                            className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                                        />
                                                    </div>
                                                )}
                                                {attachmentDcType === "stat" && (
                                                    <div className="space-y-1">
                                                        <label className="text-[11px] text-ink-muted">
                                                            {t("Stat base", "Base stat")}
                                                        </label>
                                                        <select
                                                            value={attachmentDcStat}
                                                            onChange={(event) =>
                                                                setAttachmentDcStat(
                                                                    event.target.value as AbilityKey
                                                                )
                                                            }
                                                            className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                                        >
                                                            {SAVE_ABILITIES.map((ability) => (
                                                                <option
                                                                    key={ability.value}
                                                                    value={ability.value}
                                                                >
                                                                    {t(ability.es, ability.en)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </details>

                                <details className="rounded-lg border border-ring bg-white/85 p-2">
                                    <summary className="cursor-pointer text-[11px] text-ink-muted">
                                        {t("Dano", "Damage")}
                                    </summary>
                                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <label className="text-[11px] text-ink-muted">
                                                {t("Tipo de dano", "Damage type")}
                                            </label>
                                            <input
                                                value={attachmentDamageType}
                                                onChange={(event) =>
                                                    setAttachmentDamageType(event.target.value)
                                                }
                                                className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] text-ink-muted">
                                                {t("Dados", "Dice")}
                                            </label>
                                            <input
                                                value={attachmentDamageDice}
                                                onChange={(event) =>
                                                    setAttachmentDamageDice(event.target.value)
                                                }
                                                className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                            />
                                        </div>
                                        <div className="space-y-1 md:col-span-2">
                                            <label className="text-[11px] text-ink-muted">
                                                {t("Escalado", "Scaling")}
                                            </label>
                                            <input
                                                value={attachmentDamageScaling}
                                                onChange={(event) =>
                                                    setAttachmentDamageScaling(event.target.value)
                                                }
                                                className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                            />
                                        </div>
                                    </div>
                                </details>
                            </>
                        )}
                        <div className="space-y-1">
                            <label className="text-[11px] text-ink-muted">
                                {t("Descripcion (Markdown)", "Description (Markdown)")}
                            </label>
                            <textarea
                                value={attachmentDescription}
                                onChange={(event) =>
                                    setAttachmentDescription(event.target.value)
                                }
                                rows={4}
                                className="w-full rounded-md bg-white/90 border border-ring px-3 py-2 text-xs text-ink outline-none focus:border-accent"
                                placeholder={t(
                                    "Ej. Robar una carta: tira 1d20 y aplica el resultado.",
                                    "e.g. Draw one card: roll 1d20 and apply the result."
                                )}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={addAttachment}
                            className="text-[11px] px-3 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                        >
                            {t("Anadir adjunto", "Add attachment")}
                        </button>
                    </div>

                    <details className="rounded-xl border border-ring bg-white/80 p-3" open={advancedOpen}>
                        <summary
                            className="cursor-pointer text-xs text-ink-muted"
                            onClick={(event) => {
                                event.preventDefault();
                                setAdvancedOpen((prev) => !prev);
                            }}
                        >
                            {t("Campos avanzados", "Advanced fields")}
                        </summary>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">{t("Cantidad", "Quantity")}</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    min={0}
                                    onChange={(event) => setQuantity(Number(event.target.value) || 0)}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">{t("Rareza", "Rarity")}</label>
                                <input
                                    value={rarity}
                                    onChange={(event) => setRarity(event.target.value)}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">Tags</label>
                                <input
                                    value={tags}
                                    onChange={(event) => setTags(event.target.value)}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                    placeholder={t("magico, raro, fuego", "magic, rare, fire")}
                                />
                            </div>
                        </div>
                    </details>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-ring bg-panel/80 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-ink">{t("Equipados", "Equipped")}</h4>
                        <span className="text-[11px] text-ink-muted">
                            {equippedItems.length} {equippedItems.length === 1 ? t("objeto", "item") : t("objetos", "items")}
                        </span>
                    </div>
                    {equippedItems.length === 0 ? (
                        <p className="text-xs text-ink-muted">{t("No hay objetos equipados.", "No equipped items.")}</p>
                    ) : (
                        <div className="space-y-2">
                            {equippedItems.map((item) => {
                                const desc = getLocalizedText(item.description, locale);
                                const mods = Array.isArray(item.modifiers) ? item.modifiers : [];
                                const itemAttachments = Array.isArray(item.attachments)
                                    ? item.attachments
                                    : [];
                                const itemConfigurations = Array.isArray(item.configurations)
                                    ? item.configurations
                                    : [];
                                return (
                                    <details
                                        key={item.id}
                                        draggable
                                        onDragStart={(event) => onDragStart(event, item.id)}
                                        onDragOver={(event) => onDragOver(event, item.id)}
                                        onDrop={(event) => onDrop(event, item.id)}
                                        onDragEnd={() => {
                                            setDraggingId(null);
                                            setDragOverId(null);
                                        }}
                                        className={`rounded-xl border bg-white/80 p-3 ${
                                            dragOverId === item.id ? "border-accent bg-accent/10" : "border-ring"
                                        } ${draggingId === item.id ? "opacity-60" : ""}`}
                                        title={t("Arrastra para ordenar", "Drag to reorder")}
                                    >
                                        <summary className="cursor-pointer list-none">
                                            <p className="text-sm font-semibold text-ink">{item.name}</p>
                                            <p className="text-[11px] text-ink-muted">
                                                {t(CATEGORY_LABELS[item.category]?.es ?? "Objeto", CATEGORY_LABELS[item.category]?.en ?? "Item")}
                                            </p>
                                        </summary>
                                        {mods.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {mods.map((mod, index) => (
                                                    <span
                                                        key={`${mod.target}-${index}`}
                                                        className="text-[10px] px-2 py-0.5 rounded-full border border-ring text-ink"
                                                    >
                                                        {getTargetLabel(mod.target, locale)}{" "}
                                                        {mod.value >= 0 ? `+${mod.value}` : mod.value}
                                                        {mod.note ? ` · ${mod.note}` : ""}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {desc && <Markdown content={desc} className="mt-2 text-ink-muted text-xs" />}
                                        {itemConfigurations.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                <p className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                                                    {t("Configuraciones", "Configurations")}
                                                </p>
                                                {itemConfigurations.map((config) => {
                                                    const configDescription = getLocalizedText(
                                                        config.description,
                                                        locale
                                                    );
                                                    const configAttachments = Array.isArray(
                                                        config.attachments
                                                    )
                                                        ? config.attachments
                                                        : [];
                                                    const isActive =
                                                        item.activeConfigurationId === config.id;
                                                    return (
                                                        <div
                                                            key={config.id}
                                                            className={`rounded-md border p-2 ${
                                                                isActive
                                                                    ? "border-emerald-500/60 bg-emerald-50/60"
                                                                    : "border-ring bg-panel/70"
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="text-xs font-semibold text-ink">
                                                                    {config.name}
                                                                </p>
                                                                {isActive && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/50 text-emerald-700">
                                                                        {t("Activa", "Active")}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {(config.usage ||
                                                                config.damage ||
                                                                config.range ||
                                                                typeof config.magicBonus ===
                                                                    "number") && (
                                                                <p className="mt-1 text-[11px] text-ink-muted">
                                                                    {[
                                                                        config.usage
                                                                            ? `${t("Uso", "Usage")}: ${config.usage}`
                                                                            : null,
                                                                        config.damage
                                                                            ? `${t("Daño", "Damage")}: ${config.damage}`
                                                                            : null,
                                                                        config.range
                                                                            ? `${t("Alcance", "Range")}: ${config.range}`
                                                                            : null,
                                                                        typeof config.magicBonus ===
                                                                        "number"
                                                                            ? `${t("Bono", "Bonus")}: ${
                                                                                  config.magicBonus >= 0
                                                                                      ? `+${config.magicBonus}`
                                                                                      : config.magicBonus
                                                                              }`
                                                                            : null,
                                                                    ]
                                                                        .filter(Boolean)
                                                                        .join(" · ")}
                                                                </p>
                                                            )}
                                                            {configDescription && (
                                                                <Markdown
                                                                    content={configDescription}
                                                                    className="mt-1 text-ink-muted text-xs"
                                                                />
                                                            )}
                                                            {configAttachments.length > 0 && (
                                                                <div className="mt-2 space-y-2">
                                                                    {configAttachments.map((attachment) => {
                                                                        const attachmentMarkdown =
                                                                            formatItemAttachmentMarkdown(
                                                                                attachment,
                                                                                locale
                                                                            );
                                                                        return (
                                                                            <div
                                                                                key={attachment.id}
                                                                                className="rounded-md border border-ring bg-white/80 p-2"
                                                                            >
                                                                                <p className="text-xs font-semibold text-ink">
                                                                                    {attachment.name}
                                                                                    {typeof attachment.level ===
                                                                                    "number"
                                                                                        ? ` · ${t("Nivel", "Level")} ${attachment.level}`
                                                                                        : ""}
                                                                                </p>
                                                                                <p className="text-[11px] text-ink-muted">
                                                                                    {getAttachmentTypeLabel(
                                                                                        attachment.type,
                                                                                        locale
                                                                                    )}
                                                                                </p>
                                                                                {attachmentMarkdown && (
                                                                                    <Markdown
                                                                                        content={attachmentMarkdown}
                                                                                        className="mt-1 text-ink-muted text-xs"
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {itemAttachments.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                <p className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                                                    {t("Adjuntos", "Attachments")}
                                                </p>
                                                {itemAttachments.map((attachment) => {
                                                    const attachmentMarkdown =
                                                        formatItemAttachmentMarkdown(
                                                            attachment,
                                                            locale
                                                        );
                                                    return (
                                                        <div
                                                            key={attachment.id}
                                                            className="rounded-md border border-ring bg-panel/70 p-2"
                                                        >
                                                            <p className="text-xs font-semibold text-ink">
                                                                {attachment.name}
                                                                {typeof attachment.level === "number"
                                                                    ? ` · ${t("Nivel", "Level")} ${attachment.level}`
                                                                    : ""}
                                                            </p>
                                                            <p className="text-[11px] text-ink-muted">
                                                                {getAttachmentTypeLabel(
                                                                    attachment.type,
                                                                    locale
                                                                )}
                                                            </p>
                                                            {attachmentMarkdown && (
                                                                <Markdown
                                                                    content={attachmentMarkdown}
                                                                    className="mt-1 text-ink-muted text-xs"
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </details>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-ring bg-panel/80 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-ink">{t("Inventario", "Inventory")}</h4>
                        <span className="text-[11px] text-ink-muted">
                            {items.length} {items.length === 1 ? t("objeto", "item") : t("objetos", "items")}
                        </span>
                    </div>
                    {items.length === 0 ? (
                        <p className="text-xs text-ink-muted">{t("No has anadido objetos.", "No items added.")}</p>
                    ) : (
                        <div className="space-y-2">
                            {items.map((item) => {
                                const desc = getLocalizedText(item.description, locale);
                                const mods = Array.isArray(item.modifiers) ? item.modifiers : [];
                                const itemAttachments = Array.isArray(item.attachments)
                                    ? item.attachments
                                    : [];
                                const itemConfigurations = Array.isArray(item.configurations)
                                    ? item.configurations
                                    : [];
                                return (
                                    <details
                                        key={item.id}
                                        draggable
                                        onDragStart={(event) => onDragStart(event, item.id)}
                                        onDragOver={(event) => onDragOver(event, item.id)}
                                        onDrop={(event) => onDrop(event, item.id)}
                                        onDragEnd={() => {
                                            setDraggingId(null);
                                            setDragOverId(null);
                                        }}
                                        className={`rounded-xl border bg-white/80 p-3 ${
                                            dragOverId === item.id ? "border-accent bg-accent/10" : "border-ring"
                                        } ${draggingId === item.id ? "opacity-60" : ""}`}
                                        title={t("Arrastra para ordenar", "Drag to reorder")}
                                    >
                                        <summary className="cursor-pointer list-none">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-semibold text-ink">{item.name}</p>
                                                    <p className="text-[11px] text-ink-muted">
                                                        {t(CATEGORY_LABELS[item.category]?.es ?? "Objeto", CATEGORY_LABELS[item.category]?.en ?? "Item")}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.equippable && (
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                toggleEquip(item.id);
                                                            }}
                                                            className="text-[10px] px-2 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                                                        >
                                                            {item.equipped ? t("Desequipar", "Unequip") : t("Equipar", "Equip")}
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            openEditItem(item);
                                                        }}
                                                        className="text-[10px] px-2 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                                                    >
                                                        {t("Editar", "Edit")}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            removeItem(item.id);
                                                        }}
                                                        className="text-[10px] px-2 py-1 rounded-md border border-red-400/70 text-red-600 bg-red-50 hover:bg-red-100"
                                                    >
                                                        {t("Eliminar", "Delete")}
                                                    </button>
                                                </div>
                                            </div>
                                        </summary>
                                        {mods.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {mods.map((mod, index) => (
                                                    <span
                                                        key={`${mod.target}-${index}`}
                                                        className="text-[10px] px-2 py-0.5 rounded-full border border-ring text-ink"
                                                    >
                                                        {getTargetLabel(mod.target, locale)}{" "}
                                                        {mod.value >= 0 ? `+${mod.value}` : mod.value}
                                                        {mod.note ? ` · ${mod.note}` : ""}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {desc && <Markdown content={desc} className="mt-2 text-ink-muted text-xs" />}
                                        {itemConfigurations.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                <p className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                                                    {t("Configuraciones", "Configurations")}
                                                </p>
                                                {itemConfigurations.map((config) => {
                                                    const configDescription = getLocalizedText(
                                                        config.description,
                                                        locale
                                                    );
                                                    const configAttachments = Array.isArray(
                                                        config.attachments
                                                    )
                                                        ? config.attachments
                                                        : [];
                                                    const isActive =
                                                        item.activeConfigurationId === config.id;
                                                    return (
                                                        <div
                                                            key={config.id}
                                                            className={`rounded-md border p-2 ${
                                                                isActive
                                                                    ? "border-emerald-500/60 bg-emerald-50/60"
                                                                    : "border-ring bg-panel/70"
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="text-xs font-semibold text-ink">
                                                                    {config.name}
                                                                </p>
                                                                {isActive && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/50 text-emerald-700">
                                                                        {t("Activa", "Active")}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {(config.usage ||
                                                                config.damage ||
                                                                config.range ||
                                                                typeof config.magicBonus ===
                                                                    "number") && (
                                                                <p className="mt-1 text-[11px] text-ink-muted">
                                                                    {[
                                                                        config.usage
                                                                            ? `${t("Uso", "Usage")}: ${config.usage}`
                                                                            : null,
                                                                        config.damage
                                                                            ? `${t("Daño", "Damage")}: ${config.damage}`
                                                                            : null,
                                                                        config.range
                                                                            ? `${t("Alcance", "Range")}: ${config.range}`
                                                                            : null,
                                                                        typeof config.magicBonus ===
                                                                        "number"
                                                                            ? `${t("Bono", "Bonus")}: ${
                                                                                  config.magicBonus >= 0
                                                                                      ? `+${config.magicBonus}`
                                                                                      : config.magicBonus
                                                                              }`
                                                                            : null,
                                                                    ]
                                                                        .filter(Boolean)
                                                                        .join(" · ")}
                                                                </p>
                                                            )}
                                                            {configDescription && (
                                                                <Markdown
                                                                    content={configDescription}
                                                                    className="mt-1 text-ink-muted text-xs"
                                                                />
                                                            )}
                                                            {configAttachments.length > 0 && (
                                                                <div className="mt-2 space-y-2">
                                                                    {configAttachments.map((attachment) => {
                                                                        const attachmentMarkdown =
                                                                            formatItemAttachmentMarkdown(
                                                                                attachment,
                                                                                locale
                                                                            );
                                                                        return (
                                                                            <div
                                                                                key={attachment.id}
                                                                                className="rounded-md border border-ring bg-white/80 p-2"
                                                                            >
                                                                                <p className="text-xs font-semibold text-ink">
                                                                                    {attachment.name}
                                                                                    {typeof attachment.level ===
                                                                                    "number"
                                                                                        ? ` · ${t("Nivel", "Level")} ${attachment.level}`
                                                                                        : ""}
                                                                                </p>
                                                                                <p className="text-[11px] text-ink-muted">
                                                                                    {getAttachmentTypeLabel(
                                                                                        attachment.type,
                                                                                        locale
                                                                                    )}
                                                                                </p>
                                                                                {attachmentMarkdown && (
                                                                                    <Markdown
                                                                                        content={attachmentMarkdown}
                                                                                        className="mt-1 text-ink-muted text-xs"
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {itemAttachments.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                <p className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                                                    {t("Adjuntos", "Attachments")}
                                                </p>
                                                {itemAttachments.map((attachment) => {
                                                    const attachmentMarkdown =
                                                        formatItemAttachmentMarkdown(
                                                            attachment,
                                                            locale
                                                        );
                                                    return (
                                                        <div
                                                            key={attachment.id}
                                                            className="rounded-md border border-ring bg-panel/70 p-2"
                                                        >
                                                            <p className="text-xs font-semibold text-ink">
                                                                {attachment.name}
                                                                {typeof attachment.level === "number"
                                                                    ? ` · ${t("Nivel", "Level")} ${attachment.level}`
                                                                    : ""}
                                                            </p>
                                                            <p className="text-[11px] text-ink-muted">
                                                                {getAttachmentTypeLabel(
                                                                    attachment.type,
                                                                    locale
                                                                )}
                                                            </p>
                                                            {attachmentMarkdown && (
                                                                <Markdown
                                                                    content={attachmentMarkdown}
                                                                    className="mt-1 text-ink-muted text-xs"
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </details>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
