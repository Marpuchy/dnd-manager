"use client";

type SupportedLocale = "en" | "es";

type Dataset<T> = {
  total: number;
  results: T[];
  byIndex: Record<string, T>;
};

type SpellRecord = {
  index: string;
  name: string;
  level?: number;
  [key: string]: unknown;
};

type LearnableSpellRef = {
  index: string;
  name?: string;
};

type ClassLevelRecord = {
  level?: number;
  learnableSpells?: LearnableSpellRef[];
};

type ClassRecord = {
  index: string;
  levels?: ClassLevelRecord[];
};

const spellsCache = new Map<SupportedLocale, Promise<Dataset<SpellRecord>>>();
const classLearningCache = new Map<SupportedLocale, Promise<Dataset<ClassRecord>>>();

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
  ranger: "ranger",
  picaro: "rogue",
  hechicero: "sorcerer",
  brujo: "warlock",
  mago: "wizard",
  artificiero: "artificer",
  artificer: "artificer",
};

function stripDiacritics(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizePayload<T extends { index?: string }>(raw: any): Dataset<T> {
  const data = raw?.data ?? raw;
  const results = Array.isArray(data?.results) ? (data.results as T[]) : [];
  const byIndex =
    data?.byIndex && typeof data.byIndex === "object"
      ? (data.byIndex as Record<string, T>)
      : Object.fromEntries(
          results
            .filter((entry) => entry && typeof entry === "object" && entry.index)
            .map((entry) => [String(entry.index), entry])
        );

  return {
    total: typeof data?.total === "number" ? data.total : results.length,
    results,
    byIndex,
  };
}

async function importSpellsRaw(locale: SupportedLocale) {
  if (locale === "es") {
    const mod = await import("@/data/dnd/es/spells.json");
    return mod.default;
  }
  const mod = await import("@/data/dnd/en/spells.json");
  return mod.default;
}

async function importClassLearningRaw(locale: SupportedLocale) {
  if (locale === "es") {
    const mod = await import("@/data/dnd/es/class-learning.json");
    return mod.default;
  }
  const mod = await import("@/data/dnd/en/class-learning.json");
  return mod.default;
}

async function loadSpells(locale: SupportedLocale): Promise<Dataset<SpellRecord>> {
  if (!spellsCache.has(locale)) {
    spellsCache.set(
      locale,
      importSpellsRaw(locale).then((raw) => normalizePayload<SpellRecord>(raw))
    );
  }
  return spellsCache.get(locale)!;
}

async function loadClassLearning(
  locale: SupportedLocale
): Promise<Dataset<ClassRecord>> {
  if (!classLearningCache.has(locale)) {
    classLearningCache.set(
      locale,
      importClassLearningRaw(locale).then((raw) => normalizePayload<ClassRecord>(raw))
    );
  }
  return classLearningCache.get(locale)!;
}

function findClassRecord(
  data: Dataset<ClassRecord>,
  classId: string
): ClassRecord | null {
  if (data.byIndex[classId]) return data.byIndex[classId];
  return data.results.find((entry) => entry?.index === classId) ?? null;
}

function withEnglishName(
  spell: SpellRecord,
  englishByIndex: Record<string, SpellRecord>
): SpellRecord {
  const englishName = englishByIndex[spell.index]?.name;
  return {
    ...spell,
    name: englishName ?? spell.name,
  };
}

export function normalizeClientLocale(
  locale: string | null | undefined
): SupportedLocale {
  return locale === "es" ? "es" : "en";
}

export function normalizeClientClassId(
  classId: string | null | undefined
): string | null {
  if (!classId) return null;
  const normalized = stripDiacritics(classId.toLowerCase().trim());
  return CLASS_ALIASES[normalized] ?? normalized;
}

export async function getClientSpellByIndex(
  index: string,
  localeInput: string | null | undefined
): Promise<SpellRecord | null> {
  const locale = normalizeClientLocale(localeInput);
  const [localizedSpells, englishSpells] = await Promise.all([
    loadSpells(locale),
    loadSpells("en"),
  ]);

  const spell = localizedSpells.byIndex[index] ?? englishSpells.byIndex[index];
  if (!spell) return null;
  return withEnglishName(spell, englishSpells.byIndex);
}

export async function findClientSpellByName(
  name: string,
  localeInput: string | null | undefined
): Promise<{ index: string; name: string } | null> {
  const term = name.trim().toLowerCase();
  if (!term) return null;

  const locale = normalizeClientLocale(localeInput);
  const [localizedSpells, englishSpells] = await Promise.all([
    loadSpells(locale),
    loadSpells("en"),
  ]);

  const matches = (spell: SpellRecord) => {
    const localizedName = String(spell.name ?? "").toLowerCase();
    const englishName = String(
      englishSpells.byIndex[spell.index]?.name ?? ""
    ).toLowerCase();
    return { localizedName, englishName };
  };

  const exact =
    localizedSpells.results.find((spell) => {
      const { localizedName, englishName } = matches(spell);
      return localizedName === term || englishName === term;
    }) ??
    englishSpells.results.find((spell) => {
      const englishName = String(spell.name ?? "").toLowerCase();
      return englishName === term;
    });

  if (exact?.index) {
    const englishName =
      englishSpells.byIndex[exact.index]?.name ?? String(exact.name ?? "");
    return { index: exact.index, name: englishName };
  }

  const partial =
    localizedSpells.results.find((spell) => {
      const { localizedName, englishName } = matches(spell);
      return localizedName.includes(term) || englishName.includes(term);
    }) ??
    englishSpells.results.find((spell) =>
      String(spell.name ?? "").toLowerCase().includes(term)
    );

  if (!partial?.index) return null;
  return {
    index: partial.index,
    name:
      englishSpells.byIndex[partial.index]?.name ?? String(partial.name ?? ""),
  };
}

export async function getClientSpellsForClassLevel(
  classIdInput: string | null | undefined,
  level: number,
  localeInput: string | null | undefined
): Promise<SpellRecord[]> {
  const classId = normalizeClientClassId(classIdInput);
  const normalizedLevel = Math.max(1, Math.min(20, Math.floor(Number(level) || 1)));
  if (!classId) return [];

  const locale = normalizeClientLocale(localeInput);
  const [classLearning, localizedSpells, englishSpells] = await Promise.all([
    loadClassLearning(locale),
    loadSpells(locale),
    loadSpells("en"),
  ]);

  const classRecord = findClassRecord(classLearning, classId);
  if (!classRecord) return [];

  const levelRecord = (Array.isArray(classRecord.levels) ? classRecord.levels : []).find(
    (entry) => Number(entry?.level ?? 0) === normalizedLevel
  );
  if (!levelRecord) return [];

  const spellRefs = Array.isArray(levelRecord.learnableSpells)
    ? levelRecord.learnableSpells
    : [];

  return spellRefs
    .map((ref) => {
      const index = String(ref?.index ?? "");
      if (!index) return null;
      const spell = localizedSpells.byIndex[index] ?? englishSpells.byIndex[index];
      if (!spell) return null;
      return withEnglishName(spell, englishSpells.byIndex);
    })
    .filter(Boolean)
    .sort((a, b) => {
      const levelDiff = Number(a?.level ?? 0) - Number(b?.level ?? 0);
      if (levelDiff !== 0) return levelDiff;
      return String(a?.name ?? "").localeCompare(String(b?.name ?? ""));
    }) as SpellRecord[];
}
