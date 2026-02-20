"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Sparkles, X, SendHorizontal, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { tr } from "@/lib/i18n/translate";

type MutationResult = {
    operation: "create" | "update";
    characterId?: string;
    bestiaryEntryId?: string;
    status: "applied" | "blocked" | "skipped" | "error";
    message: string;
};

type ProposedAction = {
    operation: "create" | "update";
    characterId?: string;
    note?: string;
    data?: Record<string, unknown>;
};

type AssistantPayload = {
    reply?: string;
    results?: MutationResult[];
    proposedActions?: unknown;
    error?: string;
};

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    text: string;
    results?: MutationResult[];
    proposedActions?: ProposedAction[];
};

type PendingActionEditorDraft = {
    id: string;
    operation: ProposedAction["operation"];
    characterId: string;
    note: string;
    dataText: string;
};

type PendingPlan = {
    prompt: string;
    targetCharacterId?: string;
    originalProposedActions: ProposedAction[];
    editorDrafts: PendingActionEditorDraft[];
    previewReply?: string;
};

type LocalEditMemory = {
    id: string;
    timestamp: string;
    summary: string;
};

type FloatingButtonPosition = {
    left: number;
    top: number;
};

type FloatingButtonDockSide = "left" | "right";

type FloatingButtonDragState = {
    startMouseX: number;
    startMouseY: number;
    startLeft: number;
    startTop: number;
    moved: boolean;
};

type AssistantMode = "normal" | "training";
type TrainingSubmode = "ai_prompt" | "sandbox_object";
type ItemCategory = "weapon" | "armor" | "accessory" | "consumable" | "tool" | "misc";
type DraftAttachmentType =
    | "trait"
    | "ability"
    | "action"
    | "spell"
    | "cantrip"
    | "classFeature"
    | "other";
type DraftFeatureActionType = "action" | "bonus" | "reaction" | "passive" | "";
type DraftAbilityKey = "" | "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";
type DraftSaveType = "none" | "attack" | "save";
type DraftDcType = "" | "fixed" | "stat";
type DraftRecharge = "" | "short" | "long";

type TrainingAttachmentDraft = {
    id: string;
    type: DraftAttachmentType;
    name: string;
    description: string;
    actionType: DraftFeatureActionType;
    level: string;
    school: string;
    castingTime: string;
    castingTimeNote: string;
    range: string;
    duration: string;
    componentVerbal: boolean;
    componentSomatic: boolean;
    componentMaterial: boolean;
    materials: string;
    concentration: boolean;
    ritual: boolean;
    usesSpellSlot: boolean;
    slotLevel: string;
    charges: string;
    recharge: DraftRecharge;
    pointsLabel: string;
    points: string;
    saveType: DraftSaveType;
    saveAbility: DraftAbilityKey;
    dcType: DraftDcType;
    dcValue: string;
    dcStat: DraftAbilityKey;
    damageType: string;
    damageDice: string;
    damageScaling: string;
    requirements: string;
    effect: string;
};

type TrainingItemDraft = {
    targetItemName: string;
    category: ItemCategory;
    rarity: string;
    description: string;
    createIfMissing: boolean;
    equippable: boolean;
    equipped: boolean;
    attachments: TrainingAttachmentDraft[];
};

const ITEM_CATEGORY_OPTIONS: Array<{ value: ItemCategory; es: string; en: string }> = [
    { value: "weapon", es: "Arma", en: "Weapon" },
    { value: "armor", es: "Armadura", en: "Armor" },
    { value: "accessory", es: "Accesorio", en: "Accessory" },
    { value: "consumable", es: "Consumible", en: "Consumable" },
    { value: "tool", es: "Herramienta", en: "Tool" },
    { value: "misc", es: "Misceláneo", en: "Misc" },
];

const ATTACHMENT_TYPE_OPTIONS: Array<{
    value: DraftAttachmentType;
    es: string;
    en: string;
}> = [
    { value: "trait", es: "Rasgo", en: "Trait" },
    { value: "ability", es: "Habilidad", en: "Ability" },
    { value: "action", es: "Acción", en: "Action" },
    { value: "spell", es: "Hechizo", en: "Spell" },
    { value: "cantrip", es: "Truco", en: "Cantrip" },
    { value: "classFeature", es: "Clase", en: "Class feature" },
    { value: "other", es: "Otro", en: "Other" },
];

const FEATURE_ACTION_OPTIONS: Array<{
    value: Exclude<DraftFeatureActionType, "">;
    es: string;
    en: string;
}> = [
    { value: "action", es: "Acción", en: "Action" },
    { value: "bonus", es: "Acción bonus", en: "Bonus action" },
    { value: "reaction", es: "Reacción", en: "Reaction" },
    { value: "passive", es: "Pasiva", en: "Passive" },
];

const ATTACHMENT_ABILITY_OPTIONS: Array<{
    value: Exclude<DraftAbilityKey, "">;
    es: string;
    en: string;
}> = [
    { value: "STR", es: "Fuerza", en: "Strength" },
    { value: "DEX", es: "Destreza", en: "Dexterity" },
    { value: "CON", es: "Constitución", en: "Constitution" },
    { value: "INT", es: "Inteligencia", en: "Intelligence" },
    { value: "WIS", es: "Sabiduría", en: "Wisdom" },
    { value: "CHA", es: "Carisma", en: "Charisma" },
];

const SPELL_CASTING_TIME_OPTIONS = [
    "1 acción",
    "1 acción bonus",
    "1 reacción",
    "1 minuto",
    "10 minutos",
    "1 hora",
];

const ATTACHMENT_SAVE_TYPE_OPTIONS: Array<{
    value: DraftSaveType;
    es: string;
    en: string;
}> = [
    { value: "none", es: "Ninguno", en: "None" },
    { value: "attack", es: "Ataque", en: "Attack" },
    { value: "save", es: "Salvación", en: "Saving throw" },
];

const ATTACHMENT_DC_TYPE_OPTIONS: Array<{
    value: Exclude<DraftDcType, "">;
    es: string;
    en: string;
}> = [
    { value: "stat", es: "Basada en atributo", en: "Based on stat" },
    { value: "fixed", es: "Fija", en: "Fixed" },
];

const ATTACHMENT_RECHARGE_OPTIONS: Array<{
    value: Exclude<DraftRecharge, "">;
    es: string;
    en: string;
}> = [
    { value: "short", es: "Descanso corto", en: "Short rest" },
    { value: "long", es: "Descanso largo", en: "Long rest" },
];

const AI_NOTICE_ACK_STORAGE_KEY_PREFIX = "dnd-ai-notice-ack-v1";
const AI_GLOBAL_TRAINING_OPT_IN_STORAGE_KEY_PREFIX =
    "dnd-ai-global-training-opt-in-v1";
const AI_LOCAL_EDIT_MEMORY_STORAGE_KEY_PREFIX = "dnd-ai-local-edit-memory-v1";
const AI_CHAT_BUTTON_POSITION_STORAGE_KEY_PREFIX = "dnd-ai-chat-button-pos-v1";

export type AIAssistantClientContext = {
    surface?: "player" | "dm";
    locale?: string;
    section?: string;
    panelMode?: string;
    activeTab?: string;
    selectedCharacter?: {
        id?: string | null;
        name?: string | null;
        class?: string | null;
        race?: string | null;
        level?: number | null;
        character_type?: "character" | "companion" | null;
    };
    availableActions?: string[];
    hints?: string[];
};

type AIAssistantPanelProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    campaignId: string;
    locale: string;
    selectedCharacterId?: string | null;
    selectedCharacterName?: string | null;
    assistantContext?: AIAssistantClientContext;
    onApplied?: (context?: { results: MutationResult[] }) => Promise<void> | void;
};

type TranslateFn = (es: string, en: string) => string;

