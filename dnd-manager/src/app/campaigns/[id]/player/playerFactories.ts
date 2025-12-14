// src/app/campaigns/[id]/player/playerFactories.ts
import { Armor, Weapon } from "./playerShared";

/**
 * Crea una armadura con valores por defecto
 * (alineado EXACTAMENTE con el tipo Armor)
 */
export function newArmor(partial?: Partial<Armor>): Armor {
    return {
        id: partial?.id ?? `armor_${Date.now()}`,
        name: partial?.name ?? "Nueva armadura",
        bonus: Number(partial?.bonus ?? 0),

        ability: partial?.ability ?? null,
        stat_ability: partial?.stat_ability ?? null,
        stat_modifier: partial?.stat_modifier ?? null,

        equipped: partial?.equipped ?? false,
        description: partial?.description ?? null,

        modifiers: partial?.modifiers ?? [],
    };
}

/**
 * Crea un arma con valores por defecto
 * (alineado EXACTAMENTE con el tipo Weapon)
 */
export function newWeapon(partial?: Partial<Weapon>): Weapon {
    return {
        id: partial?.id ?? `weapon_${Date.now()}`,
        name: partial?.name ?? "Nueva arma",

        damage: partial?.damage ?? "",
        description: partial?.description ?? null,

        stat_ability: partial?.stat_ability ?? null,
        modifier: partial?.modifier ?? null,

        is_proficient: partial?.is_proficient ?? false,
        equipped: partial?.equipped ?? false,

        meta: partial?.meta ?? null,
    };
}
