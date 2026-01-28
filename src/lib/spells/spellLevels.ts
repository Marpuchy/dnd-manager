export function getMaxSpellLevelForClass(
    normalizedClassId: string | null,
    level: number
): number {
    if (!normalizedClassId || level <= 0) return 0;

    const fullCasters = [
        "druid",
        "cleric",
        "wizard",
        "bard",
        "sorcerer",
    ];

    const halfCasters = ["paladin", "ranger"];

    if (fullCasters.includes(normalizedClassId)) {
        return Math.floor((level + 1) / 2);
    }

    if (halfCasters.includes(normalizedClassId)) {
        return Math.floor(level / 4) + 1;
    }

    return Math.floor((level + 1) / 2);
}
