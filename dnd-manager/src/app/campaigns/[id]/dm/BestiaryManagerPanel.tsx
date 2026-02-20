"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type WheelEvent } from "react";
import { Plus, RefreshCw, Save, Search, Trash2, Upload, X } from "lucide-react";
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

type BestiaryManagerPanelProps = {
    campaignId: string;
    locale: string;
    refreshNonce?: number;
    focusEntryId?: string | null;
};

type SourceType = "CUSTOM" | "SRD" | "IMPORTED";
type ViewMode = "campaign" | "common";

type CampaignEntry = {
    id: string;
    name: string;
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
    senses: Record<string, unknown>;
    languages: string;
    flavor: string;
    notes: string;
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
    senses: Record<string, unknown>;
    languages: string;
    flavor: string;
    notes: string;
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

const DEFAULT_ENTRY_KIND = "ENCOUNTER";
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

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

function visibilityError(error: unknown): boolean {
    return asText((error as { message?: unknown } | null)?.message).toLowerCase().includes("is_player_visible");
}

function toEntry(raw: Record<string, unknown>): CampaignEntry {
    return {
        id: asText(raw.id),
        name: asText(raw.name),
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
        senses: toLooseRecord(raw.senses),
        languages: asText(raw.languages),
        flavor: asText(raw.flavor),
        notes: asText(raw.notes),
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
        senses: entry.senses,
        languages: entry.languages,
        flavor: entry.flavor,
        notes: entry.notes,
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

function emptyDraft(sortOrder: number): Draft {
    return {
        id: null,
        name: "",
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
        senses: {},
        languages: "",
        flavor: "",
        notes: "",
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
        senses: draft.senses,
        languages: draft.languages.trim() || null,
        flavor: draft.flavor.trim() || null,
        notes: draft.notes.trim() || null,
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

export default function BestiaryManagerPanel({
    campaignId,
    locale,
    refreshNonce = 0,
    focusEntryId = null,
}: BestiaryManagerPanelProps) {
    const t = (es: string, en: string) => tr(locale, es, en);
    const localeCode = locale === "en" ? "en" : "es";

    const [viewMode, setViewMode] = useState<ViewMode>("campaign");
    const [entries, setEntries] = useState<CampaignEntry[]>([]);
    const [loadingEntries, setLoadingEntries] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [campaignPanelMode, setCampaignPanelMode] = useState<"view" | "edit">("view");
    const [draft, setDraft] = useState<Draft | null>(null);
    const [pendingImage, setPendingImage] = useState<File | null>(null);

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
        setSelectedId(focusEntryId);
    }, [entries, focusEntryId]);

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
        setCreating(true);
        setCampaignPanelMode("edit");
        setSelectedId(null);
        setPendingImage(null);
        setDraft(emptyDraft(nextSort));
        setError(null);
        setNotice(null);
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
                senses: toLooseRecord(commonDetail.senses),
                languages: asText(commonDetail.languages) || null,
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

    const campaignSheet: CreatureSheetData | null = useMemo(() => {
        if (!draft) return null;
        return {
            name: draft.name || t("Nueva criatura", "New creature"),
            subtitle: [draft.creatureSize, draft.creatureType, draft.alignment].filter(Boolean).join(" · "),
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
            senses: draft.senses,
            languages: draft.languages || null,
            flavor: draft.flavor || null,
            notes: draft.notes || null,
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
        return {
            name: asText(commonDetail.name) || asText(commonDetail.localized_name) || asText(commonDetail.index),
            subtitle: [asText(commonDetail.size), asText(commonDetail.type), asText(commonDetail.alignment)].filter(Boolean).join(" · "),
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
            senses: toLooseRecord(commonDetail.senses),
            languages: asText(commonDetail.languages) || null,
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
                    {t("Bestiario de campana", "Campaign bestiary")}
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

                        <div
                            onWheel={handleListWheel}
                            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain styled-scrollbar pr-1"
                        >
                            {loadingEntries ? (
                                <p className="text-xs text-ink-muted">{t("Cargando...", "Loading...")}</p>
                            ) : entries.length === 0 ? (
                                <p className="text-xs text-ink-muted">{t("Aun no hay criaturas en campana.", "No campaign creatures yet.")}</p>
                            ) : (
                                <ul className="space-y-2">
                                    {entries.map((entry) => (
                                        <li key={entry.id}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCreating(false);
                                                    setCampaignPanelMode("view");
                                                    setSelectedId(entry.id);
                                                }}
                                                className={`w-full rounded-md border px-3 py-2 text-left ${
                                                    !creating && selectedId === entry.id
                                                        ? "border-accent/70 bg-accent/12"
                                                        : "border-ring bg-white/80 hover:bg-white"
                                                }`}
                                            >
                                                <p className="text-sm font-medium text-ink truncate">{entry.name}</p>
                                                <p className="mt-0.5 text-[11px] text-ink-muted truncate">
                                                    {entry.creatureType || t("Sin tipo", "No type")} · CR {entry.challengeRating ?? "-"}
                                                </p>
                                                <p className="mt-1 text-[10px] text-ink-muted">
                                                    {entry.isPlayerVisible
                                                        ? t("Visible a jugadores", "Visible to players")
                                                        : t("Solo DM", "DM only")}
                                                </p>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </aside>

                    <section className="min-h-0 overflow-y-auto overflow-x-hidden styled-scrollbar pr-1">
                        {draft ? (
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
                                            <label className="text-xs text-ink-muted">{t("Tipo", "Type")}
                                                <input value={draft.creatureType} onChange={(e) => updateDraft("creatureType", e.target.value)} className="mt-1 w-full rounded-md border border-ring bg-white/90 px-2 py-1.5 text-sm text-ink" />
                                            </label>
                                            <label className="text-xs text-ink-muted">{t("Tamano", "Size")}
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

                                        <label className="mt-3 block text-xs text-ink-muted">{t("Descripcion", "Description")}
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
                                    </div>

                                    {campaignSheet ? <CreatureSheet data={campaignSheet} locale={locale} className="shadow-[0_14px_34px_rgba(45,29,12,0.12)]" /> : null}
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
                                        <option value="11+">{t("11 o mas", "11 or more")}</option>
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
                                    {t("Tamano", "Size")}
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
                                    className="shadow-[0_14px_34px_rgba(45,29,12,0.12)]"
                                    headerRight={
                                        <button
                                            type="button"
                                            onClick={() => void importCommon()}
                                            disabled={importing}
                                            className="inline-flex items-center gap-2 rounded-md border border-accent/60 bg-accent/10 px-3 py-1.5 text-xs text-accent-strong disabled:opacity-60"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            {importing ? t("Importando...", "Importing...") : t("Importar a campana", "Import to campaign")}
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
