import {
    normalizeAbilityScores,
    toBestiaryBlocks,
    toLooseRecord,
    type CreatureSheetData,
} from "./bestiaryShared";

export type BestiaryEntrySourceType = "CUSTOM" | "SRD" | "IMPORTED";

export type BestiaryEntryRecord = {
    id: string;
    campaign_id: string;
    name: string;
    source_type: BestiaryEntrySourceType;
    source_index: string;
    source_name: string;
    entry_kind: "ENCOUNTER" | "BOSS" | "ENEMY" | "NPC" | "HAZARD" | "BEAST" | "CUSTOM";
    act_label: string;
    location: string;
    creature_size: string;
    creature_type: string;
    alignment: string;
    challenge_rating: number | null;
    xp: number | null;
    proficiency_bonus: number | null;
    armor_class: number | null;
    hit_points: number | null;
    hit_dice: string;
    speed: Record<string, unknown>;
    ability_scores: Record<string, unknown>;
    saving_throws: Record<string, unknown>;
    skills: Record<string, unknown>;
    senses: Record<string, unknown>;
    languages: string;
    damage_vulnerabilities: string[];
    damage_resistances: string[];
    damage_immunities: string[];
    condition_immunities: string[];
    traits: unknown[];
    actions: unknown[];
    bonus_actions: unknown[];
    reactions: unknown[];
    legendary_actions: unknown[];
    lair_actions: unknown[];
    weaknesses: unknown[];
    flavor: string;
    notes: string;
    image_url: string;
    quantity: number;
    sort_order: number;
    metadata: Record<string, unknown>;
    is_player_visible: boolean;
    image_storage_bucket: string;
    image_storage_path: string;
    created_at: string;
    updated_at: string;
};

function asRecord(raw: unknown): Record<string, unknown> {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    return raw as Record<string, unknown>;
}

function asText(value: unknown): string {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return "";
}

function asNum(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number(value.trim());
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
}

function asInt(value: unknown): number | null {
    const parsed = asNum(value);
    return parsed == null ? null : Math.round(parsed);
}

function asSourceType(value: unknown): BestiaryEntrySourceType {
    const upper = asText(value).toUpperCase();
    if (upper === "SRD" || upper === "IMPORTED" || upper === "CUSTOM") return upper;
    return "CUSTOM";
}

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
}

function asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

function extractTags(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value
            .map((item) => asText(item))
            .filter(Boolean);
    }

    const raw = asText(value);
    if (!raw) return [];

    return raw
        .split(/[,;/|]/)
        .map((token) => token.trim())
        .filter(Boolean);
}

export function bestiarySourceLabel(sourceType: unknown, locale: string): string {
    const normalized = asSourceType(sourceType);
    if (normalized === "SRD") return locale === "en" ? "Common bestiary (SRD)" : "Bestiario comun (SRD)";
    if (normalized === "IMPORTED") return locale === "en" ? "Imported" : "Importada";
    return locale === "en" ? "Custom" : "Personalizada";
}

export function toBestiaryEntryRecord(raw: unknown): BestiaryEntryRecord {
    const row = asRecord(raw);
    return {
        id: asText(row.id),
        campaign_id: asText(row.campaign_id),
        name: asText(row.name),
        source_type: asSourceType(row.source_type),
        source_index: asText(row.source_index),
        source_name: asText(row.source_name),
        entry_kind: (
            asText(row.entry_kind).toUpperCase() as BestiaryEntryRecord["entry_kind"]
        ) || "ENCOUNTER",
        act_label: asText(row.act_label),
        location: asText(row.location),
        creature_size: asText(row.creature_size),
        creature_type: asText(row.creature_type),
        alignment: asText(row.alignment),
        challenge_rating: asNum(row.challenge_rating),
        xp: asInt(row.xp),
        proficiency_bonus: asInt(row.proficiency_bonus),
        armor_class: asInt(row.armor_class),
        hit_points: asInt(row.hit_points),
        hit_dice: asText(row.hit_dice),
        speed: toLooseRecord(row.speed),
        ability_scores: toLooseRecord(row.ability_scores),
        saving_throws: toLooseRecord(row.saving_throws),
        skills: toLooseRecord(row.skills),
        senses: toLooseRecord(row.senses),
        languages: asText(row.languages),
        damage_vulnerabilities: asStringArray(row.damage_vulnerabilities),
        damage_resistances: asStringArray(row.damage_resistances),
        damage_immunities: asStringArray(row.damage_immunities),
        condition_immunities: asStringArray(row.condition_immunities),
        traits: asArray(row.traits),
        actions: asArray(row.actions),
        bonus_actions: asArray(row.bonus_actions),
        reactions: asArray(row.reactions),
        legendary_actions: asArray(row.legendary_actions),
        lair_actions: asArray(row.lair_actions),
        weaknesses: asArray(row.weaknesses),
        flavor: asText(row.flavor),
        notes: asText(row.notes),
        image_url: asText(row.image_url),
        quantity: asInt(row.quantity) ?? 1,
        sort_order: asInt(row.sort_order) ?? 0,
        metadata: toLooseRecord(row.metadata),
        is_player_visible: row.is_player_visible === true,
        image_storage_bucket: asText(row.image_storage_bucket),
        image_storage_path: asText(row.image_storage_path),
        created_at: asText(row.created_at),
        updated_at: asText(row.updated_at),
    };
}

export function toCreatureSheetDataFromBestiaryEntry(
    entry: BestiaryEntryRecord,
    locale: string
): CreatureSheetData {
    const metadataTags = extractTags(entry.metadata.tags);
    const typeTags = extractTags(entry.creature_type);
    const entryKindTags = extractTags(entry.entry_kind);
    const tags = Array.from(new Set([...metadataTags, ...typeTags, ...entryKindTags]));

    return {
        name: entry.name,
        subtitle: [entry.creature_size, entry.creature_type, entry.alignment].filter(Boolean).join(" · "),
        sourceLabel: bestiarySourceLabel(entry.source_type, locale),
        imageUrl: entry.image_url || null,
        isPlayerVisible: entry.is_player_visible,
        creatureSize: entry.creature_size || null,
        creatureType: entry.creature_type || null,
        alignment: entry.alignment || null,
        challengeRating: entry.challenge_rating,
        xp: entry.xp,
        armorClass: entry.armor_class,
        hitPoints: entry.hit_points,
        hitDice: entry.hit_dice || null,
        proficiencyBonus: entry.proficiency_bonus,
        abilityScores: normalizeAbilityScores(entry.ability_scores),
        speed: toLooseRecord(entry.speed),
        savingThrows: toLooseRecord(entry.saving_throws),
        skills: toLooseRecord(entry.skills),
        senses: toLooseRecord(entry.senses),
        languages: entry.languages || null,
        flavor: entry.flavor || null,
        notes: entry.notes || null,
        tags,
        traits: toBestiaryBlocks(entry.traits),
        actions: toBestiaryBlocks(entry.actions),
        bonusActions: toBestiaryBlocks(entry.bonus_actions),
        reactions: toBestiaryBlocks(entry.reactions),
        legendaryActions: toBestiaryBlocks(entry.legendary_actions),
        lairActions: toBestiaryBlocks(entry.lair_actions),
    };
}
