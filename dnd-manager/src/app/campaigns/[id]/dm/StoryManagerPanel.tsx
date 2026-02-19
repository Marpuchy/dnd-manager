"use client";

import {
    forwardRef,
    type ChangeEvent,
    type MouseEvent as ReactMouseEvent,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ArrowLeft,
    ExternalLink,
    Link2,
    Plus,
    Save,
    Trash2,
    Upload,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { tr } from "@/lib/i18n/translate";
import StoryPlayerView from "../player/ui/StoryPlayerView";

type StoryManagerPanelProps = {
    campaignId: string;
    locale: string;
};

type StoryNodeType =
    | "WORLD"
    | "MODULE"
    | "REGION"
    | "CITY"
    | "DISTRICT"
    | "LOCATION"
    | "DUNGEON"
    | "SCENE"
    | "EVENT"
    | "NPC"
    | "FACTION"
    | "QUEST"
    | "ITEM"
    | "NOTE"
    | "CUSTOM";

type DocumentType =
    | "LORE"
    | "SESSION_SCRIPT"
    | "HANDOUT"
    | "GM_ONLY"
    | "PLAYER_NOTE"
    | "CUSTOM";

type DocumentVisibility = "DM_ONLY" | "CAMPAIGN" | "PUBLIC";

type ActRow = {
    id: string;
    campaign_id: string;
    title: string;
    act_number: number;
    sort_order: number;
};

type NodeRow = {
    id: string;
    campaign_id: string;
    act_id: string | null;
    parent_id: string | null;
    node_type: StoryNodeType;
    title: string;
    slug: string | null;
    sort_order: number;
    summary: string | null;
};

type MapRow = {
    id: string;
    campaign_id: string;
    node_id: string | null;
    name: string;
    image_url: string;
    sort_order: number;
};

type ZoneRow = {
    id: string;
    campaign_id: string;
    map_id: string;
    node_id: string | null;
    name: string;
    shape_type: "polygon" | "rect" | "circle" | "ellipse" | "path";
    geometry: unknown;
    is_visible: boolean;
    action_type: "OPEN_NODE" | "OPEN_MAP" | "OPEN_URL" | "NONE";
    target_node_id: string | null;
    target_map_id: string | null;
    target_url: string | null;
    sort_order: number;
};

type DocumentRow = {
    id: string;
    campaign_id: string;
    node_id: string | null;
    title: string;
    doc_type: DocumentType;
    visibility: DocumentVisibility;
    editor_format: string;
    content: unknown;
    plain_text: string;
    latest_revision: number;
    metadata: unknown;
};

type LinkRow = {
    id: string;
    campaign_id: string;
    from_node_id: string;
    to_node_id: string;
    link_type: string;
    label: string | null;
    sort_order: number;
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

type MutationOptions = {
    silent?: boolean;
};

type SaveHandlerOptions = {
    silent?: boolean;
};

const BLANK_MAP_URL = "blank://default-map";
const STAGE_WIDTH = 3200;
const STAGE_HEIGHT = 2200;
const DEFAULT_ZONE_RADIUS = 54;
const INITIAL_MAP_SCALE = 0.5;
const FALLBACK_VIEWPORT_WIDTH = 1400;
const FALLBACK_VIEWPORT_HEIGHT = 900;
const DEFAULT_VIEW: ViewState = {
    x: (FALLBACK_VIEWPORT_WIDTH - STAGE_WIDTH * INITIAL_MAP_SCALE) / 2,
    y: (FALLBACK_VIEWPORT_HEIGHT - STAGE_HEIGHT * INITIAL_MAP_SCALE) / 2,
    scale: INITIAL_MAP_SCALE,
};
const MIN_SCALE = 0.25;
const MAX_SCALE = 2.5;
const MAX_MAP_IMAGE_BYTES = 50 * 1024 * 1024;
const EDITOR_PANEL_DEFAULT_WIDTH = 640;
const EDITOR_PANEL_MIN_WIDTH = 320;
const EDITOR_PANEL_MAX_VIEWPORT_RATIO = 0.75;
const STORY_MANAGER_GLOBAL_STYLES = `
    .story-manager-surface button:not(:disabled):not(.story-zone-node) {
        transition:
            transform 160ms ease,
            box-shadow 220ms ease,
            border-color 220ms ease,
            background-color 220ms ease,
            color 220ms ease,
            opacity 220ms ease,
            filter 220ms ease;
    }

    .story-manager-surface button:not(:disabled):not(.story-zone-node):hover {
        transform: translateY(-1px);
        border-color: color-mix(in oklab, var(--accent), var(--ring) 58%);
        box-shadow: 0 10px 24px -18px color-mix(in oklab, var(--ink), transparent 42%);
    }

    .story-manager-surface .story-zone-node {
        transition:
            transform 150ms ease,
            box-shadow 200ms ease,
            filter 200ms ease,
            opacity 200ms ease;
    }

    .story-manager-surface .story-zone-node:hover {
        filter: brightness(1.06) saturate(1.08);
    }

    .story-manager-surface :is(input:not([type="checkbox"]):not([type="range"]):not([type="color"]), select, textarea) {
        transition:
            border-color 200ms ease,
            background-color 200ms ease,
            box-shadow 200ms ease;
    }

    .story-manager-surface :is(input:not([type="checkbox"]):not([type="range"]):not([type="color"]), select, textarea):hover {
        border-color: color-mix(in oklab, var(--accent), var(--ring) 62%);
        background-color: color-mix(in oklab, var(--panel), white 50%);
    }

    .story-manager-surface :is(input:not([type="checkbox"]):not([type="range"]):not([type="color"]), select, textarea):focus-visible {
        box-shadow: 0 0 0 2px color-mix(in oklab, var(--accent), transparent 72%);
    }

    .story-manager-surface :is(div, section, aside, article).rounded-xl.border,
    .story-manager-surface :is(div, section, aside, article).rounded-md.border {
        transition:
            border-color 220ms ease,
            box-shadow 220ms ease,
            background-color 220ms ease;
    }

    .story-manager-surface :is(div, section, aside, article).rounded-xl.border:hover,
    .story-manager-surface :is(div, section, aside, article).rounded-md.border:hover {
        border-color: color-mix(in oklab, var(--accent), var(--ring) 72%);
        box-shadow: 0 14px 30px -24px color-mix(in oklab, var(--ink), transparent 38%);
    }

    .story-manager-surface .story-map-canvas {
        overflow: hidden;
        isolation: isolate;
        border-radius: 12px;
        clip-path: polygon(1.8% 2.4%, 5.9% 1.7%, 10.8% 2.3%, 15.9% 1.6%, 21.7% 2.5%, 28.4% 1.4%, 35.6% 2.2%, 43.1% 1.5%, 50.4% 2.6%, 58.3% 1.3%, 66.1% 2.4%, 73.8% 1.6%, 81.4% 2.5%, 88.4% 1.4%, 94.1% 2.3%, 97.7% 1.9%, 98.6% 6.8%, 97.9% 13.4%, 98.8% 21.7%, 97.8% 30.6%, 98.9% 40.5%, 97.7% 50.2%, 98.8% 60.8%, 97.9% 70.6%, 98.7% 80.7%, 97.6% 89.4%, 98.4% 95.2%, 97.1% 98.1%, 92.1% 98.8%, 86.2% 97.7%, 79.3% 98.9%, 72.5% 97.8%, 65.6% 99.1%, 58.7% 97.9%, 51.6% 99.2%, 44.8% 97.8%, 38.1% 99%, 31.2% 97.7%, 24.5% 98.8%, 18.6% 97.6%, 12.5% 98.7%, 7% 97.9%, 2.8% 98.5%, 1.4% 93.6%, 2.3% 85.8%, 1.2% 77.9%, 2.4% 68.6%, 1.1% 59.8%, 2.5% 50.6%, 1.3% 41.2%, 2.4% 31.7%, 1.2% 22.9%, 2.3% 14.1%, 1.4% 6.7%);
        background: color-mix(in oklab, var(--panel), #d9bb8b 16%);
        box-shadow: 0 18px 38px -30px rgba(35, 20, 8, 0.78);
    }

    .story-manager-surface .story-map-base {
        filter:
            sepia(var(--story-map-sepia, 0.24))
            saturate(var(--story-map-saturate, 0.88))
            contrast(var(--story-map-contrast, 1.05))
            brightness(var(--story-map-brightness, 1));
    }

    .story-manager-surface .story-map-aging-overlay {
        pointer-events: none;
        position: absolute;
        inset: 0;
        background-image:
            radial-gradient(circle at 11% 9%, rgba(255, 244, 219, 0.38), transparent 34%),
            radial-gradient(circle at 87% 82%, rgba(79, 49, 24, 0.24), transparent 40%),
            radial-gradient(circle at 48% 48%, rgba(111, 76, 42, 0.12), transparent 62%),
            repeating-linear-gradient(23deg, rgba(98, 66, 36, 0.055) 0 2px, rgba(252, 244, 224, 0.042) 2px 4px),
            radial-gradient(circle at 2px 2px, rgba(97, 64, 32, 0.11) 1px, transparent 1.9px);
        background-size: auto, auto, auto, auto, 24px 24px;
        mix-blend-mode: multiply;
        opacity: var(--story-map-overlay-opacity, 0.56);
    }

    .story-manager-surface .story-map-edge-overlay {
        pointer-events: none;
        position: absolute;
        inset: 0;
        box-shadow:
            inset 0 0 0 1px rgba(105, 71, 37, 0.42),
            inset 0 0 28px rgba(79, 51, 26, 0.26),
            inset 0 0 86px rgba(45, 28, 12, 0.2),
            0 16px 38px -28px rgba(37, 22, 10, 0.8);
    }

    .story-manager-surface .story-map-edge-overlay::before {
        content: "";
        position: absolute;
        inset: 0;
        background:
            radial-gradient(120% 18% at 50% -2%, rgba(255, 242, 213, 0.34), transparent 72%),
            radial-gradient(120% 18% at 50% 102%, rgba(79, 49, 24, 0.3), transparent 72%),
            radial-gradient(18% 120% at -2% 50%, rgba(255, 241, 214, 0.24), transparent 70%),
            radial-gradient(18% 120% at 102% 50%, rgba(73, 46, 23, 0.28), transparent 72%),
            radial-gradient(20px 14px at 9% 4%, rgba(255, 246, 227, 0.42) 12%, transparent 74%),
            radial-gradient(26px 16px at 27% 2%, rgba(255, 237, 206, 0.32) 10%, transparent 76%),
            radial-gradient(22px 15px at 47% 3%, rgba(255, 245, 220, 0.38) 12%, transparent 75%),
            radial-gradient(24px 16px at 69% 2%, rgba(255, 234, 201, 0.3) 10%, transparent 76%),
            radial-gradient(20px 14px at 88% 3%, rgba(255, 243, 215, 0.34) 12%, transparent 75%),
            radial-gradient(18px 14px at 6% 96%, rgba(81, 50, 24, 0.26) 10%, transparent 76%),
            radial-gradient(24px 16px at 24% 98%, rgba(77, 48, 23, 0.3) 10%, transparent 76%),
            radial-gradient(20px 14px at 44% 97%, rgba(72, 44, 21, 0.24) 10%, transparent 76%),
            radial-gradient(25px 17px at 63% 98%, rgba(78, 48, 24, 0.28) 10%, transparent 76%),
            radial-gradient(20px 14px at 82% 97%, rgba(74, 46, 22, 0.26) 10%, transparent 76%),
            radial-gradient(14px 11px at 2% 19%, rgba(255, 239, 209, 0.24) 10%, transparent 75%),
            radial-gradient(14px 11px at 98% 18%, rgba(255, 239, 209, 0.2) 10%, transparent 75%),
            radial-gradient(14px 11px at 2% 82%, rgba(71, 43, 20, 0.2) 10%, transparent 75%),
            radial-gradient(14px 11px at 98% 81%, rgba(71, 43, 20, 0.2) 10%, transparent 75%);
        opacity: var(--story-map-edge-opacity, 0.66);
        mix-blend-mode: multiply;
        filter: blur(0.2px);
    }

    .story-manager-surface .story-map-edge-overlay::after {
        content: "";
        position: absolute;
        inset: 0;
        background:
            repeating-linear-gradient(12deg, rgba(96, 66, 38, 0.065) 0 1px, transparent 1px 5px),
            repeating-linear-gradient(102deg, rgba(251, 241, 215, 0.05) 0 1px, transparent 1px 6px),
            radial-gradient(120% 14% at 50% 0%, rgba(75, 47, 23, 0.2), transparent 68%),
            radial-gradient(120% 14% at 50% 100%, rgba(75, 47, 23, 0.24), transparent 68%);
        mix-blend-mode: multiply;
        opacity: 0.36;
    }

    .story-editor-surface > :first-child {
        margin-top: 0 !important;
    }

    .story-editor-surface > :last-child {
        margin-bottom: 0 !important;
    }

    .story-editor-surface h1 {
        font-size: 1.85rem;
        line-height: 1.2;
        font-weight: 700;
        margin: 0.9rem 0 0.45rem;
    }

    .story-editor-surface h2 {
        font-size: 1.5rem;
        line-height: 1.25;
        font-weight: 650;
        margin: 0.85rem 0 0.4rem;
    }

    .story-editor-surface h3 {
        font-size: 1.25rem;
        line-height: 1.3;
        font-weight: 600;
        margin: 0.75rem 0 0.35rem;
    }

    .story-editor-surface blockquote {
        margin: 0.75rem 0;
        padding-left: 0.75rem;
        border-left: 3px solid color-mix(in oklab, var(--ring), transparent 35%);
        color: var(--ink-muted);
        font-style: italic;
    }

    .story-editor-surface pre {
        margin: 0.75rem 0;
        padding: 0.6rem 0.7rem;
        border-radius: 0.5rem;
        border: 1px solid color-mix(in oklab, var(--ring), transparent 30%);
        background: color-mix(in oklab, var(--panel), black 6%);
        overflow-x: auto;
    }

    .story-editor-surface [data-story-theme-color="true"] {
        color: var(--ink) !important;
    }

    .story-editor-surface [style*="color: rgb(0, 0, 0)"],
    .story-editor-surface [style*="color:rgb(0,0,0)"],
    .story-editor-surface [style*="color:#000"],
    .story-editor-surface [style*="color: #000"],
    .story-editor-surface [style*="color:#000000"],
    .story-editor-surface [style*="color:#000000ff"],
    .story-editor-surface [style*="color: rgb(255, 255, 255)"],
    .story-editor-surface [style*="color:rgb(255,255,255)"],
    .story-editor-surface [style*="color:#fff"],
    .story-editor-surface [style*="color:#ffffff"],
    .story-editor-surface [style*="color:#ffffffff"] {
        color: var(--ink) !important;
    }

    .story-editor-surface font[color="black"],
    .story-editor-surface font[color="#000"],
    .story-editor-surface font[color="#000000"],
    .story-editor-surface font[color="#000000ff"],
    .story-editor-surface font[color="white"],
    .story-editor-surface font[color="#fff"],
    .story-editor-surface font[color="#ffffff"],
    .story-editor-surface font[color="#ffffffff"] {
        color: var(--ink) !important;
    }
`;

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function createInitialMapView(viewportEl: HTMLDivElement | null): ViewState {
    const scale = INITIAL_MAP_SCALE;
    const rect = viewportEl?.getBoundingClientRect();
    const viewportWidth =
        rect && Number.isFinite(rect.width) && rect.width > 0
            ? rect.width
            : FALLBACK_VIEWPORT_WIDTH;
    const viewportHeight =
        rect && Number.isFinite(rect.height) && rect.height > 0
            ? rect.height
            : FALLBACK_VIEWPORT_HEIGHT;

    return {
        scale,
        x: (viewportWidth - STAGE_WIDTH * scale) / 2,
        y: (viewportHeight - STAGE_HEIGHT * scale) / 2,
    };
}

function toErrorMessage(error: unknown, fallback: string) {
    if (typeof error === "object" && error && "message" in error) {
        const message = String((error as { message?: unknown }).message ?? "");
        if (message.includes("relation") && message.includes("does not exist")) {
            return `${fallback} (falta ejecutar la migracion SQL del gestor modular).`;
        }
        if (message) return message;
    }
    return fallback;
}

function slugify(input: string) {
    return input
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 90);
}

function stripHtml(html: string) {
    if (typeof window === "undefined") {
        return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }
    const div = window.document.createElement("div");
    div.innerHTML = html;
    return (div.textContent ?? "").replace(/\s+/g, " ").trim();
}

function hasMeaningfulText(text: string) {
    return text.replace(/[\s\u00a0]+/g, "").length > 0;
}

function nodeHasVisualContent(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) {
        return hasMeaningfulText(node.textContent ?? "");
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return false;
    }

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    if (
        [
            "img",
            "video",
            "audio",
            "iframe",
            "object",
            "embed",
            "svg",
            "canvas",
            "hr",
            "table",
            "input",
            "textarea",
            "select",
        ].includes(tag)
    ) {
        return true;
    }

    for (const child of Array.from(element.childNodes)) {
        if (nodeHasVisualContent(child)) return true;
    }

    return false;
}

