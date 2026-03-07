"use client";

import {
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type DragEvent,
    type WheelEvent,
} from "react";
import {
    ChevronDown,
    ChevronRight,
    Folder,
    Plus,
    RefreshCw,
    Save,
    Search,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { tr } from "@/lib/i18n/translate";
import {
    CreatureSheet,
    DEFAULT_ABILITY_SCORES,
    normalizeAbilityScores,
    normalizeImageUrl,
    toBestiaryBlocks,
    toLooseRecord,
    type AbilityKey,
    type AbilityScores,
    type BestiaryBlock,
    type CreatureSheetData,
} from "../shared/bestiaryShared";
import type { BestiaryPendingProposalPreview } from "../shared/bestiaryProposalShared";
import { getBestiarySelectionStyle, SelectionBlobOverlay } from "../shared/selectionBlobShared";

type BestiaryManagerPanelProps = {
    campaignId: string;
    locale: string;
    refreshNonce?: number;
    focusEntryId?: string | null;
    pendingProposal?: BestiaryPendingProposalPreview | null;
    proposalBusy?: boolean;
    onConfirmPendingProposal?: () => void;
    onRejectPendingProposal?: () => void;
    onSelectedEntryChange?: (entry: { id: string; name: string } | null) => void;
};

type SourceType = "CUSTOM" | "SRD" | "IMPORTED";
type ViewMode = "campaign" | "common";

type CampaignEntry = {
    id: string;
    name: string;
    folderPath: string;
    catalogIndex: string;
    sourceType: SourceType;
    sourceIndex: string;
    creatureType: string;
    creatureSize: string;
    alignment: string;
    challengeRating: number | null;
    xp: number | null;
    armorClass: number | null;
    hitPoints: number | null;
    hitDice: string;
    proficiencyBonus: number | null;
    abilityScores: AbilityScores;
    speed: Record<string, unknown>;
    savingThrows: Record<string, unknown>;
    skills: Record<string, unknown>;
    senses: Record<string, unknown>;
    languages: string;
    flavor: string;
    notes: string;
    metadata: Record<string, unknown>;
    tags: string[];
    traits: BestiaryBlock[];
    actions: BestiaryBlock[];
    bonusActions: BestiaryBlock[];
    reactions: BestiaryBlock[];
    legendaryActions: BestiaryBlock[];
    lairActions: BestiaryBlock[];
    imageUrl: string;
    isPlayerVisible: boolean;
    sortOrder: number;
    createdAt: string;
};

type Draft = {
    id: string | null;
    name: string;
    folderPath: string;
    catalogIndex: string;
    sourceType: SourceType;
    sourceIndex: string;
    creatureType: string;
    creatureSize: string;
    alignment: string;
    challengeRating: string;
    xp: string;
    armorClass: string;
    hitPoints: string;
    hitDice: string;
    proficiencyBonus: string;
    abilityScores: AbilityScores;
    speed: Record<string, unknown>;
    savingThrows: Record<string, unknown>;
    skills: Record<string, unknown>;
    senses: Record<string, unknown>;
    languages: string;
    flavor: string;
    notes: string;
    metadata: Record<string, unknown>;
    tags: string[];
    traits: BestiaryBlock[];
    actions: BestiaryBlock[];
    bonusActions: BestiaryBlock[];
    reactions: BestiaryBlock[];
    legendaryActions: BestiaryBlock[];
    lairActions: BestiaryBlock[];
    imageUrl: string;
    isPlayerVisible: boolean;
    sortOrder: number;
};

type CommonSummary = {
    index: string;
    name: string;
    type: string;
    challenge_rating: number | null;
    size: string;
    alignment: string;
};

type CommonDetail = Record<string, unknown>;
type CommonSort = "name_asc" | "name_desc" | "cr_asc" | "cr_desc" | "type_asc";
type CommonCrBand = "all" | "0-1" | "2-4" | "5-10" | "11+";
type CampaignTreeItem = { key: string; entry: CampaignEntry; isPreview: boolean };
type CampaignTreeFolder = {
    key: string;
    name: string;
    path: string;
    folders: CampaignTreeFolder[];
    items: CampaignTreeItem[];
    totalCount: number;
};

const DEFAULT_ENTRY_KIND = "ENCOUNTER";
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const BESTIARY_DRAG_ENTRY_TYPE = "application/x-bestiary-entry-id";
const BESTIARY_DRAG_FOLDER_TYPE = "application/x-bestiary-folder-path";
const UNCATEGORIZED_FOLDER_NODE_KEY = "folder:__uncategorized__";

const MANUAL_BESTIARY_FOLDERS_STORAGE_KEY_PREFIX = "dnd-manager:bestiary-folders:";
const BESTIARY_FOLDER_ORDER_STORAGE_KEY_PREFIX = "dnd-manager:bestiary-folder-order:";

function manualBestiaryFoldersStorageKey(campaignId: string): string {
    return `${MANUAL_BESTIARY_FOLDERS_STORAGE_KEY_PREFIX}${campaignId}`;
}

function manualBestiaryFolderOrderStorageKey(campaignId: string): string {
    return `${BESTIARY_FOLDER_ORDER_STORAGE_KEY_PREFIX}${campaignId}`;
}

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
    const n = asNum(value);
    return n == null ? null : Math.round(n);
}

function asSourceType(value: unknown): SourceType {
    const upper = asText(value).toUpperCase();
    if (upper === "SRD" || upper === "IMPORTED" || upper === "CUSTOM") return upper;
    return "CUSTOM";
}

function fromInputNumber(value: string, integer = false): number | null {
    const n = asNum(value);
    if (n == null) return null;
    return integer ? Math.round(n) : n;
}

function toInputNumber(value: number | null): string {
    return value == null ? "" : String(value);
}

function serializeLooseValue(value: unknown): string {
    if (value == null) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return "";
}

function looseRecordToEditorText(value: Record<string, unknown>): string {
    const lines: string[] = [];
    for (const [key, rawValue] of Object.entries(value)) {
        const serialized = serializeLooseValue(rawValue);
        if (!key.trim() || !serialized) continue;
        lines.push(`${key}: ${serialized}`);
    }
    return lines.join("\n");
}

function parseLooseRecordFromEditorText(value: string): Record<string, unknown> {
    const next: Record<string, unknown> = {};
    const lines = value.replace(/\r/g, "").split("\n");
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        const match = line.match(/^([^:=]{1,60})\s*[:=]\s*(.+)$/);
        if (!match) continue;
        const key = match[1].trim();
        const rawValue = match[2].trim();
        if (!key || !rawValue) continue;

        const booleanValue = rawValue.toLowerCase();
        if (booleanValue === "true" || booleanValue === "false") {
            next[key] = booleanValue === "true";
            continue;
        }

        const normalizedNumber = rawValue.replace(",", ".");
        if (/^-?\d+(?:[.]\d+)?$/.test(normalizedNumber)) {
            const parsed = Number(normalizedNumber);
            if (Number.isFinite(parsed)) {
                next[key] = Number.isInteger(parsed) ? Math.round(parsed) : parsed;
                continue;
            }
        }

        next[key] = rawValue;
    }
    return next;
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

function normalizeTags(value: string[]): string[] {
    const output: string[] = [];
    const seen = new Set<string>();
    for (const rawTag of value) {
        const tag = String(rawTag ?? "").trim();
        if (!tag) continue;
        const key = tag.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        output.push(tag);
    }
    return output;
}

function tagsToEditorText(tags: string[]): string {
    return normalizeTags(tags).join(", ");
}

function parseTagsFromEditorText(value: string): string[] {
    return normalizeTags(
        value
            .split(/[,;/|]/)
            .map((token) => token.trim())
            .filter(Boolean)
    );
}

function normalizeLookupKey(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

function parseCommonProficiencies(
    value: unknown
): { savingThrows: Record<string, unknown>; skills: Record<string, unknown> } {
    const savingThrows: Record<string, unknown> = {};
    const skills: Record<string, unknown> = {};

    if (!Array.isArray(value)) {
        return { savingThrows, skills };
    }

    const saveAliasMap: Record<string, string> = {
        strength: "STR",
        str: "STR",
        fuerza: "STR",
        dexterity: "DEX",
        dex: "DEX",
        destreza: "DEX",
        constitution: "CON",
        con: "CON",
        constitucion: "CON",
        intelligence: "INT",
        int: "INT",
        inteligencia: "INT",
        wisdom: "WIS",
        wis: "WIS",
        sabiduria: "WIS",
        charisma: "CHA",
        cha: "CHA",
        carisma: "CHA",
    };

    for (const entry of value) {
        const row = asRecord(entry);
        const rawValue = asNum(row.value);
        if (rawValue == null) continue;

        const proficiency = asRecord(row.proficiency);
        const rawIndex = asText(proficiency.index || row.index);
        const rawName = asText(proficiency.name || row.name || rawIndex);

        const normalizedIndex = normalizeLookupKey(rawIndex);
        const normalizedName = normalizeLookupKey(rawName);
        const isSave = normalizedIndex.startsWith("savingthrow") || normalizedName.startsWith("savingthrow");
        const isSkill = normalizedIndex.startsWith("skill") || normalizedName.startsWith("skill");

        if (isSave) {
            const saveToken = rawName
                .split(/[:()]/)
                .map((part) => normalizeLookupKey(part))
                .find((part) => saveAliasMap[part]);
            if (saveToken) {
                savingThrows[saveAliasMap[saveToken]] = Math.round(rawValue);
                continue;
            }

            const suffix = normalizedIndex.replace(/^savingthrow/, "");
            if (saveAliasMap[suffix]) {
                savingThrows[saveAliasMap[suffix]] = Math.round(rawValue);
            }
            continue;
        }

        if (isSkill) {
            const keyFromIndex = normalizedIndex.replace(/^skill/, "");
            if (keyFromIndex) {
                skills[keyFromIndex] = Math.round(rawValue);
                continue;
            }

            const keyFromName = normalizedName.replace(/^skill/, "");
            if (keyFromName) {
                skills[keyFromName] = Math.round(rawValue);
            }
        }
    }

    return { savingThrows, skills };
}

function bestiaryBlocksToEditorText(blocks: BestiaryBlock[]): string {
    return blocks
        .map((block) => {
            const name = block.name.trim();
            const desc = block.desc.trim();
            if (name && desc) return `${name}\n${desc}`;
            if (name) return name;
            return desc;
        })
        .filter(Boolean)
        .join("\n\n");
}

function parseBestiaryBlocksFromEditorText(value: string): BestiaryBlock[] {
    const chunks = value
        .replace(/\r/g, "")
        .split(/\n{2,}/)
        .map((entry) => entry.trim())
        .filter(Boolean);

    const parsed: BestiaryBlock[] = [];
    for (const chunk of chunks) {
        const lines = chunk
            .split("\n")
            .map((entry) => entry.trim())
            .filter(Boolean);
        if (lines.length === 0) continue;

        if (lines.length === 1) {
            parsed.push({ name: "", desc: lines[0] });
            continue;
        }

        const name = lines[0].replace(/[:\-–—]+$/g, "").trim();
        const desc = lines.slice(1).join("\n").trim();
        if (!name && !desc) continue;
        if (!desc) {
            parsed.push({ name: "", desc: name });
            continue;
        }
        parsed.push({ name, desc });
    }
    return parsed;
}

function compareEntries(a: CampaignEntry, b: CampaignEntry): number {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.createdAt.localeCompare(b.createdAt);
}

function normalizeFolderPath(value: string): string {
    return String(value ?? "")
        .replace(/[\\]+/g, "/")
        .split("/")
        .map((segment) => segment.trim())
        .filter(Boolean)
        .join("/");
}

function folderParentPath(value: string): string {
    const normalized = normalizeFolderPath(value);
    if (!normalized) return "";
    const index = normalized.lastIndexOf("/");
    return index < 0 ? "" : normalized.slice(0, index);
}

function folderBaseName(value: string): string {
    const normalized = normalizeFolderPath(value);
    if (!normalized) return "";
    const index = normalized.lastIndexOf("/");
    return index < 0 ? normalized : normalized.slice(index + 1);
}

function isSameOrDescendantFolderPath(candidatePath: string, folderPath: string): boolean {
    const candidate = normalizeFolderPath(candidatePath);
    const target = normalizeFolderPath(folderPath);
    if (!candidate || !target) return false;
    return candidate === target || candidate.startsWith(`${target}/`);
}

function isDirectChildFolderPath(candidatePath: string, parentPath: string): boolean {
    const candidate = normalizeFolderPath(candidatePath);
    const parent = normalizeFolderPath(parentPath);
    if (!candidate) return false;
    if (!parent) return !candidate.includes("/");
    if (!candidate.startsWith(`${parent}/`)) return false;
    const remaining = candidate.slice(parent.length + 1);
    return !remaining.includes("/");
}

function replaceFolderPrefix(path: string, oldPrefix: string, newPrefix: string): string {
    const normalizedPath = normalizeFolderPath(path);
    const oldPath = normalizeFolderPath(oldPrefix);
    const nextPrefix = normalizeFolderPath(newPrefix);
    if (!normalizedPath || !oldPath) return normalizedPath;
    if (normalizedPath === oldPath) return nextPrefix;
    if (!normalizedPath.startsWith(`${oldPath}/`)) return normalizedPath;
    const suffix = normalizedPath.slice(oldPath.length + 1);
    return normalizeFolderPath(nextPrefix ? `${nextPrefix}/${suffix}` : suffix);
}

function readFolderPathFromMetadata(metadata: Record<string, unknown>): string {
    return normalizeFolderPath(
        asText(
            metadata.folder_path ??
                metadata.folderPath ??
                metadata.folder ??
                metadata.bestiary_folder ??
                metadata.bestiaryFolder
        )
    );
}

function readCatalogIndexFromMetadata(metadata: Record<string, unknown>): string {
    return asText(
        metadata.catalog_index ??
            metadata.catalogIndex ??
            metadata.bestiary_index ??
            metadata.bestiaryIndex
    );
}

function compareCatalogIndex(left: string, right: string, locale: string): number {
    const a = String(left ?? "").trim();
    const b = String(right ?? "").trim();
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b, locale, {
        numeric: true,
        sensitivity: "base",
    });
}

function compareCampaignListEntries(a: CampaignEntry, b: CampaignEntry, locale: string): number {
    const explicitSortCompare = compareEntries(a, b);
    if (explicitSortCompare !== 0) return explicitSortCompare;

    const catalogCompare = compareCatalogIndex(a.catalogIndex, b.catalogIndex, locale);
    if (catalogCompare !== 0) return catalogCompare;

    const byName = a.name.localeCompare(b.name, locale, { sensitivity: "base" });
    if (byName !== 0) return byName;

    return 0;
}

type CampaignTreeBuilderNode = {
    key: string;
    name: string;
    path: string;
    folders: Map<string, CampaignTreeBuilderNode>;
    items: CampaignTreeItem[];
};

function buildCampaignFolderTree(
    items: CampaignTreeItem[],
    folderPaths: string[],
    folderOrderByParent: Record<string, string[]>,
    locale: string
): CampaignTreeFolder {
    const root: CampaignTreeBuilderNode = {
        key: "root",
        name: "",
        path: "",
        folders: new Map(),
        items: [],
    };

    function ensureFolderPath(path: string): CampaignTreeBuilderNode {
        const normalizedPath = normalizeFolderPath(path);
        if (!normalizedPath) return root;
        const segments = normalizedPath.split("/").filter(Boolean);
        let current = root;
        let currentPath = "";
        for (const segment of segments) {
            currentPath = currentPath ? `${currentPath}/${segment}` : segment;
            const mapKey = segment.toLowerCase();
            const existing = current.folders.get(mapKey);
            if (existing) {
                current = existing;
                continue;
            }
            const created: CampaignTreeBuilderNode = {
                key: `folder:${currentPath}`,
                name: segment,
                path: currentPath,
                folders: new Map(),
                items: [],
            };
            current.folders.set(mapKey, created);
            current = created;
        }
        return current;
    }

    for (const folderPath of folderPaths) {
        ensureFolderPath(folderPath);
    }

    for (const item of items) {
        const targetNode = ensureFolderPath(item.entry.folderPath);
        if (targetNode === root) {
            root.items.push(item);
            continue;
        }

        targetNode.items.push(item);
    }

    function finalize(node: CampaignTreeBuilderNode): CampaignTreeFolder {
        const parentPath = normalizeFolderPath(node.path);
        const desiredOrder = Array.from(
            new Set(
                (Array.isArray(folderOrderByParent[parentPath])
                    ? folderOrderByParent[parentPath]
                    : []
                )
                    .map((value) => normalizeFolderPath(value))
                    .filter((value) => isDirectChildFolderPath(value, parentPath))
            )
        );
        const orderLookup = new Map<string, number>();
        for (let index = 0; index < desiredOrder.length; index += 1) {
            orderLookup.set(desiredOrder[index], index);
        }
        const folders = Array.from(node.folders.values())
            .map((child) => finalize(child))
            .sort((left, right) => {
                const leftOrder = orderLookup.get(normalizeFolderPath(left.path));
                const rightOrder = orderLookup.get(normalizeFolderPath(right.path));
                const leftHasOrder = leftOrder != null;
                const rightHasOrder = rightOrder != null;
                if (leftHasOrder && rightHasOrder && leftOrder !== rightOrder) {
                    return leftOrder - rightOrder;
                }
                if (leftHasOrder !== rightHasOrder) return leftHasOrder ? -1 : 1;
                return left.name.localeCompare(right.name, locale, {
                    sensitivity: "base",
                });
            });
        const sortedItems = [...node.items].sort((left, right) => {
            if (left.isPreview !== right.isPreview) return left.isPreview ? -1 : 1;
            return compareCampaignListEntries(left.entry, right.entry, locale);
        });
        const totalCount =
            sortedItems.length + folders.reduce((sum, folder) => sum + folder.totalCount, 0);
        return {
            key: node.key,
            name: node.name,
            path: node.path,
            folders,
            items: sortedItems,
            totalCount,
        };
    }

    return finalize(root);
}

