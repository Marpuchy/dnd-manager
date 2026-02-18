import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

type CampaignRole = "DM" | "PLAYER";
type CharacterType = "character" | "companion";
type Operation = "create" | "update";
type MutationStatus = "applied" | "blocked" | "skipped" | "error";

type CampaignMemberRow = {
    user_id: string;
    role: CampaignRole;
};

type CharacterSummaryRow = {
    id: string;
    user_id: string;
    name: string;
    class: string | null;
    race: string | null;
    level: number | null;
    character_type: CharacterType | null;
    max_hp?: number | null;
    current_hp?: number | null;
    armor_class?: number | null;
    speed?: number | null;
    stats?: unknown;
    details?: unknown;
};

type CharacterMutationRow = {
    id: string;
    user_id: string;
    name: string;
    stats: unknown;
    details: unknown;
};

type StatKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
const STAT_KEYS: readonly StatKey[] = ["str", "dex", "con", "int", "wis", "cha"];

type DetailPatchKey =
    | "notes"
    | "background"
    | "alignment"
    | "personalityTraits"
    | "ideals"
    | "bonds"
    | "flaws"
    | "appearance"
    | "backstory"
    | "languages"
    | "proficiencies"
    | "abilities"
    | "inventory"
    | "equipment";

const DETAIL_PATCH_KEYS: readonly DetailPatchKey[] = [
    "notes",
    "background",
    "alignment",
    "personalityTraits",
    "ideals",
    "bonds",
    "flaws",
    "appearance",
    "backstory",
    "languages",
    "proficiencies",
    "abilities",
    "inventory",
    "equipment",
];

type StatsObject = Record<StatKey, number>;
type StatsPatch = Partial<Record<StatKey, number>>;
type DetailsPatch = Partial<Record<DetailPatchKey, string | null>>;
type ItemCategory = "weapon" | "armor" | "accessory" | "consumable" | "tool" | "misc";
type ItemAttachmentType =
    | "action"
    | "ability"
    | "trait"
    | "spell"
    | "cantrip"
    | "classFeature"
    | "other";

type ItemAttachmentPatch = {
    type?: ItemAttachmentType;
    name: string;
    level?: number;
    description?: string | null;
};

type ItemPatch = {
    target_item_name: string;
    name?: string;
    create_if_missing?: boolean;
    category?: ItemCategory;
    equippable?: boolean;
    equipped?: boolean;
    quantity?: number;
    rarity?: string | null;
    description?: string | null;
    attunement?: boolean | string | null;
    tags_add?: string[];
    tags_remove?: string[];
    clear_attachments?: boolean;
    attachments_add?: ItemAttachmentPatch[];
    attachments_replace?: ItemAttachmentPatch[];
};

type LearnedSpellPatch = {
    action?: "learn" | "forget";
    spell_level: number;
    spell_name?: string;
    spell_index?: string;
};

type SpellCollection = "customSpells" | "customCantrips";
type SpellComponentPatch = {
    verbal?: boolean;
    somatic?: boolean;
    material?: boolean;
};
type SpellResourceCostPatch = {
    uses_spell_slot?: boolean;
    slot_level?: number;
    charges?: number;
    points?: number;
};
type SpellSavePatch = {
    type?: "attack" | "save" | "none";
    save_ability?: "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";
    dc_type?: "fixed" | "stat";
    dc_value?: number;
    dc_stat?: "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";
};
type SpellDamagePatch = {
    damage_type?: string;
    dice?: string;
    scaling?: string;
};

type CustomSpellPatch = {
    target_spell_name: string;
    collection?: SpellCollection;
    create_if_missing?: boolean;
    remove?: boolean;
    name?: string;
    level?: number;
    school?: string | null;
    description?: string | null;
    casting_time?: string | null;
    casting_time_note?: string | null;
    range?: string | null;
    components?: SpellComponentPatch;
    materials?: string | null;
    duration?: string | null;
    concentration?: boolean;
    ritual?: boolean;
    resource_cost?: SpellResourceCostPatch;
    save?: SpellSavePatch;
    damage?: SpellDamagePatch;
};

type FeatureCollection = "customTraits" | "customClassAbilities";
type FeatureActionType = "action" | "bonus" | "reaction" | "passive";
type FeatureResourceCostPatch = {
    uses_spell_slot?: boolean;
    slot_level?: number;
    charges?: number;
    recharge?: "short" | "long";
    points_label?: string | null;
    points?: number;
};
type CustomFeaturePatch = {
    target_feature_name: string;
    collection?: FeatureCollection;
    create_if_missing?: boolean;
    remove?: boolean;
    name?: string;
    level?: number;
    description?: string | null;
    action_type?: FeatureActionType;
    requirements?: string | null;
    effect?: string | null;
    subclass_id?: string | null;
    subclass_name?: string | null;
    resource_cost?: FeatureResourceCostPatch;
};

type SanitizedActionData = {
    name?: string;
    class?: string | null;
    race?: string | null;
    level?: number;
    experience?: number;
    armor_class?: number;
    speed?: number;
    current_hp?: number;
    max_hp?: number;
    character_type?: CharacterType;
    user_id?: string;
    stats?: StatsPatch;
    details_patch?: DetailsPatch;
    item_patch?: ItemPatch;
    learned_spell_patch?: LearnedSpellPatch;
    custom_spell_patch?: CustomSpellPatch;
    custom_feature_patch?: CustomFeaturePatch;
};

type SanitizedAction = {
    operation: Operation;
    characterId?: string;
    data: SanitizedActionData;
    note?: string;
};

type MutationResult = {
    operation: Operation;
    characterId?: string;
    status: MutationStatus;
    message: string;
};

type AssistantPlan = {
    reply: string;
    actions: unknown[];
};

type AIProvider = "ollama" | "openai" | "gemini";
type AIProviderPreference = AIProvider | "auto";
type AssistantIntent = "mutation" | "capabilities" | "chat";

type OpenAIResponse = {
    choices?: Array<{
        message?: {
            content?: unknown;
        };
    }>;
    error?: {
        message?: string;
    };
};

type GeminiGenerateContentResponse = {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text?: string;
            }>;
        };
    }>;
    error?: {
        message?: string;
    };
};

type OllamaChatResponse = {
    message?: {
        content?: string;
    };
    error?: string;
};

const DEFAULT_OPENAI_MODEL = process.env.OPENAI_ASSISTANT_MODEL ?? "gpt-5-mini";
const DEFAULT_GEMINI_MODEL =
    process.env.GEMINI_ASSISTANT_MODEL ?? "gemini-2.0-flash";
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.1:8b";
const DEFAULT_OLLAMA_BASE_URL =
    process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const DEFAULT_AI_PROVIDER: AIProviderPreference = "auto";
const DEFAULT_AI_FREE_ONLY = true;

type CampaignRow = {
    id: string;
    name?: string | null;
    description?: string | null;
    invite_code?: string | null;
};

type NoteRow = {
    id: string;
    title?: string | null;
    content?: string | null;
    visibility?: string | null;
    author_id?: string | null;
};

type RagDocument = {
    id: string;
    sourceType: "campaign" | "character" | "note";
    title: string;
    text: string;
    priority: number;
};

type RagSnippet = {
    id: string;
    sourceType: RagDocument["sourceType"];
    title: string;
    score: number;
    excerpt: string;
};

type ClientContextSurface = "player" | "dm";

type ClientContextCharacter = {
    id?: string;
    name?: string;
    class?: string | null;
    race?: string | null;
    level?: number;
    character_type?: CharacterType;
};

type ClientContextPayload = {
    surface?: ClientContextSurface;
    locale?: string;
    section?: string;
    panelMode?: string;
    activeTab?: string;
    selectedCharacter?: ClientContextCharacter;
    availableActions: string[];
    hints: string[];
};

const ASSISTANT_PLAN_SCHEMA: Record<string, unknown> = {
    type: "object",
    additionalProperties: false,
    properties: {
        reply: { type: "string", minLength: 1 },
        actions: {
            type: "array",
            maxItems: 4,
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    operation: { type: "string", enum: ["create", "update"] },
                    characterId: { type: "string" },
                    note: { type: "string" },
                    data: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            name: { type: "string" },
                            class: { type: ["string", "null"] },
                            race: { type: ["string", "null"] },
                            level: { type: "integer" },
                            experience: { type: "integer" },
                            armor_class: { type: "integer" },
                            speed: { type: "integer" },
                            current_hp: { type: "integer" },
                            max_hp: { type: "integer" },
                            character_type: {
                                type: "string",
                                enum: ["character", "companion"],
                            },
                            user_id: { type: "string" },
                            stats: {
                                type: "object",
                                additionalProperties: false,
                                properties: {
                                    str: { type: "number" },
                                    dex: { type: "number" },
                                    con: { type: "number" },
                                    int: { type: "number" },
                                    wis: { type: "number" },
                                    cha: { type: "number" },
                                },
                            },
                            details_patch: {
                                type: "object",
                                additionalProperties: false,
                                properties: {
                                    notes: { type: ["string", "null"] },
                                    background: { type: ["string", "null"] },
                                    alignment: { type: ["string", "null"] },
                                    personalityTraits: { type: ["string", "null"] },
                                    ideals: { type: ["string", "null"] },
                                    bonds: { type: ["string", "null"] },
                                    flaws: { type: ["string", "null"] },
                                    appearance: { type: ["string", "null"] },
                                    backstory: { type: ["string", "null"] },
                                    languages: { type: ["string", "null"] },
                                    proficiencies: { type: ["string", "null"] },
                                    abilities: { type: ["string", "null"] },
                                    inventory: { type: ["string", "null"] },
                                    equipment: { type: ["string", "null"] },
                                },
                            },
                            item_patch: {
                                type: "object",
                                additionalProperties: false,
                                properties: {
                                    target_item_name: { type: "string" },
                                    name: { type: "string" },
                                    create_if_missing: { type: "boolean" },
                                    category: {
                                        type: "string",
                                        enum: [
                                            "weapon",
                                            "armor",
                                            "accessory",
                                            "consumable",
                                            "tool",
                                            "misc",
                                        ],
                                    },
                                    equippable: { type: "boolean" },
                                    equipped: { type: "boolean" },
                                    quantity: { type: "integer" },
                                    rarity: { type: ["string", "null"] },
                                    description: { type: ["string", "null"] },
                                    attunement: { type: ["boolean", "string", "null"] },
                                    tags_add: {
                                        type: "array",
                                        maxItems: 16,
                                        items: { type: "string" },
                                    },
                                    tags_remove: {
                                        type: "array",
                                        maxItems: 16,
                                        items: { type: "string" },
                                    },
                                    clear_attachments: { type: "boolean" },
                                    attachments_add: {
                                        type: "array",
                                        maxItems: 12,
                                        items: {
                                            type: "object",
                                            additionalProperties: false,
                                            properties: {
                                                type: {
                                                    type: "string",
                                                    enum: [
                                                        "action",
                                                        "ability",
                                                        "trait",
                                                        "spell",
                                                        "cantrip",
                                                        "classFeature",
                                                        "other",
                                                    ],
                                                },
                                                name: { type: "string" },
                                                level: { type: "integer" },
                                                description: {
                                                    type: ["string", "null"],
                                                },
                                            },
                                            required: ["name"],
                                        },
                                    },
                                    attachments_replace: {
                                        type: "array",
                                        maxItems: 12,
                                        items: {
                                            type: "object",
                                            additionalProperties: false,
                                            properties: {
                                                type: {
                                                    type: "string",
                                                    enum: [
                                                        "action",
                                                        "ability",
                                                        "trait",
                                                        "spell",
                                                        "cantrip",
                                                        "classFeature",
                                                        "other",
                                                    ],
                                                },
                                                name: { type: "string" },
                                                level: { type: "integer" },
                                                description: {
                                                    type: ["string", "null"],
                                                },
                                            },
                                            required: ["name"],
                                        },
                                    },
                                },
                                required: ["target_item_name"],
                            },
                            learned_spell_patch: {
                                type: "object",
                                additionalProperties: false,
                                properties: {
                                    action: {
                                        type: "string",
                                        enum: ["learn", "forget"],
                                    },
                                    spell_level: { type: "integer" },
                                    spell_name: { type: "string" },
                                    spell_index: { type: "string" },
                                },
                                required: ["spell_level"],
                            },
                            custom_spell_patch: {
                                type: "object",
                                additionalProperties: false,
                                properties: {
                                    target_spell_name: { type: "string" },
                                    collection: {
                                        type: "string",
                                        enum: ["customSpells", "customCantrips"],
                                    },
                                    create_if_missing: { type: "boolean" },
                                    remove: { type: "boolean" },
                                    name: { type: "string" },
                                    level: { type: "integer" },
                                    school: { type: ["string", "null"] },
                                    description: { type: ["string", "null"] },
                                    casting_time: { type: ["string", "null"] },
                                    casting_time_note: { type: ["string", "null"] },
                                    range: { type: ["string", "null"] },
                                    components: {
                                        type: "object",
                                        additionalProperties: false,
                                        properties: {
                                            verbal: { type: "boolean" },
                                            somatic: { type: "boolean" },
                                            material: { type: "boolean" },
                                        },
                                    },
                                    materials: { type: ["string", "null"] },
                                    duration: { type: ["string", "null"] },
                                    concentration: { type: "boolean" },
                                    ritual: { type: "boolean" },
                                    resource_cost: {
                                        type: "object",
                                        additionalProperties: false,
                                        properties: {
                                            uses_spell_slot: { type: "boolean" },
                                            slot_level: { type: "integer" },
                                            charges: { type: "integer" },
                                            points: { type: "integer" },
                                        },
                                    },
                                    save: {
                                        type: "object",
                                        additionalProperties: false,
                                        properties: {
                                            type: {
                                                type: "string",
                                                enum: ["attack", "save", "none"],
                                            },
                                            save_ability: {
                                                type: "string",
                                                enum: ["STR", "DEX", "CON", "INT", "WIS", "CHA"],
                                            },
                                            dc_type: {
                                                type: "string",
                                                enum: ["fixed", "stat"],
                                            },
                                            dc_value: { type: "integer" },
                                            dc_stat: {
                                                type: "string",
                                                enum: ["STR", "DEX", "CON", "INT", "WIS", "CHA"],
                                            },
                                        },
                                    },
                                    damage: {
                                        type: "object",
                                        additionalProperties: false,
                                        properties: {
                                            damage_type: { type: "string" },
                                            dice: { type: "string" },
                                            scaling: { type: "string" },
                                        },
                                    },
                                },
                                required: ["target_spell_name"],
                            },
                            custom_feature_patch: {
                                type: "object",
                                additionalProperties: false,
                                properties: {
                                    target_feature_name: { type: "string" },
                                    collection: {
                                        type: "string",
                                        enum: ["customTraits", "customClassAbilities"],
                                    },
                                    create_if_missing: { type: "boolean" },
                                    remove: { type: "boolean" },
                                    name: { type: "string" },
                                    level: { type: "integer" },
                                    description: { type: ["string", "null"] },
                                    action_type: {
                                        type: "string",
                                        enum: ["action", "bonus", "reaction", "passive"],
                                    },
                                    requirements: { type: ["string", "null"] },
                                    effect: { type: ["string", "null"] },
                                    subclass_id: { type: ["string", "null"] },
                                    subclass_name: { type: ["string", "null"] },
                                    resource_cost: {
                                        type: "object",
                                        additionalProperties: false,
                                        properties: {
                                            uses_spell_slot: { type: "boolean" },
                                            slot_level: { type: "integer" },
                                            charges: { type: "integer" },
                                            recharge: {
                                                type: "string",
                                                enum: ["short", "long"],
                                            },
                                            points_label: { type: ["string", "null"] },
                                            points: { type: "integer" },
                                        },
                                    },
                                },
                                required: ["target_feature_name"],
                            },
                        },
                        required: [],
                    },
                },
                required: ["operation", "data"],
            },
        },
    },
    required: ["reply", "actions"],
};

function extractBearerToken(header: string | null) {
    if (!header) return null;
    const normalized = header.trim();
    if (!normalized.toLowerCase().startsWith("bearer ")) return null;
    const token = normalized.slice(7).trim();
    return token.length > 0 ? token : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveAIProvider(raw: string | undefined): AIProviderPreference {
    const value = String(raw ?? "")
        .trim()
        .toLowerCase();
    if (value === "auto") return "auto";
    if (value === "openai" || value === "gemini" || value === "ollama") {
        return value;
    }
    return "ollama";
}

function parseEnvBool(raw: string | undefined, defaultValue: boolean) {
    if (typeof raw !== "string") return defaultValue;
    const value = raw.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(value)) return true;
    if (["0", "false", "no", "off"].includes(value)) return false;
    return defaultValue;
}

function parseEnvInt(
    raw: string | undefined,
    defaultValue: number,
    min: number,
    max: number
) {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return defaultValue;
    return Math.round(clampNumber(parsed, min, max));
}

function withTimeout(ms: number) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    return {
        signal: controller.signal,
        clear: () => clearTimeout(timeout),
    };
}

