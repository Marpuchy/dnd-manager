"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type Campaign = {
    id: string;
    name: string;
    invite_code: string | null;
    role: "PLAYER" | "DM";
};

export default function CampaignsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

    // Inicializa el cliente de Supabase en el navegador (no en el scope del módulo)
    useEffect(() => {
        if (typeof window === "undefined") return;

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key) {
            console.warn("Missing NEXT_PUBLIC_SUPABASE_* env vars for client");
            setError(
                "Error de configuración: falta la URL/KEY de Supabase. Contacta al administrador."
            );
            setLoading(false);
            return;
        }

        const client = createClient(url, key);
        setSupabase(client);
    }, []);

    // Carga campañas cuando el cliente esté listo
    useEffect(() => {
        if (!supabase) return; // <-- evita ejecutar lógica si no hay cliente

        // Capturamos una referencia inmutable para que TS sepa que no es null dentro de la función
        const client = supabase;

        let cancelled = false;

        async function loadCampaigns() {
            setLoading(true);
            setError(null);

            try {
                const {
                    data: { session },
                    error: sessionErr,
                } = await client.auth.getSession();

                if (sessionErr) throw sessionErr;

                if (!session?.user) {
                    router.push("/login");
                    return;
                }

                const { data, error: fetchErr } = await client
                    .from("campaign_members")
                    .select("role, campaign_id:campaigns(id, name, invite_code)")
                    .eq("user_id", session.user.id);

                if (fetchErr) throw fetchErr;

                const formatted = (data ?? []).map((item: any) => ({
                    id: item.campaign_id.id,
                    name: item.campaign_id.name,
                    invite_code: item.campaign_id.invite_code,
                    role: item.role,
                }));

                if (!cancelled) setCampaigns(formatted);
            } catch (err: any) {
                console.error("Error loading campaigns:", err);
                if (!cancelled) setError("Error cargando tus campañas.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadCampaigns();

        return () => {
            cancelled = true;
        };
    }, [supabase, router]);

    if (loading) {
        return (
            <main className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
                <p>Cargando tus campañas...</p>
            </main>
        );
    }

    const dmCampaigns = campaigns.filter((c) => c.role === "DM");
    const playerCampaigns = campaigns.filter((c) => c.role === "PLAYER");

    return (
        <main className="min-h-screen bg-black text-zinc-100 p-6 space-y-6 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-purple-300">Tus campañas</h1>

            {error && (
                <p className="text-red-400 bg-red-950/40 border border-red-900/50 rounded-md px-3 py-2">
                    {error}
                </p>
            )}

            {/* CAMPAÑAS COMO DM */}
            <section className="space-y-2">
                <h2 className="text-xl font-semibold text-emerald-300">Como DM</h2>
                {dmCampaigns.length === 0 ? (
                    <p className="text-sm text-zinc-500">No eres DM en ninguna campaña.</p>
                ) : (
                    <ul className="space-y-2">
                        {dmCampaigns.map((c) => (
                            <li
                                key={c.id}
                                className="flex justify-between border border-zinc-800 bg-zinc-950/70 rounded-lg p-3"
                            >
                                <div>
                                    <p className="font-medium text-zinc-200">{c.name}</p>
                                </div>
                                <Link
                                    href={`/campaigns/${c.id}/dm`}
                                    className="text-xs border border-emerald-600/70 px-3 py-1 rounded hover:bg-emerald-900/40"
                                >
                                    Entrar
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* CAMPAÑAS COMO JUGADOR */}
            <section className="space-y-2">
                <h2 className="text-xl font-semibold text-purple-300">Como jugador</h2>
                {playerCampaigns.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                        No participas en ninguna campaña como jugador.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {playerCampaigns.map((c) => (
                            <li
                                key={c.id}
                                className="flex justify-between border border-zinc-800 bg-zinc-950/70 rounded-lg p-3"
                            >
                                <div>
                                    <p className="font-medium text-zinc-200">{c.name}</p>
                                </div>
                                <Link
                                    href={`/campaigns/${c.id}/player`}
                                    className="text-xs border border-purple-600/70 px-3 py-1 rounded hover:bg-purple-900/40"
                                >
                                    Entrar
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
                <Link
                    href="/campaigns/create"
                    className="border border-emerald-600/70 rounded-lg px-4 py-2 hover:bg-emerald-900/40"
                >
                    Crear campaña (DM)
                </Link>
                <Link
                    href="/campaigns/join"
                    className="border border-purple-600/70 rounded-lg px-4 py-2 hover:bg-purple-900/40"
                >
                    Unirme a una campaña
                </Link>
            </div>
        </main>
    );
}
