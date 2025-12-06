// src/lib/spellSlots.ts

export type CasterProgression = "full" | "half" | "third" | "pact";

export type SpellSlots = {
    [spellLevel: number]: number; // p.ej. {1: 4, 2: 3, 3: 2}
};

type SlotsTable = {
    [characterLevel: number]: SpellSlots;
};

const fullCasterSlots: SlotsTable = {
    1: { 1: 2 },
    2: { 1: 3 },
    3: { 1: 4, 2: 2 },
    4: { 1: 4, 2: 3 },
    5: { 1: 4, 2: 3, 3: 2 },
    6: { 1: 4, 2: 3, 3: 3 },
    7: { 1: 4, 2: 3, 3: 3, 4: 1 },
    8: { 1: 4, 2: 3, 3: 3, 4: 2 },
    9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
    10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
    11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
    12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
    13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
    14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
    15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
    16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
    17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
    18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
    19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
    20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 },
};

// TODO: rellena estas tablas con los datos exactos del SRD si quieres precisión total
const halfCasterSlots: SlotsTable = {
    // paladín / ranger
    2: { 1: 2 },
    3: { 1: 3 },
    4: { 1: 3 },
    5: { 1: 4, 2: 2 },
    6: { 1: 4, 2: 2 },
    // ...
};

const thirdCasterSlots: SlotsTable = {
    // Eldritch Knight / Arcane Trickster (opcional)
};

type PactSlots = {
    slots: number;
    slotLevel: number;
};

const pactCasterSlots: { [characterLevel: number]: PactSlots } = {
    1: { slots: 1, slotLevel: 1 },
    2: { slots: 2, slotLevel: 1 },
    3: { slots: 2, slotLevel: 2 },
    4: { slots: 2, slotLevel: 2 },
    5: { slots: 2, slotLevel: 3 },
    6: { slots: 2, slotLevel: 3 },
    7: { slots: 2, slotLevel: 4 },
    8: { slots: 2, slotLevel: 4 },
    9: { slots: 2, slotLevel: 5 },
    10: { slots: 2, slotLevel: 5 },
    11: { slots: 3, slotLevel: 5 },
    12: { slots: 3, slotLevel: 5 },
    13: { slots: 3, slotLevel: 5 },
    14: { slots: 3, slotLevel: 5 },
    15: { slots: 3, slotLevel: 5 },
    16: { slots: 4, slotLevel: 5 },
    17: { slots: 4, slotLevel: 5 },
    18: { slots: 4, slotLevel: 5 },
    19: { slots: 4, slotLevel: 5 },
    20: { slots: 4, slotLevel: 5 },
};

export function getCasterProgression(className: string): CasterProgression | null {
    const c = className.toLowerCase();
    if (["wizard", "cleric", "druid", "sorcerer", "bard"].includes(c)) return "full";
    if (c === "warlock") return "pact";
    if (["paladin", "ranger"].includes(c)) return "half";
    // Si no lanza conjuros
    return null;
}

export function getSpellSlotsFor(className: string, level: number) {
    const type = getCasterProgression(className);
    if (!type || level < 1 || level > 20) return null;

    switch (type) {
        case "full":
            return fullCasterSlots[level] ?? null;
        case "half":
            return halfCasterSlots[level] ?? null;
        case "third":
            return thirdCasterSlots[level] ?? null;
        case "pact":
            return pactCasterSlots[level] ?? null;
    }
}
