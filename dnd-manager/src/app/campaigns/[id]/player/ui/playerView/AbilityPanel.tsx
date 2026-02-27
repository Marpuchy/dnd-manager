"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    Character,
    Details,
    Stats,
    SpellMeta,
    Spells,
    LearnedSpellRef,
    migrateOldSpells,
    countPreparedSpells,
} from "../../playerShared";

import { getPreparedSpellsInfo } from "../../playerShared";
import { getClassMagicExtras } from "../../playerShared";
import {
    getClassAbilityTimeline,
    getClassSubclasses,
} from "@/lib/dnd/classAbilities";
import { ClassAbility } from "@/lib/dnd/classAbilities/types";
import { useClientLocale } from "@/lib/i18n/useClientLocale";
import { getLocalizedText, normalizeLocalizedText } from "@/lib/character/items";
import { tr } from "@/lib/i18n/translate";
import {
    findClientSpellByName,
    getClientSpellByIndex,
} from "@/lib/dnd/clientLocalData";

import AbilityPanelView from "../../sections/AbilityPanelView";
import type { CustomFeatureEntry, CustomSpellEntry } from "@/lib/types/dnd";

/* ---------------------------
   Props
--------------------------- */
type Props = {
    character: Character;
    stats: Stats;
    details: Details;
    onDetailsChange?: (d: Details) => void;
    onOpenSpellManager: () => void;
    viewMode?: "full" | "classOnly" | "spellsOnly";
};

const CUSTOM_SPELL_PREFIX = "custom-spell:";
const CUSTOM_CLASS_ABILITY_PREFIX = "custom-classAbility:";
const CUSTOM_TRAIT_PREFIX = "custom-trait:";
const CLASS_TIMELINE_ACTION_PREFIX = "timeline-class-action:";

function clampSpellLevel(value: number | undefined): number {
    const parsed = Number(value ?? 0);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.min(9, Math.floor(parsed)));
}

function customSpellIndex(id: string): string {
    return `${CUSTOM_SPELL_PREFIX}${id}`;
}

function normalizeActionText(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function detectActionTypeFromText(
    raw: string | null | undefined
): CustomFeatureEntry["actionType"] | undefined {
    if (!raw || typeof raw !== "string") return undefined;
    const text = normalizeActionText(raw);
    if (!text) return undefined;

    const candidates: Array<{
        type: NonNullable<CustomFeatureEntry["actionType"]>;
        regex: RegExp;
    }> = [
        {
            type: "bonus",
            regex: /(accion adicional|accion bonus|bonus action)/,
        },
        {
            type: "reaction",
            regex: /(reaccion|reaction)/,
        },
        {
            type: "action",
            regex: /(como una? accion(?! adicional| bonus)|como accion magica|as a magic action|as an action|you can use your action to|puedes usar tu accion para|usa tu accion para|utiliza tu accion para|when you hit a creature with|cuando golpeas a una criatura con)/,
        },
        {
            type: "passive",
            regex: /(pasiva|passive)/,
        },
    ];

    let bestMatch:
        | { index: number; type: NonNullable<CustomFeatureEntry["actionType"]> }
        | undefined;
    for (const candidate of candidates) {
        const index = text.search(candidate.regex);
        if (index < 0) continue;
        if (!bestMatch || index < bestMatch.index) {
            bestMatch = { index, type: candidate.type };
        }
    }
    return bestMatch?.type;
}

function inferActionTypeFromNameOrId(
    ability: ClassAbility
): CustomFeatureEntry["actionType"] | undefined {
    const normalizedName = normalizeActionText(ability.name);
    const normalizedId = normalizeActionText(ability.id);
    const exactMatchers: Array<{
        type: NonNullable<CustomFeatureEntry["actionType"]>;
        names: string[];
    }> = [
        {
            type: "bonus",
            names: [
                "furia",
                "rage",
                "inspiracion bardica",
                "bardic inspiration",
                "segundo aliento",
                "second wind",
                "accion astuta",
                "cunning action",
                "forma salvaje",
                "wild shape",
                "imposicion de manos",
                "lay on hands",
                "action surge",
                "oleada de accion",
            ],
        },
        {
            type: "reaction",
            names: [
                "esquiva asombrosa",
                "uncanny dodge",
                "interception",
                "riposte",
                "parry",
                "deflect",
                "desviar",
            ],
        },
        {
            type: "bonus",
            names: [
                "divine smite",
                "golpe divino",
            ],
        },
        {
            type: "action",
            names: [
                "canalizar divinidad",
                "channel divinity",
                "expulsar no muertos",
                "turn undead",
                "sentido divino",
                "divine sense",
                "toque purificador",
                "cleansing touch",
            ],
        },
    ];
    for (const matcher of exactMatchers) {
        if (matcher.names.includes(normalizedName)) {
            return matcher.type;
        }
    }

    if (normalizedId.includes("lay-on-hands")) return "bonus";
    if (normalizedId.includes("wild-shape")) return "bonus";
    if (
        normalizedId.includes("divine-smite") &&
        !normalizedId.includes("improved-divine-smite")
    ) {
        return "bonus";
    }
    if (normalizedId.includes("channel-divinity")) return "action";

    return undefined;
}

function detectClassAbilityActionType(
    ability: ClassAbility
): CustomFeatureEntry["actionType"] | undefined {
    const fromActivation = detectActionTypeFromText(ability.activation);
    if (fromActivation) return fromActivation;
    const fromDescription = detectActionTypeFromText(ability.description);
    if (fromDescription) return fromDescription;

    return inferActionTypeFromNameOrId(ability);
}

function normalizeTimelineActionName(rawName: string): string {
    const name = rawName.trim();
    if (!name) return name;
    return name.replace(
        /\s*\(([^)]*(barbarian|bard|cleric|druid|fighter|monk|paladin|ranger|rogue|sorcerer|warlock|wizard|artificer|barbaro|bardo|clerigo|druida|guerrero|monje|paladin|explorador|picaro|hechicero|brujo|mago|artificiero)[^)]*)\)\s*$/i,
        ""
    );
}

