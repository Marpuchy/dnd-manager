import { SpellMeta } from "@/app/campaigns/[id]/player/playerShared";

export async function loadSRDSpells(
    apiClass: string,
    characterLevel: number
): Promise<Record<string, SpellMeta>> {
    const maxSpellLevel = Math.min(
        9,
        Math.ceil((characterLevel || 1) / 2)
    );

    const result: Record<string, SpellMeta> = {};

    for (let lvl = 0; lvl <= maxSpellLevel; lvl++) {
        try {
            const res = await fetch(
                `/api/dnd/spells?class=${apiClass}&level=${lvl}`
            );
            if (!res.ok) continue;

            const data: SpellMeta[] = await res.json();
            for (const s of data) {
                if (s?.index) result[s.index] = s;
            }
        } catch {
            // fail silent
        }
    }

    return result;
}
