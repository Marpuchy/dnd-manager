"use client";

import React, { useMemo, useState } from "react";
import Markdown from "@/app/components/Markdown";
import type {
    AbilityKey,
    CustomFeatureEntry,
    CustomSpellEntry,
    LocalizedText,
} from "@/lib/types/dnd";
import {
    getLocalizedText,
    normalizeLocalizedText,
} from "@/lib/character/items";

type FormType = "spell" | "cantrip" | "trait" | "classAbility";

const SPELL_SCHOOLS = [
    "Abjuración",
    "Adivinación",
    "Conjuración",
    "Encantamiento",
    "Evocación",
    "Ilusión",
    "Nigromancia",
    "Transmutación",
];

const CASTING_TIME_OPTIONS = [
    "Acción",
    "Acción adicional",
    "Reacción",
    "1 minuto",
    "10 minutos",
    "1 hora",
    "Especial",
];

const ACTION_TYPES: { value: CustomFeatureEntry["actionType"]; label: string }[] = [
    { value: "action", label: "Acción" },
    { value: "bonus", label: "Acción bonus" },
    { value: "reaction", label: "Reacción" },
    { value: "passive", label: "Pasiva" },
];

const SAVE_ABILITIES: { value: AbilityKey; label: string }[] = [
    { value: "STR", label: "Fuerza (STR)" },
    { value: "DEX", label: "Destreza (DEX)" },
    { value: "CON", label: "Constitución (CON)" },
    { value: "INT", label: "Inteligencia (INT)" },
    { value: "WIS", label: "Sabiduría (WIS)" },
    { value: "CHA", label: "Carisma (CHA)" },
];

type CustomContentManagerProps = {
    locale: string;
    customSpells: CustomSpellEntry[];
    setCustomSpells: (v: CustomSpellEntry[]) => void;
    customCantrips: CustomSpellEntry[];
    setCustomCantrips: (v: CustomSpellEntry[]) => void;
    customTraits: CustomFeatureEntry[];
    setCustomTraits: (v: CustomFeatureEntry[]) => void;
    customClassAbilities: CustomFeatureEntry[];
    setCustomClassAbilities: (v: CustomFeatureEntry[]) => void;
    createOpen?: boolean;
    onToggleCreate?: (open: boolean) => void;
};

function buildLocalized(text: string, locale: string): LocalizedText | undefined {
    return normalizeLocalizedText(text, locale);
}

