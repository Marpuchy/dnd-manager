import type { AbilityKey, Details } from "@/lib/types/dnd";
import { ensureDetailsItems, getModifierTotal } from "@/lib/character/items";

type AbilityBonuses = Record<AbilityKey, number>;

export function getAbilityBonusesFromDetails(details: Details | undefined): AbilityBonuses {
    const resolved = ensureDetailsItems(details);
    return {
        STR: getModifierTotal(resolved, "STR"),
        DEX: getModifierTotal(resolved, "DEX"),
        CON: getModifierTotal(resolved, "CON"),
        INT: getModifierTotal(resolved, "INT"),
        WIS: getModifierTotal(resolved, "WIS"),
        CHA: getModifierTotal(resolved, "CHA"),
    };
}
