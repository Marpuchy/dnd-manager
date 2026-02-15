import { normalizeClassForApi } from "@/app/campaigns/[id]/player/playerShared";

export type ClassFeature = {
  index: string;
  name: string;
  desc?: string[];
};

export async function fetchClassFeatures(
  className: string,
  level: number,
  locale: "en" | "es" = "en"
): Promise<ClassFeature[]> {
  const apiClass = normalizeClassForApi(className);
  if (!apiClass || level < 1) return [];

  const featuresMap: Record<string, ClassFeature> = {};

  for (let lvl = 1; lvl <= level; lvl += 1) {
    try {
      const res = await fetch(
        `/api/dnd/classes/${apiClass}/levels/${lvl}?locale=${locale}`
      );
      if (!res.ok) continue;

      const data = await res.json();
      const features = Array.isArray(data?.features) ? data.features : [];
      for (const feature of features) {
        if (feature?.index) {
          featuresMap[feature.index] = feature;
        }
      }
    } catch {
      // keep rendering with available data
    }
  }

  try {
    const { CLASS_FEATURE_OVERRIDES } = await import("./classFeatureOverrides");
    for (const feature of CLASS_FEATURE_OVERRIDES[apiClass] || []) {
      featuresMap[feature.index] = feature;
    }
  } catch {
    // optional overrides file
  }

  return Object.values(featuresMap);
}
