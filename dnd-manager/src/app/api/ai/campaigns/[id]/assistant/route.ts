import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ITEM_ATTACHMENT_STRUCTURED_AI_KEYS } from "../../../../../../lib/ai/assistantSync";

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

type ItemAttachmentResourceCostPatch = {
    uses_spell_slot?: boolean;
    slot_level?: number;
    charges?: number;
    recharge?: "short" | "long";
    points_label?: string | null;
    points?: number;
};

type ItemAttachmentPatch = {
    type?: ItemAttachmentType;
    name: string;
    level?: number;
    description?: string | null;
    school?: string | null;
    casting_time?: string | null;
    casting_time_note?: string | null;
    range?: string | null;
    components?: SpellComponentPatch;
    materials?: string | null;
    duration?: string | null;
    concentration?: boolean;
    ritual?: boolean;
    resource_cost?: ItemAttachmentResourceCostPatch;
    save?: SpellSavePatch;
    damage?: SpellDamagePatch;
    action_type?: FeatureActionType;
    requirements?: string | null;
    effect?: string | null;
};

type ItemConfigurationPatch = {
    name: string;
    description?: string | null;
    usage?: string | null;
    damage?: string | null;
    range?: string | null;
    magic_bonus?: number;
    attachments_replace?: ItemAttachmentPatch[];
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
    clear_configurations?: boolean;
    configurations_replace?: ItemConfigurationPatch[];
    active_configuration?: string | null;
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
type AssistantMode = "normal" | "training";
type TrainingSubmode = "ai_prompt" | "sandbox_object";

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
const DEFAULT_AI_GLOBAL_LEARNING_ENABLED = true;
const DEFAULT_AI_GLOBAL_LEARNING_RAG_ENABLED = true;
const DEFAULT_AI_DIRECT_HEURISTIC_FIRST = false;

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
    sourceType: "campaign" | "character" | "note" | "community";
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
                                    clear_configurations: { type: "boolean" },
                                    active_configuration: { type: ["string", "null"] },
                                    configurations_replace: {
                                        type: "array",
                                        maxItems: 8,
                                        items: {
                                            type: "object",
                                            additionalProperties: false,
                                            properties: {
                                                name: { type: "string" },
                                                description: { type: ["string", "null"] },
                                                usage: { type: ["string", "null"] },
                                                damage: { type: ["string", "null"] },
                                                range: { type: ["string", "null"] },
                                                magic_bonus: { type: "integer" },
                                                attachments_replace: {
                                                    type: "array",
                                                    maxItems: 10,
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
                                                            description: { type: ["string", "null"] },
                                                            school: { type: ["string", "null"] },
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
                                                                    recharge: {
                                                                        type: "string",
                                                                        enum: ["short", "long"],
                                                                    },
                                                                    points_label: {
                                                                        type: ["string", "null"],
                                                                    },
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
                                                                        enum: [
                                                                            "STR",
                                                                            "DEX",
                                                                            "CON",
                                                                            "INT",
                                                                            "WIS",
                                                                            "CHA",
                                                                        ],
                                                                    },
                                                                    dc_type: {
                                                                        type: "string",
                                                                        enum: ["fixed", "stat"],
                                                                    },
                                                                    dc_value: { type: "integer" },
                                                                    dc_stat: {
                                                                        type: "string",
                                                                        enum: [
                                                                            "STR",
                                                                            "DEX",
                                                                            "CON",
                                                                            "INT",
                                                                            "WIS",
                                                                            "CHA",
                                                                        ],
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
                                                            action_type: {
                                                                type: "string",
                                                                enum: [
                                                                    "action",
                                                                    "bonus",
                                                                    "reaction",
                                                                    "passive",
                                                                ],
                                                            },
                                                            requirements: {
                                                                type: ["string", "null"],
                                                            },
                                                            effect: {
                                                                type: ["string", "null"],
                                                            },
                                                        },
                                                        required: ["name"],
                                                    },
                                                },
                                            },
                                            required: ["name"],
                                        },
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
                                                school: { type: ["string", "null"] },
                                                casting_time: { type: ["string", "null"] },
                                                casting_time_note: {
                                                    type: ["string", "null"],
                                                },
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
                                                        recharge: {
                                                            type: "string",
                                                            enum: ["short", "long"],
                                                        },
                                                        points_label: {
                                                            type: ["string", "null"],
                                                        },
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
                                                            enum: [
                                                                "STR",
                                                                "DEX",
                                                                "CON",
                                                                "INT",
                                                                "WIS",
                                                                "CHA",
                                                            ],
                                                        },
                                                        dc_type: {
                                                            type: "string",
                                                            enum: ["fixed", "stat"],
                                                        },
                                                        dc_value: { type: "integer" },
                                                        dc_stat: {
                                                            type: "string",
                                                            enum: [
                                                                "STR",
                                                                "DEX",
                                                                "CON",
                                                                "INT",
                                                                "WIS",
                                                                "CHA",
                                                            ],
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
                                                action_type: {
                                                    type: "string",
                                                    enum: [
                                                        "action",
                                                        "bonus",
                                                        "reaction",
                                                        "passive",
                                                    ],
                                                },
                                                requirements: {
                                                    type: ["string", "null"],
                                                },
                                                effect: {
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
                                                school: { type: ["string", "null"] },
                                                casting_time: { type: ["string", "null"] },
                                                casting_time_note: {
                                                    type: ["string", "null"],
                                                },
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
                                                        recharge: {
                                                            type: "string",
                                                            enum: ["short", "long"],
                                                        },
                                                        points_label: {
                                                            type: ["string", "null"],
                                                        },
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
                                                            enum: [
                                                                "STR",
                                                                "DEX",
                                                                "CON",
                                                                "INT",
                                                                "WIS",
                                                                "CHA",
                                                            ],
                                                        },
                                                        dc_type: {
                                                            type: "string",
                                                            enum: ["fixed", "stat"],
                                                        },
                                                        dc_value: { type: "integer" },
                                                        dc_stat: {
                                                            type: "string",
                                                            enum: [
                                                                "STR",
                                                                "DEX",
                                                                "CON",
                                                                "INT",
                                                                "WIS",
                                                                "CHA",
                                                            ],
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
                                                action_type: {
                                                    type: "string",
                                                    enum: [
                                                        "action",
                                                        "bonus",
                                                        "reaction",
                                                        "passive",
                                                    ],
                                                },
                                                requirements: {
                                                    type: ["string", "null"],
                                                },
                                                effect: {
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

function asBooleanFlag(value: unknown): boolean | undefined {
    return typeof value === "boolean" ? value : undefined;
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
    const raw = asTrimmedString(value, 120);
    if (!raw) return undefined;
    const compactUpper = raw.toUpperCase().replace(/[^A-Z]/g, "");
    if (compactUpper.includes("STR")) return "STR";
    if (compactUpper.includes("DEX")) return "DEX";
    if (compactUpper.includes("CON")) return "CON";
    if (compactUpper.includes("INT")) return "INT";
    if (compactUpper.includes("WIS")) return "WIS";
    if (compactUpper.includes("CHA")) return "CHA";

    const normalized = normalizeForMatch(raw);
    if (
        /\b(strength|fuerza|forzudo)\b/.test(normalized) ||
        /\b(str)\b/.test(normalized)
    ) {
        return "STR";
    }
    if (
        /\b(dexterity|destreza)\b/.test(normalized) ||
        /\b(dex)\b/.test(normalized)
    ) {
        return "DEX";
    }
    if (
        /\b(constitution|constitucion)\b/.test(normalized) ||
        /\b(con)\b/.test(normalized)
    ) {
        return "CON";
    }
    if (
        /\b(intelligence|inteligencia)\b/.test(normalized) ||
        /\b(int)\b/.test(normalized)
    ) {
        return "INT";
    }
    if (
        /\b(wisdom|sabiduria)\b/.test(normalized) ||
        /\b(wis)\b/.test(normalized)
    ) {
        return "WIS";
    }
    if (
        /\b(charisma|carisma)\b/.test(normalized) ||
        /\b(cha)\b/.test(normalized)
    ) {
        return "CHA";
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
    } else if (typeof value.usesSpellSlot === "boolean") {
        output.uses_spell_slot = value.usesSpellSlot;
    }
    const slotLevel =
        asInteger(value.slot_level, 0, 9) ??
        asInteger(value.slotLevel, 0, 9);
    if (typeof slotLevel === "number") output.slot_level = slotLevel;
    const charges = asInteger(value.charges, 0, 999);
    if (typeof charges === "number") output.charges = charges;
    const points = asInteger(value.points, 0, 999);
    if (typeof points === "number") output.points = points;
    return Object.keys(output).length > 0 ? output : undefined;
}

function sanitizeItemAttachmentResourceCostPatch(
    value: unknown
): ItemAttachmentResourceCostPatch | undefined {
    if (!isRecord(value)) return undefined;
    const output: ItemAttachmentResourceCostPatch = {};
    if (typeof value.uses_spell_slot === "boolean") {
        output.uses_spell_slot = value.uses_spell_slot;
    } else if (typeof value.usesSpellSlot === "boolean") {
        output.uses_spell_slot = value.usesSpellSlot;
    }
    const slotLevel =
        asInteger(value.slot_level, 0, 9) ??
        asInteger(value.slotLevel, 0, 9);
    if (typeof slotLevel === "number") output.slot_level = slotLevel;

    const charges = asInteger(value.charges, 0, 999);
    if (typeof charges === "number") output.charges = charges;

    const recharge =
        asTrimmedString(value.recharge, 10)?.toLowerCase() ?? undefined;
    if (recharge === "short" || recharge === "long") {
        output.recharge = recharge;
    }

    const pointsLabel =
        asNullableString(value.points_label, 80) ??
        asNullableString(value.pointsLabel, 80);
    if (pointsLabel !== undefined) output.points_label = pointsLabel;

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
    const saveAbility = normalizeAbilityKey(
        value.save_ability ?? value.saveAbility
    );
    if (saveAbility) output.save_ability = saveAbility;
    const dcType = asTrimmedString(
        value.dc_type ?? value.dcType,
        16
    )?.toLowerCase();
    if (dcType === "fixed" || dcType === "stat") {
        output.dc_type = dcType;
    }
    const dcValue =
        asInteger(value.dc_value, 0, 40) ??
        asInteger(value.dcValue, 0, 40);
    if (typeof dcValue === "number") output.dc_value = dcValue;
    const dcStat = normalizeAbilityKey(value.dc_stat ?? value.dcStat);
    if (dcStat) output.dc_stat = dcStat;
    return Object.keys(output).length > 0 ? output : undefined;
}

function sanitizeSpellDamagePatch(value: unknown): SpellDamagePatch | undefined {
    if (!isRecord(value)) return undefined;
    const output: SpellDamagePatch = {};
    const damageType = asTrimmedString(
        value.damage_type ?? value.damageType,
        80
    );
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

function countRegexHits(value: string, patterns: RegExp[]) {
    let hits = 0;
    for (const pattern of patterns) {
        if (pattern.test(value)) hits += 1;
    }
    return hits;
}

function hasFocusHeadingSignals(value: string) {
    const normalized = normalizeForItemMatch(value);
    return (
        normalized.includes("foco") ||
        normalized.includes("focus") ||
        normalized.includes("druidico") ||
        normalized.includes("druidic")
    );
}

function hasPassiveHeadingSignals(value: string) {
    const normalized = normalizeForItemMatch(value);
    return (
        normalized.includes("pasiva") ||
        normalized.includes("passive") ||
        normalized.includes("detector") ||
        normalized.includes("aura")
    );
}

function hasActionTriggerSignals(value: string) {
    const normalized = normalizeForItemMatch(value);
    return (
        normalized.includes("poder especial") ||
        normalized.includes("special power") ||
        /\bcomo\s+(?:una\s+)?(?:accion|acción|action|reaccion|reacción|reaction|bonus action)\b/i.test(
            value
        ) ||
        /\b\d+\s*vez(?:es)?\s+por\s+descanso(?:\s+(?:largo|corto|long|short))?/i.test(
            value
        )
    );
}

function hasStrongSpellStructureSignals(value: string) {
    const corePatterns = [
        /\balcance\b/i,
        /\b(?:área|area)\b/i,
        /\bduracion\b/i,
        /\bduración\b/i,
        /\bcomponentes?\b/i,
        /\bcasting\b/i,
        /\bconcentracion\b/i,
        /\bconcentración\b/i,
        /\britual\b/i,
        /\bobjetivo\b/i,
        /\brange\b/i,
        /\bduration\b/i,
    ];
    const auxPatterns = [
        /\bsalvacion\b/i,
        /\bsalvación\b/i,
        /\bdc\b/i,
        /\branura\b/i,
        /\bslot\b/i,
        /\bconjuro\b/i,
        /\bhechizo\b/i,
        /\bspell\b/i,
    ];
    const coreHits = countRegexHits(value, corePatterns);
    const auxHits = countRegexHits(value, auxPatterns);
    return coreHits >= 2 || (coreHits >= 1 && auxHits >= 2);
}

function hasStateEffectSignals(value: string) {
    const normalized = normalizeForItemMatch(value);
    return (
        normalized.includes("al final de cada turno") ||
        normalized.includes("the end of each turn") ||
        normalized.includes("efecto termina") ||
        normalized.includes("queda infectad") ||
        normalized.includes("estado latente") ||
        normalized.includes("estado")
    );
}

function inferAttachmentType(
    name: string,
    description?: string | null
): ItemAttachmentType {
    const normalizedName = normalizeForItemMatch(name);
    const joined = `${name}\n${description ?? ""}`;
    const normalizedJoined = normalizeForItemMatch(joined);

    if (
        normalizedName.includes("cantrip") ||
        normalizedName.includes("truco") ||
        normalizedJoined.includes("cantrip")
    ) {
        return "cantrip";
    }

    if (
        normalizedName.includes("poder especial") ||
        normalizedName.includes("special power") ||
        normalizedName.includes("accion") ||
        normalizedName.includes("acción") ||
        normalizedName.includes("reaction") ||
        hasActionTriggerSignals(joined)
    ) {
        return "action";
    }

    if (hasPassiveHeadingSignals(name)) return "trait";
    if (hasFocusHeadingSignals(name)) return "ability";

    const explicitSpellSignal =
        normalizedName.includes("conjuro") ||
        normalizedName.includes("hechizo") ||
        normalizedName.includes("spell") ||
        normalizedJoined.includes("conjuro unico") ||
        normalizedJoined.includes("conjuro único") ||
        normalizedJoined.includes("no ocupa ranura");
    if (explicitSpellSignal || hasStrongSpellStructureSignals(joined)) {
        return "spell";
    }

    if (hasStateEffectSignals(joined)) return "ability";

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
        "mientras",
        "while attuned",
    ];
    if (abilitySignals.some((signal) => normalizedJoined.includes(signal))) {
        return "ability";
    }

    const traitSignals = [
        "rasgo",
        "trait",
        "innato",
        "innate",
        "pasivo",
        "passive",
    ];
    if (traitSignals.some((signal) => normalizedJoined.includes(signal))) {
        return "trait";
    }
    return "trait";
}

function normalizeAttachmentTypeWithSemantics(
    name: string,
    description: string | null | undefined,
    explicitType?: ItemAttachmentType
) {
    const inferred = inferAttachmentType(name, description);
    if (!explicitType) return inferred;
    if (explicitType === inferred) return explicitType;

    const normalizedName = normalizeForItemMatch(name);
    if (
        hasFocusHeadingSignals(name) ||
        hasPassiveHeadingSignals(name) ||
        normalizedName.includes("poder especial")
    ) {
        return inferred;
    }

    if (
        explicitType === "spell" &&
        inferred !== "spell" &&
        inferred !== "cantrip"
    ) {
        const combined = `${name}\n${description ?? ""}`;
        const normalizedCombined = normalizeForMatch(combined);
        const hasBasicSpellSignal =
            normalizedCombined.includes("salvacion") ||
            normalizedCombined.includes("alcance") ||
            normalizedCombined.includes("duracion") ||
            normalizedCombined.includes("componentes") ||
            normalizedCombined.includes("cd ") ||
            normalizedCombined.includes("dano") ||
            /\b\d+d\d+(?:\s*[+\-]\s*\d+)?\b/.test(normalizedCombined);
        if (
            !hasStrongSpellStructureSignals(combined) &&
            !hasBasicSpellSignal
        ) {
            return inferred;
        }
    }

    return explicitType;
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
    const type = normalizeAttachmentTypeWithSemantics(
        name,
        description ?? undefined,
        explicitType
    );

    const output: ItemAttachmentPatch = { name, type };
    if (typeof level === "number") output.level = level;
    if (description !== undefined) output.description = description;

    const school = asNullableString(value.school, 120);
    if (school !== undefined) output.school = school;
    const castingTime =
        asNullableString(value.casting_time, 120) ??
        asNullableString(value.castingTime, 120);
    if (castingTime !== undefined) output.casting_time = castingTime;
    const castingTimeNote =
        asNullableString(value.casting_time_note, 220) ??
        asNullableString(value.castingTimeNote, 220);
    if (castingTimeNote !== undefined) {
        output.casting_time_note = castingTimeNote;
    }
    const range =
        asNullableString(value.range, 220) ??
        asNullableString(value.range_text, 220);
    if (range !== undefined) output.range = range;
    const components = sanitizeSpellComponentPatch(value.components);
    if (components) output.components = components;
    const materials = asNullableString(value.materials, 220);
    if (materials !== undefined) output.materials = materials;
    const duration = asNullableString(value.duration, 220);
    if (duration !== undefined) output.duration = duration;
    if (typeof value.concentration === "boolean") {
        output.concentration = value.concentration;
    }
    if (typeof value.ritual === "boolean") output.ritual = value.ritual;

    const resourceCost = sanitizeItemAttachmentResourceCostPatch(
        value.resource_cost ?? value.resourceCost
    );
    if (resourceCost) output.resource_cost = resourceCost;
    const save = sanitizeSpellSavePatch(value.save);
    if (save) output.save = save;
    const damage = sanitizeSpellDamagePatch(value.damage);
    if (damage) output.damage = damage;

    const actionType = normalizeFeatureActionType(
        value.action_type ?? value.actionType
    );
    if (actionType) output.action_type = actionType;
    const requirements = asNullableString(value.requirements, 220);
    if (requirements !== undefined) output.requirements = requirements;
    const effect = asNullableString(value.effect, 4000);
    if (effect !== undefined) output.effect = effect;
    return output;
}

function shouldMergeIntoPreviousSpellAttachment(name: string) {
    const normalized = normalizeForItemMatch(name);
    return (
        normalized === "efecto inicial" ||
        normalized === "efecto secundario" ||
        normalized === "efecto continuo" ||
        normalized === "efecto"
    );
}

function mergeAttachmentDescriptions(
    base: string | null | undefined,
    extra: string | null | undefined
) {
    const left = asTrimmedString(base, 4000);
    const right = asTrimmedString(extra, 4000);
    if (!left && !right) return undefined;
    if (!left) return right;
    if (!right) return left;
    const leftNorm = normalizeAttachmentTextForCompare(left);
    const rightNorm = normalizeAttachmentTextForCompare(right);
    if (leftNorm === rightNorm) return left;
    return asTrimmedString(`${left}\n${right}`, 4000) ?? left;
}

function inferDamageTypeFromText(value: string) {
    const normalized = normalizeForMatch(value);
    if (normalized.includes("fuego") || normalized.includes("fire")) return "fuego";
    if (normalized.includes("frio") || normalized.includes("cold")) return "frio";
    if (normalized.includes("necrot")) return "necrotico";
    if (normalized.includes("radian")) return "radiante";
    if (normalized.includes("veneno") || normalized.includes("poison")) return "veneno";
    if (normalized.includes("acido") || normalized.includes("acid")) return "acido";
    if (normalized.includes("electr") || normalized.includes("lightning")) return "electrico";
    if (normalized.includes("trueno") || normalized.includes("thunder")) return "trueno";
    if (normalized.includes("psiqu") || normalized.includes("psychic")) return "psiquico";
    if (normalized.includes("fuerza") || normalized.includes("force")) return "fuerza";
    return undefined;
}

function inferAttachmentFieldsFromDescription(
    type: ItemAttachmentType,
    description?: string | null
) {
    const text = asTrimmedString(description, 4000);
    if (!text) return {} as Partial<ItemAttachmentPatch>;

    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    const inferred: Partial<ItemAttachmentPatch> = {};
    const isSpellLike = type === "spell" || type === "cantrip";
    const isAbilityLike =
        type === "action" || type === "ability" || type === "classFeature";

    const resourceCost: ItemAttachmentResourceCostPatch = {};
    const savePatch: SpellSavePatch = {};
    const damagePatch: SpellDamagePatch = {};

    for (const line of lines) {
        const keyValue = line.match(/^([^:]{2,40})\s*:\s*(.+)$/);
        if (keyValue) {
            const key = normalizeForMatch(keyValue[1]);
            const value = asTrimmedString(keyValue[2], 900) ?? "";

            if (isSpellLike) {
                if (key === "escuela" && !inferred.school) {
                    inferred.school = value;
                    continue;
                }
                if ((key === "alcance" || key === "range") && !inferred.range) {
                    inferred.range = value;
                    continue;
                }
                if ((key === "area" || key === "área") && !inferred.range) {
                    inferred.range = `Area: ${value}`;
                    continue;
                }
                if (
                    (key === "duracion" || key === "duración" || key === "duration") &&
                    !inferred.duration
                ) {
                    inferred.duration = value;
                    continue;
                }
                if (key === "componentes" && !inferred.components) {
                    const normalized = normalizeForMatch(value);
                    inferred.components = {
                        ...(normalized.includes("v") || normalized.includes("verbal")
                            ? { verbal: true }
                            : {}),
                        ...(normalized.includes("s") || normalized.includes("somatic")
                            ? { somatic: true }
                            : {}),
                        ...(normalized.includes("m") || normalized.includes("material")
                            ? { material: true }
                            : {}),
                    };
                    continue;
                }
                if (
                    (key === "materiales" || key === "material") &&
                    !inferred.materials
                ) {
                    inferred.materials = value;
                    continue;
                }
                if ((key === "salvacion" || key === "salvación") && !savePatch.type) {
                    savePatch.type = "save";
                    const ability = normalizeAbilityKey(value);
                    if (ability) savePatch.save_ability = ability;
                    const dcMatch = value.match(/\bcd\b[^0-9]*(\d{1,2})/i);
                    if (dcMatch) {
                        const parsed = asInteger(dcMatch[1], 0, 40);
                        if (typeof parsed === "number") {
                            savePatch.dc_type = "fixed";
                            savePatch.dc_value = parsed;
                        }
                    }
                    continue;
                }
                if (
                    (key === "dano" || key === "daño" || key === "damage") &&
                    !damagePatch.dice
                ) {
                    const dice = value.match(/\b\d+d\d+(?:\s*[+\-]\s*\d+)?\b/i);
                    if (dice) damagePatch.dice = dice[0];
                    const damageType = inferDamageTypeFromText(value);
                    if (damageType) damagePatch.damage_type = damageType;
                    continue;
                }
            }

            if (isAbilityLike) {
                if (
                    (key === "requisitos" || key === "requirement" || key === "requirements") &&
                    !inferred.requirements
                ) {
                    inferred.requirements = value;
                    continue;
                }
                if ((key === "efecto" || key === "effect") && !inferred.effect) {
                    inferred.effect = value;
                    continue;
                }
            }
        }

        const normalized = normalizeForMatch(line);
        if (isSpellLike) {
            if (!savePatch.type) {
                const saveLineMatch = line.match(
                    /\bsalvaci[oó]n(?:\s+de)?\s*:?\s*([a-záéíóúüñ]+)/i
                );
                if (saveLineMatch) {
                    savePatch.type = "save";
                    const ability = normalizeAbilityKey(saveLineMatch[1]);
                    if (ability) savePatch.save_ability = ability;
                }
                const dcLineMatch = line.match(/\bcd\b[^0-9]*(\d{1,2})/i);
                if (dcLineMatch) {
                    const parsedDc = asInteger(dcLineMatch[1], 0, 40);
                    if (typeof parsedDc === "number") {
                        savePatch.dc_type = "fixed";
                        savePatch.dc_value = parsedDc;
                    }
                }
            }

            if (
                inferred.concentration === undefined &&
                normalized.includes("concentracion")
            ) {
                inferred.concentration = !(
                    normalized.includes("no requiere") ||
                    normalized.includes("sin concentracion")
                );
            }
            if (inferred.ritual === undefined && normalized.includes("ritual")) {
                inferred.ritual = !normalized.includes("no es ritual");
            }
        }

        if (isAbilityLike) {
            if (!inferred.action_type) {
                if (/\bcomo\s+(?:una\s+)?(?:accion|acción|action)\b/i.test(line)) {
                    inferred.action_type = "action";
                } else if (/\bbonus action\b/i.test(line)) {
                    inferred.action_type = "bonus";
                } else if (/\breaccion|reacción|reaction\b/i.test(line)) {
                    inferred.action_type = "reaction";
                }
            }
            if (resourceCost.charges === undefined) {
                const chargesMatch = line.match(/(\d{1,3})\s*cargas?/i);
                const charges = asInteger(chargesMatch?.[1], 0, 999);
                if (typeof charges === "number") {
                    resourceCost.charges = charges;
                }
            }
            if (!resourceCost.recharge) {
                if (/\bdescanso\s+largo|long rest\b/i.test(line)) {
                    resourceCost.recharge = "long";
                } else if (/\bdescanso\s+corto|short rest\b/i.test(line)) {
                    resourceCost.recharge = "short";
                }
            }
            if (resourceCost.uses_spell_slot === undefined) {
                if (/\bespacio de conjuro|spell slot\b/i.test(line)) {
                    resourceCost.uses_spell_slot = true;
                }
            }
            if (resourceCost.slot_level === undefined) {
                const slotLevelMatch = line.match(/\bnivel\s*(\d)\b/i);
                const slotLevel = asInteger(slotLevelMatch?.[1], 0, 9);
                if (typeof slotLevel === "number") {
                    resourceCost.slot_level = slotLevel;
                }
            }
        }

        if (isSpellLike && !damagePatch.dice) {
            const dice = line.match(/\b\d+d\d+(?:\s*[+\-]\s*\d+)?\b/i);
            if (dice) {
                damagePatch.dice = dice[0];
                const damageType = inferDamageTypeFromText(line);
                if (damageType) damagePatch.damage_type = damageType;
            }
        }
    }

    if (Object.keys(resourceCost).length > 0) {
        inferred.resource_cost = resourceCost;
    }
    if (Object.keys(savePatch).length > 0) inferred.save = savePatch;
    if (Object.keys(damagePatch).length > 0) inferred.damage = damagePatch;
    return inferred;
}

function normalizeAttachmentPatchList(attachments: ItemAttachmentPatch[]) {
    const ordered: ItemAttachmentPatch[] = [];
    const byKey = new Map<string, ItemAttachmentPatch>();
    const pickDefined = <T,>(
        primary: T | undefined,
        fallback: T | undefined
    ) => (primary !== undefined ? primary : fallback);

    for (const raw of attachments) {
        const name = asTrimmedString(raw.name, 140);
        if (!name) continue;
        const description =
            raw.description === null
                ? null
                : asTrimmedString(raw.description, 4000);
        const level = typeof raw.level === "number" ? raw.level : undefined;
        const type = normalizeAttachmentTypeWithSemantics(
            name,
            description,
            raw.type
        );
        const inferred = inferAttachmentFieldsFromDescription(type, description);

        const school = pickDefined(
            raw.school === null ? null : asTrimmedString(raw.school, 120),
            inferred.school === null
                ? null
                : asTrimmedString(inferred.school, 120)
        );
        const castingTime = pickDefined(
            raw.casting_time === null
                ? null
                : asTrimmedString(raw.casting_time, 120),
            inferred.casting_time === null
                ? null
                : asTrimmedString(inferred.casting_time, 120)
        );
        const castingTimeNote = pickDefined(
            raw.casting_time_note === null
                ? null
                : asTrimmedString(raw.casting_time_note, 220),
            inferred.casting_time_note === null
                ? null
                : asTrimmedString(inferred.casting_time_note, 220)
        );
        const range = pickDefined(
            raw.range === null ? null : asTrimmedString(raw.range, 220),
            inferred.range === null ? null : asTrimmedString(inferred.range, 220)
        );
        const components = pickDefined(
            sanitizeSpellComponentPatch(raw.components),
            sanitizeSpellComponentPatch(inferred.components)
        );
        const materials = pickDefined(
            raw.materials === null ? null : asTrimmedString(raw.materials, 220),
            inferred.materials === null
                ? null
                : asTrimmedString(inferred.materials, 220)
        );
        const duration = pickDefined(
            raw.duration === null ? null : asTrimmedString(raw.duration, 220),
            inferred.duration === null
                ? null
                : asTrimmedString(inferred.duration, 220)
        );
        const concentration = pickDefined(
            typeof raw.concentration === "boolean"
                ? raw.concentration
                : undefined,
            typeof inferred.concentration === "boolean"
                ? inferred.concentration
                : undefined
        );
        const ritual = pickDefined(
            typeof raw.ritual === "boolean" ? raw.ritual : undefined,
            typeof inferred.ritual === "boolean" ? inferred.ritual : undefined
        );
        const resourceCost = pickDefined(
            sanitizeItemAttachmentResourceCostPatch(raw.resource_cost),
            sanitizeItemAttachmentResourceCostPatch(inferred.resource_cost)
        );
        const save = pickDefined(
            sanitizeSpellSavePatch(raw.save),
            sanitizeSpellSavePatch(inferred.save)
        );
        const damage = pickDefined(
            sanitizeSpellDamagePatch(raw.damage),
            sanitizeSpellDamagePatch(inferred.damage)
        );
        const actionType = pickDefined(
            normalizeFeatureActionType(raw.action_type),
            normalizeFeatureActionType(inferred.action_type)
        );
        const requirements = pickDefined(
            raw.requirements === null
                ? null
                : asTrimmedString(raw.requirements, 220),
            inferred.requirements === null
                ? null
                : asTrimmedString(inferred.requirements, 220)
        );
        const effect = pickDefined(
            raw.effect === null ? null : asTrimmedString(raw.effect, 4000),
            inferred.effect === null
                ? null
                : asTrimmedString(inferred.effect, 4000)
        );

        if (
            shouldMergeIntoPreviousSpellAttachment(name) &&
            ordered.length > 0
        ) {
            const previous = ordered[ordered.length - 1];
            if (previous.type === "spell" || previous.type === "cantrip") {
                previous.description = mergeAttachmentDescriptions(
                    previous.description ?? undefined,
                    description ?? name
                );
                continue;
            }
        }

        const normalized: ItemAttachmentPatch = { name, type };
        if (typeof level === "number") normalized.level = level;
        if (description !== undefined) normalized.description = description;
        if (school !== undefined) normalized.school = school;
        if (castingTime !== undefined) normalized.casting_time = castingTime;
        if (castingTimeNote !== undefined) {
            normalized.casting_time_note = castingTimeNote;
        }
        if (range !== undefined) normalized.range = range;
        if (components) normalized.components = components;
        if (materials !== undefined) normalized.materials = materials;
        if (duration !== undefined) normalized.duration = duration;
        if (concentration !== undefined) normalized.concentration = concentration;
        if (ritual !== undefined) normalized.ritual = ritual;
        if (resourceCost) normalized.resource_cost = resourceCost;
        if (save) normalized.save = save;
        if (damage) normalized.damage = damage;
        if (actionType) normalized.action_type = actionType;
        if (requirements !== undefined) normalized.requirements = requirements;
        if (effect !== undefined) normalized.effect = effect;

        const key = `${normalizeForItemMatch(normalized.type ?? "trait")}::${normalizeForItemMatch(
            normalized.name
        )}`;
        const existing = byKey.get(key);
        if (!existing) {
            ordered.push(normalized);
            byKey.set(key, normalized);
            continue;
        }

        if (typeof normalized.level === "number") {
            existing.level = normalized.level;
        }
        existing.description = mergeAttachmentDescriptions(
            existing.description ?? undefined,
            normalized.description ?? undefined
        );
        if (normalized.school !== undefined) existing.school = normalized.school;
        if (normalized.casting_time !== undefined) {
            existing.casting_time = normalized.casting_time;
        }
        if (normalized.casting_time_note !== undefined) {
            existing.casting_time_note = normalized.casting_time_note;
        }
        if (normalized.range !== undefined) existing.range = normalized.range;
        if (normalized.components !== undefined) {
            existing.components = normalized.components;
        }
        if (normalized.materials !== undefined) {
            existing.materials = normalized.materials;
        }
        if (normalized.duration !== undefined) {
            existing.duration = normalized.duration;
        }
        if (normalized.concentration !== undefined) {
            existing.concentration = normalized.concentration;
        }
        if (normalized.ritual !== undefined) existing.ritual = normalized.ritual;
        if (normalized.resource_cost !== undefined) {
            existing.resource_cost = normalized.resource_cost;
        }
        if (normalized.save !== undefined) existing.save = normalized.save;
        if (normalized.damage !== undefined) existing.damage = normalized.damage;
        if (normalized.action_type !== undefined) {
            existing.action_type = normalized.action_type;
        }
        if (normalized.requirements !== undefined) {
            existing.requirements = normalized.requirements;
        }
        if (normalized.effect !== undefined) existing.effect = normalized.effect;
    }

    return ordered;
}

function isLikelyAttachmentMechanicalLine(line: string) {
    const normalized = normalizeForItemMatch(line);
    return (
        normalized.includes("como accion") ||
        normalized.includes("uso:") ||
        normalized.includes("efecto inicial") ||
        normalized.includes("1 vez por descanso") ||
        normalized.includes("alcance") ||
        normalized.includes("area") ||
        normalized.includes("salvacion") ||
        normalized.includes("dano") ||
        normalized.includes("damage") ||
        normalized.includes("duracion") ||
        normalized.includes("componentes") ||
        normalized.includes("puede usarse como foco") ||
        normalized.includes("al final de cada turno") ||
        normalized.includes("cd de conjuros")
    );
}

function stripDescriptionAttachmentOverlap(
    description: string,
    attachments: ItemAttachmentPatch[]
) {
    const segmentedDescription = description
        .replace(
            /\s+(?=(?:alcance|range|area|área|salvación|salvacion|saving throw|duración|duracion|duration|componentes|components|materiales|materials|tiempo de lanzamiento|casting time|daño|dano|damage|efecto inicial|uso)\s*:)/giu,
            "\n"
        )
        .replace(
            /\s+(?=\d+d\d+(?:\s*[+\-]\s*\d+)?\s+(?:de\s+)?(?:daño|dano|damage)\b)/giu,
            "\n"
        );

    const lines = segmentedDescription
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    if (lines.length === 0 || attachments.length === 0) return description;

    const attachmentTexts = attachments
        .flatMap((attachment) => {
            const resource = attachment.resource_cost;
            const save = attachment.save;
            const damage = attachment.damage;
            return [
                asTrimmedString(attachment.name, 400) ?? "",
                asTrimmedString(attachment.description, 1200) ?? "",
                asTrimmedString(attachment.school, 120) ?? "",
                asTrimmedString(attachment.casting_time, 120) ?? "",
                asTrimmedString(attachment.casting_time_note, 220) ?? "",
                asTrimmedString(attachment.range, 220) ?? "",
                asTrimmedString(attachment.duration, 220) ?? "",
                asTrimmedString(attachment.materials, 220) ?? "",
                asTrimmedString(attachment.requirements, 220) ?? "",
                asTrimmedString(attachment.effect, 1200) ?? "",
                asTrimmedString(save?.type, 30) ?? "",
                asTrimmedString(save?.save_ability, 12) ?? "",
                asTrimmedString(damage?.damage_type, 80) ?? "",
                asTrimmedString(damage?.dice, 80) ?? "",
                asTrimmedString(damage?.scaling, 180) ?? "",
                asTrimmedString(attachment.action_type, 30) ?? "",
                resource?.uses_spell_slot ? "espacio de conjuro" : "",
                typeof resource?.slot_level === "number"
                    ? `nivel ${resource.slot_level}`
                    : "",
                typeof resource?.charges === "number"
                    ? `${resource.charges} cargas`
                    : "",
                resource?.recharge === "long"
                    ? "descanso largo"
                    : resource?.recharge === "short"
                      ? "descanso corto"
                      : "",
            ];
        })
        .map((entry) => normalizeAttachmentTextForCompare(entry))
        .filter(Boolean);

    const hasStructuredAttachments = attachments.some(
        (attachment) =>
            attachment.school !== undefined ||
            attachment.casting_time !== undefined ||
            attachment.casting_time_note !== undefined ||
            attachment.range !== undefined ||
            attachment.components !== undefined ||
            attachment.materials !== undefined ||
            attachment.duration !== undefined ||
            attachment.concentration !== undefined ||
            attachment.ritual !== undefined ||
            attachment.resource_cost !== undefined ||
            attachment.save !== undefined ||
            attachment.damage !== undefined ||
            attachment.action_type !== undefined ||
            attachment.requirements !== undefined ||
            attachment.effect !== undefined
    );

    const filtered = lines.filter((line) => {
        const normalizedLine = normalizeAttachmentTextForCompare(line);
        if (!normalizedLine) return false;

        const duplicated = attachmentTexts.some(
            (entry) =>
                entry === normalizedLine ||
                entry.includes(normalizedLine) ||
                normalizedLine.includes(entry)
        );
        if (duplicated) return false;

        if (hasStructuredAttachments && isLikelyAttachmentMechanicalLine(line)) {
            return false;
        }
        return true;
    });

    const paragraphized = filtered
        .join("\n\n")
        .replace(/([.!?])\s+(?=[A-ZÁÉÍÓÚÜÑ0-9(])/g, "$1\n\n")
        .replace(/\n{3,}/g, "\n\n");

    return asTrimmedString(paragraphized, 4000) ?? "";
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
    return normalizeAttachmentPatchList(output).slice(0, 12);
}

function sanitizeItemConfigurationPatch(
    value: unknown
): ItemConfigurationPatch | undefined {
    if (!isRecord(value)) return undefined;
    const name = asTrimmedString(value.name, 140);
    if (!name) return undefined;

    const patch: ItemConfigurationPatch = { name };
    const description = asNullableString(value.description, 4000);
    if (description !== undefined) patch.description = description;
    const usage = asNullableString(value.usage, 240);
    if (usage !== undefined) patch.usage = usage;
    const damage = asNullableString(value.damage, 240);
    if (damage !== undefined) patch.damage = damage;
    const range = asNullableString(value.range, 240);
    if (range !== undefined) patch.range = range;
    const magicBonus = asInteger(value.magic_bonus, -30, 30);
    if (typeof magicBonus === "number") patch.magic_bonus = magicBonus;

    const attachments = sanitizeItemAttachmentsPatchList(value.attachments_replace)
        .slice(0, 10);
    if (attachments.length > 0) patch.attachments_replace = attachments;

    return patch;
}

function sanitizeItemConfigurationPatchList(value: unknown) {
    if (!Array.isArray(value)) return [] as ItemConfigurationPatch[];
    const output: ItemConfigurationPatch[] = [];
    for (const entry of value) {
        const parsed = sanitizeItemConfigurationPatch(entry);
        if (!parsed) continue;
        output.push(parsed);
        if (output.length >= 8) break;
    }
    return output;
}

function parseItemLabelAndPrice(value: string, maxLen = 140) {
    const cleaned = stripLeadingDecorators(value)
        .replace(/\s+/g, " ")
        .trim();
    if (!cleaned) return undefined;

    const match = cleaned.match(
        /^(.*?)(?:\s*[–—−-]\s*(\d{1,6})\s*(po|gp|pp|sp|cp)\b.*)$/iu
    );
    if (!match) {
        const name = asTrimmedString(cleaned, maxLen);
        return name ? { name } : undefined;
    }

    const name = asTrimmedString(
        (match[1] ?? "").replace(/[–—−-]\s*$/g, "").trim(),
        maxLen
    );
    if (!name) return undefined;

    const amount = match[2];
    const unit = match[3];
    const price =
        amount && unit ? `${amount} ${unit.toLowerCase()}` : undefined;

    return { name, price };
}

function sanitizeItemPatch(value: unknown): ItemPatch | undefined {
    if (!isRecord(value)) return undefined;
    const targetRaw = asTrimmedString(value.target_item_name, 120);
    const targetParsed = targetRaw ? parseItemLabelAndPrice(targetRaw, 120) : undefined;
    const targetName = targetParsed?.name ?? targetRaw;
    if (!targetName) return undefined;

    const patch: ItemPatch = {
        target_item_name: targetName,
    };
    const nameRaw = asTrimmedString(value.name, 120);
    const nameParsed = nameRaw ? parseItemLabelAndPrice(nameRaw, 120) : undefined;
    const name = nameParsed?.name ?? nameRaw;
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
    if (description !== undefined) {
        patch.description = description;
    } else {
        const inferredPrice = targetParsed?.price ?? nameParsed?.price;
        if (inferredPrice && patch.create_if_missing === true) {
            patch.description = `Precio: ${inferredPrice}`;
        }
    }

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

    if (typeof value.clear_configurations === "boolean") {
        patch.clear_configurations = value.clear_configurations;
    }

    const activeConfiguration = asNullableString(value.active_configuration, 140);
    if (activeConfiguration !== undefined) {
        patch.active_configuration = activeConfiguration;
    }

    const configurationsReplace = sanitizeItemConfigurationPatchList(
        value.configurations_replace
    );
    if (configurationsReplace.length > 0) {
        patch.configurations_replace = configurationsReplace;
    }

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

    if (typeof patch.description === "string") {
        const baseAttachments =
            patch.attachments_replace?.length
                ? patch.attachments_replace
                : patch.attachments_add?.length
                  ? patch.attachments_add
                  : [];
        if (baseAttachments.length > 0) {
            const trimmed = stripDescriptionAttachmentOverlap(
                patch.description,
                baseAttachments
            );
            patch.description = trimmed || undefined;
        }
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
    const type = normalizeAttachmentTypeWithSemantics(
        name,
        description ?? undefined,
        normalizeAttachmentType(value.type)
    );
    const level = asInteger(value.level, 0, 20);
    const school = asTrimmedString(value.school, 120);
    const castingTimeRaw = isRecord(value.castingTime)
        ? value.castingTime
        : isRecord(value.casting_time)
          ? value.casting_time
          : null;
    const castingTimeValue =
        asTrimmedString(castingTimeRaw?.value, 120) ??
        asTrimmedString(value.casting_time, 120) ??
        asTrimmedString(value.castingTime, 120);
    const castingTimeNote = asTrimmedString(castingTimeRaw?.note, 220);
    const range = asTrimmedString(value.range, 220);
    const components = sanitizeSpellComponentPatch(value.components);
    const materials = asTrimmedString(value.materials, 220);
    const duration = asTrimmedString(value.duration, 220);
    const concentration =
        typeof value.concentration === "boolean"
            ? value.concentration
            : undefined;
    const ritual = typeof value.ritual === "boolean" ? value.ritual : undefined;
    const resourceCost = sanitizeItemAttachmentResourceCostPatch(
        value.resourceCost ?? value.resource_cost
    );
    const save = sanitizeSpellSavePatch(value.save);
    const damage = sanitizeSpellDamagePatch(value.damage);
    const actionType = normalizeFeatureActionType(
        value.actionType ?? value.action_type
    );
    const requirements = asTrimmedString(value.requirements, 220);
    const effect = asTrimmedString(value.effect, 4000);

    const normalized: Record<string, unknown> = { id, type, name };
    if (typeof level === "number") normalized.level = level;
    if (description) normalized.description = toLocalizedTextObject(description);
    if (school) normalized.school = school;
    if (castingTimeValue) {
        normalized.castingTime = {
            value: castingTimeValue,
            ...(castingTimeNote ? { note: castingTimeNote } : {}),
        };
    }
    if (range) normalized.range = range;
    if (components) normalized.components = components;
    if (materials) normalized.materials = materials;
    if (duration) normalized.duration = duration;
    if (concentration !== undefined) normalized.concentration = concentration;
    if (ritual !== undefined) normalized.ritual = ritual;
    if (resourceCost) {
        normalized.resourceCost = {
            ...(typeof resourceCost.uses_spell_slot === "boolean"
                ? { usesSpellSlot: resourceCost.uses_spell_slot }
                : {}),
            ...(typeof resourceCost.slot_level === "number"
                ? { slotLevel: resourceCost.slot_level }
                : {}),
            ...(typeof resourceCost.charges === "number"
                ? { charges: resourceCost.charges }
                : {}),
            ...(resourceCost.recharge ? { recharge: resourceCost.recharge } : {}),
            ...(resourceCost.points_label !== undefined
                ? { pointsLabel: resourceCost.points_label }
                : {}),
            ...(typeof resourceCost.points === "number"
                ? { points: resourceCost.points }
                : {}),
        };
    }
    if (save) {
        normalized.save = {
            ...(save.type ? { type: save.type } : {}),
            ...(save.save_ability ? { saveAbility: save.save_ability } : {}),
            ...(save.dc_type ? { dcType: save.dc_type } : {}),
            ...(typeof save.dc_value === "number"
                ? { dcValue: save.dc_value }
                : {}),
            ...(save.dc_stat ? { dcStat: save.dc_stat } : {}),
        };
    }
    if (damage) {
        normalized.damage = {
            ...(damage.damage_type ? { damageType: damage.damage_type } : {}),
            ...(damage.dice ? { dice: damage.dice } : {}),
            ...(damage.scaling ? { scaling: damage.scaling } : {}),
        };
    }
    if (actionType) normalized.actionType = actionType;
    if (requirements) normalized.requirements = requirements;
    if (effect) normalized.effect = effect;
    return normalized;
}

function buildAttachmentFromPatch(patch: ItemAttachmentPatch): Record<string, unknown> {
    const type = normalizeAttachmentTypeWithSemantics(
        patch.name,
        patch.description,
        patch.type
    );
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
    if (typeof patch.school === "string" && patch.school.trim()) {
        normalized.school = patch.school.trim();
    }
    if (typeof patch.casting_time === "string" && patch.casting_time.trim()) {
        normalized.castingTime = {
            value: patch.casting_time.trim(),
            ...(typeof patch.casting_time_note === "string" &&
            patch.casting_time_note.trim()
                ? { note: patch.casting_time_note.trim() }
                : {}),
        };
    }
    if (typeof patch.range === "string" && patch.range.trim()) {
        normalized.range = patch.range.trim();
    }
    if (patch.components) {
        const components = sanitizeSpellComponentPatch(patch.components);
        if (components) normalized.components = components;
    }
    if (typeof patch.materials === "string" && patch.materials.trim()) {
        normalized.materials = patch.materials.trim();
    }
    if (typeof patch.duration === "string" && patch.duration.trim()) {
        normalized.duration = patch.duration.trim();
    }
    if (typeof patch.concentration === "boolean") {
        normalized.concentration = patch.concentration;
    }
    if (typeof patch.ritual === "boolean") normalized.ritual = patch.ritual;
    if (patch.resource_cost) {
        const resourceCost = sanitizeItemAttachmentResourceCostPatch(
            patch.resource_cost
        );
        if (resourceCost) {
            normalized.resourceCost = {
                ...(typeof resourceCost.uses_spell_slot === "boolean"
                    ? { usesSpellSlot: resourceCost.uses_spell_slot }
                    : {}),
                ...(typeof resourceCost.slot_level === "number"
                    ? { slotLevel: resourceCost.slot_level }
                    : {}),
                ...(typeof resourceCost.charges === "number"
                    ? { charges: resourceCost.charges }
                    : {}),
                ...(resourceCost.recharge
                    ? { recharge: resourceCost.recharge }
                    : {}),
                ...(resourceCost.points_label !== undefined
                    ? { pointsLabel: resourceCost.points_label }
                    : {}),
                ...(typeof resourceCost.points === "number"
                    ? { points: resourceCost.points }
                    : {}),
            };
        }
    }
    if (patch.save) {
        const save = sanitizeSpellSavePatch(patch.save);
        if (save) {
            normalized.save = {
                ...(save.type ? { type: save.type } : {}),
                ...(save.save_ability ? { saveAbility: save.save_ability } : {}),
                ...(save.dc_type ? { dcType: save.dc_type } : {}),
                ...(typeof save.dc_value === "number" ? { dcValue: save.dc_value } : {}),
                ...(save.dc_stat ? { dcStat: save.dc_stat } : {}),
            };
        }
    }
    if (patch.damage) {
        const damage = sanitizeSpellDamagePatch(patch.damage);
        if (damage) {
            normalized.damage = {
                ...(damage.damage_type ? { damageType: damage.damage_type } : {}),
                ...(damage.dice ? { dice: damage.dice } : {}),
                ...(damage.scaling ? { scaling: damage.scaling } : {}),
            };
        }
    }
    if (patch.action_type) normalized.actionType = patch.action_type;
    if (typeof patch.requirements === "string" && patch.requirements.trim()) {
        normalized.requirements = patch.requirements.trim();
    }
    if (typeof patch.effect === "string" && patch.effect.trim()) {
        normalized.effect = patch.effect.trim();
    }
    return normalized;
}

function attachmentKey(value: Record<string, unknown>) {
    const name = asTrimmedString(value.name, 140) ?? "";
    const type = asTrimmedString(value.type, 32) ?? "other";
    return `${normalizeForItemMatch(type)}::${normalizeForItemMatch(name)}`;
}

function normalizeExistingItemConfiguration(value: unknown): Record<string, unknown> | null {
    if (!isRecord(value)) return null;
    const name = asTrimmedString(value.name, 140);
    if (!name) return null;

    const id = asTrimmedString(value.id, 80) ?? buildGeneratedId("cfg");
    const description = extractLocalizedTextValue(value.description, 4000);
    const usage = asTrimmedString(value.usage, 240);
    const damage = asTrimmedString(value.damage, 240);
    const range = asTrimmedString(value.range, 240);
    const magicBonusRaw = Number(value.magicBonus ?? value.magic_bonus);
    const magicBonus = Number.isFinite(magicBonusRaw)
        ? Math.round(clampNumber(magicBonusRaw, -30, 30))
        : undefined;

    const attachmentsRaw = Array.isArray(value.attachments) ? value.attachments : [];
    const attachments = attachmentsRaw
        .map((entry) => normalizeExistingItemAttachment(entry))
        .filter((entry): entry is Record<string, unknown> => !!entry);

    const normalized: Record<string, unknown> = {
        id,
        name,
    };
    if (description) normalized.description = toLocalizedTextObject(description);
    if (usage) normalized.usage = usage;
    if (damage) normalized.damage = damage;
    if (range) normalized.range = range;
    if (typeof magicBonus === "number") normalized.magicBonus = magicBonus;
    if (attachments.length > 0) normalized.attachments = attachments;
    return normalized;
}

function normalizeExistingItemConfigurations(value: unknown) {
    if (!Array.isArray(value)) return [] as Record<string, unknown>[];
    return value
        .map((entry) => normalizeExistingItemConfiguration(entry))
        .filter((entry): entry is Record<string, unknown> => !!entry);
}

function buildConfigurationFromPatch(
    patch: ItemConfigurationPatch,
    existingId?: string
): Record<string, unknown> {
    const normalized: Record<string, unknown> = {
        id: existingId ?? buildGeneratedId("cfg"),
        name: patch.name,
    };
    if (typeof patch.description === "string" && patch.description.trim()) {
        normalized.description = toLocalizedTextObject(patch.description.trim());
    }
    if (typeof patch.usage === "string" && patch.usage.trim()) {
        normalized.usage = patch.usage.trim();
    }
    if (typeof patch.damage === "string" && patch.damage.trim()) {
        normalized.damage = patch.damage.trim();
    }
    if (typeof patch.range === "string" && patch.range.trim()) {
        normalized.range = patch.range.trim();
    }
    if (typeof patch.magic_bonus === "number") {
        normalized.magicBonus = patch.magic_bonus;
    }
    if (Array.isArray(patch.attachments_replace) && patch.attachments_replace.length > 0) {
        normalized.attachments = patch.attachments_replace.map((entry) =>
            buildAttachmentFromPatch(entry)
        );
    }
    return normalized;
}

function findConfigurationByName(
    configurations: Record<string, unknown>[],
    name: string
) {
    const target = normalizeForItemMatch(name);
    let found = configurations.find((config) => {
        const configName = asTrimmedString(config.name, 140);
        if (!configName) return false;
        return normalizeForItemMatch(configName) === target;
    });
    if (found) return found;
    found = configurations.find((config) => {
        const configName = asTrimmedString(config.name, 140);
        if (!configName) return false;
        const normalized = normalizeForItemMatch(configName);
        return normalized.includes(target) || target.includes(normalized);
    });
    return found;
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

function findItemIndex(
    items: Record<string, unknown>[],
    targetName: string,
    allowFuzzy = true
) {
    const target = normalizeForItemMatch(targetName);
    let index = items.findIndex((item) => {
        const itemName = asTrimmedString(item.name, 120);
        if (!itemName) return false;
        return normalizeForItemMatch(itemName) === target;
    });
    if (index >= 0) return index;
    if (!allowFuzzy) return -1;

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
    const targetLabel = parseItemLabelAndPrice(patch.target_item_name, 120);
    const canonicalTargetName = targetLabel?.name ?? patch.target_item_name;
    const allowFuzzyMatch = patch.create_if_missing !== true;

    let itemIndex = findItemIndex(items, canonicalTargetName, allowFuzzyMatch);
    if (itemIndex < 0 && canonicalTargetName !== patch.target_item_name) {
        itemIndex = findItemIndex(items, patch.target_item_name, allowFuzzyMatch);
    }
    let changed = false;
    let createdNow = false;
    if (itemIndex < 0) {
        if (!patch.create_if_missing) {
            return {
                applied: false,
                message: `No se encontró el objeto "${canonicalTargetName}" en el inventario.`,
            };
        }
        const created: Record<string, unknown> = {
            id: buildGeneratedId("item"),
            name: patch.name ?? canonicalTargetName,
            category: patch.category ?? "misc",
            equippable: false,
            equipped: false,
            sortOrder: items.length,
        };
        if (patch.description === undefined && targetLabel?.price) {
            created.description = toLocalizedTextObject(`Precio: ${targetLabel.price}`);
        }
        items.push(created);
        itemIndex = items.length - 1;
        changed = true;
        createdNow = true;
    }

    const current = { ...items[itemIndex] };
    if (!createdNow && canonicalTargetName !== patch.target_item_name) {
        const currentName = asTrimmedString(current.name, 120);
        if (
            currentName &&
            normalizeForItemMatch(currentName) ===
                normalizeForItemMatch(patch.target_item_name)
        ) {
            current.name = canonicalTargetName;
            changed = true;
        }
    }
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

    if (patch.clear_configurations || patch.configurations_replace?.length) {
        const existingConfigurations = normalizeExistingItemConfigurations(
            current.configurations
        );
        if (patch.configurations_replace?.length) {
            const nextConfigurations = patch.configurations_replace.map((entry) => {
                const existing = findConfigurationByName(
                    existingConfigurations,
                    entry.name
                );
                const existingId = asTrimmedString(existing?.id, 80);
                return buildConfigurationFromPatch(entry, existingId);
            });
            if (nextConfigurations.length > 0) {
                current.configurations = nextConfigurations;
                if (patch.active_configuration === undefined) {
                    const previousActive = asTrimmedString(
                        current.activeConfigurationId,
                        80
                    );
                    const hasPreviousActive =
                        !!previousActive &&
                        nextConfigurations.some(
                            (entry) =>
                                asTrimmedString(entry.id, 80) === previousActive
                        );
                    if (!hasPreviousActive) {
                        current.activeConfigurationId = asTrimmedString(
                            nextConfigurations[0]?.id,
                            80
                        );
                    }
                }
            } else {
                delete current.configurations;
                delete current.activeConfigurationId;
            }
            changed = true;
        } else if (patch.clear_configurations) {
            delete current.configurations;
            delete current.activeConfigurationId;
            changed = true;
        }
    }

    if (patch.active_configuration !== undefined) {
        if (patch.active_configuration === null || patch.active_configuration === "") {
            if (current.activeConfigurationId !== undefined) {
                delete current.activeConfigurationId;
                changed = true;
            }
        } else {
            const existingConfigurations = normalizeExistingItemConfigurations(
                current.configurations
            );
            const selectedConfiguration = findConfigurationByName(
                existingConfigurations,
                patch.active_configuration
            );
            const selectedId = asTrimmedString(selectedConfiguration?.id, 80);
            if (selectedId && current.activeConfigurationId !== selectedId) {
                current.activeConfigurationId = selectedId;
                changed = true;
            }
        }
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
                const mergeKeys = [
                    "school",
                    "castingTime",
                    "range",
                    "components",
                    "materials",
                    "duration",
                    "concentration",
                    "ritual",
                    "resourceCost",
                    "save",
                    "damage",
                    "actionType",
                    "requirements",
                    "effect",
                ] as const;
                for (const mergeKey of mergeKeys) {
                    if (built[mergeKey] !== undefined) {
                        existing[mergeKey] = built[mergeKey];
                    }
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
        message: `Objeto "${canonicalTargetName}" actualizado en inventario.`,
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

function buildAssistantUserPayload(
    prompt: string,
    context: Record<string, unknown>
) {
    const assistantMode = normalizeAssistantMode(context?.assistantMode);
    const trainingSubmode = normalizeTrainingSubmode(context?.trainingSubmode);
    return {
        user_request: prompt,
        context,
        assistant_mode: assistantMode,
        training_submode:
            assistantMode === "training" ? trainingSubmode : undefined,
        reasoning_contract: {
            mode: "deterministic-structured-extraction",
            strict_json_only: true,
            max_actions: 4,
            prioritize_actionable_changes: true,
            avoid_duplicate_information: true,
            extract_and_map_long_object_cards: true,
            infer_target_character_from_context: true,
            prefer_minimal_complete_patches: true,
        },
        training_contract:
            assistantMode === "training"
                ? {
                      enabled: true,
                      submode: trainingSubmode,
                      explain_prompt_quality: true,
                      include_better_prompt_template: true,
                      sandbox_drafts_are_never_persisted: true,
                      avoid_apply_without_explicit_confirmation: true,
                  }
                : undefined,
        parsing_priorities: [
            "resolver personaje objetivo",
            "extraer entidad principal (objeto/hechizo/rasgo/estadistica)",
            "separar narrativa vs mecanica",
            "mapear mecanicas a estructuras del esquema",
            "devolver cambios minimos pero completos",
        ],
        character_creation_contract: {
            parse_dense_parameter_lists: true,
            include_all_detected_fields: true,
            avoid_partial_stat_updates_when_more_are_provided: true,
            prioritize_complete_create_payloads: true,
        },
        dnd_rules_aid: {
            ability_scores: ["STR", "DEX", "CON", "INT", "WIS", "CHA"],
            ability_modifier_formula: "floor((score - 10) / 2)",
            proficiency_bonus_by_level: {
                "1-4": 2,
                "5-8": 3,
                "9-12": 4,
                "13-16": 5,
                "17-20": 6,
            },
            feature_action_types: ["action", "bonus", "reaction", "passive"],
        },
        ui_render_contract: {
            item_description_is_base_only: true,
            mechanics_should_live_in_attachments: true,
            avoid_repeating_attachment_text_in_description: true,
            avoid_generic_attachment_titles: true,
            action_blocks_should_map_to_action_attachment: true,
            spell_blocks_should_map_to_spell_attachment: true,
            modular_configurations_supported: true,
            modular_stats_should_live_in_configuration_fields: true,
        },
        text_format_contract: {
            allow_markdown_lists: true,
            prefer_paragraph_breaks: true,
            use_bullets_when_multiple_short_points: true,
            use_numbered_list_for_steps_or_sequences: true,
            dont_force_lists_for_single_sentence: true,
            avoid_single_long_line_blocks: true,
        },
        object_structuring_contract: {
            strip_price_from_name: true,
            preserve_rarity_attunement_state_in_metadata: true,
            split_long_cards_into_base_plus_mechanics: true,
            merge_subsections_into_parent_spell_when_needed: true,
            reject_placeholder_actions: true,
            detect_configuration_modes: true,
        },
        output_quality_gate: [
            "Hay personaje objetivo resoluble o inferido",
            "Cada accion es create/update valido",
            "No hay texto duplicado descripcion/adjuntos",
            "Nombre de objeto limpio sin precio ni decoradores",
            "Bloques mecanicos mapeados al tipo de adjunto correcto",
            "Si hay configuraciones A/B, usar item_patch.configurations_replace",
        ],
    };
}

function buildAssistantSystemPrompt(mode: AssistantMode = "normal") {
    const attachmentFieldList = ITEM_ATTACHMENT_STRUCTURED_AI_KEYS.join(", ");
    const basePrompt = [
        "ROL",
        "Eres un asistente experto en estructurar cambios para una web de campaña DnD.",
        "Tu tarea es convertir texto libre en acciones create/update válidas para personajes.",
        "",
        "CONTRATO DE SALIDA",
        "Devuelve SOLO JSON válido con el esquema pedido: { reply, actions }.",
        "No añadas texto fuera del JSON.",
        "No inventes IDs ni campos fuera del esquema.",
        "Máximo 4 acciones por respuesta.",
        "",
        "FUENTES DE VERDAD",
        "Prioriza context.visibleCharacters, inventorySnapshot y productKnowledge sobre suposiciones.",
        "Si existe clientContext.selectedCharacter y la orden no especifica objetivo, úsalo.",
        "Si la orden usa 'en X', 'para X' o 'a X', prioriza ese personaje.",
        "",
        "REGLAS DE MUTACIÓN",
        "Usa create/update únicamente.",
        "Para objetos del inventario usa data.item_patch (NO details_patch.inventory).",
        "Para crear objeto nuevo usa item_patch.create_if_missing=true.",
        "Para hechizos personalizados usa custom_spell_patch.",
        "Para rasgos/habilidades personalizadas usa custom_feature_patch.",
        "Para aprender/olvidar hechizos por nivel usa learned_spell_patch.",
        "Si la petición es crear personaje/companion, rellena TODOS los campos detectables (nombre, clase, raza, nivel, xp, hp, ca, velocidad, stats y detalles).",
        "Cuando el usuario pase una lista de parámetros (líneas, comas, bullets o clave:valor), parsea cada campo válido y no dejes cambios fuera.",
        "No limites la respuesta a 1-2 estadísticas si hay más datos explícitos en la instrucción.",
        "Para crear objeto desde cero, evita propuestas mínimas: incluye categoría, descripción base y mecánicas tipadas cuando existan.",
        "",
        "CONOCIMIENTO DND (OBLIGATORIO)",
        "Asume reglas de D&D 5e/2024 para modelar cambios coherentes.",
        "Atributos: STR, DEX, CON, INT, WIS, CHA.",
        "Modificador de atributo: floor((score - 10)/2).",
        "Bono de competencia orientativo por nivel: 1-4:+2, 5-8:+3, 9-12:+4, 13-16:+5, 17-20:+6.",
        "Diferencia bien action/bonus/reaction/passive al mapear habilidades.",
        "Si faltan datos clave para un personaje nuevo, no inventes silenciosamente: explícitalo en reply y aun así devuelve acciones con lo que sí sea válido.",
        "",
        "PROTOCOLO OPERATIVO (OBLIGATORIO)",
        "1) Detecta personaje objetivo por: orden explícita > clientContext.selectedCharacter > coincidencia por nombre.",
        "2) Detecta la intención principal: crear, actualizar, equipar, aprender, olvidar, etc.",
        "3) Segmenta el texto del usuario en bloques semánticos antes de mapear al esquema.",
        "4) Distingue narrativa vs mecánica; solo la narrativa/base va a description.",
        "5) Convierte cada bloque mecánico en attachment tipado (trait/ability/action/spell).",
        "6) Valida anti-duplicación y limpieza de nombres.",
        "7) Genera acciones mínimas pero completas (sin placeholders).",
        "8) Redacta reply corto en español y deja todo lo ejecutable en actions.",
        "",
        "PARSER DE OBJETOS (OBLIGATORIO)",
        "Cuando el usuario pega una ficha larga de objeto, primero segmenta:",
        "1) Nombre principal del objeto",
        "2) Metadatos (tipo, rareza, sintonización, estado, precio, etc.)",
        "3) Descripción narrativa",
        "4) Bloques mecánicos (pasivas, focos, poderes, conjuros, estados, efectos)",
        "Mapeo recomendado:",
        "- 'Propiedad pasiva' => attachment type='trait'",
        "- 'Foco ...' => attachment type='ability'",
        "- 'Poder especial ...' => attachment type='action'",
        "- Bloque con señales de conjuro (alcance/área/salvación/duración/componentes/CD) => type='spell' (o 'cantrip' si aplica)",
        "- Estados/DoT persistentes => type='ability' o 'trait' según naturaleza",
        "- Si hay 'CONFIGURACIÓN A/B', usar item_patch.configurations_replace (NO mezclar todo en attachments globales).",
        "- En cada configuración usa campos: name, description, usage, damage, range, magic_bonus, attachments_replace.",
        "- Usa item_patch.active_configuration para marcar el modo inicial activo.",
        "Si un bloque menciona conjuros pero el título es 'FOCO ...', se mantiene como ability (no spell).",
        "Si un bloque es 'PODER ESPECIAL ...' y lanza un conjuro, ese bloque es action y el conjuro va en un attachment spell separado.",
        `Para adjuntos tipo spell/cantrip rellena campos estructurados cuando existan: ${attachmentFieldList}.`,
        "Para adjuntos tipo ability/action/classFeature rellena action_type, resource_cost, requirements, effect cuando el texto lo indique.",
        "No dejes esos parámetros metidos solo en description si pueden ir en campos estructurados.",
        "Formato de texto: usa markdown legible en description/attachment.description solo cuando aporte claridad.",
        "Si hay varios puntos cortos, usa lista con viñetas.",
        "Si hay pasos o secuencia temporal, usa lista numerada.",
        "Si es narrativa corta o una sola idea, usa párrafo normal (sin forzar listas).",
        "",
        "REGLAS FINAS DE OBJETOS",
        "No incluyas precio en el nombre del objeto (ej: '- 35 po' debe salir del nombre).",
        "Metadatos compactos (precio, rareza, sintonización) pueden ir en description si no hay campo dedicado.",
        "No crear adjuntos desde líneas puramente administrativas: 'tipo', 'rareza', 'precio', 'descripción'.",
        "Si hay 'Uso: acción' + efecto corto, crear action con título del efecto (sin duplicar 'Uso: acción' en descripción).",
        "Si existe conjuro principal y subbloques como 'Efecto inicial', intégralos dentro del mismo spell.",
        "En objetos contenedor (bolsas/códices con partes), mantener un objeto principal y partes como adjuntos coherentes.",
        "En objetos modulares (armas transformables), mantener narrativa base en item.description y mecánicas por modo en configurations_replace.",
        "Si aparecen encabezados genéricos como 'Características básicas' o 'Propiedades especiales', no crear un adjunto único genérico: dividir en adjuntos concretos por línea mecánica o por bloques 'Nombre: efecto'.",
        "Evita bloques de texto en una sola línea; usa saltos de párrafo cuando la descripción sea larga.",
        "",
        "ANTIDUPLICACIÓN (OBLIGATORIO)",
        "No repitas en item.description lo que ya esté modelado como attachments.",
        "item.description debe contener solo narrativa/base del objeto y metadatos esenciales.",
        "No crees attachments desde etiquetas genéricas: 'uso', 'efecto', 'tipo', 'rareza', 'precio', 'descripción'.",
        "Si un bloque incluye 'Uso: acción' y un efecto corto, el attachment puede ser action con nombre del efecto.",
        "",
        "NORMALIZACIÓN",
        "Tolera typos, emojis, ES/EN mixto y separadores (---).",
        "Limpia prefijos decorativos del nombre (emoji, 'OBJETO ÚNICO —', etc.).",
        "Evita nombres triviales de adjunto como 'Efecto inicial' si debe integrarse en el conjuro principal.",
        "Si la orden contiene varios objetos, crea una acción por objeto sin mezclar sus campos.",
        "No pierdas bloques por saltos de línea o markdown decorativo.",
        "",
        "CONTROL DE CALIDAD FINAL (OBLIGATORIO)",
        "Antes de responder, verifica internamente:",
        "- ¿Hay cambio accionable claro? Si sí, no devuelvas actions vacío.",
        "- ¿Cada acción apunta a un target_character_id válido/inferible?",
        "- ¿Los nombres están limpios y no contienen precio ni ruido?",
        "- ¿Description y attachments no duplican contenido?",
        "- ¿El tipo de attachment refleja su mecánica real?",
        "",
        "CALIDAD",
        "Prioriza acciones concretas y aplicables sobre respuestas vacías.",
        "Si hay señal clara de cambio, propone al menos una acción viable.",
        "Si realmente no hay cambio accionable, devuelve actions: [].",
        "reply breve y útil en español.",
    ];

    if (mode === "training") {
        basePrompt.push(
            "",
            "MODO ENTRENAMIENTO (OBLIGATORIO)",
            "Estás en modo entrenamiento: además de proponer acciones si hay cambios claros, debes enseñar al usuario a redactar mejores prompts.",
            "Lee context.trainingSubmode:",
            "- ai_prompt: NO devuelvas acciones aplicables. Entrega ejercicios/prompts de práctica y criterios de validación.",
            "- sandbox_object: puedes devolver actions como borrador de entrenamiento editable en chat.",
            "Si la orden parece petición de ayuda de prompt (no mutación concreta), devuelve actions: [] y reply con guía práctica.",
            "Cuando sí haya mutación clara, incluye acciones válidas y en reply añade una versión de prompt recomendada para futuras órdenes.",
            "No apliques cambios por tu cuenta: solo propones acciones para confirmación."
        );
    }

    return basePrompt.join("\n");
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

function normalizeAssistantMode(value: unknown): AssistantMode {
    const normalized = asTrimmedString(value, 24)?.toLowerCase();
    if (normalized === "training" || normalized === "entrenamiento") {
        return "training";
    }
    return "normal";
}

function normalizeTrainingSubmode(value: unknown): TrainingSubmode {
    const normalized = asTrimmedString(value, 40)?.toLowerCase();
    if (
        normalized === "ai_prompt" ||
        normalized === "prompt" ||
        normalized === "coach"
    ) {
        return "ai_prompt";
    }
    if (
        normalized === "sandbox_object" ||
        normalized === "sandbox" ||
        normalized === "draft"
    ) {
        return "sandbox_object";
    }
    return "sandbox_object";
}

function isTrainingApprovalIntent(prompt: string) {
    const normalized = normalizeForMatch(extractCurrentUserInstruction(prompt));
    const patterns = [
        "esta correcto",
        "está correcto",
        "correcto",
        "validado",
        "ok",
        "listo",
        "esta bien",
        "está bien",
        "perfecto",
    ];
    return patterns.some((pattern) => normalized.includes(pattern));
}

function isTrainingPromptRequest(prompt: string) {
    const normalized = normalizeForMatch(extractCurrentUserInstruction(prompt));
    const patterns = [
        "modo entrenamiento",
        "entrenamiento",
        "prompt",
        "mejora este prompt",
        "mejorame este prompt",
        "ayudame con el prompt",
        "ayudame a redactar",
        "como lo pido",
        "como deberia pedirlo",
        "como debería pedirlo",
        "dame un prompt",
        "pasa un prompt",
    ];
    return patterns.some((pattern) => normalized.includes(pattern));
}

function buildTrainingPromptTemplate({
    prompt,
    clientContext,
}: {
    prompt: string;
    clientContext?: ClientContextPayload | null;
}) {
    const instruction = extractCurrentUserInstruction(prompt);
    const normalized = normalizeForMatch(instruction);
    const selectedName =
        asTrimmedString(clientContext?.selectedCharacter?.name, 120) ??
        "<nombre del personaje>";

    const looksLikeObject =
        normalized.includes("objeto") ||
        normalized.includes("arma") ||
        normalized.includes("armadura") ||
        normalized.includes("inventario") ||
        normalized.includes("item") ||
        normalized.includes("accesorio");
    const looksLikeSpell =
        normalized.includes("hechizo") ||
        normalized.includes("conjuro") ||
        normalized.includes("cantrip") ||
        normalized.includes("truco") ||
        normalized.includes("spell");
    const looksLikeFeature =
        normalized.includes("rasgo") ||
        normalized.includes("habilidad") ||
        normalized.includes("accion") ||
        normalized.includes("acción") ||
        normalized.includes("trait") ||
        normalized.includes("ability");

    if (looksLikeObject) {
        return [
            `Objetivo: ${selectedName}`,
            "Acción: crear o actualizar objeto",
            "Nombre del objeto: <nombre limpio sin precio>",
            "Categoría: weapon|armor|accessory|consumable|tool|misc",
            "Rareza/attunement (si aplica): <texto breve>",
            "Descripción base (solo lore, sin mecánicas duplicadas):",
            "<texto>",
            "Mecánicas separadas:",
            "- Rasgo: <nombre> -> <efecto pasivo>",
            "- Habilidad: <nombre> -> <beneficio continuo>",
            "- Acción: <nombre> -> <activación y efecto>",
            "- Hechizo adjunto (si aplica): <nombre> con alcance/salvación/daño estructurado",
            "Instrucción final: crea/actualiza este objeto en el inventario del objetivo.",
        ].join("\n");
    }

    if (looksLikeSpell) {
        return [
            `Objetivo: ${selectedName}`,
            "Acción: crear o actualizar hechizo personalizado",
            "Nombre del hechizo: <nombre>",
            "Nivel: <0-9>",
            "Escuela: <escuela o vacío>",
            "Alcance: <valor>",
            "Salvación o tirada: <tipo + atributo>",
            "Daño: <dados + tipo>",
            "Duración/Concentración/Ritual: <valores>",
            "Descripción (solo efecto narrativo y reglas que no estén ya en campos estructurados):",
            "<texto>",
        ].join("\n");
    }

    if (looksLikeFeature) {
        return [
            `Objetivo: ${selectedName}`,
            "Acción: crear o actualizar rasgo/habilidad personalizada",
            "Colección: customTraits o customClassAbilities",
            "Nombre: <nombre>",
            "Tipo de acción: action|bonus|reaction|passive",
            "Requisitos/coste (si aplica): <texto>",
            "Efecto:",
            "<texto claro y corto>",
        ].join("\n");
    }

    return [
        `Objetivo: ${selectedName}`,
        "Acción exacta: crear|actualizar|equipar|aprender|olvidar",
        "Entidad: personaje|objeto|hechizo|rasgo|habilidad",
        "Nombre exacto de la entidad:",
        "<nombre>",
        "Campos a cambiar (uno por línea):",
        "- campo: valor",
        "Notas:",
        "- separar descripción base vs mecánicas",
        "- evitar meter precio o metadatos en el nombre",
    ].join("\n");
}

function buildTrainingModeReply({
    prompt,
    role,
    clientContext,
    trainingSubmode = "sandbox_object",
    actionCount = 0,
}: {
    prompt: string;
    role: CampaignRole;
    clientContext?: ClientContextPayload | null;
    trainingSubmode?: TrainingSubmode;
    actionCount?: number;
}) {
    const instruction = extractCurrentUserInstruction(prompt);
    const compactInstruction =
        instruction.length > 500
            ? `${instruction.slice(0, 500)}...`
            : instruction;
    const roleScope =
        role === "DM"
            ? "Como DM puedes entrenar prompts para cualquier personaje de la campaña."
            : "Como jugador, en entrenamiento solo puedes simular cambios sobre tus personajes (sin guardar).";
    const uiHint = describeUIContextHint(clientContext);
    const template = buildTrainingPromptTemplate({ prompt, clientContext });

    const lines = [
        "Modo entrenamiento activo.",
        trainingSubmode === "ai_prompt"
            ? "Submodo: IA propone prompts/ejercicios (no se generan objetos reales)."
            : "Submodo: sandbox de borrador editable en chat (no se generan objetos reales).",
        roleScope,
        uiHint ? `Contexto detectado: ${uiHint}` : null,
        actionCount > 0
            ? `Detecté ${actionCount} cambio(s) accionable(s) con tu texto actual.`
            : "Con este texto no hay cambios estructurados listos para aplicar todavía.",
        compactInstruction
            ? `Resumen de tu instrucción:\n${compactInstruction}`
            : null,
        "Prompt recomendado:",
        "```txt",
        template,
        "```",
        "Consejo: separa lore (descripción base) y mecánicas (adjuntos) para evitar duplicados.",
    ];

    return lines.filter((line): line is string => !!line).join("\n\n");
}

function buildTrainingSimulationResults(actions: SanitizedAction[]): MutationResult[] {
    if (actions.length === 0) {
        return [
            {
                operation: "update",
                status: "skipped",
                message:
                    "Modo entrenamiento: no se aplicaron cambios reales. No había acciones válidas que simular.",
            },
        ];
    }
    return actions.map((action) => ({
        operation: action.operation,
        characterId: action.characterId,
        status: "skipped",
        message:
            "Modo entrenamiento: borrador simulado. No se aplicó ningún cambio real en la campaña.",
    }));
}

const TRAINING_SIGNATURE_CACHE_LIMIT = 140;
let recentTrainingChallengeSignatures: string[] = [];

function pickRandomTrainingValue<T>(options: readonly T[]): T {
    return options[Math.floor(Math.random() * options.length)];
}

function randomTrainingInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function maybeTraining(probability = 0.5) {
    return Math.random() < probability;
}

function pushTrainingChallengeSignature(signature: string) {
    recentTrainingChallengeSignatures = recentTrainingChallengeSignatures.filter(
        (entry) => entry !== signature
    );
    recentTrainingChallengeSignatures.push(signature);
    if (recentTrainingChallengeSignatures.length > TRAINING_SIGNATURE_CACHE_LIMIT) {
        recentTrainingChallengeSignatures = recentTrainingChallengeSignatures.slice(
            recentTrainingChallengeSignatures.length - TRAINING_SIGNATURE_CACHE_LIMIT
        );
    }
}

function hasRecentTrainingChallengeSignature(signature: string) {
    return recentTrainingChallengeSignatures.includes(signature);
}

function flattenTrainingText(value: string) {
    return value.replace(/\s+/g, " ").trim();
}

function isGenericTrainingAutoInstruction(instruction: string) {
    const normalized = normalizeForMatch(instruction);
    return (
        normalized.includes("propon un ejercicio de entrenamiento") ||
        normalized.includes("propose a training exercise") ||
        normalized.includes("dame un ejercicio de entrenamiento") ||
        normalized.includes("give me a training challenge")
    );
}

function inferTrainingCategoryFromTheme(theme?: string): ItemCategory | null {
    const normalized = normalizeForMatch(theme ?? "");
    if (!normalized) return null;
    if (
        /\b(espada|daga|arco|arma|lanza|hacha|martillo|ballesta|guja|garrote)\b/.test(
            normalized
        )
    ) {
        return "weapon";
    }
    if (
        /\b(armadura|yelmo|casco|guantelete|escudo|coraza|botas|grebas)\b/.test(
            normalized
        )
    ) {
        return "armor";
    }
    if (
        /\b(pocion|elixir|frasco|polvo|ampolla|consumible|vial|unguento)\b/.test(
            normalized
        )
    ) {
        return "consumable";
    }
    if (
        /\b(codice|libro|grimorio|amuleto|anillo|colgante|reliquia|talisman)\b/.test(
            normalized
        )
    ) {
        return "accessory";
    }
    if (/\b(herramienta|kit|set|instrumento|brujula|compas)\b/.test(normalized)) {
        return "tool";
    }
    return null;
}

function extractTrainingThemeToken(theme?: string) {
    const cleaned = normalizeForMatch(theme ?? "")
        .split(/\s+/)
        .map((entry) => entry.trim())
        .filter(
            (entry) =>
                entry.length >= 4 &&
                ![
                    "crea",
                    "objeto",
                    "entrenamiento",
                    "prompt",
                    "para",
                    "sobre",
                    "con",
                    "esta",
                    "web",
                    "quiero",
                    "actualiza",
                    "personaje",
                ].includes(entry)
        );
    return cleaned.slice(0, 2).join(" ");
}

type TrainingGeneratedChallenge = {
    name: string;
    category: ItemCategory;
    rarity: string;
    description: string;
    sourceText: string;
    attachments: ItemAttachmentPatch[];
    signature: string;
};

function buildTrainingGeneratedChallenge(theme?: string): TrainingGeneratedChallenge {
    const inferredCategory = inferTrainingCategoryFromTheme(theme);
    const category: ItemCategory =
        inferredCategory ??
        pickRandomTrainingValue<ItemCategory>([
            "weapon",
            "armor",
            "accessory",
            "consumable",
            "tool",
            "misc",
        ]);
    const rarity = pickRandomTrainingValue([
        "infrecuente",
        "raro",
        "muy raro",
        "único",
    ]);
    const attunementClause = pickRandomTrainingValue([
        "sí (druida o guardián natural)",
        "sí (lanzador con vínculo arcano)",
        "sí (portador que haya superado un ritual)",
        "no",
    ]);
    const origin = pickRandomTrainingValue([
        "ruinas micénicas cubiertas de musgo",
        "forja subterránea de una orden perdida",
        "templo hundido en marismas",
        "archivo arcano clausurado",
        "santuario dracónico semiderruido",
        "bosque de niebla permanente",
        "cripta de vidrio volcánico",
        "observatorio astral en desuso",
    ]);
    const material = pickRandomTrainingValue([
        "madera petrificada con vetas metálicas",
        "hueso mineralizado",
        "acero negro runado",
        "cristal ahumado con inclusiones de savia",
        "obsidiana lechosa",
        "latón antiguo con filamentos vivos",
        "piedra volcánica pulida",
        "corteza viva endurecida",
    ]);
    const visualCue = pickRandomTrainingValue([
        "late con un pulso tenue al acercarse a magia hostil",
        "desprende un zumbido casi inaudible en silencio total",
        "muestra grietas luminosas que cambian según la luna",
        "reacciona con escarcha azul al contacto con sangre corrupta",
        "emite chispas verdes cuando detecta runas activas",
        "oscurece su superficie cuando hay peligro inminente",
    ]);
    const namePrefix = pickRandomTrainingValue([
        "Reliquia",
        "Núcleo",
        "Códice",
        "Foco",
        "Daga",
        "Guantelete",
        "Lámpara",
        "Broche",
        "Talismán",
        "Vial",
        "Cuerda",
    ]);
    const nameCoreByCategory: Record<ItemCategory, string[]> = {
        weapon: [
            "de Raíz",
            "del Velo",
            "de Ceniza",
            "del Eclipse",
            "de Niebla",
            "de Estirpe Verde",
        ],
        armor: [
            "de Corteza",
            "del Bastión Vivo",
            "de la Placa Dormida",
            "de Guardia Lunar",
            "de Bruma Férrea",
            "de Umbral Umbrío",
        ],
        accessory: [
            "del Bosque Mudo",
            "de Memoria Ancestral",
            "del Pulso Rúnico",
            "de Vigilia Astral",
            "de Eco Profundo",
            "de la Marea Negra",
        ],
        consumable: [
            "de Rocío Frío",
            "de Savia Tensa",
            "de Polvo Silente",
            "de Flor Corrupta",
            "de Bruma Curativa",
            "de Resina Sombría",
        ],
        tool: [
            "de Cartografía Oculta",
            "del Artesano Verde",
            "de Ajuste Arcano",
            "del Rastro Ciego",
            "de Apertura Doble",
            "de Ingeniería Fúngica",
        ],
        misc: [
            "del Umbral",
            "de la Quiebra Azul",
            "del Trenzado Profundo",
            "de Capa Feral",
            "del Bastón Roto",
            "de la Vetusta Guardia",
        ],
    };
    const nameSuffix = pickRandomTrainingValue([
        "Latente",
        "Resonante",
        "Dormida",
        "Injertada",
        "Velada",
        "Persistente",
        "de Vharlan",
        "de Thamior",
        "del Círculo Naciente",
    ]);
    const themeToken = extractTrainingThemeToken(theme);
    const themedTail = themeToken ? ` (${themeToken})` : "";
    const name = `${namePrefix} ${pickRandomTrainingValue(
        nameCoreByCategory[category]
    )} ${nameSuffix}${themedTail}`.replace(/\s+/g, " ").trim();

    const passiveLabel = pickRandomTrainingValue([
        "Detector de anomalías",
        "Lectura de rastros",
        "Memoria vegetal",
        "Vigilancia del umbral",
        "Alerta de corrupción",
        "Eco de amenaza",
    ]);
    const passiveEffect = pickRandomTrainingValue([
        "percibes vibraciones cuando hay infección, magia inestable o alteraciones rituales cerca",
        "identificas rastros alterados y rutas manipuladas con ventaja en pruebas de investigación de entorno",
        "reconoces escrituras parciales y símbolos incompletos sin tirada adicional",
        "detectas focos de energía residual en estructuras antiguas a corta distancia",
        "notas patrones de podredumbre o energía muerta antes de que sean visibles",
        "el objeto reacciona con pulsos que anticipan zonas peligrosas",
    ]);

    const utilityLabel = pickRandomTrainingValue([
        "Canalización focal",
        "Asistencia de taller",
        "Ajuste de precisión",
        "Interfaz viva",
        "Trenzado adaptativo",
        "Sincronía de campo",
    ]);
    const utilityEffect = pickRandomTrainingValue([
        "puede actuar como foco de lanzamiento y herramienta especializada según la escena",
        "otorga ventaja para crear, reparar o modificar objetos durante descansos",
        "reduce errores al manipular runas, cierres o componentes delicados",
        "permite estabilizar temporalmente componentes dañados con una reparación menor",
        "mejora la lectura de mecanismos y nodos mágicos de baja intensidad",
        "facilita la integración entre conjuro y artesanía sin gasto extra",
    ]);

    const actionType = pickRandomTrainingValue<FeatureActionType>([
        "action",
        "bonus",
        "reaction",
    ]);
    const charges = randomTrainingInt(1, 3);
    const recharge = pickRandomTrainingValue<"short" | "long">(["short", "long"]);
    const damageType = pickRandomTrainingValue([
        "necrotico",
        "frio",
        "fuego",
        "rayo",
        "veneno",
        "psiquico",
        "force",
    ]);
    const damageDice = pickRandomTrainingValue([
        "1d8",
        "2d6",
        "2d8",
        "3d6",
        "3d4",
        "4d4",
    ]);
    const saveAbility = pickRandomTrainingValue<SpellSavePatch["save_ability"]>([
        "STR",
        "DEX",
        "CON",
        "INT",
        "WIS",
        "CHA",
    ]);
    const range = pickRandomTrainingValue([
        "Toque",
        "9 m",
        "12 m",
        "18 m",
        "24 m",
    ]);
    const activeLabel = pickRandomTrainingValue([
        "Descarga de injerto",
        "Pulso de ruptura",
        "Propagación controlada",
        "Fulgor de contención",
        "Estallido de savia",
        "Onda del velo",
    ]);
    const activeFlavor = pickRandomTrainingValue([
        "un pulso compacto que recorre venas mágicas cercanas",
        "una onda breve que rompe formaciones inestables",
        "un brote de energía que contamina o purga según el objetivo",
        "una descarga radial de baja duración",
        "un impacto focalizado con resonancia residual",
        "un estallido silencioso que deforma la energía del área",
    ]);
    const lingeringName = pickRandomTrainingValue([
        "Savia residual",
        "Marca de interferencia",
        "Latencia hostil",
        "Inercia rúnica",
        "Cicatriz de velo",
    ]);
    const lingeringEffect = pickRandomTrainingValue([
        "al final de cada turno, salvación para terminar el efecto o recibe daño adicional",
        "si falla la salvación, el objetivo mantiene el estado y sufre penalización de movimiento",
        "los objetivos ya afectados por corrupción tienen desventaja en la salvación",
        "el efecto escala contra objetivos con magia activa o vulnerabilidad elemental",
        "si el objetivo supera la salvación dos veces, el efecto termina por completo",
    ]);

    const passiveAttachment: ItemAttachmentPatch = {
        type: "trait",
        name: passiveLabel,
        description: `${passiveEffect}.`,
    };

    const utilityAttachment: ItemAttachmentPatch = {
        type: maybeTraining(0.5) ? "ability" : "trait",
        name: utilityLabel,
        description: `${utilityEffect}.`,
        action_type: "passive",
    };

    const useSpellShape = maybeTraining(0.55);
    const activeAttachment: ItemAttachmentPatch = useSpellShape
        ? {
              type: "spell",
              name: activeLabel,
              school: pickRandomTrainingValue([
                  "transmutacion",
                  "necromancia",
                  "conjuracion",
                  "evocacion",
              ]),
              casting_time:
                  actionType === "bonus"
                      ? "1 acción bonus"
                      : actionType === "reaction"
                        ? "1 reacción"
                        : "1 acción",
              range,
              duration: pickRandomTrainingValue([
                  "Instantánea",
                  "Hasta el final de tu siguiente turno",
                  "1 minuto",
              ]),
              save: {
                  type: "save",
                  save_ability: saveAbility,
                  dc_type: "stat",
                  dc_stat: pickRandomTrainingValue([
                      "WIS",
                      "INT",
                      "CHA",
                      "CON",
                  ]),
              },
              damage: {
                  damage_type: damageType,
                  dice: damageDice,
              },
              description: `${activeFlavor}.\n\nEfecto inicial: daño ${damageType} y aplica "${lingeringName}" durante 1 minuto.`,
              resource_cost: {
                  charges,
                  recharge,
              },
          }
        : {
              type: "action",
              name: activeLabel,
              action_type: actionType,
              description: `${activeFlavor}.`,
              effect: `${lingeringName}: ${lingeringEffect}.`,
              resource_cost: {
                  charges,
                  recharge,
              },
          };

    const lingeringAttachment: ItemAttachmentPatch = {
        type: maybeTraining(0.6) ? "ability" : "trait",
        name: lingeringName,
        description: `${lingeringEffect}.`,
    };

    const extraAttachment = maybeTraining(0.5)
        ? ({
              type: maybeTraining(0.4) ? "action" : "ability",
              name: pickRandomTrainingValue([
                  "Protocolo de emergencia",
                  "Alineación de campo",
                  "Cierre de fractura",
                  "Compás de vigilancia",
                  "Respuesta de retención",
              ]),
              action_type: pickRandomTrainingValue<FeatureActionType>([
                  "action",
                  "bonus",
                  "reaction",
                  "passive",
              ]),
              description: pickRandomTrainingValue([
                  "mitiga una condición activa o reduce daño entrante de la siguiente fuente",
                  "permite recolocar el efecto principal a un objetivo nuevo dentro del alcance",
                  "anula un efecto menor de terreno en un radio corto",
                  "refuerza la estabilidad del portador hasta el final del turno siguiente",
                  "duplica un efecto utilitario del objeto una vez por descanso largo",
              ]),
          } satisfies ItemAttachmentPatch)
        : null;

    const attachments = [
        passiveAttachment,
        utilityAttachment,
        activeAttachment,
        lingeringAttachment,
        ...(extraAttachment ? [extraAttachment] : []),
    ];

    const description = [
        `Objeto recuperado en ${origin}, fabricado con ${material}.`,
        `Su superficie ${visualCue}.`,
        `No incluir mecánicas repetidas en esta descripción base; las reglas van en adjuntos.`,
    ].join("\n\n");

    const useActionLabel =
        actionType === "bonus"
            ? "acción bonus"
            : actionType === "reaction"
              ? "reacción"
              : "acción";
    const sourceText = [
        `${name}`,
        "",
        `Tipo de objeto: ${category}`,
        `Rareza: ${rarity}`,
        `Requiere vinculación: ${attunementClause}`,
        "",
        "DESCRIPCION (papel)",
        `Procedencia: ${origin}.`,
        `Material principal: ${material}.`,
        `Señal visual: ${visualCue}.`,
        "",
        "BLOQUES MECANICOS (papel)",
        `- ${passiveLabel}: ${passiveEffect}.`,
        `- ${utilityLabel}: ${utilityEffect}.`,
        `- ${activeLabel}: uso ${useActionLabel}; alcance ${range}; tirada/salvación ${saveAbility}; daño ${damageDice} ${damageType}; ${activeFlavor}; aplica ${lingeringName}.`,
        `- ${lingeringName}: ${lingeringEffect}.`,
        extraAttachment
            ? `- ${extraAttachment.name}: ${flattenTrainingText(
                  extraAttachment.description ?? ""
              )}.`
            : null,
        "",
        "NOTA DE MESA",
        "El objetivo del ejercicio es separar lore en descripción base y reglas en adjuntos estructurados sin duplicar campos.",
    ]
        .filter((line): line is string => !!line)
        .join("\n");

    const signature = normalizeForMatch(
        [
            name,
            category,
            rarity,
            passiveLabel,
            utilityLabel,
            activeLabel,
            lingeringName,
            damageType,
            damageDice,
            saveAbility,
            useActionLabel,
        ].join("|")
    );

    return {
        name,
        category,
        rarity,
        description,
        sourceText,
        attachments,
        signature,
    };
}

function buildUniqueTrainingGeneratedChallenge(theme?: string) {
    let fallback = buildTrainingGeneratedChallenge(theme);
    for (let attempt = 0; attempt < 42; attempt += 1) {
        const candidate = buildTrainingGeneratedChallenge(theme);
        fallback = candidate;
        if (!hasRecentTrainingChallengeSignature(candidate.signature)) {
            pushTrainingChallengeSignature(candidate.signature);
            return candidate;
        }
    }
    pushTrainingChallengeSignature(fallback.signature);
    return fallback;
}

function resolveTrainingTargetCharacterId({
    targetCharacterId,
    clientContext,
    visibleCharacters,
}: {
    targetCharacterId?: string;
    clientContext: ClientContextPayload | null;
    visibleCharacters: CharacterSummaryRow[];
}) {
    if (
        targetCharacterId &&
        visibleCharacters.some((character) => character.id === targetCharacterId)
    ) {
        return targetCharacterId;
    }
    const selectedId = asTrimmedString(clientContext?.selectedCharacter?.id, 64);
    if (selectedId && visibleCharacters.some((character) => character.id === selectedId)) {
        return selectedId;
    }
    return visibleCharacters[0]?.id;
}

function buildTrainingFictionalDraft({
    prompt,
    targetCharacterId,
    clientContext,
    visibleCharacters,
}: {
    prompt: string;
    targetCharacterId?: string;
    clientContext: ClientContextPayload | null;
    visibleCharacters: CharacterSummaryRow[];
}) {
    const instruction = extractCurrentUserInstruction(prompt);
    const rawTheme =
        asTrimmedString(instruction, 180) &&
        !isTrainingPromptRequest(prompt) &&
        !isTrainingApprovalIntent(prompt) &&
        !isGenericTrainingAutoInstruction(instruction)
            ? asTrimmedString(instruction, 180)
            : undefined;
    const theme = rawTheme ?? undefined;
    const generated = buildUniqueTrainingGeneratedChallenge(theme);
    const targetId = resolveTrainingTargetCharacterId({
        targetCharacterId,
        clientContext,
        visibleCharacters,
    });
    const targetName =
        visibleCharacters.find((entry) => entry.id === targetId)?.name ??
        clientContext?.selectedCharacter?.name ??
        "personaje seleccionado";

    const practiceId = `TR-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;
    const themedPrompt = [
        `Tengo un objeto en papel y quiero pasarlo a la web para el personaje "${targetName}".`,
        "Interpreta el texto completo y crea/actualiza un único objeto.",
        "Reglas de transcripción:",
        "- Mantén el lore en la descripción base del objeto.",
        "- Pasa mecánicas a adjuntos estructurados (rasgo/habilidad/acción/hechizo).",
        "- No dupliques en descripción datos que ya van en campos de hechizo o acción.",
        "- Si hay uso por descanso/cargas, represéntalo en coste de recurso.",
        "- Si hay tirada/salvación/daño, rellena sus campos estructurados.",
        theme ? `Tema solicitado por el usuario: ${theme}.` : null,
        "",
        `Texto fuente (papel) [${practiceId}]:`,
        generated.sourceText,
        "",
        "Instrucción final:",
        `\"Transcribe este objeto en la web para ${targetName} con estructura completa y sin perder información.\"`,
    ]
        .filter((line): line is string => !!line)
        .join("\n");

    const actions: unknown[] = [
        {
            operation: "update",
            characterId: targetId,
            note: "Borrador ficticio de entrenamiento. No se aplicará en campaña.",
            data: {
                item_patch: {
                    target_item_name: generated.name,
                    create_if_missing: true,
                    category: generated.category,
                    rarity: generated.rarity,
                    description: generated.description,
                    attachments_replace: generated.attachments,
                },
            },
        },
    ];

    const reply = [
        "Reto de entrenamiento (ficticio) generado.",
        `Objetivo de práctica: ${targetName}.`,
        "",
        "Prompt de práctica (detallado):",
        `\"${themedPrompt}\"`,
        "",
        "Criterios de validación sugeridos:",
        "- La descripción base conserva solo narrativa/lore.",
        "- Las mecánicas quedan en adjuntos estructurados sin texto duplicado.",
        "- Acciones/hechizos incluyen alcance, tipo de tirada/salvación y daño cuando aplique.",
        "- Costes por descanso/cargas quedan en recurso del adjunto, no en texto suelto.",
        "",
        "La estructura inicial ya está cargada en el editor del chat para que la corrijas.",
        "Cuando la veas bien, pulsa \"Está correcto\" o escribe \"está correcto\".",
    ].join("\n");

    return { reply, actions };
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

function findExactItemName(candidate: string, options: string[]) {
    const normalizedCandidate = normalizeForItemMatch(candidate).replace(/[^a-z0-9\s]/g, " ").trim();
    if (!normalizedCandidate) return undefined;
    return options.find((entry) => {
        const normalizedEntry = normalizeForItemMatch(entry).replace(/[^a-z0-9\s]/g, " ").trim();
        return normalizedEntry === normalizedCandidate;
    });
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
    if (
        normalized === "descripcion" ||
        normalized === "descripción" ||
        normalized === "funcionamiento" ||
        normalized === "mecanica" ||
        normalized === "mecánica" ||
        normalized === "propiedades"
    ) {
        return false;
    }
    if (/[.]$/.test(trimmed) && words.length > 5) return false;

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
        return false;
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
        "que",
    ]);
    const significantWords = words.filter(
        (word) => !connectorWords.has(normalizeForMatch(word))
    );
    if (significantWords.length > 0) {
        const capitalizedCount = significantWords.filter((word) =>
            /^[A-ZÁÉÍÓÚÜÑ0-9]/u.test(word)
        ).length;
        if (capitalizedCount / significantWords.length < 0.45) return false;
    }
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
        normalized === "efecto" ||
        normalized === "efecto inicial" ||
        normalized === "descripcion" ||
        normalized === "descripción" ||
        normalized === "propiedades" ||
        normalized === "propiedades especiales" ||
        normalized === "caracteristicas" ||
        normalized === "características" ||
        normalized === "caracteristicas basicas" ||
        normalized === "características básicas" ||
        normalized === "caracteristicas basicas del objeto" ||
        normalized === "características básicas del objeto" ||
        normalized === "propiedades magicas" ||
        normalized === "propiedades mágicas"
    );
}

function parseStructuredSubItemHeading(line: string) {
    const raw = line.trim();
    if (!raw) return undefined;
    if (/[.!?]$/.test(raw)) return undefined;
    if (raw.includes(":")) return undefined;

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

    const words = cleaned
        .replace(/[—–-]+/g, " ")
        .split(/\s+/)
        .filter(Boolean);
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
    const featureLike =
        cleaned.includes("—") ||
        cleaned.includes("–") ||
        /\b(?:propiedad|pasiva|foco|druidico|druídico|poder|especial|conjuro|latente|savia|detector|funcionamiento|efecto)\b/i.test(
            cleaned
        );
    if (!itemLike && !featureLike) return undefined;

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

function cleanupStructuredItemHeadingName(value: string) {
    const cleaned = stripLeadingDecorators(value).replace(/\s+/g, " ").trim();
    if (!cleaned) return undefined;

    const stripped = cleaned.replace(
        /^(?:objeto(?:\s+[a-záéíóúüñ]+){0,3})\s*[–—−-]\s*/iu,
        ""
    );
    const candidate = asTrimmedString(stripped, 120);
    return candidate ?? asTrimmedString(cleaned, 120);
}

type StructuredItemSections = {
    descriptionLines: string[];
    behaviorLines: string[];
};

function extractStructuredItemSections(lines: string[]): StructuredItemSections {
    const descriptionLines: string[] = [];
    const behaviorLines: string[] = [];
    let current: "description" | "behavior" | null = null;

    const descriptionLabels = new Set(["descripcion", "descripción"]);
    const behaviorLabels = new Set([
        "funcionamiento",
        "mecanica",
        "mecánica",
        "propiedades",
        "propiedades especiales",
        "caracteristicas",
        "características",
        "caracteristicas basicas",
        "características básicas",
    ]);

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        if (isNoiseStructuredLine(line)) continue;
        if (isMutationCommandLine(line)) continue;

        const compact = stripLeadingDecorators(line).replace(/[.:]+$/g, "").trim();
        const normalizedLabel = normalizeForMatch(compact);
        if (descriptionLabels.has(normalizedLabel)) {
            current = "description";
            continue;
        }
        if (
            behaviorLabels.has(normalizedLabel) ||
            normalizedLabel.startsWith("caracteristicas") ||
            normalizedLabel.startsWith("características") ||
            normalizedLabel.startsWith("propiedades ")
        ) {
            current = "behavior";
            continue;
        }

        const detectedSubHeading = parseStructuredSubItemHeading(line);
        if (detectedSubHeading) {
            current = null;
            continue;
        }

        if (current === "description") {
            descriptionLines.push(line);
            continue;
        }
        if (current === "behavior") {
            behaviorLines.push(line);
            continue;
        }
    }

    return {
        descriptionLines,
        behaviorLines,
    };
}

function inferStructuredBlockAttachmentType(
    name: string,
    bodyLines: string[]
): ItemAttachmentType | undefined {
    const normalizedName = normalizeForMatch(name);
    const joinedBody = bodyLines.join("\n");
    const normalizedBody = normalizeForMatch(joinedBody);

    if (
        normalizedName.includes("pasiva") ||
        normalizedName.includes("detector") ||
        normalizedBody.includes("pasiva")
    ) {
        return "trait";
    }
    if (
        normalizedName.includes("foco") ||
        normalizedName.includes("focus")
    ) {
        return "ability";
    }

    const actionLike =
        normalizedName.includes("poder especial") ||
        hasActionTriggerSignals(`${name}\n${joinedBody}`);
    if (actionLike) return "action";

    if (normalizedName.includes("truco") || normalizedBody.includes("cantrip")) {
        return "cantrip";
    }

    const explicitSpellLike =
        normalizedName.includes("conjuro") ||
        normalizedName.includes("hechizo") ||
        normalizedName.includes("spell") ||
        normalizedBody.includes("conjuro unico") ||
        normalizedBody.includes("conjuro único") ||
        normalizedBody.includes("no ocupa ranura");
    const structuralSpellLike = hasStrongSpellStructureSignals(joinedBody);
    if (explicitSpellLike || structuralSpellLike) {
        return "spell";
    }

    if (hasStateEffectSignals(joinedBody)) return "ability";
    return inferAttachmentType(name, joinedBody);
}

function sanitizeStructuredBlockDescriptionLines(
    lines: string[],
    attachmentType?: ItemAttachmentType
) {
    const output: string[] = [];
    for (const rawLine of lines) {
        const trimmed = rawLine.trim();
        if (!trimmed) continue;
        if (attachmentType === "action") {
            const normalized = normalizeForMatch(trimmed);
            if (
                /^\d+\s*vez(?:es)?\s+por\s+descanso(?:\s+(?:largo|corto|long|short))?$/.test(
                    normalized
                )
            ) {
                continue;
            }

            const cleanedActionLead = trimmed.replace(
                /^(?:\d+\s*vez(?:es)?\s+por\s+descanso(?:\s+(?:largo|corto|long|short))?[.,]?\s*)?(?:como\s+(?:una\s+)?(?:acción|accion|action|reacción|reaccion|reaction|bonus action)\s*,?\s*)/i,
                ""
            );
            if (cleanedActionLead !== trimmed) {
                const rest = asTrimmedString(cleanedActionLead, 900);
                if (rest) output.push(rest);
                continue;
            }
        }
        output.push(trimmed);
    }
    return output;
}

function extractStructuredActionRechargeLabel(lines: string[]) {
    for (const rawLine of lines) {
        const line = normalizeForMatch(rawLine.trim());
        if (!line) continue;
        const match = line.match(
            /(\d+)\s*vez(?:es)?\s+por\s+descanso(?:\s+(largo|corto|long|short))?/
        );
        if (!match) continue;
        const uses = match[1];
        const rest = match[2] ?? "largo";
        if (rest === "corto" || rest === "short") return `${uses}/descanso corto`;
        return `${uses}/descanso largo`;
    }
    return undefined;
}

function appendRechargeToAttachmentName(name: string, recharge?: string) {
    const safeName = asTrimmedString(name, 120);
    if (!safeName) return undefined;
    if (!recharge) return safeName;
    const normalizedName = normalizeForMatch(safeName);
    const normalizedRecharge = normalizeForMatch(recharge);
    if (normalizedName.includes(normalizedRecharge)) return safeName;
    return asTrimmedString(`${safeName} (${recharge})`, 140) ?? safeName;
}

function buildAttachmentFromStructuredSubItemBlock(
    block: StructuredSubItemBlock
): ItemAttachmentPatch | undefined {
    const explicitType = inferStructuredBlockAttachmentType(block.name, block.bodyLines);
    const rechargeLabel =
        explicitType === "action"
            ? extractStructuredActionRechargeLabel(block.bodyLines)
            : undefined;
    const normalizedName =
        explicitType === "action"
            ? appendRechargeToAttachmentName(block.name, rechargeLabel)
            : block.name;
    const sanitizedLines = sanitizeStructuredBlockDescriptionLines(
        block.bodyLines,
        explicitType
    );
    const description = asTrimmedString(sanitizedLines.join("\n"), 4000);
    const fallbackDescription = asTrimmedString(block.bodyLines.join("\n"), 4000);
    const attachment: ItemAttachmentPatch = {
        type:
            explicitType ??
            inferAttachmentType(
                normalizedName ?? block.name,
                description ?? fallbackDescription
            ),
        name: normalizedName ?? block.name,
    };
    if (description) {
        attachment.description = description;
    } else if (fallbackDescription && explicitType !== "action") {
        attachment.description = fallbackDescription;
    }
    return attachment;
}

function isConfigurationHeadingName(value: string) {
    const normalized = normalizeForMatch(value);
    return (
        normalized.startsWith("configuracion ") ||
        normalized.startsWith("configuración ") ||
        normalized.startsWith("configuration ") ||
        normalized.startsWith("modo ")
    );
}

function isGlobalOutsideConfigurationBlock(value: string) {
    const normalized = normalizeForMatch(value);
    return (
        normalized.includes("afinidad") ||
        normalized.includes("modificaciones") ||
        normalized.includes("nucleo vivo") ||
        normalized.includes("núcleo vivo") ||
        normalized.includes("restricciones absolutas") ||
        normalized.includes("restricciones")
    );
}

function cleanupConfigurationHeadingName(value: string) {
    const cleaned = stripLeadingDecorators(value).replace(/\s+/g, " ").trim();
    if (!cleaned) return undefined;
    const stripped = cleaned
        .replace(
            /^(?:configuracion|configuración|configuration)\s*[a-z0-9]+(?:\s*[–—−-]\s*)?/i,
            ""
        )
        .replace(/^\s*modo\s*/i, "")
        .trim();
    return asTrimmedString(stripped || cleaned, 140);
}

function parseConfigurationMagicBonus(value: string) {
    const match = value.match(/([+\-]?\d{1,2})/);
    const parsed = asInteger(match?.[1], -30, 30);
    return typeof parsed === "number" ? parsed : undefined;
}

function buildConfigurationPatchFromBlock(
    block: StructuredSubItemBlock
): ItemConfigurationPatch | undefined {
    const name = cleanupConfigurationHeadingName(block.name);
    if (!name) return undefined;

    const descriptionLines: string[] = [];
    const mechanicsLines: string[] = [];
    let usage: string | undefined;
    let damage: string | undefined;
    let range: string | undefined;
    let magicBonus: number | undefined;
    let mode: "description" | "mechanics" | null = null;

    for (const rawLine of block.bodyLines) {
        const line = rawLine.trim();
        if (!line) continue;
        const normalized = normalizeForMatch(
            stripLeadingDecorators(line).replace(/[.:]+$/g, "").trim()
        );

        if (normalized === "descripcion" || normalized === "descripción") {
            mode = "description";
            continue;
        }
        if (
            normalized === "estadisticas" ||
            normalized === "estadísticas" ||
            normalized === "stats"
        ) {
            mode = null;
            continue;
        }
        if (
            normalized === "habilidades" ||
            normalized === "skills" ||
            normalized === "mecanicas" ||
            normalized === "mecánicas"
        ) {
            mode = "mechanics";
            continue;
        }

        const keyValue = parseItemBodyKeyValueLine(line);
        if (keyValue) {
            const key = keyValue.keyNormalized;
            if (
                key === "uso" ||
                key === "usage" ||
                key === "use" ||
                key === "modo de uso"
            ) {
                usage = keyValue.value;
                continue;
            }
            if (key === "dano" || key === "daño" || key === "damage") {
                damage = keyValue.value;
                continue;
            }
            if (key === "alcance" || key === "range") {
                range = keyValue.value;
                continue;
            }
            if (
                key.includes("bonificador") ||
                key === "bono" ||
                key === "bonus" ||
                key.includes("magico") ||
                key.includes("mágico")
            ) {
                magicBonus = parseConfigurationMagicBonus(keyValue.value);
                continue;
            }
        }

        if (mode === "description") {
            descriptionLines.push(line);
            continue;
        }
        if (mode === "mechanics") {
            mechanicsLines.push(line);
            continue;
        }

        if (!isLikelyStandaloneMechanicalLine(line) && descriptionLines.length < 5) {
            descriptionLines.push(line);
            continue;
        }
        mechanicsLines.push(line);
    }

    const patch: ItemConfigurationPatch = { name };
    const description = asTrimmedString(descriptionLines.join("\n"), 2000);
    if (description) patch.description = description;
    if (usage) patch.usage = usage;
    if (damage) patch.damage = damage;
    if (range) patch.range = range;
    if (typeof magicBonus === "number") patch.magic_bonus = magicBonus;

    const attachments = buildItemAttachmentsFromBodyLines(mechanicsLines).slice(0, 10);
    if (attachments.length > 0) patch.attachments_replace = attachments;
    return patch;
}

function buildStructuredConfigurationPatches(
    subItemBlocks: StructuredSubItemBlock[]
) {
    const configurations: ItemConfigurationPatch[] = [];
    const consumedBlockIndexes = new Set<number>();

    for (let index = 0; index < subItemBlocks.length; index += 1) {
        const block = subItemBlocks[index];
        if (!isConfigurationHeadingName(block.name)) continue;

        const basePatch = buildConfigurationPatchFromBlock(block);
        if (!basePatch) continue;
        consumedBlockIndexes.add(index);

        const childAttachments: ItemAttachmentPatch[] = [];
        let cursor = index + 1;
        while (cursor < subItemBlocks.length) {
            const child = subItemBlocks[cursor];
            if (isConfigurationHeadingName(child.name)) break;
            if (isGlobalOutsideConfigurationBlock(child.name)) break;
            const childAttachment = buildAttachmentFromStructuredSubItemBlock(child);
            if (childAttachment) childAttachments.push(childAttachment);
            consumedBlockIndexes.add(cursor);
            cursor += 1;
        }

        const mergedAttachments = normalizeAttachmentPatchList([
            ...(basePatch.attachments_replace ?? []),
            ...childAttachments,
        ]).slice(0, 10);
        if (mergedAttachments.length > 0) {
            basePatch.attachments_replace = mergedAttachments;
        } else {
            delete basePatch.attachments_replace;
        }

        configurations.push(basePatch);
        index = cursor - 1;
    }

    return { configurations, consumedBlockIndexes };
}

function parseBatchItemHeadingLine(line: string) {
    const cleaned = stripLeadingDecorators(line)
        .replace(/\s+/g, " ")
        .trim();
    if (!cleaned) return undefined;
    if (isMutationCommandLine(cleaned)) return undefined;
    if (isStructuredSectionOnlyLabel(cleaned)) return undefined;
    if (cleaned.includes(":")) return undefined;

    const parsed = parseItemLabelAndPrice(cleaned, 140);
    if (!parsed?.name || !parsed.price) return undefined;

    const normalizedName = normalizeForMatch(parsed.name);
    if (
        normalizedName.startsWith("instruccion actual del usuario") ||
        normalizedName.startsWith("usuario") ||
        normalizedName.startsWith("asistente")
    ) {
        return undefined;
    }

    return {
        name: parsed.name,
        price: parsed.price,
    };
}

function splitInlineStructuredSegments(line: string) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes(":")) return [trimmed];

    const matches = Array.from(
        trimmed.matchAll(
            /([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]{1,40})\s*:\s*([^:]+?)(?=(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]{1,40}\s*:)|$)/gu
        )
    );
    if (matches.length < 2) return [trimmed];

    const segments: string[] = [];
    for (const match of matches) {
        const key = cleanupEntityName(match[1], 60);
        const value = asTrimmedString(match[2], 900);
        if (!key || !value) continue;
        segments.push(`${key}: ${value}`);
    }
    return segments.length > 0 ? segments : [trimmed];
}

function isMetadataOnlyItemBodyLine(line: string) {
    const compact = stripLeadingDecorators(line).replace(/[.:]+$/g, "").trim();
    if (!compact) return true;
    const words = compact.split(/\s+/).filter(Boolean);
    if (words.length > 2) return false;
    if (normalizeItemCategory(compact)) return true;
    if (parseRarityFromText(compact)) return true;
    return false;
}

function isGenericBodyAttachmentKey(value: string) {
    const normalized = normalizeForMatch(value);
    return (
        normalized === "uso" ||
        normalized === "efecto" ||
        normalized === "descripcion" ||
        normalized === "descripción" ||
        normalized === "aspecto" ||
        normalized === "precio" ||
        normalized === "coste" ||
        normalized === "costo" ||
        normalized === "categoria" ||
        normalized === "categoría" ||
        normalized === "tipo" ||
        normalized === "propiedad" ||
        normalized === "propiedades" ||
        normalized === "dano" ||
        normalized === "daño"
    );
}

type ItemBodyKeyValueLine = {
    key: string;
    keyNormalized: string;
    value: string;
};

function parseItemBodyKeyValueLine(line: string): ItemBodyKeyValueLine | undefined {
    const trimmed = line.trim();
    if (!trimmed) return undefined;
    const keyValue = trimmed.match(/^([^:]{2,60})\s*:\s*(.+)$/);
    if (!keyValue) return undefined;

    const key = cleanupEntityName(keyValue[1], 80);
    const value = asTrimmedString(keyValue[2], 900);
    if (!key || !value) return undefined;

    return {
        key,
        keyNormalized: normalizeForMatch(key),
        value,
    };
}

function isUsageBodyKey(key: string) {
    return key === "uso" || key === "use" || key === "usage";
}

function isEffectBodyKey(key: string) {
    return key === "efecto" || key === "effect";
}

function inferAttachmentTypeFromUsage(value?: string): ItemAttachmentType | undefined {
    const normalized = normalizeForMatch(value ?? "");
    if (!normalized) return undefined;

    if (
        normalized.includes("accion") ||
        normalized.includes("acción") ||
        normalized.includes("action") ||
        normalized.includes("reaccion") ||
        normalized.includes("reacción") ||
        normalized.includes("reaction") ||
        normalized.includes("bonus action")
    ) {
        return "action";
    }
    if (normalized.includes("pasivo") || normalized.includes("passive")) {
        return "trait";
    }
    return undefined;
}

function normalizeAttachmentTextForCompare(value: string) {
    return normalizeForMatch(value)
        .replace(/[.?!:;]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function isPlainActionUsage(value?: string) {
    const normalized = normalizeAttachmentTextForCompare(value ?? "");
    return (
        normalized === "accion" ||
        normalized === "acción" ||
        normalized === "una accion" ||
        normalized === "una acción" ||
        normalized === "1 accion" ||
        normalized === "1 acción" ||
        normalized === "action" ||
        normalized === "one action"
    );
}

function buildAttachmentNameFromEffectText(value: string) {
    const cleaned = value
        .replace(/\s+/g, " ")
        .replace(/[.?!:;]+$/g, "")
        .trim();
    if (!cleaned) return undefined;
    const words = cleaned.split(/\s+/).filter(Boolean);
    const base =
        words.length <= 8
            ? cleaned
            : `${words.slice(0, 8).join(" ")}...`;
    const firstChar = base.charAt(0);
    const normalizedName =
        firstChar ? `${firstChar.toUpperCase()}${base.slice(1)}` : base;
    return asTrimmedString(normalizedName, 90);
}

function isLikelyStandaloneMechanicalLine(value: string) {
    const normalized = normalizeForMatch(value);
    if (!normalized) return false;
    if (normalized.length < 12) return false;
    if (isStructuredSectionOnlyLabel(value)) return false;
    if (isMetadataOnlyItemBodyLine(value)) return false;
    if (isMutationCommandLine(value)) return false;
    if (/^[^:]{1,80}:\s*$/.test(value.trim())) return false;
    if (parseItemBodyKeyValueLine(value)) return false;

    return (
        normalized.startsWith("puede ") ||
        normalized.startsWith("puedes ") ||
        normalized.startsWith("funciona ") ||
        normalized.startsWith("obtienes ") ||
        normalized.startsWith("obtiene ") ||
        normalized.startsWith("cuenta como ") ||
        normalized.startsWith("mientras ") ||
        normalized.includes(" ventaja ") ||
        normalized.includes(" foco ") ||
        normalized.includes(" herramienta ")
    );
}

function buildAttachmentNameFromStandaloneMechanicalLine(value: string) {
    const normalized = normalizeForMatch(value);
    if (normalized.includes("foco arcano")) {
        return "Foco arcano integrado";
    }
    if (normalized.includes("mano funcional")) {
        return "Mano funcional";
    }
    if (normalized.includes("ventaja") && normalized.includes("crear")) {
        return "Ventaja de creación";
    }
    if (normalized.includes("cuenta como") && normalized.includes("tools")) {
        return "Herramientas integradas";
    }
    return buildAttachmentNameFromEffectText(value) ?? "Propiedad";
}

function parseBodyLineAsAttachment(line: string): ItemAttachmentPatch | undefined {
    const trimmed = line.trim();
    if (!trimmed) return undefined;
    if (isStructuredSectionOnlyLabel(trimmed)) return undefined;
    if (isMetadataOnlyItemBodyLine(trimmed)) return undefined;

    const keyValue = parseItemBodyKeyValueLine(trimmed);
    if (keyValue) {
        const name = keyValue.key;
        const description = keyValue.value;
        if (!name || !description) return undefined;
        if (isGenericBodyAttachmentKey(name)) return undefined;
        return {
            type: inferAttachmentType(name, description),
            name,
            description,
        };
    }

    const short = asTrimmedString(trimmed, 120);
    if (!short) return undefined;
    const wordCount = short.split(/\s+/).filter(Boolean).length;
    if (wordCount <= 8 && !/[.!?]$/.test(short)) {
        return {
            type: inferAttachmentType(short),
            name: short,
        };
    }
    return undefined;
}

function bodyLineGeneratesAttachment(line: string) {
    const keyValue = parseItemBodyKeyValueLine(line);
    if (keyValue && isEffectBodyKey(keyValue.keyNormalized)) return true;
    return !!parseBodyLineAsAttachment(line);
}

function shouldExcludeBodyLineFromDescription(line: string) {
    const keyValue = parseItemBodyKeyValueLine(line);
    if (!keyValue) return false;
    if (isUsageBodyKey(keyValue.keyNormalized)) return true;
    if (isEffectBodyKey(keyValue.keyNormalized)) return true;
    if (
        keyValue.keyNormalized === "precio" ||
        keyValue.keyNormalized === "coste" ||
        keyValue.keyNormalized === "costo" ||
        keyValue.keyNormalized === "categoria" ||
        keyValue.keyNormalized === "categoría"
    ) {
        return true;
    }
    return false;
}

function buildItemAttachmentsFromBodyLines(lines: string[]) {
    const attachments: ItemAttachmentPatch[] = [];
    const usageHints: string[] = [];
    for (const line of lines) {
        const keyValue = parseItemBodyKeyValueLine(line);
        if (keyValue && isUsageBodyKey(keyValue.keyNormalized)) {
            usageHints.push(keyValue.value);
            continue;
        }
        if (keyValue && isEffectBodyKey(keyValue.keyNormalized)) {
            const effectName = buildAttachmentNameFromEffectText(keyValue.value);
            if (!effectName) continue;
            const usageHint =
                usageHints.length > 0
                    ? usageHints[usageHints.length - 1]
                    : undefined;
            const explicitType = inferAttachmentTypeFromUsage(usageHint);
            const effectEqualsName =
                !effectName.endsWith("...") &&
                normalizeAttachmentTextForCompare(effectName) ===
                    normalizeAttachmentTextForCompare(keyValue.value);

            const descriptionParts: string[] = [];
            if (usageHint && !(explicitType === "action" && isPlainActionUsage(usageHint))) {
                descriptionParts.push(`Uso: ${usageHint}.`);
            }
            if (!effectEqualsName) {
                descriptionParts.push(keyValue.value);
            }
            const description = asTrimmedString(descriptionParts.join(" "), 900);
            const attachment: ItemAttachmentPatch = {
                type: explicitType ?? inferAttachmentType(effectName, keyValue.value),
                name: effectName,
            };
            if (description) attachment.description = description;
            attachments.push(attachment);
            continue;
        }

        const parsed = parseBodyLineAsAttachment(line);
        if (!parsed) continue;
        attachments.push(parsed);
        continue;
    }

    for (const line of lines) {
        if (!isLikelyStandaloneMechanicalLine(line)) continue;
        const description = asTrimmedString(line, 900);
        if (!description) continue;
        const name = buildAttachmentNameFromStandaloneMechanicalLine(description);
        attachments.push({
            type: inferAttachmentType(name, description),
            name,
            description,
        });
    }

    const byKey = new Map<string, ItemAttachmentPatch>();
    for (const attachment of attachments) {
        const key = `${normalizeForItemMatch(attachment.type ?? "trait")}::${normalizeForItemMatch(
            attachment.name
        )}`;
        if (!byKey.has(key)) {
            byKey.set(key, attachment);
            continue;
        }
        const existing = byKey.get(key);
        if (existing && !existing.description && attachment.description) {
            existing.description = attachment.description;
        }
    }
    return normalizeAttachmentPatchList(Array.from(byKey.values())).slice(0, 8);
}

function parseStructuredItemBatchPatchesFromInstruction({
    instruction,
    candidateItemNames,
}: {
    instruction: string;
    candidateItemNames: string[];
}) {
    const normalizedInstruction = normalizeForMatch(instruction);
    const wantsCreate =
        normalizedInstruction.includes("anade") ||
        normalizedInstruction.includes("añade") ||
        normalizedInstruction.includes("agrega") ||
        normalizedInstruction.includes("inserta") ||
        normalizedInstruction.includes("mete") ||
        normalizedInstruction.includes("crea") ||
        normalizedInstruction.includes("crear") ||
        normalizedInstruction.includes("add ") ||
        normalizedInstruction.includes("insert ");
    if (!wantsCreate) return [] as ItemPatch[];

    const lines = instruction
        .split(/\r?\n/)
        .map((line) => line.trim())
        .map((line) => line.replace(/^[-*•]+\s*/, "").trim())
        .map((line) => stripTrailingMutationCommandFragment(line))
        .flatMap((line) => splitInlineStructuredSegments(line))
        .map((line) => line.trim())
        .filter(Boolean);
    if (lines.length < 3) return [] as ItemPatch[];

    const headings: Array<{ index: number; name: string; price?: string }> = [];
    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        if (isMutationCommandLine(line)) continue;
        const parsed = parseBatchItemHeadingLine(line);
        if (!parsed) continue;
        headings.push({
            index,
            name: parsed.name,
            price: parsed.price,
        });
    }
    if (headings.length < 2) return [] as ItemPatch[];

    const patches: ItemPatch[] = [];
    for (let idx = 0; idx < headings.length; idx += 1) {
        const current = headings[idx];
        const next = headings[idx + 1];
        const start = current.index + 1;
        const end = next ? next.index : lines.length;
        const bodyLines = lines
            .slice(start, end)
            .filter((line) => !isNoiseStructuredLine(line))
            .filter((line) => !isMutationCommandLine(line))
            .map((line) => line.trim())
            .filter(Boolean);

        const attachmentLineKeys = new Set(
            bodyLines
                .filter((line) => bodyLineGeneratesAttachment(line))
                .map((line) => normalizeForItemMatch(line))
        );
        const descriptionLines = bodyLines
            .filter((line) => !isStructuredSectionOnlyLabel(line))
            .filter((line) => !isMetadataOnlyItemBodyLine(line))
            .filter((line) => !shouldExcludeBodyLineFromDescription(line))
            .filter((line) => !attachmentLineKeys.has(normalizeForItemMatch(line)));
        const description = asTrimmedString(
            [current.price ? `Precio: ${current.price}` : null, ...descriptionLines]
                .filter(Boolean)
                .join("\n"),
            1200
        );
        const attachments = buildItemAttachmentsFromBodyLines(bodyLines);

        const existingName = findExactItemName(current.name, candidateItemNames);
        const targetItemName = existingName ?? current.name;

        const patch: ItemPatch = {
            target_item_name: targetItemName,
            create_if_missing: true,
        };
        if (
            existingName &&
            normalizeForItemMatch(existingName) !== normalizeForItemMatch(current.name)
        ) {
            patch.name = current.name;
        }
        if (description) patch.description = description;
        if (attachments.length > 0) patch.attachments_replace = attachments;
        const rarity = parseRarityFromText(current.name);
        if (rarity) patch.rarity = rarity;

        const hasConcreteChange =
            patch.create_if_missing === true ||
            patch.description !== undefined ||
            patch.rarity !== undefined ||
            (patch.attachments_replace?.length ?? 0) > 0;
        if (!hasConcreteChange) continue;
        patches.push(patch);
        if (patches.length >= 4) break;
    }
    return patches;
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
        .flatMap((line) => splitInlineStructuredSegments(line))
        .map((line) => line.trim())
        .filter(Boolean);
    if (lines.length === 0) return undefined;
    const structuredSections = extractStructuredItemSections(lines);

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

    const parsedBatchHeading = headingLine
        ? parseBatchItemHeadingLine(headingLine)
        : undefined;
    const cleanedHeading = headingLine
        ? stripLeadingDecorators(headingLine)
        : undefined;
    const headingRarityMatch = cleanedHeading?.match(/\(([^()]{2,40})\)\s*$/);
    const headingName = parsedBatchHeading?.name
        ? parsedBatchHeading.name
        : cleanedHeading
        ? asTrimmedString(
              headingRarityMatch
                  ? cleanedHeading.slice(0, headingRarityMatch.index).trim()
                  : cleanedHeading,
              120
          )
        : undefined;
    const headingPrice = parsedBatchHeading?.price;
    const headingCandidateRaw =
        headingName && !isTraitHeadingLine(headingName)
            ? headingName
            : headingCandidateFromLine;
    const headingCandidate = headingCandidateRaw
        ? cleanupStructuredItemHeadingName(headingCandidateRaw)
        : undefined;
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
        if (isMutationCommandLine(line)) continue;
        if (isTraitHeadingLine(line)) continue;
        const normalized = normalizeForMatch(line);
        if (normalized.startsWith("tengo este objeto")) continue;
        if (normalized.startsWith("modifica ")) continue;
        if (normalized.startsWith("actualiza ")) continue;
        if (normalized.startsWith("edita ")) continue;
        if (normalized.startsWith("cambia ")) continue;
        if (normalized.startsWith("crea ")) continue;
        if (normalized.startsWith("crear ")) continue;
        if (normalized.startsWith("anade ")) continue;
        if (normalized.startsWith("añade ")) continue;
        if (normalized.startsWith("agrega ")) continue;
        if (normalized.startsWith("inserta ")) continue;
        if (normalized.startsWith("mete ")) continue;
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

    const configurationExtraction = buildStructuredConfigurationPatches(
        subItemBlocks
    );
    const extractedConfigurations = configurationExtraction.configurations.slice(0, 6);
    const consumedConfigurationIndexes =
        configurationExtraction.consumedBlockIndexes;

    const attachments: ItemAttachmentPatch[] = [];
    if (subItemBlocks.length > 0) {
        for (const [index, block] of subItemBlocks.entries()) {
            if (consumedConfigurationIndexes.has(index)) continue;
            const normalizedBlockName = normalizeForMatch(block.name);
            const isGenericFeatureContainer =
                normalizedBlockName === "propiedades" ||
                normalizedBlockName === "propiedades especiales" ||
                normalizedBlockName.startsWith("caracteristicas") ||
                normalizedBlockName.startsWith("características");
            if (isGenericFeatureContainer) {
                const extractedFromBody = buildItemAttachmentsFromBodyLines(
                    block.bodyLines
                );
                if (extractedFromBody.length > 0) {
                    attachments.push(...extractedFromBody);
                    if (attachments.length >= 8) break;
                    continue;
                }
            }
            const attachment = buildAttachmentFromStructuredSubItemBlock(block);
            if (!attachment) continue;
            attachments.push(attachment);
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

    const normalizedAttachments = normalizeAttachmentPatchList(attachments).slice(0, 8);

    if (
        normalizedAttachments.length === 0 &&
        structuredSections.behaviorLines.length > 0
    ) {
        const behaviorDerived = buildItemAttachmentsFromBodyLines(
            structuredSections.behaviorLines
        );
        if (behaviorDerived.length > 0) {
            normalizedAttachments.push(...behaviorDerived.slice(0, 8));
        } else {
            const behaviorDescription = asTrimmedString(
                structuredSections.behaviorLines.join("\n"),
                4000
            );
            if (behaviorDescription) {
                normalizedAttachments.push({
                    type: inferAttachmentType("Funcionamiento", behaviorDescription),
                    name: "Funcionamiento",
                    description: behaviorDescription,
                });
            }
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
    const baseDescription =
        structuredSections.descriptionLines.length > 0
            ? asTrimmedString(structuredSections.descriptionLines.join("\n"), 1200)
            : introDescription;
    const description = asTrimmedString(
        [
            baseDescription,
            headingPrice ? `Precio: ${headingPrice}` : null,
            metadataLine,
            ...detailLines,
            ...(subItemBlocks.length > 0 && extractedConfigurations.length === 0
                ? structuredSections.behaviorLines
                : []),
        ]
            .filter(Boolean)
            .join("\n"),
        1200
    );
    const dedupedDescription =
        typeof description === "string" && normalizedAttachments.length > 0
            ? asTrimmedString(
                  stripDescriptionAttachmentOverlap(description, normalizedAttachments),
                  1200
              ) ?? undefined
            : description;

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
    if (dedupedDescription) patch.description = dedupedDescription;
    if (extractedConfigurations.length > 0) {
        patch.configurations_replace = extractedConfigurations;
        patch.active_configuration = extractedConfigurations[0]?.name;
    }
    if (normalizedAttachments.length > 0) {
        patch.attachments_replace = normalizedAttachments;
    }

    const hasConcreteChange =
        patch.create_if_missing === true ||
        !!patch.name ||
        !!patch.category ||
        patch.rarity !== undefined ||
        patch.description !== undefined ||
        (patch.configurations_replace?.length ?? 0) > 0 ||
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

    const batchPatches = parseStructuredItemBatchPatchesFromInstruction({
        instruction,
        candidateItemNames: candidateNames,
    });
    if (batchPatches.length > 0) {
        let resolvedCharacterId = resolveHeuristicTargetCharacterId({
            targetCharacterId,
            clientContext,
            visibleCharacterIds,
            instruction,
            visibleCharacters,
        });

        if (!resolvedCharacterId) {
            const holders = visibleCharacters.filter((character) =>
                batchPatches.some((patch) =>
                    characterHasItemName(character, patch.target_item_name)
                )
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

        return batchPatches.map((patch) => ({
            operation: "update" as const,
            characterId: resolvedCharacterId!,
            note: "Fallback estructurado para actualización de objeto.",
            data: {
                item_patch: patch,
            },
        }));
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

const CLASS_KEYWORD_MAP: ReadonlyArray<{ pattern: RegExp; value: string }> = [
    { pattern: /\bbarbaro\b/, value: "Bárbaro" },
    { pattern: /\bbard(?:o)?\b/, value: "Bardo" },
    { pattern: /\bcler(?:igo|ic)\b/, value: "Clérigo" },
    { pattern: /\bdruida?\b|\bdruid\b/, value: "Druida" },
    { pattern: /\bguerrero\b|\bfighter\b/, value: "Guerrero" },
    { pattern: /\bmonje\b|\bmonk\b/, value: "Monje" },
    { pattern: /\bpaladin\b|\bpaladin[oa]?\b/, value: "Paladín" },
    { pattern: /\bpicaro\b|\brogue\b/, value: "Pícaro" },
    { pattern: /\bguardabosques\b|\branger\b/, value: "Guardabosques" },
    { pattern: /\bhechicero\b|\bsorcerer\b/, value: "Hechicero" },
    { pattern: /\bbrujo\b|\bwarlock\b/, value: "Brujo" },
    { pattern: /\bmago\b|\bwizard\b/, value: "Mago" },
    { pattern: /\bartificiero\b|\bartificer\b/, value: "Artificiero" },
];

const RACE_KEYWORD_MAP: ReadonlyArray<{ pattern: RegExp; value: string }> = [
    { pattern: /\bhumano\b|\bhuman\b/, value: "Humano" },
    { pattern: /\belf[oa]?\b|\belf\b/, value: "Elfo" },
    { pattern: /\benan[oa]?\b|\bdwarf\b/, value: "Enano" },
    { pattern: /\bmedian[oa]?\b|\bhalfling\b/, value: "Mediano" },
    { pattern: /\borc[oa]?\b|\bhalf[\s-]?orc\b/, value: "Orco / Semi-orco" },
    { pattern: /\bgoliath\b/, value: "Goliath" },
    { pattern: /\bdraconid[oa]?\b|\bdragonborn\b/, value: "Dracónido" },
    { pattern: /\btiflin[gn]?\b|\btiefling\b/, value: "Tiefling" },
    { pattern: /\bgnom[oa]?\b|\bgnome\b/, value: "Gnomo" },
    { pattern: /\bsemi[\s-]?elf[oa]?\b|\bhalf[\s-]?elf\b/, value: "Semielfo" },
    { pattern: /\baasimar\b/, value: "Aasimar" },
    { pattern: /\bgenasi\b/, value: "Genasi" },
    { pattern: /\btabaxi\b/, value: "Tabaxi" },
];

function inferClassFromInstruction(instruction: string) {
    const normalized = normalizeForMatch(instruction);
    const createLikeIntent =
        normalized.includes("crea") || normalized.includes("crear") || normalized.includes("create");
    const hasCharacterSignal =
        normalized.includes("personaje") ||
        normalized.includes("character") ||
        normalized.includes("companion") ||
        normalized.includes("familiar") ||
        normalized.includes("clase") ||
        normalized.includes("class") ||
        (createLikeIntent &&
            (normalized.includes("nivel") ||
                normalized.includes("level") ||
                normalized.includes("hp") ||
                normalized.includes("fuerza") ||
                normalized.includes("strength") ||
                normalized.includes("str")));
    if (!hasCharacterSignal) return undefined;

    for (const entry of CLASS_KEYWORD_MAP) {
        if (entry.pattern.test(normalized)) return entry.value;
    }
    return undefined;
}

function inferRaceFromInstruction(instruction: string) {
    const normalized = normalizeForMatch(instruction);
    const createLikeIntent =
        normalized.includes("crea") || normalized.includes("crear") || normalized.includes("create");
    const hasCharacterSignal =
        normalized.includes("personaje") ||
        normalized.includes("character") ||
        normalized.includes("companion") ||
        normalized.includes("familiar") ||
        normalized.includes("raza") ||
        normalized.includes("race") ||
        (createLikeIntent &&
            (normalized.includes("nivel") ||
                normalized.includes("level") ||
                normalized.includes("hp") ||
                normalized.includes("fuerza") ||
                normalized.includes("strength") ||
                normalized.includes("str")));
    if (!hasCharacterSignal) return undefined;

    for (const entry of RACE_KEYWORD_MAP) {
        if (entry.pattern.test(normalized)) return entry.value;
    }
    return undefined;
}

function parseClassFromInstruction(instruction: string) {
    const match = instruction.match(
        /\b(?:clase|class)(?:\s+de\s+personaje)?\b\s*[:=-]?\s*([^\n,.;]{2,120})/i
    );
    if (match) {
        const parsed = cleanupEntityName(match[1], 120);
        if (parsed) return parsed;
    }
    return inferClassFromInstruction(instruction);
}

function parseRaceFromInstruction(instruction: string) {
    const match = instruction.match(
        /\b(?:raza|race)(?:\s+de\s+personaje)?\b\s*[:=-]?\s*([^\n,.;]{2,120})/i
    );
    if (match) {
        const parsed = cleanupEntityName(match[1], 120);
        if (parsed) return parsed;
    }
    return inferRaceFromInstruction(instruction);
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
    const detailsPatch = parseDetailsPatchFromInstruction(instruction);
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
    if (detailsPatch) actionData.details_patch = detailsPatch;
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
        "- Crear personaje o companion con nombre, clase, raza, nivel, xp, hp actual/max, CA, velocidad y stats completas.",
        "- Actualizar stats (str/dex/con/int/wis/cha).",
        "- Actualizar detalles como notas, trasfondo, alineamiento, idiomas, inventario y equipo.",
        "- Editar objetos del inventario por nombre y añadir rasgos/habilidades como adjuntos del objeto (trait/ability).",
        "- Crear objetos modulares con configuraciones (A/B) y habilidades separadas por configuración.",
        "- Crear/editar hechizos personalizados y cantrips con su estructura completa (coste, tirada/salvación, daño, componentes).",
        "- Crear/editar rasgos y habilidades personalizadas (incluye acciones, requisitos, efecto y recursos).",
        "- Aprender u olvidar hechizos por nivel en la lista de hechizos del personaje.",
        "Ejemplos:",
        "- \"Crea un companion lobo nivel 2 para mi personaje.\"",
        "- \"Crea personaje: nombre Lyra, clase Bardo, raza Elfa, nivel 3, str 8 dex 16 con 12 int 13 wis 10 cha 17, hp 21/21, ca 14, velocidad 30.\"",
        "- \"Sube mi personaje a nivel 5 y pon 16 en DEX.\"",
        "- \"Añade en notas: desconfía de los magos rojos.\"",
        "- \"Modifica el yelmo del primer forjador y añade sus rasgos como habilidades del objeto.\"",
        "- \"Crea el martillo con CONFIGURACIÓN A y B, cada una con su daño, alcance y habilidades.\"",
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
        "- \"Crea un arma modular con configuración A/B y habilidades separadas por modo.\"",
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
        dataModel: {
            operations: ["create", "update"],
            itemCategories: [...ITEM_CATEGORY_VALUES],
            attachmentTypes: [...ITEM_ATTACHMENT_TYPE_VALUES],
            attachmentStructuredFields: [...ITEM_ATTACHMENT_STRUCTURED_AI_KEYS],
            itemConfigurationFields: [
                "name",
                "description",
                "usage",
                "damage",
                "range",
                "magic_bonus",
                "attachments_replace",
            ],
            detailPatchKeys: [...DETAIL_PATCH_KEYS],
            featureCollections: [...FEATURE_COLLECTION_VALUES],
            spellCollections: [...SPELL_COLLECTION_VALUES],
        },
        webRenderModel: {
            itemCard: [
                "name",
                "category",
                "equippable/equipped",
                "description (base lore/metadatos)",
                "attachments (mecanicas estructuradas)",
                "configurations (modos A/B con stats + adjuntos propios)",
            ],
            attachmentCard: ["name", "type", "description", "level(optional)"],
            renderingRule:
                "Si una mecanica esta en attachments, no duplicarla en description.",
        },
        supportedMutations: [
            "create/update character",
            "create/update companion",
            "update stats",
            "update details_patch: notes/background/alignment/personalityTraits/ideals/bonds/flaws/appearance/backstory/languages/proficiencies/abilities/inventory/equipment",
            "update item_patch: target_item_name + category/rarity/equipped/description/tags/attachments/configurations_replace/active_configuration",
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
            "Si hay bloques de CONFIGURACIÓN A/B, crear item_patch.configurations_replace y no mezclar esos rasgos en attachments globales.",
            "Si la orden es añadir/crear objeto y no existe en inventario, usar item_patch.create_if_missing=true.",
            "Si el usuario describe rasgos o habilidades de un objeto, convertirlos en attachments del item con type ability/trait.",
            "Si el bloque indica 'PODER ESPECIAL' o activación explícita, preferir attachment type='action'.",
            "Si el bloque incluye campos de conjuro (alcance/área/salvación/duración/componentes), preferir type='spell'.",
            "Si hay metadatos de hechizo/accion, rellenar campos estructurados del adjunto y no solo description.",
            "Evitar duplicación: no repetir en description lo que ya vaya en attachments.",
            "Integrar subbloques como 'Efecto inicial' dentro del conjuro principal cuando sea parte del mismo.",
            "No usar nombres genéricos de adjunto como 'Funcionamiento' si el texto contiene rasgos concretos separables.",
            "Si el usuario pide crear/editar un hechizo personalizado, usar custom_spell_patch (no texto plano).",
            "Si pide rasgos/habilidades/acciones personalizadas, usar custom_feature_patch.",
            "Si pide aprender/olvidar un hechizo de nivel, usar learned_spell_patch.",
        ],
        structuredObjectSegmentation: [
            "segmento_1_nombre_principal",
            "segmento_2_metadatos (tipo/rareza/sintonizacion/estado/precio)",
            "segmento_3_descripcion_narrativa",
            "segmento_4_mecanicas (pasivas/focos/poderes/conjuros/estados)",
            "segmento_5_configuraciones modulares (A/B/modos)",
        ],
        attachmentMappingHeuristics: [
            "propiedad pasiva -> trait",
            "foco/beneficio continuo -> ability",
            "poder especial/activable -> action",
            "conjuro unico o bloque con alcance/area/salvacion -> spell",
            "estado persistente o condicion periodica -> ability|trait",
            "si el titulo contiene FOCO, NO mapear a spell aunque mencione conjuros",
            "si el titulo contiene PODER ESPECIAL, mapear a action y separar el conjuro interno",
        ],
        antiDuplicationRules: [
            "No repetir en item.description texto ya representado en attachments",
            "No crear adjuntos con nombres genericos (uso/efecto/tipo/rareza/precio)",
            "Si hay contenido mecanico bien segmentado, dejar description solo narrativa",
            "No copiar bloques completos largos en description si ya fueron troceados en adjuntos",
            "En attachment.description no duplicar alcance/area/duracion/componentes/salvacion/dano/uso/descanso si ya existen en campos estructurados",
            "Usar parrafos con saltos de linea (\\n\\n) en descripciones; evitar bloques de texto en una sola linea",
            "Usar viñetas para multiples puntos cortos; no forzar viñetas en texto narrativo corto",
            "Usar numeracion cuando haya pasos/orden temporal o secuencias",
        ],
        strictNormalization: [
            "limpiar emojis/decoradores en nombres principales",
            "quitar sufijos de precio del nombre del objeto",
            "conservar precio/rareza/sintonizacion como metadata textual en description",
            "evitar adjuntos vacios o de una sola etiqueta",
        ],
        highSignalKeywords: {
            action: ["accion", "acción", "reaction", "bonus action", "como accion", "1 vez por descanso"],
            spell: ["conjuro", "hechizo", "alcance", "área", "salvación", "componentes", "duración", "CD"],
            trait: ["pasiva", "innata", "detector", "aura", "siempre activa"],
            ability: ["mientras", "obtiene", "puede usar", "bono", "modificador"],
        },
        fewShotPatterns: [
            "Entrada: 'PODER ESPECIAL — X' + '1 vez por descanso largo' + 'Como acción...' => action named 'PODER ESPECIAL — X (1/descanso largo)'",
            "Entrada: bloque 'Conjuro único' con alcance/área/salvación => spell attachment con esa estructura en description",
            "Entrada: 'Efecto inicial' debajo de un conjuro => integrar en el mismo spell, no crear adjunto independiente",
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

function isMissingRelationError(error: unknown) {
    if (!isRecord(error)) return false;
    const code = asTrimmedString(error.code, 16);
    if (code === "42P01") return true;
    const message = String(error.message ?? "").toLowerCase();
    return (
        message.includes("does not exist") &&
        (message.includes("relation") || message.includes("table"))
    );
}

async function storeGlobalLearningEvent({
    adminClient,
    enabled,
    consent,
    campaignId,
    userId,
    role,
    assistantMode,
    trainingSubmode,
    prompt,
    clientContext,
    noticeAccepted,
}: {
    adminClient: SupabaseClient;
    enabled: boolean;
    consent: boolean;
    campaignId: string;
    userId: string;
    role: CampaignRole;
    assistantMode: AssistantMode;
    trainingSubmode: TrainingSubmode;
    prompt: string;
    clientContext: ClientContextPayload | null;
    noticeAccepted: boolean;
}) {
    if (!enabled || !consent) return;
    const instruction = asTrimmedString(extractCurrentUserInstruction(prompt), 2800);
    if (!instruction) return;
    const contextHint = asTrimmedString(describeUIContextHint(clientContext), 240);

    const { error } = await adminClient
        .from("ai_global_training_events")
        .insert({
            user_id: userId,
            campaign_id: campaignId,
            role,
            assistant_mode: assistantMode,
            training_submode: assistantMode === "training" ? trainingSubmode : null,
            instruction,
            context_hint: contextHint ?? null,
            notice_accepted: noticeAccepted,
        });

    if (error && !isMissingRelationError(error)) {
        console.warn("assistant.global-learning.store warn:", error.message);
    }
}

function normalizeSanitizedActionForCompare(action: SanitizedAction) {
    return {
        operation: action.operation,
        characterId: action.characterId ?? null,
        note: action.note ?? null,
        data: action.data ?? null,
    };
}

function areSanitizedActionsEqual(left: SanitizedAction[], right: SanitizedAction[]) {
    if (left.length !== right.length) return false;
    return (
        JSON.stringify(left.map(normalizeSanitizedActionForCompare)) ===
        JSON.stringify(right.map(normalizeSanitizedActionForCompare))
    );
}

function buildSanitizedActionEditSummary(
    original: SanitizedAction[],
    edited: SanitizedAction[]
) {
    if (areSanitizedActionsEqual(original, edited)) return "";
    const parts: string[] = [];
    if (original.length !== edited.length) {
        parts.push(`acciones: ${original.length} -> ${edited.length}`);
    }
    const max = Math.min(original.length, edited.length);
    for (let index = 0; index < max; index += 1) {
        const before = original[index];
        const after = edited[index];
        const entryDiffs: string[] = [];
        if (before.operation !== after.operation) {
            entryDiffs.push(`operación ${before.operation} -> ${after.operation}`);
        }
        if ((before.characterId ?? "") !== (after.characterId ?? "")) {
            entryDiffs.push("personaje cambiado");
        }
        if ((before.note ?? "") !== (after.note ?? "")) {
            entryDiffs.push("nota cambiada");
        }
        if (JSON.stringify(before.data ?? null) !== JSON.stringify(after.data ?? null)) {
            entryDiffs.push("payload cambiado");
        }
        if (entryDiffs.length > 0) {
            parts.push(`acción ${index + 1}: ${entryDiffs.join(", ")}`);
        }
        if (parts.length >= 6) break;
    }
    return parts.join(" | ").slice(0, 1200);
}

async function storeProposalEditLearningEvent({
    adminClient,
    enabled,
    consent,
    campaignId,
    userId,
    role,
    assistantMode,
    trainingSubmode,
    prompt,
    originalActions,
    editedActions,
    summary,
    noticeAccepted,
}: {
    adminClient: SupabaseClient;
    enabled: boolean;
    consent: boolean;
    campaignId: string;
    userId: string;
    role: CampaignRole;
    assistantMode: AssistantMode;
    trainingSubmode: TrainingSubmode;
    prompt: string;
    originalActions: SanitizedAction[];
    editedActions: SanitizedAction[];
    summary?: string | null;
    noticeAccepted: boolean;
}) {
    if (!enabled || !consent) return;
    if (originalActions.length === 0 || editedActions.length === 0) return;
    if (areSanitizedActionsEqual(originalActions, editedActions)) return;

    const instructionSource = asTrimmedString(extractCurrentUserInstruction(prompt), 1000);
    const summaryText =
        asTrimmedString(summary, 1200) ??
        buildSanitizedActionEditSummary(originalActions, editedActions);
    const beforeSnippet = safeJsonSnippet(originalActions, 900);
    const afterSnippet = safeJsonSnippet(editedActions, 900);
    const instruction = asTrimmedString(
        [
            "Corrección de propuesta IA por edición del usuario.",
            instructionSource ? `Instrucción: ${instructionSource}` : null,
            summaryText ? `Resumen: ${summaryText}` : null,
            beforeSnippet ? `Antes: ${beforeSnippet}` : null,
            afterSnippet ? `Después: ${afterSnippet}` : null,
        ]
            .filter((entry): entry is string => !!entry)
            .join("\n"),
        2800
    );
    if (!instruction) return;

    const { error } = await adminClient
        .from("ai_global_training_events")
        .insert({
            user_id: userId,
            campaign_id: campaignId,
            role,
            assistant_mode: assistantMode,
            training_submode: assistantMode === "training" ? trainingSubmode : null,
            instruction,
            context_hint: "user-edit-feedback",
            notice_accepted: noticeAccepted,
        });

    if (error && !isMissingRelationError(error)) {
        console.warn("assistant.global-learning.edit-feedback warn:", error.message);
    }
}

async function loadGlobalLearningDocs({
    adminClient,
    enabled,
    maxRows = 120,
}: {
    adminClient: SupabaseClient;
    enabled: boolean;
    maxRows?: number;
}) {
    if (!enabled) return [] as RagDocument[];
    const { data, error } = await adminClient
        .from("ai_global_training_events")
        .select("id, instruction, assistant_mode, training_submode, role")
        .order("created_at", { ascending: false })
        .limit(Math.max(20, Math.min(maxRows, 300)));

    if (error) {
        if (!isMissingRelationError(error)) {
            console.warn("assistant.global-learning.load warn:", error.message);
        }
        return [] as RagDocument[];
    }

    const rows = Array.isArray(data) ? data : [];
    const docs: RagDocument[] = [];
    const seen = new Set<string>();
    for (const entry of rows) {
        if (!isRecord(entry)) continue;
        const id = asTrimmedString(entry.id, 64);
        const instruction = asTrimmedString(entry.instruction, 700);
        if (!id || !instruction) continue;
        const dedupeKey = normalizeForMatch(instruction);
        if (!dedupeKey || seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        const mode = asTrimmedString(entry.assistant_mode, 24) ?? "normal";
        const submode = asTrimmedString(entry.training_submode, 40);
        const role = asTrimmedString(entry.role, 20) ?? "PLAYER";
        docs.push({
            id: `community:${id}`,
            sourceType: "community",
            title: submode
                ? `Ejemplo comunidad (${mode}/${submode})`
                : `Ejemplo comunidad (${mode})`,
            text: `Rol: ${role} | Prompt: ${instruction}`,
            priority: 2,
        });
        if (docs.length >= 60) break;
    }
    return docs;
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
    communityDocs,
    topK,
    docMaxChars,
}: {
    prompt: string;
    targetCharacterId?: string;
    campaign: CampaignRow | null;
    visibleCharacters: CharacterSummaryRow[];
    notes: NoteRow[];
    communityDocs?: RagDocument[];
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

    if (Array.isArray(communityDocs) && communityDocs.length > 0) {
        docs.push(...communityDocs);
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
    const assistantMode = normalizeAssistantMode(context?.assistantMode);
    const body = {
        model,
        temperature: 0,
        messages: [
            { role: "system", content: buildAssistantSystemPrompt(assistantMode) },
            {
                role: "user",
                content: JSON.stringify(
                    buildAssistantUserPayload(prompt, context),
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
    const assistantMode = normalizeAssistantMode(context?.assistantMode);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = {
        systemInstruction: {
            role: "system",
            parts: [{ text: buildAssistantSystemPrompt(assistantMode) }],
        },
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: JSON.stringify(
                            buildAssistantUserPayload(prompt, context),
                            null,
                            2
                        ),
                    },
                ],
            },
        ],
        generationConfig: {
            temperature: 0,
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
    const assistantMode = normalizeAssistantMode(context?.assistantMode);
    const endpoint = `${baseUrl.replace(/\/$/, "")}/api/chat`;
    const body = {
        model,
        stream: false,
        format: "json",
        options: {
            temperature: 0,
            num_predict: numPredict,
            num_ctx: numCtx,
        },
        messages: [
            { role: "system", content: buildAssistantSystemPrompt(assistantMode) },
            {
                role: "user",
                content: JSON.stringify(
                    buildAssistantUserPayload(prompt, context),
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

export const __assistantTestHooks = {
    parseStructuredItemPatchFromInstruction,
    parseStructuredItemBatchPatchesFromInstruction,
    normalizeAttachmentPatchList,
    buildItemAttachmentsFromBodyLines,
    normalizeAssistantMode,
    normalizeTrainingSubmode,
    isTrainingPromptRequest,
    isTrainingApprovalIntent,
    buildTrainingModeReply,
    buildTrainingFictionalDraft,
};

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
                  assistantMode?: unknown;
                  trainingSubmode?: unknown;
                  clientContext?: unknown;
                  proposedActions?: unknown;
                  originalProposedActions?: unknown;
                  userEditedProposal?: unknown;
                  proposalEditSummary?: unknown;
                  previewReply?: string;
                  globalTrainingConsent?: unknown;
                  aiUsageNoticeAccepted?: unknown;
              }
            | null;
        const prompt = asTrimmedString(body?.prompt, 12000);
        const targetCharacterId = asTrimmedString(body?.targetCharacterId, 64);
        const apply = body?.apply !== false;
        const assistantMode = normalizeAssistantMode(body?.assistantMode);
        const trainingSubmode = normalizeTrainingSubmode(body?.trainingSubmode);
        const clientContext = sanitizeClientContext(body?.clientContext);
        const globalTrainingConsent = asBooleanFlag(body?.globalTrainingConsent) === true;
        const aiUsageNoticeAccepted = asBooleanFlag(body?.aiUsageNoticeAccepted) === true;
        const proposedActions =
            Array.isArray(body?.proposedActions) ? body.proposedActions : null;
        const originalProposedActions =
            Array.isArray(body?.originalProposedActions)
                ? body.originalProposedActions
                : null;
        const userEditedProposal = asBooleanFlag(body?.userEditedProposal) === true;
        const proposalEditSummary = asTrimmedString(body?.proposalEditSummary, 1800);
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
        const aiGlobalLearningEnabled = parseEnvBool(
            process.env.AI_GLOBAL_LEARNING_ENABLED,
            DEFAULT_AI_GLOBAL_LEARNING_ENABLED
        );
        const aiGlobalLearningRagEnabled = parseEnvBool(
            process.env.AI_GLOBAL_LEARNING_RAG_ENABLED,
            DEFAULT_AI_GLOBAL_LEARNING_RAG_ENABLED
        );
        const enableLocalFallback = parseEnvBool(
            process.env.AI_ENABLE_LOCAL_FALLBACK,
            true
        );
        const directHeuristicFirst = parseEnvBool(
            process.env.AI_DIRECT_HEURISTIC_FIRST,
            DEFAULT_AI_DIRECT_HEURISTIC_FIRST
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
            25000,
            1500,
            120000
        );
        const geminiTimeoutMs = parseEnvInt(
            process.env.GEMINI_TIMEOUT_MS,
            30000,
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
            320,
            64,
            1024
        );
        const ollamaNumCtx = parseEnvInt(
            process.env.OLLAMA_NUM_CTX,
            6144,
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

        await storeGlobalLearningEvent({
            adminClient,
            enabled: aiGlobalLearningEnabled,
            consent: globalTrainingConsent,
            campaignId,
            userId: user.id,
            role,
            assistantMode,
            trainingSubmode,
            prompt,
            clientContext,
            noticeAccepted: aiUsageNoticeAccepted,
        });

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
            const sanitizedOriginalActions = originalProposedActions
                ? sanitizeActions(originalProposedActions, targetCharacterId)
                : [];
            const hasUserProposalEdits =
                userEditedProposal ||
                (sanitizedOriginalActions.length > 0 &&
                    !areSanitizedActionsEqual(
                        sanitizedOriginalActions,
                        sanitizedActions
                    ));
            if (assistantMode === "training") {
                const results = buildTrainingSimulationResults(sanitizedActions);
                const effectiveReply =
                    previewReply ??
                    "Modo entrenamiento activo: simulé la aplicación del borrador, pero no guardé cambios reales.";
                if (hasUserProposalEdits && sanitizedOriginalActions.length > 0) {
                    await storeProposalEditLearningEvent({
                        adminClient,
                        enabled: aiGlobalLearningEnabled,
                        consent: globalTrainingConsent,
                        campaignId,
                        userId: user.id,
                        role,
                        assistantMode,
                        trainingSubmode,
                        prompt,
                        originalActions: sanitizedOriginalActions,
                        editedActions: sanitizedActions,
                        summary: proposalEditSummary,
                        noticeAccepted: aiUsageNoticeAccepted,
                    });
                }
                return NextResponse.json({
                    reply: effectiveReply,
                    proposedActions: sanitizedActions,
                    applied: false,
                    provider: "training-simulated",
                    intent: "mutation",
                    rag: [],
                    results,
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
                actions: sanitizedActions,
            });

            const effectiveReply =
                previewReply ??
                (sanitizedActions.length === 0
                    ? "No hubo cambios concretos para aplicar."
                    : "He aplicado los cambios confirmados.");

            if (hasUserProposalEdits && sanitizedOriginalActions.length > 0) {
                await storeProposalEditLearningEvent({
                    adminClient,
                    enabled: aiGlobalLearningEnabled,
                    consent: globalTrainingConsent,
                    campaignId,
                    userId: user.id,
                    role,
                    assistantMode,
                    trainingSubmode,
                    prompt,
                    originalActions: sanitizedOriginalActions,
                    editedActions: sanitizedActions,
                    summary: proposalEditSummary,
                    noticeAccepted: aiUsageNoticeAccepted,
                });
            }

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

        if (assistantMode === "training" && trainingSubmode === "ai_prompt") {
            if (isTrainingApprovalIntent(prompt)) {
                return NextResponse.json({
                    reply: "Perfecto. Ejercicio validado en entrenamiento (sin guardar cambios reales). ¿Genero otro reto ficticio?",
                    proposedActions: [],
                    applied: false,
                    provider: "training-local",
                    intent: "chat",
                    rag: [],
                    results: [],
                    permissions: {
                        role,
                        canManageAllCharacters: role === "DM",
                    },
                });
            }

            const trainingDraft = buildTrainingFictionalDraft({
                prompt,
                targetCharacterId,
                clientContext,
                visibleCharacters,
            });
            return NextResponse.json({
                reply: trainingDraft.reply,
                proposedActions: trainingDraft.actions,
                applied: false,
                provider: "training-local",
                intent: "chat",
                rag: [],
                results: [],
                permissions: {
                    role,
                    canManageAllCharacters: role === "DM",
                },
            });
        }

        const intent = classifyAssistantIntent(prompt, targetCharacterId);
        const shouldReturnTrainingCoachOnly =
            assistantMode === "training" &&
            (trainingSubmode === "ai_prompt" ||
                intent === "chat" ||
                intent === "capabilities" ||
                isTrainingPromptRequest(prompt));
        if (shouldReturnTrainingCoachOnly) {
            return NextResponse.json({
                reply: buildTrainingModeReply({
                    prompt,
                    role,
                    clientContext,
                    trainingSubmode,
                    actionCount: 0,
                }),
                proposedActions: [],
                applied: false,
                provider: "training-local",
                intent,
                rag: [],
                results: [],
                permissions: {
                    role,
                    canManageAllCharacters: role === "DM",
                },
            });
        }

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
            directHeuristicFirst && intent === "mutation"
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
            const directPreviewReply =
                assistantMode === "training"
                    ? `${buildTrainingModeReply({
                          prompt,
                          role,
                          clientContext,
                          trainingSubmode,
                          actionCount: directHeuristicPlan.actions.length,
                      })}\n\n${directReply}`
                    : directReply;

            if (!apply) {
                return NextResponse.json({
                    reply: directPreviewReply,
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

            if (assistantMode === "training") {
                return NextResponse.json({
                    reply: directPreviewReply,
                    proposedActions: directHeuristicPlan.actions,
                    applied: false,
                    provider: "training-simulated",
                    intent,
                    rag: [],
                    results: buildTrainingSimulationResults(
                        sanitizeActions(directHeuristicPlan.actions, targetCharacterId)
                    ),
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

        const communityDocs = await loadGlobalLearningDocs({
            adminClient,
            enabled: aiGlobalLearningRagEnabled,
            maxRows: 120,
        });

        const ragSnippets = buildRagSnippets({
            prompt,
            targetCharacterId,
            campaign,
            visibleCharacters,
            notes,
            communityDocs,
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
            assistantMode,
            trainingSubmode,
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

        let plan: AssistantPlan;
        let provider: AIProvider;
        try {
            const result = await requestAssistantPlan({
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
            plan = result.plan;
            provider = result.provider;
        } catch (modelError) {
            const localFallbackPlan =
                intent === "mutation" && effectiveEnableLocalFallback
                    ? buildHeuristicMutationPlan({
                          prompt,
                          visibleCharacters,
                          targetCharacterId,
                          clientContext,
                          visibleCharacterIds,
                      })
                    : null;
            if (localFallbackPlan && localFallbackPlan.actions.length > 0) {
                const fallbackReply =
                    `${localFallbackPlan.reply} (Fallback local por indisponibilidad del modelo).`;
                const fallbackPreviewReply =
                    assistantMode === "training"
                        ? `${buildTrainingModeReply({
                              prompt,
                              role,
                              clientContext,
                              trainingSubmode,
                              actionCount: localFallbackPlan.actions.length,
                          })}\n\n${fallbackReply}`
                        : fallbackReply;
                if (!apply) {
                    return NextResponse.json({
                        reply: fallbackPreviewReply,
                        proposedActions: localFallbackPlan.actions,
                        applied: false,
                        provider: "heuristic-local",
                        intent,
                        rag: ragSnippets,
                        results: [],
                        permissions: {
                            role,
                            canManageAllCharacters: role === "DM",
                        },
                    });
                }
                if (assistantMode === "training") {
                    return NextResponse.json({
                        reply: fallbackPreviewReply,
                        proposedActions: localFallbackPlan.actions,
                        applied: false,
                        provider: "training-simulated",
                        intent,
                        rag: ragSnippets,
                        results: buildTrainingSimulationResults(
                            sanitizeActions(localFallbackPlan.actions, targetCharacterId)
                        ),
                        permissions: {
                            role,
                            canManageAllCharacters: role === "DM",
                        },
                    });
                }
                const fallbackResults = await applyActions({
                    adminClient,
                    campaignId,
                    userId: user.id,
                    role,
                    members,
                    visibleCharacterIds,
                    actions: localFallbackPlan.actions,
                });
                return NextResponse.json({
                    reply: fallbackReply,
                    proposedActions: localFallbackPlan.actions,
                    applied: true,
                    provider: "heuristic-local",
                    intent,
                    rag: ragSnippets,
                    results: fallbackResults,
                    permissions: {
                        role,
                        canManageAllCharacters: role === "DM",
                    },
                });
            }
            throw modelError;
        }

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
        const effectivePreviewReply =
            assistantMode === "training"
                ? `${buildTrainingModeReply({
                      prompt,
                      role,
                      clientContext,
                      trainingSubmode,
                      actionCount: effectiveActions.length,
                  })}\n\n${effectiveReply}`
                : effectiveReply;

        if (!apply) {
            return NextResponse.json({
                reply: effectivePreviewReply,
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

        if (assistantMode === "training") {
            return NextResponse.json({
                reply: effectivePreviewReply,
                proposedActions: effectiveActions,
                applied: false,
                provider: "training-simulated",
                intent,
                rag: ragSnippets,
                results: buildTrainingSimulationResults(effectiveActions),
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

