"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function generateInviteCode() {
    return (
        Math.random().toString(36).substring(2, 6).toUpperCase() +
        "-" +
        Math.random().toString(36).substring(2, 6).toUpperCase()
    );
}

export default function CreateCampaignPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) {
                console.error("Session error:", sessionError);
                throw new Error("Error obteniendo la sesión");
            }

            if (!session?.user) {
                throw new Error("No hay sesión activa. Inicia sesión de nuevo.");
            }

            const code = generateInviteCode();

            // 1) Crear campaña
            const { data: campaign, error: campaignError } = await supabase
                .from("campaigns")
                .insert({
                    name,
                    owner_id: session.user.id,
                    invite_code: code,
                })
                .select()
                .single();

            if (campaignError) {
                console.error("Error al crear campaña:", campaignError);
                throw new Error(
                    campaignError.message ?? "Error creando la campaña (DB)"
                );
            }

            if (!campaign) {
                throw new Error("No se ha podido crear la campaña.");
            }

            // 2) Meter al usuario como DM
            const { error: memberError } = await supabase
                .from("campaign_members")
                .insert({
                    user_id: session.user.id,
                    campaign_id: campaign.id,
                    role: "DM",
                });

            if (memberError) {
                console.error("Error al crear membership:", memberError);
                throw new Error(
                    memberError.message ?? "Error añadiendo al usuario como DM"
                );
            }

            // 3) Ir al panel del DM
            router.push(`/campaigns/${campaign.id}/dm`);
        } catch (err) {
            console.error("Error en handleSubmit de create campaign:", err);
            const message =
                err instanceof Error ? err.message : "Error creando la campaña";
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
            <div className="w-full max-w-md border border-zinc-800 bg-zinc-950/80 rounded-xl p-6 space-y-4">
                <h1 className="text-2xl font-bold text-emerald-300">
                    Crear campaña
                </h1>
                <p className="text-sm text-zinc-500">
                    Serás el único DM de esta campaña. Podrás invitar jugadores
                    con un código.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-sm text-zinc-300">
                            Nombre de la campaña
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-md px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 rounded-md bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 py-2 text-sm font-medium"
                    >
                        {loading ? "Creando..." : "Crear campaña"}
                    </button>
                </form>
            </div>
        </main>
    );
}
