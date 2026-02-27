"use client";

import React, { useMemo } from "react";
import { getSpellSlotsFor } from "@/lib/spellSlots";
import { getClassColor, getCombinedClassColor } from "@/app/components/StatsHexagon";
import { useClientLocale } from "@/lib/i18n/useClientLocale";
import { tr } from "@/lib/i18n/translate";
import { CircleDot, Leaf, Zap } from "lucide-react";

type ClassColor = { stroke: string; fill: string };

type Props = {
  characterClass?: string | null;
  characterLevel?: number | null;
  spellSlotsOverride?: Record<string, number> | null;
  spellSlotModifiers?: Record<string, number> | null;
  classResourceModifiers?: Record<string, number> | null;
  classResourceSources?: Array<{
    classId?: string | null;
    level?: number | null;
  }> | null;
  className?: string;
};

type ClassResourceKey = string;
type ClassResourceSource = { classId: string; level: number };
type VisibleClassResource = {
  key: string;
  label: string;
  charges: number;
  classId?: string;
};

const CLASS_RESOURCE_DEFS: Array<{
  key: ClassResourceKey;
  classId: "druid" | "monk";
  minLevel: number;
  labelEs: string;
  labelEn: string;
  baseCount: (level: number) => number;
}> = [
  {
    key: "WILD_SHAPE",
    classId: "druid",
    minLevel: 2,
    labelEs: "Forma salvaje",
    labelEn: "Wild Shape",
    baseCount: () => 2,
  },
  {
    key: "FOCUS_POINTS",
    classId: "monk",
    minLevel: 2,
    labelEs: "Puntos de enfoque",
    labelEn: "Focus Points",
    baseCount: (level) => Math.max(0, Math.floor(level)),
  },
];
const KNOWN_CLASS_RESOURCE_KEYS = new Set(
  CLASS_RESOURCE_DEFS.map((resource) => resource.key)
);

function normalizeClassForResources(raw: string | null | undefined): string {
  if (!raw) return "";
  const normalized = raw
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (
    normalized === "druida" ||
    normalized === "druid" ||
    normalized.includes("druida") ||
    normalized.includes("druid")
  ) {
    return "druid";
  }
  if (
    normalized === "monje" ||
    normalized === "monk" ||
    normalized.includes("monje") ||
    normalized.includes("monk")
  ) {
    return "monk";
  }
  return normalized;
}

function normalizeClassResourceSources(
  sources: Array<{ classId?: string | null; level?: number | null }> | null | undefined,
  fallbackClass: string | null | undefined,
  fallbackLevel: number | null
): ClassResourceSource[] {
  const merged = new Map<string, number>();
  const pushSource = (rawClass: string | null | undefined, rawLevel: number | null | undefined) => {
    const classId = normalizeClassForResources(rawClass);
    const parsedLevel = Number(rawLevel);
    if (!classId || !Number.isFinite(parsedLevel) || parsedLevel < 1) {
      return;
    }
    const level = Math.max(1, Math.floor(parsedLevel));
    const existing = merged.get(classId) ?? 0;
    if (level > existing) {
      merged.set(classId, level);
    }
  };

  if (Array.isArray(sources) && sources.length > 0) {
    for (const source of sources) {
      pushSource(source?.classId, source?.level);
    }
  }

  if (merged.size === 0) {
    pushSource(fallbackClass, fallbackLevel);
  }

  return Array.from(merged.entries()).map(([classId, level]) => ({ classId, level }));
}

function parseResourceKey(rawKey: string): {
  key: string;
  prefixed: boolean;
} | null {
  const normalized = String(rawKey).toUpperCase().trim();
  if (!normalized) return null;
  if (normalized.startsWith("SPELL_RESOURCE_")) {
    const stripped = normalized.replace("SPELL_RESOURCE_", "").trim();
    if (!stripped) return null;
    return { key: stripped, prefixed: true };
  }
  if (normalized.startsWith("RESOURCE_")) {
    const stripped = normalized.replace("RESOURCE_", "").trim();
    if (!stripped) return null;
    return { key: stripped, prefixed: true };
  }
  return { key: normalized, prefixed: false };
}

