"use client";

import React, { useMemo, useState } from "react";
import type { CharacterItem, ItemCategory, ItemModifier } from "@/lib/types/dnd";
import {
    MODIFIER_TARGETS,
    buildItemBase,
    getLocalizedText,
    normalizeLocalizedText,
    normalizeTarget,
} from "@/lib/character/items";
import Markdown from "@/app/components/Markdown";
import { getClientLocale } from "@/lib/i18n/getClientLocale";

const CATEGORY_LABELS: Record<ItemCategory, string> = {
    weapon: "Arma",
    armor: "Armadura",
    accessory: "Accesorio",
    consumable: "Consumible",
    tool: "Herramienta",
    misc: "Misceláneo",
};

const targetLabelMap = new Map(
    MODIFIER_TARGETS.map((entry) => [entry.key, entry.label])
);

function getTargetLabel(target: string) {
    const normalized = normalizeTarget(target);
    return targetLabelMap.get(normalized) ?? target;
}

type ItemManagerSectionProps = {
    items: CharacterItem[];
    setItems: (items: CharacterItem[]) => void;
};

export default function ItemManagerSection({
                                               items,
                                               setItems,
                                           }: ItemManagerSectionProps) {
    const locale = getClientLocale();
    const equippedItems = useMemo(
        () => items.filter((item) => item.equipped),
        [items]
    );

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
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    function applyItemOrder(list: CharacterItem[]) {
        return list.map((item, index) => ({
            ...item,
            sortOrder: index,
        }));
    }

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
    }

    function openNewItem() {
        resetForm();
        setIsFormOpen(true);
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
                ? (items.find((entry) => entry.id === editingId) ??
                    buildItemBase(trimmed, category))
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
        };

        if (editingId) {
            const next = items.map((entry) => (entry.id === editingId ? item : entry));
            setItems(applyItemOrder(next));
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

    function handleDragStart(event: React.DragEvent, id: string) {
        setDraggingId(id);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
    }

    function handleDragOver(event: React.DragEvent, id: string) {
        event.preventDefault();
        if (id !== dragOverId) setDragOverId(id);
    }

    function handleDrop(event: React.DragEvent, id: string) {
        event.preventDefault();
        const sourceId = draggingId ?? event.dataTransfer.getData("text/plain");
        if (!sourceId || sourceId === id) {
            setDragOverId(null);
            return;
        }

        const fromIndex = items.findIndex((entry) => entry.id === sourceId);
        const toIndex = items.findIndex((entry) => entry.id === id);
        if (fromIndex === -1 || toIndex === -1) {
            setDragOverId(null);
            return;
        }

        const next = [...items];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        setItems(applyItemOrder(next));
        setDraggingId(null);
        setDragOverId(null);
    }

    function handleDragEnd() {
        setDraggingId(null);
        setDragOverId(null);
    }

    function addModifier() {
        const value = Number(modValue);
        if (Number.isNaN(value)) return;
        const target = modTarget.trim();
        if (!target) return;
        setModifiers([
            ...modifiers,
            {
                target,
                value,
                note: modNote.trim() || undefined,
            },
        ]);
        setModValue("1");
        setModNote("");
    }

    function removeModifier(index: number) {
        setModifiers(modifiers.filter((_, i) => i !== index));
    }

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="text-sm font-semibold text-ink">Inventario y equipamiento</h3>
                    <p className="text-[11px] text-ink-muted">
                        Todo está en objetos. Los modificadores solo aplican si el objeto está equipado.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openNewItem}
                    className="text-xs px-3 py-1 rounded-md border border-accent/60 bg-accent/10 hover:bg-accent/20"
                >
                    Añadir objeto
                </button>
            </div>

            {isFormOpen && (
                <div className="rounded-2xl border border-ring bg-panel/80 p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-ink">
                            {editingId ? "Editar objeto" : "Nuevo objeto"}
                        </h4>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsFormOpen(false);
                                    resetForm();
                                }}
                                className="text-[11px] px-3 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={saveItem}
                                className="text-[11px] px-3 py-1 rounded-md border border-emerald-500/60 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-xs text-ink-muted">Nombre</label>
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-ink-muted">Categoría</label>
                            <select
                                value={category}
                                onChange={(event) =>
                                    setCategory(event.target.value as ItemCategory)
                                }
                                className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                            >
                                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
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
                            Es equipable
                        </label>
                        <label className="flex items-center gap-2 text-xs text-ink-muted">
                            <input
                                type="checkbox"
                                checked={equipped}
                                disabled={!equippable}
                                onChange={(event) => setEquipped(event.target.checked)}
                            />
                            Está equipado
                        </label>
                    </div>

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

                    <div className="rounded-xl border border-ring bg-white/80 p-3 space-y-2">
                        <p className="text-xs font-semibold text-ink">Modificadores</p>
                        {modifiers.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {modifiers.map((mod, index) => (
                                    <span
                                        key={`${mod.target}-${index}`}
                                        className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                            mod.value >= 0
                                                ? "border-emerald-500/50 text-emerald-700 bg-emerald-50"
                                                : "border-rose-500/50 text-rose-700 bg-rose-50"
                                        }`}
                                    >
                                        {getTargetLabel(mod.target)}{" "}
                                        {mod.value >= 0 ? `+${mod.value}` : mod.value}
                                        {mod.note ? ` · ${mod.note}` : ""}
                                        <button
                                            type="button"
                                            onClick={() => removeModifier(index)}
                                            className="ml-2 text-[10px] text-ink-muted hover:text-ink"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[11px] text-ink-muted">
                                Aún no hay modificadores.
                            </p>
                        )}

                        <div className="grid gap-2 md:grid-cols-3">
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">Destino</label>
                                <input
                                    list="modifier-targets"
                                    value={modTarget}
                                    onChange={(event) => setModTarget(event.target.value)}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                />
                                <datalist id="modifier-targets">
                                    {MODIFIER_TARGETS.map((target) => (
                                        <option key={target.key} value={target.key}>
                                            {target.label}
                                        </option>
                                    ))}
                                </datalist>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">Valor</label>
                                <input
                                    type="number"
                                    value={modValue}
                                    onChange={(event) => setModValue(event.target.value)}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">Nota</label>
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
                            Añadir modificador
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
                            Campos avanzados
                        </summary>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">Cantidad</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    min={0}
                                    onChange={(event) => setQuantity(Number(event.target.value) || 0)}
                                    className="w-full rounded-md bg-white/90 border border-ring px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-ink-muted">Rareza</label>
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
                                    placeholder="mágico, raro, fuego"
                                />
                            </div>
                        </div>
                    </details>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-ring bg-panel/80 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-ink">Equipados</h4>
                        <span className="text-[11px] text-ink-muted">
                            {equippedItems.length} objeto{equippedItems.length === 1 ? "" : "s"}
                        </span>
                    </div>
                    {equippedItems.length === 0 ? (
                        <p className="text-xs text-ink-muted">No hay objetos equipados.</p>
                    ) : (
                        <div className="space-y-2">
                            {equippedItems.map((item) => {
                                const desc = getLocalizedText(item.description, locale);
                                const mods = Array.isArray(item.modifiers) ? item.modifiers : [];
                                return (
                                    <details
                                        key={item.id}
                                        draggable
                                        onDragStart={(event) => handleDragStart(event, item.id)}
                                        onDragOver={(event) => handleDragOver(event, item.id)}
                                        onDrop={(event) => handleDrop(event, item.id)}
                                        onDragEnd={handleDragEnd}
                                        className={`rounded-xl border bg-white/80 p-3 ${
                                            dragOverId === item.id
                                                ? "border-accent bg-accent/10"
                                                : "border-ring"
                                        } ${draggingId === item.id ? "opacity-60" : ""}`}
                                        title="Arrastra para ordenar"
                                    >
                                        <summary className="cursor-pointer list-none">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-semibold text-ink">{item.name}</p>
                                                    <p className="text-[11px] text-ink-muted">
                                                        {CATEGORY_LABELS[item.category] ?? "Objeto"}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/50 text-emerald-700 bg-emerald-50">
                                                    Equipado
                                                </span>
                                            </div>
                                        </summary>
                                        <div className="mt-2 space-y-2 text-xs text-ink-muted">
                                            {mods.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {mods.map((mod, index) => (
                                                        <span
                                                            key={`${mod.target}-${index}`}
                                                            className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                                                mod.value >= 0
                                                                    ? "border-emerald-500/50 text-emerald-700 bg-emerald-50"
                                                                    : "border-rose-500/50 text-rose-700 bg-rose-50"
                                                            }`}
                                                        >
                                                            {getTargetLabel(mod.target)}{" "}
                                                            {mod.value >= 0 ? `+${mod.value}` : mod.value}
                                                            {mod.note ? ` · ${mod.note}` : ""}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {desc && (
                                                <Markdown content={desc} className="text-ink-muted text-xs" />
                                            )}
                                        </div>
                                    </details>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-ring bg-panel/80 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-ink">Inventario</h4>
                        <span className="text-[11px] text-ink-muted">
                            {items.length} objeto{items.length === 1 ? "" : "s"}
                        </span>
                    </div>
                    {items.length === 0 ? (
                        <p className="text-xs text-ink-muted">No has añadido objetos.</p>
                    ) : (
                        <div className="space-y-2">
                            {items.map((item) => {
                                const desc = getLocalizedText(item.description, locale);
                                const mods = Array.isArray(item.modifiers) ? item.modifiers : [];
                                return (
                                    <details
                                        key={item.id}
                                        draggable
                                        onDragStart={(event) => handleDragStart(event, item.id)}
                                        onDragOver={(event) => handleDragOver(event, item.id)}
                                        onDrop={(event) => handleDrop(event, item.id)}
                                        onDragEnd={handleDragEnd}
                                        className={`rounded-xl border bg-white/80 p-3 ${
                                            dragOverId === item.id
                                                ? "border-accent bg-accent/10"
                                                : "border-ring"
                                        } ${draggingId === item.id ? "opacity-60" : ""}`}
                                        title="Arrastra para ordenar"
                                    >
                                        <summary className="cursor-pointer list-none">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-semibold text-ink">{item.name}</p>
                                                    <p className="text-[11px] text-ink-muted">
                                                        {CATEGORY_LABELS[item.category] ?? "Objeto"}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {item.equippable && (
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                toggleEquip(item.id);
                                                            }}
                                                            className="text-[10px] px-2 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                                                        >
                                                            {item.equipped ? "Desequipar" : "Equipar"}
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
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            removeItem(item.id);
                                                        }}
                                                        className="text-[10px] px-2 py-1 rounded-md border border-red-400/70 text-red-600 bg-red-50 hover:bg-red-100"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                            {item.equipped && (
                                                <span className="mt-2 inline-flex text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/50 text-emerald-700 bg-emerald-50">
                                                    Equipado
                                                </span>
                                            )}
                                        </summary>
                                        <div className="mt-2 space-y-2 text-xs text-ink-muted">
                                            {mods.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {mods.map((mod, index) => (
                                                        <span
                                                            key={`${mod.target}-${index}`}
                                                            className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                                                mod.value >= 0
                                                                    ? "border-emerald-500/50 text-emerald-700 bg-emerald-50"
                                                                    : "border-rose-500/50 text-rose-700 bg-rose-50"
                                                            }`}
                                                        >
                                                            {getTargetLabel(mod.target)}{" "}
                                                            {mod.value >= 0 ? `+${mod.value}` : mod.value}
                                                            {mod.note ? ` · ${mod.note}` : ""}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {desc && (
                                                <Markdown content={desc} className="text-ink-muted text-xs" />
                                            )}
                                        </div>
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