function trimEmptyNodesAtEdges(container: HTMLElement) {
    while (container.firstChild && !nodeHasVisualContent(container.firstChild)) {
        container.removeChild(container.firstChild);
    }
    while (container.lastChild && !nodeHasVisualContent(container.lastChild)) {
        container.removeChild(container.lastChild);
    }
}

function normalizeLineHeightValue(input: string): string | null {
    const raw = input.trim().toLowerCase();
    if (!raw) return null;
    if (["normal", "initial", "inherit", "unset"].includes(raw)) return null;

    const unitless = Number(raw);
    if (Number.isFinite(unitless)) {
        return String(clamp(unitless, 1, 1.75));
    }

    const emMatch = raw.match(/^([0-9]*\.?[0-9]+)em$/);
    if (emMatch) {
        const em = Number(emMatch[1]);
        if (!Number.isFinite(em)) return null;
        return `${clamp(em, 1, 1.75)}em`;
    }

    const percentageMatch = raw.match(/^([0-9]*\.?[0-9]+)%$/);
    if (percentageMatch) {
        const percentage = Number(percentageMatch[1]);
        if (!Number.isFinite(percentage)) return null;
        return `${Math.round(clamp(percentage, 100, 175))}%`;
    }

    const pxMatch = raw.match(/^([0-9]*\.?[0-9]+)px$/);
    if (pxMatch) {
        const px = Number(pxMatch[1]);
        if (!Number.isFinite(px)) return null;
        return `${Math.round(clamp(px, 14, 28))}px`;
    }

    return null;
}

function sanitizeLineHeightStyles(container: HTMLElement) {
    const elements = Array.from(
        container.querySelectorAll<HTMLElement>("[style*=\"line-height\"]")
    );

    for (const element of elements) {
        const normalized = normalizeLineHeightValue(element.style.lineHeight);
        if (!normalized) {
            element.style.removeProperty("line-height");
        } else {
            element.style.lineHeight = normalized;
        }

        const styleAttr = element.getAttribute("style");
        if (!styleAttr || !styleAttr.trim()) {
            element.removeAttribute("style");
        }
    }
}

function normalizeEditorHtml(html: string): string {
    const raw = String(html ?? "");
    if (typeof window === "undefined") return raw.trim();

    const container = window.document.createElement("div");
    container.innerHTML = raw;
    trimEmptyNodesAtEdges(container);
    sanitizeLineHeightStyles(container);
    return container.innerHTML.trim();
}

function getDocumentHtml(doc: DocumentRow) {
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

function nextSortOrder<T extends { sort_order: number }>(items: T[]) {
    return items.reduce((max, item) => Math.max(max, item.sort_order ?? 0), -1) + 1;
}

function randomZoneColor() {
    const palette = ["#4f46e5", "#0ea5e9", "#16a34a", "#d97706", "#db2777", "#e11d48"];
    return palette[Math.floor(Math.random() * palette.length)] ?? "#4f46e5";
}

function normalizeHexColor(input: string): string | null {
    const raw = input.trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(raw)) {
        return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase();
    }
    if (/^[0-9a-f]{4}$/i.test(raw)) {
        return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase();
    }
    if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw}`.toLowerCase();
    if (/^[0-9a-f]{8}$/i.test(raw)) return `#${raw.slice(0, 6)}`.toLowerCase();
    return null;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const normalized = normalizeHexColor(hex);
    if (!normalized) return null;
    const value = normalized.slice(1);
    const r = Number.parseInt(value.slice(0, 2), 16);
    const g = Number.parseInt(value.slice(2, 4), 16);
    const b = Number.parseInt(value.slice(4, 6), 16);
    return { r, g, b };
}

