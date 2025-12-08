// lib/weaponUtils.ts
// Sistema unificado para calcular y formatear el ataque de un arma en las vistas
// Incluye: modificador de característica, bonificador de competencia y modificadores propios del arma.

import { abilityMod } from "./dndMath";
import { proficiencyBonusFromLevel } from "./ability";

/** Etiquetas abreviadas de habilidades en español */
export const ABILITY_LABELS: Record<string, string> = {
    str: "FUE",
    dex: "DES",
    con: "CON",
    int: "INT",
    wis: "SAB",
    cha: "CAR",
};

/**
 * Calcula el total de ataque de un arma.
 * - weapon: datos del arma guardados en Supabase o en el formulario
 * - stats: stats del personaje { str, dex, con, int, wis, cha }
 * - level: nivel del personaje para determinar bonificador de competencia
 */
export function weaponAttackTotal(
    weapon: { stat_ability?: string; modifier?: number; is_proficient?: boolean } | null | undefined,
    stats: Record<string, number> | null | undefined,
    level?: number | null
) {
    const abilityKey = (weapon?.stat_ability || "").toLowerCase();

    // puntuación de la característica usada
    const rawScore = stats && abilityKey ? Number(stats[abilityKey] ?? 10) : 10;
    const abilityModifier = Number.isFinite(rawScore) ? abilityMod(rawScore) : abilityMod(10);

    // modificador plano del arma (puede ser mágico)
    const weaponMod = Number(weapon?.modifier ?? 0);

    // competencia según nivel + si el arma es competente
    const prof = weapon?.is_proficient ? proficiencyBonusFromLevel(Number(level ?? 1)) : 0;

    const total = abilityModifier + weaponMod + prof;

    return {
        total,
        abilityKey,
        abilityModifier,
        weaponMod,
        prof,
    };
}

/**
 * Formatea algo como "FUE +7".
 * Si no hay characteristicKey, usa "ATAQUE +X".
 */
export function formatWeaponAttackLabel(res: { total: number; abilityKey?: string | null }) {
    const sign = res.total >= 0 ? `+${res.total}` : `${res.total}`;
    const label = res.abilityKey && res.abilityKey.length > 0
        ? (ABILITY_LABELS[res.abilityKey] ?? res.abilityKey.toUpperCase())
        : "ATAQUE";

    return `${label} ${sign}`;
}