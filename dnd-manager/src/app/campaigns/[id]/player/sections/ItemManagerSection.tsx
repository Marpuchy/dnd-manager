"use client";

import React, { useMemo, useState } from "react";
import type {
    CharacterItem,
    ItemAttachmentEntry,
    ItemCategory,
    ItemModifier,
} from "@/lib/types/dnd";
import {
    MODIFIER_TARGETS,
    buildItemBase,
    getLocalizedText,
    normalizeLocalizedText,
    normalizeTarget,
} from "@/lib/character/items";
import Markdown from "@/app/components/Markdown";
import { useClientLocale } from "@/lib/i18n/useClientLocale";
import { tr } from "@/lib/i18n/translate";

const CATEGORY_LABELS: Record<ItemCategory, { es: string; en: string }> = {
    weapon: { es: "Arma", en: "Weapon" },
    armor: { es: "Armadura", en: "Armor" },
    accessory: { es: "Accesorio", en: "Accessory" },
    consumable: { es: "Consumible", en: "Consumable" },
    tool: { es: "Herramienta", en: "Tool" },
    misc: { es: "Miscelaneo", en: "Misc" },
};

const ATTACHMENT_TYPE_OPTIONS: Array<{
    value: ItemAttachmentEntry["type"];
    es: string;
    en: string;
}> = [
    { value: "action", es: "Accion", en: "Action" },
    { value: "ability", es: "Habilidad", en: "Ability" },
    { value: "trait", es: "Rasgo", en: "Trait" },
    { value: "spell", es: "Hechizo", en: "Spell" },
    { value: "cantrip", es: "Truco", en: "Cantrip" },
    { value: "classFeature", es: "Rasgo de clase", en: "Class feature" },
    { value: "other", es: "Otro", en: "Other" },
];

const TARGET_LABEL_EN: Record<string, string> = {
    STR: "Strength (STR)",
    DEX: "Dexterity (DEX)",
    CON: "Constitution (CON)",
    INT: "Intelligence (INT)",
    WIS: "Wisdom (WIS)",
    CHA: "Charisma (CHA)",
    AC: "Armor class (AC)",
    HP_MAX: "Max hit points",
    HP_CURRENT: "Current hit points",
    SPEED: "Speed",
    INITIATIVE: "Initiative",
    PROFICIENCY: "Proficiency bonus",
    PASSIVE_PERCEPTION: "Passive perception",
    SPELL_ATTACK: "Spell attack",
    SPELL_DC: "Spell save DC",
    ATTACK_BONUS: "Attack bonus",
    DAMAGE_BONUS: "Damage bonus",
    SAVE_STR: "Saving throw STR",
    SAVE_DEX: "Saving throw DEX",
    SAVE_CON: "Saving throw CON",
    SAVE_INT: "Saving throw INT",
    SAVE_WIS: "Saving throw WIS",
    SAVE_CHA: "Saving throw CHA",
    SKILL_ACROBATICS: "Skill: Acrobatics",
    SKILL_ANIMAL_HANDLING: "Skill: Animal Handling",
    SKILL_ARCANA: "Skill: Arcana",
    SKILL_ATHLETICS: "Skill: Athletics",
    SKILL_DECEPTION: "Skill: Deception",
    SKILL_HISTORY: "Skill: History",
    SKILL_INSIGHT: "Skill: Insight",
    SKILL_INTIMIDATION: "Skill: Intimidation",
    SKILL_INVESTIGATION: "Skill: Investigation",
    SKILL_MEDICINE: "Skill: Medicine",
    SKILL_NATURE: "Skill: Nature",
    SKILL_PERCEPTION: "Skill: Perception",
    SKILL_PERFORMANCE: "Skill: Performance",
    SKILL_PERSUASION: "Skill: Persuasion",
    SKILL_RELIGION: "Skill: Religion",
    SKILL_SLEIGHT_OF_HAND: "Skill: Sleight of Hand",
    SKILL_STEALTH: "Skill: Stealth",
    SKILL_SURVIVAL: "Skill: Survival",
};

