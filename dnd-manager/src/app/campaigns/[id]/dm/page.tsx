"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

type Member = {
    role: "PLAYER" | "DM";
};

type Character = {
    id: string;
    name: string;
    class: string | null;
    level: number | null;
};

export default function CampaignDMPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(false);

    // Data
    const [characters, setCharacters] = useState<Character[]>([]);
    const [inviteCode, setInviteCode] = useState<string | null>(null);

    // Editing state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [charName, setCharName] = useState("");
    const [charClass, setCharClass] = useState("");
    const [charLevel, setCharLevel] = useState<number>(1);

    const [error, setError] = useState<string | null>(null);

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

            // Check membership
            const { data: membership, error: membershipError } = await supabase
                .from("campaign_members")
                .select("role")
                .eq("user_id", session.user.id)
                .eq("campaign_id", params.id)
                .maybeSingle<Member>();

            if (membershipError || !membership || membership.role !== "DM") {
                router.push("/campaigns");
                return;
            }

            setAllowed(true);

            // Load campaign invite code
            const { data: campaignData } = await supabase
                .from("campaigns")
                .select("invite_code")
                .eq("id", params.id)
                .single();

            if (campaignData) {
                setInviteCode(campaignData.invite_code);
            }

            // Load all characters for this campaign
            const { data: chars, error: charsError } = await supabase
                .from("characters")
                .select("id, name, class, level")
                .eq("campaign_id", params.id);

            if (charsError) {
                console.error("Error loading characters:", charsError);
                setError("No se pudieron cargar los personajes.");
            } else if (chars) {
                setCharacters(chars as Character[]);
            }

            setLoading(false);
        }

        checkAccessAndLoad();
    }, [params.id, router]);

    // Editing functions
    function startEdit(char: Character) {
        setEditingId(char.id);
        setCharName(char.name);
        setCharClass(char.class ?? "");
        setCharLevel(char.level ?? 1);
    }

    function cancelEdit() {
        setEditingId(null);
        setCharName("");
        setCharClass("");
        setCharLevel(1);
    }

    async function handleSaveCharacter(e: FormEvent) {
        e.preventDefault();
        setError(null);

        try {
            if (!editingId) return;

            const { error: updateError } = await supabase
                .from("characters")
                .update({
                    name: charName.trim(),
                    class: charClass.trim() || null,
                    level: charLevel,
                })
                .eq("id", editingId)
                .eq("campaign_id", params.id);

            if (updateError) {
                console.error("Error updating character:", updateError);
                throw new Error(updateError.message);
            }

            // Refresh list
            const { data: chars } = await supabase
                .from("characters")
                .select("id, name, class, level")
                .eq("campaign_id", params.id);

            if (chars) setCharacters(chars as Character[]);

            cancelEdit();
        } catch (err) {
            console.error(err);
            const message =
                err instanceof Error
                    ? err.message
                    : "Error al guardar los cambios.";
            setError(message);
        }
    }

    if (loading || !allowed) {
        return (
            <main className="min-h-screen bg-surface text-ink flex items-center justify-center">
                <p className="text-ink-muted">Cargando panel del DM...</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-surface text-ink flex">
            {/* SIDEBAR */}
            <aside className="w-64 border-r border-ring bg-panel/80 p-4 flex flex-col gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-emerald-300">Panel del DM</h2>
                    <p className="text-xs text-ink-muted">Campaña ID: {String(params.id)}</p>
                </div>

                {/* Copy invite code */}
                {inviteCode && (
                    <button
                        onClick={() => navigator.clipboard.writeText(inviteCode)}
                        className="px-2 py-1 rounded hover:bg-white/80 text-left flex items-center gap-2"
                    >
                        🔗 Copiar código:{" "}
                        <span className="font-mono text-emerald-300">{inviteCode}</span>
                    </button>
                )}

                <nav className="flex flex-col gap-2 text-sm">
                    <a
                        href={`/campaigns/${params.id}/player`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded hover:bg-white/80"
                    >
                        👁 Ver vista de jugador
                    </a>

                    <div className="pt-4 text-xs text-ink-muted uppercase">
                        Próximamente
                    </div>

                    <button className="opacity-50 px-2 py-1 rounded text-left cursor-default">
                        🐉 Bestiario
                    </button>
                    <button className="opacity-50 px-2 py-1 rounded text-left cursor-default">
                        🛒 Tiendas
                    </button>
                    <button className="opacity-50 px-2 py-1 rounded text-left cursor-default">
                        📓 Notas de sesión
                    </button>
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <section className="flex-1 p-6 space-y-6">
                <header>
                    <h1 className="text-2xl font-bold text-emerald-300">
                        Gestión de personajes
                    </h1>
                    <p className="text-sm text-ink-muted">
                        Puedes modificar cualquier personaje que creen tus jugadores.
                    </p>
                </header>

                {error && (
                    <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-md px-3 py-2 inline-block">
                        {error}
                    </p>
                )}

                {/* CHARACTER EDIT FORM */}
                {editingId && (
                    <div className="max-w-lg border border-ring bg-panel/80 rounded-xl p-4 space-y-3">
                        <h2 className="text-lg font-semibold text-ink">Editar personaje</h2>

                        <form onSubmit={handleSaveCharacter} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-sm text-ink-muted">Nombre</label>
                                <input
                                    type="text"
                                    value={charName}
                                    onChange={(e) => setCharName(e.target.value)}
                                    required
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm outline-none focus:border-accent"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-ink-muted">Clase</label>
                                <input
                                    type="text"
                                    value={charClass}
                                    onChange={(e) => setCharClass(e.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm outline-none focus:border-accent"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-ink-muted">Nivel</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={charLevel}
                                    onChange={(e) => setCharLevel(Number(e.target.value))}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm outline-none focus:border-accent"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="rounded-md bg-accent hover:bg-accent-strong px-4 py-2 text-sm font-medium"
                                >
                                    Guardar cambios
                                </button>

                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="rounded-md bg-accent hover:bg-accent-strong px-4 py-2 text-sm font-medium"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* CHARACTER LIST */}
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-ink">
                        Personajes de la campaña
                    </h2>

                    {characters.length === 0 ? (
                        <p className="text-sm text-ink-muted">No hay personajes todavía.</p>
                    ) : (
                        <ul className="space-y-2">
                            {characters.map((char) => (
                                <li
                                    key={char.id}
                                    className="flex items-center justify-between border border-ring bg-panel/80 rounded-lg px-3 py-2"
                                >
                                    <div>
                                        <p className="font-medium text-ink">
                                            {char.name}{" "}
                                            <span className="text-xs text-ink-muted">
                        (Nivel {char.level ?? 1})
                      </span>
                                        </p>
                                        <p className="text-xs text-ink-muted">{char.class ?? "—"}</p>
                                    </div>

                                    <button
                                        className="text-xs px-3 py-1 border border-accent/60 rounded-md hover:bg-accent/10"
                                        onClick={() => startEdit(char)}
                                    >
                                        Editar
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </main>
    );
}
