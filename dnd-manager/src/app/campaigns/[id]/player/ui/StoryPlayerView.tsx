"use client";

import {
    type MouseEvent as ReactMouseEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { tr } from "@/lib/i18n/translate";

type StoryPlayerViewProps = {
    campaignId: string;
    locale: string;
    previewAsPlayer?: boolean;
    initialNodeId?: string | null;
    initialActId?: string | null;
    reloadSignal?: number;
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
    sort_order: number;
};

type MapRow = {
    id: string;
    node_id: string | null;
    name: string;
    image_url: string;
    sort_order: number;
};

type ZoneRow = {
    id: string;
    map_id: string;
    node_id: string | null;
    target_node_id: string | null;
    name: string;
    shape_type: "polygon" | "rect" | "circle" | "ellipse" | "path";
    geometry: unknown;
    is_visible: boolean;
    action_type: "OPEN_NODE" | "OPEN_MAP" | "OPEN_URL" | "NONE";
    target_map_id: string | null;
    target_url: string | null;
    sort_order: number;
};

type LinkRow = {
    id: string;
    from_node_id: string;
    to_node_id: string;
    link_type: string;
    label: string | null;
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

type ZoneGeometry = {
    x: number;
    y: number;
    radius: number;
    color: string;
    icon: string;
};

type ViewState = {
    x: number;
    y: number;
    scale: number;
};

const BLANK_MAP_URL = "blank://default-map";
const STAGE_WIDTH = 3200;
const STAGE_HEIGHT = 2200;
const DEFAULT_ZONE_RADIUS = 54;
const DEFAULT_VIEW: ViewState = { x: 70, y: 60, scale: 1 };
const MIN_SCALE = 0.25;
const MAX_SCALE = 2.5;
const EDITOR_PANEL_DEFAULT_WIDTH = 640;
const EDITOR_PANEL_MIN_WIDTH = 320;
const EDITOR_PANEL_MAX_VIEWPORT_RATIO = 0.75;
const PLAYER_STORY_LAYOUT_KEY = "dnd-manager-player-story-layout-v1";

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function zoneNodeId(zone: ZoneRow): string | null {
    return zone.node_id ?? zone.target_node_id ?? null;
}

function resolveZoneNodeId(zone: ZoneRow, mapsById: Map<string, MapRow>): string | null {
    if (zone.node_id) return zone.node_id;
    if (zone.target_node_id) return zone.target_node_id;
    if (zone.target_map_id) {
        return mapsById.get(zone.target_map_id)?.node_id ?? null;
    }
    return null;
}

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

function parseZoneGeometry(geometry: unknown): ZoneGeometry {
    const fallback: ZoneGeometry = {
        x: STAGE_WIDTH / 2,
        y: STAGE_HEIGHT / 2,
        radius: DEFAULT_ZONE_RADIUS,
        color: "#4f46e5",
        icon: "*",
    };

    if (!geometry || typeof geometry !== "object") return fallback;

    const raw = geometry as Record<string, unknown>;
    const x = Number(raw.x);
    const y = Number(raw.y);
    const radius = Number(raw.radius);
    const color = typeof raw.color === "string" ? raw.color : fallback.color;
    const icon = typeof raw.icon === "string" && raw.icon.trim() ? raw.icon : fallback.icon;

    return {
        x: Number.isFinite(x) ? clamp(x, 0, STAGE_WIDTH) : fallback.x,
        y: Number.isFinite(y) ? clamp(y, 0, STAGE_HEIGHT) : fallback.y,
        radius: Number.isFinite(radius) ? clamp(radius, 16, 180) : fallback.radius,
        color,
        icon,
    };
}

function zoneLabelFontSize(radius: number, label: string): number {
    const textLength = Math.max(1, label.trim().length);
    const scaled = (radius * 1.05) / Math.sqrt(textLength);
    return clamp(Number(scaled.toFixed(1)), 14, 42);
}

function sortBySortOrderThenName(a: { sort_order: number; name: string }, b: { sort_order: number; name: string }) {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.name.localeCompare(b.name);
}

function sortByNodeOrderThenTitle(a: NodeRow, b: NodeRow) {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.title.localeCompare(b.title);
}

function toErrorMessage(error: unknown, fallback: string) {
    if (typeof error === "object" && error && "message" in error) {
        const message = String((error as { message?: unknown }).message ?? "");
        if (message) return message;
    }
    return fallback;
}

export default function StoryPlayerView({
    campaignId,
    locale,
    previewAsPlayer = false,
    initialNodeId = null,
    initialActId = null,
    reloadSignal = 0,
}: StoryPlayerViewProps) {
    const t = (es: string, en: string) => tr(locale, es, en);
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const viewRef = useRef<ViewState>(DEFAULT_VIEW);
    const panRef = useRef({
        active: false,
        startX: 0,
        startY: 0,
        originX: 0,
        originY: 0,
    });
    const editorResizeRef = useRef<{
        startX: number;
        startWidth: number;
    } | null>(null);
    const loadRequestRef = useRef(0);
    const appliedInitialContextKeyRef = useRef<string>("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const [acts, setActs] = useState<ActRow[]>([]);
    const [nodes, setNodes] = useState<NodeRow[]>([]);
    const [maps, setMaps] = useState<MapRow[]>([]);
    const [zones, setZones] = useState<ZoneRow[]>([]);
    const [links, setLinks] = useState<LinkRow[]>([]);
    const [docsByNodeId, setDocsByNodeId] = useState<Map<string, DocumentRow>>(new Map());

    const [currentActId, setCurrentActId] = useState<string | null>(null);
    const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
    const [currentMap, setCurrentMap] = useState<MapRow | null>(null);
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const [view, setView] = useState<ViewState>(DEFAULT_VIEW);
    const [isPanning, setIsPanning] = useState(false);
    const [isDarkTheme, setIsDarkTheme] = useState(false);
    const [editorPanelCollapsed, setEditorPanelCollapsed] = useState(false);
    const [editorPanelExpanded, setEditorPanelExpanded] = useState(false);
    const [editorPanelWidth, setEditorPanelWidth] = useState(EDITOR_PANEL_DEFAULT_WIDTH);
    const [isResizingEditorPanel, setIsResizingEditorPanel] = useState(false);

    const nodesById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
    const mapsById = useMemo(() => new Map(maps.map((map) => [map.id, map])), [maps]);

    const mapsByNodeId = useMemo(() => {
        const byNodeId = new Map<string, MapRow[]>();
        for (const map of maps) {
            if (!map.node_id) continue;
            const list = byNodeId.get(map.node_id) ?? [];
            list.push(map);
            byNodeId.set(map.node_id, list);
        }
        for (const list of byNodeId.values()) {
            list.sort((a, b) => sortBySortOrderThenName(a, b));
        }
        return byNodeId;
    }, [maps]);

    const zonesByMapId = useMemo(() => {
        const byMapId = new Map<string, ZoneRow[]>();
        for (const zone of zones) {
            const list = byMapId.get(zone.map_id) ?? [];
            list.push(zone);
            byMapId.set(zone.map_id, list);
        }
        for (const list of byMapId.values()) {
            list.sort((a, b) => sortBySortOrderThenName(a, b));
        }
        return byMapId;
    }, [zones]);

    const currentAct = currentActId ? acts.find((act) => act.id === currentActId) ?? null : null;

    const breadcrumbNodes = useMemo(() => {
        if (!currentNodeId) return [] as NodeRow[];
        const path: NodeRow[] = [];
        const visited = new Set<string>();
        let cursor: NodeRow | null = nodesById.get(currentNodeId) ?? null;

        while (cursor && !visited.has(cursor.id)) {
            visited.add(cursor.id);
            path.push(cursor);
            cursor = cursor.parent_id ? nodesById.get(cursor.parent_id) ?? null : null;
        }

        return path.reverse();
    }, [currentNodeId, nodesById]);

    const currentZones = useMemo(
        () => (currentMap ? zonesByMapId.get(currentMap.id) ?? [] : []),
        [currentMap?.id, zonesByMapId]
    );

    const mapConnections = useMemo(() => {
        const nodeIds = new Set(
            currentZones
                .map((zone) => resolveZoneNodeId(zone, mapsById))
                .filter((value): value is string => Boolean(value))
        );
        if (nodeIds.size < 2) return [] as LinkRow[];
        return links.filter(
            (link) => nodeIds.has(link.from_node_id) && nodeIds.has(link.to_node_id)
        );
    }, [currentZones, links, mapsById]);

    const selectedZone = selectedZoneId
        ? currentZones.find((zone) => zone.id === selectedZoneId) ?? null
        : null;

    const selectedZoneNodeId = selectedZone ? resolveZoneNodeId(selectedZone, mapsById) : null;
    const selectedZoneNode = selectedZoneNodeId ? nodesById.get(selectedZoneNodeId) ?? null : null;
    const selectedDocument = selectedZoneNodeId ? docsByNodeId.get(selectedZoneNodeId) ?? null : null;
    const selectedDocHtml = useMemo(() => extractDocHtml(selectedDocument), [selectedDocument]);

    const selectedConnectionNames = useMemo(() => {
        if (!selectedZoneNodeId || mapConnections.length === 0) return [] as string[];

        const zoneByNodeId = new Map<string, ZoneRow>();
        for (const zone of currentZones) {
            const nodeId = resolveZoneNodeId(zone, mapsById);
            if (!nodeId || zoneByNodeId.has(nodeId)) continue;
            zoneByNodeId.set(nodeId, zone);
        }

        const names = new Set<string>();
        for (const link of mapConnections) {
            if (link.from_node_id === selectedZoneNodeId) {
                const target = zoneByNodeId.get(link.to_node_id);
                if (target) names.add(target.name);
            } else if (link.to_node_id === selectedZoneNodeId) {
                const target = zoneByNodeId.get(link.from_node_id);
                if (target) names.add(target.name);
            }
        }

        return Array.from(names).sort((a, b) => a.localeCompare(b));
    }, [selectedZoneNodeId, mapConnections, currentZones, mapsById]);

    const renderedZones = useMemo(
        () => currentZones.map((zone) => ({ zone, geometry: parseZoneGeometry(zone.geometry) })),
        [currentZones]
    );

    const renderedConnectionLines = useMemo(() => {
        const byNodeId = new Map<string, { zone: ZoneRow; geometry: ZoneGeometry }>();
        for (const entry of renderedZones) {
            const nodeId = resolveZoneNodeId(entry.zone, mapsById);
            if (!nodeId) continue;
            if (!byNodeId.has(nodeId)) {
                byNodeId.set(nodeId, entry);
            }
        }

        const dedupe = new Set<string>();
        const lines: Array<{
            id: string;
            from: ZoneGeometry;
            to: ZoneGeometry;
        }> = [];

        for (const link of mapConnections) {
            const from = byNodeId.get(link.from_node_id);
            const to = byNodeId.get(link.to_node_id);
            if (!from || !to || from.zone.id === to.zone.id) continue;
            const key = [from.zone.id, to.zone.id].sort().join("::");
            if (dedupe.has(key)) continue;
            dedupe.add(key);
            lines.push({ id: key, from: from.geometry, to: to.geometry });
        }

        return lines;
    }, [renderedZones, mapConnections, mapsById]);

    const viewerDefaultColor = useMemo(() => {
        if (!selectedDocument || !selectedDocument.metadata || typeof selectedDocument.metadata !== "object") {
            return "var(--ink)";
        }
        const metadata = selectedDocument.metadata as Record<string, unknown>;
        const normalized = normalizeDocDefaultTextColor(metadata.story_default_text_color);
        return normalized !== "theme" ? normalized : "var(--ink)";
    }, [selectedDocument]);

    const blankMapStyle = useMemo(
        () => ({
            backgroundImage: isDarkTheme
                ? "radial-gradient(circle at 1px 1px, rgba(194,165,132,0.2) 1px, transparent 1px), linear-gradient(130deg, rgba(20,16,12,0.96), rgba(37,27,20,0.9) 52%, rgba(25,19,14,0.97))"
                : "radial-gradient(circle at 1px 1px, rgba(89,69,45,0.26) 1px, transparent 1px), linear-gradient(120deg, rgba(254,243,199,0.28), rgba(251,191,36,0.1))",
            backgroundSize: "28px 28px, auto",
        }),
        [isDarkTheme]
    );
    const showMapPanel = !editorPanelExpanded;
    const showEditorPanel = editorPanelExpanded || !editorPanelCollapsed;

    function findEntryNodeForAct(actId: string): NodeRow | null {
        const actNodes = nodes
            .filter((node) => node.act_id === actId && !node.is_hidden)
            .sort(sortByNodeOrderThenTitle);
        if (actNodes.length === 0) return null;

        const rootsWithMap = actNodes.filter(
            (node) => node.parent_id === null && mapsByNodeId.has(node.id)
        );
        if (rootsWithMap.length > 0) return rootsWithMap[0] ?? null;

        const roots = actNodes.filter((node) => node.parent_id === null);
        if (roots.length > 0) return roots[0] ?? null;

        const withMap = actNodes.filter((node) => mapsByNodeId.has(node.id));
        if (withMap.length > 0) return withMap[0] ?? null;

        return actNodes[0] ?? null;
    }

    const actEntries = useMemo(
        () =>
            acts.map((act) => ({
                act,
                entryNode: findEntryNodeForAct(act.id),
            })),
        [acts, nodes, mapsByNodeId]
    );

    function openNode(nodeId: string, explicitActId?: string) {
        const node = nodesById.get(nodeId) ?? null;
        if (!node || node.is_hidden) {
            setError(t("No se pudo abrir esa zona.", "Could not open that zone."));
            return;
        }

        const nodeMaps = mapsByNodeId.get(nodeId) ?? [];
        const map = nodeMaps[0] ?? null;

        setCurrentActId(explicitActId ?? node.act_id ?? null);
        setCurrentNodeId(nodeId);
        setCurrentMap(map);
        setSelectedZoneId(null);
        setView(DEFAULT_VIEW);

        if (!map) {
            setNotice(t("Este nodo no tiene mapa publicado.", "This node has no published map."));
            return;
        }
        setNotice(null);
        setError(null);
    }

    function openMap(mapId: string) {
        const map = maps.find((entry) => entry.id === mapId) ?? null;
        if (!map) {
            setError(t("No se pudo abrir ese mapa.", "Could not open that map."));
            return;
        }

        const node = map.node_id ? (nodesById.get(map.node_id) ?? null) : null;
        const nextActId = node?.act_id ?? currentActId ?? null;

        setCurrentActId(nextActId);
        setCurrentNodeId(map.node_id ?? null);
        setCurrentMap(map);
        setSelectedZoneId(null);
        setView(DEFAULT_VIEW);
        setNotice(null);
        setError(null);
    }

    function openAct(actId: string) {
        setError(null);
        const entryNode = findEntryNodeForAct(actId);
        if (!entryNode) {
            setCurrentActId(actId);
            setCurrentNodeId(null);
            setCurrentMap(null);
            setSelectedZoneId(null);
            setNotice(
                t(
                    "Este acto no tiene un mapa visible para jugadores.",
                    "This act has no player-visible map."
                )
            );
            return;
        }

        openNode(entryNode.id, actId);
    }

    function handleOpenZone(zone: ZoneRow) {
        if (zone.action_type === "OPEN_MAP" && zone.target_map_id) {
            openMap(zone.target_map_id);
            return;
        }

        if (zone.action_type === "OPEN_URL" && zone.target_url) {
            window.open(zone.target_url, "_blank", "noopener,noreferrer");
            return;
        }

        if (zone.action_type === "NONE") {
            setNotice(
                t(
                    "Esta zona no tiene navegacion configurada.",
                    "This zone has no configured navigation."
                )
            );
            return;
        }

        const nodeId = zone.target_node_id ?? zone.node_id;
        if (nodeId) {
            openNode(nodeId);
            return;
        }

        if (zone.target_map_id) {
            openMap(zone.target_map_id);
            return;
        }

        setNotice(
            t(
                "Esta zona no tiene un destino configurado.",
                "This zone has no configured destination."
            )
        );
    }

    function handleViewportMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
        if (event.button !== 2) return;
        event.preventDefault();
        panRef.current.active = true;
        panRef.current.startX = event.clientX;
        panRef.current.startY = event.clientY;
        panRef.current.originX = view.x;
        panRef.current.originY = view.y;
        setIsPanning(true);
    }

    function handleViewportMouseMove(event: ReactMouseEvent<HTMLDivElement>) {
        if (!panRef.current.active) return;
        event.preventDefault();
        const dx = event.clientX - panRef.current.startX;
        const dy = event.clientY - panRef.current.startY;
        setView((prev) => ({ ...prev, x: panRef.current.originX + dx, y: panRef.current.originY + dy }));
    }

    function handleViewportContextMenu(event: ReactMouseEvent<HTMLDivElement>) {
        event.preventDefault();
    }

    function handleViewportWheel(event: React.WheelEvent<HTMLDivElement>) {
        event.preventDefault();
        if (!viewportRef.current) return;

        const rect = viewportRef.current.getBoundingClientRect();
        const pointerX = event.clientX - rect.left;
        const pointerY = event.clientY - rect.top;

        setView((prev) => {
            const nextScale = clamp(prev.scale + (event.deltaY < 0 ? 0.08 : -0.08), MIN_SCALE, MAX_SCALE);
            if (nextScale === prev.scale) return prev;

            const worldX = (pointerX - prev.x) / prev.scale;
            const worldY = (pointerY - prev.y) / prev.scale;

            return {
                scale: nextScale,
                x: pointerX - worldX * nextScale,
                y: pointerY - worldY * nextScale,
            };
        });
    }

    function currentEditorMaxWidth() {
        if (typeof window === "undefined") {
            return EDITOR_PANEL_DEFAULT_WIDTH;
        }
        return Math.max(
            EDITOR_PANEL_MIN_WIDTH + 80,
            Math.floor(window.innerWidth * EDITOR_PANEL_MAX_VIEWPORT_RATIO)
        );
    }

    function beginEditorResize(startX: number, requestedWidth?: number) {
        const startWidth = clamp(
            requestedWidth ?? editorPanelWidth,
            EDITOR_PANEL_MIN_WIDTH,
            currentEditorMaxWidth()
        );
        setEditorPanelWidth(startWidth);
        editorResizeRef.current = {
            startX,
            startWidth,
        };
        setIsResizingEditorPanel(true);
    }

    function handleEditorResizerMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
        if (event.button !== 0) return;
        event.preventDefault();
        beginEditorResize(event.clientX);
    }

    function handleEditorRevealFromMapMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
        if (event.button !== 0) return;
        event.preventDefault();
        setEditorPanelCollapsed(false);
        setEditorPanelExpanded(false);
        beginEditorResize(event.clientX);
    }

    function handleMapRevealFromEditorMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
        if (event.button !== 0) return;
        event.preventDefault();
        setEditorPanelExpanded(false);
        setEditorPanelCollapsed(false);
        beginEditorResize(event.clientX);
    }

    async function loadVisibleStory() {
        const requestId = ++loadRequestRef.current;
        setLoading(true);
        setError(null);

        try {
            const zoneSelectColumns =
                "id, map_id, node_id, target_node_id, name, shape_type, geometry, is_visible, action_type, target_map_id, target_url, sort_order";

            const [actsRes, nodesRes, mapsRes, linksRes, zonesResWithTrash] = await Promise.all([
                supabase
                    .from("campaign_acts")
                    .select("id, title, act_number, sort_order")
                    .eq("campaign_id", campaignId)
                    .order("sort_order", { ascending: true })
                    .order("act_number", { ascending: true }),
                supabase
                    .from("campaign_story_nodes")
                    .select("id, act_id, parent_id, title, is_hidden, sort_order")
                    .eq("campaign_id", campaignId)
                    .eq("is_hidden", false)
                    .order("sort_order", { ascending: true })
                    .order("created_at", { ascending: true }),
                supabase
                    .from("campaign_maps")
                    .select("id, node_id, name, image_url, sort_order")
                    .eq("campaign_id", campaignId)
                    .order("sort_order", { ascending: true })
                    .order("created_at", { ascending: true }),
                supabase
                    .from("campaign_story_links")
                    .select("id, from_node_id, to_node_id, link_type, label, sort_order")
                    .eq("campaign_id", campaignId)
                    .order("sort_order", { ascending: true }),
                supabase
                    .from("campaign_map_zones")
                    .select(zoneSelectColumns)
                    .eq("campaign_id", campaignId)
                    .eq("is_visible", true)
                    .is("deleted_at", null)
                    .order("sort_order", { ascending: true }),
            ]);

            if (actsRes.error) throw actsRes.error;
            if (nodesRes.error) throw nodesRes.error;
            if (mapsRes.error) throw mapsRes.error;
            if (linksRes.error) throw linksRes.error;

            let zonesRaw = zonesResWithTrash.data;
            if (zonesResWithTrash.error) {
                const lowered = String(zonesResWithTrash.error.message ?? "").toLowerCase();
                const missingDeletedAt = lowered.includes("deleted_at");
                if (!missingDeletedAt) throw zonesResWithTrash.error;

                const zonesLegacyRes = await supabase
                    .from("campaign_map_zones")
                    .select(zoneSelectColumns)
                    .eq("campaign_id", campaignId)
                    .eq("is_visible", true)
                    .order("sort_order", { ascending: true });

                if (zonesLegacyRes.error) throw zonesLegacyRes.error;
                zonesRaw = zonesLegacyRes.data;
            }

            const nextActs = (actsRes.data ?? []) as ActRow[];
            const nextNodes = (nodesRes.data ?? []) as NodeRow[];
            const nextMaps = (mapsRes.data ?? []) as MapRow[];
            const nextLinks = (linksRes.data ?? []) as LinkRow[];
            const allZones = (zonesRaw ?? []) as ZoneRow[];
            const nextMapsById = new Map(nextMaps.map((map) => [map.id, map]));

            const mapIdSet = new Set(nextMaps.map((map) => map.id));
            const nextZones = allZones
                .filter((zone) => zone.is_visible)
                .filter((zone) => mapIdSet.has(zone.map_id))
                .sort((a, b) => sortBySortOrderThenName(a, b));

            const docNodeIds = Array.from(
                new Set(
                    nextZones
                        .map((zone) => resolveZoneNodeId(zone, nextMapsById))
                        .filter((value): value is string => Boolean(value))
                )
            );

            const nextDocsByNodeId = new Map<string, DocumentRow>();
            if (docNodeIds.length > 0) {
                let docsQuery: any = supabase
                    .from("campaign_documents")
                    .select("id, node_id, title, visibility, content, plain_text, metadata, updated_at")
                    .eq("campaign_id", campaignId)
                    .in("node_id", docNodeIds)
                    .order("updated_at", { ascending: false });
                if (!previewAsPlayer) {
                    docsQuery = docsQuery.in("visibility", ["CAMPAIGN", "PUBLIC"]);
                }

                const docsRes = await docsQuery;

                if (docsRes.error) throw docsRes.error;
                for (const raw of (docsRes.data ?? []) as DocumentRow[]) {
                    if (!raw.node_id) continue;
                    if (!nextDocsByNodeId.has(raw.node_id)) {
                        nextDocsByNodeId.set(raw.node_id, raw);
                    }
                }
            }

            if (loadRequestRef.current !== requestId) return;

            setActs(nextActs);
            setNodes(nextNodes);
            setMaps(nextMaps);
            setZones(nextZones);
            setLinks(nextLinks);
            setDocsByNodeId(nextDocsByNodeId);
            setNotice(null);
        } catch (err) {
            if (loadRequestRef.current !== requestId) return;
            setError(
                toErrorMessage(
                    err,
                    t("No se pudo cargar la historia visible.", "Could not load visible story.")
                )
            );
        } finally {
            if (loadRequestRef.current === requestId) {
                setLoading(false);
            }
        }
    }

    useEffect(() => {
        appliedInitialContextKeyRef.current = "";
        void loadVisibleStory();
        return () => {
            loadRequestRef.current += 1;
        };
    }, [campaignId, locale, reloadSignal, previewAsPlayer]);

    useEffect(() => {
        viewRef.current = view;
    }, [view]);

    useEffect(() => {
        function onWindowMouseUp() {
            if (!panRef.current.active) return;
            panRef.current.active = false;
            setIsPanning(false);
        }

        window.addEventListener("mouseup", onWindowMouseUp);
        return () => window.removeEventListener("mouseup", onWindowMouseUp);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        const root = window.document.documentElement;
        const syncTheme = () => {
            setIsDarkTheme(root.dataset.theme === "dark");
        };
        syncTheme();
        const observer = new MutationObserver(syncTheme);
        observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!isResizingEditorPanel) return undefined;

        function handleMouseMove(event: MouseEvent) {
            const session = editorResizeRef.current;
            if (!session || typeof window === "undefined") return;

            const delta = session.startX - event.clientX;
            const maxWidth = Math.max(
                EDITOR_PANEL_MIN_WIDTH + 80,
                Math.floor(window.innerWidth * EDITOR_PANEL_MAX_VIEWPORT_RATIO)
            );

            setEditorPanelWidth(
                clamp(session.startWidth + delta, EDITOR_PANEL_MIN_WIDTH, maxWidth)
            );
        }

        function handleMouseUp() {
            setIsResizingEditorPanel(false);
            editorResizeRef.current = null;
        }

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizingEditorPanel]);

    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        if (!isResizingEditorPanel) return undefined;

        const previousCursor = window.document.body.style.cursor;
        const previousUserSelect = window.document.body.style.userSelect;
        window.document.body.style.cursor = "col-resize";
        window.document.body.style.userSelect = "none";

        return () => {
            window.document.body.style.cursor = previousCursor;
            window.document.body.style.userSelect = previousUserSelect;
        };
    }, [isResizingEditorPanel]);

    useEffect(() => {
        if (typeof window === "undefined") return undefined;

        const clampEditorWidthToViewport = () => {
            const maxWidth = Math.max(
                EDITOR_PANEL_MIN_WIDTH + 80,
                Math.floor(window.innerWidth * EDITOR_PANEL_MAX_VIEWPORT_RATIO)
            );
            setEditorPanelWidth((prev) =>
                clamp(prev, EDITOR_PANEL_MIN_WIDTH, maxWidth)
            );
        };

        clampEditorWidthToViewport();
        window.addEventListener("resize", clampEditorWidthToViewport);
        return () => {
            window.removeEventListener("resize", clampEditorWidthToViewport);
        };
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const raw = window.localStorage.getItem(PLAYER_STORY_LAYOUT_KEY);
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw) as {
                editorPanelWidth?: number;
                editorPanelCollapsed?: boolean;
                editorPanelExpanded?: boolean;
            };

            if (typeof parsed.editorPanelWidth === "number" && Number.isFinite(parsed.editorPanelWidth)) {
                const maxWidth = Math.max(
                    EDITOR_PANEL_MIN_WIDTH + 80,
                    Math.floor(window.innerWidth * EDITOR_PANEL_MAX_VIEWPORT_RATIO)
                );
                setEditorPanelWidth(clamp(parsed.editorPanelWidth, EDITOR_PANEL_MIN_WIDTH, maxWidth));
            }
            if (typeof parsed.editorPanelCollapsed === "boolean") {
                setEditorPanelCollapsed(parsed.editorPanelCollapsed);
            }
            if (typeof parsed.editorPanelExpanded === "boolean") {
                setEditorPanelExpanded(parsed.editorPanelExpanded);
            }
        } catch {
            // Ignore corrupt local storage payload.
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const payload = {
            editorPanelWidth,
            editorPanelCollapsed,
            editorPanelExpanded,
        };
        window.localStorage.setItem(PLAYER_STORY_LAYOUT_KEY, JSON.stringify(payload));
    }, [editorPanelWidth, editorPanelCollapsed, editorPanelExpanded]);

    useEffect(() => {
        if (loading) return;

        const initialContextKey = `${reloadSignal}:${initialActId ?? ""}:${initialNodeId ?? ""}`;
        const shouldApplyInitialContext =
            Boolean(initialNodeId)
            && appliedInitialContextKeyRef.current !== initialContextKey;

        if (shouldApplyInitialContext && initialNodeId && nodesById.has(initialNodeId)) {
            openNode(initialNodeId, initialActId ?? undefined);
            appliedInitialContextKeyRef.current = initialContextKey;
            return;
        }
        if (shouldApplyInitialContext) {
            appliedInitialContextKeyRef.current = initialContextKey;
        }

        const firstAvailableAct = actEntries.find((entry) => entry.entryNode)?.act.id ?? null;
        if (!firstAvailableAct) {
            setCurrentActId(null);
            setCurrentNodeId(null);
            setCurrentMap(null);
            setSelectedZoneId(null);
            return;
        }

        const currentEntry =
            currentActId
                ? actEntries.find((entry) => entry.act.id === currentActId && entry.entryNode)
                : null;

        if (!currentEntry) {
            openAct(firstAvailableAct);
            return;
        }

        if (!currentNodeId || !nodesById.has(currentNodeId)) {
            openAct(currentEntry.act.id);
            return;
        }

        const node = nodesById.get(currentNodeId);
        if (!node || node.act_id !== currentEntry.act.id) {
            openAct(currentEntry.act.id);
            return;
        }

        const expectedMap = (mapsByNodeId.get(node.id) ?? [])[0] ?? null;
        if ((expectedMap?.id ?? null) !== (currentMap?.id ?? null)) {
            openNode(node.id, currentEntry.act.id);
        }
    }, [
        loading,
        actEntries,
        currentActId,
        currentNodeId,
        currentMap?.id,
        nodesById,
        mapsByNodeId,
        initialNodeId,
        initialActId,
        reloadSignal,
    ]);

    useEffect(() => {
        if (!selectedZoneId) return;
        if (currentZones.some((zone) => zone.id === selectedZoneId)) return;
        setSelectedZoneId(null);
    }, [selectedZoneId, currentZones]);

    if (loading) {
        return <p className="text-sm text-ink-muted">{t("Cargando historia...", "Loading story...")}</p>;
    }

    if (error) {
        return (
            <div className="space-y-2">
                <p className="text-sm text-red-700 bg-red-100 border border-red-200 rounded-md px-3 py-2">
                    {error}
                </p>
                <button
                    type="button"
                    onClick={() => void loadVisibleStory()}
                    className="inline-flex items-center gap-1 rounded-md border border-ring bg-panel/80 px-2.5 py-1.5 text-xs hover:bg-panel"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {t("Reintentar", "Retry")}
                </button>
            </div>
        );
    }

    if (actEntries.length === 0 || !actEntries.some((entry) => entry.entryNode)) {
        return (
            <div className="space-y-2">
                <h2 className="text-lg font-semibold text-ink">
                    {previewAsPlayer
                        ? t("Vista del jugador", "Player view")
                        : t("Historia de la campana", "Campaign story")}
                </h2>
                <div className="rounded-xl border border-ring bg-panel/80 p-4 text-sm text-ink-muted">
                    {t(
                        "Todavia no hay modulos visibles para jugadores.",
                        "There are no player-visible modules yet."
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 className="text-lg font-semibold text-ink">
                        {previewAsPlayer
                            ? t("Vista del jugador", "Player view")
                            : t("Historia de la campana", "Campaign story")}
                    </h2>
                    <p className="text-xs text-ink-muted">
                        {t(
                            "Vista de solo lectura con mapas, zonas y conexiones publicadas por el master.",
                            "Read-only view with maps, zones, and connections published by the DM."
                        )}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setEditorPanelCollapsed((prev) => {
                                const next = !prev;
                                if (next) setEditorPanelExpanded(false);
                                return next;
                            });
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-ring bg-panel/80 px-2.5 py-1.5 text-xs hover:bg-panel"
                    >
                        {editorPanelCollapsed
                            ? t("Mostrar panel", "Show panel")
                            : t("Ocultar panel", "Hide panel")}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setEditorPanelExpanded((prev) => {
                                const next = !prev;
                                if (next) setEditorPanelCollapsed(false);
                                return next;
                            });
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-ring bg-panel/80 px-2.5 py-1.5 text-xs hover:bg-panel"
                    >
                        {editorPanelExpanded
                            ? t("Mostrar mapa", "Show map")
                            : t("Maximizar panel", "Maximize panel")}
                    </button>
                    {showMapPanel && showEditorPanel && (
                        <button
                            type="button"
                            onClick={() => setEditorPanelWidth(EDITOR_PANEL_DEFAULT_WIDTH)}
                            className="inline-flex items-center gap-1 rounded-md border border-ring bg-panel/80 px-2.5 py-1.5 text-xs hover:bg-panel"
                        >
                            {t("Reiniciar ancho", "Reset width")}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => void loadVisibleStory()}
                        className="inline-flex items-center gap-1 rounded-md border border-ring bg-panel/80 px-2.5 py-1.5 text-xs hover:bg-panel"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        {t("Refrescar", "Refresh")}
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
                {actEntries.map((entry) => {
                    const isSelected = currentActId === entry.act.id;
                    return (
                        <button
                            key={entry.act.id}
                            type="button"
                            onClick={() => openAct(entry.act.id)}
                            disabled={!entry.entryNode}
                            className={`rounded-md border px-2 py-1 text-xs ${
                                isSelected
                                    ? "border-accent/60 bg-accent/10 text-ink"
                                    : "border-ring bg-panel/80 text-ink hover:bg-panel"
                            } disabled:cursor-not-allowed disabled:opacity-45`}
                        >
                            {`A${entry.act.act_number} · ${entry.act.title}`}
                        </button>
                    );
                })}
            </div>

            {breadcrumbNodes.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    {breadcrumbNodes.map((node, index) => (
                        <div key={node.id} className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => openNode(node.id, node.act_id ?? undefined)}
                                className="rounded-md border border-ring bg-panel/80 px-2 py-1 hover:bg-panel"
                            >
                                {node.title}
                            </button>
                            {index < breadcrumbNodes.length - 1 && <span>/</span>}
                        </div>
                    ))}
                </div>
            )}

            {notice && (
                <p className="text-sm text-amber-800 bg-amber-100 border border-amber-200 rounded-md px-3 py-2">
                    {notice}
                </p>
            )}

            <div
                className={`grid grid-cols-1 gap-3 items-start ${
                    showMapPanel && showEditorPanel
                        ? "xl:grid-cols-[minmax(0,1fr)_12px_minmax(320px,var(--story-editor-width))]"
                        : ""
                }`}
                style={
                    showMapPanel && showEditorPanel
                        ? { ["--story-editor-width" as string]: `${editorPanelWidth}px` }
                        : undefined
                }
            >
                {showMapPanel && (
                <section className="space-y-2 min-w-0">
                    <div className="rounded-xl border border-ring bg-panel/80 px-3 py-2">
                        <p className="text-xs text-ink-muted">{currentAct ? `ACTO ${currentAct.act_number}` : ""}</p>
                        <h3 className="text-sm font-semibold text-ink">
                            {currentMap?.name ?? t("Mapa no disponible", "Map not available")}
                        </h3>
                    </div>

                    {!currentMap ? (
                        <div className="rounded-xl border border-ring bg-panel/80 p-4 text-sm text-ink-muted">
                            {t(
                                "El modulo seleccionado no tiene mapa publicado.",
                                "The selected module has no published map."
                            )}
                        </div>
                    ) : (
                        <div
                            ref={viewportRef}
                            onContextMenu={handleViewportContextMenu}
                            onMouseDown={handleViewportMouseDown}
                            onMouseMove={handleViewportMouseMove}
                            onWheel={handleViewportWheel}
                            className={`relative h-[calc(100vh-17rem)] min-h-[520px] overflow-hidden rounded-xl border border-ring bg-panel/80 ${
                                isPanning ? "cursor-grabbing" : "cursor-default"
                            }`}
                        >
                            <div
                                className="absolute left-0 top-0 origin-top-left"
                                style={{
                                    width: `${STAGE_WIDTH}px`,
                                    height: `${STAGE_HEIGHT}px`,
                                    transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                                }}
                            >
                                {currentMap.image_url && currentMap.image_url !== BLANK_MAP_URL ? (
                                    <img
                                        src={currentMap.image_url}
                                        alt={currentMap.name}
                                        draggable={false}
                                        className="absolute inset-0 h-full w-full select-none object-cover pointer-events-none"
                                    />
                                ) : (
                                    <div className="absolute inset-0" style={blankMapStyle} />
                                )}

                                {renderedConnectionLines.length > 0 && (
                                    <svg
                                        className="absolute inset-0 pointer-events-none"
                                        width={STAGE_WIDTH}
                                        height={STAGE_HEIGHT}
                                        viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`}
                                        preserveAspectRatio="none"
                                    >
                                        {renderedConnectionLines.map((line) => (
                                            <line
                                                key={line.id}
                                                x1={line.from.x}
                                                y1={line.from.y}
                                                x2={line.to.x}
                                                y2={line.to.y}
                                                stroke="rgba(250, 204, 21, 0.9)"
                                                strokeWidth={4}
                                                strokeLinecap="round"
                                                strokeDasharray="9 7"
                                            />
                                        ))}
                                    </svg>
                                )}

                                {renderedZones.map(({ zone, geometry }) => {
                                    const isSelected = selectedZoneId === zone.id;
                                    const diameter = geometry.radius * 2;
                                    const label = geometry.icon || "*";
                                    const labelFontSize = zoneLabelFontSize(geometry.radius, label);

                                    return (
                                        <button
                                            key={zone.id}
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setSelectedZoneId(zone.id);
                                            }}
                                            onDoubleClick={(event) => {
                                                event.stopPropagation();
                                                handleOpenZone(zone);
                                            }}
                                            className={`absolute flex items-center justify-center rounded-full border-2 transition-transform ${
                                                isSelected
                                                    ? "scale-105 border-white shadow-[0_0_0_3px_rgba(245,158,11,0.7)]"
                                                    : "border-white/80"
                                            } cursor-pointer`}
                                            style={{
                                                left: `${geometry.x - geometry.radius}px`,
                                                top: `${geometry.y - geometry.radius}px`,
                                                width: `${diameter}px`,
                                                height: `${diameter}px`,
                                                background: geometry.color,
                                                color: "white",
                                                fontSize: `${labelFontSize}px`,
                                                lineHeight: 1,
                                            }}
                                            title={`${zone.name} (${t("Doble clic para entrar", "Double click to enter")})`}
                                        >
                                            <span>{label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-md border border-ring/70 bg-black/45 px-3 py-2 text-xs text-amber-100">
                                {t(
                                    "Clic derecho + arrastrar: mover mapa | Rueda: zoom | Clic en zona: ver datos | Doble clic en zona: entrar",
                                    "Right-click + drag: pan | Wheel: zoom | Click zone: view details | Double click zone: enter"
                                )}
                            </div>

                            {!showEditorPanel && (
                                <div
                                    role="separator"
                                    aria-orientation="vertical"
                                    onMouseDown={handleEditorRevealFromMapMouseDown}
                                    className="absolute right-2 top-1/2 z-20 hidden h-28 w-3 -translate-y-1/2 cursor-col-resize items-center justify-center rounded-md border border-ring/70 bg-panel/70 hover:bg-panel/90 xl:flex"
                                    title={t(
                                        "Arrastra hacia la izquierda para mostrar el panel",
                                        "Drag left to reveal panel"
                                    )}
                                >
                                    <span className="h-12 w-1 rounded-full bg-ring/80" />
                                </div>
                            )}
                        </div>
                    )}
                </section>
                )}

                {showMapPanel && showEditorPanel && (
                <div
                    role="separator"
                    aria-orientation="vertical"
                    onMouseDown={handleEditorResizerMouseDown}
                    className={`hidden xl:flex h-[calc(100vh-17rem)] min-h-[520px] items-center justify-center rounded-md border border-ring/60 bg-panel/50 ${
                        isResizingEditorPanel ? "cursor-col-resize" : "cursor-col-resize hover:bg-panel/80"
                    }`}
                    title={t("Arrastra para ajustar el ancho del panel", "Drag to resize panel width")}
                >
                    <span className="h-20 w-1 rounded-full bg-ring/80" />
                </div>
                )}

                {showEditorPanel && (
                <aside className="relative rounded-xl border border-ring bg-panel/80 p-3 space-y-2 overflow-y-auto styled-scrollbar max-h-[calc(100vh-10rem)] xl:h-[calc(100vh-17rem)] xl:min-h-[520px]">
                    {!showMapPanel && (
                        <div
                            role="separator"
                            aria-orientation="vertical"
                            onMouseDown={handleMapRevealFromEditorMouseDown}
                            className="absolute left-2 top-1/2 z-20 hidden h-28 w-3 -translate-y-1/2 cursor-col-resize items-center justify-center rounded-md border border-ring/70 bg-panel/70 hover:bg-panel/90 xl:flex"
                            title={t(
                                "Arrastra hacia la derecha para mostrar el mapa",
                                "Drag right to reveal map"
                            )}
                        >
                            <span className="h-12 w-1 rounded-full bg-ring/80" />
                        </div>
                    )}
                    {!selectedZone ? (
                        <p className="text-sm text-ink-muted">
                            {t(
                                "Haz clic en un modulo para ver sus datos. Doble clic para entrar en su submapa.",
                                "Click a module to view details. Double click to enter its submap."
                            )}
                        </p>
                    ) : (
                        <>
                            <div>
                                <p className="text-xs text-ink-muted">{currentMap?.name}</p>
                                <h3 className="text-base font-semibold text-ink">{selectedZone.name}</h3>
                                <p className="text-xs text-ink-muted">
                                    {selectedZoneNode?.title ?? t("Zona", "Zone")}
                                </p>
                                {selectedDocument?.title && (
                                    <p className="text-xs text-ink-muted mt-1">{selectedDocument.title}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                                    {t("Conexiones visibles", "Visible connections")}
                                </p>
                                {selectedConnectionNames.length === 0 ? (
                                    <p className="text-xs text-ink-muted">
                                        {t("Sin conexiones en este mapa.", "No connections in this map.")}
                                    </p>
                                ) : (
                                    <div className="flex flex-wrap gap-1">
                                        {selectedConnectionNames.map((name) => (
                                            <span
                                                key={name}
                                                className="rounded-md border border-ring bg-panel/70 px-2 py-1 text-[11px] text-ink"
                                            >
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedDocHtml ? (
                                <article
                                    className="story-doc-view markdown rounded-lg border border-ring bg-panel/70 p-3 text-sm leading-6"
                                    style={{
                                        ["--story-default-color" as string]: viewerDefaultColor,
                                        color: "var(--story-default-color)",
                                    }}
                                    dangerouslySetInnerHTML={{ __html: selectedDocHtml }}
                                />
                            ) : (
                                <p className="text-sm text-ink-muted">
                                    {t("Sin descripcion publicada todavia.", "No published description yet.")}
                                </p>
                            )}
                        </>
                    )}
                </aside>
                )}
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
