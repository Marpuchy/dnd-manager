"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type ThemeMode = "normal" | "light" | "dark";
export type DensityMode = "comfortable" | "compact";
export type FontScale = "sm" | "md" | "lg";

export type UserSettings = {
    theme: ThemeMode;
    locale: "es" | "en";
    density: DensityMode;
    animations: boolean;
    fontScale: FontScale;
    showHints: boolean;
};

const defaultSettings: UserSettings = {
    theme: "normal",
    locale: "es",
    density: "comfortable",
    animations: true,
    fontScale: "md",
    showHints: true,
};

type SettingsContextValue = {
    settings: UserSettings;
    loading: boolean;
    updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue>({
    settings: defaultSettings,
    loading: true,
    updateSettings: async () => {},
});

function normalizeSettings(raw: any): UserSettings {
    if (!raw) return defaultSettings;
    return {
        theme:
            raw.theme === "light" || raw.theme === "dark" || raw.theme === "normal"
                ? raw.theme
                : defaultSettings.theme,
        locale: raw.locale === "en" || raw.locale === "es" ? raw.locale : defaultSettings.locale,
        density: raw.density === "compact" || raw.density === "comfortable" ? raw.density : defaultSettings.density,
        animations: typeof raw.animations === "boolean" ? raw.animations : defaultSettings.animations,
        fontScale: raw.font_scale === "sm" || raw.font_scale === "lg" || raw.font_scale === "md" ? raw.font_scale : defaultSettings.fontScale,
        showHints: typeof raw.show_hints === "boolean" ? raw.show_hints : defaultSettings.showHints,
    };
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<UserSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        async function loadSettings() {
            try {
                const { data: sessionData } = await supabase.auth.getSession();
                const userId = sessionData?.session?.user?.id;
                if (!userId) {
                    if (active) setLoading(false);
                    return;
                }

                const { data, error } = await supabase
                    .from("user_settings")
                    .select("*")
                    .eq("user_id", userId)
                    .order("updated_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                const errorCode = (error as any)?.code;
                const errorMessage = (error as any)?.message;
                const isEmptyError =
                    error &&
                    typeof error === "object" &&
                    !Array.isArray(error) &&
                    Object.keys(error).length === 0;
                const isNoRows =
                    errorCode === "PGRST116" ||
                    (typeof errorMessage === "string" &&
                        errorMessage.toLowerCase().includes("0 rows"));

                if (error && !isEmptyError && !isNoRows) {
                    console.error("Error cargando ajustes:", errorMessage ?? error);
                    if (active) {
                        setSettings(defaultSettings);
                        setLoading(false);
                    }
                    return;
                }

                if (data) {
                    const normalized = normalizeSettings(data);
                    if (active) {
                        setSettings(normalized);
                        setLoading(false);
                    }
                    return;
                }

                const { error: insertError } = await supabase
                    .from("user_settings")
                    .insert({
                    user_id: userId,
                    theme: defaultSettings.theme,
                    locale: defaultSettings.locale,
                    density: defaultSettings.density,
                    animations: defaultSettings.animations,
                    font_scale: defaultSettings.fontScale,
                    show_hints: defaultSettings.showHints,
                    updated_at: new Date().toISOString(),
                });

                if (insertError) {
                    console.error(
                        "Error guardando ajustes iniciales:",
                        insertError?.message ?? insertError
                    );
                }

                if (active) {
                    setSettings(defaultSettings);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error cargando ajustes:", err);
                if (active) setLoading(false);
            }
        }

        loadSettings();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (typeof document === "undefined") return;
        const root = document.documentElement;
        root.dataset.theme = settings.theme;
        root.dataset.locale = settings.locale;
        root.dataset.density = settings.density;
        root.dataset.animations = settings.animations ? "on" : "off";
        root.dataset.fontScale = settings.fontScale;
        root.dataset.showHints = settings.showHints ? "on" : "off";
    }, [settings]);

    const updateSettings = async (patch: Partial<UserSettings>) => {
        const next = { ...settings, ...patch };
        setSettings(next);

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const userId = sessionData?.session?.user?.id;
            if (!userId) return;

            await supabase.from("user_settings").upsert(
                {
                    user_id: userId,
                    theme: next.theme,
                    locale: next.locale,
                    density: next.density,
                    animations: next.animations,
                    font_scale: next.fontScale,
                    show_hints: next.showHints,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id" }
            );
        } catch (err) {
            console.error("Error guardando ajustes:", err);
        }
    };

    const value = useMemo(
        () => ({ settings, loading, updateSettings }),
        [settings, loading]
    );

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useUserSettings() {
    return useContext(SettingsContext);
}
