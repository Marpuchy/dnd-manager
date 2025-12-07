// src/app/campaigns/[id]/player/CharacterView.tsx
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
} from "./playerShared";
import { sumArmorBonus } from "@/lib/dndMath";
import { getSpellSlotsFor } from "@/lib/spellSlots";
import { InfoBox } from "./ui/InfoBox";
import { StatDisplay } from "./ui/StatDisplay";
import { LearnedSpellLevelBlock } from "./LearnedSpellBlocks";

type CharacterViewProps = {
    character: Character | null;
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    onDetailsChange?: (details: Details) => void;
    onOpenSpellManager: () => void;
};

type AbilityKey = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";

type ItemModifier = {
    ability: AbilityKey;
    modifier: number;
};

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

function accumulateBonus(
    bonuses: Record<AbilityKey, number>,
    ability: AbilityKey | undefined,
    value: unknown
) {
    if (!ability) return;
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) return;
    bonuses[ability] += num;
}

function getAbilityBonusesFromDetails(details: Details | undefined): Record<AbilityKey, number> {
    const bonuses: Record<AbilityKey, number> = {
        STR: 0,
        DEX: 0,
        CON: 0,
        INT: 0,
        WIS: 0,
        CHA: 0,
    };
    if (!details) return bonuses;

    const textSources = [details.inventory, details.equipment, details.weaponsExtra];
    for (const source of textSources) {
        if (!source) continue;
        const lines = source
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
        for (const line of lines) {
            const entry = parseInventoryLineForView(line);
            if (entry.kind !== "json") continue;
            const { item } = entry;
            if (item.ability && typeof item.modifier === "number") {
                accumulateBonus(bonuses, item.ability, item.modifier);
            }
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
            if (armor.statAbility) {
                accumulateBonus(bonuses, armor.statAbility as AbilityKey | undefined, armor.statModifier);
            }
            if (armor.ability && typeof armor.modifier === "number") {
                accumulateBonus(bonuses, armor.ability as AbilityKey | undefined, armor.modifier);
            }
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
        if (w.statAbility) {
            accumulateBonus(bonuses, w.statAbility as AbilityKey | undefined, w.statModifier);
        }
        if (w.ability && typeof w.modifier === "number") {
            accumulateBonus(bonuses, w.ability as AbilityKey | undefined, w.modifier);
        }
        if (Array.isArray(w.modifiers)) {
            for (const mod of w.modifiers as any[]) {
                if (!mod) continue;
                accumulateBonus(bonuses, mod.ability as AbilityKey | undefined, mod.modifier);
            }
        }
    }

    return bonuses;
}

function renderInventorySection(label: string, rawText?: string | null) {
    const text = rawText ?? "";
    const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
    if (lines.length === 0) {
        return <p className="text-xs text-zinc-500">No se ha registrado información en esta sección.</p>;
    }

    const parsed = lines.map(parseInventoryLineForView);
    const hasJson = parsed.some((p) => p.kind === "json");
    if (!hasJson) {
        return <pre className="whitespace-pre-wrap text-sm text-zinc-300">{text}</pre>;
    }

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
                const simpleModifierLabel =
                    item.ability && typeof item.modifier === "number"
                        ? `${item.ability} ${item.modifier >= 0 ? `+${item.modifier}` : item.modifier}`
                        : null;
                const multiLabels: string[] = Array.isArray(item.modifiers)
                    ? item.modifiers
                        .filter((m) => m && m.ability && typeof m.modifier === "number")
                        .map((m) => `${m.ability} ${m.modifier >= 0 ? `+${m.modifier}` : m.modifier}`)
                    : [];
                return (
                    <li key={index} className="rounded-md bg-zinc-900 px-2 py-2 border border-zinc-700">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold break-words">{item.name}</span>
                            {item.type && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-600 text-zinc-300">{item.type}</span>
                            )}
                            {simpleModifierLabel && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-600 text-emerald-300">
                                    {simpleModifierLabel}
                                </span>
                            )}
                            {multiLabels.map((label, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-600 text-emerald-300">
                                    {label}
                                </span>
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
   Caché en sessionStorage:
   key: 'dnd_spell_description_cache' -> JSON { [key: string]: string|null }
   --------------------------- */
const CACHE_KEY = "dnd_spell_description_cache";

function readCache(): Record<string, string | null> {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (typeof parsed === "object" && parsed !== null) return parsed;
    } catch {
        // ignore parse errors
    }
    return {};
}

function writeCache(entryKey: string, value: string | null) {
    try {
        const prev = readCache();
        prev[entryKey] = value;
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(prev));
    } catch {
        // ignore storage errors
    }
}

/* ---------------------------
   Component
   --------------------------- */
export function CharacterView({
                                  character,
                                  activeTab,
                                  onTabChange,
                                  onDetailsChange,
                                  onOpenSpellManager,
                              }: CharacterViewProps) {
    if (!character) {
        return (
            <div className="p-4">
                <p className="text-sm text-zinc-500">Selecciona un personaje para ver su ficha.</p>
            </div>
        );
    }

    const stats: Stats =
        character.stats ??
        ({
            str: 10,
            dex: 10,
            con: 10,
            int: 10,
            wis: 10,
            cha: 10,
        } as Stats);

    const details: Details = character.details || {};
    const armors = Array.isArray(details.armors) ? details.armors : [];
    const armorBonus = sumArmorBonus(armors);
    const baseAC = character.armor_class ?? 10;
    const totalAC = baseAC + armorBonus;

    const spells = details.spells || {};
    const inventoryText = details.inventory ?? "";
    const equipmentText = details.equipment ?? "";
    const weaponsExtraText = details.weaponsExtra ?? "";
    const notesText = details.notes ?? "";
    const featsText = details.abilities ?? "";

    const preparedInfo = getPreparedSpellsInfo(character.class, stats, character.level, details);
    const preparedCount = countPreparedSpells(spells);

    const extras = getClassMagicExtras(character.class, character.level);

    const classLabel = character.class === "custom" && details.customClassName ? details.customClassName : prettyClassLabel(character.class);

    const spellSlots = character.class && character.level ? getSpellSlotsFor(character.class, character.level) : null;

    const abilityBonuses = getAbilityBonusesFromDetails(details);

    const totalStr = (stats.str ?? 10) + (abilityBonuses.STR ?? 0);
    const totalDex = (stats.dex ?? 10) + (abilityBonuses.DEX ?? 0);
    const totalCon = (stats.con ?? 10) + (abilityBonuses.CON ?? 0);
    const totalInt = (stats.int ?? 10) + (abilityBonuses.INT ?? 0);
    const totalWis = (stats.wis ?? 10) + (abilityBonuses.WIS ?? 0);
    const totalCha = (stats.cha ?? 10) + (abilityBonuses.CHA ?? 0);

    const [fetching, setFetching] = useState<Record<string, boolean>>({});

    // Collapsible state: true = collapsed
    const [collapsedLevels, setCollapsedLevels] = useState<Record<number, boolean>>({});

    // Toggle single level
    function toggleLevel(lvl: number) {
        setCollapsedLevels((prev) => ({ ...prev, [lvl]: !prev[lvl] }));
    }

    // Expand or collapse all
    function setAllCollapsed(value: boolean, levels: number[]) {
        const next: Record<number, boolean> = {};
        for (const lvl of levels) next[lvl] = value;
        setCollapsedLevels(next);
    }

    // helper: normaliza una "línea" de conjuro a una clave consistente
    function spellKeyFromLine(line: string) {
        const firstPart = line.split(/—|–|\||:|\/|\\/)[0].trim();
        const cleaned = firstPart.replace(/\(.*\)$/g, "").trim();
        return cleaned.toLowerCase().replace(/\s+/g, " ").trim();
    }

    async function fetchSpellDescriptionFromApi(originalName: string): Promise<string | null> {
        try {
            const url = `/api/srd/spells?name=${encodeURIComponent(originalName)}`;
            const res = await fetch(url);
            if (!res.ok) return null;
            const data = await res.json();
            return typeof data?.description === "string" ? data.description : null;
        } catch {
            return null;
        }
    }

    // Effect: cache + fetch descriptions (igual que antes)
    useEffect(() => {
        if (!character) return;
        if (activeTab !== "spells") return;

        const allTexts = [
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
        ];

        const namesMap = new Map<string, string>(); // key -> originalName
        for (const txt of allTexts) {
            if (!txt) continue;
            try {
                const lines = parseSpellLines(txt);
                for (const l of lines) {
                    const lineText = typeof l === "string" ? l : String(l);
                    const key = spellKeyFromLine(lineText);
                    if (key && !namesMap.has(key)) {
                        const originalName = lineText.split(/—|–|\||:|\/|\\/)[0].replace(/\(.*\)$/g, "").trim();
                        namesMap.set(key, originalName);
                    }
                }
            } catch {
                // ignore parse errors
            }
        }

        const existingDetails = (details && (details as any).spellDetails) || {};
        const cache = readCache();

        // Persist cache entries into details if present
        const toPersistFromCache: Record<string, string | null> = {};
        for (const [key] of namesMap.entries()) {
            if (existingDetails && Object.prototype.hasOwnProperty.call(existingDetails, key)) continue;
            if (Object.prototype.hasOwnProperty.call(cache, key)) {
                toPersistFromCache[key] = cache[key];
            }
        }
        if (Object.keys(toPersistFromCache).length > 0) {
            const newSpellDetails = { ...(existingDetails || {}), ...toPersistFromCache };
            const newDetails: Details = { ...(details || {}), spellDetails: newSpellDetails };
            if (onDetailsChange) onDetailsChange(newDetails);
        }

        // Fetch remaining
        namesMap.forEach((originalName, key) => {
            if (!key) return;
            const alreadyInDetails = existingDetails && Object.prototype.hasOwnProperty.call(existingDetails, key);
            const alreadyInCache = Object.prototype.hasOwnProperty.call(cache, key);
            if (alreadyInDetails || alreadyInCache) return;
            if (fetching[key]) return;

            setFetching((prev) => ({ ...prev, [key]: true }));

            (async () => {
                const desc = await fetchSpellDescriptionFromApi(originalName);
                writeCache(key, desc);
                try {
                    const latestDetails = (details && (details as any).spellDetails) || {};
                    if (!Object.prototype.hasOwnProperty.call(latestDetails, key)) {
                        const newSpellDetails = { ...(latestDetails || {}), [key]: desc };
                        const newDetails: Details = { ...(details || {}), spellDetails: newSpellDetails };
                        if (onDetailsChange) {
                            onDetailsChange(newDetails);
                        }
                    }
                } finally {
                    setFetching((prev) => {
                        const copy = { ...prev };
                        delete copy[key];
                        return copy;
                    });
                }
            })();
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        activeTab,
        spells.level0,
        spells.level1,
        spells.level2,
        spells.level3,
        spells.level4,
        spells.level5,
        spells.level6,
        spells.level7,
        spells.level8,
        spells.level9,
        details,
        character,
        onDetailsChange,
    ]);

    /* ---------------------------
       RENDER
       --------------------------- */

    // Lista de niveles que vamos a mostrar (para control global)
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

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="border-b border-zinc-800 flex gap-4 text-sm">
                <button
                    className={`pb-2 leading-none border-b-2 ${activeTab === "stats" ? "text-purple-300 border-purple-500" : "text-zinc-500 hover:text-zinc-300 border-transparent"}`}
                    onClick={() => onTabChange("stats")}
                >
                    Estadísticas
                </button>
                <button
                    className={`pb-2 leading-none border-b-2 ${activeTab === "spells" ? "text-purple-300 border-purple-500" : "text-zinc-500 hover:text-zinc-300 border-transparent"}`}
                    onClick={() => onTabChange("spells")}
                >
                    Habilidades
                </button>
                <button
                    className={`pb-2 leading-none border-b-2 ${activeTab === "inventory" ? "text-purple-300 border-purple-500" : "text-zinc-500 hover:text-zinc-300 border-transparent"}`}
                    onClick={() => onTabChange("inventory")}
                >
                    Inventario
                </button>
            </div>

            {/* TAB: ESTADÍSTICAS */}
            {activeTab === "stats" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <InfoBox label="Vida" value={`${character.current_hp ?? character.max_hp ?? "?"}/${character.max_hp ?? "?"}`} />
                        <InfoBox label="Clase de armadura (CA total)" value={totalAC} sub={`Base ${baseAC} + armaduras (${armorBonus >= 0 ? `+${armorBonus}` : armorBonus})`} />
                        <InfoBox label="Velocidad" value={`${character.speed ?? 30} ft`} />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-zinc-300">Atributos (stats) con modificadores de equipo</h3>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                            <StatDisplay label="FUE" value={totalStr} />
                            <StatDisplay label="DES" value={totalDex} />
                            <StatDisplay label="CON" value={totalCon} />
                            <StatDisplay label="INT" value={totalInt} />
                            <StatDisplay label="SAB" value={totalWis} />
                            <StatDisplay label="CAR" value={totalCha} />
                        </div>
                        <p className="text-[11px] text-zinc-500">
                            Los modificadores procedentes de objetos del inventario, equipamiento y armas adicionales se aplican a estas estadísticas.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                            <h3 className="text-sm font-semibold text-zinc-200">Armaduras</h3>
                            {armors.length === 0 ? (
                                <p className="text-xs text-zinc-500">No tienes armaduras registradas.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {armors.map((armor: any, index: number) => (
                                        <li key={index} className="text-sm text-zinc-300">
                                            <span className="font-medium">{armor.name}</span>{" "}
                                            {armor.bonus !== 0 && <span className="text-xs text-zinc-500">(CA {armor.bonus >= 0 ? `+${armor.bonus}` : armor.bonus})</span>}
                                            {armor.ability && <div className="text-xs text-zinc-400">Habilidad: {armor.ability}</div>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                            <h3 className="text-sm font-semibold text-zinc-200">Arma equipada</h3>
                            {details.weaponEquipped ? (
                                <div className="space-y-2">
                                    <div className="space-y-1">
                                        <p className="text-sm text-zinc-300 font-medium">{details.weaponEquipped.name}</p>
                                        {details.weaponEquipped.damage && <p className="text-xs text-zinc-400">Daño: {details.weaponEquipped.damage}</p>}
                                        {details.weaponEquipped.description && <p className="text-xs text-zinc-500 whitespace-pre-wrap">{details.weaponEquipped.description}</p>}
                                    </div>

                                    {(() => {
                                        const mods: { ability: string; value: number }[] = [];
                                        const w: any = details.weaponEquipped;
                                        if (w?.statAbility && typeof w?.statModifier !== "undefined") {
                                            const n = Number(w.statModifier);
                                            if (!Number.isNaN(n)) mods.push({ ability: w.statAbility, value: n });
                                        }
                                        if (w?.ability && typeof w?.modifier === "number") mods.push({ ability: w.ability, value: w.modifier });
                                        if (Array.isArray(w?.modifiers)) {
                                            for (const m of w.modifiers as any[]) {
                                                if (!m?.ability) continue;
                                                const n = Number(m.modifier);
                                                if (Number.isNaN(n)) continue;
                                                mods.push({ ability: m.ability, value: n });
                                            }
                                        }
                                        if (mods.length === 0) return null;
                                        return (
                                            <div className="flex flex-wrap gap-2">
                                                {mods.map((m, i) => (
                                                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-600 text-emerald-300">
                                                        {m.ability} {m.value >= 0 ? `+${m.value}` : m.value}
                                                    </span>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            ) : (
                                <p className="text-sm text-zinc-500">Sin arma equipada</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                            <h3 className="text-sm font-semibold text-zinc-200">Espacios de conjuro</h3>
                            {!spellSlots ? (
                                <p className="text-xs text-zinc-500">Esta clase/nivel no tiene espacios de conjuro estándar.</p>
                            ) : "slots" in spellSlots ? (
                                <p className="text-xs text-zinc-300">Brujo: {spellSlots.slots} espacios de pacto · Nivel de espacio: {spellSlots.slotLevel}</p>
                            ) : (
                                <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
                                    {Object.entries(spellSlots || {})
                                        .filter(([lvl, num]) => Number(lvl) > 0 && (num as number) > 0)
                                        .map(([lvl, num]) => (
                                            <span key={lvl} className="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-700">
                                                Nivel {lvl}: {num}
                                            </span>
                                        ))}
                                </div>
                            )}
                        </div>

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
                            <button
                                type="button"
                                onClick={() => setAllCollapsed(false, levelsList.map((l) => l.level))}
                                className="text-xs px-2 py-1 rounded border border-zinc-700 hover:bg-zinc-900/40"
                            >
                                Expandir todo
                            </button>
                            <button
                                type="button"
                                onClick={() => setAllCollapsed(true, levelsList.map((l) => l.level))}
                                className="text-xs px-2 py-1 rounded border border-zinc-700 hover:bg-zinc-900/40"
                            >
                                Plegar todo
                            </button>
                        </div>
                    </div>

                    {preparedInfo && (
                        <div className="border border-zinc-800 rounded-lg p-3">
                            <h4 className="text-xs font-semibold text-zinc-300 mb-1">Conjuros preparados de nivel 1+ (límite 5e)</h4>
                            <p className="text-xs text-zinc-300">
                                Característica clave: {preparedInfo.abilityName}. Puedes tener <span className="font-semibold">{preparedInfo.total}</span> conjuros de nivel 1 o superior preparados a la vez (los trucos no cuentan).
                            </p>
                            <p className="text-[11px] text-zinc-400 mt-1">
                                Actualmente preparados (nivel 1+):{" "}
                                <span className={preparedCount > preparedInfo.total ? "text-red-400 font-semibold" : "text-emerald-400 font-semibold"}>
                                    {preparedCount}/{preparedInfo.total}
                                </span>
                            </p>
                        </div>
                    )}

                    {extras && (
                        <div className="border border-zinc-800 rounded-lg p-3">
                            <h4 className="text-xs font-semibold text-zinc-300 mb-1">{extras.title}</h4>
                            <ul className="text-xs text-zinc-300 list-disc list-inside space-y-1">
                                {extras.lines.map((line, i) => (
                                    <li key={i}>{line}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Conjuros por nivel con plegado */}
                    <div className="space-y-2">
                        {levelsList.map(({ level, label, text }) => {
                            const lines = parseSpellLines(text);
                            if (lines.length === 0) return null;
                            const isCollapsed = !!collapsedLevels[level];
                            const count = lines.length;

                            return (
                                <details
                                    key={level}
                                    open={!isCollapsed}
                                    className="border border-zinc-800 rounded-lg overflow-hidden"
                                    onToggle={(e) => {
                                        // HTMLDetailsElement.toggle fires before state updates; read opened state.
                                        const el = e.target as HTMLDetailsElement;
                                        setCollapsedLevels((prev) => ({ ...prev, [level]: !el.open }));
                                    }}
                                >
                                    <summary className="cursor-pointer px-3 py-2 bg-zinc-900/30 flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-zinc-100">{label}</span>
                                            <span className="text-[11px] text-zinc-400">({count})</span>
                                        </div>

                                        <div className="text-[11px] text-zinc-400">
                                            {isCollapsed ? "Mostrar" : "Ocultar"}
                                        </div>
                                    </summary>

                                    {/* Ocultamos el header interno de LearnedSpellLevelBlock para evitar duplicados */}
                                    <div className="p-3 no-header">
                                        <LearnedSpellLevelBlock level={level} label={""} lines={lines} spellDetails={(details && (details as any).spellDetails) || {}} />
                                    </div>
                                </details>
                            );
                        })}
                    </div>

                    {/* Gestor */}
                    <div className="border border-zinc-800 rounded-lg p-3 mt-2 flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-zinc-200">Gestor de habilidades (SRD)</h3>
                            {preparedInfo && <p className="text-[11px] text-zinc-400">Conjuros preparados nivel 1+: {preparedCount}/{preparedInfo.total}</p>}
                        </div>
                        <button type="button" onClick={onOpenSpellManager} className="text-xs px-3 py-2 rounded-md border border-purple-600/70 hover:bg-purple-900/40">
                            Abrir gestor en pantalla completa
                        </button>
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

            {/* estilo local para ocultar el header del block cuando está dentro de .no-header */}
            <style jsx>{`
                .no-header h4 {
                    display: none;
                }

                /* Ajuste visual del summary para que no mueva texto al activar la barra inferior */
                summary::-webkit-details-marker {
                    display: none;
                }
            `}</style>
        </div>
    );
}

export default CharacterView;
