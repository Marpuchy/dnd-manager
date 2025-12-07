// src/app/campaigns/[id]/player/LearnedSpellBlocks.tsx
import React from "react";
import {
    LearnedSpellLine,
    SpellMeta,
    formatCastingTime,
    formatComponents,
} from "./playerShared";

type LevelBlockProps = {
    level: number;
    label: string;
    lines: LearnedSpellLine[];
    // Algunos spellDetails pueden tener entradas null si no se encontró la SRD: soportamos eso.
    spellDetails?: Record<string, SpellMeta | null>;
};

export function LearnedSpellLevelBlock({
                                           level,
                                           label,
                                           lines,
                                           spellDetails,
                                       }: LevelBlockProps) {
    // Construimos un mapa nombre->meta solo para los metadatos válidos y del nivel correspondiente.
    const metaByName: Record<string, SpellMeta> = {};

    if (spellDetails) {
        for (const key of Object.keys(spellDetails)) {
            const meta = spellDetails[key];
            if (!meta) continue; // <- protección: saltamos entradas null/undefined
            try {
                if (meta.level === level) {
                    // Guardamos por nombre tal y como esperamos que 'line.name' aparezca.
                    // Normalmente meta.name será el nombre canónico.
                    if (meta.name) metaByName[meta.name] = meta;
                }
            } catch {
                // no hacemos nada si meta tiene forma inesperada
                continue;
            }
        }
    }

    return (
        <div className="border border-zinc-800 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-zinc-200 mb-2">{label}</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {lines.map((line, i) => {
                    // 'line' podría ser string u objeto (según parseSpellLines) — normalizamos
                    const name =
                        typeof line === "string" ? line : (line && (line as any).name) || String(line);
                    // intentamos buscar meta por el nombre tal cual; si no existe, meta será undefined y la tarjeta básica se renderiza
                    const meta = metaByName[name] ?? undefined;
                    return (
                        <LearnedSpellCard
                            key={`${name}-${i}`}
                            level={level}
                            line={typeof line === "string" ? { name } : (line as any)}
                            meta={meta}
                        />
                    );
                })}
            </div>
        </div>
    );
}

type CardProps = {
    level: number;
    line: LearnedSpellLine;
    meta?: SpellMeta;
};

function LearnedSpellCard({ level, line, meta }: CardProps) {
    const typeLabel = level === 0 ? "Truco (cantrip)" : `Hechizo de nivel ${level}`;

    // Si no hay meta (no encontrado en SRD todavía) mostramos tarjeta simple con nombre y tipo
    if (!meta) {
        return (
            <div className="border border-zinc-700 rounded-md p-2">
                <p className="text-sm font-semibold text-zinc-100">{line.name}</p>
                <p className="text-[11px] text-zinc-500">{typeLabel}</p>
            </div>
        );
    }

    // Protecciones adicionales: aseguramos que campos esperados existan
    const casting = meta.casting_time ? formatCastingTime(meta.casting_time) : "—";
    const components = formatComponents(meta.components || [], meta.material);
    const range = meta.range || "—";
    const duration = meta.duration || "—";
    const school = meta.school || "—";
    const conc = meta.concentration ? "Sí" : "No";
    const ritual = meta.ritual ? "Sí" : "No";

    return (
        <div className="border border-zinc-700 rounded-md p-3 bg-zinc-900/40">
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-100">{meta.name}</p>
                    <p className="text-[11px] text-zinc-400">{typeLabel} · {school}</p>
                </div>
                <div className="text-right text-xs text-zinc-400">
                    <div>{range}</div>
                    <div>{duration}</div>
                </div>
            </div>

            <div className="mt-2 text-xs text-zinc-300 space-y-1">
                <p>
                    <span className="font-semibold">Tiempo de lanzamiento:</span> {casting}
                </p>
                <p>
                    <span className="font-semibold">Componentes:</span> {components}
                </p>
                <p>
                    <span className="font-semibold">Concentración:</span> {conc}
                </p>
                <p>
                    <span className="font-semibold">Ritual:</span> {ritual}
                </p>
            </div>

            <details className="mt-2 text-xs text-zinc-300 whitespace-pre-wrap">
                <summary className="cursor-pointer text-[11px] text-zinc-400">Ver descripción completa</summary>
                <div className="mt-1">
                    {meta.fullDesc ?? meta.shortDesc ?? "Sin descripción en la SRD."}
                </div>
            </details>
        </div>
    );
}

export default LearnedSpellLevelBlock;
