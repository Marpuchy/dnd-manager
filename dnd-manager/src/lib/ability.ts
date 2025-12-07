// lib/ability.ts

/**
 * Calcula el modificador de característica en D&D 5e.
 * Fórmula oficial: floor((score - 10) / 2)
 */
export function abilityModifier(score: number): number {
    return Math.floor((score - 10) / 2);
}

/**
 * Da formato al modificador para mostrarlo en interfaz.
 * Ejemplos:
 *  +3
 *  +1
 *   0
 *  -2
 */
export function formatModifier(mod: number): string {
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Bonus de competencia según nivel (D&D 5e).
 */
export function proficiencyBonusFromLevel(level: number | undefined): number {
    if (!level || level < 1) return 2;
    if (level >= 17) return 6;
    if (level >= 13) return 5;
    if (level >= 9) return 4;
    if (level >= 5) return 3;
    return 2;
}
