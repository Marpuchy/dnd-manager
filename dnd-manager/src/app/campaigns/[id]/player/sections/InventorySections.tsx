// src/app/campaigns/[id]/player/sections/InventorySections.tsx
import { useState, DragEvent } from "react";
import { MarkdownField } from "../ui/FormFields";
import type { AbilityKey } from "@/lib/types/dnd";
import {
    parseInventoryLine,
    type InventoryItem,
    type ParsedInventoryLine,
} from "@/lib/character/inventoryParser";

const abilityKeyToLabelEs: Record<AbilityKey, string> = {
    STR: "FUE",
    DEX: "DES",
    CON: "CON",
    INT: "INT",
    WIS: "SAB",
    CHA: "CAR",
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

type InventorySectionsProps = {
    inventory: string;
    setInventory: (v: string) => void;
    equipment: string;
    setEquipment: (v: string) => void;
    weaponsExtra: string;
    setWeaponsExtra: (v: string) => void;
    abilities: string;
    setAbilities: (v: string) => void;
    notes: string;
    setNotes: (v: string) => void;
    background?: string;
    setBackground?: (v: string) => void;
    alignment?: string;
    setAlignment?: (v: string) => void;
    personalityTraits?: string;
    setPersonalityTraits?: (v: string) => void;
    ideals?: string;
    setIdeals?: (v: string) => void;
    bonds?: string;
    setBonds?: (v: string) => void;
    flaws?: string;
    setFlaws?: (v: string) => void;
};

type ItemModifier = { ability: AbilityKey; modifier: number; note?: string };

function splitList(raw: string): string[] {
    return raw
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
}

function splitLines(raw: string): string[] {
    return raw
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);
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

    const [itemQuantity, setItemQuantity] = useState<string>("");
    const [itemRarity, setItemRarity] = useState("");
    const [itemAttunement, setItemAttunement] = useState<"none" | "required" | "custom">("none");
    const [itemAttunementText, setItemAttunementText] = useState("");
    const [itemWeight, setItemWeight] = useState<string>("");
    const [itemValue, setItemValue] = useState("");
    const [itemCharges, setItemCharges] = useState<string>("");
    const [itemSlot, setItemSlot] = useState("");
    const [itemSource, setItemSource] = useState("");
    const [itemTags, setItemTags] = useState("");
    const [itemProperties, setItemProperties] = useState("");
    const [itemEffects, setItemEffects] = useState("");

    const [extraModifiers, setExtraModifiers] = useState<ItemModifier[]>([]);
    const [newModAbility, setNewModAbility] = useState<AbilityKey>("STR");
    const [newModValue, setNewModValue] = useState<string>("1");
    const [newModNote, setNewModNote] = useState("");

    const [advancedOpen, setAdvancedOpen] = useState(false);

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
        setItemQuantity("");
        setItemRarity("");
        setItemAttunement("none");
        setItemAttunementText("");
        setItemWeight("");
        setItemValue("");
        setItemCharges("");
        setItemSlot("");
        setItemSource("");
        setItemTags("");
        setItemProperties("");
        setItemEffects("");
        setExtraModifiers([]);
        setNewModAbility("STR");
        setNewModValue("1");
        setNewModNote("");
        setEditingIndex(null);
        setAdvancedOpen(false);
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
            setItemQuantity(item.quantity != null ? String(item.quantity) : "");
            setItemRarity(item.rarity ?? "");
            setItemWeight(item.weight != null ? String(item.weight) : "");
            setItemValue(item.value ?? "");
            setItemCharges(item.charges != null ? String(item.charges) : "");
            setItemSlot(item.slot ?? "");
            setItemSource(item.source ?? "");
            setItemTags(Array.isArray(item.tags) ? item.tags.join(", ") : "");
            setItemProperties(Array.isArray(item.properties) ? item.properties.join(", ") : "");
            setItemEffects(Array.isArray(item.effects) ? item.effects.join("\n") : "");
            if (item.attunement) {
                if (typeof item.attunement === "string") {
                    setItemAttunement("custom");
                    setItemAttunementText(item.attunement);
                } else {
                    setItemAttunement("required");
                }
            } else {
                setItemAttunement("none");
                setItemAttunementText("");
            }
            setExtraModifiers(Array.isArray(item.modifiers) ? item.modifiers : []);
        } else {
            setItemName(entry.raw);
        }

        setIsFormOpen(true);
    }

    function handleRemoveItem(index: number) {
        const remaining = lines.filter((_, i) => i !== index);
        onChange(remaining.join("\n"));
    }

    function addExtraModifier() {
        const numeric = Number(newModValue);
        if (Number.isNaN(numeric)) return;
        const next: ItemModifier = {
            ability: newModAbility,
            modifier: numeric,
            note: newModNote.trim() || undefined,
        };
        setExtraModifiers((prev) => [...prev, next]);
        setNewModValue("1");
        setNewModNote("");
    }

    function removeExtraModifier(index: number) {
        setExtraModifiers((prev) => prev.filter((_, i) => i !== index));
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
                ability = abilityKey as AbilityKey;
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

        const quantityNum = Number(itemQuantity);
        if (!Number.isNaN(quantityNum) && itemQuantity.trim() !== "") {
            item.quantity = quantityNum;
        }

        if (itemRarity.trim()) item.rarity = itemRarity.trim();

        if (itemAttunement === "required") item.attunement = true;
        if (itemAttunement === "custom" && itemAttunementText.trim()) {
            item.attunement = itemAttunementText.trim();
        }

        const weightNum = Number(itemWeight);
        if (!Number.isNaN(weightNum) && itemWeight.trim() !== "") {
            item.weight = weightNum;
        }

        if (itemValue.trim()) item.value = itemValue.trim();

        if (itemCharges.trim()) item.charges = itemCharges.trim();
        if (itemSlot.trim()) item.slot = itemSlot.trim();
        if (itemSource.trim()) item.source = itemSource.trim();

        const tags = splitList(itemTags);
        if (tags.length > 0) item.tags = tags;

        const props = splitList(itemProperties);
        if (props.length > 0) item.properties = props;

        const effects = splitLines(itemEffects);
        if (effects.length > 0) item.effects = effects;

        if (extraModifiers.length > 0) item.modifiers = extraModifiers;

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

    function handleDragStart(event: DragEvent<HTMLLIElement>, index: number) {
        const payload = JSON.stringify({ sectionId, index });
        event.dataTransfer.setData("application/x-dnd-manager-item", payload);
        event.dataTransfer.effectAllowed = "move";
    }

    function handleDragOver(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
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
                onMoveItem(
                    parsed.sectionId as InventorySectionId,
                    parsed.index,
                    sectionId
                );
            }
        } catch {
            // ignore
        }
    }

    const previewAbility =
        abilityKey !== "none" ? abilityKeyToLabelEs[abilityKey as AbilityKey] : null;
    const previewModifierNumber =
        abilityModifier.trim() !== "" && !Number.isNaN(Number(abilityModifier))
            ? Number(abilityModifier)
            : null;

    const previewModifierText =
        previewAbility != null && previewModifierNumber != null
            ? `${previewAbility} ${
                previewModifierNumber >= 0
                    ? `+${previewModifierNumber}`
                    : previewModifierNumber
            }`
            : null;

    const previewModifierClass =
        previewModifierNumber == null
            ? "text-ink-muted"
            : previewModifierNumber >= 0
                ? "text-emerald-700 bg-emerald-50"
                : "text-red-700 bg-red-50";

    return (
        <div
            className="border border-ring rounded-lg p-3 space-y-3 bg-panel/80"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <h3 className="text-sm font-semibold text-ink">{label}</h3>

            {parsedItems.length === 0 ? (
                <p className="text-xs text-ink-muted">
                    No hay elementos añadidos todavía.
                </p>
            ) : (
                <ul className="space-y-1 text-sm text-ink">
                    {parsedItems.map((entry, index) => {
                        if (entry.kind === "text") {
                            return (
                                <li
                                    key={index}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white/80 px-2 py-1 border border-ring"
                                >
                                    <span className="text-xs break-words">{entry.raw}</span>
                                    <div className="flex flex-wrap gap-1">
                                        <button
                                            type="button"
                                            onClick={() => openEditItemForm(index)}
                                            className="text-[10px] px-2 py-0.5 rounded-md border border-ring hover:bg-white/80"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="text-[10px] px-2 py-0.5 rounded-md border border-red-400/70 text-red-600 bg-red-50 hover:bg-red-100"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </li>
                            );
                        }

                        const { item } = entry;
                        const abilityLabel = item.ability
                            ? abilityKeyToLabelEs[item.ability] ?? item.ability
                            : null;
                        const modifierLabel =
                            abilityLabel && typeof item.modifier === "number"
                                ? `${abilityLabel} ${
                                    item.modifier >= 0
                                        ? `+${item.modifier}`
                                        : item.modifier
                                }`
                                : null;

                        return (
                            <li
                                key={index}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                className="flex flex-wrap items-start justify-between gap-2 rounded-md bg-white/80 px-2 py-2 border border-ring"
                            >
                                <div className="flex-1 min-w-[160px] space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-semibold break-words">
                                            {item.name}
                                        </span>
                                        {item.type && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-ring text-ink-muted">
                                                {item.type}
                                            </span>
                                        )}
                                        {modifierLabel && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-400 text-emerald-700 bg-emerald-50">
                                                {modifierLabel}
                                            </span>
                                        )}
                                        {item.rarity && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-400 text-amber-700 bg-amber-50">
                                                {item.rarity}
                                            </span>
                                        )}
                                    </div>
                                    {item.description && (
                                        <p className="text-[11px] text-ink-muted whitespace-pre-wrap">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-1">
                                    <button
                                        type="button"
                                        onClick={() => openEditItemForm(index)}
                                        className="text-[10px] px-2 py-0.5 rounded-md border border-ring hover:bg-white/80"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(index)}
                                        className="text-[10px] px-2 py-0.5 rounded-md border border-red-400/70 text-red-600 bg-red-50 hover:bg-red-100"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {!isFormOpen && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={openNewItemForm}
                        className="text-[11px] px-3 py-1 rounded-md border border-accent/60 hover:bg-accent/10"
                    >
                        Añadir elemento
                    </button>
                </div>
            )}

            {isFormOpen && (
                <div className="mt-2 border border-ring rounded-md p-3 space-y-3 bg-panel/80">
                    <p className="text-xs text-ink-muted">
                        {editingIndex === null ? "Nuevo elemento" : "Editar elemento"}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs text-ink">Nombre *</label>
                            <input
                                type="text"
                                value={itemName}
                                onChange={(e) => setItemName(e.target.value)}
                                className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                placeholder="Espada larga, Poción de vida..."
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-ink">Tipo</label>
                            <input
                                type="text"
                                value={itemType}
                                onChange={(e) => setItemType(e.target.value)}
                                className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                placeholder="Arma, armadura, objeto..."
                            />
                        </div>
                    </div>

                    <MarkdownField
                        label="Descripción (Markdown)"
                        value={itemDescription}
                        onChange={setItemDescription}
                        rows={4}
                        helper="Soporta listas, negrita y enlaces."
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs text-ink">Modifica característica</label>
                            <select
                                value={abilityKey}
                                onChange={(e) =>
                                    setAbilityKey(e.target.value as AbilityKey | "none")
                                }
                                className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                            >
                                <option value="none">Ninguna</option>
                                <option value="STR">Fuerza (FUE)</option>
                                <option value="DEX">Destreza (DES)</option>
                                <option value="CON">Constitución (CON)</option>
                                <option value="INT">Inteligencia (INT)</option>
                                <option value="WIS">Sabiduría (SAB)</option>
                                <option value="CHA">Carisma (CAR)</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-ink">Modificador</label>
                            <input
                                type="number"
                                value={abilityModifier}
                                onChange={(e) => setAbilityModifier(e.target.value)}
                                className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                placeholder="+1, +2, -1..."
                            />
                            {previewModifierText && (
                                <div className="mt-1 flex justify-end">
                                    <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full ${previewModifierClass}`}
                                    >
                                        {previewModifierText}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border border-ring rounded-md p-2 space-y-2">
                        <p className="text-[11px] text-ink-muted">Modificadores adicionales (buffs)</p>

                        {extraModifiers.length > 0 ? (
                            <ul className="space-y-1">
                                {extraModifiers.map((mod, idx) => (
                                    <li key={`${mod.ability}-${idx}`} className="flex items-center justify-between text-[11px]">
                                        <span className="text-ink-muted">
                                            {abilityKeyToLabelEs[mod.ability]} {mod.modifier >= 0 ? `+${mod.modifier}` : mod.modifier}
                                            {mod.note ? ` · ${mod.note}` : ""}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeExtraModifier(idx)}
                                            className="text-[10px] px-2 py-0.5 rounded border border-red-500/70"
                                        >
                                            Quitar
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-[11px] text-ink-muted">Añade buffs pasivos aquí.</p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                            <div>
                                <label className="text-[11px] text-ink-muted">Característica</label>
                                <select
                                    value={newModAbility}
                                    onChange={(e) => setNewModAbility(e.target.value as AbilityKey)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none"
                                >
                                    <option value="STR">Fuerza (FUE)</option>
                                    <option value="DEX">Destreza (DES)</option>
                                    <option value="CON">Constitución (CON)</option>
                                    <option value="INT">Inteligencia (INT)</option>
                                    <option value="WIS">Sabiduría (SAB)</option>
                                    <option value="CHA">Carisma (CAR)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] text-ink-muted">Valor</label>
                                <input
                                    type="number"
                                    value={newModValue}
                                    onChange={(e) => setNewModValue(e.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] text-ink-muted">Nota</label>
                                <input
                                    type="text"
                                    value={newModNote}
                                    onChange={(e) => setNewModNote(e.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none"
                                    placeholder=""
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={addExtraModifier}
                                className="text-[11px] px-3 py-1 rounded-md border border-emerald-400/70 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            >
                                Añadir modificador
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setAdvancedOpen((v) => !v)}
                        className="text-[11px] px-3 py-1 rounded-md border border-ring hover:bg-white/80"
                    >
                        {advancedOpen ? "Ocultar campos avanzados" : "Mostrar campos avanzados"}
                    </button>

                    {advancedOpen && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-ink">Cantidad</label>
                                    <input
                                        type="number"
                                        value={itemQuantity}
                                        onChange={(e) => setItemQuantity(e.target.value)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-ink">Rareza</label>
                                    <input
                                        type="text"
                                        value={itemRarity}
                                        onChange={(e) => setItemRarity(e.target.value)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                        placeholder="Común, poco común, rara..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-ink">Sintonía</label>
                                    <select
                                        value={itemAttunement}
                                        onChange={(e) => setItemAttunement(e.target.value as "none" | "required" | "custom")}
                                        className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                    >
                                        <option value="none">No requiere</option>
                                        <option value="required">Requiere sintonía</option>
                                        <option value="custom">Personalizada...</option>
                                    </select>
                                </div>
                                {itemAttunement === "custom" && (
                                    <div className="space-y-1">
                                        <label className="text-xs text-ink">Detalles de sintonía</label>
                                        <input
                                            type="text"
                                            value={itemAttunementText}
                                            onChange={(e) => setItemAttunementText(e.target.value)}
                                            className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-ink">Peso (lb)</label>
                                    <input
                                        type="number"
                                        value={itemWeight}
                                        onChange={(e) => setItemWeight(e.target.value)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-ink">Valor</label>
                                    <input
                                        type="text"
                                        value={itemValue}
                                        onChange={(e) => setItemValue(e.target.value)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                        placeholder="15 po, 200 gp..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-ink">Cargas</label>
                                    <input
                                        type="text"
                                        value={itemCharges}
                                        onChange={(e) => setItemCharges(e.target.value)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                        placeholder="3/3"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-ink">Slot / Localización</label>
                                    <input
                                        type="text"
                                        value={itemSlot}
                                        onChange={(e) => setItemSlot(e.target.value)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                        placeholder="Manos, mochila..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-ink">Fuente</label>
                                    <input
                                        type="text"
                                        value={itemSource}
                                        onChange={(e) => setItemSource(e.target.value)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-ink">Tags</label>
                                    <input
                                        type="text"
                                        value={itemTags}
                                        onChange={(e) => setItemTags(e.target.value)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                        placeholder="poción, consumible"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-ink">Propiedades</label>
                                    <input
                                        type="text"
                                        value={itemProperties}
                                        onChange={(e) => setItemProperties(e.target.value)}
                                        className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent"
                                        placeholder="ligera, versátil"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-ink">Efectos (uno por línea)</label>
                                <textarea
                                    value={itemEffects}
                                    onChange={(e) => setItemEffects(e.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-2 py-1 text-xs outline-none focus:border-accent min-h-[60px]"
                                    placeholder="Otorga visión en la oscuridad..."
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => {
                                resetForm();
                                setIsFormOpen(false);
                            }}
                            className="text-[11px] px-3 py-1 rounded-md border border-ring hover:bg-white/80"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveItem}
                            className="text-[11px] px-3 py-1 rounded-md border border-emerald-400/70 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        >
                            Guardar elemento
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export function InventorySections({
    inventory,
    setInventory,
    equipment,
    setEquipment,
    weaponsExtra,
    setWeaponsExtra,
    abilities,
    setAbilities,
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
}: InventorySectionsProps) {
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

    return (
        <section className="space-y-4">
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
                <MarkdownField
                    label="Habilidades / Rasgos / Dotes"
                    value={abilities}
                    onChange={setAbilities}
                    helper="Puedes usar Markdown para listas y destacar texto."
                />
            </div>

            <MarkdownField
                label="Notas del personaje"
                value={notes}
                onChange={setNotes}
                helper="Ideal para apuntes de sesión, secretos, etc."
            />

            {(setBackground || setAlignment || setPersonalityTraits || setIdeals || setBonds || setFlaws) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {setBackground && (
                        <MarkdownField
                            label="Trasfondo"
                            value={background ?? ""}
                            onChange={setBackground}
                        />
                    )}
                    {setAlignment && (
                        <MarkdownField
                            label="Alineamiento"
                            value={alignment ?? ""}
                            onChange={setAlignment}
                        />
                    )}
                    {setPersonalityTraits && (
                        <MarkdownField
                            label="Rasgos de personalidad"
                            value={personalityTraits ?? ""}
                            onChange={setPersonalityTraits}
                        />
                    )}
                    {setIdeals && (
                        <MarkdownField
                            label="Ideales"
                            value={ideals ?? ""}
                            onChange={setIdeals}
                        />
                    )}
                    {setBonds && (
                        <MarkdownField
                            label="Vínculos"
                            value={bonds ?? ""}
                            onChange={setBonds}
                        />
                    )}
                    {setFlaws && (
                        <MarkdownField
                            label="Defectos"
                            value={flaws ?? ""}
                            onChange={setFlaws}
                        />
                    )}
                </div>
            )}
        </section>
    );
}

export default InventorySections;




