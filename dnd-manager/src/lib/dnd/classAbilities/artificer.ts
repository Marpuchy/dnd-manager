import { ClassAbility } from "./types";

export const ARTIFICER_ABILITIES: ClassAbility[] = [
    {
        id: "magical-tinkering",
        name: "Magical Tinkering",
        class: "artificer",
        level: 1,
        activation: "Acción",
        range: "Touch",
        duration: "Permanente",
        description: "Infundes objetos con efectos mágicos menores.",
    },
    {
        id: "infuse-item",
        name: "Infuse Item",
        class: "artificer",
        level: 2,
        activation: "Especial",
        duration: "Descanso largo",
        description: "Creas infusiones mágicas para objetos.",
    },
    {
        id: "flash-of-genius",
        name: "Flash of Genius",
        class: "artificer",
        level: 7,
        activation: "Reacción",
        range: "30 ft",
        uses: "Mod INT / descanso largo",
        description: "Añades tu INT a una tirada cercana.",
    },
];
