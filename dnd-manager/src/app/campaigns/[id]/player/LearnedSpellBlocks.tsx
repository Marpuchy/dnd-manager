// src/app/campaigns/[id]/player/LearnedSpellBlocks.tsx
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
    spellDetails?: Record<string, SpellMeta>;
};

export function LearnedSpellLevelBlock({
                                           level,
                                           label,
                                           lines,
                                           spellDetails,
                                       }: LevelBlockProps) {
    const metaByName: Record<string, SpellMeta> = {};
    if (spellDetails) {
        Object.values(spellDetails).forEach((meta) => {
            if (meta.level === level) {
                metaByName[meta.name] = meta;
            }
        });
    }

    return (
        <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
            <h4 className="text-xs font-semibold text-zinc-300 mb-1">{label}</h4>
            <div className="space-y-2">
                {lines.map((line, i) => (
                    <LearnedSpellCard
                        key={`${line.name}-${i}`}
                        level={level}
                        line={line}
                        meta={metaByName[line.name]}
                    />
                ))}
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
    const typeLabel =
        level === 0 ? "Truco (cantrip)" : `Hechizo de nivel ${level}`;

    if (!meta) {
        return (
            <div className="border border-zinc-700 rounded-md p-2">
                <p className="text-sm font-semibold text-zinc-100">{line.name}</p>
                <p className="text-[11px] text-zinc-500">{typeLabel}</p>
            </div>
        );
    }

    const componentsText = formatComponents(meta.components, meta.material);
    const castingTime = formatCastingTime(meta.casting_time);
    const range = meta.range || "—";
    const duration = meta.duration || "—";
    const school = meta.school || "—";
    const conc = meta.concentration ? "Sí" : "No";
    const ritual = meta.ritual ? "Sí" : "No";

    return (
        <div className="border border-zinc-700 rounded-md p-2 space-y-1 bg-zinc-950/40">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-zinc-100">{meta.name}</p>
                    <p className="text-[11px] text-zinc-500">
                        {typeLabel} · Escuela: {school}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-zinc-400 mt-1">
                <p>
                    <span className="font-semibold">Tiempo de lanzamiento:</span>{" "}
                    {castingTime}
                </p>
                <p>
                    <span className="font-semibold">Alcance:</span> {range}
                </p>
                <p>
                    <span className="font-semibold">Duración:</span> {duration}
                </p>
                <p>
                    <span className="font-semibold">Componentes:</span> {componentsText}
                </p>
                <p>
                    <span className="font-semibold">Concentración:</span> {conc}
                </p>
                <p>
                    <span className="font-semibold">Ritual:</span> {ritual}
                </p>
            </div>

            <details className="mt-2 text-xs text-zinc-300 whitespace-pre-wrap">
                <summary className="cursor-pointer text-[11px] text-zinc-400">
                    Ver descripción completa
                </summary>
                <div className="mt-1">
                    {meta.fullDesc ?? meta.shortDesc ?? "Sin descripción en la SRD."}
                </div>
            </details>
        </div>
    );
}
