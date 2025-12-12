"use client";

import React from "react";
import { Details, Armor, Weapon, Stats } from "../../playerShared";
import { abilityModifier, formatModifier } from "./statsHelpers";
import { getSpellSlotsFor } from "@/lib/spellSlots";

type SimpleMod = { ability: "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA"; modifier: number };

function extractModifiersFromItem(item: any): SimpleMod[] {
    const out: SimpleMod[] = [];
    if (!item) return out;

    if (Array.isArray(item.modifiers)) {
        for (const m of item.modifiers) {
            if (!m) continue;
            const ability = (m.ability || m.statAbility || m.stat_ability || m.ability_key) as any;
            const modifier = typeof m.modifier === "number" ? m.modifier : (typeof m.value === "number" ? m.value : Number(m.mod || m.amount || NaN));
            if (!ability || Number.isNaN(modifier)) continue;
            out.push({ ability: String(ability).toUpperCase() as SimpleMod["ability"], modifier: Number(modifier) });
        }
    }

    if (item.ability && (typeof item.modifier === "number" || typeof item.modifier === "string")) {
        const modNum = Number(item.modifier);
        if (!Number.isNaN(modNum)) {
            out.push({ ability: String(item.ability).toUpperCase() as SimpleMod["ability"], modifier: modNum });
        }
    }

    const statAbility = item.statAbility ?? item.stat_ability ?? item.stat_ability_key ?? item.stat_ability_name;
    const statModifier = (item.statModifier ?? item.stat_modifier ?? item.stat_modifier_value ?? item.stat_mod);
    if (statAbility && (typeof statModifier === "number" || typeof statModifier === "string")) {
        const mnum = Number(statModifier);
        if (!Number.isNaN(mnum)) {
            out.push({ ability: String(statAbility).toUpperCase() as SimpleMod["ability"], modifier: mnum });
        }
    }

    if ((typeof item.modifier === "number" || typeof item.modifier === "string") && item.ability) {
        const mnum = Number(item.modifier);
        if (!Number.isNaN(mnum)) {
            out.push({ ability: String(item.ability).toUpperCase() as SimpleMod["ability"], modifier: mnum });
        }
    }

    if (out.length > 1) {
        const byAbility: Record<string, number> = {};
        for (const m of out) {
            byAbility[m.ability] = (byAbility[m.ability] || 0) + m.modifier;
        }
        return Object.keys(byAbility).map((k) => ({ ability: k as SimpleMod["ability"], modifier: byAbility[k] }));
    }

    return out;
}

function resolveArmorDescription(armor: any): string | null {
    // Compatibilidad: descripción puede estar en fields distintos según origen
    if (!armor) return null;
    const maybe = armor.description ?? armor.ability ?? (armor.meta && (armor.meta.description || armor.meta.desc)) ?? null;
    if (typeof maybe === "string" && maybe.trim() !== "") return maybe;
    return null;
}

