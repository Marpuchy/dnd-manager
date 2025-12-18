export type ClassAbility = {
    id: string;
    name: string;
    class: string;
    level: number;

    activation?: string;   // Acción, reacción, pasiva, etc.
    range?: string;        // Touch, Self, 30 ft…
    duration?: string;     // Instantáneo, 1 min…
    components?: string[]; // V, S, M (si aplica)
    uses?: string;         // X/descanso, slots, etc.

    description?: string;  // Resumen (no texto PHB)
};
