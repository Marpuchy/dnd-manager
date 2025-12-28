"use client";

import React from "react";
import {Details, Armor, Weapon, Stats} from "../../playerShared";
import {abilityModifier, formatModifier} from "./statsHelpers";
import {getSpellSlotsFor} from "@/lib/spellSlots";
import StatsHexagon from "../../../../../components/StatsHexagon";

/* ─────────────────────────────
   Helpers internos
───────────────────────────── */

type SimpleMod = {
    ability: "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";
    modifier: number;
};

function extractModifiersFromItem(item: any): SimpleMod[] {
    const out: SimpleMod[] = [];
    if (!item) return out;

    if (Array.isArray(item.modifiers)) {
        for (const m of item.modifiers) {
            if (!m) continue;
            const ability = (m.ability || m.statAbility || m.stat_ability) as any;
            const modifier = Number(m.modifier ?? m.value);
            if (!ability || Number.isNaN(modifier)) continue;
            out.push({
                ability: String(ability).toUpperCase() as SimpleMod["ability"],
                modifier,
            });
        }
    }

    if (item.stat_ability && typeof item.stat_modifier === "number") {
        out.push({
            ability: String(item.stat_ability).toUpperCase() as SimpleMod["ability"],
            modifier: item.stat_modifier,
        });
    }

    return out;
}

function resolveArmorDescription(armor: any): string | null {
    if (!armor) return null;
    const d =
        armor.description ??
        armor.meta?.description ??
        armor.meta?.desc ??
        null;
    return typeof d === "string" && d.trim() ? d : null;
}

