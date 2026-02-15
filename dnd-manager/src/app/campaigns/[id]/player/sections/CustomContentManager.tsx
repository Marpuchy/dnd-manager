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
import { tr } from "@/lib/i18n/translate";

type FormType = "spell" | "cantrip" | "trait" | "classAbility";
const ALL_FORM_TYPES: FormType[] = ["spell", "cantrip", "trait", "classAbility"];

const SPELL_SCHOOLS = [
    { es: "Abjuración", en: "Abjuration" },
    { es: "Adivinación", en: "Divination" },
    { es: "Conjuración", en: "Conjuration" },
    { es: "Encantamiento", en: "Enchantment" },
    { es: "Evocación", en: "Evocation" },
    { es: "Ilusión", en: "Illusion" },
    { es: "Nigromancia", en: "Necromancy" },
    { es: "Transmutación", en: "Transmutation" },
];

const CASTING_TIME_OPTIONS = [
    { es: "Acción", en: "Action" },
    { es: "Acción adicional", en: "Bonus action" },
    { es: "Reacción", en: "Reaction" },
    { es: "1 minuto", en: "1 minute" },
    { es: "10 minutos", en: "10 minutes" },
    { es: "1 hora", en: "1 hour" },
    { es: "Especial", en: "Special" },
];

const ACTION_TYPES: {
    value: CustomFeatureEntry["actionType"];
    es: string;
    en: string;
}[] = [
    { value: "action", es: "Acción", en: "Action" },
    { value: "bonus", es: "Acción bonus", en: "Bonus action" },
    { value: "reaction", es: "Reacción", en: "Reaction" },
    { value: "passive", es: "Pasiva", en: "Passive" },
];

