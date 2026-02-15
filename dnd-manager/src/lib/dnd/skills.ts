import type { AbilityKey, SkillKey } from "@/lib/types/dnd";

export type SkillDefinition = {
  key: SkillKey;
  label: string;
  labels: {
    es: string;
    en: string;
  };
  ability: AbilityKey;
  modifierTarget: string;
};

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  {
    key: "athletics",
    label: "Atletismo",
    labels: { es: "Atletismo", en: "Athletics" },
    ability: "STR",
    modifierTarget: "SKILL_ATHLETICS",
  },
  {
    key: "acrobatics",
    label: "Acrobacias",
    labels: { es: "Acrobacias", en: "Acrobatics" },
    ability: "DEX",
    modifierTarget: "SKILL_ACROBATICS",
  },
  {
    key: "sleightOfHand",
    label: "Juego de manos",
    labels: { es: "Juego de manos", en: "Sleight of Hand" },
    ability: "DEX",
    modifierTarget: "SKILL_SLEIGHT_OF_HAND",
  },
  {
    key: "stealth",
    label: "Sigilo",
    labels: { es: "Sigilo", en: "Stealth" },
    ability: "DEX",
    modifierTarget: "SKILL_STEALTH",
  },
  {
    key: "arcana",
    label: "Arcanos",
    labels: { es: "Arcanos", en: "Arcana" },
    ability: "INT",
    modifierTarget: "SKILL_ARCANA",
  },
  {
    key: "history",
    label: "Historia",
    labels: { es: "Historia", en: "History" },
    ability: "INT",
    modifierTarget: "SKILL_HISTORY",
  },
  {
    key: "investigation",
    label: "Investigacion",
    labels: { es: "Investigacion", en: "Investigation" },
    ability: "INT",
    modifierTarget: "SKILL_INVESTIGATION",
  },
  {
    key: "nature",
    label: "Naturaleza",
    labels: { es: "Naturaleza", en: "Nature" },
    ability: "INT",
    modifierTarget: "SKILL_NATURE",
  },
  {
    key: "religion",
    label: "Religion",
    labels: { es: "Religion", en: "Religion" },
    ability: "INT",
    modifierTarget: "SKILL_RELIGION",
  },
  {
    key: "animalHandling",
    label: "Trato con animales",
    labels: { es: "Trato con animales", en: "Animal Handling" },
    ability: "WIS",
    modifierTarget: "SKILL_ANIMAL_HANDLING",
  },
  {
    key: "insight",
    label: "Perspicacia",
    labels: { es: "Perspicacia", en: "Insight" },
    ability: "WIS",
    modifierTarget: "SKILL_INSIGHT",
  },
  {
    key: "medicine",
    label: "Medicina",
    labels: { es: "Medicina", en: "Medicine" },
    ability: "WIS",
    modifierTarget: "SKILL_MEDICINE",
  },
  {
    key: "perception",
    label: "Percepcion",
    labels: { es: "Percepcion", en: "Perception" },
    ability: "WIS",
    modifierTarget: "SKILL_PERCEPTION",
  },
  {
    key: "survival",
    label: "Supervivencia",
    labels: { es: "Supervivencia", en: "Survival" },
    ability: "WIS",
    modifierTarget: "SKILL_SURVIVAL",
  },
  {
    key: "deception",
    label: "Engano",
    labels: { es: "Engano", en: "Deception" },
    ability: "CHA",
    modifierTarget: "SKILL_DECEPTION",
  },
  {
    key: "intimidation",
    label: "Intimidacion",
    labels: { es: "Intimidacion", en: "Intimidation" },
    ability: "CHA",
    modifierTarget: "SKILL_INTIMIDATION",
  },
  {
    key: "performance",
    label: "Interpretacion",
    labels: { es: "Interpretacion", en: "Performance" },
    ability: "CHA",
    modifierTarget: "SKILL_PERFORMANCE",
  },
  {
    key: "persuasion",
    label: "Persuasion",
    labels: { es: "Persuasion", en: "Persuasion" },
    ability: "CHA",
    modifierTarget: "SKILL_PERSUASION",
  },
];

export function getSkillLabel(skill: SkillDefinition, locale: string): string {
  return locale === "en" ? skill.labels.en : skill.labels.es;
}

export const SKILLS_BY_ABILITY: Record<AbilityKey, SkillDefinition[]> = {
  STR: SKILL_DEFINITIONS.filter((skill) => skill.ability === "STR"),
  DEX: SKILL_DEFINITIONS.filter((skill) => skill.ability === "DEX"),
  CON: SKILL_DEFINITIONS.filter((skill) => skill.ability === "CON"),
  INT: SKILL_DEFINITIONS.filter((skill) => skill.ability === "INT"),
  WIS: SKILL_DEFINITIONS.filter((skill) => skill.ability === "WIS"),
  CHA: SKILL_DEFINITIONS.filter((skill) => skill.ability === "CHA"),
};