function visibilityError(error: unknown): boolean {
    return asText((error as { message?: unknown } | null)?.message).toLowerCase().includes("is_player_visible");
}

function toEntry(raw: Record<string, unknown>): CampaignEntry {
    const metadata = asRecord(raw.metadata);
    const metadataTags = extractTags(metadata.tags);
    const typeTags = extractTags(raw.creature_type);
    const entryKindTags = extractTags(raw.entry_kind);
    const tags = Array.from(new Set([...metadataTags, ...typeTags, ...entryKindTags]));
    const folderPath = readFolderPathFromMetadata(metadata);
    const catalogIndex = readCatalogIndexFromMetadata(metadata);

    return {
        id: asText(raw.id),
        name: asText(raw.name),
        folderPath,
        catalogIndex,
        sourceType: asSourceType(raw.source_type),
        sourceIndex: asText(raw.source_index),
        creatureType: asText(raw.creature_type),
        creatureSize: asText(raw.creature_size),
        alignment: asText(raw.alignment),
        challengeRating: asNum(raw.challenge_rating),
        xp: asInt(raw.xp),
        armorClass: asInt(raw.armor_class),
        hitPoints: asInt(raw.hit_points),
        hitDice: asText(raw.hit_dice),
        proficiencyBonus: asInt(raw.proficiency_bonus),
        abilityScores: normalizeAbilityScores(raw.ability_scores),
        speed: toLooseRecord(raw.speed),
        savingThrows: toLooseRecord(raw.saving_throws),
        skills: toLooseRecord(raw.skills),
        senses: toLooseRecord(raw.senses),
        languages: asText(raw.languages),
        flavor: asText(raw.flavor),
        notes: asText(raw.notes),
        metadata,
        tags,
        traits: toBestiaryBlocks(raw.traits),
        actions: toBestiaryBlocks(raw.actions),
        bonusActions: toBestiaryBlocks(raw.bonus_actions),
        reactions: toBestiaryBlocks(raw.reactions),
        legendaryActions: toBestiaryBlocks(raw.legendary_actions),
        lairActions: toBestiaryBlocks(raw.lair_actions),
        imageUrl: asText(raw.image_url),
        isPlayerVisible: raw.is_player_visible === true,
        sortOrder: asInt(raw.sort_order) ?? 0,
        createdAt: asText(raw.created_at),
    };
}

function entryToDraft(entry: CampaignEntry): Draft {
    return {
        id: entry.id,
        name: entry.name,
        folderPath: entry.folderPath,
        catalogIndex: entry.catalogIndex,
        sourceType: entry.sourceType,
        sourceIndex: entry.sourceIndex,
        creatureType: entry.creatureType,
        creatureSize: entry.creatureSize,
        alignment: entry.alignment,
        challengeRating: toInputNumber(entry.challengeRating),
        xp: toInputNumber(entry.xp),
        armorClass: toInputNumber(entry.armorClass),
        hitPoints: toInputNumber(entry.hitPoints),
        hitDice: entry.hitDice,
        proficiencyBonus: toInputNumber(entry.proficiencyBonus),
        abilityScores: entry.abilityScores,
        speed: entry.speed,
        savingThrows: entry.savingThrows,
        skills: entry.skills,
        senses: entry.senses,
        languages: entry.languages,
        flavor: entry.flavor,
        notes: entry.notes,
        metadata: entry.metadata,
        tags: entry.tags,
        traits: entry.traits,
        actions: entry.actions,
        bonusActions: entry.bonusActions,
        reactions: entry.reactions,
        legendaryActions: entry.legendaryActions,
        lairActions: entry.lairActions,
        imageUrl: entry.imageUrl,
        isPlayerVisible: entry.isPlayerVisible,
        sortOrder: entry.sortOrder,
    };
}

function emptyDraft(sortOrder: number, folderPath = ""): Draft {
    return {
        id: null,
        name: "",
        folderPath: normalizeFolderPath(folderPath),
        catalogIndex: "",
        sourceType: "CUSTOM",
        sourceIndex: "",
        creatureType: "",
        creatureSize: "",
        alignment: "",
        challengeRating: "",
        xp: "",
        armorClass: "",
        hitPoints: "",
        hitDice: "",
        proficiencyBonus: "",
        abilityScores: { ...DEFAULT_ABILITY_SCORES },
        speed: {},
        savingThrows: {},
        skills: {},
        senses: {},
        languages: "",
        flavor: "",
        notes: "",
        metadata: {},
        tags: [],
        traits: [],
        actions: [],
        bonusActions: [],
        reactions: [],
        legendaryActions: [],
        lairActions: [],
        imageUrl: "",
        isPlayerVisible: false,
        sortOrder,
    };
}

function toPayload(draft: Draft, campaignId: string, includeVisibility: boolean): Record<string, unknown> {
    const normalizedTags = normalizeTags(draft.tags);
    const derivedTags = normalizeTags([
        ...extractTags(draft.creatureType),
        ...extractTags(DEFAULT_ENTRY_KIND),
    ]);
    const derivedLookup = new Set(derivedTags.map((tag) => tag.toLowerCase()));
    const metadataTags = normalizedTags.filter((tag) => !derivedLookup.has(tag.toLowerCase()));
    const metadata = { ...asRecord(draft.metadata) };
    delete metadata.folderPath;
    delete metadata.folder;
    delete metadata.bestiary_folder;
    delete metadata.bestiaryFolder;
    delete metadata.catalogIndex;
    delete metadata.bestiary_index;
    delete metadata.bestiaryIndex;
    const normalizedFolderPath = normalizeFolderPath(draft.folderPath);
    const normalizedCatalogIndex = draft.catalogIndex.trim();
    if (metadataTags.length > 0) {
        metadata.tags = metadataTags;
    } else {
        delete metadata.tags;
    }
    if (normalizedFolderPath) {
        metadata.folder_path = normalizedFolderPath;
    } else {
        delete metadata.folder_path;
    }
    if (normalizedCatalogIndex) {
        metadata.catalog_index = normalizedCatalogIndex;
    } else {
        delete metadata.catalog_index;
    }

    const payload: Record<string, unknown> = {
        campaign_id: campaignId,
        name: draft.name.trim(),
        source_type: draft.sourceType,
        source_index: draft.sourceIndex.trim() || null,
        source_name: draft.sourceType === "SRD" ? "dnd5eapi" : null,
        entry_kind: DEFAULT_ENTRY_KIND,
        creature_type: draft.creatureType.trim() || null,
        creature_size: draft.creatureSize.trim() || null,
        alignment: draft.alignment.trim() || null,
        challenge_rating: fromInputNumber(draft.challengeRating),
        xp: fromInputNumber(draft.xp, true),
        armor_class: fromInputNumber(draft.armorClass, true),
        hit_points: fromInputNumber(draft.hitPoints, true),
        hit_dice: draft.hitDice.trim() || null,
        proficiency_bonus: fromInputNumber(draft.proficiencyBonus, true),
        ability_scores: draft.abilityScores,
        speed: draft.speed,
        saving_throws: draft.savingThrows,
        skills: draft.skills,
        senses: draft.senses,
        languages: draft.languages.trim() || null,
        flavor: draft.flavor.trim() || null,
        notes: draft.notes.trim() || null,
        metadata: Object.keys(metadata).length > 0 ? metadata : {},
        traits: draft.traits,
        actions: draft.actions,
        bonus_actions: draft.bonusActions,
        reactions: draft.reactions,
        legendary_actions: draft.legendaryActions,
        lair_actions: draft.lairActions,
        image_url: draft.imageUrl.trim() || null,
        sort_order: draft.sortOrder,
    };
    if (includeVisibility) payload.is_player_visible = draft.isPlayerVisible;
    return payload;
}

async function authToken(): Promise<string> {
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();
    if (error || !session?.access_token) throw new Error("No authenticated session.");
    return session.access_token;
}

async function uploadImage(campaignId: string, entryId: string, file: File): Promise<string> {
    const token = await authToken();
    const formData = new FormData();
    formData.set("file", file);
    const response = await fetch(`/api/dnd/campaigns/${campaignId}/bestiary/${entryId}/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    const payload = (await response.json().catch(() => null)) as { imageUrl?: unknown; error?: unknown } | null;
    if (!response.ok) throw new Error(asText(payload?.error) || "Could not upload image.");
    const imageUrl = asText(payload?.imageUrl);
    if (!imageUrl) throw new Error("Missing image URL.");
    return imageUrl;
}

async function removeImage(campaignId: string, entryId: string): Promise<void> {
    const token = await authToken();
    const response = await fetch(`/api/dnd/campaigns/${campaignId}/bestiary/${entryId}/clear-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });
    const payload = (await response.json().catch(() => null)) as { error?: unknown } | null;
    if (!response.ok) throw new Error(asText(payload?.error) || "Could not remove image.");
}

function sourceLabel(sourceType: SourceType, locale: string): string {
    if (sourceType === "SRD") return locale === "en" ? "Common bestiary (SRD)" : "Bestiario comun (SRD)";
    if (sourceType === "IMPORTED") return locale === "en" ? "Imported" : "Importada";
    return locale === "en" ? "Custom" : "Personalizada";
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(record, key);
}

function sourceTypeFromPatch(value: unknown): SourceType | null {
    const normalized = asText(value).toUpperCase();
    if (normalized === "CUSTOM" || normalized === "SRD" || normalized === "IMPORTED") {
        return normalized;
    }
    return null;
}

function formatInlineRecord(value: Record<string, unknown>): string {
    const pieces = Object.entries(value)
        .map(([key, rawValue]) => {
            const text = asText(rawValue);
            if (!text) return null;
            return `${key}: ${text}`;
        })
        .filter((entry): entry is string => Boolean(entry));
    return pieces.join(", ");
}

function createProposalPreviewSeedEntry(entries: CampaignEntry[]): CampaignEntry {
    const nextSortOrder = entries.reduce((max, entry) => Math.max(max, entry.sortOrder), 0) + 1;
    return {
        id: "preview",
        name: "",
        folderPath: "",
        catalogIndex: "",
        sourceType: "CUSTOM",
        sourceIndex: "",
        creatureType: "",
        creatureSize: "",
        alignment: "",
        challengeRating: null,
        xp: null,
        armorClass: null,
        hitPoints: null,
        hitDice: "",
        proficiencyBonus: null,
        abilityScores: { ...DEFAULT_ABILITY_SCORES },
        speed: {},
        savingThrows: {},
        skills: {},
        senses: {},
        languages: "",
        flavor: "",
        notes: "",
        metadata: {},
        tags: [],
        traits: [],
        actions: [],
        bonusActions: [],
        reactions: [],
        legendaryActions: [],
        lairActions: [],
        imageUrl: "",
        isPlayerVisible: false,
        sortOrder: nextSortOrder,
        createdAt: new Date().toISOString(),
    };
}

function applyBestiaryPatchToEntryPreview(
    baseEntry: CampaignEntry,
    patch: Record<string, unknown>
): CampaignEntry {
    const next: CampaignEntry = {
        ...baseEntry,
        abilityScores: { ...baseEntry.abilityScores },
        speed: { ...baseEntry.speed },
        savingThrows: { ...baseEntry.savingThrows },
        skills: { ...baseEntry.skills },
        senses: { ...baseEntry.senses },
        metadata: { ...baseEntry.metadata },
        tags: [...baseEntry.tags],
        traits: [...baseEntry.traits],
        actions: [...baseEntry.actions],
        bonusActions: [...baseEntry.bonusActions],
        reactions: [...baseEntry.reactions],
        legendaryActions: [...baseEntry.legendaryActions],
        lairActions: [...baseEntry.lairActions],
    };

    if (hasOwn(patch, "name")) next.name = asText(patch.name);
    if (hasOwn(patch, "source_type")) {
        const nextSourceType = sourceTypeFromPatch(patch.source_type);
        if (nextSourceType) next.sourceType = nextSourceType;
    }
    if (hasOwn(patch, "source_index")) next.sourceIndex = asText(patch.source_index);
    if (hasOwn(patch, "creature_type")) next.creatureType = asText(patch.creature_type);
    if (hasOwn(patch, "creature_size")) next.creatureSize = asText(patch.creature_size);
    if (hasOwn(patch, "alignment")) next.alignment = asText(patch.alignment);
    if (hasOwn(patch, "challenge_rating")) next.challengeRating = asNum(patch.challenge_rating);
    if (hasOwn(patch, "xp")) next.xp = asInt(patch.xp);
    if (hasOwn(patch, "armor_class")) next.armorClass = asInt(patch.armor_class);
    if (hasOwn(patch, "hit_points")) next.hitPoints = asInt(patch.hit_points);
    if (hasOwn(patch, "hit_dice")) next.hitDice = asText(patch.hit_dice);
    if (hasOwn(patch, "proficiency_bonus")) next.proficiencyBonus = asInt(patch.proficiency_bonus);
    if (hasOwn(patch, "languages")) next.languages = asText(patch.languages);
    if (hasOwn(patch, "flavor")) next.flavor = asText(patch.flavor);
    if (hasOwn(patch, "notes")) next.notes = asText(patch.notes);
    if (hasOwn(patch, "image_url")) next.imageUrl = asText(patch.image_url);
    if (hasOwn(patch, "sort_order")) {
        next.sortOrder = asInt(patch.sort_order) ?? next.sortOrder;
    }
    if (hasOwn(patch, "is_player_visible")) {
        next.isPlayerVisible = patch.is_player_visible === true;
    }
    if (hasOwn(patch, "ability_scores")) {
        const merged = normalizeAbilityScores({
            ...next.abilityScores,
            ...asRecord(patch.ability_scores),
        });
        next.abilityScores = merged;
    }
    if (hasOwn(patch, "speed")) next.speed = toLooseRecord(patch.speed);
    if (hasOwn(patch, "saving_throws")) next.savingThrows = toLooseRecord(patch.saving_throws);
    if (hasOwn(patch, "skills")) next.skills = toLooseRecord(patch.skills);
    if (hasOwn(patch, "senses")) next.senses = toLooseRecord(patch.senses);
    if (hasOwn(patch, "metadata")) {
        next.metadata = { ...next.metadata, ...asRecord(patch.metadata) };
    }
    if (hasOwn(patch, "folder_path") || hasOwn(patch, "folderPath")) {
        next.folderPath = normalizeFolderPath(asText(patch.folder_path ?? patch.folderPath));
    } else if (hasOwn(patch, "metadata")) {
        next.folderPath = readFolderPathFromMetadata(next.metadata);
    }
    if (hasOwn(patch, "catalog_index") || hasOwn(patch, "catalogIndex")) {
        next.catalogIndex = asText(patch.catalog_index ?? patch.catalogIndex);
    } else if (hasOwn(patch, "metadata")) {
        next.catalogIndex = readCatalogIndexFromMetadata(next.metadata);
    }
    if (hasOwn(patch, "tags")) next.tags = normalizeTags(extractTags(patch.tags));
    if (hasOwn(patch, "traits")) next.traits = toBestiaryBlocks(patch.traits);
    if (hasOwn(patch, "actions")) next.actions = toBestiaryBlocks(patch.actions);
    if (hasOwn(patch, "bonus_actions")) next.bonusActions = toBestiaryBlocks(patch.bonus_actions);
    if (hasOwn(patch, "reactions")) next.reactions = toBestiaryBlocks(patch.reactions);
    if (hasOwn(patch, "legendary_actions")) {
        next.legendaryActions = toBestiaryBlocks(patch.legendary_actions);
    }
    if (hasOwn(patch, "lair_actions")) next.lairActions = toBestiaryBlocks(patch.lair_actions);
    return next;
}

function campaignEntryToCreatureSheetData(entry: CampaignEntry, locale: string): CreatureSheetData {
    return {
        name: entry.name || (locale === "en" ? "New creature" : "Nueva criatura"),
        subtitle: [entry.creatureSize, entry.creatureType, entry.alignment]
            .filter(Boolean)
            .join(" - "),
        sourceLabel: sourceLabel(entry.sourceType, locale),
        imageUrl: entry.imageUrl,
        isPlayerVisible: entry.isPlayerVisible,
        creatureSize: entry.creatureSize || null,
        creatureType: entry.creatureType || null,
        alignment: entry.alignment || null,
        challengeRating: entry.challengeRating,
        xp: entry.xp,
        armorClass: entry.armorClass,
        hitPoints: entry.hitPoints,
        hitDice: entry.hitDice || null,
        proficiencyBonus: entry.proficiencyBonus,
        abilityScores: entry.abilityScores,
        speed: entry.speed,
        savingThrows: entry.savingThrows,
        skills: entry.skills,
        senses: entry.senses,
        languages: entry.languages || null,
        flavor: entry.flavor || null,
        notes: entry.notes || null,
        tags: entry.tags,
        traits: entry.traits,
        actions: entry.actions,
        bonusActions: entry.bonusActions,
        reactions: entry.reactions,
        legendaryActions: entry.legendaryActions,
        lairActions: entry.lairActions,
    };
}

