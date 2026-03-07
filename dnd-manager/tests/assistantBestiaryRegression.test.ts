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

  const crimsonBatPrompt = `🦇 Murciélago Alfa Carmesí (Versión Simplificada)
Bestia Grande, no alineada

Clase de Armadura 15
Puntos de Golpe 90 (12d10 + 24)
Velocidad 9 m., vuelo 21 m.
FUE 18 (+4)
DES 16 (+3)
CON 15 (+2)
INT 4 (−3)
SAB 14 (+2)
CAR 8 (−1)

Habilidades Percepción +5
Sentidos vista en la oscuridad 24 m., Percepción pasiva 15
Idiomas —
Desafío 4 (1.100 PX)

Rasgos
Ecolocalización. No puede usar vista en la oscuridad mientras esté ensordecido.
Líder del Enjambre. Los murciélagos aliados a 9 m. infligen +2 al daño mientras el Alfa esté consciente.

Acciones
Multiataque
El Alfa realiza dos ataques de Mordida.
Mordida
Ataque de arma cuerpo a cuerpo: +6 al ataque, alcance 1,5 m., un objetivo.
Impacto: 12 (2d8 + 3) de daño perforante.
Chillido Ultrasónico (1/Día)
Cada criatura a 9 m. que pueda oírlo debe hacer una TS de Constitución CD 14.
Fallo: 13 (3d8) de daño psíquico.
Éxito: mitad del daño.`;

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

  it("parses compact spanish statblock headers and keeps explicit core fields", () => {
    const core = __assistantTestHooks.parseBestiaryExplicitCorePatchFromInstruction(
      crimsonBatPrompt
    );

    expect(normalizeText(core.name)).toContain("murcielago alfa carmesi");
    expect(normalizeText(core.creature_type ?? undefined)).toBe("bestia");
    expect(normalizeText(core.creature_size ?? undefined)).toBe("large");
    expect(normalizeText(core.alignment ?? undefined)).toBe("no alineada");
    expect(core.challenge_rating).toBe(4);
    expect(core.armor_class).toBe(15);
    expect(core.hit_points).toBe(90);
    expect(normalizeText(core.hit_dice ?? undefined)).toBe("12d10+24");
    expect(core.xp).toBe(1100);
    expect(core.ability_scores).toMatchObject({
      STR: 18,
      DEX: 16,
      CON: 15,
      INT: 4,
      WIS: 14,
      CHA: 8,
    });
    expect(core.speed).toMatchObject({ walk: 9, fly: 21 });
  });

  it("maps spanish trait/action headings and keeps attack sublines inside mordida", () => {
    const blocks = __assistantTestHooks.parseBestiaryBlocksFromInstruction(crimsonBatPrompt);
    const traitNames = (blocks.traits ?? []).map((entry) => normalizeText(entry.name));
    const actionNames = (blocks.actions ?? []).map((entry) => normalizeText(entry.name));

    expect(traitNames.some((entry) => entry.includes("ecolocalizacion"))).toBe(true);
    expect(traitNames.some((entry) => entry.includes("lider del enjambre"))).toBe(true);

    expect(actionNames.some((entry) => entry.includes("multiataque"))).toBe(true);
    expect(actionNames.some((entry) => entry.includes("mordida"))).toBe(true);
    expect(actionNames.some((entry) => entry.includes("chillido ultrasonico"))).toBe(true);
    expect(actionNames.some((entry) => entry.includes("ataque de arma cuerpo a cuerpo"))).toBe(
      false
    );
    expect(actionNames.some((entry) => entry.includes("puntos de golpe"))).toBe(false);
  });

  it("uses selected bestiary context when user says 'edita esta criatura'", () => {
    const actions = __assistantTestHooks.buildHeuristicBestiaryActionsForTest({
      instruction: "edita esta criatura y pon clase de armadura 17",
      clientContext: {
        surface: "dm",
        section: "bestiary",
        selectedBestiaryEntry: {
          id: "entry-bat-1",
          name: "Murciélago Alfa Carmesí",
        },
        availableActions: [],
        hints: [],
      },
      visibleBestiaryEntries: [
        {
          id: "entry-bat-1",
          name: "Murciélago Alfa Carmesí",
        },
      ],
    });

    expect(actions.length).toBe(1);
    expect(actions[0].operation).toBe("update");
    expect(actions[0].data.bestiary_patch?.target_entry_id).toBe("entry-bat-1");
    expect(actions[0].data.bestiary_patch?.armor_class).toBe(17);
  });

  it("ignores prompt-template meta lines when editing a selected bestiary creature", () => {
    const templatePrompt = `Edita la criatura existente del bestiario; no crees una nueva.

Objetivo:
- Si hay una criatura seleccionada en el bestiario, esa es el objetivo ("esta criatura").
- Si no hay selección, busca por nombre exacto: "Grande".

Corrige la criatura para que quede exactamente así:
- Nombre: Murciélago Alfa Carmesí
- Tamaño: Grande
- Tipo: Bestia
- Alineamiento: no alineada
- Clase de armadura: 15
- Puntos de golpe: 90 (12d10 + 24)
- Velocidad: 9 m., vuelo 21 m.
- FUE 18 (+4), DES 16 (+3), CON 15 (+2), INT 4 (-3), SAB 14 (+2), CAR 8 (-1)
- Habilidades: Percepción +5
- Sentidos: vista en la oscuridad 24 m., Percepción pasiva 15
- Idiomas: —
- Desafío: 4 (1.100 PX)

Rasgos:
1) Ecolocalización. No puede usar vista en la oscuridad mientras esté ensordecido.
2) Líder del Enjambre. Los murciélagos aliados a 9 m. infligen +2 al daño mientras el Alfa esté consciente.

Acciones (separadas, no mezcladas):
1) Multiataque. El Alfa realiza dos ataques de Mordida.
2) Mordida. Ataque de arma cuerpo a cuerpo: +6 al ataque, alcance 1,5 m., un objetivo. Impacto: 12 (2d8 + 3) de daño perforante.
3) Chillido Ultrasónico (1/Día). Cada criatura a 9 m. que pueda oírlo debe hacer una TS de Constitución CD 14. Fallo: 13 (3d8) de daño psíquico. Éxito: mitad del daño.

Reglas estrictas:
- No metas atributos/rasgos dentro del campo de acciones.
- No cambies el nombre por texto accidental del prompt.
- Devuelve solo acciones de edición de bestiario.

Referencia contextual activa para bestiario (úsala solo si el usuario dice 'esta criatura' o similar): id=f679d49c-1060-40d8-ab17-150da675813e | name=Grande`;

    const actions = __assistantTestHooks.buildHeuristicBestiaryActionsForTest({
      instruction: templatePrompt,
      clientContext: {
        surface: "dm",
        section: "bestiary",
        selectedBestiaryEntry: {
          id: "f679d49c-1060-40d8-ab17-150da675813e",
          name: "Grande",
        },
        availableActions: [],
        hints: [],
      },
      visibleBestiaryEntries: [
        {
          id: "f679d49c-1060-40d8-ab17-150da675813e",
          name: "Grande",
        },
      ],
    });

    expect(actions.length).toBe(1);
    expect(actions[0].operation).toBe("update");
    expect(actions[0].data.bestiary_patch?.target_entry_id).toBe(
      "f679d49c-1060-40d8-ab17-150da675813e"
    );
    expect(actions[0].data.bestiary_patch?.name).toBe("Murciélago Alfa Carmesí");
    expect(actions[0].data.bestiary_patch?.creature_size).toBe("Grande");
    expect(actions[0].data.bestiary_patch?.creature_type).toBe("Bestia");
    expect(actions[0].data.bestiary_patch?.challenge_rating).toBe(4);
    expect(actions[0].data.bestiary_patch?.speed).toMatchObject({ walk: 9, fly: 21 });

    const traitNames = (actions[0].data.bestiary_patch?.traits ?? []).map((entry) =>
      normalizeText(entry.name)
    );
    expect(traitNames.some((entry) => entry.includes("referencia contextual"))).toBe(false);
    expect(traitNames.some((entry) => entry.includes("reglas estrictas"))).toBe(false);

    const actionNames = (actions[0].data.bestiary_patch?.actions ?? []).map((entry) =>
      normalizeText(entry.name)
    );
    expect(actionNames).toContain("multiataque");
    expect(actionNames).toContain("mordida");
    expect(actionNames.some((entry) => entry.includes("sentidos"))).toBe(false);
  });

  it("infers update in bestiary section when a statblock matches an existing creature name", () => {
    const actions = __assistantTestHooks.buildHeuristicBestiaryActionsForTest({
      instruction: crimsonBatPrompt,
      clientContext: {
        surface: "dm",
        section: "bestiary",
        availableActions: [],
        hints: [],
      },
      visibleBestiaryEntries: [
        {
          id: "entry-crimson-bat",
          name: "Murciélago Alfa Carmesí",
        },
      ],
    });

    expect(actions.length).toBe(1);
    expect(actions[0].operation).toBe("update");
    expect(actions[0].data.bestiary_patch?.target_entry_id).toBe("entry-crimson-bat");
    expect(actions[0].data.bestiary_patch?.name).toBe("Murciélago Alfa Carmesí");
  });

  it("infers create in bestiary section when a statblock name is new", () => {
    const actions = __assistantTestHooks.buildHeuristicBestiaryActionsForTest({
      instruction: crimsonBatPrompt,
      clientContext: {
        surface: "dm",
        section: "bestiary",
        availableActions: [],
        hints: [],
      },
      visibleBestiaryEntries: [],
    });

    expect(actions.length).toBe(1);
    expect(actions[0].operation).toBe("create");
    expect(actions[0].data.bestiary_patch?.name).toBe("Murciélago Alfa Carmesí");
  });

  it("defaults to create when selected creature name does not match incoming statblock", () => {
    const actions = __assistantTestHooks.buildHeuristicBestiaryActionsForTest({
      instruction: crimsonBatPrompt,
      clientContext: {
        surface: "dm",
        section: "bestiary",
        selectedBestiaryEntry: {
          id: "entry-other",
          name: "Grande",
        },
        availableActions: [],
        hints: [],
      },
      visibleBestiaryEntries: [
        {
          id: "entry-other",
          name: "Grande",
        },
      ],
    });

    expect(actions.length).toBe(1);
    expect(actions[0].operation).toBe("create");
    expect(actions[0].data.bestiary_patch?.target_entry_id).toBeUndefined();
    expect(actions[0].data.bestiary_patch?.name).toBe("Murciélago Alfa Carmesí");
  });
});
