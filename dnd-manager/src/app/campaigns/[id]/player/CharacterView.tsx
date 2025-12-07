// src/app/campaigns/[id]/player/CharacterView.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
    Character,
    Details,
    Stats,
    Tab,
    parseSpellLines,
    getPreparedSpellsInfo,
    getClassMagicExtras,
    countPreparedSpells,
    prettyClassLabel,
    LearnedSpellLine,
    SpellMeta,
    normalizeClassForApi,
} from "./playerShared";
import { sumArmorBonus } from "@/lib/dndMath";
import { getSpellSlotsFor } from "@/lib/spellSlots";
import { InfoBox } from "./ui/InfoBox";
import { StatDisplay } from "./ui/StatDisplay";
import { LearnedSpellLevelBlock } from "./LearnedSpellBlocks";

/* ---------------------------
   Tipos y helpers (inventario / bonuses)
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

function parseInventoryLineForView(line: string): ParsedInventoryLine {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) return { kind: "text", raw: trimmed };
    try {
        const parsed = JSON.parse(trimmed) as InventoryItem;
        if (!parsed || typeof parsed !== "object" || !parsed.name) return { kind: "text", raw: trimmed };
        return { kind: "json", item: parsed, raw: trimmed };
    } catch {
        return { kind: "text", raw: trimmed };
    }
}

function accumulateBonus(bonuses: Record<AbilityKey, number>, ability: AbilityKey | undefined, value: unknown) {
    if (!ability) return;
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) return;
    bonuses[ability] += num;
}

function getAbilityBonusesFromDetails(details: Details | undefined): Record<AbilityKey, number> {
    const bonuses: Record<AbilityKey, number> = { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };
    if (!details) return bonuses;

    const textSources = [details.inventory, details.equipment, details.weaponsExtra];
    for (const source of textSources) {
        if (!source) continue;
        const lines = source.split("\n").map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
            const entry = parseInventoryLineForView(line);
            if (entry.kind !== "json") continue;
            const { item } = entry;
            if (item.ability && typeof item.modifier === "number") accumulateBonus(bonuses, item.ability, item.modifier);
            if (Array.isArray(item.modifiers)) {
                for (const mod of item.modifiers) {
                    if (!mod) continue;
                    accumulateBonus(bonuses, mod.ability as AbilityKey | undefined, mod.modifier);
                }
            }
        }
    }

    if (Array.isArray(details.armors)) {
        for (const armor of details.armors as any[]) {
            if (!armor) continue;
            if (armor.statAbility) accumulateBonus(bonuses, armor.statAbility as AbilityKey | undefined, armor.statModifier);
            if (armor.ability && typeof armor.modifier === "number") accumulateBonus(bonuses, armor.ability as AbilityKey | undefined, armor.modifier);
            if (Array.isArray(armor.modifiers)) {
                for (const mod of armor.modifiers as any[]) {
                    if (!mod) continue;
                    accumulateBonus(bonuses, mod.ability as AbilityKey | undefined, mod.modifier);
                }
            }
        }
    }

    const w = (details as any)?.weaponEquipped;
    if (w) {
        if (w.statAbility) accumulateBonus(bonuses, w.statAbility as AbilityKey | undefined, w.statModifier);
        if (w.ability && typeof w.modifier === "number") accumulateBonus(bonuses, w.ability as AbilityKey | undefined, w.modifier);
        if (Array.isArray(w.modifiers)) {
            for (const mod of w.modifiers as any[]) {
                if (!mod) continue;
                accumulateBonus(bonuses, mod.ability as AbilityKey | undefined, mod.modifier);
            }
        }
    }

    return bonuses;
}

/* ---------------------------
   Render inventario
   --------------------------- */