function clampNumber(value: number, min: number, max: number) {
    if (!Number.isFinite(value)) return min;
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

function asTrimmedString(value: unknown, maxLen = 500): string | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

function asNullableString(value: unknown, maxLen = 500): string | null | undefined {
    if (value === null) return null;
    return asTrimmedString(value, maxLen);
}

function asInteger(value: unknown, min: number, max: number): number | undefined {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return undefined;
    return Math.round(clampNumber(parsed, min, max));
}

function asContextString(value: unknown, maxLen = 100): string | undefined {
    const parsed = asTrimmedString(value, maxLen);
    if (!parsed) return undefined;
    return parsed.replace(/\s+/g, " ");
}

function asContextStringArray(value: unknown, maxItems: number, maxLen: number) {
    if (!Array.isArray(value)) return [] as string[];
    const list: string[] = [];
    for (const entry of value) {
        const parsed = asContextString(entry, maxLen);
        if (!parsed) continue;
        if (!list.includes(parsed)) {
            list.push(parsed);
        }
        if (list.length >= maxItems) break;
    }
    return list;
}

const ITEM_CATEGORY_VALUES: readonly ItemCategory[] = [
    "weapon",
    "armor",
    "accessory",
    "consumable",
    "tool",
    "misc",
];

const ITEM_ATTACHMENT_TYPE_VALUES: readonly ItemAttachmentType[] = [
    "action",
    "ability",
    "trait",
    "spell",
    "cantrip",
    "classFeature",
    "other",
];
const LEARNED_SPELL_ACTION_VALUES = ["learn", "forget"] as const;
const SPELL_COLLECTION_VALUES: readonly SpellCollection[] = [
    "customSpells",
    "customCantrips",
];
const FEATURE_COLLECTION_VALUES: readonly FeatureCollection[] = [
    "customTraits",
    "customClassAbilities",
];
const FEATURE_ACTION_VALUES: readonly FeatureActionType[] = [
    "action",
    "bonus",
    "reaction",
    "passive",
];
const ABILITY_KEY_VALUES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"] as const;

function normalizeAbilityKey(value: unknown) {
    const raw = asTrimmedString(value, 8);
    if (!raw) return undefined;
    const normalized = raw.toUpperCase();
    if ((ABILITY_KEY_VALUES as readonly string[]).includes(normalized)) {
        return normalized as "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";
    }
    return undefined;
}

function normalizeSpellCollection(value: unknown): SpellCollection | undefined {
    const raw = asTrimmedString(value, 40);
    if (!raw) return undefined;
    if ((SPELL_COLLECTION_VALUES as readonly string[]).includes(raw)) {
        return raw as SpellCollection;
    }
    const normalized = normalizeForItemMatch(raw);
    if (normalized.includes("cantrip") || normalized.includes("truco")) {
        return "customCantrips";
    }
    if (normalized.includes("spell") || normalized.includes("hechizo")) {
        return "customSpells";
    }
    return undefined;
}

function normalizeFeatureCollection(value: unknown): FeatureCollection | undefined {
    const raw = asTrimmedString(value, 60);
    if (!raw) return undefined;
    if ((FEATURE_COLLECTION_VALUES as readonly string[]).includes(raw)) {
        return raw as FeatureCollection;
    }
    const normalized = normalizeForItemMatch(raw);
    if (normalized.includes("trait") || normalized.includes("rasgo")) {
        return "customTraits";
    }
    if (normalized.includes("habil") || normalized.includes("abilit")) {
        return "customClassAbilities";
    }
    if (normalized.includes("action") || normalized.includes("accion")) {
        return "customClassAbilities";
    }
    return undefined;
}

function normalizeFeatureActionType(value: unknown): FeatureActionType | undefined {
    const raw = asTrimmedString(value, 24);
    if (!raw) return undefined;
    const normalized = raw.toLowerCase();
    if ((FEATURE_ACTION_VALUES as readonly string[]).includes(normalized)) {
        return normalized as FeatureActionType;
    }
    if (normalized === "accion") return "action";
    if (normalized === "pasiva") return "passive";
    return undefined;
}

function sanitizeLearnedSpellPatch(value: unknown): LearnedSpellPatch | undefined {
    if (!isRecord(value)) return undefined;
    const level = asInteger(value.spell_level, 0, 9);
    if (typeof level !== "number") return undefined;

    const actionRaw = asTrimmedString(value.action, 20)?.toLowerCase();
    const action =
        actionRaw && LEARNED_SPELL_ACTION_VALUES.includes(actionRaw as "learn" | "forget")
            ? (actionRaw as "learn" | "forget")
            : undefined;

    const spellName = asTrimmedString(value.spell_name, 140);
    const spellIndex = asTrimmedString(value.spell_index, 140);
    if (!spellName && !spellIndex) return undefined;

    return {
        action: action ?? "learn",
        spell_level: level,
        spell_name: spellName,
        spell_index: spellIndex,
    };
}

function sanitizeSpellComponentPatch(value: unknown): SpellComponentPatch | undefined {
    if (!isRecord(value)) return undefined;
    const output: SpellComponentPatch = {};
    if (typeof value.verbal === "boolean") output.verbal = value.verbal;
    if (typeof value.somatic === "boolean") output.somatic = value.somatic;
    if (typeof value.material === "boolean") output.material = value.material;
    return Object.keys(output).length > 0 ? output : undefined;
}

function sanitizeSpellResourceCostPatch(
    value: unknown
): SpellResourceCostPatch | undefined {
    if (!isRecord(value)) return undefined;
    const output: SpellResourceCostPatch = {};
    if (typeof value.uses_spell_slot === "boolean") {
        output.uses_spell_slot = value.uses_spell_slot;
    }
    const slotLevel = asInteger(value.slot_level, 0, 9);
    if (typeof slotLevel === "number") output.slot_level = slotLevel;
    const charges = asInteger(value.charges, 0, 999);
    if (typeof charges === "number") output.charges = charges;
    const points = asInteger(value.points, 0, 999);
    if (typeof points === "number") output.points = points;
    return Object.keys(output).length > 0 ? output : undefined;
}

function sanitizeSpellSavePatch(value: unknown): SpellSavePatch | undefined {
    if (!isRecord(value)) return undefined;
    const output: SpellSavePatch = {};
    const saveType = asTrimmedString(value.type, 16)?.toLowerCase();
    if (saveType === "attack" || saveType === "save" || saveType === "none") {
        output.type = saveType;
    }
    const saveAbility = normalizeAbilityKey(value.save_ability);
    if (saveAbility) output.save_ability = saveAbility;
    const dcType = asTrimmedString(value.dc_type, 16)?.toLowerCase();
    if (dcType === "fixed" || dcType === "stat") {
        output.dc_type = dcType;
    }
    const dcValue = asInteger(value.dc_value, 0, 40);
    if (typeof dcValue === "number") output.dc_value = dcValue;
    const dcStat = normalizeAbilityKey(value.dc_stat);
    if (dcStat) output.dc_stat = dcStat;
    return Object.keys(output).length > 0 ? output : undefined;
}

function sanitizeSpellDamagePatch(value: unknown): SpellDamagePatch | undefined {
    if (!isRecord(value)) return undefined;
    const output: SpellDamagePatch = {};
    const damageType = asTrimmedString(value.damage_type, 80);
    if (damageType) output.damage_type = damageType;
    const dice = asTrimmedString(value.dice, 80);
    if (dice) output.dice = dice;
    const scaling = asTrimmedString(value.scaling, 220);
    if (scaling) output.scaling = scaling;
    return Object.keys(output).length > 0 ? output : undefined;
}

function sanitizeCustomSpellPatch(value: unknown): CustomSpellPatch | undefined {
    if (!isRecord(value)) return undefined;
    const targetName = asTrimmedString(value.target_spell_name, 140);
    if (!targetName) return undefined;

    const patch: CustomSpellPatch = {
        target_spell_name: targetName,
    };

    const collection = normalizeSpellCollection(value.collection);
    if (collection) patch.collection = collection;
    if (typeof value.create_if_missing === "boolean") {
        patch.create_if_missing = value.create_if_missing;
    }
    if (typeof value.remove === "boolean") patch.remove = value.remove;

    const name = asTrimmedString(value.name, 140);
    if (name) patch.name = name;
    const level = asInteger(value.level, 0, 9);
    if (typeof level === "number") patch.level = level;
    const school = asNullableString(value.school, 120);
    if (school !== undefined) patch.school = school;
    const description = asNullableString(value.description, 4000);
    if (description !== undefined) patch.description = description;
    const castingTime = asNullableString(value.casting_time, 120);
    if (castingTime !== undefined) patch.casting_time = castingTime;
    const castingTimeNote = asNullableString(value.casting_time_note, 220);
    if (castingTimeNote !== undefined) patch.casting_time_note = castingTimeNote;
    const range = asNullableString(value.range, 220);
    if (range !== undefined) patch.range = range;
    const components = sanitizeSpellComponentPatch(value.components);
    if (components) patch.components = components;
    const materials = asNullableString(value.materials, 220);
    if (materials !== undefined) patch.materials = materials;
    const duration = asNullableString(value.duration, 220);
    if (duration !== undefined) patch.duration = duration;
    if (typeof value.concentration === "boolean") {
        patch.concentration = value.concentration;
    }
    if (typeof value.ritual === "boolean") patch.ritual = value.ritual;

    const resourceCost = sanitizeSpellResourceCostPatch(value.resource_cost);
    if (resourceCost) patch.resource_cost = resourceCost;
    const save = sanitizeSpellSavePatch(value.save);
    if (save) patch.save = save;
    const damage = sanitizeSpellDamagePatch(value.damage);
    if (damage) patch.damage = damage;

    return patch;
}

function sanitizeFeatureResourceCostPatch(
    value: unknown
): FeatureResourceCostPatch | undefined {
    if (!isRecord(value)) return undefined;
    const output: FeatureResourceCostPatch = {};
    if (typeof value.uses_spell_slot === "boolean") {
        output.uses_spell_slot = value.uses_spell_slot;
    }
    const slotLevel = asInteger(value.slot_level, 0, 9);
    if (typeof slotLevel === "number") output.slot_level = slotLevel;
    const charges = asInteger(value.charges, 0, 999);
    if (typeof charges === "number") output.charges = charges;
    const recharge = asTrimmedString(value.recharge, 16)?.toLowerCase();
    if (recharge === "short" || recharge === "long") {
        output.recharge = recharge;
    }
    const pointsLabel = asNullableString(value.points_label, 120);
    if (pointsLabel !== undefined) output.points_label = pointsLabel;
    const points = asInteger(value.points, 0, 999);
    if (typeof points === "number") output.points = points;
    return Object.keys(output).length > 0 ? output : undefined;
}

function sanitizeCustomFeaturePatch(value: unknown): CustomFeaturePatch | undefined {
    if (!isRecord(value)) return undefined;
    const targetName = asTrimmedString(value.target_feature_name, 140);
    if (!targetName) return undefined;

    const patch: CustomFeaturePatch = {
        target_feature_name: targetName,
    };

    const collection = normalizeFeatureCollection(value.collection);
    if (collection) patch.collection = collection;
    if (typeof value.create_if_missing === "boolean") {
        patch.create_if_missing = value.create_if_missing;
    }
    if (typeof value.remove === "boolean") patch.remove = value.remove;

    const name = asTrimmedString(value.name, 140);
    if (name) patch.name = name;
    const level = asInteger(value.level, 0, 30);
    if (typeof level === "number") patch.level = level;
    const description = asNullableString(value.description, 4000);
    if (description !== undefined) patch.description = description;
    const actionType = normalizeFeatureActionType(value.action_type);
    if (actionType) patch.action_type = actionType;
    const requirements = asNullableString(value.requirements, 300);
    if (requirements !== undefined) patch.requirements = requirements;
    const effect = asNullableString(value.effect, 700);
    if (effect !== undefined) patch.effect = effect;
    const subclassId = asNullableString(value.subclass_id, 120);
    if (subclassId !== undefined) patch.subclass_id = subclassId;
    const subclassName = asNullableString(value.subclass_name, 160);
    if (subclassName !== undefined) patch.subclass_name = subclassName;

    const resourceCost = sanitizeFeatureResourceCostPatch(value.resource_cost);
    if (resourceCost) patch.resource_cost = resourceCost;

    return patch;
}

function normalizeForItemMatch(value: string) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function asTrimmedStringArray(value: unknown, maxItems: number, maxLen: number) {
    if (!Array.isArray(value)) return [] as string[];
    const out: string[] = [];
    for (const entry of value) {
        const parsed = asTrimmedString(entry, maxLen);
        if (!parsed) continue;
        if (!out.includes(parsed)) out.push(parsed);
        if (out.length >= maxItems) break;
    }
    return out;
}

function normalizeItemCategory(value: unknown): ItemCategory | undefined {
    const raw = asTrimmedString(value, 40);
    if (!raw) return undefined;
    const normalized = normalizeForItemMatch(raw);
    if ((ITEM_CATEGORY_VALUES as readonly string[]).includes(normalized)) {
        return normalized as ItemCategory;
    }
    if (normalized.includes("arma") || normalized.includes("weapon")) {
        return "weapon";
    }
    if (normalized.includes("armadura") || normalized.includes("armor")) {
        return "armor";
    }
    if (normalized.includes("acces")) {
        return "accessory";
    }
    if (normalized.includes("consum")) {
        return "consumable";
    }
    if (normalized.includes("herramient") || normalized.includes("tool")) {
        return "tool";
    }
    if (normalized.includes("misc") || normalized.includes("objeto")) {
        return "misc";
    }
    return undefined;
}

function inferAttachmentType(
    name: string,
    description?: string | null
): ItemAttachmentType {
    const haystack = normalizeForItemMatch(`${name} ${description ?? ""}`);
    const abilitySignals = [
        "ventaja",
        "advantage",
        "bono",
        "bonus",
        "tirada",
        "roll",
        "puedes",
        "you can",
        "obtienes",
        "you gain",
        "cd ",
        "dc ",
        "accion",
        "action",
    ];
    const traitSignals = [
        "rasgo",
        "trait",
        "lectura ancestral",
        "innato",
        "pasivo",
        "passive",
    ];
    if (abilitySignals.some((signal) => haystack.includes(signal))) {
        return "ability";
    }
    if (traitSignals.some((signal) => haystack.includes(signal))) {
        return "trait";
    }
    return "trait";
}

function normalizeAttachmentType(value: unknown): ItemAttachmentType | undefined {
    const raw = asTrimmedString(value, 32);
    if (!raw) return undefined;
    const normalized = raw.replace(/\s+/g, "").toLowerCase();
    if ((ITEM_ATTACHMENT_TYPE_VALUES as readonly string[]).includes(normalized)) {
        return normalized as ItemAttachmentType;
    }
    if (normalized === "habilidad" || normalized === "ability") return "ability";
    if (normalized === "rasgo" || normalized === "trait") return "trait";
    if (normalized === "accion" || normalized === "action") return "action";
    if (normalized === "hechizo" || normalized === "spell") return "spell";
    if (normalized === "truco" || normalized === "cantrip") return "cantrip";
    if (normalized === "rasgodeclase" || normalized === "classfeature") {
        return "classFeature";
    }
    return undefined;
}

function sanitizeItemAttachmentPatch(value: unknown): ItemAttachmentPatch | undefined {
    if (!isRecord(value)) return undefined;
    const name = asTrimmedString(value.name, 140);
    if (!name) return undefined;
    const description = asNullableString(value.description, 4000);
    const level = asInteger(value.level, 0, 20);
    const explicitType = normalizeAttachmentType(value.type);
    const type = explicitType ?? inferAttachmentType(name, description ?? undefined);

    const output: ItemAttachmentPatch = { name, type };
    if (typeof level === "number") output.level = level;
    if (description !== undefined) output.description = description;
    return output;
}

function sanitizeItemAttachmentsPatchList(value: unknown) {
    if (!Array.isArray(value)) return [] as ItemAttachmentPatch[];
    const output: ItemAttachmentPatch[] = [];
    for (const entry of value) {
        const parsed = sanitizeItemAttachmentPatch(entry);
        if (!parsed) continue;
        output.push(parsed);
        if (output.length >= 12) break;
    }
    return output;
}

function sanitizeItemPatch(value: unknown): ItemPatch | undefined {
    if (!isRecord(value)) return undefined;
    const targetName = asTrimmedString(value.target_item_name, 120);
    if (!targetName) return undefined;

    const patch: ItemPatch = {
        target_item_name: targetName,
    };
    const name = asTrimmedString(value.name, 120);
    if (name) patch.name = name;

    if (typeof value.create_if_missing === "boolean") {
        patch.create_if_missing = value.create_if_missing;
    }

    const category = normalizeItemCategory(value.category);
    if (category) patch.category = category;

    if (typeof value.equippable === "boolean") patch.equippable = value.equippable;
    if (typeof value.equipped === "boolean") patch.equipped = value.equipped;

    const quantity = asInteger(value.quantity, 0, 999);
    if (typeof quantity === "number") patch.quantity = quantity;

    const rarity = asNullableString(value.rarity, 120);
    if (rarity !== undefined) patch.rarity = rarity;

    const description = asNullableString(value.description, 4000);
    if (description !== undefined) patch.description = description;

    if (
        typeof value.attunement === "boolean" ||
        value.attunement === null
    ) {
        patch.attunement = value.attunement;
    } else {
        const attunement = asTrimmedString(value.attunement, 120);
        if (attunement !== undefined) patch.attunement = attunement;
    }

    const tagsAdd = asTrimmedStringArray(value.tags_add, 16, 50);
    if (tagsAdd.length > 0) patch.tags_add = tagsAdd;

    const tagsRemove = asTrimmedStringArray(value.tags_remove, 16, 50);
    if (tagsRemove.length > 0) patch.tags_remove = tagsRemove;

    if (typeof value.clear_attachments === "boolean") {
        patch.clear_attachments = value.clear_attachments;
    }

    const attachmentsAdd = sanitizeItemAttachmentsPatchList(value.attachments_add);
    if (attachmentsAdd.length > 0) patch.attachments_add = attachmentsAdd;

    const attachmentsReplace = sanitizeItemAttachmentsPatchList(
        value.attachments_replace
    );
    if (attachmentsReplace.length > 0) {
        patch.attachments_replace = attachmentsReplace;
    }

    return patch;
}

function sanitizeClientContext(value: unknown): ClientContextPayload | null {
    if (!isRecord(value)) return null;

    const surfaceRaw = asContextString(value.surface, 16)?.toLowerCase();
    const surface: ClientContextSurface | undefined =
        surfaceRaw === "player" || surfaceRaw === "dm" ? surfaceRaw : undefined;

    const locale = asContextString(value.locale, 12);
    const section = asContextString(value.section, 64);
    const panelMode = asContextString(value.panelMode, 64);
    const activeTab = asContextString(value.activeTab, 48);
    const availableActions = asContextStringArray(value.availableActions, 16, 80);
    const hints = asContextStringArray(value.hints, 16, 100);

    const selectedCharacterValue = value.selectedCharacter;
    const selectedCharacterRecord = isRecord(selectedCharacterValue)
        ? selectedCharacterValue
        : null;

    let selectedCharacter: ClientContextCharacter | undefined;
    if (selectedCharacterRecord) {
        const id = asContextString(selectedCharacterRecord.id, 64);
        const name = asContextString(selectedCharacterRecord.name, 120);
        const className = asNullableString(selectedCharacterRecord.class, 120);
        const race = asNullableString(selectedCharacterRecord.race, 120);
        const level = asInteger(selectedCharacterRecord.level, 1, 30);
        const characterTypeRaw = asContextString(
            selectedCharacterRecord.character_type,
            16
        )?.toLowerCase();
        const characterType: CharacterType | undefined =
            characterTypeRaw === "character" || characterTypeRaw === "companion"
                ? characterTypeRaw
                : undefined;

        if (
            id ||
            name ||
            className !== undefined ||
            race !== undefined ||
            level !== undefined ||
            characterType
        ) {
            selectedCharacter = {
                id,
                name,
                class: className,
                race,
                level,
                character_type: characterType,
            };
        }
    }

    const hasPayload =
        surface ||
        locale ||
        section ||
        panelMode ||
        activeTab ||
        selectedCharacter ||
        availableActions.length > 0 ||
        hints.length > 0;

    if (!hasPayload) return null;

    return {
        surface,
        locale,
        section,
        panelMode,
        activeTab,
        selectedCharacter,
        availableActions,
        hints,
    };
}

function sanitizeStatsPatch(value: unknown): StatsPatch | undefined {
    if (!isRecord(value)) return undefined;
    const patch: StatsPatch = {};
    for (const key of STAT_KEYS) {
        const parsed = asInteger(value[key], 1, 30);
        if (typeof parsed === "number") {
            patch[key] = parsed;
        }
    }
    return Object.keys(patch).length > 0 ? patch : undefined;
}

function sanitizeDetailsPatch(value: unknown): DetailsPatch | undefined {
    if (!isRecord(value)) return undefined;
    const patch: DetailsPatch = {};
    for (const key of DETAIL_PATCH_KEYS) {
        const parsed = asNullableString(value[key], 4000);
        if (parsed !== undefined) {
            patch[key] = parsed;
        }
    }
    return Object.keys(patch).length > 0 ? patch : undefined;
}

function sanitizeActionData(value: unknown): SanitizedActionData | undefined {
    if (!isRecord(value)) return undefined;

    const data: SanitizedActionData = {};
    const name = asTrimmedString(value.name, 120);
    const className = asNullableString(value.class, 120);
    const race = asNullableString(value.race, 120);
    const level = asInteger(value.level, 1, 20);
    const experience = asInteger(value.experience, 0, 100000000);
    const armorClass = asInteger(value.armor_class, 1, 60);
    const speed = asInteger(value.speed, 0, 200);
    const currentHp = asInteger(value.current_hp, 0, 9999);
    const maxHp = asInteger(value.max_hp, 0, 9999);
    const ownerId = asTrimmedString(value.user_id, 64);
    const stats = sanitizeStatsPatch(value.stats);
    const detailsPatch = sanitizeDetailsPatch(value.details_patch);
    const itemPatch = sanitizeItemPatch(value.item_patch);
    const learnedSpellPatch = sanitizeLearnedSpellPatch(value.learned_spell_patch);
    const customSpellPatch = sanitizeCustomSpellPatch(value.custom_spell_patch);
    const customFeaturePatch = sanitizeCustomFeaturePatch(
        value.custom_feature_patch
    );

    if (name) data.name = name;
    if (className !== undefined) data.class = className;
    if (race !== undefined) data.race = race;
    if (typeof level === "number") data.level = level;
    if (typeof experience === "number") data.experience = experience;
    if (typeof armorClass === "number") data.armor_class = armorClass;
    if (typeof speed === "number") data.speed = speed;
    if (typeof currentHp === "number") data.current_hp = currentHp;
    if (typeof maxHp === "number") data.max_hp = maxHp;
    if (value.character_type === "character" || value.character_type === "companion") {
        data.character_type = value.character_type;
    }
    if (ownerId) data.user_id = ownerId;
    if (stats) data.stats = stats;
    if (detailsPatch) data.details_patch = detailsPatch;
    if (itemPatch) data.item_patch = itemPatch;
    if (learnedSpellPatch) data.learned_spell_patch = learnedSpellPatch;
    if (customSpellPatch) data.custom_spell_patch = customSpellPatch;
    if (customFeaturePatch) data.custom_feature_patch = customFeaturePatch;

    return Object.keys(data).length > 0 ? data : {};
}

function sanitizeActions(actions: unknown[], targetCharacterId?: string): SanitizedAction[] {
    const output: SanitizedAction[] = [];
    for (const action of actions.slice(0, 4)) {
        if (!isRecord(action)) continue;
        const operation = action.operation;
        if (operation !== "create" && operation !== "update") continue;

        const data = sanitizeActionData(action.data);
        if (!data) continue;

        const note = asTrimmedString(action.note, 500);
        const actionCharacterId = asTrimmedString(action.characterId, 64);
        const resolvedCharacterId =
            operation === "update"
                ? actionCharacterId ?? asTrimmedString(targetCharacterId, 64)
                : actionCharacterId;

        output.push({
            operation,
            characterId: resolvedCharacterId,
            data,
            note,
        });
    }
    return output;
}

function normalizeStats(value: unknown): StatsObject {
    const base: StatsObject = {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
    };
    if (!isRecord(value)) return base;

    const next = { ...base };
    for (const key of STAT_KEYS) {
        const parsed = Number(value[key]);
        if (Number.isFinite(parsed)) {
            next[key] = Math.round(clampNumber(parsed, 1, 30));
        }
    }
    return next;
}

function mergeStats(existing: unknown, patch?: StatsPatch): StatsObject | undefined {
    if (!patch || Object.keys(patch).length === 0) return undefined;
    const base = normalizeStats(existing);
    const merged: StatsObject = { ...base };
    for (const key of STAT_KEYS) {
        const nextValue = patch[key];
        if (typeof nextValue === "number") {
            merged[key] = Math.round(clampNumber(nextValue, 1, 30));
        }
    }
    return merged;
}

function mergeDetails(existing: unknown, patch?: DetailsPatch): Record<string, unknown> | undefined {
    if (!patch || Object.keys(patch).length === 0) return undefined;
    const base = isRecord(existing) ? { ...existing } : {};
    for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") {
            delete base[key];
            continue;
        }
        base[key] = value;
    }
    return base;
}

type ItemPatchApplyResult = {
    applied: boolean;
    details?: Record<string, unknown>;
    message?: string;
};

function buildGeneratedId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toLocalizedTextObject(value: string) {
    return {
        text: value,
        lang: "es",
    };
}

function extractLocalizedTextValue(value: unknown, maxLen = 4000): string | undefined {
    if (typeof value === "string") {
        return asTrimmedString(value, maxLen);
    }
    if (isRecord(value)) {
        return asTrimmedString(value.text, maxLen);
    }
    return undefined;
}

function normalizeExistingItemAttachment(value: unknown): Record<string, unknown> | null {
    if (!isRecord(value)) return null;
    const name = asTrimmedString(value.name, 140);
    if (!name) return null;
    const id = asTrimmedString(value.id, 80) ?? buildGeneratedId("att");
    const description = extractLocalizedTextValue(value.description, 4000);
    const type =
        normalizeAttachmentType(value.type) ??
        inferAttachmentType(name, description ?? undefined);
    const level = asInteger(value.level, 0, 20);

    const normalized: Record<string, unknown> = { id, type, name };
    if (typeof level === "number") normalized.level = level;
    if (description) normalized.description = toLocalizedTextObject(description);
    return normalized;
}

