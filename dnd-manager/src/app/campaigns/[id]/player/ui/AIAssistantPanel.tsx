"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, X, SendHorizontal, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { tr } from "@/lib/i18n/translate";

type MutationResult = {
    operation: "create" | "update";
    characterId?: string;
    status: "applied" | "blocked" | "skipped" | "error";
    message: string;
};

type ProposedAction = {
    operation: "create" | "update";
    characterId?: string;
    note?: string;
    data?: Record<string, unknown>;
};

type AssistantPayload = {
    reply?: string;
    results?: MutationResult[];
    proposedActions?: unknown;
    error?: string;
};

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    text: string;
    results?: MutationResult[];
    proposedActions?: ProposedAction[];
};

type PendingPlan = {
    prompt: string;
    targetCharacterId?: string;
    proposedActions: ProposedAction[];
    previewReply?: string;
};

export type AIAssistantClientContext = {
    surface?: "player" | "dm";
    locale?: string;
    section?: string;
    panelMode?: string;
    activeTab?: string;
    selectedCharacter?: {
        id?: string | null;
        name?: string | null;
        class?: string | null;
        race?: string | null;
        level?: number | null;
        character_type?: "character" | "companion" | null;
    };
    availableActions?: string[];
    hints?: string[];
};

type AIAssistantPanelProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    campaignId: string;
    locale: string;
    selectedCharacterId?: string | null;
    selectedCharacterName?: string | null;
    assistantContext?: AIAssistantClientContext;
    onApplied?: () => Promise<void> | void;
};

type TranslateFn = (es: string, en: string) => string;

