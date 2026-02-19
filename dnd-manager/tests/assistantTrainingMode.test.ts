import { describe, expect, it } from "vitest";
import { __assistantTestHooks } from "../src/app/api/ai/campaigns/[id]/assistant/route";

describe("assistant training mode helpers", () => {
  it("normalizes assistant mode safely", () => {
    expect(__assistantTestHooks.normalizeAssistantMode(undefined)).toBe("normal");
    expect(__assistantTestHooks.normalizeAssistantMode("normal")).toBe("normal");
    expect(__assistantTestHooks.normalizeAssistantMode("training")).toBe("training");
    expect(__assistantTestHooks.normalizeAssistantMode("entrenamiento")).toBe(
      "training"
    );
    expect(__assistantTestHooks.normalizeAssistantMode("otra-cosa")).toBe("normal");
  });

  it("normalizes training submode safely", () => {
    expect(__assistantTestHooks.normalizeTrainingSubmode(undefined)).toBe(
      "sandbox_object"
    );
    expect(__assistantTestHooks.normalizeTrainingSubmode("ai_prompt")).toBe(
      "ai_prompt"
    );
    expect(__assistantTestHooks.normalizeTrainingSubmode("prompt")).toBe(
      "ai_prompt"
    );
    expect(__assistantTestHooks.normalizeTrainingSubmode("sandbox")).toBe(
      "sandbox_object"
    );
  });

  it("detects prompt-coaching requests", () => {
    expect(
      __assistantTestHooks.isTrainingPromptRequest(
        "modo entrenamiento: mejora este prompt para crear un objeto"
      )
    ).toBe(true);
    expect(
      __assistantTestHooks.isTrainingPromptRequest(
        "sube a nivel 5 a Kaelden y pon 16 en DEX"
      )
    ).toBe(false);
  });

  it("detects training approval intent", () => {
    expect(
      __assistantTestHooks.isTrainingApprovalIntent(
        "Instruccion actual del usuario: está correcto"
      )
    ).toBe(true);
    expect(
      __assistantTestHooks.isTrainingApprovalIntent(
        "Instruccion actual del usuario: crea otro objeto"
      )
    ).toBe(false);
  });

  it("builds a coaching reply with a prompt template", () => {
    const reply = __assistantTestHooks.buildTrainingModeReply({
      prompt:
        "Instruccion actual del usuario: crea un objeto raro para Kaelden con 1 pasiva y 1 accion",
      role: "PLAYER",
      trainingSubmode: "sandbox_object",
      clientContext: {
        surface: "player",
        availableActions: [],
        hints: [],
        selectedCharacter: { name: "Kaelden" },
      },
      actionCount: 1,
    });

    expect(reply).toContain("Modo entrenamiento activo");
    expect(reply).toContain("sandbox");
    expect(reply).toContain("Prompt recomendado");
    expect(reply).toContain("Kaelden");
    expect(reply).toContain("Acción");
  });

  it("builds a fictional training draft with editable actions", () => {
    const draft = __assistantTestHooks.buildTrainingFictionalDraft({
      prompt: "Instruccion actual del usuario: objeto de hielo para druida",
      targetCharacterId: "char-1",
      clientContext: {
        surface: "player",
        availableActions: [],
        hints: [],
        selectedCharacter: { id: "char-1", name: "Kaelden" },
      },
      visibleCharacters: [
        {
          id: "char-1",
          user_id: "u-1",
          name: "Kaelden",
          class: null,
          race: null,
          level: 5,
          character_type: "character",
          details: {},
        },
      ],
    });

    expect(draft.reply).toContain("ficticio");
    expect(Array.isArray(draft.actions)).toBe(true);
    expect(draft.actions.length).toBeGreaterThan(0);
    const action = draft.actions[0] as {
      data?: { item_patch?: { create_if_missing?: boolean } };
    };
    expect(action?.data?.item_patch?.create_if_missing).toBe(true);
  });

  it("avoids repeating the same fictional challenge twice in a row", () => {
    const payload = {
      prompt: "Instruccion actual del usuario: dame un reto",
      targetCharacterId: "char-1",
      clientContext: {
        surface: "player" as const,
        availableActions: [],
        hints: [],
        selectedCharacter: { id: "char-1", name: "Kaelden" },
      },
      visibleCharacters: [
        {
          id: "char-1",
          user_id: "u-1",
          name: "Kaelden",
          class: null,
          race: null,
          level: 5,
          character_type: "character" as const,
          details: {},
        },
      ],
    };
    const first = __assistantTestHooks.buildTrainingFictionalDraft(payload);
    const second = __assistantTestHooks.buildTrainingFictionalDraft(payload);
    const firstAction = first.actions[0] as {
      data?: { item_patch?: { target_item_name?: string } };
    };
    const secondAction = second.actions[0] as {
      data?: { item_patch?: { target_item_name?: string } };
    };
    expect(secondAction?.data?.item_patch?.target_item_name).not.toBe(
      firstAction?.data?.item_patch?.target_item_name
    );
  });
});
