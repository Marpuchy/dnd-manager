import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

type RouteContext = {
    params: Promise<{
        id: string;
        mapId: string;
    }>;
};

type CampaignMapStorageRow = {
    id: string;
    image_storage_bucket: string | null;
    image_storage_path: string | null;
};

type CampaignMapBasicRow = {
    id: string;
};

function extractBearerToken(header: string | null) {
    if (!header) return null;
    const normalized = header.trim();
    if (!normalized.toLowerCase().startsWith("bearer ")) return null;
    const token = normalized.slice(7).trim();
    return token.length > 0 ? token : null;
}

function getFileExtension(file: File) {
    const rawExt = file.name.split(".").pop()?.trim().toLowerCase() ?? "";
    if (rawExt && /^[a-z0-9]+$/.test(rawExt)) return rawExt;

    if (file.type === "image/png") return "png";
    if (file.type === "image/jpeg") return "jpg";
    if (file.type === "image/webp") return "webp";
    if (file.type === "image/gif") return "gif";
    return "png";
}

async function ensureBucketReady(adminClient: any, bucket: string) {
    const { data: bucketData, error: bucketError } = await adminClient.storage.getBucket(bucket);

    if (!bucketError && bucketData) {
        if (!bucketData.public) {
            const { error: updateError } = await adminClient.storage.updateBucket(bucket, {
                public: true,
                fileSizeLimit: MAX_IMAGE_BYTES,
                allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
            });
            if (updateError) throw updateError;
        }
        return;
    }

    const { error: createError } = await adminClient.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: MAX_IMAGE_BYTES,
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    });

    if (createError && !createError.message.toLowerCase().includes("already exists")) {
        throw createError;
    }
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

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
        }
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "El archivo debe ser una imagen valida." },
                { status: 400 }
            );
        }
        if (file.size > MAX_IMAGE_BYTES) {
            return NextResponse.json(
                { error: "La imagen supera el limite de 50 MB." },
                { status: 400 }
            );
        }

        const { data: basicMapRaw, error: basicMapError } = await adminClient
            .from("campaign_maps")
            .select("id")
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
                image_storage_bucket: null,
                image_storage_path: null,
            }
            : null;

        if (!mapRow?.id) {
            return NextResponse.json({ error: "Mapa no encontrado." }, { status: 404 });
        }

        const mapWithStorageRes = await adminClient
            .from("campaign_maps")
            .select("id, image_storage_bucket, image_storage_path")
            .eq("id", mapId)
            .eq("campaign_id", campaignId)
            .maybeSingle();

        if (!mapWithStorageRes.error && mapWithStorageRes.data) {
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

        const bucket = "campaign-map-images";
        await ensureBucketReady(adminClient, bucket);

        const folder = `campaigns/${campaignId}/maps/${mapId}`;
        const oldBucket = mapRow.image_storage_bucket ?? bucket;
        const oldPath = mapRow.image_storage_path ?? null;

        if (oldPath) {
            const { error: removeError } = await adminClient.storage
                .from(oldBucket)
                .remove([oldPath]);
            if (removeError) {
                return NextResponse.json({ error: removeError.message }, { status: 500 });
            }
        } else {
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

        const ext = getFileExtension(file);
        const path = `${folder}/${Date.now()}.${ext}`;

        const { error: uploadError } = await adminClient.storage
            .from(bucket)
            .upload(path, file, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        const { data: publicData } = adminClient.storage.from(bucket).getPublicUrl(path);
        const imageUrl = publicData?.publicUrl ?? "";

        if (!imageUrl) {
            return NextResponse.json(
                { error: "No se pudo obtener la URL publica." },
                { status: 500 }
            );
        }

        const { error: updateErrorWithStorageFields } = await adminClient
            .from("campaign_maps")
            .update({
                image_url: imageUrl,
                image_storage_bucket: bucket,
                image_storage_path: path,
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
                .update({ image_url: imageUrl })
                .eq("id", mapId)
                .eq("campaign_id", campaignId);

            if (fallbackUpdateError) {
                return NextResponse.json({ error: fallbackUpdateError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ imageUrl });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Error subiendo imagen del mapa.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

