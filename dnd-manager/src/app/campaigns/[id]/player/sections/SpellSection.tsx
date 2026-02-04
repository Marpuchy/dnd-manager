import { useMemo, useState } from "react";
import { SpellSummary, parseSpellLines } from "../playerShared";
import { getSpellSlotsFor } from "@/lib/spellSlots";
import { getClientLocale } from "@/lib/i18n/getClientLocale";
import { getLocalizedText } from "@/lib/character/items";

type SpellSectionProps = {
  charClass: string;
  charLevel: number;
  spellsL0: string;
  setSpellsL0: (v: string) => void;
  spellsL1: string;
  setSpellsL1: (v: string) => void;
  spellsL2: string;
  setSpellsL2: (v: string) => void;
  spellsL3: string;
  setSpellsL3: (v: string) => void;
  spellsL4: string;
  setSpellsL4: (v: string) => void;
  spellsL5: string;
  setSpellsL5: (v: string) => void;
  spellsL6: string;
  setSpellsL6: (v: string) => void;
  spellsL7: string;
  setSpellsL7: (v: string) => void;
  spellsL8: string;
  setSpellsL8: (v: string) => void;
  spellsL9: string;
  setSpellsL9: (v: string) => void;
  onOpenCustomCreate?: () => void;
};

export function SpellSection({
  charClass,
  charLevel,
  spellsL0,
  setSpellsL0,
  spellsL1,
  setSpellsL1,
  spellsL2,
  setSpellsL2,
  spellsL3,
  setSpellsL3,
  spellsL4,
  setSpellsL4,
  spellsL5,
  setSpellsL5,
  spellsL6,
  setSpellsL6,
  spellsL7,
  setSpellsL7,
  spellsL8,
  setSpellsL8,
  spellsL9,
  setSpellsL9,
  onOpenCustomCreate,
}: SpellSectionProps) {
  const maxSpellLevel = useMemo(() => {
    if (!charClass || !charLevel || charLevel < 1) return 0;

    let clsForSlots = charClass;
    if (charClass === "custom") {
      clsForSlots = "wizard";
    }

    const slots = getSpellSlotsFor(clsForSlots, charLevel as number);
    if (!slots) return 0;

    if ("slots" in (slots as any)) {
      return (slots as any).slotLevel ?? 0;
    }

    const entries = Object.entries(slots as any)
      .map(([lvl, num]) => ({ lvl: Number(lvl), num: num as number }))
      .filter((e) => e.lvl > 0 && e.num > 0);

    if (entries.length === 0) return 0;
    return entries.reduce((max, e) => Math.max(max, e.lvl), 0);
  }, [charClass, charLevel]);

  const spellLevelFields = [
    { level: 0, label: "Trucos (nivel 0)", value: spellsL0, setter: setSpellsL0 },
    { level: 1, label: "Nivel 1", value: spellsL1, setter: setSpellsL1 },
    { level: 2, label: "Nivel 2", value: spellsL2, setter: setSpellsL2 },
    { level: 3, label: "Nivel 3", value: spellsL3, setter: setSpellsL3 },
    { level: 4, label: "Nivel 4", value: spellsL4, setter: setSpellsL4 },
    { level: 5, label: "Nivel 5", value: spellsL5, setter: setSpellsL5 },
    { level: 6, label: "Nivel 6", value: spellsL6, setter: setSpellsL6 },
    { level: 7, label: "Nivel 7", value: spellsL7, setter: setSpellsL7 },
    { level: 8, label: "Nivel 8", value: spellsL8, setter: setSpellsL8 },
    { level: 9, label: "Nivel 9", value: spellsL9, setter: setSpellsL9 },
  ].filter((f) => f.level === 0 || f.level <= maxSpellLevel);

  function getSpellStateForLevel(level: number) {
    switch (level) {
      case 0:
        return { value: spellsL0 as string, set: setSpellsL0 };
      case 1:
        return { value: spellsL1 as string, set: setSpellsL1 };
      case 2:
        return { value: spellsL2 as string, set: setSpellsL2 };
      case 3:
        return { value: spellsL3 as string, set: setSpellsL3 };
      case 4:
        return { value: spellsL4 as string, set: setSpellsL4 };
      case 5:
        return { value: spellsL5 as string, set: setSpellsL5 };
      case 6:
        return { value: spellsL6 as string, set: setSpellsL6 };
      case 7:
        return { value: spellsL7 as string, set: setSpellsL7 };
      case 8:
        return { value: spellsL8 as string, set: setSpellsL8 };
      case 9:
        return { value: spellsL9 as string, set: setSpellsL9 };
      default:
        return null;
    }
  }

  function isSpellLearnedInForm(spell: SpellSummary): boolean {
    const state = getSpellStateForLevel(spell.level);
    if (!state) return false;
    const lines = parseSpellLines(state.value || "");
    return lines.some((line) => line.name === spell.name);
  }

  function addSpellToForm(spell: SpellSummary) {
    const state = getSpellStateForLevel(spell.level);
    if (!state) return;

    const raw = (state.value || "") as string;
    const currentLines = raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (currentLines.some((l) => l.split("—")[0].trim() === spell.name)) return;

    const newValue = currentLines.length > 0 ? `${raw.trim()}\n${spell.name}` : spell.name;

    state.set(newValue);
  }

  function removeSpellFromForm(spell: SpellSummary) {
    const state = getSpellStateForLevel(spell.level);
    if (!state) return;

    const raw = (state.value || "") as string;
    const newLines = raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((line) => {
        const name = line.split("—")[0].trim();
        return name !== spell.name;
      });

    state.set(newLines.join("\n"));
  }

  function removeSpellByLevelAndName(level: number, name: string) {
    const fakeSpell: SpellSummary = { index: `${level}-${name}`, name, level } as SpellSummary;
    removeSpellFromForm(fakeSpell);
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-ink">Conjuros añadidos al personaje</h3>

      {spellLevelFields.every((f) => parseSpellLines(f.value || "").length === 0) && (
        <p className="text-xs text-ink-muted">
          Aún no has añadido conjuros. Usa el buscador de habilidades de abajo para añadirlos.
        </p>
      )}

      <div className="space-y-3">
        {spellLevelFields.map((field) => {
          const lines = parseSpellLines(field.value || "");
          if (lines.length === 0) return null;

          return (
            <div key={field.level} className="space-y-1">
              <p className="text-xs font-semibold text-ink">{field.label}</p>
              <div className="flex flex-wrap gap-3">
                {lines.map((line) => (
                  <span
                    key={line.name}
                    className="inline-flex items-center gap-3 px-2 py-1 rounded-full bg-white/80 border border-ring text-[11px] text-ink"
                  >
                    <span className="truncate max-w-[140px] md:max-w-[220px]">{line.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSpellByLevelAndName(field.level, line.name)}
                      className="text-[10px] text-red-600 hover:text-red-500 whitespace-nowrap"
                    >
                      Eliminar
                    </button>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <MiniSpellSearch
        charClass={charClass}
        charLevel={charLevel}
        isSpellLearned={isSpellLearnedInForm}
        onAddSpell={addSpellToForm}
        onRemoveSpell={removeSpellFromForm}
        onOpenCustomCreate={onOpenCustomCreate}
      />
    </section>
  );
}

type MiniSpellSearchProps = {
  charClass: string;
  charLevel: number;
  isSpellLearned: (spell: SpellSummary) => boolean;
  onAddSpell: (spell: SpellSummary) => void;
  onRemoveSpell: (spell: SpellSummary) => void;
  onOpenCustomCreate?: () => void;
};

function MiniSpellSearch({
  charClass,
  charLevel,
  isSpellLearned,
  onAddSpell,
  onRemoveSpell,
  onOpenCustomCreate,
}: MiniSpellSearchProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spells, setSpells] = useState<SpellSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState<"level" | "alpha">("level");

  const locale = getClientLocale();

  async function loadSpells() {
    try {
      setIsLoading(true);
      setError(null);
      setSpells([]);

      if (!charClass || !charLevel || charLevel < 1) {
        throw new Error("Selecciona clase y nivel para cargar habilidades de conjuro.");
      }

      let clsForApi = charClass;
      if (charClass === "custom") clsForApi = "wizard";

      const response = await fetch(
        `/api/dnd/spells?class=${encodeURIComponent(clsForApi)}&level=${charLevel}&locale=${locale}`
      );
      if (!response.ok) throw new Error("No se ha podido cargar la lista de habilidades.");

      const data: SpellSummary[] = await response.json();
      setSpells(data);
    } catch (err: any) {
      setError(err?.message ?? "Error cargando habilidades.");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredAndSorted = spells
    .filter((spell) => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;

      const inName = spell.name.toLowerCase().includes(term);
      const shortDesc = getLocalizedText((spell as any).shortDesc, locale).toLowerCase();
      const fullDesc = getLocalizedText((spell as any).fullDesc, locale).toLowerCase();
      const inDesc = shortDesc.includes(term) || fullDesc.includes(term);
      return inName || inDesc;
    })
    .sort((a, b) => {
      if (sortMode === "alpha") return a.name.localeCompare(b.name);
      if (a.level !== b.level) return a.level - b.level;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="border border-ring rounded-2xl p-3 space-y-3 mt-2 bg-panel/80">
      <div className="space-y-3">
        {onOpenCustomCreate && (
          <div className="flex">
            <button
              type="button"
              onClick={onOpenCustomCreate}
              className="text-[11px] px-3 py-2 rounded-md border border-accent/60 bg-accent/10 hover:bg-accent/20"
            >
              Crear hechizo personalizado
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Buscar habilidades por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label className="text-[11px] text-ink-muted">Ordenar por</label>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as "level" | "alpha")}
                className="rounded-md bg-white/80 border border-ring px-3 py-2 text-xs text-ink outline-none focus:border-accent"
              >
                <option value="level">Nivel → Nombre</option>
                <option value="alpha">Nombre (A-Z)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={loadSpells}
              className="text-[11px] px-3 py-2 rounded-md border border-ring bg-white/70 text-ink hover:bg-white"
            >
              {isLoading ? "Cargando..." : "Cargar habilidades"}
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {!isLoading && spells.length === 0 && !error && (
        <p className="text-xs text-ink-muted">
          Usa “Cargar habilidades” para ver la lista de conjuros disponibles para esta clase y nivel. Desde aquí puedes añadirlos o quitarlos del personaje.
        </p>
      )}

      <div className="max-h-64 overflow-y-auto space-y-2 text-sm styled-scrollbar">
        {filteredAndSorted.map((spell) => {
          const typeLabel =
            spell.level === 0 ? "Truco (cantrip)" : `Hechizo de nivel ${spell.level}`;
          const learned = isSpellLearned(spell);
          const shortDesc = getLocalizedText((spell as any).shortDesc, locale);
          const fullDesc = getLocalizedText((spell as any).fullDesc, locale);

          return (
            <div key={spell.index} className="border border-ring rounded-md p-2 space-y-1 bg-white/80">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-[160px]">
                  <p className="font-medium text-ink break-words">{spell.name}</p>
                  <p className="text-[11px] text-ink-muted">{typeLabel}</p>
                </div>

                <button
                  type="button"
                  onClick={() => (learned ? onRemoveSpell(spell) : onAddSpell(spell))}
                  className={`text-[11px] px-3 py-1 rounded-md border ${
                    learned
                      ? "border-red-400/70 text-red-600 bg-red-50 hover:bg-red-100"
                      : "border-emerald-400/70 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  }`}
                >
                  {learned ? "Eliminar" : "Añadir"}
                </button>
              </div>

              {shortDesc && <p className="text-xs text-ink-muted">{shortDesc}</p>}

              <details className="mt-1 text-xs text-ink-muted whitespace-pre-wrap">
                <summary className="cursor-pointer text-[11px] text-ink-muted">
                  Ver descripción completa
                </summary>
                <div className="mt-1 text-ink">
                  {spell.fullDesc ?? spell.shortDesc ?? "Sin descripción ampliada disponible en la SRD."}
                </div>
              </details>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        .styled-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(179, 90, 44, 0.6) rgba(140, 114, 85, 0.12); }
        .styled-scrollbar::-webkit-scrollbar { width: 8px; }
        .styled-scrollbar::-webkit-scrollbar-track { background: rgba(140, 114, 85, 0.12); }
        .styled-scrollbar::-webkit-scrollbar-thumb { background: rgba(179, 90, 44, 0.55); border-radius: 9999px; }
        .styled-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(179, 90, 44, 0.75); }
      `}</style>
    </div>
  );
}

export default SpellSection;
