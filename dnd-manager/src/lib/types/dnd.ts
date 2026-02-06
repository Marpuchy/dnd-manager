export type AbilityKey = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";
export type CharacterType = "character" | "companion";

export type SkillKey =
    | "athletics"
    | "acrobatics"
    | "sleightOfHand"
    | "stealth"
    | "arcana"
    | "history"
    | "investigation"
    | "nature"
    | "religion"
    | "animalHandling"
    | "insight"
    | "medicine"
    | "perception"
    | "survival"
    | "deception"
    | "intimidation"
    | "performance"
    | "persuasion";

export type SkillProficiencyValue = 1 | 2 | boolean;
export type SkillProficiencies = Partial<Record<SkillKey, SkillProficiencyValue>>;

export type TranslationEntry = {
    text: string;
    provider?: string;
    updatedAt?: string;
};

export type LocalizedText = {
    text: string;
    lang: string;
    translations?: Record<string, TranslationEntry>;
};

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
    statAbility?: AbilityKey | string | null;
    stat_ability?: string | null;
    statModifier?: number | null;
    stat_modifier?: number | null;
    equipped?: boolean | null;
    description?: string | null;
    modifiers?: { ability: keyof Stats | string; modifier: number; note?: string }[] | null;
    rarity?: string | null;
    weight?: number | null;
    tags?: string[] | null;
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
    type?: string | null;
    range?: string | null;
    properties?: string[] | null;
    rarity?: string | null;
    modifiers?: { ability: AbilityKey; modifier: number; note?: string }[] | null;
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
    shortDesc?: string | LocalizedText;
    fullDesc?: string | LocalizedText;
};

export type SpellComponentSet = {
    verbal?: boolean;
    somatic?: boolean;
    material?: boolean;
};

export type SpellCastingTime = {
    value: string;
    note?: string;
};

export type SpellResourceCost = {
    usesSpellSlot?: boolean;
    slotLevel?: number;
    charges?: number;
    points?: number;
};

export type SpellSaveConfig = {
    type?: "attack" | "save" | "none";
    saveAbility?: AbilityKey;
    dcType?: "fixed" | "stat";
    dcValue?: number;
    dcStat?: AbilityKey;
};

export type SpellDamageConfig = {
    damageType?: string;
    dice?: string;
    scaling?: string;
};

export type AbilityResourceCost = {
    usesSpellSlot?: boolean;
    slotLevel?: number;
    charges?: number;
    recharge?: "short" | "long";
    pointsLabel?: string;
    points?: number;
};

export type ItemCategory =
    | "weapon"
    | "armor"
    | "accessory"
    | "consumable"
    | "tool"
    | "misc";

export type ItemModifier = {
    target: string;
    value: number;
    note?: string;
};

export type CharacterItem = {
    id: string;
    name: string;
    category: ItemCategory;
    equippable?: boolean;
    equipped?: boolean;
    description?: LocalizedText;
    modifiers?: ItemModifier[];
    quantity?: number;
    rarity?: string;
    tags?: string[];
    properties?: string[];
    effects?: string[];
    attunement?: boolean | string;
    weight?: number;
    value?: string;
    charges?: number | string;
    slot?: string;
    source?: string;
    sortOrder?: number;
};

export type CustomSpellEntry = {
    id: string;
    name: string;
    level: number;
    school?: string;
    description?: LocalizedText;
    castingTime?: SpellCastingTime;
    range?: string;
    components?: SpellComponentSet;
    materials?: string;
    duration?: string;
    concentration?: boolean;
    ritual?: boolean;
    resourceCost?: SpellResourceCost;
    save?: SpellSaveConfig;
    damage?: SpellDamageConfig;
};

export type CustomFeatureEntry = {
    id: string;
    name: string;
    level?: number;
    description?: LocalizedText;
    actionType?: "action" | "bonus" | "reaction" | "passive";
    resourceCost?: AbilityResourceCost;
    requirements?: string;
    effect?: string;
};

export type Companion = {
    name: string;
    kind?: string;
    size?: string;
    armorClass?: number;
    speed?: number;
    maxHp?: number;
    currentHp?: number;
    stats?: Stats;
    abilities?: string;
    spells?: string;
    notes?: string;
};

export type Details = {
    profile_image?: string | null;
    companionOwnerId?: string | null;
    armors?: Armor[];
    weaponEquipped?: {
        name: string;
        damage?: string;
        description?: string;
        statAbility?: AbilityKey;
        statModifier?: number;
        modifiers?: { ability: AbilityKey; modifier: number; note?: string }[];
        type?: string;
        properties?: string[];
        range?: string;
        isProficient?: boolean;
        equipped?: boolean;
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
    background?: string;
    alignment?: string;
    personalityTraits?: string;
    ideals?: string;
    bonds?: string;
    flaws?: string;
    appearance?: string;
    backstory?: string;
    languages?: string;
    proficiencies?: string;
    skillProficiencies?: SkillProficiencies;
    allies?: string;
    organizations?: string;
    customSections?: { id: string; title: string; content: string }[];
    companion?: Companion;
    items?: CharacterItem[];
    customSpells?: CustomSpellEntry[];
    customCantrips?: CustomSpellEntry[];
    customTraits?: CustomFeatureEntry[];
    customClassAbilities?: CustomFeatureEntry[];
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
    character_type?: CharacterType | null;
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
