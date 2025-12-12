// src/app/campaigns/[id]/player/ui/CharacterForm.tsx
"use client";

import React, { FormEvent } from "react";
import { useParams } from "next/navigation";
import { abilityMod, computeMaxHp, sumArmorBonus } from "@/lib/dndMath";
import { Armor, Mode, Stats, DND_CLASS_OPTIONS } from "../playerShared";
import { InfoBox } from "./InfoBox";
import { StatInput } from "./StatInput";
import { TextField, NumberField, TextareaField } from "./FormFields";

import { ArmorAndWeaponSection } from "../sections/ArmorAndWeaponSection";
import { InventorySections } from "../sections/InventorySections";
import { SpellSection } from "../sections/SpellSection";

import {
    upsertStats,
    createOrUpdateWeapon,
    createOrUpdateArmor,
    createOrUpdateCharacterRow,
    updateCharacterDetails,
} from "../services/characters.api";
import { inspectError } from "../utils/inspectError";
import { supabase } from "@/lib/supabaseClient";

type CharacterFormProps = {
    mode: Mode;
    onSubmit?: (e: FormEvent) => void;
    onCancel: () => void;
    fields: any;
};

export function CharacterForm({ mode, onSubmit, onCancel, fields }: CharacterFormProps) {
    const params = useParams();
    const routeCampaignId = (params as any)?.id ?? null;

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

        // Identificadores que venga desde el padre (si editamos)
        characterId: candidateCharacterId,
        id: candidateId,
        charId: candidateCharId,

        // Opcional: campaign id si lo pasas desde el padre
        campaignId: candidateCampaignId,
        campaign_id: candidateCampaign_id,
        campaign: candidateCampaignObj,
    } = fields;

    const incomingCharacterId = candidateCharacterId || candidateId || candidateCharId || null;

    // Retenemos localmente el id para siguientes guardados
    const [localCharacterId, setLocalCharacterId] = React.useState<string | null | undefined>(incomingCharacterId ?? undefined);

    // Bloqueo de envío para evitar dobles llamadas
    const [saving, setSaving] = React.useState(false);

    // Resolver campaign id (prioridad: fields -> nested -> route)
    const campaignIdFromFields =
        candidateCampaignId ||
        candidateCampaign_id ||
        (candidateCampaignObj && (candidateCampaignObj.id || candidateCampaignObj.campaign_id)) ||
        null;
    const campaignId = campaignIdFromFields || routeCampaignId || null;

    // Debug
    console.debug("CharacterForm init:", { incomingCharacterId, localCharacterId, campaignId });

    const conMod = abilityMod(con);
    const baseAC = armorClass ?? 10;
    const armorBonus = sumArmorBonus(armors as Armor[]);
    const previewTotalAC = baseAC + armorBonus;
    const previewMaxHp = computeMaxHp(charLevel, con, hitDieSides);
    const isCustomClass = charClass === "custom";

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        // NEW: if parent provided onSubmit, delegate and don't run internal persistence to avoid double-create
        if (typeof onSubmit === "function") {
            try {
                // Call parent handler in a typesafe way
                (onSubmit as ((ev: FormEvent) => void) | undefined)?.(e);
            } catch (err) {
                console.error("Error delegating onSubmit to parent:", err);
            }
            return;
        }

        if (saving) {
            console.debug("handleSubmit: already saving — ignoring duplicate submit");
            return;
        }
        setSaving(true);

        try {
            // session / user
            const { data: sessData, error: sessErr } = await supabase.auth.getSession();
            if (sessErr) {
                console.error("Error obteniendo sesión:", inspectError(sessErr));
                alert("Error obteniendo sesión: " + inspectError(sessErr));
                setSaving(false);
                return;
            }
            const session = (sessData as any)?.session ?? null;
            const userId = session?.user?.id ?? null;
            if (!userId) {
                alert("No estás autenticado. Ve al login antes de guardar un personaje.");
                setSaving(false);
                return;
            }

            if (!campaignId) {
                const msg = "No se resolvió campaign_id. Pasa campaignId en fields o usa la ruta /campaigns/[id]/player.";
                console.error(msg);
                alert(msg);
                setSaving(false);
                return;
            }

            // 1) create or update characters row
            const basePayload: Record<string, any> = {
                campaign_id: campaignId,
                user_id: userId ?? null,
                name: charName ?? null,
                class: charClass ?? null,
                level: Number(charLevel ?? 1),
                race: race ?? null,
                experience: Number(experience ?? 0),
                armor_class: armorClass !== undefined && armorClass !== null ? Number(armorClass) : null,
                speed: speed !== undefined && speed !== null ? Number(speed) : null,
                max_hp: previewMaxHp !== undefined && previewMaxHp !== null ? Number(previewMaxHp) : null,
                current_hp: currentHp !== undefined && currentHp !== null ? Number(currentHp) : null,
                details: {} // actualizaremos después
            };

            try {
                const charRes = await createOrUpdateCharacterRow(localCharacterId ?? null, userId, campaignId, basePayload);
                console.debug("createOrUpdateCharacterRow response (raw):", charRes);

                if ((charRes as any).error) {
                    console.error("Error en createOrUpdateCharacterRow:", inspectError((charRes as any).error));
                    alert("Error al crear/actualizar personaje: " + inspectError((charRes as any).error));
                    setSaving(false);
                    return;
                }

                // Extract id from response or fallback to local/incoming
                let cid: string | null = null;
                if ((charRes as any).data) {
                    const d = (charRes as any).data;
                    cid = Array.isArray(d) ? (d[0]?.id ?? null) : (d?.id ?? null);
                }
                if (!cid && (localCharacterId || incomingCharacterId)) cid = localCharacterId ?? incomingCharacterId ?? null;

                if (!cid) {
                    console.error("createOrUpdateCharacterRow no devolvió id y no tenemos fallback. Respuesta:", charRes);
                    alert("Error: no se obtuvo id del personaje. Revisa consola (posible RLS).");
                    setSaving(false);
                    return;
                }

                // Persist local id so next saves are UPDATE
                setLocalCharacterId(cid);
                console.debug("Local character id set:", cid);

                // Notify parent if setter exists (typesafe call)
                try {
                    const maybeSetter = (fields as unknown as { setCharacterId?: (id: string) => void }).setCharacterId;
                    maybeSetter?.(cid);
                } catch (err) {
                    console.debug("No se pudo notificar setCharacterId al padre (no existe o falló).", err);
                }

                // 2) upsert stats
                const statsRes = await upsertStats(cid, {
                    str: Number(str ?? 8),
                    dex: Number(dex ?? 8),
                    con: Number(con ?? 8),
                    int: Number(intStat ?? 8),
                    wis: Number(wis ?? 8),
                    cha: Number(cha ?? 8),
                });
                if ((statsRes as any).error) {
                    console.error("Error en upsertStats:", inspectError((statsRes as any).error));
                    alert("Error al guardar stats: " + inspectError((statsRes as any).error));
                    setSaving(false);
                    return;
                }

                // 3) weapon
                if (weaponName && weaponName.trim().length > 0) {
                    const wRes = await createOrUpdateWeapon(cid, {
                        id: weaponId ?? undefined,
                        name: weaponName,
                        damage: weaponDamage ?? null,
                        stat_ability: weaponStatAbility ?? null,
                        modifier: Number(weaponStatModifier ?? 0),
                        is_proficient: !!weaponProficient,
                        description: weaponDescription ?? null,
                        equipped: !!weaponEquipped
                    });
                    if ((wRes as any).error) {
                        console.error("Error en createOrUpdateWeapon:", inspectError((wRes as any).error));
                        alert("Error al guardar arma: " + inspectError((wRes as any).error));
                        setSaving(false);
                        return;
                    }
                    try {
                        const inserted = Array.isArray((wRes as any).data) ? (wRes as any).data[0] : (wRes as any).data;
                        if (inserted && inserted.id) {
                            // call setter safely
                            (setWeaponId as unknown as ((id: string) => void) | undefined)?.(inserted.id);
                        }
                    } catch {}
                }

                // 4) armors (ACTUALIZADO: enviar description y modifiers si existen)
                if (Array.isArray(armors)) {
                    for (const a of armors) {
                        const aRes = await createOrUpdateArmor(cid, {
                            id: a.id ?? undefined,
                            name: a.name ?? (a.armorName ?? "Armadura"),
                            bonus: Number(a.bonus ?? 0),
                            stat_ability: a.statAbility ?? a.ability ?? null,
                            stat_modifier: Number(a.statModifier ?? a.stat_modifier ?? 0),
                            equipped: !!a.equipped,
                            // <-- NUEVO: enviar descripción si existe (varias claves posibles)
                            description:
                                (a as any).description ??
                                (a as any).desc ??
                                (a as any).text ??
                                (a as any).info ??
                                (a as any).notes ??
                                null,
                            // <-- NUEVO: enviar modifiers extra si existen (ajusta si tu API no los soporta)
                            modifiers: Array.isArray((a as any).modifiers)
                                ? (a as any).modifiers.map((m: any) => ({
                                    ability: m.ability ?? m.statAbility ?? m.stat_ability ?? null,
                                    modifier: Number(m.modifier ?? m.value ?? m.amount ?? 0),
                                    note: m.note ?? null
                                }))
                                : undefined
                        });
                        if ((aRes as any).error) {
                            console.error("Error guardando armadura:", inspectError((aRes as any).error), "armor:", a);
                            alert("Error al guardar armadura: " + inspectError((aRes as any).error));
                            setSaving(false);
                            return;
                        }
                    }
                }

                // 5) update details JSON
                const detailsPatch: any = {
                    inventory: inventory ?? null,
                    equipment: equipment ?? null,
                    abilities: abilities ?? null,
                    weaponsExtra: weaponsExtra ?? null,
                    notes: notes ?? null,
                    spells: {
                        level0: spellsL0 ?? null,
                        level1: spellsL1 ?? null,
                        level2: spellsL2 ?? null,
                        level3: spellsL3 ?? null,
                        level4: spellsL4 ?? null,
                        level5: spellsL5 ?? null,
                        level6: spellsL6 ?? null,
                        level7: spellsL7 ?? null,
                        level8: spellsL8 ?? null,
                        level9: spellsL9 ?? null,
                    },
                    customClassName: customClassName ?? null,
                    customCastingAbility: customCastingAbility ?? null,
                };

                const { data: detailsData, error: detailsErr } = await updateCharacterDetails(cid, detailsPatch);
                if (detailsErr) {
                    console.error("Error actualizando details:", inspectError(detailsErr));
                    alert("Error al actualizar detalles del personaje: " + inspectError(detailsErr));
                    setSaving(false);
                    return;
                }

                console.log("Personaje guardado correctamente", { characterId: cid });

                // final: if parent provided onSubmit we already delegated earlier; still call if present
                if (typeof onSubmit === "function") {
                    try {
                        (onSubmit as ((ev: FormEvent) => void) | undefined)?.(e);
                    } catch {}
                }
            } catch (err) {
                console.error("Error during persistence flow:", err);
                throw err;
            }
        } catch (err: any) {
            console.error("Unhandled error en handleSubmit:", inspectError(err), err);
            alert("Error inesperado al guardar personaje: " + inspectError(err));
        } finally {
            setSaving(false);
        }
    }

    /* ---------------------------
       render (mantengo tu UI)
    --------------------------- */

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
                        disabled={saving}
                        className="text-xs px-3 py-1 rounded-md border border-purple-600/70 bg-purple-700/30 hover:bg-purple-700/50 disabled:opacity-50"
                    >
                        {mode === "edit" ? (saving ? "Guardando..." : "Guardar cambios") : (saving ? "Creando..." : "Crear personaje")}
                    </button>
                </div>
            </header>

            <form id="character-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Datos básicos / clase / vida */}
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-purple-200">Datos básicos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <TextField label="Nombre" value={charName} onChange={setCharName} required />

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

                        <TextField label="Raza / Origen" value={race} onChange={setRace} />
                    </div>

                    {/* Clase personalizada */}
                    {isCustomClass && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-purple-800/60 rounded-lg p-3 bg-zinc-900/60">
                            <TextField label="Nombre de la clase personalizada" value={customClassName} onChange={setCustomClassName} />
                            <div className="space-y-1">
                                <label className="text-sm text-purple-200">Característica de conjuro</label>
                                <select
                                    value={customCastingAbility}
                                    onChange={(e) => setCustomCastingAbility(e.target.value as keyof Stats)}
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
                        <NumberField label="Nivel" value={charLevel} onChange={setCharLevel} min={1} max={20} />
                        <NumberField label="Experiencia (XP)" value={experience} onChange={setExperience} min={0} />
                        <NumberField label="CA base" value={armorClass} onChange={setArmorClass} min={0} />
                        <NumberField label="Velocidad (ft)" value={speed} onChange={setSpeed} min={0} />
                    </div>

                    {/* Vida / dado de golpe */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-sm text-purple-200">Dado de golpe por nivel</label>
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
                        </div>

                        <NumberField label="Vida actual" value={currentHp} onChange={setCurrentHp} min={0} />

                        <InfoBox
                            label="Vida máxima (calculada)"
                            value={previewMaxHp}
                            sub={`(${hitDieSides} × nivel) + ${conMod >= 0 ? `+${conMod}` : conMod}`}
                        />
                    </div>
                </section>

                {/* Stats base */}
                <section className="space-y-2">
                    <h3 className="text-sm font-semibold text-purple-200">Atributos (stats)</h3>
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
                    weaponId={weaponId}
                    setWeaponId={setWeaponId}
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
                    weaponProficient={weaponProficient}
                    setWeaponProficient={setWeaponProficient}
                    weaponEquipped={weaponEquipped}
                    setWeaponEquipped={setWeaponEquipped}
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

                {/* Inventario / equipamiento / notas */}
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
                    <button type="submit" className="rounded-md bg-purple-700 hover:bg-purple-600 px-4 py-2 text-sm font-medium" disabled={saving}>
                        {saving ? (mode === "edit" ? "Guardando..." : "Creando...") : (mode === "edit" ? "Guardar personaje" : "Crear personaje")}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CharacterForm;
