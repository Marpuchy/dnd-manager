import { NextRequest, NextResponse } from "next/server";
import {
  getLocalDndClassLearning,
  getLocalDndReference,
  normalizeClassId,
  normalizeLocale,
} from "@/lib/dnd/localData";

function toLevelNumber(rawLevel: string | null): number | null {
  if (!rawLevel) return null;
  const parsed = Number(rawLevel);
  if (!Number.isFinite(parsed)) return null;
  const asInt = Math.floor(parsed);
  if (asInt < 1 || asInt > 20) return null;
  return asInt;
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestedClass = searchParams.get("class");
  const requestedLevel = searchParams.get("level");
  const locale = normalizeLocale(searchParams.get("locale"));

  const classId = normalizeClassId(requestedClass);
  const level = toLevelNumber(requestedLevel);

  if (!classId || level == null) {
    return NextResponse.json(
      { error: "Parametros 'class' y 'level' requeridos" },
      { status: 400 }
    );
  }

  try {
    const [reference, classLearning, fallbackReference, englishReference] =
      await Promise.all([
      getLocalDndReference(locale),
      getLocalDndClassLearning(locale),
      locale === "es" ? getLocalDndReference("en") : Promise.resolve(null),
      getLocalDndReference("en"),
    ]);

    const classRecord = findClassRecord(classLearning, classId);
    const levels = Array.isArray(classRecord?.levels) ? classRecord.levels : [];
    const levelRecord = levels.find(
      (entry: any) => Number(entry?.level ?? 0) === level
    );

    if (!levelRecord) {
      return NextResponse.json([]);
    }

    const spellRefs = Array.isArray(levelRecord.learnableSpells)
      ? levelRecord.learnableSpells
      : [];

    const spellsByIndex = reference?.spells?.byIndex ?? {};
    const fallbackByIndex = fallbackReference?.spells?.byIndex ?? spellsByIndex;
    const englishByIndex = englishReference?.spells?.byIndex ?? {};

    const details = spellRefs
      .map((ref: any) => spellsByIndex[ref.index] ?? fallbackByIndex[ref.index])
      .filter(Boolean)
      .map((spell: any) => ({
        ...spell,
        name: englishByIndex?.[spell.index]?.name ?? spell.name,
      }))
      .sort((a: any, b: any) => {
        if (a.level !== b.level) return Number(a.level) - Number(b.level);
        return String(a.name || "").localeCompare(String(b.name || ""));
      });

    return NextResponse.json(details);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error interno obteniendo hechizos locales" },
      { status: 500 }
    );
  }
}
