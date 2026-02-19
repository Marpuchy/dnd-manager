// src/app/campaigns/[id]/player/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type FormEvent,
    type DragEvent,
    type CSSProperties,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { computeMaxHp } from "@/lib/dndMath";
import {
    Member,
    Character,
    Details,
    Stats,
    Spells,
    Mode,
    Tab,
    prettyClassLabel,
    getClassSelectionPalette,
} from "./playerShared";
import ClickableRow from "../../../components/ClickableRow";
import CharacterView from "./ui/CharacterView";
import { CharacterForm } from "./ui/CharacterForm";
import { SpellManagerPanel } from "./srd/SpellManagerPanel";
import { useCharacterForm } from "./hooks/useCharacterForm";
import { Trash2, Edit2, ChevronLeft, ChevronRight, Menu, Settings } from "lucide-react";
import AIAssistantPanel, { type AIAssistantClientContext } from "./ui/AIAssistantPanel";
import StoryPlayerView from "./ui/StoryPlayerView";
import { getSubclassName } from "@/lib/dnd/classAbilities";
import { useClientLocale } from "@/lib/i18n/useClientLocale";
import { tr } from "@/lib/i18n/translate";

type RightPanelMode = "character" | "spellManager";
type PlayerSection = "characters" | "story";

type CampaignPlayerPageProps = {
    forceDmMode?: boolean;
};

