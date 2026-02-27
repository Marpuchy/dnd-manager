import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        id: string;
        characterId: string;
    }>;
};

function hasMissingCharacterTrashColumns(error: unknown) {
    const message = String(
        (error as { message?: unknown } | null | undefined)?.message ?? ""
    ).toLowerCase();
    return message.includes("deleted_at") || message.includes("deleted_by");
}

function isMissingOptionalTableError(error: unknown, tableName: string) {
    const code = String(
        (error as { code?: unknown } | null | undefined)?.code ?? ""
    ).toUpperCase();
    const message = String(
        (error as { message?: unknown } | null | undefined)?.message ?? ""
    ).toLowerCase();
    const details = String(
        (error as { details?: unknown } | null | undefined)?.details ?? ""
    ).toLowerCase();
    const hint = String(
        (error as { hint?: unknown } | null | undefined)?.hint ?? ""
    ).toLowerCase();
    const table = tableName.toLowerCase();
    const mentionsTable =
        message.includes(table) ||
        message.includes(`public.${table}`) ||
        details.includes(table) ||
        hint.includes(table);

    if (code === "42P01" || code === "PGRST205") return true;
    return (
        mentionsTable &&
        (message.includes("could not find the table") ||
            message.includes("does not exist") ||
            message.includes("schema cache") ||
            details.includes("schema cache") ||
            hint.includes("schema cache"))
    );
}

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
            return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
        }

        const payload = await req.json().catch(() => null);
        const permanentDelete =
            payload?.permanent === true ||
            payload?.hardDelete === true ||
            payload?.mode === "hard";

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
                { error: "No tienes permisos de DM para esta Campaña." },
                { status: 403 }
            );
        }

        if (!permanentDelete) {
            const { data: softDeletedCharacter, error: softDeleteError } = await adminClient
                .from("characters")
                .update({
                    deleted_at: new Date().toISOString(),
                    deleted_by: user.id,
                })
                .eq("id", characterId)
                .eq("campaign_id", campaignId)
                .is("deleted_at", null)
                .select("id")
                .maybeSingle();

            if (!softDeleteError) {
                if (softDeletedCharacter?.id) {
                    return NextResponse.json({ deleted: true, mode: "soft" });
                }
                const { data: alreadyDeletedCharacter, error: alreadyDeletedError } =
                    await adminClient
                        .from("characters")
                        .select("id")
                        .eq("id", characterId)
                        .eq("campaign_id", campaignId)
                        .not("deleted_at", "is", null)
                        .maybeSingle();

                if (alreadyDeletedError) {
                    return NextResponse.json(
                        { error: alreadyDeletedError.message },
                        { status: 500 }
                    );
                }
                return NextResponse.json(
                    {
                        deleted: Boolean(alreadyDeletedCharacter?.id),
                        mode: "soft",
                    }
                );
            }

            if (!hasMissingCharacterTrashColumns(softDeleteError)) {
                return NextResponse.json(
                    { error: softDeleteError.message },
                    { status: 500 }
                );
            }

            return NextResponse.json(
                {
                    error:
                        "La papelera de personajes no esta disponible en esta base de datos. Ejecuta la migracion 2026-02-27-character-trash.sql para activarla.",
                    code: "CHARACTER_TRASH_MIGRATION_REQUIRED",
                },
                { status: 409 }
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
                if (isMissingOptionalTableError(error, tableName)) {
                    continue;
                }
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

        return NextResponse.json({ deleted: Boolean(deletedCharacter?.id), mode: "hard" });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message ?? "Error eliminando personaje." },
            { status: 500 }
        );
    }
}

