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
    normalizeClassForApi,
    prettyClassLabel,
} from "./playerShared";
import ClickableRow from "../../../components/ClickableRow";
import { CharacterView } from "./CharacterView";
import { CharacterForm } from "./CharacterForm";
import { SpellManagerPanel } from "./SpellManagerPanel";
import { Trash2, Edit2, Menu, ChevronLeft, ChevronRight, Grid } from "lucide-react";

type RightPanelMode = "character" | "spellManager";
type AbilityKey = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";

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

    // Panel personajes abierto/cerrado
    const [charsOpen, setCharsOpen] = useState<boolean>(true);

    // Edición / creación
    const [editingId, setEditingId] = useState<string | null>(null);

    const [charName, setCharName] = useState("");
    const [charClass, setCharClass] = useState("");
    const [charLevel, setCharLevel] = useState<number>(1);
    const [race, setRace] = useState("");
    const [experience, setExperience] = useState<number>(0);
    const [armorClass, setArmorClass] = useState<number>(10);
    const [speed, setSpeed] = useState<number>(30);

    // Vida
    const [currentHp, setCurrentHp] = useState<number>(10);
    const [hitDieSides, setHitDieSides] = useState<number>(8);

    // Stats
    const [str, setStr] = useState<number>(10);
    const [dex, setDex] = useState<number>(10);
    const [con, setCon] = useState<number>(10);
    const [intStat, setIntStat] = useState<number>(10);
    const [wis, setWis] = useState<number>(10);
    const [cha, setCha] = useState<number>(10);

    // details
    const [armors, setArmors] = useState<any[]>([]);
    const [weaponName, setWeaponName] = useState("");
    const [weaponDamage, setWeaponDamage] = useState("");
    const [weaponDescription, setWeaponDescription] = useState("");
    const [weaponStatAbility, setWeaponStatAbility] = useState<AbilityKey | "none">("none");
    const [weaponStatModifier, setWeaponStatModifier] = useState<number | null>(null);
    const [inventory, setInventory] = useState("");
    const [equipment, setEquipment] = useState("");
    const [abilities, setAbilities] = useState("");
    const [weaponsExtra, setWeaponsExtra] = useState("");
    const [notes, setNotes] = useState("");

    // Clase personalizada
    const [customClassName, setCustomClassName] = useState("");
    const [customCastingAbility, setCustomCastingAbility] = useState<keyof Stats>("int");

    // Hechizos en formulario
    const [spellsL0, setSpellsL0] = useState("");
    const [spellsL1, setSpellsL1] = useState("");
    const [spellsL2, setSpellsL2] = useState("");
    const [spellsL3, setSpellsL3] = useState("");
    const [spellsL4, setSpellsL4] = useState("");
    const [spellsL5, setSpellsL5] = useState("");
    const [spellsL6, setSpellsL6] = useState("");
    const [spellsL7, setSpellsL7] = useState("");
    const [spellsL8, setSpellsL8] = useState("");
    const [spellsL9, setSpellsL9] = useState("");

    useEffect(() => {
        async function checkAccessAndLoad() {
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

            const { data: chars, error: charsError } = await supabase
                .from("characters")
                .select(
                    "id, name, class, level, race, experience, max_hp, current_hp, armor_class, speed, stats, details"
                )
                .eq("campaign_id", params.id)
                .eq("user_id", session.user.id);

            if (charsError) {
                console.error("Error cargando personajes:", charsError);
                setError(charsError.message ?? "No se han podido cargar tus personajes.");
            } else if (chars) {
                const list: Character[] = (chars as any[]).map((c) => ({
                    ...(c as any),
                    details: (c.details || {}) as Details,
                }));

                setCharacters(list);
                if (!selectedId && list.length > 0) {
                    setSelectedId(list[0].id);
                }
            }

            setLoading(false);
        }

        checkAccessAndLoad();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id, router]);

    function resetForm() {
        setEditingId(null);
        setCharName("");
        setCharClass("");
        setCharLevel(1);
        setRace("");
        setExperience(0);
        setArmorClass(10);
        setSpeed(30);
        setCurrentHp(10);
        setHitDieSides(8);
        setStr(10);
        setDex(10);
        setCon(10);
        setIntStat(10);
        setWis(10);
        setCha(10);
        setArmors([]);
        setWeaponName("");
        setWeaponDamage("");
        setWeaponDescription("");
        setWeaponStatAbility("none");
        setWeaponStatModifier(null);
        setInventory("");
        setEquipment("");
        setAbilities("");
        setWeaponsExtra("");
        setNotes("");
        setSpellsL0("");
        setSpellsL1("");
        setSpellsL2("");
        setSpellsL3("");
        setSpellsL4("");
        setSpellsL5("");
        setSpellsL6("");
        setSpellsL7("");
        setSpellsL8("");
        setSpellsL9("");

        // Clase personalizada
        setCustomClassName("");
        setCustomCastingAbility("int");
    }

    function startCreate() {
        resetForm();
        setMode("create");
        setActiveTab("stats");
        setRightPanelMode("character");
    }

    function startEdit(char: Character) {
        setEditingId(char.id);
        setMode("edit");
        setActiveTab("stats");
        setRightPanelMode("character");

        setCharName(char.name);
        setCharClass(normalizeClassForApi(char.class ?? "") || char.class || "");
        setCharLevel(char.level ?? 1);
        setRace(char.race ?? "");
        setExperience(char.experience ?? 0);
        setArmorClass(char.armor_class ?? 10);
        setSpeed(char.speed ?? 30);
        setCurrentHp(char.current_hp ?? char.max_hp ?? 10);

        const s: Stats =
            char.stats ??
            (({
                str: 10,
                dex: 10,
                con: 10,
                int: 10,
                wis: 10,
                cha: 10,
            } as Stats));

        setStr(s.str ?? 10);
        setDex(s.dex ?? 10);
        setCon(s.con ?? 10);
        setIntStat(s.int ?? 10);
        setWis(s.wis ?? 10);
        setCha(s.cha ?? 10);

        const d: Details = char.details || {};
        setArmors(Array.isArray(d.armors) ? d.armors : []);
        setWeaponName(d.weaponEquipped?.name ?? "");
        setWeaponDamage(d.weaponEquipped?.damage ?? "");
        setWeaponDescription(d.weaponEquipped?.description ?? "");

        const weapon: any = (d as any).weaponEquipped;
        setWeaponStatAbility((weapon?.statAbility as AbilityKey | undefined) ?? "none");
        setWeaponStatModifier(typeof weapon?.statModifier === "number" ? weapon.statModifier : null);

        setInventory(d.inventory ?? "");
        setEquipment(d.equipment ?? "");
        setAbilities(d.abilities ?? "");
        setWeaponsExtra(d.weaponsExtra ?? "");
        setNotes(d.notes ?? "");
        setHitDieSides(d.hitDie?.sides ?? 8);

        // Clase personalizada guardada en details
        setCustomClassName(d.customClassName ?? "");
        setCustomCastingAbility(d.customCastingAbility ?? "int");

        const sp = d.spells || {};
        setSpellsL0(sp.level0 ?? "");
        setSpellsL1(sp.level1 ?? "");
        setSpellsL2(sp.level2 ?? "");
        setSpellsL3(sp.level3 ?? "");
        setSpellsL4(sp.level4 ?? "");
        setSpellsL5(sp.level5 ?? "");
        setSpellsL6(sp.level6 ?? "");
        setSpellsL7(sp.level7 ?? "");
        setSpellsL8(sp.level8 ?? "");
        setSpellsL9(sp.level9 ?? "");
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

    // Armaduras (para el formulario)
    type Armor = {
        name: string;
        bonus?: number | null;
        ability?: AbilityKey | null;
        modifier?: number | null;
        statAbility?: AbilityKey | null;
        statModifier?: number | null;
        modifiers?: { ability: AbilityKey; modifier: number }[];
    };

    function addArmor(armor: Armor) {
        setArmors((prev) => [...prev, armor]);
    }

    function removeArmor(index: number) {
        setArmors((prev) => prev.filter((_, i) => i !== index));
    }

    function updateArmor(index: number, field: keyof Armor, value: string | number | null) {
        setArmors((prev) => prev.map((armor, i) => (i === index ? { ...armor, [field]: value } : armor)));
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

            // Construir arma equipada con modificador de stat
            let weaponEquipped: any | undefined;
            if (weaponName.trim()) {
                const numericWeaponMod =
                    typeof weaponStatModifier === "number" && !Number.isNaN(weaponStatModifier) ? weaponStatModifier : null;

                weaponEquipped = {
                    name: weaponName.trim(),
                    damage: weaponDamage.trim() || undefined,
                    description: weaponDescription.trim() || undefined,
                    ...(weaponStatAbility !== "none" && numericWeaponMod !== null
                        ? {
                            statAbility: weaponStatAbility,
                            statModifier: numericWeaponMod,
                        }
                        : {}),
                };
            }

            const details: Details = {
                armors: armors.filter((a) => a.name?.trim() !== ""),
                weaponEquipped,
                inventory: inventory.trim() || undefined,
                equipment: equipment.trim() || undefined,
                abilities: abilities.trim() || undefined,
                weaponsExtra: weaponsExtra.trim() || undefined,
                notes: notes.trim() || undefined,
                hitDie: { sides: hitDieSides },
                spells,

                // Datos de clase personalizada
                customClassName: customClassName.trim() || undefined,
                customCastingAbility,
            };

            const payload = {
                name: charName.trim(),
                class: charClass.trim() || null,
                level: charLevel,
                race: race.trim() || null,
                experience,
                max_hp: computedMaxHp,
                current_hp: currentHp > computedMaxHp ? computedMaxHp : currentHp,
                armor_class: armorClass,
                speed,
                stats,
                details,
            };

            if (mode === "edit" && editingId) {
                const { error: updateError } = await supabase
                    .from("characters")
                    .update(payload)
                    .eq("id", editingId)
                    .eq("campaign_id", params.id)
                    .eq("user_id", session.user.id);

                if (updateError) {
                    console.error("Error actualizando personaje:", updateError);
                    throw new Error(updateError.message);
                }

                setCharacters((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...payload } : c)));
            } else {
                const { data: inserted, error: insertError } = await supabase
                    .from("characters")
                    .insert({
                        ...payload,
                        campaign_id: params.id,
                        user_id: session.user.id,
                    })
                    .select("id, name, class, level, race, experience, max_hp, current_hp, armor_class, speed, stats, details")
                    .single();

                if (insertError) {
                    console.error("Error creando personaje:", insertError);
                    throw new Error(insertError.message);
                }

                if (inserted) {
                    const newChar: Character = {
                        ...(inserted as any),
                        details: (inserted.details || {}) as Details,
                    };
                    setCharacters((prev) => [...prev, newChar]);
                    setSelectedId(newChar.id);
                }
            }

            setMode("view");
            setEditingId(null);
        } catch (e: any) {
            console.error(e);
            setError(e?.message ?? "Error guardando el personaje.");
        }
    }

    async function handleDeleteCharacter(id: string) {
        // Nota: confirm adicional por seguridad
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

            const { error: deleteError } = await supabase.from("characters").delete().eq("id", id).eq("campaign_id", params.id).eq("user_id", session.user.id);

            if (deleteError) {
                console.error("Error eliminando personaje:", deleteError);
                throw new Error(deleteError.message);
            }

            setCharacters((prev) => prev.filter((c) => c.id !== id));
            if (selectedId === id) {
                setSelectedId(null);
            }
        } catch (e: any) {
            console.error(e);
            setError(e?.message ?? "No se ha podido eliminar el personaje.");
        }
    }

    const selectedChar = characters.find((c) => c.id === selectedId) ?? null;

    if (!allowed && !loading) {
        return (
            <main className="p-6 text-sm text-zinc-300">
                No tienes acceso a esta campaña o no se han podido cargar los datos.
            </main>
        );
    }

    // estado para hover de dropzone
    const [isOverTrash, setIsOverTrash] = useState(false);

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
                const confirmDelete = window.confirm(
                    `¿Eliminar personaje "${char.name}" arrastrándolo a la papelera? Esta acción no se puede deshacer.`
                );
                if (!confirmDelete) return;
                handleDeleteCharacter(parsed.id);
            }
        } catch {
            // ignore
        }
    }

    return (
        <main className="flex min-h-screen bg-zinc-950 text-zinc-100">
            {/* PANEL personajes en la IZQUIERDA: cuando cerrado queda como 'mini panel' (w-12) */}
            <aside
                className={`relative flex flex-col border-r border-zinc-800 bg-zinc-950/90 transition-all duration-200 ease-in-out ${charsOpen ? "w-72 p-4" : "w-12 p-2"}`}
                aria-hidden={!charsOpen}
            >
                {/* Renderizo TODO el interior únicamente si charsOpen === true.
            Esto elimina los artefactos por completo al plegar. */}
                {charsOpen ? (
                    <>
                        {/* header */}
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-800">
                            <div className="flex items-center gap-2">
                                <Menu className="h-4 w-4 text-zinc-300" />
                                <h2 className="text-lg font-semibold text-purple-300">Tus personajes</h2>
                            </div>

                            <button type="button" onClick={startCreate} className="text-xs px-3 py-1 rounded-md border border-purple-600/70 hover:bg-purple-900/40">
                                Nuevo
                            </button>
                        </div>

                        {/* lista scrollable */}
                        <div className="flex-1 overflow-auto styled-scrollbar">
                            {loading ? (
                                <p className="text-xs text-zinc-500">Cargando...</p>
                            ) : characters.length === 0 ? (
                                <p className="text-xs text-zinc-500">Todavía no tienes personajes en esta campaña.</p>
                            ) : (
                                <ul className="space-y-2 text-sm">
                                    {characters.map((ch) => (
                                        <li key={ch.id} className="relative flex items-center gap-3" draggable onDragStart={(e) => handleDragStartCharacter(e, ch.id)}>
                                            <div className="flex-1">
                                                <ClickableRow
                                                    onClick={() => selectCharacter(ch.id)}
                                                    className={`w-full text-left px-3 py-3 rounded-md border text-xs flex flex-col gap-0.5 ${
                                                        selectedId === ch.id ? "border-purple-500 bg-purple-900/30" : "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900"
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-sm text-zinc-100 truncate">{ch.name}</p>
                                                            <p className="text-[11px] text-zinc-400 truncate">
                                                                {ch.race || "Sin raza"} · {prettyClassLabel(ch.class)} · Nivel {ch.level ?? "?"}
                                                            </p>
                                                        </div>

                                                        <div className="flex-shrink-0 ml-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-700/20 bg-transparent text-emerald-300/90">
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
                                                    className="text-[11px] px-2 py-1 rounded border border-zinc-700 hover:bg-zinc-800 bg-zinc-900/60 flex items-center gap-2"
                                                    aria-label={`Editar ${ch.name}`}
                                                    title="Editar"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* footer papelera */}
                        <div className="mt-4 pt-3 border-t border-zinc-800">
                            <div
                                onDragOver={handleTrashDragOver}
                                onDragLeave={handleTrashDragLeave}
                                onDrop={handleTrashDrop}
                                className={`rounded-md p-3 border-2 flex items-center gap-3 justify-center transition-colors ${isOverTrash ? "border-red-400 bg-red-900/20" : "border-red-700/30 bg-transparent"}`}
                            >
                                <Trash2 className="h-5 w-5 text-red-400" />
                                <div>
                                    <p className="text-sm font-medium text-red-300">Arrastra aquí para eliminar</p>
                                    <p className="text-[11px] text-zinc-400">Suelta para eliminar el personaje arrastrado</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* cuando está minimizado dejamos solo el icono visible (ni lista ni footer ni botones) */
                    <div className="flex h-full items-center justify-center">
                        <Menu className="h-5 w-5 text-zinc-300" />
                    </div>
                )}

                {/* Toggle pegado al borde derecho del aside para que "siga" al panel */}
                <button
                    type="button"
                    onClick={() => setCharsOpen((v) => !v)}
                    className="absolute right-[-18px] top-4 z-30 rounded-full bg-zinc-900 border border-zinc-800 p-2 shadow-sm hover:bg-zinc-800"
                    aria-label={charsOpen ? "Cerrar lista de personajes" : "Abrir lista de personajes"}
                    title={charsOpen ? "Cerrar lista" : "Abrir lista"}
                >
                    {charsOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
            </aside>

            {/* Panel derecho */}
            <section className="flex-1 p-6 space-y-6">
                {error && (
                    <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-md px-3 py-2 inline-block">
                        {error}
                    </p>
                )}

                <div className="rounded-xl bg-zinc-950/60 border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
                    <div className="p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h1 className="text-lg font-semibold text-purple-300">{mode === "create" ? "Nuevo personaje" : selectedChar?.name ?? "Personaje"}</h1>
                                <p className="text-xs text-zinc-400 mt-1">
                                    {selectedChar ? `${selectedChar.race ?? "Sin raza"} · ${prettyClassLabel(selectedChar.class)} · Nivel ${selectedChar.level ?? "?"}` : "Crea o selecciona un personaje"}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="text-xs text-zinc-400 flex items-center gap-2">
                                    <Grid className="h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4">
                        {rightPanelMode === "character" && (
                            <>
                                {mode === "view" && selectedChar && (
                                    <CharacterView
                                        character={selectedChar}
                                        activeTab={activeTab}
                                        onTabChange={setActiveTab}
                                        onDetailsChange={(newDetails: Details) => {
                                            setCharacters((prev) => prev.map((c) => (c.id === selectedChar.id ? { ...c, details: newDetails } : c)));
                                        }}
                                        onOpenSpellManager={() => setRightPanelMode("spellManager")}
                                    />
                                )}

                                {(mode === "create" || mode === "edit") && (
                                    <CharacterForm
                                        mode={mode}
                                        onSubmit={handleSaveCharacter}
                                        onCancel={cancelEditOrCreate}
                                        fields={{
                                            charName,
                                            setCharName,
                                            charClass,
                                            setCharClass,
                                            charLevel,
                                            setCharLevel,
                                            race,
                                            setRace,
                                            experience,
                                            setExperience,
                                            armorClass,
                                            setArmorClass,
                                            speed,
                                            setSpeed,
                                            currentHp,
                                            setCurrentHp,
                                            hitDieSides,
                                            setHitDieSides,
                                            str,
                                            setStr,
                                            dex,
                                            setDex,
                                            con,
                                            setCon,
                                            intStat,
                                            setIntStat,
                                            wis,
                                            setWis,
                                            cha,
                                            setCha,
                                            armors,
                                            addArmor,
                                            removeArmor,
                                            updateArmor,
                                            weaponName,
                                            setWeaponName,
                                            weaponDamage,
                                            setWeaponDamage,
                                            weaponDescription,
                                            setWeaponDescription,
                                            weaponStatAbility,
                                            setWeaponStatAbility,
                                            weaponStatModifier,
                                            setWeaponStatModifier,
                                            inventory,
                                            setInventory,
                                            equipment,
                                            setEquipment,
                                            abilities,
                                            setAbilities,
                                            weaponsExtra,
                                            setWeaponsExtra,
                                            notes,
                                            setNotes,
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
                                            // Campos para clase personalizada
                                            customClassName,
                                            setCustomClassName,
                                            customCastingAbility,
                                            setCustomCastingAbility,
                                        }}
                                    />
                                )}

                                {mode === "view" && !selectedChar && <p className="text-sm text-zinc-500">Selecciona un personaje en la lista o crea uno nuevo.</p>}
                            </>
                        )}

                        {rightPanelMode === "spellManager" && selectedChar && (
                            <SpellManagerPanel
                                character={selectedChar}
                                onClose={() => setRightPanelMode("character")}
                                onDetailsChange={(newDetails: Details) => {
                                    setCharacters((prev) => prev.map((c) => (c.id === selectedChar.id ? { ...c, details: newDetails } : c)));
                                }}
                            />
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
