import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const BLANK_MAP_URL = "blank://default-map";
const DEFAULT_BUCKET = "campaign-map-images";

type RouteContext = {
    params: Promise<{
        id: string;
        mapId: string;
    }>;
};

type CampaignMapStorageRow = {
    id: string;
    image_url: string;
    image_storage_bucket: string | null;
    image_storage_path: string | null;
};

type CampaignMapBasicRow = {
    id: string;
    image_url: string;
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
        const mapId = String(params?.mapId ?? "").trim();

        if (!campaignId || !mapId) {
            return NextResponse.json(
                { error: "campaignId/mapId invalidos." },
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
            return NextResponse.json({ error: ownerRes.error.message }, { status: 500 });
        }
        if (memberRes.error) {
            return NextResponse.json({ error: memberRes.error.message }, { status: 500 });
        }

        const isOwner = ownerRes.data?.owner_id === user.id;
        const isDmMember = Boolean(memberRes.data?.user_id);
        if (!isOwner && !isDmMember) {
            return NextResponse.json(
                { error: "No tienes permisos de DM para esta campana." },
                { status: 403 }
            );
        }

        const { data: basicMapRaw, error: basicMapError } = await adminClient
            .from("campaign_maps")
            .select("id, image_url")
            .eq("id", mapId)
            .eq("campaign_id", campaignId)
            .maybeSingle();

        if (basicMapError) {
            return NextResponse.json({ error: basicMapError.message }, { status: 500 });
        }

        const basicMap = (basicMapRaw ?? null) as CampaignMapBasicRow | null;
        const mapRow: CampaignMapStorageRow | null = basicMap
            ? {
                id: basicMap.id,
                image_url: basicMap.image_url ?? BLANK_MAP_URL,
                image_storage_bucket: null,
                image_storage_path: null,
            }
            : null;

        if (!mapRow?.id) {
            return NextResponse.json({ error: "Mapa no encontrado." }, { status: 404 });
        }

        const mapWithStorageRes = await adminClient
            .from("campaign_maps")
            .select("id, image_url, image_storage_bucket, image_storage_path")
            .eq("id", mapId)
            .eq("campaign_id", campaignId)
            .maybeSingle();

        if (!mapWithStorageRes.error && mapWithStorageRes.data) {
            mapRow.image_url = mapWithStorageRes.data.image_url ?? BLANK_MAP_URL;
            mapRow.image_storage_bucket = mapWithStorageRes.data.image_storage_bucket ?? null;
            mapRow.image_storage_path = mapWithStorageRes.data.image_storage_path ?? null;
        } else if (mapWithStorageRes.error) {
            const lowered = String(mapWithStorageRes.error.message ?? "").toLowerCase();
            const missingStorageColumns =
                lowered.includes("image_storage_bucket")
                || lowered.includes("image_storage_path");
            if (!missingStorageColumns) {
                return NextResponse.json({ error: mapWithStorageRes.error.message }, { status: 500 });
            }
        }

        if (mapRow.image_url === BLANK_MAP_URL) {
            return NextResponse.json({ imageUrl: BLANK_MAP_URL });
        }

        let bucket = mapRow.image_storage_bucket ?? DEFAULT_BUCKET;
        let objectPath = mapRow.image_storage_path ?? null;

        if (!objectPath) {
            const parsed = parseStoragePublicUrl(mapRow.image_url);
            bucket = parsed.bucket ?? bucket;
            objectPath = parsed.objectPath ?? null;
        }

        if (objectPath) {
            const { error: removeError } = await adminClient.storage
                .from(bucket)
                .remove([objectPath]);
            if (removeError) {
                return NextResponse.json({ error: removeError.message }, { status: 500 });
            }
        } else {
            const folder = `campaigns/${campaignId}/maps/${mapId}`;
            const { data: oldFiles, error: listError } = await adminClient.storage
                .from(bucket)
                .list(folder, {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: "name", order: "asc" },
                });
            if (listError) {
                return NextResponse.json({ error: listError.message }, { status: 500 });
            }
            if (oldFiles && oldFiles.length > 0) {
                const paths = oldFiles.map((entry) => `${folder}/${entry.name}`);
                const { error: removeError } = await adminClient.storage
                    .from(bucket)
                    .remove(paths);
                if (removeError) {
                    return NextResponse.json({ error: removeError.message }, { status: 500 });
                }
            }
        }

        const { error: updateErrorWithStorageFields } = await adminClient
            .from("campaign_maps")
            .update({
                image_url: BLANK_MAP_URL,
                image_storage_bucket: null,
                image_storage_path: null,
            })
            .eq("id", mapId)
            .eq("campaign_id", campaignId);

        if (updateErrorWithStorageFields) {
            const lowered = String(updateErrorWithStorageFields.message ?? "").toLowerCase();
            const missingStorageColumns =
                lowered.includes("image_storage_bucket")
                || lowered.includes("image_storage_path");

            if (!missingStorageColumns) {
                return NextResponse.json(
                    { error: updateErrorWithStorageFields.message },
                    { status: 500 }
                );
            }

            const { error: fallbackUpdateError } = await adminClient
                .from("campaign_maps")
                .update({ image_url: BLANK_MAP_URL })
                .eq("id", mapId)
                .eq("campaign_id", campaignId);

            if (fallbackUpdateError) {
                return NextResponse.json({ error: fallbackUpdateError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ imageUrl: BLANK_MAP_URL });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Error eliminando imagen del mapa.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
