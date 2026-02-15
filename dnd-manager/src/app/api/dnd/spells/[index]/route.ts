import { NextRequest, NextResponse } from "next/server";
import { getLocalDndReference, normalizeLocale } from "@/lib/dnd/localData";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ index: string }> }
) {
  const params = await context.params;
  const { searchParams } = new URL(req.url);
  const locale = normalizeLocale(searchParams.get("locale"));

  const pathIndex = req.nextUrl.pathname.split("/").filter(Boolean).pop();
  const index = decodeURIComponent(params?.index ?? pathIndex ?? "");

  if (!index || index === "spells") {
    return NextResponse.json({ error: "Missing index" }, { status: 400 });
  }

  try {
    const reference = await getLocalDndReference(locale);
    const englishReference = await getLocalDndReference("en");
    const fallback =
      locale === "es" ? englishReference : reference;

    const spell =
      reference?.spells?.byIndex?.[index] ?? fallback?.spells?.byIndex?.[index];

    if (!spell) {
      return NextResponse.json(
        { error: "No se ha podido obtener el hechizo" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...spell,
      name: englishReference?.spells?.byIndex?.[index]?.name ?? spell.name,
      locale,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error interno obteniendo el hechizo local" },
      { status: 500 }
    );
  }
}
