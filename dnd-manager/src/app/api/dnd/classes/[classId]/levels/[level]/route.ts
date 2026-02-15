import { NextRequest, NextResponse } from "next/server";
import {
  getLocalDndClassLearning,
  normalizeClassId,
  normalizeLocale,
} from "@/lib/dnd/localData";

function toLevelNumber(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  const level = Math.floor(parsed);
  if (level < 1 || level > 20) return null;
  return level;
}

function findClassRecord(classLearning: any, classId: string) {
  const byIndex = classLearning?.classes?.byIndex;
  if (byIndex && typeof byIndex === "object" && byIndex[classId]) {
    return byIndex[classId];
  }

  const list = Array.isArray(classLearning?.classes?.results)
    ? classLearning.classes.results
    : [];
  return list.find((entry: any) => entry?.index === classId) ?? null;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ classId: string; level: string }> }
) {
  const params = await context.params;
  const { searchParams } = new URL(req.url);
  const locale = normalizeLocale(searchParams.get("locale"));

  const classId = normalizeClassId(params?.classId ?? null);
  const level = toLevelNumber(params?.level ?? null);

  if (!classId || level == null) {
    return NextResponse.json(
      { error: "Parametros de clase y nivel invalidos" },
      { status: 400 }
    );
  }

  try {
    const [learning, fallbackLearning, englishLearning] = await Promise.all([
      getLocalDndClassLearning(locale),
      locale === "es" ? getLocalDndClassLearning("en") : Promise.resolve(null),
      getLocalDndClassLearning("en"),
    ]);

    const classRecord =
      findClassRecord(learning, classId) ?? findClassRecord(fallbackLearning, classId);

    if (!classRecord) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
    }

    const levels = Array.isArray(classRecord.levels) ? classRecord.levels : [];
    const levelRecord = levels.find(
      (entry: any) => Number(entry?.level ?? 0) === level
    );

    const fallbackLevelRecord =
      findClassRecord(englishLearning, classId)?.levels?.find(
        (entry: any) => Number(entry?.level ?? 0) === level
      ) ?? null;

    if (!levelRecord) {
      return NextResponse.json({
        level,
        features: [],
        featureRefs: [],
        spellcasting: null,
        learnableSpells: [],
      });
    }

    const englishByIndex = Object.fromEntries(
      (fallbackLevelRecord?.learnableSpells ?? []).map((entry: any) => [
        entry?.index,
        entry?.name,
      ])
    );

    return NextResponse.json({
      ...levelRecord,
      learnableSpells: Array.isArray(levelRecord.learnableSpells)
        ? levelRecord.learnableSpells.map((entry: any) => ({
            ...entry,
            name: englishByIndex?.[entry?.index] ?? entry?.name,
          }))
        : [],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error interno obteniendo nivel de clase local" },
      { status: 500 }
    );
  }
}
