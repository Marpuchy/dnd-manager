import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const API_ORIGIN = "https://www.dnd5eapi.co";
const API_BASE = `${API_ORIGIN}/api`;
const OUTPUT_DIR = path.resolve("src", "data", "dnd");
const FULL_OUTPUT_DIR = path.join(OUTPUT_DIR, "full");
const RETRIES = 3;
const CONCURRENCY = 8;
const MIN_TRANSLATION_INTERVAL_MS = Number(
  process.env.TRANSLATION_THROTTLE_MS ?? 40
);

const translationCache = new Map();
const translationProvider = process.env.TRANSLATION_PROVIDER ?? "google";
const translationEndpoint = process.env.TRANSLATION_ENDPOINT;
const translationApiKey = process.env.TRANSLATION_API_KEY;
const translationEmail = process.env.TRANSLATION_EMAIL;
let lastTranslationRequestAt = 0;
const ES_TERM_OVERRIDES = new Map([
  ["Barbarian", "Bárbaro"],
  ["Bard", "Bardo"],
  ["Cleric", "Clérigo"],
  ["Druid", "Druida"],
  ["Fighter", "Guerrero"],
  ["Monk", "Monje"],
  ["Paladin", "Paladín"],
  ["Ranger", "Explorador"],
  ["Rogue", "Pícaro"],
  ["Sorcerer", "Hechicero"],
  ["Warlock", "Brujo"],
  ["Wizard", "Mago"],
  ["Artificer", "Artificiero"],
  ["Strength", "Fuerza"],
  ["Dexterity", "Destreza"],
  ["Constitution", "Constitución"],
  ["Intelligence", "Inteligencia"],
  ["Wisdom", "Sabiduría"],
  ["Charisma", "Carisma"],
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(relativePath, init = undefined, attempt = 1) {
  const url = relativePath.startsWith("http")
    ? relativePath
    : relativePath.startsWith("/api/")
    ? `${API_ORIGIN}${relativePath}`
    : `${API_BASE}${relativePath.startsWith("/") ? "" : "/"}${relativePath}`;

  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      if (attempt < RETRIES) {
        await sleep(300 * attempt);
        return fetchJson(relativePath, init, attempt + 1);
      }
      throw new Error(`${res.status} ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    if (attempt < RETRIES) {
      await sleep(300 * attempt);
      return fetchJson(relativePath, init, attempt + 1);
    }
    throw new Error(`fetchJson failed for ${url}: ${error.message}`);
  }
}

async function mapLimit(items, limit, worker) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }
  const results = new Array(items.length);
  let next = 0;

  async function runOne() {
    while (next < items.length) {
      const current = next;
      next += 1;
      results[current] = await worker(items[current], current);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => runOne());
  await Promise.all(workers);
  return results;
}

function splitLongTextForTranslation(input, maxLength = 350) {
  if (!input || input.length <= maxLength) return [input];
  const chunks = [];
  const paragraphs = input.split(/\n{2,}/g);
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= maxLength) {
      current = candidate;
      continue;
    }
    if (current) {
      chunks.push(current);
      current = "";
    }
    if (paragraph.length <= maxLength) {
      current = paragraph;
      continue;
    }

    const sentences = paragraph.split(/(?<=[.!?])\s+/g);
    let sentenceChunk = "";
    for (const sentence of sentences) {
      const sentenceCandidate = sentenceChunk
        ? `${sentenceChunk} ${sentence}`.trim()
        : sentence;
      if (sentenceCandidate.length <= maxLength) {
        sentenceChunk = sentenceCandidate;
      } else {
        if (sentenceChunk) chunks.push(sentenceChunk);
        sentenceChunk = sentence.slice(0, maxLength);
      }
    }
    if (sentenceChunk) chunks.push(sentenceChunk);
  }
  if (current) chunks.push(current);
  return chunks;
}

async function throttleTranslationRequests() {
  const now = Date.now();
  const elapsed = now - lastTranslationRequestAt;
  if (elapsed < MIN_TRANSLATION_INTERVAL_MS) {
    await sleep(MIN_TRANSLATION_INTERVAL_MS - elapsed);
  }
  lastTranslationRequestAt = Date.now();
}

async function requestLibreTranslate(text, source, target) {
  if (!translationEndpoint) {
    return text;
  }

  const res = await fetch(`${translationEndpoint.replace(/\/$/, "")}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source,
      target,
      format: "text",
      api_key: translationApiKey,
    }),
  });

  if (!res.ok) {
    throw new Error(`libretranslate ${res.status}`);
  }

  const data = await res.json();
  return data?.translatedText ?? text;
}

