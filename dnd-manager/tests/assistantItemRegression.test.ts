import { describe, expect, it } from "vitest";
import { __assistantTestHooks } from "../src/app/api/ai/campaigns/[id]/assistant/route";

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

describe("assistant item parsing regressions", () => {
  it("splits generic sections into concrete attachments (Brazo Prostetico CRAK)", () => {
    const instruction = `🤖 Brazo Prostético “CRAK” (Objeto mágico único)
Tipo: prótesis mágica (arma/herramienta)
Rareza inicial: común
Requiere vinculación: artificiero
Estado inicial: versión prototipo
Personalidad: Sí

---

📌 Características básicas
Daño añadido: +1d4 al arma con la que ataques
Propiedades:
Puede usarse como foco arcano de artificiero.
Funciona como una mano funcional (agarra, manipula, sostiene herramientas).
Bonificación mágica: +0
Obtienes ventaja al crear o modificar objetos.

---

✨ Propiedades especiales
Herramienta viva: CRAK cuenta como un conjunto de thieves’ tools o tinker’s tools integrado, a tu elección cada día tras un descanso largo.
Canalizador prostético: Puedes canalizar Mending o Prestidigitation a través del brazo al tocar una superficie.
Alma compartida: CRAK “opina” con chasquidos, vibraciones o chispazos cuando le gusta o disgusta algo.
añade esto a navi`;

    const patch = __assistantTestHooks.parseStructuredItemPatchFromInstruction({
      instruction,
      candidateItemNames: [],
    });

    expect(patch).toBeDefined();
    expect(patch?.create_if_missing).toBe(true);

    const attachments = patch?.attachments_replace ?? [];
    const attachmentNames = attachments.map((entry) => normalizeName(entry.name));
    const attachmentDescriptions = attachments
      .map((entry) => (typeof entry.description === "string" ? entry.description : ""))
      .join("\n")
      .toLowerCase();
    const aggregateText = `${patch?.description ?? ""}\n${attachmentDescriptions}`.toLowerCase();

    expect(attachments.length).toBeGreaterThanOrEqual(4);
    expect(attachmentNames).not.toContain("funcionamiento");
    expect(attachmentNames).toContain(normalizeName("Herramienta viva"));
    expect(attachmentNames).toContain(normalizeName("Canalizador prostético"));
    expect(attachmentNames).toContain(normalizeName("Alma compartida"));
    expect(aggregateText).toContain("daño añadido: +1d4");
    expect(aggregateText).toContain("foco arcano de artificiero");
    expect(aggregateText).toContain("funciona como una mano funcional");
    expect(aggregateText).toContain("obtienes ventaja al crear o modificar objetos");
  });

  it("infers save ability (CON) and damage from spell description", () => {
    const normalized = __assistantTestHooks.normalizeAttachmentPatchList([
      {
        type: "spell",
        name: "Propagación Latente del Velo",
        description:
          "Salvación: Constitución (CD = CD de conjuros del druida)\n2d6 daño necrótico",
      },
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.type).toBe("spell");
    expect(normalized[0]?.save?.type).toBe("save");
    expect(normalized[0]?.save?.save_ability).toBe("CON");
    expect(normalized[0]?.damage?.dice).toBe("2d6");
  });

  it("parses batch item creation lines without polluting item names with price", () => {
    const instruction = `Cuerda Feérica (15 m) – 35 po
No hace ruido
No deja marcas
Se autoenrolla

Polvo de Huella Borrada – 50 po
Uso: acción
Efecto: no deja rastros durante 1 hora

crea estos 2 objetos en kaelden`;

    const patches = __assistantTestHooks.parseStructuredItemBatchPatchesFromInstruction({
      instruction,
      candidateItemNames: [],
    });

    expect(patches).toHaveLength(2);

    const ropePatch = patches.find((entry) =>
      normalizeName(entry.target_item_name).includes(normalizeName("Cuerda Feérica"))
    );
    const powderPatch = patches.find((entry) =>
      normalizeName(entry.target_item_name).includes(
        normalizeName("Polvo de Huella Borrada")
      )
    );

    expect(ropePatch).toBeDefined();
    expect(powderPatch).toBeDefined();
    expect(ropePatch?.target_item_name).not.toMatch(/\b\d+\s*(?:po|gp|pp|sp|cp)\b/i);
    expect(powderPatch?.target_item_name).not.toMatch(/\b\d+\s*(?:po|gp|pp|sp|cp)\b/i);

    const powderAttachments = powderPatch?.attachments_replace ?? [];
    expect(powderAttachments.length).toBeGreaterThanOrEqual(1);
    expect(powderAttachments[0]?.type).toBe("action");
  });
});
