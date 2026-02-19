"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { tr } from "@/lib/i18n/translate";

type StoryPlayerViewProps = {
    campaignId: string;
    locale: string;
    previewAsPlayer?: boolean;
};

type ActRow = {
    id: string;
    title: string;
    act_number: number;
    sort_order: number;
};

type NodeRow = {
    id: string;
    act_id: string | null;
    parent_id: string | null;
    title: string;
    is_hidden: boolean;
};

type MapRow = {
    id: string;
    node_id: string | null;
    name: string;
    sort_order: number;
};

type ZoneRow = {
    id: string;
    map_id: string;
    node_id: string | null;
    target_node_id: string | null;
    name: string;
    is_visible: boolean;
    sort_order: number;
};

type DocumentRow = {
    id: string;
    node_id: string | null;
    title: string;
    visibility: "DM_ONLY" | "CAMPAIGN" | "PUBLIC";
    content: unknown;
    plain_text: string;
    metadata: unknown;
    updated_at: string;
};

type StoryEntry = {
    id: string;
    actId: string;
    actNumber: number;
    actTitle: string;
    mapId: string;
    mapName: string;
    mapSortOrder: number;
    zoneName: string;
    nodeId: string;
    nodeTitle: string;
    docTitle: string | null;
    docHtml: string;
    defaultTextColor: string;
    sortOrder: number;
};