const targetLabelMap = new Map(MODIFIER_TARGETS.map((entry) => [entry.key, entry.label]));

function getTargetLabel(target: string, locale: string) {
    const normalized = normalizeTarget(target);
    if (locale === "en" && TARGET_LABEL_EN[normalized]) return TARGET_LABEL_EN[normalized];
    return targetLabelMap.get(normalized) ?? target;
}

function getAttachmentTypeLabel(
    type: ItemAttachmentEntry["type"],
    locale: string
) {
    const option = ATTACHMENT_TYPE_OPTIONS.find((entry) => entry.value === type);
    if (!option) return type;
    return locale === "en" ? option.en : option.es;
}

type ItemManagerSectionProps = {
    items: CharacterItem[];
    setItems: (items: CharacterItem[]) => void;
};

export default function ItemManagerSection({ items, setItems }: ItemManagerSectionProps) {
    const locale = useClientLocale();
    const t = (es: string, en: string) => tr(locale, es, en);
    const equippedItems = useMemo(() => items.filter((item) => item.equipped), [items]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [category, setCategory] = useState<ItemCategory>("misc");
    const [equippable, setEquippable] = useState(false);
    const [equipped, setEquipped] = useState(false);
    const [description, setDescription] = useState("");
    const [quantity, setQuantity] = useState<number>(1);
    const [rarity, setRarity] = useState("");
    const [tags, setTags] = useState("");
    const [modifiers, setModifiers] = useState<ItemModifier[]>([]);
    const [modTarget, setModTarget] = useState(MODIFIER_TARGETS[0]?.key ?? "STR");
    const [modValue, setModValue] = useState("1");
    const [modNote, setModNote] = useState("");
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [attachments, setAttachments] = useState<ItemAttachmentEntry[]>([]);
    const [attachmentType, setAttachmentType] =
        useState<ItemAttachmentEntry["type"]>("action");
    const [attachmentName, setAttachmentName] = useState("");
    const [attachmentLevel, setAttachmentLevel] = useState("");
    const [attachmentDescription, setAttachmentDescription] = useState("");
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    const applyItemOrder = (list: CharacterItem[]) =>
        list.map((item, index) => ({ ...item, sortOrder: index }));

    function resetForm() {
        setEditingId(null);
        setName("");
        setCategory("misc");
        setEquippable(false);
        setEquipped(false);
        setDescription("");
        setQuantity(1);
        setRarity("");
        setTags("");
        setModifiers([]);
        setModTarget(MODIFIER_TARGETS[0]?.key ?? "STR");
        setModValue("1");
        setModNote("");
        setAdvancedOpen(false);
        setAttachments([]);
        setAttachmentType("action");
        setAttachmentName("");
        setAttachmentLevel("");
        setAttachmentDescription("");
    }

    function openEditItem(item: CharacterItem) {
        setEditingId(item.id);
        setName(item.name ?? "");
        setCategory(item.category ?? "misc");
        setEquippable(!!item.equippable);
        setEquipped(!!item.equipped);
        setDescription(getLocalizedText(item.description, locale));
        setQuantity(item.quantity ?? 1);
        setRarity(item.rarity ?? "");
        setTags(Array.isArray(item.tags) ? item.tags.join(", ") : "");
        setModifiers(Array.isArray(item.modifiers) ? item.modifiers : []);
        setAttachments(Array.isArray(item.attachments) ? item.attachments : []);
        setIsFormOpen(true);
    }

    function saveItem() {
        const trimmed = name.trim();
        if (!trimmed) {
            setIsFormOpen(false);
            resetForm();
            return;
        }

        const parsedTags = tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);

        const item: CharacterItem = {
            ...(editingId
                ? (items.find((entry) => entry.id === editingId) ?? buildItemBase(trimmed, category))
                : buildItemBase(trimmed, category)),
            name: trimmed,
            category,
            equippable,
            equipped: equippable ? equipped : false,
            description: normalizeLocalizedText(description, locale),
            modifiers,
            quantity: quantity ?? 1,
            rarity: rarity.trim() || undefined,
            tags: parsedTags.length > 0 ? parsedTags : undefined,
            attachments: attachments.length > 0 ? attachments : undefined,
        };

        if (editingId) {
            setItems(applyItemOrder(items.map((entry) => (entry.id === editingId ? item : entry))));
        } else {
            setItems(applyItemOrder([...items, item]));
        }
        setIsFormOpen(false);
        resetForm();
    }

    function removeItem(id: string) {
        setItems(applyItemOrder(items.filter((entry) => entry.id !== id)));
    }

    function toggleEquip(id: string) {
        setItems(
            items.map((entry) => {
                if (entry.id !== id) return entry;
                if (!entry.equippable) return entry;
                return { ...entry, equipped: !entry.equipped };
            })
        );
    }

    function onDragStart(event: React.DragEvent, id: string) {
        setDraggingId(id);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
    }

    function onDragOver(event: React.DragEvent, id: string) {
        event.preventDefault();
        if (id !== dragOverId) setDragOverId(id);
    }

    function onDrop(event: React.DragEvent, id: string) {
        event.preventDefault();
        const sourceId = draggingId ?? event.dataTransfer.getData("text/plain");
        if (!sourceId || sourceId === id) {
            setDragOverId(null);
            return;
        }
        const fromIndex = items.findIndex((entry) => entry.id === sourceId);
        const toIndex = items.findIndex((entry) => entry.id === id);
        if (fromIndex === -1 || toIndex === -1) return;

        const next = [...items];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        setItems(applyItemOrder(next));
        setDraggingId(null);
        setDragOverId(null);
    }

    function addModifier() {
        const numeric = Number(modValue);
        if (Number.isNaN(numeric)) return;
        const target = modTarget.trim();
        if (!target) return;
        setModifiers([
            ...modifiers,
            { target, value: numeric, note: modNote.trim() || undefined },
        ]);
        setModValue("1");
        setModNote("");
    }

    function addAttachment() {
        const trimmedName = attachmentName.trim();
        const trimmedDescription = attachmentDescription.trim();
        if (!trimmedName) return;

        const parsedLevel = Number(attachmentLevel);
        const shouldUseLevel =
            (attachmentType === "spell" ||
                attachmentType === "cantrip" ||
                attachmentType === "ability" ||
                attachmentType === "classFeature") &&
            Number.isFinite(parsedLevel);

        const normalizedLevel =
            attachmentType === "cantrip"
                ? 0
                : shouldUseLevel
                ? Math.max(0, Math.min(20, Math.floor(parsedLevel)))
                : undefined;

        const entry: ItemAttachmentEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: attachmentType,
            name: trimmedName,
            level: normalizedLevel,
            description: normalizeLocalizedText(trimmedDescription, locale),
        };

        setAttachments((prev) => [...prev, entry]);
        setAttachmentName("");
        setAttachmentLevel("");
        setAttachmentDescription("");
    }

    function removeAttachment(id: string) {
        setAttachments((prev) => prev.filter((entry) => entry.id !== id));
    }

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="text-sm font-semibold text-ink">
                        {t("Inventario y equipamiento", "Inventory and equipment")}
                    </h3>
                    <p className="text-[11px] text-ink-muted">
                        {t(
                            "Todo esta en objetos. Los modificadores solo aplican si el objeto esta equipado.",
                            "Everything is item-based. Modifiers apply only when the item is equipped."
                        )}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        resetForm();
                        setIsFormOpen(true);
                    }}
                    className="text-xs px-3 py-1 rounded-md border border-accent/60 bg-accent/10 hover:bg-accent/20"
                >
                    {t("Anadir objeto", "Add item")}
                </button>
            </div>

            {isFormOpen && (
                <div className="rounded-2xl border border-ring bg-panel/80 p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-ink">
                            {editingId ? t("Editar objeto", "Edit item") : t("Nuevo objeto", "New item")}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsFormOpen(false);
                                    resetForm();
                                }}
                                className="text-[11px] px-3 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                            >
                                {t("Cancelar", "Cancel")}
                            </button>
                            <button
                                type="button"
                                onClick={saveItem}
                                className="text-[11px] px-3 py-1 rounded-md border border-emerald-500/60 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            >
                                {t("Guardar", "Save")}
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-xs text-ink-muted">{t("Nombre", "Name")}</label>
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-ink-muted">
                                {t("Categoria", "Category")}
                            </label>
                            <select
                                value={category}
                                onChange={(event) => setCategory(event.target.value as ItemCategory)}
                                className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                            >
                                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {t(label.es, label.en)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex items-center gap-2 text-xs text-ink-muted">
                            <input
                                type="checkbox"
                                checked={equippable}
                                onChange={(event) => {
                                    setEquippable(event.target.checked);
                                    if (!event.target.checked) setEquipped(false);
                                }}
                            />
                            {t("Es equipable", "Equippable")}
                        </label>
                        <label className="flex items-center gap-2 text-xs text-ink-muted">
                            <input
                                type="checkbox"
                                checked={equipped}
                                disabled={!equippable}
                                onChange={(event) => setEquipped(event.target.checked)}
                            />
                            {t("Esta equipado", "Equipped")}
                        </label>
                    </div>

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

                    <div className="rounded-xl border border-ring bg-white/80 p-3 space-y-2">
                        <p className="text-xs font-semibold text-ink">{t("Modificadores", "Modifiers")}</p>
                        {modifiers.length === 0 ? (
                            <p className="text-[11px] text-ink-muted">{t("Aun no hay modificadores.", "No modifiers yet.")}</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {modifiers.map((mod, index) => (
                                    <span
                                        key={`${mod.target}-${index}`}
                                        className="text-[10px] px-2 py-0.5 rounded-full border border-ring text-ink"
                                    >
                                        {getTargetLabel(mod.target, locale)} {mod.value >= 0 ? `+${mod.value}` : mod.value}
                                        {mod.note ? ` · ${mod.note}` : ""}
                                        <button
                                            type="button"
                                            onClick={() => setModifiers(modifiers.filter((_, i) => i !== index))}
                                            className="ml-2 text-ink-muted hover:text-ink"
                                        >
                                            x
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="grid gap-2 md:grid-cols-3">
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">{t("Destino", "Target")}</label>
                                <input
                                    list="modifier-targets"
                                    value={modTarget}
                                    onChange={(event) => setModTarget(event.target.value)}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                />
                                <datalist id="modifier-targets">
                                    {MODIFIER_TARGETS.map((target) => (
                                        <option key={target.key} value={target.key}>
                                            {getTargetLabel(target.key, locale)}
                                        </option>
                                    ))}
                                </datalist>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">{t("Valor", "Value")}</label>
                                <input
                                    type="number"
                                    value={modValue}
                                    onChange={(event) => setModValue(event.target.value)}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">{t("Nota", "Note")}</label>
                                <input
                                    value={modNote}
                                    onChange={(event) => setModNote(event.target.value)}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={addModifier}
                            className="text-[11px] px-3 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                        >
                            {t("Anadir modificador", "Add modifier")}
                        </button>
                    </div>

                    <div className="rounded-xl border border-ring bg-white/80 p-3 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-ink">
                                {t(
                                    "Contenido adjunto al objeto",
                                    "Content attached to item"
                                )}
                            </p>
                            <span className="text-[11px] text-ink-muted">
                                {attachments.length}{" "}
                                {attachments.length === 1
                                    ? t("adjunto", "attachment")
                                    : t("adjuntos", "attachments")}
                            </span>
                        </div>
                        <p className="text-[11px] text-ink-muted">
                            {t(
                                "Puedes adjuntar una accion, habilidad, rasgo, hechizo o cualquier contenido personalizado del objeto.",
                                "Attach an action, ability, trait, spell, or any custom content to this item."
                            )}
                        </p>

                        {attachments.length === 0 ? (
                            <p className="text-[11px] text-ink-muted">
                                {t(
                                    "Aun no has anadido contenido adjunto.",
                                    "No attached content yet."
                                )}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {attachments.map((attachment) => {
                                    const attachmentDescription = getLocalizedText(
                                        attachment.description,
                                        locale
                                    );
                                    return (
                                        <details
                                            key={attachment.id}
                                            className="rounded-lg border border-ring bg-panel/80 p-2"
                                        >
                                            <summary className="cursor-pointer list-none">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-xs font-semibold text-ink">
                                                            {attachment.name}
                                                            {typeof attachment.level === "number"
                                                                ? ` · ${t("Nivel", "Level")} ${attachment.level}`
                                                                : ""}
                                                        </p>
                                                        <p className="text-[11px] text-ink-muted">
                                                            {getAttachmentTypeLabel(
                                                                attachment.type,
                                                                locale
                                                            )}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            removeAttachment(attachment.id);
                                                        }}
                                                        className="text-[10px] px-2 py-1 rounded-md border border-red-400/70 text-red-600 bg-red-50 hover:bg-red-100"
                                                    >
                                                        {t("Eliminar", "Delete")}
                                                    </button>
                                                </div>
                                            </summary>
                                            {attachmentDescription && (
                                                <div className="mt-2">
                                                    <Markdown
                                                        content={attachmentDescription}
                                                        className="text-ink-muted text-xs"
                                                    />
                                                </div>
                                            )}
                                        </details>
                                    );
                                })}
                            </div>
                        )}

                        <div className="grid gap-2 md:grid-cols-3">
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">
                                    {t("Tipo", "Type")}
                                </label>
                                <select
                                    value={attachmentType}
                                    onChange={(event) =>
                                        setAttachmentType(
                                            event.target.value as ItemAttachmentEntry["type"]
                                        )
                                    }
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                >
                                    {ATTACHMENT_TYPE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {t(option.es, option.en)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">
                                    {t("Nombre", "Name")}
                                </label>
                                <input
                                    value={attachmentName}
                                    onChange={(event) => setAttachmentName(event.target.value)}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                    placeholder={t(
                                        "Ej. Robar una carta",
                                        "e.g. Draw a card"
                                    )}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">
                                    {t("Nivel (opcional)", "Level (optional)")}
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={20}
                                    value={attachmentLevel}
                                    onChange={(event) =>
                                        setAttachmentLevel(event.target.value)
                                    }
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                    placeholder={
                                        attachmentType === "cantrip" ? "0" : "1"
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] text-ink-muted">
                                {t("Descripcion (Markdown)", "Description (Markdown)")}
                            </label>
                            <textarea
                                value={attachmentDescription}
                                onChange={(event) =>
                                    setAttachmentDescription(event.target.value)
                                }
                                rows={4}
                                className="w-full rounded-md bg-white/90 border border-ring px-3 py-2 text-xs text-ink outline-none focus:border-accent"
                                placeholder={t(
                                    "Ej. Robar una carta: tira 1d20 y aplica el resultado.",
                                    "e.g. Draw one card: roll 1d20 and apply the result."
                                )}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={addAttachment}
                            className="text-[11px] px-3 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                        >
                            {t("Anadir adjunto", "Add attachment")}
                        </button>
                    </div>

                    <details className="rounded-xl border border-ring bg-white/80 p-3" open={advancedOpen}>
                        <summary
                            className="cursor-pointer text-xs text-ink-muted"
                            onClick={(event) => {
                                event.preventDefault();
                                setAdvancedOpen((prev) => !prev);
                            }}
                        >
                            {t("Campos avanzados", "Advanced fields")}
                        </summary>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">{t("Cantidad", "Quantity")}</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    min={0}
                                    onChange={(event) => setQuantity(Number(event.target.value) || 0)}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">{t("Rareza", "Rarity")}</label>
                                <input
                                    value={rarity}
                                    onChange={(event) => setRarity(event.target.value)}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">Tags</label>
                                <input
                                    value={tags}
                                    onChange={(event) => setTags(event.target.value)}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                    placeholder={t("magico, raro, fuego", "magic, rare, fire")}
                                />
                            </div>
                        </div>
                    </details>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-ring bg-panel/80 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-ink">{t("Equipados", "Equipped")}</h4>
                        <span className="text-[11px] text-ink-muted">
                            {equippedItems.length} {equippedItems.length === 1 ? t("objeto", "item") : t("objetos", "items")}
                        </span>
                    </div>
                    {equippedItems.length === 0 ? (
                        <p className="text-xs text-ink-muted">{t("No hay objetos equipados.", "No equipped items.")}</p>
                    ) : (
                        <div className="space-y-2">
                            {equippedItems.map((item) => {
                                const desc = getLocalizedText(item.description, locale);
                                const mods = Array.isArray(item.modifiers) ? item.modifiers : [];
                                const itemAttachments = Array.isArray(item.attachments)
                                    ? item.attachments
                                    : [];
                                return (
                                    <details
                                        key={item.id}
                                        draggable
                                        onDragStart={(event) => onDragStart(event, item.id)}
                                        onDragOver={(event) => onDragOver(event, item.id)}
                                        onDrop={(event) => onDrop(event, item.id)}
                                        onDragEnd={() => {
                                            setDraggingId(null);
                                            setDragOverId(null);
                                        }}
                                        className={`rounded-xl border bg-white/80 p-3 ${
                                            dragOverId === item.id ? "border-accent bg-accent/10" : "border-ring"
                                        } ${draggingId === item.id ? "opacity-60" : ""}`}
                                        title={t("Arrastra para ordenar", "Drag to reorder")}
                                    >
                                        <summary className="cursor-pointer list-none">
                                            <p className="text-sm font-semibold text-ink">{item.name}</p>
                                            <p className="text-[11px] text-ink-muted">
                                                {t(CATEGORY_LABELS[item.category]?.es ?? "Objeto", CATEGORY_LABELS[item.category]?.en ?? "Item")}
                                            </p>
                                        </summary>
                                        {mods.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {mods.map((mod, index) => (
                                                    <span
                                                        key={`${mod.target}-${index}`}
                                                        className="text-[10px] px-2 py-0.5 rounded-full border border-ring text-ink"
                                                    >
                                                        {getTargetLabel(mod.target, locale)}{" "}
                                                        {mod.value >= 0 ? `+${mod.value}` : mod.value}
                                                        {mod.note ? ` · ${mod.note}` : ""}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {desc && <Markdown content={desc} className="mt-2 text-ink-muted text-xs" />}
                                        {itemAttachments.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                <p className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                                                    {t("Adjuntos", "Attachments")}
                                                </p>
                                                {itemAttachments.map((attachment) => {
                                                    const attachmentDescription =
                                                        getLocalizedText(
                                                            attachment.description,
                                                            locale
                                                        );
                                                    return (
                                                        <div
                                                            key={attachment.id}
                                                            className="rounded-md border border-ring bg-panel/70 p-2"
                                                        >
                                                            <p className="text-xs font-semibold text-ink">
                                                                {attachment.name}
                                                                {typeof attachment.level === "number"
                                                                    ? ` · ${t("Nivel", "Level")} ${attachment.level}`
                                                                    : ""}
                                                            </p>
                                                            <p className="text-[11px] text-ink-muted">
                                                                {getAttachmentTypeLabel(
                                                                    attachment.type,
                                                                    locale
                                                                )}
                                                            </p>
                                                            {attachmentDescription && (
                                                                <Markdown
                                                                    content={attachmentDescription}
                                                                    className="mt-1 text-ink-muted text-xs"
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </details>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-ring bg-panel/80 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-ink">{t("Inventario", "Inventory")}</h4>
                        <span className="text-[11px] text-ink-muted">
                            {items.length} {items.length === 1 ? t("objeto", "item") : t("objetos", "items")}
                        </span>
                    </div>
                    {items.length === 0 ? (
                        <p className="text-xs text-ink-muted">{t("No has anadido objetos.", "No items added.")}</p>
                    ) : (
                        <div className="space-y-2">
                            {items.map((item) => {
                                const desc = getLocalizedText(item.description, locale);
                                const mods = Array.isArray(item.modifiers) ? item.modifiers : [];
                                const itemAttachments = Array.isArray(item.attachments)
                                    ? item.attachments
                                    : [];
                                return (
                                    <details
                                        key={item.id}
                                        draggable
                                        onDragStart={(event) => onDragStart(event, item.id)}
                                        onDragOver={(event) => onDragOver(event, item.id)}
                                        onDrop={(event) => onDrop(event, item.id)}
                                        onDragEnd={() => {
                                            setDraggingId(null);
                                            setDragOverId(null);
                                        }}
                                        className={`rounded-xl border bg-white/80 p-3 ${
                                            dragOverId === item.id ? "border-accent bg-accent/10" : "border-ring"
                                        } ${draggingId === item.id ? "opacity-60" : ""}`}
                                        title={t("Arrastra para ordenar", "Drag to reorder")}
                                    >
                                        <summary className="cursor-pointer list-none">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-semibold text-ink">{item.name}</p>
                                                    <p className="text-[11px] text-ink-muted">
                                                        {t(CATEGORY_LABELS[item.category]?.es ?? "Objeto", CATEGORY_LABELS[item.category]?.en ?? "Item")}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.equippable && (
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                toggleEquip(item.id);
                                                            }}
                                                            className="text-[10px] px-2 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                                                        >
                                                            {item.equipped ? t("Desequipar", "Unequip") : t("Equipar", "Equip")}
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            openEditItem(item);
                                                        }}
                                                        className="text-[10px] px-2 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                                                    >
                                                        {t("Editar", "Edit")}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            removeItem(item.id);
                                                        }}
                                                        className="text-[10px] px-2 py-1 rounded-md border border-red-400/70 text-red-600 bg-red-50 hover:bg-red-100"
                                                    >
                                                        {t("Eliminar", "Delete")}
                                                    </button>
                                                </div>
                                            </div>
                                        </summary>
                                        {mods.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {mods.map((mod, index) => (
                                                    <span
                                                        key={`${mod.target}-${index}`}
                                                        className="text-[10px] px-2 py-0.5 rounded-full border border-ring text-ink"
                                                    >
                                                        {getTargetLabel(mod.target, locale)}{" "}
                                                        {mod.value >= 0 ? `+${mod.value}` : mod.value}
                                                        {mod.note ? ` · ${mod.note}` : ""}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {desc && <Markdown content={desc} className="mt-2 text-ink-muted text-xs" />}
                                        {itemAttachments.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                <p className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                                                    {t("Adjuntos", "Attachments")}
                                                </p>
                                                {itemAttachments.map((attachment) => {
                                                    const attachmentDescription =
                                                        getLocalizedText(
                                                            attachment.description,
                                                            locale
                                                        );
                                                    return (
                                                        <div
                                                            key={attachment.id}
                                                            className="rounded-md border border-ring bg-panel/70 p-2"
                                                        >
                                                            <p className="text-xs font-semibold text-ink">
                                                                {attachment.name}
                                                                {typeof attachment.level === "number"
                                                                    ? ` · ${t("Nivel", "Level")} ${attachment.level}`
                                                                    : ""}
                                                            </p>
                                                            <p className="text-[11px] text-ink-muted">
                                                                {getAttachmentTypeLabel(
                                                                    attachment.type,
                                                                    locale
                                                                )}
                                                            </p>
                                                            {attachmentDescription && (
                                                                <Markdown
                                                                    content={attachmentDescription}
                                                                    className="mt-1 text-ink-muted text-xs"
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </details>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
