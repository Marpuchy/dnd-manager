// src/app/campaigns/[id]/player/CharacterForm.tsx
import { FormEvent } from "react";
import { abilityMod, computeMaxHp, sumArmorBonus } from "@/lib/dndMath";
import { Armor, Mode, Stats, DND_CLASS_OPTIONS } from "./playerShared";
import { InfoBox } from "./ui/InfoBox";
import { StatInput } from "./ui/StatInput";
import { TextField, NumberField, TextareaField } from "./ui/FormFields";

import { ArmorAndWeaponSection } from "./sections/ArmorAndWeaponSection";
import { InventorySections } from "./sections/InventorySections";
import { SpellSection } from "./sections/SpellSection";

type CharacterFormProps = {
    mode: Mode;
    onSubmit: (e: FormEvent) => void;
    onCancel: () => void;
    // En page.tsx se le pasa un mega objeto con todos los setters
    fields: any;
};

export function CharacterForm({ mode, onSubmit, onCancel, fields }: CharacterFormProps) {
    const {
        // Datos básicos
        charName,
        setCharName,
        charClass,
        setCharClass,
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

        // Vida
        currentHp,
        setCurrentHp,
        hitDieSides,
        setHitDieSides,

        // Stats base
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

        // Armaduras
        armors,
        addArmor,
        removeArmor,
        updateArmor,

        // Arma equipada (datos básicos; los modificadores se gestionan en la sección)
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

        // Texto libre
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

        // Hechizos por nivel
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

        // Clase personalizada
        customClassName,
        setCustomClassName,
        customCastingAbility,
        setCustomCastingAbility,
    } = fields;

    const conMod = abilityMod(con);
    const baseAC = armorClass ?? 10;
    const armorBonus = sumArmorBonus(armors as Armor[]);
    const previewTotalAC = baseAC + armorBonus;
    const previewMaxHp = computeMaxHp(charLevel, con, hitDieSides);
    const isCustomClass = charClass === "custom";

    return (
        <div className="border border-zinc-800 bg-zinc-950/80 rounded-xl p-4 space-y-4">
            {/* Header */}
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-purple-300">
                        {mode === "create" ? "Nuevo personaje" : "Editar personaje"}
                    </h2>
                    <p className="text-xs text-zinc-500">
                        Gestiona stats base, equipo, arma principal, inventario y conjuros.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-xs px-3 py-1 rounded-md border border-zinc-700 hover:bg-zinc-900"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="character-form"
                        className="text-xs px-3 py-1 rounded-md border border-purple-600/70 bg-purple-700/30 hover:bg-purple-700/50"
                    >
                        {mode === "edit" ? "Guardar cambios" : "Crear personaje"}
                    </button>
                </div>
            </header>

            <form
                id="character-form"
                onSubmit={onSubmit}
                className="space-y-6"
            >
                {/* Datos básicos / clase / vida */}
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-200">Datos básicos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <TextField
                            label="Nombre"
                            value={charName}
                            onChange={setCharName}
                            required
                        />

                        {/* Clase */}
                        <div className="flex flex-col gap-1 text-sm">
                            <label className="text-sm text-purple-200">Clase</label>
                            <select
                                value={charClass}
                                onChange={(e) => setCharClass(e.target.value)}
                                className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-purple-500"
                            >
                                <option value="">Sin clase</option>
                                {DND_CLASS_OPTIONS.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                        {c.label}
                                    </option>
                                ))}
                                <option value="custom">Clase personalizada…</option>
                            </select>
                            <p className="text-[11px] text-zinc-500">
                                Se usa para calcular espacios de conjuro y cargar habilidades.
                            </p>
                        </div>

                        <TextField
                            label="Raza / Origen"
                            value={race}
                            onChange={setRace}
                        />
                    </div>

                    {/* Clase personalizada */}
                    {isCustomClass && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-purple-800/60 rounded-lg p-3 bg-zinc-900/60">
                            <TextField
                                label="Nombre de la clase personalizada"
                                value={customClassName}
                                onChange={setCustomClassName}
                            />
                            <div className="space-y-1">
                                <label className="text-sm text-purple-200">
                                    Característica de conjuro
                                </label>
                                <select
                                    value={customCastingAbility}
                                    onChange={(e) =>
                                        setCustomCastingAbility(e.target.value as keyof Stats)
                                    }
                                    className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-purple-500"
                                >
                                    <option value="int">Inteligencia (INT)</option>
                                    <option value="wis">Sabiduría (SAB)</option>
                                    <option value="cha">Carisma (CAR)</option>
                                    <option value="str">Fuerza (FUE)</option>
                                    <option value="dex">Destreza (DES)</option>
                                    <option value="con">Constitución (CON)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Nivel / XP / CA / velocidad */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <NumberField
                            label="Nivel"
                            value={charLevel}
                            onChange={setCharLevel}
                            min={1}
                            max={20}
                        />
                        <NumberField
                            label="Experiencia (XP)"
                            value={experience}
                            onChange={setExperience}
                            min={0}
                        />
                        <NumberField
                            label="CA base"
                            value={armorClass}
                            onChange={setArmorClass}
                            min={0}
                        />
                        <NumberField
                            label="Velocidad (ft)"
                            value={speed}
                            onChange={setSpeed}
                            min={0}
                        />
                    </div>

                    {/* Vida / dado de golpe */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-sm text-purple-200">
                                Dado de golpe por nivel
                            </label>
                            <select
                                value={hitDieSides}
                                onChange={(e) =>
                                    setHitDieSides(Number(e.target.value) || 8)
                                }
                                className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-purple-500"
                            >
                                <option value={6}>d6</option>
                                <option value={8}>d8</option>
                                <option value={10}>d10</option>
                                <option value={12}>d12</option>
                            </select>
                        </div>

                        <NumberField
                            label="Vida actual"
                            value={currentHp}
                            onChange={setCurrentHp}
                            min={0}
                        />

                        <InfoBox
                            label="Vida máxima (calculada)"
                            value={previewMaxHp}
                            sub={`(${hitDieSides} × nivel) + ${
                                conMod >= 0 ? `+${conMod}` : conMod
                            }`}
                        />
                    </div>
                </section>

                {/* Stats base */}
                <section className="space-y-2">
                    <h3 className="text-sm font-semibold text-purple-200">
                        Atributos (stats)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        <StatInput label="FUE (STR)" value={str} onChange={setStr} />
                        <StatInput label="DES (DEX)" value={dex} onChange={setDex} />
                        <StatInput label="CON" value={con} onChange={setCon} />
                        <StatInput label="INT" value={intStat} onChange={setIntStat} />
                        <StatInput label="SAB (WIS)" value={wis} onChange={setWis} />
                        <StatInput label="CAR (CHA)" value={cha} onChange={setCha} />
                    </div>
                </section>

                {/* Armaduras + arma principal (sección separada) */}
                <ArmorAndWeaponSection
                    armors={armors}
                    addArmor={addArmor}
                    removeArmor={removeArmor}
                    updateArmor={updateArmor}
                    baseAC={baseAC}
                    armorBonus={armorBonus}
                    previewTotalAC={previewTotalAC}
                    weaponName={weaponName}
                    setWeaponName={setWeaponName}
                    weaponDamage={weaponDamage}
                    setWeaponDamage={setWeaponDamage}
                    weaponDescription={weaponDescription}
                    setWeaponDescription={setWeaponDescription}
                    weaponStatAbility={weaponStatAbility}
                    setWeaponStatAbility={setWeaponStatAbility}
                    weaponStatModifier={weaponStatModifier}
                    setWeaponStatModifier={setWeaponStatModifier}
                />


                {/* Conjuros (chips + buscador) */}
                <SpellSection
                    charClass={charClass}
                    charLevel={charLevel}
                    spellsL0={spellsL0}
                    setSpellsL0={setSpellsL0}
                    spellsL1={spellsL1}
                    setSpellsL1={setSpellsL1}
                    spellsL2={spellsL2}
                    setSpellsL2={setSpellsL2}
                    spellsL3={spellsL3}
                    setSpellsL3={setSpellsL3}
                    spellsL4={spellsL4}
                    setSpellsL4={setSpellsL4}
                    spellsL5={spellsL5}
                    setSpellsL5={setSpellsL5}
                    spellsL6={spellsL6}
                    setSpellsL6={setSpellsL6}
                    spellsL7={spellsL7}
                    setSpellsL7={setSpellsL7}
                    spellsL8={spellsL8}
                    setSpellsL8={setSpellsL8}
                    spellsL9={spellsL9}
                    setSpellsL9={setSpellsL9}
                />

                {/* Inventario / equipamiento / notas (con drag&drop e items JSON) */}
                <InventorySections
                    inventory={inventory}
                    setInventory={setInventory}
                    equipment={equipment}
                    setEquipment={setEquipment}
                    weaponsExtra={weaponsExtra}
                    setWeaponsExtra={setWeaponsExtra}
                    abilities={abilities}
                    setAbilities={setAbilities}
                    notes={notes}
                    setNotes={setNotes}
                />

                <div className="flex justify-end pt-1">
                    <button
                        type="submit"
                        className="rounded-md bg-purple-700 hover:bg-purple-600 px-4 py-2 text-sm font-medium"
                    >
                        Guardar personaje
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CharacterForm;
