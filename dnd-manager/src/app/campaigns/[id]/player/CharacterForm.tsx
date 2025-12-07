"use client";

import React, { FormEvent } from "react";
import { useParams } from "next/navigation";
import { abilityMod, computeMaxHp, sumArmorBonus } from "@/lib/dndMath";
import { Armor, Mode, Stats, DND_CLASS_OPTIONS } from "./playerShared";
import { InfoBox } from "./ui/InfoBox";
import { StatInput } from "./ui/StatInput";
import { TextField, NumberField, TextareaField } from "./ui/FormFields";

import { ArmorAndWeaponSection } from "./sections/ArmorAndWeaponSection";
import { InventorySections } from "./sections/InventorySections";
import { SpellSection } from "./sections/SpellSection";

import { supabase } from "@/lib/supabaseClient";

type CharacterFormProps = {
    mode: Mode;
    onSubmit?: (e: FormEvent) => void;
    onCancel: () => void;
    fields: any;
};

export function CharacterForm({ mode, onSubmit, onCancel, fields }: CharacterFormProps) {
    // extraemos params de ruta (por si la página es /campaigns/[id]/player)
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

        // identificadores (puede llamarse de varias maneras)
        characterId: candidateCharacterId,
        id: candidateId,
        charId: candidateCharId,

        // Opcional: campaign id si lo pasas desde el padre
        campaignId: candidateCampaignId,
        campaign_id: candidateCampaign_id,
        campaign: candidateCampaignObj,
    } = fields;

    const characterId = candidateCharacterId || candidateId || candidateCharId || null;

    // Resolve campaign id (priority: explicit fields -> nested campaign obj -> route param)
    const campaignIdFromFields =
        candidateCampaignId ||
        candidateCampaign_id ||
        (candidateCampaignObj && (candidateCampaignObj.id || candidateCampaignObj.campaign_id)) ||
        null;
    const campaignId = campaignIdFromFields || routeCampaignId || null;

    // DEBUG: ayuda a comprobar valores que causan duplicados
    // Puedes eliminar estos logs en producción
    console.debug("CharacterForm fields:", fields);
    console.debug("resolved characterId:", characterId, "campaignId:", campaignId);

    const conMod = abilityMod(con);
    const baseAC = armorClass ?? 10;
    const armorBonus = sumArmorBonus(armors as Armor[]);
    const previewTotalAC = baseAC + armorBonus;
    const previewMaxHp = computeMaxHp(charLevel, con, hitDieSides);
    const isCustomClass = charClass === "custom";

    /* ---------------------------
       helpers DB
       --------------------------- */

    function inspectError(e: any) {
        try {
            if (!e) return "Error desconocido";
            if (typeof e === "string") return e;
            if (e.message) return e.message;
            const parts: any = {};
            for (const k of ["message", "details", "hint", "code"]) {
                if ((e as any)[k]) parts[k] = (e as any)[k];
            }
            const other = Object.getOwnPropertyNames(e || {}).reduce((acc: any, k: string) => {
                if (!["message","details","hint","code"].includes(k)) acc[k] = (e as any)[k];
                return acc;
            }, {});
            return JSON.stringify({ parts, other }, null, 2);
        } catch (err) {
            return String(e);
        }
    }

    async function upsertStats(character_id: string, stats: { str:number,dex:number,con:number,int:number,wis:number,cha:number }) {
        const payload = {
            character_id,
            str: Number(stats.str ?? 8),
            dex: Number(stats.dex ?? 8),
            con: Number(stats.con ?? 8),
            int: Number(stats.int ?? 8),
            wis: Number(stats.wis ?? 8),
            cha: Number(stats.cha ?? 8),
            updated_at: new Date().toISOString(),
        };
        return supabase.from("character_stats").upsert(payload, { onConflict: "character_id" });
    }

    async function createOrUpdateWeapon(character_id: string, weapon: {
        id?: string | null;
        name: string;
        damage?: string | null;
        stat_ability?: string | null;
        modifier?: number | null;
        is_proficient?: boolean | null;
        description?: string | null;
        equipped?: boolean | null;
    }) {
        if (weapon.equipped) {
            const { error: unequipErr } = await supabase.from("character_weapons").update({ equipped: false }).eq("character_id", character_id);
            if (unequipErr) return { data: null, error: unequipErr };
        }

        if (weapon.id) {
            const { data, error } = await supabase.from("character_weapons").update({
                name: weapon.name,
                damage: weapon.damage ?? null,
                stat_ability: weapon.stat_ability ?? null,
                modifier: Number(weapon.modifier ?? 0),
                is_proficient: !!weapon.is_proficient,
                description: weapon.description ?? null,
                equipped: !!weapon.equipped,
            }).eq("id", weapon.id).select("*");
            return { data, error };
        } else {
            const { data, error } = await supabase.from("character_weapons").insert([{
                character_id,
                name: weapon.name,
                damage: weapon.damage ?? null,
                stat_ability: weapon.stat_ability ?? null,
                modifier: Number(weapon.modifier ?? 0),
                is_proficient: !!weapon.is_proficient,
                description: weapon.description ?? null,
                equipped: !!weapon.equipped,
                meta: {}
            }]).select("*");
            return { data, error };
        }
    }

    async function createOrUpdateArmor(character_id: string, armor: {
        id?: string | null;
        name: string;
        bonus?: number | null;
        stat_ability?: string | null;
        stat_modifier?: number | null;
        equipped?: boolean | null;
    }) {
        if (armor.equipped) {
            const { error: unequipErr } = await supabase.from("character_armors").update({ equipped: false }).eq("character_id", character_id);
            if (unequipErr) return { data: null, error: unequipErr };
        }

        if (armor.id) {
            const { data, error } = await supabase.from("character_armors").update({
                name: armor.name,
                bonus: Number(armor.bonus ?? 0),
                stat_ability: armor.stat_ability ?? null,
                stat_modifier: Number(armor.stat_modifier ?? 0),
                equipped: !!armor.equipped
            }).eq("id", armor.id).select("*");
            return { data, error };
        } else {
            const { data, error } = await supabase.from("character_armors").insert([{
                character_id,
                name: armor.name,
                bonus: Number(armor.bonus ?? 0),
                stat_ability: armor.stat_ability ?? null,
                stat_modifier: Number(armor.stat_modifier ?? 0),
                equipped: !!armor.equipped,
                meta: {}
            }]).select("*");
            return { data, error };
        }
    }

    async function createOrUpdateCharacterRow(
        character_id: string | null,
        user_id: string | null,
        campaign_id_resolved: string | null
    ) {
        if (!campaign_id_resolved) {
            // abort early with clear message (esto evita la violación NOT NULL)
            return {
                data: null,
                error: {
                    message: "campaign_id faltante. Asegúrate de que el formulario reciba campaignId en fields o que la ruta sea /campaigns/[id]/player."
                }
            };
        }

        // Si nos pasan character_id, intentamos UPDATE directo
        if (character_id) {
            const res = await supabase
                .from("characters")
                .update({
                    name: charName,
                    class: charClass,
                    level: Number(charLevel ?? 1),
                    race,
                    experience: Number(experience ?? 0),
                    armor_class: Number(armorClass ?? 10),
                    speed: Number(speed ?? 30),
                    max_hp: Number(previewMaxHp ?? null),
                    current_hp: Number(currentHp ?? null),
                })
                .eq("id", character_id)
                .select("id");
            return res;
        }

        // Si NO tenemos character_id: intentar buscar un personaje existente para evitar duplicados.
        // Buscamos por user_id + campaign_id; opcionalmente también por name si quieres.
        try {
            if (user_id && campaign_id_resolved) {
                const { data: existing, error: findErr } = await supabase
                    .from("characters")
                    .select("id")
                    .eq("user_id", user_id)
                    .eq("campaign_id", campaign_id_resolved)
                    .eq("name", charName || "") // opcional; elimina si no quieres emparejar por nombre
                    .limit(1)
                    .maybeSingle();

                if (findErr) {
                    // no bloqueamos el flujo por esto, pero lo registramos
                    console.warn("Error buscando personaje existente:", inspectError(findErr));
                }

                if (existing && (existing as any).id) {
                    // si encontramos uno, actualizamos ese id (evita duplicados)
                    const existId = (existing as any).id;
                    const upd = await supabase
                        .from("characters")
                        .update({
                            name: charName,
                            class: charClass,
                            level: Number(charLevel ?? 1),
                            race,
                            experience: Number(experience ?? 0),
                            armor_class: Number(armorClass ?? 10),
                            speed: Number(speed ?? 30),
                            max_hp: Number(previewMaxHp ?? null),
                            current_hp: Number(currentHp ?? null),
                            user_id: user_id ?? null,
                            campaign_id: campaign_id_resolved,
                        })
                        .eq("id", existId)
                        .select("id");
                    return upd;
                }
            }
        } catch (err) {
            console.warn("Error no fatal buscando personaje existente:", inspectError(err));
        }

        // Si no hay character_id ni personaje existente, hacemos insert (como ahora)
        const payload: any = {
            name: charName || "Sin nombre",
            class: charClass || null,
            level: Number(charLevel ?? 1),
            race: race || null,
            experience: Number(experience ?? 0),
            armor_class: Number(armorClass ?? 10),
            speed: Number(speed ?? 30),
            max_hp: Number(previewMaxHp ?? null),
            current_hp: Number(currentHp ?? null),
            user_id: user_id ?? null,
            campaign_id: campaign_id_resolved,
        };

        return supabase.from("characters").insert([payload]).select("id").single();
    }

    /* ---------------------------
       submit handler
       --------------------------- */
    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        if (!supabase) {
            alert("Supabase client no disponible. Revisa '@/lib/supabaseClient'.");
            return;
        }

        try {
            // obtener sesión & user id
            const { data: sessData, error: sessErr } = await supabase.auth.getSession();
            if (sessErr) {
                console.error("Error obteniendo sesión:", inspectError(sessErr));
                alert("Error obteniendo sesión: " + inspectError(sessErr));
                return;
            }
            const session = (sessData as any)?.session ?? null;
            const userId = session?.user?.id ?? null;
            if (!userId) {
                alert("No estás autenticado. Ve al login antes de guardar un personaje.");
                return;
            }

            // resolved campaign id (ya calculado arriba)
            if (!campaignId) {
                const msg = "No se resolvió campaign_id. Pasa campaignId en fields o usa la ruta /campaigns/[id]/player. campaignId candidates: fields.campaignId, fields.campaign_id, fields.campaign?.id, route param.";
                console.error(msg);
                alert(msg);
                return;
            }

            // 1) create/update character row
            const charRes = await createOrUpdateCharacterRow(characterId, userId, campaignId);
            console.debug("createOrUpdateCharacterRow response:", charRes);
            if ((charRes as any).error) {
                console.error("Error en createOrUpdateCharacterRow:", inspectError((charRes as any).error), "raw:", charRes);
                alert("Error al crear/actualizar personaje: " + inspectError((charRes as any).error));
                return;
            }
            const cid = (charRes as any).data?.id || (Array.isArray((charRes as any).data) ? (charRes as any).data[0]?.id : null) || characterId;
            if (!cid) {
                console.error("createOrUpdateCharacterRow no devolvió id. response:", charRes);
                alert("Error: createOrUpdateCharacterRow no devolvió id. Revisa la consola.");
                return;
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
                console.error("Error en upsertStats:", inspectError((statsRes as any).error), "raw:", statsRes);
                alert("Error al guardar stats: " + inspectError((statsRes as any).error));
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
                    console.error("Error en createOrUpdateWeapon:", inspectError((wRes as any).error), "raw:", wRes);
                    alert("Error al guardar arma: " + inspectError((wRes as any).error));
                    return;
                }
                try {
                    const inserted = Array.isArray((wRes as any).data) ? (wRes as any).data[0] : (wRes as any).data;
                    if (inserted && inserted.id && typeof setWeaponId === "function") setWeaponId(inserted.id);
                } catch {}
            }

            // 4) armors
            if (Array.isArray(armors)) {
                for (const a of armors) {
                    const aRes = await createOrUpdateArmor(cid, {
                        id: a.id ?? undefined,
                        name: a.name ?? (a.armorName ?? "Armadura"),
                        bonus: Number(a.bonus ?? 0),
                        stat_ability: a.statAbility ?? a.ability ?? null,
                        stat_modifier: Number(a.statModifier ?? a.stat_modifier ?? 0),
                        equipped: !!a.equipped
                    });
                    if ((aRes as any).error) {
                        console.error("Error guardando armadura:", inspectError((aRes as any).error), "armor:", a, "raw:", aRes);
                        alert("Error al guardar armadura: " + inspectError((aRes as any).error));
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

            const { data: detailsData, error: detailsErr } = await supabase.from("characters").update({
                details: detailsPatch
            }).eq("id", cid).select("id");
            if (detailsErr) {
                console.error("Error actualizando details:", inspectError(detailsErr), "raw:", detailsErr);
                alert("Error al actualizar detalles del personaje: " + inspectError(detailsErr));
                return;
            }

            console.log("Personaje guardado correctamente", { characterId: cid });

            if (typeof onSubmit === "function") {
                try { onSubmit(e); } catch {}
            }
        } catch (err: any) {
            console.error("Unhandled error en handleSubmit:", inspectError(err), err);
            alert("Error inesperado al guardar personaje: " + inspectError(err));
        }
    }

    /* ---------------------------
       RENDER del formulario (igual al que tenías)
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
                        className="text-xs px-3 py-1 rounded-md border border-purple-600/70 bg-purple-700/30 hover:bg-purple-700/50"
                    >
                        {mode === "edit" ? "Guardar cambios" : "Crear personaje"}
                    </button>
                </div>
            </header>

            <form
                id="character-form"
                onSubmit={handleSubmit}
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
                            sub={`(${hitDieSides} × nivel) + ${conMod >= 0 ? `+${conMod}` : conMod}`}
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
