import { NextRequest, NextResponse } from "next/server";
import { getLocalDndCategory, normalizeLocale } from "@/lib/dnd/localData";

function normalizeLimit(raw: string | null): number {
    if (!raw) return 60;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return 60;
    const asInt = Math.floor(parsed);
    if (asInt < 1) return 1;
    if (asInt > 200) return 200;
    return asInt;
}

function asSearchTerm(raw: string | null): string {
    return (raw ?? "").trim().toLowerCase();
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const locale = normalizeLocale(searchParams.get("locale"));
    const searchTerm = asSearchTerm(searchParams.get("name"));
    const limit = normalizeLimit(searchParams.get("limit"));

    try {
        const [localizedMonsters, englishMonsters] = await Promise.all([
            getLocalDndCategory(locale, "monsters"),
            locale === "es" ? getLocalDndCategory("en", "monsters") : Promise.resolve(null),
        ]);

        const englishByIndex =
            englishMonsters?.byIndex && typeof englishMonsters.byIndex === "object"
                ? englishMonsters.byIndex
                : localizedMonsters?.byIndex ?? {};

        const sourceRows = Array.isArray(localizedMonsters?.results)
            ? localizedMonsters.results
            : [];

        const filtered = searchTerm
            ? sourceRows.filter((monster: any) => {
                  const index = String(monster?.index ?? "").toLowerCase();
                  const localizedName = String(monster?.name ?? "").toLowerCase();
                  const englishName = String(
                      englishByIndex?.[monster?.index]?.name ?? ""
                  ).toLowerCase();
                  const type = String(monster?.type ?? "").toLowerCase();

                  return (
                      index.includes(searchTerm)
                      || localizedName.includes(searchTerm)
                      || englishName.includes(searchTerm)
                      || type.includes(searchTerm)
                  );
              })
            : sourceRows;

        const mapped = filtered
            .map((monster: any) => {
                const index = String(monster?.index ?? "").trim();
                if (!index) return null;

                const englishName = String(englishByIndex?.[index]?.name ?? "").trim();
                const localizedName = String(monster?.name ?? "").trim();
                const displayName = englishName || localizedName || index;
                const challengeRating =
                    typeof monster?.challenge_rating === "number"
                        ? monster.challenge_rating
                        : null;

                return {
                    index,
                    name: displayName,
                    localized_name: localizedName || displayName,
                    type: typeof monster?.type === "string" ? monster.type : null,
                    challenge_rating: challengeRating,
                    size: typeof monster?.size === "string" ? monster.size : null,
                    alignment:
                        typeof monster?.alignment === "string" ? monster.alignment : null,
                    image: typeof monster?.image === "string" ? monster.image : null,
                };
            })
            .filter((monster): monster is NonNullable<typeof monster> => Boolean(monster))
            .sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({
            count: mapped.length,
            results: mapped.slice(0, limit),
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "No se pudieron cargar los monstruos locales." },
            { status: 500 }
        );
    }
}
