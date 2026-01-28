import { defaultLocale, locales, type Locale } from "./config";

export function getClientLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const attr = document?.documentElement?.dataset?.locale;
  if (attr && (locales as readonly string[]).includes(attr)) {
    return attr as Locale;
  }
  const nav = window.navigator?.language?.toLowerCase() ?? "";
  if (nav.startsWith("es")) return "es";
  if (nav.startsWith("en")) return "en";
  return defaultLocale;
}