function renderInventorySection(label: string, rawText?: string | null) {
    const text = rawText ?? "";
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return <p className="text-xs text-zinc-500">No se ha registrado información en esta sección.</p>;

    const parsed = lines.map(parseInventoryLineForView);
    const hasJson = parsed.some((p) => p.kind === "json");
    if (!hasJson) return <pre className="whitespace-pre-wrap text-sm text-zinc-300">{text}</pre>;

    return (
        <ul className="space-y-1 text-sm text-zinc-200">
            {parsed.map((entry, index) => {
                if (entry.kind === "text") {
                    return (
                        <li key={index} className="rounded-md bg-zinc-900 px-2 py-1 border border-zinc-700">
                            <span className="text-xs break-words">{entry.raw}</span>
                        </li>
                    );
                }
                const { item } = entry;
                const simpleModifierLabel = item.ability && typeof item.modifier === "number" ? `${item.ability} ${item.modifier >= 0 ? `+${item.modifier}` : item.modifier}` : null;
                const multiLabels: string[] = Array.isArray(item.modifiers)
                    ? item.modifiers.filter((m) => m && m.ability && typeof m.modifier === "number").map((m) => `${m.ability} ${m.modifier >= 0 ? `+${m.modifier}` : m.modifier}`)
                    : [];

                return (
                    <li key={index} className="rounded-md bg-zinc-900 px-2 py-2 border border-zinc-700">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold break-words">{item.name}</span>
                            {item.type && <span className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-600 text-zinc-300">{item.type}</span>}
                            {simpleModifierLabel && <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-600 text-emerald-300">{simpleModifierLabel}</span>}
                            {multiLabels.map((label, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-600 text-emerald-300">{label}</span>
                            ))}
                        </div>
                        {item.description && <p className="text-[11px] text-zinc-400 whitespace-pre-wrap mt-1">{item.description}</p>}
                    </li>
                );
            })}
        </ul>
    );
}

/* ---------------------------
   Cache sessionStorage (descripciones)
   --------------------------- */
const CACHE_KEY = "dnd_spell_description_cache";
function readCache(): Record<string, string | null> {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (typeof parsed === "object" && parsed !== null) return parsed;
    } catch {}
    return {};
}
function writeCache(entryKey: string, value: string | null) {
    try {
        const prev = readCache();
        prev[entryKey] = value;
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(prev));
    } catch {}
}

/* ---------------------------
   Normalización / heurísticas para meta de conjuros
   --------------------------- */
function normalizeClassName(s: unknown): string[] {
    if (!s) return [];
    if (Array.isArray(s)) return s.map((x) => String(x).toLowerCase().trim());
    if (typeof s === "string") {
        return s.split(",").map((x) => x.toLowerCase().trim());
    }
    try {
        return [String(s).toLowerCase().trim()];
    } catch {
        return [];
    }
}

function spellMetaAllowsForCharacter(meta: any, charClass: string | null | undefined, charLevel: number | undefined): boolean {
    if (!meta) return true;
    if (typeof meta.level === "number") {
        const req = meta.level;
        if (typeof charLevel === "number") {
            if (req > charLevel) return false;
        }
    }

    const possibleClassFields = [meta.classes, meta.class, meta.class_name, meta.className, meta.classe];
    let allowedByClass = true;
    for (const field of possibleClassFields) {
        if (!field) continue;
        const classes = normalizeClassName(field);
        if (classes.length === 0) continue;
        allowedByClass = false;
        if (!charClass) continue;
        const cNormalized = (charClass || "").toLowerCase().trim();
        if (classes.includes(cNormalized)) {
            allowedByClass = true;
            break;
        }
        if (classes.some((cl) => cl.replace(/s$/, "") === cNormalized.replace(/s$/, ""))) {
            allowedByClass = true;
            break;
        }
    }

    return allowedByClass;
}

/* ---------------------------
   Small local utility: ability modifier & formatting
   --------------------------- */
function abilityModifier(score: number) {
    return Math.floor((score - 10) / 2);
}
function formatModifier(n: number) {
    return n >= 0 ? `+${n}` : `${n}`;
}

/* ---------------------------
   Component principal
   --------------------------- */