function buildAttachmentFromPatch(patch: ItemAttachmentPatch): Record<string, unknown> {
    const type = patch.type ?? inferAttachmentType(patch.name, patch.description);
    const normalized: Record<string, unknown> = {
        id: buildGeneratedId("att"),
        type,
        name: patch.name,
    };
    if (typeof patch.level === "number") {
        normalized.level = patch.level;
    }
    if (typeof patch.description === "string" && patch.description.trim()) {
        normalized.description = toLocalizedTextObject(patch.description.trim());
    }
    return normalized;
}

function attachmentKey(value: Record<string, unknown>) {
    const name = asTrimmedString(value.name, 140) ?? "";
    const type = asTrimmedString(value.type, 32) ?? "other";
    return `${normalizeForItemMatch(type)}::${normalizeForItemMatch(name)}`;
}

function normalizeExistingItems(value: unknown) {
    if (!Array.isArray(value)) return [] as Record<string, unknown>[];
    const output: Record<string, unknown>[] = [];
    for (const entry of value) {
        if (!isRecord(entry)) continue;
        const name = asTrimmedString(entry.name, 120);
        if (!name) continue;
        const id = asTrimmedString(entry.id, 80) ?? buildGeneratedId("item");
        const category = normalizeItemCategory(entry.category) ?? "misc";
        const normalized: Record<string, unknown> = {
            ...entry,
            id,
            name,
            category,
        };
        output.push(normalized);
    }
    return output;
}

function findItemIndex(items: Record<string, unknown>[], targetName: string) {
    const target = normalizeForItemMatch(targetName);
    let index = items.findIndex((item) => {
        const itemName = asTrimmedString(item.name, 120);
        if (!itemName) return false;
        return normalizeForItemMatch(itemName) === target;
    });
    if (index >= 0) return index;

    index = items.findIndex((item) => {
        const itemName = asTrimmedString(item.name, 120);
        if (!itemName) return false;
        const itemNorm = normalizeForItemMatch(itemName);
        return itemNorm.includes(target) || target.includes(itemNorm);
    });
    return index;
}

function applyItemPatch(details: unknown, patch: ItemPatch): ItemPatchApplyResult {
    const baseDetails = isRecord(details) ? { ...details } : {};
    const items = normalizeExistingItems(baseDetails.items);

    let itemIndex = findItemIndex(items, patch.target_item_name);
    let changed = false;
    if (itemIndex < 0) {
        if (!patch.create_if_missing) {
            return {
                applied: false,
                message: `No se encontró el objeto "${patch.target_item_name}" en el inventario.`,
            };
        }
        const created: Record<string, unknown> = {
            id: buildGeneratedId("item"),
            name: patch.target_item_name,
            category: patch.category ?? "misc",
            equippable: false,
            equipped: false,
            sortOrder: items.length,
        };
        items.push(created);
        itemIndex = items.length - 1;
        changed = true;
    }

    const current = { ...items[itemIndex] };
    if (patch.name) {
        current.name = patch.name;
        changed = true;
    }

    if (patch.category) {
        current.category = patch.category;
        changed = true;
    }
    if (typeof patch.equippable === "boolean") {
        current.equippable = patch.equippable;
        changed = true;
        if (!patch.equippable) current.equipped = false;
    }
    if (typeof patch.equipped === "boolean") {
        current.equipped = patch.equipped;
        changed = true;
    }
    if (typeof patch.quantity === "number") {
        current.quantity = patch.quantity;
        changed = true;
    }
    if (patch.rarity !== undefined) {
        if (patch.rarity === null || patch.rarity === "") {
            delete current.rarity;
        } else {
            current.rarity = patch.rarity;
        }
        changed = true;
    }
    if (patch.description !== undefined) {
        if (patch.description === null || patch.description === "") {
            delete current.description;
        } else {
            current.description = toLocalizedTextObject(patch.description);
        }
        changed = true;
    }
    if (patch.attunement !== undefined) {
        if (patch.attunement === null || patch.attunement === "") {
            delete current.attunement;
        } else {
            current.attunement = patch.attunement;
        }
        changed = true;
    }

    if (
        patch.tags_add?.length ||
        patch.tags_remove?.length
    ) {
        const existingTagsRaw = asTrimmedStringArray(current.tags, 64, 60);
        const byKey = new Map(
            existingTagsRaw.map((tag) => [normalizeForItemMatch(tag), tag])
        );
        for (const tag of patch.tags_add ?? []) {
            byKey.set(normalizeForItemMatch(tag), tag);
        }
        for (const tag of patch.tags_remove ?? []) {
            byKey.delete(normalizeForItemMatch(tag));
        }
        const nextTags = Array.from(byKey.values());
        if (nextTags.length > 0) {
            current.tags = nextTags;
        } else {
            delete current.tags;
        }
        changed = true;
    }

    if (
        patch.clear_attachments ||
        patch.attachments_replace?.length ||
        patch.attachments_add?.length
    ) {
        let attachments: Record<string, unknown>[] = [];
        if (!patch.clear_attachments && !patch.attachments_replace) {
            const existingList = Array.isArray(current.attachments)
                ? current.attachments
                : [];
            attachments = existingList
                .map((entry) => normalizeExistingItemAttachment(entry))
                .filter((entry): entry is Record<string, unknown> => !!entry);
        }

        if (patch.attachments_replace?.length) {
            attachments = patch.attachments_replace.map((entry) =>
                buildAttachmentFromPatch(entry)
            );
        }

        if (patch.attachments_add?.length) {
            const byKey = new Map<string, Record<string, unknown>>(
                attachments.map((entry) => [attachmentKey(entry), entry])
            );
            for (const entry of patch.attachments_add) {
                const built = buildAttachmentFromPatch(entry);
                const key = attachmentKey(built);
                const existing = byKey.get(key);
                if (!existing) {
                    byKey.set(key, built);
                    continue;
                }
                if (built.level !== undefined) {
                    existing.level = built.level;
                }
                if (built.description !== undefined) {
                    existing.description = built.description;
                }
            }
            attachments = Array.from(byKey.values());
        }

        if (attachments.length > 0) {
            current.attachments = attachments;
        } else {
            delete current.attachments;
        }
        changed = true;
    }

    if (!changed) {
        return {
            applied: false,
            message: `No se detectaron cambios concretos para el objeto "${patch.target_item_name}".`,
        };
    }

    items[itemIndex] = current;
    const withOrder = items.map((entry, index) => ({
        ...entry,
        sortOrder:
            typeof entry.sortOrder === "number" ? entry.sortOrder : index,
    }));
    baseDetails.items = withOrder;

    return {
        applied: true,
        details: baseDetails,
        message: `Objeto "${patch.target_item_name}" actualizado en inventario.`,
    };
}

function findNamedEntryIndex(
    list: Record<string, unknown>[],
    targetName: string
) {
    const target = normalizeForItemMatch(targetName);
    let index = list.findIndex((entry) => {
        const name = asTrimmedString(entry.name, 140);
        if (!name) return false;
        return normalizeForItemMatch(name) === target;
    });
    if (index >= 0) return index;

    index = list.findIndex((entry) => {
        const name = asTrimmedString(entry.name, 140);
        if (!name) return false;
        const normalized = normalizeForItemMatch(name);
        return normalized.includes(target) || target.includes(normalized);
    });
    return index;
}

function inferSpellCollectionFromPatch(patch: CustomSpellPatch): SpellCollection {
    if (patch.collection) return patch.collection;
    if (typeof patch.level === "number" && patch.level <= 0) {
        return "customCantrips";
    }
    const probe = normalizeForItemMatch(
        `${patch.target_spell_name} ${patch.name ?? ""}`
    );
    if (probe.includes("cantrip") || probe.includes("truco")) {
        return "customCantrips";
    }
    return "customSpells";
}

function normalizeExistingNamedCollection(value: unknown) {
    if (!Array.isArray(value)) return [] as Record<string, unknown>[];
    const output: Record<string, unknown>[] = [];
    for (const entry of value) {
        if (!isRecord(entry)) continue;
        const name = asTrimmedString(entry.name, 140);
        if (!name) continue;
        const id = asTrimmedString(entry.id, 90) ?? buildGeneratedId("entry");
        output.push({
            ...entry,
            id,
            name,
        });
    }
    return output;
}

function applyCustomSpellPatch(details: unknown, patch: CustomSpellPatch) {
    const baseDetails = isRecord(details) ? { ...details } : {};
    const collection = inferSpellCollectionFromPatch(patch);
    const list = normalizeExistingNamedCollection(baseDetails[collection]);
    const index = findNamedEntryIndex(list, patch.target_spell_name);

    if (patch.remove) {
        if (index < 0) {
            return {
                applied: false,
                message: `No se encontró el hechizo "${patch.target_spell_name}" en ${collection}.`,
            };
        }
        list.splice(index, 1);
        baseDetails[collection] = list;
        return {
            applied: true,
            details: baseDetails,
            message: `Hechizo "${patch.target_spell_name}" eliminado de ${collection}.`,
        };
    }

    let changed = false;
    let current: Record<string, unknown>;
    if (index < 0) {
        if (!patch.create_if_missing) {
            return {
                applied: false,
                message: `No se encontró el hechizo "${patch.target_spell_name}" en ${collection}.`,
            };
        }
        current = {
            id: buildGeneratedId("spell"),
            name: patch.name ?? patch.target_spell_name,
            level:
                typeof patch.level === "number"
                    ? patch.level
                    : collection === "customCantrips"
                    ? 0
                    : 1,
        };
        list.push(current);
        changed = true;
    } else {
        current = { ...list[index] };
    }

    if (patch.name) {
        current.name = patch.name;
        changed = true;
    }
    if (typeof patch.level === "number") {
        current.level = patch.level;
        changed = true;
    }
    if (patch.school !== undefined) {
        if (patch.school === null || patch.school === "") delete current.school;
        else current.school = patch.school;
        changed = true;
    }
    if (patch.description !== undefined) {
        if (patch.description === null || patch.description === "") {
            delete current.description;
        } else {
            current.description = toLocalizedTextObject(patch.description);
        }
        changed = true;
    }

    if (patch.casting_time !== undefined || patch.casting_time_note !== undefined) {
        const existing = isRecord(current.castingTime)
            ? { ...current.castingTime }
            : {};
        if (patch.casting_time === null || patch.casting_time === "") {
            delete current.castingTime;
        } else {
            if (typeof patch.casting_time === "string") {
                existing.value = patch.casting_time;
            } else if (!existing.value) {
                existing.value = "Accion";
            }
            if (patch.casting_time_note !== undefined) {
                if (patch.casting_time_note === null || patch.casting_time_note === "") {
                    delete existing.note;
                } else {
                    existing.note = patch.casting_time_note;
                }
            }
            if (Object.keys(existing).length > 0) {
                current.castingTime = existing;
            }
        }
        changed = true;
    }

    if (patch.range !== undefined) {
        if (patch.range === null || patch.range === "") delete current.range;
        else current.range = patch.range;
        changed = true;
    }
    if (patch.materials !== undefined) {
        if (patch.materials === null || patch.materials === "") delete current.materials;
        else current.materials = patch.materials;
        changed = true;
    }
    if (patch.duration !== undefined) {
        if (patch.duration === null || patch.duration === "") delete current.duration;
        else current.duration = patch.duration;
        changed = true;
    }
    if (typeof patch.concentration === "boolean") {
        current.concentration = patch.concentration;
        changed = true;
    }
    if (typeof patch.ritual === "boolean") {
        current.ritual = patch.ritual;
        changed = true;
    }

    if (patch.components) {
        const existing = isRecord(current.components)
            ? { ...current.components }
            : {};
        if (typeof patch.components.verbal === "boolean") {
            existing.verbal = patch.components.verbal;
        }
        if (typeof patch.components.somatic === "boolean") {
            existing.somatic = patch.components.somatic;
        }
        if (typeof patch.components.material === "boolean") {
            existing.material = patch.components.material;
        }
        if (Object.keys(existing).length > 0) {
            current.components = existing;
        } else {
            delete current.components;
        }
        changed = true;
    }

    if (patch.resource_cost) {
        const existing = isRecord(current.resourceCost)
            ? { ...current.resourceCost }
            : {};
        if (typeof patch.resource_cost.uses_spell_slot === "boolean") {
            existing.usesSpellSlot = patch.resource_cost.uses_spell_slot;
        }
        if (typeof patch.resource_cost.slot_level === "number") {
            existing.slotLevel = patch.resource_cost.slot_level;
        }
        if (typeof patch.resource_cost.charges === "number") {
            existing.charges = patch.resource_cost.charges;
        }
        if (typeof patch.resource_cost.points === "number") {
            existing.points = patch.resource_cost.points;
        }
        if (Object.keys(existing).length > 0) {
            current.resourceCost = existing;
        } else {
            delete current.resourceCost;
        }
        changed = true;
    }

    if (patch.save) {
        const existing = isRecord(current.save) ? { ...current.save } : {};
        if (patch.save.type) existing.type = patch.save.type;
        if (patch.save.save_ability) existing.saveAbility = patch.save.save_ability;
        if (patch.save.dc_type) existing.dcType = patch.save.dc_type;
        if (typeof patch.save.dc_value === "number") existing.dcValue = patch.save.dc_value;
        if (patch.save.dc_stat) existing.dcStat = patch.save.dc_stat;
        if (Object.keys(existing).length > 0) current.save = existing;
        else delete current.save;
        changed = true;
    }

    if (patch.damage) {
        const existing = isRecord(current.damage) ? { ...current.damage } : {};
        if (patch.damage.damage_type) existing.damageType = patch.damage.damage_type;
        if (patch.damage.dice) existing.dice = patch.damage.dice;
        if (patch.damage.scaling) existing.scaling = patch.damage.scaling;
        if (Object.keys(existing).length > 0) current.damage = existing;
        else delete current.damage;
        changed = true;
    }

    if (!changed) {
        return {
            applied: false,
            message: `No hubo cambios concretos para el hechizo "${patch.target_spell_name}".`,
        };
    }

    if (index < 0) {
        list[list.length - 1] = current;
    } else {
        list[index] = current;
    }
    baseDetails[collection] = list;
    return {
        applied: true,
        details: baseDetails,
        message: `Hechizo "${patch.target_spell_name}" actualizado en ${collection}.`,
    };
}

function inferFeatureCollectionFromPatch(
    patch: CustomFeaturePatch
): FeatureCollection {
    if (patch.collection) return patch.collection;
    if (patch.action_type) return "customClassAbilities";
    const probe = normalizeForItemMatch(
        `${patch.target_feature_name} ${patch.name ?? ""}`
    );
    if (
        probe.includes("accion") ||
        probe.includes("action") ||
        probe.includes("habilidad") ||
        probe.includes("ability")
    ) {
        return "customClassAbilities";
    }
    return "customTraits";
}

function applyCustomFeaturePatch(details: unknown, patch: CustomFeaturePatch) {
    const baseDetails = isRecord(details) ? { ...details } : {};
    const collection = inferFeatureCollectionFromPatch(patch);
    const list = normalizeExistingNamedCollection(baseDetails[collection]);
    const index = findNamedEntryIndex(list, patch.target_feature_name);

    if (patch.remove) {
        if (index < 0) {
            return {
                applied: false,
                message: `No se encontró el rasgo/habilidad "${patch.target_feature_name}" en ${collection}.`,
            };
        }
        list.splice(index, 1);
        baseDetails[collection] = list;
        return {
            applied: true,
            details: baseDetails,
            message: `Rasgo/habilidad "${patch.target_feature_name}" eliminado de ${collection}.`,
        };
    }

    let changed = false;
    let current: Record<string, unknown>;
    if (index < 0) {
        if (!patch.create_if_missing) {
            return {
                applied: false,
                message: `No se encontró el rasgo/habilidad "${patch.target_feature_name}" en ${collection}.`,
            };
        }
        current = {
            id: buildGeneratedId("feature"),
            name: patch.name ?? patch.target_feature_name,
        };
        list.push(current);
        changed = true;
    } else {
        current = { ...list[index] };
    }

    if (patch.name) {
        current.name = patch.name;
        changed = true;
    }
    if (typeof patch.level === "number") {
        current.level = patch.level;
        changed = true;
    }
    if (patch.description !== undefined) {
        if (patch.description === null || patch.description === "") {
            delete current.description;
        } else {
            current.description = toLocalizedTextObject(patch.description);
        }
        changed = true;
    }
    if (patch.action_type) {
        current.actionType = patch.action_type;
        changed = true;
    }
    if (patch.requirements !== undefined) {
        if (patch.requirements === null || patch.requirements === "") {
            delete current.requirements;
        } else {
            current.requirements = patch.requirements;
        }
        changed = true;
    }
    if (patch.effect !== undefined) {
        if (patch.effect === null || patch.effect === "") delete current.effect;
        else current.effect = patch.effect;
        changed = true;
    }
    if (patch.subclass_id !== undefined) {
        if (patch.subclass_id === null || patch.subclass_id === "") {
            delete current.subclassId;
        } else {
            current.subclassId = patch.subclass_id;
        }
        changed = true;
    }
    if (patch.subclass_name !== undefined) {
        if (patch.subclass_name === null || patch.subclass_name === "") {
            delete current.subclassName;
        } else {
            current.subclassName = patch.subclass_name;
        }
        changed = true;
    }

    if (patch.resource_cost) {
        const existing = isRecord(current.resourceCost)
            ? { ...current.resourceCost }
            : {};
        if (typeof patch.resource_cost.uses_spell_slot === "boolean") {
            existing.usesSpellSlot = patch.resource_cost.uses_spell_slot;
        }
        if (typeof patch.resource_cost.slot_level === "number") {
            existing.slotLevel = patch.resource_cost.slot_level;
        }
        if (typeof patch.resource_cost.charges === "number") {
            existing.charges = patch.resource_cost.charges;
        }
        if (patch.resource_cost.recharge) {
            existing.recharge = patch.resource_cost.recharge;
        }
        if (patch.resource_cost.points_label !== undefined) {
            if (
                patch.resource_cost.points_label === null ||
                patch.resource_cost.points_label === ""
            ) {
                delete existing.pointsLabel;
            } else {
                existing.pointsLabel = patch.resource_cost.points_label;
            }
        }
        if (typeof patch.resource_cost.points === "number") {
            existing.points = patch.resource_cost.points;
        }
        if (Object.keys(existing).length > 0) {
            current.resourceCost = existing;
        } else {
            delete current.resourceCost;
        }
        changed = true;
    }

    if (!changed) {
        return {
            applied: false,
            message: `No hubo cambios concretos para "${patch.target_feature_name}".`,
        };
    }

    if (index < 0) {
        list[list.length - 1] = current;
    } else {
        list[index] = current;
    }
    baseDetails[collection] = list;
    return {
        applied: true,
        details: baseDetails,
        message: `Rasgo/habilidad "${patch.target_feature_name}" actualizado en ${collection}.`,
    };
}

function normalizeSpellListLevel(
    value: unknown
): Array<{ index?: string; name: string }> {
    if (Array.isArray(value)) {
        const out: Array<{ index?: string; name: string }> = [];
        for (const entry of value) {
            if (!isRecord(entry)) continue;
            const name = asTrimmedString(entry.name, 140);
            if (!name) continue;
            const index = asTrimmedString(entry.index, 140);
            out.push(index ? { index, name } : { name });
        }
        return out;
    }
    if (typeof value === "string") {
        return value
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((name) => ({ name }));
    }
    return [];
}

function applyLearnedSpellPatch(details: unknown, patch: LearnedSpellPatch) {
    const baseDetails = isRecord(details) ? { ...details } : {};
    const spells = isRecord(baseDetails.spells) ? { ...baseDetails.spells } : {};
    const key = `level${patch.spell_level}`;
    const current = normalizeSpellListLevel(spells[key]);
    const targetName = patch.spell_name
        ? normalizeForItemMatch(patch.spell_name)
        : undefined;
    const targetIndex = patch.spell_index
        ? normalizeForItemMatch(patch.spell_index)
        : undefined;

    const existingIndex = current.findIndex((entry) => {
        const entryName = normalizeForItemMatch(entry.name);
        const entryIndex = entry.index ? normalizeForItemMatch(entry.index) : "";
        if (targetIndex && entryIndex && entryIndex === targetIndex) return true;
        if (targetName && entryName === targetName) return true;
        return false;
    });

    if ((patch.action ?? "learn") === "forget") {
        if (existingIndex < 0) {
            return {
                applied: false,
                message: `No se encontró el hechizo indicado en ${key}.`,
            };
        }
        current.splice(existingIndex, 1);
        if (current.length > 0) spells[key] = current;
        else delete spells[key];
        baseDetails.spells = spells;
        return {
            applied: true,
            details: baseDetails,
            message: `Hechizo eliminado de ${key}.`,
        };
    }

    if (existingIndex >= 0) {
        return {
            applied: false,
            message: `El hechizo ya estaba presente en ${key}.`,
        };
    }

    current.push({
        name: patch.spell_name ?? patch.spell_index ?? "Hechizo",
        ...(patch.spell_index ? { index: patch.spell_index } : {}),
    });
    spells[key] = current;
    baseDetails.spells = spells;
    return {
        applied: true,
        details: baseDetails,
        message: `Hechizo añadido en ${key}.`,
    };
}

function stripCodeFences(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed.startsWith("```")) return trimmed;
    return trimmed
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
}

function extractModelContent(content: unknown): string {
    if (typeof content === "string") return content;
    if (!Array.isArray(content)) return "";

    const textParts: string[] = [];
    for (const part of content) {
        if (typeof part === "string") {
            textParts.push(part);
            continue;
        }
        if (isRecord(part) && typeof part.text === "string") {
            textParts.push(part.text);
        }
    }
    return textParts.join("\n").trim();
}

