"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Bot, Check, Globe2, LayoutGrid, LogOut, Palette, RefreshCw, Sparkles, Type } from "lucide-react";
import { useUserSettings } from "@/app/components/SettingsProvider";
import { supabase } from "@/lib/supabaseClient";
import { tr } from "@/lib/i18n/translate";

type MembershipRow = {
    role: "PLAYER" | "DM";
};

type ZoneTrashRow = {
    id: string;
    campaign_id: string;
    map_id: string;
    node_id: string | null;
    name: string;
    deleted_at: string | null;
};

type CampaignMapLookupRow = {
    id: string;
    name: string;
};

type ZoneTrashEntry = ZoneTrashRow & {
    map_name: string | null;
};

const ZONE_TRASH_RETENTION_DAYS = 30;
const ZONE_TRASH_EVENT_NAME = "dnd-manager-zone-trash-updated";
const AI_GLOBAL_TRAINING_OPT_IN_STORAGE_KEY_PREFIX =
    "dnd-ai-global-training-opt-in-v1";

function hasMissingZoneTrashColumns(error: unknown) {
    const message = String(
        (error as { message?: unknown } | null | undefined)?.message ?? ""
    ).toLowerCase();
    return message.includes("deleted_at") || message.includes("deleted_by");
}

function asErrorMessage(error: unknown, fallback: string) {
    const message = String(
        (error as { message?: unknown } | null | undefined)?.message ?? ""
    ).trim();
    return message || fallback;
}

function optionClass(selected: boolean) {
    return `rounded-xl border px-3 py-2 text-left transition-all ${
        selected
            ? "border-accent bg-accent/10 shadow-[0_10px_24px_rgba(45,29,12,0.12)]"
            : "border-ring bg-white/75 hover:bg-white"
    }`;
}

