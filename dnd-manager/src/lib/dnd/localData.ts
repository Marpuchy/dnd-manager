import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  augmentClassLearningWithArtificer,
  augmentSpellsDatasetWithArtificer,
} from "@/lib/dnd/artificerCompat";

type SupportedLocale = "en" | "es";

type CategoryPayload = {
  total: number;
  results: any[];
  byIndex: Record<string, any>;
};

const referenceCache = new Map<SupportedLocale, any>();
const classLearningCache = new Map<SupportedLocale, any>();
const categoryCache = new Map<string, CategoryPayload>();

const CLASS_ALIASES: Record<string, string> = {
  barbaro: "barbarian",
  bardo: "bard",
  clerigo: "cleric",
  druida: "druid",
  guerrero: "fighter",
  monje: "monk",
  paladin: "paladin",
  paladino: "paladin",
  explorador: "ranger",
  picaro: "rogue",
  hechicero: "sorcerer",
  brujo: "warlock",
  mago: "wizard",
  artificiero: "artificer",
};

function dataDirectoryCandidates(): string[] {
  return [
    path.resolve(process.cwd(), "src", "data", "dnd"),
    path.resolve(process.cwd(), "dnd-manager", "src", "data", "dnd"),
  ];
}

async function readJson(relativePath: string): Promise<any> {
  const candidates = dataDirectoryCandidates();
  let lastError: unknown;

  for (const baseDir of candidates) {
    const filePath = path.join(baseDir, relativePath);
    try {
      const content = await readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function buildByIndex(results: any[]): Record<string, any> {
  const entries = results
    .filter((entry) => entry && typeof entry === "object" && entry.index)
    .map((entry) => [entry.index, entry] as const);
  return Object.fromEntries(entries);
}

function normalizeCategoryPayload(raw: any): CategoryPayload {
  const data = raw?.data ?? raw;
  const results = Array.isArray(data?.results) ? data.results : [];
  const byIndex =
    data?.byIndex && typeof data.byIndex === "object"
      ? data.byIndex
      : buildByIndex(results);

  return {
    total: typeof data?.total === "number" ? data.total : results.length,
    results,
    byIndex,
  };
}

async function readFullCategory(
  locale: SupportedLocale,
  category: string
): Promise<CategoryPayload> {
  const cacheKey = `${locale}:${category}`;
  if (categoryCache.has(cacheKey)) {
    return categoryCache.get(cacheKey)!;
  }

  const pathsToTry = [
    `full/${locale}/${category}.json`,
    `${locale}/${category}.json`,
  ];

  if (category === "class-learning") {
    pathsToTry.push(`dnd-class-learning.${locale}.json`);
  } else {
    pathsToTry.push(`dnd-reference.${locale}.json`);
  }

  let raw: any = null;
  for (const relativePath of pathsToTry) {
    try {
      raw = await readJson(relativePath);
      break;
    } catch {
      // try next path
    }
  }

  if (!raw) {
    throw new Error(
      `No local dataset found for category '${category}' locale '${locale}'`
    );
  }

  const normalized =
    raw?.classes && category === "class-learning"
      ? normalizeCategoryPayload(raw.classes)
      : raw?.spells && raw?.features && raw?.classes
      ? normalizeCategoryPayload(raw[category])
      : normalizeCategoryPayload(raw);

  categoryCache.set(cacheKey, normalized);
  return normalized;
}

export function normalizeLocale(input: string | null | undefined): SupportedLocale {
  return input === "es" ? "es" : "en";
}

export function normalizeClassId(input: string | null | undefined): string | null {
  if (!input) return null;
  const normalized = input
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return CLASS_ALIASES[normalized] ?? normalized;
}

export async function getLocalDndReference(locale: SupportedLocale): Promise<any> {
  if (referenceCache.has(locale)) {
    return referenceCache.get(locale);
  }

  const [rawSpells, features, classes] = await Promise.all([
    readFullCategory(locale, "spells"),
    readFullCategory(locale, "features"),
    readFullCategory(locale, "classes"),
  ]);
  const spells = augmentSpellsDatasetWithArtificer(rawSpells, locale);

  const payload = {
    locale,
    spells,
    features,
    classes,
  };

  referenceCache.set(locale, payload);
  return payload;
}

export async function getLocalDndClassLearning(
  locale: SupportedLocale
): Promise<any> {
  if (classLearningCache.has(locale)) {
    return classLearningCache.get(locale);
  }

  const [rawClasses, reference] = await Promise.all([
    readFullCategory(locale, "class-learning"),
    getLocalDndReference(locale),
  ]);
  const classes = augmentClassLearningWithArtificer(
    rawClasses,
    locale,
    reference?.spells?.byIndex ?? {}
  );
  const payload = {
    locale,
    classes,
  };

  classLearningCache.set(locale, payload);
  return payload;
}

export async function getLocalDndCategory(
  locale: SupportedLocale,
  category: string
): Promise<CategoryPayload> {
  return readFullCategory(locale, category);
}
