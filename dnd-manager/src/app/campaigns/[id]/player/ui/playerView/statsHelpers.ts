// src/app/campaigns/[id]/player/statsHelpers.ts
/**
 * Helpers pequeños para cálculos de atributos / modificadores
 * Úsalos desde StatsPanel, StatDisplay u otros componentes.
 */

export type AbilityKey = import("@/lib/types/dnd").AbilityKey;

/**
 * Calcula el modificador de característica a partir de la puntuación (regla D&D 5e).
 * @param score Puntuación de la característica (ej. 12)
 * @returns Modificador (ej. 1)
 */
export function abilityModifier(score: number): number {
    const n = Number(score) || 0;
    return Math.floor((n - 10) / 2);
}

/**
 * Formatea un modificador como cadena con + o - (ej. +2, -1).
 */
export function formatModifier(n: number): string {
    return n >= 0 ? `+${n}` : `${n}`;
}

/**
 * Suma un objeto de bonificadores a las stats base.
 * - base: { str: number, dex: number, ... }
 * - bonuses: { STR?: number, DEX?: number, ... } (uso mayúsculas para keys tipo AbilityKey)
 *
 * Devuelve un nuevo objeto con los totales.
 */
export function applyAbilityBonuses(
    base: Record<string, number>,
    bonuses: Partial<Record<AbilityKey, number>>
): Record<string, number> {
    const out: Record<string, number> = { ...(base || {}) };
    out.str = (Number(out.str) || 0) + (Number(bonuses?.STR) || 0);
    out.dex = (Number(out.dex) || 0) + (Number(bonuses?.DEX) || 0);
    out.con = (Number(out.con) || 0) + (Number(bonuses?.CON) || 0);
    out.int = (Number(out.int) || 0) + (Number(bonuses?.INT) || 0);
    out.wis = (Number(out.wis) || 0) + (Number(bonuses?.WIS) || 0);
    out.cha = (Number(out.cha) || 0) + (Number(bonuses?.CHA) || 0);
    return out;
}
