"use client";

import React, { useState } from "react";
import {
    abilityModifier,
    formatModifier,
} from "@/app/campaigns/[id]/player/ui/playerView/statsHelpers";

/* ─────────────────────────────
   Tipos
───────────────────────────── */

type StatKey = "FUE" | "DES" | "CON" | "INT" | "SAB" | "CAR";

type BonusDetail = {
    source: string;
    value: number;
};

/* ─────────────────────────────
   Constantes de escala
───────────────────────────── */

const MAX_STAT = 30;

const SIZE = 260;
const PADDING = 50;
const VIEWBOX_SIZE = SIZE + PADDING * 2;
const CENTER = VIEWBOX_SIZE / 2;

const isMobile =
    typeof window !== "undefined" && window.innerWidth < 640;

const RADIUS = isMobile ? 70 : 90;
const LABEL_RADIUS = isMobile ? 110 : 135;

const ORDER: StatKey[] = ["FUE", "DES", "CON", "INT", "SAB", "CAR"];

/* ─────────────────────────────
   🎨 Colores por clase (TODAS)
───────────────────────────── */

const CLASS_COLORS: Record<
    string,
    { stroke: string; fill: string }
> = {
    barbarian: {
        stroke: "#dc2626",
        fill: "rgba(220,38,38,0.35)",
    },
    bard: {
        stroke: "#c026d3",
        fill: "rgba(192,38,211,0.35)",
    },
    cleric: {
        stroke: "#eab308",
        fill: "rgba(234,179,8,0.35)",
    },
    druid: {
        stroke: "#16a34a",
        fill: "rgba(22,163,74,0.35)",
    },
    fighter: {
        stroke: "#f97316",
        fill: "rgba(249,115,22,0.35)",
    },
    monk: {
        stroke: "#0ea5e9",
        fill: "rgba(14,165,233,0.35)",
    },
    paladin: {
        stroke: "#fde047",
        fill: "rgba(253,224,71,0.35)",
    },
    ranger: {
        stroke: "#22c55e",
        fill: "rgba(34,197,94,0.35)",
    },
    rogue: {
        stroke: "#4ade80",
        fill: "rgba(74,222,128,0.35)",
    },
    sorcerer: {
        stroke: "#a855f7",
        fill: "rgba(168,85,247,0.35)",
    },
    warlock: {
        stroke: "#7c3aed",
        fill: "rgba(124,58,237,0.35)",
    },
    wizard: {
        stroke: "#3b82f6",
        fill: "rgba(59,130,246,0.35)",
    },
    artificer: {
        stroke: "#14b8a6",
        fill: "rgba(20,184,166,0.35)",
    },
    customclass: {
        stroke: "#f472b6",
        fill: "rgba(244,114,182,0.35)",
    },
    default: {
        stroke: "#10b981",
        fill: "rgba(16,185,129,0.35)",
    },
};

/* ─────────────────────────────
   Helpers
───────────────────────────── */

function polar(angle: number, radius: number) {
    return {
        x: CENTER + radius * Math.cos(angle),
        y: CENTER + radius * Math.sin(angle),
    };
}

function normalizeClass(cls?: string) {
    return cls?.toLowerCase().replace(/\s+/g, "") ?? "";
}

/* ─────────────────────────────
   Componente principal
───────────────────────────── */

