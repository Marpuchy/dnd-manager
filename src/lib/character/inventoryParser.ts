import type { AbilityKey } from "@/lib/types/dnd";

export type InventoryItem = {
    name: string;
    type?: string;
    description?: string;
    ability?: AbilityKey;
    modifier?: number;
    modifiers?: { ability: AbilityKey; modifier: number }[];
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
