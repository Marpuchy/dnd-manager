import { describe, expect, it } from "vitest";
import { getDictionary } from "../src/lib/i18n/getDictionary";
import { translateText } from "../src/lib/translation/translator";

describe("i18n", () => {
  it("returns Spanish dictionary by default", () => {
    const dict = getDictionary("es");
    expect(dict.common.enter).toBe("Entrar");
  });
});

describe("translation", () => {
  it("falls back to input when provider is disabled", async () => {
    process.env.TRANSLATION_PROVIDER = "none";
    const result = await translateText({ text: "Hello", target: "es" });
    expect(result).toBe("Hello");
  });
});
