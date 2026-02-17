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
};

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
    const router = useRouter();
    const { settings, updateSettings, loading } = useUserSettings();
    const [loggingOut, setLoggingOut] = React.useState(false);
    const locale = settings?.locale ?? "es";
    const t = (es: string, en: string) => tr(locale, es, en);

    if (!open) return null;

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
