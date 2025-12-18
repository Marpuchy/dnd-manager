import { ClassFeature } from "./classFeatures";

export const CLASS_FEATURE_OVERRIDES: Record<string, ClassFeature[]> = {
    paladin: [
        {
            index: "divine-smite",
            name: "Divine Smite",
            desc: [
                "Cuando impactas con un ataque cuerpo a cuerpo, puedes gastar un espacio de conjuro para infligir daño radiante adicional al objetivo.",
            ],
        },
        {
            index: "lay-on-hands",
            name: "Lay on Hands",
            desc: [
                "Tienes un depósito de poder curativo que se repone cuando realizas un descanso largo.",
            ],
        },
    ],

    artificer: [
        {
            index: "magical-tinkering",
            name: "Magical Tinkering",
            desc: [
                "Infundes objetos con pequeños efectos mágicos.",
            ],
        },
    ],
};
