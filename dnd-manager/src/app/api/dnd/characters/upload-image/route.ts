import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const characterId = formData.get("characterId") as string;

    if (!file || !characterId) {
        return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const ext = file.name.split(".").pop();
    const filePath = `characters/${characterId}.${ext}`;

    // 1️⃣ Subir archivo
    const { error: uploadError } = await supabase.storage
        .from("character-images")
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 2️⃣ Obtener URL pública
    const { data } = supabase.storage
        .from("character-images")
        .getPublicUrl(filePath);

    const imageUrl = data.publicUrl;

    // 3️⃣ Leer details actuales
    const { data: character, error: readError } = await supabase
        .from("characters")
        .select("details")
        .eq("id", characterId)
        .single();

    if (readError) {
        return NextResponse.json({ error: readError.message }, { status: 500 });
    }

    // 4️⃣ Fusionar details (CLAVE)
    const newDetails = {
        ...(character?.details ?? {}),
        profile_image: imageUrl,
    };

    // 5️⃣ Guardar details
    const { error: updateError } = await supabase
        .from("characters")
        .update({ details: newDetails })
        .eq("id", characterId);

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ imageUrl });
}
