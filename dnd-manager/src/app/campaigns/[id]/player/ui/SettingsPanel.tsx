"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useUserSettings } from "@/app/components/SettingsProvider";
import { X } from "lucide-react";

type SettingsPanelProps = {
    open: boolean;
    onClose: () => void;
};

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
    const router = useRouter();
    const { settings, updateSettings, loading } = useUserSettings();

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
                        <h3 className="text-sm font-semibold text-ink">Ajustes</h3>
                        <p className="text-[11px] text-ink-muted">
                            Personaliza tu vista de jugador.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-ring bg-white/70 p-1.5 hover:bg-white"
                    >
                        <X className="h-4 w-4 text-ink" />
                    </button>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                    <div className="space-y-1">
                        <label className="text-xs text-ink-muted">Tema</label>
                        <select
                            value={settings.theme}
                            onChange={(event) =>
                                updateSettings({ theme: event.target.value as any })
                            }
                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                            disabled={loading}
                        >
                            <option value="normal">Normal</option>
                            <option value="light">Claro</option>
                            <option value="dark">Oscuro</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-ink-muted">Idioma por defecto</label>
                        <select
                            value={settings.locale}
                            onChange={(event) =>
                                updateSettings({ locale: event.target.value as any })
                            }
                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                            disabled={loading}
                        >
                            <option value="es">Español</option>
                            <option value="en">Inglés</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-ink-muted">Densidad</label>
                            <select
                                value={settings.density}
                                onChange={(event) =>
                                    updateSettings({ density: event.target.value as any })
                                }
                                className="w-full rounded-md bg-white/80 border border-ring px-2 py-2 text-sm text-ink outline-none focus:border-accent"
                                disabled={loading}
                            >
                                <option value="comfortable">Cómoda</option>
                                <option value="compact">Compacta</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-ink-muted">Tamaño de fuente</label>
                            <select
                                value={settings.fontScale}
                                onChange={(event) =>
                                    updateSettings({ fontScale: event.target.value as any })
                                }
                                className="w-full rounded-md bg-white/80 border border-ring px-2 py-2 text-sm text-ink outline-none focus:border-accent"
                                disabled={loading}
                            >
                                <option value="sm">Pequeño</option>
                                <option value="md">Medio</option>
                                <option value="lg">Grande</option>
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
                            Animaciones
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
                            Mostrar ayudas
                        </label>
                    </div>

                    <div className="pt-2 border-t border-ring">
                        <button
                            type="button"
                            onClick={() => router.push("/campaigns")}
                            className="w-full text-xs px-3 py-2 rounded-md border border-ring bg-white/70 hover:bg-white"
                        >
                            Cambiar rol
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
