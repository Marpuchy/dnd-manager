"use client";

import React from "react";
import {
    abilityModifier,
    formatModifier,
} from "@/app/campaigns/[id]/player/ui/playerView/statsHelpers";

type StatKey = "FUE" | "DES" | "CON" | "INT" | "SAB" | "CAR";

const MAX_STAT = 30;

// Tamaño visible
const SIZE = 260;

// Padding interno REAL del SVG (clave 🔑)
const PADDING = 40;

// Área total del SVG
const VIEWBOX_SIZE = SIZE + PADDING * 2;

// Centro real del gráfico
const CENTER = VIEWBOX_SIZE / 2;

// Radios
const RADIUS = 90;
const LABEL_RADIUS = 130;

const ORDER: StatKey[] = ["FUE", "DES", "CON", "INT", "SAB", "CAR"];

function polar(angle: number, radius: number) {
    return {
        x: CENTER + radius * Math.cos(angle),
        y: CENTER + radius * Math.sin(angle),
    };
}

export default function StatsHexagon({
                                         stats,
                                     }: {
    stats: Record<StatKey, number>;
}) {
    const angles = ORDER.map(
        (_, i) => (Math.PI * 2 * i) / ORDER.length - Math.PI / 2
    );

    const statPoints = angles
        .map((angle, i) => {
            const value = Math.min(
                MAX_STAT,
                Math.max(0, stats[ORDER[i]])
            );
            const { x, y } = polar(angle, (value / MAX_STAT) * RADIUS);
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <div className="flex justify-center">
            <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
            >
                {/* Hexágonos de fondo */}
                {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                    <polygon
                        key={i}
                        points={angles
                            .map((a) => {
                                const { x, y } = polar(a, RADIUS * scale);
                                return `${x},${y}`;
                            })
                            .join(" ")}
                        fill="none"
                        stroke="#3f3f46"
                        strokeWidth="1"
                    />
                ))}

                {/* Líneas radiales */}
                {angles.map((a, i) => {
                    const { x, y } = polar(a, RADIUS);
                    return (
                        <line
                            key={i}
                            x1={CENTER}
                            y1={CENTER}
                            x2={x}
                            y2={y}
                            stroke="#3f3f46"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Polígono de stats */}
                <polygon
                    points={statPoints}
                    fill="rgba(16,185,129,0.35)"
                    stroke="#10b981"
                    strokeWidth="2"
                />

                {/* Labels + valor + modificador */}
                {angles.map((a, i) => {
                    const stat = ORDER[i];
                    const value = stats[stat];
                    const mod = abilityModifier(value);
                    const { x, y } = polar(a, LABEL_RADIUS);

                    return (
                        <g key={stat}>
                            <text
                                x={x}
                                y={y - 14}
                                textAnchor="middle"
                                fontSize="14"
                                fill="#e4e4e7"
                                fontWeight="700"
                            >
                                {stat}
                            </text>

                            <text
                                x={x}
                                y={y + 8}
                                textAnchor="middle"
                                fontSize="20"
                                fill="#fafafa"
                                fontWeight="800"
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
        </div>
    );
}
