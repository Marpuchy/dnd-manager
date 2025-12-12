// src/app/campaigns/[id]/player/utils/weaponDisplay.ts
/**
 * Normaliza y formatea la cadena de daño de un arma, evitando duplicar el modificador visualmente.
 *
 * Ejemplos:
 *  formatWeaponDamage("1d6 + 3", 3) -> "1d6 +3"
 *  formatWeaponDamage("1d6", 3)     -> "1d6 +3"
 *  formatWeaponDamage("1d8 - 1", -1)-> "1d8 -1"
 *  formatWeaponDamage("", 2)        -> "+2"
 *  formatWeaponDamage(null, null)   -> ""
 */
export function formatWeaponDamage(damage?: string | null, modifier?: number | null) {
    const dmg = (damage ?? "").trim();

    // Si no hay daño escrito, devolvemos solo el modificador (si existe)
    if (!dmg) {
        if (modifier === null || modifier === undefined || Number.isNaN(modifier)) return "";
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    }

    // Quitar cualquier "+N" o "- N" final que ya tenga el string,
    // p. ej. "1d6 + 3" -> "1d6"
    const base = dmg.replace(/\s*([+\-]\s*\d+)\s*$/, "").trim();

    // Si no hay modifier válido, devolvemos la base sin cambios
    if (modifier === null || modifier === undefined || Number.isNaN(modifier)) {
        return base;
    }

    // Formato consistente: "1d6 +3" o "1d6 -2"
    const signed = modifier >= 0 ? `+${modifier}` : `${modifier}`;
    return `${base} ${signed}`;
}
