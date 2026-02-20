import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const DEFAULT_BUCKET = "campaign-bestiary-images";

type RouteContext = {
    params: Promise<{
        id: string;
        entryId: string;
    }>;
};

type BestiaryStorageRow = {
    id: string;
    image_url: string | null;
    image_storage_bucket: string | null;
    image_storage_path: string | null;
};

type BestiaryBasicRow = {
    id: string;
    image_url: string | null;
};

function extractBearerToken(header: string | null) {
    if (!header) return null;
    const normalized = header.trim();
    if (!normalized.toLowerCase().startsWith("bearer ")) return null;
    const token = normalized.slice(7).trim();
    return token.length > 0 ? token : null;
}

function parseStoragePublicUrl(url: string | null) {
    if (!url) return { bucket: null as string | null, objectPath: null as string | null };
    const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (!match) return { bucket: null, objectPath: null };
    return {
        bucket: match[1] ?? null,
        objectPath: match[2] ?? null,
    };
}

export async function POST(req: NextRequest, context: RouteContext) {
    try {
        const params = await context.params;
        const campaignId = String(params?.id ?? "").trim();
        const entryId = String(params?.entryId ?? "").trim();

        if (!campaignId || !entryId) {
            return NextResponse.json({ error: "campaignId/entryId invalidos." }, { status: 400 });
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
            adminClient.from("campaigns").select("owner_id").eq("id", campaignId).maybeSingle(),
            adminClient
                .from("campaign_members")
                .select("user_id")
                .eq("campaign_id", campaignId)
                .eq("user_id", user.id)
                .eq("role", "DM")
                .maybeSingle(),
        ]);

        if (ownerRes.error) return NextResponse.json({ error: ownerRes.error.message }, { status: 500 });
        if (memberRes.error) return NextResponse.json({ error: memberRes.error.message }, { status: 500 });

        const isOwner = ownerRes.data?.owner_id === user.id;
        const isDmMember = Boolean(memberRes.data?.user_id);
        if (!isOwner && !isDmMember) {
            return NextResponse.json(
                { error: "No tienes permisos de DM para esta campana." },
                { status: 403 }
            );
        }

        const { data: basicRowRaw, error: basicError } = await adminClient
            .from("campaign_bestiary_entries")
            .select("id, image_url")
            .eq("id", entryId)
            .eq("campaign_id", campaignId)
            .maybeSingle();

        if (basicError) return NextResponse.json({ error: basicError.message }, { status: 500 });

        const basicRow = (basicRowRaw ?? null) as BestiaryBasicRow | null;
        const entryRow: BestiaryStorageRow | null = basicRow
            ? {
                id: basicRow.id,
                image_url: basicRow.image_url ?? null,
                image_storage_bucket: null,
                image_storage_path: null,
            }
            : null;

        if (!entryRow?.id) {
            return NextResponse.json({ error: "Criatura no encontrada." }, { status: 404 });
        }

        const rowWithStorageRes = await adminClient
            .from("campaign_bestiary_entries")
            .select("id, image_url, image_storage_bucket, image_storage_path")
            .eq("id", entryId)
            .eq("campaign_id", campaignId)
            .maybeSingle();

        if (!rowWithStorageRes.error && rowWithStorageRes.data) {
            entryRow.image_url = rowWithStorageRes.data.image_url ?? null;
            entryRow.image_storage_bucket = rowWithStorageRes.data.image_storage_bucket ?? null;
            entryRow.image_storage_path = rowWithStorageRes.data.image_storage_path ?? null;
        } else if (rowWithStorageRes.error) {
            const lowered = String(rowWithStorageRes.error.message ?? "").toLowerCase();
            const missingStorageColumns =
                lowered.includes("image_storage_bucket") || lowered.includes("image_storage_path");
            if (!missingStorageColumns) {
                return NextResponse.json({ error: rowWithStorageRes.error.message }, { status: 500 });
            }
        }

        if (!entryRow.image_url || !entryRow.image_url.trim()) {
            return NextResponse.json({ imageUrl: "" });
        }

        let bucket = entryRow.image_storage_bucket ?? DEFAULT_BUCKET;
        let objectPath = entryRow.image_storage_path ?? null;

        if (!objectPath) {
            const parsed = parseStoragePublicUrl(entryRow.image_url);
            bucket = parsed.bucket ?? bucket;
            objectPath = parsed.objectPath ?? null;
        }

        if (objectPath) {
            const { error: removeError } = await adminClient.storage.from(bucket).remove([objectPath]);
            if (removeError) return NextResponse.json({ error: removeError.message }, { status: 500 });
        } else {
            const folder = `campaigns/${campaignId}/bestiary/${entryId}`;
            const { data: oldFiles, error: listError } = await adminClient.storage.from(bucket).list(folder, {
                limit: 100,
                offset: 0,
                sortBy: { column: "name", order: "asc" },
            });
            if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });
            if (oldFiles && oldFiles.length > 0) {
                const paths = oldFiles.map((entry) => `${folder}/${entry.name}`);
                const { error: removeError } = await adminClient.storage.from(bucket).remove(paths);
                if (removeError) return NextResponse.json({ error: removeError.message }, { status: 500 });
            }
        }

        const { error: updateWithStorageError } = await adminClient
            .from("campaign_bestiary_entries")
            .update({
                image_url: null,
                image_storage_bucket: null,
                image_storage_path: null,
            })
            .eq("id", entryId)
            .eq("campaign_id", campaignId);

        if (updateWithStorageError) {
            const lowered = String(updateWithStorageError.message ?? "").toLowerCase();
            const missingStorageColumns =
                lowered.includes("image_storage_bucket") || lowered.includes("image_storage_path");
            if (!missingStorageColumns) {
                return NextResponse.json({ error: updateWithStorageError.message }, { status: 500 });
            }

            const { error: fallbackUpdateError } = await adminClient
                .from("campaign_bestiary_entries")
                .update({ image_url: null })
                .eq("id", entryId)
                .eq("campaign_id", campaignId);

            if (fallbackUpdateError) {
                return NextResponse.json({ error: fallbackUpdateError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ imageUrl: "" });
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : "Error eliminando imagen de la criatura.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

