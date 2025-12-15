// src/app/api/dnd/spells/route.ts
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://www.dnd5eapi.co/api";

type SpellRefList = {
    results: { index: string; name: string; url: string }[];
};

type SpellDetail = {
    index: string;
    name: string;
    level: number;
    desc?: string[];
    higher_level?: string[];
    range?: string;
    casting_time?: string;
    duration?: string;
    school?: { index: string; name: string; url: string };
    components?: string[];
    material?: string;
    concentration?: boolean;
    ritual?: boolean;
};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const classIndex = searchParams.get("class");
    const levelStr = searchParams.get("level");

    if (!classIndex || levelStr === null) {
        return NextResponse.json(
            { error: "Parámetros 'class' y 'level' requeridos" },
            { status: 400 }
        );
    }

    const level = Number(levelStr);
    if (Number.isNaN(level) || level < 0) {
        return NextResponse.json(
            { error: "Nivel inválido" },
            { status: 400 }
        );
    }

    try {
        let spellRefs: SpellRefList;

        // 🔹 NIVEL 0 → trucos (NO existe /levels/0/spells)
        if (level === 0) {
            const res = await fetch(
                `${BASE_URL}/classes/${classIndex}/spells`,
                { next: { revalidate: 86400 } }
            );

            if (!res.ok) {
                return NextResponse.json(
                    { error: "No se han podido obtener los trucos" },
                    { status: 500 }
                );
            }

            spellRefs = (await res.json()) as SpellRefList;
        }
        // 🔹 NIVEL 1+ → hechizos normales
        else {
            const res = await fetch(
                `${BASE_URL}/classes/${classIndex}/levels/${level}/spells`,
                { next: { revalidate: 86400 } }
            );

            if (!res.ok) {
                return NextResponse.json(
                    { error: "No se han podido obtener los hechizos" },
                    { status: 500 }
                );
            }

            spellRefs = (await res.json()) as SpellRefList;
        }

        // 🔹 Detalles de cada hechizo
        const details = await Promise.all(
            spellRefs.results.map(async (s) => {
                const res = await fetch(`${BASE_URL}/spells/${s.index}`, {
                    next: { revalidate: 86400 },
                });

                if (!res.ok) return null;

                const data = (await res.json()) as SpellDetail;

                const shortDesc = data.desc?.[0] ?? "";
                const fullDescParts: string[] = [];

                if (data.desc?.length) {
                    fullDescParts.push(...data.desc);
                }

                if (data.higher_level?.length) {
                    fullDescParts.push(
                        "",
                        "A niveles superiores:",
                        ...data.higher_level
                    );
                }

                return {
                    index: data.index,
                    name: data.name,
                    level: data.level,
                    range: data.range,
                    casting_time: data.casting_time,
                    duration: data.duration,
                    school: data.school?.name,
                    components: data.components,
                    material: data.material,
                    concentration: data.concentration,
                    ritual: data.ritual,
                    shortDesc,
                    fullDesc: fullDescParts.join("\n"),
                };
            })
        );

        return NextResponse.json(details.filter(Boolean));
    } catch (e) {
        console.error(e);
        return NextResponse.json(
            { error: "Error interno obteniendo hechizos" },
            { status: 500 }
        );
    }
}