export default function CampaignSettingsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const campaignId = String(params.id);
    const { settings, updateSettings, loading: settingsLoading } = useUserSettings();
    const locale = settings?.locale ?? "es";
    const t = (es: string, en: string) => tr(locale, es, en);

    const [loading, setLoading] = React.useState(true);
    const [allowed, setAllowed] = React.useState(false);
    const [role, setRole] = React.useState<"PLAYER" | "DM" | null>(null);
    const [loggingOut, setLoggingOut] = React.useState(false);
    const [zoneTrashLoading, setZoneTrashLoading] = React.useState(false);
    const [zoneTrashError, setZoneTrashError] = React.useState<string | null>(null);
    const [zoneTrashSupported, setZoneTrashSupported] = React.useState(true);
    const [zoneTrash, setZoneTrash] = React.useState<ZoneTrashEntry[]>([]);
    const [aiPromptConsent, setAiPromptConsent] = React.useState(false);

    const canManageZoneTrash = role === "DM";
    const from = searchParams.get("from");
    const aiPromptConsentStorageKey =
        `${AI_GLOBAL_TRAINING_OPT_IN_STORAGE_KEY_PREFIX}:${campaignId}`;
    const backHref =
        from === "dm"
            ? `/campaigns/${campaignId}/dm`
            : from === "player"
              ? `/campaigns/${campaignId}/player`
              : role === "DM"
                ? `/campaigns/${campaignId}/dm`
                : `/campaigns/${campaignId}/player`;

    function notifyZoneTrashChanged() {
        if (typeof window === "undefined") return;
        window.dispatchEvent(
            new CustomEvent(ZONE_TRASH_EVENT_NAME, {
                detail: { campaignId },
            })
        );
    }

    function formatDeletedAt(value: string | null) {
        if (!value) return t("Fecha desconocida", "Unknown date");
        const time = new Date(value);
        if (Number.isNaN(time.getTime())) return t("Fecha desconocida", "Unknown date");
        return new Intl.DateTimeFormat(locale, {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(time);
    }

    function getDaysUntilAutoDelete(value: string | null) {
        if (!value) return null;
        const deletedAt = new Date(value).getTime();
        if (!Number.isFinite(deletedAt)) return null;
        const expiresAt = deletedAt + ZONE_TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
        const remainingMs = expiresAt - Date.now();
        if (remainingMs <= 0) return 0;
        return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    }

    async function loadZoneTrash() {
        if (!campaignId || !canManageZoneTrash) return;
        setZoneTrashLoading(true);
        setZoneTrashError(null);
        setZoneTrashSupported(true);
        try {
            const purgeBefore = new Date(
                Date.now() - ZONE_TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000
            ).toISOString();

            const purgeRes = await supabase
                .from("campaign_map_zones")
                .delete()
                .eq("campaign_id", campaignId)
                .not("deleted_at", "is", null)
                .lte("deleted_at", purgeBefore);

            if (purgeRes.error) {
                if (hasMissingZoneTrashColumns(purgeRes.error)) {
                    setZoneTrash([]);
                    setZoneTrashSupported(false);
                    setZoneTrashError(null);
                    return;
                }
                throw purgeRes.error;
            }

            const zonesRes = await supabase
                .from("campaign_map_zones")
                .select("id, campaign_id, map_id, node_id, name, deleted_at")
                .eq("campaign_id", campaignId)
                .not("deleted_at", "is", null)
                .order("deleted_at", { ascending: false });

            if (zonesRes.error) {
                if (hasMissingZoneTrashColumns(zonesRes.error)) {
                    setZoneTrash([]);
                    setZoneTrashSupported(false);
                    setZoneTrashError(null);
                    return;
                }
                throw zonesRes.error;
            }

            const rows = (zonesRes.data ?? []) as ZoneTrashRow[];
            const mapIds = Array.from(new Set(rows.map((entry) => entry.map_id))).filter(Boolean);
            const mapNames = new Map<string, string>();
            if (mapIds.length > 0) {
                const mapsRes = await supabase
                    .from("campaign_maps")
                    .select("id, name")
                    .eq("campaign_id", campaignId)
                    .in("id", mapIds);
                if (!mapsRes.error) {
                    for (const map of (mapsRes.data ?? []) as CampaignMapLookupRow[]) {
                        mapNames.set(map.id, map.name);
                    }
                }
            }

            setZoneTrash(
                rows.map((entry) => ({
                    ...entry,
                    map_name: mapNames.get(entry.map_id) ?? null,
                }))
            );
        } catch (err) {
            setZoneTrashError(
                asErrorMessage(
                    err,
                    t(
                        "No se pudo cargar la papelera de zonas.",
                        "Could not load zone trash."
                    )
                )
            );
        } finally {
            setZoneTrashLoading(false);
        }
    }

    async function handleRestoreZone(zoneId: string) {
        if (!campaignId || !canManageZoneTrash || !zoneTrashSupported) return;
        setZoneTrashError(null);
        const { error } = await supabase
            .from("campaign_map_zones")
            .update({ deleted_at: null, deleted_by: null })
            .eq("campaign_id", campaignId)
            .eq("id", zoneId);

        if (error) {
            setZoneTrashError(
                asErrorMessage(
                    error,
                    t("No se pudo restaurar la zona.", "Could not restore the zone.")
                )
            );
            return;
        }

        setZoneTrash((prev) => prev.filter((entry) => entry.id !== zoneId));
        notifyZoneTrashChanged();
    }

    async function handleDeleteZonePermanently(zoneId: string) {
        if (!campaignId || !canManageZoneTrash || !zoneTrashSupported) return;
        const confirmed = window.confirm(
            t(
                "Eliminar permanentemente esta zona de la papelera?",
                "Permanently delete this zone from trash?"
            )
        );
        if (!confirmed) return;

        setZoneTrashError(null);
        const { error } = await supabase
            .from("campaign_map_zones")
            .delete()
            .eq("campaign_id", campaignId)
            .eq("id", zoneId);

        if (error) {
            setZoneTrashError(
                asErrorMessage(
                    error,
                    t(
                        "No se pudo eliminar la zona de forma permanente.",
                        "Could not permanently delete the zone."
                    )
                )
            );
            return;
        }

        setZoneTrash((prev) => prev.filter((entry) => entry.id !== zoneId));
        notifyZoneTrashChanged();
    }

    async function handleEmptyZoneTrashNow() {
        if (!campaignId || !canManageZoneTrash || !zoneTrashSupported || zoneTrash.length === 0) {
            return;
        }
        const confirmed = window.confirm(
            t(
                "Vaciar toda la papelera de zonas ahora? Esta accion no se puede deshacer.",
                "Empty all zone trash now? This action cannot be undone."
            )
        );
        if (!confirmed) return;

        setZoneTrashError(null);
        const { error } = await supabase
            .from("campaign_map_zones")
            .delete()
            .eq("campaign_id", campaignId)
            .not("deleted_at", "is", null);

        if (error) {
            setZoneTrashError(
                asErrorMessage(
                    error,
                    t("No se pudo vaciar la papelera.", "Could not empty trash.")
                )
            );
            return;
        }

        setZoneTrash([]);
        notifyZoneTrashChanged();
    }

    async function handleSignOut() {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Error cerrando sesion:", error);
            }
            router.replace("/login");
            router.refresh();
        } finally {
            setLoggingOut(false);
        }
    }

    function handleAiPromptConsentToggle(nextValue: boolean) {
        setAiPromptConsent(nextValue);
        if (typeof window === "undefined") return;
        try {
            window.localStorage.setItem(
                aiPromptConsentStorageKey,
                nextValue ? "1" : "0"
            );
        } catch {
            // ignore storage errors
        }
    }

    React.useEffect(() => {
        let active = true;

        async function checkAccess() {
            setLoading(true);
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!session?.user) {
                    router.replace("/login");
                    return;
                }

                const { data: membership, error } = await supabase
                    .from("campaign_members")
                    .select("role")
                    .eq("user_id", session.user.id)
                    .eq("campaign_id", campaignId)
                    .maybeSingle<MembershipRow>();

                if (error || !membership) {
                    router.replace("/campaigns");
                    return;
                }

                if (!active) return;
                setRole(membership.role);
                setAllowed(true);
            } catch (error) {
                console.error("settings access error:", error);
                if (active) {
                    router.replace("/campaigns");
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        void checkAccess();
        return () => {
            active = false;
        };
    }, [campaignId, router]);

    React.useEffect(() => {
        if (!allowed || !canManageZoneTrash) return;
        void loadZoneTrash();
    }, [allowed, canManageZoneTrash, campaignId]);

    React.useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const saved = window.localStorage.getItem(aiPromptConsentStorageKey);
            setAiPromptConsent(saved === "1");
        } catch {
            // ignore storage errors
        }
    }, [aiPromptConsentStorageKey]);

    if (loading || !allowed) {
        return (
            <main className="min-h-screen bg-surface text-ink flex items-center justify-center px-4">
                <p className="text-sm text-ink-muted">{t("Cargando ajustes...", "Loading settings...")}</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-surface text-ink">
            <div className="mx-auto w-full max-w-6xl px-4 py-4 md:py-5 space-y-4">
                <header className="rounded-2xl border border-ring bg-panel/90 p-3.5 md:p-4 shadow-[0_16px_40px_rgba(45,29,12,0.14)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-2xl font-semibold text-ink">
                                {t("Ajustes de campaña", "Campaign settings")}
                            </h1>
                            <p className="text-sm text-ink-muted mt-1">
                                {t(
                                    "Configura idioma, modo visual, IA y accesibilidad en una vista completa.",
                                    "Configure language, visual mode, AI and accessibility in a full-page view."
                                )}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push(backHref)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-ring bg-white/80 px-3 py-2 text-sm text-ink hover:bg-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t("Volver", "Back")}
                        </button>
                    </div>
                </header>

                <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <article className="rounded-2xl border border-ring bg-panel/90 p-4 space-y-3">
                        <div>
                            <h2 className="text-base font-semibold text-ink inline-flex items-center gap-2">
                                <Globe2 className="h-4 w-4 text-ember" />
                                {t("Idioma", "Language")}
                            </h2>
                            <p className="text-xs text-ink-muted mt-1">
                                {t(
                                    "Selecciona el idioma principal de la interfaz.",
                                    "Choose your main interface language."
                                )}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:justify-center">
                            <button
                                type="button"
                                disabled={settingsLoading}
                                onClick={() => void updateSettings({ locale: "es" })}
                                className={`${optionClass(settings.locale === "es")} lang-flag-btn lang-flag-btn--es w-full sm:max-w-[176px] sm:justify-self-center`}
                            >
                                <div className="relative z-10 flex items-center justify-between gap-2">
                                    <span className="inline-flex min-w-0 items-center gap-2">
                                        <span className="text-lg leading-none">🇪🇸</span>
                                        <span className="font-medium truncate">Español</span>
                                    </span>
                                    {settings.locale === "es" && <Check className="h-4 w-4 text-accent" />}
                                </div>
                            </button>
                            <button
                                type="button"
                                disabled={settingsLoading}
                                onClick={() => void updateSettings({ locale: "en" })}
                                className={`${optionClass(settings.locale === "en")} lang-flag-btn lang-flag-btn--en w-full sm:max-w-[176px] sm:justify-self-center`}
                            >
                                <div className="relative z-10 flex items-center justify-between gap-2">
                                    <span className="inline-flex min-w-0 items-center gap-2">
                                        <span className="text-lg leading-none">🇺🇸</span>
                                        <span className="font-medium truncate">English</span>
                                    </span>
                                    {settings.locale === "en" && <Check className="h-4 w-4 text-accent" />}
                                </div>
                            </button>
                        </div>
                    </article>

                    <article className="rounded-2xl border border-ring bg-panel/90 p-4 space-y-3">
                        <div>
                            <h2 className="text-base font-semibold text-ink inline-flex items-center gap-2">
                                <Palette className="h-4 w-4 text-ember" />
                                {t("Modo visual", "Display mode")}
                            </h2>
                            <p className="text-xs text-ink-muted mt-1">
                                {t(
                                    "Botones rápidos para cambiar el aspecto global.",
                                    "Quick buttons to switch the overall look."
                                )}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                                type="button"
                                disabled={settingsLoading}
                                onClick={() => void updateSettings({ theme: "normal" })}
                                className={optionClass(settings.theme === "normal")}
                            >
                                <p className="text-sm font-medium">{t("Normal", "Normal")}</p>
                                <p className="text-[11px] text-ink-muted mt-1">
                                    {t("Tema base", "Base theme")}
                                </p>
                            </button>
                            <button
                                type="button"
                                disabled={settingsLoading}
                                onClick={() => void updateSettings({ theme: "light" })}
                                className={optionClass(settings.theme === "light")}
                            >
                                <p className="text-sm font-medium">{t("Claro", "Light")}</p>
                                <p className="text-[11px] text-ink-muted mt-1">
                                    {t("Más luminoso", "Brighter")}
                                </p>
                            </button>
                            <button
                                type="button"
                                disabled={settingsLoading}
                                onClick={() => void updateSettings({ theme: "dark" })}
                                className={optionClass(settings.theme === "dark")}
                            >
                                <p className="text-sm font-medium">{t("Oscuro", "Dark")}</p>
                                <p className="text-[11px] text-ink-muted mt-1">
                                    {t("Menos luz", "Lower-light")}
                                </p>
                            </button>
                        </div>
                    </article>
                    <article className="rounded-2xl border border-ring bg-panel/90 p-4 space-y-3">
                        <div>
                            <h2 className="text-base font-semibold text-ink inline-flex items-center gap-2">
                                <LayoutGrid className="h-4 w-4 text-ember" />
                                {t("Interfaz y letras", "Interface and fonts")}
                            </h2>
                            <p className="text-xs text-ink-muted mt-1">
                                {t(
                                    "Ajusta densidad y tamaño de texto.",
                                    "Adjust density and text size."
                                )}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs uppercase tracking-[0.16em] text-ink-muted">
                                {t("Densidad", "Density")}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    disabled={settingsLoading}
                                    onClick={() => void updateSettings({ density: "comfortable" })}
                                    className={optionClass(settings.density === "comfortable")}
                                >
                                    <p className="text-sm font-medium">{t("Cómoda", "Comfortable")}</p>
                                </button>
                                <button
                                    type="button"
                                    disabled={settingsLoading}
                                    onClick={() => void updateSettings({ density: "compact" })}
                                    className={optionClass(settings.density === "compact")}
                                >
                                    <p className="text-sm font-medium">{t("Compacta", "Compact")}</p>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs uppercase tracking-[0.16em] text-ink-muted inline-flex items-center gap-2">
                                <Type className="h-3.5 w-3.5" />
                                {t("Tamaño de letra", "Font size")}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    disabled={settingsLoading}
                                    onClick={() => void updateSettings({ fontScale: "sm" })}
                                    className={optionClass(settings.fontScale === "sm")}
                                >
                                    <p className="text-sm font-medium">{t("Pequeña", "Small")}</p>
                                </button>
                                <button
                                    type="button"
                                    disabled={settingsLoading}
                                    onClick={() => void updateSettings({ fontScale: "md" })}
                                    className={optionClass(settings.fontScale === "md")}
                                >
                                    <p className="text-sm font-medium">{t("Media", "Medium")}</p>
                                </button>
                                <button
                                    type="button"
                                    disabled={settingsLoading}
                                    onClick={() => void updateSettings({ fontScale: "lg" })}
                                    className={optionClass(settings.fontScale === "lg")}
                                >
                                    <p className="text-sm font-medium">{t("Grande", "Large")}</p>
                                </button>
                            </div>
                        </div>
                    </article>

                    <article className="rounded-2xl border border-ring bg-panel/90 p-4 space-y-3">
                        <div>
                            <h2 className="text-base font-semibold text-ink inline-flex items-center gap-2">
                                <Bot className="h-4 w-4 text-ember" />
                                {t("Ajustes IA", "AI settings")}
                            </h2>
                            <p className="text-xs text-ink-muted mt-1">
                                {t(
                                    "Define ayudas y comportamiento visual del asistente.",
                                    "Set hint and assistant visual behavior."
                                )}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                disabled={settingsLoading}
                                onClick={() =>
                                    void updateSettings({ animations: !settings.animations })
                                }
                                className={optionClass(settings.animations)}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="inline-flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-ember" />
                                        <span className="font-medium">{t("Animaciones", "Animations")}</span>
                                    </span>
                                    <span
                                        className={`text-[11px] px-2 py-0.5 rounded-full border ${
                                            settings.animations
                                                ? "border-emerald-400/70 bg-emerald-100 text-emerald-700"
                                                : "border-ring bg-white/80 text-ink-muted"
                                        }`}
                                    >
                                        {settings.animations ? t("Activadas", "Enabled") : t("Desactivadas", "Disabled")}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-[10px] text-ink-muted leading-snug">
                                    {t(
                                        "Suaviza transiciones, iconos y paneles.",
                                        "Smooth transitions, icons, and panels."
                                    )}
                                </p>
                            </button>

                            <button
                                type="button"
                                disabled={settingsLoading}
                                onClick={() => void updateSettings({ showHints: !settings.showHints })}
                                className={optionClass(settings.showHints)}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-medium">{t("Mostrar ayudas", "Show hints")}</span>
                                    <span
                                        className={`text-[11px] px-2 py-0.5 rounded-full border ${
                                            settings.showHints
                                                ? "border-emerald-400/70 bg-emerald-100 text-emerald-700"
                                                : "border-ring bg-white/80 text-ink-muted"
                                        }`}
                                    >
                                        {settings.showHints ? t("Sí", "Yes") : t("No", "No")}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-[10px] text-ink-muted leading-snug">
                                    {t(
                                        "Muestra explicaciones cortas en formularios y secciones.",
                                        "Show short explanations in forms and sections."
                                    )}
                                </p>
                            </button>

                            <button
                                type="button"
                                disabled={settingsLoading}
                                onClick={() => handleAiPromptConsentToggle(!aiPromptConsent)}
                                className={`${optionClass(aiPromptConsent)} md:col-span-2`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-medium">
                                        {t(
                                            "Permiso de prompts IA",
                                            "AI prompts permission"
                                        )}
                                    </span>
                                    <span
                                        className={`text-[11px] px-2 py-0.5 rounded-full border ${
                                            aiPromptConsent
                                                ? "border-emerald-400/70 bg-emerald-100 text-emerald-700"
                                                : "border-amber-400/70 bg-amber-100 text-amber-900"
                                        }`}
                                    >
                                        {aiPromptConsent
                                            ? t("Concedido", "Granted")
                                            : t("No concedido", "Not granted")}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-[10px] text-ink-muted leading-snug">
                                    {t(
                                        "Controla si tus prompts se pueden usar para mejorar el entrenamiento global de la IA.",
                                        "Controls whether your prompts can be used to improve global AI training."
                                    )}
                                </p>
                            </button>

                            <details className="md:col-span-2 rounded-xl border border-ring/80 bg-white/70 px-3 py-2 text-[10px] text-ink leading-relaxed">
                                <summary className="cursor-pointer select-none font-semibold text-ink">
                                    {t(
                                        "Documentación del permiso de prompts",
                                        "Prompts permission documentation"
                                    )}
                                </summary>
                                <div className="mt-2 space-y-1.5">
                                    <p>
                                        {t(
                                            "Por qué existe: permite mejorar la calidad del asistente con ejemplos reales de uso.",
                                            "Why it exists: it helps improve assistant quality using real usage examples."
                                        )}
                                    </p>
                                    <p>
                                        {t(
                                            "Para qué sirve: el sistema aprende patrones de peticiones y respuestas para proponer cambios más precisos.",
                                            "What it is for: the system learns request/response patterns to propose more accurate changes."
                                        )}
                                    </p>
                                    <p>
                                        {t(
                                            "Qué información compromete: el texto de tus prompts y contexto funcional del cambio dentro de la campaña (por ejemplo, tipo de entidad o sección de trabajo). No incluye tu contraseña ni tokens.",
                                            "What information it exposes: your prompt text and functional context of the change inside the campaign (for example, entity type or working section). It does not include your password or tokens."
                                        )}
                                    </p>
                                    <p className="text-ink-muted">
                                        {t(
                                            "Recomendación: no escribas datos personales sensibles en los prompts si activas este permiso.",
                                            "Recommendation: do not include sensitive personal data in prompts if you enable this permission."
                                        )}
                                    </p>
                                </div>
                            </details>
                        </div>
                    </article>
                </section>

                {canManageZoneTrash && (
                    <section className="rounded-2xl border border-ring bg-panel/90 p-5 space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-ink">
                                    {t("Papelera de zonas", "Zone trash")}
                                </h2>
                                <p className="text-xs text-ink-muted mt-1">
                                    {t(
                                        "Las zonas eliminadas se guardan 30 días antes de borrarse automáticamente.",
                                        "Deleted zones are kept for 30 days before automatic purge."
                                    )}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => void loadZoneTrash()}
                                    disabled={zoneTrashLoading}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-ring bg-white/75 px-3 py-1.5 text-xs hover:bg-white disabled:opacity-60"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    {t("Actualizar", "Refresh")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleEmptyZoneTrashNow()}
                                    disabled={!zoneTrashSupported || zoneTrashLoading || zoneTrash.length === 0}
                                    className="rounded-lg border border-red-300/70 bg-red-50/80 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
                                >
                                    {t("Vaciar ahora", "Empty now")}
                                </button>
                            </div>
                        </div>
                        {zoneTrashError && (
                            <p className="text-xs text-red-700 bg-red-100 border border-red-200 rounded-lg px-3 py-2">
                                {zoneTrashError}
                            </p>
                        )}

                        {!zoneTrashSupported ? (
                            <p className="text-xs text-ink-muted">
                                {t(
                                    "La papelera no está disponible en esta base de datos. Ejecuta la migración 2026-02-19-zone-trash.sql para activarla.",
                                    "Trash is not available on this database. Run migration 2026-02-19-zone-trash.sql to enable it."
                                )}
                            </p>
                        ) : zoneTrashLoading ? (
                            <p className="text-xs text-ink-muted">
                                {t("Cargando papelera...", "Loading trash...")}
                            </p>
                        ) : zoneTrash.length === 0 ? (
                            <p className="text-xs text-ink-muted">
                                {t("No hay zonas eliminadas.", "There are no deleted zones.")}
                            </p>
                        ) : (
                            <div className="max-h-[28rem] overflow-y-auto styled-scrollbar pr-1 grid grid-cols-1 lg:grid-cols-2 gap-3">
                                {zoneTrash.map((entry) => {
                                    const daysLeft = getDaysUntilAutoDelete(entry.deleted_at);
                                    return (
                                        <div
                                            key={entry.id}
                                            className="rounded-xl border border-ring bg-white/80 px-3 py-2.5"
                                        >
                                            <p className="text-sm font-semibold text-ink truncate">
                                                {entry.name}
                                            </p>
                                            <p className="text-xs text-ink-muted truncate mt-0.5">
                                                {entry.map_name ?? t("Mapa desconocido", "Unknown map")}
                                            </p>
                                            <p className="text-xs text-ink-muted mt-1">
                                                {t("Eliminada:", "Deleted:")} {formatDeletedAt(entry.deleted_at)}
                                            </p>
                                            <p className="text-xs text-ink-muted">
                                                {daysLeft === null
                                                    ? t("Caducidad desconocida", "Unknown expiry")
                                                    : daysLeft <= 0
                                                      ? t("Caduca hoy", "Expires today")
                                                      : t(
                                                            `Caduca en ${daysLeft} días`,
                                                            `Expires in ${daysLeft} days`
                                                        )}
                                            </p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => void handleRestoreZone(entry.id)}
                                                    className="rounded-md border border-emerald-300 bg-emerald-100 px-2 py-1 text-[11px] text-emerald-700 hover:bg-emerald-200"
                                                >
                                                    {t("Restaurar", "Restore")}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleDeleteZonePermanently(entry.id)}
                                                    className="rounded-md border border-red-300 bg-red-100 px-2 py-1 text-[11px] text-red-700 hover:bg-red-200"
                                                >
                                                    {t("Borrar ya", "Delete now")}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                <section className="rounded-2xl border border-ring bg-panel/90 p-5">
                    <h2 className="text-base font-semibold text-ink">{t("Sesión y acceso", "Session and access")}</h2>
                    <p className="text-xs text-ink-muted mt-1">
                        {t(
                            "Gestiona cambio de rol o cierre de sesión.",
                            "Manage role switch or sign out."
                        )}
                    </p>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => router.push("/campaigns")}
                            className="w-full rounded-xl border border-ring bg-white/80 px-4 py-3 text-sm text-ink hover:bg-white"
                        >
                            {t("Cambiar rol", "Switch role")}
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleSignOut()}
                            disabled={loggingOut}
                            className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-red-300/70 bg-red-50/80 px-4 py-3 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                            <LogOut className="h-4 w-4" />
                            {loggingOut
                                ? t("Cerrando sesión...", "Signing out...")
                                : t("Cerrar sesión", "Sign out")}
                        </button>
                    </div>
                </section>
            </div>

            <style jsx global>{`
                @keyframes lang-flag-flow {
                    0% {
                        background-position: 50% 0%;
                        transform: translateY(-10%) scale(1.08);
                    }

                    100% {
                        background-position: 50% 100%;
                        transform: translateY(0) scale(1);
                    }
                }

                .lang-flag-btn {
                    position: relative;
                    overflow: hidden;
                    isolation: isolate;
                }

                .lang-flag-btn::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    opacity: 0;
                    background-size: 200% 200%;
                    transform: translateY(-10%) scale(1.08);
                    transition: opacity 180ms ease-out;
                    z-index: 0;
                }

                .lang-flag-btn:not(:disabled):hover::before {
                    opacity: 0.42;
                    animation: lang-flag-flow 760ms ease-out both;
                }

                .lang-flag-btn--es::before {
                    background-image: linear-gradient(
                        90deg,
                        rgba(170, 21, 27, 0.78) 0%,
                        rgba(170, 21, 27, 0.78) 30%,
                        rgba(241, 191, 0, 0.66) 30%,
                        rgba(241, 191, 0, 0.66) 70%,
                        rgba(170, 21, 27, 0.78) 70%,
                        rgba(170, 21, 27, 0.78) 100%
                    );
                }

                .lang-flag-btn--en::before {
                    background-image:
                        linear-gradient(
                            90deg,
                            rgba(60, 59, 110, 0.72) 0%,
                            rgba(60, 59, 110, 0.72) 28%,
                            rgba(60, 59, 110, 0) 28%
                        ),
                        repeating-linear-gradient(
                            90deg,
                            rgba(178, 34, 52, 0.66) 0%,
                            rgba(178, 34, 52, 0.66) 16%,
                            rgba(255, 255, 255, 0.52) 16%,
                            rgba(255, 255, 255, 0.52) 32%
                        );
                }

                .styled-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(179, 90, 44, 0.45) rgba(140, 114, 85, 0.12);
                }

                .styled-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                .styled-scrollbar::-webkit-scrollbar-track {
                    background: rgba(140, 114, 85, 0.12);
                    border-radius: 10px;
                }

                .styled-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(179, 90, 44, 0.35);
                    border-radius: 10px;
                    border: 2px solid transparent;
                    background-clip: padding-box;
                }

                .styled-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(179, 90, 44, 0.55);
                }
            `}</style>
        </main>
    );
}
