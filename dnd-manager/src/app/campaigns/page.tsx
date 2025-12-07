"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Página para unirse a una campaña mediante código de invitación.
 * - Evita crear cliente Supabase en el módulo (no se ejecuta en build).
 * - Crea el cliente en el navegador (useEffect / handlers).
 *
 * IMPORTANTE:
 * Asegúrate de tener en Vercel (o en tu .env.local) estas variables:
 * NEXT_PUBLIC_SUPABASE_URL
 * NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * (Las variables NEXT_PUBLIC_* deben existir durante el build para sustituirlas, pero
 * no provocan la creación del cliente en el servidor porque la creación ocurre en cliente.)
 */

export default function JoinCampaignPage() {
    const router = useRouter();
    const [inviteCode, setInviteCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    // Crea el cliente en el cliente (navegador). Esto no se ejecuta durante el build.
    useEffect(() => {
        // Comprueba que las env vars públicas existan (reemplazadas por Next en build)
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key) {
            console.error("Faltan NEXT_PUBLIC_SUPABASE_* en el entorno.");
            setMessage(
                "Error de configuración: falta la URL/KEY de Supabase. Contacta al administrador."
            );
            return;
        }

        const client = createClient(url, key);
        setSupabase(client);
    }, []);

    async function handleJoin(e?: React.FormEvent) {
        e?.preventDefault();
        setMessage(null);

        if (!supabase) {
            setMessage("Cliente de Supabase no inicializado.");
            return;
        }

        if (!inviteCode.trim()) {
            setMessage("Introduce un código de invitación.");
            return;
        }

        try {
            setLoading(true);

            // Obtén sesión para conocer el usuario
            const {
                data: { session },
                error: sessionErr,
            } = await supabase.auth.getSession();

            if (sessionErr) throw sessionErr;
            if (!session?.user) {
                // No logueado: redirige a login
                router.push("/login");
                return;
            }

            // Busca la campaña por invite_code
            const { data: campaign, error: campaignError } = await supabase
                .from("campaigns")
                .select("id, name, invite_code")
                .eq("invite_code", inviteCode.trim())
                .limit(1)
                .single();

            if (campaignError) {
                if (campaignError.code === "PGRST116") {
                    // single() sin resultados
                    setMessage("Código de invitación no válido.");
                    setLoading(false);
                    return;
                }
                throw campaignError;
            }

            // Comprueba si ya eres miembro
            const { data: existing, error: existingErr } = await supabase
                .from("campaign_members")
                .select("id, role")
                .eq("campaign_id", campaign.id)
                .eq("user_id", session.user.id)
                .limit(1)
                .single();

            if (!existingErr && existing) {
                setMessage("Ya formas parte de esta campaña. Redirigiendo...");
                setTimeout(() => {
                    router.push(`/campaigns/${campaign.id}/player`);
                }, 700);
                return;
            }

            // Inserta como jugador
            const { error: insertErr } = await supabase.from("campaign_members").insert([
                {
                    campaign_id: campaign.id,
                    user_id: session.user.id,
                    role: "PLAYER",
                },
            ]);

            if (insertErr) throw insertErr;

            setMessage("Te has unido correctamente. Redirigiendo...");
            setTimeout(() => {
                router.push(`/campaigns/${campaign.id}/player`);
            }, 700);
        } catch (err: any) {
            console.error("Join error:", err);
            setMessage(err?.message ?? "Error inesperado al unirse a la campaña.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-black text-zinc-100 p-6 max-w-xl mx-auto">
            <h1 className="text-2xl font-bold text-purple-300 mb-4">Unirme a una campaña</h1>

            <p className="mb-4 text-sm text-zinc-400">
                Introduce el código de invitación que te ha proporcionado el DM.
            </p>

            {message && (
                <div className="mb-4 text-sm text-zinc-200 bg-zinc-900/40 border border-zinc-800 rounded-md p-3">
                    {message}
                </div>
            )}

            <form onSubmit={handleJoin} className="space-y-3">
                <label className="block">
                    <span className="text-sm text-zinc-400">Código de invitación</span>
                    <input
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        className="mt-1 w-full bg-zinc-950/60 border border-zinc-800 rounded px-3 py-2"
                        placeholder="p.ej. ABC123"
                        autoFocus
                    />
                </label>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 rounded border border-purple-600/70 hover:bg-purple-900/40"
                    >
                        {loading ? "Uniendo..." : "Unirme"}
                    </button>

                    <Link
                        href="/campaigns"
                        className="px-4 py-2 rounded border border-zinc-700 hover:bg-zinc-800/40"
                    >
                        Volver
                    </Link>
                </div>
            </form>

            <hr className="my-6 border-zinc-800" />

            <p className="text-sm text-zinc-500">
                ¿Eres DM y quieres invitar jugadores? Crea una campaña desde{" "}
                <Link href="/campaigns/create" className="text-emerald-300 underline">
                    aquí
                </Link>
                .
            </p>
        </main>
    );
}