function statusClass(status: MutationResult["status"]) {
    if (status === "applied") return "border-emerald-300/55 bg-emerald-50/70 text-emerald-800";
    if (status === "blocked") return "border-amber-300/55 bg-amber-50/70 text-amber-800";
    if (status === "error") return "border-red-300/60 bg-red-50/75 text-red-800";
    return "border-ring bg-panel/75 text-ink-muted";
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function asString(value: unknown, maxLen = 240): string | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen)}...` : trimmed;
}

function asNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
    return typeof value === "boolean" ? value : undefined;
}

function asStringArray(value: unknown, maxItems = 6, maxLen = 80): string[] {
    if (!Array.isArray(value)) return [];
    const out: string[] = [];
    for (const entry of value) {
        const parsed = asString(entry, maxLen);
        if (!parsed) continue;
        out.push(parsed);
        if (out.length >= maxItems) break;
    }
    return out;
}

function formatDetailKey(key: string, t: TranslateFn) {
    const labels: Record<string, string> = {
        notes: t("Notas", "Notes"),
        background: t("Trasfondo", "Background"),
        alignment: t("Alineamiento", "Alignment"),
        personalityTraits: t("Rasgos", "Personality traits"),
        ideals: t("Ideales", "Ideals"),
        bonds: t("Vínculos", "Bonds"),
        flaws: t("Defectos", "Flaws"),
        appearance: t("Apariencia", "Appearance"),
        backstory: t("Historia", "Backstory"),
        languages: t("Idiomas", "Languages"),
        proficiencies: t("Competencias", "Proficiencies"),
        abilities: t("Habilidades", "Abilities"),
        inventory: t("Inventario", "Inventory"),
        equipment: t("Equipo", "Equipment"),
    };
    return labels[key] ?? key;
}

function boolLabel(value: boolean | undefined, t: TranslateFn) {
    if (value === undefined) return undefined;
    return value ? t("Sí", "Yes") : t("No", "No");
}

function ProposedActionPreview({
    action,
    t,
}: {
    action: ProposedAction;
    t: TranslateFn;
}) {
    const data = isRecord(action.data) ? action.data : undefined;
    const bestiaryPatch =
        data && isRecord(data.bestiary_patch) ? data.bestiary_patch : null;
    const bestiaryTargetId = asString(bestiaryPatch?.target_entry_id, 80);
    const bestiaryName = asString(bestiaryPatch?.name, 140);
    const previewTargetLabel =
        action.characterId ??
        bestiaryName ??
        bestiaryTargetId ??
        t("sin objetivo", "no target");
    const sections: Array<{ title: string; lines: string[] }> = [];

    if (data) {
        const mainLines: string[] = [];
        const coreFields: Array<[keyof typeof data, string, string]> = [
            ["name", "Nombre", "Name"],
            ["class", "Clase", "Class"],
            ["race", "Raza", "Race"],
            ["level", "Nivel", "Level"],
            ["experience", "XP", "XP"],
            ["current_hp", "PV actuales", "Current HP"],
            ["max_hp", "PV máximos", "Max HP"],
            ["armor_class", "CA", "AC"],
            ["speed", "Velocidad", "Speed"],
            ["character_type", "Tipo", "Type"],
            ["user_id", "Owner", "Owner"],
        ];
        for (const [key, es, en] of coreFields) {
            const value = data[key];
            const stringValue = asString(value, 90);
            const numberValue = asNumber(value);
            if (stringValue) {
                mainLines.push(`${t(es, en)}: ${stringValue}`);
            } else if (typeof numberValue === "number") {
                mainLines.push(`${t(es, en)}: ${numberValue}`);
            }
        }
        if (mainLines.length > 0) {
            sections.push({
                title: t("Cambios principales", "Main changes"),
                lines: mainLines,
            });
        }

        const stats = isRecord(data.stats) ? data.stats : null;
        if (stats) {
            const entries = ["str", "dex", "con", "int", "wis", "cha"]
                .map((key) => {
                    const value = asNumber(stats[key]);
                    return typeof value === "number" ? `${key.toUpperCase()} ${value}` : null;
                })
                .filter((entry): entry is string => !!entry);
            if (entries.length > 0) {
                sections.push({
                    title: t("Stats", "Stats"),
                    lines: [entries.join(" · ")],
                });
            }
        }

        const detailsPatch = isRecord(data.details_patch) ? data.details_patch : null;
        if (detailsPatch) {
            const lines = Object.entries(detailsPatch)
                .map(([key, value]) => {
                    const parsed = asString(value, 120);
                    if (!parsed) return null;
                    return `${formatDetailKey(key, t)}: ${parsed}`;
                })
                .filter((entry): entry is string => !!entry)
                .slice(0, 6);
            if (lines.length > 0) {
                sections.push({
                    title: t("Detalles", "Details"),
                    lines,
                });
            }
        }

        const itemPatch = isRecord(data.item_patch) ? data.item_patch : null;
        if (itemPatch) {
            const lines: string[] = [];
            const targetItem = asString(itemPatch.target_item_name, 120);
            const newName = asString(itemPatch.name, 120);
            const category = asString(itemPatch.category, 80);
            const rarity = asString(itemPatch.rarity, 80);
            const description = asString(itemPatch.description, 180);
            const quantity = asNumber(itemPatch.quantity);
            const equipped = boolLabel(asBoolean(itemPatch.equipped), t);
            const equippable = boolLabel(asBoolean(itemPatch.equippable), t);
            const createIfMissing = boolLabel(asBoolean(itemPatch.create_if_missing), t);
            const clearAttachments = boolLabel(asBoolean(itemPatch.clear_attachments), t);
            const clearConfigurations = boolLabel(
                asBoolean(itemPatch.clear_configurations),
                t
            );
            const activeConfiguration = asString(itemPatch.active_configuration, 120);
            const tagsAdd = asStringArray(itemPatch.tags_add, 6, 40);
            const tagsRemove = asStringArray(itemPatch.tags_remove, 6, 40);

            if (targetItem) lines.push(`${t("Objeto objetivo", "Target item")}: ${targetItem}`);
            if (newName) lines.push(`${t("Renombrar a", "Rename to")}: ${newName}`);
            if (category) lines.push(`${t("Categoría", "Category")}: ${category}`);
            if (rarity) lines.push(`${t("Rareza", "Rarity")}: ${rarity}`);
            if (typeof quantity === "number") {
                lines.push(`${t("Cantidad", "Quantity")}: ${quantity}`);
            }
            if (equipped) lines.push(`${t("Equipado", "Equipped")}: ${equipped}`);
            if (equippable) lines.push(`${t("Equipable", "Equippable")}: ${equippable}`);
            if (createIfMissing) {
                lines.push(`${t("Crear si falta", "Create if missing")}: ${createIfMissing}`);
            }
            if (clearAttachments) {
                lines.push(
                    `${t("Limpiar adjuntos", "Clear attachments")}: ${clearAttachments}`
                );
            }
            if (clearConfigurations) {
                lines.push(
                    `${t("Limpiar configuraciones", "Clear configurations")}: ${clearConfigurations}`
                );
            }
            if (activeConfiguration) {
                lines.push(
                    `${t("Configuración activa", "Active configuration")}: ${activeConfiguration}`
                );
            }
            if (description) lines.push(`${t("Descripción", "Description")}: ${description}`);
            if (tagsAdd.length > 0) {
                lines.push(`${t("Tags +", "Tags +")}: ${tagsAdd.join(", ")}`);
            }
            if (tagsRemove.length > 0) {
                lines.push(`${t("Tags -", "Tags -")}: ${tagsRemove.join(", ")}`);
            }

            const attachmentSource = Array.isArray(itemPatch.attachments_replace)
                ? itemPatch.attachments_replace
                : Array.isArray(itemPatch.attachments_add)
                  ? itemPatch.attachments_add
                  : [];
            const attachmentNames = attachmentSource
                .map((entry) => {
                    if (!isRecord(entry)) return null;
                    const name = asString(entry.name, 90);
                    const type = asString(entry.type, 30);
                    if (!name) return null;
                    return type ? `${name} (${type})` : name;
                })
                .filter((entry): entry is string => !!entry)
                .slice(0, 6);
            if (attachmentNames.length > 0) {
                lines.push(
                    `${t("Adjuntos", "Attachments")}: ${attachmentNames.join(", ")}`
                );
            }

            const configurationSource = Array.isArray(itemPatch.configurations_replace)
                ? itemPatch.configurations_replace
                : [];
            const configurationNames = configurationSource
                .map((entry) => {
                    if (!isRecord(entry)) return null;
                    const name = asString(entry.name, 90);
                    if (!name) return null;
                    const usage = asString(entry.usage, 60);
                    const damage = asString(entry.damage, 60);
                    const range = asString(entry.range, 60);
                    const hints = [usage, damage, range]
                        .filter((value): value is string => !!value)
                        .slice(0, 2)
                        .join(" · ");
                    return hints ? `${name} (${hints})` : name;
                })
                .filter((entry): entry is string => !!entry)
                .slice(0, 6);
            if (configurationNames.length > 0) {
                lines.push(
                    `${t("Configuraciones", "Configurations")}: ${configurationNames.join(", ")}`
                );
            }

            if (lines.length > 0) {
                sections.push({
                    title: t("Objeto", "Item"),
                    lines,
                });
            }
        }

        const learnedSpellPatch = isRecord(data.learned_spell_patch)
            ? data.learned_spell_patch
            : null;
        if (learnedSpellPatch) {
            const lines: string[] = [];
            const actionType = asString(learnedSpellPatch.action, 20);
            const spellName = asString(learnedSpellPatch.spell_name, 120);
            const spellIndex = asString(learnedSpellPatch.spell_index, 120);
            const level = asNumber(learnedSpellPatch.spell_level);
            if (actionType) lines.push(`${t("Acción", "Action")}: ${actionType}`);
            if (typeof level === "number") lines.push(`${t("Nivel", "Level")}: ${level}`);
            if (spellName) lines.push(`${t("Hechizo", "Spell")}: ${spellName}`);
            if (spellIndex) lines.push(`Index: ${spellIndex}`);
            if (lines.length > 0) {
                sections.push({
                    title: t("Hechizos aprendidos", "Learned spells"),
                    lines,
                });
            }
        }

        const customSpellPatch = isRecord(data.custom_spell_patch)
            ? data.custom_spell_patch
            : null;
        if (customSpellPatch) {
            const lines: string[] = [];
            const target = asString(customSpellPatch.target_spell_name, 120);
            const name = asString(customSpellPatch.name, 120);
            const collection = asString(customSpellPatch.collection, 50);
            const level = asNumber(customSpellPatch.level);
            const school = asString(customSpellPatch.school, 80);
            const remove = boolLabel(asBoolean(customSpellPatch.remove), t);
            const description = asString(customSpellPatch.description, 150);
            if (target) lines.push(`${t("Objetivo", "Target")}: ${target}`);
            if (name) lines.push(`${t("Nombre", "Name")}: ${name}`);
            if (collection) lines.push(`${t("Colección", "Collection")}: ${collection}`);
            if (typeof level === "number") lines.push(`${t("Nivel", "Level")}: ${level}`);
            if (school) lines.push(`${t("Escuela", "School")}: ${school}`);
            if (remove) lines.push(`${t("Eliminar", "Remove")}: ${remove}`);
            if (description) lines.push(`${t("Descripción", "Description")}: ${description}`);
            if (lines.length > 0) {
                sections.push({
                    title: t("Hechizo personalizado", "Custom spell"),
                    lines,
                });
            }
        }

        const customFeaturePatch = isRecord(data.custom_feature_patch)
            ? data.custom_feature_patch
            : null;
        if (customFeaturePatch) {
            const lines: string[] = [];
            const target = asString(customFeaturePatch.target_feature_name, 120);
            const name = asString(customFeaturePatch.name, 120);
            const collection = asString(customFeaturePatch.collection, 50);
            const level = asNumber(customFeaturePatch.level);
            const actionType = asString(customFeaturePatch.action_type, 50);
            const remove = boolLabel(asBoolean(customFeaturePatch.remove), t);
            const description = asString(customFeaturePatch.description, 150);
            if (target) lines.push(`${t("Objetivo", "Target")}: ${target}`);
            if (name) lines.push(`${t("Nombre", "Name")}: ${name}`);
            if (collection) lines.push(`${t("Colección", "Collection")}: ${collection}`);
            if (typeof level === "number") lines.push(`${t("Nivel", "Level")}: ${level}`);
            if (actionType) lines.push(`${t("Tipo de acción", "Action type")}: ${actionType}`);
            if (remove) lines.push(`${t("Eliminar", "Remove")}: ${remove}`);
            if (description) lines.push(`${t("Descripción", "Description")}: ${description}`);
            if (lines.length > 0) {
                sections.push({
                    title: t("Rasgo/Habilidad", "Trait/Feature"),
                    lines,
                });
            }
        }

        if (bestiaryPatch) {
            const lines: string[] = [];
            const sourceType = asString(bestiaryPatch.source_type, 32);
            const creatureType = asString(bestiaryPatch.creature_type, 120);
            const creatureSize = asString(bestiaryPatch.creature_size, 80);
            const alignment = asString(bestiaryPatch.alignment, 120);
            const cr = asNumber(bestiaryPatch.challenge_rating);
            const xp = asNumber(bestiaryPatch.xp);
            const pb = asNumber(bestiaryPatch.proficiency_bonus);
            const ac = asNumber(bestiaryPatch.armor_class);
            const hp = asNumber(bestiaryPatch.hit_points);
            const hitDice = asString(bestiaryPatch.hit_dice, 80);
            const speedRecord = isRecord(bestiaryPatch.speed)
                ? bestiaryPatch.speed
                : null;
            const speedLine = speedRecord
                ? Object.entries(speedRecord)
                      .map(([key, value]) => {
                          const parsed =
                              typeof value === "number"
                                  ? value
                                  : typeof value === "string"
                                    ? Number(value)
                                    : NaN;
                          if (!Number.isFinite(parsed)) return null;
                          return `${key}: ${Math.round(parsed)}`;
                      })
                      .filter((entry): entry is string => !!entry)
                      .join(", ")
                : "";
            const visible = boolLabel(asBoolean(bestiaryPatch.is_player_visible), t);
            if (bestiaryTargetId) {
                lines.push(`ID: ${bestiaryTargetId}`);
            }
            if (bestiaryName) {
                lines.push(`${t("Nombre", "Name")}: ${bestiaryName}`);
            }
            if (sourceType) {
                lines.push(`${t("Origen", "Source")}: ${sourceType}`);
            }
            if (creatureType) {
                lines.push(`${t("Tipo", "Type")}: ${creatureType}`);
            }
            if (creatureSize) {
                lines.push(`${t("Tamaño", "Size")}: ${creatureSize}`);
            }
            if (alignment) {
                lines.push(`${t("Alineamiento", "Alignment")}: ${alignment}`);
            }
            if (typeof cr === "number") {
                lines.push(`CR: ${cr}`);
            }
            if (typeof xp === "number") {
                lines.push(`XP: ${xp}`);
            }
            if (typeof pb === "number") {
                lines.push(`PB: ${pb >= 0 ? `+${pb}` : pb}`);
            }
            if (typeof ac === "number") {
                lines.push(`AC: ${ac}`);
            }
            if (typeof hp === "number") {
                lines.push(`HP: ${hp}`);
            }
            if (hitDice) {
                lines.push(`${t("Dados de golpe", "Hit dice")}: ${hitDice}`);
            }
            if (speedLine) {
                lines.push(`${t("Velocidad", "Speed")}: ${speedLine}`);
            }
            if (visible) {
                lines.push(`${t("Visible a jugadores", "Visible to players")}: ${visible}`);
            }

            const abilityScores = isRecord(bestiaryPatch.ability_scores)
                ? bestiaryPatch.ability_scores
                : null;
            if (abilityScores) {
                const abilityLine = ["STR", "DEX", "CON", "INT", "WIS", "CHA"]
                    .map((key) => {
                        const score = asNumber(abilityScores[key]);
                        return typeof score === "number" ? `${key} ${score}` : null;
                    })
                    .filter((entry): entry is string => !!entry)
                    .join(" · ");
                if (abilityLine) {
                    lines.push(abilityLine);
                }
            }

            const traitCount = Array.isArray(bestiaryPatch.traits)
                ? bestiaryPatch.traits.length
                : 0;
            const actionCount = Array.isArray(bestiaryPatch.actions)
                ? bestiaryPatch.actions.length
                : 0;
            const bonusCount = Array.isArray(bestiaryPatch.bonus_actions)
                ? bestiaryPatch.bonus_actions.length
                : 0;
            const reactionCount = Array.isArray(bestiaryPatch.reactions)
                ? bestiaryPatch.reactions.length
                : 0;
            const legendaryCount = Array.isArray(bestiaryPatch.legendary_actions)
                ? bestiaryPatch.legendary_actions.length
                : 0;
            const lairCount = Array.isArray(bestiaryPatch.lair_actions)
                ? bestiaryPatch.lair_actions.length
                : 0;
            if (
                traitCount > 0 ||
                actionCount > 0 ||
                bonusCount > 0 ||
                reactionCount > 0 ||
                legendaryCount > 0 ||
                lairCount > 0
            ) {
                const blockParts = [
                    traitCount > 0 ? `${t("Rasgos", "Traits")}: ${traitCount}` : null,
                    actionCount > 0 ? `${t("Acciones", "Actions")}: ${actionCount}` : null,
                    bonusCount > 0
                        ? `${t("Bonus", "Bonus actions")}: ${bonusCount}`
                        : null,
                    reactionCount > 0
                        ? `${t("Reacciones", "Reactions")}: ${reactionCount}`
                        : null,
                    legendaryCount > 0
                        ? `${t("Legendarias", "Legendary")}: ${legendaryCount}`
                        : null,
                    lairCount > 0 ? `${t("Guarida", "Lair")}: ${lairCount}` : null,
                ]
                    .filter((entry): entry is string => !!entry)
                    .join(" · ");
                if (blockParts) lines.push(blockParts);
            }

            if (lines.length > 0) {
                sections.push({
                    title: t("Criatura de bestiario", "Bestiary creature"),
                    lines,
                });
            }
        }
    }

    return (
        <div className="rounded-xl border border-ring bg-panel/90 px-2.5 py-2 text-ink shadow-[0_6px_16px_rgba(45,29,12,0.07)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                {action.operation} · {previewTargetLabel}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed">
                {action.note ??
                    t(
                        "Cambio pendiente de confirmación.",
                        "Pending change awaiting confirmation."
                    )}
            </p>

            {sections.length > 0 ? (
                <div className="mt-2 space-y-2">
                    {sections.map((section, index) => (
                        <div
                            key={`${action.operation}-${action.characterId ?? "none"}-${section.title}-${index}`}
                            className="rounded-md border border-ring/80 bg-white/80 px-2 py-1.5"
                        >
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                                {section.title}
                            </p>
                            <ul className="mt-1 space-y-0.5">
                                {section.lines.map((line, lineIndex) => (
                                    <li
                                        key={`${section.title}-${lineIndex}`}
                                        className="text-[11px] text-ink"
                                    >
                                        {line}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="mt-1 text-[11px] text-ink-muted">
                    {t(
                        "Vista previa sin detalle estructurado.",
                        "Preview without structured details."
                    )}
                </p>
            )}
        </div>
    );
}

function sanitizeProposedActions(value: unknown): ProposedAction[] {
    if (!Array.isArray(value)) return [];
    const actions: ProposedAction[] = [];

    for (const entry of value.slice(0, 4)) {
        if (!isRecord(entry)) continue;
        const operation = entry.operation;
        if (operation !== "create" && operation !== "update") continue;

        const characterId =
            typeof entry.characterId === "string" && entry.characterId.trim()
                ? entry.characterId.trim()
                : undefined;
        const note =
            typeof entry.note === "string" && entry.note.trim()
                ? entry.note.trim()
                : undefined;
        const data = isRecord(entry.data) ? entry.data : undefined;

        actions.push({
            operation,
            characterId,
            note,
            data,
        });
    }

    return actions;
}

function makeDraftId(prefix = "draft") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPendingActionEditorDrafts(
    actions: ProposedAction[]
): PendingActionEditorDraft[] {
    if (!Array.isArray(actions) || actions.length === 0) {
        return [
            {
                id: makeDraftId("pending"),
                operation: "update",
                characterId: "",
                note: "",
                dataText: "{}",
            },
        ];
    }
    return actions.map((entry) => ({
        id: makeDraftId("pending"),
        operation: entry.operation,
        characterId: entry.characterId ?? "",
        note: entry.note ?? "",
        dataText: entry.data ? JSON.stringify(entry.data, null, 2) : "{}",
    }));
}

function areProposedActionListsEqual(left: ProposedAction[], right: ProposedAction[]) {
    if (left.length !== right.length) return false;
    const normalized = (value: ProposedAction[]) =>
        value.map((entry) => ({
            operation: entry.operation,
            characterId: entry.characterId ?? null,
            note: entry.note ?? null,
            data: entry.data ?? null,
        }));
    return JSON.stringify(normalized(left)) === JSON.stringify(normalized(right));
}

function summarizeProposedActionEdits(
    original: ProposedAction[],
    edited: ProposedAction[]
) {
    if (areProposedActionListsEqual(original, edited)) return "";
    const parts: string[] = [];
    if (original.length !== edited.length) {
        parts.push(`nº de acciones: ${original.length} -> ${edited.length}`);
    }
    const minLength = Math.min(original.length, edited.length);
    for (let index = 0; index < minLength; index += 1) {
        const before = original[index];
        const after = edited[index];
        const diffs: string[] = [];
        if (before.operation !== after.operation) {
            diffs.push(`operación ${before.operation} -> ${after.operation}`);
        }
        if ((before.characterId ?? "") !== (after.characterId ?? "")) {
            diffs.push(
                `personaje "${before.characterId ?? "-"}" -> "${after.characterId ?? "-"}"`
            );
        }
        if ((before.note ?? "") !== (after.note ?? "")) {
            diffs.push("nota editada");
        }
        const beforeData = JSON.stringify(before.data ?? null);
        const afterData = JSON.stringify(after.data ?? null);
        if (beforeData !== afterData) {
            diffs.push("data editada");
        }
        if (diffs.length > 0) {
            parts.push(`acción ${index + 1}: ${diffs.join(", ")}`);
        }
        if (parts.length >= 6) break;
    }
    return parts.join(" | ").slice(0, 900);
}

function createEmptyTrainingAttachmentDraft(): TrainingAttachmentDraft {
    return {
        id: makeDraftId("att"),
        type: "trait",
        name: "",
        description: "",
        actionType: "",
        level: "",
        school: "",
        castingTime: "1 acción",
        castingTimeNote: "",
        range: "",
        duration: "",
        componentVerbal: false,
        componentSomatic: false,
        componentMaterial: false,
        materials: "",
        concentration: false,
        ritual: false,
        usesSpellSlot: false,
        slotLevel: "",
        charges: "",
        recharge: "",
        pointsLabel: "",
        points: "",
        saveType: "none",
        saveAbility: "",
        dcType: "",
        dcValue: "",
        dcStat: "",
        damageType: "",
        damageDice: "",
        damageScaling: "",
        requirements: "",
        effect: "",
    };
}

function createEmptyTrainingItemDraft(): TrainingItemDraft {
    return {
        targetItemName: "",
        category: "misc",
        rarity: "",
        description: "",
        createIfMissing: true,
        equippable: false,
        equipped: false,
        attachments: [createEmptyTrainingAttachmentDraft()],
    };
}

function normalizeDraftAttachmentType(value: unknown): DraftAttachmentType {
    const parsed = asString(value, 30);
    if (!parsed) return "trait";
    if (
        parsed === "trait" ||
        parsed === "ability" ||
        parsed === "action" ||
        parsed === "spell" ||
        parsed === "cantrip" ||
        parsed === "classFeature" ||
        parsed === "other"
    ) {
        return parsed;
    }
    return "trait";
}

function normalizeDraftActionType(value: unknown): DraftFeatureActionType {
    const parsed = asString(value, 20);
    if (!parsed) return "";
    if (
        parsed === "action" ||
        parsed === "bonus" ||
        parsed === "reaction" ||
        parsed === "passive"
    ) {
        return parsed;
    }
    return "";
}

function normalizeDraftAbilityKey(value: unknown): DraftAbilityKey {
    const parsed = asString(value, 12);
    if (!parsed) return "";
    if (
        parsed === "STR" ||
        parsed === "DEX" ||
        parsed === "CON" ||
        parsed === "INT" ||
        parsed === "WIS" ||
        parsed === "CHA"
    ) {
        return parsed;
    }
    return "";
}

function normalizeDraftSaveType(value: unknown): DraftSaveType {
    const parsed = asString(value, 20);
    if (!parsed) return "none";
    if (parsed === "attack" || parsed === "save" || parsed === "none") {
        return parsed;
    }
    return "none";
}

function normalizeDraftDcType(value: unknown): DraftDcType {
    const parsed = asString(value, 20);
    if (!parsed) return "";
    if (parsed === "fixed" || parsed === "stat") return parsed;
    return "";
}

function normalizeDraftRecharge(value: unknown): DraftRecharge {
    const parsed = asString(value, 20);
    if (!parsed) return "";
    if (parsed === "short" || parsed === "long") return parsed;
    return "";
}

function parseDraftInt(value: string, min: number, max: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return undefined;
    const rounded = Math.round(parsed);
    if (rounded < min || rounded > max) return undefined;
    return rounded;
}

function isTrainingDraftSpellLike(type: DraftAttachmentType) {
    return type === "spell" || type === "cantrip";
}

function isTrainingDraftAbilityLike(type: DraftAttachmentType) {
    return type === "action" || type === "ability" || type === "classFeature";
}

function parseTrainingDraftFromActions(actions: ProposedAction[]) {
    for (const action of actions) {
        if (!isRecord(action.data)) continue;
        const itemPatch = isRecord(action.data.item_patch)
            ? action.data.item_patch
            : null;
        if (!itemPatch) continue;
        const hasModularConfigurations =
            Array.isArray(itemPatch.configurations_replace) ||
            itemPatch.active_configuration !== undefined ||
            asBoolean(itemPatch.clear_configurations) !== undefined;
        if (hasModularConfigurations) {
            return null;
        }

        const attachmentSource = Array.isArray(itemPatch.attachments_replace)
            ? itemPatch.attachments_replace
            : Array.isArray(itemPatch.attachments_add)
              ? itemPatch.attachments_add
              : [];

        const attachments: TrainingAttachmentDraft[] = attachmentSource
            .map((entry) => {
                if (!isRecord(entry)) return null;
                const name = asString(entry.name, 140) ?? "";
                const description = asString(entry.description, 1800) ?? "";
                if (!name && !description) return null;
                const resourceCost = isRecord(entry.resource_cost)
                    ? entry.resource_cost
                    : null;
                const save = isRecord(entry.save) ? entry.save : null;
                const damage = isRecord(entry.damage) ? entry.damage : null;
                const components = isRecord(entry.components) ? entry.components : null;
                return {
                    id: makeDraftId("att"),
                    type: normalizeDraftAttachmentType(entry.type),
                    name,
                    description,
                    actionType: normalizeDraftActionType(entry.action_type),
                    level:
                        typeof entry.level === "number" && Number.isFinite(entry.level)
                            ? String(Math.round(entry.level))
                            : "",
                    school: asString(entry.school, 80) ?? "",
                    castingTime: asString(entry.casting_time, 80) ?? "1 acción",
                    castingTimeNote: asString(entry.casting_time_note, 120) ?? "",
                    range: asString(entry.range, 120) ?? "",
                    duration: asString(entry.duration, 120) ?? "",
                    componentVerbal: asBoolean(components?.verbal) ?? false,
                    componentSomatic: asBoolean(components?.somatic) ?? false,
                    componentMaterial: asBoolean(components?.material) ?? false,
                    materials: asString(entry.materials, 220) ?? "",
                    concentration: asBoolean(entry.concentration) ?? false,
                    ritual: asBoolean(entry.ritual) ?? false,
                    usesSpellSlot: asBoolean(resourceCost?.uses_spell_slot) ?? false,
                    slotLevel:
                        typeof resourceCost?.slot_level === "number" &&
                        Number.isFinite(resourceCost.slot_level)
                            ? String(Math.round(resourceCost.slot_level))
                            : "",
                    charges:
                        typeof resourceCost?.charges === "number" &&
                        Number.isFinite(resourceCost.charges)
                            ? String(Math.round(resourceCost.charges))
                            : "",
                    recharge: normalizeDraftRecharge(resourceCost?.recharge),
                    pointsLabel: asString(resourceCost?.points_label, 80) ?? "",
                    points:
                        typeof resourceCost?.points === "number" &&
                        Number.isFinite(resourceCost.points)
                            ? String(Math.round(resourceCost.points))
                            : "",
                    saveType: normalizeDraftSaveType(save?.type),
                    saveAbility: normalizeDraftAbilityKey(save?.save_ability),
                    dcType: normalizeDraftDcType(save?.dc_type),
                    dcValue:
                        typeof save?.dc_value === "number" && Number.isFinite(save.dc_value)
                            ? String(Math.round(save.dc_value))
                            : "",
                    dcStat: normalizeDraftAbilityKey(save?.dc_stat),
                    damageType: asString(damage?.damage_type, 80) ?? "",
                    damageDice: asString(damage?.dice, 40) ?? "",
                    damageScaling: asString(damage?.scaling, 120) ?? "",
                    requirements: asString(entry.requirements, 300) ?? "",
                    effect: asString(entry.effect, 1200) ?? "",
                } satisfies TrainingAttachmentDraft;
            })
            .filter((entry): entry is TrainingAttachmentDraft => !!entry);

        const categoryRaw = asString(itemPatch.category, 30);
        const category: ItemCategory =
            categoryRaw === "weapon" ||
            categoryRaw === "armor" ||
            categoryRaw === "accessory" ||
            categoryRaw === "consumable" ||
            categoryRaw === "tool" ||
            categoryRaw === "misc"
                ? categoryRaw
                : "misc";

        const draft: TrainingItemDraft = {
            targetItemName:
                asString(itemPatch.target_item_name, 180) ??
                asString(itemPatch.name, 180) ??
                "",
            category,
            rarity: asString(itemPatch.rarity, 120) ?? "",
            description: asString(itemPatch.description, 3000) ?? "",
            createIfMissing: asBoolean(itemPatch.create_if_missing) ?? true,
            equippable: asBoolean(itemPatch.equippable) ?? false,
            equipped: asBoolean(itemPatch.equipped) ?? false,
            attachments:
                attachments.length > 0
                    ? attachments
                    : [createEmptyTrainingAttachmentDraft()],
        };

        return {
            characterId: action.characterId,
            draft,
        };
    }
    return null;
}

function buildTrainingActionsFromDraft({
    draft,
    targetCharacterId,
}: {
    draft: TrainingItemDraft;
    targetCharacterId?: string;
}): ProposedAction[] {
    const targetItemName = draft.targetItemName.trim();
    if (!targetItemName) return [];

    const attachments = draft.attachments
        .map((entry) => {
            const name = entry.name.trim();
            const description = entry.description.trim();
            if (!name && !description) return null;
            const isSpellLike = isTrainingDraftSpellLike(entry.type);
            const isAbilityLike = isTrainingDraftAbilityLike(entry.type);
            const payload: Record<string, unknown> = {
                type: entry.type,
                name: name || "Adjunto",
                description: description || undefined,
            };
            if (isAbilityLike && entry.actionType) {
                payload.action_type = entry.actionType;
            }
            if (isSpellLike) {
                const level = parseDraftInt(entry.level, 0, 9);
                if (typeof level === "number") payload.level = level;
                else if (entry.type === "cantrip") payload.level = 0;
            }

            const school = entry.school.trim();
            if (isSpellLike && school) payload.school = school;
            const castingTime = entry.castingTime.trim();
            if (isSpellLike && castingTime) payload.casting_time = castingTime;
            const castingTimeNote = entry.castingTimeNote.trim();
            if (isSpellLike && castingTimeNote) payload.casting_time_note = castingTimeNote;
            const range = entry.range.trim();
            if (isSpellLike && range) payload.range = range;
            const duration = entry.duration.trim();
            if (isSpellLike && duration) payload.duration = duration;

            if (isSpellLike) {
                const hasComponents =
                    entry.componentVerbal || entry.componentSomatic || entry.componentMaterial;
                if (hasComponents) {
                    payload.components = {
                        verbal: entry.componentVerbal,
                        somatic: entry.componentSomatic,
                        material: entry.componentMaterial,
                    };
                }
                const materials = entry.materials.trim();
                if (materials) payload.materials = materials;
                if (entry.concentration) payload.concentration = true;
                if (entry.ritual) payload.ritual = true;
            }

            const requirements = entry.requirements.trim();
            if (isAbilityLike && requirements) payload.requirements = requirements;
            const effect = entry.effect.trim();
            if (isAbilityLike && effect) payload.effect = effect;

            const resourceCost: Record<string, unknown> = {};
            if (entry.usesSpellSlot) resourceCost.uses_spell_slot = true;
            const slotLevel = parseDraftInt(entry.slotLevel, 0, 9);
            if (typeof slotLevel === "number") resourceCost.slot_level = slotLevel;
            const charges = parseDraftInt(entry.charges, 0, 999);
            if (typeof charges === "number") resourceCost.charges = charges;
            if (entry.recharge === "short" || entry.recharge === "long") {
                resourceCost.recharge = entry.recharge;
            }
            const pointsLabel = entry.pointsLabel.trim();
            if (pointsLabel) resourceCost.points_label = pointsLabel;
            const points = parseDraftInt(entry.points, 0, 999);
            if (typeof points === "number") resourceCost.points = points;
            if (Object.keys(resourceCost).length > 0) {
                payload.resource_cost = resourceCost;
            }

            if (entry.saveType !== "none") {
                const savePatch: Record<string, unknown> = {
                    type: entry.saveType,
                };
                if (entry.saveAbility) savePatch.save_ability = entry.saveAbility;
                if (entry.dcType === "fixed") {
                    savePatch.dc_type = "fixed";
                    const dcValue = parseDraftInt(entry.dcValue, 0, 99);
                    if (typeof dcValue === "number") savePatch.dc_value = dcValue;
                } else if (entry.dcType === "stat") {
                    savePatch.dc_type = "stat";
                    if (entry.dcStat) savePatch.dc_stat = entry.dcStat;
                }
                payload.save = savePatch;
            }

            const damageType = entry.damageType.trim();
            const damageDice = entry.damageDice.trim();
            const damageScaling = entry.damageScaling.trim();
            if (damageType || damageDice || damageScaling) {
                payload.damage = {
                    damage_type: damageType || undefined,
                    dice: damageDice || undefined,
                    scaling: damageScaling || undefined,
                };
            }
            return payload;
        })
        .filter((entry): entry is Record<string, unknown> => !!entry);

    const itemPatch: Record<string, unknown> = {
        target_item_name: targetItemName,
        category: draft.category,
        rarity: draft.rarity.trim() || undefined,
        description: draft.description.trim() || undefined,
        create_if_missing: draft.createIfMissing,
        equippable: draft.equippable,
        equipped: draft.equipped,
        attachments_replace:
            attachments.length > 0 ? attachments : undefined,
    };

    return [
        {
            operation: "update",
            characterId: targetCharacterId,
            note: "Borrador de entrenamiento editable en chat.",
            data: {
                item_patch: itemPatch,
            },
        },
    ];
}

function makeMessage(
    role: ChatMessage["role"],
    text: string,
    options?: {
        results?: MutationResult[];
        proposedActions?: ProposedAction[];
    }
): ChatMessage {
    return {
        id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role,
        text,
        results: options?.results,
        proposedActions: options?.proposedActions,
    };
}

export default function AIAssistantPanel({
    open,
    onOpenChange,
    campaignId,
    locale,
    selectedCharacterId,
    selectedCharacterName,
    assistantContext,
    onApplied,
}: AIAssistantPanelProps) {
    const FLOATING_DOCK_THRESHOLD = 24;
    const DESKTOP_PANEL_MARGIN = 10;
    const DESKTOP_PANEL_DOCK_THRESHOLD = 40;
    const DESKTOP_PANEL_DEFAULT_HEIGHT = 720;
    const MIN_PANEL_WIDTH = 320;
    const TRAINING_LAYOUT_MIN_PANEL_WIDTH = 620;
    const TRAINING_EDITOR_DEFAULT_RATIO = 0.58;
    const TRAINING_EDITOR_MIN_WIDTH = 320;
    const TRAINING_CHAT_MIN_WIDTH = 260;
    const TRAINING_EDITOR_SPLIT_GAP = 18;
    const NORMAL_PANEL_DEFAULT_WIDTH = 460;
    const NORMAL_PANEL_MAX_WIDTH = 640;
    const WIDE_PANEL_DEFAULT_WIDTH = 1120;
    const WIDE_PANEL_MAX_WIDTH = 1880;

    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [pendingPlan, setPendingPlan] = useState<PendingPlan | null>(null);
    const [pendingPlanUsesTrainingEditor, setPendingPlanUsesTrainingEditor] =
        useState(false);
    const [assistantMode, setAssistantMode] = useState<AssistantMode>("normal");
    const [trainingSubmode, setTrainingSubmode] =
        useState<TrainingSubmode>("ai_prompt");
    const [trainingDraft, setTrainingDraft] = useState<TrainingItemDraft>(
        createEmptyTrainingItemDraft
    );
    const [trainingDraftTargetCharacterId, setTrainingDraftTargetCharacterId] = useState<
        string | undefined
    >(selectedCharacterId ?? undefined);
    const [trainingDraftNotes, setTrainingDraftNotes] = useState("");
    const [trainingDraftError, setTrainingDraftError] = useState<string | null>(null);
    const [trainingEditorCollapsed, setTrainingEditorCollapsed] = useState(false);
    const [trainingEditorCompact, setTrainingEditorCompact] = useState(false);
    const [trainingEditorRatio, setTrainingEditorRatio] = useState(
        TRAINING_EDITOR_DEFAULT_RATIO
    );
    const [aiNoticeAcknowledged, setAiNoticeAcknowledged] = useState(false);
    const [globalTrainingConsent, setGlobalTrainingConsent] = useState(false);
    const [localEditMemories, setLocalEditMemories] = useState<LocalEditMemory[]>([]);
    const [viewportWidth, setViewportWidth] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);
    const [panelHeaderHeight, setPanelHeaderHeight] = useState(0);
    const [panelWidth, setPanelWidth] = useState(420);
    const [panelHeight, setPanelHeight] = useState(DESKTOP_PANEL_DEFAULT_HEIGHT);
    const [panelPosition, setPanelPosition] = useState<FloatingButtonPosition | null>(null);
    const [panelNearDockSide, setPanelNearDockSide] =
        useState<FloatingButtonDockSide | null>(null);
    const [draggingPanel, setDraggingPanel] = useState(false);
    const [resizing, setResizing] = useState(false);
    const [resizingHeight, setResizingHeight] = useState(false);
    const [resizingTrainingSplit, setResizingTrainingSplit] = useState(false);
    const [floatingButtonPosition, setFloatingButtonPosition] =
        useState<FloatingButtonPosition | null>(null);
    const [floatingButtonDockSide, setFloatingButtonDockSide] =
        useState<FloatingButtonDockSide>("right");
    const [floatingButtonNearDockSide, setFloatingButtonNearDockSide] =
        useState<FloatingButtonDockSide | null>(null);
    const [floatingButtonPinnedToHeader, setFloatingButtonPinnedToHeader] = useState(false);
    const [draggingFloatingButton, setDraggingFloatingButton] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const resizeStartRef = useRef<{ x: number; width: number } | null>(null);
    const resizeHeightStartRef = useRef<{ y: number; height: number } | null>(null);
    const trainingSplitResizeStartRef = useRef<{ x: number; width: number } | null>(null);
    const panelRef = useRef<HTMLElement | null>(null);
    const panelHeaderRef = useRef<HTMLElement | null>(null);
    const panelPositionRef = useRef<FloatingButtonPosition | null>(null);
    const panelDragRef = useRef<FloatingButtonDragState | null>(null);
    const floatingButtonRef = useRef<HTMLButtonElement | null>(null);
    const floatingButtonPositionRef = useRef<FloatingButtonPosition | null>(null);
    const floatingButtonDockSideRef = useRef<FloatingButtonDockSide>("right");
    const floatingButtonDragRef = useRef<FloatingButtonDragState | null>(null);
    const skipNextFloatingButtonClickRef = useRef(false);

    const t = (es: string, en: string) => tr(locale, es, en);
    const getWelcomeMessage = (mode: AssistantMode) =>
        mode === "training"
            ? t(
                  "Modo entrenamiento activo. Pásame tu prompt y te propongo una versión mejor para crear objetos, hechizos, rasgos o cualquier cambio.",
                  "Training mode enabled. Send me your prompt and I will propose a better version to create objects, spells, traits, or any change."
              )
            : t(
                  "Hola. Soy tu asistente IA. Te propondré cambios y tú confirmas si se aplican.",
                  "Hi. I am your AI assistant. I will propose changes and you confirm before applying."
              );
    const welcomeMessage = getWelcomeMessage(assistantMode);
    const promptPlaceholder =
        assistantMode === "training" && trainingSubmode === "ai_prompt"
            ? t(
                  "Deja esto vacío para un reto automático, o indica tema: objeto de hielo para druida.",
                  "Leave this empty for an automatic challenge, or provide a theme: ice object for druid."
              )
            : assistantMode === "training"
              ? t(
                    "Ejemplo: crea un borrador de objeto raro para Kaelden con 1 rasgo y 1 acción.",
                    "Example: create a rare item draft for Kaelden with 1 trait and 1 action."
                )
            : t(
                  "Ejemplo: crea un companion lobo nivel 2 y añade nota de trasfondo.",
                  "Example: create a level 2 wolf companion and add a backstory note."
              );
    const sendLabel =
        assistantMode === "training" && trainingSubmode === "ai_prompt"
            ? t("Proponer reto", "Generate challenge")
            : assistantMode === "training"
              ? t("Generar borrador", "Generate draft")
            : t("Proponer cambios", "Propose changes");

    const selectedLabel = useMemo(() => {
        if (!selectedCharacterId) return null;
        if (selectedCharacterName?.trim()) return selectedCharacterName.trim();
        return selectedCharacterId;
    }, [selectedCharacterId, selectedCharacterName]);
    const noticeAckStorageKey = `${AI_NOTICE_ACK_STORAGE_KEY_PREFIX}:${campaignId}`;
    const globalTrainingOptInStorageKey =
        `${AI_GLOBAL_TRAINING_OPT_IN_STORAGE_KEY_PREFIX}:${campaignId}`;
    const localEditMemoryStorageKey =
        `${AI_LOCAL_EDIT_MEMORY_STORAGE_KEY_PREFIX}:${campaignId}`;
    const floatingButtonStorageKey = `${AI_CHAT_BUTTON_POSITION_STORAGE_KEY_PREFIX}:${campaignId}:${
        assistantContext?.surface ?? "default"
    }`;

    const isTraining = assistantMode === "training";
    const blocksByPendingPlan = !isTraining && !!pendingPlan;
    const pendingPlanHasUserEdits = useMemo(() => {
        if (!pendingPlan) return false;
        if (pendingPlanUsesTrainingEditor) {
            const currentActions = buildTrainingActionsFromDraft({
                draft: trainingDraft,
                targetCharacterId:
                    trainingDraftTargetCharacterId ??
                    pendingPlan.targetCharacterId ??
                    selectedCharacterId ??
                    undefined,
            });
            return !areProposedActionListsEqual(
                pendingPlan.originalProposedActions,
                currentActions
            );
        }
        return false;
    }, [
        pendingPlan,
        pendingPlanUsesTrainingEditor,
        selectedCharacterId,
        trainingDraft,
        trainingDraftTargetCharacterId,
    ]);
    const pendingPlanTrainingPreviewActions = useMemo(() => {
        if (!pendingPlan || !pendingPlanUsesTrainingEditor) return [] as ProposedAction[];
        return buildTrainingActionsFromDraft({
            draft: trainingDraft,
            targetCharacterId:
                trainingDraftTargetCharacterId ??
                pendingPlan.targetCharacterId ??
                selectedCharacterId ??
                undefined,
        });
    }, [
        pendingPlan,
        pendingPlanUsesTrainingEditor,
        selectedCharacterId,
        trainingDraft,
        trainingDraftTargetCharacterId,
    ]);
    const showTrainingLikeStructureEditor =
        isTraining || (!!pendingPlan && pendingPlanUsesTrainingEditor);
    const defaultPanelWidth = showTrainingLikeStructureEditor
        ? WIDE_PANEL_DEFAULT_WIDTH
        : NORMAL_PANEL_DEFAULT_WIDTH;
    const isDesktopViewport = viewportWidth >= 768;
    const draftDescriptionRows = trainingEditorCompact ? 2 : 3;
    const attachmentDescriptionRows = trainingEditorCompact ? 1 : 2;
    const attachmentsMaxHeightClass = trainingEditorCompact
        ? "max-h-36"
        : "max-h-56";

    const clampPanelWidth = (value: number, mode: AssistantMode = assistantMode) => {
        const maxByViewport =
            viewportWidth > 0
                ? Math.max(MIN_PANEL_WIDTH, viewportWidth - 8)
                : WIDE_PANEL_DEFAULT_WIDTH;
        const wideLayoutActive =
            mode === "training" || showTrainingLikeStructureEditor;
        const min = wideLayoutActive ? TRAINING_LAYOUT_MIN_PANEL_WIDTH : MIN_PANEL_WIDTH;
        const modeMax = wideLayoutActive ? WIDE_PANEL_MAX_WIDTH : NORMAL_PANEL_MAX_WIDTH;
        const max = Math.min(maxByViewport, modeMax);
        return Math.min(Math.max(value, min), max);
    };

    const clampTrainingEditorWidth = (value: number, panelWidthValue: number) => {
        const minByBalance = Math.floor((panelWidthValue - TRAINING_EDITOR_SPLIT_GAP) / 2) + 1;
        const min = Math.max(TRAINING_EDITOR_MIN_WIDTH, minByBalance);
        const maxByChat = panelWidthValue - TRAINING_CHAT_MIN_WIDTH - TRAINING_EDITOR_SPLIT_GAP;
        const max = Math.max(min, maxByChat);
        return Math.min(Math.max(value, min), max);
    };

    const clampPanelHeight = (value: number) => {
        const maxByViewport =
            viewportHeight > 0
                ? Math.max(420, viewportHeight - DESKTOP_PANEL_MARGIN * 2)
                : DESKTOP_PANEL_DEFAULT_HEIGHT;
        return Math.min(Math.max(value, 420), maxByViewport);
    };

    const getDefaultDesktopPanelPosition = (
        side: FloatingButtonDockSide,
        panelWidthValue: number,
        panelHeightValue: number
    ): FloatingButtonPosition => {
        if (typeof window === "undefined") return { left: 0, top: 0 };
        const top = Math.max(
            DESKTOP_PANEL_MARGIN,
            Math.round((window.innerHeight - panelHeightValue) / 2)
        );
        const left =
            side === "left"
                ? 0
                : Math.max(
                      0,
                      window.innerWidth - panelWidthValue
                  );
        return { left, top };
    };

    const clampDesktopPanelPosition = (
        position: FloatingButtonPosition,
        panelWidthValue: number,
        panelHeightValue: number
    ): FloatingButtonPosition => {
        if (typeof window === "undefined") return position;
        const maxLeft = Math.max(0, window.innerWidth - panelWidthValue);
        const maxTop = Math.max(
            DESKTOP_PANEL_MARGIN,
            window.innerHeight - panelHeightValue - DESKTOP_PANEL_MARGIN
        );
        return {
            left: Math.min(Math.max(position.left, 0), maxLeft),
            top: Math.min(Math.max(position.top, DESKTOP_PANEL_MARGIN), maxTop),
        };
    };

    const getNearestDesktopPanelDockSide = (
        position: FloatingButtonPosition,
        panelWidthValue: number
    ): FloatingButtonDockSide => {
        if (typeof window === "undefined") return "right";
        const leftGap = position.left;
        const rightGap = window.innerWidth - (position.left + panelWidthValue);
        return leftGap <= rightGap ? "left" : "right";
    };

    const getNearDesktopPanelDockSide = (
        position: FloatingButtonPosition,
        panelWidthValue: number,
        threshold: number = DESKTOP_PANEL_DOCK_THRESHOLD
    ): FloatingButtonDockSide | null => {
        if (typeof window === "undefined") return null;
        const leftGap = position.left;
        const rightGap = window.innerWidth - (position.left + panelWidthValue);
        const nearLeft = leftGap <= threshold;
        const nearRight = rightGap <= threshold;
        if (nearLeft && nearRight) {
            return leftGap <= rightGap ? "left" : "right";
        }
        if (nearLeft) return "left";
        if (nearRight) return "right";
        return null;
    };

    const snapDesktopPanelToSide = (
        position: FloatingButtonPosition,
        panelWidthValue: number,
        panelHeightValue: number,
        side: FloatingButtonDockSide
    ): FloatingButtonPosition => {
        if (typeof window === "undefined") return position;
        const left =
            side === "left"
                ? 0
                : Math.max(
                      0,
                      window.innerWidth - panelWidthValue
                  );
        return clampDesktopPanelPosition(
            {
                left,
                top: position.top,
            },
            panelWidthValue,
            panelHeightValue
        );
    };

    const getFloatingButtonSize = () => {
        const fallbackWidth = 150;
        const fallbackHeight = 52;
        return {
            width: floatingButtonRef.current?.offsetWidth ?? fallbackWidth,
            height: floatingButtonRef.current?.offsetHeight ?? fallbackHeight,
        };
    };

    const clampFloatingButtonPosition = (
        position: FloatingButtonPosition
    ): FloatingButtonPosition => {
        if (typeof window === "undefined") return position;
        const horizontalMargin = 0;
        const verticalMargin = 8;
        const { width: buttonWidth, height: buttonHeight } = getFloatingButtonSize();
        const maxLeft = Math.max(
            horizontalMargin,
            window.innerWidth -
                Math.max(buttonWidth, horizontalMargin * 2) -
                horizontalMargin
        );
        const maxTop = Math.max(
            verticalMargin,
            window.innerHeight -
                Math.max(buttonHeight, verticalMargin * 2) -
                verticalMargin
        );
        return {
            left: Math.min(Math.max(position.left, horizontalMargin), maxLeft),
            top: Math.min(Math.max(position.top, verticalMargin), maxTop),
        };
    };

    const getNearestDockSide = (
        position: FloatingButtonPosition
    ): FloatingButtonDockSide => {
        if (typeof window === "undefined") return "right";
        const { width: buttonWidth } = getFloatingButtonSize();
        const leftGap = position.left;
        const rightGap = window.innerWidth - (position.left + buttonWidth);
        return leftGap <= rightGap ? "left" : "right";
    };

    const getNearDockSide = (
        position: FloatingButtonPosition,
        threshold: number = FLOATING_DOCK_THRESHOLD
    ): FloatingButtonDockSide | null => {
        if (typeof window === "undefined") return null;
        const { width: buttonWidth } = getFloatingButtonSize();
        const leftGap = position.left;
        const rightGap = window.innerWidth - (position.left + buttonWidth);
        const nearLeft = leftGap <= threshold;
        const nearRight = rightGap <= threshold;
        if (nearLeft && nearRight) {
            return leftGap <= rightGap ? "left" : "right";
        }
        if (nearLeft) return "left";
        if (nearRight) return "right";
        return null;
    };

    const snapFloatingButtonToSide = (
        position: FloatingButtonPosition,
        side: FloatingButtonDockSide
    ): FloatingButtonPosition => {
        if (typeof window === "undefined") return position;
        const margin = 0;
        const { width: buttonWidth } = getFloatingButtonSize();
        const nextLeft =
            side === "left"
                ? margin
                : Math.max(margin, window.innerWidth - buttonWidth - margin);
        return clampFloatingButtonPosition({
            left: nextLeft,
            top: position.top,
        });
    };

    const getDefaultFloatingButtonPosition = (): FloatingButtonPosition => {
        if (typeof window === "undefined") {
            return { left: 0, top: 0 };
        }
        const { width: buttonWidth, height: buttonHeight } = getFloatingButtonSize();
        return clampFloatingButtonPosition({
            left: window.innerWidth - buttonWidth,
            top: window.innerHeight / 2 - buttonHeight / 2,
        });
    };

    const drawerSide: FloatingButtonDockSide = floatingButtonDockSide;
    const desktopPanelWidth = clampPanelWidth(panelWidth);
    const desktopPanelHeight = clampPanelHeight(panelHeight);
    const resolvedDesktopPanelPosition = (() => {
        const basePosition =
            panelPosition ??
            getDefaultDesktopPanelPosition(
                drawerSide,
                desktopPanelWidth,
                desktopPanelHeight
            );
        return clampDesktopPanelPosition(
            basePosition,
            desktopPanelWidth,
            desktopPanelHeight
        );
    })();
    const panelIsDockPreviewActive = Boolean(panelNearDockSide);
    const panelNearWallAtRest = getNearDesktopPanelDockSide(
        resolvedDesktopPanelPosition,
        desktopPanelWidth,
        DESKTOP_PANEL_DOCK_THRESHOLD * 0.55
    );
    const panelWallSide = panelNearDockSide ?? panelNearWallAtRest ?? drawerSide;
    const panelIsWallIntegrated = panelNearWallAtRest !== null || panelIsDockPreviewActive;
    const panelIsDetached = !panelIsWallIntegrated;
    const panelResizeAnchorSide = panelIsWallIntegrated ? panelWallSide : drawerSide;
    const desktopPanelFillsHeight =
        isDesktopViewport && open && panelIsWallIntegrated && viewportHeight > 0;
    const panelFrameHeight = desktopPanelFillsHeight ? viewportHeight : desktopPanelHeight;
    const panelFrameTop = desktopPanelFillsHeight ? 0 : resolvedDesktopPanelPosition.top;
    const panelFrameLeft =
        desktopPanelFillsHeight
            ? panelWallSide === "left"
                ? 0
                : Math.max(0, viewportWidth - desktopPanelWidth)
            : resolvedDesktopPanelPosition.left;
    const shouldDockTrainingPanel =
        isDesktopViewport && open && isTraining && showTrainingLikeStructureEditor;
    const dockedEditorWidth = shouldDockTrainingPanel
        ? trainingEditorCollapsed
            ? 240
            : clampTrainingEditorWidth(
                  Math.round(desktopPanelWidth * trainingEditorRatio),
                  desktopPanelWidth
              )
        : 0;
    const dockedEditorTop = Math.max(isTraining ? 110 : 98, Math.round(panelHeaderHeight) + 8);
    const dockedEditorHeight = Math.max(220, panelFrameHeight - dockedEditorTop);
    const dockedEditorHorizontalStyle =
        panelWallSide === "right"
            ? { left: "0px", right: "auto" as const }
            : { right: "0px", left: "auto" as const };
    const dockedEditorStyle = shouldDockTrainingPanel
        ? {
              position: "absolute" as const,
              top: `${dockedEditorTop}px`,
              height: `${dockedEditorHeight}px`,
              width: `${dockedEditorWidth}px`,
              ...dockedEditorHorizontalStyle,
          }
        : undefined;
    const structureOverlayPaddingStyle =
        shouldDockTrainingPanel
            ? panelWallSide === "right"
                ? { paddingLeft: `${dockedEditorWidth + TRAINING_EDITOR_SPLIT_GAP}px` }
                : { paddingRight: `${dockedEditorWidth + TRAINING_EDITOR_SPLIT_GAP}px` }
            : undefined;
    const trainingSplitHandleStyle =
        shouldDockTrainingPanel && !trainingEditorCollapsed
            ? panelWallSide === "right"
                ? {
                      top: `${dockedEditorTop}px`,
                      height: `${dockedEditorHeight}px`,
                      left: `${dockedEditorWidth + Math.round(TRAINING_EDITOR_SPLIT_GAP / 2)}px`,
                  }
                : {
                      top: `${dockedEditorTop}px`,
                      height: `${dockedEditorHeight}px`,
                      right: `${dockedEditorWidth + Math.round(TRAINING_EDITOR_SPLIT_GAP / 2)}px`,
                  }
            : undefined;
    const desktopPanelShellClass = panelIsWallIntegrated
        ? panelWallSide === "right"
            ? desktopPanelFillsHeight
                ? "origin-right overflow-hidden rounded-none border-l border-ring shadow-[-12px_0_28px_rgba(45,29,12,0.2)]"
                : "origin-right overflow-hidden rounded-l-2xl rounded-r-sm border border-r-0 border-ring shadow-[-18px_0_34px_rgba(45,29,12,0.24)]"
            : desktopPanelFillsHeight
              ? "origin-left overflow-hidden rounded-none border-r border-ring shadow-[12px_0_28px_rgba(45,29,12,0.2)]"
              : "origin-left overflow-hidden rounded-r-2xl rounded-l-sm border border-l-0 border-ring shadow-[18px_0_34px_rgba(45,29,12,0.24)]"
        : "origin-center overflow-hidden rounded-2xl border border-ring shadow-[0_18px_44px_rgba(45,29,12,0.26)]";
    const floatingDockSidePreview: FloatingButtonDockSide =
        floatingButtonNearDockSide ?? floatingButtonDockSide;
    const floatingButtonIsDockPreviewActive = Boolean(floatingButtonNearDockSide);
    const floatingButtonNearWallAtRest = floatingButtonPosition
        ? getNearDockSide(floatingButtonPosition)
        : floatingButtonDockSide;
    const floatingButtonWallSide: FloatingButtonDockSide =
        floatingButtonNearDockSide
        ?? floatingButtonNearWallAtRest
        ?? floatingDockSidePreview;
    const floatingButtonIsWallIntegrated =
        !floatingButtonPinnedToHeader &&
        (
            !floatingButtonPosition
            || floatingButtonNearWallAtRest !== null
            || floatingButtonIsDockPreviewActive
        );

    function persistFloatingButtonPosition(
        position: FloatingButtonPosition,
        dockSide: FloatingButtonDockSide
    ) {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.setItem(
                floatingButtonStorageKey,
                JSON.stringify({
                    left: position.left,
                    top: position.top,
                    dock: dockSide,
                })
            );
        } catch {
            // ignore storage errors
        }
    }

    function handleFloatingButtonMouseDown(event: ReactMouseEvent<HTMLButtonElement>) {
        if (event.button !== 0) return;
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        setFloatingButtonPinnedToHeader(false);
        setFloatingButtonNearDockSide(null);
        floatingButtonDragRef.current = {
            startMouseX: event.clientX,
            startMouseY: event.clientY,
            startLeft: rect.left,
            startTop: rect.top,
            moved: false,
        };
        setDraggingFloatingButton(true);
    }

    function handlePanelMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
        if (!isDesktopViewport) return;
        if (event.button !== 0) return;
        event.preventDefault();
        const rect = panelRef.current?.getBoundingClientRect();
        if (!rect) return;
        setPanelNearDockSide(null);
        panelDragRef.current = {
            startMouseX: event.clientX,
            startMouseY: event.clientY,
            startLeft: rect.left,
            startTop: rect.top,
            moved: false,
        };
        setDraggingPanel(true);
    }

    useEffect(() => {
        floatingButtonPositionRef.current = floatingButtonPosition;
    }, [floatingButtonPosition]);

    useEffect(() => {
        panelPositionRef.current = panelPosition;
    }, [panelPosition]);

    useEffect(() => {
        floatingButtonDockSideRef.current = floatingButtonDockSide;
    }, [floatingButtonDockSide]);

    function resetPanelWidthForMode(mode: AssistantMode) {
        const target =
            mode === "training" || showTrainingLikeStructureEditor
                ? WIDE_PANEL_DEFAULT_WIDTH
                : NORMAL_PANEL_DEFAULT_WIDTH;
        setPanelWidth(clampPanelWidth(target, mode));
    }

    function handleResizeMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
        if (!isDesktopViewport) return;
        event.preventDefault();
        resizeStartRef.current = { x: event.clientX, width: panelWidth };
        setResizing(true);
    }

    function handleResizeHeightMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
        if (!isDesktopViewport) return;
        event.preventDefault();
        resizeHeightStartRef.current = { y: event.clientY, height: panelHeight };
        setResizingHeight(true);
    }

    function handleTrainingSplitResizeMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
        if (!isDesktopViewport || !shouldDockTrainingPanel || trainingEditorCollapsed) return;
        event.preventDefault();
        trainingSplitResizeStartRef.current = {
            x: event.clientX,
            width: dockedEditorWidth,
        };
        setResizingTrainingSplit(true);
    }

    useEffect(() => {
        if (!open) return;
        if (messages.length > 0) return;
        setMessages([makeMessage("assistant", welcomeMessage)]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        if (!open) return;
        setFloatingButtonPinnedToHeader(false);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, open]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const syncViewport = () => {
            setViewportWidth(window.innerWidth);
            setViewportHeight(window.innerHeight);
        };
        syncViewport();
        window.addEventListener("resize", syncViewport);
        return () => window.removeEventListener("resize", syncViewport);
    }, []);

    useEffect(() => {
        if (!isDesktopViewport || !open || !showTrainingLikeStructureEditor) {
            setPanelHeaderHeight(0);
            return;
        }
        const headerNode = panelHeaderRef.current;
        if (!headerNode) return;

        const syncHeaderHeight = () => {
            setPanelHeaderHeight(headerNode.getBoundingClientRect().height);
        };

        syncHeaderHeight();
        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", syncHeaderHeight);
            return () => window.removeEventListener("resize", syncHeaderHeight);
        }

        const observer = new ResizeObserver(syncHeaderHeight);
        observer.observe(headerNode);
        return () => observer.disconnect();
    }, [
        aiNoticeAcknowledged,
        isDesktopViewport,
        isTraining,
        open,
        selectedLabel,
        showTrainingLikeStructureEditor,
        trainingSubmode,
    ]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = window.localStorage.getItem(floatingButtonStorageKey);
            if (!raw) {
                const defaultPosition = getDefaultFloatingButtonPosition();
                setFloatingButtonPosition(defaultPosition);
                setFloatingButtonDockSide("right");
                return;
            }

            const parsed = JSON.parse(raw) as
                | { left?: unknown; top?: unknown; dock?: unknown }
                | null
                | undefined;
            const left = Number(parsed?.left);
            const top = Number(parsed?.top);
            if (!Number.isFinite(left) || !Number.isFinite(top)) {
                const defaultPosition = getDefaultFloatingButtonPosition();
                setFloatingButtonPosition(defaultPosition);
                setFloatingButtonDockSide("right");
                return;
            }

            const parsedDockRaw =
                typeof parsed?.dock === "string" ? parsed.dock.toLowerCase() : "";
            const parsedDockSide: FloatingButtonDockSide =
                parsedDockRaw === "left" || parsedDockRaw === "right"
                    ? parsedDockRaw
                    : getNearestDockSide({ left, top });

            setFloatingButtonPosition(
                clampFloatingButtonPosition({
                    left,
                    top,
                })
            );
            setFloatingButtonDockSide(parsedDockSide);
        } catch {
            const defaultPosition = getDefaultFloatingButtonPosition();
            setFloatingButtonPosition(defaultPosition);
            setFloatingButtonDockSide("right");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [floatingButtonStorageKey]);

    useEffect(() => {
        if (!floatingButtonPosition) return;
        setFloatingButtonPosition((prev) => {
            if (!prev) return prev;
            const clamped = clampFloatingButtonPosition(prev);
            const shouldStickToWall =
                getNearDockSide(prev) !== null || getNearDockSide(clamped) !== null;
            const next = shouldStickToWall
                ? snapFloatingButtonToSide(clamped, floatingButtonDockSideRef.current)
                : clamped;
            if (next.left === prev.left && next.top === prev.top) return prev;
            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewportWidth]);

    useEffect(() => {
        if (!isDesktopViewport) {
            setPanelPosition(null);
            setPanelNearDockSide(null);
            setDraggingPanel(false);
            setResizingHeight(false);
            setResizingTrainingSplit(false);
            panelDragRef.current = null;
            resizeHeightStartRef.current = null;
            trainingSplitResizeStartRef.current = null;
            return;
        }
        if (!open) return;
        const nextWidth = clampPanelWidth(panelWidth);
        const nextHeight = clampPanelHeight(panelHeight);
        setPanelPosition((prev) => {
            const base =
                prev ??
                getDefaultDesktopPanelPosition(
                    drawerSide,
                    nextWidth,
                    nextHeight
                );
            const clamped = clampDesktopPanelPosition(base, nextWidth, nextHeight);
            const nearSide = getNearDesktopPanelDockSide(
                clamped,
                nextWidth,
                DESKTOP_PANEL_DOCK_THRESHOLD * 0.6
            );
            return nearSide
                ? snapDesktopPanelToSide(
                      clamped,
                      nextWidth,
                      nextHeight,
                      nearSide
                  )
                : clamped;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDesktopViewport, open, panelWidth, panelHeight, drawerSide, viewportWidth, viewportHeight]);

    useEffect(() => {
        if (!isDesktopViewport || !panelPosition) return;
        const nextWidth = clampPanelWidth(panelWidth);
        const nextHeight = clampPanelHeight(panelHeight);
        setPanelPosition((prev) => {
            if (!prev) return prev;
            const clamped = clampDesktopPanelPosition(prev, nextWidth, nextHeight);
            const shouldStickToWall =
                getNearDesktopPanelDockSide(
                    prev,
                    nextWidth,
                    DESKTOP_PANEL_DOCK_THRESHOLD * 0.6
                ) !== null ||
                getNearDesktopPanelDockSide(
                    clamped,
                    nextWidth,
                    DESKTOP_PANEL_DOCK_THRESHOLD * 0.6
                ) !== null;
            const next = shouldStickToWall
                ? snapDesktopPanelToSide(
                      clamped,
                      nextWidth,
                      nextHeight,
                      drawerSide
                  )
                : clamped;
            if (next.left === prev.left && next.top === prev.top) return prev;
            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDesktopViewport, viewportWidth, viewportHeight, panelWidth, panelHeight]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const savedAck = window.localStorage.getItem(noticeAckStorageKey);
            const savedOptIn = window.localStorage.getItem(globalTrainingOptInStorageKey);
            const savedLocalMemory = window.localStorage.getItem(localEditMemoryStorageKey);
            setAiNoticeAcknowledged(savedAck === "1");
            setGlobalTrainingConsent(savedOptIn === "1");
            if (savedLocalMemory) {
                const parsed = JSON.parse(savedLocalMemory);
                const entries = Array.isArray(parsed)
                    ? parsed
                          .map((entry) =>
                              isRecord(entry)
                                  ? {
                                        id: asString(entry.id, 64) ?? "",
                                        timestamp:
                                            asString(entry.timestamp, 40) ??
                                            new Date().toISOString(),
                                        summary: asString(entry.summary, 500) ?? "",
                                    }
                                  : null
                          )
                          .filter(
                              (entry): entry is LocalEditMemory =>
                                  !!entry && !!entry.id && !!entry.summary
                          )
                          .slice(0, 40)
                    : [];
                setLocalEditMemories(entries);
            } else {
                setLocalEditMemories([]);
            }
        } catch {
            setAiNoticeAcknowledged(false);
            setGlobalTrainingConsent(false);
            setLocalEditMemories([]);
        }
    }, [globalTrainingOptInStorageKey, localEditMemoryStorageKey, noticeAckStorageKey]);

    useEffect(() => {
        if (!open) return;
        setPanelWidth((prev) => {
            if (!prev || Number.isNaN(prev)) {
                return clampPanelWidth(defaultPanelWidth);
            }
            return clampPanelWidth(prev);
        });
        setPanelHeight((prev) => {
            if (!prev || Number.isNaN(prev)) {
                return clampPanelHeight(DESKTOP_PANEL_DEFAULT_HEIGHT);
            }
            return clampPanelHeight(prev);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, viewportWidth, viewportHeight]);

    useEffect(() => {
        resetPanelWidthForMode(assistantMode);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assistantMode]);

    useEffect(() => {
        if (!showTrainingLikeStructureEditor || desktopPanelWidth <= 0) return;
        const desiredWidth = Math.round(desktopPanelWidth * trainingEditorRatio);
        const clampedWidth = clampTrainingEditorWidth(desiredWidth, desktopPanelWidth);
        const nextRatio = clampedWidth / desktopPanelWidth;
        if (Math.abs(nextRatio - trainingEditorRatio) < 0.001) return;
        setTrainingEditorRatio(nextRatio);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [desktopPanelWidth, showTrainingLikeStructureEditor, trainingEditorRatio]);

    useEffect(() => {
        if (trainingDraftTargetCharacterId) return;
        if (!selectedCharacterId) return;
        setTrainingDraftTargetCharacterId(selectedCharacterId);
    }, [selectedCharacterId, trainingDraftTargetCharacterId]);

    useEffect(() => {
        if (!resizing || !isDesktopViewport) return;

        const handleMove = (event: MouseEvent) => {
            const start = resizeStartRef.current;
            if (!start) return;
            const delta =
                panelResizeAnchorSide === "right"
                    ? start.x - event.clientX
                    : event.clientX - start.x;
            const candidate = start.width + delta;
            setPanelWidth(clampPanelWidth(candidate));
        };

        const handleUp = () => {
            setResizing(false);
            resizeStartRef.current = null;
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resizing, isDesktopViewport, assistantMode, viewportWidth, panelResizeAnchorSide]);

    useEffect(() => {
        if (!resizingHeight || !isDesktopViewport) return;

        const handleMove = (event: MouseEvent) => {
            const start = resizeHeightStartRef.current;
            if (!start) return;
            const delta = event.clientY - start.y;
            const candidate = start.height + delta;
            setPanelHeight(clampPanelHeight(candidate));
        };

        const handleUp = () => {
            setResizingHeight(false);
            resizeHeightStartRef.current = null;
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resizingHeight, isDesktopViewport, viewportHeight]);

    useEffect(() => {
        if (!resizingTrainingSplit || !isDesktopViewport) return;
        if (!shouldDockTrainingPanel || trainingEditorCollapsed) return;

        const handleMove = (event: MouseEvent) => {
            const start = trainingSplitResizeStartRef.current;
            if (!start) return;
            const deltaX = event.clientX - start.x;
            const candidateWidth =
                panelWallSide === "right"
                    ? start.width + deltaX
                    : start.width - deltaX;
            const nextWidth = clampTrainingEditorWidth(candidateWidth, desktopPanelWidth);
            setTrainingEditorRatio(nextWidth / desktopPanelWidth);
        };

        const handleUp = () => {
            setResizingTrainingSplit(false);
            trainingSplitResizeStartRef.current = null;
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        desktopPanelWidth,
        isDesktopViewport,
        panelWallSide,
        resizingTrainingSplit,
        shouldDockTrainingPanel,
        trainingEditorCollapsed,
    ]);

    useEffect(() => {
        if (!draggingFloatingButton) return;

        const handleMove = (event: MouseEvent) => {
            const start = floatingButtonDragRef.current;
            if (!start) return;
            const deltaX = event.clientX - start.startMouseX;
            const deltaY = event.clientY - start.startMouseY;
            if (Math.abs(deltaX) + Math.abs(deltaY) > 3) {
                start.moved = true;
            }
            const next = clampFloatingButtonPosition({
                left: start.startLeft + deltaX,
                top: start.startTop + deltaY,
            });
            const nearDockSide = getNearDockSide(next);
            if (nearDockSide) {
                const snapped = snapFloatingButtonToSide(next, nearDockSide);
                setFloatingButtonDockSide(nearDockSide);
                setFloatingButtonNearDockSide(nearDockSide);
                setFloatingButtonPosition(snapped);
                return;
            }
            setFloatingButtonNearDockSide(null);
            setFloatingButtonPosition(next);
        };

        const handleUp = () => {
            const start = floatingButtonDragRef.current;
            floatingButtonDragRef.current = null;
            setDraggingFloatingButton(false);
            setFloatingButtonNearDockSide(null);

            if (!start || !start.moved) {
                skipNextFloatingButtonClickRef.current = false;
                return;
            }

            skipNextFloatingButtonClickRef.current = true;
            window.setTimeout(() => {
                skipNextFloatingButtonClickRef.current = false;
            }, 0);
            const finalPosition = clampFloatingButtonPosition(
                floatingButtonPositionRef.current ?? {
                    left: start.startLeft,
                    top: start.startTop,
                }
            );
            const nearDockSide = getNearDockSide(finalPosition);
            const resolvedDockSide =
                nearDockSide
                ?? getNearestDockSide(finalPosition)
                ?? floatingButtonDockSideRef.current;
            const snappedPosition = nearDockSide
                ? snapFloatingButtonToSide(finalPosition, resolvedDockSide)
                : finalPosition;
            setFloatingButtonDockSide(resolvedDockSide);
            setFloatingButtonPosition(snappedPosition);
            persistFloatingButtonPosition(snappedPosition, resolvedDockSide);
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draggingFloatingButton]);

    useEffect(() => {
        if (!draggingPanel || !isDesktopViewport) return;

        const handleMove = (event: MouseEvent) => {
            const start = panelDragRef.current;
            if (!start) return;
            const deltaX = event.clientX - start.startMouseX;
            const deltaY = event.clientY - start.startMouseY;
            if (Math.abs(deltaX) + Math.abs(deltaY) > 3) {
                start.moved = true;
            }
            const nextWidth = clampPanelWidth(panelWidth);
            const nextHeight = clampPanelHeight(panelHeight);
            const candidate = clampDesktopPanelPosition(
                {
                    left: start.startLeft + deltaX,
                    top: start.startTop + deltaY,
                },
                nextWidth,
                nextHeight
            );
            const nearDockSide = getNearDesktopPanelDockSide(candidate, nextWidth);
            if (nearDockSide) {
                const snapped = snapDesktopPanelToSide(
                    candidate,
                    nextWidth,
                    nextHeight,
                    nearDockSide
                );
                setFloatingButtonDockSide(nearDockSide);
                setPanelNearDockSide(nearDockSide);
                setPanelPosition(snapped);
                return;
            }
            setPanelNearDockSide(null);
            setPanelPosition(candidate);
        };

        const handleUp = () => {
            const start = panelDragRef.current;
            panelDragRef.current = null;
            setDraggingPanel(false);
            setPanelNearDockSide(null);

            if (!start || !start.moved) {
                return;
            }

            const nextWidth = clampPanelWidth(panelWidth);
            const nextHeight = clampPanelHeight(panelHeight);
            const finalPosition = clampDesktopPanelPosition(
                panelPositionRef.current ?? {
                    left: start.startLeft,
                    top: start.startTop,
                },
                nextWidth,
                nextHeight
            );
            const nearDockSide = getNearDesktopPanelDockSide(
                finalPosition,
                nextWidth,
                DESKTOP_PANEL_DOCK_THRESHOLD * 0.6
            );
            const resolvedDockSide =
                nearDockSide ?? getNearestDesktopPanelDockSide(finalPosition, nextWidth);
            const snappedPosition = nearDockSide
                ? snapDesktopPanelToSide(
                      finalPosition,
                      nextWidth,
                      nextHeight,
                      resolvedDockSide
                  )
                : finalPosition;
            setFloatingButtonDockSide(resolvedDockSide);
            setPanelPosition(snappedPosition);
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draggingPanel, isDesktopViewport, panelWidth, panelHeight, viewportWidth, viewportHeight]);

    function closeDrawer() {
        setFloatingButtonPinnedToHeader(false);
        setFloatingButtonNearDockSide(null);
        if (isDesktopViewport) {
            const panelRect = panelRef.current?.getBoundingClientRect();
            const measuredPanelWidth = panelRect?.width
                ? clampPanelWidth(Math.round(panelRect.width))
                : clampPanelWidth(panelWidth);
            const measuredPanelHeight = panelRect?.height
                ? clampPanelHeight(Math.round(panelRect.height))
                : clampPanelHeight(panelHeight);
            const panelPositionAtClose = clampDesktopPanelPosition(
                panelRect
                    ? {
                          left: panelRect.left,
                          top: panelRect.top,
                      }
                    : panelPositionRef.current ??
                          getDefaultDesktopPanelPosition(
                              drawerSide,
                              measuredPanelWidth,
                              measuredPanelHeight
                          ),
                measuredPanelWidth,
                measuredPanelHeight
            );
            const nearDockSide = getNearDesktopPanelDockSide(
                panelPositionAtClose,
                measuredPanelWidth,
                DESKTOP_PANEL_DOCK_THRESHOLD * 0.6
            );
            const resolvedDockSide =
                nearDockSide ??
                getNearestDesktopPanelDockSide(
                    panelPositionAtClose,
                    measuredPanelWidth
                );
            const buttonTarget = nearDockSide
                ? snapFloatingButtonToSide(
                      {
                          left: panelPositionAtClose.left,
                          top: panelPositionAtClose.top,
                      },
                      resolvedDockSide
                  )
                : clampFloatingButtonPosition({
                      left: panelPositionAtClose.left,
                      top: panelPositionAtClose.top,
                  });

            setFloatingButtonDockSide(resolvedDockSide);
            setFloatingButtonPosition(buttonTarget);
            persistFloatingButtonPosition(buttonTarget, resolvedDockSide);
        }
        onOpenChange(false);
    }

    function handleAcknowledgeAiNotice() {
        setAiNoticeAcknowledged(true);
        if (typeof window !== "undefined") {
            try {
                window.localStorage.setItem(noticeAckStorageKey, "1");
            } catch {
                // ignore storage errors
            }
        }
    }

    function handleGlobalTrainingConsentToggle(nextValue: boolean) {
        setGlobalTrainingConsent(nextValue);
        if (typeof window !== "undefined") {
            try {
                window.localStorage.setItem(
                    globalTrainingOptInStorageKey,
                    nextValue ? "1" : "0"
                );
            } catch {
                // ignore storage errors
            }
        }
        if (nextValue && !aiNoticeAcknowledged) {
            handleAcknowledgeAiNotice();
        }
    }

    function storeLocalEditMemory(summary: string) {
        const trimmedSummary = summary.trim();
        if (!trimmedSummary) return;
        const entry: LocalEditMemory = {
            id: makeDraftId("learn"),
            timestamp: new Date().toISOString(),
            summary: trimmedSummary.slice(0, 500),
        };
        setLocalEditMemories((prev) => {
            const next = [entry, ...prev].slice(0, 40);
            if (typeof window !== "undefined") {
                try {
                    window.localStorage.setItem(
                        localEditMemoryStorageKey,
                        JSON.stringify(next)
                    );
                } catch {
                    // ignore storage errors
                }
            }
            return next;
        });
    }

    function handleResetPendingPlanStructureEditor() {
        if (!pendingPlan) return;
        const parsed = parseTrainingDraftFromActions(
            pendingPlan.originalProposedActions
        );
        if (!parsed) return;
        setTrainingDraft(parsed.draft);
        setTrainingDraftTargetCharacterId(
            parsed.characterId ??
                pendingPlan.targetCharacterId ??
                selectedCharacterId ??
                undefined
        );
        setTrainingDraftError(null);
    }

    function handleClearConversation() {
        if (loading) return;
        setPrompt("");
        setError(null);
        setPendingPlan(null);
        setPendingPlanUsesTrainingEditor(false);
        setTrainingDraft(createEmptyTrainingItemDraft());
        setTrainingDraftTargetCharacterId(selectedCharacterId ?? undefined);
        setTrainingDraftNotes("");
        setTrainingDraftError(null);
        setTrainingEditorCollapsed(false);
        setMessages([makeMessage("assistant", welcomeMessage)]);
    }

    function handleAssistantModeChange(mode: AssistantMode) {
        if (loading || mode === assistantMode) return;
        setAssistantMode(mode);
        setTrainingSubmode("ai_prompt");
        resetPanelWidthForMode(mode);
        setPrompt("");
        setError(null);
        setPendingPlan(null);
        setPendingPlanUsesTrainingEditor(false);
        setTrainingDraft(createEmptyTrainingItemDraft());
        setTrainingDraftTargetCharacterId(selectedCharacterId ?? undefined);
        setTrainingDraftNotes("");
        setTrainingDraftError(null);
        setTrainingEditorCollapsed(false);
        setMessages([makeMessage("assistant", getWelcomeMessage(mode))]);
    }

    function handleTrainingSubmodeChange(mode: TrainingSubmode) {
        if (loading || mode === trainingSubmode) return;
        setTrainingSubmode(mode);
        setError(null);
        setTrainingDraftError(null);
        setTrainingEditorCollapsed(false);
        setPrompt("");
        if (mode === "ai_prompt") {
            setTrainingDraft(createEmptyTrainingItemDraft());
            setTrainingDraftTargetCharacterId(selectedCharacterId ?? undefined);
            setTrainingDraftNotes("");
            setMessages((prev) => [
                ...prev,
                makeMessage(
                    "assistant",
                    t(
                        "Submodo activo: la IA te propone ejercicios y prompts para que practiques creando tú el objeto en el chat.",
                        "Submode active: AI proposes exercises/prompts so you can practice creating the item yourself in chat."
                    )
                ),
            ]);
            return;
        }
        setMessages((prev) => [
            ...prev,
            makeMessage(
                "assistant",
                t(
                    "Submodo activo: sandbox de borrador. La IA crea ejemplos y tú los editas aquí en el chat. No se aplicará nada real.",
                    "Submode active: draft sandbox. AI creates examples and you edit them here in chat. Nothing real will be applied."
                )
            ),
        ]);
    }

    function buildComposedPrompt(baseInstruction: string, contextMessages: ChatMessage[]) {
        const recentContext = contextMessages
            .slice(-4)
            .map((entry) =>
                `${entry.role === "user" ? "Usuario" : "Asistente"}: ${entry.text}`
            )
            .join("\n");
        const compactRecentContext =
            recentContext.length > 1400
                ? recentContext.slice(recentContext.length - 1400)
                : recentContext;
        const localLearningHintsRaw = localEditMemories
            .slice(0, 4)
            .map((entry) => `- ${entry.summary}`)
            .join("\n");
        const localLearningHints =
            localLearningHintsRaw.length > 1200
                ? `${localLearningHintsRaw.slice(0, 1197)}...`
                : localLearningHintsRaw;
        return [
            `Instruccion actual del usuario: ${baseInstruction}`,
            compactRecentContext ? `Contexto reciente:\n${compactRecentContext}` : null,
            localLearningHints
                ? `Preferencias aprendidas de correcciones anteriores del usuario (aplícalas si encajan):\n${localLearningHints}`
                : null,
        ]
            .filter((entry): entry is string => !!entry)
            .join("\n\n");
    }

    async function runAssistantRequest({
        instruction,
        nextMessages,
    }: {
        instruction: string;
        nextMessages: ChatMessage[];
    }) {
        const accessToken = await getAccessToken();
        const composedPrompt = buildComposedPrompt(instruction, nextMessages);
        const payload = await postAssistant(accessToken, {
            prompt: composedPrompt,
            targetCharacterId: selectedCharacterId ?? undefined,
            clientContext: assistantContext ?? undefined,
            assistantMode,
            trainingSubmode: isTraining ? trainingSubmode : undefined,
            apply: false,
        });

        const reply =
            payload?.reply?.trim() || t("He preparado una propuesta.", "I prepared a proposal.");
        const proposedActions = sanitizeProposedActions(payload?.proposedActions);
        setMessages((prev) => [
            ...prev,
            makeMessage("assistant", reply, {
                proposedActions,
            }),
        ]);

        if (isTraining) {
            setPendingPlan(null);
            const parsedDraft = parseTrainingDraftFromActions(proposedActions);
            if (parsedDraft) {
                setTrainingDraft(parsedDraft.draft);
                setTrainingDraftTargetCharacterId(
                    parsedDraft.characterId ?? selectedCharacterId ?? undefined
                );
            } else if (proposedActions.length === 0) {
                setTrainingDraft(createEmptyTrainingItemDraft());
                setTrainingDraftTargetCharacterId(selectedCharacterId ?? undefined);
            }
            setTrainingDraftError(null);
            return;
        }

        if (proposedActions.length > 0) {
            const parsedPendingDraft = parseTrainingDraftFromActions(proposedActions);
            if (parsedPendingDraft) {
                setTrainingDraft(parsedPendingDraft.draft);
                setTrainingDraftTargetCharacterId(
                    parsedPendingDraft.characterId ?? selectedCharacterId ?? undefined
                );
                setPendingPlanUsesTrainingEditor(true);
                setTrainingDraftError(null);
            } else {
                setPendingPlanUsesTrainingEditor(false);
            }
            setPendingPlan({
                prompt: composedPrompt,
                targetCharacterId: selectedCharacterId ?? undefined,
                originalProposedActions: proposedActions,
                editorDrafts: createPendingActionEditorDrafts(proposedActions),
                previewReply: reply,
            });
        } else {
            setPendingPlan(null);
            setPendingPlanUsesTrainingEditor(false);
        }
    }

    async function getAccessToken() {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) {
            throw new Error(t("No hay sesion activa.", "No active session."));
        }
        return accessToken;
    }

    async function postAssistant(accessToken: string, body: Record<string, unknown>) {
        const res = await fetch(`/api/ai/campaigns/${campaignId}/assistant`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                ...body,
                globalTrainingConsent,
                aiUsageNoticeAccepted: aiNoticeAcknowledged,
            }),
        });

        const payload = (await res.json().catch(() => null)) as AssistantPayload | null;
        if (!res.ok) {
            throw new Error(
                String(
                    payload?.error ??
                        t(
                            "No se pudo ejecutar el asistente.",
                            "Could not run the assistant."
                        )
                )
            );
        }

        return payload;
    }

    async function handleRunAssistant() {
        if (loading) return;
        if (blocksByPendingPlan) {
            setError(
                t(
                    "Confirma o cancela los cambios pendientes antes de enviar otra instruccion.",
                    "Confirm or cancel the pending changes before sending another instruction."
                )
            );
            return;
        }

        const trimmed = prompt.trim();
        const autoInstruction =
            isTraining && trainingSubmode === "ai_prompt"
                ? t(
                      "Propón un ejercicio de entrenamiento para crear o editar un objeto en esta web. Devuelve un prompt claro que yo pueda copiar y responder, y una lista corta de criterios de validación.",
                      "Propose a training exercise to create or edit an item in this app. Return a clear prompt I can copy and answer, and a short validation checklist."
                  )
                : "";
        const instruction = trimmed || autoInstruction;
        if (!instruction) {
            setError(t("Escribe una instruccion para el asistente.", "Write an instruction for the assistant."));
            return;
        }

        const userMessage = makeMessage("user", trimmed || t("Dame un ejercicio de entrenamiento.", "Give me a training challenge."));
        const nextMessages = [...messages, userMessage];
        setMessages(nextMessages);
        setPrompt("");
        setLoading(true);
        setError(null);

        try {
            await runAssistantRequest({ instruction, nextMessages });
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : t("Error ejecutando el asistente.", "Error running assistant.");
            setError(message);
            setMessages((prev) => [...prev, makeMessage("assistant", message)]);
        } finally {
            setLoading(false);
        }
    }

    async function handleApplyPendingPlan() {
        if (isTraining) {
            setError(
                t(
                    "En modo entrenamiento no se aplican cambios reales.",
                    "Training mode never applies real changes."
                )
            );
            return;
        }
        if (loading || !pendingPlan) return;
        let actionsToApply: ProposedAction[] = [];
        if (pendingPlanUsesTrainingEditor) {
            actionsToApply = buildTrainingActionsFromDraft({
                draft: trainingDraft,
                targetCharacterId:
                    trainingDraftTargetCharacterId ??
                    pendingPlan.targetCharacterId ??
                    selectedCharacterId ??
                    undefined,
            });
            if (actionsToApply.length === 0) {
                setError(
                    t(
                        "No hay acciones válidas para aplicar desde el editor.",
                        "There are no valid actions to apply from the editor."
                    )
                );
                return;
            }
        } else {
            actionsToApply = pendingPlan.originalProposedActions;
        }
        const hasUserEdits = !areProposedActionListsEqual(
            pendingPlan.originalProposedActions,
            actionsToApply
        );
        const proposalEditSummary = hasUserEdits
            ? summarizeProposedActionEdits(
                  pendingPlan.originalProposedActions,
                  actionsToApply
              )
            : "";
        setLoading(true);
        setError(null);

        try {
            const accessToken = await getAccessToken();
            const payload = await postAssistant(accessToken, {
                prompt: pendingPlan.prompt,
                targetCharacterId: pendingPlan.targetCharacterId,
                clientContext: assistantContext ?? undefined,
                assistantMode,
                trainingSubmode: isTraining ? trainingSubmode : undefined,
                apply: true,
                proposedActions: actionsToApply,
                originalProposedActions: pendingPlan.originalProposedActions,
                userEditedProposal: hasUserEdits,
                proposalEditSummary,
                previewReply: pendingPlan.previewReply,
            });

            const reply =
                payload?.reply?.trim() ||
                t("Cambios aplicados.", "Changes applied.");
            const results = Array.isArray(payload?.results) ? payload.results : [];

            setMessages((prev) => [
                ...prev,
                makeMessage("assistant", reply, {
                    results,
                }),
            ]);
            setPendingPlan(null);
            setPendingPlanUsesTrainingEditor(false);
            if (hasUserEdits) {
                const sourceInstruction = pendingPlan.prompt
                    .replace("Instruccion actual del usuario:", "")
                    .split("\n")[0]
                    ?.trim();
                const summaryLine =
                    proposalEditSummary ||
                    t(
                        "Se editó la propuesta antes de aplicar.",
                        "The proposal was edited before applying."
                    );
                storeLocalEditMemory(
                    sourceInstruction
                        ? `${sourceInstruction} -> ${summaryLine}`
                        : summaryLine
                );
                setMessages((prev) => [
                    ...prev,
                    makeMessage(
                        "assistant",
                        t(
                            "He guardado esta corrección como preferencia para próximas propuestas.",
                            "I saved this correction as a preference for future proposals."
                        )
                    ),
                ]);
            }

            const hasApplied = results.some((entry) => entry.status === "applied");
            if (hasApplied) {
                await onApplied?.({ results });
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : t("Error ejecutando el asistente.", "Error running assistant.");
            setError(message);
            setMessages((prev) => [...prev, makeMessage("assistant", message)]);
        } finally {
            setLoading(false);
        }
    }

    function handleCancelPendingPlan() {
        if (loading || !pendingPlan) return;
        setPendingPlan(null);
        setPendingPlanUsesTrainingEditor(false);
        setError(null);
        setMessages((prev) => [
            ...prev,
            makeMessage(
                "assistant",
                t(
                    "Cancelado. No se aplicó ningún cambio.",
                    "Cancelled. No changes were applied."
                )
            ),
        ]);
    }

    function handlePreviewTrainingDraft() {
        if (!isTraining) return;
        const parsed = buildTrainingActionsFromDraft({
            draft: trainingDraft,
            targetCharacterId:
                trainingDraftTargetCharacterId ?? selectedCharacterId ?? undefined,
        });
        if (parsed.length === 0) {
            setTrainingDraftError(
                t(
                    "Falta al menos el nombre del objeto para previsualizar.",
                    "At least the item name is required for preview."
                )
            );
            return;
        }
        setTrainingDraftError(null);
        setMessages((prev) => [
            ...prev,
            makeMessage(
                "assistant",
                t(
                    "Vista previa local del borrador de entrenamiento (no se aplicará).",
                    "Local preview of the training draft (will not be applied)."
                ),
                { proposedActions: parsed }
            ),
        ]);
    }

    function handlePreviewPendingPlanStructureDraft() {
        if (isTraining || !pendingPlan || !pendingPlanUsesTrainingEditor) return;
        const parsed = buildTrainingActionsFromDraft({
            draft: trainingDraft,
            targetCharacterId:
                trainingDraftTargetCharacterId ??
                pendingPlan.targetCharacterId ??
                selectedCharacterId ??
                undefined,
        });
        if (parsed.length === 0) {
            setError(
                t(
                    "Falta al menos el nombre del objeto para previsualizar.",
                    "At least the item name is required for preview."
                )
            );
            return;
        }
        setError(null);
        setMessages((prev) => [
            ...prev,
            makeMessage(
                "assistant",
                t(
                    "Vista previa local de la edición pendiente antes de aplicar.",
                    "Local preview of pending edits before applying."
                ),
                { proposedActions: parsed }
            ),
        ]);
    }

    async function handleRequestTrainingDraftRevision() {
        if (loading || !isTraining) return;
        try {
            const parsed = buildTrainingActionsFromDraft({
                draft: trainingDraft,
                targetCharacterId:
                    trainingDraftTargetCharacterId ?? selectedCharacterId ?? undefined,
            });
            if (parsed.length === 0) {
                setTrainingDraftError(
                    t(
                        "Falta al menos el nombre del objeto para revisar el borrador.",
                        "At least the item name is required to revise the draft."
                    )
                );
                return;
            }

            const adjustment =
                trainingDraftNotes.trim() ||
                t(
                    "Mejora este borrador y devuélvelo más limpio y estructurado.",
                    "Improve this draft and return it cleaner and structured."
                );
            const userText = t(
                `Revisar borrador: ${adjustment}`,
                `Revise draft: ${adjustment}`
            );
            const draftPayload = JSON.stringify(parsed, null, 2);
            const instruction = [
                "MODO ENTRENAMIENTO SANDBOX (NO aplicar cambios reales).",
                `Ajustes del usuario: ${adjustment}`,
                "Borrador actual de acciones (JSON):",
                "```json",
                draftPayload,
                "```",
                "Devuelve un reply corto y acciones actualizadas para seguir editando en el chat.",
            ].join("\n\n");

            const userMessage = makeMessage("user", userText);
            const nextMessages = [...messages, userMessage];
            setMessages(nextMessages);
            setLoading(true);
            setError(null);
            setTrainingDraftError(null);

            await runAssistantRequest({ instruction, nextMessages });
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : t(
                          "Error revisando el borrador.",
                          "Error reviewing draft."
                      );
            setError(message);
            setMessages((prev) => [...prev, makeMessage("assistant", message)]);
        } finally {
            setLoading(false);
        }
    }

    function handleClearTrainingDraft() {
        if (loading) return;
        setTrainingDraft(createEmptyTrainingItemDraft());
        setTrainingDraftTargetCharacterId(selectedCharacterId ?? undefined);
        setTrainingDraftNotes("");
        setTrainingDraftError(null);
    }

    function handleTrainingDraftFieldChange(
        field: Exclude<keyof TrainingItemDraft, "attachments">,
        value: string | boolean
    ) {
        setTrainingDraft((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    function handleTrainingAttachmentChange(
        attachmentId: string,
        field: keyof Omit<TrainingAttachmentDraft, "id">,
        value: string | boolean
    ) {
        setTrainingDraft((prev) => ({
            ...prev,
            attachments: prev.attachments.map((entry) =>
                entry.id === attachmentId
                    ? (() => {
                          if (field === "type" && typeof value === "string") {
                              const nextType = normalizeDraftAttachmentType(value);
                              const nextLevel =
                                  nextType === "cantrip"
                                      ? "0"
                                      : entry.level === "0"
                                        ? ""
                                        : entry.level;
                              const nextActionType = isTrainingDraftAbilityLike(nextType)
                                  ? entry.actionType || "action"
                                  : "";
                              return {
                                  ...entry,
                                  type: nextType,
                                  level: nextLevel,
                                  actionType: nextActionType,
                              };
                          }
                          return {
                              ...entry,
                              [field]: value,
                          };
                      })()
                    : entry
            ),
        }));
    }

    function handleAddTrainingAttachment() {
        setTrainingDraft((prev) => ({
            ...prev,
            attachments: [...prev.attachments, createEmptyTrainingAttachmentDraft()],
        }));
    }

    function handleRemoveTrainingAttachment(attachmentId: string) {
        setTrainingDraft((prev) => {
            const next = prev.attachments.filter((entry) => entry.id !== attachmentId);
            return {
                ...prev,
                attachments:
                    next.length > 0 ? next : [createEmptyTrainingAttachmentDraft()],
            };
        });
    }

    async function handleApproveTrainingDraft() {
        if (loading || !isTraining) return;
        const approvalInstruction = t(
            "Está correcto, ejercicio validado.",
            "It is correct, exercise validated."
        );
        const userMessage = makeMessage("user", approvalInstruction);
        const nextMessages = [...messages, userMessage];
        setMessages(nextMessages);
        setLoading(true);
        setError(null);
        setTrainingDraftError(null);
        try {
            await runAssistantRequest({
                instruction: approvalInstruction,
                nextMessages,
            });
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : t("Error ejecutando el asistente.", "Error running assistant.");
            setError(message);
            setMessages((prev) => [...prev, makeMessage("assistant", message)]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button
                ref={floatingButtonRef}
                type="button"
                onMouseDown={handleFloatingButtonMouseDown}
                onClick={() => {
                    if (skipNextFloatingButtonClickRef.current) {
                        skipNextFloatingButtonClickRef.current = false;
                        return;
                    }
                    setFloatingButtonPinnedToHeader(false);
                    const currentPosition =
                        floatingButtonPositionRef.current ??
                        floatingButtonPosition ??
                        getDefaultFloatingButtonPosition();
                    if (currentPosition && isDesktopViewport) {
                        const clampedButtonPosition =
                            clampFloatingButtonPosition(currentPosition);
                        const nearDockSide = getNearDockSide(clampedButtonPosition);
                        const resolvedDockSide =
                            nearDockSide ?? getNearestDockSide(clampedButtonPosition);
                        const stableButtonPosition = nearDockSide
                            ? snapFloatingButtonToSide(
                                  clampedButtonPosition,
                                  resolvedDockSide
                              )
                            : clampedButtonPosition;

                        const nextWidth = clampPanelWidth(panelWidth);
                        const nextHeight = clampPanelHeight(panelHeight);
                        const nextPanelPosition = nearDockSide
                            ? snapDesktopPanelToSide(
                                  {
                                      left: stableButtonPosition.left,
                                      top: stableButtonPosition.top,
                                  },
                                  nextWidth,
                                  nextHeight,
                                  resolvedDockSide
                              )
                            : clampDesktopPanelPosition(
                                  {
                                      left: stableButtonPosition.left,
                                      top: stableButtonPosition.top,
                                  },
                                  nextWidth,
                                  nextHeight
                              );

                        setPanelPosition(nextPanelPosition);
                        setFloatingButtonPosition(stableButtonPosition);
                        setFloatingButtonDockSide(resolvedDockSide);

                        if (nearDockSide) {
                            persistFloatingButtonPosition(
                                stableButtonPosition,
                                resolvedDockSide
                            );
                        }
                    }
                    onOpenChange(true);
                }}
                className={`fixed z-40 border bg-panel/95 py-3 hover:bg-white ${
                    open
                        ? "pointer-events-none opacity-0"
                        : floatingButtonIsDockPreviewActive
                          ? "pointer-events-auto"
                          : "pointer-events-auto"
                } ${
                    floatingButtonPosition ? "" : "right-0 top-1/2 -translate-y-1/2"
                } ${
                    "px-3"
                } ${
                    floatingButtonIsWallIntegrated
                        ? floatingButtonWallSide === "left"
                            ? "rounded-r-2xl rounded-l-none border-l-0"
                            : "rounded-l-2xl rounded-r-none border-r-0"
                        : "rounded-2xl"
                } ${
                    floatingButtonIsDockPreviewActive
                        ? "border-accent/75 shadow-[0_14px_34px_rgba(45,29,12,0.34)] ring-2 ring-accent/30 ring-offset-2 ring-offset-panel"
                        : "border-accent/45 shadow-[0_10px_24px_rgba(45,29,12,0.22)]"
                } ${draggingFloatingButton ? "cursor-grabbing" : "cursor-grab"}`}
                style={
                    floatingButtonPosition
                        ? {
                              left: `${floatingButtonPosition.left}px`,
                              top: `${floatingButtonPosition.top}px`,
                              right: "auto",
                          }
                        : undefined
                }
                aria-label={t("Abrir chat de IA", "Open AI chat")}
                title={t(
                    "Chat IA (arrastra para mover)",
                    "AI chat (drag to move)"
                )}
                >
                    <span
                        className="inline-flex items-center gap-2 text-xs font-medium text-ink"
                    >
                        <span className="inline-flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-accent" />
                        </span>
                        <span className="hidden sm:inline">{t("Chat IA", "AI Chat")}</span>
                    </span>
            </button>

            <button
                type="button"
                onClick={closeDrawer}
                className={`fixed inset-0 z-40 bg-black/20 md:hidden ${
                    open ? "pointer-events-auto" : "pointer-events-none hidden"
                }`}
                aria-label={t("Cerrar chat de IA", "Close AI chat")}
            />

            <aside
                ref={panelRef}
                className={`fixed z-50 bg-panel/95 ${
                    isDesktopViewport
                        ? `${desktopPanelShellClass} ${
                              panelIsDockPreviewActive
                                  ? "ring-2 ring-accent/30 ring-offset-2 ring-offset-panel"
                                  : ""
                          }`
                        : `inset-y-0 w-full ${
                              drawerSide === "right"
                                  ? "right-0 origin-right border-l border-ring shadow-[-12px_0_28px_rgba(45,29,12,0.2)]"
                                  : "left-0 origin-left border-r border-ring shadow-[12px_0_28px_rgba(45,29,12,0.2)]"
                           }`
                } ${
                    open ? "" : "pointer-events-none hidden"
                }`}
                style={
                    isDesktopViewport
                        ? {
                              width: desktopPanelWidth,
                              height: panelFrameHeight,
                              left: `${panelFrameLeft}px`,
                              top: `${panelFrameTop}px`,
                          }
                        : undefined
                }
                aria-hidden={!open}
                data-assistant-mode={assistantMode}
            >
                {isDesktopViewport && (
                    <div
                        className={`absolute top-0 hidden h-full w-3 cursor-col-resize md:block z-[60] ${
                            panelResizeAnchorSide === "right" ? "left-0" : "right-0"
                        } ${
                            resizing ? "bg-accent/20" : "bg-transparent hover:bg-accent/10"
                        }`}
                        onMouseDown={handleResizeMouseDown}
                        aria-hidden
                        title={t("Redimensionar panel", "Resize panel")}
                    >
                        <div className="mx-auto mt-2 h-12 w-1 rounded-full bg-ring/85" />
                    </div>
                )}
                {isDesktopViewport && panelIsDetached && (
                    <div
                        className={`absolute bottom-0 left-0 right-0 hidden h-3 cursor-row-resize md:block z-[60] ${
                            resizingHeight
                                ? "bg-accent/20"
                                : "bg-transparent hover:bg-accent/10"
                        }`}
                        onMouseDown={handleResizeHeightMouseDown}
                        aria-hidden
                        title={t("Redimensionar altura", "Resize height")}
                    >
                        <div className="mx-auto mt-0.5 h-1 w-14 rounded-full bg-ring/80" />
                    </div>
                )}
                {isDesktopViewport && shouldDockTrainingPanel && !trainingEditorCollapsed && (
                    <div
                        className={`absolute hidden w-4 cursor-col-resize md:block z-[58] ${
                            panelWallSide === "right"
                                ? "-translate-x-1/2"
                                : "translate-x-1/2"
                        } ${
                            resizingTrainingSplit
                                ? "bg-accent/20"
                                : "bg-transparent hover:bg-accent/12"
                        }`}
                        style={trainingSplitHandleStyle}
                        onMouseDown={handleTrainingSplitResizeMouseDown}
                        aria-hidden
                        title={t(
                            "Redimensionar columnas chat/editor",
                            "Resize chat/editor columns"
                        )}
                    >
                        <div className="mx-auto mt-2 h-14 w-1 rounded-full bg-ring/80" />
                    </div>
                )}
                <div className="relative flex h-full flex-col">
                    <header
                        ref={panelHeaderRef}
                        className={`border-b border-ring px-4 ${
                            isTraining ? "py-3" : "py-2.5"
                        }`}
                    >
                        {isDesktopViewport && (
                            <div
                                onMouseDown={handlePanelMouseDown}
                                className={`mb-2 flex justify-center ${
                                    draggingPanel ? "cursor-grabbing" : "cursor-grab"
                                }`}
                                title={t("Mover ventana de chat", "Move chat window")}
                            >
                                <span className="h-1.5 w-16 rounded-full bg-ring/90" />
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <h3 className="text-sm font-semibold text-ink inline-flex items-center gap-2">
                                    <span
                                        className="inline-flex h-4 w-4 items-center justify-center"
                                    >
                                        <Sparkles className="h-4 w-4 text-accent" />
                                    </span>
                                    {t("Chat IA", "AI Chat")}
                                </h3>
                                <p className="text-[11px] text-ink-muted mt-0.5">
                                    {t(
                                        "Asistente con permisos de campaña.",
                                        "Campaign-permission assistant."
                                    )}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={handleClearConversation}
                                    disabled={loading}
                                    aria-label={t("Limpiar conversación", "Clear conversation")}
                                    title={t("Limpiar conversación", "Clear conversation")}
                                    className="inline-flex items-center gap-1 rounded-md border border-ring bg-white/80 px-2 py-1 text-[11px] text-ink hover:bg-white disabled:opacity-60"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {t("Clear", "Clear")}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeDrawer}
                                    aria-label={t("Cerrar chat", "Close chat")}
                                    className="rounded-full border border-ring bg-white/80 p-1.5 hover:bg-white"
                                >
                                    <X className="h-4 w-4 text-ink" />
                                </button>
                            </div>
                        </div>
                        {selectedLabel && (
                            <p className="mt-1.5 text-[10px] text-ink-muted">
                                {t("Objetivo actual:", "Current target:")}{" "}
                                <span className="font-medium text-ink">{selectedLabel}</span>
                            </p>
                        )}
                        <div className="mt-2 flex items-start justify-between gap-2">
                        <div className="inline-flex rounded-md border border-ring bg-white/70 p-0.5">
                            <button
                                type="button"
                                onClick={() => handleAssistantModeChange("normal")}
                                disabled={loading}
                                className={`rounded px-2 py-1 text-[10px] ${
                                    assistantMode === "normal"
                                        ? "bg-accent/20 text-ink"
                                        : "text-ink-muted hover:bg-white/80"
                                } disabled:opacity-60`}
                            >
                                {t("Normal", "Normal")}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAssistantModeChange("training")}
                                disabled={loading}
                                className={`rounded px-2 py-1 text-[10px] ${
                                    assistantMode === "training"
                                        ? "bg-accent/20 text-ink"
                                        : "text-ink-muted hover:bg-white/80"
                                } disabled:opacity-60`}
                            >
                                {t("Entrenamiento", "Training")}
                            </button>
                        </div>
                        {!isTraining && (
                            <details className="group rounded-md border border-ring/80 bg-white/65 px-2 py-1 text-[10px] text-ink-muted">
                                <summary className="cursor-pointer select-none list-none font-medium text-ink">
                                    {t("Ajustes IA", "AI settings")}
                                </summary>
                                <div className="mt-1.5 space-y-2 text-[10px] leading-relaxed">
                                    {!aiNoticeAcknowledged && (
                                        <div className="rounded border border-amber-300/60 bg-amber-50/75 px-2 py-1.5 text-amber-900">
                                            <p>
                                                {t(
                                                    "Aviso IA: puede cometer errores.",
                                                    "AI notice: it may make mistakes."
                                                )}
                                            </p>
                                            <div className="mt-1 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={handleAcknowledgeAiNotice}
                                                    className="rounded border border-amber-400/70 bg-white px-2 py-0.5 text-[10px] text-amber-900 hover:bg-amber-100"
                                                >
                                                    {t("Entendido", "Understood")}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <label className="flex items-start gap-2 rounded border border-ring/70 bg-panel/85 px-2 py-1.5 text-ink">
                                        <input
                                            type="checkbox"
                                            checked={globalTrainingConsent}
                                            onChange={(event) =>
                                                handleGlobalTrainingConsentToggle(event.target.checked)
                                            }
                                            disabled={loading}
                                            className="mt-0.5"
                                        />
                                        <span>
                                            {t(
                                                "Compartir prompts para mejorar la IA global (opcional).",
                                                "Share prompts to improve global AI (optional)."
                                            )}
                                        </span>
                                    </label>
                                </div>
                            </details>
                        )}
                        </div>
                        <p className="mt-1 text-[10px] leading-relaxed text-ink-muted">
                            {assistantMode === "training"
                                ? t(
                                      "Te ayudo a mejorar prompts y a estructurar cambios antes de aplicarlos.",
                                      "I help you improve prompts and structure changes before applying them."
                                  )
                                : t(
                                      "Flujo directo para proponer cambios listos para confirmar.",
                                      "Direct flow to propose changes ready to confirm."
                                  )}
                        </p>
                        {isTraining && !aiNoticeAcknowledged && (
                            <div className="mt-2 rounded-md border border-amber-300/70 bg-amber-50 px-2 py-2 text-[11px] text-amber-900">
                                <p>
                                    {t(
                                        "Aviso IA: las respuestas pueden contener errores. Si activas compartir entrenamiento, tus prompts se guardarán para mejora global.",
                                        "AI notice: responses may contain mistakes. If you enable training sharing, your prompts will be stored for global improvement."
                                    )}
                                </p>
                                <div className="mt-1 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleAcknowledgeAiNotice}
                                        className="rounded border border-amber-400 bg-white px-2 py-0.5 text-[11px] text-amber-900 hover:bg-amber-100"
                                    >
                                        {t("Entendido", "Understood")}
                                    </button>
                                </div>
                            </div>
                        )}
                        {isTraining && (
                        <label className="mt-2 flex items-start gap-2 rounded-md border border-ring bg-white/70 px-2 py-2 text-[11px] text-ink">
                            <input
                                type="checkbox"
                                checked={globalTrainingConsent}
                                onChange={(event) =>
                                    handleGlobalTrainingConsentToggle(event.target.checked)
                                }
                                disabled={loading}
                                className="mt-0.5"
                            />
                            <span>
                                {t(
                                    "Compartir datos de entrenamiento (opcional): tus prompts se usarán para mejorar la IA global de esta web.",
                                    "Share training data (optional): your prompts will be used to improve this app global AI."
                                )}
                            </span>
                        </label>
                        )}
                        {assistantMode === "training" && (
                            <div className="mt-2 rounded-md border border-ring bg-white/70 px-2 py-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink">
                                    {t("Menú entrenamiento", "Training menu")}
                                </p>
                                <div className="mt-1 inline-flex rounded-md border border-ring bg-white p-0.5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleTrainingSubmodeChange("ai_prompt")
                                        }
                                        disabled={loading}
                                        className={`rounded px-2 py-1 text-[11px] ${
                                            trainingSubmode === "ai_prompt"
                                                ? "bg-accent/20 text-ink"
                                                : "text-ink-muted hover:bg-slate-50"
                                        } disabled:opacity-60`}
                                    >
                                        {t("IA propone prompt", "AI gives prompt")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleTrainingSubmodeChange("sandbox_object")
                                        }
                                        disabled={loading}
                                        className={`rounded px-2 py-1 text-[11px] ${
                                            trainingSubmode === "sandbox_object"
                                                ? "bg-accent/20 text-ink"
                                                : "text-ink-muted hover:bg-slate-50"
                                        } disabled:opacity-60`}
                                    >
                                        {t("Sandbox en chat", "Chat sandbox")}
                                    </button>
                                </div>
                                <p className="mt-1 text-[11px] text-ink-muted">
                                    {trainingSubmode === "ai_prompt"
                                        ? t(
                                              "La IA te da el prompt/ejercicio y una plantilla del objeto para editarla.",
                                              "AI gives you the prompt/challenge and an item template to edit."
                                          )
                                        : t(
                                              "La IA genera un borrador y tú lo modificas en este chat sin aplicar nada real.",
                                              "AI generates a draft and you modify it in this chat without applying real changes."
                                          )}
                                </p>
                            </div>
                        )}
                    </header>

                    <div
                        className="flex-1 overflow-y-auto styled-scrollbar px-3 py-2.5 space-y-2.5 bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.04)_100%)]"
                        style={isDesktopViewport ? structureOverlayPaddingStyle : undefined}
                    >
                        {messages.length === 0 && (
                            <p className="text-xs text-ink-muted">
                                {t(
                                    "Escribe tu primera instrucción para empezar.",
                                    "Write your first instruction to start."
                                )}
                            </p>
                        )}

                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`ai-chat-row flex ${
                                    message.role === "user" ? "justify-end" : "justify-start"
                                }`}
                            >
                                <div
                                    className={`ai-chat-bubble max-w-[87%] border px-3 py-2 text-[12px] leading-[1.35] shadow-[0_4px_12px_rgba(45,29,12,0.08)] ${
                                        message.role === "user"
                                            ? "ai-chat-bubble-user rounded-2xl rounded-br-md border-accent/30 bg-accent/10 text-ink"
                                            : "ai-chat-bubble-assistant rounded-2xl rounded-bl-md border-ring/85 bg-white/85 text-ink"
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap break-words">{message.text}</p>

                                    {message.results && message.results.length > 0 && (
                                        <ul className="mt-2 space-y-1.5">
                                            {message.results.map((entry, index) => (
                                                <li
                                                    key={`${message.id}-${entry.operation}-${entry.characterId ?? "none"}-${index}`}
                                                    className={`rounded-md border px-2 py-1 text-[11px] leading-relaxed ${statusClass(entry.status)}`}
                                                >
                                                    <p className="font-semibold uppercase tracking-[0.12em]">
                                                        {entry.operation} · {entry.status}
                                                    </p>
                                                    <p className="mt-1">{entry.message}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {message.proposedActions && message.proposedActions.length > 0 && (
                                        <div className="mt-2 space-y-1.5">
                                            {message.proposedActions.map((entry, index) => (
                                                <ProposedActionPreview
                                                    key={`${message.id}-${entry.operation}-${entry.characterId ?? "none"}-${index}`}
                                                    action={entry}
                                                    t={t}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="ai-chat-row flex justify-start">
                                <div className="ai-chat-bubble ai-chat-bubble-assistant max-w-[87%] rounded-2xl rounded-bl-md border border-ring/70 bg-white/70 px-3 py-2 text-[12px] leading-[1.35] text-ink-muted shadow-[0_4px_12px_rgba(45,29,12,0.06)]">
                                    <p className="whitespace-pre-wrap break-words italic text-ink-muted/90">
                                        {t("Pensando...", "Thinking...")}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <footer
                        className="border-t border-ring/80 bg-panel/80 px-3 py-2.5 space-y-2"
                        style={isDesktopViewport ? structureOverlayPaddingStyle : undefined}
                    >
                        {error && (
                            <div className="rounded-md border border-red-300/60 bg-red-50 px-3 py-2 text-xs text-red-700">
                                {error}
                            </div>
                        )}

                        {!isTraining && pendingPlan && (
                            <div className="rounded-xl border border-ring/80 bg-panel/95 px-3 py-2 text-[11px] text-ink shadow-[0_6px_16px_rgba(45,29,12,0.08)]">
                                <div className="flex items-center justify-between gap-2">
                                    <p>
                                        {pendingPlanUsesTrainingEditor
                                            ? t(
                                                  `Hay ${pendingPlan.originalProposedActions.length} cambio(s) pendiente(s). Edítalos con el editor de estructura y luego confirma.`,
                                                  `${pendingPlan.originalProposedActions.length} pending change(s). Edit them with the structure editor and then confirm.`
                                              )
                                            : t(
                                                  `Hay ${pendingPlan.editorDrafts.length} cambio(s) pendiente(s). Puedes editarlos antes de aplicar.`,
                                                  `${pendingPlan.editorDrafts.length} pending change(s). You can edit them before applying.`
                                              )}
                                    </p>
                                    {pendingPlanHasUserEdits && (
                                        <span className="rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-ink">
                                            {t("Editado", "Edited")}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-2 max-h-44 space-y-1.5 overflow-y-auto pr-1 styled-scrollbar">
                                    {(pendingPlanUsesTrainingEditor
                                        ? pendingPlanTrainingPreviewActions
                                        : pendingPlan.originalProposedActions
                                    ).map((entry, index) => (
                                        <ProposedActionPreview
                                            key={`pending-preview-${entry.operation}-${entry.characterId ?? "none"}-${index}`}
                                            action={entry}
                                            t={t}
                                        />
                                    ))}
                                </div>
                                <div className="mt-2 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={handleCancelPendingPlan}
                                        disabled={loading}
                                        className="rounded-md border border-ring bg-white px-3 py-1.5 text-[11px] text-ink hover:bg-panel disabled:opacity-60"
                                    >
                                        {t("Cancelar", "Cancel")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleApplyPendingPlan}
                                        disabled={loading}
                                        className="rounded-md border border-accent/55 bg-accent/15 px-3 py-1.5 text-[11px] text-accent-strong hover:bg-accent/22 disabled:opacity-60"
                                    >
                                        {loading
                                            ? t("Aplicando...", "Applying...")
                                            : t("Confirmar y aplicar", "Confirm and apply")}
                                    </button>
                                </div>
                            </div>
                        )}

                        {showTrainingLikeStructureEditor && (
                            <div
                                className={`ai-structure-panel rounded-md border px-3 py-2 text-xs transition-[width,transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                    shouldDockTrainingPanel
                                        ? `md:absolute md:z-[45] md:flex md:flex-col md:overflow-hidden md:rounded-none md:shadow-none ${
                                              panelWallSide === "right"
                                                  ? "md:border-r md:border-l-0"
                                                  : "md:border-l md:border-r-0"
                                          }`
                                        : ""
                                } ${
                                    isTraining
                                        ? "border-sky-300/60 bg-sky-50/95 text-sky-900"
                                        : "border-ring/80 bg-panel/95 text-ink"
                                }`}
                                style={isDesktopViewport ? dockedEditorStyle : undefined}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-medium">
                                            {isTraining
                                                ? t(
                                                      "Editor de estructura (entrenamiento, no se aplica en campaña)",
                                                      "Structure editor (training, never applied to campaign)"
                                                  )
                                                : t(
                                                      "Editor de estructura de la propuesta",
                                                      "Proposal structure editor"
                                                  )}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-sky-900/90">
                                            {isTraining && trainingSubmode === "ai_prompt"
                                                ? t(
                                                      "La IA inventa un objeto ficticio y su estructura. Modifícala aquí o marca que está correcta.",
                                                      "AI invents a fictional object and structure. Edit it here or mark it as correct."
                                                  )
                                                : isTraining
                                                  ? t(
                                                      "Usa este editor para iterar el borrador con revisiones de la IA.",
                                                      "Use this editor to iterate the draft with AI revisions."
                                                  )
                                                : t(
                                                      "Este es el mismo editor del modo entrenamiento, pero aquí sí se aplicará al confirmar.",
                                                      "This is the same editor as training mode, but here changes will be applied when confirmed."
                                                  )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setTrainingEditorCompact((prev) => !prev)
                                            }
                                            disabled={loading}
                                            className="rounded border border-sky-300 bg-white px-2 py-0.5 text-[11px] text-sky-800 hover:bg-sky-100 disabled:opacity-60"
                                        >
                                            {trainingEditorCompact
                                                ? t("Normal", "Normal")
                                                : t("Compacto", "Compact")}
                                        </button>
                                    </div>
                                </div>
                                {trainingDraftError && (
                                    <p className="mt-1 rounded border border-red-300/70 bg-red-50 px-2 py-1 text-red-700">
                                        {trainingDraftError}
                                    </p>
                                )}
                                <div className="mt-2 flex min-h-0 flex-1 flex-col">
                                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 styled-scrollbar">
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <label className="sm:col-span-2">
                                        <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                            {t("Nombre del objeto", "Item name")}
                                        </span>
                                        <input
                                            value={trainingDraft.targetItemName}
                                            onChange={(event) =>
                                                handleTrainingDraftFieldChange(
                                                    "targetItemName",
                                                    event.target.value
                                                )
                                            }
                                            disabled={loading}
                                            placeholder={t(
                                                "Ej: Semilla del Velo Dormido",
                                                "Ex: Seed of the Sleeping Veil"
                                            )}
                                            className="mt-1 w-full rounded-md border border-sky-200 bg-white px-2 py-1.5 text-[12px] text-ink outline-none focus:border-sky-400"
                                        />
                                    </label>
                                    <label>
                                        <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                            {t("Categoría", "Category")}
                                        </span>
                                        <select
                                            value={trainingDraft.category}
                                            onChange={(event) =>
                                                handleTrainingDraftFieldChange(
                                                    "category",
                                                    event.target.value
                                                )
                                            }
                                            disabled={loading}
                                            className="mt-1 w-full rounded-md border border-sky-200 bg-white px-2 py-1.5 text-[12px] text-ink outline-none focus:border-sky-400"
                                        >
                                            {ITEM_CATEGORY_OPTIONS.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {t(option.es, option.en)}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label>
                                        <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                            {t("Rareza", "Rarity")}
                                        </span>
                                        <input
                                            value={trainingDraft.rarity}
                                            onChange={(event) =>
                                                handleTrainingDraftFieldChange(
                                                    "rarity",
                                                    event.target.value
                                                )
                                            }
                                            disabled={loading}
                                            placeholder={t("raro", "rare")}
                                            className="mt-1 w-full rounded-md border border-sky-200 bg-white px-2 py-1.5 text-[12px] text-ink outline-none focus:border-sky-400"
                                        />
                                    </label>
                                    <div className="sm:col-span-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                                        <label className="inline-flex items-center gap-1 text-[11px]">
                                            <input
                                                type="checkbox"
                                                checked={trainingDraft.createIfMissing}
                                                onChange={(event) =>
                                                    handleTrainingDraftFieldChange(
                                                        "createIfMissing",
                                                        event.target.checked
                                                    )
                                                }
                                                disabled={loading}
                                            />
                                            {t("Crear si no existe", "Create if missing")}
                                        </label>
                                        <label className="inline-flex items-center gap-1 text-[11px]">
                                            <input
                                                type="checkbox"
                                                checked={trainingDraft.equippable}
                                                onChange={(event) =>
                                                    handleTrainingDraftFieldChange(
                                                        "equippable",
                                                        event.target.checked
                                                    )
                                                }
                                                disabled={loading}
                                            />
                                            {t("Equipable", "Equippable")}
                                        </label>
                                        <label className="inline-flex items-center gap-1 text-[11px]">
                                            <input
                                                type="checkbox"
                                                checked={trainingDraft.equipped}
                                                onChange={(event) =>
                                                    handleTrainingDraftFieldChange(
                                                        "equipped",
                                                        event.target.checked
                                                    )
                                                }
                                                disabled={loading}
                                            />
                                            {t("Equipado", "Equipped")}
                                        </label>
                                    </div>
                                    <label className="sm:col-span-2">
                                        <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                            {t("Descripción base", "Base description")}
                                        </span>
                                        <textarea
                                            value={trainingDraft.description}
                                            onChange={(event) =>
                                                handleTrainingDraftFieldChange(
                                                    "description",
                                                    event.target.value
                                                )
                                            }
                                            rows={draftDescriptionRows}
                                            disabled={loading}
                                            placeholder={t(
                                                "Describe el lore del objeto sin repetir mecánicas de adjuntos.",
                                                "Describe item lore without repeating attachment mechanics."
                                            )}
                                            className="mt-1 w-full rounded-md border border-sky-200 bg-white px-2 py-2 text-[12px] text-ink outline-none focus:border-sky-400"
                                        />
                                    </label>
                                </div>

                                <div className="mt-2 rounded-md border border-sky-200 bg-white/70 px-2 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-900/80">
                                            {t("Adjuntos del objeto", "Item attachments")}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleAddTrainingAttachment}
                                            disabled={loading}
                                            className="rounded border border-sky-300 bg-sky-100 px-2 py-0.5 text-[11px] text-sky-900 hover:bg-sky-200 disabled:opacity-60"
                                        >
                                            {t("Añadir adjunto", "Add attachment")}
                                        </button>
                                    </div>
                                    <div className={`mt-2 space-y-2 overflow-y-auto pr-1 styled-scrollbar ${attachmentsMaxHeightClass}`}>
                                        {trainingDraft.attachments.map((attachment, index) => {
                                            const isSpellLikeAttachment =
                                                isTrainingDraftSpellLike(attachment.type);
                                            const isAbilityLikeAttachment =
                                                isTrainingDraftAbilityLike(attachment.type);
                                            const showsRollAndDamage =
                                                isSpellLikeAttachment || isAbilityLikeAttachment;
                                            const trimmedCastingTime =
                                                attachment.castingTime.trim();
                                            const hasCustomCastingTime =
                                                trimmedCastingTime.length > 0 &&
                                                !SPELL_CASTING_TIME_OPTIONS.includes(
                                                    trimmedCastingTime
                                                );
                                            return (
                                            <div
                                                key={attachment.id}
                                                className="rounded border border-sky-200 bg-white px-2 py-2"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[11px] font-medium text-sky-900">
                                                        {t("Adjunto", "Attachment")} {index + 1}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveTrainingAttachment(
                                                                attachment.id
                                                            )
                                                        }
                                                        disabled={loading}
                                                        className="rounded border border-red-300 px-1.5 py-0.5 text-[10px] text-red-700 hover:bg-red-50 disabled:opacity-60"
                                                    >
                                                        {t("Eliminar", "Delete")}
                                                    </button>
                                                </div>
                                                <div className="mt-1 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                                                    <label>
                                                        <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                            {t("Tipo", "Type")}
                                                        </span>
                                                        <select
                                                            value={attachment.type}
                                                            onChange={(event) =>
                                                                handleTrainingAttachmentChange(
                                                                    attachment.id,
                                                                    "type",
                                                                    event.target.value
                                                                )
                                                            }
                                                            disabled={loading}
                                                            className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                        >
                                                            {ATTACHMENT_TYPE_OPTIONS.map(
                                                                (option) => (
                                                                    <option
                                                                        key={option.value}
                                                                        value={option.value}
                                                                    >
                                                                        {t(
                                                                            option.es,
                                                                            option.en
                                                                        )}
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                    </label>
                                                    <label className="sm:col-span-2">
                                                        <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                            {t("Nombre", "Name")}
                                                        </span>
                                                        <input
                                                            value={attachment.name}
                                                            onChange={(event) =>
                                                                handleTrainingAttachmentChange(
                                                                    attachment.id,
                                                                    "name",
                                                                    event.target.value
                                                                )
                                                            }
                                                            disabled={loading}
                                                            className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                        />
                                                    </label>
                                                    {(isSpellLikeAttachment ||
                                                        isAbilityLikeAttachment) && (
                                                        <label>
                                                            <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                {t(
                                                                    "Nivel (opcional)",
                                                                    "Level (optional)"
                                                                )}
                                                            </span>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={20}
                                                                value={attachment.level}
                                                                onChange={(event) =>
                                                                    handleTrainingAttachmentChange(
                                                                        attachment.id,
                                                                        "level",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                disabled={loading}
                                                                placeholder={
                                                                    attachment.type === "cantrip"
                                                                        ? "0"
                                                                        : "1"
                                                                }
                                                                className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                            />
                                                        </label>
                                                    )}
                                                    <label className="sm:col-span-3">
                                                        <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                            {t("Descripción", "Description")}
                                                        </span>
                                                        <textarea
                                                            value={attachment.description}
                                                            onChange={(event) =>
                                                                handleTrainingAttachmentChange(
                                                                    attachment.id,
                                                                    "description",
                                                                    event.target.value
                                                                )
                                                            }
                                                            rows={attachmentDescriptionRows}
                                                            disabled={loading}
                                                            className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1.5 text-[11px] text-ink outline-none focus:border-sky-400"
                                                        />
                                                    </label>
                                                </div>

                                                {isAbilityLikeAttachment && (
                                                    <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                                        <label>
                                                            <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                {t("Tipo de acción", "Action type")}
                                                            </span>
                                                            <select
                                                                value={attachment.actionType}
                                                                onChange={(event) =>
                                                                    handleTrainingAttachmentChange(
                                                                        attachment.id,
                                                                        "actionType",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                disabled={loading}
                                                                className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                            >
                                                                <option value="">
                                                                    {t(
                                                                        "Sin tipo",
                                                                        "No action type"
                                                                    )}
                                                                </option>
                                                                {FEATURE_ACTION_OPTIONS.map((option) => (
                                                                    <option
                                                                        key={option.value}
                                                                        value={option.value}
                                                                    >
                                                                        {t(option.es, option.en)}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </label>
                                                        <label>
                                                            <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                {t("Requisitos", "Requirements")}
                                                            </span>
                                                            <input
                                                                value={attachment.requirements}
                                                                onChange={(event) =>
                                                                    handleTrainingAttachmentChange(
                                                                        attachment.id,
                                                                        "requirements",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                disabled={loading}
                                                                className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                            />
                                                        </label>
                                                        <label className="sm:col-span-2">
                                                            <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                {t("Efecto", "Effect")}
                                                            </span>
                                                            <textarea
                                                                value={attachment.effect}
                                                                onChange={(event) =>
                                                                    handleTrainingAttachmentChange(
                                                                        attachment.id,
                                                                        "effect",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                rows={2}
                                                                disabled={loading}
                                                                className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1.5 text-[11px] text-ink outline-none focus:border-sky-400"
                                                            />
                                                        </label>
                                                    </div>
                                                )}

                                                {isSpellLikeAttachment && (
                                                    <>
                                                        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                                            <label>
                                                                <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                    {t("Escuela", "School")}
                                                                </span>
                                                                <input
                                                                    value={attachment.school}
                                                                    onChange={(event) =>
                                                                        handleTrainingAttachmentChange(
                                                                            attachment.id,
                                                                            "school",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    disabled={loading}
                                                                    className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                />
                                                            </label>
                                                            <label>
                                                                <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                    {t("Alcance", "Range")}
                                                                </span>
                                                                <input
                                                                    value={attachment.range}
                                                                    onChange={(event) =>
                                                                        handleTrainingAttachmentChange(
                                                                            attachment.id,
                                                                            "range",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    disabled={loading}
                                                                    className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                />
                                                            </label>
                                                            <label>
                                                                <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                    {t(
                                                                        "Tiempo de lanzamiento",
                                                                        "Casting time"
                                                                    )}
                                                                </span>
                                                                <select
                                                                    value={attachment.castingTime}
                                                                    onChange={(event) =>
                                                                        handleTrainingAttachmentChange(
                                                                            attachment.id,
                                                                            "castingTime",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    disabled={loading}
                                                                    className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                >
                                                                    <option value="">
                                                                        {t(
                                                                            "Seleccionar",
                                                                            "Select"
                                                                        )}
                                                                    </option>
                                                                    {SPELL_CASTING_TIME_OPTIONS.map((option) => (
                                                                        <option
                                                                            key={option}
                                                                            value={option}
                                                                        >
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                    {hasCustomCastingTime && (
                                                                        <option
                                                                            value={trimmedCastingTime}
                                                                        >
                                                                            {trimmedCastingTime}
                                                                        </option>
                                                                    )}
                                                                </select>
                                                            </label>
                                                            <label>
                                                                <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                    {t("Duración", "Duration")}
                                                                </span>
                                                                <input
                                                                    value={attachment.duration}
                                                                    onChange={(event) =>
                                                                        handleTrainingAttachmentChange(
                                                                            attachment.id,
                                                                            "duration",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    disabled={loading}
                                                                    className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                />
                                                            </label>
                                                            <label className="sm:col-span-2">
                                                                <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                    {t(
                                                                        "Nota de lanzamiento",
                                                                        "Casting note"
                                                                    )}
                                                                </span>
                                                                <input
                                                                    value={
                                                                        attachment.castingTimeNote
                                                                    }
                                                                    onChange={(event) =>
                                                                        handleTrainingAttachmentChange(
                                                                            attachment.id,
                                                                            "castingTimeNote",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    disabled={loading}
                                                                    className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                />
                                                            </label>
                                                        </div>
                                                        <div className="mt-2 rounded border border-sky-200 bg-sky-50/40 px-2 py-2">
                                                            <p className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                {t("Componentes", "Components")}
                                                            </p>
                                                            <div className="mt-1 flex flex-wrap gap-3">
                                                                <label className="inline-flex items-center gap-1 text-[11px] text-sky-950">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={
                                                                            attachment.componentVerbal
                                                                        }
                                                                        onChange={(event) =>
                                                                            handleTrainingAttachmentChange(
                                                                                attachment.id,
                                                                                "componentVerbal",
                                                                                event.target.checked
                                                                            )
                                                                        }
                                                                        disabled={loading}
                                                                    />
                                                                    V
                                                                </label>
                                                                <label className="inline-flex items-center gap-1 text-[11px] text-sky-950">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={
                                                                            attachment.componentSomatic
                                                                        }
                                                                        onChange={(event) =>
                                                                            handleTrainingAttachmentChange(
                                                                                attachment.id,
                                                                                "componentSomatic",
                                                                                event.target.checked
                                                                            )
                                                                        }
                                                                        disabled={loading}
                                                                    />
                                                                    S
                                                                </label>
                                                                <label className="inline-flex items-center gap-1 text-[11px] text-sky-950">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={
                                                                            attachment.componentMaterial
                                                                        }
                                                                        onChange={(event) =>
                                                                            handleTrainingAttachmentChange(
                                                                                attachment.id,
                                                                                "componentMaterial",
                                                                                event.target.checked
                                                                            )
                                                                        }
                                                                        disabled={loading}
                                                                    />
                                                                    M
                                                                </label>
                                                            </div>
                                                            {attachment.componentMaterial && (
                                                                <label className="mt-1 block">
                                                                    <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                        {t("Materiales", "Materials")}
                                                                    </span>
                                                                    <input
                                                                        value={attachment.materials}
                                                                        onChange={(event) =>
                                                                            handleTrainingAttachmentChange(
                                                                                attachment.id,
                                                                                "materials",
                                                                                event.target.value
                                                                            )
                                                                        }
                                                                        disabled={loading}
                                                                        className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                    />
                                                                </label>
                                                            )}
                                                            <div className="mt-1 flex flex-wrap gap-3">
                                                                <label className="inline-flex items-center gap-1 text-[11px] text-sky-950">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={attachment.concentration}
                                                                        onChange={(event) =>
                                                                            handleTrainingAttachmentChange(
                                                                                attachment.id,
                                                                                "concentration",
                                                                                event.target.checked
                                                                            )
                                                                        }
                                                                        disabled={loading}
                                                                    />
                                                                    {t(
                                                                        "Concentración",
                                                                        "Concentration"
                                                                    )}
                                                                </label>
                                                                <label className="inline-flex items-center gap-1 text-[11px] text-sky-950">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={attachment.ritual}
                                                                        onChange={(event) =>
                                                                            handleTrainingAttachmentChange(
                                                                                attachment.id,
                                                                                "ritual",
                                                                                event.target.checked
                                                                            )
                                                                        }
                                                                        disabled={loading}
                                                                    />
                                                                    {t("Ritual", "Ritual")}
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {showsRollAndDamage && (
                                                    <details className="mt-2 rounded border border-sky-200 bg-sky-50/30 px-2 py-1.5">
                                                        <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-wide text-sky-900/90">
                                                            {t("Coste / recursos", "Cost / resources")}
                                                        </summary>
                                                        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                                            <label className="sm:col-span-2 inline-flex items-center gap-1 text-[11px] text-sky-950">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={attachment.usesSpellSlot}
                                                                    onChange={(event) =>
                                                                        handleTrainingAttachmentChange(
                                                                            attachment.id,
                                                                            "usesSpellSlot",
                                                                            event.target.checked
                                                                        )
                                                                    }
                                                                    disabled={loading}
                                                                />
                                                                {t(
                                                                    "Usa espacio de conjuro",
                                                                    "Use spell slot"
                                                                )}
                                                            </label>
                                                            {attachment.usesSpellSlot && (
                                                                <label>
                                                                    <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                        {t(
                                                                            "Nivel de espacio",
                                                                            "Slot level"
                                                                        )}
                                                                    </span>
                                                                    <input
                                                                        type="number"
                                                                        min={0}
                                                                        max={9}
                                                                        value={attachment.slotLevel}
                                                                        onChange={(event) =>
                                                                            handleTrainingAttachmentChange(
                                                                                attachment.id,
                                                                                "slotLevel",
                                                                                event.target.value
                                                                            )
                                                                        }
                                                                        disabled={loading}
                                                                        className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                    />
                                                                </label>
                                                            )}
                                                            <label>
                                                                <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                    {t("Cargas", "Charges")}
                                                                </span>
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    value={attachment.charges}
                                                                    onChange={(event) =>
                                                                        handleTrainingAttachmentChange(
                                                                            attachment.id,
                                                                            "charges",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    disabled={loading}
                                                                    className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                />
                                                            </label>
                                                            <label>
                                                                <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                    {t("Recarga", "Recharge")}
                                                                </span>
                                                                <select
                                                                    value={attachment.recharge}
                                                                    onChange={(event) =>
                                                                        handleTrainingAttachmentChange(
                                                                            attachment.id,
                                                                            "recharge",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    disabled={loading}
                                                                    className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                >
                                                                    <option value="">
                                                                        {t(
                                                                            "Sin recarga",
                                                                            "No recharge"
                                                                        )}
                                                                    </option>
                                                                    {ATTACHMENT_RECHARGE_OPTIONS.map((option) => (
                                                                        <option
                                                                            key={option.value}
                                                                            value={option.value}
                                                                        >
                                                                            {t(option.es, option.en)}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </label>
                                                            <label>
                                                                <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                    {t(
                                                                        "Etiqueta de puntos",
                                                                        "Points label"
                                                                    )}
                                                                </span>
                                                                <input
                                                                    value={attachment.pointsLabel}
                                                                    onChange={(event) =>
                                                                        handleTrainingAttachmentChange(
                                                                            attachment.id,
                                                                            "pointsLabel",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    disabled={loading}
                                                                    className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                />
                                                            </label>
                                                            <label>
                                                                <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                    {t("Puntos", "Points")}
                                                                </span>
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    value={attachment.points}
                                                                    onChange={(event) =>
                                                                        handleTrainingAttachmentChange(
                                                                            attachment.id,
                                                                            "points",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    disabled={loading}
                                                                    className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                />
                                                            </label>
                                                        </div>
                                                    </details>
                                                )}

                                                {showsRollAndDamage && (
                                                    <details className="mt-2 rounded border border-sky-200 bg-sky-50/30 px-2 py-1.5">
                                                        <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-wide text-sky-900/90">
                                                            {t("Tirada / salvación", "Roll / save")}
                                                        </summary>
                                                        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                                            <label className="sm:col-span-2">
                                                                <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                    {t("Tipo", "Type")}
                                                                </span>
                                                                <select
                                                                    value={attachment.saveType}
                                                                    onChange={(event) =>
                                                                        handleTrainingAttachmentChange(
                                                                            attachment.id,
                                                                            "saveType",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    disabled={loading}
                                                                    className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                >
                                                                    {ATTACHMENT_SAVE_TYPE_OPTIONS.map((option) => (
                                                                        <option
                                                                            key={option.value}
                                                                            value={option.value}
                                                                        >
                                                                            {t(option.es, option.en)}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </label>
                                                            {attachment.saveType === "save" && (
                                                                <>
                                                                    <label>
                                                                        <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                            {t("Atributo", "Attribute")}
                                                                        </span>
                                                                        <select
                                                                            value={attachment.saveAbility}
                                                                            onChange={(event) =>
                                                                                handleTrainingAttachmentChange(
                                                                                    attachment.id,
                                                                                    "saveAbility",
                                                                                    event.target.value
                                                                                )
                                                                            }
                                                                            disabled={loading}
                                                                            className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                        >
                                                                            <option value="">
                                                                                {t(
                                                                                    "Sin atributo",
                                                                                    "No attribute"
                                                                                )}
                                                                            </option>
                                                                            {ATTACHMENT_ABILITY_OPTIONS.map((option) => (
                                                                                <option
                                                                                    key={option.value}
                                                                                    value={option.value}
                                                                                >
                                                                                    {t(
                                                                                        option.es,
                                                                                        option.en
                                                                                    )}{" "}
                                                                                    ({option.value})
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </label>
                                                                    <label>
                                                                        <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                            CD
                                                                        </span>
                                                                        <select
                                                                            value={attachment.dcType}
                                                                            onChange={(event) =>
                                                                                handleTrainingAttachmentChange(
                                                                                    attachment.id,
                                                                                    "dcType",
                                                                                    event.target.value
                                                                                )
                                                                            }
                                                                            disabled={loading}
                                                                            className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                        >
                                                                            <option value="">
                                                                                {t("Sin CD", "No DC")}
                                                                            </option>
                                                                            {ATTACHMENT_DC_TYPE_OPTIONS.map((option) => (
                                                                                <option
                                                                                    key={option.value}
                                                                                    value={option.value}
                                                                                >
                                                                                    {t(option.es, option.en)}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </label>
                                                                    {attachment.dcType === "fixed" && (
                                                                        <label>
                                                                            <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                                {t("CD fija", "Fixed DC")}
                                                                            </span>
                                                                            <input
                                                                                type="number"
                                                                                min={0}
                                                                                max={99}
                                                                                value={attachment.dcValue}
                                                                                onChange={(event) =>
                                                                                    handleTrainingAttachmentChange(
                                                                                        attachment.id,
                                                                                        "dcValue",
                                                                                        event.target.value
                                                                                    )
                                                                                }
                                                                                disabled={loading}
                                                                                className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                            />
                                                                        </label>
                                                                    )}
                                                                    {attachment.dcType === "stat" && (
                                                                        <label>
                                                                            <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                                {t(
                                                                                    "Atributo base",
                                                                                    "Base stat"
                                                                                )}
                                                                            </span>
                                                                            <select
                                                                                value={attachment.dcStat}
                                                                                onChange={(event) =>
                                                                                    handleTrainingAttachmentChange(
                                                                                        attachment.id,
                                                                                        "dcStat",
                                                                                        event.target.value
                                                                                    )
                                                                                }
                                                                                disabled={loading}
                                                                                className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                            >
                                                                                <option value="">
                                                                                    {t(
                                                                                        "Sin atributo",
                                                                                        "No attribute"
                                                                                    )}
                                                                                </option>
                                                                                {ATTACHMENT_ABILITY_OPTIONS.map((option) => (
                                                                                    <option
                                                                                        key={option.value}
                                                                                        value={option.value}
                                                                                    >
                                                                                        {t(
                                                                                            option.es,
                                                                                            option.en
                                                                                        )}{" "}
                                                                                        ({option.value})
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        </label>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </details>
                                                )}

                                                {showsRollAndDamage && (
                                                    <details className="mt-2 rounded border border-sky-200 bg-sky-50/30 px-2 py-1.5">
                                                        <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-wide text-sky-900/90">
                                                            {t("Daño", "Damage")}
                                                        </summary>
                                                        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                                            <label>
                                                                <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                    {t("Tipo de daño", "Damage type")}
                                                                </span>
                                                                <input
                                                                    value={attachment.damageType}
                                                                    onChange={(event) =>
                                                                        handleTrainingAttachmentChange(
                                                                            attachment.id,
                                                                            "damageType",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    disabled={loading}
                                                                    className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                />
                                                            </label>
                                                            <label>
                                                                <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                    {t("Dados", "Dice")}
                                                                </span>
                                                                <input
                                                                    value={attachment.damageDice}
                                                                    onChange={(event) =>
                                                                        handleTrainingAttachmentChange(
                                                                            attachment.id,
                                                                            "damageDice",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    disabled={loading}
                                                                    className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                />
                                                            </label>
                                                            <label className="sm:col-span-2">
                                                                <span className="text-[10px] uppercase tracking-wide text-sky-900/80">
                                                                    {t("Escalado", "Scaling")}
                                                                </span>
                                                                <input
                                                                    value={attachment.damageScaling}
                                                                    onChange={(event) =>
                                                                        handleTrainingAttachmentChange(
                                                                            attachment.id,
                                                                            "damageScaling",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    disabled={loading}
                                                                    className="mt-1 w-full rounded border border-sky-200 bg-white px-2 py-1 text-[11px] text-ink outline-none focus:border-sky-400"
                                                                />
                                                            </label>
                                                        </div>
                                                    </details>
                                                )}
                                            </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                    </div>
                                <div className="mt-2 shrink-0 border-t border-sky-200/70 pt-2">
                                {isTraining ? (
                                    <>
                                        <input
                                            value={trainingDraftNotes}
                                            onChange={(event) =>
                                                setTrainingDraftNotes(event.target.value)
                                            }
                                            disabled={loading}
                                            placeholder={t(
                                                "Ajuste para el borrador: ej. cambia rareza a épica y añade 1 acción bonus.",
                                                "Draft adjustment: e.g. change rarity to epic and add 1 bonus action."
                                            )}
                                            className="w-full rounded-md border border-sky-200 bg-white px-2 py-1.5 text-[11px] text-ink outline-none focus:border-sky-400"
                                        />
                                        <div className="mt-2 flex flex-wrap justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={handleClearTrainingDraft}
                                                disabled={loading}
                                                className="rounded-md border border-sky-300 bg-white px-2 py-1 text-[11px] text-sky-800 hover:bg-sky-100 disabled:opacity-60"
                                            >
                                                {t("Limpiar borrador", "Clear draft")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handlePreviewTrainingDraft}
                                                disabled={loading}
                                                className="rounded-md border border-sky-400 bg-sky-100 px-2 py-1 text-[11px] text-sky-900 hover:bg-sky-200 disabled:opacity-60"
                                            >
                                                {t("Ver preview en chat", "Preview in chat")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleRequestTrainingDraftRevision}
                                                disabled={loading}
                                                className="rounded-md border border-sky-500 bg-sky-200 px-2 py-1 text-[11px] text-sky-950 hover:bg-sky-300 disabled:opacity-60"
                                            >
                                                {loading
                                                    ? t("Revisando...", "Reviewing...")
                                                    : t("Pedir revisión IA", "Ask AI revision")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleApproveTrainingDraft}
                                                disabled={loading}
                                                className="rounded-md border border-emerald-500 bg-emerald-100 px-2 py-1 text-[11px] text-emerald-900 hover:bg-emerald-200 disabled:opacity-60"
                                            >
                                                {loading
                                                    ? t("Validando...", "Validating...")
                                                    : t("Está correcto", "Looks correct")}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-wrap justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={handleResetPendingPlanStructureEditor}
                                            disabled={loading || !pendingPlanHasUserEdits}
                                            className="rounded-md border border-sky-300 bg-white px-2 py-1 text-[11px] text-sky-800 hover:bg-sky-100 disabled:opacity-60"
                                        >
                                            {t(
                                                "Restablecer editor",
                                                "Reset editor"
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handlePreviewPendingPlanStructureDraft}
                                            disabled={loading}
                                            className="rounded-md border border-sky-400 bg-sky-100 px-2 py-1 text-[11px] text-sky-900 hover:bg-sky-200 disabled:opacity-60"
                                        >
                                            {t("Ver preview en chat", "Preview in chat")}
                                        </button>
                                    </div>
                                )}
                                </div>
                                    </div>
                            </div>
                        )}

                        <textarea
                            value={prompt}
                            onChange={(event) => setPrompt(event.target.value)}
                            rows={2}
                            disabled={loading || blocksByPendingPlan}
                            placeholder={promptPlaceholder}
                            className="w-full rounded-xl border border-ring bg-white/85 px-3 py-2 text-[12px] leading-relaxed text-ink outline-none focus:border-accent"
                        />

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleRunAssistant}
                                disabled={loading || blocksByPendingPlan}
                                className="inline-flex items-center gap-2 rounded-full border border-accent/45 bg-accent/12 px-3 py-1.5 text-[11px] text-ink hover:bg-accent/20 disabled:opacity-60"
                            >
                                <SendHorizontal className="h-3.5 w-3.5 text-accent" />
                                {loading
                                    ? t("Enviando...", "Sending...")
                                    : sendLabel}
                            </button>
                        </div>
                    </footer>
                </div>
            </aside>
            <style jsx global>{`
                [data-assistant-mode="normal"] .ai-chat-row .ai-chat-bubble {
                    position: relative;
                }

                [data-assistant-mode="normal"] .ai-chat-row .ai-chat-bubble-user::after,
                [data-assistant-mode="normal"] .ai-chat-row .ai-chat-bubble-assistant::before {
                    content: none;
                }

                [data-assistant-mode="normal"] .ai-structure-panel [class*="border-sky-"] {
                    border-color: rgba(140, 110, 78, 0.4) !important;
                }

                [data-assistant-mode="normal"] .ai-structure-panel [class*="bg-sky-"] {
                    background-color: rgba(255, 250, 243, 0.88) !important;
                }

                [data-assistant-mode="normal"] .ai-structure-panel [class*="text-sky-"] {
                    color: var(--ink) !important;
                }

                [data-assistant-mode="normal"]
                    .ai-structure-panel
                    [class*="hover:bg-sky-100"]:hover,
                [data-assistant-mode="normal"]
                    .ai-structure-panel
                    [class*="hover:bg-sky-200"]:hover,
                [data-assistant-mode="normal"]
                    .ai-structure-panel
                    [class*="hover:bg-sky-300"]:hover {
                    background-color: rgba(243, 232, 214, 0.95) !important;
                }

                [data-assistant-mode="normal"]
                    .ai-structure-panel
                    [class*="focus:border-sky-400"]:focus {
                    border-color: var(--accent) !important;
                }
            `}</style>
        </>
    );
}
