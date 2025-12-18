import { normalizeClassForApi } from "@/app/campaigns/[id]/player/playerShared";

/**
 * Habilidad / rasgo de clase
 */
export type ClassFeature = {
    index: string;
    name: string;
    desc?: string[];
};

/**
 * Obtiene todas las habilidades de clase hasta un nivel dado.
 * Combina SRD (API) + overrides manuales.
 */
export async function fetchClassFeatures(
    className: string,
    level: number
): Promise<ClassFeature[]> {
    const apiClass = normalizeClassForApi(className);
    if (!apiClass) return [];

    const featuresMap: Record<string, ClassFeature> = {};

    // 1️⃣ Habilidades SRD desde la API
    for (let lvl = 1; lvl <= level; lvl++) {
        const res = await fetch(
            `/api/dnd/classes/${apiClass}/levels/${lvl}`
        );

        if (!res.ok) continue;

        const data = await res.json();
        for (const f of data.features || []) {
            featuresMap[f.index] = f;
        }
    }

    // 2️⃣ Overrides manuales (no SRD)
    try {
        const { CLASS_FEATURE_OVERRIDES } = await import(
            "./classFeatureOverrides"
            );

        for (const f of CLASS_FEATURE_OVERRIDES[apiClass] || []) {
            featuresMap[f.index] = f;
        }
    } catch {
        // si no existe el archivo de overrides, no pasa nada
    }

    return Object.values(featuresMap);
}
