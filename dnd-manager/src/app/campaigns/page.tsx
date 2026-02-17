"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useClientLocale } from "@/lib/i18n/useClientLocale";
import { tr } from "@/lib/i18n/translate";

type Campaign = {
  id: string;
  name: string;
  invite_code: string | null;
  role: "PLAYER" | "DM";
};

export default function CampaignsPage() {
  const router = useRouter();
  const locale = useClientLocale();
  const t = useCallback((es: string, en: string) => tr(locale, es, en), [locale]);

  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn("Missing NEXT_PUBLIC_SUPABASE_* env vars for client");
      setError(
        t(
          "Error de configuracion: falta la URL/KEY de Supabase. Contacta al administrador.",
          "Configuration error: missing Supabase URL/KEY. Contact an administrator."
        )
      );
      setLoading(false);
      return;
    }

    const client = createClient(url, key);
    setSupabase(client);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!supabase) return;

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
        if (!cancelled) {
          setError(t("Error cargando tus campanas.", "Error loading your campaigns."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCampaigns();

    return () => {
      cancelled = true;
    };
  }, [supabase, router, t]);

  if (loading) {
    return (
      <main className="min-h-screen bg-surface text-ink flex items-center justify-center">
        <p>{t("Cargando tus campanas...", "Loading your campaigns...")}</p>
      </main>
    );
  }

  const dmCampaigns = campaigns.filter((c) => c.role === "DM");
  const playerCampaigns = campaigns.filter((c) => c.role === "PLAYER");

  return (
    <main className="min-h-screen bg-surface text-ink p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-ink">{t("Tus campanas", "Your campaigns")}</h1>

      {error && (
        <p className="text-red-400 bg-red-950/40 border border-red-900/50 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">{t("Como DM", "As DM")}</h2>
        {dmCampaigns.length === 0 ? (
          <p className="text-sm text-ink-muted">
            {t("No eres DM en ninguna campana.", "You are not DM in any campaign.")}
          </p>
        ) : (
          <ul className="space-y-2">
            {dmCampaigns.map((c) => (
              <li
                key={c.id}
                className="flex justify-between border border-ring bg-panel/80 rounded-lg p-3"
              >
                <div>
                  <p className="font-medium text-ink">{c.name}</p>
                </div>
                <Link
                  href={`/campaigns/${c.id}/dm`}
                  className="text-xs border border-accent/60 px-3 py-1 rounded hover:bg-accent/10"
                >
                  {t("Entrar", "Enter")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-ink">{t("Como jugador", "As player")}</h2>
        {playerCampaigns.length === 0 ? (
          <p className="text-sm text-ink-muted">
            {t(
              "No participas en ninguna campana como jugador.",
              "You are not participating in any campaign as a player."
            )}
          </p>
        ) : (
          <ul className="space-y-2">
            {playerCampaigns.map((c) => (
              <li
                key={c.id}
                className="flex justify-between border border-ring bg-panel/80 rounded-lg p-3"
              >
                <div>
                  <p className="font-medium text-ink">{c.name}</p>
                </div>
                <Link
                  href={`/campaigns/${c.id}/player`}
                  className="text-xs border border-accent/60 px-3 py-1 rounded hover:bg-accent/10"
                >
                  {t("Entrar", "Enter")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex gap-3 pt-4">
        <Link
          href="/campaigns/create"
          className="border border-accent/60 rounded-lg px-4 py-2 hover:bg-accent/10"
        >
          {t("Crear campana (DM)", "Create campaign (DM)")}
        </Link>
        <Link
          href="/campaigns/join"
          className="border border-accent/60 rounded-lg px-4 py-2 hover:bg-accent/10"
        >
          {t("Unirme a una campana", "Join a campaign")}
        </Link>
      </div>
    </main>
  );
}
