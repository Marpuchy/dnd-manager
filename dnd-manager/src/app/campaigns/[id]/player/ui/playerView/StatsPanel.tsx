"use client";

import React from "react";
import { Details, Armor, Weapon, Stats } from "../../playerShared";
import { getSpellSlotsFor } from "@/lib/spellSlots";
import StatsHexagon from "../../../../../components/StatsHexagon";

/* ─────────────────────────────
   Tipos y helpers
───────────────────────────── */

type SimpleMod = {
    ability: "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";
    modifier: number;
};
function SpellSlotOrb({ level }: { level: number }) {
    const gradientByLevel: Record<number, string> = {
        1: "from-sky-200 to-sky-400",
        2: "from-sky-300 to-cyan-500",
        3: "from-cyan-400 to-blue-600",
        4: "from-blue-500 to-indigo-600",
        5: "from-indigo-600 to-violet-700",
        6: "from-violet-700 to-purple-800",
        7: "from-purple-800 to-fuchsia-900",
        8: "from-fuchsia-900 to-indigo-950",
        9: "from-indigo-950 to-black",
    };

    return (
        <div
            className={`
                relative w-5 h-5 rounded-full
                bg-gradient-to-br ${gradientByLevel[level]}
                border border-white/20
                animate-[spellPulse_3.5s_ease-in-out_infinite]
            `}
            title={`Espacio de conjuro de nivel ${level}`}
        >
            {/* brillo interno */}
            <div
                className="absolute inset-1 rounded-full bg-white/30
                           animate-[spellInnerGlow_2.5s_ease-in-out_infinite]"
            />

            {/* núcleo oscuro para niveles altos */}
            {level >= 7 && (
                <div className="absolute inset-2 rounded-full bg-black/50" />
            )}
        </div>
    );
}


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
                                       onImageUpdated,
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
    onImageUpdated?: () => void;
}) {
    const armors: Armor[] = Array.isArray(details?.armors)
        ? details.armors
        : [];

    const weapon: Weapon | null =
        (details?.weaponEquipped as Weapon) ?? null;

    const spellSlots =
        character?.class && character?.level
            ? getSpellSlotsFor(character.class, character.level)
            : null;

    /* ───────── Imagen persistente ───────── */
    const profileImage = character?.profile_image;

    /* ───────── Subida de imagen ───────── */

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !character?.id) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("characterId", character.id);

        const res = await fetch("/api/dnd/characters/upload-image", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            console.error("Error subiendo imagen");
            return;
        }

        // 🔁 Avisamos al padre para que recargue personajes
        onImageUpdated?.();
    }

    /* ───────── Bonus por stat ───────── */

    function getBonusDetails(stat: SimpleMod["ability"]) {
        return armors.flatMap((armor) =>
            extractModifiersFromItem(armor)
                .filter((m) => m.ability === stat && m.modifier !== 0)
                .map((m) => ({
                    source: armor.name,
                    value: m.modifier,
                }))
        );
    }

    function hasBonus(stat: SimpleMod["ability"]) {
        return getBonusDetails(stat).length > 0;
    }

    /* ───────────────────────────── */

    return (
        <div className="space-y-6">
            <style jsx global>{`
                @keyframes spellPulse {
                    0%, 100% {
                        box-shadow: 0 0 6px rgba(120, 180, 255, 0.35),
                        0 0 12px rgba(120, 180, 255, 0.15);
                        transform: scale(1);
                    }
                    50% {
                        box-shadow: 0 0 10px rgba(140, 160, 255, 0.55),
                        0 0 18px rgba(140, 160, 255, 0.35);
                        transform: scale(1.05);
                    }
                }

                @keyframes spellInnerGlow {
                    0%, 100% {
                        opacity: 0.35;
                    }
                    50% {
                        opacity: 0.7;
                    }
                }
            `}</style>

            {/* ───────── BLOQUE SUPERIOR ───────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
                {/* Imagen personaje */}
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
                    <div className="w-full aspect-[3/5] rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
                        {profileImage?.startsWith("http") ? (
                            <img
                                src={profileImage}
                                alt="Imagen del personaje"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                                Sin imagen
                            </div>
                        )}
                    </div>

                    <label className="mt-3 block text-xs text-center cursor-pointer text-emerald-400 hover:underline">
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
                    <div className="grid grid-cols-3 gap-4">
                        <StatBox label="Vida">
                            {character?.current_hp ?? details?.current_hp ?? "?"} /{" "}
                            {character?.max_hp ?? details?.max_hp ?? "?"}
                        </StatBox>

                        <StatBox label="CA">{totalAC}</StatBox>

                        <StatBox label="Velocidad">
                            {character?.speed ?? 30} ft
                        </StatBox>
                    </div>

                    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
                        <StatsHexagon
                            characterClass={character?.class}
                            stats={{
                                FUE: totalStr,
                                DES: totalDex,
                                CON: totalCon,
                                INT: totalInt,
                                SAB: totalWis,
                                CAR: totalCha,
                            }}
                            bonuses={{
                                FUE: hasBonus("STR"),
                                DES: hasBonus("DEX"),
                                CON: hasBonus("CON"),
                                INT: hasBonus("INT"),
                                SAB: hasBonus("WIS"),
                                CAR: hasBonus("CHA"),
                            }}
                            bonusDetails={{
                                FUE: getBonusDetails("STR"),
                                DES: getBonusDetails("DEX"),
                                CON: getBonusDetails("CON"),
                                INT: getBonusDetails("INT"),
                                SAB: getBonusDetails("WIS"),
                                CAR: getBonusDetails("CHA"),
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ───────── ARMADURAS / ARMA ───────── */}
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
                                const mods = extractModifiersFromItem(armor);
                                const desc = resolveArmorDescription(armor);

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
                                                (CA {armor.bonus >= 0 ? `+${armor.bonus}` : armor.bonus})
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
                                                        {m.ability} {m.modifier >= 0 ? `+${m.modifier}` : m.modifier}
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

            {/* ───────── CONJUROS / DOTES ───────── */}
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
                                Brujo: {(spellSlots as any).slots} espacios (nivel {(spellSlots as any).slotLevel})
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {Object.entries(spellSlots)
                                    .filter(([lvl, num]) => Number(lvl) > 0 && Number(num) > 0)
                                    .map(([lvl, num]) => {
                                        const level = Number(lvl);

                                        return (
                                            <div key={lvl} className="flex items-center gap-3">
                                                {/* Nivel */}
                                                <span className="w-14 text-xs text-zinc-400">
                        Nivel {lvl}
                    </span>

                                                {/* Orbes */}
                                                <div className="flex gap-2">
                                                    {Array.from({length: Number(num)}).map((_, i) => (
                                                        <SpellSlotOrb
                                                            key={i}
                                                            level={level}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
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

/* ───────── Subcomponente ───────── */

function StatBox({
                     label,
                     children,
                 }: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
            <span className="text-[11px] text-zinc-400">{label}</span>
            <div className="mt-1 text-sm text-zinc-200">{children}</div>
        </div>
    );
}
