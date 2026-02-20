import { describe, expect, it } from "vitest";
import { __assistantTestHooks } from "../src/app/api/ai/campaigns/[id]/assistant/route";

function normalizeText(value: string | undefined) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

describe("assistant bestiary prompt regressions", () => {
  const prompt = `🐉 Combate Importante: Dragón de los Caídos
Nombre: Dragón de los Caídos
Tipo: Dragón no muerto (único, invocado)
Lugar: Catacumbas reales — una cripta inmensa donde yacen reyes olvidados; columnas agrietadas, niebla verdosa cubriendo el suelo, ecos lejanos y huesos esparcidos por doquier.
HP: 150
CA: 18
Velocidad: 9 m | Vuelo: 15 m
🫧 Aliento de Putrefacción (Recarga 5–6)
 Cono de 15 metros.
 Todos los objetivos deben hacer una tirada de Constitución (CD 15).
Fallo: 3d6 daño necrótico.


Éxito: Mitad de daño.


🦴 Mordisco de los Caídos
 +3 al ataque, alcance 1,5 m, un objetivo.
Impacto: 1d10 +3 daño perforante. Si el objetivo es reducido a 0 PV por este ataque, su alma se enreda brevemente en el dragón, dándole resistencia al daño mágico durante 1 turno.
🧟‍♂️ Resurrección de Esbirros
 Cada 2 turnos, invoca 1d4 esqueletos nobles que emergen del suelo a su alrededor.
 Los esqueletos tienen armas oxidadas pero atacan inmediatamente tras ser invocados.
💀 Corazón del Reino (Pasiva)
Mientras el pergamino ritual incrustado en su pecho esté intacto, el dragón regenera 5 PV por turno.
Un personaje puede intentar destruirlo con un ataque directo (CD 17 para impactar, 15 PV de daño para romperlo). Se requiere verlo primero con una tirada exitosa de Percepción (CD 14).


Debilidad:
Atacar el Pergamino del Alma incrustado en su pecho (Impacto CD 17). Si se destruye:


Detiene regeneración


Inflige 2d10 daño instantáneo`;

  const azathothPrompt = `👁️‍🗨️ Enemigo: Azathoth, Eco del Abismo
Nombre: Azathoth, Eco del Abismo
Tipo: Aberración Menor
Lugar: surge de la puerta misma; alrededor, el terreno empieza a deformarse: baldosas que se quiebran, sombras que se alargan, voces que ríen en idiomas imposibles.
HP: 80
CA: 16
Velocidad: 9 m | Flotación: 12 m
Habilidades
Rayo de Locura (Recarga 5-6)
Línea de 12 m. Tirada de Sabiduría (CD 14).
Fallo: 2d8 daño psíquico + Confusión (1 turno).
Éxito: mitad de daño.
Tentáculo del Abismo
+4 al ataque, alcance 3 m, un objetivo.
Impacto: 1d8 +2 daño contundente. Fuerza (CD 13) o el objetivo es arrastrado 1,5 m más cerca.
Grito Estelar (1 vez por combate)
Todos en un radio de 6 m hacen Constitución (CD 15).
Fallo: 3d6 necrótico + Aturdido hasta su próximo turno.
Éxito: mitad de daño.
Pasiva: Puerta Aleatoria
Mientras la puerta permanezca abierta, Azathoth regenera 3 PV por turno.
Un personaje puede intentar cerrarla con un ritual improvisado: Arcana o Religión (CD 15, 1 acción completa). Si se logra, la regeneración se detiene y la puerta empieza a desvanecerse.`;

  it("parses composite speed walk+fly", () => {
    const speed = __assistantTestHooks.parseBestiarySpeedRecordFromInstruction(prompt);
    expect(speed).toMatchObject({ walk: 9, fly: 15 });
  });

  it("does not convert location into an action block", () => {
    const blocks = __assistantTestHooks.parseBestiaryBlocksFromInstruction(prompt);
    const actionNames = (blocks.actions ?? []).map((entry) => normalizeText(entry.name));
    expect(actionNames.some((entry) => entry.includes("lugar"))).toBe(false);
  });

  it("keeps outcome lines inside action descriptions instead of creating fake actions", () => {
    const blocks = __assistantTestHooks.parseBestiaryBlocksFromInstruction(prompt);
    const actionNames = (blocks.actions ?? []).map((entry) => normalizeText(entry.name));

    expect(actionNames).not.toContain("fallo");
    expect(actionNames).not.toContain("exito");

    const actionWithOutcomes = (blocks.actions ?? []).find((entry) => {
      const desc = normalizeText(entry.desc);
      return desc.includes("fallo:") && desc.includes("exito:");
    });

    expect(actionWithOutcomes).toBeDefined();
    expect(normalizeText(actionWithOutcomes?.desc)).toContain("fallo:");
    expect(normalizeText(actionWithOutcomes?.desc)).toContain("exito:");
  });

  it("maps passive abilities to traits", () => {
    const blocks = __assistantTestHooks.parseBestiaryBlocksFromInstruction(prompt);
    const traitNames = (blocks.traits ?? []).map((entry) => normalizeText(entry.name));
    const actionNames = (blocks.actions ?? []).map((entry) => normalizeText(entry.name));

    expect(
      traitNames.some((entry) => entry.includes("corazon del reino") && entry.includes("pasiva"))
    ).toBe(true);
    expect(
      actionNames.some((entry) => entry.includes("corazon del reino") && entry.includes("pasiva"))
    ).toBe(false);
  });

  it("captures weakness follow-up lines as part of weaknesses", () => {
    const qualities = __assistantTestHooks.parseBestiaryCombatQualitiesFromInstruction(prompt);
    const weak = qualities.weaknesses.map((entry) => normalizeText(entry));

    expect(weak.some((entry) => entry.includes("detiene regeneracion"))).toBe(true);
    expect(weak.some((entry) => entry.includes("inflige 2d10 dano instantaneo"))).toBe(true);
  });

  it("splits embedded action headings from long packed lines", () => {
    const packedLine =
      "Fallo: 3d6 daño necrótico. Éxito: mitad de daño. Mordisco de los Caídos +3 al ataque, alcance 1,5 m, un objetivo.";

    const pieces = __assistantTestHooks.splitBestiaryEmbeddedBlockLine(packedLine).map(normalizeText);

    expect(pieces.length).toBeGreaterThan(1);
    expect(pieces.some((entry) => entry.includes("mordisco de los caidos"))).toBe(true);
  });

  it("replaces overpacked desc with cleaner inferred desc when names match", () => {
    const merged = __assistantTestHooks.mergeBestiaryBlockPatchLists(
      [
        {
          name: "Aliento de Putrefacción (Recarga 5-6)",
          desc:
            "Cono 15 m. Fallo: 3d6. Exito: mitad. Mordisco de los Caidos +3 al ataque. Impacto: 1d10+3. Resurreccion de Esbirros cada 2 turnos.",
        },
      ],
      [
        {
          name: "Aliento de Putrefacción (Recarga 5-6)",
          desc: "Cono 15 m. Todos tiran CON CD 15. Fallo: 3d6 necrotico. Exito: mitad.",
        },
      ]
    );

    const desc = normalizeText(merged.merged?.[0]?.desc);
    expect(desc).toContain("fallo:");
    expect(desc).toContain("exito:");
    expect(desc.includes("mordisco de los caidos")).toBe(false);
  });

  it("maps float/hover speed phrases to fly while keeping walk", () => {
    const speed = __assistantTestHooks.parseBestiarySpeedRecordFromInstruction(azathothPrompt);
    expect(speed).toMatchObject({ walk: 9, fly: 12 });
  });

  it("keeps passive ritual lines inside the passive trait and avoids narrative meta pseudo-actions", () => {
    const blocks = __assistantTestHooks.parseBestiaryBlocksFromInstruction(azathothPrompt);
    const actionNames = (blocks.actions ?? []).map((entry) => normalizeText(entry.name));
    const traitNames = (blocks.traits ?? []).map((entry) => normalizeText(entry.name));

    expect(actionNames.some((entry) => entry.includes("enemigo"))).toBe(false);
    expect(actionNames.some((entry) => entry.includes("lugar"))).toBe(false);
    expect(
      actionNames.some((entry) => entry.includes("un personaje puede intentar cerrarla"))
    ).toBe(false);

    expect(traitNames.some((entry) => entry.includes("puerta aleatoria"))).toBe(true);
    const passive = (blocks.traits ?? []).find((entry) =>
      normalizeText(entry.name).includes("puerta aleatoria")
    );
    expect(normalizeText(passive?.desc)).toContain("arcana o religion");
    expect(normalizeText(passive?.desc)).toContain("regenera 3 pv");
  });
});
