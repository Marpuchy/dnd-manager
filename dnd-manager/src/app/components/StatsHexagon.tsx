"use client";

import React, { useState } from "react";
import {
    abilityModifier,
    formatModifier,
} from "@/app/campaigns/[id]/player/ui/playerView/statsHelpers";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Tipos
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

type StatKey = "FUE" | "DES" | "CON" | "INT" | "SAB" | "CAR";

type BonusDetail = {
    source: string;
    value: number;
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Constantes de escala
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const MAX_STAT = 30;
const DEFAULT_SIZE = 260;

const ORDER: StatKey[] = ["FUE", "DES", "CON", "INT", "SAB", "CAR"];

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ðŸŽ¨ Colores por clase (TODAS)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Helpers
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function polar(angle: number, radius: number, center: number) {
    return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
    };
}

function normalizeClass(cls?: string) {
    return cls?.toLowerCase().replace(/\s+/g, "") ?? "";
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Componente principal
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export default function StatsHexagon({
                                         stats,
                                         bonuses,
                                         bonusDetails,
                                         characterClass,
                                         size,
                                     }: {
    stats: Record<StatKey, number>;
    bonuses?: Record<StatKey, boolean>;
    bonusDetails?: Record<StatKey, BonusDetail[]>;
    characterClass?: string;
    size?: number;
}) {
    const baseSize = Math.max(220, Math.min(size ?? DEFAULT_SIZE, 520));
    const padding = Math.round(baseSize * 0.2);
    const viewBoxSize = baseSize + padding * 2;
    const center = viewBoxSize / 2;
    const radius = Math.round(baseSize * 0.35);
    const labelRadius = Math.round(baseSize * 0.52);

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
                (value / MAX_STAT) * radius,
                center
            );
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <div className="relative flex justify-center">
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-auto"
            >
                {/* Fondo */}
                {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                    <polygon
                        key={i}
                        points={angles
                            .map((a) => {
                                const { x, y } = polar(
                                    a,
                                    radius * scale,
                                    center
                                );
                                return `${x},${y}`;
                            })
                            .join(" ")}
                        fill="none"
                        stroke="var(--ring)"
                        strokeWidth="1"
                    />
                ))}

                {/* Radiales */}
                {angles.map((a, i) => {
                    const stat = ORDER[i];
                    const { x, y } = polar(a, radius, center);
                    const active = hovered === stat;

                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={x}
                            y2={y}
                            stroke={
                                active
                                    ? hexColor.stroke
                                    : "var(--ring)"
                            }
                            strokeWidth={active ? 2 : 1}
                            opacity={
                                hovered && !active ? 0.3 : 1
                            }
                            className="transition-all duration-200"
                        />
                    );
                })}

                {/* NÃºcleo */}
                <circle
                    cx={center}
                    cy={center}
                    r={6}
                    fill={hexColor.stroke}
                    opacity={0.6}
                />
                <circle
                    cx={center}
                    cy={center}
                    r={14}
                    fill={hexColor.stroke}
                    opacity={0.15}
                />

                {/* PolÃ­gono */}
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
                    const { x, y } = polar(a, labelRadius, center);

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
                                        : "var(--ink)"
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
                                        : "var(--ink)"
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
                                fill="var(--ink-muted)"
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
                    <div className="absolute bottom-0 translate-y-full mt-2 px-3 py-2 rounded-lg bg-panel/90 border border-ring text-xs text-ink shadow-xl">
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


