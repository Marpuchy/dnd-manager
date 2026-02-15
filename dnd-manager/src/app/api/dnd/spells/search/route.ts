import { NextRequest, NextResponse } from "next/server";
import { getLocalDndReference, normalizeLocale } from "@/lib/dnd/localData";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = (searchParams.get("name") || "").trim();
  const locale = normalizeLocale(searchParams.get("locale"));

  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  try {
    const reference = await getLocalDndReference(locale);
    const englishReference = await getLocalDndReference("en");
    const fallback = locale === "es" ? englishReference : reference;

    const term = name.toLowerCase();
    const spells = Array.isArray(reference?.spells?.results)
      ? reference.spells.results
      : [];
    const fallbackByIndex = fallback?.spells?.byIndex ?? {};

    const results = spells
      .filter((spell: any) => {
        const localizedName = String(spell?.name ?? "").toLowerCase();
        const englishName = String(
          fallbackByIndex?.[spell?.index]?.name ?? ""
        ).toLowerCase();
        return localizedName.includes(term) || englishName.includes(term);
      })
      .map((spell: any) => ({
        index: spell.index,
        name: englishReference?.spells?.byIndex?.[spell?.index]?.name ?? spell.name,
        url: spell.url,
      }));

    return NextResponse.json({ count: results.length, results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ results: [] });
  }
}
