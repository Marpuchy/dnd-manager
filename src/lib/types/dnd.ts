export type AbilityKey = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";

export type Stats = {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
};

export type LearnedSpellRef = {
    index: string;
    name: string;
};

export type Spells = {
    level0?: string | LearnedSpellRef[];
    level1?: string | LearnedSpellRef[];
    level2?: string | LearnedSpellRef[];
    level3?: string | LearnedSpellRef[];
    level4?: string | LearnedSpellRef[];
    level5?: string | LearnedSpellRef[];
    level6?: string | LearnedSpellRef[];
    level7?: string | LearnedSpellRef[];
    level8?: string | LearnedSpellRef[];
    level9?: string | LearnedSpellRef[];
};

export type Armor = {
    id?: string | null;
    name: string;
    bonus: number;
    ability?: string | null;
    stat_ability?: string | null;
    stat_modifier?: number | null;
    equipped?: boolean | null;
    description?: string | null;
    modifiers?: { ability: keyof Stats | string; modifier: number; note?: string }[] | null;
};

export type Weapon = {
    id?: string | null;
    name: string;
    damage?: string | null;
    stat_ability?: string | null;
    modifier?: number | null;
    is_proficient?: boolean | null;
    description?: string | null;
    equipped?: boolean | null;
    meta?: unknown;
};

export type HitDie = {
    sides: number;
};

export type SpellMeta = {
    index: string;
    name: string;
    level: number;
    range?: string;
    casting_time?: string;
    duration?: string;
    school?: string;
    components?: string[];
    material?: string;
    concentration?: boolean;
    ritual?: boolean;
    shortDesc?: string;
    fullDesc?: string;
};

export type Details = {
    profile_image?: string | null;
    armors?: Armor[];
    weaponEquipped?: {
        name: string;
        damage?: string;
        description?: string;
        statAbility?: AbilityKey;
        statModifier?: number;
        modifiers?: { ability: AbilityKey; modifier: number; note?: string }[];
    };
    current_hp?: number | null;
    max_hp?: number | null;
    inventory?: string;
    equipment?: string;
    abilities?: string;
    weaponsExtra?: string;
    notes?: string;
    hitDie?: HitDie;
    spells?: Spells;
    spellDetails?: Record<string, SpellMeta>;
    customClassName?: string;
    customCastingAbility?: keyof Stats;
};

export type Character = {
    id: string;
    name: string;
    class: string | null;
    level: number | null;
    race: string | null;
    experience: number | null;
    max_hp: number | null;
    current_hp: number | null;
    armor_class: number | null;
    speed: number | null;
    stats: Stats | null;
    details: Details | null;
    profile_image?: string | null;
};

export type LearnedSpellLine = {
    raw: string;
    name: string;
    note?: string;
};

export type SpellSummary = SpellMeta;

export type PassiveModifier = {
    id: string;
    ability: AbilityKey;
    value: number;
    note?: string;
    source?: string;
};
