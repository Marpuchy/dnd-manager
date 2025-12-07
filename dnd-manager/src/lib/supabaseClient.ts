// usa NEXT_PUBLIC_* porque se ejecuta en el navegador
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_* env vars for client");
}

export const supabase = createClient(url, key);