/* ─────────────────────────────
   Componente principal
───────────────────────────── */

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
}) {
    const armors: Armor[] = Array.isArray(details?.armors)
        ? details!.armors
        : [];

    const weapon: Weapon | null =
        (details?.weaponEquipped as Weapon) ?? null;

    const spellSlots =
        character?.class && character?.level
            ? getSpellSlotsFor(character.class, character.level)
            : null;

    /* ────────────────
       Subida de imagen
    ──────────────── */

    async function handleImageUpload(
        e: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = e.target.files?.[0];
        if (!file || !character?.id || !onDetailsChange) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("characterId", character.id);

        const res = await fetch("/api/dnd/characters/upload-image", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) return;

        const {imageUrl} = await res.json();

        onDetailsChange({
            ...(details ?? {}),
            profile_image: imageUrl,
        });
    }

    /* ───────────────────────── */
    console.log("PROFILE IMAGE:", details?.profile_image);

    return (
        <div className="space-y-6">
            {/* Imagen + Stats base */}
            {/* Imagen + Stats */}
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4">
                {/* Imagen de personaje */}
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3 flex flex-col items-center">
                    <div className="w-28 h-28 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                        {details?.profile_image &&
                        details.profile_image.startsWith("http") ? (
                            <img
                                src={details.profile_image}
                                alt="Imagen del personaje"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-xs text-zinc-500 text-center px-2">
                    Sin imagen
                </span>
                        )}
                    </div>

                    <label className="mt-3 text-xs cursor-pointer text-emerald-400 hover:underline">
                        Cambiar imagen
                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleImageUpload}
                        />
                    </label>
                </div>

                {/* Stats */}
                <div className="space-y-4">
                    {/* Vida / CA / Velocidad */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                            <span className="text-[11px] text-zinc-400">Vida</span>
                            <div className="mt-2 text-sm text-zinc-200">
                                {character?.current_hp ?? details?.current_hp ?? "?"} /{" "}
                                {character?.max_hp ?? details?.max_hp ?? "?"}
                            </div>
                        </div>

                        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                <span className="text-[11px] text-zinc-400">
                    Clase de armadura
                </span>
                            <div className="mt-2 text-sm text-zinc-200">
                                {totalAC}
                            </div>
                        </div>

                        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                <span className="text-[11px] text-zinc-400">
                    Velocidad
                </span>
                            <div className="mt-2 text-sm text-zinc-200">
                                {character?.speed ?? 30} ft
                            </div>
                        </div>
                    </div>

                    {/* Atributos */}
                    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
                        <StatsHexagon
                            stats={{
                                FUE: totalStr,
                                DES: totalDex,
                                CON: totalCon,
                                INT: totalInt,
                                SAB: totalWis,
                                CAR: totalCha,
                            }}
                        />
                    </div>

                </div>
            </div>

            {/* Armaduras / Arma */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Armaduras */}
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                    <h3 className="text-sm font-semibold text-zinc-200 mb-2">
                        Armaduras
                    </h3>

                    {armors.length === 0 ? (
                        <p className="text-xs text-zinc-500">
                            No tienes armaduras registradas.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {armors.map((armor) => {
                                const mods =
                                    extractModifiersFromItem(armor);
                                const desc =
                                    resolveArmorDescription(armor);

                                return (
                                    <div
                                        key={armor.id ?? armor.name}
                                        className="rounded-lg bg-zinc-900 px-3 py-3 border border-zinc-700"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-semibold text-zinc-200">
                                                {armor.name}
                                            </span>
                                            <span className="text-xs text-zinc-400">
                                                (CA{" "}
                                                {armor.bonus >= 0
                                                    ? `+${armor.bonus}`
                                                    : armor.bonus}
                                                )
                                            </span>
                                            {armor.equipped && (
                                                <span
                                                    className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-600 text-emerald-300">
                                                    Equipada
                                                </span>
                                            )}
                                        </div>

                                        {desc && (
                                            <p className="text-[11px] text-zinc-400 mt-2 whitespace-pre-wrap">
                                                {desc}
                                            </p>
                                        )}

                                        {mods.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {mods.map((m, i) => (
                                                    <span
                                                        key={i}
                                                        className={`text-[10px] px-1.5 py-0.5 rounded-md border ${
                                                            m.modifier >= 0
                                                                ? "border-emerald-700 text-emerald-300"
                                                                : "border-rose-600 text-rose-300"
                                                        }`}
                                                    >
                                                        {m.ability}{" "}
                                                        {m.modifier >= 0
                                                            ? `+${m.modifier}`
                                                            : m.modifier}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Arma */}
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                    <h3 className="text-sm font-semibold text-zinc-200 mb-2">
                        Arma equipada
                    </h3>

                    {!weapon ? (
                        <p className="text-sm text-zinc-500">
                            Sin arma equipada
                        </p>
                    ) : (
                        <div className="rounded-lg bg-zinc-900 px-3 py-3 border border-zinc-700">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-zinc-200">
                                    {weapon.name}
                                </span>
                                {weapon.damage && (
                                    <span className="text-xs text-zinc-400">
                                        ({weapon.damage})
                                    </span>
                                )}
                            </div>

                            {weapon.description && (
                                <p className="text-[11px] text-zinc-400 mt-2 whitespace-pre-wrap">
                                    {weapon.description}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Espacios de conjuro / Dotes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                    <h3 className="text-sm font-semibold text-zinc-200">
                        Espacios de conjuro
                    </h3>

                    <div className="mt-3">
                        {!spellSlots ? (
                            <p className="text-xs text-zinc-500">
                                Esta clase no tiene espacios de conjuro.
                            </p>
                        ) : "slots" in spellSlots ? (
                            <p className="text-xs text-zinc-300">
                                Brujo: {(spellSlots as any).slots} espacios
                                (nivel {(spellSlots as any).slotLevel})
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(spellSlots)
                                    .filter(
                                        ([lvl, num]) =>
                                            Number(lvl) > 0 &&
                                            Number(num) > 0
                                    )
                                    .map(([lvl, num]) => (
                                        <span
                                            key={lvl}
                                            className="px-2 py-1 rounded-md border border-zinc-700 text-xs text-zinc-300"
                                        >
                                            Nivel {lvl}: {num}
                                        </span>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                    <h3 className="text-sm font-semibold text-zinc-200">
                        Dotes y rasgos
                    </h3>

                    {details?.abilities ? (
                        <pre className="whitespace-pre-wrap text-sm text-zinc-300 mt-2">
                            {details.abilities}
                        </pre>
                    ) : (
                        <p className="text-xs text-zinc-500 mt-2">
                            No se han registrado dotes o rasgos.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
