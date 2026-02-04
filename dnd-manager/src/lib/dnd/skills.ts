import type { AbilityKey, SkillKey } from "@/lib/types/dnd";

export type SkillDefinition = {
    key: SkillKey;
    label: string;
    ability: AbilityKey;
    modifierTarget: string;
};

export const SKILL_DEFINITIONS: SkillDefinition[] = [
    { key: "athletics", label: "Atletismo", ability: "STR", modifierTarget: "SKILL_ATHLETICS" },
    { key: "acrobatics", label: "Acrobacias", ability: "DEX", modifierTarget: "SKILL_ACROBATICS" },
    { key: "sleightOfHand", label: "Juego de Manos", ability: "DEX", modifierTarget: "SKILL_SLEIGHT_OF_HAND" },
    { key: "stealth", label: "Sigilo", ability: "DEX", modifierTarget: "SKILL_STEALTH" },
    { key: "arcana", label: "Arcanos", ability: "INT", modifierTarget: "SKILL_ARCANA" },
    { key: "history", label: "Historia", ability: "INT", modifierTarget: "SKILL_HISTORY" },
    { key: "investigation", label: "Investigación", ability: "INT", modifierTarget: "SKILL_INVESTIGATION" },
    { key: "nature", label: "Naturaleza", ability: "INT", modifierTarget: "SKILL_NATURE" },
    { key: "religion", label: "Religión", ability: "INT", modifierTarget: "SKILL_RELIGION" },
    { key: "animalHandling", label: "Trato con Animales", ability: "WIS", modifierTarget: "SKILL_ANIMAL_HANDLING" },
    { key: "insight", label: "Perspicacia", ability: "WIS", modifierTarget: "SKILL_INSIGHT" },
    { key: "medicine", label: "Medicina", ability: "WIS", modifierTarget: "SKILL_MEDICINE" },
    { key: "perception", label: "Percepción", ability: "WIS", modifierTarget: "SKILL_PERCEPTION" },
    { key: "survival", label: "Supervivencia", ability: "WIS", modifierTarget: "SKILL_SURVIVAL" },
    { key: "deception", label: "Engaño", ability: "CHA", modifierTarget: "SKILL_DECEPTION" },
    { key: "intimidation", label: "Intimidación", ability: "CHA", modifierTarget: "SKILL_INTIMIDATION" },
    { key: "performance", label: "Interpretación", ability: "CHA", modifierTarget: "SKILL_PERFORMANCE" },
    { key: "persuasion", label: "Persuasión", ability: "CHA", modifierTarget: "SKILL_PERSUASION" },
];

export const SKILLS_BY_ABILITY: Record<AbilityKey, SkillDefinition[]> = {
    STR: SKILL_DEFINITIONS.filter((skill) => skill.ability === "STR"),
    DEX: SKILL_DEFINITIONS.filter((skill) => skill.ability === "DEX"),
    CON: SKILL_DEFINITIONS.filter((skill) => skill.ability === "CON"),
    INT: SKILL_DEFINITIONS.filter((skill) => skill.ability === "INT"),
    WIS: SKILL_DEFINITIONS.filter((skill) => skill.ability === "WIS"),
    CHA: SKILL_DEFINITIONS.filter((skill) => skill.ability === "CHA"),
};
