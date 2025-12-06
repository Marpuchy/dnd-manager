// src/app/campaigns/[id]/player/CharacterView.tsx
import {
    Character,
    Details,
    Stats,
    Tab,
    parseSpellLines,
    getPreparedSpellsInfo,
    getClassMagicExtras,
    countPreparedSpells,
    prettyClassLabel,
} from "./playerShared";
import { sumArmorBonus } from "@/lib/dndMath";
import { getSpellSlotsFor } from "@/lib/spellSlots";
import { InfoBox } from "./ui/InfoBox";
import { StatDisplay } from "./ui/StatDisplay";
import { LearnedSpellLevelBlock } from "./LearnedSpellBlocks";

type CharacterViewProps = {
    character: Character;
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    onDetailsChange?: (details: Details) => void;
    onOpenSpellManager: () => void;
};

type AbilityKey = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";

type ItemModifier = {
    ability: AbilityKey;
    modifier: number;
};

type InventoryItem = {
    name: string;
    type?: string;
    description?: string;

    // Soporte "legacy": un solo modificador
    ability?: AbilityKey;
    modifier?: number;

    // Nuevo: varios modificadores
    modifiers?: ItemModifier[];
};


type ParsedInventoryLine =
    | { kind: "json"; item: InventoryItem; raw: string }
    | { kind: "text"; raw: string };

function parseInventoryLineForView(line: string): ParsedInventoryLine {
    const trimmed = line.trim();

    if (!trimmed.startsWith("{")) {
        return { kind: "text", raw: trimmed };
    }

    try {
        const parsed = JSON.parse(trimmed) as InventoryItem;
        if (!parsed || typeof parsed !== "object" || !parsed.name) {
            return { kind: "text", raw: trimmed };
        }
        return { kind: "json", item: parsed, raw: trimmed };
    } catch {
        return { kind: "text", raw: trimmed };
    }
}

function accumulateBonus(
    bonuses: Record<AbilityKey, number>,
    ability: AbilityKey | undefined,
    value: unknown
) {
    if (!ability) return;
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) return;
    bonuses[ability] += num;
}

function getAbilityBonusesFromDetails(details: Details): Record<AbilityKey, number> {
    const bonuses: Record<AbilityKey, number> = {
        STR: 0,
        DEX: 0,
        CON: 0,
        INT: 0,
        WIS: 0,
        CHA: 0,
    };

    // 1) Inventario / equipamiento / armas extra (líneas JSON)
    const textSources = [details.inventory, details.equipment, details.weaponsExtra];

    for (const source of textSources) {
        if (!source) continue;

        const lines = source
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);

        for (const line of lines) {
            const entry = parseInventoryLineForView(line);
            if (entry.kind !== "json") continue;

            const { item } = entry;

            // Formato legacy: ability + modifier
            if (item.ability && typeof item.modifier === "number") {
                accumulateBonus(bonuses, item.ability, item.modifier);
            }

            // Nuevo formato: modifiers[]
            if (Array.isArray(item.modifiers)) {
                for (const mod of item.modifiers) {
                    if (!mod) continue;
                    accumulateBonus(
                        bonuses,
                        mod.ability as AbilityKey | undefined,
                        mod.modifier
                    );
                }
            }
        }
    }

    // 2) Armaduras (details.armors)
    if (Array.isArray(details.armors)) {
        for (const armor of details.armors as any[]) {
            if (!armor) continue;

            // Si guardas un solo modificador
            if (armor.statAbility) {
                accumulateBonus(
                    bonuses,
                    armor.statAbility as AbilityKey | undefined,
                    armor.statModifier
                );
            }

            // Por si usas ability/modifier también en armors
            if (armor.ability && typeof armor.modifier === "number") {
                accumulateBonus(
                    bonuses,
                    armor.ability as AbilityKey | undefined,
                    armor.modifier
                );
            }

            // Si la armadura tiene varios modificadores
            if (Array.isArray(armor.modifiers)) {
                for (const mod of armor.modifiers as any[]) {
                    if (!mod) continue;
                    accumulateBonus(
                        bonuses,
                        mod.ability as AbilityKey | undefined,
                        mod.modifier
                    );
                }
            }
        }
    }

    // 3) Arma principal (details.weaponEquipped)
    const w = (details as any).weaponEquipped;
    if (w) {
        // Un solo modificador tipo statAbility/statModifier
        if (w.statAbility) {
            accumulateBonus(
                bonuses,
                w.statAbility as AbilityKey | undefined,
                w.statModifier
            );
        }

        // Por si usas ability/modifier en weaponEquipped
        if (w.ability && typeof w.modifier === "number") {
            accumulateBonus(
                bonuses,
                w.ability as AbilityKey | undefined,
                w.modifier
            );
        }

        // Varios modificadores en el arma
        if (Array.isArray(w.modifiers)) {
            for (const mod of w.modifiers as any[]) {
                if (!mod) continue;
                accumulateBonus(
                    bonuses,
                    mod.ability as AbilityKey | undefined,
                    mod.modifier
                );
            }
        }
    }

    return bonuses;
}


