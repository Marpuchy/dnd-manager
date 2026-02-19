"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getSessionUserSafely } from "@/lib/supabaseAuthClient";

export default function JoinCampaignPage() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const user = await getSessionUserSafely(supabase);
            if (!user) {
                throw new Error("Debes iniciar sesión.");
            }

            // Normalizamos el código ingresado
            const formattedCode = code.trim().toUpperCase();

            if (!formattedCode.includes("-") || formattedCode.length < 5) {
                throw new Error("El formato del código no es válido.");
            }

            // Buscar campaña por código EXACTO
            const { data: campaign, error: campaignError } = await supabase
                .from("campaigns")
                .select("id")
                .eq("invite_code", formattedCode)
                .maybeSingle();

            if (campaignError) {
                console.error(campaignError);
                throw new Error("Error consultando la campaña.");
            }

            if (!campaign) {
                throw new Error("No existe ninguna campaña con ese código.");
            }

            // Insertar al jugador como miembro
            const { error: memberError } = await supabase
                .from("campaign_members")
                .insert({
                    user_id: user.id,
                    campaign_id: campaign.id,
                    role: "PLAYER",
                });

            if (memberError) {
                console.error(memberError);
                throw new Error(memberError.message ?? "Error al unirse a la campaña.");
            }

            router.push(`/campaigns/${campaign.id}/player`);
        } catch (err) {
            console.error("Join error:", err);
            setError(err instanceof Error ? err.message : "Error al unirse a la campaña.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-surface text-ink flex items-center justify-center">
            <div className="w-full max-w-md border border-ring bg-panel/80 rounded-xl p-6 space-y-4">
                <h1 className="text-2xl font-bold text-ink">
                    Unirse a una campaña
                </h1>
                <p className="text-sm text-ink-muted">
                    Introduce el código que te dio tu DM.
                </p>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-sm text-ink-muted">Código</label>
                        <input
                            type="text"
                            required
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="ABCD-EFGH"
                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm outline-none focus:border-accent font-mono tracking-widest"
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
                        className="w-full mt-2 rounded-md bg-accent hover:bg-accent-strong disabled:opacity-60 py-2 text-sm font-medium"
                    >
                        {loading ? "Uniéndose..." : "Unirme a la campaña"}
                    </button>
                </form>
            </div>
        </main>
    );
}