function parseAssistantPlan(raw: string): AssistantPlan {
    const clean = stripCodeFences(raw);
    const parsed = JSON.parse(clean) as unknown;

    if (!isRecord(parsed)) {
        throw new Error("La respuesta del modelo no es un objeto JSON.");
    }

    const reply = asTrimmedString(parsed.reply, 2000);
    const actions = Array.isArray(parsed.actions) ? parsed.actions : [];

    return {
        reply:
            reply ??
            "He analizado tu petición, pero no encontré cambios concretos para aplicar.",
        actions,
    };
}

function buildAssistantSystemPrompt() {
    return [
        "Eres un asistente para una web de gestión de campañas de DnD.",
        "Tu trabajo es traducir instrucciones del usuario en acciones de mutación de personajes.",
        "Devuelve solo JSON válido con el esquema pedido.",
        "Lee y usa context.productKnowledge y context.clientContext para entender mejor el flujo de la web.",
        "Lee también context.visibleCharacters e inventorySnapshot para entender lo que ya existe en cada personaje.",
        "No inventes IDs. Usa solo IDs del contexto de personajes disponibles.",
        "No propongas acciones fuera de create/update en personajes.",
        "Si clientContext trae personaje seleccionado y el usuario no especifica uno, úsalo como objetivo por defecto.",
        "Si el usuario indica objetivo con expresiones tipo 'en X', 'para X' o 'a X', prioriza ese personaje.",
        "Para cambios de objetos del inventario usa data.item_patch, no details_patch.inventory.",
        "Si el usuario pide añadir/crear un objeto que no existe, usa item_patch.create_if_missing=true.",
        "Si el usuario dice 'añade este objeto' y pega un bloque largo, usa el título principal del bloque como target_item_name.",
        "Si el texto de un objeto incluye secciones como rasgos o habilidades, represéntalas como attachments con type 'trait' o 'ability'.",
        "Para textos largos de objetos, no descartes la petición: crea al menos una acción mínima viable con item_patch.",
        "Para hechizos personalizados usa data.custom_spell_patch sobre customSpells/customCantrips.",
        "Para rasgos/habilidades personalizadas usa data.custom_feature_patch sobre customTraits/customClassAbilities.",
        "Para aprender u olvidar hechizos por nivel usa data.learned_spell_patch.",
        "Tolera typos y lenguaje mixto ES/EN si la intención es clara.",
        "Prioriza propuestas concretas sobre respuestas vacías.",
        "Si no hay cambios claros, devuelve actions: [].",
        "Si el usuario pregunta capacidades o ayuda, explica claramente qué puedes hacer y propone ejemplos útiles.",
        "Mantén reply corto y útil en español.",
    ].join(" ");
}

function normalizeForMatch(value: string) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function tokenizeForMatch(value: string) {
    const normalized = normalizeForMatch(value).replace(/[^a-z0-9\s]/g, " ");
    const stopwords = new Set([
        "de",
        "la",
        "el",
        "los",
        "las",
        "y",
        "en",
        "un",
        "una",
        "para",
        "con",
        "que",
        "q",
        "mi",
        "tu",
        "por",
        "the",
        "and",
        "for",
        "with",
        "you",
        "your",
        "to",
        "a",
        "an",
    ]);
    const rawTokens = normalized
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean)
        .filter((token) => token.length >= 2)
        .filter((token) => !stopwords.has(token));
    return Array.from(new Set(rawTokens));
}

function classifyAssistantIntent(
    prompt: string,
    targetCharacterId?: string
): AssistantIntent {
    if (isCapabilitiesQuestion(prompt)) return "capabilities";

    const normalized = normalizeForMatch(prompt);
    const mutationSignals = [
        "crea",
        "crear",
        "creame",
        "añade",
        "anade",
        "agrega",
        "inserta",
        "pon",
        "quita",
        "elimina",
        "borra",
        "cambia",
        "actualiza",
        "edita",
        "sube",
        "baja",
        "modifica",
        "equipa",
        "desequipa",
        "aprende",
        "olvida",
        "vincula",
        "sintoniza",
        "update",
        "edit",
        "change",
        "set",
        "create",
        "add",
        "insert",
        "remove",
        "delete",
        "equip",
        "unequip",
        "attune",
        "level",
        "nivel",
        "stats",
        "hp",
        "dex",
        "str",
        "con",
        "int",
        "wis",
        "cha",
        "inventario",
        "inventory",
        "equipo",
        "equipment",
        "nota",
        "notes",
        "trasfondo",
        "backstory",
        "inventario",
        "objeto",
        "item",
        "equipo",
        "equipment",
        "yelmo",
        "armadura",
        "accesorio",
        "rasgo",
        "trait",
        "habilidad",
        "ability",
        "hechizo",
        "hechizos",
        "spell",
        "cantrip",
        "truco",
        "accion",
        "action",
    ];

    const hasMutationSignal = mutationSignals.some((token) =>
        normalized.includes(token)
    );
    if (hasMutationSignal) return "mutation";
    if (targetCharacterId && normalized.length >= 12) return "mutation";
    return "chat";
}

function isCapabilitiesQuestion(prompt: string) {
    const normalized = normalizeForMatch(prompt);
    const patterns = [
        "que puedes hacer",
        "q puedes hacer",
        "que puedes",
        "q puedes",
        "que haces",
        "ayuda",
        "help",
        "what can you do",
    ];
    return patterns.some((pattern) => normalized.includes(pattern));
}

function extractCurrentUserInstruction(prompt: string) {
    const marker = "instruccion actual del usuario:";
    const lower = prompt.toLowerCase();
    const markerIndex = lower.lastIndexOf(marker);
    if (markerIndex < 0) return prompt.trim();
    const tail = prompt.slice(markerIndex + marker.length).trim();
    const lowerTail = tail.toLowerCase();
    const separators = [
        "\n\ncontexto reciente:",
        "\n\nhistorial reciente:",
        "\n\nrecent context:",
        "\n\nrecent history:",
    ];

    let cutIndex = tail.length;
    for (const separator of separators) {
        const index = lowerTail.indexOf(separator);
        if (index >= 0 && index < cutIndex) {
            cutIndex = index;
        }
    }

    return tail.slice(0, cutIndex).trim();
}

function stripLeadingDecorators(value: string) {
    return value.replace(/^[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ]+/u, "").trim();
}

function extractCharacterInventoryItemNames(character: CharacterSummaryRow) {
    if (!isRecord(character.details) || !Array.isArray(character.details.items)) {
        return [] as string[];
    }
    const names: string[] = [];
    for (const rawItem of character.details.items) {
        if (!isRecord(rawItem)) continue;
        const name = asTrimmedString(rawItem.name, 120);
        if (!name) continue;
        if (!names.includes(name)) names.push(name);
    }
    return names;
}

function characterHasItemName(character: CharacterSummaryRow, itemName: string) {
    const target = normalizeForItemMatch(itemName);
    if (!target) return false;
    const itemNames = extractCharacterInventoryItemNames(character);
    return itemNames.some((entry) => {
        const normalized = normalizeForItemMatch(entry);
        return normalized === target || normalized.includes(target) || target.includes(normalized);
    });
}

function findMentionedCharacterId(
    instruction: string,
    visibleCharacters: CharacterSummaryRow[]
) {
    const normalizedInstruction = ` ${normalizeForMatch(instruction).replace(/[^a-z0-9\s]/g, " ")} `;
    let best: { characterId: string; score: number } | null = null;

    for (const character of visibleCharacters) {
        const rawName = asTrimmedString(character.name, 120);
        if (!rawName) continue;
        const normalizedName = normalizeForMatch(rawName).replace(/[^a-z0-9\s]/g, " ").trim();
        if (!normalizedName || normalizedName.length < 2) continue;

        let score = 0;
        if (normalizedInstruction.includes(` ${normalizedName} `)) {
            score = 1000 + normalizedName.length;
        } else {
            const tokens = normalizedName
                .split(/\s+/)
                .map((entry) => entry.trim())
                .filter((entry) => entry.length >= 3);
            if (tokens.length > 0) {
                const matchedTokens = tokens.filter((token) =>
                    normalizedInstruction.includes(` ${token} `)
                );
                const ratio = matchedTokens.length / tokens.length;
                if (matchedTokens.length >= 2 || ratio >= 0.75) {
                    score = Math.round(ratio * 100) + normalizedName.length;
                }
            }
        }

        if (score <= 0) continue;
        if (!best || score > best.score) {
            best = { characterId: character.id, score };
        }
    }

    return best?.characterId;
}

function findCharacterIdFromHint(
    hint: string,
    visibleCharacters: CharacterSummaryRow[]
) {
    const normalizedHint = normalizeForMatch(hint)
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (!normalizedHint || normalizedHint.length < 2) return undefined;

    const hintTokens = normalizedHint
        .split(/\s+/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length >= 3);

    let best: { characterId: string; score: number } | null = null;
    for (const character of visibleCharacters) {
        const rawName = asTrimmedString(character.name, 120);
        if (!rawName) continue;
        const normalizedName = normalizeForMatch(rawName)
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        if (!normalizedName || normalizedName.length < 2) continue;

        let score = 0;
        if (
            normalizedName === normalizedHint ||
            normalizedName.includes(normalizedHint) ||
            normalizedHint.includes(normalizedName)
        ) {
            score = 2000 + normalizedName.length;
        } else if (hintTokens.length > 0) {
            const matchedTokens = hintTokens.filter((token) =>
                normalizedName.includes(token)
            );
            const ratio = matchedTokens.length / hintTokens.length;
            if (matchedTokens.length >= 1 && (hintTokens.length === 1 || ratio >= 0.5)) {
                score = Math.round(ratio * 100) + matchedTokens.length * 10;
            }
        }

        if (score <= 0) continue;
        if (!best || score > best.score) {
            best = { characterId: character.id, score };
        }
    }

    return best?.characterId;
}

