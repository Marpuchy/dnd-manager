"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { tr } from "@/lib/i18n/translate";
import {
    CreatureSheet,
    normalizeAbilityScores,
    toBestiaryBlocks,
    toLooseRecord,
    type AbilityScores,
    type BestiaryBlock,
    type CreatureSheetData,
} from "../../shared/bestiaryShared";

type CampaignBestiaryPlayerViewProps = {
    campaignId: string;
    locale: string;
};

type PlayerEntry = {
    id: string;
    name: string;
    sourceType: string;
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

function compareEntries(a: PlayerEntry, b: PlayerEntry): number {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.createdAt.localeCompare(b.createdAt);
}

function toEntry(raw: Record<string, unknown>): PlayerEntry {
    return {
        id: asText(raw.id),
        name: asText(raw.name),
        sourceType: asText(raw.source_type),
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

function sourceLabel(sourceType: string, locale: string): string {
    const upper = sourceType.toUpperCase();
    if (upper === "SRD") return locale === "en" ? "Common bestiary (SRD)" : "Bestiario comun (SRD)";
    if (upper === "IMPORTED") return locale === "en" ? "Imported" : "Importada";
    return locale === "en" ? "Custom" : "Personalizada";
}

export default function CampaignBestiaryPlayerView({ campaignId, locale }: CampaignBestiaryPlayerViewProps) {
    const t = (es: string, en: string) => tr(locale, es, en);

    const [entries, setEntries] = useState<PlayerEntry[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);

            const { data, error: queryError } = await supabase
                .from("campaign_bestiary_entries")
                .select("*")
                .eq("campaign_id", campaignId)
                .order("sort_order", { ascending: true })
                .order("created_at", { ascending: true });

            if (cancelled) return;

            if (queryError) {
                setEntries([]);
                setSelectedId(null);
                setError(queryError.message || t("No se pudo cargar el bestiario.", "Could not load bestiary."));
                setLoading(false);
                return;
            }

            const nextEntries = (data ?? [])
                .map((row) => toEntry(asRecord(row)))
                .filter((entry) => entry.id)
                .filter((entry) => entry.isPlayerVisible)
                .sort(compareEntries);

            setEntries(nextEntries);
            setSelectedId((prev) => (prev && nextEntries.some((entry) => entry.id === prev) ? prev : (nextEntries[0]?.id ?? null)));
            setLoading(false);
        }

        void load();

        return () => {
            cancelled = true;
        };
    }, [campaignId, locale]);

    const selected = entries.find((entry) => entry.id === selectedId) ?? null;

    const sheetData: CreatureSheetData | null = useMemo(() => {
        if (!selected) return null;

        return {
            name: selected.name,
            subtitle: [selected.creatureSize, selected.creatureType, selected.alignment].filter(Boolean).join(" · "),
            sourceLabel: sourceLabel(selected.sourceType, locale),
            imageUrl: selected.imageUrl,
            creatureSize: selected.creatureSize || null,
            creatureType: selected.creatureType || null,
            alignment: selected.alignment || null,
            challengeRating: selected.challengeRating,
            xp: selected.xp,
            armorClass: selected.armorClass,
            hitPoints: selected.hitPoints,
            hitDice: selected.hitDice || null,
            proficiencyBonus: selected.proficiencyBonus,
            abilityScores: selected.abilityScores,
            speed: selected.speed,
            senses: selected.senses,
            languages: selected.languages || null,
            flavor: selected.flavor || null,
            notes: selected.notes || null,
            traits: selected.traits,
            actions: selected.actions,
            bonusActions: selected.bonusActions,
            reactions: selected.reactions,
            legendaryActions: selected.legendaryActions,
            lairActions: selected.lairActions,
        };
    }, [locale, selected]);

    return (
        <div className="h-full min-h-0 flex flex-col gap-3 overflow-hidden">
            {error ? (
                <p className="rounded-md border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-700">{error}</p>
            ) : null}

            <div className="min-h-0 flex-1 grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-3 overflow-hidden">
                <aside className="min-h-0 rounded-xl border border-ring bg-panel/75 p-3 flex flex-col gap-3 overflow-hidden">
                    <h2 className="text-sm font-semibold text-ink">{t("Bestiario de campana", "Campaign bestiary")}</h2>

                    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden styled-scrollbar pr-1">
                        {loading ? (
                            <p className="text-xs text-ink-muted">{t("Cargando...", "Loading...")}</p>
                        ) : entries.length === 0 ? (
                            <p className="text-xs text-ink-muted">{t("No hay criaturas visibles para jugadores.", "No creatures visible to players.")}</p>
                        ) : (
                            <ul className="space-y-2">
                                {entries.map((entry) => (
                                    <li key={entry.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedId(entry.id)}
                                            className={`w-full rounded-md border px-3 py-2 text-left ${selectedId === entry.id ? "border-accent/70 bg-accent/12" : "border-ring bg-white/80 hover:bg-white"}`}
                                        >
                                            <p className="text-sm font-medium text-ink truncate">{entry.name}</p>
                                            <p className="mt-0.5 text-[11px] text-ink-muted truncate">{entry.creatureType || t("Sin tipo", "No type")} · CR {entry.challengeRating ?? "-"}</p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </aside>

                <section className="min-h-0 overflow-y-auto overflow-x-hidden styled-scrollbar pr-1">
                    {sheetData ? (
                        <CreatureSheet data={sheetData} locale={locale} className="shadow-[0_14px_34px_rgba(45,29,12,0.12)]" />
                    ) : (
                        <div className="rounded-xl border border-ring bg-panel/75 p-4 text-sm text-ink-muted">{t("Selecciona una criatura visible.", "Select a visible creature.")}</div>
                    )}
                </section>
            </div>
        </div>
    );
}
