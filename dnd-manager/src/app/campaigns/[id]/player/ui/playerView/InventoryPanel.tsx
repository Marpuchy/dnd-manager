"use client";

import React from "react";
import { Details } from "../../playerShared";

/* ---------------------------
   Tipos locales (idénticos a CharacterView)
--------------------------- */
type AbilityKey = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";
type ItemModifier = { ability: AbilityKey; modifier: number };

type InventoryItem = {
    name: string;
    type?: string;
    description?: string;
    ability?: AbilityKey;
    modifier?: number;
    modifiers?: ItemModifier[];
};

type ParsedInventoryLine =
    | { kind: "json"; item: InventoryItem; raw: string }
    | { kind: "text"; raw: string };

/* ---------------------------
   Helpers (copiados tal cual)
--------------------------- */
function parseInventoryLineForView(line: string): ParsedInventoryLine {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) return { kind: "text", raw: trimmed };
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

function renderInventorySection(rawText?: string | null) {
    const text = rawText ?? "";
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    if (lines.length === 0) {
        return (
            <p className="text-xs text-zinc-500">
                No se ha registrado información en esta sección.
            </p>
        );
    }

    const parsed = lines.map(parseInventoryLineForView);
    const hasJson = parsed.some((p) => p.kind === "json");

    if (!hasJson) {
        return (
            <pre className="whitespace-pre-wrap text-sm text-zinc-300">
                {text}
            </pre>
        );
    }

    return (
        <ul className="space-y-1 text-sm text-zinc-200">
            {parsed.map((entry, index) => {
                if (entry.kind === "text") {
                    return (
                        <li
                            key={index}
                            className="rounded-md bg-zinc-900 px-2 py-1 border border-zinc-700"
                        >
                            <span className="text-xs break-words">
                                {entry.raw}
                            </span>
                        </li>
                    );
                }

                const { item } = entry;

                const simpleModifierLabel =
                    item.ability && typeof item.modifier === "number"
                        ? `${item.ability} ${
                            item.modifier >= 0
                                ? `+${item.modifier}`
                                : item.modifier
                        }`
                        : null;

                const multiLabels: string[] = Array.isArray(item.modifiers)
                    ? item.modifiers
                        .filter(
                            (m) =>
                                m &&
                                m.ability &&
                                typeof m.modifier === "number"
                        )
                        .map(
                            (m) =>
                                `${m.ability} ${
                                    m.modifier >= 0
                                        ? `+${m.modifier}`
                                        : m.modifier
                                }`
                        )
                    : [];

                return (
                    <li
                        key={index}
                        className="rounded-md bg-zinc-900 px-2 py-2 border border-zinc-700"
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold break-words">
                                {item.name}
                            </span>

                            {item.type && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-600 text-zinc-300">
                                    {item.type}
                                </span>
                            )}

                            {simpleModifierLabel && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-600 text-emerald-300">
                                    {simpleModifierLabel}
                                </span>
                            )}

                            {multiLabels.map((label, i) => (
                                <span
                                    key={i}
                                    className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-600 text-emerald-300"
                                >
                                    {label}
                                </span>
                            ))}
                        </div>

                        {item.description && (
                            <p className="text-[11px] text-zinc-400 whitespace-pre-wrap mt-1">
                                {item.description}
                            </p>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

/* ---------------------------
   COMPONENT
--------------------------- */
type InventoryPanelProps = {
    details: Details;
};

export default function InventoryPanel({ details }: InventoryPanelProps) {
    const inventoryText = details.inventory ?? "";
    const equipmentText = details.equipment ?? "";
    const weaponsExtraText = details.weaponsExtra ?? "";
    const notesText = details.notes ?? "";

    return (
        <div className="space-y-4">
            <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                <h3 className="text-sm font-semibold text-zinc-200">
                    Inventario / Mochila
                </h3>
                {renderInventorySection(inventoryText)}
            </div>

            <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                <h3 className="text-sm font-semibold text-zinc-200">
                    Equipamiento adicional
                </h3>
                {renderInventorySection(equipmentText)}
            </div>

            <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                <h3 className="text-sm font-semibold text-zinc-200">
                    Armas adicionales
                </h3>
                {renderInventorySection(weaponsExtraText)}
            </div>

            <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                <h3 className="text-sm font-semibold text-zinc-200">
                    Notas del personaje
                </h3>
                {notesText ? (
                    <pre className="whitespace-pre-wrap text-sm text-zinc-300">
                        {notesText}
                    </pre>
                ) : (
                    <p className="text-xs text-zinc-500">
                        No hay notas guardadas.
                    </p>
                )}
            </div>
        </div>
    );
}
