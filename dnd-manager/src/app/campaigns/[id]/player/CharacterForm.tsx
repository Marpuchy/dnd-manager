import { FormEvent, useMemo, useState } from "react";
import { abilityMod, computeMaxHp, sumArmorBonus } from "@/lib/dndMath";
import {
    Armor,
    Mode,
    Stats,
    DND_CLASS_OPTIONS,
    SpellSummary,
    parseSpellLines,
} from "./playerShared";
import { InfoBox } from "./ui/InfoBox";
import { StatInput } from "./ui/StatInput";
import { TextField, NumberField, TextareaField } from "./ui/FormFields";
import { getSpellSlotsFor } from "@/lib/spellSlots";

type CharacterFormProps = {
    mode: Mode;
    onSubmit: (e: FormEvent) => void;
    onCancel: () => void;
    fields: any;
};

type AbilityKey = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";

type InventoryItem = {
    name: string;
    type?: string;
    description?: string;
    ability?: AbilityKey;
    modifier?: number;
};

type InventorySectionId = "inventory" | "equipment" | "weapons";

type ListEditorProps = {
    label: string;
    sectionId: InventorySectionId;
    value: string;
    onChange: (value: string) => void;
    onMoveItem: (
        fromSection: InventorySectionId,
        fromIndex: number,
        toSection: InventorySectionId
    ) => void;
};

type ParsedInventoryLine =
    | { kind: "json"; item: InventoryItem; raw: string }
    | { kind: "text"; raw: string };