export default function StatsPanel({
                                       character,
                                       details,
                                       statsRow,
                                       totalAC,
                                       totalStr,
                                       totalDex,
                                       totalCon,
                                       totalInt,
                                       totalWis,
                                       totalCha,
                                       onDetailsChange,
                                       onCharacterStatChange,

                                   }: {
    character: any;
    details: Details | null;
    statsRow: Partial<Stats> | Record<string, number>;
    totalAC: number;
    totalStr: number;
    totalDex: number;
    totalCon: number;
    totalInt: number;
    totalWis: number;
    totalCha: number;

    onDetailsChange?: (d: Details) => void;
    onCharacterStatChange?: (ns: Record<string, number>) => void;
}) {
    const statsBase = {
        str: Number(statsRow?.str ?? 10),
        dex: Number(statsRow?.dex ?? 10),
        con: Number(statsRow?.con ?? 10),
        int: Number(statsRow?.int ?? 10),
        wis: Number(statsRow?.wis ?? 10),
        cha: Number(statsRow?.cha ?? 10),
    };

    const armors: Armor[] = Array.isArray(details?.armors) ? (details!.armors as Armor[]) : [];
    const weapon: Weapon | null = (details?.weaponEquipped as Weapon) ?? null;

    const spellSlots = character?.class && character?.level ? getSpellSlotsFor(character.class, character.level) : null;

    return (
        <div className="space-y-6">
            {/* Primera fila */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3 flex flex-col">
                    <span className="text-[11px] text-zinc-400">Vida</span>
                    <div className="mt-2 text-sm text-zinc-200">{character?.current_hp ?? details?.current_hp ?? "?"} / {character?.max_hp ?? details?.max_hp ?? "?"}</div>
                </div>

                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3 flex flex-col">
                    <span className="text-[11px] text-zinc-400">Clase de armadura</span>
                    <div className="mt-2 text-sm text-zinc-200">{totalAC}</div>
                </div>

                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3 flex flex-col">
                    <span className="text-[11px] text-zinc-400">Velocidad</span>
                    <div className="mt-2 text-sm text-zinc-200">{character?.speed ?? 30} ft</div>
                </div>
            </div>

            {/* Atributos */}
            <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {[
                        { key: "FUE", value: totalStr },
                        { key: "DES", value: totalDex },
                        { key: "CON", value: totalCon },
                        { key: "INT", value: totalInt },
                        { key: "SAB", value: totalWis },
                        { key: "CAR", value: totalCha },
                    ].map((s) => {
                        const mod = abilityModifier(Number(s.value));
                        return (
                            <div key={s.key} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3 flex flex-col items-center text-center">
                                <span className="text-[11px] text-zinc-400">{s.key}</span>

                                <div className="mt-2 flex flex-col items-center">
                                    <span className="text-2xl font-semibold text-zinc-100 leading-none">
                                        {s.value}
                                    </span>
                                    <span className="text-[11px] text-zinc-500 leading-none mt-1">
                                        ({formatModifier(mod)})
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Armaduras / Arma */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-zinc-200">Armaduras</h3>
                    </div>

                    {armors.length === 0 ? (
                        <p className="text-xs text-zinc-500">No tienes armaduras registradas.</p>
                    ) : (
                        <div className="space-y-3">
                            {armors.map((armor) => {
                                const mods = extractModifiersFromItem(armor);
                                const hasMods = mods.length > 0;
                                const desc = resolveArmorDescription(armor);

                                return (
                                    <div key={armor.id ?? armor.name} className="rounded-lg bg-zinc-900 px-3 py-3 border border-zinc-700">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-semibold text-zinc-200">{armor.name}</span>
                                                    <span className="text-xs text-zinc-400">(CA {armor.bonus >= 0 ? `+${armor.bonus}` : armor.bonus})</span>
                                                    {armor.equipped ? <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-600 text-emerald-300">Equipada</span> : null}
                                                </div>
                                                {desc ? <p className="text-[11px] text-zinc-400 mt-2 whitespace-pre-wrap">{desc}</p> : null}
                                            </div>
                                        </div>

                                        {hasMods && (
                                            <>
                                                <hr className="my-2 border-zinc-800" />
                                                <div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {mods.map((m, i) => (
                                                            <div
                                                                key={i}
                                                                className={`text-[10px] px-1.5 py-0.5 rounded-md border ${m.modifier >= 0 ? "border-emerald-700 text-emerald-300/90" : "border-rose-600 text-rose-300/90"} bg-zinc-800/20`}
                                                                title={`${m.ability} ${m.modifier >= 0 ? `+${m.modifier}` : m.modifier}`}
                                                            >
                                                                {m.ability} {m.modifier >= 0 ? `+${m.modifier}` : m.modifier}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-zinc-200">Arma equipada</h3>
                    </div>

                    {!weapon ? (
                        <p className="text-sm text-zinc-500">Sin arma equipada</p>
                    ) : (
                        <div className="rounded-lg bg-zinc-900 px-3 py-3 border border-zinc-700">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-zinc-200">{weapon.name}</span>
                                        {weapon.damage ? <span className="text-xs text-zinc-400">({weapon.damage})</span> : null}
                                        {weapon.is_proficient ? <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-600 text-emerald-300">Competente</span> : null}
                                    </div>
                                    {weapon.description ? <p className="text-[11px] text-zinc-400 mt-2 whitespace-pre-wrap">{weapon.description}</p> : null}
                                </div>
                            </div>

                            {extractModifiersFromItem(weapon).length > 0 && (
                                <>
                                    <hr className="my-2 border-zinc-800" />
                                    <div>
                                        <div className="flex flex-wrap gap-2">
                                            {extractModifiersFromItem(weapon).map((m, i) => (
                                                <div
                                                    key={i}
                                                    className={`text-[10px] px-1.5 py-0.5 rounded-md border ${m.modifier >= 0 ? "border-emerald-700 text-emerald-300/90" : "border-rose-600 text-rose-300/90"} bg-zinc-800/20`}
                                                    title={`${m.ability} ${m.modifier >= 0 ? `+${m.modifier}` : m.modifier}`}
                                                >
                                                    {m.ability} {m.modifier >= 0 ? `+${m.modifier}` : m.modifier}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Espacios de conjuro / Dotes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                    <h3 className="text-sm font-semibold text-zinc-200">Espacios de conjuro</h3>

                    <div className="mt-3">
                        {!spellSlots ? (
                            <p className="text-xs text-zinc-500">Esta clase/nivel no tiene espacios de conjuro estándar o no hay clase/nivel proporcionados.</p>
                        ) : "slots" in spellSlots ? (
                            <p className="text-xs text-zinc-300">Brujo: { (spellSlots as any).slots } espacios de pacto · Nivel de espacio: { (spellSlots as any).slotLevel }</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(spellSlots || {})
                                    .filter(([lvl, num]) => Number(lvl) > 0 && (num as number) > 0)
                                    .map(([lvl, num]) => (
                                        <span key={lvl} className="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-700 text-xs text-zinc-300">
                      Nivel {lvl}: {num}
                    </span>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                    <h3 className="text-sm font-semibold text-zinc-200">Dotes y rasgos</h3>
                    {details?.abilities ? <pre className="whitespace-pre-wrap text-sm text-zinc-300 mt-2">{details.abilities}</pre> : <p className="text-xs text-zinc-500 mt-2">No se han registrado dotes o rasgos.</p>}
                </div>
            </div>
        </div>
    );
}
