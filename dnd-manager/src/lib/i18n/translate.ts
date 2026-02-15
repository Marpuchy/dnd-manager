export function tr(locale: string | null | undefined, es: string, en: string): string {
  return locale === "en" ? en : es;
}
