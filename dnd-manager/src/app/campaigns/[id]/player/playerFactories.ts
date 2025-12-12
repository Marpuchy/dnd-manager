// src/app/campaigns/[id]/player/playerFactories.ts
import { Armor, Weapon, AbilityKey } from "././playerShared";

/**
 * Crea una armadura con valores por defecto (asegura fields obligatorios).
 */
export function newArmor(partial?: Partial<Armor>): Armor {
    return {
        id: partial?.id ?? `armor_${Date.now()}`,
        name: partial?.name ?? "Nueva armadura",
        bonus: Number(partial?.bonus ?? 0),
        description: partial?.description ?? "",
        ability: partial?.ability ?? null,
        stat_ability: partial?.stat_ability ?? null,
        stat_modifier: partial?.stat_modifier ?? null,
        equipped: partial?.equipped ?? null,
        modifiers: partial?.modifiers ?? [],
        statAbility: (partial as any)?.statAbility ?? null,
        statModifier: (partial as any)?.statModifier ?? null,
        meta: partial?.meta ?? null,
    };
}

/**
 * Crea un arma con valores por defecto (asegura name no undefined).
 */
export function newWeapon(partial?: Partial<Weapon>): Weapon {
    return {
        id: partial?.id ?? `weapon_${Date.now()}`,
        name: partial?.name ?? "Nuevo arma",
        damage: partial?.damage ?? "",
        description: partial?.description ?? "",
        stat_ability: partial?.stat_ability ?? null,
        modifier: partial?.modifier ?? null,
        is_proficient: partial?.is_proficient ?? null,
        equipped: partial?.equipped ?? null,
        modifiers: partial?.modifiers ?? [],
        meta: partial?.meta ?? null,
    };
}
