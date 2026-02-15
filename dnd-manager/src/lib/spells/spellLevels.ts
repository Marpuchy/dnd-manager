import { getSpellSlotsFor } from "../spellSlots";

export function getMaxSpellLevelForClass(
    normalizedClassId: string | null,
    level: number
): number {
    if (!normalizedClassId || level <= 0) return 0;

    const slots = getSpellSlotsFor(normalizedClassId, level);
    if (!slots) return 0;

    if ("slots" in slots) {
        return Number((slots as any).slotLevel ?? 0);
    }

    return Object.entries(slots).reduce((maxLevel, [spellLevel, amount]) => {
        const lvl = Number(spellLevel);
        const count = Number(amount);
        if (!Number.isFinite(lvl) || !Number.isFinite(count) || count <= 0) {
            return maxLevel;
        }
        return Math.max(maxLevel, lvl);
    }, 0);
}