function statusClass(status: MutationResult["status"]) {
    if (status === "applied") return "border-emerald-300/60 bg-emerald-50 text-emerald-700";
    if (status === "blocked") return "border-amber-300/60 bg-amber-50 text-amber-700";
    if (status === "error") return "border-red-300/60 bg-red-50 text-red-700";
    return "border-slate-300/60 bg-slate-50 text-slate-700";
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function asString(value: unknown, maxLen = 240): string | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen)}...` : trimmed;
}

function asNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
    return typeof value === "boolean" ? value : undefined;
}

function asStringArray(value: unknown, maxItems = 6, maxLen = 80): string[] {
    if (!Array.isArray(value)) return [];
    const out: string[] = [];
    for (const entry of value) {
        const parsed = asString(entry, maxLen);
        if (!parsed) continue;
        out.push(parsed);
        if (out.length >= maxItems) break;
    }
    return out;
}

function formatDetailKey(key: string, t: TranslateFn) {
    const labels: Record<string, string> = {
        notes: t("Notas", "Notes"),
        background: t("Trasfondo", "Background"),
        alignment: t("Alineamiento", "Alignment"),
        personalityTraits: t("Rasgos", "Personality traits"),
        ideals: t("Ideales", "Ideals"),
        bonds: t("Vínculos", "Bonds"),
        flaws: t("Defectos", "Flaws"),
        appearance: t("Apariencia", "Appearance"),
        backstory: t("Historia", "Backstory"),
        languages: t("Idiomas", "Languages"),
        proficiencies: t("Competencias", "Proficiencies"),
        abilities: t("Habilidades", "Abilities"),
        inventory: t("Inventario", "Inventory"),
        equipment: t("Equipo", "Equipment"),
    };
    return labels[key] ?? key;
}

function boolLabel(value: boolean | undefined, t: TranslateFn) {
    if (value === undefined) return undefined;
    return value ? t("Sí", "Yes") : t("No", "No");
}

function ProposedActionPreview({
    action,
    t,
}: {
    action: ProposedAction;
    t: TranslateFn;
}) {
    const data = isRecord(action.data) ? action.data : undefined;
    const sections: Array<{ title: string; lines: string[] }> = [];

    if (data) {
        const mainLines: string[] = [];
        const coreFields: Array<[keyof typeof data, string, string]> = [
            ["name", "Nombre", "Name"],
            ["class", "Clase", "Class"],
            ["race", "Raza", "Race"],
            ["level", "Nivel", "Level"],
            ["experience", "XP", "XP"],
            ["current_hp", "PV actuales", "Current HP"],
            ["max_hp", "PV máximos", "Max HP"],
            ["armor_class", "CA", "AC"],
            ["speed", "Velocidad", "Speed"],
            ["character_type", "Tipo", "Type"],
            ["user_id", "Owner", "Owner"],
        ];
        for (const [key, es, en] of coreFields) {
            const value = data[key];
            const stringValue = asString(value, 90);
            const numberValue = asNumber(value);
            if (stringValue) {
                mainLines.push(`${t(es, en)}: ${stringValue}`);
            } else if (typeof numberValue === "number") {
                mainLines.push(`${t(es, en)}: ${numberValue}`);
            }
        }
        if (mainLines.length > 0) {
            sections.push({
                title: t("Cambios principales", "Main changes"),
                lines: mainLines,
            });
        }

        const stats = isRecord(data.stats) ? data.stats : null;
        if (stats) {
            const entries = ["str", "dex", "con", "int", "wis", "cha"]
                .map((key) => {
                    const value = asNumber(stats[key]);
                    return typeof value === "number" ? `${key.toUpperCase()} ${value}` : null;
                })
                .filter((entry): entry is string => !!entry);
            if (entries.length > 0) {
                sections.push({
                    title: t("Stats", "Stats"),
                    lines: [entries.join(" · ")],
                });
            }
        }

        const detailsPatch = isRecord(data.details_patch) ? data.details_patch : null;
        if (detailsPatch) {
            const lines = Object.entries(detailsPatch)
                .map(([key, value]) => {
                    const parsed = asString(value, 120);
                    if (!parsed) return null;
                    return `${formatDetailKey(key, t)}: ${parsed}`;
                })
                .filter((entry): entry is string => !!entry)
                .slice(0, 6);
            if (lines.length > 0) {
                sections.push({
                    title: t("Detalles", "Details"),
                    lines,
                });
            }
        }

        const itemPatch = isRecord(data.item_patch) ? data.item_patch : null;
        if (itemPatch) {
            const lines: string[] = [];
            const targetItem = asString(itemPatch.target_item_name, 120);
            const newName = asString(itemPatch.name, 120);
            const category = asString(itemPatch.category, 80);
            const rarity = asString(itemPatch.rarity, 80);
            const description = asString(itemPatch.description, 180);
            const quantity = asNumber(itemPatch.quantity);
            const equipped = boolLabel(asBoolean(itemPatch.equipped), t);
            const equippable = boolLabel(asBoolean(itemPatch.equippable), t);
            const createIfMissing = boolLabel(asBoolean(itemPatch.create_if_missing), t);
            const clearAttachments = boolLabel(asBoolean(itemPatch.clear_attachments), t);
            const tagsAdd = asStringArray(itemPatch.tags_add, 6, 40);
            const tagsRemove = asStringArray(itemPatch.tags_remove, 6, 40);

            if (targetItem) lines.push(`${t("Objeto objetivo", "Target item")}: ${targetItem}`);
            if (newName) lines.push(`${t("Renombrar a", "Rename to")}: ${newName}`);
            if (category) lines.push(`${t("Categoría", "Category")}: ${category}`);
            if (rarity) lines.push(`${t("Rareza", "Rarity")}: ${rarity}`);
            if (typeof quantity === "number") {
                lines.push(`${t("Cantidad", "Quantity")}: ${quantity}`);
            }
            if (equipped) lines.push(`${t("Equipado", "Equipped")}: ${equipped}`);
            if (equippable) lines.push(`${t("Equipable", "Equippable")}: ${equippable}`);
            if (createIfMissing) {
                lines.push(`${t("Crear si falta", "Create if missing")}: ${createIfMissing}`);
            }
            if (clearAttachments) {
                lines.push(
                    `${t("Limpiar adjuntos", "Clear attachments")}: ${clearAttachments}`
                );
            }
            if (description) lines.push(`${t("Descripción", "Description")}: ${description}`);
            if (tagsAdd.length > 0) {
                lines.push(`${t("Tags +", "Tags +")}: ${tagsAdd.join(", ")}`);
            }
            if (tagsRemove.length > 0) {
                lines.push(`${t("Tags -", "Tags -")}: ${tagsRemove.join(", ")}`);
            }

            const attachmentSource = Array.isArray(itemPatch.attachments_replace)
                ? itemPatch.attachments_replace
                : Array.isArray(itemPatch.attachments_add)
                  ? itemPatch.attachments_add
                  : [];
            const attachmentNames = attachmentSource
                .map((entry) => {
                    if (!isRecord(entry)) return null;
                    const name = asString(entry.name, 90);
                    const type = asString(entry.type, 30);
                    if (!name) return null;
                    return type ? `${name} (${type})` : name;
                })
                .filter((entry): entry is string => !!entry)
                .slice(0, 6);
            if (attachmentNames.length > 0) {
                lines.push(
                    `${t("Adjuntos", "Attachments")}: ${attachmentNames.join(", ")}`
                );
            }

            if (lines.length > 0) {
                sections.push({
                    title: t("Objeto", "Item"),
                    lines,
                });
            }
        }

        const learnedSpellPatch = isRecord(data.learned_spell_patch)
            ? data.learned_spell_patch
            : null;
        if (learnedSpellPatch) {
            const lines: string[] = [];
            const actionType = asString(learnedSpellPatch.action, 20);
            const spellName = asString(learnedSpellPatch.spell_name, 120);
            const spellIndex = asString(learnedSpellPatch.spell_index, 120);
            const level = asNumber(learnedSpellPatch.spell_level);
            if (actionType) lines.push(`${t("Acción", "Action")}: ${actionType}`);
            if (typeof level === "number") lines.push(`${t("Nivel", "Level")}: ${level}`);
            if (spellName) lines.push(`${t("Hechizo", "Spell")}: ${spellName}`);
            if (spellIndex) lines.push(`Index: ${spellIndex}`);
            if (lines.length > 0) {
                sections.push({
                    title: t("Hechizos aprendidos", "Learned spells"),
                    lines,
                });
            }
        }

        const customSpellPatch = isRecord(data.custom_spell_patch)
            ? data.custom_spell_patch
            : null;
        if (customSpellPatch) {
            const lines: string[] = [];
            const target = asString(customSpellPatch.target_spell_name, 120);
            const name = asString(customSpellPatch.name, 120);
            const collection = asString(customSpellPatch.collection, 50);
            const level = asNumber(customSpellPatch.level);
            const school = asString(customSpellPatch.school, 80);
            const remove = boolLabel(asBoolean(customSpellPatch.remove), t);
            const description = asString(customSpellPatch.description, 150);
            if (target) lines.push(`${t("Objetivo", "Target")}: ${target}`);
            if (name) lines.push(`${t("Nombre", "Name")}: ${name}`);
            if (collection) lines.push(`${t("Colección", "Collection")}: ${collection}`);
            if (typeof level === "number") lines.push(`${t("Nivel", "Level")}: ${level}`);
            if (school) lines.push(`${t("Escuela", "School")}: ${school}`);
            if (remove) lines.push(`${t("Eliminar", "Remove")}: ${remove}`);
            if (description) lines.push(`${t("Descripción", "Description")}: ${description}`);
            if (lines.length > 0) {
                sections.push({
                    title: t("Hechizo personalizado", "Custom spell"),
                    lines,
                });
            }
        }

        const customFeaturePatch = isRecord(data.custom_feature_patch)
            ? data.custom_feature_patch
            : null;
        if (customFeaturePatch) {
            const lines: string[] = [];
            const target = asString(customFeaturePatch.target_feature_name, 120);
            const name = asString(customFeaturePatch.name, 120);
            const collection = asString(customFeaturePatch.collection, 50);
            const level = asNumber(customFeaturePatch.level);
            const actionType = asString(customFeaturePatch.action_type, 50);
            const remove = boolLabel(asBoolean(customFeaturePatch.remove), t);
            const description = asString(customFeaturePatch.description, 150);
            if (target) lines.push(`${t("Objetivo", "Target")}: ${target}`);
            if (name) lines.push(`${t("Nombre", "Name")}: ${name}`);
            if (collection) lines.push(`${t("Colección", "Collection")}: ${collection}`);
            if (typeof level === "number") lines.push(`${t("Nivel", "Level")}: ${level}`);
            if (actionType) lines.push(`${t("Tipo de acción", "Action type")}: ${actionType}`);
            if (remove) lines.push(`${t("Eliminar", "Remove")}: ${remove}`);
            if (description) lines.push(`${t("Descripción", "Description")}: ${description}`);
            if (lines.length > 0) {
                sections.push({
                    title: t("Rasgo/Habilidad", "Trait/Feature"),
                    lines,
                });
            }
        }
    }

    return (
        <div className="rounded-md border border-amber-300/60 bg-amber-50 px-2 py-2 text-amber-900">
            <p className="font-medium uppercase tracking-wide">
                {action.operation} · {action.characterId ?? t("sin objetivo", "no target")}
            </p>
            <p className="mt-0.5">
                {action.note ??
                    t(
                        "Cambio pendiente de confirmación.",
                        "Pending change awaiting confirmation."
                    )}
            </p>

            {sections.length > 0 ? (
                <div className="mt-2 space-y-2">
                    {sections.map((section, index) => (
                        <div
                            key={`${action.operation}-${action.characterId ?? "none"}-${section.title}-${index}`}
                            className="rounded border border-amber-200/80 bg-white/70 px-2 py-1.5"
                        >
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-900/90">
                                {section.title}
                            </p>
                            <ul className="mt-1 space-y-0.5">
                                {section.lines.map((line, lineIndex) => (
                                    <li
                                        key={`${section.title}-${lineIndex}`}
                                        className="text-[11px] text-amber-900"
                                    >
                                        {line}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="mt-1 text-[11px] text-amber-900/90">
                    {t(
                        "Vista previa sin detalle estructurado.",
                        "Preview without structured details."
                    )}
                </p>
            )}
        </div>
    );
}

function sanitizeProposedActions(value: unknown): ProposedAction[] {
    if (!Array.isArray(value)) return [];
    const actions: ProposedAction[] = [];

    for (const entry of value.slice(0, 4)) {
        if (!isRecord(entry)) continue;
        const operation = entry.operation;
        if (operation !== "create" && operation !== "update") continue;

        const characterId =
            typeof entry.characterId === "string" && entry.characterId.trim()
                ? entry.characterId.trim()
                : undefined;
        const note =
            typeof entry.note === "string" && entry.note.trim()
                ? entry.note.trim()
                : undefined;
        const data = isRecord(entry.data) ? entry.data : undefined;

        actions.push({
            operation,
            characterId,
            note,
            data,
        });
    }

    return actions;
}

function makeMessage(
    role: ChatMessage["role"],
    text: string,
    options?: {
        results?: MutationResult[];
        proposedActions?: ProposedAction[];
    }
): ChatMessage {
    return {
        id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role,
        text,
        results: options?.results,
        proposedActions: options?.proposedActions,
    };
}

export default function AIAssistantPanel({
    open,
    onOpenChange,
    campaignId,
    locale,
    selectedCharacterId,
    selectedCharacterName,
    assistantContext,
    onApplied,
}: AIAssistantPanelProps) {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [pendingPlan, setPendingPlan] = useState<PendingPlan | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const t = (es: string, en: string) => tr(locale, es, en);
    const welcomeMessage = t(
        "Hola. Soy tu asistente IA. Te propondré cambios y tú confirmas si se aplican.",
        "Hi. I am your AI assistant. I will propose changes and you confirm before applying."
    );

    const selectedLabel = useMemo(() => {
        if (!selectedCharacterId) return null;
        if (selectedCharacterName?.trim()) return selectedCharacterName.trim();
        return selectedCharacterId;
    }, [selectedCharacterId, selectedCharacterName]);

    useEffect(() => {
        if (!open) return;
        if (messages.length > 0) return;
        setMessages([makeMessage("assistant", welcomeMessage)]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        if (!open) return;
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, open]);

    function closeDrawer() {
        onOpenChange(false);
    }

    function handleClearConversation() {
        if (loading) return;
        setPrompt("");
        setError(null);
        setPendingPlan(null);
        setMessages([makeMessage("assistant", welcomeMessage)]);
    }

    async function getAccessToken() {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) {
            throw new Error(t("No hay sesion activa.", "No active session."));
        }
        return accessToken;
    }

    async function postAssistant(accessToken: string, body: Record<string, unknown>) {
        const res = await fetch(`/api/ai/campaigns/${campaignId}/assistant`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(body),
        });

        const payload = (await res.json().catch(() => null)) as AssistantPayload | null;
        if (!res.ok) {
            throw new Error(
                String(
                    payload?.error ??
                        t(
                            "No se pudo ejecutar el asistente.",
                            "Could not run the assistant."
                        )
                )
            );
        }

        return payload;
    }

    async function handleRunAssistant() {
        if (loading) return;
        if (pendingPlan) {
            setError(
                t(
                    "Confirma o cancela los cambios pendientes antes de enviar otra instruccion.",
                    "Confirm or cancel the pending changes before sending another instruction."
                )
            );
            return;
        }

        const trimmed = prompt.trim();
        if (!trimmed) {
            setError(t("Escribe una instruccion para el asistente.", "Write an instruction for the assistant."));
            return;
        }

        const userMessage = makeMessage("user", trimmed);
        const nextMessages = [...messages, userMessage];
        setMessages(nextMessages);
        setPrompt("");
        setLoading(true);
        setError(null);

        try {
            const accessToken = await getAccessToken();

            const recentContext = nextMessages
                .slice(-4)
                .map((entry) =>
                    `${entry.role === "user" ? "Usuario" : "Asistente"}: ${entry.text}`
                )
                .join("\n");
            const compactRecentContext =
                recentContext.length > 1400
                    ? recentContext.slice(recentContext.length - 1400)
                    : recentContext;

            const composedPrompt = [
                `Instruccion actual del usuario: ${trimmed}`,
                compactRecentContext
                    ? `Contexto reciente:\n${compactRecentContext}`
                    : null,
            ]
                .filter((entry): entry is string => !!entry)
                .join("\n\n");

            const payload = await postAssistant(accessToken, {
                prompt: composedPrompt,
                targetCharacterId: selectedCharacterId ?? undefined,
                clientContext: assistantContext ?? undefined,
                apply: false,
            });

            const reply =
                payload?.reply?.trim() ||
                t("He preparado una propuesta.", "I prepared a proposal.");
            const proposedActions = sanitizeProposedActions(payload?.proposedActions);

            setMessages((prev) => [
                ...prev,
                makeMessage("assistant", reply, {
                    proposedActions,
                }),
            ]);

            if (proposedActions.length > 0) {
                setPendingPlan({
                    prompt: composedPrompt,
                    targetCharacterId: selectedCharacterId ?? undefined,
                    proposedActions,
                    previewReply: reply,
                });
            } else {
                setPendingPlan(null);
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : t("Error ejecutando el asistente.", "Error running assistant.");
            setError(message);
            setMessages((prev) => [...prev, makeMessage("assistant", message)]);
        } finally {
            setLoading(false);
        }
    }

    async function handleApplyPendingPlan() {
        if (loading || !pendingPlan) return;
        setLoading(true);
        setError(null);

        try {
            const accessToken = await getAccessToken();
            const payload = await postAssistant(accessToken, {
                prompt: pendingPlan.prompt,
                targetCharacterId: pendingPlan.targetCharacterId,
                clientContext: assistantContext ?? undefined,
                apply: true,
                proposedActions: pendingPlan.proposedActions,
                previewReply: pendingPlan.previewReply,
            });

            const reply =
                payload?.reply?.trim() ||
                t("Cambios aplicados.", "Changes applied.");
            const results = Array.isArray(payload?.results) ? payload.results : [];

            setMessages((prev) => [
                ...prev,
                makeMessage("assistant", reply, {
                    results,
                }),
            ]);
            setPendingPlan(null);

            const hasApplied = results.some((entry) => entry.status === "applied");
            if (hasApplied) {
                await onApplied?.();
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : t("Error ejecutando el asistente.", "Error running assistant.");
            setError(message);
            setMessages((prev) => [...prev, makeMessage("assistant", message)]);
        } finally {
            setLoading(false);
        }
    }

    function handleCancelPendingPlan() {
        if (loading || !pendingPlan) return;
        setPendingPlan(null);
        setError(null);
        setMessages((prev) => [
            ...prev,
            makeMessage(
                "assistant",
                t(
                    "Cancelado. No se aplicó ningún cambio.",
                    "Cancelled. No changes were applied."
                )
            ),
        ]);
    }

    return (
        <>
            {!open && (
                <button
                    type="button"
                    onClick={() => onOpenChange(true)}
                    className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-xl border border-r-0 border-accent/40 bg-panel/95 px-3 py-3 shadow-[0_10px_24px_rgba(45,29,12,0.2)] hover:bg-white"
                    aria-label={t("Abrir chat de IA", "Open AI chat")}
                    title={t("Chat IA", "AI chat")}
                >
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-ink">
                        <Sparkles className="h-4 w-4 text-accent" />
                        <span className="hidden sm:inline">{t("Chat IA", "AI Chat")}</span>
                    </span>
                </button>
            )}

            {open && (
                <button
                    type="button"
                    onClick={closeDrawer}
                    className="fixed inset-0 z-40 bg-black/20 md:hidden"
                    aria-label={t("Cerrar chat de IA", "Close AI chat")}
                />
            )}

            <aside
                className={`fixed inset-y-0 right-0 z-50 w-full max-w-[420px] border-l border-ring bg-panel/95 shadow-[-12px_0_28px_rgba(45,29,12,0.2)] transition-transform duration-200 ${
                    open ? "translate-x-0" : "translate-x-full pointer-events-none"
                }`}
                aria-hidden={!open}
            >
                <div className="flex h-full flex-col">
                    <header className="border-b border-ring px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <h3 className="text-sm font-semibold text-ink inline-flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-accent" />
                                    {t("Chat IA", "AI Chat")}
                                </h3>
                                <p className="text-[11px] text-ink-muted mt-0.5">
                                    {t(
                                        "Asistente con permisos de campaña.",
                                        "Campaign-permission assistant."
                                    )}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={handleClearConversation}
                                    disabled={loading}
                                    aria-label={t("Limpiar conversación", "Clear conversation")}
                                    title={t("Limpiar conversación", "Clear conversation")}
                                    className="inline-flex items-center gap-1 rounded-md border border-ring bg-white/80 px-2 py-1 text-[11px] text-ink hover:bg-white disabled:opacity-60"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {t("Clear", "Clear")}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeDrawer}
                                    aria-label={t("Cerrar chat", "Close chat")}
                                    className="rounded-full border border-ring bg-white/80 p-1.5 hover:bg-white"
                                >
                                    <X className="h-4 w-4 text-ink" />
                                </button>
                            </div>
                        </div>
                        {selectedLabel && (
                            <p className="mt-2 text-[11px] text-ink-muted">
                                {t("Objetivo actual:", "Current target:")} <span className="font-medium text-ink">{selectedLabel}</span>
                            </p>
                        )}
                    </header>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3 styled-scrollbar">
                        {messages.length === 0 && (
                            <p className="text-xs text-ink-muted">
                                {t(
                                    "Escribe tu primera instrucción para empezar.",
                                    "Write your first instruction to start."
                                )}
                            </p>
                        )}

                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[90%] rounded-xl border px-3 py-2 text-xs ${
                                        message.role === "user"
                                            ? "border-accent/40 bg-accent/15 text-ink"
                                            : "border-ring bg-white/80 text-ink"
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap break-words">{message.text}</p>

                                    {message.results && message.results.length > 0 && (
                                        <ul className="mt-2 space-y-1.5">
                                            {message.results.map((entry, index) => (
                                                <li
                                                    key={`${message.id}-${entry.operation}-${entry.characterId ?? "none"}-${index}`}
                                                    className={`rounded-md border px-2 py-1 ${statusClass(entry.status)}`}
                                                >
                                                    <p className="font-medium uppercase tracking-wide">
                                                        {entry.operation} · {entry.status}
                                                    </p>
                                                    <p className="mt-0.5">{entry.message}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {message.proposedActions && message.proposedActions.length > 0 && (
                                        <div className="mt-2 space-y-1.5">
                                            {message.proposedActions.map((entry, index) => (
                                                <ProposedActionPreview
                                                    key={`${message.id}-${entry.operation}-${entry.characterId ?? "none"}-${index}`}
                                                    action={entry}
                                                    t={t}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div ref={messagesEndRef} />
                    </div>

                    <footer className="border-t border-ring p-3 space-y-2">
                        {error && (
                            <div className="rounded-md border border-red-300/60 bg-red-50 px-3 py-2 text-xs text-red-700">
                                {error}
                            </div>
                        )}

                        {pendingPlan && (
                            <div className="rounded-md border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                <p>
                                    {t(
                                        `Hay ${pendingPlan.proposedActions.length} cambio(s) pendiente(s). Confirma para aplicar.`,
                                        `${pendingPlan.proposedActions.length} pending change(s). Confirm to apply.`
                                    )}
                                </p>
                                <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto pr-1 styled-scrollbar">
                                    {pendingPlan.proposedActions.map((entry, index) => (
                                        <ProposedActionPreview
                                            key={`pending-${entry.operation}-${entry.characterId ?? "none"}-${index}`}
                                            action={entry}
                                            t={t}
                                        />
                                    ))}
                                </div>
                                <div className="mt-2 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={handleCancelPendingPlan}
                                        disabled={loading}
                                        className="rounded-md border border-amber-500/60 bg-white px-3 py-1.5 text-xs text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                                    >
                                        {t("Cancelar", "Cancel")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleApplyPendingPlan}
                                        disabled={loading}
                                        className="rounded-md border border-emerald-500/60 bg-emerald-100 px-3 py-1.5 text-xs text-emerald-800 hover:bg-emerald-200 disabled:opacity-60"
                                    >
                                        {loading
                                            ? t("Aplicando...", "Applying...")
                                            : t("Confirmar y aplicar", "Confirm and apply")}
                                    </button>
                                </div>
                            </div>
                        )}

                        <textarea
                            value={prompt}
                            onChange={(event) => setPrompt(event.target.value)}
                            rows={3}
                            disabled={loading || !!pendingPlan}
                            placeholder={t(
                                "Ejemplo: crea un companion lobo nivel 2 y añade nota de trasfondo.",
                                "Example: create a level 2 wolf companion and add a backstory note."
                            )}
                            className="w-full rounded-md border border-ring bg-white/80 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                        />

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleRunAssistant}
                                disabled={loading || !!pendingPlan}
                                className="inline-flex items-center gap-2 rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs text-ink hover:bg-accent/20 disabled:opacity-60"
                            >
                                <SendHorizontal className="h-3.5 w-3.5 text-accent" />
                                {loading
                                    ? t("Enviando...", "Sending...")
                                    : t("Proponer cambios", "Propose changes")}
                            </button>
                        </div>
                    </footer>
                </div>
            </aside>
        </>
    );
}