function normalizeHexColor(input: string): string | null {
    const raw = input.trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(raw)) {
        return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase();
    }
    if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw}`.toLowerCase();
    return null;
}

function normalizeDocDefaultTextColor(value: unknown): string {
    if (typeof value !== "string") return "theme";
    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized === "theme" || normalized === "auto") return "theme";
    return normalizeHexColor(normalized) ?? "theme";
}

function extractDocHtml(doc: DocumentRow | null): string {
    if (!doc) return "";
    if (doc.content && typeof doc.content === "object") {
        const raw = doc.content as Record<string, unknown>;
        if (typeof raw.html === "string") return raw.html;
        if (typeof raw.markdown === "string") {
            return raw.markdown
                .split("\n")
                .map((line) => `<p>${line || "<br/>"}</p>`)
                .join("");
        }
    }
    if (!doc.plain_text) return "";
    return doc.plain_text
        .split("\n")
        .map((line) => `<p>${line || "<br/>"}</p>`)
        .join("");
}

export default function StoryPlayerView({
    campaignId,
    locale,
    previewAsPlayer = false,
}: StoryPlayerViewProps) {
    const t = (es: string, en: string) => tr(locale, es, en);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [entries, setEntries] = useState<StoryEntry[]>([]);
    const [selectedActId, setSelectedActId] = useState<string | null>(null);
    const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadVisibleStory() {
            setLoading(true);
            setError(null);
            try {
                const [actsRes, nodesRes, mapsRes, zonesResWithTrash] = await Promise.all([
                    supabase
                        .from("campaign_acts")
                        .select("id, title, act_number, sort_order")
                        .eq("campaign_id", campaignId)
                        .order("sort_order", { ascending: true })
                        .order("act_number", { ascending: true }),
                    supabase
                        .from("campaign_story_nodes")
                        .select("id, act_id, parent_id, title, is_hidden")
                        .eq("campaign_id", campaignId)
                        .eq("is_hidden", false),
                    supabase
                        .from("campaign_maps")
                        .select("id, node_id, name, sort_order")
                        .eq("campaign_id", campaignId),
                    supabase
                        .from("campaign_map_zones")
                        .select("id, map_id, node_id, target_node_id, name, is_visible, sort_order")
                        .eq("campaign_id", campaignId)
                        .eq("is_visible", true)
                        .is("deleted_at", null)
                        .order("sort_order", { ascending: true }),
                ]);

                if (actsRes.error) throw actsRes.error;
                if (nodesRes.error) throw nodesRes.error;
                if (mapsRes.error) throw mapsRes.error;

                let zonesRaw = zonesResWithTrash.data;
                if (zonesResWithTrash.error) {
                    const lowered = String(zonesResWithTrash.error.message ?? "").toLowerCase();
                    const missingDeletedAt = lowered.includes("deleted_at");
                    if (!missingDeletedAt) throw zonesResWithTrash.error;

                    const zonesLegacyRes = await supabase
                        .from("campaign_map_zones")
                        .select("id, map_id, node_id, target_node_id, name, is_visible, sort_order")
                        .eq("campaign_id", campaignId)
                        .eq("is_visible", true)
                        .order("sort_order", { ascending: true });
                    if (zonesLegacyRes.error) throw zonesLegacyRes.error;
                    zonesRaw = zonesLegacyRes.data;
                }

                const acts = (actsRes.data ?? []) as ActRow[];
                const nodes = (nodesRes.data ?? []) as NodeRow[];
                const maps = (mapsRes.data ?? []) as MapRow[];
                const zones = (zonesRaw ?? []) as ZoneRow[];

                const actsById = new Map(acts.map((act) => [act.id, act]));
                const nodesById = new Map(nodes.map((node) => [node.id, node]));
                const mapsById = new Map(maps.map((map) => [map.id, map]));
                const nodeIds = Array.from(
                    new Set(
                        zones
                            .map((zone) => zone.node_id ?? zone.target_node_id)
                            .filter((value): value is string => Boolean(value))
                            .filter((nodeId) => nodesById.has(nodeId))
                    )
                );

                const docsByNodeId = new Map<string, DocumentRow>();
                if (nodeIds.length > 0) {
                    const docsRes = await supabase
                        .from("campaign_documents")
                        .select(
                            "id, node_id, title, visibility, content, plain_text, metadata, updated_at"
                        )
                        .eq("campaign_id", campaignId)
                        .in("node_id", nodeIds)
                        .in("visibility", ["CAMPAIGN", "PUBLIC"])
                        .order("updated_at", { ascending: false });

                    if (docsRes.error) throw docsRes.error;
                    for (const raw of (docsRes.data ?? []) as DocumentRow[]) {
                        if (!raw.node_id) continue;
                        if (!docsByNodeId.has(raw.node_id)) {
                            docsByNodeId.set(raw.node_id, raw);
                        }
                    }
                }

                const normalized: StoryEntry[] = zones
                    .map((zone) => {
                        const nodeId = zone.node_id ?? zone.target_node_id;
                        if (!nodeId) return null;
                        const node = nodesById.get(nodeId) ?? null;
                        if (!node || node.is_hidden) return null;
                        const map = mapsById.get(zone.map_id) ?? null;
                        if (!map) return null;
                        const act = node.act_id ? actsById.get(node.act_id) ?? null : null;
                        if (!act) return null;
                        const doc = docsByNodeId.get(nodeId) ?? null;
                        const docMetadata =
                            doc?.metadata && typeof doc.metadata === "object"
                                ? (doc.metadata as Record<string, unknown>)
                                : {};

                        return {
                            id: zone.id,
                            actId: act.id,
                            actNumber: act.act_number,
                            actTitle: act.title,
                            mapId: map.id,
                            mapName: map.name || t("Modulo sin nombre", "Unnamed module"),
                            mapSortOrder: map.sort_order ?? 0,
                            zoneName: zone.name,
                            nodeId,
                            nodeTitle: node.title,
                            docTitle: doc?.title ?? null,
                            docHtml: extractDocHtml(doc),
                            defaultTextColor: normalizeDocDefaultTextColor(
                                docMetadata.story_default_text_color
                            ),
                            sortOrder: zone.sort_order ?? 0,
                        } as StoryEntry;
                    })
                    .filter((entry): entry is StoryEntry => Boolean(entry))
                    .sort((a, b) => {
                        if (a.actNumber !== b.actNumber) return a.actNumber - b.actNumber;
                        if (a.mapSortOrder !== b.mapSortOrder) return a.mapSortOrder - b.mapSortOrder;
                        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
                        return a.zoneName.localeCompare(b.zoneName);
                    });

                if (!cancelled) setEntries(normalized);
            } catch (err: any) {
                if (!cancelled) {
                    setError(
                        String(
                            err?.message ??
                                t(
                                    "No se pudo cargar la historia visible.",
                                    "Could not load visible story."
                                )
                        )
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadVisibleStory();
        return () => {
            cancelled = true;
        };
    }, [campaignId, locale]);

    const acts = useMemo(() => {
        const byId = new Map<string, { id: string; actNumber: number; actTitle: string }>();
        for (const entry of entries) {
            if (!byId.has(entry.actId)) {
                byId.set(entry.actId, {
                    id: entry.actId,
                    actNumber: entry.actNumber,
                    actTitle: entry.actTitle,
                });
            }
        }
        return Array.from(byId.values()).sort((a, b) => a.actNumber - b.actNumber);
    }, [entries]);

    useEffect(() => {
        if (acts.length === 0) {
            setSelectedActId(null);
            return;
        }
        if (!selectedActId || !acts.some((act) => act.id === selectedActId)) {
            setSelectedActId(acts[0]?.id ?? null);
        }
    }, [acts, selectedActId]);

    const mapsInAct = useMemo(() => {
        if (!selectedActId) return [] as Array<{ id: string; name: string; sortOrder: number }>;
        const byId = new Map<string, { id: string; name: string; sortOrder: number }>();
        for (const entry of entries) {
            if (entry.actId !== selectedActId) continue;
            if (!byId.has(entry.mapId)) {
                byId.set(entry.mapId, {
                    id: entry.mapId,
                    name: entry.mapName,
                    sortOrder: entry.mapSortOrder,
                });
            }
        }
        return Array.from(byId.values()).sort((a, b) => {
            if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
            return a.name.localeCompare(b.name);
        });
    }, [entries, selectedActId]);

    useEffect(() => {
        if (mapsInAct.length === 0) {
            setSelectedMapId(null);
            return;
        }
        if (!selectedMapId || !mapsInAct.some((map) => map.id === selectedMapId)) {
            setSelectedMapId(mapsInAct[0]?.id ?? null);
        }
    }, [mapsInAct, selectedMapId]);

    const zonesInMap = useMemo(() => {
        if (!selectedMapId) return [] as StoryEntry[];
        return entries
            .filter((entry) => entry.mapId === selectedMapId)
            .sort((a, b) => {
                if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
                return a.zoneName.localeCompare(b.zoneName);
            });
    }, [entries, selectedMapId]);

    useEffect(() => {
        if (zonesInMap.length === 0) {
            setSelectedZoneId(null);
            return;
        }
        if (!selectedZoneId || !zonesInMap.some((zone) => zone.id === selectedZoneId)) {
            setSelectedZoneId(zonesInMap[0]?.id ?? null);
        }
    }, [zonesInMap, selectedZoneId]);

    const selectedEntry = useMemo(
        () => zonesInMap.find((entry) => entry.id === selectedZoneId) ?? null,
        [zonesInMap, selectedZoneId]
    );

    if (loading) {
        return <p className="text-sm text-ink-muted">{t("Cargando historia...", "Loading story...")}</p>;
    }

    if (error) {
        return (
            <p className="text-sm text-red-700 bg-red-100 border border-red-200 rounded-md px-3 py-2">
                {error}
            </p>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-ink">
                    {previewAsPlayer
                        ? t("Vista del jugador", "Player view")
                        : t("Historia de la campaña", "Campaign story")}
                </h2>
                <div className="rounded-xl border border-ring bg-panel/80 p-4 text-sm text-ink-muted">
                    {t(
                        "Todavia no hay contenido de historia visible para jugadores.",
                        "There is no player-visible story content yet."
                    )}
                </div>
            </div>
        );
    }

    const viewerDefaultColor =
        selectedEntry?.defaultTextColor && selectedEntry.defaultTextColor !== "theme"
            ? selectedEntry.defaultTextColor
            : "var(--ink)";

    return (
        <div className="space-y-3">
            <div>
                <h2 className="text-lg font-semibold text-ink">
                    {previewAsPlayer
                        ? t("Vista del jugador", "Player view")
                        : t("Historia de la campaña", "Campaign story")}
                </h2>
                <p className="text-xs text-ink-muted">
                    {t(
                        "Vista modular de solo lectura. Solo se muestra lo habilitado por el master.",
                        "Read-only modular view. Only content enabled by the DM is shown."
                    )}
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-3">
                <aside className="rounded-xl border border-ring bg-panel/80 p-3 space-y-3">
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                            {t("Actos", "Acts")}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {acts.map((act) => (
                                <button
                                    key={act.id}
                                    type="button"
                                    onClick={() => setSelectedActId(act.id)}
                                    className={`rounded-md border px-2 py-1 text-xs ${
                                        selectedActId === act.id
                                            ? "border-accent/60 bg-accent/10 text-ink"
                                            : "border-ring bg-panel/70 text-ink hover:bg-panel"
                                    }`}
                                >
                                    {`A${act.actNumber} · ${act.actTitle}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                            {t("Modulos", "Modules")}
                        </p>
                        <div className="space-y-1 max-h-[220px] overflow-y-auto styled-scrollbar pr-1">
                            {mapsInAct.map((map) => (
                                <button
                                    key={map.id}
                                    type="button"
                                    onClick={() => setSelectedMapId(map.id)}
                                    className={`w-full rounded-md border px-2 py-1.5 text-left text-xs ${
                                        selectedMapId === map.id
                                            ? "border-accent/60 bg-accent/10 text-ink"
                                            : "border-ring bg-panel/70 text-ink hover:bg-panel"
                                    }`}
                                >
                                    {map.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                            {t("Zonas visibles", "Visible zones")}
                        </p>
                        <div className="space-y-1 max-h-[280px] overflow-y-auto styled-scrollbar pr-1">
                            {zonesInMap.map((zone) => (
                                <button
                                    key={zone.id}
                                    type="button"
                                    onClick={() => setSelectedZoneId(zone.id)}
                                    className={`w-full rounded-md border px-2 py-1.5 text-left text-xs ${
                                        selectedZoneId === zone.id
                                            ? "border-accent/60 bg-accent/10 text-ink"
                                            : "border-ring bg-panel/70 text-ink hover:bg-panel"
                                    }`}
                                >
                                    {zone.zoneName}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                <section className="rounded-xl border border-ring bg-panel/80 p-3 space-y-2">
                    {!selectedEntry ? (
                        <p className="text-sm text-ink-muted">
                            {t("Selecciona una zona visible.", "Select a visible zone.")}
                        </p>
                    ) : (
                        <>
                            <div>
                                <p className="text-xs text-ink-muted">{selectedEntry.mapName}</p>
                                <h3 className="text-base font-semibold text-ink">{selectedEntry.zoneName}</h3>
                                <p className="text-xs text-ink-muted">{selectedEntry.nodeTitle}</p>
                                {selectedEntry.docTitle && (
                                    <p className="text-xs text-ink-muted mt-1">
                                        {selectedEntry.docTitle}
                                    </p>
                                )}
                            </div>

                            {selectedEntry.docHtml ? (
                                <article
                                    className="story-doc-view markdown rounded-lg border border-ring bg-panel/70 p-3 text-sm leading-6"
                                    style={{
                                        ["--story-default-color" as string]: viewerDefaultColor,
                                        color: "var(--story-default-color)",
                                    }}
                                    dangerouslySetInnerHTML={{ __html: selectedEntry.docHtml }}
                                />
                            ) : (
                                <p className="text-sm text-ink-muted">
                                    {t(
                                        "Sin descripcion publicada todavia.",
                                        "No published description yet."
                                    )}
                                </p>
                            )}
                        </>
                    )}
                </section>
            </div>

            <style jsx global>{`
                .story-doc-view [style*="color: rgb(0, 0, 0)"],
                .story-doc-view [style*="color:rgb(0,0,0)"],
                .story-doc-view [style*="color:#000"],
                .story-doc-view [style*="color: #000"],
                .story-doc-view [style*="color:#000000"],
                .story-doc-view [style*="color:#000000ff"],
                .story-doc-view [style*="color: rgb(255, 255, 255)"],
                .story-doc-view [style*="color:rgb(255,255,255)"],
                .story-doc-view [style*="color:#fff"],
                .story-doc-view [style*="color:#ffffff"],
                .story-doc-view [style*="color:#ffffffff"] {
                    color: var(--story-default-color) !important;
                }

                .story-doc-view font[color="black"],
                .story-doc-view font[color="#000"],
                .story-doc-view font[color="#000000"],
                .story-doc-view font[color="#000000ff"],
                .story-doc-view font[color="white"],
                .story-doc-view font[color="#fff"],
                .story-doc-view font[color="#ffffff"],
                .story-doc-view font[color="#ffffffff"] {
                    color: var(--story-default-color) !important;
                }
            `}</style>
        </div>
    );
}