function extractCharacterTargetHintFromInstruction(instruction: string) {
    const lines = instruction
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    const commandLine = [...lines].reverse().find((line) => {
        const normalized = normalizeForMatch(line);
        return (
            normalized.includes("modifica") ||
            normalized.includes("actualiza") ||
            normalized.includes("edita") ||
            normalized.includes("cambia") ||
            normalized.includes("anade") ||
            normalized.includes("añade") ||
            normalized.includes("agrega") ||
            normalized.includes("crea") ||
            normalized.includes("add ")
        );
    });

    const source = (commandLine ?? instruction)
        .replace(/\bdde\b/gi, "de")
        .replace(/\b(?:por\s+favor|please)\b.*$/i, "")
        .replace(/["'`]+$/g, "")
        .replace(/[.?!:;,\s]+$/g, "")
        .trim();

    const scopedMatches = Array.from(
        source.matchAll(/\b(?:en|a|para)\s+([^\n,.;:!?]{2,120})/gi)
    );
    if (scopedMatches.length > 0) {
        const tail = scopedMatches[scopedMatches.length - 1]?.[1];
        const cleaned = cleanupEntityName(tail ?? "", 120);
        if (cleaned) return cleaned;
    }

    const fallback = instruction
        .replace(/\bdde\b/gi, "de")
        .replace(/\b(?:por\s+favor|please)\b.*$/i, "")
        .trim();
    const fallbackMatches = Array.from(
        fallback.matchAll(/\b(?:en|a|para)\s+([^\n,.;:!?]{2,120})/gi)
    );
    if (fallbackMatches.length === 0) return undefined;
    const fallbackTail =
        fallbackMatches[fallbackMatches.length - 1]?.[1] ?? "";
    return cleanupEntityName(fallbackTail, 120);
}

function findMentionedItemName(text: string, candidates: string[]) {
    const normalizedText = ` ${normalizeForItemMatch(text).replace(/[^a-z0-9\s]/g, " ")} `;
    let bestMatch: { name: string; score: number } | null = null;

    for (const candidate of candidates) {
        const name = asTrimmedString(candidate, 120);
        if (!name) continue;
        const normalizedName = normalizeForItemMatch(name)
            .replace(/[^a-z0-9\s]/g, " ")
            .trim();
        if (!normalizedName || normalizedName.length < 3) continue;

        let score = 0;
        if (normalizedText.includes(` ${normalizedName} `)) {
            score = 1000 + normalizedName.length;
        } else {
            const tokens = normalizedName
                .split(/\s+/)
                .map((token) => token.trim())
                .filter((token) => token.length >= 3);
            if (tokens.length > 0) {
                const matchedTokens = tokens.filter((token) =>
                    normalizedText.includes(` ${token} `)
                );
                const ratio = matchedTokens.length / tokens.length;
                if (matchedTokens.length >= 2 || ratio >= 0.75) {
                    score = Math.round(ratio * 100) + normalizedName.length;
                }
            }
        }

        if (score <= 0) continue;
        if (!bestMatch || score > bestMatch.score) {
            bestMatch = { name, score };
        }
    }

    return bestMatch?.name;
}

function parseRarityFromText(value?: string) {
    if (!value) return undefined;
    const normalized = normalizeForItemMatch(value);
    if (!normalized) return undefined;

    if (
        normalized.includes("unico") ||
        normalized.includes("unica") ||
        normalized.includes("unique")
    ) {
        return "única";
    }
    if (normalized.includes("legend")) return "legendaria";
    if (
        normalized.includes("muy rara") ||
        normalized.includes("very rare")
    ) {
        return "muy rara";
    }
    if (normalized.includes("rara") || normalized.includes("rare")) return "rara";
    if (
        normalized.includes("poco comun") ||
        normalized.includes("uncommon")
    ) {
        return "poco común";
    }
    if (normalized.includes("comun") || normalized.includes("common")) {
        return "común";
    }
    return undefined;
}

function isTraitHeadingLine(line: string) {
    const trimmed = line.trim();
    if (!trimmed || !/[.:]$/.test(trimmed)) return false;
    const heading = trimmed.replace(/[.:]+$/, "").trim();
    if (heading.length < 3 || heading.length > 90) return false;

    const words = heading.split(/\s+/).filter(Boolean);
    if (words.length < 1 || words.length > 8) return false;

    const normalized = normalizeForMatch(heading);
    if (normalized.startsWith("instruccion actual del usuario")) return false;
    if (normalized.startsWith("usuario")) return false;
    if (normalized.startsWith("asistente")) return false;
    if (normalized.startsWith("tengo este objeto")) return false;
    if (normalized.startsWith("modifica ")) return false;
    if (normalized.startsWith("actualiza ")) return false;
    if (normalized.startsWith("edita ")) return false;
    if (normalized.startsWith("cambia ")) return false;
    return true;
}

function isMutationCommandLine(line: string) {
    const normalized = normalizeForMatch(line);
    return (
        normalized.startsWith("modifica ") ||
        normalized.startsWith("actualiza ") ||
        normalized.startsWith("edita ") ||
        normalized.startsWith("cambia ") ||
        normalized.startsWith("anade ") ||
        normalized.startsWith("añade ") ||
        normalized.startsWith("agrega ") ||
        normalized.startsWith("inserta ") ||
        normalized.startsWith("mete ") ||
        normalized.startsWith("crea ") ||
        normalized.startsWith("add ")
    );
}

function extractStructuredItemTargetHint(line: string) {
    const cleaned = line.replace(/\bdde\b/gi, "de");
    const match = cleaned.match(
        /\b(?:cambia|modifica|actualiza|edita|anade|añade|agrega|inserta|mete|crea|add|insert)\b[^a-z0-9áéíóúüñ]{0,4}(?:el|la|los|las)?\s*([^\n]+?)(?:\s+\b(?:para|por|a|en)\b|$)/i
    );
    if (!match) return undefined;
    return cleanupEntityName(match[1], 120);
}

function isLikelyItemDetailLine(line: string) {
    const normalized = normalizeForMatch(line);
    return (
        normalized.startsWith("dano") ||
        normalized.startsWith("daño") ||
        normalized.startsWith("propiedades") ||
        normalized.startsWith("propiedad") ||
        normalized.startsWith("bono") ||
        normalized.startsWith("bonus") ||
        normalized.startsWith("alcance") ||
        normalized.startsWith("range") ||
        normalized.startsWith("damage")
    );
}

function stripTrailingMutationCommandFragment(line: string) {
    const trimmed = line.trim();
    if (!trimmed) return trimmed;

    const match = trimmed.match(
        /^(.*?)(?:\s+|[.?!:;]\s*)(?:anade|añade|agrega|inserta|mete|crea|modifica|actualiza|edita|cambia|add|insert|create|update|edit|change)\b[^\n]{0,160}\b(?:en|para|a)\b\s+[^\n]{2,140}$/i
    );
    if (!match) return trimmed;

    const left = match[1]?.replace(/[.,;:!?\s]+$/g, "").trim();
    if (!left || left.length < 8) return trimmed;
    return left;
}

function isNoiseStructuredLine(line: string) {
    const trimmed = line.trim();
    if (!trimmed) return true;
    if (trimmed === ".") return true;
    if (/^[-=*_~–—·•\s]{2,}$/.test(trimmed)) return true;

    const cleaned = stripLeadingDecorators(trimmed);
    if (!cleaned) return true;
    if (!/[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ]/u.test(cleaned)) return true;
    return false;
}

function normalizeStructuredHeadingName(line: string) {
    const cleaned = stripLeadingDecorators(line)
        .replace(/\s+/g, " ")
        .trim();
    if (!cleaned) return undefined;
    if (!/[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ]/u.test(cleaned)) return undefined;

    const compact = cleaned.replace(/[.:]+$/, "").trim();
    if (!compact || compact.length < 3) return undefined;

    const normalized = normalizeForMatch(compact);
    const forbiddenStarts = [
        "instruccion actual del usuario",
        "usuario",
        "asistente",
        "tengo este objeto",
        "hola soy tu asistente",
        "he analizado tu peticion",
        "he analizado tu petición",
        "te propondre cambios",
        "te propondré cambios",
        "no encontre cambios concretos",
        "no encontré cambios concretos",
    ];
    if (forbiddenStarts.some((entry) => normalized.startsWith(entry))) {
        return undefined;
    }
    if (isMutationCommandLine(compact)) return undefined;
    if (
        normalized === "uso" ||
        normalized === "aspecto" ||
        normalized === "propiedades" ||
        normalized === "propiedades magicas" ||
        normalized === "propiedades mágicas" ||
        normalized === "descripcion" ||
        normalized === "descripción"
    ) {
        return undefined;
    }
    return asTrimmedString(compact, 140);
}

function isStructuredSectionOnlyLabel(line: string) {
    const cleaned = stripLeadingDecorators(line).replace(/[.:]+$/g, "").trim();
    if (!cleaned) return true;
    const normalized = normalizeForMatch(cleaned);
    return (
        normalized === "uso" ||
        normalized === "aspecto" ||
        normalized === "descripcion" ||
        normalized === "descripción" ||
        normalized === "propiedades" ||
        normalized === "propiedades magicas" ||
        normalized === "propiedades mágicas"
    );
}

function parseStructuredSubItemHeading(line: string) {
    const raw = line.trim();
    if (!raw) return undefined;
    if (/[.!?]$/.test(raw)) return undefined;

    const cleaned = stripLeadingDecorators(line)
        .replace(/[.:]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
    if (!cleaned || cleaned.length < 4 || cleaned.length > 140) return undefined;
    if (isMutationCommandLine(cleaned)) return undefined;
    if (isStructuredSectionOnlyLabel(cleaned)) return undefined;

    const normalized = normalizeForMatch(cleaned);
    if (
        normalized.startsWith("objeto maravilloso") ||
        normalized.startsWith("instruccion actual del usuario") ||
        normalized.startsWith("usuario") ||
        normalized.startsWith("asistente")
    ) {
        return undefined;
    }

    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 8) return undefined;

    const normalizedSentence = ` ${normalized} `;
    const sentenceSignals = [
        " hay ",
        " tiene ",
        " tienen ",
        " puede ",
        " pueden ",
        " permite ",
        " permiten ",
        " mientras ",
        " cuando ",
        " una vez ",
        " dentro ",
        " entre ",
        " aunque ",
        " obtiene ",
        " obtienes ",
        " brilla ",
        " sostiene ",
        " concentra ",
    ];
    if (sentenceSignals.some((signal) => normalizedSentence.includes(signal))) {
        return undefined;
    }

    const connectorWords = new Set([
        "de",
        "del",
        "la",
        "las",
        "el",
        "los",
        "y",
        "o",
        "con",
        "en",
        "por",
        "para",
    ]);
    const significantWords = words.filter(
        (word) => !connectorWords.has(normalizeForMatch(word))
    );
    if (significantWords.length < 2) return undefined;
    const capitalizedCount = significantWords.filter((word) =>
        /^[A-ZÁÉÍÓÚÜÑ0-9]/u.test(word)
    ).length;
    if (capitalizedCount / significantWords.length < 0.5) return undefined;

    const itemLike =
        /\b(?:diamante|gema|piedra|cristal|daga|espada|hacha|mazo|arco|ballesta|baston|bastón|escudo|yelmo|casco|capa|anillo|amuleto|bolsa|cofre|pocion|poción)\b/i.test(
            cleaned
        );
    if (!itemLike) return undefined;

    return asTrimmedString(cleaned, 140);
}

type StructuredSubItemBlock = {
    name: string;
    startIndex: number;
    bodyLines: string[];
};

function buildStructuredSubItemBlocks(lines: string[], rootHeadingName?: string) {
    const rootNorm = rootHeadingName ? normalizeForItemMatch(rootHeadingName) : "";
    const headings: Array<{ index: number; name: string }> = [];
    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const parsed = parseStructuredSubItemHeading(line);
        if (!parsed) continue;
        if (rootNorm && normalizeForItemMatch(parsed) === rootNorm) continue;
        headings.push({ index, name: parsed });
    }
    if (headings.length === 0) return [] as StructuredSubItemBlock[];

    const blocks: StructuredSubItemBlock[] = [];
    for (let idx = 0; idx < headings.length; idx += 1) {
        const current = headings[idx];
        const next = headings[idx + 1];
        const start = current.index + 1;
        const end = next ? next.index : lines.length;
        const bodyLines = lines
            .slice(start, end)
            .map((line) => stripTrailingMutationCommandFragment(line))
            .map((line) => line.trim())
            .filter(Boolean)
            .filter((line) => !isNoiseStructuredLine(line))
            .filter((line) => !isMutationCommandLine(line))
            .filter((line) => !isStructuredSectionOnlyLabel(line));
        if (bodyLines.length === 0) continue;
        blocks.push({
            name: current.name,
            startIndex: current.index,
            bodyLines,
        });
        if (blocks.length >= 10) break;
    }
    return blocks;
}

function parseStructuredItemPatchFromInstruction({
    instruction,
    candidateItemNames,
}: {
    instruction: string;
    candidateItemNames: string[];
}): ItemPatch | undefined {
    const normalizedInstruction = normalizeForMatch(instruction);
    const wantsCreate =
        normalizedInstruction.includes("anade") ||
        normalizedInstruction.includes("añade") ||
        normalizedInstruction.includes("agrega") ||
        normalizedInstruction.includes("crea") ||
        normalizedInstruction.includes("crear") ||
        normalizedInstruction.includes("add ");
    const lines = instruction
        .split(/\r?\n/)
        .map((line) => line.trim())
        .map((line) => line.replace(/^[-*•]+\s*/, "").trim())
        .map((line) => stripTrailingMutationCommandFragment(line))
        .map((line) => line.trim())
        .filter(Boolean);
    if (lines.length === 0) return undefined;

    const commandLine = [...lines].reverse().find((line) => isMutationCommandLine(line));
    const commandTargetHint = commandLine
        ? extractStructuredItemTargetHint(commandLine)
        : undefined;
    const commandTargetItemName = commandTargetHint
        ? findMentionedItemName(commandTargetHint, candidateItemNames)
        : undefined;
    const mentionedItemName = findMentionedItemName(instruction, candidateItemNames);

    let headingLine: string | undefined;
    let headingCandidateFromLine: string | undefined;
    for (const line of lines) {
        if (isNoiseStructuredLine(line)) continue;
        const normalized = normalizeForMatch(line);
        if (normalized.startsWith("instruccion actual del usuario")) continue;
        if (normalized.startsWith("usuario")) continue;
        if (normalized.startsWith("asistente")) continue;
        if (normalized.startsWith("tengo este objeto")) continue;
        if (normalized.startsWith("modifica ")) continue;
        if (normalized.startsWith("actualiza ")) continue;
        if (normalized.startsWith("edita ")) continue;
        if (normalized.startsWith("cambia ")) continue;
        const parsedHeading = normalizeStructuredHeadingName(line);
        if (!parsedHeading) continue;
        headingLine = line;
        headingCandidateFromLine = parsedHeading;
        break;
    }

    const cleanedHeading = headingLine
        ? stripLeadingDecorators(headingLine)
        : undefined;
    const headingRarityMatch = cleanedHeading?.match(/\(([^()]{2,40})\)\s*$/);
    const headingName = cleanedHeading
        ? asTrimmedString(
              headingRarityMatch
                  ? cleanedHeading.slice(0, headingRarityMatch.index).trim()
                  : cleanedHeading,
              120
          )
        : undefined;
    const headingCandidate =
        headingName && !isTraitHeadingLine(headingName)
            ? headingName
            : headingCandidateFromLine;
    const headingAsExisting = headingCandidate
        ? findMentionedItemName(headingCandidate, candidateItemNames)
        : undefined;
    const targetItemName =
        commandTargetItemName ??
        (wantsCreate
            ? headingCandidate ?? mentionedItemName ?? headingAsExisting
            : mentionedItemName ?? headingAsExisting ?? headingCandidate);
    if (!targetItemName) return undefined;
    const subItemBlocks = buildStructuredSubItemBlocks(lines, headingCandidate);

    let metadataLine: string | undefined;
    for (const line of lines.slice(0, 6)) {
        if (line === headingLine) continue;
        if (isTraitHeadingLine(line)) continue;
        const normalized = normalizeForMatch(line);
        if (normalized.startsWith("tengo este objeto")) continue;
        if (normalized.startsWith("modifica ")) continue;
        if (normalized.startsWith("actualiza ")) continue;
        if (normalized.startsWith("edita ")) continue;
        if (normalized.startsWith("cambia ")) continue;
        if (
            normalizeItemCategory(line) ||
            normalized.includes("armadura") ||
            normalized.includes("weapon") ||
            normalized.includes("rara") ||
            normalized.includes("rare") ||
            normalized.includes("unica") ||
            normalized.includes("unico")
        ) {
            metadataLine = line;
            break;
        }
    }

    const detailLines: string[] = [];
    if (subItemBlocks.length === 0) {
        for (const line of lines) {
            if (line === headingLine) continue;
            if (isTraitHeadingLine(line)) continue;
            if (isMutationCommandLine(line)) continue;
            if (line === metadataLine) continue;
            if (isLikelyItemDetailLine(line)) {
                detailLines.push(line);
                continue;
            }
            if (/^(?:arma|armadura|weapon|armor)\b/i.test(line)) {
                detailLines.push(line);
            }
        }
    }

    const attachments: ItemAttachmentPatch[] = [];
    if (subItemBlocks.length > 0) {
        for (const block of subItemBlocks) {
            const description = asTrimmedString(block.bodyLines.join(" "), 4000);
            if (!description) continue;
            attachments.push({
                type: inferAttachmentType(block.name, description),
                name: block.name,
                description,
            });
            if (attachments.length >= 8) break;
        }
    } else {
        for (let index = 0; index < lines.length; index += 1) {
            const line = lines[index];
            if (!isTraitHeadingLine(line)) continue;

            const heading = asTrimmedString(
                stripLeadingDecorators(line).replace(/[.:]+$/, "").trim(),
                140
            );
            if (!heading) continue;

            const descriptionLines: string[] = [];
            let cursor = index + 1;
            while (cursor < lines.length && !isTraitHeadingLine(lines[cursor])) {
                const candidate = lines[cursor];
                const normalized = normalizeForMatch(candidate);
                if (
                    normalized.startsWith("tengo este objeto") ||
                    normalized.startsWith("modifica ") ||
                    normalized.startsWith("actualiza ") ||
                    normalized.startsWith("edita ") ||
                    normalized.startsWith("cambia ")
                ) {
                    cursor += 1;
                    continue;
                }
                descriptionLines.push(candidate);
                cursor += 1;
            }
            index = cursor - 1;

            const description = asTrimmedString(descriptionLines.join(" "), 4000);
            if (!description) continue;

            attachments.push({
                type: inferAttachmentType(heading, description),
                name: heading,
                description,
            });
            if (attachments.length >= 8) break;
        }
    }

    const rarity =
        parseRarityFromText(headingRarityMatch?.[1]) ??
        parseRarityFromText(metadataLine);
    const category = metadataLine ? normalizeItemCategory(metadataLine) : undefined;
    const introDescription =
        subItemBlocks.length > 0
            ? (() => {
                  const firstSubItemIndex = Math.min(
                      ...subItemBlocks.map((entry) => entry.startIndex)
                  );
                  const introLines = lines
                      .slice(0, firstSubItemIndex)
                      .filter((line) => line !== headingLine)
                      .filter((line) => !isNoiseStructuredLine(line))
                      .filter((line) => !isMutationCommandLine(line))
                      .filter((line) => !isStructuredSectionOnlyLabel(line));
                  return asTrimmedString(introLines.join("\n"), 1200);
              })()
            : undefined;
    const description = asTrimmedString(
        [introDescription, metadataLine, ...detailLines].filter(Boolean).join("\n"),
        1200
    );

    const patch: ItemPatch = {
        target_item_name: targetItemName,
        create_if_missing: wantsCreate,
    };
    if (
        headingCandidate &&
        normalizeForItemMatch(headingCandidate) !==
            normalizeForItemMatch(targetItemName)
    ) {
        patch.name = headingCandidate;
    }
    if (category) patch.category = category;
    if (rarity) patch.rarity = rarity;
    if (description) patch.description = description;
    if (attachments.length > 0) patch.attachments_replace = attachments;

    const hasConcreteChange =
        patch.create_if_missing === true ||
        !!patch.name ||
        !!patch.category ||
        patch.rarity !== undefined ||
        patch.description !== undefined ||
        (patch.attachments_replace?.length ?? 0) > 0;
    return hasConcreteChange ? patch : undefined;
}

function resolveHeuristicTargetCharacterId({
    targetCharacterId,
    clientContext,
    visibleCharacterIds,
    instruction,
    visibleCharacters,
}: {
    targetCharacterId?: string;
    clientContext: ClientContextPayload | null;
    visibleCharacterIds: Set<string>;
    instruction?: string;
    visibleCharacters?: CharacterSummaryRow[];
}) {
    const direct = asTrimmedString(targetCharacterId, 64);
    if (direct && visibleCharacterIds.has(direct)) return direct;

    const selected = asTrimmedString(clientContext?.selectedCharacter?.id, 64);
    if (selected && visibleCharacterIds.has(selected)) return selected;

    if (instruction && visibleCharacters && visibleCharacters.length > 0) {
        const explicitCharacterHint = extractCharacterTargetHintFromInstruction(
            instruction
        );
        if (explicitCharacterHint) {
            const byHint = findCharacterIdFromHint(
                explicitCharacterHint,
                visibleCharacters
            );
            if (byHint && visibleCharacterIds.has(byHint)) return byHint;
        }
        const byName = findMentionedCharacterId(instruction, visibleCharacters);
        if (byName && visibleCharacterIds.has(byName)) return byName;
    }

    if (visibleCharacters && visibleCharacters.length === 1) {
        return visibleCharacters[0].id;
    }
    return undefined;
}

function buildHeuristicItemActions({
    prompt,
    targetCharacterId,
    clientContext,
    visibleCharacters,
    visibleCharacterIds,
}: {
    prompt: string;
    targetCharacterId?: string;
    clientContext: ClientContextPayload | null;
    visibleCharacters: CharacterSummaryRow[];
    visibleCharacterIds: Set<string>;
}): SanitizedAction[] {
    const instruction = extractCurrentUserInstruction(prompt);
    const normalized = normalizeForMatch(instruction);
    const candidatePool = visibleCharacters.flatMap((character) =>
        extractCharacterInventoryItemNames(character)
    );
    const candidateNames = Array.from(
        new Set(
            candidatePool
                .map((entry) => entry.trim())
                .filter((entry) => entry.length > 0)
        )
    );
    const mentionedItemName = findMentionedItemName(instruction, candidateNames);
    const hasMutationVerb =
        normalized.includes("modifica") ||
        normalized.includes("actualiza") ||
        normalized.includes("edita") ||
        normalized.includes("cambia") ||
        normalized.includes("anade") ||
        normalized.includes("añade") ||
        normalized.includes("agrega") ||
        normalized.includes("crea") ||
        normalized.includes("crear") ||
        normalized.includes("add ");
    const hasItemSignal =
        !!mentionedItemName || hasItemKeywordSignal(normalized);
    const hasStructuredCard =
        instruction.includes("\n") || normalized.includes("tengo este objeto");

    if (!hasMutationVerb || !hasItemSignal || !hasStructuredCard) {
        return [];
    }

    const patch = parseStructuredItemPatchFromInstruction({
        instruction,
        candidateItemNames: candidateNames,
    });
    if (!patch) return [];

    let resolvedCharacterId = resolveHeuristicTargetCharacterId({
        targetCharacterId,
        clientContext,
        visibleCharacterIds,
        instruction,
        visibleCharacters,
    });

    if (!resolvedCharacterId) {
        const holders = visibleCharacters.filter((character) =>
            characterHasItemName(character, patch.target_item_name)
        );
        if (holders.length === 1) {
            resolvedCharacterId = holders[0].id;
        } else if (holders.length > 1) {
            resolvedCharacterId = holders[0].id;
        }
    }

    if (!resolvedCharacterId && visibleCharacters.length === 1) {
        resolvedCharacterId = visibleCharacters[0].id;
    }
    if (!resolvedCharacterId) return [];

    return [
        {
            operation: "update",
            characterId: resolvedCharacterId,
            note: "Fallback estructurado para actualización de objeto.",
            data: {
                item_patch: patch,
            },
        },
    ];
}

const STAT_ALIAS_MAP: Record<StatKey, readonly string[]> = {
    str: ["str", "fuerza", "strength"],
    dex: ["dex", "destreza", "dexterity"],
    con: ["con", "constitucion", "constitution"],
    int: ["int", "inteligencia", "intelligence"],
    wis: ["wis", "sabiduria", "wisdom"],
    cha: ["cha", "carisma", "charisma"],
};

function buildAliasRegex(aliases: readonly string[]) {
    return aliases.map((entry) => entry.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
}

function extractQuotedText(value: string, maxLen = 140) {
    const match = value.match(/["“”]([^"\n]{2,220})["“”]/);
    if (!match) return undefined;
    return asTrimmedString(match[1], maxLen);
}

function cleanupEntityName(value: string, maxLen = 140) {
    const cleaned = value
        .replace(/[.,;:]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
    if (!cleaned) return undefined;
    const stopPattern =
        /\b(?:en|al|a|nivel|level|con|para|y|que|where|with)\b/i;
    const stopMatch = cleaned.match(stopPattern);
    const slice = stopMatch && stopMatch.index && stopMatch.index >= 3
        ? cleaned.slice(0, stopMatch.index).trim()
        : cleaned;
    return asTrimmedString(slice, maxLen);
}

function extractNameFromInstruction(value: string, maxLen = 140) {
    const quoted = extractQuotedText(value, maxLen);
    if (quoted) return quoted;

    const calledMatch = value.match(
        /\b(?:llamado|llamada|called|nombre)\s*[:=-]?\s*([^\n,.;]{2,180})/i
    );
    if (calledMatch) {
        const parsed = cleanupEntityName(calledMatch[1], maxLen);
        if (parsed) return parsed;
    }

    return undefined;
}

function parseIntegerFromRegex(value: string, regex: RegExp, min: number, max: number) {
    const match = value.match(regex);
    if (!match) return undefined;
    const captured = match[1] ?? match[2];
    return asInteger(captured, min, max);
}

function parseStatPatchFromInstruction(instruction: string): StatsPatch | undefined {
    const normalized = normalizeForMatch(instruction);
    const patch: StatsPatch = {};
    for (const key of STAT_KEYS) {
        const aliases = STAT_ALIAS_MAP[key];
        const aliasSource = buildAliasRegex(aliases);
        const aliasBefore = new RegExp(
            `\\b(?:${aliasSource})\\b[^\\d\\n]{0,14}(\\d{1,2})`,
            "i"
        );
        const numberBefore = new RegExp(
            `(\\d{1,2})[^\\n]{0,16}\\b(?:${aliasSource})\\b`,
            "i"
        );
        const value =
            parseIntegerFromRegex(normalized, aliasBefore, 1, 30) ??
            parseIntegerFromRegex(normalized, numberBefore, 1, 30);
        if (typeof value === "number") {
            patch[key] = value;
        }
    }
    return Object.keys(patch).length > 0 ? patch : undefined;
}

function parseLevelFromInstruction(instruction: string) {
    return parseIntegerFromRegex(instruction, /\b(?:nivel|level)\s*(\d{1,2})\b/i, 1, 20);
}

function parseExperienceFromInstruction(instruction: string) {
    return parseIntegerFromRegex(
        instruction,
        /\b(?:xp|experiencia|experience)\s*[:=-]?\s*(\d{1,9})\b/i,
        0,
        100000000
    );
}

function parseArmorClassFromInstruction(instruction: string) {
    return parseIntegerFromRegex(
        instruction,
        /\b(?:ca|ac|armor class)\b\s*[:=-]?\s*(\d{1,2})\b/i,
        1,
        60
    );
}

function parseSpeedFromInstruction(instruction: string) {
    return parseIntegerFromRegex(
        instruction,
        /\b(?:velocidad|speed)\b\s*[:=-]?\s*(\d{1,3})\b/i,
        0,
        200
    );
}

function parseHpFromInstruction(instruction: string) {
    const slashMatch = instruction.match(
        /\b(?:hp|vida|puntos?\s+de\s+golpe)\b[^\d\n]{0,12}(\d{1,4})\s*\/\s*(\d{1,4})/i
    );
    if (slashMatch) {
        const currentHp = asInteger(slashMatch[1], 0, 9999);
        const maxHp = asInteger(slashMatch[2], 0, 9999);
        return { currentHp, maxHp };
    }

    const maxHp = parseIntegerFromRegex(
        instruction,
        /\b(?:hp\s*max|max\s*hp|vida\s+maxima|vida\s+máxima)\b\s*[:=-]?\s*(\d{1,4})\b/i,
        0,
        9999
    );
    const currentHp = parseIntegerFromRegex(
        instruction,
        /\b(?:hp\s*actual|vida\s+actual|current\s*hp)\b\s*[:=-]?\s*(\d{1,4})\b/i,
        0,
        9999
    );
    if (typeof currentHp === "number" || typeof maxHp === "number") {
        return { currentHp, maxHp };
    }

    const genericHp = parseIntegerFromRegex(
        instruction,
        /\b(?:hp|vida|puntos?\s+de\s+golpe)\b\s*[:=-]?\s*(\d{1,4})\b/i,
        0,
        9999
    );
    if (typeof genericHp === "number") {
        return { currentHp: genericHp, maxHp: undefined };
    }

    return { currentHp: undefined, maxHp: undefined };
}

function parseClassFromInstruction(instruction: string) {
    const match = instruction.match(/\b(?:clase|class)\b\s*[:=-]?\s*([^\n,.;]{2,120})/i);
    if (!match) return undefined;
    return cleanupEntityName(match[1], 120);
}

function parseRaceFromInstruction(instruction: string) {
    const match = instruction.match(/\b(?:raza|race)\b\s*[:=-]?\s*([^\n,.;]{2,120})/i);
    if (!match) return undefined;
    return cleanupEntityName(match[1], 120);
}

function parseCoreDataPatchFromInstruction(instruction: string) {
    const patch: SanitizedActionData = {};
    const level = parseLevelFromInstruction(instruction);
    const experience = parseExperienceFromInstruction(instruction);
    const armorClass = parseArmorClassFromInstruction(instruction);
    const speed = parseSpeedFromInstruction(instruction);
    const className = parseClassFromInstruction(instruction);
    const race = parseRaceFromInstruction(instruction);
    const { currentHp, maxHp } = parseHpFromInstruction(instruction);
    const stats = parseStatPatchFromInstruction(instruction);

    if (typeof level === "number") patch.level = level;
    if (typeof experience === "number") patch.experience = experience;
    if (typeof armorClass === "number") patch.armor_class = armorClass;
    if (typeof speed === "number") patch.speed = speed;
    if (className) patch.class = className;
    if (race) patch.race = race;
    if (typeof currentHp === "number") patch.current_hp = currentHp;
    if (typeof maxHp === "number") patch.max_hp = maxHp;
    if (stats) patch.stats = stats;

    return patch;
}

function parseDetailsPatchFromInstruction(instruction: string): DetailsPatch | undefined {
    const lines = instruction
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    const patch: DetailsPatch = {};
    const rules: Array<{ key: DetailPatchKey; patterns: RegExp[] }> = [
        {
            key: "notes",
            patterns: [
                /^(?:notas?|notes?)\s*[:=-]\s*(.+)$/i,
                /^(?:anade|añade|agrega|pon|escribe).{0,20}\bnotas?\b\s*[:=-]?\s*(.+)$/i,
            ],
        },
        {
            key: "backstory",
            patterns: [
                /^(?:trasfondo|backstory)\s*[:=-]\s*(.+)$/i,
                /^(?:anade|añade|agrega|pon|escribe).{0,20}\b(?:trasfondo|backstory)\b\s*[:=-]?\s*(.+)$/i,
            ],
        },
        {
            key: "background",
            patterns: [/^(?:background)\s*[:=-]\s*(.+)$/i],
        },
        {
            key: "alignment",
            patterns: [/^(?:alineamiento|alignment)\s*[:=-]\s*(.+)$/i],
        },
        {
            key: "personalityTraits",
            patterns: [/^(?:rasgos?\s+de\s+personalidad|personality\s+traits?)\s*[:=-]\s*(.+)$/i],
        },
        {
            key: "ideals",
            patterns: [/^(?:ideales?|ideals?)\s*[:=-]\s*(.+)$/i],
        },
        {
            key: "bonds",
            patterns: [/^(?:vinculos?|lazos?|bonds?)\s*[:=-]\s*(.+)$/i],
        },
        {
            key: "flaws",
            patterns: [/^(?:defectos?|flaws?)\s*[:=-]\s*(.+)$/i],
        },
        {
            key: "appearance",
            patterns: [/^(?:apariencia|appearance)\s*[:=-]\s*(.+)$/i],
        },
        {
            key: "languages",
            patterns: [/^(?:idiomas?|languages?)\s*[:=-]\s*(.+)$/i],
        },
        {
            key: "proficiencies",
            patterns: [/^(?:proficiencias?|proficiencies?)\s*[:=-]\s*(.+)$/i],
        },
        {
            key: "abilities",
            patterns: [/^(?:habilidades?|abilities?)\s*[:=-]\s*(.+)$/i],
        },
        {
            key: "inventory",
            patterns: [/^(?:inventario|inventory)\s*[:=-]\s*(.+)$/i],
        },
        {
            key: "equipment",
            patterns: [/^(?:equipo|equipment)\s*[:=-]\s*(.+)$/i],
        },
    ];

    for (const rule of rules) {
        for (const line of lines) {
            const match = line.match(rule.patterns[0]) ?? line.match(rule.patterns[1] ?? /$^/);
            if (!match) continue;
            const value = asTrimmedString(match[1], 4000);
            if (value) {
                patch[rule.key] = value;
                break;
            }
        }
    }

    return Object.keys(patch).length > 0 ? patch : undefined;
}

function parseSpellNameFromInstruction(instruction: string) {
    const quoted = extractQuotedText(instruction, 140);
    if (quoted) return quoted;

    const called = instruction.match(
        /\b(?:llamado|llamada|named)\s*[:=-]?\s*([^\n,.;]{2,160})/i
    );
    if (called) {
        const value = cleanupEntityName(called[1], 140);
        if (value) return value;
    }

    const spellLead = instruction.match(
        /\b(?:hechizo|spell|truco|cantrip)\b\s*(?:llamado|llamada|named)?\s*([^\n,.;]{2,160})/i
    );
    if (spellLead) {
        const value = cleanupEntityName(spellLead[1], 140);
        if (value) return value;
    }

    const verbLead = instruction.match(
        /\b(?:aprende|learn|olvida|forget|agrega|añade|anade|quita|remove)\b\s+([^\n,.;]{2,160})/i
    );
    if (verbLead) {
        const value = cleanupEntityName(verbLead[1], 140);
        if (value) return value;
    }

    return undefined;
}

function parseLearnedSpellPatchFromInstruction(
    instruction: string
): LearnedSpellPatch | undefined {
    const normalized = normalizeForMatch(instruction);
    const mentionsSpell =
        normalized.includes("hechizo") ||
        normalized.includes("spell") ||
        normalized.includes("truco") ||
        normalized.includes("cantrip");
    const wantsLearn =
        normalized.includes("aprende") ||
        normalized.includes("learn") ||
        normalized.includes("agrega") ||
        normalized.includes("anade") ||
        normalized.includes("añade");
    const wantsForget =
        normalized.includes("olvida") ||
        normalized.includes("forget") ||
        normalized.includes("quita") ||
        normalized.includes("elimina") ||
        normalized.includes("borra") ||
        normalized.includes("remove");

    if (!mentionsSpell || (!wantsLearn && !wantsForget)) return undefined;
    if (normalized.includes("personalizado") || normalized.includes("custom")) {
        return undefined;
    }

    const spellName = parseSpellNameFromInstruction(instruction);
    if (!spellName) return undefined;

    const explicitLevel = parseIntegerFromRegex(
        instruction,
        /\b(?:nivel|level)\s*(\d)\b/i,
        0,
        9
    );
    const spellLevel =
        typeof explicitLevel === "number"
            ? explicitLevel
            : normalized.includes("truco") || normalized.includes("cantrip")
              ? 0
              : undefined;
    if (typeof spellLevel !== "number") return undefined;

    return {
        action: wantsForget ? "forget" : "learn",
        spell_level: spellLevel,
        spell_name: spellName,
    };
}

function parseCustomSpellPatchFromInstruction(
    instruction: string
): CustomSpellPatch | undefined {
    const normalized = normalizeForMatch(instruction);
    const isCustomIntent =
        normalized.includes("hechizo personalizado") ||
        normalized.includes("custom spell") ||
        normalized.includes("truco personalizado") ||
        normalized.includes("cantrip personalizado");
    if (!isCustomIntent) return undefined;

    const name = parseSpellNameFromInstruction(instruction);
    if (!name) return undefined;
    const level = parseIntegerFromRegex(
        instruction,
        /\b(?:nivel|level)\s*(\d)\b/i,
        0,
        9
    );
    const remove =
        normalized.includes("elimina") ||
        normalized.includes("borra") ||
        normalized.includes("remove");
    const description = parseDetailsPatchFromInstruction(
        instruction.replace(/\b(?:descripcion|descripción|description|efecto)\b/gi, "notes")
    )?.notes;

    const patch: CustomSpellPatch = {
        target_spell_name: name,
    };
    if (typeof level === "number") patch.level = level;
    if (typeof level === "number") {
        patch.collection = level === 0 ? "customCantrips" : "customSpells";
    }
    if (remove) {
        patch.remove = true;
    } else {
        patch.create_if_missing = true;
        patch.name = name;
    }
    if (description) patch.description = description;

    return patch;
}

function parseCustomFeaturePatchFromInstruction(
    instruction: string
): CustomFeaturePatch | undefined {
    const normalized = normalizeForMatch(instruction);
    const isFeatureIntent =
        normalized.includes("rasgo personalizado") ||
        normalized.includes("habilidad personalizada") ||
        normalized.includes("accion personalizada") ||
        normalized.includes("feature personalizado") ||
        normalized.includes("custom feature");
    if (!isFeatureIntent) return undefined;

    const name = extractNameFromInstruction(instruction, 140);
    if (!name) return undefined;

    const remove =
        normalized.includes("elimina") ||
        normalized.includes("borra") ||
        normalized.includes("remove");
    const level = parseIntegerFromRegex(
        instruction,
        /\b(?:nivel|level)\s*(\d{1,2})\b/i,
        0,
        30
    );
    const description = parseDetailsPatchFromInstruction(
        instruction.replace(/\b(?:descripcion|descripción|description|efecto)\b/gi, "notes")
    )?.notes;
    const actionType: FeatureActionType | undefined = normalized.includes("bonus")
        ? "bonus"
        : normalized.includes("reaccion") || normalized.includes("reaction")
          ? "reaction"
          : normalized.includes("pasiva") || normalized.includes("passive")
            ? "passive"
            : normalized.includes("accion") || normalized.includes("action")
              ? "action"
              : undefined;

    const patch: CustomFeaturePatch = {
        target_feature_name: name,
        collection: normalized.includes("rasgo") ? "customTraits" : "customClassAbilities",
    };
    if (remove) {
        patch.remove = true;
    } else {
        patch.create_if_missing = true;
        patch.name = name;
    }
    if (typeof level === "number") patch.level = level;
    if (description) patch.description = description;
    if (actionType) patch.action_type = actionType;
    return patch;
}

function parseSimpleItemPatchFromInstruction({
    instruction,
    candidateItemNames,
}: {
    instruction: string;
    candidateItemNames: string[];
}): ItemPatch | undefined {
    const normalized = normalizeForMatch(instruction);
    const mentionedItem = findMentionedItemName(instruction, candidateItemNames);
    const mutationTargetHint = extractStructuredItemTargetHint(instruction);
    const normalizedTargetHint = mutationTargetHint
        ? normalizeForItemMatch(mutationTargetHint)
        : "";
    const safeTargetHint =
        mutationTargetHint && !isGenericItemReference(normalizedTargetHint)
            ? mutationTargetHint
            : undefined;
    const explicitName = extractNameFromInstruction(instruction, 120);
    const itemName =
        mentionedItem ??
        safeTargetHint ??
        explicitName ??
        cleanupEntityName(
            instruction.match(/\b(?:objeto|item)\b\s*[:=-]?\s*([^\n,.;]{2,140})/i)?.[1] ?? "",
            120
        );

    const wantsEquip =
        normalized.includes("equipa") ||
        normalized.includes("equipar") ||
        normalized.includes("equip ");
    const wantsUnequip =
        normalized.includes("desequipa") ||
        normalized.includes("unequip") ||
        normalized.includes("quitar equipado");

    if ((wantsEquip || wantsUnequip) && itemName) {
        return {
            target_item_name: itemName,
            create_if_missing: false,
            equippable: true,
            equipped: wantsEquip && !wantsUnequip,
        };
    }

    const createVerb =
        normalized.includes("crea") ||
        normalized.includes("crear") ||
        normalized.includes("anade") ||
        normalized.includes("añade") ||
        normalized.includes("agrega") ||
        normalized.includes("inserta") ||
        normalized.includes("mete") ||
        normalized.includes("insert ") ||
        normalized.includes("add");
    const itemSignal =
        normalized.includes("objeto") || normalized.includes("item") || normalized.includes("inventario");
    if (createVerb && itemSignal && itemName) {
        const quantity = parseIntegerFromRegex(
            instruction,
            /\b(?:cantidad|qty|x)\s*[:=-]?\s*(\d{1,3})\b/i,
            0,
            999
        );
        const description = parseDetailsPatchFromInstruction(
            instruction.replace(/\b(?:descripcion|descripción|description)\b/gi, "notes")
        )?.notes;
        const category = normalizeItemCategory(instruction);
        const rarity = parseRarityFromText(instruction);

        const patch: ItemPatch = {
            target_item_name: itemName,
            create_if_missing: true,
        };
        if (typeof quantity === "number") patch.quantity = quantity;
        if (description) patch.description = description;
        if (category) patch.category = category;
        if (rarity) patch.rarity = rarity;
        return patch;
    }

    return undefined;
}

function hasItemKeywordSignal(normalizedInstruction: string) {
    const signals = [
        "objeto",
        "item",
        "inventario",
        "inventory",
        "arma",
        "weapon",
        "armadura",
        "armor",
        "daga",
        "espada",
        "hacha",
        "mazo",
        "arco",
        "ballesta",
        "baston",
        "staff",
        "escudo",
        "shield",
        "yelmo",
        "casco",
        "anillo",
        "amulet",
        "amuleto",
        "capa",
        "pocion",
        "potion",
    ];
    return signals.some((token) => normalizedInstruction.includes(token));
}

function isGenericItemReference(normalizedValue: string) {
    const compact = normalizedValue.replace(/\s+/g, " ").trim();
    return (
        compact === "objeto" ||
        compact === "item" ||
        compact === "este objeto" ||
        compact === "esta objeto" ||
        compact === "ese objeto" ||
        compact === "esa objeto" ||
        compact === "el objeto" ||
        compact === "la objeto" ||
        compact === "esto" ||
        compact === "cosa"
    );
}

function buildHeuristicCreateCharacterActions({
    prompt,
    visibleCharacters,
    targetCharacterId,
    clientContext,
    visibleCharacterIds,
}: {
    prompt: string;
    visibleCharacters: CharacterSummaryRow[];
    targetCharacterId?: string;
    clientContext: ClientContextPayload | null;
    visibleCharacterIds: Set<string>;
}): SanitizedAction[] {
    const instruction = extractCurrentUserInstruction(prompt);
    const normalized = normalizeForMatch(instruction);
    const hasCreateVerb =
        normalized.includes("crea") ||
        normalized.includes("crear") ||
        normalized.includes("create");
    const createsCharacterSignal =
        normalized.includes("personaje") ||
        normalized.includes("character") ||
        normalized.includes("companion") ||
        normalized.includes("companero") ||
        normalized.includes("compañero") ||
        normalized.includes("familiar");
    if (!hasCreateVerb || !createsCharacterSignal) return [];

    const isCompanion =
        normalized.includes("companion") ||
        normalized.includes("familiar") ||
        normalized.includes("companero") ||
        normalized.includes("compañero");

    let name = extractNameFromInstruction(instruction, 120);
    if (!name) {
        const leadMatch = instruction.match(
            /\b(?:companion|companero|compañero|familiar|personaje|character)\b\s+([^\n,.;]{2,140})/i
        );
        if (leadMatch) {
            name = cleanupEntityName(leadMatch[1], 120);
        }
    }
    if (!name) return [];

    const core = parseCoreDataPatchFromInstruction(instruction);
    const ownerCharacterId = resolveHeuristicTargetCharacterId({
        targetCharacterId,
        clientContext,
        visibleCharacterIds,
        instruction,
        visibleCharacters,
    });
    const ownerCharacter = ownerCharacterId
        ? visibleCharacters.find((entry) => entry.id === ownerCharacterId)
        : undefined;

    const actionData: SanitizedActionData = {
        name,
        character_type: isCompanion ? "companion" : "character",
    };
    if (core.class !== undefined) actionData.class = core.class;
    if (core.race !== undefined) actionData.race = core.race;
    if (typeof core.level === "number") actionData.level = core.level;
    if (typeof core.experience === "number") actionData.experience = core.experience;
    if (typeof core.current_hp === "number") actionData.current_hp = core.current_hp;
    if (typeof core.max_hp === "number") actionData.max_hp = core.max_hp;
    if (typeof core.armor_class === "number") actionData.armor_class = core.armor_class;
    if (typeof core.speed === "number") actionData.speed = core.speed;
    if (core.stats) actionData.stats = core.stats;
    if (ownerCharacter?.user_id) actionData.user_id = ownerCharacter.user_id;

    return [
        {
            operation: "create",
            data: actionData,
            note: isCompanion
                ? "Creación heurística de companion."
                : "Creación heurística de personaje.",
        },
    ];
}

function buildHeuristicUpdateCharacterActions({
    prompt,
    visibleCharacters,
    targetCharacterId,
    clientContext,
    visibleCharacterIds,
}: {
    prompt: string;
    visibleCharacters: CharacterSummaryRow[];
    targetCharacterId?: string;
    clientContext: ClientContextPayload | null;
    visibleCharacterIds: Set<string>;
}): SanitizedAction[] {
    const instruction = extractCurrentUserInstruction(prompt);
    const normalized = normalizeForMatch(instruction);
    const mutationVerb =
        normalized.includes("modifica") ||
        normalized.includes("actualiza") ||
        normalized.includes("edita") ||
        normalized.includes("cambia") ||
        normalized.includes("inserta") ||
        normalized.includes("quita") ||
        normalized.includes("elimina") ||
        normalized.includes("borra") ||
        normalized.includes("pon ") ||
        normalized.includes("set ") ||
        normalized.includes("anade") ||
        normalized.includes("añade") ||
        normalized.includes("agrega") ||
        normalized.includes("crea") ||
        normalized.includes("crear") ||
        normalized.includes("add ") ||
        normalized.includes("insert ") ||
        normalized.includes("remove ") ||
        normalized.includes("delete ") ||
        normalized.includes("aprende") ||
        normalized.includes("olvida") ||
        normalized.includes("equipa") ||
        normalized.includes("desequipa") ||
        normalized.includes("equip ") ||
        normalized.includes("unequip");
    if (!mutationVerb) return [];

    const resolvedCharacterId = resolveHeuristicTargetCharacterId({
        targetCharacterId,
        clientContext,
        visibleCharacterIds,
        instruction,
        visibleCharacters,
    });
    if (!resolvedCharacterId) return [];

    const targetCharacter = visibleCharacters.find(
        (character) => character.id === resolvedCharacterId
    );
    const itemCandidatePool = [
        ...(targetCharacter ? extractCharacterInventoryItemNames(targetCharacter) : []),
        ...visibleCharacters.flatMap((character) =>
            extractCharacterInventoryItemNames(character)
        ),
    ];
    const itemCandidates = Array.from(
        new Set(itemCandidatePool.map((entry) => entry.trim()).filter(Boolean))
    );

    const data: SanitizedActionData = {};
    const core = parseCoreDataPatchFromInstruction(instruction);
    if (core.class !== undefined) data.class = core.class;
    if (core.race !== undefined) data.race = core.race;
    if (typeof core.level === "number") data.level = core.level;
    if (typeof core.experience === "number") data.experience = core.experience;
    if (typeof core.current_hp === "number") data.current_hp = core.current_hp;
    if (typeof core.max_hp === "number") data.max_hp = core.max_hp;
    if (typeof core.armor_class === "number") data.armor_class = core.armor_class;
    if (typeof core.speed === "number") data.speed = core.speed;
    if (core.stats) data.stats = core.stats;

    const detailsPatch = parseDetailsPatchFromInstruction(instruction);
    if (detailsPatch) data.details_patch = detailsPatch;

    const structuredItemActions = buildHeuristicItemActions({
        prompt,
        targetCharacterId: resolvedCharacterId,
        clientContext,
        visibleCharacters,
        visibleCharacterIds,
    });
    if (structuredItemActions.length > 0) {
        const itemPatch = structuredItemActions[0].data.item_patch;
        if (itemPatch) data.item_patch = itemPatch;
    } else {
        const simpleItemPatch = parseSimpleItemPatchFromInstruction({
            instruction,
            candidateItemNames: itemCandidates,
        });
        if (simpleItemPatch) data.item_patch = simpleItemPatch;
    }

    const learnedSpellPatch = parseLearnedSpellPatchFromInstruction(instruction);
    if (learnedSpellPatch) data.learned_spell_patch = learnedSpellPatch;

    const customSpellPatch = parseCustomSpellPatchFromInstruction(instruction);
    if (customSpellPatch) data.custom_spell_patch = customSpellPatch;

    const customFeaturePatch = parseCustomFeaturePatchFromInstruction(instruction);
    if (customFeaturePatch) data.custom_feature_patch = customFeaturePatch;

    if (!hasWriteFields(data)) return [];

    return [
        {
            operation: "update",
            characterId: resolvedCharacterId,
            data,
            note: "Actualización heurística local.",
        },
    ];
}

function buildHeuristicMutationPlan({
    prompt,
    visibleCharacters,
    targetCharacterId,
    clientContext,
    visibleCharacterIds,
}: {
    prompt: string;
    visibleCharacters: CharacterSummaryRow[];
    targetCharacterId?: string;
    clientContext: ClientContextPayload | null;
    visibleCharacterIds: Set<string>;
}) {
    const createActions = buildHeuristicCreateCharacterActions({
        prompt,
        visibleCharacters,
        targetCharacterId,
        clientContext,
        visibleCharacterIds,
    });
    if (createActions.length > 0) {
        return {
            actions: createActions,
            reply: "He preparado una propuesta local para crear el personaje/companion.",
        };
    }

    const itemActions = buildHeuristicItemActions({
        prompt,
        targetCharacterId,
        clientContext,
        visibleCharacters,
        visibleCharacterIds,
    });
    if (itemActions.length > 0) {
        return {
            actions: itemActions,
            reply: "He preparado una propuesta directa para ese objeto usando el texto estructurado.",
        };
    }

    const updateActions = buildHeuristicUpdateCharacterActions({
        prompt,
        visibleCharacters,
        targetCharacterId,
        clientContext,
        visibleCharacterIds,
    });
    if (updateActions.length > 0) {
        return {
            actions: updateActions,
            reply: "He preparado una propuesta local para aplicar esos cambios.",
        };
    }

    return null;
}

function isNoConcreteChangeReply(reply: string) {
    const normalized = normalizeForMatch(reply);
    return (
        normalized.includes("no encontre cambios concretos") ||
        normalized.includes("no hubo cambios concretos") ||
        normalized.includes("no encontre cambios para aplicar")
    );
}

function describeUIContextHint(clientContext?: ClientContextPayload | null) {
    if (!clientContext) return null;
    const parts: string[] = [];
    if (clientContext.surface) {
        parts.push(
            clientContext.surface === "dm"
                ? "Vista actual: panel DM."
                : "Vista actual: panel de jugador."
        );
    }
    if (clientContext.section) {
        parts.push(`Sección activa: ${clientContext.section}.`);
    }
    if (clientContext.activeTab) {
        parts.push(`Pestaña activa: ${clientContext.activeTab}.`);
    }
    if (clientContext.selectedCharacter?.name) {
        parts.push(
            `Personaje seleccionado: ${clientContext.selectedCharacter.name}.`
        );
    }
    return parts.length > 0 ? parts.join(" ") : null;
}

function buildCapabilitiesReply(
    role: CampaignRole,
    clientContext?: ClientContextPayload | null
) {
    const ownerScope =
        role === "DM"
            ? "Puedo editar personajes de toda la campaña."
            : "Puedo editar solo tus personajes.";
    const uiHint = describeUIContextHint(clientContext);

    const lines = [
        "Puedo ayudarte con cambios en personajes de la campaña.",
        ownerScope,
        "Para decidir mejor, puedo usar el contexto de la pantalla que tienes abierta (sección, pestaña y personaje seleccionado).",
        "Acciones que puedo aplicar ahora:",
        "- Crear personaje o companion con nombre, clase, raza, nivel, hp, CA y velocidad.",
        "- Actualizar stats (str/dex/con/int/wis/cha).",
        "- Actualizar detalles como notas, trasfondo, alineamiento, idiomas, inventario y equipo.",
        "- Editar objetos del inventario por nombre y añadir rasgos/habilidades como adjuntos del objeto (trait/ability).",
        "- Crear/editar hechizos personalizados y cantrips con su estructura completa (coste, tirada/salvación, daño, componentes).",
        "- Crear/editar rasgos y habilidades personalizadas (incluye acciones, requisitos, efecto y recursos).",
        "- Aprender u olvidar hechizos por nivel en la lista de hechizos del personaje.",
        "Ejemplos:",
        "- \"Crea un companion lobo nivel 2 para mi personaje.\"",
        "- \"Sube mi personaje a nivel 5 y pon 16 en DEX.\"",
        "- \"Añade en notas: desconfía de los magos rojos.\"",
        "- \"Modifica el yelmo del primer forjador y añade sus rasgos como habilidades del objeto.\"",
        "- \"Crea un hechizo personalizado nivel 2 llamado Lanza de Ceniza con daño 3d6 fuego.\"",
        "- \"Añade una acción personalizada llamada Rugido de Guerra con recarga corta.\"",
    ];
    if (uiHint) lines.push(`Contexto detectado: ${uiHint}`);
    return lines.join("\n");
}

function buildChatGuidanceReply(
    role: CampaignRole,
    clientContext?: ClientContextPayload | null
) {
    const scopeHint =
        role === "DM"
            ? "Como DM, puedes pedirme cambios para cualquier personaje de la campaña."
            : "Como jugador, puedo modificar solo tus personajes.";
    const uiHint = describeUIContextHint(clientContext);

    const lines = [
        "Puedo ayudarte con acciones concretas sobre personajes.",
        scopeHint,
        "También uso el contexto de la pantalla para inferir mejor dónde quieres aplicar cambios.",
        "Prueba con instrucciones como:",
        "- \"Sube a nivel 4 a Aria y pon 14 en CON.\"",
        "- \"Añade en notas: teme a los no-muertos.\"",
        "- \"Crea un companion halcón nivel 1.\"",
        "- \"Actualiza el objeto Yelmo del Primer Forjador y guarda sus rasgos como attachments.\"",
        "- \"Añade el hechizo Bola de Fuego al nivel 3 de hechizos aprendidos.\"",
        "- \"Crea una habilidad personalizada llamada Golpe Sísmico con 3 cargas.\"",
    ];
    if (uiHint) lines.push(`Contexto detectado: ${uiHint}`);
    return lines.join("\n");
}

function buildAssistantProductKnowledge({
    role,
    clientContext,
}: {
    role: CampaignRole;
    clientContext: ClientContextPayload | null;
}) {
    const roleScope =
        role === "DM"
            ? "DM puede editar cualquier personaje de la campaña."
            : "PLAYER solo puede editar sus propios personajes.";

    const uiFlows =
        clientContext?.surface === "dm"
            ? [
                  "DM sections: players, story, bestiary, characters.",
                  "Si la sección activa es players, priorizar cambios en personajes.",
              ]
            : [
                  "Player workspace: lista de personajes + panel derecho.",
                  "El personaje seleccionado suele ser el objetivo por defecto.",
              ];

    return {
        roleScope,
        supportedMutations: [
            "create/update character",
            "create/update companion",
            "update stats",
            "update details_patch: notes/background/alignment/personalityTraits/ideals/bonds/flaws/appearance/backstory/languages/proficiencies/abilities/inventory/equipment",
            "update item_patch: target_item_name + category/rarity/equipped/description/tags/attachments",
            "update learned_spell_patch: learn/forget by spell_level + spell_name/spell_index",
            "update custom_spell_patch: create/update/delete customSpells/customCantrips",
            "update custom_feature_patch: create/update/delete customTraits/customClassAbilities",
        ],
        orderPatterns: [
            "crear/añadir/agregar/insertar",
            "modificar/actualizar/editar/cambiar",
            "subir/bajar nivel o stats",
            "aprender/olvidar hechizos",
            "equipar/desequipar objetos",
            "crear/editar contenido personalizado",
            "targeting por 'en X'/'para X'/'a X' o por personaje seleccionado",
        ],
        uiFlows,
        decisionHints: [
            "Si el usuario no indica personaje pero hay uno seleccionado en clientContext, usarlo como objetivo.",
            "Si el usuario escribe 'en NOMBRE', priorizar ese personaje como objetivo.",
            "Priorizar cambios concretos y mínimos; evitar acciones ambiguas.",
            "No inventar IDs; usar solo visibles en context.visibleCharacters.",
            "Si la petición incluye un bloque largo de objeto, extraer título, rareza, descripción y rasgos.",
            "Si la orden es añadir/crear objeto y no existe en inventario, usar item_patch.create_if_missing=true.",
            "Si el usuario describe rasgos o habilidades de un objeto, convertirlos en attachments del item con type ability/trait.",
            "Si el usuario pide crear/editar un hechizo personalizado, usar custom_spell_patch (no texto plano).",
            "Si pide rasgos/habilidades/acciones personalizadas, usar custom_feature_patch.",
            "Si pide aprender/olvidar un hechizo de nivel, usar learned_spell_patch.",
        ],
        clientContext,
    };
}

function canAccessNote(note: NoteRow, role: CampaignRole, userId: string) {
    if (role === "DM") return true;
    const visibility = String(note.visibility ?? "CAMPAIGN").toUpperCase();
    if (visibility === "PUBLIC" || visibility === "CAMPAIGN") return true;
    if (visibility === "PRIVATE" && note.author_id === userId) return true;
    return false;
}

function safeJsonSnippet(value: unknown, maxLen = 900) {
    try {
        const raw = JSON.stringify(value);
        if (!raw) return "";
        return raw.length > maxLen ? `${raw.slice(0, maxLen)}...` : raw;
    } catch {
        return "";
    }
}

function buildItemsSummaryForRag(details: unknown) {
    if (!isRecord(details) || !Array.isArray(details.items)) return "";
    const parts: string[] = [];
    for (const rawItem of details.items) {
        if (!isRecord(rawItem)) continue;
        const name = asTrimmedString(rawItem.name, 120);
        if (!name) continue;
        const category = asTrimmedString(rawItem.category, 40) ?? "misc";
        const rarity = asTrimmedString(rawItem.rarity, 80);
        const equipped = rawItem.equipped === true ? "equipado" : "inventario";
        const attachments = Array.isArray(rawItem.attachments)
            ? rawItem.attachments
            : [];
        const attachmentNames = attachments
            .map((entry) => (isRecord(entry) ? asTrimmedString(entry.name, 80) : undefined))
            .filter((entry): entry is string => !!entry)
            .slice(0, 4);
        const base = [
            `item=${name}`,
            `cat=${category}`,
            `estado=${equipped}`,
            rarity ? `rareza=${rarity}` : null,
            attachmentNames.length > 0
                ? `adjuntos=${attachmentNames.join(", ")}`
                : null,
        ]
            .filter(Boolean)
            .join(";");
        parts.push(base);
        if (parts.length >= 8) break;
    }
    return parts.join(" | ");
}

function buildCustomEntriesSummaryForRag(details: unknown) {
    if (!isRecord(details)) return "";
    const groups: string[] = [];
    const pushGroup = (key: string, label: string, max = 8) => {
        const raw = details[key];
        if (!Array.isArray(raw)) return;
        const names = raw
            .map((entry) => (isRecord(entry) ? asTrimmedString(entry.name, 120) : undefined))
            .filter((entry): entry is string => !!entry)
            .slice(0, max);
        if (names.length > 0) {
            groups.push(`${label}=${names.join(", ")}`);
        }
    };

    pushGroup("customSpells", "customSpells");
    pushGroup("customCantrips", "customCantrips");
    pushGroup("customTraits", "customTraits");
    pushGroup("customClassAbilities", "customClassAbilities");
    return groups.join(" | ");
}

function buildInventorySnapshotForModel(details: unknown) {
    if (!isRecord(details) || !Array.isArray(details.items)) return [] as Array<Record<string, unknown>>;
    const out: Array<Record<string, unknown>> = [];
    for (const rawItem of details.items) {
        if (!isRecord(rawItem)) continue;
        const name = asTrimmedString(rawItem.name, 120);
        if (!name) continue;

        const category = asTrimmedString(rawItem.category, 40) ?? "misc";
        const rarity = asTrimmedString(rawItem.rarity, 80) ?? null;
        const quantity = asInteger(rawItem.quantity, 0, 999);
        const equipped = rawItem.equipped === true;
        const equippable = rawItem.equippable === true;
        const attachmentNames =
            Array.isArray(rawItem.attachments)
                ? rawItem.attachments
                      .map((entry) =>
                          isRecord(entry) ? asTrimmedString(entry.name, 100) : undefined
                      )
                      .filter((entry): entry is string => !!entry)
                      .slice(0, 8)
                : [];

        out.push({
            name,
            category,
            rarity,
            equipped,
            equippable,
            quantity: typeof quantity === "number" ? quantity : undefined,
            attachmentNames,
        });
        if (out.length >= 14) break;
    }
    return out;
}

function buildCharacterText(character: CharacterSummaryRow) {
    const detailsText = safeJsonSnippet(character.details ?? null, 900);
    const statsText = safeJsonSnippet(character.stats ?? null, 220);
    const itemsText = buildItemsSummaryForRag(character.details);
    const customEntriesText = buildCustomEntriesSummaryForRag(character.details);
    const chunks = [
        `Nombre: ${character.name}`,
        `Clase: ${character.class ?? "sin clase"}`,
        `Raza: ${character.race ?? "sin raza"}`,
        `Nivel: ${character.level ?? 1}`,
        `Tipo: ${character.character_type ?? "character"}`,
        `CA: ${character.armor_class ?? "?"}`,
        `Velocidad: ${character.speed ?? "?"}`,
        `PV actuales/max: ${character.current_hp ?? "?"}/${character.max_hp ?? "?"}`,
    ];
    if (statsText) chunks.push(`Stats: ${statsText}`);
    if (itemsText) chunks.push(`Items: ${itemsText}`);
    if (customEntriesText) chunks.push(`Custom: ${customEntriesText}`);
    if (detailsText) chunks.push(`Detalles: ${detailsText}`);
    return chunks.join(" | ");
}

function scoreRagDocument({
    doc,
    promptNormalized,
    promptTokens,
    targetCharacterId,
}: {
    doc: RagDocument;
    promptNormalized: string;
    promptTokens: string[];
    targetCharacterId?: string;
}) {
    const haystack = normalizeForMatch(`${doc.title} ${doc.text}`);
    let score = doc.priority;

    if (targetCharacterId && doc.id.includes(targetCharacterId)) {
        score += 55;
    }

    const titleNormalized = normalizeForMatch(doc.title);
    if (titleNormalized && promptNormalized.includes(titleNormalized)) {
        score += 20;
    }

    for (const token of promptTokens) {
        if (haystack.includes(token)) {
            score += token.length >= 5 ? 6 : 3;
        }
    }

    if (doc.sourceType === "character" && promptNormalized.includes("personaje")) {
        score += 4;
    }
    if (doc.sourceType === "note" && promptNormalized.includes("nota")) {
        score += 4;
    }

    return score;
}

function buildRagSnippets({
    prompt,
    targetCharacterId,
    campaign,
    visibleCharacters,
    notes,
    topK,
    docMaxChars,
}: {
    prompt: string;
    targetCharacterId?: string;
    campaign: CampaignRow | null;
    visibleCharacters: CharacterSummaryRow[];
    notes: NoteRow[];
    topK: number;
    docMaxChars: number;
}) {
    const docs: RagDocument[] = [];
    if (campaign) {
        docs.push({
            id: `campaign:${campaign.id}`,
            sourceType: "campaign",
            title: campaign.name?.trim() || "Campaña",
            text: `${campaign.description ?? ""} | Código: ${campaign.invite_code ?? ""}`,
            priority: 8,
        });
    }

    for (const character of visibleCharacters) {
        docs.push({
            id: `character:${character.id}`,
            sourceType: "character",
            title: character.name,
            text: buildCharacterText(character),
            priority: character.id === targetCharacterId ? 18 : 6,
        });
    }

    for (const note of notes) {
        const title = note.title?.trim() || "Nota";
        const text = `${title}\n${note.content ?? ""}`;
        docs.push({
            id: `note:${note.id}`,
            sourceType: "note",
            title,
            text,
            priority: 4,
        });
    }

    const promptNormalized = normalizeForMatch(prompt);
    const promptTokens = tokenizeForMatch(prompt);

    const ranked = docs
        .map((doc) => ({
            doc,
            score: scoreRagDocument({
                doc,
                promptNormalized,
                promptTokens,
                targetCharacterId,
            }),
        }))
        .filter((entry) => entry.score > 0 || entry.doc.priority >= 12)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map((entry) => {
            const excerpt =
                entry.doc.text.length > docMaxChars
                    ? `${entry.doc.text.slice(0, docMaxChars)}...`
                    : entry.doc.text;
            return {
                id: entry.doc.id,
                sourceType: entry.doc.sourceType,
                title: entry.doc.title,
                score: entry.score,
                excerpt,
            } satisfies RagSnippet;
        });

    return ranked;
}

async function requestAssistantPlanOpenAI({
    apiKey,
    model,
    prompt,
    context,
    timeoutMs,
}: {
    apiKey: string;
    model: string;
    prompt: string;
    context: Record<string, unknown>;
    timeoutMs: number;
}) {
    const body = {
        model,
        temperature: 0.2,
        messages: [
            { role: "system", content: buildAssistantSystemPrompt() },
            {
                role: "user",
                content: JSON.stringify(
                    {
                        user_request: prompt,
                        context,
                    },
                    null,
                    2
                ),
            },
        ],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "campaign_assistant_plan",
                strict: true,
                schema: ASSISTANT_PLAN_SCHEMA,
            },
        },
    };

    const timer = withTimeout(timeoutMs);
    let response: Response;
    try {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
            signal: timer.signal,
        });
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            throw new Error(
                `OpenAI tardó demasiado en responder (${timeoutMs}ms).`
            );
        }
        throw error;
    } finally {
        timer.clear();
    }

    const payload = (await response.json().catch(() => null)) as OpenAIResponse | null;

    if (!response.ok) {
        const message = payload?.error?.message ?? `OpenAI error (${response.status}).`;
        throw new Error(message);
    }

    const content = extractModelContent(payload?.choices?.[0]?.message?.content);
    if (!content) {
        throw new Error("El modelo no devolvió contenido utilizable.");
    }
    return parseAssistantPlan(content);
}

