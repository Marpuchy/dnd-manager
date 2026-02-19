"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useUserSettings } from "@/app/components/SettingsProvider";
import { supabase } from "@/lib/supabaseClient";
import { X } from "lucide-react";
import { tr } from "@/lib/i18n/translate";

type SettingsPanelProps = {
    open: boolean;
    onClose: () => void;
    campaignId?: string;
    canManageZoneTrash?: boolean;
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

export default function SettingsPanel({
    open,
    onClose,
    campaignId,
    canManageZoneTrash = false,
}: SettingsPanelProps) {
    const router = useRouter();
    const { settings, updateSettings, loading } = useUserSettings();
    const [loggingOut, setLoggingOut] = React.useState(false);
    const [zoneTrashLoading, setZoneTrashLoading] = React.useState(false);
    const [zoneTrashError, setZoneTrashError] = React.useState<string | null>(null);
    const [zoneTrashSupported, setZoneTrashSupported] = React.useState(true);
    const [zoneTrash, setZoneTrash] = React.useState<ZoneTrashEntry[]>([]);
    const locale = settings?.locale ?? "es";
    const t = (es: string, en: string) => tr(locale, es, en);
    const showZoneTrash = Boolean(open && canManageZoneTrash && campaignId);

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
        if (!campaignId || !zoneTrashSupported) return;
        setZoneTrashError(null);
        const { error } = await supabase
            .from("campaign_map_zones")
            .update({
                deleted_at: null,
                deleted_by: null,
            })
            .eq("campaign_id", campaignId)
            .eq("id", zoneId);

        if (error) {
            setZoneTrashError(
                asErrorMessage(
                    error,
                    t(
                        "No se pudo restaurar la zona.",
                        "Could not restore the zone."
                    )
                )
            );
            return;
        }

        setZoneTrash((prev) => prev.filter((entry) => entry.id !== zoneId));
        notifyZoneTrashChanged();
    }

    async function handleDeleteZonePermanently(zoneId: string) {
        if (!campaignId || !zoneTrashSupported) return;
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
        if (!campaignId || !zoneTrashSupported || zoneTrash.length === 0) return;
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
                    t(
                        "No se pudo vaciar la papelera.",
                        "Could not empty trash."
                    )
                )
            );
            return;
        }

        setZoneTrash([]);
        notifyZoneTrashChanged();
    }

    React.useEffect(() => {
        if (!showZoneTrash) return;
        void loadZoneTrash();
    }, [showZoneTrash, campaignId]);

    async function handleSignOut() {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Error cerrando sesion:", error);
            }
            onClose();
            router.replace("/login");
            router.refresh();
        } finally {
            setLoggingOut(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full max-w-md rounded-2xl border border-ring bg-panel/95 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-ink">{t("Ajustes", "Settings")}</h3>
                        <p className="text-[11px] text-ink-muted">
                            {t("Personaliza tu vista de jugador.", "Customize your player view.")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("Cerrar ajustes", "Close settings")}
                        className="rounded-full border border-ring bg-white/70 p-1.5 hover:bg-white"
                    >
                        <X className="h-4 w-4 text-ink" />
                    </button>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                    <div className="space-y-1">
                        <label className="text-xs text-ink-muted">{t("Tema", "Theme")}</label>
                        <select
                            value={settings.theme}
                            onChange={(event) =>
                                updateSettings({ theme: event.target.value as any })
                            }
                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                            disabled={loading}
                        >
                            <option value="normal">{t("Normal", "Normal")}</option>
                            <option value="light">{t("Claro", "Light")}</option>
                            <option value="dark">{t("Oscuro", "Dark")}</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-ink-muted">{t("Idioma por defecto", "Default language")}</label>
                        <select
                            value={settings.locale}
                            onChange={(event) =>
                                updateSettings({ locale: event.target.value as any })
                            }
                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                            disabled={loading}
                        >
                            <option value="es">{t("Espanol", "Spanish")}</option>
                            <option value="en">{t("Ingles", "English")}</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-ink-muted">{t("Densidad", "Density")}</label>
                            <select
                                value={settings.density}
                                onChange={(event) =>
                                    updateSettings({ density: event.target.value as any })
                                }
                                className="w-full rounded-md bg-white/80 border border-ring px-2 py-2 text-sm text-ink outline-none focus:border-accent"
                                disabled={loading}
                            >
                                <option value="comfortable">{t("Comoda", "Comfortable")}</option>
                                <option value="compact">{t("Compacta", "Compact")}</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-ink-muted">{t("Tamano de fuente", "Font size")}</label>
                            <select
                                value={settings.fontScale}
                                onChange={(event) =>
                                    updateSettings({ fontScale: event.target.value as any })
                                }
                                className="w-full rounded-md bg-white/80 border border-ring px-2 py-2 text-sm text-ink outline-none focus:border-accent"
                                disabled={loading}
                            >
                                <option value="sm">{t("Pequeno", "Small")}</option>
                                <option value="md">{t("Medio", "Medium")}</option>
                                <option value="lg">{t("Grande", "Large")}</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 text-xs text-ink-muted">
                            <input
                                type="checkbox"
                                checked={settings.animations}
                                onChange={(event) =>
                                    updateSettings({ animations: event.target.checked })
                                }
                                disabled={loading}
                            />
                            {t("Animaciones", "Animations")}
                        </label>
                        <label className="flex items-center gap-2 text-xs text-ink-muted">
                            <input
                                type="checkbox"
                                checked={settings.showHints}
                                onChange={(event) =>
                                    updateSettings({ showHints: event.target.checked })
                                }
                                disabled={loading}
                            />
                            {t("Mostrar ayudas", "Show hints")}
                        </label>
                    </div>

                    {canManageZoneTrash && campaignId && (
                        <div className="pt-2 border-t border-ring space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <p className="text-xs font-semibold text-ink">
                                        {t("Papelera de zonas", "Zone trash")}
                                    </p>
                                    <p className="text-[11px] text-ink-muted">
                                        {t(
                                            "Las zonas en papelera se borran automaticamente tras 30 dias.",
                                            "Zones in trash are deleted automatically after 30 days."
                                        )}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void loadZoneTrash()}
                                    disabled={zoneTrashLoading}
                                    className="rounded-md border border-ring bg-white/70 px-2 py-1 text-[11px] hover:bg-white disabled:opacity-60"
                                >
                                    {t("Actualizar", "Refresh")}
                                </button>
                            </div>

                            {zoneTrashError && (
                                <p className="text-[11px] text-red-700 bg-red-100 border border-red-200 rounded-md px-2 py-1.5">
                                    {zoneTrashError}
                                </p>
                            )}

                            {!zoneTrashSupported ? (
                                <p className="text-[11px] text-ink-muted">
                                    {t(
                                        "La papelera no esta disponible en esta base de datos. Ejecuta la migracion 2026-02-19-zone-trash.sql para activarla.",
                                        "Trash is not available on this database. Run migration 2026-02-19-zone-trash.sql to enable it."
                                    )}
                                </p>
                            ) : zoneTrashLoading ? (
                                <p className="text-[11px] text-ink-muted">
                                    {t("Cargando papelera...", "Loading trash...")}
                                </p>
                            ) : zoneTrash.length === 0 ? (
                                <p className="text-[11px] text-ink-muted">
                                    {t("No hay zonas en papelera.", "No zones in trash.")}
                                </p>
                            ) : (
                                <div className="max-h-44 space-y-1 overflow-y-auto styled-scrollbar pr-1">
                                    {zoneTrash.map((entry) => {
                                        const daysLeft = getDaysUntilAutoDelete(entry.deleted_at);
                                        return (
                                            <div
                                                key={entry.id}
                                                className="rounded-md border border-ring bg-white/80 px-2 py-1.5"
                                            >
                                                <p className="text-xs font-medium text-ink truncate">
                                                    {entry.name}
                                                </p>
                                                <p className="text-[11px] text-ink-muted truncate">
                                                    {entry.map_name ?? t("Mapa desconocido", "Unknown map")}
                                                </p>
                                                <p className="text-[11px] text-ink-muted">
                                                    {t("Eliminada:", "Deleted:")} {formatDeletedAt(entry.deleted_at)}
                                                </p>
                                                <p className="text-[11px] text-ink-muted">
                                                    {daysLeft === null
                                                        ? t("Caducidad desconocida", "Unknown expiry")
                                                        : daysLeft <= 0
                                                          ? t("Caduca hoy", "Expires today")
                                                          : t(
                                                                `Caduca en ${daysLeft} dias`,
                                                                `Expires in ${daysLeft} days`
                                                            )}
                                                </p>
                                                <div className="mt-1.5 flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleRestoreZone(entry.id)}
                                                        className="rounded-md border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700 hover:bg-emerald-200"
                                                    >
                                                        {t("Restaurar", "Restore")}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void handleDeleteZonePermanently(entry.id)
                                                        }
                                                        className="rounded-md border border-red-300 bg-red-100 px-2 py-0.5 text-[11px] text-red-700 hover:bg-red-200"
                                                    >
                                                        {t("Borrar ya", "Delete now")}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => void handleEmptyZoneTrashNow()}
                                disabled={!zoneTrashSupported || zoneTrashLoading || zoneTrash.length === 0}
                                className="w-full rounded-md border border-red-300/60 bg-red-50/70 px-3 py-1.5 text-[11px] text-red-700 hover:bg-red-50 disabled:opacity-60"
                            >
                                {t("Vaciar papelera ahora", "Empty trash now")}
                            </button>
                        </div>
                    )}

                    <div className="pt-2 border-t border-ring space-y-2">
                        <button
                            type="button"
                            onClick={() => router.push("/campaigns")}
                            className="w-full text-xs px-3 py-2 rounded-md border border-ring bg-white/70 hover:bg-white"
                        >
                            {t("Cambiar rol", "Switch role")}
                        </button>
                        <button
                            type="button"
                            onClick={handleSignOut}
                            disabled={loggingOut}
                            className="w-full text-xs px-3 py-2 rounded-md border border-red-300/60 bg-red-50/70 text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                            {loggingOut
                                ? t("Cerrando sesion...", "Signing out...")
                                : t("Cerrar sesion", "Sign out")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
