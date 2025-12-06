// Cálculo del modificador de característica (estándar D&D)
export function abilityMod(score: number): number {
    const s = Number.isFinite(score) ? score : 10;
    return Math.floor((s - 10) / 2);
}

// Suma todos los bonificadores de armadura
export function sumArmorBonus(
    armors?: { bonus?: number | null }[]
): number {
    if (!armors || armors.length === 0) return 0;
    return armors.reduce((acc, armor) => {
        const b = Number(armor?.bonus ?? 0);
        return acc + (Number.isFinite(b) ? b : 0);
    }, 0);
}

// Cálculo de vida máxima:
// maxHP = nivel * max(1, dado + mod CON)
export function computeMaxHp(
    level: number,
    conScore: number,
    hitDieSides: number
): number {
    const lvl = Math.max(1, Math.floor(level || 1));
    const die = Math.max(1, Math.floor(hitDieSides || 1));
    const conMod = abilityMod(conScore);
    const perLevel = Math.max(1, die + conMod); // nunca menos de 1 por nivel
    return lvl * perLevel;
}
