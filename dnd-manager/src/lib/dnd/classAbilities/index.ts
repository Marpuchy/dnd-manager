import { ClassAbility } from "./types";

import { PALADIN_ABILITIES } from "./paladin";
import { FIGHTER_ABILITIES } from "./fighter";
import { ROGUE_ABILITIES } from "./rogue";
import { BARBARIAN_ABILITIES } from "./barbarian";
import { CLERIC_ABILITIES } from "./cleric";
import { WIZARD_ABILITIES } from "./wizard";
import { ARTIFICER_ABILITIES } from "./artificer";
import { BARD_ABILITIES } from "./bard";
import { DRUID_ABILITIES } from "./druid";
import { MONK_ABILITIES } from "./monk";
import { RANGER_ABILITIES } from "./ranger";
import { SORCERER_ABILITIES } from "./sorcerer";
import { WARLOCK_ABILITIES } from "./warlock";

export const CLASS_ABILITIES: ClassAbility[] = [
    ...PALADIN_ABILITIES,
    ...FIGHTER_ABILITIES,
    ...ROGUE_ABILITIES,
    ...BARBARIAN_ABILITIES,
    ...CLERIC_ABILITIES,
    ...WIZARD_ABILITIES,
    ...ARTIFICER_ABILITIES,
    ...BARD_ABILITIES,
    ...DRUID_ABILITIES,
    ...MONK_ABILITIES,
    ...RANGER_ABILITIES,
    ...SORCERER_ABILITIES,
    ...WARLOCK_ABILITIES,
];

export function getClassAbilities(
    className: string,
    level: number
): ClassAbility[] {
    return CLASS_ABILITIES.filter(
        (a) => a.class === className && a.level <= level
    );
}
