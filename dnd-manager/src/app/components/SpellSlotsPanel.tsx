"use client";

import React, { useMemo } from "react";
import { getSpellSlotsFor } from "@/lib/spellSlots";
import { getClassColor } from "@/app/components/StatsHexagon";
import { useClientLocale } from "@/lib/i18n/useClientLocale";
import { tr } from "@/lib/i18n/translate";

type ClassColor = { stroke: string; fill: string };

type Props = {
  characterClass?: string | null;
  characterLevel?: number | null;
  spellSlotsOverride?: Record<string, number> | null;
  spellSlotModifiers?: Record<string, number> | null;
  className?: string;
};

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

function getSpellSlotTone(level: number, classColor: ClassColor) {
  const alpha = Math.min(0.6, 0.12 + level * 0.05);
  const borderAlpha = Math.min(0.9, 0.35 + level * 0.05);
  return {
    background: hexToRgba(classColor.stroke, alpha),
    border: hexToRgba(classColor.stroke, borderAlpha),
  };
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
  const hasManualSlots = Object.keys(normalizedManualSlots).length > 0;
  const classColor = getClassColor(characterClass ?? undefined);

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

  if (!hasManualSlots && !automaticSlots) {
    return null;
  }

  if (visibleSpellSlots.length === 0) {
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
    </div>
  );
}

