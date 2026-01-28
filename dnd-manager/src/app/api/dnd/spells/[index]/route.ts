import { NextRequest, NextResponse } from "next/server";
import { translateText } from "@/lib/translation/translator";

const BASE_URL = "https://www.dnd5eapi.co/api";

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

export async function GET(
    req: NextRequest,
    { params }: { params: { index: string } }
) {
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get("locale") ?? "en";

    const pathIndex = req.nextUrl.pathname.split("/").filter(Boolean).pop();
    const index = params?.index ?? pathIndex ?? "";

    if (!index || index === "spells") {
        return NextResponse.json({ error: "Missing index" }, { status: 400 });
    }

    try {
        const safeIndex = decodeURIComponent(index);
        const res = await fetch(`${BASE_URL}/spells/${safeIndex}`, {
            next: { revalidate: 86400 },
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: "No se ha podido obtener el hechizo" },
                { status: 500 }
            );
        }

        const data = (await res.json()) as SpellDetail;

        const shortDesc = data.desc?.[0] ?? "";
        const fullDescParts: string[] = [];
        if (data.desc && data.desc.length > 0) {
            fullDescParts.push(...data.desc);
        }
        if (data.higher_level && data.higher_level.length > 0) {
            fullDescParts.push("", "A niveles superiores:", ...data.higher_level);
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

        return NextResponse.json({
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
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json(
            { error: "Error interno obteniendo el hechizo" },
            { status: 500 }
        );
    }
}