async function requestAssistantPlanGemini({
    apiKey,
    model,
    prompt,
    context,
    timeoutMs,
}: {
    apiKey: string;
    model: string;
    prompt: string;
    context: Record<string, unknown>;
    timeoutMs: number;
}) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = {
        systemInstruction: {
            role: "system",
            parts: [{ text: buildAssistantSystemPrompt() }],
        },
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: JSON.stringify(
                            {
                                user_request: prompt,
                                context,
                            },
                            null,
                            2
                        ),
                    },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
        },
    };

    let response: Response;
    const timer = withTimeout(timeoutMs);
    try {
        response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            signal: timer.signal,
        });
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            throw new Error(`Gemini tardó demasiado en responder (${timeoutMs}ms).`);
        }
        throw new Error("No se pudo conectar con Gemini.");
    } finally {
        timer.clear();
    }

    const payload = (await response.json().catch(() => null)) as
        | GeminiGenerateContentResponse
        | null;
    if (!response.ok) {
        const message = payload?.error?.message ?? `Gemini error (${response.status}).`;
        throw new Error(message);
    }

    const parts = payload?.candidates?.[0]?.content?.parts;
    const content = Array.isArray(parts)
        ? parts
              .map((part) => (typeof part?.text === "string" ? part.text : ""))
              .join("\n")
              .trim()
        : "";
    if (!content) {
        throw new Error("Gemini no devolvió contenido utilizable.");
    }

    return parseAssistantPlan(content);
}