function renderInventorySection(label: string, rawText?: string | null) {
    const text = rawText ?? "";
    const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    if (lines.length === 0) {
        return (
            <p className="text-xs text-zinc-500">
                No se ha registrado información en esta sección.
            </p>
        );
    }

    const parsed = lines.map(parseInventoryLineForView);
    const hasJson = parsed.some((p) => p.kind === "json");

    if (!hasJson) {
        // Datos antiguos en texto plano
        return (
            <pre className="whitespace-pre-wrap text-sm text-zinc-300">
        {text}
      </pre>
        );
    }

    return (
        <ul className="space-y-1 text-sm text-zinc-200">
            {parsed.map((entry, index) => {
                if (entry.kind === "text") {
                    return (
                        <li
                            key={index}
                            className="rounded-md bg-zinc-900 px-2 py-1 border border-zinc-700"
                        >
                            <span className="text-xs break-words">{entry.raw}</span>
                        </li>
                    );
                }

                const { item } = entry;

// Un solo modificador (legacy)
                const simpleModifierLabel =
                    item.ability && typeof item.modifier === "number"
                        ? `${item.ability} ${
                            item.modifier >= 0 ? `+${item.modifier}` : item.modifier
                        }`
                        : null;

// Varios modificadores (nuevo formato)
                const multiLabels: string[] = Array.isArray(item.modifiers)
                    ? item.modifiers
                        .filter((m) => m && m.ability && typeof m.modifier === "number")
                        .map(
                            (m) =>
                                `${m.ability} ${
                                    m.modifier >= 0 ? `+${m.modifier}` : m.modifier
                                }`
                        )
                    : [];

                return (
                    <li
                        key={index}
                        className="rounded-md bg-zinc-900 px-2 py-2 border border-zinc-700"
                    >
                        <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold break-words">
                {item.name}
            </span>
                            {item.type && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-600 text-zinc-300">
                    {item.type}
                </span>
                            )}

                            {simpleModifierLabel && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-600 text-emerald-300">
                    {simpleModifierLabel}
                </span>
                            )}

                            {multiLabels.map((label, i) => (
                                <span
                                    key={i}
                                    className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-600 text-emerald-300"
                                >
                    {label}
                </span>
                            ))}
                        </div>
                        {item.description && (
                            <p className="text-[11px] text-zinc-400 whitespace-pre-wrap mt-1">
                                {item.description}
                            </p>
                        )}
                    </li>
                );

            })}
        </ul>
    );
}

