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