function stripTimelineDescriptionPreamble(rawText: string): string {
    const lines = rawText.split(/\r?\n/);
    const classLabels = new Set([
        "barbarian",
        "barbaro",
        "bard",
        "bardo",
        "cleric",
        "clerigo",
        "druid",
        "druida",
        "fighter",
        "guerrero",
        "monk",
        "monje",
        "paladin",
        "paladino",
        "ranger",
        "explorador",
        "rogue",
        "picaro",
        "sorcerer",
        "hechicero",
        "warlock",
        "brujo",
        "wizard",
        "mago",
        "artificer",
        "artificiero",
    ]);
    const isIgnorableHeaderLine = (line: string) => {
        const normalized = normalizeActionText(line).replace(/:$/, "");
        if (!normalized) return true;
        if (normalized === "descripcion" || normalized === "description") return true;
        return classLabels.has(normalized);
    };

    while (lines.length > 0 && isIgnorableHeaderLine(lines[0] ?? "")) {
        lines.shift();
    }
    return lines.join("\n").trim();
}

function hasMechanicalActionContent(raw: string): boolean {
    const normalized = normalizeActionText(raw);
    if (!normalized) return false;
    const patterns = [
        /\b\d+d\d+\b/i,
        /(dano|damage|hit|golpea|golpear|ataque|attack|espacio de conjuro|spell slot|gasta|expend|cura|heal|restaura|restore|inmune|immune|condicion|condition|ventaja|advantage|desventaja|disadvantage|salvacion|saving throw|alcance|range|velocidad|speed|resistencia|resistance|carga|charge|reaccion|reaction|accion|action|adicional)/i,
    ];
    return patterns.some((pattern) => pattern.test(normalized));
}

function getActionDescriptionFallback(
    ability: Pick<ClassAbility, "id" | "name">,
    locale: string
): string | null {
    const normalizedName = normalizeActionText(ability.name);
    const normalizedId = normalizeActionText(ability.id);

    if (
        normalizedName.includes("divine smite") ||
        normalizedName.includes("golpe divino") ||
        normalizedId.includes("divine-smite")
    ) {
        return tr(
            locale,
            "Acción adicional (inmediatamente tras impactar en cuerpo a cuerpo): el objetivo recibe 2d8 de daño radiante adicional; contra infernales o no muertos, +1d8. Por cada nivel de espacio de conjuro por encima de nivel 1, añade +1d8.",
            "Bonus Action (immediately after a melee hit): the target takes an extra 2d8 Radiant damage; against Fiends or Undead, add +1d8. For each spell slot level above 1, add +1d8."
        );
    }

    return null;
}

function sanitizeTimelineActionDescription(
    raw: string | null | undefined,
    ability: Pick<ClassAbility, "id" | "name">,
    locale: string
): string {
    const text =
        typeof raw === "string" ? stripTimelineDescriptionPreamble(raw.trim()) : "";
    if (!text) return "";
    const paragraphs = text
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
    if (paragraphs.length === 0) return "";

    const noisyParagraphPatterns = [
        /(obtienes? (un )?uso adicional|you gain additional use|you gain additional uses)/i,
        /(en niveles superiores|at higher levels)/i,
        /(como se muestra en la tabla|as shown in .* table)/i,
        /(por ejemplo|for example)/i,
        /(cuando alcanzas ciertos niveles|when you reach certain .* levels)/i,
        /(esta caracteristica nuevamente|you gain this feature again)/i,
        /(columna .* tabla|column .* table)/i,
        /(consulte la tabla|see .* table)/i,
    ];

    const filtered = paragraphs.filter((paragraph) => {
        const normalized = normalizeActionText(paragraph);
        if (!normalized) return false;
        const looksNoisy = noisyParagraphPatterns.some((pattern) => pattern.test(normalized));
        if (!looksNoisy) return true;
        // Si una linea "ruidosa" contiene mecanica real, la mantenemos.
        return hasMechanicalActionContent(paragraph);
    });

    const selected = filtered.length > 0 ? filtered : paragraphs.slice(0, 1);

    let concise = selected.slice(0, 3).join("\n\n");
    const fallback = getActionDescriptionFallback(ability, locale);
    if (
        fallback &&
        (!hasMechanicalActionContent(concise) ||
            /(siempre tienes preparado|you always have .* prepared)/i.test(
                normalizeActionText(concise)
            ))
    ) {
        concise = concise ? `${concise}\n\n${fallback}` : fallback;
    }
    return concise;
}