export function CharacterView({
                                  character,
                                  activeTab,
                                  onTabChange,
                                  onDetailsChange,
                                  onOpenSpellManager,
                              }: CharacterViewProps) {
    const stats: Stats =
        character.stats ??
        ({
            str: 10,
            dex: 10,
            con: 10,
            int: 10,
            wis: 10,
            cha: 10,
        } as Stats);

    const details: Details = character.details || {};
    const armors = Array.isArray(details.armors) ? details.armors : [];
    const armorBonus = sumArmorBonus(armors);
    const baseAC = character.armor_class ?? 10;
    const totalAC = baseAC + armorBonus;

    const spells = details.spells || {};
    const inventoryText = details.inventory ?? "";
    const equipmentText = details.equipment ?? "";
    const weaponsExtraText = details.weaponsExtra ?? "";
    const notesText = details.notes ?? "";
    const featsText = details.abilities ?? "";

    const preparedInfo = getPreparedSpellsInfo(
        character.class,
        stats,
        character.level,
        details
    );
    const preparedCount = countPreparedSpells(spells);

    const extras = getClassMagicExtras(character.class, character.level);

    const classLabel =
        character.class === "custom" && details.customClassName
            ? details.customClassName
            : prettyClassLabel(character.class);

    const spellSlots =
        character.class && character.level
            ? getSpellSlotsFor(character.class, character.level)
            : null;

    const abilityBonuses = getAbilityBonusesFromDetails(details);

    const totalStr = (stats.str ?? 10) + (abilityBonuses.STR ?? 0);
    const totalDex = (stats.dex ?? 10) + (abilityBonuses.DEX ?? 0);
    const totalCon = (stats.con ?? 10) + (abilityBonuses.CON ?? 0);
    const totalInt = (stats.int ?? 10) + (abilityBonuses.INT ?? 0);
    const totalWis = (stats.wis ?? 10) + (abilityBonuses.WIS ?? 0);
    const totalCha = (stats.cha ?? 10) + (abilityBonuses.CHA ?? 0);

    return (
        <div className="space-y-4">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-purple-300">
                        {character.name}
                    </h2>
                    <p className="text-sm text-zinc-500">
                        {character.race || "Sin raza"} · {classLabel} · Nivel{" "}
                        {character.level ?? "?"}
                    </p>
                </div>
                <div className="text-right text-sm text-zinc-400">
                    <p>XP: {character.experience ?? 0}</p>
                    <p>
                        HP: {character.current_hp ?? character.max_hp ?? "?"}/
                        {character.max_hp ?? "?"}
                    </p>
                </div>
            </header>

            {/* Tabs */}
            <div className="border-b border-zinc-800 flex gap-4 text-sm">
                <button
                    className={`pb-2 ${
                        activeTab === "stats"
                            ? "text-purple-300 border-b-2 border-purple-500"
                            : "text-zinc-500 hover:text-zinc-300"
                    }`}
                    onClick={() => onTabChange("stats")}
                >
                    Estadísticas
                </button>
                <button
                    className={`pb-2 ${
                        activeTab === "spells"
                            ? "text-purple-300 border-b-2 border-purple-500"
                            : "text-zinc-500 hover:text-zinc-300"
                    }`}
                    onClick={() => onTabChange("spells")}
                >
                    Habilidades
                </button>
                <button
                    className={`pb-2 ${
                        activeTab === "inventory"
                            ? "text-purple-300 border-b-2 border-purple-500"
                            : "text-zinc-500 hover:text-zinc-300"
                    }`}
                    onClick={() => onTabChange("inventory")}
                >
                    Inventario
                </button>
            </div>

            {/* TAB: ESTADÍSTICAS */}
            {activeTab === "stats" && (
                <div className="space-y-4">
                    {/* Vida, CA, Velocidad */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <InfoBox
                            label="Vida"
                            value={`${
                                character.current_hp ?? character.max_hp ?? "?"
                            }/${character.max_hp ?? "?"}`}
                        />
                        <InfoBox
                            label="Clase de armadura (CA total)"
                            value={totalAC}
                            sub={`Base ${baseAC} + armaduras (${
                                armorBonus >= 0 ? `+${armorBonus}` : armorBonus
                            })`}
                        />
                        <InfoBox
                            label="Velocidad"
                            value={`${character.speed ?? 30} ft`}
                        />
                    </div>

                    {/* Stats (con modificadores de objetos) */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-zinc-300">
                            Atributos (stats) con modificadores de equipo
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                            <StatDisplay label="FUE" value={totalStr} />
                            <StatDisplay label="DES" value={totalDex} />
                            <StatDisplay label="CON" value={totalCon} />
                            <StatDisplay label="INT" value={totalInt} />
                            <StatDisplay label="SAB" value={totalWis} />
                            <StatDisplay label="CAR" value={totalCha} />
                        </div>
                        <p className="text-[11px] text-zinc-500">
                            Los modificadores procedentes de objetos del inventario,
                            equipamiento y armas adicionales se aplican a estas
                            estadísticas.
                        </p>
                    </div>

                    {/* Armaduras / Arma equipada */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Armaduras */}
                        <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                            <h3 className="text-sm font-semibold text-zinc-200">
                                Armaduras
                            </h3>
                            {armors.length === 0 ? (
                                <p className="text-xs text-zinc-500">
                                    No tienes armaduras registradas.
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {armors.map((armor: any, index: number) => (
                                        <li key={index} className="text-sm text-zinc-300">
                                            <span className="font-medium">{armor.name}</span>{" "}
                                            {armor.bonus !== 0 && (
                                                <span className="text-xs text-zinc-500">
                          (CA{" "}
                                                    {armor.bonus >= 0
                                                        ? `+${armor.bonus}`
                                                        : armor.bonus}
                                                    )
                        </span>
                                            )}
                                            {armor.ability && (
                                                <div className="text-xs text-zinc-400">
                                                    Habilidad: {armor.ability}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Arma equipada */}
                        <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                            <h3 className="text-sm font-semibold text-zinc-200">
                                Arma equipada
                            </h3>
                            {details.weaponEquipped ? (
                                <div className="space-y-2">
                                    <div className="space-y-1">
                                        <p className="text-sm text-zinc-300 font-medium">
                                            {details.weaponEquipped.name}
                                        </p>
                                        {details.weaponEquipped.damage && (
                                            <p className="text-xs text-zinc-400">
                                                Daño: {details.weaponEquipped.damage}
                                            </p>
                                        )}
                                        {details.weaponEquipped.description && (
                                            <p className="text-xs text-zinc-500 whitespace-pre-wrap">
                                                {details.weaponEquipped.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Chips de modificadores de característica */}
                                    {(() => {
                                        const mods: { ability: string; value: number }[] = [];

                                        const w: any = details.weaponEquipped;

                                        // statAbility/statModifier
                                        if (w?.statAbility && typeof w?.statModifier !== "undefined") {
                                            const n = Number(w.statModifier);
                                            if (!Number.isNaN(n)) {
                                                mods.push({ ability: w.statAbility, value: n });
                                            }
                                        }

                                        // ability/modifier (legacy)
                                        if (w?.ability && typeof w?.modifier === "number") {
                                            mods.push({ ability: w.ability, value: w.modifier });
                                        }

                                        // modifiers[]
                                        if (Array.isArray(w?.modifiers)) {
                                            for (const m of w.modifiers as any[]) {
                                                if (!m?.ability) continue;
                                                const n = Number(m.modifier);
                                                if (Number.isNaN(n)) continue;
                                                mods.push({ ability: m.ability, value: n });
                                            }
                                        }

                                        if (mods.length === 0) return null;

                                        return (
                                            <div className="flex flex-wrap gap-2">
                                                {mods.map((m, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-600 text-emerald-300"
                                                    >
                                {m.ability}{" "}
                                                        {m.value >= 0 ? `+${m.value}` : m.value}
                            </span>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            ) : (
                                <p className="text-sm text-zinc-500">Sin arma equipada</p>
                            )}
                        </div>

                    </div>

                    {/* Spell slots y Dotes/Rasgos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Spell slots */}
                        <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                            <h3 className="text-sm font-semibold text-zinc-200">
                                Espacios de conjuro
                            </h3>
                            {!spellSlots ? (
                                <p className="text-xs text-zinc-500">
                                    Esta clase/nivel no tiene espacios de conjuro estándar.
                                </p>
                            ) : "slots" in spellSlots ? (
                                <p className="text-xs text-zinc-300">
                                    Brujo: {spellSlots.slots} espacios de pacto · Nivel de
                                    espacio: {spellSlots.slotLevel}
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
                                    {Object.entries(spellSlots)
                                        .filter(
                                            ([lvl, num]) =>
                                                Number(lvl) > 0 && (num as number) > 0
                                        )
                                        .map(([lvl, num]) => (
                                            <span
                                                key={lvl}
                                                className="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-700"
                                            >
                        Nivel {lvl}: {num}
                      </span>
                                        ))}
                                </div>
                            )}
                        </div>

                        {/* Dotes / rasgos */}
                        <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                            <h3 className="text-sm font-semibold text-zinc-200">
                                Dotes y rasgos
                            </h3>
                            {featsText ? (
                                <pre className="whitespace-pre-wrap text-sm text-zinc-300">
                  {featsText}
                </pre>
                            ) : (
                                <p className="text-xs text-zinc-500">
                                    No se han registrado dotes o rasgos.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: HABILIDADES */}
            {activeTab === "spells" && (
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-200">
                        Habilidades y conjuros conocidos / preparados
                    </h3>

                    {/* Límite de conjuros preparados */}
                    {preparedInfo && (
                        <div className="border border-zinc-800 rounded-lg p-3">
                            <h4 className="text-xs font-semibold text-zinc-300 mb-1">
                                Conjuros preparados de nivel 1+ (límite 5e)
                            </h4>
                            <p className="text-xs text-zinc-300">
                                Característica clave: {preparedInfo.abilityName}. Puedes
                                tener{" "}
                                <span className="font-semibold">
                  {preparedInfo.total}
                </span>{" "}
                                conjuros de nivel 1 o superior preparados a la vez (los
                                trucos no cuentan).
                            </p>
                            <p className="text-[11px] text-zinc-400 mt-1">
                                Actualmente preparados (nivel 1+):{" "}
                                <span
                                    className={
                                        preparedCount > preparedInfo.total
                                            ? "text-red-400 font-semibold"
                                            : "text-emerald-400 font-semibold"
                                    }
                                >
                  {preparedCount}/{preparedInfo.total}
                </span>
                            </p>
                        </div>
                    )}

                    {/* Extras de clase */}
                    {extras && (
                        <div className="border border-zinc-800 rounded-lg p-3">
                            <h4 className="text-xs font-semibold text-zinc-300 mb-1">
                                {extras.title}
                            </h4>
                            <ul className="text-xs text-zinc-300 list-disc list-inside space-y-1">
                                {extras.lines.map((line, i) => (
                                    <li key={i}>{line}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Conjuros por nivel */}
                    {[
                        { level: 0, label: "Trucos (nivel 0)", text: spells.level0 },
                        { level: 1, label: "Conjuros de nivel 1", text: spells.level1 },
                        { level: 2, label: "Conjuros de nivel 2", text: spells.level2 },
                        { level: 3, label: "Conjuros de nivel 3", text: spells.level3 },
                        { level: 4, label: "Conjuros de nivel 4", text: spells.level4 },
                        { level: 5, label: "Conjuros de nivel 5", text: spells.level5 },
                        { level: 6, label: "Conjuros de nivel 6", text: spells.level6 },
                        { level: 7, label: "Conjuros de nivel 7", text: spells.level7 },
                        { level: 8, label: "Conjuros de nivel 8", text: spells.level8 },
                        { level: 9, label: "Conjuros de nivel 9", text: spells.level9 },
                    ].map(({ level, label, text }) => {
                        const lines = parseSpellLines(text);
                        if (lines.length === 0) return null;
                        return (
                            <LearnedSpellLevelBlock
                                key={level}
                                level={level}
                                label={label}
                                lines={lines}
                                spellDetails={details.spellDetails}
                            />
                        );
                    })}

                    {/* Gestor de habilidades */}
                    <div className="border border-zinc-800 rounded-lg p-3 mt-2 flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-zinc-200">
                                Gestor de habilidades (SRD)
                            </h3>
                            {preparedInfo && (
                                <p className="text-[11px] text-zinc-400">
                                    Conjuros preparados nivel 1+: {preparedCount}/
                                    {preparedInfo.total}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onOpenSpellManager}
                            className="text-xs px-3 py-2 rounded-md border border-purple-600/70 hover:bg-purple-900/40"
                        >
                            Abrir gestor en pantalla completa
                        </button>
                    </div>
                </div>
            )}

            {/* TAB: INVENTARIO */}
            {activeTab === "inventory" && (
                <div className="space-y-4">
                    <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                        <h3 className="text-sm font-semibold text-zinc-200">
                            Inventario / Mochila
                        </h3>
                        {renderInventorySection("Inventario", inventoryText)}
                    </div>

                    <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                        <h3 className="text-sm font-semibold text-zinc-200">
                            Equipamiento adicional
                        </h3>
                        {renderInventorySection("Equipamiento", equipmentText)}
                    </div>

                    <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                        <h3 className="text-sm font-semibold text-zinc-200">
                            Armas adicionales
                        </h3>
                        {renderInventorySection("Armas adicionales", weaponsExtraText)}
                    </div>

                    <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                        <h3 className="text-sm font-semibold text-zinc-200">
                            Notas del personaje
                        </h3>
                        {notesText ? (
                            <pre className="whitespace-pre-wrap text-sm text-zinc-300">
                {notesText}
              </pre>
                        ) : (
                            <p className="text-xs text-zinc-500">No hay notas guardadas.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CharacterView;