async function requestMyMemory(text, source, target) {
  const params = new URLSearchParams({
    q: text,
    langpair: `${source}|${target}`,
  });
  if (translationEmail) {
    params.set("de", translationEmail);
  }
  const url = `https://api.mymemory.translated.net/get?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`mymemory ${res.status}`);
  }
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  return typeof translated === "string" && translated.trim() ? translated : text;
}

async function requestGoogleTranslate(text, source, target) {
  const params = new URLSearchParams({
    client: "gtx",
    sl: source,
    tl: target,
    dt: "t",
    q: text,
  });
  const url = `https://translate.googleapis.com/translate_a/single?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`google ${res.status}`);
  }

  const payload = await res.json();
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    return text;
  }

  const translated = payload[0]
    .map((segment) => (Array.isArray(segment) ? segment[0] : ""))
    .join("");
  return translated?.trim() ? translated : text;
}

async function translateText(text, target = "es", source = "en") {
  if (!text || target === "en") return text;

  const normalized = String(text);
  const normalizedTrimmed = normalized.trim();
  const cacheKey = `${source}:${target}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  if (translationProvider === "none") {
    translationCache.set(cacheKey, text);
    return text;
  }

  try {
    const chunks = splitLongTextForTranslation(normalized);
    const translatedChunks = [];
    for (const chunk of chunks) {
      await throttleTranslationRequests();
      if (translationProvider === "libretranslate") {
        translatedChunks.push(await requestLibreTranslate(chunk, source, target));
      } else if (translationProvider === "google") {
        translatedChunks.push(await requestGoogleTranslate(chunk, source, target));
      } else if (translationProvider === "mymemory") {
        translatedChunks.push(await requestMyMemory(chunk, source, target));
      } else {
        translatedChunks.push(chunk);
      }
    }
    const translatedText = translatedChunks.join("\n\n");
    const finalText =
      target === "es" && ES_TERM_OVERRIDES.has(normalizedTrimmed)
        ? ES_TERM_OVERRIDES.get(normalizedTrimmed)
        : translatedText;
    translationCache.set(cacheKey, finalText);
    return finalText;
  } catch {
    const fallback =
      target === "es" && ES_TERM_OVERRIDES.has(normalizedTrimmed)
        ? ES_TERM_OVERRIDES.get(normalizedTrimmed)
        : normalized;
    translationCache.set(cacheKey, fallback);
    return fallback;
  }
}

async function translateOptional(value, locale) {
  if (!value || locale === "en") return value;
  return translateText(String(value), "es", "en");
}

async function translateArray(values, locale) {
  if (!Array.isArray(values) || locale === "en") return Array.isArray(values) ? [...values] : [];
  const output = [];
  for (const value of values) {
    output.push(await translateText(String(value), "es", "en"));
  }
  return output;
}

function normalizeSpell(raw) {
  const desc = Array.isArray(raw?.desc) ? raw.desc : [];
  const higherLevel = Array.isArray(raw?.higher_level) ? raw.higher_level : [];

  return {
    index: raw?.index,
    name: raw?.name,
    level: Number(raw?.level ?? 0),
    school: raw?.school
      ? {
          index: raw.school.index,
          name: raw.school.name,
          url: raw.school.url,
        }
      : null,
    range: raw?.range ?? null,
    casting_time: raw?.casting_time ?? null,
    duration: raw?.duration ?? null,
    components: Array.isArray(raw?.components) ? raw.components : [],
    material: raw?.material ?? null,
    ritual: Boolean(raw?.ritual),
    concentration: Boolean(raw?.concentration),
    attack_type: raw?.attack_type ?? null,
    damage: raw?.damage ?? null,
    dc: raw?.dc ?? null,
    area_of_effect: raw?.area_of_effect ?? null,
    classes: Array.isArray(raw?.classes)
      ? raw.classes.map((entry) => ({ index: entry.index, name: entry.name, url: entry.url }))
      : [],
    subclasses: Array.isArray(raw?.subclasses)
      ? raw.subclasses.map((entry) => ({ index: entry.index, name: entry.name, url: entry.url }))
      : [],
    desc,
    higher_level: higherLevel,
    shortDesc: desc[0] ?? "",
    fullDesc: [...desc, ...(higherLevel.length ? ["", "At Higher Levels:", ...higherLevel] : [])]
      .filter(Boolean)
      .join("\n\n"),
    url: raw?.url ?? `/api/spells/${raw?.index}`,
  };
}

async function localizeSpell(spell, locale) {
  if (locale === "en") return spell;

  const schoolName = spell.school?.name
    ? await translateText(spell.school.name, "es", "en")
    : spell.school?.name;

  const classes = [];
  for (const klass of spell.classes) {
    classes.push({
      ...klass,
      name: await translateText(klass.name, "es", "en"),
    });
  }

  const subclasses = [];
  for (const subclass of spell.subclasses) {
    subclasses.push({
      ...subclass,
      name: await translateText(subclass.name, "es", "en"),
    });
  }

  const desc = await translateArray(spell.desc, locale);
  const higher = await translateArray(spell.higher_level, locale);

  return {
    ...spell,
    // Keep official spell names in English for consistency across locales.
    name: spell.name,
    school: spell.school
      ? {
          ...spell.school,
          name: schoolName,
        }
      : null,
    range: await translateOptional(spell.range, locale),
    casting_time: await translateOptional(spell.casting_time, locale),
    duration: await translateOptional(spell.duration, locale),
    material: await translateOptional(spell.material, locale),
    classes,
    subclasses,
    desc,
    higher_level: higher,
    shortDesc: desc[0] ?? "",
    fullDesc: [...desc, ...(higher.length ? ["", "A niveles superiores:", ...higher] : [])]
      .filter(Boolean)
      .join("\n\n"),
  };
}

function normalizeFeature(raw) {
  return {
    index: raw?.index,
    name: raw?.name,
    level: typeof raw?.level === "number" ? raw.level : null,
    class: raw?.class
      ? { index: raw.class.index, name: raw.class.name, url: raw.class.url }
      : null,
    subclass: raw?.subclass
      ? { index: raw.subclass.index, name: raw.subclass.name, url: raw.subclass.url }
      : null,
    parent: raw?.parent
      ? {
          index: raw.parent.index,
          name: raw.parent.name,
          url: raw.parent.url,
        }
      : null,
    prerequisites: Array.isArray(raw?.prerequisites) ? raw.prerequisites : [],
    desc: Array.isArray(raw?.desc) ? raw.desc : [],
    url: raw?.url ?? `/api/features/${raw?.index}`,
  };
}

async function localizeFeature(feature, locale) {
  if (locale === "en") return feature;

  const localized = {
    ...feature,
    name: await translateText(feature.name, "es", "en"),
    desc: await translateArray(feature.desc, locale),
    class: feature.class
      ? {
          ...feature.class,
          name: await translateText(feature.class.name, "es", "en"),
        }
      : null,
    subclass: feature.subclass
      ? {
          ...feature.subclass,
          name: await translateText(feature.subclass.name, "es", "en"),
        }
      : null,
    parent: feature.parent
      ? {
          ...feature.parent,
          name: await translateText(feature.parent.name, "es", "en"),
        }
      : null,
  };

  return localized;
}

function normalizeClassSummary(raw) {
  return {
    index: raw?.index,
    name: raw?.name,
    hit_die: raw?.hit_die ?? null,
    proficiency_choices: Array.isArray(raw?.proficiency_choices)
      ? raw.proficiency_choices
      : [],
    proficiencies: Array.isArray(raw?.proficiencies)
      ? raw.proficiencies.map((entry) => ({ index: entry.index, name: entry.name, url: entry.url }))
      : [],
    saving_throws: Array.isArray(raw?.saving_throws)
      ? raw.saving_throws.map((entry) => ({ index: entry.index, name: entry.name, url: entry.url }))
      : [],
    starting_equipment: Array.isArray(raw?.starting_equipment)
      ? raw.starting_equipment
      : [],
    starting_equipment_options: Array.isArray(raw?.starting_equipment_options)
      ? raw.starting_equipment_options
      : [],
    class_levels: raw?.class_levels ?? null,
    multi_classing: raw?.multi_classing ?? null,
    subclasses: Array.isArray(raw?.subclasses)
      ? raw.subclasses.map((entry) => ({ index: entry.index, name: entry.name, url: entry.url }))
      : [],
    spellcasting: raw?.spellcasting ?? null,
    spells: raw?.spells ?? null,
    url: raw?.url ?? `/api/classes/${raw?.index}`,
  };
}

async function localizeClassSummary(summary, locale) {
  if (locale === "en") return summary;

  const proficiencies = Array.isArray(summary.proficiencies)
    ? summary.proficiencies
    : [];
  const savingThrows = Array.isArray(summary.saving_throws)
    ? summary.saving_throws
    : [];
  const subclasses = Array.isArray(summary.subclasses)
    ? summary.subclasses
    : [];

  return {
    ...summary,
    name: await translateText(summary.name, "es", "en"),
    proficiencies: await mapLimit(proficiencies, CONCURRENCY, async (entry) => ({
      ...entry,
      name: await translateText(entry.name, "es", "en"),
    })),
    saving_throws: await mapLimit(savingThrows, CONCURRENCY, async (entry) => ({
      ...entry,
      name: await translateText(entry.name, "es", "en"),
    })),
    subclasses: await mapLimit(subclasses, CONCURRENCY, async (entry) => ({
      ...entry,
      name: await translateText(entry.name, "es", "en"),
    })),
  };
}

async function buildSpellsDataset() {
  console.log("[sync] Fetching spells list...");
  const spellList = await fetchJson("/spells");
  const refs = Array.isArray(spellList?.results) ? spellList.results : [];

  const spells = await mapLimit(refs, CONCURRENCY, async (ref) => {
    const detail = await fetchJson(`/spells/${ref.index}`);
    return normalizeSpell(detail);
  });

  const sorted = spells.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.name.localeCompare(b.name);
  });

  const byIndex = Object.fromEntries(sorted.map((spell) => [spell.index, spell]));

  return {
    total: sorted.length,
    results: sorted,
    byIndex,
  };
}

async function buildFeaturesDataset() {
  console.log("[sync] Fetching features list...");
  const featureList = await fetchJson("/features");
  const refs = Array.isArray(featureList?.results) ? featureList.results : [];

  const features = await mapLimit(refs, CONCURRENCY, async (ref) => {
    const detail = await fetchJson(`/features/${ref.index}`);
    return normalizeFeature(detail);
  });

  const byIndex = Object.fromEntries(features.map((feature) => [feature.index, feature]));

  return {
    total: features.length,
    results: features,
    byIndex,
  };
}

async function fetchClassLevelSpells(classId, level) {
  try {
    const payload = await fetchJson(`/classes/${classId}/levels/${level}/spells`);
    return Array.isArray(payload?.results)
      ? payload.results.map((entry) => ({ index: entry.index, name: entry.name, url: entry.url }))
      : [];
  } catch {
    return [];
  }
}

async function buildClassLearningDataset(featureByIndex) {
  console.log("[sync] Fetching classes list...");
  const classList = await fetchJson("/classes");
  const classRefs = Array.isArray(classList?.results) ? classList.results : [];

  const classes = await mapLimit(classRefs, 4, async (classRef) => {
    const classDetail = normalizeClassSummary(await fetchJson(`/classes/${classRef.index}`));
    const levelsRaw = await fetchJson(`/classes/${classRef.index}/levels`);
    const levels = Array.isArray(levelsRaw) ? levelsRaw : [];

    const normalizedLevels = await mapLimit(levels, 4, async (levelInfo) => {
      const lvl = Number(levelInfo?.level ?? 0);
      const featureRefs = Array.isArray(levelInfo?.features)
        ? levelInfo.features.map((feature) => ({
            index: feature.index,
            name: feature.name,
            url: feature.url,
          }))
        : [];

      const features = featureRefs
        .map((ref) => featureByIndex[ref.index])
        .filter(Boolean);

      const learnableSpells = await fetchClassLevelSpells(classRef.index, lvl);

      return {
        level: lvl,
        ability_score_bonuses:
          typeof levelInfo?.ability_score_bonuses === "number"
            ? levelInfo.ability_score_bonuses
            : null,
        prof_bonus:
          typeof levelInfo?.prof_bonus === "number" ? levelInfo.prof_bonus : null,
        features,
        featureRefs,
        spellcasting: levelInfo?.spellcasting ?? null,
        learnableSpells,
      };
    });

    const subclasses = await mapLimit(classDetail.subclasses, 3, async (subclassRef) => {
      const detail = await fetchJson(`/subclasses/${subclassRef.index}`);
      const subLevelsRaw = await fetchJson(`/subclasses/${subclassRef.index}/levels`);
      const subLevels = Array.isArray(subLevelsRaw) ? subLevelsRaw : [];

      const levelsNormalized = subLevels.map((levelInfo) => {
        const featureRefs = Array.isArray(levelInfo?.features)
          ? levelInfo.features.map((feature) => ({
              index: feature.index,
              name: feature.name,
              url: feature.url,
            }))
          : [];

        return {
          level: Number(levelInfo?.level ?? 0),
          features: featureRefs
            .map((ref) => featureByIndex[ref.index])
            .filter(Boolean),
          featureRefs,
        };
      });

      return {
        index: detail?.index,
        name: detail?.name,
        class: detail?.class
          ? {
              index: detail.class.index,
              name: detail.class.name,
              url: detail.class.url,
            }
          : null,
        subclass_flavor: detail?.subclass_flavor ?? null,
        desc: Array.isArray(detail?.desc) ? detail.desc : [],
        spells: detail?.spells ?? null,
        spellcasting: detail?.spellcasting ?? null,
        levels: levelsNormalized,
        url: detail?.url ?? `/api/subclasses/${detail?.index}`,
      };
    });

    return {
      ...classDetail,
      levels: normalizedLevels.sort((a, b) => a.level - b.level),
      subclasses,
    };
  });

  return {
    total: classes.length,
    results: classes,
    byIndex: Object.fromEntries(classes.map((entry) => [entry.index, entry])),
  };
}

async function localizeClassLearningDataset(dataset, locale) {
  if (locale === "en") return dataset;

  const localizedResults = await mapLimit(dataset.results, 2, async (klass) => {
    const localizedClass = await localizeClassSummary(klass, locale);

    const levels = await mapLimit(localizedClass.levels, 3, async (level) => {
      const features = await mapLimit(level.features, 4, (feature) =>
        localizeFeature(feature, locale)
      );

      const featureRefs = await mapLimit(level.featureRefs, CONCURRENCY, async (ref) => ({
        ...ref,
        name: await translateText(ref.name, "es", "en"),
      }));

      const learnableSpells = await mapLimit(
        level.learnableSpells,
        CONCURRENCY,
        async (spell) => ({
          ...spell,
          // Keep official spell names in English for consistency across locales.
          name: spell.name,
        })
      );

      return {
        ...level,
        features,
        featureRefs,
        learnableSpells,
      };
    });

    const subclasses = await mapLimit(localizedClass.subclasses, 2, async (subclass) => {
      const levelsLocalized = await mapLimit(subclass.levels, 3, async (subLevel) => {
        const features = await mapLimit(subLevel.features, 4, (feature) =>
          localizeFeature(feature, locale)
        );
        const featureRefs = await mapLimit(
          subLevel.featureRefs,
          CONCURRENCY,
          async (ref) => ({
            ...ref,
            name: await translateText(ref.name, "es", "en"),
          })
        );
        return {
          ...subLevel,
          features,
          featureRefs,
        };
      });

      return {
        ...subclass,
        name: await translateText(subclass.name, "es", "en"),
        subclass_flavor: await translateOptional(subclass.subclass_flavor, locale),
        desc: await translateArray(subclass.desc, locale),
        class: subclass.class
          ? {
              ...subclass.class,
              name: await translateText(subclass.class.name, "es", "en"),
            }
          : null,
        levels: levelsLocalized,
      };
    });

    return {
      ...localizedClass,
      levels,
      subclasses,
    };
  });

  return {
    ...dataset,
    results: localizedResults,
    byIndex: Object.fromEntries(localizedResults.map((entry) => [entry.index, entry])),
  };
}

function applyEnglishSpellNamesToNode(value, spellNamesByIndex) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      applyEnglishSpellNamesToNode(entry, spellNamesByIndex);
    }
    return;
  }

  if (!value || typeof value !== "object") return;

  const index = value.index;
  const url = value.url;
  if (
    typeof index === "string" &&
    typeof url === "string" &&
    url.includes("/spells/") &&
    typeof value.name === "string" &&
    spellNamesByIndex[index]
  ) {
    value.name = spellNamesByIndex[index];
  }

  for (const child of Object.values(value)) {
    applyEnglishSpellNamesToNode(child, spellNamesByIndex);
  }
}

async function localizeReferenceDataset(reference, locale) {
  if (locale === "en") return reference;

  const spells = await mapLimit(reference.spells.results, 2, (spell) =>
    localizeSpell(spell, locale)
  );
  const features = await mapLimit(reference.features.results, 4, (feature) =>
    localizeFeature(feature, locale)
  );
  const classes = await mapLimit(reference.classes.results, 2, (klass) =>
    localizeClassSummary(klass, locale)
  );

  return {
    ...reference,
    locale,
    spells: {
      total: spells.length,
      results: spells,
      byIndex: Object.fromEntries(spells.map((entry) => [entry.index, entry])),
    },
    features: {
      total: features.length,
      results: features,
      byIndex: Object.fromEntries(features.map((entry) => [entry.index, entry])),
    },
    classes: {
      total: classes.length,
      results: classes,
      byIndex: Object.fromEntries(classes.map((entry) => [entry.index, entry])),
    },
  };
}

const NON_TRANSLATED_KEYS = new Set([
  "index",
  "url",
  "updated_at",
  "document__slug",
  "document__title",
  "document__license_url",
  "document__author",
  "x",
  "y",
]);

function shouldSkipStringTranslation(key, value) {
  const normalized = value.trim();
  if (!normalized) return true;
  if (key && NON_TRANSLATED_KEYS.has(key)) return true;
  if (normalized.startsWith("/api/")) return true;
  if (/^https?:\/\//.test(normalized)) return true;
  if (/^\d+(?:[.,]\d+)?$/.test(normalized)) return true;
  if (/^[A-Z]{1,3}$/.test(normalized)) return true;
  if (/^[a-z0-9]+(?:[-_][a-z0-9]+)+$/.test(normalized) && key !== "name") {
    return true;
  }
  return false;
}

async function localizeUnknownValue(value, locale, key = null) {
  if (locale === "en" || value == null) return value;

  if (Array.isArray(value)) {
    const localized = [];
    for (const entry of value) {
      localized.push(await localizeUnknownValue(entry, locale, key));
    }
    return localized;
  }

  if (typeof value === "object") {
    const localized = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      localized[childKey] = await localizeUnknownValue(
        childValue,
        locale,
        childKey
      );
    }
    return localized;
  }

  if (typeof value !== "string") return value;
  if (shouldSkipStringTranslation(key, value)) return value;
  return translateText(value, "es", "en");
}

async function buildFullApiDataset() {
  console.log("[sync] Fetching full API catalog index...");
  const rootCatalog = await fetchJson("/");
  const catalogEntries = Object.entries(rootCatalog).sort((a, b) =>
    String(a[0]).localeCompare(String(b[0]))
  );

  const categories = await mapLimit(catalogEntries, 2, async ([category, pathRef]) => {
    const listPath = String(pathRef);
    const listPayload = await fetchJson(listPath);
    const refs = Array.isArray(listPayload?.results) ? listPayload.results : [];

    console.log(`[sync] Fetching full category '${category}' (${refs.length})...`);
    const detailResults = await mapLimit(refs, CONCURRENCY, async (ref) => {
      const detailPath =
        typeof ref?.url === "string" && ref.url
          ? ref.url
          : `${listPath}/${ref?.index}`;
      try {
        return await fetchJson(detailPath);
      } catch (error) {
        console.warn(
          `[sync] failed detail ${category}/${ref?.index}: ${error?.message ?? error}`
        );
        return {
          ...ref,
          _syncError: String(error?.message ?? error),
        };
      }
    });

    const results = detailResults.sort((a, b) => {
      const left = String(a?.name ?? a?.index ?? "");
      const right = String(b?.name ?? b?.index ?? "");
      return left.localeCompare(right);
    });

    return [
      category,
      {
        category,
        endpoint: listPath,
        count: results.length,
        results,
      },
    ];
  });

  return {
    generatedAt: new Date().toISOString(),
    locale: "en",
    source: "dnd5eapi",
    translationProvider,
    categoryOrder: categories.map(([category]) => category),
    categories: Object.fromEntries(categories),
  };
}

async function localizeFullApiDataset(fullDataset, locale) {
  if (locale === "en") return fullDataset;

  const localizedCategoryEntries = await mapLimit(
    fullDataset.categoryOrder,
    1,
    async (category) => {
      const categoryPayload = fullDataset.categories[category];
      const results = Array.isArray(categoryPayload?.results)
        ? categoryPayload.results
        : [];

      console.log(`[sync] Localizing full category '${category}' (${results.length})...`);
      const localizedResults = await mapLimit(results, 2, (entry) =>
        localizeUnknownValue(entry, locale)
      );

      return [
        category,
        {
          ...categoryPayload,
          results: localizedResults,
        },
      ];
    }
  );

  return {
    ...fullDataset,
    generatedAt: new Date().toISOString(),
    locale,
    categories: Object.fromEntries(localizedCategoryEntries),
  };
}

async function writeJson(fileName, data) {
  const filePath = path.join(OUTPUT_DIR, fileName);
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`[sync] wrote ${filePath}`);
}

async function writeFullCategoryFiles(locale, fullDataset) {
  const localeDir = path.join(FULL_OUTPUT_DIR, locale);
  await mkdir(localeDir, { recursive: true });

  const categoryOrder = Array.isArray(fullDataset?.categoryOrder)
    ? fullDataset.categoryOrder
    : Object.keys(fullDataset?.categories ?? {});

  for (const category of categoryOrder) {
    const payload = fullDataset?.categories?.[category];
    if (!payload) continue;

    const filePath = path.join(localeDir, `${category}.json`);
    await writeFile(
      filePath,
      JSON.stringify(
        {
          generatedAt: fullDataset.generatedAt,
          locale,
          source: fullDataset.source,
          translationProvider: fullDataset.translationProvider,
          ...payload,
        },
        null,
        2
      ),
      "utf-8"
    );
    console.log(`[sync] wrote ${filePath}`);
  }
}

async function writeFullClassLearningFile(locale, classLearningDocument) {
  const localeDir = path.join(FULL_OUTPUT_DIR, locale);
  await mkdir(localeDir, { recursive: true });

  const filePath = path.join(localeDir, "class-learning.json");
  await writeFile(
    filePath,
    JSON.stringify(
      {
        generatedAt: classLearningDocument.generatedAt,
        locale,
        source: classLearningDocument.source,
        translationProvider: classLearningDocument.translationProvider,
        category: "class-learning",
        endpoint: "/api/2014/classes/{class}/levels",
        count: classLearningDocument?.classes?.total ?? 0,
        results: classLearningDocument?.classes?.results ?? [],
        byIndex: classLearningDocument?.classes?.byIndex ?? {},
      },
      null,
      2
    ),
    "utf-8"
  );
  console.log(`[sync] wrote ${filePath}`);
}

async function writeLocaleFiles(locale, referenceDocument, classLearningDocument) {
  const localeDir = path.join(OUTPUT_DIR, locale);
  await mkdir(localeDir, { recursive: true });

  const files = [
    ["spells.json", referenceDocument.spells],
    ["features.json", referenceDocument.features],
    ["classes.json", referenceDocument.classes],
    ["class-learning.json", classLearningDocument.classes],
  ];

  for (const [fileName, payload] of files) {
    const filePath = path.join(localeDir, fileName);
    await writeFile(
      filePath,
      JSON.stringify(
        {
          generatedAt: referenceDocument.generatedAt,
          locale,
          source: referenceDocument.source,
          translationProvider: referenceDocument.translationProvider,
          data: payload,
        },
        null,
        2
      ),
      "utf-8"
    );
    console.log(`[sync] wrote ${filePath}`);
  }
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const [spells, features] = await Promise.all([
    buildSpellsDataset(),
    buildFeaturesDataset(),
  ]);

  const classesSummary = {
    total: 0,
    results: [],
    byIndex: {},
  };

  // classes summary comes from class-learning dataset to avoid duplicate calls
  const classLearningEn = await buildClassLearningDataset(features.byIndex);
  classesSummary.total = classLearningEn.total;
  classesSummary.results = classLearningEn.results.map((klass) => {
    const { levels, subclasses, ...summary } = klass;
    return summary;
  });
  classesSummary.byIndex = Object.fromEntries(
    classesSummary.results.map((entry) => [entry.index, entry])
  );

  const referenceEn = {
    generatedAt: new Date().toISOString(),
    locale: "en",
    source: "dnd5eapi",
    translationProvider,
    spells,
    features,
    classes: classesSummary,
  };

  const classLearningDocumentEn = {
    generatedAt: new Date().toISOString(),
    locale: "en",
    source: "dnd5eapi",
    translationProvider,
    classes: classLearningEn,
  };

  console.log("[sync] localizing datasets to es...");
  const referenceEs = await localizeReferenceDataset(referenceEn, "es");
  const spellNamesByIndex = Object.fromEntries(
    referenceEn.spells.results.map((entry) => [entry.index, entry.name])
  );
  applyEnglishSpellNamesToNode(referenceEs, spellNamesByIndex);

  const classLearningEs = {
    generatedAt: new Date().toISOString(),
    locale: "es",
    source: "dnd5eapi",
    translationProvider,
    classes: await localizeClassLearningDataset(classLearningEn, "es"),
  };
  applyEnglishSpellNamesToNode(classLearningEs, spellNamesByIndex);

  await Promise.all([
    writeJson("dnd-reference.en.json", referenceEn),
    writeJson("dnd-reference.es.json", referenceEs),
    writeJson("dnd-class-learning.en.json", classLearningDocumentEn),
    writeJson("dnd-class-learning.es.json", classLearningEs),
    writeLocaleFiles("en", referenceEn, classLearningDocumentEn),
    writeLocaleFiles("es", referenceEs, classLearningEs),
    writeFullClassLearningFile("en", classLearningDocumentEn),
    writeFullClassLearningFile("es", classLearningEs),
  ]);

  const skipFullSync = process.env.DND_SKIP_FULL_SYNC === "1";
  if (!skipFullSync) {
    const fullApiEn = await buildFullApiDataset();
    const fullApiEs = await localizeFullApiDataset(fullApiEn, "es");
    applyEnglishSpellNamesToNode(fullApiEs, spellNamesByIndex);

    await Promise.all([
      writeJson("dnd-api-full.en.json", fullApiEn),
      writeJson("dnd-api-full.es.json", fullApiEs),
      writeFullCategoryFiles("en", fullApiEn),
      writeFullCategoryFiles("es", fullApiEs),
    ]);
  } else {
    console.log("[sync] skipping full API snapshot (DND_SKIP_FULL_SYNC=1)");
  }

  console.log("[sync] done");
}

main().catch((error) => {
  console.error("[sync] failed", error);
  process.exitCode = 1;
});