const SAVE_ABILITIES: { value: AbilityKey; es: string; en: string }[] = [
    { value: "STR", es: "Fuerza (STR)", en: "Strength (STR)" },
    { value: "DEX", es: "Destreza (DEX)", en: "Dexterity (DEX)" },
    { value: "CON", es: "Constitución (CON)", en: "Constitution (CON)" },
    { value: "INT", es: "Inteligencia (INT)", en: "Intelligence (INT)" },
    { value: "WIS", es: "Sabiduría (WIS)", en: "Wisdom (WIS)" },
    { value: "CHA", es: "Carisma (CHA)", en: "Charisma (CHA)" },
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
    createAsModal?: boolean;
    allowedTypes?: FormType[];
    defaultFormType?: FormType;
    subclassOptions?: { id: string; name: string }[];
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
                                                 createAsModal = false,
                                                 allowedTypes,
                                                 defaultFormType,
                                                 subclassOptions = [],
                                             }: CustomContentManagerProps) {
    const t = (es: string, en: string) => tr(locale, es, en);
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
    const allowedFormTypes = useMemo<FormType[]>(() => {
        if (!Array.isArray(allowedTypes) || allowedTypes.length === 0) {
            return ALL_FORM_TYPES;
        }
        const filtered = allowedTypes.filter((type): type is FormType =>
            ALL_FORM_TYPES.includes(type)
        );
        return filtered.length > 0 ? filtered : ALL_FORM_TYPES;
    }, [allowedTypes]);

    const initialFormType: FormType = useMemo(() => {
        if (defaultFormType && allowedFormTypes.includes(defaultFormType)) {
            return defaultFormType;
        }
        return allowedFormTypes[0] ?? "spell";
    }, [allowedFormTypes, defaultFormType]);

    const [formType, setFormType] = useState<FormType>(initialFormType);
    const [editing, setEditing] = useState<{ id: string; type: FormType } | null>(
        null
    );

    const [name, setName] = useState("");
    const [level, setLevel] = useState(1);
    const [school, setSchool] = useState("");
    const [description, setDescription] = useState("");

    // Spell fields
    const [castingTime, setCastingTime] = useState(CASTING_TIME_OPTIONS[0].es);
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
    const [abilitySubclassId, setAbilitySubclassId] = useState("");

    const subclassNameById = useMemo(
        () =>
            Object.fromEntries(
                (Array.isArray(subclassOptions) ? subclassOptions : [])
                    .filter(
                        (option) =>
                            typeof option?.id === "string" &&
                            option.id &&
                            typeof option?.name === "string" &&
                            option.name.trim().length > 0
                    )
                    .map((option) => [option.id, option.name.trim()])
            ) as Record<string, string>,
        [subclassOptions]
    );

    const title = useMemo(() => {
        switch (formType) {
            case "spell":
                return t("Hechizo", "Spell");
            case "cantrip":
                return t("Truco", "Cantrip");
            case "trait":
                return t("Rasgo", "Trait");
            case "classAbility":
                return t("Habilidad", "Ability");
            default:
                return t("Contenido", "Content");
        }
    }, [formType, t]);

    const isSpellForm = formType === "spell" || formType === "cantrip";
    const isAbilityForm = formType === "classAbility";

    React.useEffect(() => {
        if (!allowedFormTypes.includes(formType)) {
            setFormType(initialFormType);
        }
    }, [allowedFormTypes, formType, initialFormType]);

    function resetForm() {
        setFormType(initialFormType);
        setName("");
        setLevel(1);
        setSchool("");
        setDescription("");
        setCastingTime(CASTING_TIME_OPTIONS[0].es);
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
        setAbilitySubclassId("");
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
                setCastingTime(casting.value ?? CASTING_TIME_OPTIONS[0].es);
                setCastingTimeNote(casting.note ?? "");
            } else if (typeof casting === "string") {
                setCastingTime(casting);
                setCastingTimeNote("");
            } else {
                setCastingTime(CASTING_TIME_OPTIONS[0].es);
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
            setAbilitySubclassId(ability.subclassId ?? "");
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
                        value: castingTime || CASTING_TIME_OPTIONS[0].es,
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
                subclassId:
                    formType === "classAbility" && abilitySubclassId
                        ? abilitySubclassId
                        : undefined,
                subclassName:
                    formType === "classAbility" && abilitySubclassId
                        ? subclassNameById[abilitySubclassId]
                        : undefined,
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

    function closeCreatePanel() {
        resetForm();
        setCreateOpen(false);
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
                                                    {t("Nivel", "Level")} {entry.level}
                                                    {"school" in entry && entry.school
                                                        ? ` · ${entry.school}`
                                                        : ""}
                                                </p>
                                            )}
                                            {"subclassName" in entry &&
                                                (entry as CustomFeatureEntry).subclassName && (
                                                    <p className="text-[11px] text-ink-muted">
                                                        {(entry as CustomFeatureEntry).subclassName}
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
                                                {t("Editar", "Edit")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    removeEntry(entry.id, type);
                                                }}
                                                className="text-[10px] px-2 py-1 rounded-md border border-red-400/70 text-red-600 bg-red-50 hover:bg-red-100"
                                            >
                                                {t("Eliminar", "Delete")}
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
                                        {t("Sin descripcion.", "No description.")}
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
            {isCreateOpen && createAsModal && (
                <button
                    type="button"
                    aria-label={t("Cerrar creador personalizado", "Close custom creator")}
                    onClick={closeCreatePanel}
                    className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm"
                />
            )}
            {isCreateOpen && (
                <div
                    className={`rounded-2xl border border-ring bg-panel/80 p-3 space-y-3 ${
                        createAsModal
                            ? "fixed inset-x-3 top-4 bottom-4 z-[60] overflow-y-auto styled-scrollbar shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
                            : ""
                    }`}
                    onClick={createAsModal ? (event) => event.stopPropagation() : undefined}
                >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-ink-muted">
                            {t("Crear", "Create")}
                        </p>
                        <h3 className="text-sm font-semibold text-ink">
                            {editing ? `${t("Editar", "Edit")} ${title}` : `${t("Nuevo", "New")} ${title}`}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {showCreateToggle && (
                            <button
                                type="button"
                                onClick={closeCreatePanel}
                                className="text-[11px] px-3 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                            >
                                {t("Cerrar", "Close")}
                            </button>
                        )}
                        {editing && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-[11px] px-3 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                            >
                                {t("Cancelar edicion", "Cancel edit")}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleSave}
                            className="text-[11px] px-3 py-1 rounded-md border border-accent/60 bg-accent/10 hover:bg-accent/20"
                        >
                            {editing ? t("Guardar cambios", "Save changes") : t("Crear", "Create")}
                        </button>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                        <label className="text-xs text-ink-muted">{t("Tipo", "Type")}</label>
                        <select
                            value={formType}
                            onChange={(event) => {
                                const next = event.target.value as FormType;
                                if (!allowedFormTypes.includes(next)) return;
                                setFormType(next);
                                if (next === "cantrip") setLevel(0);
                                if (next === "spell" && level === 0) setLevel(1);
                            }}
                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                        >
                            {allowedFormTypes.includes("spell") && (
                                <option value="spell">{t("Hechizo", "Spell")}</option>
                            )}
                            {allowedFormTypes.includes("cantrip") && (
                                <option value="cantrip">{t("Truco", "Cantrip")}</option>
                            )}
                            {allowedFormTypes.includes("trait") && (
                                <option value="trait">{t("Rasgo", "Trait")}</option>
                            )}
                            {allowedFormTypes.includes("classAbility") && (
                                <option value="classAbility">{t("Habilidad", "Ability")}</option>
                            )}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-ink-muted">{t("Nombre", "Name")}</label>
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
                                {t("Nivel", "Level")} {isSpellForm ? "(0-9)" : t("recomendado", "recommended")}
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
                                <label className="text-xs text-ink-muted">{t("Escuela", "School")}</label>
                                <select
                                    value={school}
                                    onChange={(event) => setSchool(event.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                >
                                    <option value="">{t("Selecciona escuela", "Select school")}</option>
                                    {SPELL_SCHOOLS.map((s) => (
                                        <option key={s.en} value={s.es}>
                                            {locale === "en" ? s.en : s.es}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {isAbilityForm && (
                            <div className="space-y-1">
                                <label className="text-xs text-ink-muted">{t("Tipo de accion", "Action type")}</label>
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
                                            {locale === "en" ? action.en : action.es}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {isAbilityForm && Object.keys(subclassNameById).length > 0 && (
                            <div className="space-y-1">
                                <label className="text-xs text-ink-muted">
                                    {t("Subclase (opcional)", "Subclass (optional)")}
                                </label>
                                <select
                                    value={abilitySubclassId}
                                    onChange={(event) => setAbilitySubclassId(event.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                >
                                    <option value="">{t("General de clase", "General class")}</option>
                                    {Object.entries(subclassNameById).map(([id, optionName]) => (
                                        <option key={id} value={id}>
                                            {optionName}
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
                                <label className="text-xs text-ink-muted">{t("Tiempo de lanzamiento", "Casting time")}</label>
                                <select
                                    value={castingTime}
                                    onChange={(event) => setCastingTime(event.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                >
                                    {CASTING_TIME_OPTIONS.map((option) => (
                                        <option key={option.en} value={option.es}>
                                            {locale === "en" ? option.en : option.es}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-ink-muted">{t("Detalle (opcional)", "Detail (optional)")}</label>
                                <input
                                    type="text"
                                    value={castingTimeNote}
                                    onChange={(event) => setCastingTimeNote(event.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                    placeholder={t("Accion adicional, reaccion al ser atacado...", "Bonus action, reaction on being attacked...")}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-ink-muted">{t("Alcance", "Range")}</label>
                                <input
                                    type="text"
                                    value={range}
                                    onChange={(event) => setRange(event.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                    placeholder={t("Toque, 30 ft, 60 ft...", "Touch, 30 ft, 60 ft...")}
                                />
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-xs text-ink-muted">{t("Duracion", "Duration")}</label>
                                <input
                                    type="text"
                                    value={duration}
                                    onChange={(event) => setDuration(event.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                    placeholder={t("Instantanea, 1 minuto...", "Instantaneous, 1 minute...")}
                                />
                            </div>
                            {components.material && (
                                <div className="space-y-1">
                                    <label className="text-xs text-ink-muted">{t("Materiales", "Materials")}</label>
                                    <input
                                        type="text"
                                        value={materials}
                                        onChange={(event) => setMaterials(event.target.value)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                        placeholder={t("Componentes materiales (opcional)", "Material components (optional)")}
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
                                {t("V (verbal)", "V (verbal)")}
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
                                {t("S (somatico)", "S (somatic)")}
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
                                {t("Concentracion", "Concentration")}
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={ritual}
                                    onChange={(event) => setRitual(event.target.checked)}
                                />
                                {t("Ritual", "Ritual")}
                            </label>
                        </div>

                        <details className="rounded-xl border border-ring bg-white/80 p-3">
                            <summary className="cursor-pointer text-xs text-ink-muted">
                                {t("Coste / recursos al usar", "Cost / resources on use")}
                            </summary>
                            <div className="mt-3 space-y-3">
                                <label className="flex items-center gap-2 text-xs text-ink">
                                    <input
                                        type="checkbox"
                                        checked={costUsesSlot}
                                        onChange={(event) => setCostUsesSlot(event.target.checked)}
                                    />
                                    {t("Gasta espacio de conjuro", "Spend spell slot")}
                                </label>
                                {costUsesSlot && (
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">
                                            {t("Nivel de espacio a gastar", "Slot level to spend")}
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
                                            {t("Cargas (opcional)", "Charges (optional)")}
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
                                            {t("Puntos (opcional)", "Points (optional)")}
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
                                {t("Tirada / salvacion", "Roll / save")}
                            </summary>
                            <div className="mt-3 space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] text-ink-muted">{t("Tipo", "Type")}</label>
                                    <select
                                        value={saveType}
                                        onChange={(event) =>
                                            setSaveType(event.target.value as "attack" | "save" | "none")
                                        }
                                        className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                    >
                                        <option value="none">{t("Ninguno", "None")}</option>
                                        <option value="attack">{t("Ataque", "Attack")}</option>
                                        <option value="save">{t("Salvacion", "Saving throw")}</option>
                                    </select>
                                </div>

                                {saveType === "save" && (
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <label className="text-[11px] text-ink-muted">{t("Atributo", "Attribute")}</label>
                                            <select
                                                value={saveAbility}
                                                onChange={(event) =>
                                                    setSaveAbility(event.target.value as AbilityKey)
                                                }
                                                className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                            >
                                                {SAVE_ABILITIES.map((ability) => (
                                                    <option key={ability.value} value={ability.value}>
                                                        {locale === "en" ? ability.en : ability.es}
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
                                                <option value="stat">{t("Basada en stat", "Based on stat")}</option>
                                                <option value="fixed">{t("Fija", "Fixed")}</option>
                                            </select>
                                        </div>
                                        {dcType === "fixed" && (
                                            <div className="space-y-1">
                                                <label className="text-[11px] text-ink-muted">{t("CD fija", "Fixed DC")}</label>
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
                                                <label className="text-[11px] text-ink-muted">{t("Stat base", "Base stat")}</label>
                                                <select
                                                    value={dcStat}
                                                    onChange={(event) =>
                                                        setDcStat(event.target.value as AbilityKey)
                                                    }
                                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                                >
                                                    {SAVE_ABILITIES.map((ability) => (
                                                        <option key={ability.value} value={ability.value}>
                                                            {locale === "en" ? ability.en : ability.es}
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
                            <summary className="cursor-pointer text-xs text-ink-muted">{t("Dano", "Damage")}</summary>
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-[11px] text-ink-muted">{t("Tipo de dano", "Damage type")}</label>
                                    <input
                                        type="text"
                                        value={damageType}
                                        onChange={(event) => setDamageType(event.target.value)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                        placeholder={t("fuego, frio, radiante...", "fire, cold, radiant...")}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] text-ink-muted">{t("Dados", "Dice")}</label>
                                    <input
                                        type="text"
                                        value={damageDice}
                                        onChange={(event) => setDamageDice(event.target.value)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                        placeholder="2d6, 1d8 + 3..."
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-[11px] text-ink-muted">{t("Escalado", "Scaling")}</label>
                                    <input
                                        type="text"
                                        value={damageScaling}
                                        onChange={(event) => setDamageScaling(event.target.value)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                        placeholder={t("+1d6 por nivel, +1d8 cada 2 niveles...", "+1d6 per level, +1d8 every 2 levels...")}
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
                                {t("Coste / recursos", "Cost / resources")}
                            </summary>
                            <div className="mt-3 space-y-3">
                                <label className="flex items-center gap-2 text-xs text-ink">
                                    <input
                                        type="checkbox"
                                        checked={abilityUsesSlot}
                                        onChange={(event) => setAbilityUsesSlot(event.target.checked)}
                                    />
                                    {t("Usa espacio de conjuro", "Use spell slot")}
                                </label>
                                {abilityUsesSlot && (
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">{t("Nivel a gastar", "Slot level to spend")}</label>
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
                                        <label className="text-[11px] text-ink-muted">{t("Cargas maximas", "Max charges")}</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={abilityCharges}
                                            onChange={(event) => setAbilityCharges(event.target.value)}
                                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">{t("Recarga", "Recharge")}</label>
                                        <select
                                            value={abilityRecharge}
                                            onChange={(event) =>
                                                setAbilityRecharge(event.target.value as "short" | "long")
                                            }
                                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                        >
                                            <option value="short">{t("Descanso corto", "Short rest")}</option>
                                            <option value="long">{t("Descanso largo", "Long rest")}</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">{t("Puntos (nombre)", "Points (name)")}</label>
                                        <input
                                            type="text"
                                            value={abilityPointsLabel}
                                            onChange={(event) => setAbilityPointsLabel(event.target.value)}
                                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                            placeholder={t("ki, puntos de hechiceria...", "ki, sorcery points...")}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-ink-muted">{t("Puntos (cantidad)", "Points (amount)")}</label>
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
                                <label className="text-xs text-ink-muted">{t("Requisitos / condiciones", "Requirements / conditions")}</label>
                                <input
                                    type="text"
                                    value={requirements}
                                    onChange={(event) => setRequirements(event.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-ink-muted">{t("Efecto", "Effect")}</label>
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
                        {t("Descripcion (Markdown)", "Description (Markdown)")}
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
                {allowedFormTypes.includes("cantrip") &&
                    renderList(t("Trucos personalizados", "Custom cantrips"), customCantrips, "cantrip")}
                {allowedFormTypes.includes("spell") &&
                    renderList(t("Hechizos personalizados", "Custom spells"), customSpells, "spell")}
                {allowedFormTypes.includes("trait") &&
                    renderList(t("Rasgos personalizados", "Custom traits"), customTraits, "trait")}
                {allowedFormTypes.includes("classAbility") &&
                    renderList(
                        t("Habilidades personalizadas", "Custom abilities"),
                        customClassAbilities,
                        "classAbility"
                    )}
            </div>
        </section>
    );
}
