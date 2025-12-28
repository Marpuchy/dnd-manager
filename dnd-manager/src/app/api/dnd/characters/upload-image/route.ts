import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const characterId = formData.get("characterId") as string | null;

        if (!file || !characterId) {
            return NextResponse.json(
                { error: "Datos incompletos" },
                { status: 400 }
            );
        }

        /* ────────────────
           1️⃣ BORRAR imágenes antiguas
        ──────────────── */

        const { data: oldFiles } = await supabase.storage
            .from("character-images")
            .list(`characters/${characterId}`);

        if (oldFiles && oldFiles.length > 0) {
            const paths = oldFiles.map(
                (f) => `characters/${characterId}/${f.name}`
            );

            await supabase.storage
                .from("character-images")
                .remove(paths);
        }

        /* ────────────────
           2️⃣ Subir nueva imagen
        ──────────────── */

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

        /* ────────────────
           3️⃣ Obtener URL pública
        ──────────────── */

        const { data } = supabase.storage
            .from("character-images")
            .getPublicUrl(filePath);

        if (!data?.publicUrl) {
            return NextResponse.json(
                { error: "No se pudo obtener la URL pública" },
                { status: 500 }
            );
        }

        const imageUrl = data.publicUrl;

        /* ────────────────
           4️⃣ Guardar URL en BD
        ──────────────── */

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
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message ?? "Error desconocido" },
            { status: 500 }
        );
    }
}