async function requestAssistantPlanOllama({
    baseUrl,
    model,
    prompt,
    context,
    timeoutMs,
    numPredict,
    numCtx,
}: {
    baseUrl: string;
    model: string;
    prompt: string;
    context: Record<string, unknown>;
    timeoutMs: number;
    numPredict: number;
    numCtx: number;
}) {
    const endpoint = `${baseUrl.replace(/\/$/, "")}/api/chat`;
    const body = {
        model,
        stream: false,
        format: "json",
        options: {
            temperature: 0.2,
            num_predict: numPredict,
            num_ctx: numCtx,
        },
        messages: [
            { role: "system", content: buildAssistantSystemPrompt() },
            {
                role: "user",
                content: JSON.stringify(
                    {
                        user_request: prompt,
                        context,
                    },
                    null,
                    2
                ),
            },
        ],
    };

    let response: Response;
    const timer = withTimeout(timeoutMs);
    try {
        response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            signal: timer.signal,
        });
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            throw new Error(
                `Ollama tardó demasiado en responder (${timeoutMs}ms). Sube OLLAMA_TIMEOUT_MS (ejemplo: 90000).`
            );
        }
        throw new Error(
            `No se pudo conectar con Ollama en ${endpoint}. Inicia Ollama y verifica OLLAMA_BASE_URL.`
        );
    } finally {
        timer.clear();
    }

    const payload = (await response.json().catch(() => null)) as OllamaChatResponse | null;
    if (!response.ok) {
        const message =
            payload?.error ??
            `Ollama error (${response.status}). Verifica que el modelo esté descargado.`;
        throw new Error(message);
    }

    const content = asTrimmedString(payload?.message?.content, 20000);
    if (!content) {
        throw new Error("Ollama no devolvió contenido utilizable.");
    }

    return parseAssistantPlan(content);
}

async function requestAssistantPlan({
    providerPreference,
    enableLocalFallback,
    prompt,
    context,
    openai,
    gemini,
    ollama,
}: {
    providerPreference: AIProviderPreference;
    enableLocalFallback: boolean;
    prompt: string;
    context: Record<string, unknown>;
    openai: {
        apiKey?: string;
        model: string;
        timeoutMs: number;
    };
    gemini: {
        apiKey?: string;
        model: string;
        timeoutMs: number;
    };
    ollama: {
        baseUrl: string;
        model: string;
        timeoutMs: number;
        numPredict: number;
        numCtx: number;
    };
}) {
    const order: AIProvider[] = [];
    if (providerPreference === "gemini") {
        order.push("gemini");
        if (enableLocalFallback) order.push("ollama");
    } else if (providerPreference === "openai") {
        order.push("openai");
        if (enableLocalFallback) order.push("ollama");
    } else if (providerPreference === "ollama") {
        order.push("ollama");
    } else {
        if (gemini.apiKey) order.push("gemini");
        if (openai.apiKey) order.push("openai");
        order.push("ollama");
    }

    const errors: string[] = [];
    for (const provider of Array.from(new Set(order))) {
        try {
            if (provider === "openai") {
                if (!openai.apiKey) {
                    throw new Error("Falta OPENAI_API_KEY.");
                }
                const plan = await requestAssistantPlanOpenAI({
                    apiKey: openai.apiKey,
                    model: openai.model,
                    prompt,
                    context,
                    timeoutMs: openai.timeoutMs,
                });
                return { plan, provider };
            }
            if (provider === "gemini") {
                if (!gemini.apiKey) {
                    throw new Error("Falta GEMINI_API_KEY.");
                }
                const plan = await requestAssistantPlanGemini({
                    apiKey: gemini.apiKey,
                    model: gemini.model,
                    prompt,
                    context,
                    timeoutMs: gemini.timeoutMs,
                });
                return { plan, provider };
            }

            const plan = await requestAssistantPlanOllama({
                baseUrl: ollama.baseUrl,
                model: ollama.model,
                prompt,
                context,
                timeoutMs: ollama.timeoutMs,
                numPredict: ollama.numPredict,
                numCtx: ollama.numCtx,
            });
            return { plan, provider };
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Error desconocido";
            errors.push(`${provider}: ${message}`);
        }
    }

    throw new Error(`No se pudo obtener respuesta del asistente. ${errors.join(" | ")}`);
}

async function loadCampaignContext({
    adminClient,
    campaignId,
    role,
    userId,
}: {
    adminClient: SupabaseClient;
    campaignId: string;
    role: CampaignRole;
    userId: string;
}) {
    const [membersRes, charactersRes, campaignRes, notesRes] = await Promise.all([
        adminClient
            .from("campaign_members")
            .select("user_id, role")
            .eq("campaign_id", campaignId),
        adminClient
            .from("characters")
            .select(
                "id, user_id, name, class, race, level, character_type, max_hp, current_hp, armor_class, speed, stats, details"
            )
            .eq("campaign_id", campaignId),
        adminClient
            .from("campaigns")
            .select("id, name, description, invite_code")
            .eq("id", campaignId)
            .maybeSingle(),
        adminClient
            .from("notes")
            .select("id, title, content, visibility, author_id")
            .eq("campaign_id", campaignId)
            .order("updated_at", { ascending: false })
            .limit(120),
    ]);

    if (membersRes.error) {
        throw new Error(membersRes.error.message);
    }
    if (charactersRes.error) {
        throw new Error(charactersRes.error.message);
    }
    const members = (membersRes.data ?? []) as CampaignMemberRow[];
    const characters = (charactersRes.data ?? []) as CharacterSummaryRow[];
    if (campaignRes.error) {
        console.warn("assistant.loadCampaignContext campaign warn:", campaignRes.error.message);
    }
    if (notesRes.error) {
        console.warn("assistant.loadCampaignContext notes warn:", notesRes.error.message);
    }

    const campaign = (campaignRes.error ? null : campaignRes.data ?? null) as CampaignRow | null;
    const rawNotes = (notesRes.error ? [] : notesRes.data ?? []) as NoteRow[];
    const notes = rawNotes.filter((note) => canAccessNote(note, role, userId));

    return { members, characters, campaign, notes };
}

function hasWriteFields(data: SanitizedActionData) {
    return (
        Object.keys(data).length > 0 &&
        Object.keys(data).some((key) => key !== "user_id")
    );
}