export default function BestiaryManagerPanel({
    campaignId,
    locale,
    refreshNonce = 0,
    focusEntryId = null,
    pendingProposal = null,
    proposalBusy = false,
    onConfirmPendingProposal,
    onRejectPendingProposal,
    onSelectedEntryChange,
}: BestiaryManagerPanelProps) {
    const t = (es: string, en: string) => tr(locale, es, en);
    const localeCode = locale === "en" ? "en" : "es";

    const [viewMode, setViewMode] = useState<ViewMode>("campaign");
    const [entries, setEntries] = useState<CampaignEntry[]>([]);
    const [loadingEntries, setLoadingEntries] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectionPulse, setSelectionPulse] = useState(0);
    const [creating, setCreating] = useState(false);
    const [campaignPanelMode, setCampaignPanelMode] = useState<"view" | "edit">("view");
    const [draft, setDraft] = useState<Draft | null>(null);
    const [pendingImage, setPendingImage] = useState<File | null>(null);
    const [collapsedFolderState, setCollapsedFolderState] = useState<Record<string, boolean>>({});
    const [manualFolders, setManualFolders] = useState<string[]>([]);
    const [folderOrderByParent, setFolderOrderByParent] = useState<Record<string, string[]>>({});
    const [newFolderInput, setNewFolderInput] = useState("");
    const [editingFolderPath, setEditingFolderPath] = useState<string | null>(null);
    const [editingFolderName, setEditingFolderName] = useState("");
    const [draggingEntryId, setDraggingEntryId] = useState<string | null>(null);
    const [draggingFolderPath, setDraggingFolderPath] = useState<string | null>(null);
    const [dragOverFolderKey, setDragOverFolderKey] = useState<string | null>(null);
    const [dragOverEntryPlacement, setDragOverEntryPlacement] = useState<{
        entryId: string;
        position: "before" | "after";
    } | null>(null);
    const [dragOverFolderPlacement, setDragOverFolderPlacement] = useState<{
        folderPath: string;
        position: "before" | "inside" | "after";
    } | null>(null);

    const [commonQuery, setCommonQuery] = useState("");
    const [commonList, setCommonList] = useState<CommonSummary[]>([]);
    const [commonLoading, setCommonLoading] = useState(false);
    const [commonSelectedId, setCommonSelectedId] = useState<string | null>(null);
    const [commonDetail, setCommonDetail] = useState<CommonDetail | null>(null);
    const [commonDetailLoading, setCommonDetailLoading] = useState(false);
    const [commonSort, setCommonSort] = useState<CommonSort>("name_asc");
    const [commonTypeFilter, setCommonTypeFilter] = useState("all");
    const [commonSizeFilter, setCommonSizeFilter] = useState("all");
    const [commonAlignmentFilter, setCommonAlignmentFilter] = useState("all");
    const [commonCrBand, setCommonCrBand] = useState<CommonCrBand>("all");

    const [saving, setSaving] = useState(false);
    const [imageBusy, setImageBusy] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const commonTypeOptions = useMemo(
        () =>
            Array.from(
                new Set(
                    commonList
                        .map((entry) => entry.type.trim())
                        .filter(Boolean)
                )
            ).sort((a, b) => a.localeCompare(b)),
        [commonList]
    );

    const commonSizeOptions = useMemo(
        () =>
            Array.from(
                new Set(
                    commonList
                        .map((entry) => entry.size.trim())
                        .filter(Boolean)
                )
            ).sort((a, b) => a.localeCompare(b)),
        [commonList]
    );

    const commonAlignmentOptions = useMemo(
        () =>
            Array.from(
                new Set(
                    commonList
                        .map((entry) => entry.alignment.trim())
                        .filter(Boolean)
                )
            ).sort((a, b) => a.localeCompare(b)),
        [commonList]
    );

    const commonFilteredList = useMemo(() => {
        function matchesCrBand(cr: number | null, band: CommonCrBand) {
            if (band === "all") return true;
            if (cr == null) return false;
            if (band === "0-1") return cr <= 1;
            if (band === "2-4") return cr >= 2 && cr <= 4;
            if (band === "5-10") return cr >= 5 && cr <= 10;
            return cr >= 11;
        }

        const filtered = commonList.filter((entry) => {
            if (commonTypeFilter !== "all" && entry.type !== commonTypeFilter) return false;
            if (commonSizeFilter !== "all" && entry.size !== commonSizeFilter) return false;
            if (commonAlignmentFilter !== "all" && entry.alignment !== commonAlignmentFilter) return false;
            if (!matchesCrBand(entry.challenge_rating, commonCrBand)) return false;
            return true;
        });

        const sorted = [...filtered];
        sorted.sort((a, b) => {
            if (commonSort === "name_asc") return a.name.localeCompare(b.name);
            if (commonSort === "name_desc") return b.name.localeCompare(a.name);
            if (commonSort === "cr_asc") {
                const av = a.challenge_rating ?? Number.POSITIVE_INFINITY;
                const bv = b.challenge_rating ?? Number.POSITIVE_INFINITY;
                if (av !== bv) return av - bv;
                return a.name.localeCompare(b.name);
            }
            if (commonSort === "cr_desc") {
                const av = a.challenge_rating ?? Number.NEGATIVE_INFINITY;
                const bv = b.challenge_rating ?? Number.NEGATIVE_INFINITY;
                if (av !== bv) return bv - av;
                return a.name.localeCompare(b.name);
            }
            if (a.type !== b.type) return a.type.localeCompare(b.type);
            return a.name.localeCompare(b.name);
        });

        return sorted;
    }, [commonAlignmentFilter, commonCrBand, commonList, commonSizeFilter, commonSort, commonTypeFilter]);

    async function loadEntries() {
        setLoadingEntries(true);
        const { data, error: queryError } = await supabase
            .from("campaign_bestiary_entries")
            .select("*")
            .eq("campaign_id", campaignId)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true });

        if (queryError) {
            setEntries([]);
            setError(queryError.message || t("No se pudo cargar el bestiario.", "Could not load bestiary."));
            setLoadingEntries(false);
            return;
        }

        const nextEntries = (data ?? [])
            .map((row) => toEntry(asRecord(row)))
            .filter((entry) => entry.id)
            .sort(compareEntries);

        setEntries(nextEntries);
        setSelectedId((prev) => (prev && nextEntries.some((entry) => entry.id === prev) ? prev : (nextEntries[0]?.id ?? null)));
        setLoadingEntries(false);
    }

    useEffect(() => {
        void loadEntries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId, refreshNonce]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = window.localStorage.getItem(manualBestiaryFoldersStorageKey(campaignId));
            if (!raw) {
                setManualFolders([]);
                return;
            }
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                setManualFolders([]);
                return;
            }
            setManualFolders(
                Array.from(
                    new Set(
                        parsed
                            .map((value) => normalizeFolderPath(asText(value)))
                            .filter(Boolean)
                    )
                )
            );
        } catch {
            setManualFolders([]);
        }
    }, [campaignId]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const payload = JSON.stringify(
            Array.from(new Set(manualFolders.map((value) => normalizeFolderPath(value)).filter(Boolean)))
        );
        window.localStorage.setItem(manualBestiaryFoldersStorageKey(campaignId), payload);
    }, [campaignId, manualFolders]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = window.localStorage.getItem(manualBestiaryFolderOrderStorageKey(campaignId));
            if (!raw) {
                setFolderOrderByParent({});
                return;
            }
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                setFolderOrderByParent({});
                return;
            }
            const next: Record<string, string[]> = {};
            for (const [rawParent, rawChildren] of Object.entries(parsed as Record<string, unknown>)) {
                if (!Array.isArray(rawChildren)) continue;
                const parent = normalizeFolderPath(rawParent);
                next[parent] = Array.from(
                    new Set(rawChildren.map((value) => normalizeFolderPath(asText(value))).filter(Boolean))
                );
            }
            setFolderOrderByParent(next);
        } catch {
            setFolderOrderByParent({});
        }
    }, [campaignId]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const normalized: Record<string, string[]> = {};
        for (const [rawParent, rawChildren] of Object.entries(folderOrderByParent)) {
            const parent = normalizeFolderPath(rawParent);
            const children = Array.from(
                new Set(rawChildren.map((value) => normalizeFolderPath(value)).filter(Boolean))
            );
            if (children.length > 0) normalized[parent] = children;
        }
        window.localStorage.setItem(
            manualBestiaryFolderOrderStorageKey(campaignId),
            JSON.stringify(normalized)
        );
    }, [campaignId, folderOrderByParent]);

    useEffect(() => {
        if (creating) return;
        if (!selectedId) {
            setDraft(null);
            setPendingImage(null);
            return;
        }

        const found = entries.find((entry) => entry.id === selectedId) ?? null;
        setDraft(found ? entryToDraft(found) : null);
        setPendingImage(null);
    }, [creating, entries, selectedId]);

    useEffect(() => {
        if (!focusEntryId) return;
        if (!entries.some((entry) => entry.id === focusEntryId)) return;
        setSelectionPulse((value) => value + 1);
        setSelectedId(focusEntryId);
    }, [entries, focusEntryId]);

    useEffect(() => {
        if (!onSelectedEntryChange) return;
        if (!selectedId) {
            onSelectedEntryChange(null);
            return;
        }
        const selectedEntry = entries.find((entry) => entry.id === selectedId) ?? null;
        if (!selectedEntry) {
            onSelectedEntryChange(null);
            return;
        }
        onSelectedEntryChange({
            id: selectedEntry.id,
            name: selectedEntry.name,
        });
    }, [entries, onSelectedEntryChange, selectedId]);

    useEffect(() => {
        if (viewMode !== "common") return;

        let cancelled = false;
        const timeoutId = window.setTimeout(async () => {
            setCommonLoading(true);
            const response = await fetch(
                `/api/dnd/monsters?locale=${localeCode}&name=${encodeURIComponent(commonQuery)}&limit=400`
            );
            const payload = (await response.json().catch(() => null)) as { results?: unknown; error?: unknown } | null;

            if (!response.ok) {
                if (!cancelled) {
                    setError(
                        asText(payload?.error)
                        || t("No se pudo cargar el bestiario comun.", "Could not load common bestiary.")
                    );
                    setCommonLoading(false);
                }
                return;
            }

            const nextList = (Array.isArray(payload?.results) ? payload.results : [])
                .map((row) => {
                    const record = asRecord(row);
                    const index = asText(record.index);
                    const name = asText(record.name);
                    if (!index || !name) return null;
                    return {
                        index,
                        name,
                        type: asText(record.type),
                        challenge_rating: asNum(record.challenge_rating),
                        size: asText(record.size),
                        alignment: asText(record.alignment),
                    } satisfies CommonSummary;
                })
                .filter((row): row is CommonSummary => Boolean(row));

            if (!cancelled) {
                setCommonList(nextList);
                setCommonLoading(false);
            }
        }, 260);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [commonQuery, localeCode, viewMode]);

    useEffect(() => {
        setCommonSelectedId((prev) =>
            prev && commonFilteredList.some((entry) => entry.index === prev)
                ? prev
                : (commonFilteredList[0]?.index ?? null)
        );
    }, [commonFilteredList]);

    useEffect(() => {
        const selectedMonsterId = commonSelectedId;
        if (!selectedMonsterId) {
            setCommonDetail(null);
            return;
        }
        const monsterId = String(selectedMonsterId);

        let cancelled = false;

        async function run() {
            setCommonDetailLoading(true);
            const response = await fetch(
                `/api/dnd/monsters/${encodeURIComponent(monsterId)}?locale=${localeCode}`
            );
            const payload = (await response.json().catch(() => null)) as (Record<string, unknown> & { error?: unknown }) | null;

            if (!response.ok) {
                if (!cancelled) {
                    setError(asText(payload?.error) || t("No se pudo cargar criatura.", "Could not load creature."));
                    setCommonDetail(null);
                    setCommonDetailLoading(false);
                }
                return;
            }

            if (!cancelled) {
                setCommonDetail((payload ?? {}) as CommonDetail);
                setCommonDetailLoading(false);
            }
        }

        void run();
        return () => {
            cancelled = true;
        };
    }, [commonSelectedId, localeCode]);

    function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
        setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    }

    function updateAbility(ability: AbilityKey, value: string) {
        const parsed = Number(value);
        const score = Number.isFinite(parsed) ? Math.max(1, Math.min(30, Math.round(parsed))) : 10;
        setDraft((prev) =>
            prev
                ? {
                    ...prev,
                    abilityScores: { ...prev.abilityScores, [ability]: score },
                }
                : prev
        );
    }

    function updateLooseRecordField(field: "speed" | "senses", value: string) {
        updateDraft(field, parseLooseRecordFromEditorText(value));
    }

    function updateBestiaryBlocksField(
        field:
            | "traits"
            | "actions"
            | "bonusActions"
            | "reactions"
            | "legendaryActions"
            | "lairActions",
        value: string
    ) {
        updateDraft(field, parseBestiaryBlocksFromEditorText(value));
    }

    function startCreate() {
        const nextSort = entries.reduce((max, entry) => Math.max(max, entry.sortOrder), 0) + 1;
        const defaultFolderPath = selectedId
            ? entries.find((entry) => entry.id === selectedId)?.folderPath ?? ""
            : "";
        setCreating(true);
        setCampaignPanelMode("edit");
        setSelectedId(null);
        setPendingImage(null);
        setDraft(emptyDraft(nextSort, defaultFolderPath));
        setError(null);
        setNotice(null);
    }

    function createManualFolder() {
        const normalized = normalizeFolderPath(newFolderInput);
        if (!normalized) {
            setError(
                t(
                    "Indica una carpeta valida (ejemplo: Jefes/Cueva).",
                    "Provide a valid folder path (example: Bosses/Cavern)."
                )
            );
            return;
        }

        const alreadyExists =
            manualFolders.some((value) => normalizeFolderPath(value) === normalized)
            || entries.some((entry) => normalizeFolderPath(entry.folderPath) === normalized);
        if (alreadyExists) {
            setNotice(t("La carpeta ya existe.", "Folder already exists."));
            setNewFolderInput("");
            return;
        }

        setManualFolders((prev) => [...prev, normalized]);
        setCollapsedFolderState((prev) => {
            const next = { ...prev };
            const segments = normalized.split("/");
            let currentPath = "";
            let changed = false;
            for (const segment of segments) {
                currentPath = currentPath ? `${currentPath}/${segment}` : segment;
                const key = `folder:${currentPath}`;
                if (next[key]) {
                    delete next[key];
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
        setNewFolderInput("");
        setError(null);
        setNotice(t("Carpeta creada.", "Folder created."));
    }

    function applyMetadataFolderPath(metadata: Record<string, unknown>, folderPath: string): Record<string, unknown> {
        const next = { ...metadata };
        const normalizedFolder = normalizeFolderPath(folderPath);
        if (normalizedFolder) {
            next.folder_path = normalizedFolder;
        } else {
            delete next.folder_path;
            delete next.folderPath;
            delete next.folder;
            delete next.bestiary_folder;
            delete next.bestiaryFolder;
        }
        return next;
    }

    function remapFolderOrderByPrefix(
        sourceMap: Record<string, string[]>,
        oldPrefix: string,
        newPrefix: string
    ): Record<string, string[]> {
        const next: Record<string, string[]> = {};

        const pushChild = (parentPath: string, childPath: string) => {
            const parent = normalizeFolderPath(parentPath);
            const child = normalizeFolderPath(childPath);
            if (!parent && !child.includes("/")) {
                const existing = next[parent] ?? [];
                if (!existing.includes(child)) {
                    next[parent] = [...existing, child];
                }
                return;
            }
            if (!isDirectChildFolderPath(child, parent)) return;
            const existing = next[parent] ?? [];
            if (!existing.includes(child)) {
                next[parent] = [...existing, child];
            }
        };

        for (const [rawParent, rawChildren] of Object.entries(sourceMap)) {
            const mappedParent = replaceFolderPrefix(rawParent, oldPrefix, newPrefix);
            for (const rawChild of rawChildren) {
                const mappedChild = replaceFolderPrefix(rawChild, oldPrefix, newPrefix);
                if (!mappedChild) continue;
                pushChild(mappedParent, mappedChild);
            }
        }

        return next;
    }

    async function applyFolderPrefixReplacement(
        oldPrefix: string,
        newPrefix: string,
        successMessage: string
    ): Promise<boolean> {
        const oldPath = normalizeFolderPath(oldPrefix);
        const nextPath = normalizeFolderPath(newPrefix);
        if (!oldPath || oldPath === nextPath) return true;

        const previousEntries = entries;
        const previousManualFolders = manualFolders;
        const previousOrderByParent = folderOrderByParent;
        const previousEditingFolderPath = editingFolderPath;

        const changedEntries: Array<{ id: string; metadata: Record<string, unknown>; folderPath: string }> = [];
        const optimisticEntries = entries
            .map((entry) => {
                const currentPath = normalizeFolderPath(entry.folderPath);
                const mappedPath = replaceFolderPrefix(currentPath, oldPath, nextPath);
                if (mappedPath === currentPath) return entry;
                const metadata = applyMetadataFolderPath(entry.metadata, mappedPath);
                changedEntries.push({
                    id: entry.id,
                    metadata,
                    folderPath: mappedPath,
                });
                return {
                    ...entry,
                    folderPath: mappedPath,
                    metadata,
                };
            })
            .sort(compareEntries);

        const optimisticManualFolders = Array.from(
            new Set(
                manualFolders
                    .map((path) => replaceFolderPrefix(path, oldPath, nextPath))
                    .map((path) => normalizeFolderPath(path))
                    .filter(Boolean)
            )
        );
        const optimisticFolderOrder = remapFolderOrderByPrefix(folderOrderByParent, oldPath, nextPath);

        setEntries(optimisticEntries);
        setManualFolders(optimisticManualFolders);
        setFolderOrderByParent(optimisticFolderOrder);
        if (editingFolderPath && isSameOrDescendantFolderPath(editingFolderPath, oldPath)) {
            setEditingFolderPath(replaceFolderPrefix(editingFolderPath, oldPath, nextPath) || null);
        }

        if (selectedId) {
            const selected = optimisticEntries.find((entry) => entry.id === selectedId) ?? null;
            setDraft(selected ? entryToDraft(selected) : null);
        }

        try {
            await Promise.all(
                changedEntries.map((entry) =>
                    supabase
                        .from("campaign_bestiary_entries")
                        .update({
                            metadata: Object.keys(entry.metadata).length > 0 ? entry.metadata : {},
                        })
                        .eq("id", entry.id)
                        .eq("campaign_id", campaignId)
                )
            );
            setNotice(successMessage);
            return true;
        } catch (updateError: unknown) {
            setEntries(previousEntries);
            setManualFolders(previousManualFolders);
            setFolderOrderByParent(previousOrderByParent);
            setEditingFolderPath(previousEditingFolderPath);
            if (selectedId) {
                const previousSelected = previousEntries.find((entry) => entry.id === selectedId) ?? null;
                setDraft(previousSelected ? entryToDraft(previousSelected) : null);
            }
            setError(
                updateError instanceof Error
                    ? updateError.message
                    : t("No se pudo actualizar carpetas.", "Could not update folders.")
            );
            return false;
        }
    }

    async function renameFolderPath(oldPathRaw: string, nextFolderNameRaw: string) {
        const oldPath = normalizeFolderPath(oldPathRaw);
        const nextName = normalizeFolderPath(nextFolderNameRaw);
        if (!oldPath) return;
        if (!nextName) {
            setError(t("El nombre no puede estar vacio.", "Folder name cannot be empty."));
            return;
        }
        if (nextName.includes("/")) {
            setError(
                t(
                    "Solo puedes renombrar el nombre de la carpeta, no la ruta completa.",
                    "Rename only the folder name, not the full path."
                )
            );
            return;
        }

        const parent = folderParentPath(oldPath);
        const renamedPath = normalizeFolderPath(parent ? `${parent}/${nextName}` : nextName);
        if (!renamedPath || renamedPath === oldPath) {
            setEditingFolderPath(null);
            return;
        }
        if (isSameOrDescendantFolderPath(renamedPath, oldPath)) {
            setError(
                t(
                    "No puedes mover una carpeta dentro de si misma.",
                    "Cannot move a folder inside itself."
                )
            );
            return;
        }

        const renamed = await applyFolderPrefixReplacement(
            oldPath,
            renamedPath,
            t("Carpeta renombrada.", "Folder renamed.")
        );
        if (renamed) {
            setEditingFolderPath(null);
            setEditingFolderName("");
        }
    }

    async function deleteFolderPath(folderPathRaw: string) {
        const folderPath = normalizeFolderPath(folderPathRaw);
        if (!folderPath) return;
        if (
            !window.confirm(
                t(
                    "Se eliminara esta carpeta. Las criaturas y subcarpetas se moveran al nivel superior. Continuar?",
                    "This folder will be removed. Creatures and subfolders will move up one level. Continue?"
                )
            )
        ) {
            return;
        }

        const parent = folderParentPath(folderPath);
        const nextManualFolders = Array.from(
            new Set(
                manualFolders
                    .map((path) => {
                        const normalized = normalizeFolderPath(path);
                        if (normalized === folderPath) return "";
                        return replaceFolderPrefix(normalized, folderPath, parent);
                    })
                    .map((path) => normalizeFolderPath(path))
                    .filter(Boolean)
            )
        );

        const deleted = await applyFolderPrefixReplacement(
            folderPath,
            parent,
            t("Carpeta eliminada.", "Folder deleted.")
        );
        if (deleted) {
            setManualFolders(nextManualFolders);
        }

        if (editingFolderPath && isSameOrDescendantFolderPath(editingFolderPath, folderPath)) {
            setEditingFolderPath(null);
            setEditingFolderName("");
        }
    }

    async function moveEntryToFolder(entryId: string, folderPath: string) {
        const targetEntry = entries.find((entry) => entry.id === entryId);
        if (!targetEntry) return;

        const normalizedFolderPath = normalizeFolderPath(folderPath);
        if (normalizeFolderPath(targetEntry.folderPath) === normalizedFolderPath) return;

        const previousEntries = entries;
        const nextMetadata = { ...targetEntry.metadata };
        if (normalizedFolderPath) {
            nextMetadata.folder_path = normalizedFolderPath;
        } else {
            delete nextMetadata.folder_path;
            delete nextMetadata.folderPath;
            delete nextMetadata.folder;
            delete nextMetadata.bestiary_folder;
            delete nextMetadata.bestiaryFolder;
        }

        setEntries((prev) =>
            prev
                .map((entry) =>
                    entry.id === entryId
                        ? {
                            ...entry,
                            folderPath: normalizedFolderPath,
                            metadata: nextMetadata,
                        }
                        : entry
                )
                .sort(compareEntries)
        );
        if (selectedId === entryId) {
            setDraft((prev) =>
                prev
                    ? {
                        ...prev,
                        folderPath: normalizedFolderPath,
                        metadata: nextMetadata,
                    }
                    : prev
            );
        }
        setDragOverFolderKey(null);
        setDraggingEntryId(null);

        try {
            const { data, error: updateError } = await supabase
                .from("campaign_bestiary_entries")
                .update({
                    metadata: Object.keys(nextMetadata).length > 0 ? nextMetadata : {},
                })
                .eq("id", entryId)
                .eq("campaign_id", campaignId)
                .select("*")
                .maybeSingle();

            if (updateError) throw new Error(updateError.message);
            const savedEntry = toEntry(asRecord(data));
            setEntries((prev) =>
                prev
                    .map((entry) => (entry.id === entryId ? savedEntry : entry))
                    .sort(compareEntries)
            );
            if (selectedId === entryId) {
                setDraft(entryToDraft(savedEntry));
            }
            setNotice(
                normalizedFolderPath
                    ? t("Criatura movida de carpeta.", "Creature moved to folder.")
                    : t("Criatura sin carpeta.", "Creature moved out of folder.")
            );
        } catch (moveError: unknown) {
            setEntries(previousEntries);
            if (selectedId === entryId) {
                const previous = previousEntries.find((entry) => entry.id === entryId) ?? null;
                setDraft(previous ? entryToDraft(previous) : null);
            }
            setError(
                moveError instanceof Error
                    ? moveError.message
                    : t("No se pudo mover la criatura.", "Could not move creature.")
            );
        }
    }

    async function reorderEntriesByDrop(
        draggedEntryId: string,
        targetEntryId: string,
        position: "before" | "after"
    ) {
        if (draggedEntryId === targetEntryId) return;

        const draggedEntry = entries.find((entry) => entry.id === draggedEntryId);
        const targetEntry = entries.find((entry) => entry.id === targetEntryId);
        if (!draggedEntry || !targetEntry) return;

        const previousEntries = entries;
        const targetFolderPath = normalizeFolderPath(targetEntry.folderPath);
        const folderChanged = normalizeFolderPath(draggedEntry.folderPath) !== targetFolderPath;
        const draggedMetadata = { ...draggedEntry.metadata };
        if (folderChanged) {
            if (targetFolderPath) {
                draggedMetadata.folder_path = targetFolderPath;
            } else {
                delete draggedMetadata.folder_path;
                delete draggedMetadata.folderPath;
                delete draggedMetadata.folder;
                delete draggedMetadata.bestiary_folder;
                delete draggedMetadata.bestiaryFolder;
            }
        }

        const ordered = [...entries].sort(compareEntries);
        const withoutDragged = ordered.filter((entry) => entry.id !== draggedEntryId);
        const targetIndex = withoutDragged.findIndex((entry) => entry.id === targetEntryId);
        if (targetIndex < 0) return;

        const insertIndex = position === "after" ? targetIndex + 1 : targetIndex;
        const movedDraggedEntry: CampaignEntry = folderChanged
            ? {
                ...draggedEntry,
                folderPath: targetFolderPath,
                metadata: draggedMetadata,
            }
            : draggedEntry;

        withoutDragged.splice(insertIndex, 0, movedDraggedEntry);
        const nextEntries = withoutDragged.map((entry, index) => ({
            ...entry,
            sortOrder: (index + 1) * 10,
        }));

        setEntries(nextEntries);
        setDragOverEntryPlacement(null);
        setDragOverFolderKey(null);
        setDraggingEntryId(null);

        if (selectedId) {
            const selectedEntry = nextEntries.find((entry) => entry.id === selectedId) ?? null;
            setDraft(selectedEntry ? entryToDraft(selectedEntry) : null);
        }

        try {
            const updateJobs = nextEntries.map((entry) => {
                const payload: Record<string, unknown> = {
                    sort_order: entry.sortOrder,
                };
                if (entry.id === draggedEntryId && folderChanged) {
                    payload.metadata =
                        Object.keys(entry.metadata).length > 0 ? entry.metadata : {};
                }
                return supabase
                    .from("campaign_bestiary_entries")
                    .update(payload)
                    .eq("id", entry.id)
                    .eq("campaign_id", campaignId);
            });

            const results = await Promise.all(updateJobs);
            const failed = results.find((result) => result.error);
            if (failed?.error) {
                throw new Error(failed.error.message);
            }

            setNotice(
                folderChanged
                    ? t("Orden y carpeta actualizados.", "Order and folder updated.")
                    : t("Orden actualizado.", "Order updated.")
            );
        } catch (reorderError: unknown) {
            setEntries(previousEntries);
            if (selectedId) {
                const previousSelected = previousEntries.find((entry) => entry.id === selectedId) ?? null;
                setDraft(previousSelected ? entryToDraft(previousSelected) : null);
            }
            setError(
                reorderError instanceof Error
                    ? reorderError.message
                    : t("No se pudo actualizar el orden.", "Could not update order.")
            );
        }
    }

    async function moveFolderByDrop(
        sourceFolderPathRaw: string,
        targetFolderPathRaw: string,
        position: "before" | "inside" | "after"
    ) {
        const sourceFolderPath = normalizeFolderPath(sourceFolderPathRaw);
        const targetFolderPath = normalizeFolderPath(targetFolderPathRaw);
        if (!sourceFolderPath) return;
        if (position !== "inside" && !targetFolderPath) return;
        if (sourceFolderPath === targetFolderPath) return;
        if (targetFolderPath && isSameOrDescendantFolderPath(targetFolderPath, sourceFolderPath)) {
            setError(
                t(
                    "No puedes mover una carpeta dentro de si misma.",
                    "Cannot move a folder inside itself."
                )
            );
            return;
        }

        const sourceName = folderBaseName(sourceFolderPath);
        const destinationParent =
            position === "inside" ? targetFolderPath : folderParentPath(targetFolderPath);
        if (
            destinationParent
            && isSameOrDescendantFolderPath(destinationParent, sourceFolderPath)
        ) {
            setError(
                t(
                    "No puedes mover una carpeta dentro de si misma.",
                    "Cannot move a folder inside itself."
                )
            );
            return;
        }

        const destinationPath = normalizeFolderPath(
            destinationParent ? `${destinationParent}/${sourceName}` : sourceName
        );
        let finalSourcePath = sourceFolderPath;
        if (destinationPath && destinationPath !== sourceFolderPath) {
            const renamed = await applyFolderPrefixReplacement(
                sourceFolderPath,
                destinationPath,
                t("Carpeta movida.", "Folder moved.")
            );
            if (!renamed) return;
            finalSourcePath = destinationPath;
        }

        const folderPathsAfterMove = Array.from(
            new Set(
                campaignFolderPaths
                    .map((path) => replaceFolderPrefix(path, sourceFolderPath, finalSourcePath))
                    .concat(finalSourcePath)
                    .map((path) => normalizeFolderPath(path))
                    .filter(Boolean)
            )
        );

        setFolderOrderByParent((prev) => {
            const next = { ...prev };
            const sourceParent = folderParentPath(finalSourcePath);
            const targetParent =
                position === "inside" ? targetFolderPath : folderParentPath(targetFolderPath);

            const sourceParentOrder = Array.isArray(next[sourceParent]) ? next[sourceParent] : [];
            const cleanedSourceParentOrder = sourceParentOrder.filter(
                (path) => normalizeFolderPath(path) !== finalSourcePath
            );
            if (cleanedSourceParentOrder.length > 0) {
                next[sourceParent] = cleanedSourceParentOrder;
            } else {
                delete next[sourceParent];
            }

            const siblingPaths = folderPathsAfterMove.filter((path) =>
                isDirectChildFolderPath(path, targetParent)
            );
            const baseOrder = Array.isArray(next[targetParent]) ? next[targetParent] : [];
            const ordered = Array.from(
                new Set(
                    baseOrder
                        .map((value) => normalizeFolderPath(value))
                        .filter((value) => siblingPaths.includes(value))
                )
            );

            if (!ordered.includes(finalSourcePath)) {
                ordered.push(finalSourcePath);
            }

            if (position === "inside") {
                const withoutSource = ordered.filter((value) => value !== finalSourcePath);
                next[targetParent] = [...withoutSource, finalSourcePath];
                return next;
            }

            const targetPath = normalizeFolderPath(targetFolderPath);
            const withoutSource = ordered.filter((value) => value !== finalSourcePath);
            const targetIndex = withoutSource.indexOf(targetPath);
            if (targetIndex < 0) {
                next[targetParent] = [...withoutSource, finalSourcePath];
                return next;
            }
            const insertIndex = position === "after" ? targetIndex + 1 : targetIndex;
            withoutSource.splice(insertIndex, 0, finalSourcePath);
            next[targetParent] = withoutSource;
            return next;
        });

        setDraggingFolderPath(null);
        setDragOverFolderPlacement(null);
        setDragOverFolderKey(null);
        if (destinationPath === sourceFolderPath) {
            setNotice(t("Orden de carpetas actualizado.", "Folder order updated."));
        }
    }

    async function saveDraft() {
        if (!draft) return;
        if (!draft.name.trim()) {
            setError(t("La criatura necesita nombre.", "Creature requires a name."));
            return;
        }

        setSaving(true);
        setError(null);

        try {
            let savedEntry: CampaignEntry | null = null;
            const payload = toPayload(draft, campaignId, true);

            if (draft.id) {
                let result = await supabase
                    .from("campaign_bestiary_entries")
                    .update(payload)
                    .eq("id", draft.id)
                    .eq("campaign_id", campaignId)
                    .select("*")
                    .maybeSingle();

                if (result.error && visibilityError(result.error)) {
                    result = await supabase
                        .from("campaign_bestiary_entries")
                        .update(toPayload(draft, campaignId, false))
                        .eq("id", draft.id)
                        .eq("campaign_id", campaignId)
                        .select("*")
                        .maybeSingle();
                }

                if (result.error) throw new Error(result.error.message);
                savedEntry = toEntry(asRecord(result.data));
            } else {
                let result = await supabase
                    .from("campaign_bestiary_entries")
                    .insert(payload)
                    .select("*")
                    .single();

                if (result.error && visibilityError(result.error)) {
                    result = await supabase
                        .from("campaign_bestiary_entries")
                        .insert(toPayload(draft, campaignId, false))
                        .select("*")
                        .single();
                }

                if (result.error) throw new Error(result.error.message);
                savedEntry = toEntry(asRecord(result.data));
            }

            if (!savedEntry || !savedEntry.id) {
                throw new Error(t("No se pudo guardar.", "Could not save."));
            }

            if (pendingImage) {
                const imageUrl = await uploadImage(campaignId, savedEntry.id, pendingImage);
                savedEntry = { ...savedEntry, imageUrl };
                setPendingImage(null);
            }

            setEntries((prev) => {
                const exists = prev.some((entry) => entry.id === savedEntry.id);
                const next = exists
                    ? prev.map((entry) => (entry.id === savedEntry.id ? savedEntry : entry))
                    : [...prev, savedEntry];
                return next.sort(compareEntries);
            });

            setDraft(entryToDraft(savedEntry));
            setCreating(false);
            setCampaignPanelMode("view");
            setSelectedId(savedEntry.id);
            setNotice(t("Criatura guardada.", "Creature saved."));
        } catch (saveError: unknown) {
            setError(saveError instanceof Error ? saveError.message : t("No se pudo guardar.", "Could not save."));
        } finally {
            setSaving(false);
        }
    }

    async function deleteDraft() {
        if (!draft) return;
        if (!draft.id) {
            setDraft(null);
            setCreating(false);
            setCampaignPanelMode("view");
            setPendingImage(null);
            return;
        }

        if (!window.confirm(t("Se eliminara la criatura. Continuar?", "Creature will be deleted. Continue?"))) {
            return;
        }

        setSaving(true);
        try {
            const { error: deleteError } = await supabase
                .from("campaign_bestiary_entries")
                .delete()
                .eq("id", draft.id)
                .eq("campaign_id", campaignId);

            if (deleteError) throw new Error(deleteError.message);

            const nextEntries = entries.filter((entry) => entry.id !== draft.id).sort(compareEntries);
            const nextId = nextEntries[0]?.id ?? null;

            setEntries(nextEntries);
            setSelectedId(nextId);
            setDraft(nextId ? entryToDraft(nextEntries[0]) : null);
            setCreating(false);
            setCampaignPanelMode("view");
            setPendingImage(null);
            setNotice(t("Criatura eliminada.", "Creature deleted."));
        } catch (deleteError: unknown) {
            setError(deleteError instanceof Error ? deleteError.message : t("No se pudo eliminar.", "Could not delete."));
        } finally {
            setSaving(false);
        }
    }

    async function importCommon() {
        if (!commonDetail) return;
        const index = asText(commonDetail.index);
        if (!index) return;
        const commonProficiencies = parseCommonProficiencies(commonDetail.proficiencies);

        const existing = entries.find((entry) => entry.sourceType === "SRD" && entry.sourceIndex === index);
        if (existing) {
            setViewMode("campaign");
            setSelectedId(existing.id);
            setCreating(false);
            setCampaignPanelMode("view");
            setNotice(t("Ya estaba importada. Abriendo ficha.", "Already imported. Opening sheet."));
            return;
        }

        setImporting(true);
        try {
            const payload: Record<string, unknown> = {
                campaign_id: campaignId,
                name: asText(commonDetail.name) || asText(commonDetail.localized_name) || index,
                source_type: "SRD",
                source_index: index,
                source_name: "dnd5eapi",
                entry_kind: DEFAULT_ENTRY_KIND,
                creature_type: asText(commonDetail.type) || null,
                creature_size: asText(commonDetail.size) || null,
                alignment: asText(commonDetail.alignment) || null,
                challenge_rating: asNum(commonDetail.challenge_rating),
                xp: asInt(commonDetail.xp),
                armor_class: Array.isArray(commonDetail.armor_class)
                    ? asInt(asRecord(commonDetail.armor_class[0]).value)
                    : asInt(asRecord(commonDetail.armor_class).value),
                hit_points: asInt(commonDetail.hit_points),
                hit_dice: asText(commonDetail.hit_dice) || null,
                proficiency_bonus: asInt(commonDetail.proficiency_bonus),
                ability_scores: normalizeAbilityScores({
                    STR: commonDetail.strength,
                    DEX: commonDetail.dexterity,
                    CON: commonDetail.constitution,
                    INT: commonDetail.intelligence,
                    WIS: commonDetail.wisdom,
                    CHA: commonDetail.charisma,
                }),
                speed: toLooseRecord(commonDetail.speed),
                saving_throws: commonProficiencies.savingThrows,
                skills: commonProficiencies.skills,
                senses: toLooseRecord(commonDetail.senses),
                languages: asText(commonDetail.languages) || null,
                metadata: {},
                traits: toBestiaryBlocks(commonDetail.special_abilities),
                actions: toBestiaryBlocks(commonDetail.actions),
                bonus_actions: toBestiaryBlocks(commonDetail.bonus_actions),
                reactions: toBestiaryBlocks(commonDetail.reactions),
                legendary_actions: toBestiaryBlocks(commonDetail.legendary_actions),
                lair_actions: toBestiaryBlocks(commonDetail.lair_actions),
                image_url: normalizeImageUrl(asText(commonDetail.image)) || null,
                sort_order: entries.reduce((max, entry) => Math.max(max, entry.sortOrder), 0) + 1,
                is_player_visible: false,
            };

            let result = await supabase.from("campaign_bestiary_entries").insert(payload).select("*").single();
            if (result.error && visibilityError(result.error)) {
                const { is_player_visible: _unused, ...withoutVisibility } = payload;
                result = await supabase.from("campaign_bestiary_entries").insert(withoutVisibility).select("*").single();
            }
            if (result.error) throw new Error(result.error.message);

            const entry = toEntry(asRecord(result.data));
            setEntries((prev) => [...prev, entry].sort(compareEntries));
            setViewMode("campaign");
            setSelectedId(entry.id);
            setCreating(false);
            setCampaignPanelMode("view");
            setDraft(entryToDraft(entry));
            setNotice(t("Criatura importada.", "Creature imported."));
        } catch (importError: unknown) {
            setError(importError instanceof Error ? importError.message : t("No se pudo importar.", "Could not import."));
        } finally {
            setImporting(false);
        }
    }

    function onImageChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        if (!file) {
            setPendingImage(null);
            return;
        }
        if (!file.type.startsWith("image/")) {
            setError(t("Archivo no valido.", "Invalid image file."));
            return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
            setError(t("Imagen mayor de 50MB.", "Image larger than 50MB."));
            return;
        }
        setPendingImage(file);
        setNotice(t("Imagen lista para subir.", "Image ready to upload."));
    }

    async function uploadPendingNow() {
        if (!draft || !draft.id || !pendingImage) return;
        setImageBusy(true);
        try {
            const imageUrl = await uploadImage(campaignId, draft.id, pendingImage);
            setPendingImage(null);
            setDraft((prev) => (prev ? { ...prev, imageUrl } : prev));
            setEntries((prev) => prev.map((entry) => (entry.id === draft.id ? { ...entry, imageUrl } : entry)));
            setNotice(t("Imagen subida.", "Image uploaded."));
        } catch (uploadError: unknown) {
            setError(uploadError instanceof Error ? uploadError.message : t("No se pudo subir imagen.", "Could not upload image."));
        } finally {
            setImageBusy(false);
        }
    }

    async function clearCurrentImage() {
        if (!draft) return;
        if (!draft.id) {
            setPendingImage(null);
            setDraft((prev) => (prev ? { ...prev, imageUrl: "" } : prev));
            return;
        }

        setImageBusy(true);
        try {
            await removeImage(campaignId, draft.id);
            setPendingImage(null);
            setDraft((prev) => (prev ? { ...prev, imageUrl: "" } : prev));
            setEntries((prev) => prev.map((entry) => (entry.id === draft.id ? { ...entry, imageUrl: "" } : entry)));
            setNotice(t("Imagen eliminada.", "Image removed."));
        } catch (clearError: unknown) {
            setError(clearError instanceof Error ? clearError.message : t("No se pudo quitar imagen.", "Could not clear image."));
        } finally {
            setImageBusy(false);
        }
    }

    async function restoreDefaultImportedImage() {
        if (!draft) return;

        const sourceIndex = draft.sourceIndex.trim();
        if (!sourceIndex) {
            setError(
                t(
                    "Esta criatura no tiene indice de origen para restaurar imagen.",
                    "This creature has no source index to restore an image."
                )
            );
            return;
        }

        setImageBusy(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/dnd/monsters/${encodeURIComponent(sourceIndex)}?locale=${localeCode}`
            );
            const payload = (await response.json().catch(() => null)) as
                | (Record<string, unknown> & { error?: unknown })
                | null;

            if (!response.ok) {
                throw new Error(
                    asText(payload?.error)
                    || t(
                        "No se pudo recuperar la imagen por defecto.",
                        "Could not recover default image."
                    )
                );
            }

            const candidate = normalizeImageUrl(asText(payload?.image));
            if (!candidate) {
                throw new Error(
                    t(
                        "La criatura origen no tiene imagen por defecto.",
                        "Source creature does not have a default image."
                    )
                );
            }

            setPendingImage(null);
            setDraft((prev) => (prev ? { ...prev, imageUrl: candidate } : prev));
            setNotice(t("Imagen por defecto restaurada.", "Default image restored."));
        } catch (restoreError: unknown) {
            setError(
                restoreError instanceof Error
                    ? restoreError.message
                    : t(
                        "No se pudo restaurar la imagen por defecto.",
                        "Could not restore default image."
                    )
            );
        } finally {
            setImageBusy(false);
        }
    }

    function cancelEditing() {
        if (creating) {
            const nextId = entries[0]?.id ?? null;
            const nextEntry = nextId ? entries.find((entry) => entry.id === nextId) ?? null : null;
            setSelectedId(nextId);
            setDraft(nextEntry ? entryToDraft(nextEntry) : null);
            setCreating(false);
            setCampaignPanelMode("view");
            setPendingImage(null);
            return;
        }

        setCampaignPanelMode("view");
        setPendingImage(null);
        if (!selectedId) return;
        const selectedEntry = entries.find((entry) => entry.id === selectedId) ?? null;
        if (selectedEntry) {
            setDraft(entryToDraft(selectedEntry));
        }
    }

    async function togglePlayerVisibilityFromView() {
        if (!draft) return;

        const nextVisible = !draft.isPlayerVisible;
        if (!draft.id) {
            setDraft((prev) => (prev ? { ...prev, isPlayerVisible: nextVisible } : prev));
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const { data, error: updateError } = await supabase
                .from("campaign_bestiary_entries")
                .update({ is_player_visible: nextVisible })
                .eq("id", draft.id)
                .eq("campaign_id", campaignId)
                .select("*")
                .maybeSingle();

            if (updateError) {
                if (visibilityError(updateError)) {
                    throw new Error(
                        t(
                            "Falta migracion de bestiario para visibilidad de jugadores.",
                            "Missing bestiary migration for player visibility."
                        )
                    );
                }
                throw new Error(updateError.message);
            }

            const updatedEntry = toEntry(asRecord(data));
            setEntries((prev) =>
                prev
                    .map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry))
                    .sort(compareEntries)
            );
            setDraft(entryToDraft(updatedEntry));
            setNotice(
                nextVisible
                    ? t("Ahora visible para jugadores.", "Now visible to players.")
                    : t("Oculta para jugadores.", "Hidden from players.")
            );
        } catch (toggleError: unknown) {
            setError(
                toggleError instanceof Error
                    ? toggleError.message
                    : t("No se pudo actualizar visibilidad.", "Could not update visibility.")
            );
        } finally {
            setSaving(false);
        }
    }

    function resetCommonFilters() {
        setCommonTypeFilter("all");
        setCommonSizeFilter("all");
        setCommonAlignmentFilter("all");
        setCommonCrBand("all");
        setCommonSort("name_asc");
    }

    const isEditMode = creating || campaignPanelMode === "edit";
    const pendingProposalPatch = useMemo(() => {
        if (!pendingProposal) return null;
        return asRecord(pendingProposal.patch);
    }, [pendingProposal]);
    const pendingProposalTargetEntry = useMemo(() => {
        if (!pendingProposal || pendingProposal.operation !== "update") return null;
        if (pendingProposal.targetEntryId) {
            const byId = entries.find((entry) => entry.id === pendingProposal.targetEntryId);
            if (byId) return byId;
        }
        const targetName = asText(pendingProposal.targetName);
        if (targetName) {
            const byName = entries.find(
                (entry) => normalizeLookupKey(entry.name) === normalizeLookupKey(targetName)
            );
            if (byName) return byName;
        }
        const patchName = pendingProposalPatch ? asText(pendingProposalPatch.name) : "";
        if (patchName) {
            return (
                entries.find(
                    (entry) => normalizeLookupKey(entry.name) === normalizeLookupKey(patchName)
                ) ?? null
            );
        }
        return null;
    }, [entries, pendingProposal, pendingProposalPatch]);
    const pendingProposalPreviewEntry = useMemo(() => {
        if (!pendingProposal || !pendingProposalPatch) return null;
        const base =
            pendingProposal.operation === "update" && pendingProposalTargetEntry
                ? pendingProposalTargetEntry
                : createProposalPreviewSeedEntry(entries);
        const preview = applyBestiaryPatchToEntryPreview(base, pendingProposalPatch);
        if (!preview.name.trim()) {
            preview.name =
                asText(pendingProposal.targetName) ||
                (locale === "en" ? "New creature" : "Nueva criatura");
        }
        return preview;
    }, [entries, locale, pendingProposal, pendingProposalPatch, pendingProposalTargetEntry]);
    const pendingProposalSheet: CreatureSheetData | null = useMemo(() => {
        if (!pendingProposalPreviewEntry) return null;
        return campaignEntryToCreatureSheetData(pendingProposalPreviewEntry, locale);
    }, [locale, pendingProposalPreviewEntry]);
    const pendingProposalChangeRows = useMemo(() => {
        if (!pendingProposal || !pendingProposalPatch || !pendingProposalPreviewEntry) {
            return [] as Array<{ label: string; value: string }>;
        }
        const metadataPatch = hasOwn(pendingProposalPatch, "metadata")
            ? asRecord(pendingProposalPatch.metadata)
            : {};
        const hasFolderPatch =
            hasOwn(pendingProposalPatch, "folder_path") ||
            hasOwn(pendingProposalPatch, "folderPath") ||
            hasOwn(metadataPatch, "folder_path") ||
            hasOwn(metadataPatch, "folderPath") ||
            hasOwn(metadataPatch, "folder") ||
            hasOwn(metadataPatch, "bestiary_folder") ||
            hasOwn(metadataPatch, "bestiaryFolder");
        const hasCatalogIndexPatch =
            hasOwn(pendingProposalPatch, "catalog_index") ||
            hasOwn(pendingProposalPatch, "catalogIndex") ||
            hasOwn(metadataPatch, "catalog_index") ||
            hasOwn(metadataPatch, "catalogIndex") ||
            hasOwn(metadataPatch, "bestiary_index") ||
            hasOwn(metadataPatch, "bestiaryIndex");
        const rows: Array<{ label: string; value: string }> = [];
        const push = (labelText: string, valueText: string) => {
            const normalizedValue = valueText.trim();
            if (!normalizedValue) return;
            rows.push({ label: labelText, value: normalizedValue });
        };
        if (hasOwn(pendingProposalPatch, "name")) {
            push(t("Nombre", "Name"), pendingProposalPreviewEntry.name || "-");
        }
        if (hasOwn(pendingProposalPatch, "creature_size")) {
            push(t("Tamano", "Size"), pendingProposalPreviewEntry.creatureSize || "-");
        }
        if (hasOwn(pendingProposalPatch, "creature_type")) {
            push(t("Tipo", "Type"), pendingProposalPreviewEntry.creatureType || "-");
        }
        if (hasOwn(pendingProposalPatch, "alignment")) {
            push(t("Alineamiento", "Alignment"), pendingProposalPreviewEntry.alignment || "-");
        }
        if (hasFolderPatch) {
            push(t("Carpeta", "Folder"), pendingProposalPreviewEntry.folderPath || "-");
        }
        if (hasCatalogIndexPatch) {
            push(t("Indice", "Index"), pendingProposalPreviewEntry.catalogIndex || "-");
        }
        if (hasOwn(pendingProposalPatch, "challenge_rating")) {
            push(
                "CR",
                pendingProposalPreviewEntry.challengeRating == null
                    ? "-"
                    : String(pendingProposalPreviewEntry.challengeRating)
            );
        }
        if (hasOwn(pendingProposalPatch, "xp")) {
            push("XP", pendingProposalPreviewEntry.xp == null ? "-" : String(pendingProposalPreviewEntry.xp));
        }
        if (hasOwn(pendingProposalPatch, "proficiency_bonus")) {
            push(
                "PB",
                pendingProposalPreviewEntry.proficiencyBonus == null
                    ? "-"
                    : `${pendingProposalPreviewEntry.proficiencyBonus >= 0 ? "+" : ""}${pendingProposalPreviewEntry.proficiencyBonus}`
            );
        }
        if (hasOwn(pendingProposalPatch, "armor_class")) {
            push("AC", pendingProposalPreviewEntry.armorClass == null ? "-" : String(pendingProposalPreviewEntry.armorClass));
        }
        if (hasOwn(pendingProposalPatch, "hit_points")) {
            push("HP", pendingProposalPreviewEntry.hitPoints == null ? "-" : String(pendingProposalPreviewEntry.hitPoints));
        }
        if (hasOwn(pendingProposalPatch, "hit_dice")) {
            push(t("Dados de golpe", "Hit dice"), pendingProposalPreviewEntry.hitDice || "-");
        }
        if (hasOwn(pendingProposalPatch, "ability_scores")) {
            const line = (["STR", "DEX", "CON", "INT", "WIS", "CHA"] as const)
                .map((ability) => `${ability} ${pendingProposalPreviewEntry.abilityScores[ability]}`)
                .join(" - ");
            push(t("Atributos", "Ability scores"), line);
        }
        if (hasOwn(pendingProposalPatch, "speed")) {
            push(
                t("Velocidad", "Speed"),
                formatInlineRecord(pendingProposalPreviewEntry.speed) || "-"
            );
        }
        if (hasOwn(pendingProposalPatch, "senses")) {
            push(
                t("Sentidos", "Senses"),
                formatInlineRecord(pendingProposalPreviewEntry.senses) || "-"
            );
        }
        if (hasOwn(pendingProposalPatch, "languages")) {
            push(t("Idiomas", "Languages"), pendingProposalPreviewEntry.languages || "-");
        }
        if (hasOwn(pendingProposalPatch, "tags")) {
            push(
                t("Etiquetas", "Tags"),
                pendingProposalPreviewEntry.tags.length > 0
                    ? pendingProposalPreviewEntry.tags.join(", ")
                    : "-"
            );
        }
        if (hasOwn(pendingProposalPatch, "traits")) {
            push(
                t("Rasgos", "Traits"),
                String(pendingProposalPreviewEntry.traits.length)
            );
        }
        if (hasOwn(pendingProposalPatch, "actions")) {
            push(
                t("Acciones", "Actions"),
                String(pendingProposalPreviewEntry.actions.length)
            );
        }
        if (hasOwn(pendingProposalPatch, "bonus_actions")) {
            push(
                t("Acciones bonus", "Bonus actions"),
                String(pendingProposalPreviewEntry.bonusActions.length)
            );
        }
        if (hasOwn(pendingProposalPatch, "reactions")) {
            push(
                t("Reacciones", "Reactions"),
                String(pendingProposalPreviewEntry.reactions.length)
            );
        }
        if (hasOwn(pendingProposalPatch, "legendary_actions")) {
            push(
                t("Acciones legendarias", "Legendary actions"),
                String(pendingProposalPreviewEntry.legendaryActions.length)
            );
        }
        if (hasOwn(pendingProposalPatch, "lair_actions")) {
            push(
                t("Acciones de guarida", "Lair actions"),
                String(pendingProposalPreviewEntry.lairActions.length)
            );
        }
        return rows;
    }, [pendingProposal, pendingProposalPatch, pendingProposalPreviewEntry, t]);
    const pendingProposalTargetMissing =
        pendingProposal?.operation === "update" && !pendingProposalTargetEntry;
    const hasPendingCreateListPreview =
        pendingProposal?.operation === "create" && Boolean(pendingProposalPreviewEntry);
    const campaignFolderPaths = useMemo(
        () =>
            Array.from(
                new Set(
                    [
                        ...manualFolders,
                        ...entries.map((entry) => entry.folderPath),
                        hasPendingCreateListPreview && pendingProposalPreviewEntry
                            ? pendingProposalPreviewEntry.folderPath
                            : "",
                    ]
                        .map((value) => normalizeFolderPath(value))
                        .filter(Boolean)
                )
            ),
        [entries, hasPendingCreateListPreview, manualFolders, pendingProposalPreviewEntry]
    );
    const campaignTree = useMemo(() => {
        const listItems: CampaignTreeItem[] = entries.map((entry) => ({
            key: entry.id,
            entry,
            isPreview: false,
        }));
        if (hasPendingCreateListPreview && pendingProposalPreviewEntry) {
            listItems.push({
                key: "__ai-preview-create__",
                entry: pendingProposalPreviewEntry,
                isPreview: true,
            });
        }
        return buildCampaignFolderTree(
            listItems,
            campaignFolderPaths,
            folderOrderByParent,
            localeCode
        );
    }, [
        campaignFolderPaths,
        entries,
        folderOrderByParent,
        hasPendingCreateListPreview,
        localeCode,
        pendingProposalPreviewEntry,
    ]);

    useEffect(() => {
        if (campaignFolderPaths.length === 0 && Object.keys(folderOrderByParent).length === 0) return;
        const validPaths = new Set(campaignFolderPaths.map((value) => normalizeFolderPath(value)));
        const validParents = new Set<string>([""]);
        for (const path of validPaths) {
            let parent = folderParentPath(path);
            while (true) {
                validParents.add(parent);
                if (!parent) break;
                parent = folderParentPath(parent);
            }
        }

        setFolderOrderByParent((prev) => {
            const next: Record<string, string[]> = {};
            let changed = false;

            for (const parent of validParents) {
                const rawChildren = Array.isArray(prev[parent]) ? prev[parent] : [];
                const normalizedChildren = Array.from(
                    new Set(
                        rawChildren
                            .map((value) => normalizeFolderPath(value))
                            .filter((value) => isDirectChildFolderPath(value, parent))
                    )
                );
                const filteredChildren = normalizedChildren.filter((value) => validPaths.has(value));
                if (filteredChildren.length > 0) {
                    next[parent] = filteredChildren;
                }
                if (
                    normalizedChildren.length !== filteredChildren.length
                    || filteredChildren.some((value, index) => value !== normalizedChildren[index])
                ) {
                    changed = true;
                }
            }

            const prevKeys = Object.keys(prev);
            const nextKeys = Object.keys(next);
            if (prevKeys.length !== nextKeys.length) changed = true;
            if (!changed) return prev;
            return next;
        });
    }, [campaignFolderPaths, folderOrderByParent]);

    useEffect(() => {
        if (!selectedId) return;
        const selectedEntry = entries.find((entry) => entry.id === selectedId);
        if (!selectedEntry) return;

        const normalizedPath = normalizeFolderPath(selectedEntry.folderPath);
        if (!normalizedPath) return;

        const segments = normalizedPath.split("/").filter(Boolean);
        let currentPath = "";
        setCollapsedFolderState((prev) => {
            const next = { ...prev };
            let changed = false;
            for (const segment of segments) {
                currentPath = currentPath ? `${currentPath}/${segment}` : segment;
                const key = `folder:${currentPath}`;
                if (next[key]) {
                    delete next[key];
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [entries, selectedId]);

    const campaignSheet: CreatureSheetData | null = useMemo(() => {
        if (!draft) return null;
        return {
            name: draft.name || t("Nueva criatura", "New creature"),
            subtitle: [draft.creatureSize, draft.creatureType, draft.alignment].filter(Boolean).join(" - "),
            sourceLabel: sourceLabel(draft.sourceType, locale),
            imageUrl: draft.imageUrl,
            isPlayerVisible: draft.isPlayerVisible,
            creatureSize: draft.creatureSize || null,
            creatureType: draft.creatureType || null,
            alignment: draft.alignment || null,
            challengeRating: fromInputNumber(draft.challengeRating),
            xp: fromInputNumber(draft.xp, true),
            armorClass: fromInputNumber(draft.armorClass, true),
            hitPoints: fromInputNumber(draft.hitPoints, true),
            hitDice: draft.hitDice || null,
            proficiencyBonus: fromInputNumber(draft.proficiencyBonus, true),
            abilityScores: draft.abilityScores,
            speed: draft.speed,
            savingThrows: draft.savingThrows,
            skills: draft.skills,
            senses: draft.senses,
            languages: draft.languages || null,
            flavor: draft.flavor || null,
            notes: draft.notes || null,
            tags: draft.tags,
            traits: draft.traits,
            actions: draft.actions,
            bonusActions: draft.bonusActions,
            reactions: draft.reactions,
            legendaryActions: draft.legendaryActions,
            lairActions: draft.lairActions,
        };
    }, [draft, locale, t]);

    const commonSheet: CreatureSheetData | null = useMemo(() => {
        if (!commonDetail) return null;
        const commonProficiencies = parseCommonProficiencies(commonDetail.proficiencies);
        return {
            name: asText(commonDetail.name) || asText(commonDetail.localized_name) || asText(commonDetail.index),
            subtitle: [asText(commonDetail.size), asText(commonDetail.type), asText(commonDetail.alignment)].filter(Boolean).join(" - "),
            sourceLabel: t("Bestiario comun (SRD)", "Common bestiary (SRD)"),
            imageUrl: normalizeImageUrl(asText(commonDetail.image)),
            creatureSize: asText(commonDetail.size) || null,
            creatureType: asText(commonDetail.type) || null,
            alignment: asText(commonDetail.alignment) || null,
            challengeRating: asNum(commonDetail.challenge_rating),
            xp: asInt(commonDetail.xp),
            armorClass: Array.isArray(commonDetail.armor_class)
                ? asInt(asRecord(commonDetail.armor_class[0]).value)
                : asInt(asRecord(commonDetail.armor_class).value),
            hitPoints: asInt(commonDetail.hit_points),
            hitDice: asText(commonDetail.hit_dice) || null,
            proficiencyBonus: asInt(commonDetail.proficiency_bonus),
            abilityScores: normalizeAbilityScores({
                STR: commonDetail.strength,
                DEX: commonDetail.dexterity,
                CON: commonDetail.constitution,
                INT: commonDetail.intelligence,
                WIS: commonDetail.wisdom,
                CHA: commonDetail.charisma,
            }),
            speed: toLooseRecord(commonDetail.speed),
            savingThrows: commonProficiencies.savingThrows,
            skills: commonProficiencies.skills,
            senses: toLooseRecord(commonDetail.senses),
            languages: asText(commonDetail.languages) || null,
            tags: Array.from(
                new Set([
                    ...extractTags(asText(commonDetail.type)),
                    ...extractTags(asText(commonDetail.subtype)),
                ])
            ),
            traits: toBestiaryBlocks(commonDetail.special_abilities),
            actions: toBestiaryBlocks(commonDetail.actions),
            bonusActions: toBestiaryBlocks(commonDetail.bonus_actions),
            reactions: toBestiaryBlocks(commonDetail.reactions),
            legendaryActions: toBestiaryBlocks(commonDetail.legendary_actions),
            lairActions: toBestiaryBlocks(commonDetail.lair_actions),
        };
    }, [commonDetail, t]);

    function handleListWheel(event: WheelEvent<HTMLDivElement>): void {
        const element = event.currentTarget;
        if (element.scrollHeight <= element.clientHeight) return;

        const modeFactor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1;
        const deltaY = event.deltaY * modeFactor;
        if (deltaY === 0) return;

        const atTop = element.scrollTop <= 0;
        const atBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
        const shouldConsume = (deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom);
        if (!shouldConsume) return;

        element.scrollTop += deltaY;
        event.preventDefault();
        event.stopPropagation();
    }

    function toggleFolderCollapsed(key: string): void {
        setCollapsedFolderState((prev) => {
            const next = { ...prev };
            if (next[key]) {
                delete next[key];
            } else {
                next[key] = true;
            }
            return next;
        });
    }

    function isFolderCollapsed(key: string): boolean {
        return collapsedFolderState[key] === true;
    }

    function extractDraggedEntryId(event: DragEvent<HTMLElement>): string | null {
        const direct = event.dataTransfer.getData(BESTIARY_DRAG_ENTRY_TYPE);
        if (direct) return direct;
        const fallback = event.dataTransfer.getData("text/plain");
        return fallback || null;
    }

    function extractDraggedFolderPath(event: DragEvent<HTMLElement>): string | null {
        const direct = event.dataTransfer.getData(BESTIARY_DRAG_FOLDER_TYPE);
        if (direct) return normalizeFolderPath(direct);
        return null;
    }

    function handleEntryDragStart(event: DragEvent<HTMLElement>, entryId: string): void {
        event.dataTransfer.setData(BESTIARY_DRAG_ENTRY_TYPE, entryId);
        event.dataTransfer.setData("text/plain", entryId);
        event.dataTransfer.effectAllowed = "move";
        setDraggingFolderPath(null);
        setDragOverFolderPlacement(null);
        setDraggingEntryId(entryId);
    }

    function handleEntryDragEnd(): void {
        setDraggingEntryId(null);
        setDraggingFolderPath(null);
        setDragOverFolderKey(null);
        setDragOverEntryPlacement(null);
        setDragOverFolderPlacement(null);
    }

    function dragPlacementFromEvent(event: DragEvent<HTMLElement>): "before" | "after" {
        const bounds = event.currentTarget.getBoundingClientRect();
        return event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
    }

    function handleEntryDragOver(event: DragEvent<HTMLElement>, targetEntryId: string): void {
        if (!draggingEntryId || draggingFolderPath || draggingEntryId === targetEntryId) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setDragOverFolderKey(null);
        setDragOverFolderPlacement(null);
        setDragOverEntryPlacement({
            entryId: targetEntryId,
            position: dragPlacementFromEvent(event),
        });
    }

    function handleEntryDragLeave(targetEntryId: string): void {
        setDragOverEntryPlacement((prev) =>
            prev?.entryId === targetEntryId ? null : prev
        );
    }

    function handleEntryDrop(event: DragEvent<HTMLElement>, targetEntryId: string): void {
        event.preventDefault();
        const draggedFolder = extractDraggedFolderPath(event) || draggingFolderPath;
        if (draggedFolder) {
            setDragOverEntryPlacement(null);
            return;
        }
        const draggedId = extractDraggedEntryId(event) || draggingEntryId;
        if (!draggedId || draggedId === targetEntryId) {
            setDragOverEntryPlacement(null);
            return;
        }
        const placement =
            dragOverEntryPlacement?.entryId === targetEntryId
                ? dragOverEntryPlacement.position
                : dragPlacementFromEvent(event);
        setDragOverEntryPlacement(null);
        void reorderEntriesByDrop(draggedId, targetEntryId, placement);
    }

    function folderPlacementFromEvent(event: DragEvent<HTMLElement>): "before" | "inside" | "after" {
        const bounds = event.currentTarget.getBoundingClientRect();
        const relative = (event.clientY - bounds.top) / Math.max(bounds.height, 1);
        if (relative < 0.28) return "before";
        if (relative > 0.72) return "after";
        return "inside";
    }

    function handleFolderDragStart(event: DragEvent<HTMLElement>, folderPath: string): void {
        const normalized = normalizeFolderPath(folderPath);
        if (!normalized) return;
        event.stopPropagation();
        event.dataTransfer.setData(BESTIARY_DRAG_FOLDER_TYPE, normalized);
        event.dataTransfer.setData("text/plain", normalized);
        event.dataTransfer.effectAllowed = "move";
        setDraggingEntryId(null);
        setDragOverEntryPlacement(null);
        setDragOverFolderKey(null);
        setDraggingFolderPath(normalized);
    }

    function handleFolderDragEnd(): void {
        setDraggingFolderPath(null);
        setDragOverFolderPlacement(null);
        setDragOverFolderKey(null);
        setDragOverEntryPlacement(null);
    }

    function handleFolderDragOver(event: DragEvent<HTMLElement>, folderKey: string): void {
        if (!draggingEntryId && !draggingFolderPath) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        if (draggingFolderPath) {
            const targetPath = normalizeFolderPath(folderKey.replace(/^folder:/, ""));
            if (targetPath && targetPath !== draggingFolderPath) {
                setDragOverFolderPlacement({
                    folderPath: targetPath,
                    position: folderPlacementFromEvent(event),
                });
            }
            setDragOverEntryPlacement(null);
            setDragOverFolderKey(null);
            return;
        }
        setDragOverEntryPlacement(null);
        setDragOverFolderKey(folderKey);
    }

    function handleFolderDragLeave(folderKey: string): void {
        setDragOverFolderKey((prev) => (prev === folderKey ? null : prev));
        const targetPath = normalizeFolderPath(folderKey.replace(/^folder:/, ""));
        setDragOverFolderPlacement((prev) =>
            prev?.folderPath === targetPath ? null : prev
        );
    }

    function handleFolderDrop(
        event: DragEvent<HTMLElement>,
        folderPath: string,
        folderKey: string
    ): void {
        event.preventDefault();
        const folderPathFromDrag = extractDraggedFolderPath(event) || draggingFolderPath;
        if (folderPathFromDrag) {
            const targetPath = normalizeFolderPath(folderPath);
            if (targetPath) {
                const placement =
                    dragOverFolderPlacement?.folderPath === targetPath
                        ? dragOverFolderPlacement.position
                        : folderPlacementFromEvent(event);
                setDragOverFolderPlacement(null);
                void moveFolderByDrop(folderPathFromDrag, targetPath, placement);
            }
            return;
        }

        const entryId = extractDraggedEntryId(event) || draggingEntryId;
        setDragOverFolderKey((prev) => (prev === folderKey ? null : prev));
        setDragOverEntryPlacement(null);
        if (!entryId) {
            setDraggingEntryId(null);
            return;
        }
        void moveEntryToFolder(entryId, folderPath);
    }

    function renderCampaignEntryNode(item: CampaignTreeItem, depth: number) {
        const entry = item.entry;
        const indexLabel = entry.catalogIndex.trim();
        const rowPadding = { paddingLeft: `${8 + depth * 14}px` };

        if (item.isPreview) {
            return (
                <li key={item.key}>
                    <div
                        style={rowPadding}
                        className="relative isolate overflow-hidden w-full rounded-md border border-emerald-300/85 bg-emerald-50/80 py-2 pr-3 text-left shadow-[0_0_0_1px_rgba(16,185,129,0.18)]"
                    >
                        <div className="relative z-10">
                            <p className="text-sm font-medium text-emerald-900 truncate">
                                {entry.name || t("Nueva criatura", "New creature")}
                            </p>
                            <p className="mt-0.5 text-[11px] text-emerald-900/85 truncate">
                                {indexLabel ? `[${indexLabel}] ` : ""}
                                {entry.creatureType || t("Sin tipo", "No type")} - CR{" "}
                                {entry.challengeRating ?? "-"}
                            </p>
                            <p className="mt-1 text-[10px] text-emerald-800/80">
                                {t("Preview IA (pendiente)", "AI preview (pending)")}
                            </p>
                        </div>
                    </div>
                </li>
            );
        }

        const isSelected = !creating && selectedId === entry.id;
        const isDragging = draggingEntryId === entry.id;
        const placement =
            dragOverEntryPlacement?.entryId === entry.id
                ? dragOverEntryPlacement.position
                : null;
        const selectedStyle = isSelected ? getBestiarySelectionStyle() : undefined;
        const buttonStyle = selectedStyle ? { ...selectedStyle, ...rowPadding } : rowPadding;

        return (
            <li key={item.key}>
                <button
                    type="button"
                    draggable
                    onClick={() => {
                        setSelectionPulse((value) => value + 1);
                        setCreating(false);
                        setCampaignPanelMode("view");
                        setSelectedId(entry.id);
                    }}
                    onDragStart={(event) => handleEntryDragStart(event, entry.id)}
                    onDragEnd={handleEntryDragEnd}
                    onDragOver={(event) => handleEntryDragOver(event, entry.id)}
                    onDragLeave={() => handleEntryDragLeave(entry.id)}
                    onDrop={(event) => handleEntryDrop(event, entry.id)}
                    style={buttonStyle}
                    className={`relative isolate overflow-hidden w-full rounded-md border py-2 pr-3 text-left transition-[border-color,box-shadow,background-color] ${
                        isSelected
                            ? "border-transparent"
                            : "border-ring bg-white/80 hover:bg-white"
                    } ${isDragging ? "opacity-55" : ""} ${
                        placement === "before"
                            ? "shadow-[inset_0_2px_0_0_rgba(16,185,129,1)]"
                            : placement === "after"
                                ? "shadow-[inset_0_-2px_0_0_rgba(16,185,129,1)]"
                                : ""
                    }`}
                >
                    {isSelected ? (
                        <SelectionBlobOverlay entryId={entry.id} pulse={selectionPulse} />
                    ) : null}
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-ink truncate">{entry.name}</p>
                        <p className="mt-0.5 text-[11px] text-ink-muted truncate">
                            {indexLabel ? `[${indexLabel}] ` : ""}
                            {entry.creatureType || t("Sin tipo", "No type")} - CR{" "}
                            {entry.challengeRating ?? "-"}
                        </p>
                        <p className="mt-1 text-[10px] text-ink-muted">
                            {entry.isPlayerVisible
                                ? t("Visible a jugadores", "Visible to players")
                                : t("Solo DM", "DM only")}
                        </p>
                    </div>
                </button>
            </li>
        );
    }
    function renderCampaignFolderNode(folder: CampaignTreeFolder, depth: number) {
        const collapsed = isFolderCollapsed(folder.key);
        const isEntryDropTarget = draggingEntryId != null && dragOverFolderKey === folder.key;
        const folderPlacement =
            draggingFolderPath && dragOverFolderPlacement?.folderPath === folder.path
                ? dragOverFolderPlacement.position
                : null;
        const isEditing = editingFolderPath === folder.path;

        const highlightClass = isEntryDropTarget
            ? "border-emerald-400 bg-emerald-50/80 text-emerald-900"
            : folderPlacement === "inside"
                ? "border-amber-400 bg-amber-50/80 text-amber-900"
                : folderPlacement === "before"
                    ? "border-transparent shadow-[inset_0_2px_0_0_rgba(245,158,11,1)]"
                    : folderPlacement === "after"
                        ? "border-transparent shadow-[inset_0_-2px_0_0_rgba(245,158,11,1)]"
                        : "border-transparent";

        return (
            <li key={folder.key} className="space-y-1">
                {isEditing ? (
                    <div
                        style={{ paddingLeft: `${8 + depth * 14}px` }}
                        className="flex items-center gap-1 rounded-md border border-ring bg-white/90 py-1.5 pr-2"
                    >
                        <input
                            value={editingFolderName}
                            onChange={(event) => setEditingFolderName(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    void renameFolderPath(folder.path, editingFolderName);
                                }
                                if (event.key === "Escape") {
                                    event.preventDefault();
                                    setEditingFolderPath(null);
                                    setEditingFolderName("");
                                }
                            }}
                            className="h-7 min-w-0 flex-1 rounded border border-ring bg-white px-2 text-[11px] text-ink"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => void renameFolderPath(folder.path, editingFolderName)}
                            className="h-7 rounded border border-accent/50 bg-accent/10 px-2 text-[10px] text-accent-strong"
                        >
                            {t("Guardar", "Save")}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setEditingFolderPath(null);
                                setEditingFolderName("");
                            }}
                            className="h-7 rounded border border-ring bg-white px-2 text-[10px] text-ink"
                        >
                            {t("Cancelar", "Cancel")}
                        </button>
                    </div>
                ) : (
                    <div
                        style={{ paddingLeft: `${8 + depth * 14}px` }}
                        onDragOver={(event) => handleFolderDragOver(event, folder.key)}
                        onDragLeave={() => handleFolderDragLeave(folder.key)}
                        onDrop={(event) => {
                            const draggedFolder = extractDraggedFolderPath(event) || draggingFolderPath;
                            if (draggedFolder) {
                                const placement =
                                    dragOverFolderPlacement?.folderPath === folder.path
                                        ? dragOverFolderPlacement.position
                                        : folderPlacementFromEvent(event);
                                setDragOverFolderPlacement(null);
                                void moveFolderByDrop(draggedFolder, folder.path, placement);
                                return;
                            }
                            handleFolderDrop(event, folder.path, folder.key);
                        }}
                        className={`flex items-center gap-1 rounded-md border py-1 pr-1 text-left text-[11px] text-ink-muted hover:border-ring/50 hover:bg-white/70 ${highlightClass}`}
                    >
                        <button
                            type="button"
                            draggable
                            onDragStart={(event) => handleFolderDragStart(event, folder.path)}
                            onDragEnd={handleFolderDragEnd}
                            onClick={() => toggleFolderCollapsed(folder.key)}
                            className="flex min-w-0 flex-1 items-center gap-1 py-0.5 text-left"
                        >
                            {collapsed ? (
                                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <Folder className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{folder.name}</span>
                            <span className="ml-auto rounded bg-panel px-1.5 py-0.5 text-[10px]">
                                {folder.totalCount}
                            </span>
                        </button>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setEditingFolderPath(folder.path);
                                    setEditingFolderName(folder.name);
                                }}
                                className="h-6 rounded border border-ring bg-white px-1.5 text-[10px] text-ink hover:bg-panel"
                                title={t("Renombrar carpeta", "Rename folder")}
                            >
                                {t("Ren", "Ren")}
                            </button>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    void deleteFolderPath(folder.path);
                                }}
                                className="h-6 rounded border border-red-300 bg-red-50 px-1.5 text-[10px] text-red-700 hover:bg-red-100"
                                title={t("Eliminar carpeta", "Delete folder")}
                            >
                                {t("Del", "Del")}
                            </button>
                        </div>
                    </div>
                )}

                {collapsed ? null : (
                    <div className="space-y-1">
                        {folder.folders.length > 0 ? (
                            <ul className="space-y-1">
                                {folder.folders.map((child) =>
                                    renderCampaignFolderNode(child, depth + 1)
                                )}
                            </ul>
                        ) : null}
                        {folder.items.length > 0 ? (
                            <ul className="space-y-1">
                                {folder.items.map((item) =>
                                    renderCampaignEntryNode(item, depth + 1)
                                )}
                            </ul>
                        ) : null}
                    </div>
                )}
            </li>
        );
    }

    function renderUncategorizedNode() {
        const collapsed = isFolderCollapsed(UNCATEGORIZED_FOLDER_NODE_KEY);
        const isEntryDropTarget =
            draggingEntryId != null && dragOverFolderKey === UNCATEGORIZED_FOLDER_NODE_KEY;
        const isFolderDropTarget =
            draggingFolderPath != null && dragOverFolderPlacement?.folderPath === "";
        return (
            <li key={UNCATEGORIZED_FOLDER_NODE_KEY} className="space-y-1">
                <button
                    type="button"
                    onClick={() => toggleFolderCollapsed(UNCATEGORIZED_FOLDER_NODE_KEY)}
                    onDragOver={(event) => {
                        if (draggingFolderPath) {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                            setDragOverFolderPlacement({ folderPath: "", position: "inside" });
                            setDragOverFolderKey(null);
                            setDragOverEntryPlacement(null);
                            return;
                        }
                        handleFolderDragOver(event, UNCATEGORIZED_FOLDER_NODE_KEY);
                    }}
                    onDragLeave={() => {
                        handleFolderDragLeave(UNCATEGORIZED_FOLDER_NODE_KEY);
                        setDragOverFolderPlacement((prev) => (prev?.folderPath === "" ? null : prev));
                    }}
                    onDrop={(event) => {
                        const draggedFolder = extractDraggedFolderPath(event) || draggingFolderPath;
                        if (draggedFolder) {
                            event.preventDefault();
                            setDragOverFolderPlacement(null);
                            void moveFolderByDrop(draggedFolder, "", "inside");
                            return;
                        }
                        handleFolderDrop(event, "", UNCATEGORIZED_FOLDER_NODE_KEY);
                    }}
                    className={`flex w-full items-center gap-1 rounded-md border py-1.5 pr-2 text-left text-[11px] text-ink-muted hover:border-ring/50 hover:bg-white/70 ${
                        isEntryDropTarget
                            ? "border-emerald-400 bg-emerald-50/80 text-emerald-900"
                            : isFolderDropTarget
                                ? "border-amber-400 bg-amber-50/80 text-amber-900"
                                : "border-transparent"
                    }`}
                    style={{ paddingLeft: "8px" }}
                >
                    {collapsed ? (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <Folder className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{t("Sin carpeta", "No folder")}</span>
                    <span className="ml-auto rounded bg-panel px-1.5 py-0.5 text-[10px]">
                        {campaignTree.items.length}
                    </span>
                </button>
                {collapsed ? null : campaignTree.items.length > 0 ? (
                    <ul className="space-y-1">
                        {campaignTree.items.map((item) => renderCampaignEntryNode(item, 1))}
                    </ul>
                ) : (
                    <p className="px-7 text-[10px] text-ink-muted/80">
                        {t("Arrastra criaturas aqui para quitar carpeta.", "Drop here to remove folder.")}
                    </p>
                )}
            </li>
        );
    }

    return (
        <div className="h-full min-h-0 flex flex-col gap-3 overflow-hidden">
            <div className="flex items-center justify-center gap-2">
                <button
                    type="button"
                    onClick={() => setViewMode("campaign")}
                    className={`rounded-md border px-3 py-1.5 text-xs ${
                        viewMode === "campaign"
                            ? "border-accent/70 bg-accent/12 text-accent-strong"
                            : "border-ring bg-white/70 text-ink hover:bg-white"
                    }`}
                >
                    {t("Bestiario de Campaña", "Campaign bestiary")}
                </button>
                <button
                    type="button"
                    onClick={() => setViewMode("common")}
                    className={`rounded-md border px-3 py-1.5 text-xs ${
                        viewMode === "common"
                            ? "border-accent/70 bg-accent/12 text-accent-strong"
                            : "border-ring bg-white/70 text-ink hover:bg-white"
                    }`}
                >
                    {t("Bestiario comun", "Common bestiary")}
                </button>
            </div>

            {error ? (
                <p className="rounded-md border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-700">{error}</p>
            ) : null}
            {notice ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-100 px-3 py-2 text-xs text-emerald-800">{notice}</p>
            ) : null}

            {viewMode === "campaign" ? (
                <div className="min-h-0 flex-1 grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-3 overflow-hidden">
                    <aside className="min-h-0 rounded-xl border border-ring bg-panel/75 p-3 flex flex-col gap-3 overflow-hidden">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-ink">{t("Criaturas", "Creatures")}</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => void loadEntries()}
                                    className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-ring bg-white/80 hover:bg-white"
                                    title={t("Recargar", "Reload")}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={startCreate}
                                    className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-accent/60 bg-accent/10 text-accent-strong hover:bg-accent/20"
                                    title={t("Nueva criatura", "New creature")}
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="rounded-md border border-ring bg-white/70 p-2">
                            <p className="text-[11px] font-medium text-ink">
                                {t("Carpetas", "Folders")}
                            </p>
                            <div className="mt-1.5 flex items-center gap-2">
                                <input
                                    value={newFolderInput}
                                    onChange={(event) => setNewFolderInput(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key !== "Enter") return;
                                        event.preventDefault();
                                        createManualFolder();
                                    }}
                                    placeholder={t("Jefes/Cueva", "Bosses/Cavern")}
                                    className="h-8 min-w-0 flex-1 rounded-md border border-ring bg-white px-2 text-xs text-ink"
                                />
                                <button
                                    type="button"
                                    onClick={createManualFolder}
                                    className="h-8 rounded-md border border-accent/50 bg-accent/10 px-2.5 text-[11px] text-accent-strong hover:bg-accent/20"
                                >
                                    {t("Crear", "Create")}
                                </button>
                            </div>
                            <p className="mt-1 text-[10px] text-ink-muted/90">
                                {t(
                                    "Arrastra criaturas a carpetas para moverlas.",
                                    "Drag creatures into folders to move them."
                                )}
                            </p>
                        </div>

                        <div
                            onWheel={handleListWheel}
                            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain styled-scrollbar pr-1"
                        >
                            {loadingEntries ? (
                                <p className="text-xs text-ink-muted">{t("Cargando...", "Loading...")}</p>
                            ) : campaignTree.totalCount === 0 && campaignTree.folders.length === 0 ? (
                                <p className="text-xs text-ink-muted">{t("Aún no hay criaturas en Campaña.", "No campaign creatures yet.")}</p>
                            ) : (
                                <div className="space-y-1">
                                    <ul className="space-y-1">
                                        {renderUncategorizedNode()}
                                        {campaignTree.folders.map((folder) =>
                                            renderCampaignFolderNode(folder, 0)
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </aside>

                    <section className="min-h-0 overflow-y-auto overflow-x-hidden styled-scrollbar pr-1">
                        {pendingProposal && pendingProposalSheet ? (
                            <div className="space-y-3">
                                <div className="rounded-xl border border-emerald-300/70 bg-emerald-50/60 p-3">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-semibold text-emerald-900">
                                                {t("Vista previa IA", "AI preview")}
                                            </h3>
                                            <p className="text-xs text-emerald-900/90">
                                                {pendingProposal.operation === "update"
                                                    ? t(
                                                          "Se propone editar una criatura existente. Rechazar cambios no borra la criatura actual.",
                                                          "An existing creature will be edited. Rejecting changes will not delete the current creature."
                                                      )
                                                    : t(
                                                          "Se propone crear una nueva criatura de bestiario.",
                                                          "A new bestiary creature will be created."
                                                      )}
                                            </p>
                                            {pendingProposal.reply ? (
                                                <p className="text-xs text-emerald-900/80 whitespace-pre-wrap">
                                                    {pendingProposal.reply}
                                                </p>
                                            ) : null}
                                            {pendingProposalTargetMissing ? (
                                                <p className="text-xs text-amber-900">
                                                    {t(
                                                        "No se encontró el objetivo original; la vista previa usa una base vacía para mostrar los cambios.",
                                                        "The original target was not found; preview uses an empty base to display changes."
                                                    )}
                                                </p>
                                            ) : null}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onRejectPendingProposal?.()}
                                                disabled={proposalBusy || !onRejectPendingProposal}
                                                className="inline-flex items-center gap-1 rounded-md border border-ring bg-white/90 px-3 py-1.5 text-xs text-ink hover:bg-white disabled:opacity-60"
                                            >
                                                {t("Rechazar cambios", "Reject changes")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onConfirmPendingProposal?.()}
                                                disabled={proposalBusy || !onConfirmPendingProposal}
                                                className="inline-flex items-center gap-1 rounded-md border border-emerald-500 bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-200 disabled:opacity-60"
                                            >
                                                {proposalBusy
                                                    ? t("Aplicando...", "Applying...")
                                                    : t("Confirmar cambios", "Confirm changes")}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {pendingProposal.operation === "update" &&
                                pendingProposalChangeRows.length > 0 ? (
                                    <div className="rounded-xl border border-emerald-300/70 bg-emerald-50/70 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
                                            {t(
                                                "Cambios detectados (resaltados)",
                                                "Detected changes (highlighted)"
                                            )}
                                        </p>
                                        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                            {pendingProposalChangeRows.map((row, index) => (
                                                <p
                                                    key={`pending-change-${row.label}-${index}`}
                                                    className="rounded-md border border-emerald-300/80 bg-emerald-100/80 px-2 py-1 text-[11px] text-emerald-900"
                                                >
                                                    <span className="font-semibold">{row.label}:</span>{" "}
                                                    {row.value}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                <CreatureSheet
                                    data={pendingProposalSheet}
                                    locale={locale}
                                    statsMode="hex"
                                    className={`shadow-[0_14px_34px_rgba(45,29,12,0.12)] ${
                                        pendingProposal.operation === "update"
                                            ? "ring-2 ring-emerald-300/85"
                                            : "ring-1 ring-emerald-200/70"
                                    }`}
                                />
                            </div>
                        ) : draft ? (
                            isEditMode ? (
                                <div className="space-y-3">
                                    <div className="rounded-xl border border-ring bg-panel/80 p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-sm font-semibold text-ink">
                                                {creating ? t("Nueva criatura", "New creature") : t("Editar criatura", "Edit creature")}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={cancelEditing}
                                                    className="inline-flex items-center gap-1 rounded-md border border-ring bg-white/85 px-3 py-1.5 text-xs text-ink hover:bg-white"
                                                >
                                                    {t("Cancelar", "Cancel")}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void saveDraft()}
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 rounded-md border border-accent/60 bg-accent/10 px-3 py-1.5 text-xs text-accent-strong disabled:opacity-60"
                                                >
                                                    <Save className="h-3.5 w-3.5" />
                                                    {saving ? t("Guardando...", "Saving...") : t("Guardar", "Save")}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void deleteDraft()}
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-700 disabled:opacity-60"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    {t("Eliminar", "Delete")}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <label className="text-xs text-ink-muted">{t("Nombre", "Name")}
                                                <input value={draft.name} onChange={(e) => updateDraft("name", e.target.value)} className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-sm text-ink" />
                                            </label>
                                            <label className="text-xs text-ink-muted">{t("Carpeta", "Folder")}
                                                <input
                                                    value={draft.folderPath}
                                                    onChange={(e) => updateDraft("folderPath", e.target.value)}
                                                    placeholder={t("Jefes/Cueva", "Bosses/Cavern")}
                                                    className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-sm text-ink"
                                                />
                                            </label>
                                            <label className="text-xs text-ink-muted">{t("Indice", "Index")}
                                                <input
                                                    value={draft.catalogIndex}
                                                    onChange={(e) => updateDraft("catalogIndex", e.target.value)}
                                                    placeholder={t("A-12", "A-12")}
                                                    className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-sm text-ink"
                                                />
                                            </label>
                                            <label className="text-xs text-ink-muted">{t("Tipo", "Type")}
                                                <input value={draft.creatureType} onChange={(e) => updateDraft("creatureType", e.target.value)} className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-sm text-ink" />
                                            </label>
                                            <label className="text-xs text-ink-muted">{t("Tamaño", "Size")}
                                                <input value={draft.creatureSize} onChange={(e) => updateDraft("creatureSize", e.target.value)} className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-sm text-ink" />
                                            </label>
                                            <label className="text-xs text-ink-muted">{t("Alineamiento", "Alignment")}
                                                <input value={draft.alignment} onChange={(e) => updateDraft("alignment", e.target.value)} className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-sm text-ink" />
                                            </label>
                                            <label className="text-xs text-ink-muted">CR
                                                <input type="number" step="0.25" value={draft.challengeRating} onChange={(e) => updateDraft("challengeRating", e.target.value)} className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-sm text-ink" />
                                            </label>
                                            <label className="text-xs text-ink-muted">XP
                                                <input type="number" value={draft.xp} onChange={(e) => updateDraft("xp", e.target.value)} className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-sm text-ink" />
                                            </label>
                                            <label className="text-xs text-ink-muted">AC
                                                <input type="number" value={draft.armorClass} onChange={(e) => updateDraft("armorClass", e.target.value)} className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-sm text-ink" />
                                            </label>
                                            <label className="text-xs text-ink-muted">HP
                                                <input type="number" value={draft.hitPoints} onChange={(e) => updateDraft("hitPoints", e.target.value)} className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-sm text-ink" />
                                            </label>
                                            <label className="text-xs text-ink-muted">PB
                                                <input type="number" value={draft.proficiencyBonus} onChange={(e) => updateDraft("proficiencyBonus", e.target.value)} className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-sm text-ink" />
                                            </label>
                                            <label className="text-xs text-ink-muted">{t("Dados de golpe", "Hit dice")}
                                                <input value={draft.hitDice} onChange={(e) => updateDraft("hitDice", e.target.value)} className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-sm text-ink" />
                                            </label>
                                            <label className="text-xs text-ink-muted">{t("Idiomas", "Languages")}
                                                <input value={draft.languages} onChange={(e) => updateDraft("languages", e.target.value)} className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-sm text-ink" />
                                            </label>
                                            <label className="text-xs text-ink-muted md:col-span-2 lg:col-span-3">
                                                {t("Etiquetas", "Tags")} ({t("separadas por coma", "comma separated")})
                                                <input
                                                    value={tagsToEditorText(draft.tags)}
                                                    onChange={(e) =>
                                                        updateDraft(
                                                            "tags",
                                                            parseTagsFromEditorText(e.target.value)
                                                        )
                                                    }
                                                    placeholder={t("alado, nocturno, alfa", "winged, nocturnal, alpha")}
                                                    className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-sm text-ink"
                                                />
                                            </label>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {(["STR", "DEX", "CON", "INT", "WIS", "CHA"] as AbilityKey[]).map((ability) => (
                                                <label key={ability} className="text-xs text-ink-muted">{ability}
                                                    <input type="number" value={draft.abilityScores[ability]} onChange={(e) => updateAbility(ability, e.target.value)} className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-sm text-ink" />
                                                </label>
                                            ))}
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <label className="text-xs text-ink-muted">
                                                {t("Velocidad", "Speed")} ({t("clave: valor", "key: value")})
                                                <textarea
                                                    value={looseRecordToEditorText(draft.speed)}
                                                    onChange={(e) => updateLooseRecordField("speed", e.target.value)}
                                                    rows={4}
                                                    placeholder={"walk: 9\nswim: 12"}
                                                    className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 font-mono text-xs text-ink"
                                                />
                                            </label>
                                            <label className="text-xs text-ink-muted">
                                                {t("Sentidos", "Senses")} ({t("clave: valor", "key: value")})
                                                <textarea
                                                    value={looseRecordToEditorText(draft.senses)}
                                                    onChange={(e) => updateLooseRecordField("senses", e.target.value)}
                                                    rows={4}
                                                    placeholder={"darkvision: 18\npassive_perception: 12"}
                                                    className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 font-mono text-xs text-ink"
                                                />
                                            </label>
                                        </div>

                                        <div className="mt-3 rounded-md border border-ring bg-white/80 px-3 py-2">
                                            <p className="text-xs font-medium text-ink/90">
                                                {t(
                                                    "Bloques de combate (nombre en primera línea y texto debajo, separa bloques con línea en blanco)",
                                                    "Combat blocks (title in first line and text below, separate blocks with a blank line)"
                                                )}
                                            </p>
                                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <label className="text-xs text-ink-muted">
                                                    {t("Rasgos", "Traits")}
                                                    <textarea
                                                        value={bestiaryBlocksToEditorText(draft.traits)}
                                                        onChange={(e) => updateBestiaryBlocksField("traits", e.target.value)}
                                                        rows={6}
                                                        className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-xs text-ink"
                                                    />
                                                </label>
                                                <label className="text-xs text-ink-muted">
                                                    {t("Acciones", "Actions")}
                                                    <textarea
                                                        value={bestiaryBlocksToEditorText(draft.actions)}
                                                        onChange={(e) => updateBestiaryBlocksField("actions", e.target.value)}
                                                        rows={6}
                                                        className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-xs text-ink"
                                                    />
                                                </label>
                                                <label className="text-xs text-ink-muted">
                                                    {t("Acciones bonus", "Bonus actions")}
                                                    <textarea
                                                        value={bestiaryBlocksToEditorText(draft.bonusActions)}
                                                        onChange={(e) => updateBestiaryBlocksField("bonusActions", e.target.value)}
                                                        rows={5}
                                                        className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-xs text-ink"
                                                    />
                                                </label>
                                                <label className="text-xs text-ink-muted">
                                                    {t("Reacciones", "Reactions")}
                                                    <textarea
                                                        value={bestiaryBlocksToEditorText(draft.reactions)}
                                                        onChange={(e) => updateBestiaryBlocksField("reactions", e.target.value)}
                                                        rows={5}
                                                        className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-xs text-ink"
                                                    />
                                                </label>
                                                <label className="text-xs text-ink-muted">
                                                    {t("Acciones legendarias", "Legendary actions")}
                                                    <textarea
                                                        value={bestiaryBlocksToEditorText(draft.legendaryActions)}
                                                        onChange={(e) => updateBestiaryBlocksField("legendaryActions", e.target.value)}
                                                        rows={5}
                                                        className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-xs text-ink"
                                                    />
                                                </label>
                                                <label className="text-xs text-ink-muted">
                                                    {t("Acciones de guarida", "Lair actions")}
                                                    <textarea
                                                        value={bestiaryBlocksToEditorText(draft.lairActions)}
                                                        onChange={(e) => updateBestiaryBlocksField("lairActions", e.target.value)}
                                                        rows={5}
                                                        className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-xs text-ink"
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="mt-3 rounded-md border border-ring bg-white/80 px-3 py-2 text-xs text-ink-muted">
                                            <p className="font-medium text-ink/85">{t("Imagen", "Image")}</p>
                                            <input type="file" accept="image/*" onChange={onImageChange} className="mt-2 block w-full text-xs text-ink" />
                                            {pendingImage ? <p className="mt-1 text-[11px] truncate">{pendingImage.name}</p> : null}
                                        <div className="mt-2 flex items-center gap-2">
                                            <button type="button" onClick={() => void uploadPendingNow()} disabled={imageBusy || !pendingImage || !draft.id} className="inline-flex items-center gap-1 rounded-md border border-ring bg-white px-2 py-1 text-[11px] disabled:opacity-60"><Upload className="h-3.5 w-3.5" />{imageBusy ? t("Subiendo...", "Uploading...") : t("Subir", "Upload")}</button>
                                            <button type="button" onClick={() => void clearCurrentImage()} disabled={imageBusy || (!pendingImage && !draft.imageUrl)} className="inline-flex items-center gap-1 rounded-md border border-ring bg-white px-2 py-1 text-[11px] disabled:opacity-60"><X className="h-3.5 w-3.5" />{t("Quitar", "Remove")}</button>
                                            {(draft.sourceType === "SRD" || draft.sourceType === "IMPORTED") && draft.sourceIndex.trim() ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => void restoreDefaultImportedImage()}
                                                        disabled={imageBusy}
                                                        className="inline-flex items-center gap-1 rounded-md border border-ring bg-white px-2 py-1 text-[11px] text-ink disabled:opacity-60"
                                                    >
                                                        {t("Restaurar por defecto", "Restore default")}
                                                    </button>
                                                ) : null}
                                        </div>
                                        {(draft.sourceType === "SRD" || draft.sourceType === "IMPORTED") && draft.sourceIndex.trim() ? (
                                            <p className="mt-1 text-[11px] text-ink-muted">
                                                {t(
                                                    "Si quitaste la imagen importada, puedes restaurarla y guardar.",
                                                    "If you removed the imported image, you can restore it and save."
                                                )}
                                            </p>
                                        ) : null}
                                        {!draft.id && pendingImage ? <p className="mt-1 text-[11px] text-ink-muted">{t("Se subira al guardar.", "Will upload on save.")}</p> : null}
                                    </div>

                                        <label className="mt-3 block text-xs text-ink-muted">{t("Descripción", "Description")}
                                            <textarea value={draft.flavor} onChange={(e) => updateDraft("flavor", e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-sm text-ink" />
                                        </label>
                                        <label className="mt-3 block text-xs text-ink-muted">{t("Notas", "Notes")}
                                            <textarea value={draft.notes} onChange={(e) => updateDraft("notes", e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-sm text-ink" />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="rounded-xl border border-ring bg-panel/80 p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h3 className="text-sm font-semibold text-ink">
                                                {t("Vista de criatura", "Creature view")}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setCampaignPanelMode("edit")}
                                                    className="inline-flex items-center gap-1 rounded-md border border-ring bg-white/85 px-3 py-1.5 text-xs text-ink hover:bg-white"
                                                >
                                                    {t("Editar", "Edit")}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void togglePlayerVisibilityFromView()}
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 rounded-md border border-accent/60 bg-accent/10 px-3 py-1.5 text-xs text-accent-strong disabled:opacity-60"
                                                >
                                                    {draft.isPlayerVisible
                                                        ? t("Ocultar a jugadores", "Hide from players")
                                                        : t("Mostrar a jugadores", "Show to players")}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void deleteDraft()}
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-700 disabled:opacity-60"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    {t("Eliminar", "Delete")}
                                                </button>
                                            </div>
                                        </div>
                                        {draft.folderPath.trim() || draft.catalogIndex.trim() ? (
                                            <p className="mt-2 text-[11px] text-ink-muted">
                                                {draft.folderPath.trim()
                                                    ? `${t("Carpeta", "Folder")}: ${draft.folderPath.trim()}`
                                                    : `${t("Carpeta", "Folder")}: ${t("Sin carpeta", "No folder")}`}
                                                {" - "}
                                                {draft.catalogIndex.trim()
                                                    ? `${t("Indice", "Index")}: ${draft.catalogIndex.trim()}`
                                                    : `${t("Indice", "Index")}: -`}
                                            </p>
                                        ) : null}
                                    </div>

                                    {campaignSheet ? <CreatureSheet data={campaignSheet} locale={locale} statsMode="hex" className="shadow-[0_14px_34px_rgba(45,29,12,0.12)]" /> : null}
                                </div>
                            )
                        ) : (
                            <div className="rounded-xl border border-ring bg-panel/75 p-4 text-sm text-ink-muted">{t("Selecciona o crea una criatura.", "Select or create a creature.")}</div>
                        )}
                    </section>
                </div>
            ) : (
                <div className="min-h-0 flex-1 flex flex-col gap-3 overflow-hidden">
                    <div className="rounded-xl border border-ring bg-panel/75 p-3">
                        <div className="overflow-x-auto styled-scrollbar pb-1">
                            <div className="flex min-w-max items-end gap-2">
                                <label className="block min-w-[300px] text-[11px] text-ink-muted">
                                    {t("Buscar", "Search")}
                                    <div className="relative mt-1">
                                        <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-ink-muted" />
                                        <input
                                            value={commonQuery}
                                            onChange={(e) => setCommonQuery(e.target.value)}
                                            placeholder={t("Buscar criatura", "Search creature")}
                                            className="h-9 w-full rounded-md border border-ring bg-white/90 py-2 pl-8 pr-2 text-sm text-ink"
                                        />
                                    </div>
                                </label>

                                <label className="block min-w-[170px] text-[11px] text-ink-muted">
                                    {t("Ordenar por", "Sort by")}
                                    <select
                                        value={commonSort}
                                        onChange={(e) => setCommonSort(e.target.value as CommonSort)}
                                        className="mt-1 h-9 w-full rounded-md border border-ring bg-white px-2 py-1.5 text-xs text-ink"
                                    >
                                        <option value="name_asc">{t("Alfabetico A-Z", "Alphabetical A-Z")}</option>
                                        <option value="name_desc">{t("Alfabetico Z-A", "Alphabetical Z-A")}</option>
                                        <option value="cr_asc">{t("CR menor-mayor", "CR low-high")}</option>
                                        <option value="cr_desc">{t("CR mayor-menor", "CR high-low")}</option>
                                        <option value="type_asc">{t("Tipo A-Z", "Type A-Z")}</option>
                                    </select>
                                </label>

                                <label className="block min-w-[140px] text-[11px] text-ink-muted">
                                    {t("Rango CR", "CR range")}
                                    <select
                                        value={commonCrBand}
                                        onChange={(e) => setCommonCrBand(e.target.value as CommonCrBand)}
                                        className="mt-1 h-9 w-full rounded-md border border-ring bg-white px-2 py-1.5 text-xs text-ink"
                                    >
                                        <option value="all">{t("Todos", "All")}</option>
                                        <option value="0-1">{t("0 a 1", "0 to 1")}</option>
                                        <option value="2-4">{t("2 a 4", "2 to 4")}</option>
                                        <option value="5-10">{t("5 a 10", "5 to 10")}</option>
                                        <option value="11+">{t("11 o mÁs", "11 or more")}</option>
                                    </select>
                                </label>

                                <label className="block min-w-[160px] text-[11px] text-ink-muted">
                                    {t("Tipo", "Type")}
                                    <select
                                        value={commonTypeFilter}
                                        onChange={(e) => setCommonTypeFilter(e.target.value)}
                                        className="mt-1 h-9 w-full rounded-md border border-ring bg-white px-2 py-1.5 text-xs text-ink"
                                    >
                                        <option value="all">{t("Todos", "All")}</option>
                                        {commonTypeOptions.map((value) => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block min-w-[140px] text-[11px] text-ink-muted">
                                    {t("Tamaño", "Size")}
                                    <select
                                        value={commonSizeFilter}
                                        onChange={(e) => setCommonSizeFilter(e.target.value)}
                                        className="mt-1 h-9 w-full rounded-md border border-ring bg-white px-2 py-1.5 text-xs text-ink"
                                    >
                                        <option value="all">{t("Todos", "All")}</option>
                                        {commonSizeOptions.map((value) => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block min-w-[180px] text-[11px] text-ink-muted">
                                    {t("Alineamiento", "Alignment")}
                                    <select
                                        value={commonAlignmentFilter}
                                        onChange={(e) => setCommonAlignmentFilter(e.target.value)}
                                        className="mt-1 h-9 w-full rounded-md border border-ring bg-white px-2 py-1.5 text-xs text-ink"
                                    >
                                        <option value="all">{t("Todos", "All")}</option>
                                        {commonAlignmentOptions.map((value) => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </label>

                                <button
                                    type="button"
                                    onClick={resetCommonFilters}
                                    className="h-9 rounded-md border border-ring bg-white/80 px-3 text-xs text-ink hover:bg-white"
                                >
                                    {t("Limpiar filtros", "Reset filters")}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-3 overflow-hidden">
                        <aside className="min-h-0 rounded-xl border border-ring bg-panel/75 p-3 flex flex-col gap-3 overflow-hidden">
                            <h2 className="text-sm font-semibold text-ink">
                                {t("Criaturas", "Creatures")}
                            </h2>

                            <p className="text-[11px] text-ink-muted">
                                {commonFilteredList.length} {t("criaturas", "creatures")}
                            </p>

                            <div
                                onWheel={handleListWheel}
                                className="min-h-0 flex-1 overflow-y-scroll overflow-x-hidden overscroll-contain styled-scrollbar pr-1"
                            >
                                {commonLoading ? (
                                    <p className="text-xs text-ink-muted">{t("Cargando...", "Loading...")}</p>
                                ) : commonFilteredList.length === 0 ? (
                                    <p className="text-xs text-ink-muted">{t("No hay resultados.", "No results.")}</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {commonFilteredList.map((monster) => (
                                            <li key={monster.index}>
                                                <button type="button" onClick={() => setCommonSelectedId(monster.index)} className={`w-full rounded-md border px-3 py-2 text-left ${commonSelectedId === monster.index ? "border-accent/70 bg-accent/12" : "border-ring bg-white/80 hover:bg-white"}`}>
                                                    <p className="truncate text-sm font-medium text-ink">{monster.name}</p>
                                                    <p className="mt-0.5 truncate text-[11px] text-ink-muted">{monster.type || t("Sin tipo", "No type")} · CR {monster.challenge_rating ?? "-"}</p>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </aside>

                        <section className="min-h-0 overflow-y-auto overflow-x-hidden styled-scrollbar pr-1">
                            {commonDetailLoading ? (
                                <div className="rounded-xl border border-ring bg-panel/75 p-4 text-sm text-ink-muted">{t("Cargando criatura...", "Loading creature...")}</div>
                            ) : commonSheet ? (
                                <CreatureSheet
                                    data={commonSheet}
                                    locale={locale}
                                    statsMode="hex"
                                    className="shadow-[0_14px_34px_rgba(45,29,12,0.12)]"
                                    headerRight={
                                        <button
                                            type="button"
                                            onClick={() => void importCommon()}
                                            disabled={importing}
                                            className="inline-flex items-center gap-2 rounded-md border border-accent/60 bg-accent/10 px-3 py-1.5 text-xs text-accent-strong disabled:opacity-60"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            {importing ? t("Importando...", "Importing...") : t("Importar a Campaña", "Import to campaign")}
                                        </button>
                                    }
                                />
                            ) : (
                                <div className="rounded-xl border border-ring bg-panel/75 p-4 text-sm text-ink-muted">{t("Selecciona una criatura del bestiario comun.", "Select a creature from common bestiary.")}</div>
                            )}
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}

