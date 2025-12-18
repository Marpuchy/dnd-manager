import { ClassAbility } from "./types";

export const PALADIN_ABILITIES: ClassAbility[] = [
    {
        id: "divine-sense",
        name: "Divine Sense",
        class: "paladin",
        level: 1,
        activation: "Acción",
        range: "60 ft",
        duration: "Hasta el final de tu siguiente turno",
        uses: "1 + modificador de Carisma / descanso largo",
        description:
            "Detectas celestiales, demonios y no muertos dentro del alcance, incluso tras cobertura ligera.",
    },
    {
        id: "lay-on-hands",
        name: "Lay on Hands",
        class: "paladin",
        level: 1,
        activation: "Acción",
        range: "Touch",
        duration: "Instantáneo",
        uses: "Reserva de 5 × nivel de paladín / descanso largo",
        description:
            "Restauras puntos de golpe desde una reserva total igual a cinco veces tu nivel de paladín. También puedes gastar 5 puntos de la reserva para curar una enfermedad o un veneno.",
    },
    {
        id: "divine-smite",
        name: "Divine Smite",
        class: "paladin",
        level: 2,
        activation: "Al impactar con un ataque cuerpo a cuerpo",
        range: "Melee",
        duration: "Instantáneo",
        uses: "Espacios de conjuro",
        description:
            "Al impactar, infliges 2d8 de daño radiante adicionales. El daño aumenta en 1d8 por cada nivel de espacio de conjuro superior a 1º. Contra no muertos o demonios, añades 1d8 adicional.",
    },
    {
        id: "fighting-style",
        name: "Fighting Style",
        class: "paladin",
        level: 2,
        activation: "Pasiva",
        description:
            "Obtienes un beneficio permanente según el estilo de combate elegido (defensa, duelo, protección u otros).",
    },
    {
        id: "extra-attack",
        name: "Extra Attack",
        class: "paladin",
        level: 5,
        activation: "Pasiva",
        description:
            "Cuando realizas la acción de Atacar, puedes hacer dos ataques en lugar de uno.",
    },
    {
        id: "aura-of-protection",
        name: "Aura of Protection",
        class: "paladin",
        level: 6,
        activation: "Pasiva",
        range: "10 ft (30 ft a nivel 18)",
        duration: "Constante",
        description:
            "Tú y los aliados dentro del alcance añadís tu modificador de Carisma a todas las tiradas de salvación.",
    },
    {
        id: "aura-of-courage",
        name: "Aura of Courage",
        class: "paladin",
        level: 10,
        activation: "Pasiva",
        range: "10 ft (30 ft a nivel 18)",
        duration: "Constante",
        description:
            "Tú y los aliados cercanos sois inmunes a la condición de asustado mientras permanezcáis dentro del aura.",
    },
    {
        id: "improved-divine-smite",
        name: "Improved Divine Smite",
        class: "paladin",
        level: 11,
        activation: "Pasiva",
        description:
            "Cada ataque cuerpo a cuerpo que impacta inflige automáticamente 1d8 de daño radiante adicional.",
    },
    {
        id: "cleansing-touch",
        name: "Cleansing Touch",
        class: "paladin",
        level: 14,
        activation: "Acción",
        range: "Touch",
        uses: "Modificador de Carisma / descanso largo",
        description:
            "Finalizas un conjuro activo que esté afectando a una criatura voluntaria tocada.",
    },
];
