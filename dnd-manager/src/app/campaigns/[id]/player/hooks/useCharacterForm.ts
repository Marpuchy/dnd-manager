import { useState } from "react";
import type {
    AbilityKey,
    Character,
    CharacterItem,
    CharacterType,
    CustomFeatureEntry,
    CustomSubclassEntry,
    CustomSpellEntry,
    LearnedSpellRef,
    PassiveModifier,
    SkillProficiencies,
    Spells,
    Stats,
} from "@/lib/types/dnd";
import { normalizeClassForApi } from "../playerShared";
import { migrateLegacyItems, sortItemsByOrder } from "@/lib/character/items";

export type ArmorForm = {
    name: string;
    bonus?: number | null;
    ability?: AbilityKey | string | null;
    modifier?: number | null;
    statAbility?: AbilityKey | null;
    statModifier?: number | null;
    modifiers?: { ability: AbilityKey; modifier: number; note?: string }[];
};

export type CharacterFormFields = {
    // Basic
    charName: string;
    setCharName: (v: string) => void;
    characterType?: CharacterType;
    setCharacterType?: (v: CharacterType) => void;
    charClass: string;
    setCharClass: (v: string) => void;
    classSubclassId?: string;
    setClassSubclassId?: (v: string) => void;
    charLevel: number;
    setCharLevel: (v: number) => void;
    race: string;
    setRace: (v: string) => void;
    experience: number;
    setExperience: (v: number) => void;
    armorClass: number;
    setArmorClass: (v: number) => void;
    speed: number;
    setSpeed: (v: number) => void;

    // Life
    currentHp: number;
    setCurrentHp: (v: number) => void;
    hitDieSides: number;
    setHitDieSides: (v: number) => void;

    // Stats
    str: number;
    setStr: (v: number) => void;
    dex: number;
    setDex: (v: number) => void;
    con: number;
    setCon: (v: number) => void;
    intStat: number;
    setIntStat: (v: number) => void;
    wis: number;
    setWis: (v: number) => void;
    cha: number;
    setCha: (v: number) => void;

    // Armors
    armors: ArmorForm[];
    addArmor: (armor?: ArmorForm) => void;
    removeArmor: (index: number) => void;
    updateArmor: (index: number, field: string, value: string | number | null) => void;

    // Weapon
    weaponId?: string | null;
    setWeaponId?: (v: string | null) => void;
    weaponName: string;
    setWeaponName: (v: string) => void;
    weaponDamage: string;
    setWeaponDamage: (v: string) => void;
    weaponDescription: string;
    setWeaponDescription: (v: string) => void;
    weaponStatAbility: AbilityKey | "none";
    setWeaponStatAbility: (v: AbilityKey | "none") => void;
    weaponStatModifier: number | null;
    setWeaponStatModifier: (v: number | null) => void;
    weaponProficient?: boolean | null;
    setWeaponProficient?: (v: boolean) => void;
    weaponEquipped?: boolean | null;
    setWeaponEquipped?: (v: boolean) => void;
    weaponPassiveModifiers?: PassiveModifier[];
    setWeaponPassiveModifiers?: (m: PassiveModifier[]) => void;

    // Text blocks
    inventory: string;
    setInventory: (v: string) => void;
    equipment: string;
    setEquipment: (v: string) => void;
    abilities: string;
    setAbilities: (v: string) => void;
    weaponsExtra: string;
    setWeaponsExtra: (v: string) => void;
    notes: string;
    setNotes: (v: string) => void;
    portraitNote?: string;
    setPortraitNote?: (v: string) => void;
    background?: string;
    setBackground?: (v: string) => void;
    alignment?: string;
    setAlignment?: (v: string) => void;
    personalityTraits?: string;
    setPersonalityTraits?: (v: string) => void;
    ideals?: string;
    setIdeals?: (v: string) => void;
    bonds?: string;
    setBonds?: (v: string) => void;
    flaws?: string;
    setFlaws?: (v: string) => void;
    appearance?: string;
    setAppearance?: (v: string) => void;
    backstory?: string;
    setBackstory?: (v: string) => void;
    languages?: string;
    setLanguages?: (v: string) => void;
    proficiencies?: string;
    setProficiencies?: (v: string) => void;
    skillProficiencies?: SkillProficiencies;
    setSkillProficiencies?: (v: SkillProficiencies) => void;
    customSections?: { id: string; title: string; content: string }[];
    setCustomSections?: (sections: { id: string; title: string; content: string }[]) => void;
    companionEnabled?: boolean;
    setCompanionEnabled?: (v: boolean) => void;
    companionName?: string;
    setCompanionName?: (v: string) => void;
    companionKind?: string;
    setCompanionKind?: (v: string) => void;
    companionSize?: string;
    setCompanionSize?: (v: string) => void;
    companionArmorClass?: number;
    setCompanionArmorClass?: (v: number) => void;
    companionSpeed?: number;
    setCompanionSpeed?: (v: number) => void;
    companionCurrentHp?: number;
    setCompanionCurrentHp?: (v: number) => void;
    companionMaxHp?: number;
    setCompanionMaxHp?: (v: number) => void;
    companionStr?: number;
    setCompanionStr?: (v: number) => void;
    companionDex?: number;
    setCompanionDex?: (v: number) => void;
    companionCon?: number;
    setCompanionCon?: (v: number) => void;
    companionInt?: number;
    setCompanionInt?: (v: number) => void;
    companionWis?: number;
    setCompanionWis?: (v: number) => void;
    companionCha?: number;
    setCompanionCha?: (v: number) => void;
    companionAbilities?: string;
    setCompanionAbilities?: (v: string) => void;
    companionSpells?: string;
    setCompanionSpells?: (v: string) => void;
    companionNotes?: string;
    setCompanionNotes?: (v: string) => void;
    companionOwnerId?: string;
    setCompanionOwnerId?: (v: string) => void;

    // Items (nuevo sistema unificado)
    items: CharacterItem[];
    setItems: (items: CharacterItem[]) => void;

    // Contenido personalizado (hechizos/rasgos/etc)
    customSpells: CustomSpellEntry[];
    setCustomSpells: (v: CustomSpellEntry[]) => void;
    customCantrips: CustomSpellEntry[];
    setCustomCantrips: (v: CustomSpellEntry[]) => void;
    customTraits: CustomFeatureEntry[];
    setCustomTraits: (v: CustomFeatureEntry[]) => void;
    customClassAbilities: CustomFeatureEntry[];
    setCustomClassAbilities: (v: CustomFeatureEntry[]) => void;
    customSubclasses: CustomSubclassEntry[];
    setCustomSubclasses: (v: CustomSubclassEntry[]) => void;

    // Spells by level
    spellsL0: string;
    setSpellsL0: (v: string) => void;
    spellsL1: string;
    setSpellsL1: (v: string) => void;
    spellsL2: string;
    setSpellsL2: (v: string) => void;
    spellsL3: string;
    setSpellsL3: (v: string) => void;
    spellsL4: string;
    setSpellsL4: (v: string) => void;
    spellsL5: string;
    setSpellsL5: (v: string) => void;
    spellsL6: string;
    setSpellsL6: (v: string) => void;
    spellsL7: string;
    setSpellsL7: (v: string) => void;
    spellsL8: string;
    setSpellsL8: (v: string) => void;
    spellsL9: string;
    setSpellsL9: (v: string) => void;

    // Custom class
    customClassName: string;
    setCustomClassName: (v: string) => void;
    customCastingAbility: keyof Stats;
    setCustomCastingAbility: (v: keyof Stats) => void;

    // Optional identifiers (used by CharacterForm internal persistence)
    characterId?: string | null;
    id?: string | null;
    charId?: string | null;
    campaignId?: string | null;
    campaign_id?: string | null;
    campaign?: { id?: string | null; campaign_id?: string | null } | null;
    setCharacterId?: (id: string) => void;
};

