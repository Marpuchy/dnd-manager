import type { AbilityKey } from "@/lib/types/dnd";

export type InventoryItem = {
    name: string;
    type?: string;
    description?: string;
    rarity?: string;
    attunement?: boolean | string;
    quantity?: number;
    weight?: number;
    value?: string;
    charges?: number | string;
    slot?: string;
    source?: string;
    tags?: string[];
    properties?: string[];
    effects?: string[];
    ability?: AbilityKey;
    modifier?: number;
    modifiers?: { ability: AbilityKey; modifier: number; note?: string }[];
};

export type ParsedInventoryLine =
    | { kind: "json"; item: InventoryItem; raw: string }
    | { kind: "text"; raw: string };

export function parseInventoryLine(line: string): ParsedInventoryLine {
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

export function parseInventoryText(text?: string | null): ParsedInventoryLine[] {
    const raw = text ?? "";
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    return lines.map(parseInventoryLine);
}