export default function StatsHexagon({
                                         stats,
                                         bonuses,
                                         bonusDetails,
                                         characterClass,
                                     }: {
    stats: Record<StatKey, number>;
    bonuses?: Record<StatKey, boolean>;
    bonusDetails?: Record<StatKey, BonusDetail[]>;
    characterClass?: string;
}) {
    const [hovered, setHovered] = useState<StatKey | null>(null);

    /* Valores seguros para TS */
    const safeBonuses: Record<StatKey, boolean> = bonuses ?? {
        FUE: false,
        DES: false,
        CON: false,
        INT: false,
        SAB: false,
        CAR: false,
    };

    const safeBonusDetails: Record<StatKey, BonusDetail[]> =
        bonusDetails ?? {
            FUE: [],
            DES: [],
            CON: [],
            INT: [],
            SAB: [],
            CAR: [],
        };

    const angles = ORDER.map(
        (_, i) => (Math.PI * 2 * i) / ORDER.length - Math.PI / 2
    );

    const clsKey = normalizeClass(characterClass);
    const hexColor =
        CLASS_COLORS[clsKey] ?? CLASS_COLORS.default;

    const statPoints = angles
        .map((angle, i) => {
            const value = Math.min(
                MAX_STAT,
                Math.max(0, stats[ORDER[i]])
            );
            const { x, y } = polar(
                angle,
                (value / MAX_STAT) * RADIUS
            );
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <div className="relative flex justify-center">
            <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
            >
                {/* Fondo */}
                {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                    <polygon
                        key={i}
                        points={angles
                            .map((a) => {
                                const { x, y } = polar(
                                    a,
                                    RADIUS * scale
                                );
                                return `${x},${y}`;
                            })
                            .join(" ")}
                        fill="none"
                        stroke="#3f3f46"
                        strokeWidth="1"
                    />
                ))}

                {/* Radiales */}
                {angles.map((a, i) => {
                    const stat = ORDER[i];
                    const { x, y } = polar(a, RADIUS);
                    const active = hovered === stat;

                    return (
                        <line
                            key={i}
                            x1={CENTER}
                            y1={CENTER}
                            x2={x}
                            y2={y}
                            stroke={
                                active
                                    ? hexColor.stroke
                                    : "#3f3f46"
                            }
                            strokeWidth={active ? 2 : 1}
                            opacity={
                                hovered && !active ? 0.3 : 1
                            }
                            className="transition-all duration-200"
                        />
                    );
                })}

                {/* Núcleo */}
                <circle
                    cx={CENTER}
                    cy={CENTER}
                    r={6}
                    fill={hexColor.stroke}
                    opacity={0.6}
                />
                <circle
                    cx={CENTER}
                    cy={CENTER}
                    r={14}
                    fill={hexColor.stroke}
                    opacity={0.15}
                />

                {/* Polígono */}
                <polygon
                    points={statPoints}
                    fill={hexColor.fill}
                    stroke={hexColor.stroke}
                    strokeWidth="2"
                    className="transition-all duration-500 ease-out"
                />

                {/* Labels */}
                {angles.map((a, i) => {
                    const stat = ORDER[i];
                    const value = stats[stat];
                    const mod = abilityModifier(value);
                    const buffed = safeBonuses[stat];
                    const { x, y } = polar(a, LABEL_RADIUS);

                    return (
                        <g
                            key={stat}
                            onMouseEnter={() => setHovered(stat)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <text
                                x={x}
                                y={y - 14}
                                textAnchor="middle"
                                fontSize="14"
                                fill={
                                    buffed
                                        ? hexColor.stroke
                                        : "#e4e4e7"
                                }
                                fontWeight="700"
                            >
                                {stat}
                            </text>

                            <text
                                x={x}
                                y={y + 8}
                                textAnchor="middle"
                                fontSize="20"
                                fill={
                                    buffed
                                        ? hexColor.stroke
                                        : "#fafafa"
                                }
                                fontWeight="800"
                                className={
                                    buffed
                                        ? "drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                                        : ""
                                }
                            >
                                {value}
                            </text>

                            <text
                                x={x}
                                y={y + 26}
                                textAnchor="middle"
                                fontSize="13"
                                fill="#a1a1aa"
                                fontWeight="600"
                            >
                                ({formatModifier(mod)})
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Tooltip */}
            {hovered &&
                safeBonusDetails[hovered].length > 0 && (
                    <div className="absolute bottom-0 translate-y-full mt-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 shadow-xl">
                        {safeBonusDetails[hovered].map(
                            (b, i) => (
                                <div key={i}>
                                    {b.source}:{" "}
                                    {b.value > 0
                                        ? `+${b.value}`
                                        : b.value}
                                </div>
                            )
                        )}
                    </div>
                )}
        </div>
    );
}
