const memoryCache = new Map<string, string>();

type TranslateInput = {
  text: string;
  source?: string;
  target: string;
};

export async function translateText({ text, source, target }: TranslateInput) {
  const cacheKey = `${source ?? "auto"}:${target}:${text}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) return cached;

  const provider = process.env.TRANSLATION_PROVIDER ?? "none";
  if (provider === "none") {
    return text;
  }

  if (provider === "libretranslate") {
    const endpoint = process.env.TRANSLATION_ENDPOINT;
    if (!endpoint) return text;

    const res = await fetch(`${endpoint.replace(/\/$/, "")}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        source: source ?? "auto",
        target,
        format: "text",
        api_key: process.env.TRANSLATION_API_KEY,
      }),
    });

    if (!res.ok) return text;

    const data = (await res.json()) as { translatedText?: string };
    const translated = data.translatedText ?? text;
    memoryCache.set(cacheKey, translated);
    return translated;
  }

  return text;
}

export async function translateBatch(
  items: TranslateInput[],
): Promise<string[]> {
  const results: string[] = [];
  for (const item of items) {
    results.push(await translateText(item));
  }
  return results;
}