async function applyActions({
    adminClient,
    campaignId,
    userId,
    role,
    members,
    visibleCharacterIds,
    actions,
}: {
    adminClient: SupabaseClient;
    campaignId: string;
    userId: string;
    role: CampaignRole;
    members: CampaignMemberRow[];
    visibleCharacterIds: Set<string>;
    actions: SanitizedAction[];
}) {
    const isDm = role === "DM";
    const memberIds = new Set(members.map((member) => member.user_id));
    const results: MutationResult[] = [];

    for (const action of actions) {
        if (action.operation === "create") {
            const data = action.data;
            if (!data.name) {
                results.push({
                    operation: "create",
                    status: "skipped",
                    message: "Se omitió create porque falta el nombre.",
                });
                continue;
            }

            let ownerId = userId;
            if (data.user_id && data.user_id !== userId) {
                if (!isDm) {
                    results.push({
                        operation: "create",
                        status: "blocked",
                        message:
                            "No tienes permisos para crear personajes para otro usuario.",
                    });
                    continue;
                }
                if (!memberIds.has(data.user_id)) {
                    results.push({
                        operation: "create",
                        status: "blocked",
                        message: "El owner solicitado no pertenece a la campaña.",
                    });
                    continue;
                }
                ownerId = data.user_id;
            }

            const level = data.level ?? 1;
            const maxHp = typeof data.max_hp === "number" ? data.max_hp : null;
            let currentHp =
                typeof data.current_hp === "number" ? data.current_hp : null;
            if (typeof maxHp === "number" && typeof currentHp === "number") {
                currentHp = Math.min(currentHp, maxHp);
            }

            const createPayload: Record<string, unknown> = {
                campaign_id: campaignId,
                user_id: ownerId,
                name: data.name,
                class: data.class ?? null,
                race: data.race ?? null,
                level,
                experience: data.experience ?? 0,
                armor_class:
                    typeof data.armor_class === "number"
                        ? data.armor_class
                        : 10,
                speed: typeof data.speed === "number" ? data.speed : 30,
                character_type: data.character_type ?? "character",
                stats: mergeStats(null, data.stats) ?? normalizeStats(null),
                details: mergeDetails({}, data.details_patch) ?? {},
            };

            if (maxHp !== null) createPayload.max_hp = maxHp;
            if (currentHp !== null) createPayload.current_hp = currentHp;

            const { data: inserted, error } = await adminClient
                .from("characters")
                .insert(createPayload)
                .select("id")
                .maybeSingle();

            if (error) {
                results.push({
                    operation: "create",
                    status: "error",
                    message: error.message,
                });
                continue;
            }

            results.push({
                operation: "create",
                characterId:
                    inserted && isRecord(inserted) && typeof inserted.id === "string"
                        ? inserted.id
                        : undefined,
                status: "applied",
                message: `Personaje "${data.name}" creado.`,
            });
            continue;
        }

        const characterId = asTrimmedString(action.characterId, 64);
        if (!characterId) {
            results.push({
                operation: "update",
                status: "skipped",
                message: "Se omitió update porque falta characterId.",
            });
            continue;
        }

        if (!visibleCharacterIds.has(characterId)) {
            results.push({
                operation: "update",
                characterId,
                status: "blocked",
                message: "No tienes acceso a este personaje.",
            });
            continue;
        }

        const { data: existing, error: fetchError } = await adminClient
            .from("characters")
            .select("id, user_id, name, stats, details")
            .eq("id", characterId)
            .eq("campaign_id", campaignId)
            .maybeSingle();

        if (fetchError) {
            results.push({
                operation: "update",
                characterId,
                status: "error",
                message: fetchError.message,
            });
            continue;
        }
        if (!existing) {
            results.push({
                operation: "update",
                characterId,
                status: "skipped",
                message: "No existe ese personaje en la campaña.",
            });
            continue;
        }

        const row = existing as CharacterMutationRow;
        if (!isDm && row.user_id !== userId) {
            results.push({
                operation: "update",
                characterId,
                status: "blocked",
                message: "No puedes editar personajes de otros usuarios.",
            });
            continue;
        }

        const data = action.data;
        if (!hasWriteFields(data)) {
            results.push({
                operation: "update",
                characterId,
                status: "skipped",
                message: "No se detectaron campos editables para actualizar.",
            });
            continue;
        }

        const updatePayload: Record<string, unknown> = {};
        if (data.name) updatePayload.name = data.name;
        if (data.class !== undefined) updatePayload.class = data.class;
        if (data.race !== undefined) updatePayload.race = data.race;
        if (typeof data.level === "number") updatePayload.level = data.level;
        if (typeof data.experience === "number") {
            updatePayload.experience = data.experience;
        }
        if (typeof data.armor_class === "number") {
            updatePayload.armor_class = data.armor_class;
        }
        if (typeof data.speed === "number") updatePayload.speed = data.speed;
        if (typeof data.current_hp === "number") {
            updatePayload.current_hp = data.current_hp;
        }
        if (typeof data.max_hp === "number") {
            updatePayload.max_hp = data.max_hp;
        }
        if (data.character_type) {
            updatePayload.character_type = data.character_type;
        }

        const mergedStats = mergeStats(row.stats, data.stats);
        if (mergedStats) updatePayload.stats = mergedStats;

        let nextDetails = mergeDetails(row.details, data.details_patch);
        const detailPatchMessages: string[] = [];
        if (data.item_patch) {
            const itemPatchBase =
                nextDetails ?? (isRecord(row.details) ? { ...row.details } : {});
            const itemPatchResult = applyItemPatch(itemPatchBase, data.item_patch);
            if (!itemPatchResult.applied || !itemPatchResult.details) {
                results.push({
                    operation: "update",
                    characterId,
                    status: "skipped",
                    message:
                        itemPatchResult.message ??
                        `No se pudo aplicar cambios al objeto "${data.item_patch.target_item_name}".`,
                });
                continue;
            }
            nextDetails = itemPatchResult.details;
            if (itemPatchResult.message) detailPatchMessages.push(itemPatchResult.message);
        }
        if (data.custom_spell_patch) {
            const spellPatchBase =
                nextDetails ?? (isRecord(row.details) ? { ...row.details } : {});
            const spellPatchResult = applyCustomSpellPatch(
                spellPatchBase,
                data.custom_spell_patch
            );
            if (!spellPatchResult.applied || !spellPatchResult.details) {
                results.push({
                    operation: "update",
                    characterId,
                    status: "skipped",
                    message:
                        spellPatchResult.message ??
                        `No se pudo aplicar cambios al hechizo "${data.custom_spell_patch.target_spell_name}".`,
                });
                continue;
            }
            nextDetails = spellPatchResult.details;
            if (spellPatchResult.message) detailPatchMessages.push(spellPatchResult.message);
        }
        if (data.custom_feature_patch) {
            const featurePatchBase =
                nextDetails ?? (isRecord(row.details) ? { ...row.details } : {});
            const featurePatchResult = applyCustomFeaturePatch(
                featurePatchBase,
                data.custom_feature_patch
            );
            if (!featurePatchResult.applied || !featurePatchResult.details) {
                results.push({
                    operation: "update",
                    characterId,
                    status: "skipped",
                    message:
                        featurePatchResult.message ??
                        `No se pudo aplicar cambios al rasgo/habilidad "${data.custom_feature_patch.target_feature_name}".`,
                });
                continue;
            }
            nextDetails = featurePatchResult.details;
            if (featurePatchResult.message) {
                detailPatchMessages.push(featurePatchResult.message);
            }
        }
        if (data.learned_spell_patch) {
            const learnedPatchBase =
                nextDetails ?? (isRecord(row.details) ? { ...row.details } : {});
            const learnedPatchResult = applyLearnedSpellPatch(
                learnedPatchBase,
                data.learned_spell_patch
            );
            if (!learnedPatchResult.applied || !learnedPatchResult.details) {
                results.push({
                    operation: "update",
                    characterId,
                    status: "skipped",
                    message:
                        learnedPatchResult.message ??
                        `No se pudo aplicar cambios al nivel de hechizos ${data.learned_spell_patch.spell_level}.`,
                });
                continue;
            }
            nextDetails = learnedPatchResult.details;
            if (learnedPatchResult.message) {
                detailPatchMessages.push(learnedPatchResult.message);
            }
        }
        if (nextDetails) updatePayload.details = nextDetails;

        if (Object.keys(updatePayload).length === 0) {
            results.push({
                operation: "update",
                characterId,
                status: "skipped",
                message: "No hubo cambios concretos para aplicar.",
            });
            continue;
        }

        const { error: updateError } = await adminClient
            .from("characters")
            .update(updatePayload)
            .eq("id", characterId)
            .eq("campaign_id", campaignId);

        if (updateError) {
            results.push({
                operation: "update",
                characterId,
                status: "error",
                message: updateError.message,
            });
            continue;
        }

        results.push({
            operation: "update",
            characterId,
            status: "applied",
            message:
                detailPatchMessages.length > 0
                    ? `Personaje "${row.name}" actualizado. ${detailPatchMessages.join(" ")}`
                    : `Personaje "${row.name}" actualizado.`,
        });
    }

    return results;
}

export async function POST(req: NextRequest, context: RouteContext) {
    try {
        const params = await context.params;
        const campaignId = String(params?.id ?? "").trim();
        if (!campaignId) {
            return NextResponse.json(
                { error: "campaignId inválido." },
                { status: 400 }
            );
        }

        const body = (await req.json().catch(() => null)) as
            | {
                  prompt?: string;
                  targetCharacterId?: string;
                  apply?: boolean;
                  clientContext?: unknown;
                  proposedActions?: unknown;
                  previewReply?: string;
              }
            | null;
        const prompt = asTrimmedString(body?.prompt, 12000);
        const targetCharacterId = asTrimmedString(body?.targetCharacterId, 64);
        const apply = body?.apply !== false;
        const clientContext = sanitizeClientContext(body?.clientContext);
        const proposedActions =
            Array.isArray(body?.proposedActions) ? body.proposedActions : null;
        const previewReply = asTrimmedString(body?.previewReply, 4000);

        if (!prompt) {
            return NextResponse.json(
                { error: "Debes enviar un prompt." },
                { status: 400 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const aiProviderPreference = resolveAIProvider(
            process.env.AI_PROVIDER ?? DEFAULT_AI_PROVIDER
        );
        const aiFreeOnly = parseEnvBool(
            process.env.AI_FREE_ONLY,
            DEFAULT_AI_FREE_ONLY
        );
        const enableLocalFallback = parseEnvBool(
            process.env.AI_ENABLE_LOCAL_FALLBACK,
            true
        );
        const openaiApiKey = process.env.OPENAI_API_KEY;
        const openaiModel = process.env.OPENAI_ASSISTANT_MODEL ?? DEFAULT_OPENAI_MODEL;
        const geminiApiKey = process.env.GEMINI_API_KEY;
        const geminiModel =
            process.env.GEMINI_ASSISTANT_MODEL ?? DEFAULT_GEMINI_MODEL;
        const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL;
        const ollamaModel = process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;
        const openaiTimeoutMs = parseEnvInt(
            process.env.OPENAI_TIMEOUT_MS,
            12000,
            1500,
            120000
        );
        const geminiTimeoutMs = parseEnvInt(
            process.env.GEMINI_TIMEOUT_MS,
            15000,
            1500,
            120000
        );
        const ollamaTimeoutMs = parseEnvInt(
            process.env.OLLAMA_TIMEOUT_MS,
            90000,
            1500,
            180000
        );
        const ollamaNumPredict = parseEnvInt(
            process.env.OLLAMA_NUM_PREDICT,
            180,
            64,
            1024
        );
        const ollamaNumCtx = parseEnvInt(
            process.env.OLLAMA_NUM_CTX,
            3072,
            512,
            32768
        );
        const ragTopK = parseEnvInt(process.env.AI_RAG_TOP_K, 8, 2, 20);
        const ragDocMaxChars = parseEnvInt(
            process.env.AI_RAG_DOC_MAX_CHARS,
            700,
            180,
            3000
        );
        const effectiveProviderPreference: AIProviderPreference =
            aiFreeOnly && aiProviderPreference === "openai"
                ? "auto"
                : aiProviderPreference;
        const effectiveEnableLocalFallback = enableLocalFallback;
        const effectiveGeminiApiKey = geminiApiKey;
        const effectiveOpenAIApiKey = aiFreeOnly ? undefined : openaiApiKey;

        if (!supabaseUrl || !anonKey || !serviceKey) {
            return NextResponse.json(
                { error: "Faltan variables de Supabase en el servidor." },
                { status: 500 }
            );
        }
        if (
            effectiveProviderPreference === "openai" &&
            !effectiveOpenAIApiKey
        ) {
            return NextResponse.json(
                { error: "Falta OPENAI_API_KEY en el servidor." },
                { status: 500 }
            );
        }
        if (
            effectiveProviderPreference === "gemini" &&
            !effectiveGeminiApiKey
        ) {
            return NextResponse.json(
                { error: "Falta GEMINI_API_KEY en el servidor." },
                { status: 500 }
            );
        }

        const accessToken = extractBearerToken(req.headers.get("authorization"));
        if (!accessToken) {
            return NextResponse.json({ error: "No autenticado." }, { status: 401 });
        }

        const authedClient = createClient(supabaseUrl, anonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        });
        const adminClient = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });

        const {
            data: { user },
            error: userError,
        } = await authedClient.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
        }

        const { data: membership, error: membershipError } = await adminClient
            .from("campaign_members")
            .select("role")
            .eq("campaign_id", campaignId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (membershipError) {
            return NextResponse.json(
                { error: membershipError.message },
                { status: 500 }
            );
        }
        if (!membership || !isRecord(membership) || typeof membership.role !== "string") {
            return NextResponse.json(
                { error: "No tienes acceso a esta campaña." },
                { status: 403 }
            );
        }

        const role = membership.role === "DM" ? "DM" : "PLAYER";
        const { members, characters, campaign, notes } = await loadCampaignContext({
            adminClient,
            campaignId,
            role,
            userId: user.id,
        });

        const visibleCharacters =
            role === "DM"
                ? characters
                : characters.filter((character) => character.user_id === user.id);
        const visibleCharacterIds = new Set(
            visibleCharacters.map((character) => character.id)
        );

        if (targetCharacterId && !visibleCharacterIds.has(targetCharacterId)) {
            return NextResponse.json(
                { error: "No tienes acceso al personaje objetivo." },
                { status: 403 }
            );
        }

        if (apply && proposedActions) {
            const sanitizedActions = sanitizeActions(
                proposedActions,
                targetCharacterId
            );
            const results = await applyActions({
                adminClient,
                campaignId,
                userId: user.id,
                role,
                members,
                visibleCharacterIds,
                actions: sanitizedActions,
            });

            const effectiveReply =
                previewReply ??
                (sanitizedActions.length === 0
                    ? "No hubo cambios concretos para aplicar."
                    : "He aplicado los cambios confirmados.");

            return NextResponse.json({
                reply: effectiveReply,
                proposedActions: sanitizedActions,
                applied: true,
                provider: "preview-confirm",
                intent: "mutation",
                rag: [],
                results,
                permissions: {
                    role,
                    canManageAllCharacters: role === "DM",
                },
            });
        }

        const intent = classifyAssistantIntent(prompt, targetCharacterId);
        if (intent === "capabilities") {
            return NextResponse.json({
                reply: buildCapabilitiesReply(role, clientContext),
                proposedActions: [],
                applied: apply,
                provider: "none",
                intent,
                rag: [],
                results: [],
                permissions: {
                    role,
                    canManageAllCharacters: role === "DM",
                },
            });
        }
        if (intent === "chat") {
            return NextResponse.json({
                reply: buildChatGuidanceReply(role, clientContext),
                proposedActions: [],
                applied: apply,
                provider: "none",
                intent,
                rag: [],
                results: [],
                permissions: {
                    role,
                    canManageAllCharacters: role === "DM",
                },
            });
        }

        const directHeuristicPlan =
            intent === "mutation"
                ? buildHeuristicMutationPlan({
                      prompt,
                      visibleCharacters,
                      targetCharacterId,
                      clientContext,
                      visibleCharacterIds,
                  })
                : null;
        if (directHeuristicPlan && directHeuristicPlan.actions.length > 0) {
            const directReply = `${directHeuristicPlan.reply} Revísala y confirma para aplicarla.`;

            if (!apply) {
                return NextResponse.json({
                    reply: directReply,
                    proposedActions: directHeuristicPlan.actions,
                    applied: false,
                    provider: "heuristic-local",
                    intent,
                    rag: [],
                    results: [],
                    permissions: {
                        role,
                        canManageAllCharacters: role === "DM",
                    },
                });
            }

            const results = await applyActions({
                adminClient,
                campaignId,
                userId: user.id,
                role,
                members,
                visibleCharacterIds,
                actions: directHeuristicPlan.actions,
            });

            return NextResponse.json({
                reply: directReply,
                proposedActions: directHeuristicPlan.actions,
                applied: true,
                provider: "heuristic-local",
                intent,
                rag: [],
                results,
                permissions: {
                    role,
                    canManageAllCharacters: role === "DM",
                },
            });
        }

        const ragSnippets = buildRagSnippets({
            prompt,
            targetCharacterId,
            campaign,
            visibleCharacters,
            notes,
            topK: ragTopK,
            docMaxChars: ragDocMaxChars,
        });

        const selectedContextCharacterId = asTrimmedString(
            clientContext?.selectedCharacter?.id,
            64
        );
        const selectedContextCharacter =
            selectedContextCharacterId &&
            visibleCharacters.find((entry) => entry.id === selectedContextCharacterId);

        const modelContext = {
            campaignId,
            role,
            actorUserId: user.id,
            targetCharacterId: targetCharacterId ?? null,
            clientContext,
            selectedCharacterSnapshot: selectedContextCharacter
                ? {
                      id: selectedContextCharacter.id,
                      name: selectedContextCharacter.name,
                      class: selectedContextCharacter.class,
                      race: selectedContextCharacter.race,
                      level: selectedContextCharacter.level,
                      character_type:
                          selectedContextCharacter.character_type ?? "character",
                      inventorySnapshot: buildInventorySnapshotForModel(
                          selectedContextCharacter.details
                      ),
                  }
                : null,
            members: members.map((member) => ({
                user_id: member.user_id,
                role: member.role,
            })),
            visibleCharacters: visibleCharacters.map((character) => ({
                id: character.id,
                user_id: character.user_id,
                name: character.name,
                class: character.class,
                race: character.race,
                level: character.level,
                character_type: character.character_type ?? "character",
                inventoryItems:
                    isRecord(character.details) && Array.isArray(character.details.items)
                        ? character.details.items
                              .map((item) =>
                                  isRecord(item)
                                      ? asTrimmedString(item.name, 120)
                                      : undefined
                              )
                              .filter((entry): entry is string => !!entry)
                              .slice(0, 16)
                        : [],
                inventorySnapshot: buildInventorySnapshotForModel(character.details),
                customSpells:
                    isRecord(character.details) &&
                    Array.isArray(character.details.customSpells)
                        ? character.details.customSpells
                              .map((entry) =>
                                  isRecord(entry)
                                      ? asTrimmedString(entry.name, 120)
                                      : undefined
                              )
                              .filter((entry): entry is string => !!entry)
                              .slice(0, 16)
                        : [],
                customCantrips:
                    isRecord(character.details) &&
                    Array.isArray(character.details.customCantrips)
                        ? character.details.customCantrips
                              .map((entry) =>
                                  isRecord(entry)
                                      ? asTrimmedString(entry.name, 120)
                                      : undefined
                              )
                              .filter((entry): entry is string => !!entry)
                              .slice(0, 16)
                        : [],
                customTraits:
                    isRecord(character.details) &&
                    Array.isArray(character.details.customTraits)
                        ? character.details.customTraits
                              .map((entry) =>
                                  isRecord(entry)
                                      ? asTrimmedString(entry.name, 120)
                                      : undefined
                              )
                              .filter((entry): entry is string => !!entry)
                              .slice(0, 16)
                        : [],
                customClassAbilities:
                    isRecord(character.details) &&
                    Array.isArray(character.details.customClassAbilities)
                        ? character.details.customClassAbilities
                              .map((entry) =>
                                  isRecord(entry)
                                      ? asTrimmedString(entry.name, 120)
                                      : undefined
                              )
                              .filter((entry): entry is string => !!entry)
                              .slice(0, 16)
                        : [],
            })),
            retrievedContext: ragSnippets,
            productKnowledge: buildAssistantProductKnowledge({
                role,
                clientContext,
            }),
        };

        const { plan, provider } = await requestAssistantPlan({
            providerPreference: effectiveProviderPreference,
            enableLocalFallback: effectiveEnableLocalFallback,
            prompt,
            context: modelContext,
            openai: {
                apiKey: effectiveOpenAIApiKey,
                model: openaiModel,
                timeoutMs: openaiTimeoutMs,
            },
            gemini: {
                apiKey: effectiveGeminiApiKey,
                model: geminiModel,
                timeoutMs: geminiTimeoutMs,
            },
            ollama: {
                baseUrl: ollamaBaseUrl,
                model: ollamaModel,
                timeoutMs: ollamaTimeoutMs,
                numPredict: ollamaNumPredict,
                numCtx: ollamaNumCtx,
            },
        });

        const sanitizedActions = sanitizeActions(plan.actions, targetCharacterId);
        const heuristicPlan =
            sanitizedActions.length === 0
                ? buildHeuristicMutationPlan({
                      prompt,
                      visibleCharacters,
                      targetCharacterId,
                      clientContext,
                      visibleCharacterIds,
                  })
                : null;
        const effectiveActions =
            sanitizedActions.length > 0
                ? sanitizedActions
                : heuristicPlan?.actions ?? [];
        const fallbackCapabilities =
            effectiveActions.length === 0 && isCapabilitiesQuestion(prompt);
        const effectiveReply = fallbackCapabilities
            ? buildCapabilitiesReply(role, clientContext)
            : heuristicPlan && isNoConcreteChangeReply(plan.reply)
              ? `${heuristicPlan.reply} Revísala y confirma para aplicarla.`
            : plan.reply;

        if (!apply) {
            return NextResponse.json({
                reply: effectiveReply,
                proposedActions: effectiveActions,
                applied: false,
                provider,
                intent,
                rag: ragSnippets,
                results: [],
                permissions: {
                    role,
                    canManageAllCharacters: role === "DM",
                },
            });
        }

        const results = await applyActions({
            adminClient,
            campaignId,
            userId: user.id,
            role,
            members,
            visibleCharacterIds,
            actions: effectiveActions,
        });

        return NextResponse.json({
            reply: effectiveReply,
            proposedActions: effectiveActions,
            applied: true,
            provider,
            intent,
            rag: ragSnippets,
            results,
            permissions: {
                role,
                canManageAllCharacters: role === "DM",
            },
        });
    } catch (error: unknown) {
        const message =
            error instanceof Error
                ? error.message
                : "Error interno ejecutando el asistente.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

