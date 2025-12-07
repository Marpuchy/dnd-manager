// src/app/campaigns/[id]/player/sections/InventorySections.tsx
import { useState, DragEvent } from "react";
import { TextareaField } from "../ui/FormFields";

type AbilityKey = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";

const abilityKeyToLabelEs: Record<AbilityKey, string> = {
    STR: "FUE",
    DEX: "DES",
    CON: "CON",
    INT: "INT",
    WIS: "SAB",
    CHA: "CAR",
};

type InventoryItem = {
    name: string;
    type?: string;
    description?: string;
    ability?: AbilityKey;
    modifier?: number;
};

type InventorySectionId = "inventory" | "equipment" | "weapons";

type ParsedInventoryLine =
    | { kind: "json"; item: InventoryItem; raw: string }
    | { kind: "text"; raw: string };

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
};

// ─────────────────────────────────────────────
//   Parser de línea de inventario (JSON / texto)
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

// ─────────────────────────────────────────────
//   ListEditor: editor de listado con support JSON + drag&drop
// ─────────────────────────────────────────────
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
            // ignorar
        }
    }

    // Preview del modificador
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
            ? "text-zinc-300"
            : previewModifierNumber >= 0
                ? "text-emerald-300 bg-emerald-900/20"
                : "text-red-300 bg-red-900/20";

    return (
        <div
            className="border border-zinc-800 rounded-lg p-3 space-y-3 bg-zinc-950/60"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <h3 className="text-sm font-semibold text-sky-200">{label}</h3>

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

            {isFormOpen && (
                <div className="mt-2 border border-zinc-700 rounded-md p-3 space-y-3 bg-zinc-950/80">
                    <p className="text-xs text-zinc-400">
                        {editingIndex === null ? "Nuevo elemento" : "Editar elemento"}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs text-purple-200">Nombre *</label>
                            <input
                                type="text"
                                value={itemName}
                                onChange={(e) => setItemName(e.target.value)}
                                className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs outline-none focus:border-purple-500"
                                placeholder="Espada larga, Poción de vida..."
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-purple-200">Tipo</label>
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
                        <label className="text-xs text-purple-200">Descripción</label>
                        <textarea
                            value={itemDescription}
                            onChange={(e) => setItemDescription(e.target.value)}
                            className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs outline-none focus:border-purple-500 min-h-[60px]"
                            placeholder="Propiedades, usos, notas..."
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs text-purple-200">
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
                                <option value="STR">Fuerza (FUE)</option>
                                <option value="DEX">Destreza (DES)</option>
                                <option value="CON">Constitución (CON)</option>
                                <option value="INT">Inteligencia (INT)</option>
                                <option value="WIS">Sabiduría (SAB)</option>
                                <option value="CHA">Carisma (CAR)</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-purple-200">Modificador</label>
                            <input
                                type="number"
                                value={abilityModifier}
                                onChange={(e) => setAbilityModifier(e.target.value)}
                                className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs outline-none focus:border-purple-500"
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
//   Componente principal de la sección
// ─────────────────────────────────────────────

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
        </section>
    );
}
