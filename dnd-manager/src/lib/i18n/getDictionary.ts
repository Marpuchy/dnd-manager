import { defaultLocale, type Locale } from "./config";
import { dictionary as en } from "./dictionaries/en";
import { dictionary as es } from "./dictionaries/es";

const dictionaries: Record<Locale, typeof en> = {
  en,
  es,
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
