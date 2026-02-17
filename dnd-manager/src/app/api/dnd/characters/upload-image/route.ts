import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServiceClient() {
    const supabaseUrl =
        process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        return null;
    }

    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false },
    });
}

export async function POST(req: Request) {
    try {
        const supabase = getSupabaseServiceClient();
        if (!supabase) {
            return NextResponse.json(
                { error: "Faltan variables de entorno de Supabase en el servidor." },
                { status: 500 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const characterId = formData.get("characterId") as string | null;

        if (!file || !characterId) {
            return NextResponse.json(
                { error: "Datos incompletos" },
                { status: 400 }
            );
        }

        const { data: oldFiles } = await supabase.storage
            .from("character-images")
            .list(`characters/${characterId}`);

        if (oldFiles && oldFiles.length > 0) {
            const paths = oldFiles.map(
                (storedFile) => `characters/${characterId}/${storedFile.name}`
            );

            await supabase.storage.from("character-images").remove(paths);
        }

        const ext = file.name.split(".").pop() ?? "png";
        const filePath = `characters/${characterId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from("character-images")
            .upload(filePath, file, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            return NextResponse.json(
                { error: uploadError.message },
                { status: 500 }
            );
        }

        const { data } = supabase.storage
            .from("character-images")
            .getPublicUrl(filePath);

        if (!data?.publicUrl) {
            return NextResponse.json(
                { error: "No se pudo obtener la URL publica" },
                { status: 500 }
            );
        }

        const imageUrl = data.publicUrl;

        const { error: updateError } = await supabase
            .from("characters")
            .update({ profile_image: imageUrl })
            .eq("id", characterId);

        if (updateError) {
            return NextResponse.json(
                { error: updateError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ imageUrl });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