function normalizeResourceOverrides(
  raw: Record<string, number> | null | undefined
): Record<ClassResourceKey, number> {
  if (!raw || typeof raw !== "object") return {} as Record<ClassResourceKey, number>;
  const next: Record<ClassResourceKey, number> = {};
  for (const [rawKey, rawValue] of Object.entries(raw)) {
    const parsedKey = parseResourceKey(rawKey);
    if (!parsedKey) continue;
    const resourceKey = parsedKey.key;
    if (!parsedKey.prefixed && !KNOWN_CLASS_RESOURCE_KEYS.has(resourceKey)) {
      continue;
    }
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) continue;
    next[resourceKey] = Math.max(0, Math.floor(numeric));
  }
  return next;
}

function getResourceLabel(resourceKey: string, locale: string): string {
  if (resourceKey === "WILD_SHAPE") {
    return tr(locale, "Forma salvaje", "Wild Shape");
  }
  if (resourceKey === "FOCUS_POINTS") {
    return tr(locale, "Puntos de enfoque", "Focus Points");
  }
  return resourceKey
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function ResourceIcon({
  resourceKey,
  color,
}: {
  resourceKey: string;
  color?: string;
}) {
  const style = color
    ? {
        color,
        fill: hexToRgba(color, 0.16),
      }
    : undefined;
  if (resourceKey === "WILD_SHAPE") {
    return <Leaf className="h-3.5 w-3.5" style={style} />;
  }
  if (resourceKey === "FOCUS_POINTS") {
    return <Zap className="h-3.5 w-3.5" style={style} />;
  }
  return <CircleDot className="h-3.5 w-3.5" style={style} />;
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "").trim();
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((ch) => `${ch}${ch}`)
          .join("")
      : clean;
  if (normalized.length !== 6) {
    return `rgba(16,185,129,${alpha})`;
  }
  const num = parseInt(normalized, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "").trim();
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((ch) => `${ch}${ch}`)
          .join("")
      : clean;
  if (normalized.length !== 6) return null;
  const num = parseInt(normalized, 16);
  if (!Number.isFinite(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function mixRgb(
  base: { r: number; g: number; b: number },
  target: { r: number; g: number; b: number },
  amount: number
) {
  const t = Math.max(0, Math.min(1, amount));
  return {
    r: Math.round(base.r + (target.r - base.r) * t),
    g: Math.round(base.g + (target.g - base.g) * t),
    b: Math.round(base.b + (target.b - base.b) * t),
  };
}

function getSpellSlotTone(level: number, classColor: ClassColor) {
  const normalizedLevel = Math.max(1, Math.min(9, Math.floor(level || 1)));
  const progress = (normalizedLevel - 1) / 8;
  // Progresion original: mismo color base, de mas claro a mas intenso por nivel.
  const alpha = 0.17 + progress * 0.4;
  const borderAlpha = 0.4 + progress * 0.4;
  return {
    background: hexToRgba(classColor.stroke, alpha),
    border: hexToRgba(classColor.stroke, borderAlpha),
  };
}

function getResourceTone(resourceKey: string, resourceColor: ClassColor) {
  if (resourceKey === "WILD_SHAPE") {
    return {
      background: hexToRgba(resourceColor.stroke, 0.2),
      border: hexToRgba(resourceColor.stroke, 0.78),
      icon: hexToRgba(resourceColor.stroke, 0.98),
    };
  }
  if (resourceKey === "FOCUS_POINTS") {
    return {
      background: hexToRgba(resourceColor.stroke, 0.18),
      border: hexToRgba(resourceColor.stroke, 0.82),
      icon: hexToRgba(resourceColor.stroke, 0.98),
    };
  }
  return {
    background: hexToRgba(resourceColor.stroke, 0.22),
    border: hexToRgba(resourceColor.stroke, 0.72),
    icon: hexToRgba(resourceColor.stroke, 0.96),
  };
}

function ResourceChargeGlyph({
  resourceKey,
  resourceColor,
  label,
  locale,
}: {
  resourceKey: string;
  resourceColor: ClassColor;
  label: string;
  locale: string;
}) {
  const tone = getResourceTone(resourceKey, resourceColor);
  const title = tr(locale, `Carga: ${label}`, `Charge: ${label}`);

  if (resourceKey === "WILD_SHAPE") {
    return (
      <div
        className="h-4 w-4 inline-flex items-center justify-center border -rotate-12 rounded-[45%_55%_60%_40%/50%_45%_55%_50%]"
        style={{
          backgroundColor: tone.background,
          borderColor: tone.border,
        }}
        title={title}
      >
        <Leaf
          className="h-2.5 w-2.5 rotate-12"
          style={{ color: tone.icon, fill: hexToRgba(resourceColor.stroke, 0.22) }}
        />
      </div>
    );
  }

  if (resourceKey === "FOCUS_POINTS") {
    return (
      <div
        className="h-4 w-4 inline-flex items-center justify-center border rotate-45 rounded-[3px]"
        style={{
          backgroundColor: tone.background,
          borderColor: tone.border,
        }}
        title={title}
      >
        <Zap
          className="h-2.5 w-2.5 -rotate-45"
          style={{ color: tone.icon, fill: hexToRgba(resourceColor.stroke, 0.18) }}
        />
      </div>
    );
  }

  return (
    <div
      className="h-3.5 w-3.5 rounded-full border inline-flex items-center justify-center"
      style={{
        backgroundColor: tone.background,
        borderColor: tone.border,
      }}
      title={title}
    >
      <CircleDot className="h-2 w-2" style={{ color: tone.icon }} />
    </div>
  );
}

function SpellSlotOrb({
  level,
  classColor,
  locale,
}: {
  level: number;
  classColor: ClassColor;
  locale: string;
}) {
  const tone = getSpellSlotTone(level, classColor);
  return (
    <div
      className="h-4 w-4 rounded-full border"
      style={{ backgroundColor: tone.background, borderColor: tone.border }}
      title={tr(
        locale,
        `Espacio de conjuro de nivel ${level}`,
        `Spell slot level ${level}`
      )}
    />
  );
}

export default function SpellSlotsPanel({
  characterClass,
  characterLevel,
  spellSlotsOverride,
  spellSlotModifiers,
  classResourceModifiers,
  classResourceSources,
  className,
}: Props) {
  const locale = useClientLocale();
  const safeLevel = typeof characterLevel === "number" ? characterLevel : null;
  const automaticSlots =
    characterClass && safeLevel ? getSpellSlotsFor(characterClass, safeLevel) : null;
  const normalizedManualSlots = useMemo(() => {
    if (!spellSlotsOverride || typeof spellSlotsOverride !== "object") {
      return {} as Record<string, number>;
    }
    const parsed: Record<string, number> = {};
    for (let level = 1; level <= 9; level += 1) {
      const key = String(level);
      const value = Number(spellSlotsOverride[key]);
      if (Number.isFinite(value) && value >= 0) {
        parsed[key] = Math.floor(value);
      }
    }
    return parsed;
  }, [spellSlotsOverride]);
  const normalizedSlotModifiers = useMemo(() => {
    if (!spellSlotModifiers || typeof spellSlotModifiers !== "object") {
      return {} as Record<string, number>;
    }
    const parsed: Record<string, number> = {};
    for (let level = 1; level <= 9; level += 1) {
      const key = String(level);
      const value = Number(spellSlotModifiers[key]);
      if (Number.isFinite(value) && value !== 0) {
        parsed[key] = Math.floor(value);
      }
    }
    return parsed;
  }, [spellSlotModifiers]);
  const normalizedClassResourceModifiers = useMemo(() => {
    if (!classResourceModifiers || typeof classResourceModifiers !== "object") {
      return {} as Record<ClassResourceKey, number>;
    }
    const next: Record<ClassResourceKey, number> = {};
    for (const [rawKey, rawValue] of Object.entries(classResourceModifiers)) {
      const parsedKey = parseResourceKey(rawKey);
      if (!parsedKey) continue;
      const key = parsedKey.key;
      if (!parsedKey.prefixed && !/^[A-Z][A-Z0-9_]*$/.test(key)) {
        continue;
      }
      const value = Number(rawValue);
      if (!Number.isFinite(value) || value === 0) continue;
      next[key] = (next[key] ?? 0) + Math.floor(value);
    }
    return next;
  }, [classResourceModifiers]);
  const normalizedClassResourceOverrides = useMemo(
    () => normalizeResourceOverrides(spellSlotsOverride),
    [spellSlotsOverride]
  );
  const normalizedClassResourceSources = useMemo(
    () =>
      normalizeClassResourceSources(
        classResourceSources,
        characterClass,
        safeLevel
      ),
    [classResourceSources, characterClass, safeLevel]
  );
  const classColorMixClassIds = useMemo(() => {
    const ids = normalizedClassResourceSources
      .map((source) => source.classId)
      .filter((classId): classId is string => !!classId && classId.trim().length > 0);
    if (ids.length === 0 && characterClass) {
      ids.push(characterClass);
    }
    return Array.from(new Set(ids));
  }, [normalizedClassResourceSources, characterClass]);
  const hasManualSlots = Object.keys(normalizedManualSlots).length > 0;
  const classColor =
    classColorMixClassIds.length > 1
      ? getCombinedClassColor(classColorMixClassIds, characterClass ?? undefined)
      : getClassColor(classColorMixClassIds[0] ?? characterClass ?? undefined);

  const spellSlotCounts = useMemo(() => {
    const levels = Array.from({ length: 9 }, (_, i) => i + 1);
    if (hasManualSlots) {
      return levels.map((lvl) => ({
        level: lvl,
        slots: Number(normalizedManualSlots[String(lvl)] ?? 0),
      }));
    }
    if (!automaticSlots) {
      return levels.map((lvl) => ({ level: lvl, slots: 0 }));
    }
    if ("slots" in automaticSlots) {
      return levels.map((lvl) => ({
        level: lvl,
        slots:
          lvl === Number((automaticSlots as any).slotLevel)
            ? Number((automaticSlots as any).slots)
            : 0,
      }));
    }
    return levels.map((lvl) => ({
      level: lvl,
      slots: Number((automaticSlots as any)[lvl] ?? 0),
    }));
  }, [automaticSlots, hasManualSlots, normalizedManualSlots]);
  const adjustedSpellSlotCounts = useMemo(
    () =>
      spellSlotCounts.map((entry) => {
        const modifier = Number(normalizedSlotModifiers[String(entry.level)] ?? 0);
        return {
          ...entry,
          slots: Math.max(0, Number(entry.slots) + modifier),
        };
      }),
    [spellSlotCounts, normalizedSlotModifiers]
  );
  const visibleSpellSlots = adjustedSpellSlotCounts.filter((entry) => entry.slots > 0);
  const classResources = useMemo(() => {
    const sourceByClass = new Map<string, number>();
    for (const source of normalizedClassResourceSources) {
      const existing = sourceByClass.get(source.classId) ?? 0;
      if (source.level > existing) {
        sourceByClass.set(source.classId, source.level);
      }
    }

    const overrideKeys = Object.keys(normalizedClassResourceOverrides);
    const modifierKeys = Object.keys(normalizedClassResourceModifiers);
    const forcedKeys = new Set<string>([...overrideKeys, ...modifierKeys]);
    const knownKeys = new Set(CLASS_RESOURCE_DEFS.map((resource) => resource.key));

    const knownResources: VisibleClassResource[] = [];
    for (const resource of CLASS_RESOURCE_DEFS) {
      const sourceLevel = sourceByClass.get(resource.classId) ?? 0;
      const hasClassLevel = sourceLevel >= resource.minLevel;
      const hasManualValue = forcedKeys.has(resource.key);
      if (!hasClassLevel && !hasManualValue) {
        continue;
      }
      const override = normalizedClassResourceOverrides[resource.key];
      const base = Number.isFinite(override)
        ? Number(override)
        : hasClassLevel
          ? resource.baseCount(sourceLevel)
          : 0;
      const modifier = Number(normalizedClassResourceModifiers[resource.key] ?? 0);
      const charges = Math.max(0, Math.floor(base + modifier));
      if (charges <= 0) {
        continue;
      }
      knownResources.push({
        key: resource.key,
        label: locale === "en" ? resource.labelEn : resource.labelEs,
        charges,
        classId: resource.classId,
      });
    }

    const fallbackClassId =
      normalizedClassResourceSources.length === 1
        ? normalizedClassResourceSources[0].classId
        : normalizeClassForResources(characterClass);

    const customResources: VisibleClassResource[] = [];
    for (const key of Array.from(forcedKeys).filter((candidate) => !knownKeys.has(candidate))) {
      const override = Number(normalizedClassResourceOverrides[key] ?? 0);
      const modifier = Number(normalizedClassResourceModifiers[key] ?? 0);
      const charges = Math.max(0, Math.floor(override + modifier));
      if (charges <= 0) {
        continue;
      }
      customResources.push({
        key,
        label: getResourceLabel(key, locale),
        charges,
        classId: fallbackClassId || undefined,
      });
    }

    return [...knownResources, ...customResources];
  }, [
    locale,
    normalizedClassResourceSources,
    normalizedClassResourceModifiers,
    normalizedClassResourceOverrides,
    characterClass,
  ]);
  const visibleClassResources = classResources;
  const gridColumns = useMemo(() => {
    const count = visibleSpellSlots.length;
    if (count <= 1) return 1;
    if (count <= 3) return count;
    if (count === 4) return 2;
    if (count === 6) return 3;
    if (count === 8) return 4;
    if (count === 9) return 3;
    if (count % 2 === 0 && count / 2 <= 4) return count / 2;
    return Math.ceil(Math.sqrt(count));
  }, [visibleSpellSlots.length]);

  const panelClassName = className
    ? `rounded-3xl border border-ring bg-panel/90 p-[var(--panel-pad)] w-full ${className}`
    : "rounded-3xl border border-ring bg-panel/90 p-[var(--panel-pad)] w-full";

  if (visibleSpellSlots.length === 0 && visibleClassResources.length === 0) {
    return null;
  }

  return (
    <div className={panelClassName}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-display font-semibold text-ink">
          {tr(locale, "Espacios de conjuro", "Spell slots")}
        </h3>
        {!hasManualSlots && automaticSlots && "slots" in automaticSlots ? (
          <span className="text-[11px] text-ink-muted">
            {tr(locale, "Brujo", "Warlock")} · {tr(locale, "nivel", "level")}{" "}
            {(automaticSlots as any).slotLevel}
          </span>
        ) : null}
      </div>

      {visibleSpellSlots.length > 0 && (
        <div className="mt-3">
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
            }}
          >
            {visibleSpellSlots.map((entry) => (
              <div
                key={entry.level}
                className="rounded-xl border border-ring bg-white/80 px-2 py-2"
              >
                <div className="text-[10px] uppercase tracking-[0.25em] text-ink-muted">
                  {tr(locale, "Nivel", "Level")} {entry.level}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {Array.from({ length: entry.slots }).map((_, i) => (
                    <SpellSlotOrb
                      key={i}
                      level={entry.level}
                      classColor={classColor}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {visibleClassResources.length > 0 && (
        <div className={visibleSpellSlots.length > 0 ? "mt-4" : "mt-3"}>
          <div className="text-[10px] uppercase tracking-[0.25em] text-ink-muted mb-2">
            {tr(locale, "Recursos de clase", "Class resources")}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {visibleClassResources.map((resource) => {
              const previewCharges = Math.min(resource.charges, 12);
              const resourceColor = getCombinedClassColor(
                resource.classId
                  ? [resource.classId, ...classColorMixClassIds]
                  : classColorMixClassIds,
                characterClass ?? undefined
              );
              const iconColor = hexToRgba(resourceColor.stroke, 0.98);
              return (
                <div
                  key={resource.key}
                  className="rounded-xl border border-ring bg-white/80 px-2 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink">
                      <ResourceIcon resourceKey={resource.key} color={iconColor} />
                      <span>{resource.label}</span>
                    </div>
                    <span className="text-[11px] font-mono text-ink">
                      {resource.charges}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    {Array.from({ length: previewCharges }).map((_, index) => (
                      <ResourceChargeGlyph
                        key={`${resource.key}-${index}`}
                        resourceKey={resource.key}
                        resourceColor={resourceColor}
                        label={resource.label}
                        locale={locale}
                      />
                    ))}
                    {resource.charges > previewCharges && (
                      <span className="text-[10px] text-ink-muted">
                        +{resource.charges - previewCharges}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