type UseCharacterFormResult = {
    fields: CharacterFormFields;
    resetForm: () => void;
    loadFromCharacter: (char: Character) => void;
};

function spellsToText(value: string | LearnedSpellRef[] | undefined): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value.map((s) => s.name).join("\n");
}

function toAbilityKey(value: unknown): AbilityKey | null {
    if (typeof value !== "string") return null;
    const normalized = value.toUpperCase().trim();
    if (
        normalized === "STR" ||
        normalized === "DEX" ||
        normalized === "CON" ||
        normalized === "INT" ||
        normalized === "WIS" ||
        normalized === "CHA"
    ) {
        return normalized as AbilityKey;
    }
    return null;
}

export function useCharacterForm(): UseCharacterFormResult {
    // Basic
    const [charName, setCharName] = useState("");
    const [characterType, setCharacterType] = useState<CharacterType>("character");
    const [charClass, setCharClass] = useState("");
    const [classSubclassId, setClassSubclassId] = useState("");
    const [charLevel, setCharLevel] = useState<number>(1);
    const [race, setRace] = useState("");
    const [experience, setExperience] = useState<number>(0);
    const [armorClass, setArmorClass] = useState<number>(10);
    const [speed, setSpeed] = useState<number>(30);

    // Life
    const [currentHp, setCurrentHp] = useState<number>(10);
    const [hitDieSides, setHitDieSides] = useState<number>(8);

    // Stats
    const [str, setStr] = useState<number>(10);
    const [dex, setDex] = useState<number>(10);
    const [con, setCon] = useState<number>(10);
    const [intStat, setIntStat] = useState<number>(10);
    const [wis, setWis] = useState<number>(10);
    const [cha, setCha] = useState<number>(10);

    // Details
    const [armors, setArmors] = useState<ArmorForm[]>([]);
    const [weaponName, setWeaponName] = useState("");
    const [weaponDamage, setWeaponDamage] = useState("");
    const [weaponDescription, setWeaponDescription] = useState("");
    const [weaponStatAbility, setWeaponStatAbility] = useState<AbilityKey | "none">("none");
    const [weaponStatModifier, setWeaponStatModifier] = useState<number | null>(null);
    const [weaponProficient, setWeaponProficient] = useState<boolean>(false);
    const [weaponEquipped, setWeaponEquipped] = useState<boolean>(true);
    const [weaponPassiveModifiers, setWeaponPassiveModifiers] = useState<PassiveModifier[]>([]);
    const [inventory, setInventory] = useState("");
    const [equipment, setEquipment] = useState("");
    const [abilities, setAbilities] = useState("");
    const [weaponsExtra, setWeaponsExtra] = useState("");
    const [notes, setNotes] = useState("");
    const [portraitNote, setPortraitNote] = useState("");
    const [background, setBackground] = useState("");
    const [alignment, setAlignment] = useState("");
    const [personalityTraits, setPersonalityTraits] = useState("");
    const [ideals, setIdeals] = useState("");
    const [bonds, setBonds] = useState("");
    const [flaws, setFlaws] = useState("");
    const [appearance, setAppearance] = useState("");
    const [backstory, setBackstory] = useState("");
    const [languages, setLanguages] = useState("");
    const [proficiencies, setProficiencies] = useState("");
    const [skillProficiencies, setSkillProficiencies] = useState<SkillProficiencies>({});
    const [customSections, setCustomSections] = useState<{ id: string; title: string; content: string }[]>([]);
    const [companionEnabled, setCompanionEnabled] = useState(false);
    const [companionName, setCompanionName] = useState("");
    const [companionKind, setCompanionKind] = useState("");
    const [companionSize, setCompanionSize] = useState("");
    const [companionArmorClass, setCompanionArmorClass] = useState<number>(10);
    const [companionSpeed, setCompanionSpeed] = useState<number>(30);
    const [companionCurrentHp, setCompanionCurrentHp] = useState<number>(0);
    const [companionMaxHp, setCompanionMaxHp] = useState<number>(0);
    const [companionStr, setCompanionStr] = useState<number>(10);
    const [companionDex, setCompanionDex] = useState<number>(10);
    const [companionCon, setCompanionCon] = useState<number>(10);
    const [companionInt, setCompanionInt] = useState<number>(10);
    const [companionWis, setCompanionWis] = useState<number>(10);
    const [companionCha, setCompanionCha] = useState<number>(10);
    const [companionAbilities, setCompanionAbilities] = useState("");
    const [companionSpells, setCompanionSpells] = useState("");
    const [companionNotes, setCompanionNotes] = useState("");
    const [companionOwnerId, setCompanionOwnerId] = useState("");

    // Items y contenido personalizado
    const [items, setItems] = useState<CharacterItem[]>([]);
    const [customSpells, setCustomSpells] = useState<CustomSpellEntry[]>([]);
    const [customCantrips, setCustomCantrips] = useState<CustomSpellEntry[]>([]);
    const [customTraits, setCustomTraits] = useState<CustomFeatureEntry[]>([]);
    const [customClassAbilities, setCustomClassAbilities] = useState<CustomFeatureEntry[]>([]);
    const [customSubclasses, setCustomSubclasses] = useState<CustomSubclassEntry[]>([]);

    // Custom class
    const [customClassName, setCustomClassName] = useState("");
    const [customCastingAbility, setCustomCastingAbility] = useState<keyof Stats>("int");

    // Spells
    const [spellsL0, setSpellsL0] = useState("");
    const [spellsL1, setSpellsL1] = useState("");
    const [spellsL2, setSpellsL2] = useState("");
    const [spellsL3, setSpellsL3] = useState("");
    const [spellsL4, setSpellsL4] = useState("");
    const [spellsL5, setSpellsL5] = useState("");
    const [spellsL6, setSpellsL6] = useState("");
    const [spellsL7, setSpellsL7] = useState("");
    const [spellsL8, setSpellsL8] = useState("");
    const [spellsL9, setSpellsL9] = useState("");

    function addArmor(armor?: ArmorForm) {
        const nextArmor: ArmorForm = armor ?? { name: "", bonus: 0 };
        setArmors((prev) => [...prev, nextArmor]);
    }

    function removeArmor(index: number) {
        setArmors((prev) => prev.filter((_, i) => i !== index));
    }

    function updateArmor(index: number, field: string, value: string | number | null) {
        setArmors((prev) =>
            prev.map((armor, i) => (i === index ? { ...armor, [field]: value } : armor))
        );
    }

    function resetForm() {
        setCharName("");
        setCharacterType("character");
        setCharClass("");
        setClassSubclassId("");
        setCharLevel(1);
        setRace("");
        setExperience(0);
        setArmorClass(10);
        setSpeed(30);
        setCurrentHp(10);
        setHitDieSides(8);
        setStr(10);
        setDex(10);
        setCon(10);
        setIntStat(10);
        setWis(10);
        setCha(10);
        setArmors([]);
        setWeaponName("");
        setWeaponDamage("");
        setWeaponDescription("");
        setWeaponStatAbility("none");
        setWeaponStatModifier(null);
        setWeaponProficient(false);
        setWeaponEquipped(true);
        setWeaponPassiveModifiers([]);
        setInventory("");
        setEquipment("");
        setAbilities("");
        setWeaponsExtra("");
        setNotes("");
        setPortraitNote("");
        setBackground("");
        setAlignment("");
        setPersonalityTraits("");
        setIdeals("");
        setBonds("");
        setFlaws("");
        setAppearance("");
        setBackstory("");
        setLanguages("");
        setProficiencies("");
        setSkillProficiencies({});
        setCustomSections([]);
        setCompanionEnabled(false);
        setCompanionName("");
        setCompanionKind("");
        setCompanionSize("");
        setCompanionArmorClass(10);
        setCompanionSpeed(30);
        setCompanionCurrentHp(0);
        setCompanionMaxHp(0);
        setCompanionStr(10);
        setCompanionDex(10);
        setCompanionCon(10);
        setCompanionInt(10);
        setCompanionWis(10);
        setCompanionCha(10);
        setCompanionAbilities("");
        setCompanionSpells("");
        setCompanionNotes("");
        setCompanionOwnerId("");
        setItems([]);
        setCustomSpells([]);
        setCustomCantrips([]);
        setCustomTraits([]);
        setCustomClassAbilities([]);
        setCustomSubclasses([]);
        setSpellsL0("");
        setSpellsL1("");
        setSpellsL2("");
        setSpellsL3("");
        setSpellsL4("");
        setSpellsL5("");
        setSpellsL6("");
        setSpellsL7("");
        setSpellsL8("");
        setSpellsL9("");
        setCustomClassName("");
        setCustomCastingAbility("int");
    }

    function loadFromCharacter(char: Character) {
        setCharName(char.name);
        setCharClass(normalizeClassForApi(char.class ?? "") || char.class || "");
        setClassSubclassId(char.details?.classSubclassId ?? "");
        setCharLevel(char.level ?? 1);
        setRace(char.race ?? "");
        setExperience(char.experience ?? 0);
        setArmorClass(char.armor_class ?? 10);
        setSpeed(char.speed ?? 30);
        setCurrentHp(char.current_hp ?? char.max_hp ?? 10);

        const stats: Stats =
            char.stats ??
            ({
                str: 10,
                dex: 10,
                con: 10,
                int: 10,
                wis: 10,
                cha: 10,
            } as Stats);

        setStr(stats.str ?? 10);
        setDex(stats.dex ?? 10);
        setCon(stats.con ?? 10);
        setIntStat(stats.int ?? 10);
        setWis(stats.wis ?? 10);
        setCha(stats.cha ?? 10);

        const details = char.details || {};
        const resolvedItems = migrateLegacyItems(details);
        setItems(sortItemsByOrder(resolvedItems));
        const normalizedArmors: ArmorForm[] = Array.isArray(details.armors)
            ? details.armors.map((armor) => ({
                name: armor.name ?? "",
                bonus: typeof armor.bonus === "number" ? armor.bonus : 0,
                ability: armor.ability ?? null,
                statAbility: toAbilityKey(armor.statAbility ?? armor.stat_ability),
                statModifier:
                    typeof armor.statModifier === "number"
                        ? armor.statModifier
                        : typeof armor.stat_modifier === "number"
                            ? armor.stat_modifier
                            : null,
                modifiers: Array.isArray(armor.modifiers)
                    ? armor.modifiers
                        .map((modifier) => ({
                            ability: toAbilityKey(modifier.ability) ?? "STR",
                            modifier: Number(modifier.modifier ?? 0),
                            note: modifier.note,
                        }))
                        .filter((modifier) => Number.isFinite(modifier.modifier))
                    : undefined,
            }))
            : [];
        setArmors(normalizedArmors);
        setWeaponName(details.weaponEquipped?.name ?? "");
        setWeaponDamage(details.weaponEquipped?.damage ?? "");
        setWeaponDescription(details.weaponEquipped?.description ?? "");

        const weapon = details.weaponEquipped;
        setWeaponStatAbility((weapon?.statAbility as AbilityKey | undefined) ?? "none");
        setWeaponStatModifier(typeof weapon?.statModifier === "number" ? weapon.statModifier : null);
        setWeaponProficient(!!weapon?.isProficient);
        setWeaponEquipped(weapon?.equipped !== false);
        const weaponMods = Array.isArray(weapon?.modifiers)
            ? weapon.modifiers.map((mod, index) => ({
                id: `${weapon?.name ?? "weapon"}-${index}-${Date.now()}`,
                ability: mod.ability as AbilityKey,
                value: Number((mod as any).modifier ?? (mod as any).value ?? 0),
                note: (mod as any).note,
                source: "weapon",
            }))
            : [];
        setWeaponPassiveModifiers(weaponMods);

        setInventory(details.inventory ?? "");
        setEquipment(details.equipment ?? "");
        setAbilities(details.abilities ?? "");
        setWeaponsExtra(details.weaponsExtra ?? "");
        setNotes(details.notes ?? "");
        setPortraitNote(details.portraitNote ?? "");
        setBackground(details.background ?? "");
        setAlignment(details.alignment ?? "");
        setPersonalityTraits(details.personalityTraits ?? "");
        setIdeals(details.ideals ?? "");
        setBonds(details.bonds ?? "");
        setFlaws(details.flaws ?? "");
        setAppearance(details.appearance ?? "");
        setBackstory(details.backstory ?? "");
        setLanguages(details.languages ?? "");
        setProficiencies(details.proficiencies ?? "");
        setSkillProficiencies(
            details.skillProficiencies && typeof details.skillProficiencies === "object"
                ? details.skillProficiencies
                : {}
        );
        setCustomSections(Array.isArray(details.customSections) ? details.customSections : []);
        const companion = details.companion;
        if (companion) {
            setCompanionEnabled(true);
            setCompanionName(companion.name ?? "");
            setCompanionKind(companion.kind ?? "");
            setCompanionSize(companion.size ?? "");
            setCompanionArmorClass(companion.armorClass ?? 10);
            setCompanionSpeed(companion.speed ?? 30);
            setCompanionCurrentHp(companion.currentHp ?? 0);
            setCompanionMaxHp(companion.maxHp ?? 0);
            const cStats = companion.stats ?? {
                str: 10,
                dex: 10,
                con: 10,
                int: 10,
                wis: 10,
                cha: 10,
            };
            setCompanionStr(cStats.str ?? 10);
            setCompanionDex(cStats.dex ?? 10);
            setCompanionCon(cStats.con ?? 10);
            setCompanionInt(cStats.int ?? 10);
            setCompanionWis(cStats.wis ?? 10);
            setCompanionCha(cStats.cha ?? 10);
            setCompanionAbilities(companion.abilities ?? "");
            setCompanionSpells(companion.spells ?? "");
            setCompanionNotes(companion.notes ?? "");
        } else {
            setCompanionEnabled(false);
        }
        setCompanionOwnerId(details.companionOwnerId ?? "");
        setHitDieSides(details.hitDie?.sides ?? 8);

        setCustomClassName(details.customClassName ?? "");
        setCustomCastingAbility(details.customCastingAbility ?? "int");
        setCharacterType((char as any).character_type ?? "character");

        const spells: Spells = details.spells || {};
        setSpellsL0(spellsToText(spells.level0));
        setSpellsL1(spellsToText(spells.level1));
        setSpellsL2(spellsToText(spells.level2));
        setSpellsL3(spellsToText(spells.level3));
        setSpellsL4(spellsToText(spells.level4));
        setSpellsL5(spellsToText(spells.level5));
        setSpellsL6(spellsToText(spells.level6));
        setSpellsL7(spellsToText(spells.level7));
        setSpellsL8(spellsToText(spells.level8));
        setSpellsL9(spellsToText(spells.level9));

        setCustomSpells(Array.isArray(details.customSpells) ? details.customSpells : []);
        setCustomCantrips(Array.isArray(details.customCantrips) ? details.customCantrips : []);
        setCustomTraits(Array.isArray(details.customTraits) ? details.customTraits : []);
        setCustomClassAbilities(
            Array.isArray(details.customClassAbilities)
                ? details.customClassAbilities
                : []
        );
        setCustomSubclasses(
            Array.isArray(details.customSubclasses)
                ? details.customSubclasses
                : []
        );
    }

    return {
        fields: {
            charName,
            setCharName,
            characterType,
            setCharacterType,
            charClass,
            setCharClass,
            classSubclassId,
            setClassSubclassId,
            charLevel,
            setCharLevel,
            race,
            setRace,
            experience,
            setExperience,
            armorClass,
            setArmorClass,
            speed,
            setSpeed,
            currentHp,
            setCurrentHp,
            hitDieSides,
            setHitDieSides,
            str,
            setStr,
            dex,
            setDex,
            con,
            setCon,
            intStat,
            setIntStat,
            wis,
            setWis,
            cha,
            setCha,
            armors,
            addArmor,
            removeArmor,
            updateArmor,
            weaponName,
            setWeaponName,
            weaponDamage,
            setWeaponDamage,
            weaponDescription,
            setWeaponDescription,
            weaponStatAbility,
            setWeaponStatAbility,
            weaponStatModifier,
            setWeaponStatModifier,
            weaponProficient,
            setWeaponProficient,
            weaponEquipped,
            setWeaponEquipped,
            weaponPassiveModifiers,
            setWeaponPassiveModifiers,
            inventory,
            setInventory,
            equipment,
            setEquipment,
            abilities,
            setAbilities,
            weaponsExtra,
            setWeaponsExtra,
            notes,
            setNotes,
            portraitNote,
            setPortraitNote,
            background,
            setBackground,
            alignment,
            setAlignment,
            personalityTraits,
            setPersonalityTraits,
            ideals,
            setIdeals,
            bonds,
            setBonds,
            flaws,
            setFlaws,
            appearance,
            setAppearance,
            backstory,
            setBackstory,
            languages,
            setLanguages,
        proficiencies,
        setProficiencies,
        skillProficiencies,
        setSkillProficiencies,
            customSections,
            setCustomSections,
            companionEnabled,
            setCompanionEnabled,
            companionName,
            setCompanionName,
            companionKind,
            setCompanionKind,
            companionSize,
            setCompanionSize,
            companionArmorClass,
            setCompanionArmorClass,
            companionSpeed,
            setCompanionSpeed,
            companionCurrentHp,
            setCompanionCurrentHp,
            companionMaxHp,
            setCompanionMaxHp,
            companionStr,
            setCompanionStr,
            companionDex,
            setCompanionDex,
            companionCon,
            setCompanionCon,
            companionInt,
            setCompanionInt,
            companionWis,
            setCompanionWis,
            companionCha,
            setCompanionCha,
            companionAbilities,
            setCompanionAbilities,
            companionSpells,
            setCompanionSpells,
        companionNotes,
        setCompanionNotes,
        companionOwnerId,
        setCompanionOwnerId,
            items,
            setItems,
            customSpells,
            setCustomSpells,
            customCantrips,
            setCustomCantrips,
            customTraits,
            setCustomTraits,
            customClassAbilities,
            setCustomClassAbilities,
            customSubclasses,
            setCustomSubclasses,
            spellsL0,
            setSpellsL0,
            spellsL1,
            setSpellsL1,
            spellsL2,
            setSpellsL2,
            spellsL3,
            setSpellsL3,
            spellsL4,
            setSpellsL4,
            spellsL5,
            setSpellsL5,
            spellsL6,
            setSpellsL6,
            spellsL7,
            setSpellsL7,
            spellsL8,
            setSpellsL8,
            spellsL9,
            setSpellsL9,
            customClassName,
            setCustomClassName,
            customCastingAbility,
            setCustomCastingAbility,
        },
        resetForm,
        loadFromCharacter,
    };
}
