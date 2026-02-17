import type { ClassAbility } from "./types";
type ClassAbilityLocale = "en" | "es";

type LocalizedSubclassFeatures = {
    en: ClassAbility[];
    es: ClassAbility[];
};

const FALLBACK_SUBCLASS_FEATURES: Record<string, LocalizedSubclassFeatures> = {
    "druid:circle-of-the-moon": {
        en: [
            {
                id: "druid:circle-of-the-moon:lvl3:combat-wild-shape:fallback",
                name: "Combat Wild Shape",
                class: "druid",
                level: 3,
                subclassId: "druid:circle-of-the-moon",
                subclassName: "Circle of the Moon",
                source: "Fallback 2014",
                description:
                    "You can use Wild Shape as a bonus action and spend a spell slot to regain hit points while transformed (1d8 per spell-slot level).",
            },
            {
                id: "druid:circle-of-the-moon:lvl3:circle-forms:fallback",
                name: "Circle Forms",
                class: "druid",
                level: 3,
                subclassId: "druid:circle-of-the-moon",
                subclassName: "Circle of the Moon",
                source: "Fallback 2014",
                description:
                    "Your Wild Shape can assume stronger beast forms than a standard druid and is focused on front-line combat.",
            },
            {
                id: "druid:circle-of-the-moon:lvl6:primal-strike:fallback",
                name: "Primal Strike",
                class: "druid",
                level: 6,
                subclassId: "druid:circle-of-the-moon",
                subclassName: "Circle of the Moon",
                source: "Fallback 2014",
                description:
                    "Your beast-form attacks count as magical for overcoming resistance and immunity to nonmagical attacks.",
            },
            {
                id: "druid:circle-of-the-moon:lvl10:elemental-wild-shape:fallback",
                name: "Elemental Wild Shape",
                class: "druid",
                level: 10,
                subclassId: "druid:circle-of-the-moon",
                subclassName: "Circle of the Moon",
                source: "Fallback 2014",
                description:
                    "You can expend two uses of Wild Shape to transform into an elemental form.",
            },
            {
                id: "druid:circle-of-the-moon:lvl14:thousand-forms:fallback",
                name: "Thousand Forms",
                class: "druid",
                level: 14,
                subclassId: "druid:circle-of-the-moon",
                subclassName: "Circle of the Moon",
                source: "Fallback 2014",
                description:
                    "You can cast Alter Self on yourself at will without expending a spell slot.",
            },
        ],
        es: [
            {
                id: "druid:circle-of-the-moon:lvl3:combat-wild-shape:fallback",
                name: "Forma salvaje de combate",
                class: "druid",
                level: 3,
                subclassId: "druid:circle-of-the-moon",
                subclassName: "Circulo de la Luna",
                source: "Fallback 2014",
                description:
                    "Puedes usar Forma salvaje como accion bonus y gastar un espacio de conjuro para recuperar puntos de golpe mientras estas transformado (1d8 por nivel del espacio).",
            },
            {
                id: "druid:circle-of-the-moon:lvl3:circle-forms:fallback",
                name: "Formas del circulo",
                class: "druid",
                level: 3,
                subclassId: "druid:circle-of-the-moon",
                subclassName: "Circulo de la Luna",
                source: "Fallback 2014",
                description:
                    "Tu Forma salvaje puede asumir bestias mas potentes que un druida estandar y esta orientada al combate cercano.",
            },
            {
                id: "druid:circle-of-the-moon:lvl6:primal-strike:fallback",
                name: "Golpe primigenio",
                class: "druid",
                level: 6,
                subclassId: "druid:circle-of-the-moon",
                subclassName: "Circulo de la Luna",
                source: "Fallback 2014",
                description:
                    "Tus ataques en forma de bestia cuentan como magicos para superar resistencias e inmunidades a dano no magico.",
            },
            {
                id: "druid:circle-of-the-moon:lvl10:elemental-wild-shape:fallback",
                name: "Forma salvaje elemental",
                class: "druid",
                level: 10,
                subclassId: "druid:circle-of-the-moon",
                subclassName: "Circulo de la Luna",
                source: "Fallback 2014",
                description:
                    "Puedes gastar dos usos de Forma salvaje para transformarte en una forma elemental.",
            },
            {
                id: "druid:circle-of-the-moon:lvl14:thousand-forms:fallback",
                name: "Mil formas",
                class: "druid",
                level: 14,
                subclassId: "druid:circle-of-the-moon",
                subclassName: "Circulo de la Luna",
                source: "Fallback 2014",
                description:
                    "Puedes lanzar Alter Self sobre ti mismo a voluntad sin gastar espacio de conjuro.",
            },
        ],
    },
};

export function getFallbackSubclassFeatures(
    subclassId: string,
    locale: ClassAbilityLocale
): ClassAbility[] {
    const localized = FALLBACK_SUBCLASS_FEATURES[subclassId];
    if (!localized) return [];
    return locale === "es" ? localized.es : localized.en;
}