export function CharacterView({ character, activeTab, onTabChange, onDetailsChange, onOpenSpellManager }: {
    character: Character | null;
    activeTab: Tab;
    onTabChange: (t: Tab) => void;
    onDetailsChange?: (d: Details) => void;
    onOpenSpellManager: () => void;
}) {
    if (!character) {
        return (
            <div className="p-4">
                <p className="text-sm text-zinc-500">Selecciona un personaje para ver su ficha.</p>
            </div>
        );
    }

    const char = character as Character;

    const stats: Stats = char.stats ?? ({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 } as Stats);
    const details: Details = char.details || {};
    const armors = Array.isArray(details.armors) ? details.armors : ( (char as any).character_armors || [] );
    const armorBonus = sumArmorBonus(armors);
    const baseAC = char.armor_class ?? 10;
    const totalAC = baseAC + armorBonus;

    const spells = details.spells || {};
    const inventoryText = details.inventory ?? "";
    const equipmentText = details.equipment ?? "";
    const weaponsExtraText = details.weaponsExtra ?? "";
    const notesText = details.notes ?? "";
    const featsText = details.abilities ?? "";

    // use normalized expanded results if present
    const statsRow = (char as any).character_stats || stats;
    const weapons = (char as any).character_weapons || (details.weaponEquipped ? [details.weaponEquipped] : []);
    const equipmentsArray = (char as any).character_equipments || [];

    const preparedInfo = getPreparedSpellsInfo(char.class, stats, char.level, details);
    const preparedCount = countPreparedSpells(spells);
    const extras = getClassMagicExtras(char.class, char.level);
    const classLabel = char.class === "custom" && details.customClassName ? details.customClassName : prettyClassLabel(char.class);
    const spellSlots = char.class && char.level ? getSpellSlotsFor(char.class, char.level) : null;
    const abilityBonuses = getAbilityBonusesFromDetails(details);

    const totalStr = (Number(statsRow.str ?? stats.str ?? 10) + (abilityBonuses.STR ?? 0));
    const totalDex = (Number(statsRow.dex ?? stats.dex ?? 10) + (abilityBonuses.DEX ?? 0));
    const totalCon = (Number(statsRow.con ?? stats.con ?? 10) + (abilityBonuses.CON ?? 0));
    const totalInt = (Number(statsRow.int ?? stats.int ?? 10) + (abilityBonuses.INT ?? 0));
    const totalWis = (Number(statsRow.wis ?? stats.wis ?? 10) + (abilityBonuses.WIS ?? 0));
    const totalCha = (Number(statsRow.cha ?? stats.cha ?? 10) + (abilityBonuses.CHA ?? 0));

    const modStr = abilityModifier(totalStr);
    const modDex = abilityModifier(totalDex);
    const modCon = abilityModifier(totalCon);
    const modInt = abilityModifier(totalInt);
    const modWis = abilityModifier(totalWis);
    const modCha = abilityModifier(totalCha);

    const [fetching, setFetching] = useState<Record<string, boolean>>({});
    const [collapsedLevels, setCollapsedLevels] = useState<Record<number, boolean>>({});

    function spellKeyFromLine(line: string) {
        const firstPart = line.split(/—|–|\||:|\/|\\/)[0].trim();
        const cleaned = firstPart.replace(/\(.*\)$/g, "").trim();
        return cleaned.toLowerCase().replace(/\s+/g, " ").trim();
    }

    async function fetchSpellSummariesForClassLevel(apiClass: string, level: number): Promise<SpellMeta[] | null> {
        try {
            const url = `/api/dnd/spells?class=${encodeURIComponent(apiClass)}&level=${level}`;
            const res = await fetch(url);
            if (!res.ok) return null;
            const data = await res.json();
            if (!Array.isArray(data)) return null;
            return data as SpellMeta[];
        } catch {
            return null;
        }
    }

    /* stable deps for spell lines */
    const stringifiedSpellLines = JSON.stringify([
        spells.level0 ?? "",
        spells.level1 ?? "",
        spells.level2 ?? "",
        spells.level3 ?? "",
        spells.level4 ?? "",
        spells.level5 ?? "",
        spells.level6 ?? "",
        spells.level7 ?? "",
        spells.level8 ?? "",
        spells.level9 ?? "",
    ]);

    const stringifiedSpellDetails = JSON.stringify((details && (details as any).spellDetails) || {});

    useEffect(() => {
        if (activeTab !== "spells") return;

        const linesArr: (string | null)[] = JSON.parse(stringifiedSpellLines);
        const levelsPresent = new Set<number>();
        const keysPresent = new Set<string>();

        for (let lvl = 0; lvl <= 9; lvl++) {
            const raw = linesArr[lvl] ?? "";
            if (!raw) continue;
            try {
                const parsed = parseSpellLines(raw);
                for (const l of parsed) {
                    const lineText = typeof l === "string" ? (l as any) : (l as any).name || String((l as any).raw || l);
                    const key = spellKeyFromLine(lineText);
                    if (key) {
                        keysPresent.add(key);
                        levelsPresent.add(lvl);
                    }
                }
            } catch {}
        }

        const existingDetails: Record<string, any> = (details && (details as any).spellDetails) || {};
        const cache = readCache();

        const missingLevels: number[] = [];

        const apiClassRaw = normalizeClassForApi(char.class ?? null) || "";
        const apiClassToUse = apiClassRaw === "custom" ? "wizard" : apiClassRaw;

        for (const lvl of Array.from(levelsPresent)) {
            let haveMetaForLevel = false;
            for (const k of Object.keys(existingDetails || {})) {
                const meta = (existingDetails as any)[k];
                if (!meta) continue;
                try {
                    if (meta.level === lvl) {
                        const metaKeyNormalized = String(k).toLowerCase().trim();
                        if (keysPresent.has(metaKeyNormalized) || keysPresent.has(spellKeyFromLine(meta.name || String(metaKeyNormalized)))) {
                            haveMetaForLevel = true;
                            break;
                        }
                    }
                } catch {
                    continue;
                }
            }
            if (!haveMetaForLevel) {
                missingLevels.push(lvl);
            }
        }

        const toPersistFromCache: Record<string, string | null> = {};
        for (const key of Array.from(keysPresent)) {
            if (existingDetails && Object.prototype.hasOwnProperty.call(existingDetails, key)) continue;
            if (Object.prototype.hasOwnProperty.call(cache, key)) {
                const desc = cache[key];
                if (desc !== undefined) {
                    const meta: any = { index: key, name: key, level: undefined, fullDesc: desc, shortDesc: desc };
                    toPersistFromCache[key] = JSON.stringify(meta);
                }
            }
        }
        if (Object.keys(toPersistFromCache).length > 0) {
            const newSpellDetails: Record<string, any> = { ...(existingDetails || {}) };
            for (const k of Object.keys(toPersistFromCache)) {
                try {
                    newSpellDetails[k] = JSON.parse(toPersistFromCache[k] as string);
                } catch {
                    newSpellDetails[k] = { index: k, name: k, shortDesc: toPersistFromCache[k] as string };
                }
            }
            const newDetails: Details = { ...(details || {}), spellDetails: newSpellDetails };
            if (onDetailsChange) onDetailsChange(newDetails);
        }

        const levelsToFetch = missingLevels.filter((lvl) => !fetching[`lvl-${lvl}`]);

        if (levelsToFetch.length === 0) return;

        setFetching((prev) => {
            const copy = { ...prev };
            for (const lvl of levelsToFetch) copy[`lvl-${lvl}`] = true;
            return copy;
        });

        (async () => {
            try {
                for (const lvl of levelsToFetch) {
                    if (!apiClassToUse) continue;
                    const summaries = await fetchSpellSummariesForClassLevel(apiClassToUse, lvl);
                    if (!summaries || summaries.length === 0) continue;

                    const latestDetails = (details && (details as any).spellDetails) || {};

                    const merged: Record<string, SpellMeta> = {};

                    for (const k of Object.keys(latestDetails || {})) {
                        const candidate = (latestDetails as any)[k];
                        if (candidate && typeof candidate === "object") {
                            merged[k] = candidate as SpellMeta;
                        }
                    }

                    for (const s of summaries) {
                        if (!s || !s.index) continue;
                        const prev = merged[s.index] || ({} as SpellMeta);
                        merged[s.index] = {
                            ...prev,
                            ...(s as SpellMeta),
                        };
                        try {
                            if ((s as any).fullDesc || (s as any).shortDesc) {
                                const key = s.index;
                                writeCache(key, ((s as any).fullDesc || (s as any).shortDesc) as string | null);
                            }
                        } catch {}
                    }

                    const updatedDetails: Details = {
                        ...(details || {}),
                        spellDetails: merged,
                    };
                    if (onDetailsChange) onDetailsChange(updatedDetails);
                }
            } finally {
                setFetching((prev) => {
                    const copy = { ...prev };
                    for (const lvl of levelsToFetch) delete copy[`lvl-${lvl}`];
                    return copy;
                });
            }
        })();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, stringifiedSpellLines, stringifiedSpellDetails, onDetailsChange, spellSlots]);

    /* ----------------------------------------------------------------
       Effect: elimina/oculta conjuros no permitidos según meta (nivel y clase)
       ---------------------------------------------------------------- */
    useEffect(() => {
        if (activeTab !== "spells") return;

        const spellDetails: Record<string, any> = (details as any)?.spellDetails || {};

        function lineIsNotAllowed(lineText: string): boolean {
            const key = spellKeyFromLine(lineText);
            const metaByKey = (spellDetails as any)[key] as SpellMeta | undefined;

            let metaByName: SpellMeta | undefined;
            for (const k of Object.keys(spellDetails || {})) {
                const m = (spellDetails as any)[k] as SpellMeta | undefined;
                if (!m) continue;
                if ((m as any).name && String((m as any).name).toLowerCase().trim() === lineText.toLowerCase().trim()) {
                    metaByName = m;
                    break;
                }
            }
            const meta = metaByKey || metaByName || undefined;

            const charLevel = char.level ?? 0;
            const charClass = (char.class ?? "").toString();

            const allowed = spellMetaAllowsForCharacter(meta, charClass, charLevel);
            return !allowed;
        }

        const newSpells: Record<string, string | undefined> = {};
        let changed = false;

        for (let lvl = 0; lvl <= 9; lvl++) {
            const key = `level${lvl}` as keyof typeof spells;
            const raw = (spells as any)[key] as string | undefined;
            if (!raw) {
                newSpells[key] = undefined;
                continue;
            }
            const parsed = parseSpellLines(raw);
            const kept: string[] = [];
            for (const line of parsed) {
                const lineText = typeof line === "string" ? line : (line as any).name || String(line);
                if (!lineIsNotAllowed(lineText)) {
                    kept.push(lineText);
                } else {
                    changed = true;
                }
            }
            newSpells[key] = kept.length > 0 ? kept.join("\n") : undefined;
        }

        if (changed) {
            const newDetails: Details = {
                ...(details || {}),
                spells: {
                    level0: newSpells.level0,
                    level1: newSpells.level1,
                    level2: newSpells.level2,
                    level3: newSpells.level3,
                    level4: newSpells.level4,
                    level5: newSpells.level5,
                    level6: newSpells.level6,
                    level7: newSpells.level7,
                    level8: newSpells.level8,
                    level9: newSpells.level9,
                },
            };
            if (onDetailsChange) {
                onDetailsChange(newDetails);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, stringifiedSpellLines, stringifiedSpellDetails, onDetailsChange]);

    /* ----------------------------------------------------------------
       Filtrado adicional en render (defensa en profundidad)
       ---------------------------------------------------------------- */
    function getFilteredLinesForRender(level: number, rawText?: string | null): LearnedSpellLine[] {
        if (!rawText) return [];
        const parsed = parseSpellLines(rawText);
        const sd: Record<string, SpellMeta | null> = (details as any)?.spellDetails || {};
        const metaByName: Record<string, SpellMeta> = {};
        for (const k of Object.keys(sd || {})) {
            const m = sd[k];
            if (m && (m as any).name) metaByName[(m as any).name] = m as SpellMeta;
        }

        const out: LearnedSpellLine[] = [];
        for (const line of parsed) {
            const name = typeof line === "string" ? line : (line as any).name || String(line);
            const key = spellKeyFromLine(name);
            const metaFromKey = sd && (sd as any)[key];
            const metaFromName = metaByName[name];
            const meta = (metaFromKey as SpellMeta) || metaFromName || undefined;

            const charLevel = char.level ?? 0;
            const charClass = (char.class ?? "").toString();

            if (!spellMetaAllowsForCharacter(meta, charClass, charLevel)) {
                continue;
            }

            if (typeof line === "string") {
                out.push({ name, raw: line } as LearnedSpellLine);
            } else {
                out.push({ ...(line as any), name });
            }
        }
        return out;
    }

    /* ---------------------------
       Collapsible helpers & levels
       --------------------------- */
    function toggleLevel(lvl: number) {
        setCollapsedLevels((prev) => ({ ...prev, [lvl]: !prev[lvl] }));
    }
    function setAllCollapsed(value: boolean, levels: number[]) {
        const next: Record<number, boolean> = {};
        for (const lvl of levels) next[lvl] = value;
        setCollapsedLevels(next);
    }

    const levelsList = [
        { level: 0, label: "Trucos (nivel 0)", text: spells.level0 },
        { level: 1, label: "Conjuros de nivel 1", text: spells.level1 },
        { level: 2, label: "Conjuros de nivel 2", text: spells.level2 },
        { level: 3, label: "Conjuros de nivel 3", text: spells.level3 },
        { level: 4, label: "Conjuros de nivel 4", text: spells.level4 },
        { level: 5, label: "Conjuros de nivel 5", text: spells.level5 },
        { level: 6, label: "Conjuros de nivel 6", text: spells.level6 },
        { level: 7, label: "Conjuros de nivel 7", text: spells.level7 },
        { level: 8, label: "Conjuros de nivel 8", text: spells.level8 },
        { level: 9, label: "Conjuros de nivel 9", text: spells.level9 },
    ];

    /* ---------------------------
       RENDER
       --------------------------- */
    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="border-b border-zinc-800 flex gap-4 text-sm">
                <button className={`pb-2 leading-none border-b-2 ${activeTab === "stats" ? "text-purple-300 border-purple-500" : "text-zinc-500 hover:text-zinc-300 border-transparent"}`} onClick={() => onTabChange("stats")}>Estadísticas</button>
                <button className={`pb-2 leading-none border-b-2 ${activeTab === "spells" ? "text-purple-300 border-purple-500" : "text-zinc-500 hover:text-zinc-300 border-transparent"}`} onClick={() => onTabChange("spells")}>Habilidades</button>
                <button className={`pb-2 leading-none border-b-2 ${activeTab === "inventory" ? "text-purple-300 border-purple-500" : "text-zinc-500 hover:text-zinc-300 border-transparent"}`} onClick={() => onTabChange("inventory")}>Inventario</button>
            </div>

            {/* STATS tab (igual que antes) */}
            {activeTab === "stats" && (
                <div className="space-y-4">
                    {/* Vida, CA, Velocidad */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <InfoBox label="Vida" value={`${char.current_hp ?? char.max_hp ?? "?"}/${char.max_hp ?? "?"}`} />
                        <InfoBox label="Clase de armadura (CA total)" value={totalAC} />
                        <InfoBox label="Velocidad" value={`${char.speed ?? 30} ft`} />
                    </div>

                    {/* Stats (con modificadores de objetos) */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-zinc-300">Atributos (stats) con modificadores de equipo</h3>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                            <div>
                                <StatDisplay label="FUE" value={totalStr} />
                                <div className="text-[11px] text-zinc-400 mt-1">{formatModifier(modStr)}</div>
                            </div>
                            <div>
                                <StatDisplay label="DES" value={totalDex} />
                                <div className="text-[11px] text-zinc-400 mt-1">{formatModifier(modDex)}</div>
                            </div>
                            <div>
                                <StatDisplay label="CON" value={totalCon} />
                                <div className="text-[11px] text-zinc-400 mt-1">{formatModifier(modCon)}</div>
                            </div>
                            <div>
                                <StatDisplay label="INT" value={totalInt} />
                                <div className="text-[11px] text-zinc-400 mt-1">{formatModifier(modInt)}</div>
                            </div>
                            <div>
                                <StatDisplay label="SAB" value={totalWis} />
                                <div className="text-[11px] text-zinc-400 mt-1">{formatModifier(modWis)}</div>
                            </div>
                            <div>
                                <StatDisplay label="CAR" value={totalCha} />
                                <div className="text-[11px] text-zinc-400 mt-1">{formatModifier(modCha)}</div>
                            </div>
                        </div>
                        <p className="text-[11px] text-zinc-500">Los modificadores procedentes de objetos del inventario, equipamiento y armas adicionales se aplican a estas estadísticas.</p>
                    </div>

                    {/* Armaduras / Arma equipada */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Armaduras */}
                        <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                            <h3 className="text-sm font-semibold text-zinc-200">Armaduras</h3>
                            {armors.length === 0 ? <p className="text-xs text-zinc-500">No tienes armaduras registradas.</p> : <ul className="space-y-2">{armors.map((armor: any, index: number) => (<li key={index} className="text-sm text-zinc-300"><span className="font-medium">{armor.name}</span>{" "}{armor.bonus !== 0 && <span className="text-xs text-zinc-500">(CA {armor.bonus >= 0 ? `+${armor.bonus}` : armor.bonus})</span>}{armor.ability && <div className="text-xs text-zinc-400">Habilidad: {armor.ability}</div>}</li>))}</ul>}
                        </div>

                        {/* Arma equipada */}
                        <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                            <h3 className="text-sm font-semibold text-zinc-200">Arma equipada</h3>
                            {weapons && weapons.length > 0 ? (
                                <div className="space-y-2">
                                    {(() => {
                                        const weq = (weapons as any[]).find((w) => w?.equipped) || (weapons as any[])[0] || null;
                                        if (!weq) return <p className="text-sm text-zinc-500">Sin arma equipada</p>;
                                        return (
                                            <div className="space-y-2">
                                                <p className="text-sm text-zinc-300 font-medium">{weq.name}</p>
                                                {weq.description && <p className="text-xs text-zinc-500 whitespace-pre-wrap">{weq.description}</p>}
                                                {weq.damage && <p className="text-xs text-zinc-400">Daño: {(() => {
                                                    const damageRaw = String(weq.damage || "").trim();
                                                    const weaponModifier = Number(weq.modifier || 0);
                                                    const statKey = (weq.stat_ability || weq.statAbility || weq.ability || null) as string | null;
                                                    if (!damageRaw) return null;
                                                    const statNormalized = statKey ? (String(statKey).toUpperCase() as AbilityKey) : null;
                                                    if (!statNormalized) return weaponModifier ? `${damageRaw} ${formatModifier(weaponModifier)}` : damageRaw;
                                                    const totalMap: Record<AbilityKey, number> = { STR: totalStr, DEX: totalDex, CON: totalCon, INT: totalInt, WIS: totalWis, CHA: totalCha };
                                                    const usedScore = Number(totalMap[statNormalized] ?? 10);
                                                    const dmgMod = abilityModifier(usedScore) + weaponModifier;
                                                    return `${damageRaw} ${formatModifier(dmgMod)}`;
                                                })()}</p>}
                                                <div className="text-xs text-zinc-400">Ataque: {(() => {
                                                    const weaponModifier = Number(weq.modifier || 0);
                                                    const statKey = (weq.stat_ability || weq.statAbility || weq.ability || null) as string | null;
                                                    const isProficient = Boolean(weq.is_proficient || weq.isProficient || weq.proficient || weq.proficiency);
                                                    const statNormalized = statKey ? (String(statKey).toUpperCase() as AbilityKey) : null;
                                                    if (!statNormalized) return weaponModifier ? formatModifier(weaponModifier) : "N/A";
                                                    const totalMap: Record<AbilityKey, number> = { STR: totalStr, DEX: totalDex, CON: totalCon, INT: totalInt, WIS: totalWis, CHA: totalCha };
                                                    const usedScore = Number(totalMap[statNormalized] ?? 10);
                                                    const mod = abilityModifier(usedScore);
                                                    const prof = Math.floor(((char.level ?? 1) - 1) / 4) + 2; // pb formula typical
                                                    const atkBonus = mod + (isProficient ? prof : 0) + weaponModifier;
                                                    return `${formatModifier(atkBonus)}${isProficient ? " (compet.)" : ""}`;
                                                })()}</div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            ) : <p className="text-sm text-zinc-500">Sin arma equipada</p>}
                        </div>
                    </div>

                    {/* Spell slots y Dotes/Rasgos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Spell slots */}
                        <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                            <h3 className="text-sm font-semibold text-zinc-200">Espacios de conjuro</h3>
                            {!spellSlots ? <p className="text-xs text-zinc-500">Esta clase/nivel no tiene espacios de conjuro estándar.</p> : "slots" in spellSlots ? <p className="text-xs text-zinc-300">Brujo: {spellSlots.slots} espacios de pacto · Nivel de espacio: {spellSlots.slotLevel}</p> : <div className="flex flex-wrap gap-2 text-xs text-zinc-300">{Object.entries(spellSlots || {}).filter(([lvl, num]) => Number(lvl) > 0 && (num as number) > 0).map(([lvl, num]) => (<span key={lvl} className="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-700">Nivel {lvl}: {num}</span>))}</div>}
                        </div>

                        {/* Dotes / rasgos */}
                        <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                            <h3 className="text-sm font-semibold text-zinc-200">Dotes y rasgos</h3>
                            {featsText ? <pre className="whitespace-pre-wrap text-sm text-zinc-300">{featsText}</pre> : <p className="text-xs text-zinc-500">No se han registrado dotes o rasgos.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: HABILIDADES */}
            {activeTab === "spells" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-zinc-200">Habilidades y conjuros conocidos / preparados</h3>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setAllCollapsed(false, levelsList.map((l) => l.level))} className="text-xs px-2 py-1 rounded border border-zinc-700 hover:bg-zinc-900/40">Expandir todo</button>
                            <button type="button" onClick={() => setAllCollapsed(true, levelsList.map((l) => l.level))} className="text-xs px-2 py-1 rounded border border-zinc-700 hover:bg-zinc-900/40">Plegar todo</button>
                        </div>
                    </div>

                    {preparedInfo && (
                        <div className="border border-zinc-800 rounded-lg p-3">
                            <h4 className="text-xs font-semibold text-zinc-300 mb-1">Conjuros preparados de nivel 1+ (límite 5e)</h4>
                            <p className="text-xs text-zinc-300">Característica clave: {preparedInfo.abilityName}. Puedes tener <span className="font-semibold">{preparedInfo.total}</span> conjuros de nivel 1 o superior preparados a la vez (los trucos no cuentan).</p>
                            <p className="text-[11px] text-zinc-400 mt-1">Actualmente preparados (nivel 1+): <span className={preparedCount > preparedInfo.total ? "text-red-400 font-semibold" : "text-emerald-400 font-semibold"}>{preparedCount}/{preparedInfo.total}</span></p>
                        </div>
                    )}

                    {extras && (
                        <div className="border border-zinc-800 rounded-lg p-3">
                            <h4 className="text-xs font-semibold text-zinc-300 mb-1">{extras.title}</h4>
                            <ul className="text-xs text-zinc-300 list-disc list-inside space-y-1">{extras.lines.map((line, i) => (<li key={i}>{line}</li>))}</ul>
                        </div>
                    )}

                    <div className="space-y-2">
                        {levelsList.map(({ level, label, text }) => {
                            const filtered = getFilteredLinesForRender(level, text);
                            if (filtered.length === 0) return null;
                            const isCollapsed = !!collapsedLevels[level];
                            const count = filtered.length;

                            return (
                                <details key={level} open={!isCollapsed} className="border border-zinc-800 rounded-lg overflow-hidden" onToggle={(e) => {
                                    const el = e.target as HTMLDetailsElement;
                                    const isOpen = el.open;
                                    setCollapsedLevels((prev) => ({ ...prev, [level]: !isOpen }));
                                }}>
                                    <summary className="cursor-pointer px-3 py-2 bg-zinc-900/30 flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-zinc-100">{label}</span>
                                            <span className="text-[11px] text-zinc-400">({count})</span>
                                        </div>
                                        <div className="text-[11px] text-zinc-400">{isCollapsed ? "Mostrar" : "Ocultar"}</div>
                                    </summary>

                                    <div className="p-3 no-header">
                                        <LearnedSpellLevelBlock level={level} label={""} lines={filtered as LearnedSpellLine[]} spellDetails={(details as any)?.spellDetails || {}} />
                                    </div>
                                </details>
                            );
                        })}
                    </div>

                    <div className="border border-zinc-800 rounded-lg p-3 mt-2 flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-zinc-200">Gestor de habilidades (SRD)</h3>
                            {preparedInfo && <p className="text-[11px] text-zinc-400">Conjuros preparados nivel 1+: {preparedCount}/{preparedInfo.total}</p>}
                        </div>
                        <button type="button" onClick={onOpenSpellManager} className="text-xs px-3 py-2 rounded-md border border-purple-600/70 hover:bg-purple-900/40">Abrir gestor en pantalla completa</button>
                    </div>
                </div>
            )}

            {/* TAB: INVENTARIO */}
            {activeTab === "inventory" && (
                <div className="space-y-4">
                    <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                        <h3 className="text-sm font-semibold text-zinc-200">Inventario / Mochila</h3>
                        {renderInventorySection("Inventario", inventoryText)}
                    </div>

                    <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                        <h3 className="text-sm font-semibold text-zinc-200">Equipamiento adicional</h3>
                        {renderInventorySection("Equipamiento", equipmentText)}
                    </div>

                    <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                        <h3 className="text-sm font-semibold text-zinc-200">Armas adicionales</h3>
                        {renderInventorySection("Armas adicionales", weaponsExtraText)}
                    </div>

                    <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                        <h3 className="text-sm font-semibold text-zinc-200">Notas del personaje</h3>
                        {notesText ? <pre className="whitespace-pre-wrap text-sm text-zinc-300">{notesText}</pre> : <p className="text-xs text-zinc-500">No hay notas guardadas.</p>}
                    </div>
                </div>
            )}

            <style jsx>{`
                .no-header h4 { display: none; }
                summary::-webkit-details-marker { display: none; }
            `}</style>
        </div>
    );
}

export default CharacterView;
