"use client";

import { useParams, useRouter } from "next/navigation";
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type DragEvent,
    type CSSProperties,
} from "react";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useClientLocale } from "@/lib/i18n/useClientLocale";
import { tr } from "@/lib/i18n/translate";
import CharacterView from "../player/ui/CharacterView";
import { CharacterForm } from "../player/ui/CharacterForm";
import { SpellManagerPanel } from "../player/srd/SpellManagerPanel";
import AIAssistantPanel, {
    type AIAssistantClientContext,
} from "../player/ui/AIAssistantPanel";
import { useCharacterForm } from "../player/hooks/useCharacterForm";
import {
    getClassSelectionPalette,
    type Character,
    type Details,
    type Tab,
} from "../player/playerShared";
import StoryManagerPanel from "./StoryManagerPanel";
import BestiaryManagerPanel from "./BestiaryManagerPanel";

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

type TrashConsumeAnimation = {
    characterId: string;
    label: string;
    fromX: number;
    fromY: number;
    dx: number;
    dy: number;
};

export default function CampaignDMPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const locale = useClientLocale();
    const t = (es: string, en: string) => tr(locale, es, en);

    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [activeSection, setActiveSection] = useState<DMSection>("players");
    const activeSectionRef = useRef<DMSection>("players");
    const previousSectionRef = useRef<DMSection>("players");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
    const [playerEditorOpen, setPlayerEditorOpen] = useState(false);
    const [playerPanelMode, setPlayerPanelMode] = useState<PlayerPanelMode>("idle");
    const [playerViewTab, setPlayerViewTab] = useState<Tab>("stats");
    const [assistantOpen, setAssistantOpen] = useState(false);
    const [isOverTrash, setIsOverTrash] = useState(false);
    const [draggedCharacterId, setDraggedCharacterId] = useState<string | null>(null);
    const [dragOverCharacterId, setDragOverCharacterId] = useState<string | null>(null);
    const [consumingCharacterId, setConsumingCharacterId] = useState<string | null>(null);
    const [trashConsumeAnimation, setTrashConsumeAnimation] =
        useState<TrashConsumeAnimation | null>(null);
    const [selectionPulse, setSelectionPulse] = useState(0);
    const [showCompanions, setShowCompanions] = useState(false);
    const [bestiaryRefreshNonce, setBestiaryRefreshNonce] = useState(0);
    const [aiFocusedBestiaryEntryId, setAiFocusedBestiaryEntryId] =
        useState<string | null>(null);

    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [campaignTitle, setCampaignTitle] = useState<string | null>(null);
    const [characters, setCharacters] = useState<Character[]>([]);
    const trashDropRef = useRef<HTMLDivElement | null>(null);
    const characterItemRefs = useRef<Record<string, HTMLLIElement | null>>({});
    const trashDeleteTimerRef = useRef<number | null>(null);

    const { fields: formFields, loadFromCharacter } = useCharacterForm();

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
            es: "Gestor de personajes de la Campaña",
            en: "Campaign character manager",
        },
    ];

    async function loadPanelData(campaignId: string): Promise<Character[]> {
        const [campaignRes, charsRes] = await Promise.all([
            supabase
                .from("campaigns")
                .select("invite_code, name")
                .eq("id", campaignId)
                .maybeSingle(),
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
        setCampaignTitle(campaignRes.data?.name?.trim() || null);
        const list = (charsRes.data ?? []) as Character[];
        const sorted = [...list].sort((a, b) => {
            const ao =
                typeof a.details?.listOrder === "number"
                    ? a.details.listOrder
                    : Number.MAX_SAFE_INTEGER;
            const bo =
                typeof b.details?.listOrder === "number"
                    ? b.details.listOrder
                    : Number.MAX_SAFE_INTEGER;
            if (ao !== bo) return ao - bo;
            const at = new Date((a as any).created_at ?? 0).getTime();
            const bt = new Date((b as any).created_at ?? 0).getTime();
            return at - bt;
        });
        setCharacters(sorted);
        return sorted;
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
        activeSectionRef.current = activeSection;
    }, [activeSection]);

    useEffect(() => {
        const previousSection = previousSectionRef.current;
        const enteringPlayers =
            previousSection !== "players" && activeSection === "players";

        if (!enteringPlayers) {
            previousSectionRef.current = activeSection;
            return;
        }

        if (characters.length === 0) {
            setEditingCharacterId(null);
            setPlayerEditorOpen(false);
            setPlayerPanelMode("idle");
            previousSectionRef.current = activeSection;
            return;
        }

        const firstCharacter =
            characters.find((character) => character.character_type !== "companion") ??
            characters[0];
        if (firstCharacter) {
            setEditingCharacterId(firstCharacter.id);
            setPlayerEditorOpen(true);
            setPlayerPanelMode("view");
        }

        previousSectionRef.current = activeSection;
    }, [activeSection, characters]);

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
            return;
        }

        // Auto-select first character when opening Player Manager with no active selection.
        const firstCharacter =
            characters.find((character) => character.character_type !== "companion") ??
            characters[0];
        if (!firstCharacter) return;

        setEditingCharacterId(firstCharacter.id);
        if (activeSectionRef.current === "players") {
            setPlayerEditorOpen(true);
            setPlayerPanelMode("view");
        }
    }, [characters, editingCharacterId]);

    useEffect(() => {
        return () => {
            if (trashDeleteTimerRef.current !== null) {
                window.clearTimeout(trashDeleteTimerRef.current);
            }
        };
    }, []);

    const editingCharacter =
        characters.find((character) => character.id === editingCharacterId) ?? null;
    const ownerOptions = characters
        .filter((character) => character.character_type !== "companion")
        .map((character) => ({ id: character.id, name: character.name }));
    const playerCharacters = useMemo(
        () =>
            characters.filter(
                (character) => character.character_type !== "companion"
            ),
        [characters]
    );
    const companionCharacters = useMemo(
        () =>
            characters.filter(
                (character) => character.character_type === "companion"
            ),
        [characters]
    );
    const assistantContext: AIAssistantClientContext = useMemo(
        () => ({
            surface: "dm",
            locale,
            section: activeSection,
            panelMode: playerPanelMode,
            activeTab: playerViewTab,
            selectedCharacter: editingCharacter
                ? {
                      id: editingCharacter.id,
                      name: editingCharacter.name,
                      class: editingCharacter.class,
                      race: editingCharacter.race,
                      level: editingCharacter.level,
                      character_type: editingCharacter.character_type ?? "character",
                  }
                : undefined,
            availableActions: [
                "update-any-campaign-character",
                "create-companion-for-player",
                "reorder-character-list",
                "delete-character",
                "create-campaign-bestiary-creature",
                "update-campaign-bestiary-creature",
            ],
            hints: [
                "dm-can-target-any-visible-character",
                "prefer-current-ui-section-when-context-is-ambiguous",
                "dm-can-mutate-campaign-bestiary",
            ],
        }),
        [
            activeSection,
            editingCharacter,
            locale,
            playerPanelMode,
            playerViewTab,
        ]
    );

    function flushEditorSaveIfNeeded() {
        if (activeSection !== "players") return;
        if (playerPanelMode !== "edit") return;
        const form = document.getElementById("character-form") as HTMLFormElement | null;
        form?.requestSubmit();
    }

    function handleOpenCharacterView(id: string) {
        setSelectionPulse((value) => value + 1);
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

    async function handlePlayerDetailsChange(nextDetails: Details) {
        if (!editingCharacter) return;
        const characterId = editingCharacter.id;
        const campaignId = String(params.id);

        setCharacters((prev) =>
            prev.map((character) =>
                character.id === characterId
                    ? { ...character, details: nextDetails }
                    : character
            )
        );

        const { data, error: updateError } = await supabase
            .from("characters")
            .update({ details: nextDetails })
            .eq("id", characterId)
            .eq("campaign_id", campaignId)
            .select("id")
            .maybeSingle();

        if (updateError || !data?.id) {
            console.error("handlePlayerDetailsChange:", updateError);
            setError(
                t(
                    "No se pudieron guardar los cambios del personaje.",
                    "Could not persist character changes."
                )
            );
            void loadPanelData(campaignId);
        }
    }

    async function persistCharactersOrder(nextCharacters: Character[]) {
        try {
            await Promise.all(
                nextCharacters.map((character, index) =>
                    supabase
                        .from("characters")
                        .update({
                            details: {
                                ...(character.details ?? {}),
                                listOrder: index,
                            },
                        })
                        .eq("id", character.id)
                        .eq("campaign_id", params.id)
                )
            );
        } catch (err) {
            console.error("Error guardando orden de personajes en DM:", err);
        }
    }

    function reorderCharacters(list: Character[], sourceId: string, targetId: string) {
        const sourceCharacter = list.find((character) => character.id === sourceId);
        const targetCharacter = list.find((character) => character.id === targetId);
        if (!sourceCharacter || !targetCharacter || sourceId === targetId) return list;

        const sourceIsCompanion = sourceCharacter.character_type === "companion";
        const targetIsCompanion = targetCharacter.character_type === "companion";
        if (sourceIsCompanion !== targetIsCompanion) return list;

        const sameGroup = list.filter(
            (character) =>
                (character.character_type === "companion") === sourceIsCompanion
        );
        const sourceIndex = sameGroup.findIndex((character) => character.id === sourceId);
        const targetIndex = sameGroup.findIndex((character) => character.id === targetId);
        if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
            return list;
        }

        const reorderedGroup = [...sameGroup];
        const [moved] = reorderedGroup.splice(sourceIndex, 1);
        reorderedGroup.splice(targetIndex, 0, moved);

        let groupCursor = 0;
        const merged = list.map((character) => {
            const belongsToGroup =
                (character.character_type === "companion") === sourceIsCompanion;
            if (!belongsToGroup) return character;
            const replacement = reorderedGroup[groupCursor];
            groupCursor += 1;
            return replacement;
        });

        return merged.map((character, index) => ({
            ...character,
            details: {
                ...(character.details ?? {}),
                listOrder: index,
            },
        }));
    }

    function handleDragStartCharacter(event: DragEvent, characterId: string) {
        setDraggedCharacterId(characterId);
        setIsOverTrash(false);
        try {
            const payload = JSON.stringify({ type: "character", id: characterId });
            event.dataTransfer.setData("application/x-dnd-manager-item", payload);
            event.dataTransfer.effectAllowed = "move";
        } catch {
            // ignore
        }
    }

    function handleDragOverCharacter(event: DragEvent, characterId: string) {
        event.preventDefault();
        if (!draggedCharacterId || draggedCharacterId === characterId) return;
        const sourceCharacter = characters.find(
            (character) => character.id === draggedCharacterId
        );
        const targetCharacter = characters.find(
            (character) => character.id === characterId
        );
        if (!sourceCharacter || !targetCharacter) return;
        const sameGroup =
            (sourceCharacter.character_type === "companion") ===
            (targetCharacter.character_type === "companion");
        if (!sameGroup) return;
        setDragOverCharacterId(characterId);
        event.dataTransfer.dropEffect = "move";
    }

    function handleDropOnCharacter(event: DragEvent, targetCharacterId: string) {
        event.preventDefault();
        setDragOverCharacterId(null);
        const raw = event.dataTransfer.getData("application/x-dnd-manager-item");
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw) as { type?: string; id?: string };
            if (parsed?.type !== "character" || !parsed.id || parsed.id === targetCharacterId) {
                return;
            }

            setCharacters((prev) => {
                const sourceCharacter = prev.find((character) => character.id === parsed.id);
                const targetCharacter = prev.find(
                    (character) => character.id === targetCharacterId
                );
                if (!sourceCharacter || !targetCharacter) return prev;
                const sameGroup =
                    (sourceCharacter.character_type === "companion") ===
                    (targetCharacter.character_type === "companion");
                if (!sameGroup) return prev;

                const next = reorderCharacters(prev, parsed.id as string, targetCharacterId);
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
        setIsOverTrash(false);
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

    function renderCharacterListItem(
        character: Character,
        showCompanionBadge = false
    ) {
        const isSelected = playerEditorOpen && editingCharacterId === character.id;
        const selectedStyle = isSelected ? getSelectionBlobStyle(character.class) : undefined;

        return (
            <li
                key={character.id}
                ref={(node) => {
                    characterItemRefs.current[character.id] = node;
                }}
                onClick={() => handleOpenCharacterView(character.id)}
                style={selectedStyle}
                draggable={consumingCharacterId !== character.id}
                onDragStart={(event) =>
                    handleDragStartCharacter(event, character.id)
                }
                onDragOver={(event) =>
                    handleDragOverCharacter(event, character.id)
                }
                onDrop={(event) =>
                    handleDropOnCharacter(event, character.id)
                }
                onDragEnd={handleDragEndCharacter}
                className={`relative isolate overflow-hidden border rounded-md px-3 py-2 cursor-pointer transition-[border-color,box-shadow,background-color] ${
                    dragOverCharacterId === character.id
                        ? "ring-2 ring-accent/45"
                        : ""
                } ${
                    isSelected
                        ? "border-transparent"
                        : "border-ring bg-white/70 hover:bg-white"
                } ${
                    consumingCharacterId === character.id
                        ? "character-trash-consuming"
                        : ""
                }`}
            >
                {isSelected && selectionPulse > 0 && (
                    <span
                        key={`selection-blob-${character.id}-${selectionPulse}`}
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
                <div className="relative z-10 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="font-medium text-ink truncate">
                                {character.name}
                            </p>
                            {showCompanionBadge && (
                                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-400/60 text-emerald-700 bg-emerald-50">
                                    {t("Compañero", "Companion")}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-ink-muted truncate">
                            {(character.class ?? t("Sin clase", "No class"))} -{" "}
                            {t("Nivel", "Level")} {character.level ?? 1}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            handleEditCharacter(character);
                        }}
                        className="text-[11px] px-2 py-1 rounded-md border border-accent/60 bg-accent/10 hover:bg-accent/20 shrink-0"
                    >
                        {t("Editar", "Edit")}
                    </button>
                </div>
            </li>
        );
    }

    function handleTrashDragOver(event: DragEvent) {
        event.preventDefault();
        setIsOverTrash(true);
        event.dataTransfer.dropEffect = "move";
    }

    function handleTrashDragLeave() {
        setIsOverTrash(false);
        setDragOverCharacterId(null);
    }

    function handleTrashDrop(event: DragEvent) {
        event.preventDefault();
        setIsOverTrash(false);
        setDragOverCharacterId(null);
        setDraggedCharacterId(null);

        const raw = event.dataTransfer.getData("application/x-dnd-manager-item");
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw) as { type?: string; id?: string };
            if (parsed?.type !== "character" || !parsed.id) return;
            const character = characters.find((entry) => entry.id === parsed.id);
            if (!character) return;

            const sourceRect =
                characterItemRefs.current[character.id]?.getBoundingClientRect();
            const targetRect = trashDropRef.current?.getBoundingClientRect();
            if (sourceRect && targetRect) {
                const fromX = sourceRect.left + sourceRect.width / 2;
                const fromY = sourceRect.top + sourceRect.height / 2;
                const toX = targetRect.left + targetRect.width / 2;
                const toY = targetRect.top + targetRect.height / 2;
                setTrashConsumeAnimation({
                    characterId: character.id,
                    label: character.name,
                    fromX,
                    fromY,
                    dx: toX - fromX,
                    dy: toY - fromY,
                });
            } else {
                setTrashConsumeAnimation(null);
            }

            setConsumingCharacterId(character.id);
            if (trashDeleteTimerRef.current !== null) {
                window.clearTimeout(trashDeleteTimerRef.current);
            }
            trashDeleteTimerRef.current = window.setTimeout(() => {
                void (async () => {
                    setTrashConsumeAnimation((current) =>
                        current?.characterId === character.id ? null : current
                    );
                    await handleDeleteCharacter(character);
                    setConsumingCharacterId((current) =>
                        current === character.id ? null : current
                    );
                    trashDeleteTimerRef.current = null;
                })();
            }, 340);
        } catch {
            // ignore
        }
    }

    function isMissingRpcFunction(error: any) {
        const code = String(error?.code ?? "");
        const message = String(error?.message ?? "").toLowerCase();
        const details = String(error?.details ?? "").toLowerCase();
        const hint = String(error?.hint ?? "").toLowerCase();
        return (
            code === "42883" ||
            code === "PGRST202" ||
            message.includes("does not exist") ||
            message.includes("could not find the function") ||
            message.includes("schema cache") ||
            details.includes("schema cache") ||
            hint.includes("schema cache")
        );
    }

    async function deleteCharacterViaServer(characterId: string, campaignId: string) {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) return null;

        const response = await fetch(
            `/api/dnd/campaigns/${campaignId}/characters/${characterId}/delete`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const payload = await response.json().catch(() => null);
        if (response.status === 404) {
            return null;
        }
        if (!response.ok) {
            throw new Error(
                String(
                    payload?.error ??
                        payload?.message ??
                        t(
                            "No se ha podido eliminar el personaje.",
                            "Could not delete character."
                        )
                )
            );
        }
        return payload?.deleted === true;
    }

    async function deleteCharacterLegacy(characterId: string, campaignId: string) {
        const tablesWithCharacterFk = [
            "character_stats",
            "character_spells",
            "character_weapons",
            "character_armors",
            "character_equipments",
        ];

        for (const tableName of tablesWithCharacterFk) {
            const { error: childDeleteError } = await supabase
                .from(tableName)
                .delete()
                .eq("character_id", characterId);
            if (childDeleteError) {
                throw childDeleteError;
            }
        }

        const { error: characterDeleteError } = await supabase
            .from("characters")
            .delete()
            .eq("id", characterId)
            .eq("campaign_id", campaignId);
        if (characterDeleteError) {
            throw characterDeleteError;
        }
    }

    async function handleDeleteCharacter(character: Character) {
        const confirmed = window.confirm(
            t(
                `Eliminar a ${character.name}? Esta acción no se puede deshacer.`,
                `Delete ${character.name}? This action cannot be undone.`
            )
        );
        if (!confirmed) return;

        setError(null);
        try {
            const characterId = character.id;
            const campaignId = String(params.id);

            const deletedViaServer = await deleteCharacterViaServer(characterId, campaignId);
            if (deletedViaServer === false) {
                throw new Error(
                    t(
                        "No se pudo eliminar en base de datos (revisa permisos/RLS).",
                        "Could not delete from database (check permissions/RLS)."
                    )
                );
            }
            if (deletedViaServer === true) {
                const refreshed = await loadPanelData(campaignId);
                const stillExists = refreshed.some((entry) => entry.id === characterId);
                if (stillExists) {
                    throw new Error(
                        t(
                            "No se pudo eliminar en base de datos (revisa permisos/RLS).",
                            "Could not delete from database (check permissions/RLS)."
                        )
                    );
                }
                if (editingCharacterId === characterId) {
                    setEditingCharacterId(null);
                    setPlayerEditorOpen(false);
                    setPlayerPanelMode("idle");
                }
                return;
            }

            const { data: rpcDeletedRaw, error: rpcDeleteError } = await supabase.rpc(
                "dnd_manager_dm_delete_character",
                {
                    _campaign_id: campaignId,
                    _character_id: characterId,
                }
            );

            if (rpcDeleteError) {
                if (isMissingRpcFunction(rpcDeleteError)) {
                    await deleteCharacterLegacy(characterId, campaignId);
                } else {
                    throw rpcDeleteError;
                }
            } else {
                const rpcDeleted =
                    rpcDeletedRaw === true || rpcDeletedRaw === "true" || rpcDeletedRaw === 1;
                if (!rpcDeleted) {
                    throw new Error(
                        t(
                            "No se pudo eliminar en base de datos (revisa permisos/RLS).",
                            "Could not delete from database (check permissions/RLS)."
                        )
                    );
                }
            }

            const refreshed = await loadPanelData(campaignId);
            const stillExists = refreshed.some((entry) => entry.id === characterId);
            if (stillExists) {
                throw new Error(
                    t(
                        "No se pudo eliminar en base de datos (revisa permisos/RLS).",
                        "Could not delete from database (check permissions/RLS)."
                    )
                );
            }

            if (editingCharacterId === characterId) {
                setEditingCharacterId(null);
                setPlayerEditorOpen(false);
                setPlayerPanelMode("idle");
            }
        } catch (err: any) {
            console.error("handleDeleteCharacter:", {
                code: err?.code,
                message: err?.message,
                details: err?.details,
                hint: err?.hint,
                raw: err,
            });
            setError(
                err?.message ??
                    err?.details ??
                    t(
                        "No se ha podido eliminar el personaje.",
                        "Could not delete character."
                    )
            );
        }
    }

    if (loading || !allowed) {
        return (
            <main className="min-h-screen bg-surface text-ink flex items-center justify-center">
                <p className="text-ink-muted">{t("Cargando panel DM...", "Loading DM panel...")}</p>
            </main>
        );
    }

    const trashIsOpen = isOverTrash || consumingCharacterId !== null;
    const trashIsActive = draggedCharacterId !== null || consumingCharacterId !== null;

    return (
        <main className="relative h-screen bg-surface text-ink flex overflow-hidden">
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
            {trashConsumeAnimation && (
                <div className="pointer-events-none fixed inset-0 z-[120]">
                    <div
                        className="trash-consume-chip"
                        style={{
                            left: `${trashConsumeAnimation.fromX}px`,
                            top: `${trashConsumeAnimation.fromY}px`,
                            ["--trash-dx" as string]: `${trashConsumeAnimation.dx}px`,
                            ["--trash-dy" as string]: `${trashConsumeAnimation.dy}px`,
                        }}
                    >
                        <span className="truncate max-w-[12rem]">
                            {trashConsumeAnimation.label}
                        </span>
                    </div>
                </div>
            )}
            <aside
                className={`relative z-10 h-full overflow-y-auto overflow-x-hidden styled-scrollbar border-r border-ring rounded-r-3xl bg-panel/90 p-4 space-y-3 transition-[width,box-shadow,background-color] duration-300 ease-in-out motion-reduce:transition-none ${
                    sidebarOpen ? "w-72 shadow-[0_18px_50px_rgba(45,29,12,0.18)]" : "w-16 shadow-none"
                }`}
            >
                <div className="flex items-start justify-between gap-2">
                    <div
                        className={`space-y-1 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
                            sidebarOpen
                                ? "max-w-[14rem] translate-x-0 opacity-100"
                                : "pointer-events-none max-w-0 -translate-x-2 opacity-0"
                        }`}
                    >
                        <h2 className="text-lg font-semibold text-ink">
                            {t("Panel de master", "Master panel")}
                        </h2>
                        <p className="text-xs text-ink-muted">
                            {campaignTitle || t("Campaña sin título", "Untitled campaign")}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setSidebarOpen((prev) => !prev)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-ring bg-white/70 text-sm transition-colors duration-200 hover:bg-white md:hidden"
                        title={t("Desplegar panel", "Toggle panel")}
                        aria-label={t("Desplegar panel", "Toggle panel")}
                    >
                        <span className="inline-flex transition-transform duration-300 ease-out motion-reduce:transition-none">
                            {sidebarOpen ? (
                                <ChevronLeft className="h-4 w-4 text-ink" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-ink" />
                            )}
                        </span>
                    </button>
                </div>

                {inviteCode && (
                    <div
                        className={`overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
                            sidebarOpen
                                ? "max-h-20 translate-y-0 opacity-100"
                                : "pointer-events-none max-h-0 -translate-y-1 opacity-0"
                        }`}
                    >
                        <button
                            type="button"
                            onClick={() => void navigator.clipboard.writeText(inviteCode)}
                            className="w-full text-left rounded-md border border-ring bg-white/70 px-3 py-2 text-xs hover:bg-white"
                        >
                            {t("Copiar codigo", "Copy code")}:{" "}
                            <span className="font-mono">{inviteCode}</span>
                        </button>
                    </div>
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
                                        className={`flex items-center rounded-md px-2 py-2 text-sm transition-[background-color,color,gap] duration-200 ${
                                            sidebarOpen ? "gap-2" : "justify-center gap-0"
                                        } ${
                                            selected
                                                ? "bg-accent/10 text-ink"
                                                : "text-ink-muted hover:bg-white/60 hover:text-ink"
                                        }`}
                                        aria-current={selected ? "page" : undefined}
                                        title={t(entry.es, entry.en)}
                                    >
                                        <span className="w-5 text-center">{entry.icon}</span>
                                        <span
                                            className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform,margin] duration-300 ease-out motion-reduce:transition-none ${
                                                sidebarOpen
                                                    ? "ml-0.5 max-w-[12rem] translate-x-0 opacity-100"
                                                    : "max-w-0 -translate-x-2 opacity-0"
                                            }`}
                                        >
                                            {t(entry.es, entry.en)}
                                        </span>
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

            </aside>

            <button
                type="button"
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="hidden md:flex absolute top-4 z-30 rounded-full p-2 shadow-sm transition-[left,transform,background-color] duration-300 ease-in-out bg-panel border border-ring hover:bg-white"
                style={{
                    left: sidebarOpen ? "calc(18rem - 18px)" : "calc(4rem - 18px)",
                }}
                aria-label={
                    sidebarOpen
                        ? t("Cerrar panel lateral", "Close sidebar")
                        : t("Abrir panel lateral", "Open sidebar")
                }
                title={
                    sidebarOpen
                        ? t("Cerrar panel", "Close sidebar")
                        : t("Abrir panel", "Open sidebar")
                }
            >
                {sidebarOpen ? (
                    <ChevronLeft className="h-4 w-4 text-ink" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-ink" />
                )}
            </button>

            <section
                className={`flex-1 min-h-0 ${
                    activeSection === "story"
                        ? "pl-0 pr-6 py-6 flex flex-col gap-4 overflow-hidden"
                        : activeSection === "bestiary"
                            ? "p-6 flex flex-col gap-4 overflow-hidden"
                            : activeSection === "players"
                                ? "px-6 pt-6 pb-2 space-y-4 overflow-hidden flex flex-col"
                            : "p-6 space-y-4 overflow-y-auto styled-scrollbar"
                }`}
            >
                <div className="flex items-center justify-end">
                    <button
                        type="button"
                        onClick={() =>
                            router.push(`/campaigns/${String(params.id)}/settings?from=dm`)
                        }
                        className="settings-nav-button inline-flex items-center gap-2 rounded-md border border-ring bg-white/70 px-3 py-1.5 text-[11px] text-ink hover:bg-white"
                        aria-label={t("Abrir ajustes", "Open settings")}
                        title={t("Ajustes", "Settings")}
                    >
                        <Settings className="settings-button-icon h-3.5 w-3.5 text-ink" />
                        <span className="hidden sm:inline">{t("Ajustes", "Settings")}</span>
                    </button>
                </div>

                {error && (
                    <p className="text-sm text-red-700 bg-red-100 border border-red-200 rounded-md px-3 py-2">
                        {error}
                    </p>
                )}

                {activeSection === "players" && (
                    <div className="space-y-3 min-h-0 flex flex-col">
                        <h1 className="text-xl font-semibold text-ink">
                            {t("Gestor de jugadores", "Player manager")}
                        </h1>
                        <p className="hint-copy text-sm text-ink-muted">
                            {t(
                                "Aquí aparecen los personajes de jugadores en la Campaña.",
                                "This section shows player characters in the campaign."
                            )}
                        </p>

                        <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-4 items-stretch min-h-0 flex-1">
                            <div className="max-h-[calc(100vh-10.5rem)] min-h-[460px]">
                                <div className="h-full overflow-y-auto styled-scrollbar pr-1">
                                    <div className="border border-ring rounded-xl bg-panel/80 p-3 space-y-3">
                                    {playerCharacters.length === 0 &&
                                    companionCharacters.length === 0 ? (
                                        <p className="text-sm text-ink-muted">
                                            {t(
                                                "No hay personajes en la Campaña.",
                                                "No characters in this campaign."
                                            )}
                                        </p>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <p className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                                                    {t("Personajes", "Characters")}
                                                </p>
                                                {playerCharacters.length === 0 ? (
                                                    <p className="text-sm text-ink-muted">
                                                        {t(
                                                            "No hay personajes de jugador.",
                                                            "No player characters."
                                                        )}
                                                    </p>
                                                ) : (
                                                    <ul className="space-y-2">
                                                        {playerCharacters.map((character) =>
                                                            renderCharacterListItem(character)
                                                        )}
                                                    </ul>
                                                )}
                                            </div>

                                            <div className="border-t border-ring/60 pt-3 space-y-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowCompanions((prev) => !prev)
                                                    }
                                                    className="w-full flex items-center justify-between rounded-md border border-ring bg-white/70 px-3 py-2 text-xs text-ink hover:bg-white"
                                                >
                                                    <span className="font-semibold uppercase tracking-[0.2em] text-ink-muted">
                                                        {t("Compañeros", "Companions")} (
                                                        {companionCharacters.length})
                                                    </span>
                                                    <span>
                                                        {showCompanions
                                                            ? t("Ocultar", "Hide")
                                                            : t("Mostrar", "Show")}
                                                    </span>
                                                </button>

                                                {showCompanions &&
                                                    (companionCharacters.length === 0 ? (
                                                        <p className="text-sm text-ink-muted">
                                                            {t(
                                                                "No hay compañeros creados.",
                                                                "No companions created."
                                                            )}
                                                        </p>
                                                    ) : (
                                                        <ul className="space-y-2">
                                                            {companionCharacters.map((character) =>
                                                                renderCharacterListItem(
                                                                    character,
                                                                    true
                                                                )
                                                            )}
                                                        </ul>
                                                    ))}
                                            </div>
                                        </>
                                    )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 min-h-0">
                                <div className="dm-player-preview border border-ring rounded-xl bg-panel/80 min-h-[460px] max-h-[calc(100vh-10.5rem)] flex flex-col overflow-hidden">
                                    <div className="min-h-0 flex-1 overflow-y-auto styled-scrollbar">
                                        {playerEditorOpen &&
                                        editingCharacter &&
                                        playerPanelMode === "edit" ? (
                                            <div className="p-3 pt-4">
                                                <CharacterForm
                                                    key={`dm-edit-${editingCharacter.id}`}
                                                    mode="edit"
                                                    autoSave
                                                    autoSaveDelayMs={10000}
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
                                        ) : playerEditorOpen &&
                                          editingCharacter &&
                                          playerPanelMode === "view" ? (
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
                                            <div className="hint-copy p-4 text-sm text-ink-muted">
                                                {t(
                                                    "Selecciona un jugador y pulsa Editar para abrir su vista.",
                                                    "Select a player and click Edit to open their view."
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-auto xl:w-[340px]">
                            <div className="border border-ring rounded-xl bg-panel/80 p-3">
                                <div
                                    ref={trashDropRef}
                                    onDragOver={handleTrashDragOver}
                                    onDragLeave={handleTrashDragLeave}
                                    onDrop={handleTrashDrop}
                                    title={t(
                                        "Arrastra un personaje aquí para eliminarlo",
                                        "Drag a character here to delete"
                                    )}
                                    aria-label={t(
                                        "Arrastra un personaje aquí para eliminarlo",
                                        "Drag a character here to delete"
                                    )}
                                    className={`rounded-md p-3 border-2 min-h-16 flex items-center justify-center transition-colors ${
                                        isOverTrash
                                            ? "border-red-500 bg-red-500/10"
                                            : "border-red-300/60 bg-white/60"
                                    } ${trashIsActive ? "shadow-[inset_0_0_0_1px_rgba(220,38,38,0.14)]" : ""}`}
                                >
                                    <span
                                        aria-hidden
                                        className={`trash-drop-icon ${
                                            trashIsOpen ? "is-open" : ""
                                        } ${consumingCharacterId ? "is-consuming" : ""}`}
                                    >
                                        <svg
                                            viewBox="0 0 64 64"
                                            className="trash-drop-icon__svg"
                                            role="presentation"
                                        >
                                            <g className="trash-drop-icon__lid-group">
                                                <rect
                                                    className="trash-drop-icon__handle"
                                                    x="26"
                                                    y="13"
                                                    width="14"
                                                    height="3"
                                                    rx="1"
                                                />
                                                <rect
                                                    className="trash-drop-icon__lid"
                                                    x="15"
                                                    y="18"
                                                    width="34"
                                                    height="4"
                                                    rx="1.5"
                                                />
                                            </g>
                                            <g className="trash-drop-icon__body-group">
                                                <path
                                                    className="trash-drop-icon__body"
                                                    d="M18 24 H46 V48 C46 52.4 42.4 56 38 56 H26 C21.6 56 18 52.4 18 48 Z"
                                                />
                                                <line
                                                    className="trash-drop-icon__slat"
                                                    x1="26"
                                                    y1="30"
                                                    x2="26"
                                                    y2="49"
                                                />
                                                <line
                                                    className="trash-drop-icon__slat"
                                                    x1="32"
                                                    y1="30"
                                                    x2="32"
                                                    y2="49"
                                                />
                                                <line
                                                    className="trash-drop-icon__slat"
                                                    x1="38"
                                                    y1="30"
                                                    x2="38"
                                                    y2="49"
                                                />
                                            </g>
                                        </svg>
                                    </span>
                                    <span className="sr-only">
                                        {t(
                                            "Arrastra un personaje aquí para eliminarlo",
                                            "Drag a character here to delete"
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === "story" && (
                    <div className="min-h-0 flex-1 overflow-hidden">
                        <StoryManagerPanel campaignId={String(params.id)} locale={locale} />
                    </div>
                )}

                {activeSection === "bestiary" && (
                    <div className="min-h-0 flex-1 overflow-hidden">
                        <BestiaryManagerPanel
                            campaignId={String(params.id)}
                            locale={locale}
                            refreshNonce={bestiaryRefreshNonce}
                            focusEntryId={aiFocusedBestiaryEntryId}
                        />
                    </div>
                )}

                {activeSection === "characters" && (
                    <div className="space-y-3">
                        <h1 className="text-xl font-semibold text-ink">
                            {t(
                                "Gestor de personajes de la Campaña",
                                "Campaign character manager"
                            )}
                        </h1>
                        <p className="hint-copy text-sm text-ink-muted">
                            {t(
                                "Este apartado queda vacío por ahora.",
                                "This section is intentionally empty for now."
                            )}
                        </p>
                    </div>
                )}
            </section>
            <style jsx global>{`
                .styled-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(178, 126, 74, 0.9) rgba(96, 72, 47, 0.16);
                }

                .styled-scrollbar::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }

                .styled-scrollbar::-webkit-scrollbar-track {
                    background: linear-gradient(
                        180deg,
                        rgba(137, 104, 69, 0.12),
                        rgba(93, 69, 44, 0.2)
                    );
                    border: 1px solid rgba(126, 94, 60, 0.24);
                    border-radius: 9999px;
                }

                .styled-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(
                        180deg,
                        rgba(214, 170, 112, 0.95),
                        rgba(165, 114, 64, 0.92)
                    );
                    border: 2px solid rgba(62, 45, 29, 0.28);
                    border-radius: 9999px;
                }

                .styled-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(
                        180deg,
                        rgba(229, 187, 130, 0.98),
                        rgba(184, 128, 74, 0.96)
                    );
                }

                .styled-scrollbar::-webkit-scrollbar-corner {
                    background: transparent;
                }

                .dm-player-preview .space-y-4.min-w-0 > div.border-b.border-ring {
                    margin-bottom: 0.5rem;
                    gap: 0.75rem;
                }

                .character-trash-consuming {
                    pointer-events: none;
                    animation: dm-character-trash-consume 340ms ease-in forwards;
                }

                .trash-drop-icon {
                    position: relative;
                    width: 44px;
                    height: 44px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    filter: drop-shadow(0 4px 10px rgba(127, 29, 29, 0.2));
                    transition: transform 220ms ease, filter 220ms ease;
                }

                .trash-drop-icon__svg {
                    width: 100%;
                    height: 100%;
                    overflow: visible;
                }

                .trash-drop-icon__lid-group {
                    transform-origin: 18px 20px;
                    transition: transform 220ms ease;
                }

                .trash-drop-icon__body-group {
                    transform-origin: 32px 40px;
                }

                .trash-drop-icon__handle {
                    fill: rgba(254, 226, 226, 0.98);
                    stroke: rgba(127, 29, 29, 0.84);
                    stroke-width: 1.4;
                }

                .trash-drop-icon__lid {
                    fill: rgba(185, 28, 28, 0.94);
                    stroke: rgba(127, 29, 29, 0.9);
                    stroke-width: 1.5;
                }

                .trash-drop-icon__body {
                    fill: rgba(254, 226, 226, 0.98);
                    stroke: rgba(127, 29, 29, 0.9);
                    stroke-width: 2;
                }

                .trash-drop-icon__slat {
                    stroke: rgba(185, 28, 28, 0.88);
                    stroke-width: 1.9;
                    stroke-linecap: round;
                }

                .trash-drop-icon.is-open {
                    transform: scale(1.04);
                    filter: drop-shadow(0 6px 14px rgba(127, 29, 29, 0.26));
                }

                .trash-drop-icon.is-open .trash-drop-icon__lid-group {
                    transform: rotate(-32deg) translate(-3px, -2px);
                }

                .trash-drop-icon.is-consuming .trash-drop-icon__body-group {
                    animation: dm-trash-body-wobble 260ms ease-in-out infinite;
                }

                .trash-drop-icon.is-consuming .trash-drop-icon__lid-group {
                    animation: dm-trash-lid-flutter 240ms ease-in-out infinite;
                }

                .trash-consume-chip {
                    position: fixed;
                    transform: translate(-50%, -50%);
                    border-radius: 9999px;
                    padding: 0.35rem 0.65rem;
                    font-size: 0.72rem;
                    line-height: 1rem;
                    color: rgb(127 29 29);
                    border: 1px solid rgba(220, 38, 38, 0.45);
                    background: rgba(254, 226, 226, 0.95);
                    box-shadow: 0 10px 18px rgba(185, 28, 28, 0.24);
                    animation: dm-trash-fly 340ms cubic-bezier(0.18, 0.82, 0.26, 1) forwards;
                }

                @keyframes dm-trash-fly {
                    0% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    75% {
                        opacity: 0.88;
                        transform: translate(
                                calc(-50% + var(--trash-dx)),
                                calc(-50% + var(--trash-dy))
                            )
                            scale(0.42);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(
                                calc(-50% + var(--trash-dx)),
                                calc(-50% + var(--trash-dy))
                            )
                            scale(0.12);
                    }
                }

                @keyframes dm-character-trash-consume {
                    0% {
                        opacity: 1;
                        transform: scale(1);
                        filter: blur(0);
                    }
                    100% {
                        opacity: 0.08;
                        transform: scale(0.74);
                        filter: blur(1px);
                    }
                }

                @keyframes dm-trash-body-wobble {
                    0%,
                    100% {
                        transform: rotate(0deg) scale(1);
                    }
                    25% {
                        transform: rotate(-2deg) scale(1.02);
                    }
                    75% {
                        transform: rotate(2deg) scale(1.02);
                    }
                }

                @keyframes dm-trash-lid-flutter {
                    0%,
                    100% {
                        transform: rotate(-30deg) translate(-3px, -2px);
                    }
                    50% {
                        transform: rotate(-38deg) translate(-5px, -4px);
                    }
                }
            `}</style>
            <AIAssistantPanel
                open={assistantOpen}
                onOpenChange={setAssistantOpen}
                campaignId={String(params.id)}
                locale={locale}
                selectedCharacterId={editingCharacter?.id ?? null}
                selectedCharacterName={editingCharacter?.name ?? null}
                assistantContext={assistantContext}
                onApplied={async (context) => {
                    const appliedBestiaryResult = context?.results?.find(
                        (entry) =>
                            entry.status === "applied" &&
                            typeof entry.bestiaryEntryId === "string" &&
                            entry.bestiaryEntryId.length > 0
                    );
                    if (appliedBestiaryResult?.bestiaryEntryId) {
                        setAiFocusedBestiaryEntryId(appliedBestiaryResult.bestiaryEntryId);
                    }
                    setBestiaryRefreshNonce((value) => value + 1);
                    const refreshed = await loadPanelData(String(params.id));
                    if (playerPanelMode !== "edit") return;
                    if (!editingCharacterId) return;

                    const freshCharacter = refreshed.find(
                        (entry) => entry.id === editingCharacterId
                    );
                    if (!freshCharacter) return;
                    loadFromCharacter(freshCharacter);
                }}
            />
        </main>
    );
}