export default function AbilityPanel({
                                         character,
                                         stats,
                                         details,
                                         onDetailsChange,
                                         onOpenSpellManager,
                                         viewMode = "full",
                                     }: Props) {
    const locale = useClientLocale();
    const t = (es: string, en: string) => tr(locale, es, en);

    /* ---------------------------
       NORMALIZE SPELLS (MIGRATION)
    --------------------------- */
    const normalizedSpells: Spells = migrateOldSpells(details.spells);
    const primaryClassLevel = useMemo(() => {
        const parsed = Number(details.primaryClassLevel);
        if (Number.isFinite(parsed) && parsed >= 1) {
            return Math.floor(parsed);
        }
        return Math.max(1, Math.floor(Number(character.level) || 1));
    }, [details.primaryClassLevel, character.level]);

    const preparedInfo = getPreparedSpellsInfo(
        character.class,
        stats,
        primaryClassLevel,
        { ...details, spells: normalizedSpells },
        locale
    );

    const preparedCount = countPreparedSpells(normalizedSpells);
    const extras = getClassMagicExtras(character.class, primaryClassLevel, locale);

    const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

    const customSpells: CustomSpellEntry[] = Array.isArray(details.customSpells)
        ? details.customSpells
        : [];
    const customCantrips: CustomSpellEntry[] = Array.isArray(details.customCantrips)
        ? details.customCantrips
        : [];
    const customTraits: CustomFeatureEntry[] = Array.isArray(details.customTraits)
        ? details.customTraits
        : [];
    const customClassAbilities: CustomFeatureEntry[] = Array.isArray(
        details.customClassAbilities
    )
        ? details.customClassAbilities
        : [];
    const spellSlotModifiers = useMemo(() => {
        const next: Record<string, number> = {};
        const adjustments = Array.isArray(details.manualAdjustments)
            ? details.manualAdjustments
            : [];
        for (const adjustment of adjustments) {
            const target = String(adjustment?.target ?? "").toUpperCase();
            if (!target.startsWith("SPELL_SLOT_")) continue;
            const level = target.replace("SPELL_SLOT_", "").trim();
            const numericLevel = Number(level);
            if (!Number.isFinite(numericLevel) || numericLevel < 1 || numericLevel > 9) {
                continue;
            }
            const value = Number(adjustment?.value ?? 0);
            if (!Number.isFinite(value) || value === 0) continue;
            next[level] = (next[level] ?? 0) + value;
        }
        return next;
    }, [details.manualAdjustments]);
    const classResourceModifiers = useMemo(() => {
        const next: Record<string, number> = {};
        const adjustments = Array.isArray(details.manualAdjustments)
            ? details.manualAdjustments
            : [];
        for (const adjustment of adjustments) {
            const target = String(adjustment?.target ?? "").toUpperCase();
            if (!target.startsWith("SPELL_RESOURCE_")) continue;
            const resourceKey = target.replace("SPELL_RESOURCE_", "").trim();
            if (!resourceKey) continue;
            const value = Number(adjustment?.value ?? 0);
            if (!Number.isFinite(value) || value === 0) continue;
            next[resourceKey] = (next[resourceKey] ?? 0) + Math.floor(value);
        }
        return next;
    }, [details.manualAdjustments]);

    const customSpellEntries = useMemo(() => {
        const spells = Array.isArray(customSpells) ? customSpells : [];
        const cantrips = Array.isArray(customCantrips) ? customCantrips : [];
        return [...cantrips, ...spells].filter(
            (entry) => typeof entry?.name === "string" && entry.name.trim().length > 0
        );
    }, [customSpells, customCantrips]);

    const customSpellsByLevel = useMemo(() => {
        const byLevel = new Map<number, LearnedSpellRef[]>();
        for (const entry of customSpellEntries) {
            const level = clampSpellLevel(entry.level);
            const index = customSpellIndex(entry.id);
            const ref: LearnedSpellRef = {
                index,
                name: entry.name.trim(),
            };
            const existing = byLevel.get(level) ?? [];
            if (!existing.some((spell) => spell.index === ref.index)) {
                existing.push(ref);
                byLevel.set(level, existing);
            }
        }
        return byLevel;
    }, [customSpellEntries]);

    const spellDetailsForView = useMemo(() => {
        const merged: Record<string, SpellMeta> = { ...(details.spellDetails || {}) };

        for (const entry of customSpellEntries) {
            const index = customSpellIndex(entry.id);
            const componentList: string[] = [];
            if (entry.components?.verbal) componentList.push("V");
            if (entry.components?.somatic) componentList.push("S");
            if (entry.components?.material) componentList.push("M");
            const castingTime =
                typeof entry.castingTime === "string"
                    ? entry.castingTime
                    : entry.castingTime
                        ? `${entry.castingTime.value}${entry.castingTime.note ? ` (${entry.castingTime.note})` : ""}`
                        : undefined;

            merged[index] = {
                index,
                name: entry.name,
                level: clampSpellLevel(entry.level),
                range: entry.range,
                casting_time: castingTime,
                duration: entry.duration,
                school: entry.school,
                components: componentList.length > 0 ? componentList : undefined,
                material: entry.materials,
                concentration: entry.concentration,
                ritual: entry.ritual,
                shortDesc: entry.description,
                fullDesc: entry.description,
                isCustom: true,
            };
        }

        return merged;
    }, [details.spellDetails, customSpellEntries]);

    const actionTypeLabel: Record<string, string> = {
        action: t("Acción", "Action"),
        bonus: t("Acción bonus", "Bonus action"),
        reaction: t("Reacción", "Reaction"),
        passive: t("Pasiva", "Passive"),
    };
    const baseSubclassOptions = useMemo(
        () =>
            getClassSubclasses(character.class, undefined, locale).map((subclass) => ({
                id: subclass.id,
                name: subclass.name,
            })),
        [character.class, locale]
    );
    const customSubclassOptions = useMemo(() => {
        const currentClass = typeof character.class === "string" ? character.class : "";
        const list = Array.isArray(details.customSubclasses)
            ? details.customSubclasses
            : [];
        return list
            .filter(
                (subclass) =>
                    subclass?.classId === currentClass &&
                    typeof subclass?.id === "string" &&
                    subclass.id &&
                    typeof subclass?.name === "string" &&
                    subclass.name.trim().length > 0
            )
            .map((subclass) => ({
                id: subclass.id,
                name: subclass.name.trim(),
            }));
    }, [character.class, details.customSubclasses]);
    const subclassOptions = useMemo(() => {
        const merged = [...baseSubclassOptions];
        const existingIds = new Set(merged.map((subclass) => subclass.id));
        for (const customSubclass of customSubclassOptions) {
            if (!existingIds.has(customSubclass.id)) {
                merged.push(customSubclass);
            }
        }
        return merged;
    }, [baseSubclassOptions, customSubclassOptions]);
    const subclassNameById = useMemo(
        () => Object.fromEntries(subclassOptions.map((subclass) => [subclass.id, subclass.name])),
        [subclassOptions]
    );
    const selectedSubclassId = useMemo(() => {
        const rawId =
            typeof details.classSubclassId === "string"
                ? details.classSubclassId.trim()
                : "";
        if (rawId && subclassOptions.some((subclass) => subclass.id === rawId)) {
            return rawId;
        }

        const rawName =
            typeof details.classSubclassName === "string"
                ? details.classSubclassName.trim()
                : "";
        if (!rawName) return undefined;

        const normalizeToken = (value: string) =>
            value
                .toLowerCase()
                .trim()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

        const byName = subclassOptions.find(
            (subclass) => normalizeToken(subclass.name) === normalizeToken(rawName)
        );
        return byName?.id;
    }, [details.classSubclassId, details.classSubclassName, subclassOptions]);
    const classContexts = useMemo(() => {
        const contexts: {
            key: string;
            classId: string;
            level: number;
            subclassId?: string;
            subclassName?: string;
        }[] = [];

        const mainClassId =
            typeof character.class === "string" ? character.class.trim() : "";
        if (mainClassId && primaryClassLevel > 0) {
            const mainSubclassName =
                (selectedSubclassId
                    ? subclassNameById[selectedSubclassId]
                    : undefined) ??
                (typeof details.classSubclassName === "string" &&
                details.classSubclassName.trim().length > 0
                    ? details.classSubclassName.trim()
                    : undefined);
            contexts.push({
                key: `main:${mainClassId}`,
                classId: mainClassId,
                level: primaryClassLevel,
                subclassId: selectedSubclassId,
                subclassName: mainSubclassName,
            });
        }

        const rawMulticlass = Array.isArray(details.multiclass)
            ? details.multiclass
            : [];
        const customSubclassList = Array.isArray(details.customSubclasses)
            ? details.customSubclasses
            : [];
        const normalizeToken = (value: string) =>
            value
                .toLowerCase()
                .trim()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
        const subclassOptionsForClass = (classId: string) => {
            if (!classId) return [] as { id: string; name: string }[];
            const builtIn = getClassSubclasses(classId, undefined, locale).map(
                (subclass) => ({
                    id: subclass.id,
                    name: subclass.name,
                })
            );
            const custom = customSubclassList
                .filter(
                    (subclass) =>
                        subclass?.classId === classId &&
                        typeof subclass?.id === "string" &&
                        subclass.id.trim().length > 0 &&
                        typeof subclass?.name === "string" &&
                        subclass.name.trim().length > 0
                )
                .map((subclass) => ({
                    id: subclass.id.trim(),
                    name: subclass.name.trim(),
                }));
            const merged = [...builtIn];
            const seen = new Set(merged.map((subclass) => subclass.id));
            for (const customSubclass of custom) {
                if (!seen.has(customSubclass.id)) {
                    merged.push(customSubclass);
                    seen.add(customSubclass.id);
                }
            }
            return merged;
        };

        for (let index = 0; index < rawMulticlass.length; index += 1) {
            const entry = rawMulticlass[index];
            if (
                !entry ||
                typeof entry.classId !== "string" ||
                entry.classId.trim().length === 0 ||
                !Number.isFinite(Number(entry.level)) ||
                Number(entry.level) <= 0
            ) {
                continue;
            }
            const classId = entry.classId.trim();
            const level = Math.max(
                1,
                Math.min(20, Math.floor(Number(entry.level) || 1))
            );
            const options = subclassOptionsForClass(classId);
            const rawSubclassId =
                typeof entry.subclassId === "string" ? entry.subclassId.trim() : "";
            const rawSubclassName =
                typeof entry.subclassName === "string"
                    ? entry.subclassName.trim()
                    : "";
            const matchedById = rawSubclassId
                ? options.find((subclass) => subclass.id === rawSubclassId)
                : undefined;
            const matchedByName =
                !matchedById && rawSubclassName
                    ? options.find(
                          (subclass) =>
                              normalizeToken(subclass.name) ===
                              normalizeToken(rawSubclassName)
                      )
                    : undefined;
            const resolvedSubclass = matchedById ?? matchedByName;
            contexts.push({
                key:
                    typeof entry.id === "string" && entry.id.trim().length > 0
                        ? `multi:${entry.id}`
                        : `multi:${classId}:${index + 1}`,
                classId,
                level,
                subclassId:
                    resolvedSubclass?.id ||
                    (rawSubclassId.length > 0 ? rawSubclassId : undefined),
                subclassName:
                    resolvedSubclass?.name ||
                    (rawSubclassName.length > 0 ? rawSubclassName : undefined),
            });
        }

        return contexts;
    }, [
        character.class,
        primaryClassLevel,
        selectedSubclassId,
        details.classSubclassName,
        details.multiclass,
        details.customSubclasses,
        locale,
        subclassNameById,
    ]);
    const allSubclassOptions = useMemo(() => {
        const merged = [...subclassOptions];
        const seen = new Set(merged.map((subclass) => subclass.id));
        const classIds = Array.from(
            new Set(
                classContexts
                    .map((context) => context.classId)
                    .filter((classId) => classId.length > 0)
            )
        );
        const customSubclassList = Array.isArray(details.customSubclasses)
            ? details.customSubclasses
            : [];
        for (const classId of classIds) {
            const builtIn = getClassSubclasses(classId, undefined, locale).map(
                (subclass) => ({
                    id: subclass.id,
                    name: subclass.name,
                })
            );
            const custom = customSubclassList
                .filter(
                    (subclass) =>
                        subclass?.classId === classId &&
                        typeof subclass?.id === "string" &&
                        subclass.id.trim().length > 0 &&
                        typeof subclass?.name === "string" &&
                        subclass.name.trim().length > 0
                )
                .map((subclass) => ({
                    id: subclass.id.trim(),
                    name: subclass.name.trim(),
                }));
            for (const option of [...builtIn, ...custom]) {
                if (seen.has(option.id)) continue;
                merged.push(option);
                seen.add(option.id);
            }
        }
        return merged;
    }, [subclassOptions, classContexts, details.customSubclasses, locale]);
    const allSubclassNameById = useMemo(
        () =>
            Object.fromEntries(
                allSubclassOptions.map((subclass) => [subclass.id, subclass.name])
            ) as Record<string, string>,
        [allSubclassOptions]
    );
    const classResourceSources = useMemo(
        () =>
            classContexts
                .filter((context) => context.classId && context.level > 0)
                .map((context) => ({
                    classId: context.classId,
                    level: context.level,
                })),
        [classContexts]
    );
    const activeSubclassIds = useMemo(
        () =>
            new Set(
                classContexts
                    .map((context) => context.subclassId)
                    .filter(
                        (subclassId): subclassId is string =>
                            typeof subclassId === "string" && subclassId.length > 0
                    )
            ),
        [classContexts]
    );
    const classLevelBySubclassId = useMemo(() => {
        const next = new Map<string, number>();
        for (const context of classContexts) {
            if (!context.subclassId) continue;
            const previous = next.get(context.subclassId) ?? 0;
            if (context.level > previous) {
                next.set(context.subclassId, context.level);
            }
        }
        return next;
    }, [classContexts]);

    const classAbilityTimeline = useMemo(() => {
        const learned: ClassAbility[] = [];
        const upcoming: ClassAbility[] = [];
        for (const context of classContexts) {
            const timeline = getClassAbilityTimeline(
                context.classId,
                context.level,
                context.subclassId,
                locale
            );
            learned.push(
                ...timeline.learned.map((ability) => ({
                    ...ability,
                    id: `${context.key}:${ability.id}`,
                    class: context.classId,
                    subclassId: ability.subclassId ?? context.subclassId,
                    subclassName: ability.subclassName ?? context.subclassName,
                }))
            );
            upcoming.push(
                ...timeline.upcoming.map((ability) => ({
                    ...ability,
                    id: `${context.key}:${ability.id}`,
                    class: context.classId,
                    subclassId: ability.subclassId ?? context.subclassId,
                    subclassName: ability.subclassName ?? context.subclassName,
                }))
            );
        }
        const sortByLevelAndName = (a: ClassAbility, b: ClassAbility) => {
            if (a.level !== b.level) return a.level - b.level;
            return a.name.localeCompare(b.name);
        };
        return {
            learned: learned.sort(sortByLevelAndName),
            upcoming: upcoming.sort(sortByLevelAndName),
        };
    }, [classContexts, locale]);

    const mappedCustomClassAbilities = useMemo(
        () =>
            customClassAbilities
                // Custom actions belong to "Acciones y hechizos", not class progression.
                .filter((ability) => ability.actionType !== "action")
                .filter((ability) => {
                    if (!ability.subclassId) return true;
                    return activeSubclassIds.has(ability.subclassId);
                })
                .map((ability) => {
                    const desc = getLocalizedText(ability.description, locale);
                    const detailsLines: string[] = [];
                    const pushMarkdownField = (
                        label: string,
                        value: string | number | null | undefined
                    ) => {
                        const text = value == null ? "" : String(value).trim();
                        if (!text) return;
                        detailsLines.push(`**${label}:**\n\n${text}`);
                    };
                    if (ability.actionType) {
                        pushMarkdownField(
                            t("Tipo", "Type"),
                            actionTypeLabel[ability.actionType] ?? ability.actionType
                        );
                    }
                    if (ability.requirements) {
                        pushMarkdownField(t("Requisitos", "Requirements"), ability.requirements);
                    }
                    if (ability.effect) {
                        pushMarkdownField(t("Efecto", "Effect"), ability.effect);
                    }
                    if (ability.resourceCost) {
                        const costParts: string[] = [];
                        if (ability.resourceCost.usesSpellSlot) {
                            costParts.push(
                                t("usa espacio", "uses slot") +
                                    (ability.resourceCost.slotLevel
                                        ? ` (${t("nivel", "level")} ${ability.resourceCost.slotLevel})`
                                        : "")
                            );
                        }
                        if (ability.resourceCost.charges != null) {
                            costParts.push(
                                `${ability.resourceCost.charges} ${t(
                                    ability.resourceCost.charges === 1 ? "carga" : "cargas",
                                    ability.resourceCost.charges === 1 ? "charge" : "charges"
                                )}`
                            );
                        }
                        if (ability.resourceCost.recharge) {
                            costParts.push(
                                ability.resourceCost.recharge === "short"
                                    ? t("recarga en descanso corto", "recharges on short rest")
                                    : t("recarga en descanso largo", "recharges on long rest")
                            );
                        }
                        if (ability.resourceCost.points != null) {
                            costParts.push(
                                `${ability.resourceCost.points} ${
                                    ability.resourceCost.pointsLabel ||
                                    t("puntos", "points")
                                }`
                            );
                        }
                        if (costParts.length > 0) {
                            pushMarkdownField(t("Coste", "Cost"), costParts.join(", "));
                        }
                    }
                    pushMarkdownField(t("Descripción", "Description"), desc);

                    const level = Number.isFinite(Number(ability.level))
                        ? Number(ability.level)
                        : 0;
                    const subclassName =
                        ability.subclassName ??
                        (ability.subclassId
                            ? allSubclassNameById[ability.subclassId]
                            : undefined);

                    return {
                        id: `${CUSTOM_CLASS_ABILITY_PREFIX}${ability.id}`,
                        class: "custom",
                        name: ability.name,
                        level,
                        subclassId: ability.subclassId,
                        subclassName,
                        description: detailsLines.join("\n\n") || undefined,
                    } as ClassAbility;
                }),
        [customClassAbilities, locale, activeSubclassIds, allSubclassNameById]
    );

    const mappedCustomTraits = useMemo(
        () =>
            customTraits.map((trait) => {
                const desc = getLocalizedText(trait.description, locale);
                const level = Number.isFinite(Number(trait.level))
                    ? Number(trait.level)
                    : 0;
                return {
                    id: `${CUSTOM_TRAIT_PREFIX}${trait.id}`,
                    class: "custom",
                    name: trait.name,
                    level,
                    description: desc || undefined,
                } as ClassAbility;
            }),
        [customTraits, locale]
    );

    const classAbilities: ClassAbility[] = useMemo(() => {
        const getCurrentLevelForAbility = (ability: ClassAbility) => {
            if (
                ability.subclassId &&
                classLevelBySubclassId.has(ability.subclassId)
            ) {
                return classLevelBySubclassId.get(ability.subclassId) ?? 0;
            }
            return primaryClassLevel;
        };
        return [
            ...classAbilityTimeline.learned,
            ...mappedCustomTraits.filter((ability) => ability.level <= primaryClassLevel),
            ...mappedCustomClassAbilities.filter(
                (ability) => ability.level <= getCurrentLevelForAbility(ability)
            ),
        ].sort((a, b) => {
            if (a.level !== b.level) return a.level - b.level;
            return a.name.localeCompare(b.name);
        });
    }, [
        primaryClassLevel,
        classLevelBySubclassId,
        classAbilityTimeline.learned,
        mappedCustomClassAbilities,
        mappedCustomTraits,
    ]);

    const upcomingClassAbilities: ClassAbility[] = useMemo(() => {
        const getCurrentLevelForAbility = (ability: ClassAbility) => {
            if (
                ability.subclassId &&
                classLevelBySubclassId.has(ability.subclassId)
            ) {
                return classLevelBySubclassId.get(ability.subclassId) ?? 0;
            }
            return primaryClassLevel;
        };
        return [
            ...classAbilityTimeline.upcoming,
            ...mappedCustomTraits.filter((ability) => ability.level > primaryClassLevel),
            ...mappedCustomClassAbilities.filter(
                (ability) => ability.level > getCurrentLevelForAbility(ability)
            ),
        ].sort((a, b) => {
            if (a.level !== b.level) return a.level - b.level;
            return a.name.localeCompare(b.name);
        });
    }, [
        primaryClassLevel,
        classLevelBySubclassId,
        classAbilityTimeline.upcoming,
        mappedCustomClassAbilities,
        mappedCustomTraits,
    ]);
    const customActions = useMemo(
        () =>
            customClassAbilities
                .filter(
                    (action) =>
                        Boolean(action.actionType) &&
                        action.actionType !== "passive"
                )
                .filter((action) => {
                    if (!action.subclassId) return true;
                    return activeSubclassIds.has(action.subclassId);
                })
                .filter((action) => {
                    const requiredLevel = Number(action.level ?? 0);
                    const normalizedLevel = Number.isFinite(requiredLevel)
                        ? Math.max(0, Math.floor(requiredLevel))
                        : 0;
                    if (!action.subclassId) {
                        return true;
                    }
                    const currentSubclassLevel =
                        classLevelBySubclassId.get(action.subclassId) ?? 0;
                    return normalizedLevel <= currentSubclassLevel;
                })
                .sort((a, b) => {
                    const levelA = Number(a.level ?? 0);
                    const levelB = Number(b.level ?? 0);
                    if (levelA !== levelB) return levelA - levelB;
                    return a.name.localeCompare(b.name);
                }),
        [
            customClassAbilities,
            activeSubclassIds,
            classLevelBySubclassId,
        ]
    );
    const timelineClassActions = useMemo(
        () =>
            classAbilityTimeline.learned
                .map((ability) => {
                    const actionType = detectClassAbilityActionType(ability);
                    if (!actionType || actionType === "passive") {
                        return null;
                    }

                    const description = sanitizeTimelineActionDescription(
                        typeof ability.description === "string"
                            ? ability.description
                            : undefined,
                        ability,
                        locale
                    );
                    const activation = typeof ability.activation === "string"
                        ? ability.activation.trim()
                        : "";

                    return {
                        id: `${CLASS_TIMELINE_ACTION_PREFIX}${ability.id}`,
                        name: normalizeTimelineActionName(ability.name),
                        level: Number.isFinite(Number(ability.level))
                            ? Number(ability.level)
                            : 0,
                        actionType,
                        requirements: activation || undefined,
                        description: description
                            ? {
                                  text: description,
                                  lang: locale,
                              }
                            : undefined,
                        subclassId: ability.subclassId,
                        subclassName: ability.subclassName,
                    } as CustomFeatureEntry;
                })
                .filter((entry): entry is CustomFeatureEntry => {
                    if (!entry) return false;
                    return entry.name.trim().length > 0;
                }),
        [classAbilityTimeline.learned, locale]
    );
    const allActionsForPanel = useMemo(() => {
        const merged = [...customActions, ...timelineClassActions];
        const byId = new Map<string, CustomFeatureEntry>();
        for (const entry of merged) {
            if (!entry?.id || byId.has(entry.id)) continue;
            byId.set(entry.id, entry);
        }
        const order: Record<string, number> = {
            action: 0,
            bonus: 1,
            reaction: 2,
            passive: 3,
        };
        return Array.from(byId.values()).sort((a, b) => {
            const levelA = Number(a.level ?? 0);
            const levelB = Number(b.level ?? 0);
            if (levelA !== levelB) return levelA - levelB;
            const typeA = order[a.actionType ?? "passive"] ?? 99;
            const typeB = order[b.actionType ?? "passive"] ?? 99;
            if (typeA !== typeB) return typeA - typeB;
            return a.name.localeCompare(b.name);
        });
    }, [customActions, timelineClassActions]);

    function patchDetails(patch: Partial<Details>) {
        onDetailsChange?.({
            ...details,
            ...patch,
        });
    }

    /* ---------------------------
       LOAD SRD METADATA (BY INDEX)
       âš ï¸ FIX: CLONE SPELLS TO AVOID MUTATION
    --------------------------- */
    useEffect(() => {
        if (!details.spells) return;

        // âœ… CLONE to force new reference (React re-render)
        const spellsByLevel: Spells = structuredClone(
            migrateOldSpells(details.spells)
        );
        const refs: LearnedSpellRef[] = [];

        // 1ï¸âƒ£ Collect all spells
        Object.values(spellsByLevel).forEach((level) => {
            if (Array.isArray(level)) {
                level.forEach((s) => refs.push(s));
            }
        });

        if (!refs.length) return;

        const existing = details.spellDetails || {};
        const merged: Record<string, SpellMeta> = { ...existing };

        let changed = false;
        let indexResolved = false;

        (async () => {
            // Resolve missing indexes (legacy) using local snapshots.
            for (const spell of refs) {
                if (spell.index) continue;

                try {
                    const match = await findClientSpellByName(spell.name, locale);
                    if (match?.index) {
                        spell.index = match.index;
                        if (match.name && spell.name !== match.name) {
                            spell.name = match.name;
                        }
                        indexResolved = true;
                    }
                } catch (err) {
                    console.warn(
                        "No se pudo resolver el indice del hechizo local:",
                        spell.name,
                        err
                    );
                }
            }

            // Load local spell metadata by index.
            for (const spell of refs) {
                if (!spell.index) continue;

                const existingMeta = merged[spell.index];
                const shouldRefreshMeta = !existingMeta || locale === "es";
                if (!shouldRefreshMeta) {
                    continue;
                }

                let localSpell: any;
                try {
                    localSpell = await getClientSpellByIndex(spell.index, locale);
                    if (!localSpell) continue;
                } catch (err) {
                    console.warn("No se pudo cargar el hechizo local:", spell.index, err);
                    continue;
                }

                const shortDescSource = (
                    localSpell.shortDesc ??
                    (Array.isArray(localSpell.desc) ? localSpell.desc[0] : undefined)
                );
                const fullDescSource = (
                    localSpell.fullDesc ??
                    (Array.isArray(localSpell.desc) || Array.isArray(localSpell.higher_level)
                        ? [...(localSpell.desc ?? []), ...(localSpell.higher_level ?? [])].join(
                              "\n\n"
                          )
                        : undefined)
                );
                const mapped: SpellMeta = {
                    index: localSpell.index,
                    name: localSpell.name,
                    level: localSpell.level,
                    range: localSpell.range,
                    casting_time: localSpell.casting_time,
                    duration: localSpell.duration,
                    school: localSpell.school?.name ?? localSpell.school,
                    components: localSpell.components,
                    material: localSpell.material,
                    concentration: localSpell.concentration,
                    ritual: localSpell.ritual,

                    shortDesc: normalizeLocalizedText(shortDescSource, locale),

                    fullDesc: normalizeLocalizedText(fullDescSource, locale),
                };

                if (spell.name !== mapped.name) {
                    spell.name = mapped.name;
                    indexResolved = true;
                }

                if (
                    !existingMeta ||
                    JSON.stringify(existingMeta) !== JSON.stringify(mapped)
                ) {
                    merged[spell.index] = mapped;
                    changed = true;
                }

            }

            // Save only if something changed.
            if (changed || indexResolved) {
                onDetailsChange?.({
                    ...details,
                    spells: spellsByLevel,
                    spellDetails: merged,
                });
            }
        })();
    }, [details.spells, locale]);

    /* ---------------------------
       BUILD LEVELS FOR VIEW
    --------------------------- */
    const levels = useMemo(
        () =>
            Array.from({ length: 10 }, (_, lvl) => {
                const key = `level${lvl}` as keyof Spells;
                const value = normalizedSpells[key];
                const baseSpells = Array.isArray(value) ? value : [];
                const customLevelSpells = customSpellsByLevel.get(lvl) ?? [];
                const mergedSpells = [...baseSpells];

                for (const customSpell of customLevelSpells) {
                    if (!mergedSpells.some((spell) => spell.index === customSpell.index)) {
                        mergedSpells.push(customSpell);
                    }
                }

                return {
                    lvl,
                    label:
                        lvl === 0
                            ? tr(locale, "Trucos", "Cantrips")
                            : `${tr(locale, "Nivel", "Level")} ${lvl}`,
                    spells: mergedSpells,
                };
            }),
        [normalizedSpells, customSpellsByLevel, locale]
    );

    /* ---------------------------
       RENDER
    --------------------------- */
    return (
        <>
            <AbilityPanelView
                character={character}
                preparedInfo={preparedInfo}
                preparedCount={preparedCount}
                extras={extras}
                classAbilities={classAbilities}
                upcomingClassAbilities={upcomingClassAbilities}
                levels={levels}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                spellDetails={spellDetailsForView}
                onOpenSpellManager={onOpenSpellManager}
                locale={locale}
                customSpells={customSpells}
                setCustomSpells={(next) => patchDetails({ customSpells: next })}
                customCantrips={customCantrips}
                setCustomCantrips={(next) => patchDetails({ customCantrips: next })}
                customTraits={customTraits}
                setCustomTraits={(next) => patchDetails({ customTraits: next })}
                customClassAbilities={customClassAbilities}
                setCustomClassAbilities={(next) =>
                    patchDetails({ customClassAbilities: next })
                }
                customActions={allActionsForPanel}
                subclassOptions={allSubclassOptions}
                spellSlotsOverride={
                    details.spellSlotsOverride && typeof details.spellSlotsOverride === "object"
                        ? (details.spellSlotsOverride as Record<string, number>)
                        : null
                }
                spellSlotModifiers={spellSlotModifiers}
                classResourceModifiers={classResourceModifiers}
                classResourceSources={classResourceSources}
                viewMode={viewMode}
            />
        </>
    );
}



