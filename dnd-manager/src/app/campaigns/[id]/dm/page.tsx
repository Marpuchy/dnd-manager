"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useClientLocale } from "@/lib/i18n/useClientLocale";
import { tr } from "@/lib/i18n/translate";
import CharacterView from "../player/ui/CharacterView";
import { CharacterForm } from "../player/ui/CharacterForm";
import { SpellManagerPanel } from "../player/srd/SpellManagerPanel";
import { useCharacterForm } from "../player/hooks/useCharacterForm";
import type { Character, Details, Tab } from "../player/playerShared";

type MembershipRow = {
    role: "PLAYER" | "DM";
};

type DMSection = "players" | "story" | "bestiary" | "characters";

type MenuEntry = {
    id: DMSection;
    icon: string;
    es: string;
    en: string;
};

type PlayerPanelMode = "idle" | "view" | "edit" | "spellManager";

export default function CampaignDMPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const locale = useClientLocale();
    const t = (es: string, en: string) => tr(locale, es, en);

    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [activeSection, setActiveSection] = useState<DMSection>("players");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
    const [playerEditorOpen, setPlayerEditorOpen] = useState(false);
    const [playerPanelMode, setPlayerPanelMode] = useState<PlayerPanelMode>("idle");
    const [playerViewTab, setPlayerViewTab] = useState<Tab>("stats");

    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [characters, setCharacters] = useState<Character[]>([]);

    const [storyDraft, setStoryDraft] = useState("");
    const [storySaved, setStorySaved] = useState(false);
    const { fields: formFields, loadFromCharacter } = useCharacterForm();

    const storyStorageKey = useMemo(
        () => `dnd-manager:dm-story:${String(params.id ?? "")}`,
        [params.id]
    );

    const menuEntries: MenuEntry[] = [
        {
            id: "players",
            icon: "\uD83D\uDC65",
            es: "Gestor de jugadores",
            en: "Player manager",
        },
        {
            id: "story",
            icon: "\uD83D\uDCD6",
            es: "Gestor de historia",
            en: "Story manager",
        },
        {
            id: "bestiary",
            icon: "\uD83D\uDC09",
            es: "Gestor de bestiario",
            en: "Bestiary manager",
        },
        {
            id: "characters",
            icon: "\uD83E\uDDD9",
            es: "Gestor de personajes de la campana",
            en: "Campaign character manager",
        },
    ];

    useEffect(() => {
        if (typeof window === "undefined") return;
        const cached = window.localStorage.getItem(storyStorageKey);
        if (cached) setStoryDraft(cached);
    }, [storyStorageKey]);

    async function loadPanelData(campaignId: string): Promise<Character[]> {
        const [campaignRes, charsRes] = await Promise.all([
            supabase.from("campaigns").select("invite_code").eq("id", campaignId).maybeSingle(),
            supabase
                .from("characters")
                .select(
                    "id, name, class, level, race, experience, max_hp, current_hp, armor_class, speed, stats, details, profile_image, character_type, created_at"
                )
                .eq("campaign_id", campaignId)
                .order("created_at", { ascending: true }),
        ]);

        if (campaignRes.error) throw campaignRes.error;
        if (charsRes.error) throw charsRes.error;

        setInviteCode(campaignRes.data?.invite_code ?? null);
        const list = (charsRes.data ?? []) as Character[];
        setCharacters(list);
        return list;
    }

    useEffect(() => {
        let cancelled = false;

        async function checkAccessAndLoad() {
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

                const { data: membership, error: membershipError } = await supabase
                    .from("campaign_members")
                    .select("role")
                    .eq("user_id", session.user.id)
                    .eq("campaign_id", params.id)
                    .maybeSingle<MembershipRow>();

                if (membershipError || !membership || membership.role !== "DM") {
                    router.push("/campaigns");
                    return;
                }

                if (cancelled) return;
                setAllowed(true);
                await loadPanelData(String(params.id));
            } catch (err: any) {
                console.error("DM panel load error:", err);
                if (!cancelled) {
                    setError(
                        err?.message ??
                            t(
                                "No se pudo cargar el panel de master.",
                                "Could not load the master panel."
                            )
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void checkAccessAndLoad();

        return () => {
            cancelled = true;
        };
    }, [params.id, router]);

    useEffect(() => {
        if (characters.length === 0) {
            setEditingCharacterId(null);
            setPlayerEditorOpen(false);
            setPlayerPanelMode("idle");
            return;
        }
        if (editingCharacterId) {
            const exists = characters.some((character) => character.id === editingCharacterId);
            if (!exists) {
                setEditingCharacterId(null);
                setPlayerEditorOpen(false);
                setPlayerPanelMode("idle");
            }
        }
    }, [characters, editingCharacterId]);

    function saveStory() {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(storyStorageKey, storyDraft);
        setStorySaved(true);
        window.setTimeout(() => setStorySaved(false), 1200);
    }

    const editingCharacter =
        characters.find((character) => character.id === editingCharacterId) ?? null;
    const ownerOptions = characters
        .filter((character) => character.character_type !== "companion")
        .map((character) => ({ id: character.id, name: character.name }));

    function flushEditorSaveIfNeeded() {
        if (activeSection !== "players") return;
        if (playerPanelMode !== "edit") return;
        const form = document.getElementById("character-form") as HTMLFormElement | null;
        form?.requestSubmit();
    }

    function handleOpenCharacterView(id: string) {
        flushEditorSaveIfNeeded();
        setEditingCharacterId(id);
        setPlayerEditorOpen(true);
        setPlayerPanelMode("view");
    }

    function handleEditCharacter(character: Character) {
        setEditingCharacterId(character.id);
        loadFromCharacter(character);
        setPlayerEditorOpen(true);
        setPlayerPanelMode("edit");
        setPlayerViewTab("stats");
    }

    function handleOpenSpellManager() {
        if (!editingCharacter) return;
        setPlayerEditorOpen(true);
        setPlayerPanelMode("spellManager");
    }

    function handlePlayerDetailsChange(nextDetails: Details) {
        if (!editingCharacter) return;

        setCharacters((prev) =>
            prev.map((character) =>
                character.id === editingCharacter.id
                    ? { ...character, details: nextDetails }
                    : character
            )
        );

        void supabase
            .from("characters")
            .update({ details: nextDetails })
            .eq("id", editingCharacter.id)
            .eq("campaign_id", params.id);
    }

    if (loading || !allowed) {
        return (
            <main className="min-h-screen bg-surface text-ink flex items-center justify-center">
                <p className="text-ink-muted">{t("Cargando panel DM...", "Loading DM panel...")}</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-surface text-ink flex">
            <aside
                className={`border-r border-ring bg-panel/85 p-3 space-y-3 transition-all duration-200 ${
                    sidebarOpen ? "w-72" : "w-16"
                }`}
            >
                <div className="flex items-start justify-between gap-2">
                    {sidebarOpen ? (
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold text-ink">
                                {t("Panel de master", "Master panel")}
                            </h2>
                            <p className="text-xs text-ink-muted">
                                {t("Campana", "Campaign")} #{String(params.id)}
                            </p>
                        </div>
                    ) : (
                        <div />
                    )}

                    <button
                        type="button"
                        onClick={() => setSidebarOpen((prev) => !prev)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-ring bg-white/70 hover:bg-white text-sm"
                        title={t("Desplegar panel", "Toggle panel")}
                        aria-label={t("Desplegar panel", "Toggle panel")}
                    >
                        {sidebarOpen ? "«" : "»"}
                    </button>
                </div>

                {inviteCode && sidebarOpen && (
                    <button
                        type="button"
                        onClick={() => void navigator.clipboard.writeText(inviteCode)}
                        className="w-full text-left rounded-md border border-ring bg-white/70 px-3 py-2 text-xs hover:bg-white"
                    >
                        {t("Copiar codigo", "Copy code")}: <span className="font-mono">{inviteCode}</span>
                    </button>
                )}

                <nav>
                    <ul className="space-y-1">
                        {menuEntries.map((entry) => {
                            const selected = activeSection === entry.id;
                            return (
                                <li key={entry.id}>
                                    <a
                                        href="#"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            if (entry.id !== activeSection) {
                                                flushEditorSaveIfNeeded();
                                            }
                                            setActiveSection(entry.id);
                                            if (entry.id !== "players") {
                                                setPlayerPanelMode("idle");
                                                setPlayerEditorOpen(false);
                                            }
                                        }}
                                        className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm ${
                                            selected
                                                ? "bg-accent/10 text-ink"
                                                : "text-ink-muted hover:text-ink hover:bg-white/60"
                                        }`}
                                        aria-current={selected ? "page" : undefined}
                                        title={t(entry.es, entry.en)}
                                    >
                                        <span className="w-5 text-center">{entry.icon}</span>
                                        {sidebarOpen && <span>{t(entry.es, entry.en)}</span>}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>

            <section className="flex-1 p-6 space-y-4">
                {error && (
                    <p className="text-sm text-red-700 bg-red-100 border border-red-200 rounded-md px-3 py-2">
                        {error}
                    </p>
                )}

                {activeSection === "players" && (
                    <div className="space-y-3">
                        <h1 className="text-xl font-semibold text-ink">
                            {t("Gestor de jugadores", "Player manager")}
                        </h1>
                        <p className="text-sm text-ink-muted">
                            {t(
                                "Aqui aparecen los personajes de jugadores en la campana.",
                                "This section shows player characters in the campaign."
                            )}
                        </p>

                        <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-4 items-start">
                            <div className="border border-ring rounded-xl bg-panel/80 p-3 space-y-2">
                                {characters.length === 0 ? (
                                    <p className="text-sm text-ink-muted">
                                        {t(
                                            "No hay personajes en la campana.",
                                            "No characters in this campaign."
                                        )}
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {characters.map((char) => (
                                            <li
                                                key={char.id}
                                                onClick={() => handleOpenCharacterView(char.id)}
                                                className={`border rounded-md px-3 py-2 ${
                                                    playerEditorOpen && editingCharacterId === char.id
                                                        ? "border-accent bg-accent/10"
                                                        : "border-ring bg-white/70 hover:bg-white cursor-pointer"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-ink truncate">
                                                            {char.name}
                                                        </p>
                                                        <p className="text-xs text-ink-muted truncate">
                                                            {(char.class ?? t("Sin clase", "No class"))} -{" "}
                                                            {t("Nivel", "Level")} {char.level ?? 1}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleEditCharacter(char);
                                                        }}
                                                        className="text-[11px] px-2 py-1 rounded-md border border-accent/60 bg-accent/10 hover:bg-accent/20 shrink-0"
                                                    >
                                                        {t("Editar", "Edit")}
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="dm-player-preview border border-ring rounded-xl bg-panel/80 overflow-hidden min-h-[440px]">
                                {playerEditorOpen && editingCharacter && playerPanelMode === "edit" ? (
                                    <div className="p-3 pt-4">
                                        <CharacterForm
                                            key={`dm-edit-${editingCharacter.id}`}
                                            mode="edit"
                                            autoSave
                                            autoSaveDelayMs={300}
                                            onSaved={async (characterId) => {
                                                const updatedList = await loadPanelData(
                                                    String(params.id)
                                                );
                                                const updatedCharacter = updatedList.find(
                                                    (character) => character.id === characterId
                                                );
                                                if (updatedCharacter) {
                                                    loadFromCharacter(updatedCharacter);
                                                }
                                            }}
                                            onCancel={() => {
                                                setPlayerPanelMode("view");
                                                void loadPanelData(String(params.id));
                                            }}
                                            fields={{
                                                ...formFields,
                                                campaignId: String(params.id),
                                                characterId: editingCharacter.id,
                                            }}
                                            ownerOptions={ownerOptions}
                                            characterId={editingCharacter.id}
                                            profileImage={editingCharacter.profile_image ?? null}
                                            onImageUpdated={() => {
                                                void loadPanelData(String(params.id));
                                            }}
                                        />
                                    </div>
                                ) : playerEditorOpen &&
                                  editingCharacter &&
                                  playerPanelMode === "spellManager" ? (
                                    <div className="p-3 pt-4">
                                        <SpellManagerPanel
                                            character={editingCharacter}
                                            isDMMode
                                            onClose={() => setPlayerPanelMode("view")}
                                            onDetailsChange={handlePlayerDetailsChange}
                                        />
                                    </div>
                                ) : playerEditorOpen && editingCharacter && playerPanelMode === "view" ? (
                                    <div className="p-3 pt-4">
                                        <CharacterView
                                            character={editingCharacter}
                                            companions={characters}
                                            activeTab={playerViewTab}
                                            onTabChange={setPlayerViewTab}
                                            onDetailsChange={handlePlayerDetailsChange}
                                            onOpenSpellManager={handleOpenSpellManager}
                                        />
                                    </div>
                                ) : (
                                    <div className="p-4 text-sm text-ink-muted">
                                        {t(
                                            "Selecciona un jugador y pulsa Editar para abrir su vista.",
                                            "Select a player and click Edit to open their view."
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === "story" && (
                    <div className="space-y-3">
                        <h1 className="text-xl font-semibold text-ink">
                            {t("Gestor de historia", "Story manager")}
                        </h1>
                        <p className="text-sm text-ink-muted">
                            {t(
                                "Notas privadas del master (guardado local en este navegador).",
                                "Private master notes (saved locally in this browser)."
                            )}
                        </p>
                        <textarea
                            value={storyDraft}
                            onChange={(event) => setStoryDraft(event.target.value)}
                            rows={12}
                            className="w-full rounded-md border border-ring bg-white/80 px-3 py-2 text-sm outline-none focus:border-accent"
                            placeholder={t(
                                "Eventos, escenas, NPCs, pistas...",
                                "Events, scenes, NPCs, clues..."
                            )}
                        />
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={saveStory}
                                className="text-xs px-3 py-2 rounded-md border border-accent/60 bg-accent/10 hover:bg-accent/20"
                            >
                                {t("Guardar historia", "Save story")}
                            </button>
                            {storySaved && (
                                <span className="text-xs text-emerald-700">
                                    {t("Guardado", "Saved")}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {activeSection === "bestiary" && (
                    <div className="space-y-3">
                        <h1 className="text-xl font-semibold text-ink">
                            {t("Gestor de bestiario", "Bestiary manager")}
                        </h1>
                        <p className="text-sm text-ink-muted">
                            {t(
                                "Apartado listo para conectar criaturas y encuentros.",
                                "Section ready to connect creatures and encounters."
                            )}
                        </p>
                    </div>
                )}

                {activeSection === "characters" && (
                    <div className="space-y-3">
                        <h1 className="text-xl font-semibold text-ink">
                            {t(
                                "Gestor de personajes de la campana",
                                "Campaign character manager"
                            )}
                        </h1>
                        <p className="text-sm text-ink-muted">
                            {t(
                                "Este apartado queda vacio por ahora.",
                                "This section is intentionally empty for now."
                            )}
                        </p>
                    </div>
                )}
            </section>
            <style jsx global>{`
                .dm-player-preview .space-y-4.min-w-0 > div.border-b.border-ring {
                    margin-bottom: 0.5rem;
                    gap: 0.75rem;
                }
            `}</style>
        </main>
    );
}
