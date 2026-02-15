"use client";

import { useUserSettings } from "@/app/components/SettingsProvider";
import type { Locale } from "./config";
import { getClientLocale } from "./getClientLocale";

export function useClientLocale(): Locale {
  const { settings, loading } = useUserSettings();
  if (!loading && (settings.locale === "en" || settings.locale === "es")) {
    return settings.locale;
  }
  return getClientLocale();
}
