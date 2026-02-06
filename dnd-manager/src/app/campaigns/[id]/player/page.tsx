// src/app/campaigns/[id]/player/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, FormEvent, DragEvent } from "react";
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
} from "./playerShared";
import ClickableRow from "../../../components/ClickableRow";
import CharacterView from "./ui/CharacterView";
import { CharacterForm } from "./ui/CharacterForm";
import { SpellManagerPanel } from "./srd/SpellManagerPanel";
import { useCharacterForm } from "./hooks/useCharacterForm";
import { Trash2, Edit2, ChevronLeft, ChevronRight, Menu, Settings } from "lucide-react";
import SettingsPanel from "./ui/SettingsPanel";

type RightPanelMode = "character" | "spellManager";

export default function CampaignPlayerPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(false);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [mode, setMode] = useState<Mode>("view");
    const [activeTab, setActiveTab] = useState<Tab>("stats");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>("character");

    // mounted guard para evitar hydration mismatch
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // Panel personajes abierto/cerrado
    const [charsOpen, setCharsOpen] = useState<boolean>(false);
    const [isOverTrash, setIsOverTrash] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Edición / creación
    const [editingId, setEditingId] = useState<string | null>(null);

    const { fields, resetForm, loadFromCharacter } = useCharacterForm();
    const {
        charName,
        charClass,
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
        weaponProficient,
        weaponEquipped: weaponEquippedFlag,
        weaponPassiveModifiers,
        inventory,
        equipment,
        abilities,
        weaponsExtra,
        notes,
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
    async function loadCharacters() {
        setLoading(true);
        setError(null);
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session?.user) {
                router.push("/login");
                return;
            }

            const { data: chars, error: charsError } = await supabase
                .from("characters")
                .select(
                    "id, name, class, level, race, experience, max_hp, current_hp, armor_class, speed, stats, details, profile_image, character_type"
                )
                .eq("campaign_id", params.id)
                .eq("user_id", session.user.id);

            if (charsError) {
                console.error("Error cargando personajes:", charsError);
                setError(charsError.message ?? "No se han podido cargar tus personajes.");
                setCharacters([]);
            } else if (chars) {
                const list: Character[] = (chars as any[]).map((c) => ({
                    ...(c as any),
                    details: (c.details || {}) as Details,
                }));
                setCharacters(list);
                if (!selectedId && list.length > 0) setSelectedId(list[0].id);
            } else {
                setCharacters([]);
            }
        } catch (err: any) {
            console.error("loadCharacters:", err);
            setError(err?.message ?? "Error cargando personajes.");
            setCharacters([]);
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

            setAllowed(true);
            await loadCharacters();
        }

        checkAccessAndInit();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id, router]);


    function startCreate(type: "character" | "companion" = "character") {
        resetForm();
        setCharacterType?.(type);
        setEditingId(null);
        setMode("create");
        setActiveTab("stats");
        setRightPanelMode("character");
    }

    function startEdit(char: Character) {
        setEditingId(char.id);
        setMode("edit");
        setActiveTab("stats");
        setRightPanelMode("character");
        loadFromCharacter(char);

    }

    function cancelEditOrCreate() {
        setMode("view");
        setEditingId(null);
    }

    function selectCharacter(id: string) {
        setSelectedId(id);
        setMode("view");
        setRightPanelMode("character");
    }

    async function handleSaveCharacter(e: FormEvent) {
        e.preventDefault();
        setError(null);

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session?.user) {
                throw new Error("No hay sesión activa.");
            }

            if (!charName.trim()) {
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

            const orderedItems = Array.isArray(items)
                ? items.map((item, index) => ({ ...item, sortOrder: index }))
                : [];
            const legacyCompanion =
                mode === "edit" ? selectedChar?.details?.companion : undefined;
            const detailsObj: Details = {
                abilities: abilities.trim() || undefined,
                notes: notes.trim() || undefined,
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
                customClassName: customClassName.trim() || undefined,
                customCastingAbility,
                items: orderedItems,
                customSpells: Array.isArray(customSpells) ? customSpells : [],
                customCantrips: Array.isArray(customCantrips) ? customCantrips : [],
                customTraits: Array.isArray(customTraits) ? customTraits : [],
                customClassAbilities: Array.isArray(customClassAbilities)
                    ? customClassAbilities
                    : [],
            };

            const resolvedCharacterType =
                mode === "edit"
                    ? selectedChar?.character_type ?? characterType ?? "character"
                    : characterType ?? "character";

            if (resolvedCharacterType === "companion" && !companionOwnerId) {
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

            if (mode === "edit" && editingId) {
                const { error: updateError } = await supabase
                    .from("characters")
                    .update(payload)
                    .eq("id", editingId)
                    .eq("campaign_id", params.id)
                    .eq("user_id", (await supabase.auth.getSession()).data.session?.user?.id);

                if (updateError) {
                    console.error("Error actualizando personaje:", updateError);
                    throw new Error(updateError.message);
                }

                await loadCharacters(); // recargar lista por seguridad
            } else {
                const { data: inserted, error: insertError } = await supabase
                    .from("characters")
                    .insert({
                        ...payload,
                        campaign_id: params.id,
                        user_id: (await supabase.auth.getSession()).data.session?.user?.id,
                    })
                    .select(
                        "id, name, class, level, race, experience, max_hp, current_hp, armor_class, speed, stats, details, profile_image"
                    )
                    .single();

                if (insertError) {
                    console.error("Error creando personaje:", insertError);
                    throw new Error(insertError.message);
                }

                if (inserted) {
                    await loadCharacters();
                    setSelectedId((inserted as any).id ?? null);
                }
            }

            setMode("view");
            setEditingId(null);
        } catch (e: any) {
            console.error(e);
            setError(e?.message ?? "Error guardando el personaje.");
        }
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

            const { error: deleteError } = await supabase
                .from("characters")
                .delete()
                .eq("id", id)
                .eq("campaign_id", params.id)
                .eq("user_id", session.user.id);

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
    const ownerOptions = characters
        .filter((c) => c.character_type !== "companion")
        .map((c) => ({ id: c.id, name: c.name }));
    const createTitle = characterType === "companion" ? "Nuevo compañero" : "Nuevo personaje";

    if (!allowed && !loading) {
        return (
            <main className="p-6 text-sm text-ink-muted">
                No tienes acceso a esta campaña o no se han podido cargar los datos.
            </main>
        );
    }

    // Drag handlers para las filas -> asignados en el render del listado
    function handleDragStartCharacter(event: DragEvent, charId: string) {
        try {
            const payload = JSON.stringify({ type: "character", id: charId });
            event.dataTransfer.setData("application/x-dnd-manager-item", payload);
            event.dataTransfer.effectAllowed = "move";
        } catch {
            // ignore
        }
    }

    function handleTrashDragOver(e: DragEvent) {
        e.preventDefault();
        setIsOverTrash(true);
        e.dataTransfer.dropEffect = "move";
    }
    function handleTrashDragLeave() {
        setIsOverTrash(false);
    }

    function handleTrashDrop(e: DragEvent) {
        e.preventDefault();
        setIsOverTrash(false);
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

    // --- small helpers for animated classes
    const asideWidthOpen = "w-72";
    const asideWidthClosed = "w-12";
    const asideTransition = "transition-[width,background-color,box-shadow] duration-300 ease-in-out";

    // === mounted guard: si no estamos montados en cliente, devolvemos placeholder neutro
    if (!mounted) {
        return (
            <main className="flex min-h-screen bg-surface text-ink">
                <aside className="w-72 border-r border-ring bg-panel/90 p-4 space-y-4">
                    <div className="h-8 bg-ink/5 rounded w-2/3" />
                    <div className="h-6 bg-ink/10 rounded w-1/2 mt-2" />
                </aside>

                <section className="flex-1 p-6">
                    <div className="rounded-xl bg-panel/80 border border-ring p-4 h-24" />
                </section>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen bg-surface text-ink">
            {/* PANEL personajes en la IZQUIERDA */}
            <aside
                className={`relative flex flex-col border-r border-ring ${asideTransition} ${charsOpen ? asideWidthOpen : asideWidthClosed}
          rounded-r-3xl overflow-visible
          bg-panel/90 shadow-[0_18px_50px_rgba(45,29,12,0.18)]`}
                aria-hidden={!charsOpen}
            >
                <div
                    className={`flex-1 flex flex-col p-4 h-full
            ${charsOpen ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 -translate-x-2 pointer-events-none"}
            transition-all duration-300 ease-in-out`}
                >
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-ring">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded bg-ink/5 border border-ring">
                                <Menu className="h-4 w-4 text-ink" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-ink leading-tight">Tus personajes</h2>
                                <p className="text-[11px] text-ink-muted mt-0.5">Gestiona tus personajes de campaña</p>
                            </div>
                        </div>

                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <button
                            type="button"
                            onClick={() => startCreate("character")}
                            className="text-[11px] px-2 py-1 rounded-md border border-accent/60 text-accent-strong hover:bg-accent/10"
                        >
                            Nuevo PJ
                        </button>
                        <button
                            type="button"
                            onClick={() => startCreate("companion")}
                            className="text-[11px] px-2 py-1 rounded-md border border-ring text-ink hover:bg-ink/5"
                        >
                            Nuevo compañero
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto styled-scrollbar">
                        {loading ? (
                            <p className="text-xs text-ink-muted">Cargando...</p>
                        ) : characters.length === 0 ? (
                            <p className="text-xs text-ink-muted">Todavía no tienes personajes en esta campaña.</p>
                        ) : (
                            <ul className="space-y-2 text-sm">
                                {characters.map((ch) => (
                                    <li key={ch.id} className="relative flex items-center gap-3" draggable onDragStart={(e) => handleDragStartCharacter(e, ch.id)}>
                                        <div className="flex-1">
                                            <ClickableRow
                                                onClick={() => selectCharacter(ch.id)}
                                                className={`w-full text-left px-3 py-3 rounded-md border text-xs flex flex-col gap-0.5 ${
                                                    selectedId === ch.id ? "border-accent bg-accent/10" : "border-ring bg-white/80 hover:bg-white"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <p className="font-medium text-sm text-ink truncate">{ch.name}</p>
                                                            {ch.character_type === "companion" && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-400/60 text-emerald-700 bg-emerald-50">
                                                                    Compañero
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-ink-muted truncate">
                                                            {ch.race || "Sin raza"} · {prettyClassLabel(ch.class)} · Nivel {ch.level ?? "?"}
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

                                        <div className="flex-shrink-0 pr-1">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    startEdit(ch);
                                                }}
                                                className="text-[11px] px-2 py-1 rounded border border-ring hover:bg-ink/5 bg-white/70 flex items-center gap-2 text-ink"
                                                aria-label={`Editar ${ch.name}`}
                                                title="Editar"
                                            >
                                                <Edit2 className="h-4 w-4 text-ember" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
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
                                <p className="text-sm font-medium text-red-600">Arrastra aquí para eliminar</p>
                                <p className="text-[11px] text-ink-muted">Suelta para eliminar el personaje arrastrado</p>
                            </div>
                        </div>
                    </div>
                </div>

                {!charsOpen && null}

                <button
                    type="button"
                    onClick={() => setCharsOpen((v) => !v)}
                    className={`absolute top-4 z-30 rounded-full p-2 shadow-sm
            ${charsOpen ? "right-[-18px] bg-panel border border-ring hover:bg-white" : "right-0 translate-x-1/2 bg-panel border border-ring hover:bg-white"}
            transition-all duration-300 ease-in-out`}
                    aria-label={charsOpen ? "Cerrar lista de personajes" : "Abrir lista de personajes"}
                    title={charsOpen ? "Cerrar lista" : "Abrir lista"}
                >
                    {charsOpen ? <ChevronLeft className="h-4 w-4 text-ink" /> : <ChevronRight className="h-4 w-4 text-ink" />}
                </button>
            </aside>

            {/* Panel derecho (contenido principal) */}
            {/* -> Aquí: dejamos header estático (no sticky) y todo el contenido se desplaza */}
            <section className="flex-1 p-6 h-screen overflow-hidden flex flex-col">
                {error && (
                    <p className="text-sm text-red-700 bg-red-100 border border-red-200 rounded-md px-3 py-2 inline-block">
                        {error}
                    </p>
                )}

                <div className="rounded-2xl bg-panel/80 border border-ring divide-y divide-ring overflow-hidden shadow-[0_18px_50px_rgba(45,29,12,0.12)] flex flex-col h-full">
                    {/* HEADER: ahora estático (no sticky) */}
                    <div className="p-4 flex-shrink-0">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h1 className="text-lg font-semibold text-ink">
                                    {mode === "create"
                                        ? createTitle
                                        : selectedChar?.name ?? "Personaje"}
                                </h1>
                                <p className="text-xs text-ink-muted mt-1">
                                    {selectedChar
                                        ? `${selectedChar.race ?? "Sin raza"} · ${prettyClassLabel(selectedChar.class)} · Nivel ${selectedChar.level ?? "?"}`
                                        : `Crea o selecciona un ${characterType === "companion" ? "compañero" : "personaje"}`}
                                </p>
                            </div>

                            <div className="flex items-center gap-2" />
                        </div>
                    </div>

                    {/* CONTENIDO: aquí está el scroll interno — las pestañas se renderizan dentro de CharacterView */}
                    <div className="p-4 flex-1 overflow-y-auto styled-scrollbar">
                        {rightPanelMode === "character" && (
                            <>
                                {mode === "view" && selectedChar && (
                                    <CharacterView
                                        character={selectedChar}
                                        companions={characters}
                                        activeTab={activeTab}
                                        onTabChange={setActiveTab}
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
                                    <p className="text-sm text-ink-muted">Selecciona un personaje en la lista o crea uno nuevo.</p>
                                )}
                            </>
                        )}

                        {rightPanelMode === "spellManager" && selectedChar && (
                            <SpellManagerPanel
                                character={selectedChar}
                                onClose={() => setRightPanelMode("character")}
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

            <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </main>
    );
}



