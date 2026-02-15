import { CLASS_PROGRESSIONS_2024 } from "./srd2024";
import { CLASS_PROGRESSIONS_2024_ES } from "./srd2024.es";
import { OFFICIAL_SUBCLASS_CATALOG } from "./officialSubclasses";
import { ClassAbility, ClassProgression, ClassSubclass } from "./types";

const CLASS_IDS = new Set(Object.keys(CLASS_PROGRESSIONS_2024));
export type ClassAbilityLocale = "en" | "es";

const CLASS_ALIASES: Record<string, string> = {
    barbarian: "barbarian",
    barbaro: "barbarian",
    bard: "bard",
    bardo: "bard",
    cleric: "cleric",
    clerigo: "cleric",
    druid: "druid",
    druida: "druid",
    fighter: "fighter",
    guerrero: "fighter",
    monk: "monk",
    monje: "monk",
    paladin: "paladin",
    paladino: "paladin",
    ranger: "ranger",
    explorador: "ranger",
    rogue: "rogue",
    picaro: "rogue",
    sorcerer: "sorcerer",
    hechicero: "sorcerer",
    warlock: "warlock",
    brujo: "warlock",
    wizard: "wizard",
    mago: "wizard",
    artificer: "artificer",
    artificiero: "artificer",
};

function normalizeToken(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function progressionsByLocale(locale: ClassAbilityLocale = "en") {
    return locale === "es" ? CLASS_PROGRESSIONS_2024_ES : CLASS_PROGRESSIONS_2024;
}

function mergeOfficialSubclasses(
    classId: string,
    baseSubclasses: ClassSubclass[],
    subclassUnlockLevel = 3
): ClassSubclass[] {
    const merged = new Map<string, ClassSubclass>();
    for (const subclass of baseSubclasses) {
        merged.set(subclass.id, subclass);
    }

    const catalog = OFFICIAL_SUBCLASS_CATALOG[classId] ?? [];
    for (const seed of catalog) {
        if (merged.has(seed.id)) continue;
        merged.set(seed.id, {
            id: seed.id,
            name: seed.name,
            classId,
            unlockLevel:
                Number.isFinite(Number(seed.unlockLevel)) && Number(seed.unlockLevel) > 0
                    ? Number(seed.unlockLevel)
                    : subclassUnlockLevel,
            source: seed.source,
            features: [],
        });
    }

    return Array.from(merged.values()).sort((a, b) => {
        if (a.unlockLevel !== b.unlockLevel) return a.unlockLevel - b.unlockLevel;
        return a.name.localeCompare(b.name);
    });
}

function sortClassAbilities(abilities: ClassAbility[]): ClassAbility[] {
    return [...abilities].sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.name.localeCompare(b.name);
    });
}

export function resolveClassId(className: string | null | undefined): string | null {
    if (!className) return null;
    const normalized = normalizeToken(className);
    if (CLASS_IDS.has(normalized)) return normalized;
    const alias = CLASS_ALIASES[normalized];
    if (alias && CLASS_IDS.has(alias)) return alias;
    return null;
}

export function getClassProgression(
    className: string | null | undefined,
    locale: ClassAbilityLocale = "en"
): ClassProgression | null {
    const classId = resolveClassId(className);
    if (!classId) return null;
    const progression = progressionsByLocale(locale)[classId] ?? null;
    if (!progression) return null;

    const mergedSubclasses = mergeOfficialSubclasses(
        classId,
        Array.isArray(progression.subclasses) ? progression.subclasses : [],
        progression.subclassUnlockLevel ?? 3
    );

    return {
        ...progression,
        subclasses: mergedSubclasses,
    };
}

export function getClassSubclasses(
    className: string | null | undefined,
    level?: number | null,
    locale: ClassAbilityLocale = "en"
): ClassSubclass[] {
    const progression = getClassProgression(className, locale);
    if (!progression) return [];
    const subclasses = Array.isArray(progression.subclasses)
        ? progression.subclasses
        : [];
    if (level == null || !Number.isFinite(level)) {
        return subclasses;
    }
    return subclasses.filter(
        (subclass) => Number(level) >= Number(subclass.unlockLevel ?? 1)
    );
}

export function getSubclassById(
    className: string | null | undefined,
    subclassId: string | null | undefined,
    locale: ClassAbilityLocale = "en"
): ClassSubclass | null {
    if (!subclassId) return null;
    const progression = getClassProgression(className, locale);
    if (!progression) return null;
    return (
        progression.subclasses.find((subclass) => subclass.id === subclassId) ??
        null
    );
}

export function getSubclassName(
    className: string | null | undefined,
    subclassId: string | null | undefined,
    locale: ClassAbilityLocale = "en"
): string | null {
    return getSubclassById(className, subclassId, locale)?.name ?? null;
}

export function getClassAbilities(
    className: string,
    level: number,
    subclassId?: string | null,
    locale: ClassAbilityLocale = "en"
): ClassAbility[] {
    const progression = getClassProgression(className, locale);
    if (!progression || !Number.isFinite(level) || level <= 0) return [];

    const maxLevel = Math.max(1, Math.floor(level));
    const classFeatures = (progression.classFeatures ?? []).filter(
        (ability) => ability.level <= maxLevel
    );

    const selectedSubclass = subclassId
        ? progression.subclasses.find((subclass) => subclass.id === subclassId)
        : null;
    const subclassFeatures = selectedSubclass
        ? selectedSubclass.features.filter((ability) => ability.level <= maxLevel)
        : [];

    return sortClassAbilities([...classFeatures, ...subclassFeatures]);
}

export function getClassAbilityTimeline(
    className: string,
    level: number,
    subclassId?: string | null,
    locale: ClassAbilityLocale = "en"
): { learned: ClassAbility[]; upcoming: ClassAbility[] } {
    const progression = getClassProgression(className, locale);
    if (!progression) {
        return { learned: [], upcoming: [] };
    }

    const currentLevel = Math.max(1, Math.floor(Number(level) || 1));
    const classFeatures = Array.isArray(progression.classFeatures)
        ? progression.classFeatures
        : [];
    const selectedSubclass = subclassId
        ? progression.subclasses.find((subclass) => subclass.id === subclassId)
        : null;
    const subclassFeatures = Array.isArray(selectedSubclass?.features)
        ? selectedSubclass.features
        : [];
    const allFeatures = [...classFeatures, ...subclassFeatures];

    const learned = allFeatures.filter((ability) => ability.level <= currentLevel);
    const upcoming = allFeatures.filter((ability) => ability.level > currentLevel);

    return {
        learned: sortClassAbilities(learned),
        upcoming: sortClassAbilities(upcoming),
    };
}

export const CLASS_ABILITIES: ClassAbility[] = Object.values(
    CLASS_PROGRESSIONS_2024
).flatMap((progression) => progression.classFeatures);
