import { SpellMeta } from "@/app/campaigns/[id]/player/playerShared";

export async function loadSRDSpells(
  apiClass: string,
  characterLevel: number,
  locale: "en" | "es" = "en"
): Promise<Record<string, SpellMeta>> {
  const normalizedLevel = Math.max(1, Math.min(20, Math.floor(characterLevel || 1)));
  const result: Record<string, SpellMeta> = {};

  try {
    const res = await fetch(
      `/api/dnd/spells?class=${encodeURIComponent(apiClass)}&level=${normalizedLevel}&locale=${locale}`
    );
    if (!res.ok) return result;

    const data: SpellMeta[] = await res.json();
    for (const spell of data) {
      if (spell?.index) result[spell.index] = spell;
    }
  } catch {
    // keep UI alive if local payload is unavailable
  }

  return result;
}