function parseColorWithAlpha(input: string): { hex: string; alpha: number } {
    const fallback = { hex: "#4f46e5", alpha: 1 };
    const color = input.trim().toLowerCase();
    if (!color) return fallback;

    if (color.startsWith("#")) {
        const raw = color.replace(/^#/, "");
        if (/^[0-9a-f]{8}$/i.test(raw)) {
            const hex = `#${raw.slice(0, 6)}`.toLowerCase();
            const alpha = clamp(
                Number.parseInt(raw.slice(6, 8), 16) / 255,
                0,
                1
            );
            return { hex, alpha };
        }
        if (/^[0-9a-f]{4}$/i.test(raw)) {
            const hex = `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase();
            const alpha = clamp(
                Number.parseInt(`${raw[3]}${raw[3]}`, 16) / 255,
                0,
                1
            );
            return { hex, alpha };
        }
        const normalized = normalizeHexColor(color);
        if (normalized) return { hex: normalized, alpha: 1 };
    }

    const rgbaMatch = color.match(
        /^rgba?\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)(?:\s*,\s*([0-9]*\.?[0-9]+))?\s*\)$/i
    );
    if (rgbaMatch) {
        const r = clamp(Number(rgbaMatch[1]), 0, 255);
        const g = clamp(Number(rgbaMatch[2]), 0, 255);
        const b = clamp(Number(rgbaMatch[3]), 0, 255);
        const alpha = clamp(
            rgbaMatch[4] === undefined ? 1 : Number(rgbaMatch[4]),
            0,
            1
        );
        const toHex = (value: number) => value.toString(16).padStart(2, "0");
        return {
            hex: `#${toHex(Math.round(r))}${toHex(Math.round(g))}${toHex(Math.round(b))}`,
            alpha,
        };
    }

    return fallback;
}

function colorFromHexAndOpacity(hex: string, opacityPercent: number): string {
    const safeHex = normalizeHexColor(hex) ?? "#4f46e5";
    const alpha = clamp(opacityPercent / 100, 0, 1);
    if (alpha >= 0.995) return safeHex;
    const rgb = hexToRgb(safeHex) ?? { r: 79, g: 70, b: 229 };
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Number(alpha.toFixed(3))})`;
}

function colorsEquivalent(a: string, b: string): boolean {
    const parsedA = parseColorWithAlpha(a);
    const parsedB = parseColorWithAlpha(b);
    return (
        parsedA.hex.toLowerCase() === parsedB.hex.toLowerCase()
        && Math.abs(parsedA.alpha - parsedB.alpha) < 0.01
    );
}

function zoneLabelFontSize(radius: number, label: string): number {
    const textLength = Math.max(1, label.trim().length);
    const scaled = (radius * 1.05) / Math.sqrt(textLength);
    return clamp(Math.round(scaled), 10, Math.round(radius * 1.35));
}

function normalizeDocDefaultTextColor(value: unknown): string {
    if (typeof value !== "string") return "theme";
    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized === "theme" || normalized === "auto") return "theme";
    return normalizeHexColor(normalized) ?? "theme";
}

function zoneNodeId(zone: ZoneRow) {
    return zone.node_id ?? zone.target_node_id ?? null;
}

type RichTextEditorProps = {
    value: string;
    locale: string;
    onChange: (nextHtml: string) => void;
    forceHideToolbar?: boolean;
};

type RichTextEditorHandle = {
    applyThemeTextColorToSelection: () => void;
};

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor({
    value,
    locale,
    onChange,
    forceHideToolbar = false,
}: RichTextEditorProps, ref) {
    const t = (es: string, en: string) => tr(locale, es, en);
    const editorRef = useRef<HTMLDivElement | null>(null);
    const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
    const toolbarButtonClass =
        "rounded-md border border-ring bg-panel/85 px-2 py-1 text-[12px] leading-none text-ink transition-colors hover:bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
    const toolbarSelectClass =
        "rounded-md border border-ring bg-panel/85 px-2 py-1 text-[12px] leading-none text-ink outline-none focus:border-accent";
    const colorInputClass = "h-7 w-9 rounded border border-ring bg-panel/85 p-0.5";
    const blockTags = useMemo(
        () =>
            new Set([
                "p",
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6",
                "blockquote",
                "pre",
                "li",
                "div",
            ]),
        []
    );

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;
        const normalized = normalizeEditorHtml(value);
        if (editor.innerHTML !== normalized) {
            editor.innerHTML = normalized;
        }
    }, [value]);

    function exec(command: string, arg?: string) {
        editorRef.current?.focus();
        if (command === "formatBlock" && arg) {
            const normalizedTag = arg.trim().toUpperCase();
            // Browsers differ: some need "<H1>" and others accept "H1".
            window.document.execCommand(command, false, `<${normalizedTag}>`);
            window.document.execCommand(command, false, normalizedTag);
        } else {
            window.document.execCommand(command, false, arg);
        }

        const editor = editorRef.current;
        const normalized = normalizeEditorHtml(editor?.innerHTML ?? "");
        if (editor && editor.innerHTML !== normalized) {
            editor.innerHTML = normalized;
        }
        onChange(normalized);
    }

    function applyThemeTextColorToSelection() {
        const editor = editorRef.current;
        if (!editor) return;

        editor.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        if (!editor.contains(range.commonAncestorContainer)) return;
        if (range.collapsed) return;

        const fragment = range.extractContents();
        const wrapper = window.document.createElement("span");
        wrapper.setAttribute("data-story-theme-color", "true");
        wrapper.style.color = "var(--ink)";
        wrapper.appendChild(fragment);
        range.insertNode(wrapper);

        selection.removeAllRanges();
        const nextRange = window.document.createRange();
        nextRange.selectNodeContents(wrapper);
        selection.addRange(nextRange);

        onChange(normalizeEditorHtml(editor.innerHTML ?? ""));
    }

    function findClosestBlock(node: Node | null, editor: HTMLElement): HTMLElement | null {
        let cursor = node;
        while (cursor && cursor !== editor) {
            if (cursor.nodeType === Node.ELEMENT_NODE) {
                const element = cursor as HTMLElement;
                if (blockTags.has(element.tagName.toLowerCase())) {
                    return element;
                }
            }
            cursor = cursor.parentNode;
        }
        return null;
    }

    function collectBlocksFromRange(range: Range, editor: HTMLElement): HTMLElement[] {
        const blocks: HTMLElement[] = [];
        const walker = window.document.createTreeWalker(
            editor,
            NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: (node) => {
                    if (!(node instanceof HTMLElement)) return NodeFilter.FILTER_SKIP;
                    if (!blockTags.has(node.tagName.toLowerCase())) return NodeFilter.FILTER_SKIP;
                    try {
                        return range.intersectsNode(node)
                            ? NodeFilter.FILTER_ACCEPT
                            : NodeFilter.FILTER_SKIP;
                    } catch {
                        return NodeFilter.FILTER_SKIP;
                    }
                },
            }
        );

        let current = walker.nextNode();
        while (current) {
            blocks.push(current as HTMLElement);
            current = walker.nextNode();
        }

        if (blocks.length > 0) {
            // Apply to leaf-like blocks to avoid stacking line-heights on parent wrappers.
            return blocks.filter(
                (candidate) =>
                    !blocks.some((other) => other !== candidate && candidate.contains(other))
            );
        }

        const fallback =
            findClosestBlock(range.startContainer, editor)
            ?? findClosestBlock(range.endContainer, editor);
        return fallback ? [fallback] : [];
    }

    function applyLineHeightToSelection(nextLineHeight: string) {
        const editor = editorRef.current;
        if (!editor) return;

        editor.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        if (!editor.contains(range.commonAncestorContainer)) return;

        const blocks = collectBlocksFromRange(range, editor);
        if (blocks.length === 0) return;

        const safeLineHeight =
            nextLineHeight === "default"
                ? null
                : normalizeLineHeightValue(nextLineHeight);
        if (nextLineHeight !== "default" && !safeLineHeight) return;

        for (const block of blocks) {
            if (!safeLineHeight) {
                block.style.removeProperty("line-height");
            } else {
                block.style.lineHeight = safeLineHeight;
            }
        }

        onChange(normalizeEditorHtml(editor.innerHTML ?? ""));
    }

    useImperativeHandle(ref, () => ({
        applyThemeTextColorToSelection,
    }));

    const isToolbarHidden = forceHideToolbar || toolbarCollapsed;

    return (
        <div className="space-y-2">
            <div className="space-y-1">
                {!forceHideToolbar && (
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setToolbarCollapsed((prev) => !prev)}
                            className="rounded-md border border-ring bg-panel/70 px-2 py-1 text-[11px] text-ink hover:bg-panel"
                        >
                            {toolbarCollapsed
                                ? t("Mostrar herramientas", "Show toolbar")
                                : t("Ocultar herramientas", "Hide toolbar")}
                        </button>
                    </div>
                )}
                {!isToolbarHidden && (
                    <div className="flex flex-wrap items-center gap-1 rounded-md border border-ring bg-panel/70 p-1">
                        <button type="button" onClick={() => exec("bold")} className={toolbarButtonClass}>B</button>
                        <button type="button" onClick={() => exec("italic")} className={toolbarButtonClass}>I</button>
                        <button type="button" onClick={() => exec("underline")} className={toolbarButtonClass}>U</button>
                        <button type="button" onClick={() => exec("strikeThrough")} className={toolbarButtonClass}>S</button>
                        <span className="mx-1 h-4 w-px bg-ring" />
                        <button type="button" onClick={() => exec("justifyLeft")} className={toolbarButtonClass}>L</button>
                        <button type="button" onClick={() => exec("justifyCenter")} className={toolbarButtonClass}>C</button>
                        <button type="button" onClick={() => exec("justifyRight")} className={toolbarButtonClass}>R</button>
                        <button type="button" onClick={() => exec("insertUnorderedList")} className={toolbarButtonClass}>•</button>
                        <button type="button" onClick={() => exec("insertOrderedList")} className={toolbarButtonClass}>1.</button>
                        <span className="mx-1 h-4 w-px bg-ring" />
                        <select
                            onChange={(e) => {
                                const next = e.target.value;
                                if (!next) return;
                                exec("formatBlock", next);
                                e.currentTarget.value = "";
                            }}
                            className={toolbarSelectClass}
                            defaultValue=""
                        >
                            <option value="">{t("Bloque", "Block")}</option>
                            <option value="P">{t("Parrafo", "Paragraph")}</option>
                            <option value="H1">{t("Encabezado 1", "Heading 1")}</option>
                            <option value="H2">{t("Encabezado 2", "Heading 2")}</option>
                            <option value="H3">{t("Encabezado 3", "Heading 3")}</option>
                            <option value="BLOCKQUOTE">{t("Cita", "Quote")}</option>
                            <option value="PRE">{t("Codigo", "Code")}</option>
                        </select>
                        <select
                            onChange={(e) => exec("fontName", e.target.value)}
                            className={toolbarSelectClass}
                            defaultValue="inherit"
                        >
                            <option value="inherit">{t("Fuente", "Font")}</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Times New Roman">Times</option>
                            <option value="Courier New">Courier</option>
                        </select>
                        <select
                            onChange={(e) => exec("fontSize", e.target.value)}
                            className={toolbarSelectClass}
                            defaultValue="3"
                        >
                            <option value="1">10</option>
                            <option value="2">12</option>
                            <option value="3">14</option>
                            <option value="4">18</option>
                            <option value="5">24</option>
                            <option value="6">32</option>
                            <option value="7">48</option>
                        </select>
                        <select
                            onChange={(e) => {
                                const next = e.target.value;
                                if (!next) return;
                                applyLineHeightToSelection(next);
                                e.currentTarget.value = "";
                            }}
                            className={toolbarSelectClass}
                            defaultValue=""
                        >
                            <option value="">{t("Interlineado", "Line spacing")}</option>
                            <option value="default">{t("Por defecto", "Default")}</option>
                            <option value="1">1.0</option>
                            <option value="1.15">1.15</option>
                            <option value="1.3">1.3</option>
                            <option value="1.5">1.5</option>
                            <option value="1.65">1.65</option>
                        </select>
                        <input
                            type="color"
                            title={t("Color texto", "Text color")}
                            onChange={(e) => exec("foreColor", e.target.value)}
                            className={colorInputClass}
                        />
                        <input
                            type="color"
                            title={t("Resaltado", "Highlight")}
                            onChange={(e) => exec("hiliteColor", e.target.value)}
                            className={colorInputClass}
                        />
                        <button
                            type="button"
                            onClick={applyThemeTextColorToSelection}
                            className={toolbarButtonClass}
                            title={t(
                                "Aplica color adaptado al tema al texto seleccionado",
                                "Apply theme-adaptive color to selected text"
                            )}
                        >
                            {t("Texto tema", "Theme text")}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const url = window.prompt(t("URL del enlace", "Link URL"), "https://");
                                if (!url) return;
                                exec("createLink", url);
                            }}
                            className={toolbarButtonClass}
                        >
                            Link
                        </button>
                        <button
                            type="button"
                            onClick={() => exec("removeFormat")}
                            className={toolbarButtonClass}
                        >
                            {t("Limpiar", "Clear")}
                        </button>
                    </div>
                )}
            </div>
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => {
                    const editor = editorRef.current;
                    const normalized = normalizeEditorHtml(editor?.innerHTML ?? "");
                    if (editor && editor.innerHTML !== normalized) {
                        editor.innerHTML = normalized;
                    }
                    onChange(normalized);
                }}
                onBlur={() => {
                    const editor = editorRef.current;
                    const normalized = normalizeEditorHtml(editor?.innerHTML ?? "");
                    if (editor && editor.innerHTML !== normalized) {
                        editor.innerHTML = normalized;
                    }
                    onChange(normalized);
                }}
                className="story-editor-surface markdown min-h-[220px] rounded-md border border-ring bg-panel/85 px-3 py-2 text-sm leading-6 text-ink outline-none focus:border-accent"
            />
        </div>
    );
});

export default function StoryManagerPanel({ campaignId, locale }: StoryManagerPanelProps) {
    const t = (es: string, en: string) => tr(locale, es, en);

    const viewportRef = useRef<HTMLDivElement | null>(null);
    const richTextEditorRef = useRef<RichTextEditorHandle | null>(null);
    const mapUploadInputRef = useRef<HTMLInputElement | null>(null);
    const autoSaveInFlightRef = useRef(false);
    const viewRef = useRef<ViewState>(DEFAULT_VIEW);
    const zonesRef = useRef<ZoneRow[]>([]);
    const zoneDragRef = useRef<{
        zoneId: string;
        offsetX: number;
        offsetY: number;
    } | null>(null);
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
    const zoneLiveSaveTimeoutRef = useRef<number | null>(null);
    const zoneLiveSaveInFlightRef = useRef(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const [acts, setActs] = useState<ActRow[]>([]);
    const [nodes, setNodes] = useState<NodeRow[]>([]);

    const [currentActId, setCurrentActId] = useState<string | null>(null);
    const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
    const [currentMap, setCurrentMap] = useState<MapRow | null>(null);
    const [zones, setZones] = useState<ZoneRow[]>([]);
    const [view, setView] = useState<ViewState>(DEFAULT_VIEW);
    const [isPanning, setIsPanning] = useState(false);

    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const [references, setReferences] = useState<LinkRow[]>([]);
    const [mapConnections, setMapConnections] = useState<LinkRow[]>([]);
    const [pendingConnectionZoneId, setPendingConnectionZoneId] = useState<string | null>(null);
    const [movingZoneId, setMovingZoneId] = useState<string | null>(null);
    const [selectedDocument, setSelectedDocument] = useState<DocumentRow | null>(null);

    const [newActTitle, setNewActTitle] = useState("");
    const [mapNameDraft, setMapNameDraft] = useState("");
    const [mapImageDraft, setMapImageDraft] = useState("");

    const [zoneNameDraft, setZoneNameDraft] = useState("");
    const [zoneIconDraft, setZoneIconDraft] = useState("*");
    const [zoneColorDraft, setZoneColorDraft] = useState("#4f46e5");
    const [zoneOpacityDraft, setZoneOpacityDraft] = useState("100");
    const [zoneRadiusDraft, setZoneRadiusDraft] = useState("54");
    const [zoneVisibleDraft, setZoneVisibleDraft] = useState(false);

    const [referenceQuery, setReferenceQuery] = useState("");

    const [docTitleDraft, setDocTitleDraft] = useState("");
    const [docHtmlDraft, setDocHtmlDraft] = useState("");
    const [docTypeDraft, setDocTypeDraft] = useState<DocumentType>("LORE");
    const [docVisibilityDraft, setDocVisibilityDraft] = useState<DocumentVisibility>("CAMPAIGN");
    const [docDefaultTextColorDraft, setDocDefaultTextColorDraft] = useState("theme");
    const [editorPanelCollapsed, setEditorPanelCollapsed] = useState(false);
    const [editorPanelExpanded, setEditorPanelExpanded] = useState(false);
    const [editorPanelWidth, setEditorPanelWidth] = useState(EDITOR_PANEL_DEFAULT_WIDTH);
    const [isResizingEditorPanel, setIsResizingEditorPanel] = useState(false);
    const [hideUpperTools, setHideUpperTools] = useState(false);
    const [playerPreviewMode, setPlayerPreviewMode] = useState(false);
    const [playerPreviewReloadSignal, setPlayerPreviewReloadSignal] = useState(0);
    const [isDarkTheme, setIsDarkTheme] = useState(false);

    const nodesById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

    const currentAct = currentActId ? acts.find((act) => act.id === currentActId) ?? null : null;
    const currentNode = currentNodeId ? nodesById.get(currentNodeId) ?? null : null;
    const selectedZone = selectedZoneId ? zones.find((zone) => zone.id === selectedZoneId) ?? null : null;

    const selectedZoneNodeId = selectedZone?.node_id ?? selectedZone?.target_node_id ?? null;
    const selectedZoneNode = selectedZoneNodeId ? nodesById.get(selectedZoneNodeId) ?? null : null;

    const selectedZoneGeometry = useMemo(
        () => (selectedZone ? parseZoneGeometry(selectedZone.geometry) : null),
        [selectedZone]
    );

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

    const referenceMatches = useMemo(() => {
        const query = referenceQuery.trim().toLowerCase();
        if (!query) return [] as NodeRow[];
        return nodes
            .filter((node) => node.id !== selectedZoneNodeId)
            .filter((node) => node.title.toLowerCase().includes(query))
            .slice(0, 8);
    }, [nodes, referenceQuery, selectedZoneNodeId]);

    const renderedZones = useMemo(
        () =>
            zones
                .map((zone) => ({ zone, geometry: parseZoneGeometry(zone.geometry) }))
                .filter(({ zone }) => zone.shape_type === "circle" || zone.shape_type === "rect"),
        [zones]
    );

    const renderedConnectionLines = useMemo(() => {
        const byNodeId = new Map<string, { zone: ZoneRow; geometry: ZoneGeometry }>();
        for (const entry of renderedZones) {
            const nodeId = zoneNodeId(entry.zone);
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
            lines.push({
                id: key,
                from: from.geometry,
                to: to.geometry,
            });
        }

        return lines;
    }, [renderedZones, mapConnections]);

    const blankMapStyle = useMemo(
        () => ({
            backgroundImage: isDarkTheme
                ? "radial-gradient(circle at 1px 1px, rgba(194,165,132,0.2) 1px, transparent 1px), linear-gradient(130deg, rgba(20,16,12,0.96), rgba(37,27,20,0.9) 52%, rgba(25,19,14,0.97))"
                : "radial-gradient(circle at 1px 1px, rgba(89,69,45,0.26) 1px, transparent 1px), linear-gradient(120deg, rgba(254,243,199,0.28), rgba(251,191,36,0.1))",
            backgroundSize: "28px 28px, auto",
        }),
        [isDarkTheme]
    );

    const isMapDirty = useMemo(() => {
        if (!currentMap) return false;
        const nextName = mapNameDraft.trim() || currentMap.name;
        const nextImage = mapImageDraft.trim() || BLANK_MAP_URL;
        return nextName !== currentMap.name || nextImage !== currentMap.image_url;
    }, [currentMap, mapNameDraft, mapImageDraft]);

    const isZoneDirty = useMemo(() => {
        if (!selectedZone) return false;
        const base = parseZoneGeometry(selectedZone.geometry);
        const nextName = zoneNameDraft.trim() || selectedZone.name;
        const nextRadius = clamp(Number(zoneRadiusDraft) || DEFAULT_ZONE_RADIUS, 16, 180);
        const nextOpacity = clamp(Number(zoneOpacityDraft) || 100, 0, 100);
        const nextColor = colorFromHexAndOpacity(zoneColorDraft || "#4f46e5", nextOpacity);
        const nextIcon = zoneIconDraft || base.icon;

        return (
            nextName !== selectedZone.name
            || nextRadius !== base.radius
            || !colorsEquivalent(nextColor, base.color)
            || nextIcon !== base.icon
            || zoneVisibleDraft !== Boolean(selectedZone.is_visible)
        );
    }, [
        selectedZone,
        zoneNameDraft,
        zoneRadiusDraft,
        zoneColorDraft,
        zoneOpacityDraft,
        zoneIconDraft,
        zoneVisibleDraft,
    ]);

    const selectedDocumentHtml = useMemo(
        () => normalizeEditorHtml(selectedDocument ? getDocumentHtml(selectedDocument) : ""),
        [selectedDocument]
    );
    const normalizedDocHtmlDraft = useMemo(
        () => normalizeEditorHtml(docHtmlDraft),
        [docHtmlDraft]
    );

    const isDocumentDirty = useMemo(() => {
        if (!selectedDocument) return false;
        const nextTitle = docTitleDraft.trim() || selectedDocument.title;
        const baseMetadata =
            selectedDocument.metadata && typeof selectedDocument.metadata === "object"
                ? (selectedDocument.metadata as Record<string, unknown>)
                : {};
        const baseDefaultTextColor = normalizeDocDefaultTextColor(
            baseMetadata.story_default_text_color
        );
        const nextDefaultTextColor = normalizeDocDefaultTextColor(docDefaultTextColorDraft);
        return (
            nextTitle !== selectedDocument.title
            || docTypeDraft !== selectedDocument.doc_type
            || docVisibilityDraft !== selectedDocument.visibility
            || normalizedDocHtmlDraft !== selectedDocumentHtml
            || nextDefaultTextColor !== baseDefaultTextColor
        );
    }, [
        selectedDocument,
        selectedDocumentHtml,
        docTitleDraft,
        docTypeDraft,
        docVisibilityDraft,
        normalizedDocHtmlDraft,
        docDefaultTextColorDraft,
    ]);

    const showMapPanel = !editorPanelExpanded;
    const showEditorPanel = editorPanelExpanded || !editorPanelCollapsed;

    async function loadIndex() {
        setLoading(true);
        setError(null);
        try {
            const [sessionRes, actsRes, nodesRes] = await Promise.all([
                supabase.auth.getSession(),
                supabase
                    .from("campaign_acts")
                    .select("id, campaign_id, title, act_number, sort_order")
                    .eq("campaign_id", campaignId)
                    .order("sort_order", { ascending: true })
                    .order("act_number", { ascending: true }),
                supabase
                    .from("campaign_story_nodes")
                    .select("id, campaign_id, act_id, parent_id, node_type, title, slug, sort_order, summary")
                    .eq("campaign_id", campaignId)
                    .order("sort_order", { ascending: true })
                    .order("created_at", { ascending: true }),
            ]);

            if (sessionRes.error) throw sessionRes.error;
            if (actsRes.error) throw actsRes.error;
            if (nodesRes.error) throw nodesRes.error;

            setUserId(sessionRes.data?.session?.user?.id ?? null);
            setActs((actsRes.data ?? []) as ActRow[]);
            setNodes((nodesRes.data ?? []) as NodeRow[]);
        } catch (err) {
            setError(
                toErrorMessage(
                    err,
                    t(
                        "No se pudo cargar el gestor de historia.",
                        "Could not load story manager."
                    )
                )
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadIndex();
    }, [campaignId]);

    useEffect(() => {
        viewRef.current = view;
    }, [view]);

    useEffect(() => {
        zonesRef.current = zones;
    }, [zones]);

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
        return () => {
            if (zoneLiveSaveTimeoutRef.current !== null) {
                window.clearTimeout(zoneLiveSaveTimeoutRef.current);
                zoneLiveSaveTimeoutRef.current = null;
            }
        };
    }, []);

    async function ensureActRootNode(actId: string): Promise<NodeRow> {
        const existing = nodes.find((node) => node.act_id === actId && node.parent_id === null);
        if (existing) return existing;

        const act = acts.find((entry) => entry.id === actId);
        const title = act
            ? `Mundo Acto ${act.act_number}`
            : t("Mundo del acto", "Act world");

        const payload = {
            campaign_id: campaignId,
            act_id: actId,
            parent_id: null,
            node_type: "MODULE",
            title,
            slug: slugify(`${title}-${Date.now()}`) || null,
            summary: null,
            sort_order: nextSortOrder(nodes.filter((node) => node.act_id === actId && node.parent_id === null)),
            created_by: userId,
            updated_by: userId,
        };

        const { data, error: insertError } = await supabase
            .from("campaign_story_nodes")
            .insert(payload)
            .select("id, campaign_id, act_id, parent_id, node_type, title, slug, sort_order, summary")
            .maybeSingle();

        if (insertError) throw insertError;
        if (!data) {
            throw new Error(t("No se pudo crear el mundo del acto.", "Could not create act world."));
        }

        const created = data as NodeRow;
        setNodes((prev) => [...prev, created]);
        return created;
    }

    async function ensureMapForNode(nodeId: string, nodeTitle: string): Promise<MapRow> {
        const { data: existingRows, error: existingError } = await supabase
            .from("campaign_maps")
            .select("id, campaign_id, node_id, name, image_url, sort_order")
            .eq("campaign_id", campaignId)
            .eq("node_id", nodeId)
            .order("sort_order", { ascending: true })
            .limit(1);

        if (existingError) throw existingError;
        const existing = (existingRows?.[0] ?? null) as MapRow | null;
        if (existing) return existing;

        const payload = {
            campaign_id: campaignId,
            node_id: nodeId,
            name: `Mapa - ${nodeTitle}`,
            image_url: BLANK_MAP_URL,
            sort_order: 0,
            created_by: userId,
            updated_by: userId,
        };

        const { data, error: insertError } = await supabase
            .from("campaign_maps")
            .insert(payload)
            .select("id, campaign_id, node_id, name, image_url, sort_order")
            .maybeSingle();

        if (insertError) throw insertError;
        if (!data) throw new Error(t("No se pudo crear mapa.", "Could not create map."));

        return data as MapRow;
    }

    async function loadZones(mapId: string): Promise<ZoneRow[]> {
        const selectColumns =
            "id, campaign_id, map_id, node_id, name, shape_type, geometry, is_visible, action_type, target_node_id, target_map_id, target_url, sort_order";

        const withTrashFilter = await supabase
            .from("campaign_map_zones")
            .select(selectColumns)
            .eq("campaign_id", campaignId)
            .eq("map_id", mapId)
            .is("deleted_at", null)
            .order("sort_order", { ascending: true });

        if (!withTrashFilter.error) {
            return (withTrashFilter.data ?? []) as ZoneRow[];
        }

        const lowered = String(withTrashFilter.error.message ?? "").toLowerCase();
        const missingTrashColumns =
            lowered.includes("deleted_at") || lowered.includes("deleted_by");

        if (!missingTrashColumns) {
            throw withTrashFilter.error;
        }

        const legacyRes = await supabase
            .from("campaign_map_zones")
            .select(selectColumns)
            .eq("campaign_id", campaignId)
            .eq("map_id", mapId)
            .order("sort_order", { ascending: true });

        if (legacyRes.error) throw legacyRes.error;
        return (legacyRes.data ?? []) as ZoneRow[];
    }

    async function loadMapConnections(mapZones: ZoneRow[]): Promise<LinkRow[]> {
        const nodeIds = Array.from(
            new Set(
                mapZones
                    .map((zone) => zoneNodeId(zone))
                    .filter((value): value is string => Boolean(value))
            )
        );
        if (nodeIds.length < 2) return [];

        const { data, error: linksError } = await supabase
            .from("campaign_story_links")
            .select("id, campaign_id, from_node_id, to_node_id, link_type, label, sort_order")
            .eq("campaign_id", campaignId)
            .in("from_node_id", nodeIds)
            .order("sort_order", { ascending: true });

        if (linksError) throw linksError;

        const nodeSet = new Set(nodeIds);
        return ((data ?? []) as LinkRow[]).filter(
            (link) => nodeSet.has(link.from_node_id) && nodeSet.has(link.to_node_id)
        );
    }

    function clientToStagePoint(clientX: number, clientY: number) {
        if (!viewportRef.current) return null;
        const rect = viewportRef.current.getBoundingClientRect();
        const currentView = viewRef.current;
        return {
            x: (clientX - rect.left - currentView.x) / currentView.scale,
            y: (clientY - rect.top - currentView.y) / currentView.scale,
        };
    }

    async function enterNode(nodeId: string, explicitActId?: string) {
        const node = nodesById.get(nodeId) ?? null;
        if (!node) return;

        const map = await ensureMapForNode(nodeId, node.title);
        const nextZones = await loadZones(map.id);
        const nextConnections = await loadMapConnections(nextZones);

        setCurrentActId(explicitActId ?? node.act_id ?? currentActId);
        setCurrentNodeId(nodeId);
        setCurrentMap(map);
        setZones(nextZones);
        setMapConnections(nextConnections);
        setPendingConnectionZoneId(null);
        setSelectedZoneId(null);
        setReferences([]);
        setSelectedDocument(null);
        setView(createInitialMapView(viewportRef.current));
        setMapNameDraft(map.name);
        setMapImageDraft(map.image_url);
    }

    async function enterAct(actId: string) {
        setError(null);
        setNotice(null);
        try {
            const root = await ensureActRootNode(actId);
            await enterNode(root.id, actId);
        } catch (err) {
            setError(
                toErrorMessage(
                    err,
                    t("No se pudo abrir el acto.", "Could not open this act.")
                )
            );
        }
    }

    async function loadZoneContext(zoneNodeId: string) {
        const [linksRes, docsRes] = await Promise.all([
            supabase
                .from("campaign_story_links")
                .select("id, campaign_id, from_node_id, to_node_id, link_type, label, sort_order")
                .eq("campaign_id", campaignId)
                .eq("from_node_id", zoneNodeId)
                .order("sort_order", { ascending: true }),
            supabase
                .from("campaign_documents")
                .select(
                    "id, campaign_id, node_id, title, doc_type, visibility, editor_format, content, plain_text, latest_revision, metadata"
                )
                .eq("campaign_id", campaignId)
                .eq("node_id", zoneNodeId)
                .order("updated_at", { ascending: false })
                .limit(1),
        ]);

        if (linksRes.error) throw linksRes.error;
        if (docsRes.error) throw docsRes.error;

        const loadedLinks = (linksRes.data ?? []) as LinkRow[];
        setReferences(loadedLinks);

        const existingDoc = (docsRes.data?.[0] ?? null) as DocumentRow | null;
        if (existingDoc) {
            setSelectedDocument(existingDoc);
            return;
        }

        const node = nodesById.get(zoneNodeId);
        const payload = {
            campaign_id: campaignId,
            node_id: zoneNodeId,
            title: node ? `Ficha - ${node.title}` : t("Nueva ficha", "New sheet"),
            doc_type: "LORE" as DocumentType,
            visibility: "CAMPAIGN" as DocumentVisibility,
            editor_format: "HTML",
            content: { html: "" },
            plain_text: "",
            latest_revision: 1,
            metadata: { story_default_text_color: "theme" },
            created_by: userId,
            updated_by: userId,
        };

        const { data: newDoc, error: insertDocError } = await supabase
            .from("campaign_documents")
            .insert(payload)
            .select(
                "id, campaign_id, node_id, title, doc_type, visibility, editor_format, content, plain_text, latest_revision, metadata"
            )
            .maybeSingle();

        if (insertDocError) throw insertDocError;
        if (!newDoc) throw new Error(t("No se pudo crear ficha.", "Could not create sheet."));

        setSelectedDocument(newDoc as DocumentRow);

        await supabase.from("campaign_document_revisions").insert({
            campaign_id: campaignId,
            document_id: (newDoc as DocumentRow).id,
            revision: 1,
            editor_format: "HTML",
            content: { html: "" },
            plain_text: "",
            created_by: userId,
        });
    }

    useEffect(() => {
        if (!selectedZone) {
            setZoneNameDraft("");
            setZoneIconDraft("*");
            setZoneColorDraft("#4f46e5");
            setZoneOpacityDraft("100");
            setZoneRadiusDraft(String(DEFAULT_ZONE_RADIUS));
            setZoneVisibleDraft(false);
            setReferences([]);
            setSelectedDocument(null);
            return;
        }

        const geometry = parseZoneGeometry(selectedZone.geometry);
        const parsedColor = parseColorWithAlpha(geometry.color);
        setZoneNameDraft(selectedZone.name);
        setZoneIconDraft(geometry.icon);
        setZoneColorDraft(parsedColor.hex);
        setZoneOpacityDraft(String(Math.round(parsedColor.alpha * 100)));
        setZoneRadiusDraft(String(geometry.radius));
        setZoneVisibleDraft(Boolean(selectedZone.is_visible));

        const nodeId = selectedZone.node_id ?? selectedZone.target_node_id;
        if (!nodeId) return;

        let cancelled = false;
        (async () => {
            try {
                await loadZoneContext(nodeId);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        toErrorMessage(
                            err,
                            t(
                                "No se pudo cargar el contenido de la zona.",
                                "Could not load zone content."
                            )
                        )
                    );
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [selectedZoneId, campaignId]);

    useEffect(() => {
        if (!selectedDocument) {
            setDocTitleDraft("");
            setDocHtmlDraft("");
            setDocTypeDraft("LORE");
            setDocVisibilityDraft("CAMPAIGN");
            setDocDefaultTextColorDraft("theme");
            return;
        }
        const metadata =
            selectedDocument.metadata && typeof selectedDocument.metadata === "object"
                ? (selectedDocument.metadata as Record<string, unknown>)
                : {};
        setDocTitleDraft(selectedDocument.title);
        setDocHtmlDraft(normalizeEditorHtml(getDocumentHtml(selectedDocument)));
        setDocTypeDraft(selectedDocument.doc_type);
        setDocVisibilityDraft(selectedDocument.visibility);
        setDocDefaultTextColorDraft(
            normalizeDocDefaultTextColor(metadata.story_default_text_color)
        );
    }, [selectedDocument?.id]);

    useEffect(() => {
        if (!currentMap) {
            setMapNameDraft("");
            setMapImageDraft("");
            return;
        }
        setMapNameDraft(currentMap.name);
        setMapImageDraft(currentMap.image_url);
        setView(createInitialMapView(viewportRef.current));
    }, [currentMap?.id]);

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
        if (!movingZoneId) return;

        const handleMove = (event: MouseEvent) => {
            const drag = zoneDragRef.current;
            if (!drag) return;
            const pointer = clientToStagePoint(event.clientX, event.clientY);
            if (!pointer) return;

            const nextX = clamp(pointer.x - drag.offsetX, 0, STAGE_WIDTH);
            const nextY = clamp(pointer.y - drag.offsetY, 0, STAGE_HEIGHT);

            setZones((prev) =>
                prev.map((zone) => {
                    if (zone.id !== drag.zoneId) return zone;
                    const base = parseZoneGeometry(zone.geometry);
                    return {
                        ...zone,
                        geometry: {
                            ...base,
                            x: nextX,
                            y: nextY,
                        },
                    };
                })
            );
        };

        const handleUp = () => {
            const drag = zoneDragRef.current;
            zoneDragRef.current = null;
            setMovingZoneId(null);
            if (!drag) return;

            const movedZone = zonesRef.current.find((zone) => zone.id === drag.zoneId) ?? null;
            if (!movedZone) return;

            void (async () => {
                const { error: updateError } = await supabase
                    .from("campaign_map_zones")
                    .update({
                        geometry: movedZone.geometry,
                        updated_by: userId,
                    })
                    .eq("id", movedZone.id)
                    .eq("campaign_id", campaignId);

                if (!updateError) return;

                setError(
                    toErrorMessage(
                        updateError,
                        t(
                            "No se pudo mover la zona.",
                            "Could not move the zone."
                        )
                    )
                );

                if (currentMap?.id) {
                    try {
                        const refreshed = await loadZones(currentMap.id);
                        setZones(refreshed);
                    } catch {
                        // Keep local state if refresh also fails.
                    }
                }
            })();
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
    }, [movingZoneId, campaignId, currentMap?.id, userId]);

    async function runMutation(
        runner: () => Promise<void>,
        successMessage?: { es: string; en: string },
        options?: MutationOptions
    ) {
        const silent = Boolean(options?.silent);
        setSaving(true);
        if (!silent) {
            setError(null);
            setNotice(null);
        }
        try {
            await runner();
            if (successMessage && !silent) {
                setNotice(t(successMessage.es, successMessage.en));
            }
        } catch (err) {
            setError(
                toErrorMessage(
                    err,
                    t("No se pudo guardar cambios.", "Could not save changes.")
                )
            );
        } finally {
            setSaving(false);
        }
    }

    async function getSessionAccessToken() {
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const accessToken = session?.access_token;
        if (!accessToken) {
            throw new Error(t("No autenticado.", "Not authenticated."));
        }
        return accessToken;
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

    function handleViewportContextMenu(event: ReactMouseEvent<HTMLDivElement>) {
        event.preventDefault();
        if (pendingConnectionZoneId) {
            setPendingConnectionZoneId(null);
            setNotice(t("Conexion entre zonas cancelada.", "Zone connection canceled."));
        }
    }

    function handleViewportMouseMove(event: ReactMouseEvent<HTMLDivElement>) {
        if (!panRef.current.active) return;
        event.preventDefault();
        const dx = event.clientX - panRef.current.startX;
        const dy = event.clientY - panRef.current.startY;
        setView((prev) => ({ ...prev, x: panRef.current.originX + dx, y: panRef.current.originY + dy }));
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

    function handleZoneMouseDown(event: ReactMouseEvent<HTMLButtonElement>, zone: ZoneRow) {
        if (event.button === 2) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        if (event.button !== 0) return;
        const pointer = clientToStagePoint(event.clientX, event.clientY);
        if (!pointer) return;

        const geometry = parseZoneGeometry(zone.geometry);
        zoneDragRef.current = {
            zoneId: zone.id,
            offsetX: pointer.x - geometry.x,
            offsetY: pointer.y - geometry.y,
        };
        setMovingZoneId(zone.id);
        setSelectedZoneId(zone.id);
        event.preventDefault();
        event.stopPropagation();
    }

    async function handleZoneContextMenu(zone: ZoneRow) {
        const targetNodeId = zoneNodeId(zone);
        if (!targetNodeId) {
            setError(
                t(
                    "Esta zona no tiene nodo de destino para enlazar.",
                    "This zone has no target node to connect."
                )
            );
            return;
        }

        if (!pendingConnectionZoneId) {
            setPendingConnectionZoneId(zone.id);
            setNotice(
                t(
                    "Selecciona otra zona con clic derecho para conectarlas.",
                    "Right-click another zone to connect them."
                )
            );
            return;
        }

        if (pendingConnectionZoneId === zone.id) {
            setPendingConnectionZoneId(null);
            setNotice(t("Conexion entre zonas cancelada.", "Zone connection canceled."));
            return;
        }

        const sourceZone = zonesRef.current.find((entry) => entry.id === pendingConnectionZoneId) ?? null;
        const sourceNodeId = sourceZone ? zoneNodeId(sourceZone) : null;

        if (!sourceZone || !sourceNodeId) {
            setPendingConnectionZoneId(zone.id);
            setNotice(
                t(
                    "Selecciona otra zona con clic derecho para conectarlas.",
                    "Right-click another zone to connect them."
                )
            );
            return;
        }

        const alreadyLinked = mapConnections.some(
            (link) =>
                (link.from_node_id === sourceNodeId && link.to_node_id === targetNodeId)
                || (link.from_node_id === targetNodeId && link.to_node_id === sourceNodeId)
        );

        if (alreadyLinked) {
            setPendingConnectionZoneId(null);
            setNotice(
                t("Estas zonas ya estan conectadas.", "These zones are already connected.")
            );
            return;
        }

        await runMutation(async () => {
            const payload = {
                campaign_id: campaignId,
                from_node_id: sourceNodeId,
                to_node_id: targetNodeId,
                link_type: "RELATED",
                label: null,
                sort_order: nextSortOrder(
                    mapConnections.filter((link) => link.from_node_id === sourceNodeId)
                ),
            };

            const { data, error: insertError } = await supabase
                .from("campaign_story_links")
                .insert(payload)
                .select("id, campaign_id, from_node_id, to_node_id, link_type, label, sort_order")
                .maybeSingle();

            if (insertError) throw insertError;
            if (!data) throw new Error(t("No se pudo enlazar zonas.", "Could not connect zones."));

            const createdLink = data as LinkRow;
            setMapConnections((prev) => [...prev, createdLink]);
            if (selectedZoneNodeId && selectedZoneNodeId === createdLink.from_node_id) {
                setReferences((prev) => [...prev, createdLink]);
            }
            setPendingConnectionZoneId(null);
        }, { es: "Zonas conectadas.", en: "Zones connected." });
    }

    async function handleCreateAct() {
        await runMutation(async () => {
            const title = newActTitle.trim();
            if (!title) return;

            const payload = {
                campaign_id: campaignId,
                title,
                slug: slugify(`${title}-${Date.now()}`) || null,
                act_number: acts.reduce((max, act) => Math.max(max, act.act_number), 0) + 1,
                sort_order: nextSortOrder(acts),
                status: "DRAFT",
                created_by: userId,
                updated_by: userId,
            };

            const { data, error: insertError } = await supabase
                .from("campaign_acts")
                .insert(payload)
                .select("id, campaign_id, title, act_number, sort_order")
                .maybeSingle();

            if (insertError) throw insertError;
            if (!data) throw new Error(t("No se pudo crear acto.", "Could not create act."));

            const created = data as ActRow;
            setActs((prev) => [...prev, created]);
            setNewActTitle("");
            await enterAct(created.id);
        }, { es: "Acto creado.", en: "Act created." });
    }

    async function handleRenameAct(act: ActRow) {
        const nextTitleRaw = window.prompt(
            t("Nuevo nombre del acto", "New act name"),
            act.title
        );
        if (nextTitleRaw === null) return;

        const nextTitle = nextTitleRaw.trim();
        if (!nextTitle || nextTitle === act.title.trim()) return;

        await runMutation(async () => {
            const { data, error: updateError } = await supabase
                .from("campaign_acts")
                .update({
                    title: nextTitle,
                    updated_by: userId,
                })
                .eq("id", act.id)
                .eq("campaign_id", campaignId)
                .select("id, campaign_id, title, act_number, sort_order")
                .maybeSingle();

            if (updateError) throw updateError;
            if (!data) {
                throw new Error(t("No se pudo actualizar acto.", "Could not update act."));
            }

            const updated = data as ActRow;
            setActs((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
        }, { es: "Acto actualizado.", en: "Act updated." });
    }

    async function handleDeleteAct(act: ActRow) {
        const confirmed = window.confirm(
            t(
                `Eliminar el acto "${act.title}" y su contenido? Esta accion no se puede deshacer.`,
                `Delete act "${act.title}" and its content? This action cannot be undone.`
            )
        );
        if (!confirmed) return;

        await runMutation(async () => {
            const { data: nodeRows, error: nodeFetchError } = await supabase
                .from("campaign_story_nodes")
                .select("id")
                .eq("campaign_id", campaignId)
                .eq("act_id", act.id);

            if (nodeFetchError) throw nodeFetchError;
            const nodeIds = ((nodeRows ?? []) as Array<{ id: string }>)
                .map((row) => row.id)
                .filter(Boolean);

            if (nodeIds.length > 0) {
                const { data: mapRows, error: mapFetchError } = await supabase
                    .from("campaign_maps")
                    .select("id")
                    .eq("campaign_id", campaignId)
                    .in("node_id", nodeIds);
                if (mapFetchError) throw mapFetchError;

                const mapIds = ((mapRows ?? []) as Array<{ id: string }>)
                    .map((row) => row.id)
                    .filter(Boolean);

                if (mapIds.length > 0) {
                    const accessToken = await getSessionAccessToken();
                    for (const mapId of mapIds) {
                        const response = await fetch(
                            `/api/dnd/campaigns/${campaignId}/maps/${mapId}/clear-image`,
                            {
                                method: "POST",
                                headers: {
                                    Authorization: `Bearer ${accessToken}`,
                                },
                            }
                        );

                        if (!response.ok) {
                            const payload = (await response.json().catch(() => null)) as
                                | { error?: unknown }
                                | null;
                            throw new Error(
                                String(
                                    payload?.error ??
                                        t(
                                            "No se pudieron limpiar imagenes del acto.",
                                            "Could not clean act images."
                                        )
                                )
                            );
                        }
                    }
                }

                const { error: deleteMapsError } = await supabase
                    .from("campaign_maps")
                    .delete()
                    .eq("campaign_id", campaignId)
                    .in("node_id", nodeIds);
                if (deleteMapsError) throw deleteMapsError;

                const { error: deleteDocumentsError } = await supabase
                    .from("campaign_documents")
                    .delete()
                    .eq("campaign_id", campaignId)
                    .in("node_id", nodeIds);
                if (deleteDocumentsError) throw deleteDocumentsError;

                const { error: deleteNodesError } = await supabase
                    .from("campaign_story_nodes")
                    .delete()
                    .eq("campaign_id", campaignId)
                    .eq("act_id", act.id);
                if (deleteNodesError) throw deleteNodesError;
            }

            const { error: deleteActError } = await supabase
                .from("campaign_acts")
                .delete()
                .eq("id", act.id)
                .eq("campaign_id", campaignId);

            if (deleteActError) throw deleteActError;

            setActs((prev) => prev.filter((entry) => entry.id !== act.id));
            setNodes((prev) => prev.filter((entry) => entry.act_id !== act.id));

            if (currentActId === act.id) {
                setCurrentActId(null);
                setCurrentNodeId(null);
                setCurrentMap(null);
                setZones([]);
                setMapConnections([]);
                setPendingConnectionZoneId(null);
                setMovingZoneId(null);
                setSelectedZoneId(null);
                setReferences([]);
                setSelectedDocument(null);
                setView(createInitialMapView(viewportRef.current));
            }
        }, { es: "Acto eliminado.", en: "Act deleted." });
    }

    async function handleCreateZoneAt(stageX: number, stageY: number) {
        if (!currentNodeId || !currentMap || !currentActId) return;

        await runMutation(async () => {
            const childNodes = nodes.filter((node) => node.parent_id === currentNodeId);
            const zoneIndex = childNodes.length + 1;
            const newZoneTitle = `${t("Zona", "Zone")} ${zoneIndex}`;

            const nodePayload = {
                campaign_id: campaignId,
                act_id: currentActId,
                parent_id: currentNodeId,
                node_type: "LOCATION",
                title: newZoneTitle,
                slug: slugify(`${newZoneTitle}-${Date.now()}`) || null,
                summary: null,
                sort_order: nextSortOrder(childNodes),
                created_by: userId,
                updated_by: userId,
            };

            const { data: nodeData, error: nodeError } = await supabase
                .from("campaign_story_nodes")
                .insert(nodePayload)
                .select("id, campaign_id, act_id, parent_id, node_type, title, slug, sort_order, summary")
                .maybeSingle();

            if (nodeError) throw nodeError;
            if (!nodeData) throw new Error(t("No se pudo crear zona.", "Could not create zone."));

            const zoneNode = nodeData as NodeRow;
            setNodes((prev) => [...prev, zoneNode]);

            await ensureMapForNode(zoneNode.id, zoneNode.title);

            const geometry = {
                x: clamp(stageX, 0, STAGE_WIDTH),
                y: clamp(stageY, 0, STAGE_HEIGHT),
                radius: DEFAULT_ZONE_RADIUS,
                color: randomZoneColor(),
                icon: "*",
            };

            const zonePayload = {
                campaign_id: campaignId,
                map_id: currentMap.id,
                node_id: zoneNode.id,
                name: zoneNode.title,
                shape_type: "circle",
                geometry,
                is_visible: false,
                action_type: "OPEN_NODE",
                target_node_id: zoneNode.id,
                target_map_id: null,
                target_url: null,
                sort_order: nextSortOrder(zones),
                created_by: userId,
                updated_by: userId,
            };

            const { data: zoneData, error: zoneError } = await supabase
                .from("campaign_map_zones")
                .insert(zonePayload)
                .select(
                    "id, campaign_id, map_id, node_id, name, shape_type, geometry, is_visible, action_type, target_node_id, target_map_id, target_url, sort_order"
                )
                .maybeSingle();

            if (zoneError) throw zoneError;
            if (!zoneData) {
                throw new Error(t("No se pudo crear marcador.", "Could not create marker."));
            }

            const createdZone = zoneData as ZoneRow;
            setZones((prev) => [...prev, createdZone]);
            setSelectedZoneId(createdZone.id);
        }, { es: "Zona creada.", en: "Zone created." });
    }

    function handleViewportDoubleClick(event: ReactMouseEvent<HTMLDivElement>) {
        if (!currentMap) return;
        const pointer = clientToStagePoint(event.clientX, event.clientY);
        if (!pointer) return;

        void handleCreateZoneAt(pointer.x, pointer.y);
    }

    function handleOpenZone(zone: ZoneRow) {
        const nodeId = zone.target_node_id ?? zone.node_id;
        if (!nodeId) return;
        setPendingConnectionZoneId(null);
        void enterNode(nodeId);
    }

    async function handleSaveMap(options?: SaveHandlerOptions) {
        if (!currentMap) return;

        await runMutation(async () => {
            const nextImageUrl = mapImageDraft.trim() || BLANK_MAP_URL;

            if (
                currentMap.image_url !== BLANK_MAP_URL
                && nextImageUrl !== currentMap.image_url
            ) {
                const accessToken = await getSessionAccessToken();
                const clearResponse = await fetch(
                    `/api/dnd/campaigns/${campaignId}/maps/${currentMap.id}/clear-image`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                const clearPayload = (await clearResponse.json().catch(() => null)) as
                    | { error?: unknown }
                    | null;

                if (!clearResponse.ok) {
                    throw new Error(
                        String(
                            clearPayload?.error ??
                                t(
                                    "No se pudo limpiar la imagen anterior del mapa.",
                                    "Could not clean previous map image."
                                )
                        )
                    );
                }
            }

            const payload = {
                name: mapNameDraft.trim() || currentMap.name,
                image_url: nextImageUrl,
                updated_by: userId,
            };

            const { data, error: updateError } = await supabase
                .from("campaign_maps")
                .update(payload)
                .eq("id", currentMap.id)
                .eq("campaign_id", campaignId)
                .select("id, campaign_id, node_id, name, image_url, sort_order")
                .maybeSingle();

            if (updateError) throw updateError;
            if (!data) throw new Error(t("No se pudo guardar mapa.", "Could not save map."));

            const updated = data as MapRow;
            setCurrentMap(updated);
            setMapNameDraft(updated.name);
            setMapImageDraft(updated.image_url);
        }, { es: "Mapa guardado.", en: "Map saved." }, options);
    }

    async function handleClearMapImage() {
        if (!currentMap) return;
        if (currentMap.image_url === BLANK_MAP_URL) return;

        await runMutation(async () => {
            const accessToken = await getSessionAccessToken();
            const response = await fetch(
                `/api/dnd/campaigns/${campaignId}/maps/${currentMap.id}/clear-image`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            const payload = (await response.json().catch(() => null)) as
                | { error?: unknown; imageUrl?: unknown }
                | null;

            if (!response.ok) {
                throw new Error(
                    String(
                        payload?.error ??
                            t(
                                "No se pudo eliminar la imagen del mapa.",
                                "Could not remove map image."
                            )
                    )
                );
            }

            setCurrentMap((prev) =>
                prev
                    ? {
                          ...prev,
                          image_url:
                              typeof payload?.imageUrl === "string"
                                  ? payload.imageUrl
                                  : BLANK_MAP_URL,
                      }
                    : prev
            );
            setMapImageDraft("");
        }, { es: "Imagen eliminada.", en: "Image removed." });
    }

    async function handleUploadMapImage(file: File) {
        if (!currentMap) return;

        await runMutation(async () => {
            if (!file.type.startsWith("image/")) {
                throw new Error(
                    t(
                        "El archivo debe ser una imagen valida.",
                        "The file must be a valid image."
                    )
                );
            }
            if (file.size > MAX_MAP_IMAGE_BYTES) {
                throw new Error(
                    t(
                        "La imagen supera el limite de 50 MB.",
                        "Image exceeds the 50 MB limit."
                    )
                );
            }

            const accessToken = await getSessionAccessToken();

            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(
                `/api/dnd/campaigns/${campaignId}/maps/${currentMap.id}/upload-image`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: formData,
                }
            );

            const payload = (await response.json().catch(() => null)) as
                | { error?: unknown; imageUrl?: unknown }
                | null;

            if (!response.ok) {
                throw new Error(
                    String(
                        payload?.error ??
                            t(
                                "No se pudo subir la imagen del mapa.",
                                "Could not upload map image."
                            )
                    )
                );
            }

            const imageUrl =
                typeof payload?.imageUrl === "string" ? payload.imageUrl : "";
            if (!imageUrl) {
                throw new Error(
                    t(
                        "No se recibio URL publica de la imagen.",
                        "No public image URL was returned."
                    )
                );
            }

            setCurrentMap((prev) => (prev ? { ...prev, image_url: imageUrl } : prev));
            setMapImageDraft(imageUrl);
        }, { es: "Imagen subida.", en: "Image uploaded." });
    }

    function handleMapUploadInputChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;
        event.currentTarget.value = "";
        if (!file) return;
        void handleUploadMapImage(file);
    }

    async function handleSaveZone(options?: SaveHandlerOptions) {
        if (!selectedZone) return;

        await runMutation(async () => {
            const radius = clamp(Number(zoneRadiusDraft) || DEFAULT_ZONE_RADIUS, 16, 180);
            const opacity = clamp(Number(zoneOpacityDraft) || 100, 0, 100);
            const base = parseZoneGeometry(selectedZone.geometry);
            const nextColor = colorFromHexAndOpacity(zoneColorDraft || "#4f46e5", opacity);

            const payload = {
                name: zoneNameDraft.trim() || selectedZone.name,
                geometry: {
                    ...base,
                    radius,
                    color: nextColor,
                    icon: zoneIconDraft || base.icon,
                },
                is_visible: zoneVisibleDraft,
                updated_by: userId,
            };

            const { data, error: updateError } = await supabase
                .from("campaign_map_zones")
                .update(payload)
                .eq("id", selectedZone.id)
                .eq("campaign_id", campaignId)
                .select(
                    "id, campaign_id, map_id, node_id, name, shape_type, geometry, is_visible, action_type, target_node_id, target_map_id, target_url, sort_order"
                )
                .maybeSingle();

            if (updateError) throw updateError;
            if (!data) throw new Error(t("No se pudo guardar zona.", "Could not save zone."));

            const updatedZone = data as ZoneRow;
            setZones((prev) =>
                prev.map((zone) => (zone.id === updatedZone.id ? updatedZone : zone))
            );

            if (zoneVisibleDraft && selectedDocument && selectedDocument.visibility === "DM_ONLY") {
                const { data: updatedDocData, error: updateDocError } = await supabase
                    .from("campaign_documents")
                    .update({
                        visibility: "CAMPAIGN",
                        updated_by: userId,
                    })
                    .eq("id", selectedDocument.id)
                    .eq("campaign_id", campaignId)
                    .select(
                        "id, campaign_id, node_id, title, doc_type, visibility, editor_format, content, plain_text, latest_revision, metadata"
                    )
                    .maybeSingle();

                if (updateDocError) throw updateDocError;
                if (updatedDocData) {
                    setSelectedDocument(updatedDocData as DocumentRow);
                    setDocVisibilityDraft("CAMPAIGN");
                }
            }

            if (selectedZoneNodeId) {
                setNodes((prev) =>
                    prev.map((node) =>
                        node.id === selectedZoneNodeId
                            ? { ...node, title: updatedZone.name }
                            : node
                    )
                );
            }
        }, { es: "Zona guardada.", en: "Zone saved." }, options);
    }

    async function handleTrashZone() {
        if (!selectedZone) return;
        const confirmed = window.confirm(
            t(
                "Enviar esta zona a la papelera temporal? Podras restaurarla desde Ajustes durante 30 dias.",
                "Move this zone to temporary trash? You can restore it from Settings for 30 days."
            )
        );
        if (!confirmed) return;

        await runMutation(async () => {
            const { error: softDeleteError } = await supabase
                .from("campaign_map_zones")
                .update({
                    deleted_at: new Date().toISOString(),
                    deleted_by: userId,
                    updated_by: userId,
                })
                .eq("id", selectedZone.id)
                .eq("campaign_id", campaignId);

            if (softDeleteError) {
                const lowered = String(softDeleteError.message ?? "").toLowerCase();
                const missingTrashColumns =
                    lowered.includes("deleted_at") || lowered.includes("deleted_by");

                if (!missingTrashColumns) throw softDeleteError;

                const { error: legacyDeleteError } = await supabase
                    .from("campaign_map_zones")
                    .delete()
                    .eq("id", selectedZone.id)
                    .eq("campaign_id", campaignId);
                if (legacyDeleteError) throw legacyDeleteError;
            }

            setZones((prev) => prev.filter((zone) => zone.id !== selectedZone.id));
            setSelectedZoneId(null);
            setReferences([]);
            setSelectedDocument(null);

            if (typeof window !== "undefined") {
                window.dispatchEvent(
                    new CustomEvent("dnd-manager-zone-trash-updated", {
                        detail: { campaignId },
                    })
                );
            }
        }, { es: "Zona enviada a papelera.", en: "Zone moved to trash." });
    }

    async function handleAddReference(targetNodeId: string) {
        if (!selectedZoneNodeId) return;
        if (references.some((link) => link.to_node_id === targetNodeId)) return;

        await runMutation(async () => {
            const payload = {
                campaign_id: campaignId,
                from_node_id: selectedZoneNodeId,
                to_node_id: targetNodeId,
                link_type: "RELATED",
                label: null,
                sort_order: nextSortOrder(references),
            };

            const { data, error: insertError } = await supabase
                .from("campaign_story_links")
                .insert(payload)
                .select("id, campaign_id, from_node_id, to_node_id, link_type, label, sort_order")
                .maybeSingle();

            if (insertError) throw insertError;
            if (!data) throw new Error(t("No se pudo enlazar.", "Could not link."));

            const createdLink = data as LinkRow;
            setReferences((prev) => [...prev, createdLink]);
            setMapConnections((prev) => [...prev, createdLink]);
            setReferenceQuery("");
        }, { es: "Referencia creada.", en: "Reference added." });
    }

    async function handleRemoveReference(linkId: string) {
        await runMutation(async () => {
            const { error: deleteError } = await supabase
                .from("campaign_story_links")
                .delete()
                .eq("id", linkId)
                .eq("campaign_id", campaignId);
            if (deleteError) throw deleteError;
            setReferences((prev) => prev.filter((link) => link.id !== linkId));
            setMapConnections((prev) => prev.filter((link) => link.id !== linkId));
        }, { es: "Referencia eliminada.", en: "Reference removed." });
    }

    async function handleSaveDocument(options?: SaveHandlerOptions) {
        if (!selectedDocument) return;
        const normalizedDocHtml = normalizeEditorHtml(docHtmlDraft);
        if (normalizedDocHtml !== docHtmlDraft) {
            setDocHtmlDraft(normalizedDocHtml);
        }

        await runMutation(async () => {
            const nextRevision = Math.max(1, selectedDocument.latest_revision ?? 1) + 1;
            const currentMetadata =
                selectedDocument.metadata && typeof selectedDocument.metadata === "object"
                    ? (selectedDocument.metadata as Record<string, unknown>)
                    : {};
            const nextDefaultTextColor = normalizeDocDefaultTextColor(
                docDefaultTextColorDraft
            );

            const payload = {
                title: docTitleDraft.trim() || selectedDocument.title,
                doc_type: docTypeDraft,
                visibility: docVisibilityDraft,
                editor_format: "HTML",
                content: { html: normalizedDocHtml },
                plain_text: stripHtml(normalizedDocHtml),
                latest_revision: nextRevision,
                metadata: {
                    ...currentMetadata,
                    story_default_text_color: nextDefaultTextColor,
                },
                updated_by: userId,
            };

            const { data, error: updateError } = await supabase
                .from("campaign_documents")
                .update(payload)
                .eq("id", selectedDocument.id)
                .eq("campaign_id", campaignId)
                .select(
                    "id, campaign_id, node_id, title, doc_type, visibility, editor_format, content, plain_text, latest_revision, metadata"
                )
                .maybeSingle();

            if (updateError) throw updateError;
            if (!data) throw new Error(t("No se pudo guardar ficha.", "Could not save sheet."));

            const updatedDoc = data as DocumentRow;
            setSelectedDocument(updatedDoc);

            await supabase.from("campaign_document_revisions").insert({
                campaign_id: campaignId,
                document_id: updatedDoc.id,
                revision: nextRevision,
                editor_format: "HTML",
                content: { html: normalizedDocHtml },
                plain_text: stripHtml(normalizedDocHtml),
                created_by: userId,
            });
        }, { es: "Ficha guardada.", en: "Sheet saved." }, options);
    }

    async function handleTogglePlayerPreview() {
        if (playerPreviewMode) {
            setPlayerPreviewMode(false);
            return;
        }

        if (saving) return;
        setError(null);

        try {
            if (isMapDirty) {
                await handleSaveMap({ silent: true });
            }
            if (isZoneDirty) {
                await handleSaveZone({ silent: true });
            }
            if (isDocumentDirty) {
                await handleSaveDocument({ silent: true });
            }
        } finally {
            setPlayerPreviewReloadSignal((prev) => prev + 1);
            setPlayerPreviewMode(true);
        }
    }

    useEffect(() => {
        if (!selectedZoneId || !selectedZone) return undefined;
        if (!isZoneDirty) return undefined;
        if (saving) return undefined;

        if (zoneLiveSaveTimeoutRef.current !== null) {
            window.clearTimeout(zoneLiveSaveTimeoutRef.current);
            zoneLiveSaveTimeoutRef.current = null;
        }

        zoneLiveSaveTimeoutRef.current = window.setTimeout(() => {
            zoneLiveSaveTimeoutRef.current = null;
            if (zoneLiveSaveInFlightRef.current) return;
            zoneLiveSaveInFlightRef.current = true;
            void (async () => {
                try {
                    await handleSaveZone({ silent: true });
                } finally {
                    zoneLiveSaveInFlightRef.current = false;
                }
            })();
        }, 450);

        return () => {
            if (zoneLiveSaveTimeoutRef.current !== null) {
                window.clearTimeout(zoneLiveSaveTimeoutRef.current);
                zoneLiveSaveTimeoutRef.current = null;
            }
        };
    }, [
        selectedZoneId,
        selectedZone?.id,
        zoneNameDraft,
        zoneIconDraft,
        zoneColorDraft,
        zoneOpacityDraft,
        zoneRadiusDraft,
        isZoneDirty,
        saving,
    ]);

    useEffect(() => {
        if (!currentNodeId) return;

        const intervalId = window.setInterval(() => {
            if (saving) return;
            if (!isMapDirty && !isZoneDirty && !isDocumentDirty) return;
            if (autoSaveInFlightRef.current) return;

            autoSaveInFlightRef.current = true;
            void (async () => {
                try {
                    if (isMapDirty) {
                        await handleSaveMap({ silent: true });
                    }
                    if (isZoneDirty) {
                        await handleSaveZone({ silent: true });
                    }
                    if (isDocumentDirty) {
                        await handleSaveDocument({ silent: true });
                    }
                } finally {
                    autoSaveInFlightRef.current = false;
                }
            })();
        }, 30_000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [
        currentNodeId,
        saving,
        isMapDirty,
        isZoneDirty,
        isDocumentDirty,
        handleSaveMap,
        handleSaveZone,
        handleSaveDocument,
    ]);

    useEffect(() => {
        function onZoneTrashUpdated(event: Event) {
            const custom = event as CustomEvent<{ campaignId?: string }>;
            const targetCampaignId = String(custom.detail?.campaignId ?? "");
            if (!currentMap?.id || targetCampaignId !== campaignId) return;

            void (async () => {
                try {
                    const nextZones = await loadZones(currentMap.id);
                    const nextConnections = await loadMapConnections(nextZones);
                    setZones(nextZones);
                    setMapConnections(nextConnections);
                    setSelectedZoneId((prev) =>
                        prev && nextZones.some((zone) => zone.id === prev) ? prev : null
                    );
                    setPendingConnectionZoneId((prev) =>
                        prev && nextZones.some((zone) => zone.id === prev) ? prev : null
                    );
                } catch (err) {
                    setError(
                        toErrorMessage(
                            err,
                            t(
                                "No se pudo refrescar la papelera de zonas.",
                                "Could not refresh zone trash."
                            )
                        )
                    );
                }
            })();
        }

        window.addEventListener(
            "dnd-manager-zone-trash-updated",
            onZoneTrashUpdated as EventListener
        );
        return () =>
            window.removeEventListener(
                "dnd-manager-zone-trash-updated",
                onZoneTrashUpdated as EventListener
            );
    }, [campaignId, currentMap?.id]);

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

    function renderNodeLabel(node: NodeRow | null) {
        if (!node) return t("Zona desconocida", "Unknown zone");
        const act = node.act_id ? acts.find((entry) => entry.id === node.act_id) : null;
        if (!act) return node.title;
        return `A${act.act_number} - ${node.title}`;
    }

    if (loading) {
        return (
            <div className="space-y-2">
                <h1 className="text-xl font-semibold text-ink">
                    {t("Gestor de historia", "Story manager")}
                </h1>
                <p className="text-sm text-ink-muted">{t("Cargando...", "Loading...")}</p>
            </div>
        );
    }

    if (!currentActId) {
        return (
            <div className="story-manager-surface space-y-4">
                <h1 className="text-xl font-semibold text-ink">
                    {t("Gestor de historia", "Story manager")}
                </h1>
                <p className="text-sm text-ink-muted">
                    {t(
                        "Elige un acto para entrar en su mundo. Si no hay actos, crea uno.",
                        "Choose an act to enter its world. If no acts exist, create one."
                    )}
                </p>
                {error && (
                    <p className="text-sm text-red-700 bg-red-100 border border-red-200 rounded-md px-3 py-2">
                        {error}
                    </p>
                )}
                {notice && (
                    <p className="text-sm text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-md px-3 py-2">
                        {notice}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-2 border border-ring rounded-xl bg-panel/80 p-3">
                    <input
                        value={newActTitle}
                        onChange={(event) => setNewActTitle(event.target.value)}
                        placeholder={t("Nombre del acto", "Act name")}
                        className="min-w-[240px] flex-1 rounded-md border border-ring bg-white px-2 py-1.5 text-sm outline-none focus:border-accent"
                    />
                    <button
                        type="button"
                        onClick={() => void handleCreateAct()}
                        disabled={saving}
                        className="inline-flex items-center gap-1 rounded-md border border-accent/60 bg-accent/10 px-3 py-2 text-xs hover:bg-accent/20 disabled:opacity-60"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        {t("Crear acto", "Create act")}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {acts.map((act) => (
                        <div
                            key={act.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => void enterAct(act.id)}
                            onKeyDown={(event) => {
                                if (event.key !== "Enter" && event.key !== " ") return;
                                event.preventDefault();
                                void enterAct(act.id);
                            }}
                            className="rounded-xl border border-ring bg-panel/80 p-4 space-y-3 cursor-pointer"
                        >
                            <div className="w-full text-left">
                                <p className="text-xs text-ink-muted">{`ACTO ${act.act_number}`}</p>
                                <p className="text-base font-semibold text-ink">{act.title}</p>
                                <p className="text-xs text-ink-muted mt-1">
                                    {t("Entrar al mundo del acto", "Enter act world")}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        void handleRenameAct(act);
                                    }}
                                    disabled={saving}
                                    className="inline-flex items-center rounded-md border border-ring bg-white/80 px-2 py-1 text-xs hover:bg-white disabled:opacity-60"
                                >
                                    {t("Renombrar", "Rename")}
                                </button>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        void handleDeleteAct(act);
                                    }}
                                    disabled={saving}
                                    className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-60"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {t("Eliminar", "Delete")}
                                </button>
                            </div>
                        </div>
                    ))}
                    {acts.length === 0 && (
                        <p className="text-sm text-ink-muted">
                            {t("Aun no hay actos.", "No acts yet.")}
                        </p>
                    )}
                </div>
                <style jsx global>{STORY_MANAGER_GLOBAL_STYLES}</style>
            </div>
        );
    }

    return (
        <div className="story-manager-surface h-full min-h-0 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setCurrentActId(null);
                            setCurrentNodeId(null);
                            setCurrentMap(null);
                            setZones([]);
                            setMapConnections([]);
                            setPendingConnectionZoneId(null);
                            setMovingZoneId(null);
                            setSelectedZoneId(null);
                            setReferences([]);
                            setSelectedDocument(null);
                            setPlayerPreviewMode(false);
                            setNotice(null);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-ring bg-white/80 px-2.5 py-1.5 text-xs hover:bg-white"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        {t("Actos", "Acts")}
                    </button>
                    <h1 className="text-xl font-semibold text-ink">
                        {currentAct ? `ACTO ${currentAct.act_number}: ${currentAct.title}` : t("Acto", "Act")}
                    </h1>
                </div>
                <div className="flex max-w-full min-w-0 flex-wrap items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setEditorPanelCollapsed((prev) => {
                                const next = !prev;
                                if (next) setEditorPanelExpanded(false);
                                return next;
                            });
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-ring bg-white/80 px-2.5 py-1.5 text-xs hover:bg-white"
                    >
                        {editorPanelCollapsed
                            ? t("Mostrar editor", "Show editor")
                            : t("Ocultar editor", "Hide editor")}
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
                        className="inline-flex items-center gap-1 rounded-md border border-ring bg-white/80 px-2.5 py-1.5 text-xs hover:bg-white"
                    >
                        {editorPanelExpanded
                            ? t("Mostrar mapa", "Show map")
                            : t("Maximizar editor", "Maximize editor")}
                    </button>
                    {showMapPanel && showEditorPanel && (
                        <>
                            <span className="hidden xl:inline text-[11px] text-ink-muted max-w-[26rem] truncate">
                                {t(
                                    "Arrastra el separador para retraer o ampliar el editor.",
                                    "Drag the splitter to retract or expand the editor."
                                )}
                            </span>
                            <button
                                type="button"
                                onClick={() => setEditorPanelWidth(EDITOR_PANEL_DEFAULT_WIDTH)}
                                className="inline-flex items-center gap-1 rounded-md border border-ring bg-white/80 px-2.5 py-1.5 text-xs hover:bg-white"
                            >
                                {t("Reiniciar ancho editor", "Reset editor width")}
                            </button>
                        </>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            void handleTogglePlayerPreview();
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-ring bg-white/80 px-2.5 py-1.5 text-xs hover:bg-white"
                    >
                        {playerPreviewMode
                            ? t("Volver al editor", "Back to editor")
                            : t("Vista jugador", "Player view")}
                    </button>
                    <button
                        type="button"
                        onClick={() => void loadIndex()}
                        className="inline-flex items-center gap-1 rounded-md border border-ring bg-white/80 px-2.5 py-1.5 text-xs hover:bg-white"
                    >
                        <Save className="h-3.5 w-3.5" />
                        {t("Refrescar", "Refresh")}
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                {breadcrumbNodes.map((node, index) => (
                    <div key={node.id} className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void enterNode(node.id)}
                            className="rounded-md border border-ring bg-white/80 px-2 py-1 hover:bg-white"
                        >
                            {node.title}
                        </button>
                        {index < breadcrumbNodes.length - 1 && <span>/</span>}
                    </div>
                ))}
            </div>

            {error && (
                <p className="text-sm text-red-700 bg-red-100 border border-red-200 rounded-md px-3 py-2">
                    {error}
                </p>
            )}
            {notice && (
                <p className="text-sm text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-md px-3 py-2">
                    {notice}
                </p>
            )}

            {playerPreviewMode ? (
                <section className="min-h-0 flex-1 rounded-xl border border-ring bg-panel/80 p-3 overflow-hidden">
                    <StoryPlayerView
                        campaignId={campaignId}
                        locale={locale}
                        previewAsPlayer
                        initialNodeId={currentNodeId}
                        initialActId={currentActId}
                        reloadSignal={playerPreviewReloadSignal}
                    />
                </section>
            ) : (
            <div
                className={`min-h-0 flex-1 grid grid-cols-1 gap-4 items-stretch ${
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
                <section className="space-y-2 min-w-0 min-h-0 flex flex-col">
                    <div className="flex flex-wrap items-center gap-2 border border-ring rounded-xl bg-panel/80 p-3">
                        <input
                            value={mapNameDraft}
                            onChange={(event) => setMapNameDraft(event.target.value)}
                            placeholder={t("Nombre del mapa", "Map name")}
                            className="min-w-[180px] flex-[1_1_220px] rounded-md border border-ring bg-white px-2 py-1.5 text-sm outline-none focus:border-accent"
                        />
                        <input
                            value={mapImageDraft === BLANK_MAP_URL ? "" : mapImageDraft}
                            onChange={(event) => setMapImageDraft(event.target.value)}
                            placeholder={t("URL de imagen (vacio = mapa en blanco)", "Image URL (empty = blank map)")}
                            className="min-w-[220px] flex-[2_1_320px] rounded-md border border-ring bg-white px-2 py-1.5 text-sm outline-none focus:border-accent"
                        />
                        <button
                            type="button"
                            onClick={() => void handleSaveMap()}
                            disabled={!currentMap || saving}
                            className="shrink-0 inline-flex items-center justify-center gap-1 rounded-md border border-accent/60 bg-accent/10 px-3 py-1.5 text-xs hover:bg-accent/20 disabled:opacity-60"
                        >
                            <Save className="h-3.5 w-3.5" />
                            {t("Guardar mapa", "Save map")}
                        </button>
                        <button
                            type="button"
                            onClick={() => mapUploadInputRef.current?.click()}
                            disabled={!currentMap || saving}
                            className="shrink-0 inline-flex items-center justify-center gap-1 rounded-md border border-ring bg-white/80 px-3 py-1.5 text-xs hover:bg-white disabled:opacity-60"
                        >
                            <Upload className="h-3.5 w-3.5" />
                            {t("Subir imagen", "Upload image")}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                void handleClearMapImage();
                            }}
                            disabled={!currentMap || saving || currentMap.image_url === BLANK_MAP_URL}
                            className="shrink-0 inline-flex items-center justify-center gap-1 rounded-md border border-red-300 bg-red-100 px-3 py-1.5 text-xs text-red-700 hover:bg-red-200 disabled:opacity-60"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t("Quitar imagen", "Remove image")}
                        </button>
                        <input
                            ref={mapUploadInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleMapUploadInputChange}
                            className="hidden"
                        />
                    </div>

                    <div
                        ref={viewportRef}
                        onContextMenu={handleViewportContextMenu}
                        onMouseDown={handleViewportMouseDown}
                        onMouseMove={handleViewportMouseMove}
                        onWheel={handleViewportWheel}
                        onDoubleClick={handleViewportDoubleClick}
                        className={`relative flex-1 min-h-[320px] overflow-hidden rounded-xl border border-ring bg-panel/80 ${isPanning ? "cursor-grabbing" : "cursor-default"}`}
                    >
                        <div
                            className="story-map-canvas absolute left-0 top-0 origin-top-left"
                            style={{
                                width: `${STAGE_WIDTH}px`,
                                height: `${STAGE_HEIGHT}px`,
                                transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                                ["--story-map-overlay-opacity" as string]: isDarkTheme ? "0.66" : "0.54",
                                ["--story-map-edge-opacity" as string]: isDarkTheme ? "0.74" : "0.64",
                                ["--story-map-sepia" as string]: isDarkTheme ? "0.3" : "0.22",
                                ["--story-map-saturate" as string]: isDarkTheme ? "0.78" : "0.9",
                                ["--story-map-contrast" as string]: isDarkTheme ? "1.08" : "1.04",
                                ["--story-map-brightness" as string]: isDarkTheme ? "0.88" : "1",
                            }}
                        >
                            {currentMap?.image_url && currentMap.image_url !== BLANK_MAP_URL ? (
                                <img
                                    src={currentMap.image_url}
                                    alt={currentMap.name}
                                    draggable={false}
                                    className="story-map-base absolute inset-0 h-full w-full select-none object-cover pointer-events-none"
                                />
                            ) : (
                                <div
                                    className="story-map-base absolute inset-0"
                                    style={blankMapStyle}
                                />
                            )}
                            <div className="story-map-aging-overlay" aria-hidden />

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
                                const isPendingConnect = pendingConnectionZoneId === zone.id;
                                const isMoving = movingZoneId === zone.id;
                                const diameter = geometry.radius * 2;
                                const label = geometry.icon || "*";
                                const labelFontSize = zoneLabelFontSize(geometry.radius, label);
                                return (
                                    <button
                                        key={zone.id}
                                        type="button"
                                        onMouseDown={(event) => handleZoneMouseDown(event, zone)}
                                        onContextMenu={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            void handleZoneContextMenu(zone);
                                        }}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setSelectedZoneId(zone.id);
                                        }}
                                        onDoubleClick={(event) => {
                                            event.stopPropagation();
                                            handleOpenZone(zone);
                                        }}
                                        className={`story-zone-node absolute flex items-center justify-center rounded-full border-2 transition-transform ${
                                            isSelected
                                                ? "scale-105 border-white shadow-[0_0_0_3px_rgba(245,158,11,0.7)]"
                                                : "border-white/80"
                                        } ${isPendingConnect ? "shadow-[0_0_0_4px_rgba(245,158,11,0.9)]" : ""} ${
                                            isMoving ? "cursor-grabbing" : "cursor-pointer"
                                        } ${zone.is_visible ? "" : "opacity-70 border-dashed"}`}
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
                                        title={`${zone.name} (${t("Doble clic para entrar", "Double click to enter")})${
                                            zone.is_visible
                                                ? ""
                                                : ` · ${t("Oculta para jugadores", "Hidden from players")}`
                                        }`}
                                    >
                                        <span>{label}</span>
                                    </button>
                                );
                            })}
                            <div className="story-map-edge-overlay" aria-hidden />
                        </div>

                        <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-md border border-ring/70 bg-black/45 px-3 py-2 text-xs text-amber-100">
                            {t(
                                "Clic derecho + arrastrar: mover mapa | Arrastra zona con clic izquierdo: mover zona | Clic derecho en zona: conectar zonas | Rueda: zoom | Doble clic en mapa: crear zona | Doble clic en zona: entrar",
                                "Right-click + drag: pan | Left-drag zone: move zone | Right-click zone: connect zones | Wheel: zoom | Double click map: create zone | Double click zone: enter"
                            )}
                        </div>

                        {!showEditorPanel && (
                            <div
                                role="separator"
                                aria-orientation="vertical"
                                onMouseDown={handleEditorRevealFromMapMouseDown}
                                className="absolute right-2 top-1/2 z-20 hidden h-28 w-3 -translate-y-1/2 cursor-col-resize items-center justify-center rounded-md border border-ring/70 bg-panel/70 hover:bg-panel/90 xl:flex"
                                title={t(
                                    "Arrastra hacia la izquierda para mostrar el editor",
                                    "Drag left to reveal editor"
                                )}
                            >
                                <span className="h-12 w-1 rounded-full bg-ring/80" />
                            </div>
                        )}
                    </div>
                </section>
                )}

                {showMapPanel && showEditorPanel && (
                <div
                    role="separator"
                    aria-orientation="vertical"
                    onMouseDown={handleEditorResizerMouseDown}
                    className={`hidden xl:flex h-full min-h-[320px] items-center justify-center rounded-md border border-ring/60 bg-panel/50 ${
                        isResizingEditorPanel ? "cursor-col-resize" : "cursor-col-resize hover:bg-panel/80"
                    }`}
                    title={t("Arrastra para ajustar el ancho del editor", "Drag to resize editor width")}
                >
                    <span className="h-20 w-1 rounded-full bg-ring/80" />
                </div>
                )}

                {showEditorPanel && (
                <aside
                    className={`relative space-y-3 border border-ring rounded-xl bg-panel/80 p-3 overflow-y-auto styled-scrollbar h-full min-h-0 ${!showMapPanel ? "xl:pl-8" : ""}`}
                >
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
                        <div className="space-y-2">
                            <h2 className="text-sm font-semibold text-ink">{t("Zona", "Zone")}</h2>
                            <p className="text-xs text-ink-muted">
                                {t(
                                    "Haz clic en una zona para editar su informacion. Al principio no hay nada: crea zonas con doble clic sobre el mapa.",
                                    "Click a zone to edit it. At first there is nothing: create zones by double-clicking the map."
                                )}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-sm font-semibold text-ink">
                                    {t("Panel de zona", "Zone panel")}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setHideUpperTools((prev) => !prev)}
                                    className="rounded-md border border-ring bg-white/80 px-2 py-1 text-xs hover:bg-white"
                                >
                                    {hideUpperTools
                                        ? t("Mostrar herramientas superiores", "Show top tools")
                                        : t("Ocultar herramientas superiores", "Hide top tools")}
                                </button>
                            </div>

                            {!hideUpperTools && (
                                <>
                                    <section className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <h2 className="text-sm font-semibold text-ink">
                                                {t("Editar zona", "Edit zone")}
                                            </h2>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenZone(selectedZone)}
                                                className="inline-flex items-center gap-1 rounded-md border border-ring bg-white/80 px-2 py-1 text-xs hover:bg-white"
                                            >
                                                {t("Entrar", "Enter")}
                                            </button>
                                        </div>
                                        <input
                                            value={zoneNameDraft}
                                            onChange={(event) => setZoneNameDraft(event.target.value)}
                                            className="w-full rounded-md border border-ring bg-white px-2 py-1.5 text-sm outline-none focus:border-accent"
                                            placeholder={t("Nombre zona", "Zone name")}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                value={zoneIconDraft}
                                                onChange={(event) => setZoneIconDraft(event.target.value)}
                                                className="rounded-md border border-ring bg-white px-2 py-1.5 text-sm"
                                                placeholder={t("Icono", "Icon")}
                                            />
                                            <input
                                                value={zoneRadiusDraft}
                                                onChange={(event) => setZoneRadiusDraft(event.target.value)}
                                                className="rounded-md border border-ring bg-white px-2 py-1.5 text-sm"
                                                placeholder={t("Radio", "Radius")}
                                            />
                                        </div>
                                        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                                            <input
                                                type="color"
                                                value={zoneColorDraft}
                                                onChange={(event) => setZoneColorDraft(event.target.value)}
                                                className="h-9 rounded-md border border-ring bg-white px-1"
                                                title={t("Color", "Color")}
                                            />
                                            <input
                                                type="range"
                                                min={0}
                                                max={100}
                                                step={1}
                                                value={zoneOpacityDraft}
                                                onChange={(event) => setZoneOpacityDraft(event.target.value)}
                                                className="accent-accent"
                                                title={t("Transparencia", "Transparency")}
                                            />
                                            <input
                                                value={zoneOpacityDraft}
                                                onChange={(event) => {
                                                    const raw = event.target.value.replace(/[^\d]/g, "");
                                                    setZoneOpacityDraft(raw ? String(clamp(Number(raw), 0, 100)) : "0");
                                                }}
                                                className="w-[72px] rounded-md border border-ring bg-white px-2 py-1.5 text-xs"
                                                placeholder={t("Opacidad %", "Opacity %")}
                                                title={t("Opacidad en porcentaje", "Opacity in percent")}
                                            />
                                        </div>
                                        <label className="inline-flex items-center gap-2 text-xs text-ink">
                                            <input
                                                type="checkbox"
                                                checked={zoneVisibleDraft}
                                                onChange={(event) => setZoneVisibleDraft(event.target.checked)}
                                                className="h-4 w-4 rounded border border-ring accent-accent"
                                            />
                                            <span>
                                                {t("Visible para jugadores", "Visible to players")}
                                            </span>
                                        </label>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[11px] text-ink-muted">
                                                {t(
                                                    "Guardado de zona en tiempo real.",
                                                    "Zone changes are saved in real time."
                                                )}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => void handleTrashZone()}
                                                disabled={saving}
                                                className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-100 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-200 disabled:opacity-60"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                {t("Enviar a papelera", "Move to trash")}
                                            </button>
                                        </div>
                                    </section>

                                    <section className="space-y-2 border-t border-ring pt-3">
                                        <h3 className="text-sm font-semibold text-ink inline-flex items-center gap-1">
                                            <Link2 className="h-3.5 w-3.5" />
                                            {t("Referencias por nombre", "References by name")}
                                        </h3>
                                        <input
                                            value={referenceQuery}
                                            onChange={(event) => setReferenceQuery(event.target.value)}
                                            placeholder={t("Buscar zona o subzona", "Search zone or subzone")}
                                            className="w-full rounded-md border border-ring bg-white px-2 py-1.5 text-xs outline-none focus:border-accent"
                                        />

                                        {referenceMatches.length > 0 && (
                                            <div className="space-y-1 max-h-32 overflow-y-auto styled-scrollbar pr-1">
                                                {referenceMatches.map((node) => (
                                                    <div
                                                        key={node.id}
                                                        className="flex items-center justify-between gap-2 rounded-md border border-ring bg-white/80 px-2 py-1"
                                                    >
                                                        <span className="text-xs text-ink truncate">
                                                            {renderNodeLabel(node)}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleAddReference(node.id)}
                                                            className="rounded-md border border-accent/60 bg-accent/10 px-2 py-0.5 text-[11px]"
                                                        >
                                                            {t("Enlazar", "Link")}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            {references.length === 0 ? (
                                                <p className="text-xs text-ink-muted">
                                                    {t("Sin referencias.", "No references yet.")}
                                                </p>
                                            ) : (
                                                references.map((link) => {
                                                    const target = nodesById.get(link.to_node_id) ?? null;
                                                    return (
                                                        <div
                                                            key={link.id}
                                                            className="flex items-center justify-between gap-2 rounded-md border border-ring bg-white/80 px-2 py-1"
                                                        >
                                                            <span className="text-xs text-ink truncate">
                                                                {renderNodeLabel(target)}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (!target) return;
                                                                        void enterNode(target.id, target.act_id ?? undefined);
                                                                    }}
                                                                    className="rounded-md border border-ring bg-white px-1.5 py-0.5 text-[11px]"
                                                                    title={t("Ir", "Open")}
                                                                >
                                                                    <ExternalLink className="h-3 w-3" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => void handleRemoveReference(link.id)}
                                                                    className="rounded-md border border-red-300 bg-red-100 px-1.5 py-0.5 text-[11px] text-red-700"
                                                                    title={t("Quitar", "Remove")}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </section>
                                </>
                            )}

                            <section
                                className={`space-y-2 ${
                                    hideUpperTools ? "" : "border-t border-ring pt-3"
                                }`}
                            >
                                {!hideUpperTools && (
                                    <>
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-sm font-semibold text-ink">
                                                {t("Editor de la zona", "Zone editor")}
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => void handleSaveDocument()}
                                                disabled={!selectedDocument || saving}
                                                className="inline-flex items-center gap-1 rounded-md border border-accent/60 bg-accent/10 px-2 py-1 text-xs disabled:opacity-60"
                                            >
                                                <Save className="h-3 w-3" />
                                                {t("Guardar", "Save")}
                                            </button>
                                        </div>

                                        <input
                                            value={docTitleDraft}
                                            onChange={(event) => setDocTitleDraft(event.target.value)}
                                            className="w-full rounded-md border border-ring bg-white px-2 py-1.5 text-sm"
                                            placeholder={t("Titulo de ficha", "Sheet title")}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                value={docTypeDraft}
                                                onChange={(event) =>
                                                    setDocTypeDraft(event.target.value as DocumentType)
                                                }
                                                className="rounded-md border border-ring bg-white px-2 py-1.5 text-xs"
                                            >
                                                {([
                                                    "LORE",
                                                    "SESSION_SCRIPT",
                                                    "HANDOUT",
                                                    "GM_ONLY",
                                                    "PLAYER_NOTE",
                                                    "CUSTOM",
                                                ] as DocumentType[]).map((value) => (
                                                    <option key={value} value={value}>
                                                        {value}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                value={docVisibilityDraft}
                                                onChange={(event) =>
                                                    setDocVisibilityDraft(
                                                        event.target.value as DocumentVisibility
                                                    )
                                                }
                                                className="rounded-md border border-ring bg-white px-2 py-1.5 text-xs"
                                            >
                                                {(["DM_ONLY", "CAMPAIGN", "PUBLIC"] as DocumentVisibility[]).map(
                                                    (value) => (
                                                        <option key={value} value={value}>
                                                            {value}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>
                                        <div className="space-y-1 rounded-md border border-ring bg-white/70 p-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDocDefaultTextColorDraft("theme");
                                                        richTextEditorRef.current?.applyThemeTextColorToSelection();
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded-md border border-ring bg-white px-2 py-1 text-xs hover:bg-panel/80"
                                                >
                                                    {t(
                                                        "Aplicar color de tema al texto seleccionado",
                                                        "Apply theme color to selected text"
                                                    )}
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-ink-muted">
                                                {t(
                                                    "El texto marcado con este estilo cambia automaticamente entre modo claro y oscuro.",
                                                    "Text marked with this style adapts automatically between light and dark mode."
                                                )}
                                            </p>
                                        </div>
                                    </>
                                )}

                                <RichTextEditor
                                    ref={richTextEditorRef}
                                    value={docHtmlDraft}
                                    locale={locale}
                                    onChange={setDocHtmlDraft}
                                    forceHideToolbar={hideUpperTools}
                                />
                            </section>
                        </>
                    )}
                </aside>
                )}
            </div>
            )}
            <style jsx global>{STORY_MANAGER_GLOBAL_STYLES}</style>
        </div>
    );
}


