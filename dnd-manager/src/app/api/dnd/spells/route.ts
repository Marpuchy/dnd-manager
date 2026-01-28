// src/app/api/dnd/spells/route.ts
import { NextRequest, NextResponse } from "next/server";
import { translateText } from "@/lib/translation/translator";

const BASE_URL = "https://www.dnd5eapi.co/api";

type SpellRefList = {
    results: { index: string; name: string; url: string }[];
};

// Modelo parcial de lo que devuelve la API pública
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
    const locale = searchParams.get("locale") ?? "en";

    if (!classIndex || !levelStr) {
        return NextResponse.json(
            { error: "Parámetros 'class' y 'level' requeridos" },
            { status: 400 }
        );
    }

    try {
        // 1) Hechizos que un PJ de esa CLASE y NIVEL puede conocer
        const spellsRes = await fetch(
            `${BASE_URL}/classes/${classIndex}/levels/${levelStr}/spells`,
            { next: { revalidate: 86400 } } // cache 1 día
        );

        if (!spellsRes.ok) {
            return NextResponse.json(
                { error: "No se han podido obtener los hechizos" },
                { status: 500 }
            );
        }

        const json = (await spellsRes.json()) as SpellRefList;

        // 2) Detalles de cada hechizo (en paralelo)
        const details = await Promise.all(
            json.results.map(async (s) => {
                const res = await fetch(`${BASE_URL}/spells/${s.index}`, {
                    next: { revalidate: 86400 },
                });
                if (!res.ok) return null;
                const data = (await res.json()) as SpellDetail;

                const shortDesc = data.desc?.[0] ?? "";
                const fullDescParts: string[] = [];
                if (data.desc && data.desc.length > 0) {
                    fullDescParts.push(...data.desc);
                }
                if (data.higher_level && data.higher_level.length > 0) {
                    fullDescParts.push(
                        "",
                        "A niveles superiores:",
                        ...data.higher_level
                    );
                }

                const shouldTranslate = locale === "es";
                const translate = (text?: string) =>
                    text && shouldTranslate
                        ? translateText({ text, target: "es", source: "en" })
                        : Promise.resolve(text);

                const [
                    name,
                    range,
                    casting_time,
                    duration,
                    school,
                    material,
                    shortDescTranslated,
                    fullDescTranslated,
                ] = await Promise.all([
                    translate(data.name),
                    translate(data.range),
                    translate(data.casting_time),
                    translate(data.duration),
                    translate(data.school?.name),
                    translate(data.material),
                    translate(shortDesc),
                    translate(fullDescParts.join("\n")),
                ]);

                return {
                    index: data.index,
                    name,
                    level: data.level,
                    range,
                    casting_time,
                    duration,
                    school,
                    components: data.components,
                    material,
                    concentration: data.concentration,
                    ritual: data.ritual,
                    shortDesc: shortDescTranslated,
                    fullDesc: fullDescTranslated,
                    locale,
                };
            })
        );

        const filtered = details.filter(Boolean);
        return NextResponse.json(filtered);
    } catch (e) {
        console.error(e);
        return NextResponse.json(
            { error: "Error interno obteniendo hechizos" },
            { status: 500 }
        );
    }
}
