import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        id: string;
        characterId: string;
    }>;
};

function extractBearerToken(header: string | null) {
    if (!header) return null;
    const normalized = header.trim();
    if (!normalized.toLowerCase().startsWith("bearer ")) return null;
    const token = normalized.slice(7).trim();
    return token.length > 0 ? token : null;
}

export async function POST(req: NextRequest, context: RouteContext) {
    try {
        const params = await context.params;
        const campaignId = String(params?.id ?? "").trim();
        const characterId = String(params?.characterId ?? "").trim();
        if (!campaignId || !characterId) {
            return NextResponse.json(
                { error: "campaignId/characterId invalidos." },
                { status: 400 }
            );
        }

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !anonKey || !serviceKey) {
            return NextResponse.json(
                { error: "Faltan variables de entorno de Supabase en el servidor." },
                { status: 500 }
            );
        }

        const accessToken = extractBearerToken(req.headers.get("authorization"));
        if (!accessToken) {
            return NextResponse.json({ error: "No autenticado." }, { status: 401 });
        }

        const authedClient = createClient(url, anonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        });
        const adminClient = createClient(url, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });

        const {
            data: { user },
            error: userError,
        } = await authedClient.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: "Sesion no valida." }, { status: 401 });
        }

        const [ownerRes, memberRes] = await Promise.all([
            adminClient
                .from("campaigns")
                .select("owner_id")
                .eq("id", campaignId)
                .maybeSingle(),
            adminClient
                .from("campaign_members")
                .select("user_id")
                .eq("campaign_id", campaignId)
                .eq("user_id", user.id)
                .eq("role", "DM")
                .maybeSingle(),
        ]);

        if (ownerRes.error) {
            return NextResponse.json(
                { error: ownerRes.error.message },
                { status: 500 }
            );
        }
        if (memberRes.error) {
            return NextResponse.json(
                { error: memberRes.error.message },
                { status: 500 }
            );
        }

        const isOwner = ownerRes.data?.owner_id === user.id;
        const isDmMember = Boolean(memberRes.data?.user_id);
        if (!isOwner && !isDmMember) {
            return NextResponse.json(
                { error: "No tienes permisos de DM para esta campana." },
                { status: 403 }
            );
        }

        const childTables = [
            "character_stats",
            "character_spells",
            "character_weapons",
            "character_armors",
            "character_equipments",
        ];

        for (const tableName of childTables) {
            const { error } = await adminClient
                .from(tableName)
                .delete()
                .eq("character_id", characterId);
            if (error) {
                return NextResponse.json(
                    { error: `${tableName}: ${error.message}` },
                    { status: 500 }
                );
            }
        }

        const { data: deletedCharacter, error: deleteError } = await adminClient
            .from("characters")
            .delete()
            .eq("id", characterId)
            .eq("campaign_id", campaignId)
            .select("id")
            .maybeSingle();

        if (deleteError) {
            return NextResponse.json(
                { error: deleteError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ deleted: Boolean(deletedCharacter?.id) });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message ?? "Error eliminando personaje." },
            { status: 500 }
        );
    }
}
