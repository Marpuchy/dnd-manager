import { NextRequest, NextResponse } from "next/server";
import { getLocalDndCategory, normalizeLocale } from "@/lib/dnd/localData";

type RouteContext = {
    params: Promise<{
        index: string;
    }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
    const params = await context.params;
    const { searchParams } = new URL(req.url);
    const locale = normalizeLocale(searchParams.get("locale"));

    const pathIndex = req.nextUrl.pathname.split("/").filter(Boolean).pop();
    const index = decodeURIComponent(params?.index ?? pathIndex ?? "").trim();

    if (!index || index === "monsters") {
        return NextResponse.json({ error: "Missing index" }, { status: 400 });
    }

    try {
        const [localizedMonsters, englishMonsters] = await Promise.all([
            getLocalDndCategory(locale, "monsters"),
            getLocalDndCategory("en", "monsters"),
        ]);

        const localized = localizedMonsters?.byIndex?.[index] ?? null;
        const english = englishMonsters?.byIndex?.[index] ?? null;
        const monster = localized ?? english;

        if (!monster) {
            return NextResponse.json(
                { error: "No se ha podido obtener la criatura local" },
                { status: 404 }
            );
        }

        const englishName = String(english?.name ?? "").trim();
        const localizedName = String(localized?.name ?? monster?.name ?? "").trim();

        return NextResponse.json({
            ...monster,
            name: englishName || localizedName || index,
            localized_name: localizedName || englishName || index,
            locale,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Error interno obteniendo la criatura local" },
            { status: 500 }
        );
    }
}