export function CharacterForm({
                                  mode,
                                  onSubmit,
                                  onCancel,
                                  fields,
                              }: CharacterFormProps) {
    const {
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
    const armorBonus = sumArmorBonus(armors);
    const previewTotalAC = baseAC + armorBonus;
    const previewMaxHp = computeMaxHp(charLevel, con, hitDieSides);
    const isCustomClass = charClass === "custom";

    // UI local para armaduras
    const [isArmorFormOpen, setIsArmorFormOpen] = useState(false);
    const [editingArmorIndex, setEditingArmorIndex] = useState<number | null>(
        null
    );
    const [armorFormName, setArmorFormName] = useState("");
    const [armorFormBonus, setArmorFormBonus] = useState<number>(0);
    const [armorFormAbility, setArmorFormAbility] = useState("");

    // UI local para arma equipada
    const [isWeaponFormOpen, setIsWeaponFormOpen] = useState(false);

    // ─────────────────────────────────────────────
    //   Cálculo de máximo nivel de conjuro
    // ─────────────────────────────────────────────
    const maxSpellLevel = useMemo(() => {
        if (!charClass || !charLevel || charLevel < 1) return 0;

        let clsForSlots = charClass;
        if (charClass === "custom") {
            clsForSlots = "wizard";
        }

        const slots = getSpellSlotsFor(clsForSlots, charLevel);
        if (!slots) return 0;

        if ("slots" in slots) {
            return slots.slotLevel ?? 0;
        }

        const entries = Object.entries(slots)
            .map(([lvl, num]) => ({
                lvl: Number(lvl),
                num: num as number,
            }))
            .filter((e) => e.lvl > 0 && e.num > 0);

        if (entries.length === 0) return 0;
        return entries.reduce((max, e) => Math.max(max, e.lvl), 0);
    }, [charClass, charLevel]);

    const spellLevelFields = [
        { level: 0, label: "Trucos (nivel 0)", value: spellsL0, setter: setSpellsL0 },
        { level: 1, label: "Nivel 1", value: spellsL1, setter: setSpellsL1 },
        { level: 2, label: "Nivel 2", value: spellsL2, setter: setSpellsL2 },
        { level: 3, label: "Nivel 3", value: spellsL3, setter: setSpellsL3 },
        { level: 4, label: "Nivel 4", value: spellsL4, setter: setSpellsL4 },
        { level: 5, label: "Nivel 5", value: spellsL5, setter: setSpellsL5 },
        { level: 6, label: "Nivel 6", value: spellsL6, setter: setSpellsL6 },
        { level: 7, label: "Nivel 7", value: spellsL7, setter: setSpellsL7 },
        { level: 8, label: "Nivel 8", value: spellsL8, setter: setSpellsL8 },
        { level: 9, label: "Nivel 9", value: spellsL9, setter: setSpellsL9 },
    ].filter((f) => f.level === 0 || f.level <= maxSpellLevel);

    // ─────────────────────────────────────────────
    //   Helpers conjuros en formulario
    // ─────────────────────────────────────────────
    function getSpellStateForLevel(level: number) {
        switch (level) {
            case 0:
                return { value: spellsL0 as string, set: setSpellsL0 };
            case 1:
                return { value: spellsL1 as string, set: setSpellsL1 };
            case 2:
                return { value: spellsL2 as string, set: setSpellsL2 };
            case 3:
                return { value: spellsL3 as string, set: setSpellsL3 };
            case 4:
                return { value: spellsL4 as string, set: setSpellsL4 };
            case 5:
                return { value: spellsL5 as string, set: setSpellsL5 };
            case 6:
                return { value: spellsL6 as string, set: setSpellsL6 };
            case 7:
                return { value: spellsL7 as string, set: setSpellsL7 };
            case 8:
                return { value: spellsL8 as string, set: setSpellsL8 };
            case 9:
                return { value: spellsL9 as string, set: setSpellsL9 };
            default:
                return null;
        }
    }

    function isSpellLearnedInForm(spell: SpellSummary): boolean {
        const state = getSpellStateForLevel(spell.level);
        if (!state) return false;
        const lines = parseSpellLines(state.value || "");
        return lines.some((line) => line.name === spell.name);
    }

    function addSpellToForm(spell: SpellSummary) {
        const state = getSpellStateForLevel(spell.level);
        if (!state) return;

        const raw = (state.value || "") as string;
        const currentLines = raw
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);

        if (currentLines.includes(spell.name)) return;

        const newValue =
            currentLines.length > 0 ? `${raw.trim()}\n${spell.name}` : spell.name;

        state.set(newValue);
    }

    function removeSpellFromForm(spell: SpellSummary) {
        const state = getSpellStateForLevel(spell.level);
        if (!state) return;

        const raw = (state.value || "") as string;
        const newLines = raw
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
            .filter((line) => {
                const name = line.split("—")[0].trim();
                return name !== spell.name;
            });

        state.set(newLines.join("\n"));
    }

    function removeSpellByLevelAndName(level: number, name: string) {
        const fakeSpell: SpellSummary = {
            index: `${level}-${name}`,
            name,
            level,
        } as SpellSummary;

        removeSpellFromForm(fakeSpell);
    }

    // ─────────────────────────────────────────────
    //   Drag & drop entre inventario / equipo / armas
    // ─────────────────────────────────────────────
    function getSectionValue(id: InventorySectionId): string {
        if (id === "inventory") return inventory ?? "";
        if (id === "equipment") return equipment ?? "";
        return weaponsExtra ?? "";
    }

    function setSectionValue(id: InventorySectionId, newValue: string) {
        if (id === "inventory") setInventory(newValue);
        else if (id === "equipment") setEquipment(newValue);
        else setWeaponsExtra(newValue);
    }

    function handleMoveInventoryItem(
        fromSection: InventorySectionId,
        fromIndex: number,
        toSection: InventorySectionId
    ) {
        if (fromSection === toSection) return;

        const fromValue = getSectionValue(fromSection);
        const fromLines = fromValue
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);

        if (fromIndex < 0 || fromIndex >= fromLines.length) return;

        const [movedLine] = fromLines.splice(fromIndex, 1);

        const toValue = getSectionValue(toSection);
        const toLines = toValue
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);

        toLines.push(movedLine);

        setSectionValue(fromSection, fromLines.join("\n"));
        setSectionValue(toSection, toLines.join("\n"));
    }

    // ─────────────────────────────────────────────
    //   UI Armaduras: resumen + menú de edición/creación
    // ─────────────────────────────────────────────
    function openNewArmorForm() {
        setEditingArmorIndex(null);
        setArmorFormName("");
        setArmorFormBonus(0);
        setArmorFormAbility("");
        setIsArmorFormOpen(true);
    }

    function openEditArmorForm(index: number) {
        const armor = armors[index];
        if (!armor) return;
        setEditingArmorIndex(index);
        setArmorFormName(armor.name ?? "");
        setArmorFormBonus(armor.bonus ?? 0);
        setArmorFormAbility((armor as any).ability ?? armor.ability ?? "");
        setIsArmorFormOpen(true);
    }

    function cancelArmorForm() {
        setIsArmorFormOpen(false);
        setEditingArmorIndex(null);
    }

    function saveArmorForm() {
        const name = armorFormName.trim();
        if (!name) {
            cancelArmorForm();
            return;
        }

        const bonus = Number(armorFormBonus) || 0;
        const ability = armorFormAbility.trim();

        if (editingArmorIndex === null) {
            // Crear nueva
            const newIndex = armors.length;
            addArmor();
            updateArmor(newIndex, "name", name);
            updateArmor(newIndex, "bonus", bonus);
            updateArmor(newIndex, "ability", ability);
        } else {
            // Editar existente
            updateArmor(editingArmorIndex, "name", name);
            updateArmor(editingArmorIndex, "bonus", bonus);
            updateArmor(editingArmorIndex, "ability", ability);
        }

        cancelArmorForm();
    }

    // ─────────────────────────────────────────────
    //   Render
    // ─────────────────────────────────────────────
    return (
        <div className="border border-zinc-800 bg-zinc-950/80 rounded-xl p-4 space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-purple-300">
                    {mode === "create" ? "Nuevo personaje" : "Editar personaje"}
                </h2>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                    Cerrar
                </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
                {/* Identidad */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <TextField
                        label="Nombre"
                        value={charName}
                        onChange={setCharName}
                        required
                    />

                    <div className="flex flex-col gap-1 text-sm">
                        <label className="text-sm text-zinc-300">Clase</label>
                        <select
                            value={charClass}
                            onChange={(e) => setCharClass(e.target.value)}
                            className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-purple-500"
                        >
                            <option value="">Sin clase</option>
                            {DND_CLASS_OPTIONS.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-[11px] text-zinc-500">
                            Se usa para calcular espacios de conjuro y cargar la lista de
                            habilidades de conjuro.
                        </p>
                    </div>

                    <TextField label="Raza" value={race} onChange={setRace} />
                </div>

                {/* Clase personalizada */}
                {isCustomClass && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-zinc-800 rounded-lg p-3">
                        <TextField
                            label="Nombre de la clase personalizada"
                            value={customClassName}
                            onChange={setCustomClassName}
                        />
                        <div className="space-y-1">
                            <label className="text-sm text-zinc-300">
                                Estadística de lanzamiento
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
                            <p className="text-[11px] text-zinc-500">
                                Tus conjuros preparados serán: nivel + modificador de esta
                                estadística.
                            </p>
                        </div>
                    </div>
                )}

                {/* Nivel / XP / CA / Velocidad */}
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
                        label="Velocidad"
                        value={speed}
                        onChange={setSpeed}
                        min={0}
                    />
                </div>

                {/* Vida / dado de golpe */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className="text-sm text-zinc-300">
                            Dado de golpe por nivel
                        </label>
                        <select
                            value={hitDieSides}
                            onChange={(e) => setHitDieSides(Number(e.target.value) || 8)}
                            className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-purple-500"
                        >
                            <option value={6}>d6</option>
                            <option value={8}>d8</option>
                            <option value={10}>d10</option>
                            <option value={12}>d12</option>
                        </select>
                        <p className="text-[11px] text-zinc-500">
                            Se usa para calcular la vida máxima: (dado × nivel) + mod CON.
                        </p>
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

                {/* Stats encima de armaduras */}
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-zinc-300">
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
                </div>

                {/* Armaduras: resumen + menú */}
                <div className="border border-zinc-800 rounded-lg p-3 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-zinc-200">Armaduras</h3>
                        <button
                            type="button"
                            onClick={openNewArmorForm}
                            className="text-xs px-2 py-1 border border-purple-600/70 rounded-md hover:bg-purple-900/40"
                        >
                            Nueva armadura
                        </button>
                    </div>

                    {armors.length === 0 ? (
                        <p className="text-xs text-zinc-500">
                            No tienes ninguna armadura añadida.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {armors.map((armor: Armor, index: number) => (
                                <li
                                    key={index}
                                    className="flex flex-wrap items-start justify-between gap-2 rounded-md bg-zinc-900 px-2 py-2 border border-zinc-700"
                                >
                                    <div className="space-y-1 min-w-[160px]">
                                        <p className="text-sm text-zinc-200 font-semibold break-words">
                                            {armor.name || `Armadura ${index + 1}`}
                                        </p>
                                        <p className="text-xs text-zinc-400">
                                            Bonificador CA:{" "}
                                            <span className="font-medium">
                        {armor.bonus >= 0 ? `+${armor.bonus}` : armor.bonus}
                      </span>
                                        </p>
                                        {armor.ability && (
                                            <p className="text-xs text-zinc-500 whitespace-pre-wrap">
                                                {armor.ability}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEditArmorForm(index)}
                                            className="text-[11px] px-3 py-1 rounded-md border border-zinc-600 hover:bg-zinc-900"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeArmor(index)}
                                            className="text-[11px] px-3 py-1 rounded-md border border-red-500/70 hover:bg-red-900/40"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    <InfoBox
                        label="CA total (preview)"
                        value={previewTotalAC}
                        sub={`Base ${baseAC} + armaduras (${
                            armorBonus >= 0 ? `+${armorBonus}` : armorBonus
                        })`}
                    />

                    {isArmorFormOpen && (
                        <div className="mt-3 border border-zinc-700 rounded-md p-3 space-y-3 bg-zinc-950/70">
                            <p className="text-xs text-zinc-400">
                                {editingArmorIndex === null
                                    ? "Nueva armadura"
                                    : "Editar armadura"}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-300">Nombre *</label>
                                    <input
                                        type="text"
                                        value={armorFormName}
                                        onChange={(e) => setArmorFormName(e.target.value)}
                                        className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-300">
                                        Bonificador CA
                                    </label>
                                    <input
                                        type="number"
                                        value={armorFormBonus}
                                        onChange={(e) =>
                                            setArmorFormBonus(Number(e.target.value) || 0)
                                        }
                                        className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs outline-none focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-zinc-300">
                                    Habilidad / efecto
                                </label>
                                <textarea
                                    value={armorFormAbility}
                                    onChange={(e) => setArmorFormAbility(e.target.value)}
                                    className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs outline-none focus:border-purple-500 min-h-[60px]"
                                />
                            </div>

                            <div className="flex flex-wrap justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={cancelArmorForm}
                                    className="text-[11px] px-3 py-1 rounded-md border border-zinc-600 hover:bg-zinc-900"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={saveArmorForm}
                                    className="text-[11px] px-3 py-1 rounded-md border border-emerald-500/70 hover:bg-emerald-900/40"
                                >
                                    Guardar armadura
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Arma equipada: resumen + botón editar */}
                <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-zinc-200">
                            Arma equipada
                        </h3>
                        <button
                            type="button"
                            onClick={() => setIsWeaponFormOpen((v) => !v)}
                            className="text-[11px] px-3 py-1 rounded-md border border-zinc-600 hover:bg-zinc-900"
                        >
                            {isWeaponFormOpen ? "Cerrar edición" : "Editar / Crear arma"}
                        </button>
                    </div>

                    {!isWeaponFormOpen && (
                        <>
                            {weaponName || weaponDamage || weaponDescription ? (
                                <div className="space-y-1">
                                    <p className="text-sm text-zinc-200 font-medium">
                                        {weaponName || "Arma sin nombre"}
                                    </p>
                                    {weaponDamage && (
                                        <p className="text-xs text-zinc-400">
                                            Daño: {weaponDamage}
                                        </p>
                                    )}
                                    {weaponDescription && (
                                        <p className="text-xs text-zinc-500 whitespace-pre-wrap">
                                            {weaponDescription}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-zinc-500">Sin arma equipada.</p>
                            )}
                        </>
                    )}

                    {isWeaponFormOpen && (
                        <div className="mt-2 space-y-2">
                            <TextField
                                label="Nombre del arma"
                                value={weaponName}
                                onChange={setWeaponName}
                            />
                            <TextField
                                label="Daño (ej: 1d8 cortante)"
                                value={weaponDamage}
                                onChange={setWeaponDamage}
                            />
                            <TextareaField
                                label="Descripción / propiedades"
                                value={weaponDescription}
                                onChange={setWeaponDescription}
                            />
                        </div>
                    )}
                </div>

                {/* Conjuros (chips) */}
                <div className="border border-zinc-800 rounded-lg p-3 space-y-3">
                    <h3 className="text-sm font-semibold text-zinc-200">
                        Conjuros añadidos al personaje
                    </h3>

                    {spellLevelFields.every(
                        (f) => parseSpellLines(f.value || "").length === 0
                    ) && (
                        <p className="text-xs text-zinc-500">
                            Aún no has añadido conjuros. Usa el buscador de habilidades de
                            abajo para añadirlos.
                        </p>
                    )}

                    <div className="space-y-3">
                        {spellLevelFields.map((field) => {
                            const lines = parseSpellLines(field.value || "");
                            if (lines.length === 0) return null;

                            return (
                                <div key={field.level} className="space-y-1">
                                    <p className="text-xs font-semibold text-zinc-300">
                                        {field.label}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {lines.map((line) => (
                                            <span
                                                key={line.name}
                                                className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-[11px] text-zinc-200"
                                            >
                        {line.name}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeSpellByLevelAndName(
                                                            field.level,
                                                            line.name
                                                        )
                                                    }
                                                    className="text-[10px] text-red-400 hover:text-red-300"
                                                >
                          Eliminar
                        </button>
                      </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <p className="text-[11px] text-zinc-500 mt-1">
                        La descripción completa solo se muestra en el buscador de
                        habilidades inferior. Aquí guardamos solo el nombre de cada conjuro.
                    </p>
                </div>

                {/* Inventario / equipo / armas adicionales con menú de creación + drag&drop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ListEditor
                        label="Inventario / Mochila"
                        sectionId="inventory"
                        value={inventory}
                        onChange={setInventory}
                        onMoveItem={handleMoveInventoryItem}
                    />
                    <ListEditor
                        label="Equipamiento adicional"
                        sectionId="equipment"
                        value={equipment}
                        onChange={setEquipment}
                        onMoveItem={handleMoveInventoryItem}
                    />
                    <ListEditor
                        label="Armas adicionales"
                        sectionId="weapons"
                        value={weaponsExtra}
                        onChange={setWeaponsExtra}
                        onMoveItem={handleMoveInventoryItem}
                    />
                    <TextareaField
                        label="Habilidades / Rasgos / Dotes"
                        value={abilities}
                        onChange={setAbilities}
                    />
                </div>

                <TextareaField
                    label="Notas del personaje"
                    value={notes}
                    onChange={setNotes}
                />

                {/* Buscador de habilidades */}
                <MiniSpellSearch
                    charClass={charClass}
                    charLevel={charLevel}
                    isSpellLearned={isSpellLearnedInForm}
                    onAddSpell={addSpellToForm}
                    onRemoveSpell={removeSpellFromForm}
                />

                <div className="flex justify-end">
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

// ─────────────────────────────────────────────
//   Helpers inventario (JSON por línea + drag&drop)
// ─────────────────────────────────────────────

function parseInventoryLine(line: string): ParsedInventoryLine {
    const trimmed = line.trim();

    if (!trimmed.startsWith("{")) {
        return { kind: "text", raw: trimmed };
    }

    try {
        const parsed = JSON.parse(trimmed) as InventoryItem;

        if (!parsed || typeof parsed !== "object" || !parsed.name) {
            return { kind: "text", raw: trimmed };
        }

        return { kind: "json", item: parsed, raw: trimmed };
    } catch {
        return { kind: "text", raw: trimmed };
    }
}

function ListEditor({
                        label,
                        sectionId,
                        value,
                        onChange,
                        onMoveItem,
                    }: ListEditorProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const [itemName, setItemName] = useState("");
    const [itemType, setItemType] = useState("");
    const [itemDescription, setItemDescription] = useState("");
    const [abilityKey, setAbilityKey] = useState<AbilityKey | "none">("none");
    const [abilityModifier, setAbilityModifier] = useState<string>("");

    const lines = (value || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    const parsedItems: ParsedInventoryLine[] = lines.map(parseInventoryLine);

    function resetForm() {
        setItemName("");
        setItemType("");
        setItemDescription("");
        setAbilityKey("none");
        setAbilityModifier("");
        setEditingIndex(null);
    }

    function openNewItemForm() {
        resetForm();
        setIsFormOpen(true);
    }

    function openEditItemForm(index: number) {
        const entry = parsedItems[index];
        setEditingIndex(index);

        if (entry.kind === "json") {
            const { item } = entry;
            setItemName(item.name ?? "");
            setItemType(item.type ?? "");
            setItemDescription(item.description ?? "");
            setAbilityKey(item.ability ?? "none");
            setAbilityModifier(
                typeof item.modifier === "number" ? String(item.modifier) : ""
            );
        } else {
            setItemName(entry.raw);
            setItemType("");
            setItemDescription("");
            setAbilityKey("none");
            setAbilityModifier("");
        }

        setIsFormOpen(true);
    }

    function handleRemoveItem(index: number) {
        const remaining = lines.filter((_, i) => i !== index);
        onChange(remaining.join("\n"));
    }

    function handleSaveItem() {
        const name = itemName.trim();
        if (!name) {
            setIsFormOpen(false);
            resetForm();
            return;
        }

        const type = itemType.trim() || undefined;
        const description = itemDescription.trim() || undefined;

        let ability: AbilityKey | undefined;
        let modifier: number | undefined;

        if (abilityKey !== "none" && abilityModifier !== "") {
            const numeric = Number(abilityModifier);
            if (!Number.isNaN(numeric)) {
                ability = abilityKey;
                modifier = numeric;
            }
        }

        const item: InventoryItem = {
            name,
            type,
            description,
            ability,
            modifier,
        };

        const jsonLine = JSON.stringify(item);

        const newLines = [...lines];
        if (editingIndex === null) {
            newLines.push(jsonLine);
        } else {
            newLines[editingIndex] = jsonLine;
        }

        onChange(newLines.join("\n"));
        resetForm();
        setIsFormOpen(false);
    }

    function handleDragStart(
        event: React.DragEvent<HTMLLIElement>,
        index: number
    ) {
        const payload = JSON.stringify({ sectionId, index });
        event.dataTransfer.setData("application/x-dnd-manager-item", payload);
        event.dataTransfer.effectAllowed = "move";
    }

    function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }

    function handleDrop(event: React.DragEvent<HTMLDivElement>) {
        event.preventDefault();
        const raw = event.dataTransfer.getData("application/x-dnd-manager-item");
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw) as {
                sectionId: InventorySectionId;
                index: number;
            };
            if (
                parsed &&
                typeof parsed.sectionId === "string" &&
                typeof parsed.index === "number"
            ) {
                onMoveItem(parsed.sectionId as InventorySectionId, parsed.index, sectionId);
            }
        } catch {
            // ignore
        }
    }

    return (
        <div
            className="border border-zinc-800 rounded-lg p-3 space-y-3"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <h3 className="text-sm font-semibold text-zinc-200">{label}</h3>

            {/* Lista de elementos actuales */}
            {parsedItems.length === 0 ? (
                <p className="text-xs text-zinc-500">
                    No hay elementos añadidos todavía.
                </p>
            ) : (
                <ul className="space-y-1 text-sm text-zinc-200">
                    {parsedItems.map((entry, index) => {
                        if (entry.kind === "text") {
                            return (
                                <li
                                    key={index}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-zinc-900 px-2 py-1 border border-zinc-700"
                                >
                                    <span className="text-xs break-words">{entry.raw}</span>
                                    <div className="flex flex-wrap gap-1">
                                        <button
                                            type="button"
                                            onClick={() => openEditItemForm(index)}
                                            className="text-[10px] px-2 py-0.5 rounded-md border border-zinc-600 hover:bg-zinc-900"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="text-[10px] px-2 py-0.5 rounded-md border border-red-500/70 hover:bg-red-900/40"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </li>
                            );
                        }

                        const { item } = entry;
                        const modifierLabel =
                            item.ability && typeof item.modifier === "number"
                                ? `${item.ability} ${
                                    item.modifier >= 0 ? `+${item.modifier}` : item.modifier
                                }`
                                : null;

                        return (
                            <li
                                key={index}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                className="flex flex-wrap items-start justify-between gap-2 rounded-md bg-zinc-900 px-2 py-2 border border-zinc-700"
                            >
                                <div className="flex-1 min-w-[160px] space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold break-words">
                      {item.name}
                    </span>
                                        {item.type && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-600 text-zinc-300">
                        {item.type}
                      </span>
                                        )}
                                        {modifierLabel && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-600 text-emerald-300">
                        {modifierLabel}
                      </span>
                                        )}
                                    </div>
                                    {item.description && (
                                        <p className="text-[11px] text-zinc-400 whitespace-pre-wrap">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-1">
                                    <button
                                        type="button"
                                        onClick={() => openEditItemForm(index)}
                                        className="text-[10px] px-2 py-0.5 rounded-md border border-zinc-600 hover:bg-zinc-900"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(index)}
                                        className="text-[10px] px-2 py-0.5 rounded-md border border-red-500/70 hover:bg-red-900/40"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* Botón abrir formulario */}
            {!isFormOpen && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={openNewItemForm}
                        className="text-[11px] px-3 py-1 rounded-md border border-purple-600/70 hover:bg-purple-900/40"
                    >
                        Añadir elemento
                    </button>
                </div>
            )}

            {/* Formulario de creación/edición */}
            {isFormOpen && (
                <div className="mt-2 border border-zinc-700 rounded-md p-3 space-y-3 bg-zinc-950/70">
                    <p className="text-xs text-zinc-400">
                        {editingIndex === null ? "Nuevo elemento" : "Editar elemento"}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-300">Nombre *</label>
                            <input
                                type="text"
                                value={itemName}
                                onChange={(e) => setItemName(e.target.value)}
                                className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs outline-none focus:border-purple-500"
                                placeholder="Espada larga, Poción de vida..."
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-zinc-300">Tipo</label>
                            <input
                                type="text"
                                value={itemType}
                                onChange={(e) => setItemType(e.target.value)}
                                className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs outline-none focus:border-purple-500"
                                placeholder="Arma, armadura, objeto..."
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-zinc-300">Descripción</label>
                        <textarea
                            value={itemDescription}
                            onChange={(e) => setItemDescription(e.target.value)}
                            className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs outline-none focus:border-purple-500 min-h-[60px]"
                            placeholder="Propiedades, usos, notas..."
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-300">
                                Modifica característica
                            </label>
                            <select
                                value={abilityKey}
                                onChange={(e) =>
                                    setAbilityKey(e.target.value as AbilityKey | "none")
                                }
                                className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs outline-none focus:border-purple-500"
                            >
                                <option value="none">Ninguna</option>
                                <option value="STR">Fuerza (STR)</option>
                                <option value="DEX">Destreza (DEX)</option>
                                <option value="CON">Constitución (CON)</option>
                                <option value="INT">Inteligencia (INT)</option>
                                <option value="WIS">Sabiduría (WIS)</option>
                                <option value="CHA">Carisma (CHA)</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-zinc-300">Modificador</label>
                            <input
                                type="number"
                                value={abilityModifier}
                                onChange={(e) => setAbilityModifier(e.target.value)}
                                className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs outline-none focus:border-purple-500"
                                placeholder="+1, +2, -1..."
                            />
                            <p className="text-[10px] text-zinc-500">
                                Se mostrará, por ejemplo, como STR +2 y afectará a las
                                estadísticas en la vista.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => {
                                resetForm();
                                setIsFormOpen(false);
                            }}
                            className="text-[11px] px-3 py-1 rounded-md border border-zinc-600 hover:bg-zinc-900"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveItem}
                            className="text-[11px] px-3 py-1 rounded-md border border-emerald-500/70 hover:bg-emerald-900/40"
                        >
                            Guardar elemento
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
//   MiniSpellSearch: buscador + añadir / eliminar
// ─────────────────────────────────────────────

type MiniSpellSearchProps = {
    charClass: string;
    charLevel: number;
    isSpellLearned: (spell: SpellSummary) => boolean;
    onAddSpell: (spell: SpellSummary) => void;
    onRemoveSpell: (spell: SpellSummary) => void;
};

function MiniSpellSearch({
                             charClass,
                             charLevel,
                             isSpellLearned,
                             onAddSpell,
                             onRemoveSpell,
                         }: MiniSpellSearchProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [spells, setSpells] = useState<SpellSummary[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortMode, setSortMode] = useState<"level" | "alpha">("level");

    async function loadSpells() {
        try {
            setIsLoading(true);
            setError(null);
            setSpells([]);

            if (!charClass || !charLevel || charLevel < 1) {
                throw new Error(
                    "Selecciona clase y nivel para cargar habilidades de conjuro."
                );
            }

            let clsForApi = charClass;
            if (charClass === "custom") {
                clsForApi = "wizard";
            }

            const response = await fetch(
                `/api/dnd/spells?class=${encodeURIComponent(
                    clsForApi
                )}&level=${charLevel}`
            );

            if (!response.ok) {
                throw new Error("No se ha podido cargar la lista de habilidades.");
            }

            const data: SpellSummary[] = await response.json();
            setSpells(data);
        } catch (err: any) {
            setError(err?.message ?? "Error cargando habilidades.");
        } finally {
            setIsLoading(false);
        }
    }

    const filteredAndSorted = spells
        .filter((spell) => {
            const term = searchTerm.trim().toLowerCase();
            if (!term) return true;

            const inName = spell.name.toLowerCase().includes(term);
            const inDesc =
                spell.shortDesc?.toLowerCase().includes(term) ||
                spell.fullDesc?.toLowerCase().includes(term);

            return inName || inDesc;
        })
        .sort((a, b) => {
            if (sortMode === "alpha") {
                return a.name.localeCompare(b.name);
            }
            if (a.level !== b.level) {
                return a.level - b.level;
            }
            return a.name.localeCompare(b.name);
        });

    return (
        <div className="border border-zinc-800 rounded-lg p-3 space-y-3 mt-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-[220px]">
                    <input
                        type="text"
                        placeholder="Buscar habilidades por nombre o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-purple-500"
                    />
                </div>

                <div className="flex flex-wrap items-end gap-2">
                    <div className="space-y-1">
                        <label className="text-[11px] text-zinc-400">Ordenar por</label>
                        <select
                            value={sortMode}
                            onChange={(e) =>
                                setSortMode(e.target.value as "level" | "alpha")
                            }
                            className="rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs outline-none focus:border-purple-500"
                        >
                            <option value="level">Nivel → Nombre</option>
                            <option value="alpha">Nombre (A-Z)</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={loadSpells}
                        className="text-[11px] px-3 py-2 rounded-md border border-zinc-600 hover:bg-zinc-900"
                    >
                        {isLoading ? "Cargando..." : "Cargar habilidades"}
                    </button>
                </div>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            {!isLoading && spells.length === 0 && !error && (
                <p className="text-xs text-zinc-500">
                    Usa “Cargar habilidades” para ver la lista de conjuros disponibles
                    para esta clase y nivel. Desde aquí puedes añadirlos o quitarlos del
                    personaje.
                </p>
            )}

            <div className="max-h-64 overflow-y-auto space-y-2 text-sm styled-scrollbar">
                {filteredAndSorted.map((spell) => {
                    const typeLabel =
                        spell.level === 0
                            ? "Truco (cantrip)"
                            : `Hechizo de nivel ${spell.level}`;
                    const learned = isSpellLearned(spell);

                    return (
                        <div
                            key={spell.index}
                            className="border border-zinc-700 rounded-md p-2 space-y-1 bg-zinc-950/50"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="min-w-[160px]">
                                    <p className="font-medium text-zinc-100 break-words">
                                        {spell.name}
                                    </p>
                                    <p className="text-[11px] text-zinc-500">{typeLabel}</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        learned ? onRemoveSpell(spell) : onAddSpell(spell)
                                    }
                                    className={`text-[11px] px-3 py-1 rounded-md border hover:bg-opacity-40 ${
                                        learned
                                            ? "border-red-500/70 hover:bg-red-900/40"
                                            : "border-emerald-500/70 hover:bg-emerald-900/40"
                                    }`}
                                >
                                    {learned ? "Eliminar" : "Añadir"}
                                </button>
                            </div>

                            {spell.shortDesc && (
                                <p className="text-xs text-zinc-400">{spell.shortDesc}</p>
                            )}

                            <details className="mt-1 text-xs text-zinc-300 whitespace-pre-wrap">
                                <summary className="cursor-pointer text-[11px] text-zinc-400">
                                    Ver descripción completa
                                </summary>
                                <div className="mt-1">
                                    {spell.fullDesc ??
                                        spell.shortDesc ??
                                        "Sin descripción ampliada disponible en la SRD."}
                                </div>
                            </details>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default CharacterForm;
