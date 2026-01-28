import React, { useState } from "react";
import { Armor, PassiveModifier } from "../playerShared";
import type { AbilityKey } from "@/lib/types/dnd";
import { InfoBox } from "../ui/InfoBox";
import { formatWeaponDamage } from "../utils/weaponDisplay";

const abilityKeyToLabelEs: Record<AbilityKey, string> = {
    STR: "FUE",
    DEX: "DES",
    CON: "CON",
    INT: "INT",
    WIS: "SAB",
    CHA: "CAR",
};

type ArmorAndWeaponSectionProps = {
    armors: Armor[];
    addArmor: (armor?: Armor) => void;
    removeArmor: (index: number) => void;
    updateArmor: (index: number, field: string, value: string | number) => void;

    baseAC: number;
    armorBonus: number;
    previewTotalAC: number;

    // weapon fields
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
};

export function ArmorAndWeaponSection({
                                          armors,
                                          addArmor,
                                          removeArmor,
                                          updateArmor,
                                          baseAC,
                                          armorBonus,
                                          previewTotalAC,
                                          weaponId,
                                          setWeaponId,
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
                                      }: ArmorAndWeaponSectionProps) {
    const [isArmorFormOpen, setIsArmorFormOpen] = useState(false);
    const [editingArmorIndex, setEditingArmorIndex] = useState<number | null>(null);
    const [armorFormName, setArmorFormName] = useState("");
    const [armorFormBonus, setArmorFormBonus] = useState<number>(0);
    const [armorFormAbilityText, setArmorFormAbilityText] = useState("");
    const [armorFormStatAbility, setArmorFormStatAbility] = useState<AbilityKey | "none">("none");
    const [armorFormStatModifier, setArmorFormStatModifier] = useState<string>("");

    const [isWeaponFormOpen, setIsWeaponFormOpen] = useState(false);

    const [newModAbility, setNewModAbility] = useState<AbilityKey>("STR");
    const [newModValue, setNewModValue] = useState<number>(1);
    const [newModNote, setNewModNote] = useState<string>("");

    function openNewArmorForm() {
        setEditingArmorIndex(null);
        setArmorFormName("");
        setArmorFormBonus(0);
        setArmorFormAbilityText("");
        setArmorFormStatAbility("none");
        setArmorFormStatModifier("");
        setIsArmorFormOpen(true);
    }

    function openEditArmorForm(index: number) {
        const armor = armors[index] as Armor & {
            statAbility?: AbilityKey;
            statModifier?: number;
            ability?: string;
        };
        if (!armor) return;

        setEditingArmorIndex(index);
        setArmorFormName(armor.name ?? "");
        setArmorFormBonus(armor.bonus ?? 0);
        setArmorFormAbilityText((armor as any).ability ?? "");
        setArmorFormStatAbility(armor.statAbility ?? "none");
        setArmorFormStatModifier(typeof armor.statModifier === "number" ? String(armor.statModifier) : "");
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
        const abilityText = armorFormAbilityText.trim();
        const statAbility = armorFormStatAbility === "none" ? undefined : armorFormStatAbility;
        const statModifier = armorFormStatModifier.trim() === "" ? undefined : Number(armorFormStatModifier);

        if (editingArmorIndex === null) {
            const newIndex = armors.length;
            addArmor();
            updateArmor(newIndex, "name", name);
            updateArmor(newIndex, "bonus", bonus);
            updateArmor(newIndex, "ability", abilityText);
            if (statAbility) updateArmor(newIndex, "statAbility", statAbility);
            if (typeof statModifier === "number" && !Number.isNaN(statModifier)) {
                updateArmor(newIndex, "statModifier", statModifier);
            }
        } else {
            updateArmor(editingArmorIndex, "name", name);
            updateArmor(editingArmorIndex, "bonus", bonus);
            updateArmor(editingArmorIndex, "ability", abilityText);
            updateArmor(editingArmorIndex, "statAbility", statAbility ?? "");
            if (typeof statModifier === "number" && !Number.isNaN(statModifier)) {
                updateArmor(editingArmorIndex, "statModifier", statModifier);
            } else {
                updateArmor(editingArmorIndex, "statModifier", "");
            }
        }

        cancelArmorForm();
    }

    function getArmorModifierBadge(a: any): string | null {
        if (!a?.statAbility) return null;
        if (typeof a.statModifier !== "number") return null;
        const label = abilityKeyToLabelEs[a.statAbility as AbilityKey] ?? a.statAbility;
        const mod = a.statModifier;
        return `${label} ${mod >= 0 ? `+${mod}` : mod}`;
    }

    const formattedDamage = formatWeaponDamage(weaponDamage, null);

    function addWeaponPassiveModifier() {
        if (!setWeaponPassiveModifiers) return;
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const newMod: PassiveModifier = {
            id,
            ability: newModAbility,
            value: Number(newModValue) || 0,
            note: newModNote?.trim() || undefined,
            source: "weapon",
        };
        setWeaponPassiveModifiers([...(weaponPassiveModifiers ?? []), newMod]);
        setNewModAbility("STR");
        setNewModValue(1);
        setNewModNote("");
    }

    function removeWeaponPassiveModifier(id: string) {
        if (!setWeaponPassiveModifiers) return;
        setWeaponPassiveModifiers((weaponPassiveModifiers ?? []).filter((m) => m.id !== id));
    }

    const renderWeaponModifiers = () => {
        const list = weaponPassiveModifiers ?? [];
        if (list.length === 0) return <p className="text-xs text-ink-muted">No hay modificadores pasivos del arma.</p>;
        return (
            <ul className="space-y-1">
                {list.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700">{abilityKeyToLabelEs[m.ability]}</span>
                            <span className="font-mono">{m.value >= 0 ? `+${m.value}` : m.value}</span>
                            {m.note ? <span className="text-ink-muted ml-2">Â· {m.note}</span> : null}
                        </div>
                        <div>
                            <button
                                type="button"
                                onClick={() => removeWeaponPassiveModifier(m.id)}
                                className="text-[11px] px-2 py-0.5 rounded border border-red-500 text-red-600 bg-red-50 hover:bg-red-100"
                            >
                                Eliminar
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    function resolveArmorDesc(armor: any) {
        return armor.description ?? armor.ability ?? (armor.meta && (armor.meta.description || armor.meta.desc)) ?? null;
    }

    return (
        <div className="border border-ring rounded-lg p-3 space-y-3 bg-panel/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">Armaduras</h3>
                <button
                    type="button"
                    onClick={openNewArmorForm}
                    className="text-[11px] px-3 py-1 rounded-md border border-accent/60 hover:bg-accent/10"
                >
                    Nueva armadura
                </button>
            </div>

            {armors.length === 0 ? (
                <p className="text-xs text-ink-muted">No tienes ninguna armadura aÃ±adida.</p>
            ) : (
                <ul className="space-y-2">
                    {armors.map(
                        (armor: Armor & { statAbility?: AbilityKey; statModifier?: number }, index: number) => (
                            <li
                                key={index}
                                className="flex flex-wrap items-start justify-between gap-2 rounded-md bg-white/80 px-2 py-2 border border-ring"
                            >
                                <div className="space-y-1 min-w-[160px]">
                                    <p className="text-sm text-ink font-semibold break-words">
                                        {armor.name || `Armadura ${index + 1}`}
                                    </p>
                                    <p className="text-xs text-ink-muted">
                                        Bonificador CA:{" "}
                                        <span className="font-medium text-emerald-700">
                                            {armor.bonus >= 0 ? `+${armor.bonus}` : armor.bonus}
                                        </span>
                                    </p>
                                    {/* description compatibility */}
                                    {resolveArmorDesc(armor) ? <p className="text-xs text-ink-muted whitespace-pre-wrap mt-1">{resolveArmorDesc(armor)}</p> : null}
                                    {getArmorModifierBadge(armor) && (
                                        <p className="text-[11px] inline-flex items-center gap-1 mt-1">
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                                {getArmorModifierBadge(armor)}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openEditArmorForm(index)}
                                        className="text-[11px] px-3 py-1 rounded-md border border-ring hover:bg-white/80"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeArmor(index)}
                                        className="text-[11px] px-3 py-1 rounded-md border border-red-400/70 text-red-600 bg-red-50 hover:bg-red-100"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </li>
                        )
                    )}
                </ul>
            )}

            <InfoBox
                label="CA total (preview)"
                value={previewTotalAC}
                sub={`Base ${baseAC} + armaduras (${armorBonus >= 0 ? `+${armorBonus}` : armorBonus})`}
            />

            {isArmorFormOpen && (
                <div className="mt-3 border border-ring rounded-md p-3 space-y-3 bg-panel/80">
                    <p className="text-xs text-ink-muted">
                        {editingArmorIndex === null ? "Nueva armadura" : "Editar armadura"}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs text-ink">Nombre *</label>
                            <input
                                type="text"
                                value={armorFormName}
                                onChange={(e) => setArmorFormName(e.target.value)}
                                className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-ink">Bonificador CA</label>
                            <input
                                type="number"
                                value={armorFormBonus}
                                onChange={(e) => setArmorFormBonus(Number(e.target.value) || 0)}
                                className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-ink">Habilidad / efecto</label>
                        <textarea
                            value={armorFormAbilityText}
                            onChange={(e) => setArmorFormAbilityText(e.target.value)}
                            className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent min-h-[60px]"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs text-ink">Modifica caracterÃ­stica</label>
                            <select
                                value={armorFormStatAbility}
                                onChange={(e) => setArmorFormStatAbility(e.target.value as AbilityKey | "none")}
                                className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                            >
                                <option value="none">Ninguna</option>
                                <option value="STR">Fuerza (FUE)</option>
                                <option value="DEX">Destreza (DES)</option>
                                <option value="CON">ConstituciÃ³n (CON)</option>
                                <option value="INT">Inteligencia (INT)</option>
                                <option value="WIS">SabidurÃ­a (SAB)</option>
                                <option value="CHA">Carisma (CAR)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-ink">Modificador</label>
                            <input
                                type="number"
                                value={armorFormStatModifier}
                                onChange={(e) => setArmorFormStatModifier(e.target.value)}
                                className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                placeholder="+1, +2, -1..."
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                        <button
                            type="button"
                            onClick={cancelArmorForm}
                            className="text-[11px] px-3 py-1 rounded-md border border-ring hover:bg-white/80"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={saveArmorForm}
                            className="text-[11px] px-3 py-1 rounded-md border border-emerald-400/70 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        >
                            Guardar armadura
                        </button>
                    </div>
                </div>
            )}

            {/* Arma equipada (resto inalterado) */}
            <div className="border border-ring rounded-lg p-3 space-y-2 bg-panel/80">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-ink">Arma equipada</h3>
                    <button
                        type="button"
                        onClick={() => setIsWeaponFormOpen((v) => !v)}
                        className="text-[11px] px-3 py-1 rounded-md border border-ring hover:bg-white/80"
                    >
                        {isWeaponFormOpen ? "Cerrar ediciÃ³n" : "Editar / Crear arma"}
                    </button>
                </div>

                {!isWeaponFormOpen && (
                    <>
                        {weaponName || weaponDamage || weaponDescription ? (
                            <div className="space-y-1">
                                <p className="text-sm text-ink font-medium">{weaponName || "Arma sin nombre"}</p>

                                {weaponDamage && <p className="text-xs text-ink-muted">DaÃ±o: <span className="font-mono">{weaponDamage}</span></p>}

                                {weaponDescription && <p className="text-xs text-ink-muted whitespace-pre-wrap">{weaponDescription}</p>}

                                <div className="mt-2">
                                    <div className="text-[11px] text-ink-muted mb-1">Modificadores pasivos del arma</div>
                                    {renderWeaponModifiers()}
                                </div>

                                {(weaponStatAbility !== "none") && (
                                    <p className="text-[11px] mt-1">
                                        CaracterÃ­stica usada (para tirar con el arma):{" "}
                                        <span className="px-2 py-0.5 rounded-full border border-emerald-400 text-emerald-700">
                                            {abilityKeyToLabelEs[weaponStatAbility as AbilityKey]}
                                        </span>
                                    </p>
                                )}

                                <div className="flex gap-2 mt-1">
                                    {weaponProficient ? <span className="text-[11px] px-2 py-0.5 rounded-full border border-emerald-400 text-emerald-700">Competente</span> : null}
                                    {weaponEquipped ? <span className="text-[11px] px-2 py-0.5 rounded-full border border-ring text-ink-muted">Equipado</span> : null}
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-ink-muted">Sin arma equipada.</p>
                        )}
                    </>
                )}

                {isWeaponFormOpen && (
                    <div className="mt-2 space-y-3">
                        <div className="space-y-1">
                            <label className="text-xs text-ink">Nombre</label>
                            <input
                                type="text"
                                value={weaponName}
                                onChange={(e) => setWeaponName(e.target.value)}
                                className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                placeholder="Espada larga, arco cortoâ€¦"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-ink">DaÃ±o (ej: 1d8 + 3)</label>
                            <input
                                type="text"
                                value={weaponDamage}
                                onChange={(e) => setWeaponDamage(e.target.value)}
                                className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                placeholder="1d8 + 3 cortante"
                            />
                            <div className="text-[11px] text-ink-muted mt-1">Introduce el daÃ±o tal cual quieres que aparezca (ej. "1d8 + 3").</div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-ink">DescripciÃ³n / propiedades</label>
                            <textarea
                                value={weaponDescription}
                                onChange={(e) => setWeaponDescription(e.target.value)}
                                className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent min-h-[60px]"
                                placeholder="Alcance, propiedades, etc."
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-xs text-ink">CaracterÃ­stica para tirar</label>
                                <select
                                    value={weaponStatAbility}
                                    onChange={(e) => setWeaponStatAbility(e.target.value as AbilityKey | "none")}
                                    className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                >
                                    <option value="none">Ninguna</option>
                                    <option value="STR">Fuerza (FUE)</option>
                                    <option value="DEX">Destreza (DES)</option>
                                    <option value="CON">ConstituciÃ³n (CON)</option>
                                    <option value="INT">Inteligencia (INT)</option>
                                    <option value="WIS">SabidurÃ­a (SAB)</option>
                                    <option value="CHA">Carisma (CAR)</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-ink">Modificador (solo para tirar, no altera el string de daÃ±o)</label>
                                <input
                                    type="number"
                                    value={weaponStatModifier !== null ? String(weaponStatModifier) : ""}
                                    onChange={(e) => {
                                        const raw = e.target.value;
                                        if (raw.trim() === "") {
                                            setWeaponStatModifier(null);
                                        } else {
                                            const n = Number(raw);
                                            setWeaponStatModifier(Number.isNaN(n) ? null : n);
                                        }
                                    }}
                                    className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                    placeholder="+1, +2, -1..."
                                />
                                <div className="text-[11px] text-ink-muted mt-1">Este valor es solo para tiradas, no para mostrar en la lÃ­nea de daÃ±o si tÃº ya lo incluyes manualmente.</div>
                            </div>
                        </div>

                        <div className="mt-3 border-t border-ring pt-3">
                            <div className="text-xs text-ink-muted mb-2">AÃ±adir modificador pasivo al arma (afecta stats)</div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                                <div>
                                    <label className="text-xs text-ink-muted">CaracterÃ­stica</label>
                                    <select value={newModAbility} onChange={(e) => setNewModAbility(e.target.value as AbilityKey)} className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none">
                                        <option value="STR">Fuerza (FUE)</option>
                                        <option value="DEX">Destreza (DES)</option>
                                        <option value="CON">ConstituciÃ³n (CON)</option>
                                        <option value="INT">Inteligencia (INT)</option>
                                        <option value="WIS">SabidurÃ­a (SAB)</option>
                                        <option value="CHA">Carisma (CAR)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs text-ink-muted">Valor</label>
                                    <input type="number" value={newModValue} onChange={(e) => setNewModValue(Number(e.target.value))} className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none" />
                                </div>

                                <div>
                                    <label className="text-xs text-ink-muted">Nota (opcional)</label>
                                    <input type="text" value={newModNote} onChange={(e) => setNewModNote(e.target.value)} className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none" placeholder="e.g. 'Filo rÃºnico'"/>
                                </div>
                            </div>

                            <div className="flex justify-end mt-2">
                                <button type="button" onClick={addWeaponPassiveModifier} className="text-[11px] px-3 py-1 rounded-md border border-emerald-400/70 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
                                    AÃ±adir modificador pasivo
                                </button>
                            </div>

                            <div className="mt-3">
                                <div className="text-xs text-ink-muted mb-1">Modificadores actuales</div>
                                {renderWeaponModifiers()}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                            <label className="flex items-center gap-2 text-xs">
                                <input
                                    type="checkbox"
                                    checked={!!weaponProficient}
                                    onChange={(e) => setWeaponProficient?.(e.target.checked)}
                                />
                                <span className="text-xs text-ink-muted">Competente (proficiency)</span>
                            </label>

                            <label className="flex items-center gap-2 text-xs">
                                <input
                                    type="checkbox"
                                    checked={!!weaponEquipped}
                                    onChange={(e) => setWeaponEquipped?.(e.target.checked)}
                                />
                                <span className="text-xs text-ink-muted">Equipado</span>
                            </label>
                        </div>

                        <div className="flex justify-end pt-1">
                            <button
                                type="button"
                                onClick={() => setIsWeaponFormOpen(false)}
                                className="text-[11px] px-3 py-1 rounded-md border border-emerald-400/70 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            >
                                Guardar arma
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ArmorAndWeaponSection;