export function CampaignPlayerPage({ forceDmMode = false }: CampaignPlayerPageProps = {}) {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(false);
    const isDmMode = forceDmMode;
    const [characters, setCharacters] = useState<Character[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [mode, setMode] = useState<Mode>("view");
    const [activeTab, setActiveTab] = useState<Tab>("stats");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>("character");
    const [activeSection, setActiveSection] = useState<PlayerSection>("characters");
    const locale = useClientLocale();

    // mounted guard para evitar hydration mismatch
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // Panel personajes abierto/cerrado
    const [charsOpen, setCharsOpen] = useState<boolean>(false);
    const [isOverTrash, setIsOverTrash] = useState(false);
    const [draggedCharacterId, setDraggedCharacterId] = useState<string | null>(null);
    const [dragOverCharacterId, setDragOverCharacterId] = useState<string | null>(null);
    const [selectionPulse, setSelectionPulse] = useState(0);
    const [assistantOpen, setAssistantOpen] = useState(false);

    // Edición / creación
    const [editingId, setEditingId] = useState<string | null>(null);
    const [autoSaving, setAutoSaving] = useState(false);
    const autoSaveGuardRef = useRef(true);
    const persistInFlightRef = useRef(false);

    const { fields, resetForm, loadFromCharacter } = useCharacterForm();
    const {
        charName,
        charClass,
        classSubclassId,
        charLevel,
        race,
        experience,
        armorClass,
        speed,
        currentHp,
        hitDieSides,
        str,
        dex,
        con,
        intStat,
        wis,
        cha,
        armors,
        weaponName,
        weaponDamage,
        weaponDescription,
        weaponStatAbility,
        weaponStatModifier,
        weaponProficient: weaponProficientFlag,
        weaponEquipped: weaponEquippedFlag,
        weaponPassiveModifiers,
        inventory,
        equipment,
        abilities,
        weaponsExtra,
        notes,
        portraitNote,
        background,
        alignment,
        personalityTraits,
        ideals,
        bonds,
        flaws,
        appearance,
        backstory,
        languages,
        proficiencies,
        skillProficiencies,
        customSections,
        characterType,
        setCharacterType,
        companionOwnerId,
        customClassName,
        customCastingAbility,
        items,
        customSpells,
        customCantrips,
        customTraits,
        customClassAbilities,
        customSubclasses,
        spellsL0,
        spellsL1,
        spellsL2,
        spellsL3,
        spellsL4,
        spellsL5,
        spellsL6,
        spellsL7,
        spellsL8,
        spellsL9,
    } = fields;

    // Form fields (resumidos — los mantienes igual que antes)
    // details
    // Clase personalizada
    // Hechizos en formulario
    // --- Helper: carga personajes desde DB (reutilizable)
    async function loadCharacters(): Promise<Character[]> {
        setLoading(true);
        setError(null);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session?.user) {
                router.push("/login");
                return [];
            }

            const baseQuery = supabase
                .from("characters")
                .select(
                    "id, name, class, level, race, experience, max_hp, current_hp, armor_class, speed, stats, details, profile_image, character_type, created_at"
                )
                .eq("campaign_id", params.id);
            const query = isDmMode
                ? baseQuery
                : baseQuery.eq("user_id", session.user.id);
            const { data: chars, error: charsError } = await query;

            if (charsError) {
                console.error("Error cargando personajes:", charsError);
                setError(
                    charsError.message ??
                        (isDmMode
                            ? "No se han podido cargar los personajes de la campana."
                            : "No se han podido cargar tus personajes.")
                );
                setCharacters([]);
                return [];
            } else if (chars) {
                const list: Character[] = (chars as any[]).map((c) => ({
                    ...(c as any),
                    details: (c.details || {}) as Details,
                }));
                const sorted = [...list].sort((a, b) => {
                    const ao = typeof a.details?.listOrder === "number" ? a.details.listOrder : Number.MAX_SAFE_INTEGER;
                    const bo = typeof b.details?.listOrder === "number" ? b.details.listOrder : Number.MAX_SAFE_INTEGER;
                    if (ao !== bo) return ao - bo;
                    const at = new Date((a as any).created_at ?? 0).getTime();
                    const bt = new Date((b as any).created_at ?? 0).getTime();
                    return at - bt;
                });
                setCharacters(sorted);
                if (!selectedId && sorted.length > 0) setSelectedId(sorted[0].id);
                return sorted;
            } else {
                setCharacters([]);
                return [];
            }
        } catch (err: any) {
            console.error("loadCharacters:", err);
            setError(err?.message ?? "Error cargando personajes.");
            setCharacters([]);
            return [];
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        async function checkAccessAndInit() {
            setLoading(true);
            setError(null);

            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session?.user) {
                router.push("/login");
                return;
            }

            const { data: membership, error: membershipError } = await supabase
                .from("campaign_members")
                .select("role")
                .eq("user_id", session.user.id)
                .eq("campaign_id", params.id)
                .maybeSingle<Member>();

            if (membershipError || !membership) {
                router.push("/campaigns");
                return;
            }

            if (forceDmMode && membership.role !== "DM") {
                router.push("/campaigns");
                return;
            }

            setAllowed(true);
            await loadCharacters();
        }

        checkAccessAndInit();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id, router, forceDmMode]);


    function startCreate(type: "character" | "companion" = "character") {
        autoSaveGuardRef.current = true;
        resetForm();
        setCharacterType?.(type);
        setEditingId(null);
        setActiveSection("characters");
        setMode("create");
        setActiveTab("stats");
        setRightPanelMode("character");
        if (typeof window !== "undefined" && window.innerWidth < 768) {
            setCharsOpen(false);
        }
    }

    function startEdit(char: Character) {
        autoSaveGuardRef.current = true;
        setEditingId(char.id);
        setActiveSection("characters");
        setMode("edit");
        setActiveTab("stats");
        setRightPanelMode("character");
        loadFromCharacter(char);
        if (typeof window !== "undefined" && window.innerWidth < 768) {
            setCharsOpen(false);
        }

    }

    function cancelEditOrCreate() {
        autoSaveGuardRef.current = true;
        setMode("view");
        setEditingId(null);
    }

    function selectCharacter(id: string) {
        setSelectionPulse((value) => value + 1);
        setSelectedId(id);
        setActiveSection("characters");
        setMode("view");
        setRightPanelMode("character");
        if (typeof window !== "undefined" && window.innerWidth < 768) {
            setCharsOpen(false);
        }
    }

    type PersistOptions = {
        closeAfterSave: boolean;
        fromAutoSave?: boolean;
    };

    async function persistCharacter({
        closeAfterSave,
        fromAutoSave = false,
    }: PersistOptions) {
        if (persistInFlightRef.current && fromAutoSave) return;
        persistInFlightRef.current = true;
        if (fromAutoSave) setAutoSaving(true);
        if (!fromAutoSave) setError(null);

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session?.user) {
                throw new Error("No hay sesión activa.");
            }

            if (!charName.trim()) {
                if (fromAutoSave) return;
                throw new Error("Tu personaje necesita un nombre.");
            }

            const stats: Stats = {
                str,
                dex,
                con,
                int: intStat,
                wis,
                cha,
            };

            const computedMaxHp = computeMaxHp(charLevel, con, hitDieSides);
            const spells: Spells = {
                level0: spellsL0.trim() || undefined,
                level1: spellsL1.trim() || undefined,
                level2: spellsL2.trim() || undefined,
                level3: spellsL3.trim() || undefined,
                level4: spellsL4.trim() || undefined,
                level5: spellsL5.trim() || undefined,
                level6: spellsL6.trim() || undefined,
                level7: spellsL7.trim() || undefined,
                level8: spellsL8.trim() || undefined,
                level9: spellsL9.trim() || undefined,
            };
            const resolvedSubclassId = (classSubclassId ?? "").trim() || undefined;
            const customSubclassList = Array.isArray(customSubclasses)
                ? customSubclasses
                : [];
            const resolvedCustomSubclass = resolvedSubclassId
                ? customSubclassList.find((subclass) => subclass.id === resolvedSubclassId)
                : undefined;
            const resolvedSubclassName = resolvedSubclassId
                ? getSubclassName(charClass, resolvedSubclassId, locale) ??
                  resolvedCustomSubclass?.name ??
                  undefined
                : undefined;
            const weaponPassiveMods = Array.isArray(weaponPassiveModifiers)
                ? weaponPassiveModifiers
                : [];

            const orderedItems = Array.isArray(items)
                ? items.map((item, index) => ({ ...item, sortOrder: index }))
                : [];
            const legacyCompanion =
                mode === "edit" ? selectedChar?.details?.companion : undefined;
            const listOrder =
                mode === "edit"
                    ? selectedChar?.details?.listOrder
                    : characters.length;
            const detailsObj: Details = {
                abilities: abilities.trim() || undefined,
                notes: notes.trim() || undefined,
                portraitNote: portraitNote?.trim() || undefined,
                listOrder: typeof listOrder === "number" ? listOrder : undefined,
                armors: Array.isArray(armors)
                    ? armors.map((armor) => ({
                        name: armor.name ?? "",
                        bonus: Number(armor.bonus ?? 0),
                        ability: armor.ability ?? null,
                        statAbility: armor.statAbility ?? null,
                        statModifier: armor.statModifier ?? null,
                        modifiers: armor.modifiers ?? undefined,
                    }))
                    : [],
                weaponEquipped:
                    weaponName.trim() ||
                    weaponDamage.trim() ||
                    weaponDescription.trim() ||
                    weaponStatAbility !== "none" ||
                    weaponStatModifier != null ||
                    weaponPassiveMods.length > 0
                        ? {
                            name: weaponName.trim() || "Arma",
                            damage: weaponDamage.trim() || undefined,
                            description: weaponDescription.trim() || undefined,
                            statAbility:
                                weaponStatAbility !== "none" ? weaponStatAbility : undefined,
                            statModifier: weaponStatModifier ?? undefined,
                            isProficient: !!weaponProficientFlag,
                            equipped: weaponEquippedFlag !== false,
                            modifiers:
                                weaponPassiveMods.length > 0
                                    ? weaponPassiveMods.map((mod) => ({
                                        ability: mod.ability,
                                        modifier: mod.value,
                                        note: mod.note,
                                    }))
                                    : undefined,
                        }
                        : undefined,
                background: background?.trim() || undefined,
                alignment: alignment?.trim() || undefined,
                personalityTraits: personalityTraits?.trim() || undefined,
                ideals: ideals?.trim() || undefined,
                bonds: bonds?.trim() || undefined,
                flaws: flaws?.trim() || undefined,
                appearance: appearance?.trim() || undefined,
                backstory: backstory?.trim() || undefined,
                languages: languages?.trim() || undefined,
                proficiencies: proficiencies?.trim() || undefined,
                skillProficiencies: skillProficiencies ?? undefined,
                customSections:
                    Array.isArray(customSections) && customSections.length > 0
                        ? customSections
                        : undefined,
                companion: legacyCompanion,
                hitDie: { sides: hitDieSides },
                spells,
                classSubclassId: resolvedSubclassId,
                classSubclassName: resolvedSubclassName,
                customClassName: customClassName.trim() || undefined,
                customCastingAbility,
                items: orderedItems,
                customSpells: Array.isArray(customSpells) ? customSpells : [],
                customCantrips: Array.isArray(customCantrips) ? customCantrips : [],
                customTraits: Array.isArray(customTraits) ? customTraits : [],
                customClassAbilities: Array.isArray(customClassAbilities)
                    ? customClassAbilities
                    : [],
                customSubclasses:
                    customSubclassList.length > 0 ? customSubclassList : undefined,
            };

            const resolvedCharacterType =
                mode === "edit"
                    ? selectedChar?.character_type ?? characterType ?? "character"
                    : characterType ?? "character";

            if (resolvedCharacterType === "companion" && !companionOwnerId) {
                if (fromAutoSave) return;
                throw new Error("Selecciona un dueño para el compañero.");
            }

            detailsObj.companionOwnerId =
                resolvedCharacterType === "companion"
                    ? companionOwnerId ?? null
                    : undefined;

            const payload = {
                name: charName.trim(),
                character_type: resolvedCharacterType,
                class: charClass.trim() || null,
                level: charLevel,
                race: race.trim() || null,
                experience,
                max_hp: computedMaxHp,
                current_hp: currentHp > computedMaxHp ? computedMaxHp : currentHp,
                armor_class: armorClass,
                speed,
                stats,
                details: detailsObj,
            };

            const targetId = editingId ?? null;
            if (targetId) {
                const baseUpdate = supabase
                    .from("characters")
                    .update(payload)
                    .eq("id", targetId)
                    .eq("campaign_id", params.id);
                const updateQuery = isDmMode
                    ? baseUpdate
                    : baseUpdate.eq("user_id", session.user.id);
                const { error: updateError } = await updateQuery;

                if (updateError) {
                    throw new Error(updateError.message);
                }

                setCharacters((prev) =>
                    prev.map((char) =>
                        char.id === targetId
                            ? { ...char, ...(payload as any), details: detailsObj }
                            : char
                    )
                );
            } else {
                const { data: inserted, error: insertError } = await supabase
                    .from("characters")
                    .insert({
                        ...payload,
                        campaign_id: params.id,
                        user_id: session.user.id,
                    })
                    .select(
                        "id, name, class, level, race, experience, max_hp, current_hp, armor_class, speed, stats, details, profile_image, character_type"
                    )
                    .single();

                if (insertError) {
                    throw new Error(insertError.message);
                }

                if (inserted) {
                    autoSaveGuardRef.current = true;
                    setCharacters((prev) => {
                        const exists = prev.some((char) => char.id === (inserted as any).id);
                        if (exists) return prev;
                        return [...prev, inserted as Character];
                    });
                    setSelectedId((inserted as any).id ?? null);
                    setEditingId((inserted as any).id ?? null);
                    setMode("edit");
                }
            }

            if (closeAfterSave) {
                await loadCharacters();
                setMode("view");
                setEditingId(null);
            }
        } catch (e: any) {
            console.error(e);
            if (!fromAutoSave) {
                setError(e?.message ?? "Error guardando el personaje.");
            }
        } finally {
            persistInFlightRef.current = false;
            if (fromAutoSave) setAutoSaving(false);
        }
    }

    async function handleSaveCharacter(e: FormEvent) {
        e.preventDefault();
        await persistCharacter({ closeAfterSave: true, fromAutoSave: false });
    }

    // BORRAR personaje: BORRADO REAL en la BD + recarga de la lista
    async function handleDeleteCharacter(id: string) {
        const confirmDelete = window.confirm("¿Seguro que quieres eliminar este personaje? Esta acción no se puede deshacer.");
        if (!confirmDelete) return;

        setError(null);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session?.user) {
                throw new Error("No hay sesión activa.");
            }

            const baseDelete = supabase
                .from("characters")
                .delete()
                .eq("id", id)
                .eq("campaign_id", params.id);
            const deleteQuery = isDmMode
                ? baseDelete
                : baseDelete.eq("user_id", session.user.id);
            const { error: deleteError } = await deleteQuery;

            if (deleteError) {
                console.error("Error eliminando personaje:", deleteError);
                throw new Error(deleteError.message);
            }

            // recargamos la lista desde DB para garantizar persistencia y evitar inconsistencias por RLS
            await loadCharacters();

            // limpiar selección si era el personaje borrado
            if (selectedId === id) {
                setSelectedId(null);
            }
        } catch (e: any) {
            console.error("handleDeleteCharacter:", e);
            setError(e?.message ?? "No se ha podido eliminar el personaje.");
        }
    }

    const selectedChar = characters.find((c) => c.id === selectedId) ?? null;
    const ownedCompanions = selectedChar
        ? characters.filter(
            (companion) =>
                companion.character_type === "companion" &&
                companion.details?.companionOwnerId === selectedChar.id
        )
        : [];
    const unassignedCompanions = selectedChar
        ? characters.filter(
            (companion) =>
                companion.character_type === "companion" &&
                !companion.details?.companionOwnerId
        )
        : [];
    const companionsForTabs =
        ownedCompanions.length > 0 ? ownedCompanions : unassignedCompanions;
    const showCompanionsTab = companionsForTabs.length > 0;
    const ownerOptions = characters
        .filter((c) => c.character_type !== "companion")
        .map((c) => ({ id: c.id, name: c.name }));
    const createTitle =
        characterType === "companion"
            ? tr(locale, "Nuevo compañero", "New companion")
            : tr(locale, "Nuevo personaje", "New character");
    const assistantContext: AIAssistantClientContext = useMemo(
        () => ({
            surface: isDmMode ? "dm" : "player",
            locale,
            section: activeSection === "story" ? "story-view" : "character-workspace",
            panelMode: `${mode}:${rightPanelMode}`,
            activeTab,
            selectedCharacter: selectedChar
                ? {
                      id: selectedChar.id,
                      name: selectedChar.name,
                      class: selectedChar.class,
                      race: selectedChar.race,
                      level: selectedChar.level,
                      character_type: selectedChar.character_type ?? "character",
                  }
                : undefined,
            availableActions: [
                "create-character",
                "create-companion",
                "update-stats",
                "update-character-details",
                "delete-character",
                "reorder-character-list",
            ],
            hints: [
                "use-current-selected-character-if-not-specified",
                "if-companion-require-owner-when-possible",
                "keep-changes-concrete-and-atomic",
            ],
        }),
        [activeSection, activeTab, isDmMode, locale, mode, rightPanelMode, selectedChar]
    );

    function localizedClassLabel(rawClass: string | null | undefined): string {
        const normalized = (rawClass ?? "").toLowerCase().trim();
        const labels: Record<string, { es: string; en: string }> = {
            barbarian: { es: "Barbaro", en: "Barbarian" },
            bard: { es: "Bardo", en: "Bard" },
            cleric: { es: "Clerigo", en: "Cleric" },
            druid: { es: "Druida", en: "Druid" },
            fighter: { es: "Guerrero", en: "Fighter" },
            monk: { es: "Monje", en: "Monk" },
            paladin: { es: "Paladin", en: "Paladin" },
            ranger: { es: "Explorador", en: "Ranger" },
            rogue: { es: "Picaro", en: "Rogue" },
            sorcerer: { es: "Hechicero", en: "Sorcerer" },
            warlock: { es: "Brujo", en: "Warlock" },
            wizard: { es: "Mago", en: "Wizard" },
            artificer: { es: "Artificiero", en: "Artificer" },
            custom: { es: "Clase personalizada", en: "Custom class" },
        };
        const fallback = prettyClassLabel(rawClass ?? null, locale);
        if (!normalized) return tr(locale, "Sin clase", "No class");
        return labels[normalized]?.[locale === "en" ? "en" : "es"] ?? fallback;
    }

    function classLabelWithSubclass(char: Character): string {
        const baseLabel = localizedClassLabel(char.class);
        const customSubclassName =
            char.details?.classSubclassId && Array.isArray(char.details?.customSubclasses)
                ? char.details.customSubclasses.find(
                      (subclass) => subclass.id === char.details?.classSubclassId
                  )?.name
                : undefined;
        const subclassName =
            getSubclassName(char.class, char.details?.classSubclassId ?? null, locale) ??
            customSubclassName ??
            char.details?.classSubclassName;
        return subclassName ? `${baseLabel} (${subclassName})` : baseLabel;
    }

    function characterSummary(char: Character): string {
        return `${char.race || tr(locale, "Sin raza", "No race")} · ${classLabelWithSubclass(char)} · ${tr(locale, "Nivel", "Level")} ${char.level ?? "?"}`;
    }

    function getSelectionBlobStyle(rawClass: string | null | undefined): CSSProperties {
        const palette = getClassSelectionPalette(rawClass);
        return {
            ["--selection-rgb" as string]: palette.rgb,
            backgroundColor: palette.background,
            borderColor: palette.border,
            boxShadow: `${palette.shadow}, 0 0 0 1px ${palette.ring}`,
        };
    }

    const autoSaveSignature = useMemo(
        () =>
            JSON.stringify({
                mode,
                editingId,
                charName,
                characterType,
                companionOwnerId,
                charClass,
                classSubclassId,
                charLevel,
                race,
                experience,
                armorClass,
                speed,
                currentHp,
                hitDieSides,
                str,
                dex,
                con,
                intStat,
                wis,
                cha,
                weaponName,
                weaponDamage,
                weaponDescription,
                weaponStatAbility,
                weaponStatModifier,
                weaponProficient: weaponProficientFlag,
                weaponEquipped: weaponEquippedFlag,
                weaponPassiveModifiers,
                inventory,
                equipment,
                abilities,
                weaponsExtra,
                notes,
                portraitNote,
                background,
                alignment,
                personalityTraits,
                ideals,
                bonds,
                flaws,
                appearance,
                backstory,
                languages,
                proficiencies,
                skillProficiencies,
                customSections,
                items,
                customSpells,
                customCantrips,
                customTraits,
                customClassAbilities,
                customSubclasses,
                spellsL0,
                spellsL1,
                spellsL2,
                spellsL3,
                spellsL4,
                spellsL5,
                spellsL6,
                spellsL7,
                spellsL8,
                spellsL9,
                customClassName,
                customCastingAbility,
                armors,
            }),
        [
            mode,
            editingId,
            charName,
            characterType,
            companionOwnerId,
            charClass,
            classSubclassId,
            charLevel,
            race,
            experience,
            armorClass,
            speed,
            currentHp,
            hitDieSides,
            str,
            dex,
            con,
            intStat,
            wis,
            cha,
            weaponName,
            weaponDamage,
            weaponDescription,
            weaponStatAbility,
            weaponStatModifier,
            weaponProficientFlag,
            weaponEquippedFlag,
            weaponPassiveModifiers,
            inventory,
            equipment,
            abilities,
            weaponsExtra,
            notes,
            portraitNote,
            background,
            alignment,
            personalityTraits,
            ideals,
            bonds,
            flaws,
            appearance,
            backstory,
            languages,
            proficiencies,
            skillProficiencies,
            customSections,
            items,
            customSpells,
            customCantrips,
            customTraits,
            customClassAbilities,
            customSubclasses,
            spellsL0,
            spellsL1,
            spellsL2,
            spellsL3,
            spellsL4,
            spellsL5,
            spellsL6,
            spellsL7,
            spellsL8,
            spellsL9,
            customClassName,
            customCastingAbility,
            armors,
        ]
    );

    useEffect(() => {
        if (mode !== "create" && mode !== "edit") return;
        if (!charName.trim()) return;

        if (autoSaveGuardRef.current) {
            autoSaveGuardRef.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            void persistCharacter({ closeAfterSave: false, fromAutoSave: true });
        }, 900);

        return () => clearTimeout(timeout);
    }, [autoSaveSignature]);

    if (!allowed && !loading) {
        return (
            <main className="p-6 text-sm text-ink-muted">
                {tr(
                    locale,
                    "No tienes acceso a esta campaña o no se han podido cargar los datos.",
                    "You do not have access to this campaign or data could not be loaded."
                )}
            </main>
        );
    }

    async function persistCharactersOrder(nextCharacters: Character[]) {
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session?.user) return;

            await Promise.all(
                nextCharacters.map((char, index) =>
                    (isDmMode
                        ? supabase
                              .from("characters")
                              .update({
                                  details: {
                                      ...(char.details ?? {}),
                                      listOrder: index,
                                  },
                              })
                              .eq("id", char.id)
                              .eq("campaign_id", params.id)
                        : supabase
                        .from("characters")
                        .update({
                            details: {
                                ...(char.details ?? {}),
                                listOrder: index,
                            },
                        })
                        .eq("id", char.id)
                        .eq("campaign_id", params.id)
                        .eq("user_id", session.user.id))
                )
            );
        } catch (err) {
            console.error("Error guardando orden de personajes:", err);
        }
    }

    function reorderCharacters(list: Character[], sourceId: string, targetId: string) {
        const sourceIndex = list.findIndex((ch) => ch.id === sourceId);
        const targetIndex = list.findIndex((ch) => ch.id === targetId);
        if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return list;

        const next = [...list];
        const [moved] = next.splice(sourceIndex, 1);
        next.splice(targetIndex, 0, moved);

        return next.map((char, index) => ({
            ...char,
            details: {
                ...(char.details ?? {}),
                listOrder: index,
            },
        }));
    }

    // Drag handlers para las filas -> asignados en el render del listado
    function handleDragStartCharacter(event: DragEvent, charId: string) {
        setDraggedCharacterId(charId);
        try {
            const payload = JSON.stringify({ type: "character", id: charId });
            event.dataTransfer.setData("application/x-dnd-manager-item", payload);
            event.dataTransfer.effectAllowed = "move";
        } catch {
            // ignore
        }
    }

    function handleDragOverCharacter(event: DragEvent, charId: string) {
        event.preventDefault();
        if (!draggedCharacterId || draggedCharacterId === charId) return;
        setDragOverCharacterId(charId);
        event.dataTransfer.dropEffect = "move";
    }

    function handleDropOnCharacter(event: DragEvent, targetId: string) {
        event.preventDefault();
        setDragOverCharacterId(null);

        const raw = event.dataTransfer.getData("application/x-dnd-manager-item");
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw) as { type?: string; id?: string };
            if (parsed?.type !== "character" || !parsed.id || parsed.id === targetId) return;

            setCharacters((prev) => {
                const next = reorderCharacters(prev, parsed.id as string, targetId);
                void persistCharactersOrder(next);
                return next;
            });
        } catch {
            // ignore
        } finally {
            setDraggedCharacterId(null);
        }
    }

    function handleDragEndCharacter() {
        setDraggedCharacterId(null);
        setDragOverCharacterId(null);
    }

    function handleTrashDragOver(e: DragEvent) {
        e.preventDefault();
        setIsOverTrash(true);
        e.dataTransfer.dropEffect = "move";
    }
    function handleTrashDragLeave() {
        setIsOverTrash(false);
        setDragOverCharacterId(null);
    }

    function handleTrashDrop(e: DragEvent) {
        e.preventDefault();
        setIsOverTrash(false);
        setDragOverCharacterId(null);
        setDraggedCharacterId(null);
        const raw = e.dataTransfer.getData("application/x-dnd-manager-item");
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw) as { type?: string; id?: string };
            if (parsed?.type === "character" && parsed.id) {
                const char = characters.find((c) => c.id === parsed.id);
                if (!char) return;
                const confirmDelete = window.confirm(`¿Eliminar personaje "${char.name}" arrastrándolo a la papelera? Esta acción no se puede deshacer.`);
                if (!confirmDelete) return;
                // usa la función centralizada para borrar + recargar
                handleDeleteCharacter(parsed.id);
            }
        } catch {
            // ignore
        }
    }

    // --- helpers responsive panel
    const asideTransition =
        "transition-[transform,width,background-color,box-shadow] duration-300 ease-in-out";

    // === mounted guard: si no estamos montados en cliente, devolvemos placeholder neutro
    if (!mounted) {
        return (
            <main className="relative flex min-h-[100dvh] bg-surface text-ink overflow-x-hidden">
                <aside className="hidden md:block w-72 border-r border-ring bg-panel/90 p-4 space-y-4">
                    <div className="h-8 bg-ink/5 rounded w-2/3" />
                    <div className="h-6 bg-ink/10 rounded w-1/2 mt-2" />
                </aside>

                <section className="flex-1 min-w-0 p-3 sm:p-4 md:p-6">
                    <div className="rounded-xl bg-panel/80 border border-ring p-4 h-24" />
                </section>
            </main>
        );
    }

    return (
        <main className="relative flex min-h-[100dvh] bg-surface text-ink overflow-x-hidden">
            <svg
                aria-hidden
                focusable="false"
                className="pointer-events-none absolute h-0 w-0 overflow-hidden"
            >
                <defs>
                    <filter id="player-selection-goo">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 17 -6"
                            result="goo"
                        />
                        <feBlend in="SourceGraphic" in2="goo" />
                    </filter>
                </defs>
            </svg>
            {!charsOpen && (
                <button
                    type="button"
                    onClick={() => setCharsOpen(true)}
                    className="md:hidden fixed top-3 left-3 z-50 rounded-full p-2 border border-ring bg-panel/95 shadow-sm"
                    aria-label={tr(locale, "Abrir lista de personajes", "Open character list")}
                    title={tr(locale, "Abrir lista", "Open list")}
                >
                    <Menu className="h-4 w-4 text-ink" />
                </button>
            )}

            {charsOpen && (
                <button
                    type="button"
                    onClick={() => setCharsOpen(false)}
                    className="md:hidden fixed inset-0 z-30 bg-black/25"
                    aria-label={tr(locale, "Cerrar lista de personajes", "Close character list")}
                />
            )}

            {/* PANEL personajes en la IZQUIERDA */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-ring ${asideTransition}
          w-[88vw] max-w-[330px]
          ${charsOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:inset-auto md:z-10 md:max-w-none
          md:translate-x-0 ${charsOpen ? "md:w-72" : "md:w-12"}
          rounded-r-3xl overflow-visible
          bg-panel/90 shadow-[0_18px_50px_rgba(45,29,12,0.18)]`}
                aria-hidden={!charsOpen}
            >
                <div
                    className={`flex-1 flex flex-col p-4 h-full
            ${charsOpen ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 -translate-x-2 pointer-events-none md:pointer-events-none"}
            transition-all duration-300 ease-in-out`}
                >
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-ring">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded bg-ink/5 border border-ring">
                                <Menu className="h-4 w-4 text-ink" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-ink leading-tight">
                                    {isDmMode
                                        ? tr(locale, "Personajes de campana", "Campaign characters")
                                        : tr(locale, "Tus personajes", "Your characters")}
                                </h2>
                                <p className="text-[11px] text-ink-muted mt-0.5">
                                    {isDmMode
                                        ? tr(
                                              locale,
                                              "Gestion DM: editar cualquier personaje.",
                                              "DM management: edit any character."
                                          )
                                        : tr(
                                              locale,
                                              "Gestiona tus personajes de campaña",
                                              "Manage your campaign characters"
                                          )}
                                </p>
                            </div>
                        </div>

                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                            type="button"
                            onClick={() => setActiveSection("characters")}
                            className={`w-full text-[11px] px-3 py-2 rounded-md border transition-colors ${
                                activeSection === "characters"
                                    ? "border-accent/60 bg-accent/10 text-accent-strong"
                                    : "border-ring text-ink hover:bg-ink/5"
                            }`}
                        >
                            {tr(locale, "Personajes", "Characters")}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveSection("story");
                                setMode("view");
                                setRightPanelMode("character");
                            }}
                            className={`w-full text-[11px] px-3 py-2 rounded-md border transition-colors ${
                                activeSection === "story"
                                    ? "border-accent/60 bg-accent/10 text-accent-strong"
                                    : "border-ring text-ink hover:bg-ink/5"
                            }`}
                        >
                            {tr(locale, "Historia", "Story")}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                            type="button"
                            onClick={() => startCreate("character")}
                            className="w-full text-[11px] px-3 py-2 rounded-md border border-accent/60 text-accent-strong hover:bg-accent/10 flex items-center justify-center"
                        >
                            {tr(locale, "Nuevo PJ", "New character")}
                        </button>
                        <button
                            type="button"
                            onClick={() => startCreate("companion")}
                            className="w-full text-[11px] px-3 py-2 rounded-md border border-ring text-ink hover:bg-ink/5 flex items-center justify-center"
                        >
                            {tr(locale, "Nuevo compañero", "New companion")}
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto styled-scrollbar">
                        {loading ? (
                            <p className="text-xs text-ink-muted">{tr(locale, "Cargando...", "Loading...")}</p>
                        ) : characters.length === 0 ? (
                            <p className="text-xs text-ink-muted">
                                {tr(
                                    locale,
                                    "Todavia no tienes personajes en esta campaña.",
                                    "You do not have characters in this campaign yet."
                                )}
                            </p>
                        ) : (
                            <ul className="w-full space-y-2 text-sm px-1">
                                {characters.map((ch) => {
                                    const isSelected = selectedId === ch.id;
                                    const selectedStyle = isSelected
                                        ? getSelectionBlobStyle(ch.class)
                                        : undefined;

                                    return (
                                        <li
                                            key={ch.id}
                                            className={`relative grid w-full grid-cols-[minmax(0,1fr)_36px] items-stretch gap-3 ${
                                                dragOverCharacterId === ch.id
                                                    ? "ring-2 ring-accent/45 rounded-md"
                                                    : ""
                                            }`}
                                            draggable
                                            onDragStart={(e) => handleDragStartCharacter(e, ch.id)}
                                            onDragOver={(e) => handleDragOverCharacter(e, ch.id)}
                                            onDrop={(e) => handleDropOnCharacter(e, ch.id)}
                                            onDragEnd={handleDragEndCharacter}
                                        >
                                            <div className="min-w-0">
                                                <ClickableRow
                                                    onClick={() => selectCharacter(ch.id)}
                                                    style={selectedStyle}
                                                    className={`relative isolate overflow-hidden w-full text-left px-3 py-3 rounded-md border text-xs flex flex-col gap-0.5 transition-[border-color,box-shadow,background-color] cursor-grab active:cursor-grabbing ${
                                                        isSelected
                                                            ? "border-transparent"
                                                            : "border-ring/80 bg-white/80 hover:bg-white hover:border-accent/40 hover:shadow-[0_8px_20px_rgba(45,29,12,0.12)]"
                                                    }`}
                                                >
                                                    {isSelected && selectionPulse > 0 && (
                                                        <span
                                                            key={`selection-blob-${ch.id}-${selectionPulse}`}
                                                            aria-hidden
                                                            className="pointer-events-none absolute inset-0 z-0 player-selection-blob"
                                                        >
                                                            <span className="player-selection-blob__inner">
                                                                <span className="player-selection-blob__blobs">
                                                                    <span className="player-selection-blob__blob" />
                                                                    <span className="player-selection-blob__blob" />
                                                                    <span className="player-selection-blob__blob" />
                                                                    <span className="player-selection-blob__blob" />
                                                                </span>
                                                            </span>
                                                        </span>
                                                    )}
                                                    <div className="relative z-10 flex items-center justify-between">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <p className="font-medium text-sm text-ink truncate">
                                                                    {ch.name}
                                                                </p>
                                                                {ch.character_type === "companion" && (
                                                                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-400/60 text-emerald-700 bg-emerald-50">
                                                                        {tr(
                                                                            locale,
                                                                            "Compañero",
                                                                            "Companion"
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-ink-muted truncate">
                                                                {characterSummary(ch)}
                                                            </p>
                                                        </div>

                                                        <div className="flex-shrink-0 ml-2">
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-accent/40 bg-white/70 text-ink">
                                                                {ch.level ?? "?"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </ClickableRow>
                                            </div>

                                            <div className="w-9 flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startEdit(ch);
                                                    }}
                                                    className="h-9 w-9 rounded border border-ring hover:bg-ink/5 bg-white/70 inline-flex items-center justify-center text-ink"
                                                    aria-label={`${tr(
                                                        locale,
                                                        "Editar",
                                                        "Edit"
                                                    )} ${ch.name}`}
                                                    title={tr(locale, "Editar", "Edit")}
                                                >
                                                    <Edit2 className="h-4 w-4 text-ember" />
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-ring">
                        <div
                            onDragOver={handleTrashDragOver}
                            onDragLeave={handleTrashDragLeave}
                            onDrop={handleTrashDrop}
                            className={`rounded-md p-3 border-2 flex items-center gap-3 justify-center transition-colors ${
                                isOverTrash ? "border-red-500 bg-red-500/10" : "border-red-300/60 bg-white/60"
                            }`}
                        >
                            <Trash2 className="h-5 w-5 text-red-500" />
                            <div>
                                <p className="text-sm font-medium text-red-600">
                                    {tr(locale, "Arrastra aqui para eliminar", "Drag here to delete")}
                                </p>
                                <p className="text-[11px] text-ink-muted">
                                    {tr(locale, "Suelta para eliminar el personaje arrastrado", "Release to remove the dragged character")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {!charsOpen && null}

                <button
                    type="button"
                    onClick={() => setCharsOpen((v) => !v)}
                    className={`hidden md:flex absolute top-4 z-30 rounded-full p-2 shadow-sm
            ${charsOpen ? "right-[-18px] bg-panel border border-ring hover:bg-white" : "right-0 translate-x-1/2 bg-panel border border-ring hover:bg-white"}
            transition-all duration-300 ease-in-out`}
                    aria-label={
                        charsOpen
                            ? tr(locale, "Cerrar lista de personajes", "Close character list")
                            : tr(locale, "Abrir lista de personajes", "Open character list")
                    }
                    title={
                        charsOpen
                            ? tr(locale, "Cerrar lista", "Close list")
                            : tr(locale, "Abrir lista", "Open list")
                    }
                >
                    {charsOpen ? <ChevronLeft className="h-4 w-4 text-ink" /> : <ChevronRight className="h-4 w-4 text-ink" />}
                </button>

                {charsOpen && (
                    <button
                        type="button"
                        onClick={() => setCharsOpen(false)}
                        className="md:hidden absolute top-3 right-3 rounded-full p-2 border border-ring bg-white/80"
                        aria-label={tr(locale, "Cerrar lista de personajes", "Close character list")}
                        title={tr(locale, "Cerrar lista", "Close list")}
                    >
                        <ChevronLeft className="h-4 w-4 text-ink" />
                    </button>
                )}
            </aside>

            {/* Panel derecho (contenido principal) */}
            {/* -> Aquí: dejamos header estático (no sticky) y todo el contenido se desplaza */}
            <section className="flex-1 min-w-0 p-3 pt-14 sm:p-4 sm:pt-14 md:p-6 md:pt-6 h-[100dvh] overflow-hidden flex flex-col">
                {error && (
                    <p className="text-sm text-red-700 bg-red-100 border border-red-200 rounded-md px-3 py-2 inline-block">
                        {error}
                    </p>
                )}

                <div className="min-w-0 rounded-2xl bg-panel/80 border border-ring divide-y divide-ring overflow-hidden shadow-[0_18px_50px_rgba(45,29,12,0.12)] flex flex-col h-full">
                    {/* HEADER: ahora estático (no sticky) */}
                    <div className="px-4 pt-4 pb-0 flex-shrink-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 min-w-0">
                            <div className="min-w-0">
                                <h1 className="text-lg font-semibold text-ink">
                                    {activeSection === "story"
                                        ? tr(locale, "Historia de campaña", "Campaign story")
                                        : mode === "create"
                                        ? createTitle
                                        : selectedChar?.name ?? tr(locale, "Personaje", "Character")}
                                </h1>
                                <p className="text-xs text-ink-muted mt-1 break-words">
                                    {activeSection === "story"
                                        ? tr(
                                              locale,
                                              "Explora lo que el master ha publicado desde el gestor de historia.",
                                              "Browse what the DM has published from the story manager."
                                          )
                                        : selectedChar
                                        ? characterSummary(selectedChar)
                                        : tr(
                                            locale,
                                            `Crea o selecciona un ${characterType === "companion" ? "compañero" : "personaje"}`,
                                            `Create or select a ${characterType === "companion" ? "companion" : "character"}`
                                        )}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(`/campaigns/${String(params.id)}/settings?from=player`)
                                    }
                                    className="settings-nav-button inline-flex items-center gap-2 rounded-md border border-ring bg-white/70 px-3 py-1.5 text-[11px] text-ink hover:bg-white"
                                    aria-label={tr(locale, "Abrir ajustes", "Open settings")}
                                    title={tr(locale, "Ajustes", "Settings")}
                                >
                                    <Settings className="settings-button-icon h-3.5 w-3.5 text-ink" />
                                    <span className="hidden sm:inline">{tr(locale, "Ajustes", "Settings")}</span>
                                </button>
                                {activeSection === "characters" && (mode === "create" || mode === "edit") && (
                                    <span className="text-[11px] text-ink-muted">
                                        {autoSaving
                                            ? tr(locale, "Guardado automatico...", "Auto-saving...")
                                            : tr(locale, "Guardado automatico activo", "Auto-save active")}
                                    </span>
                                )}
                            </div>
                        </div>

                        {activeSection === "characters" &&
                            rightPanelMode === "character" &&
                            mode === "view" &&
                            selectedChar && (
                            <div className="mt-4 -mx-4 px-4 pt-4 border-t border-ring/70 bg-panel/95">
                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 text-sm sm:overflow-x-auto sm:whitespace-nowrap styled-scrollbar pb-0">
                                    <button
                                        onClick={() => setActiveTab("stats")}
                                        className={`pt-2 pb-0 border-b-2 transition-colors ${
                                            activeTab === "stats"
                                                ? "border-accent text-ink"
                                                : "border-transparent text-ink-muted hover:text-ink"
                                        }`}
                                    >
                                        {tr(locale, "Hoja", "Sheet")}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("spells")}
                                        className={`pt-2 pb-0 border-b-2 transition-colors ${
                                            activeTab === "spells"
                                                ? "border-accent text-ink"
                                                : "border-transparent text-ink-muted hover:text-ink"
                                        }`}
                                    >
                                        {tr(
                                            locale,
                                            "Reverso · Acciones y hechizos",
                                            "Back · Actions and spells"
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("classFeatures")}
                                        className={`pt-2 pb-0 border-b-2 transition-colors ${
                                            activeTab === "classFeatures"
                                                ? "border-accent text-ink"
                                                : "border-transparent text-ink-muted hover:text-ink"
                                        }`}
                                    >
                                        {tr(locale, "Habilidades de clase", "Class features")}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("inventory")}
                                        className={`pt-2 pb-0 border-b-2 transition-colors ${
                                            activeTab === "inventory"
                                                ? "border-accent text-ink"
                                                : "border-transparent text-ink-muted hover:text-ink"
                                        }`}
                                    >
                                        {tr(locale, "Reverso · Inventario", "Back · Inventory")}
                                    </button>
                                    {showCompanionsTab && (
                                        <button
                                            onClick={() => setActiveTab("companions")}
                                            className={`pt-2 pb-0 border-b-2 transition-colors ${
                                                activeTab === "companions"
                                                    ? "border-accent text-ink"
                                                    : "border-transparent text-ink-muted hover:text-ink"
                                            }`}
                                        >
                                            {tr(locale, "Compañeros", "Companions")}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CONTENIDO con scroll interno */}
                    <div className="relative p-4 min-w-0 flex-1 overflow-y-auto overflow-x-hidden styled-scrollbar">
                        {activeSection === "story" ? (
                            <StoryPlayerView
                                campaignId={String(params.id)}
                                locale={locale}
                            />
                        ) : (
                            rightPanelMode === "character" && (
                            <>
                                {mode === "view" && selectedChar && (
                                    <CharacterView
                                        character={selectedChar}
                                        companions={characters}
                                        activeTab={activeTab}
                                        onTabChange={setActiveTab}
                                        renderTabs={false}
                                        onImageUpdated={loadCharacters}
                                        onDetailsChange={(newDetails: Details) => {
                                            setCharacters((prev) =>
                                                prev.map((c) => (c.id === selectedChar.id ? { ...c, details: newDetails } : c))
                                            );
                                        }}
                                        onOpenSpellManager={() => setRightPanelMode("spellManager")}
                                    />
                                )}

                                {(mode === "create" || mode === "edit") && (
                                    <CharacterForm
                                        mode={mode}
                                        onSubmit={handleSaveCharacter}
                                        onCancel={cancelEditOrCreate}
                                        fields={fields}
                                        ownerOptions={ownerOptions}
                                        characterId={mode === "edit" ? editingId ?? selectedChar?.id ?? null : null}
                                        profileImage={mode === "edit" ? selectedChar?.profile_image ?? null : null}
                                        onImageUpdated={loadCharacters}
                                    />
                                )}

                                {mode === "view" && !selectedChar && (
                                    <p className="text-sm text-ink-muted">
                                        {tr(locale, "Selecciona un personaje en la lista o crea uno nuevo.", "Select a character from the list or create a new one.")}
                                    </p>
                                )}
                            </>
                            )
                        )}

                        {activeSection === "characters" &&
                            rightPanelMode === "spellManager" &&
                            selectedChar && (
                            <SpellManagerPanel
                                character={selectedChar}
                                onClose={() => setRightPanelMode("character")}
                                isDMMode={isDmMode}
                                onDetailsChange={(newDetails: Details) => {
                                    setCharacters((prev) =>
                                        prev.map((c) => (c.id === selectedChar.id ? { ...c, details: newDetails } : c))
                                    );
                                }}
                            />
                        )}
                    </div>
                </div>
            </section>

            {/* Scrollbar styles injected locally para evitar tocar globals.css */}
            <style jsx global>{`
                /* Scrollbar suave, minimalista y elegante */
                .styled-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                .styled-scrollbar::-webkit-scrollbar-track {
                    background: rgba(140, 114, 85, 0.12);
                    border-radius: 10px;
                }

                .styled-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(179, 90, 44, 0.35);
                    border-radius: 10px;
                    border: 2px solid transparent;
                    background-clip: padding-box;
                }

                .styled-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(179, 90, 44, 0.55);
                }

                /* Firefox */
                .styled-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(179, 90, 44, 0.45) rgba(140, 114, 85, 0.12);
                }

                /* Small accessibility: ensure focus outlines for keyboard users */
                button:focus {
                    outline: 2px solid rgba(47, 111, 106, 0.2);
                    outline-offset: 2px;
                }

                /* Ensure sticky-like visual blend if any sticky remains elsewhere */
                .sticky {
                    -webkit-backdrop-filter: blur(6px);
                    backdrop-filter: blur(6px);
                }
            `}</style>

            <AIAssistantPanel
                open={assistantOpen}
                onOpenChange={setAssistantOpen}
                campaignId={params.id}
                locale={locale}
                selectedCharacterId={selectedChar?.id ?? null}
                selectedCharacterName={selectedChar?.name ?? null}
                assistantContext={assistantContext}
                onApplied={async () => {
                    const refreshed = await loadCharacters();
                    if (mode !== "edit") return;

                    const activeEditorId = editingId ?? selectedChar?.id ?? null;
                    if (!activeEditorId) return;
                    const freshCharacter = refreshed.find(
                        (entry) => entry.id === activeEditorId
                    );
                    if (!freshCharacter) return;

                    autoSaveGuardRef.current = true;
                    loadFromCharacter(freshCharacter);
                }}
            />
        </main>
    );
}

export default CampaignPlayerPage;


