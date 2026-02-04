"use client";

import React, { useMemo } from "react";
import { getSpellSlotsFor } from "@/lib/spellSlots";
import { getClassColor } from "@/app/components/StatsHexagon";

type ClassColor = { stroke: string; fill: string };

type Props = {
  characterClass?: string | null;
  characterLevel?: number | null;
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
}: {
  level: number;
  classColor: ClassColor;
}) {
  const tone = getSpellSlotTone(level, classColor);
  return (
    <div
      className="h-4 w-4 rounded-full border"
      style={{ backgroundColor: tone.background, borderColor: tone.border }}
      title={`Espacio de conjuro de nivel ${level}`}
    />
  );
}

export default function SpellSlotsPanel({
  characterClass,
  characterLevel,
  className,
}: Props) {
  const safeLevel = typeof characterLevel === "number" ? characterLevel : null;
  const spellSlots =
    characterClass && safeLevel ? getSpellSlotsFor(characterClass, safeLevel) : null;
  const classColor = getClassColor(characterClass ?? undefined);

  const spellSlotCounts = useMemo(() => {
    const levels = Array.from({ length: 9 }, (_, i) => i + 1);
    if (!spellSlots) {
      return levels.map((lvl) => ({ level: lvl, slots: 0 }));
    }
    if ("slots" in spellSlots) {
      return levels.map((lvl) => ({
        level: lvl,
        slots:
          lvl === Number((spellSlots as any).slotLevel)
            ? Number((spellSlots as any).slots)
            : 0,
      }));
    }
    return levels.map((lvl) => ({
      level: lvl,
      slots: Number((spellSlots as any)[lvl] ?? 0),
    }));
  }, [spellSlots]);

  const panelClassName = className
    ? `rounded-3xl border border-ring bg-panel/90 p-[var(--panel-pad)] w-full ${className}`
    : "rounded-3xl border border-ring bg-panel/90 p-[var(--panel-pad)] w-full";

  return (
    <div className={panelClassName}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-display font-semibold text-ink">
          Espacios de conjuro
        </h3>
        {spellSlots && "slots" in spellSlots ? (
          <span className="text-[11px] text-ink-muted">
            Brujo · nivel {(spellSlots as any).slotLevel}
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        {!spellSlots ? (
          <p className="text-xs text-ink-muted">
            Esta clase no tiene espacios de conjuro.
          </p>
        ) : (
          <div className="grid grid-flow-col grid-rows-3 grid-cols-3 gap-2">
            {spellSlotCounts.map((entry) => (
              <div
                key={entry.level}
                className="rounded-xl border border-ring bg-white/80 px-2 py-2"
              >
                <div className="text-[10px] uppercase tracking-[0.25em] text-ink-muted">
                  Nivel {entry.level}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {entry.slots > 0 ? (
                    Array.from({ length: entry.slots }).map((_, i) => (
                      <SpellSlotOrb
                        key={i}
                        level={entry.level}
                        classColor={classColor}
                      />
                    ))
                  ) : (
                    <span className="text-[11px] text-ink-muted">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
