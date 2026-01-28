// src/app/campaigns/[id]/player/ui/CharacterForm.tsx
"use client";

import React, { FormEvent } from "react";
import { useParams } from "next/navigation";
import { abilityMod, computeMaxHp } from "@/lib/dndMath";
import { Mode, Stats, DND_CLASS_OPTIONS } from "../playerShared";
import { InfoBox } from "./InfoBox";
import { StatInput } from "./StatInput";
import { TextField, NumberField, MarkdownField } from "./FormFields";

import { SpellSection } from "../sections/SpellSection";
import ItemManagerSection from "../sections/ItemManagerSection";
import CustomContentManager from "../sections/CustomContentManager";
import type { CharacterFormFields } from "../hooks/useCharacterForm";
import { getClientLocale } from "@/lib/i18n/getClientLocale";

import {
    upsertStats,
    createOrUpdateCharacterRow,
    updateCharacterDetails,
} from "../services/characters.api";
import { inspectError } from "../utils/inspectError";
import { supabase } from "@/lib/supabaseClient";

type CharacterFormProps = {
    mode: Mode;
    onSubmit?: (e: FormEvent) => void;
    onCancel: () => void;
    fields: CharacterFormFields;
};

export function CharacterForm({ mode, onSubmit, onCancel, fields }: CharacterFormProps) {
    const params = useParams();
    const routeCampaignId = (params as any)?.id ?? null;
    const locale = getClientLocale();

    const {
        // Datos bÃ¡sicos
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

        // Arma equipada (datos bÃ¡sicos; los modificadores se gestionan en la secciÃ³n)
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

    // Bloqueo de envÃ­o para evitar dobles llamadas
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
    const previewMaxHp = computeMaxHp(charLevel, con, hitDieSides);
    const isCustomClass = charClass === "custom";

    const customSectionsSafe = Array.isArray(customSections) ? customSections : [];

    function updateCustomSection(index: number, patch: Partial<{ title: string; content: string }>) {
        if (!setCustomSections) return;
        const next = [...customSectionsSafe];
        const current = next[index];
        if (!current) return;
        next[index] = { ...current, ...patch };
        setCustomSections(next);
    }

    function addCustomSection() {
        if (!setCustomSections) return;
        const next = [
            ...customSectionsSafe,
            {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                title: "Nueva secciÃ³n",
                content: "",
            },
        ];
        setCustomSections(next);
    }

    function removeCustomSection(id: string) {
        if (!setCustomSections) return;
        setCustomSections(customSectionsSafe.filter((section) => section.id !== id));
    }

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
            console.debug("handleSubmit: already saving â€” ignoring duplicate submit");
            return;
        }
        setSaving(true);

        try {
            // session / user
            const { data: sessData, error: sessErr } = await supabase.auth.getSession();
            if (sessErr) {
                console.error("Error obteniendo sesiÃ³n:", inspectError(sessErr));
                alert("Error obteniendo sesiÃ³n: " + inspectError(sessErr));
                setSaving(false);
                return;
            }
            const session = (sessData as any)?.session ?? null;
            const userId = session?.user?.id ?? null;
            if (!userId) {
                alert("No estÃ¡s autenticado. Ve al login antes de guardar un personaje.");
                setSaving(false);
                return;
            }

            if (!campaignId) {
                const msg = "No se resolviÃ³ campaign_id. Pasa campaignId en fields o usa la ruta /campaigns/[id]/player.";
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
                details: {} // actualizaremos despuÃ©s
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
                    console.error("createOrUpdateCharacterRow no devolviÃ³ id y no tenemos fallback. Respuesta:", charRes);
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
                    console.debug("No se pudo notificar setCharacterId al padre (no existe o fallÃ³).", err);
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

                // 3) update details JSON (items + contenido personalizado)
                const companionPayload =
                    companionEnabled || (companionName && companionName.trim())
                        ? {
                            name: companionName?.trim() || "Compañero",
                            kind: companionKind?.trim() || undefined,
                            size: companionSize?.trim() || undefined,
                            armorClass: typeof companionArmorClass === "number" ? companionArmorClass : undefined,
                            speed: typeof companionSpeed === "number" ? companionSpeed : undefined,
                            currentHp: typeof companionCurrentHp === "number" ? companionCurrentHp : undefined,
                            maxHp: typeof companionMaxHp === "number" ? companionMaxHp : undefined,
                            stats: {
                                str: companionStr ?? 10,
                                dex: companionDex ?? 10,
                                con: companionCon ?? 10,
                                int: companionInt ?? 10,
                                wis: companionWis ?? 10,
                                cha: companionCha ?? 10,
                            },
                            abilities: companionAbilities?.trim() || undefined,
                            spells: companionSpells?.trim() || undefined,
                            notes: companionNotes?.trim() || undefined,
                        }
                        : null;

                const detailsPatch: any = {
                    abilities: abilities ?? null,
                    notes: notes ?? null,
                    background: background ?? null,
                    alignment: alignment ?? null,
                    personalityTraits: personalityTraits ?? null,
                    ideals: ideals ?? null,
                    bonds: bonds ?? null,
                    flaws: flaws ?? null,
                    appearance: appearance ?? null,
                    backstory: backstory ?? null,
                    languages: languages ?? null,
                    proficiencies: proficiencies ?? null,
                    customSections: customSectionsSafe ?? null,
                    companion: companionPayload,
                    items: Array.isArray(items) ? items : [],
                    customSpells: Array.isArray(customSpells) ? customSpells : [],
                    customCantrips: Array.isArray(customCantrips) ? customCantrips : [],
                    customTraits: Array.isArray(customTraits) ? customTraits : [],
                    customClassAbilities: Array.isArray(customClassAbilities)
                        ? customClassAbilities
                        : [],
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
        <div className="border border-ring bg-panel/80 rounded-xl p-[var(--panel-pad)] space-y-[var(--panel-gap)]">
            {/* Header */}
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-ink">
                        {mode === "create" ? "Nuevo personaje" : "Editar personaje"}
                    </h2>
                    <p className="text-xs text-ink-muted">
                        Gestiona stats base, inventario, objetos equipados y conjuros.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-xs px-3 py-1 rounded-md border border-ring hover:bg-white/80"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="character-form"
                        disabled={saving}
                        className="text-xs px-3 py-1 rounded-md border border-accent/60 bg-accent/10 hover:bg-accent/20 disabled:opacity-50"
                    >
                        {mode === "edit" ? (saving ? "Guardando..." : "Guardar cambios") : (saving ? "Creando..." : "Crear personaje")}
                    </button>
                </div>
            </header>

            <form id="character-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Datos bÃ¡sicos / clase / vida */}
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-ink">Datos bÃ¡sicos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <TextField label="Nombre" value={charName} onChange={setCharName} required />

                        {/* Clase */}
                        <div className="flex flex-col gap-1 text-sm">
                            <label className="text-sm text-ink">Clase</label>
                            <select
                                value={charClass}
                                onChange={(e) => setCharClass(e.target.value)}
                                className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm outline-none focus:border-accent"
                            >
                                <option value="">Sin clase</option>
                                {DND_CLASS_OPTIONS.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                        {c.label}
                                    </option>
                                ))}
                                <option value="custom">Clase personalizadaâ€¦</option>
                            </select>
                            <p className="text-[11px] text-ink-muted">
                                Se usa para calcular espacios de conjuro y cargar habilidades.
                            </p>
                        </div>

                        <TextField label="Raza / Origen" value={race} onChange={setRace} />
                    </div>

                    {/* Clase personalizada */}
                    {isCustomClass && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-ring rounded-lg p-3 bg-panel/80">
                            <TextField label="Nombre de la clase personalizada" value={customClassName} onChange={setCustomClassName} />
                            <div className="space-y-1">
                                <label className="text-sm text-ink">CaracterÃ­stica de conjuro</label>
                                <select
                                    value={customCastingAbility}
                                    onChange={(e) => setCustomCastingAbility(e.target.value as keyof Stats)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm outline-none focus:border-accent"
                                >
                                    <option value="int">Inteligencia (INT)</option>
                                    <option value="wis">SabidurÃ­a (SAB)</option>
                                    <option value="cha">Carisma (CAR)</option>
                                    <option value="str">Fuerza (FUE)</option>
                                    <option value="dex">Destreza (DES)</option>
                                    <option value="con">ConstituciÃ³n (CON)</option>
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
                            <label className="text-sm text-ink">Dado de golpe por nivel</label>
                            <select
                                value={hitDieSides}
                                onChange={(e) => setHitDieSides(Number(e.target.value) || 8)}
                                className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm outline-none focus:border-accent"
                            >
                                <option value={6}>d6</option>
                                <option value={8}>d8</option>
                                <option value={10}>d10</option>
                                <option value={12}>d12</option>
                            </select>
                        </div>

                        <NumberField label="Vida actual" value={currentHp} onChange={setCurrentHp} min={0} />

                        <InfoBox
                            label="Vida mÃ¡xima (calculada)"
                            value={previewMaxHp}
                            sub={`(${hitDieSides} Ã— nivel) + ${conMod >= 0 ? `+${conMod}` : conMod}`}
                        />
                    </div>
                </section>

                {/* Stats base */}
                <section className="space-y-2">
                    <h3 className="text-sm font-semibold text-ink">Atributos (stats)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        <StatInput label="FUE (STR)" value={str} onChange={setStr} />
                        <StatInput label="DES (DEX)" value={dex} onChange={setDex} />
                        <StatInput label="CON" value={con} onChange={setCon} />
                        <StatInput label="INT" value={intStat} onChange={setIntStat} />
                        <StatInput label="SAB (WIS)" value={wis} onChange={setWis} />
                        <StatInput label="CAR (CHA)" value={cha} onChange={setCha} />
                    </div>
                </section>

                {/* Inventario y equipamiento */}
                <ItemManagerSection items={items} setItems={setItems} />

                <CustomContentManager
                    locale={locale}
                    customSpells={customSpells}
                    setCustomSpells={setCustomSpells}
                    customCantrips={customCantrips}
                    setCustomCantrips={setCustomCantrips}
                    customTraits={customTraits}
                    setCustomTraits={setCustomTraits}
                    customClassAbilities={customClassAbilities}
                    setCustomClassAbilities={setCustomClassAbilities}
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

                {/* Perfil rápido y notas */}
                <section className="space-y-3">
                    <details className="rounded-2xl border border-ring bg-panel/80 p-3">
                        <summary className="cursor-pointer text-sm font-semibold text-ink">
                            Perfil rápido
                        </summary>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextField
                                label="Trasfondo"
                                value={background}
                                onChange={setBackground}
                            />
                            <TextField
                                label="Alineamiento"
                                value={alignment}
                                onChange={setAlignment}
                            />
                            <MarkdownField
                                label="Rasgos de personalidad"
                                value={personalityTraits}
                                onChange={setPersonalityTraits}
                            />
                            <MarkdownField
                                label="Ideales"
                                value={ideals}
                                onChange={setIdeals}
                            />
                            <MarkdownField
                                label="Vínculos"
                                value={bonds}
                                onChange={setBonds}
                            />
                            <MarkdownField
                                label="Defectos"
                                value={flaws}
                                onChange={setFlaws}
                            />
                        </div>
                    </details>

                    <details className="rounded-2xl border border-ring bg-panel/80 p-3">
                        <summary className="cursor-pointer text-sm font-semibold text-ink">
                            Notas y rasgos libres
                        </summary>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <MarkdownField
                                label="Rasgos adicionales"
                                value={abilities}
                                onChange={setAbilities}
                                helper="Markdown soportado."
                            />
                            <MarkdownField
                                label="Notas generales"
                                value={notes}
                                onChange={setNotes}
                                helper="Anotaciones libres del personaje."
                            />
                        </div>
                    </details>
                </section>

                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-ink">Perfil y trasfondo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MarkdownField
                            label="Apariencia"
                            value={appearance}
                            onChange={setAppearance}
                            helper="DescripciÃ³n fÃ­sica, rasgos visibles, marcas, etc."
                        />
                        <MarkdownField
                            label="Historia / Backstory"
                            value={backstory}
                            onChange={setBackstory}
                            helper="Contexto del personaje, motivaciones, eventos clave."
                            rows={6}
                        />
                        <MarkdownField
                            label="Idiomas"
                            value={languages}
                            onChange={setLanguages}
                            helper="Lista de idiomas conocidos."
                        />
                        <MarkdownField
                            label="Competencias"
                            value={proficiencies}
                            onChange={setProficiencies}
                            helper="Armas, herramientas, armaduras, etc."
                        />
                    </div>
                </section>

                <section className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-ink">Compañero / Mascota</h3>
                        <label className="flex items-center gap-2 text-xs text-ink-muted">
                            <input
                                type="checkbox"
                                checked={!!companionEnabled}
                                onChange={(e) => setCompanionEnabled?.(e.target.checked)}
                            />
                            Activar compañero
                        </label>
                    </div>

                    {companionEnabled && (
                        <div className="space-y-4 rounded-lg border border-ring bg-panel/80 p-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <TextField
                                    label="Nombre"
                                    value={companionName ?? ""}
                                    onChange={(value) => setCompanionName?.(value)}
                                />
                                <TextField
                                    label="Tipo / Especie"
                                    value={companionKind ?? ""}
                                    onChange={(value) => setCompanionKind?.(value)}
                                />
                                <TextField
                                    label="Tamaño"
                                    value={companionSize ?? ""}
                                    onChange={(value) => setCompanionSize?.(value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <NumberField
                                    label="CA"
                                    value={companionArmorClass ?? 10}
                                    onChange={(value) => setCompanionArmorClass?.(value)}
                                    min={0}
                                />
                                <NumberField
                                    label="Velocidad (ft)"
                                    value={companionSpeed ?? 30}
                                    onChange={(value) => setCompanionSpeed?.(value)}
                                    min={0}
                                />
                                <NumberField
                                    label="Vida actual"
                                    value={companionCurrentHp ?? 0}
                                    onChange={(value) => setCompanionCurrentHp?.(value)}
                                    min={0}
                                />
                                <NumberField
                                    label="Vida máxima"
                                    value={companionMaxHp ?? 0}
                                    onChange={(value) => setCompanionMaxHp?.(value)}
                                    min={0}
                                />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                <StatInput label="FUE" value={companionStr ?? 10} onChange={(v) => setCompanionStr?.(v)} />
                                <StatInput label="DES" value={companionDex ?? 10} onChange={(v) => setCompanionDex?.(v)} />
                                <StatInput label="CON" value={companionCon ?? 10} onChange={(v) => setCompanionCon?.(v)} />
                                <StatInput label="INT" value={companionInt ?? 10} onChange={(v) => setCompanionInt?.(v)} />
                                <StatInput label="SAB" value={companionWis ?? 10} onChange={(v) => setCompanionWis?.(v)} />
                                <StatInput label="CAR" value={companionCha ?? 10} onChange={(v) => setCompanionCha?.(v)} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <MarkdownField
                                    label="Habilidades y rasgos"
                                    value={companionAbilities ?? ""}
                                    onChange={(value) => setCompanionAbilities?.(value)}
                                    helper="Describe habilidades, sentidos, resistencias, etc."
                                />
                                <MarkdownField
                                    label="Hechizos / magia"
                                    value={companionSpells ?? ""}
                                    onChange={(value) => setCompanionSpells?.(value)}
                                    helper="Hechizos, efectos pasivos o poderes especiales."
                                />
                            </div>

                            <MarkdownField
                                label="Notas del compañero"
                                value={companionNotes ?? ""}
                                onChange={(value) => setCompanionNotes?.(value)}
                                helper="Personalidad, comportamiento, equipo, etc."
                            />
                        </div>
                    )}
                </section>

                <section className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-ink">Secciones personalizadas</h3>
                        <button
                            type="button"
                            onClick={addCustomSection}
                            className="text-[11px] px-3 py-1 rounded-md border border-emerald-400/70 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        >
                            AÃ±adir secciÃ³n
                        </button>
                    </div>

                    {customSectionsSafe.length === 0 ? (
                        <p className="text-xs text-ink-muted">AÃºn no has creado secciones personalizadas.</p>
                    ) : (
                        <div className="space-y-4">
                            {customSectionsSafe.map((section, index) => (
                                <div key={section.id} className="rounded-lg border border-ring bg-panel/80 p-3 space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <TextField
                                            label="TÃ­tulo"
                                            value={section.title}
                                            onChange={(value) => updateCustomSection(index, { title: value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeCustomSection(section.id)}
                                            className="text-[11px] px-3 py-1 rounded-md border border-red-400/70 text-red-600 bg-red-50 hover:bg-red-100"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                    <MarkdownField
                                        label="Contenido"
                                        value={section.content}
                                        onChange={(value) => updateCustomSection(index, { content: value })}
                                        helper="Markdown soportado."
                                        rows={5}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <div className="flex justify-end pt-1">
                    <button type="submit" className="rounded-md bg-accent hover:bg-accent-strong px-4 py-2 text-sm font-medium" disabled={saving}>
                        {saving ? (mode === "edit" ? "Guardando..." : "Creando...") : (mode === "edit" ? "Guardar personaje" : "Crear personaje")}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CharacterForm;