export default function CustomContentManager({
                                                 locale,
                                                 customSpells,
                                                 setCustomSpells,
                                                 customCantrips,
                                                 setCustomCantrips,
                                                 customTraits,
                                                 setCustomTraits,
                                                 customClassAbilities,
                                                 setCustomClassAbilities,
                                                 createOpen,
                                                 onToggleCreate,
                                             }: CustomContentManagerProps) {
    const [internalCreateOpen, setInternalCreateOpen] = useState(true);
    const isCreateControlled = typeof createOpen === "boolean";
    const isCreateOpen = isCreateControlled ? createOpen : internalCreateOpen;
    const showCreateToggle = isCreateControlled || typeof onToggleCreate === "function";

    function setCreateOpen(next: boolean) {
        if (isCreateControlled) {
            onToggleCreate?.(next);
            return;
        }
        setInternalCreateOpen(next);
        onToggleCreate?.(next);
    }
    const [formType, setFormType] = useState<FormType>("spell");
    const [editing, setEditing] = useState<{ id: string; type: FormType } | null>(
        null
    );

    const [name, setName] = useState("");
    const [level, setLevel] = useState(1);
    const [school, setSchool] = useState("");
    const [description, setDescription] = useState("");

    // Spell fields
    const [castingTime, setCastingTime] = useState(CASTING_TIME_OPTIONS[0]);
    const [castingTimeNote, setCastingTimeNote] = useState("");
    const [range, setRange] = useState("");
    const [components, setComponents] = useState({
        verbal: false,
        somatic: false,
        material: false,
    });
    const [materials, setMaterials] = useState("");
    const [duration, setDuration] = useState("");
    const [concentration, setConcentration] = useState(false);
    const [ritual, setRitual] = useState(false);
    const [costUsesSlot, setCostUsesSlot] = useState(false);
    const [costSlotLevel, setCostSlotLevel] = useState(1);
    const [costCharges, setCostCharges] = useState("");
    const [costPoints, setCostPoints] = useState("");
    const [saveType, setSaveType] = useState<"attack" | "save" | "none">("none");
    const [saveAbility, setSaveAbility] = useState<AbilityKey>("DEX");
    const [dcType, setDcType] = useState<"fixed" | "stat">("stat");
    const [dcValue, setDcValue] = useState("");
    const [dcStat, setDcStat] = useState<AbilityKey>("CHA");
    const [damageType, setDamageType] = useState("");
    const [damageDice, setDamageDice] = useState("");
    const [damageScaling, setDamageScaling] = useState("");

    // Ability fields
    const [abilityActionType, setAbilityActionType] = useState<CustomFeatureEntry["actionType"]>("action");
    const [abilityUsesSlot, setAbilityUsesSlot] = useState(false);
    const [abilitySlotLevel, setAbilitySlotLevel] = useState(1);
    const [abilityCharges, setAbilityCharges] = useState("");
    const [abilityRecharge, setAbilityRecharge] = useState<"short" | "long">("short");
    const [abilityPointsLabel, setAbilityPointsLabel] = useState("");
    const [abilityPoints, setAbilityPoints] = useState("");
    const [requirements, setRequirements] = useState("");
    const [effect, setEffect] = useState("");

    const title = useMemo(() => {
        switch (formType) {
            case "spell":
                return "Hechizo";
            case "cantrip":
                return "Truco";
            case "trait":
                return "Rasgo";
            case "classAbility":
                return "Habilidad";
            default:
                return "Contenido";
        }
    }, [formType]);

    const isSpellForm = formType === "spell" || formType === "cantrip";
    const isAbilityForm = formType === "classAbility";

    function resetForm() {
        setName("");
        setLevel(1);
        setSchool("");
        setDescription("");
        setCastingTime(CASTING_TIME_OPTIONS[0]);
        setCastingTimeNote("");
        setRange("");
        setComponents({ verbal: false, somatic: false, material: false });
        setMaterials("");
        setDuration("");
        setConcentration(false);
        setRitual(false);
        setCostUsesSlot(false);
        setCostSlotLevel(1);
        setCostCharges("");
        setCostPoints("");
        setSaveType("none");
        setSaveAbility("DEX");
        setDcType("stat");
        setDcValue("");
        setDcStat("CHA");
        setDamageType("");
        setDamageDice("");
        setDamageScaling("");
        setAbilityActionType("action");
        setAbilityUsesSlot(false);
        setAbilitySlotLevel(1);
        setAbilityCharges("");
        setAbilityRecharge("short");
        setAbilityPointsLabel("");
        setAbilityPoints("");
        setRequirements("");
        setEffect("");
        setEditing(null);
    }

    function startEdit(entry: CustomSpellEntry | CustomFeatureEntry, type: FormType) {
        resetForm();
        setFormType(type);
        setEditing({ id: entry.id, type });
        setCreateOpen(true);
        setName(entry.name ?? "");

        const desc =
            "description" in entry ? getLocalizedText(entry.description, locale) : "";
        setDescription(desc);

        if (type === "spell" || type === "cantrip") {
            const spell = entry as CustomSpellEntry;
            const levelValue =
                typeof spell.level === "number"
                    ? spell.level
                    : type === "cantrip"
                        ? 0
                        : 1;
            setLevel(levelValue);
            setSchool(spell.school ?? "");

            const casting = (spell as any).castingTime;
            if (casting && typeof casting === "object") {
                setCastingTime(casting.value ?? CASTING_TIME_OPTIONS[0]);
                setCastingTimeNote(casting.note ?? "");
            } else if (typeof casting === "string") {
                setCastingTime(casting);
                setCastingTimeNote("");
            } else {
                setCastingTime(CASTING_TIME_OPTIONS[0]);
                setCastingTimeNote("");
            }

            setRange(spell.range ?? "");
            const comps = (spell as any).components;
            if (Array.isArray(comps)) {
                setComponents({
                    verbal: comps.includes("V"),
                    somatic: comps.includes("S"),
                    material: comps.includes("M"),
                });
            } else {
                setComponents({
                    verbal: !!comps?.verbal,
                    somatic: !!comps?.somatic,
                    material: !!comps?.material,
                });
            }
            setMaterials((spell as any).materials ?? "");
            setDuration((spell as any).duration ?? "");
            setConcentration(!!(spell as any).concentration);
            setRitual(!!(spell as any).ritual);

            const cost = (spell as any).resourceCost;
            setCostUsesSlot(!!cost?.usesSpellSlot);
            setCostSlotLevel(cost?.slotLevel ?? (levelValue || 1));
            setCostCharges(cost?.charges != null ? String(cost.charges) : "");
            setCostPoints(cost?.points != null ? String(cost.points) : "");

            const save = (spell as any).save;
            setSaveType(save?.type ?? "none");
            setSaveAbility(save?.saveAbility ?? "DEX");
            setDcType(save?.dcType ?? "stat");
            setDcValue(save?.dcValue != null ? String(save.dcValue) : "");
            setDcStat(save?.dcStat ?? "CHA");

            const dmg = (spell as any).damage;
            setDamageType(dmg?.damageType ?? "");
            setDamageDice(dmg?.dice ?? "");
            setDamageScaling(dmg?.scaling ?? "");
            return;
        }

        if (type === "classAbility") {
            const ability = entry as CustomFeatureEntry;
            setLevel(typeof ability.level === "number" ? ability.level : 1);
            setAbilityActionType(ability.actionType ?? "action");
            const cost = ability.resourceCost;
            setAbilityUsesSlot(!!cost?.usesSpellSlot);
            setAbilitySlotLevel(cost?.slotLevel ?? 1);
            setAbilityCharges(cost?.charges != null ? String(cost.charges) : "");
            setAbilityRecharge(cost?.recharge ?? "short");
            setAbilityPointsLabel(cost?.pointsLabel ?? "");
            setAbilityPoints(cost?.points != null ? String(cost.points) : "");
            setRequirements(ability.requirements ?? "");
            setEffect(ability.effect ?? "");
        }
    }

    function handleSave() {
        const trimmed = name.trim();
        if (!trimmed) {
            resetForm();
            return;
        }

        const desc = buildLocalized(description, locale);

        if (formType === "spell" || formType === "cantrip") {
            const parsedLevel = Math.max(0, Math.min(9, Number(level) || 0));
            const resolvedLevel = formType === "cantrip" ? 0 : parsedLevel;

            const parsedCharges = costCharges.trim() ? Number(costCharges) : undefined;
            const parsedPoints = costPoints.trim() ? Number(costPoints) : undefined;
            const resourceCost =
                costUsesSlot || parsedCharges != null || parsedPoints != null
                    ? {
                        usesSpellSlot: costUsesSlot || undefined,
                        slotLevel: costUsesSlot
                            ? Number(costSlotLevel) || resolvedLevel || 1
                            : undefined,
                        charges: Number.isFinite(parsedCharges as number)
                            ? parsedCharges
                            : undefined,
                        points: Number.isFinite(parsedPoints as number) ? parsedPoints : undefined,
                    }
                    : undefined;

            const componentsPayload =
                components.verbal || components.somatic || components.material
                    ? { ...components }
                    : undefined;

            const castingTimePayload =
                castingTime || castingTimeNote
                    ? {
                        value: castingTime || CASTING_TIME_OPTIONS[0],
                        note: castingTimeNote.trim() || undefined,
                    }
                    : undefined;

            const savePayload =
                saveType === "none"
                    ? undefined
                    : {
                        type: saveType,
                        saveAbility: saveType === "save" ? saveAbility : undefined,
                        dcType: saveType === "save" ? dcType : undefined,
                        dcValue:
                            saveType === "save" && dcType === "fixed" && dcValue.trim()
                                ? Number(dcValue)
                                : undefined,
                        dcStat: saveType === "save" && dcType === "stat" ? dcStat : undefined,
                    };

            const damagePayload =
                damageType.trim() || damageDice.trim() || damageScaling.trim()
                    ? {
                        damageType: damageType.trim() || undefined,
                        dice: damageDice.trim() || undefined,
                        scaling: damageScaling.trim() || undefined,
                    }
                    : undefined;

            const entry: CustomSpellEntry = {
                id: editing?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: trimmed,
                level: resolvedLevel,
                school: school.trim() || undefined,
                description: desc,
                castingTime: castingTimePayload,
                range: range.trim() || undefined,
                components: componentsPayload,
                materials: materials.trim() || undefined,
                duration: duration.trim() || undefined,
                concentration: concentration || undefined,
                ritual: ritual || undefined,
                resourceCost,
                save: savePayload,
                damage: damagePayload,
            };

            const writeAsCantrip = resolvedLevel === 0;
            if (formType === "cantrip" || writeAsCantrip) {
                const list = Array.isArray(customCantrips) ? customCantrips : [];
                const updated = editing
                    ? list.map((item) => (item.id === entry.id ? entry : item))
                    : [...list, entry];
                setCustomCantrips(updated);
            } else {
                const list = Array.isArray(customSpells) ? customSpells : [];
                const updated = editing
                    ? list.map((item) => (item.id === entry.id ? entry : item))
                    : [...list, entry];
                setCustomSpells(updated);
            }
        } else {
            const parsedCharges = abilityCharges.trim() ? Number(abilityCharges) : undefined;
            const parsedPoints = abilityPoints.trim() ? Number(abilityPoints) : undefined;
            const abilityCost =
                abilityUsesSlot || parsedCharges != null || parsedPoints != null || abilityPointsLabel.trim()
                    ? {
                        usesSpellSlot: abilityUsesSlot || undefined,
                        slotLevel: abilityUsesSlot
                            ? Number(abilitySlotLevel) || undefined
                            : undefined,
                        charges: Number.isFinite(parsedCharges as number)
                            ? parsedCharges
                            : undefined,
                        recharge: abilityUsesSlot ? undefined : abilityRecharge,
                        pointsLabel: abilityPointsLabel.trim() || undefined,
                        points: Number.isFinite(parsedPoints as number) ? parsedPoints : undefined,
                    }
                    : undefined;

            const entry: CustomFeatureEntry = {
                id: editing?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: trimmed,
                level: formType === "classAbility" ? Number(level) || undefined : undefined,
                description: desc,
                actionType: formType === "classAbility" ? abilityActionType : undefined,
                resourceCost: formType === "classAbility" ? abilityCost : undefined,
                requirements: formType === "classAbility" ? requirements.trim() || undefined : undefined,
                effect: formType === "classAbility" ? effect.trim() || undefined : undefined,
            };

            if (formType === "trait") {
                const list = Array.isArray(customTraits) ? customTraits : [];
                const updated = editing
                    ? list.map((item) => (item.id === entry.id ? entry : item))
                    : [...list, entry];
                setCustomTraits(updated);
            } else {
                const list = Array.isArray(customClassAbilities)
                    ? customClassAbilities
                    : [];
                const updated = editing
                    ? list.map((item) => (item.id === entry.id ? entry : item))
                    : [...list, entry];
                setCustomClassAbilities(updated);
            }
        }

        resetForm();
    }

    function removeEntry(id: string, type: FormType) {
        if (type === "spell") {
            setCustomSpells(customSpells.filter((item) => item.id !== id));
            return;
        }
        if (type === "cantrip") {
            setCustomCantrips(customCantrips.filter((item) => item.id !== id));
            return;
        }
        if (type === "trait") {
            setCustomTraits(customTraits.filter((item) => item.id !== id));
            return;
        }
        setCustomClassAbilities(customClassAbilities.filter((item) => item.id !== id));
    }

    function renderList(
        label: string,
        entries: Array<CustomSpellEntry | CustomFeatureEntry>,
        type: FormType
    ) {
        if (!entries.length) return null;

        return (
            <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                    {label}
                </h4>
                <div className="grid gap-2 md:grid-cols-2">
                    {entries.map((entry) => {
                        const desc = getLocalizedText(entry.description, locale);
                        return (
                            <details
                                key={entry.id}
                                className="rounded-2xl border border-ring bg-white/80 p-3"
                            >
                                <summary className="cursor-pointer list-none">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-ink">
                                                {entry.name}
                                            </p>
                                            {"level" in entry && entry.level != null && (
                                                <p className="text-[11px] text-ink-muted">
                                                    Nivel {entry.level}
                                                    {"school" in entry && entry.school
                                                        ? ` · ${entry.school}`
                                                        : ""}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    startEdit(entry, type);
                                                }}
                                                className="text-[10px] px-2 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    removeEntry(entry.id, type);
                                                }}
                                                className="text-[10px] px-2 py-1 rounded-md border border-red-400/70 text-red-600 bg-red-50 hover:bg-red-100"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </summary>
                                {desc ? (
                                    <div className="mt-2">
                                        <Markdown
                                            content={desc}
                                            className="text-ink-muted text-xs"
                                        />
                                    </div>
                                ) : (
                                    <p className="mt-2 text-[11px] text-ink-muted">
                                        Sin descripción.
                                    </p>
                                )}
                            </details>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <section className="space-y-4">
            {isCreateOpen && (
                <div className="rounded-2xl border border-ring bg-panel/80 p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-ink-muted">
                            Crear
                        </p>
                        <h3 className="text-sm font-semibold text-ink">
                            {editing ? `Editar ${title}` : `Nuevo ${title}`}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {showCreateToggle && (
                            <button
                                type="button"
                                onClick={() => {
                                    resetForm();
                                    setCreateOpen(false);
                                }}
                                className="text-[11px] px-3 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                            >
                                Cerrar
                            </button>
                        )}
                        {editing && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-[11px] px-3 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                            >
                                Cancelar edición
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleSave}
                            className="text-[11px] px-3 py-1 rounded-md border border-accent/60 bg-accent/10 hover:bg-accent/20"
                        >
                            {editing ? "Guardar cambios" : "Crear"}
                        </button>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                        <label className="text-xs text-ink-muted">Tipo</label>
                        <select
                            value={formType}
                            onChange={(event) => {
                                const next = event.target.value as FormType;
                                setFormType(next);
                                if (next === "cantrip") setLevel(0);
                                if (next === "spell" && level === 0) setLevel(1);
                            }}
                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                        >
                            <option value="spell">Hechizo</option>
                            <option value="cantrip">Truco</option>
                            <option value="trait">Rasgo</option>
                            <option value="classAbility">Habilidad</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-ink-muted">Nombre</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                        />
                    </div>
                </div>

                {(isSpellForm || isAbilityForm) && (
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-xs text-ink-muted">
                                Nivel {isSpellForm ? "(0–9)" : "recomendado"}
                            </label>
                            <input
                                type="number"
                                min={isSpellForm ? 0 : 0}
                                max={isSpellForm ? 9 : 20}
                                value={level}
                                disabled={formType === "cantrip"}
                                onChange={(event) =>
                                    setLevel(Number(event.target.value) || (isSpellForm ? 0 : 1))
                                }
                                className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent disabled:opacity-60"
                            />
                        </div>
                        {isSpellForm && (
                            <div className="space-y-1">
                                <label className="text-xs text-ink-muted">Escuela</label>
                                <select
                                    value={school}
                                    onChange={(event) => setSchool(event.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                >
                                    <option value="">Selecciona escuela</option>
                                    {SPELL_SCHOOLS.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {isAbilityForm && (
                            <div className="space-y-1">
                                <label className="text-xs text-ink-muted">Tipo de acción</label>
                                <select
                                    value={abilityActionType ?? "action"}
                                    onChange={(event) =>
                                        setAbilityActionType(
                                            event.target.value as CustomFeatureEntry["actionType"]
                                        )
                                    }
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                >
                                    {ACTION_TYPES.map((action) => (
                                        <option key={action.value} value={action.value}>
                                            {action.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {isSpellForm && (
                    <>
                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="space-y-1">
                                <label className="text-xs text-ink-muted">Tiempo de lanzamiento</label>
                                <select
                                    value={castingTime}
                                    onChange={(event) => setCastingTime(event.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                >
                                    {CASTING_TIME_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-ink-muted">Detalle (opcional)</label>
                                <input
                                    type="text"
                                    value={castingTimeNote}
                                    onChange={(event) => setCastingTimeNote(event.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                    placeholder="Acción adicional, reacción al ser atacado..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-ink-muted">Alcance</label>
                                <input
                                    type="text"
                                    value={range}
                                    onChange={(event) => setRange(event.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                    placeholder="Toque, 30 ft, 60 ft..."
                                />
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-xs text-ink-muted">Duración</label>
                                <input
                                    type="text"
                                    value={duration}
                                    onChange={(event) => setDuration(event.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                    placeholder="Instantánea, 1 minuto..."
                                />
                            </div>
                            {components.material && (
                                <div className="space-y-1">
                                    <label className="text-xs text-ink-muted">Materiales</label>
                                    <input
                                        type="text"
                                        value={materials}
                                        onChange={(event) => setMaterials(event.target.value)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                        placeholder="Componentes materiales (opcional)"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-ink">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={components.verbal}
                                    onChange={(event) =>
                                        setComponents((prev) => ({
                                            ...prev,
                                            verbal: event.target.checked,
                                        }))
                                    }
                                />
                                V (verbal)
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={components.somatic}
                                    onChange={(event) =>
                                        setComponents((prev) => ({
                                            ...prev,
                                            somatic: event.target.checked,
                                        }))
                                    }
                                />
                                S (somático)
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={components.material}
                                    onChange={(event) =>
                                        setComponents((prev) => ({
                                            ...prev,
                                            material: event.target.checked,
                                        }))
                                    }
                                />
                                M (material)
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={concentration}
                                    onChange={(event) => setConcentration(event.target.checked)}
                                />
                                Concentración
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={ritual}
                                    onChange={(event) => setRitual(event.target.checked)}
                                />
                                Ritual
                            </label>
                        </div>

                        <details className="rounded-xl border border-ring bg-white/80 p-3">
                            <summary className="cursor-pointer text-xs text-ink-muted">
                                Coste / recursos al usar
                            </summary>
                            <div className="mt-3 space-y-3">
                                <label className="flex items-center gap-2 text-xs text-ink">
                                    <input
                                        type="checkbox"
                                        checked={costUsesSlot}
                                        onChange={(event) => setCostUsesSlot(event.target.checked)}
                                    />
                                    Gasta espacio de conjuro
                                </label>
                                {costUsesSlot && (
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">
                                            Nivel de espacio a gastar
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={9}
                                            value={costSlotLevel}
                                            onChange={(event) =>
                                                setCostSlotLevel(Number(event.target.value) || 0)
                                            }
                                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                        />
                                    </div>
                                )}
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">
                                            Cargas (opcional)
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={costCharges}
                                            onChange={(event) => setCostCharges(event.target.value)}
                                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">
                                            Puntos (opcional)
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={costPoints}
                                            onChange={(event) => setCostPoints(event.target.value)}
                                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </details>

                        <details className="rounded-xl border border-ring bg-white/80 p-3">
                            <summary className="cursor-pointer text-xs text-ink-muted">
                                Tirada / salvación
                            </summary>
                            <div className="mt-3 space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] text-ink-muted">Tipo</label>
                                    <select
                                        value={saveType}
                                        onChange={(event) =>
                                            setSaveType(event.target.value as "attack" | "save" | "none")
                                        }
                                        className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                    >
                                        <option value="none">Ninguno</option>
                                        <option value="attack">Ataque</option>
                                        <option value="save">Salvación</option>
                                    </select>
                                </div>

                                {saveType === "save" && (
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <label className="text-[11px] text-ink-muted">Atributo</label>
                                            <select
                                                value={saveAbility}
                                                onChange={(event) =>
                                                    setSaveAbility(event.target.value as AbilityKey)
                                                }
                                                className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                            >
                                                {SAVE_ABILITIES.map((ability) => (
                                                    <option key={ability.value} value={ability.value}>
                                                        {ability.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] text-ink-muted">CD</label>
                                            <select
                                                value={dcType}
                                                onChange={(event) =>
                                                    setDcType(event.target.value as "fixed" | "stat")
                                                }
                                                className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                            >
                                                <option value="stat">Basada en stat</option>
                                                <option value="fixed">Fija</option>
                                            </select>
                                        </div>
                                        {dcType === "fixed" && (
                                            <div className="space-y-1">
                                                <label className="text-[11px] text-ink-muted">CD fija</label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={dcValue}
                                                    onChange={(event) => setDcValue(event.target.value)}
                                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                                />
                                            </div>
                                        )}
                                        {dcType === "stat" && (
                                            <div className="space-y-1">
                                                <label className="text-[11px] text-ink-muted">Stat base</label>
                                                <select
                                                    value={dcStat}
                                                    onChange={(event) =>
                                                        setDcStat(event.target.value as AbilityKey)
                                                    }
                                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                                >
                                                    {SAVE_ABILITIES.map((ability) => (
                                                        <option key={ability.value} value={ability.value}>
                                                            {ability.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </details>

                        <details className="rounded-xl border border-ring bg-white/80 p-3">
                            <summary className="cursor-pointer text-xs text-ink-muted">Daño</summary>
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-[11px] text-ink-muted">Tipo de daño</label>
                                    <input
                                        type="text"
                                        value={damageType}
                                        onChange={(event) => setDamageType(event.target.value)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                        placeholder="fuego, frío, radiante..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] text-ink-muted">Dados</label>
                                    <input
                                        type="text"
                                        value={damageDice}
                                        onChange={(event) => setDamageDice(event.target.value)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                        placeholder="2d6, 1d8 + 3..."
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-[11px] text-ink-muted">Escalado</label>
                                    <input
                                        type="text"
                                        value={damageScaling}
                                        onChange={(event) => setDamageScaling(event.target.value)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                        placeholder="+1d6 por nivel, +1d8 cada 2 niveles..."
                                    />
                                </div>
                            </div>
                        </details>
                    </>
                )}

                {isAbilityForm && (
                    <>
                        <details className="rounded-xl border border-ring bg-white/80 p-3">
                            <summary className="cursor-pointer text-xs text-ink-muted">
                                Coste / recursos
                            </summary>
                            <div className="mt-3 space-y-3">
                                <label className="flex items-center gap-2 text-xs text-ink">
                                    <input
                                        type="checkbox"
                                        checked={abilityUsesSlot}
                                        onChange={(event) => setAbilityUsesSlot(event.target.checked)}
                                    />
                                    Usa espacio de conjuro
                                </label>
                                {abilityUsesSlot && (
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">Nivel a gastar</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={9}
                                            value={abilitySlotLevel}
                                            onChange={(event) =>
                                                setAbilitySlotLevel(Number(event.target.value) || 0)
                                            }
                                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                        />
                                    </div>
                                )}
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">Cargas máximas</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={abilityCharges}
                                            onChange={(event) => setAbilityCharges(event.target.value)}
                                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">Recarga</label>
                                        <select
                                            value={abilityRecharge}
                                            onChange={(event) =>
                                                setAbilityRecharge(event.target.value as "short" | "long")
                                            }
                                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                        >
                                            <option value="short">Descanso corto</option>
                                            <option value="long">Descanso largo</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">Puntos (nombre)</label>
                                        <input
                                            type="text"
                                            value={abilityPointsLabel}
                                            onChange={(event) => setAbilityPointsLabel(event.target.value)}
                                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                            placeholder="ki, sorcery points..."
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">Puntos (cantidad)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={abilityPoints}
                                            onChange={(event) => setAbilityPoints(event.target.value)}
                                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </details>

                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-xs text-ink-muted">Requisitos / condiciones</label>
                                <input
                                    type="text"
                                    value={requirements}
                                    onChange={(event) => setRequirements(event.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-ink-muted">Efecto</label>
                                <input
                                    type="text"
                                    value={effect}
                                    onChange={(event) => setEffect(event.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                />
                            </div>
                        </div>
                    </>
                )}

                <details className="rounded-xl border border-ring bg-white/80 p-3">
                    <summary className="cursor-pointer text-xs text-ink-muted">
                        Descripción (Markdown)
                    </summary>
                    <div className="mt-2">
                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            rows={4}
                            className="w-full rounded-md bg-white/90 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                        />
                    </div>
                </details>
            </div>
            )}

            <div className="space-y-4">
                {renderList("Trucos personalizados", customCantrips, "cantrip")}
                {renderList("Hechizos personalizados", customSpells, "spell")}
                {renderList("Rasgos personalizados", customTraits, "trait")}
                {renderList("Habilidades personalizadas", customClassAbilities, "classAbility")}
            </div>
        </section>
    );
}
