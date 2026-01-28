import type { AbilityKey, Details } from "@/lib/types/dnd";

type AbilityBonuses = Record<AbilityKey, number>;

function accumulateBonus(
    bonuses: AbilityBonuses,
    ability: AbilityKey | undefined,
    value: unknown
) {
    if (!ability) return;
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) return;
    bonuses[ability] += num;
}

export function getAbilityBonusesFromDetails(details: Details | undefined): AbilityBonuses {
    const bonuses: AbilityBonuses = {
        STR: 0,
        DEX: 0,
        CON: 0,
        INT: 0,
        WIS: 0,
        CHA: 0,
    };

    if (!details) return bonuses;

    const textSources = [
        details.inventory,
        details.equipment,
        details.weaponsExtra,
    ];

    for (const source of textSources) {
        if (!source) continue;
        const lines = source.split("\n").map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
            if (!line.startsWith("{")) continue;
            try {
                const item = JSON.parse(line);
                if (item.ability && typeof item.modifier === "number") {
                    accumulateBonus(bonuses, item.ability, item.modifier);
                }
                if (Array.isArray(item.modifiers)) {
                    for (const m of item.modifiers) {
                        accumulateBonus(bonuses, m.ability, m.modifier);
                    }
                }
            } catch {
                // ignore invalid JSON
            }
        }
    }

    if (Array.isArray(details.armors)) {
        for (const armor of details.armors as any[]) {
            accumulateBonus(bonuses, armor.statAbility, armor.statModifier);
            if (Array.isArray(armor.modifiers)) {
                for (const m of armor.modifiers) {
                    accumulateBonus(bonuses, m.ability, m.modifier);
                }
            }
        }
    }

    const weapon = (details as any)?.weaponEquipped;
    if (weapon) {
        accumulateBonus(bonuses, weapon.statAbility, weapon.statModifier);
        if (Array.isArray(weapon.modifiers)) {
            for (const m of weapon.modifiers) {
                accumulateBonus(bonuses, m.ability, m.modifier);
            }
        }
    }

    return bonuses;
}
