import { describe, expect, it } from "vitest";
import {
  buildLearningDigest,
  resolveDigestPeriod,
  resolveDigestPeriodFromInput,
} from "../src/lib/ai/globalLearningDigest";

describe("global learning digest", () => {
  it("computes default daily period using previous UTC day", () => {
    const now = new Date("2026-02-20T10:15:00.000Z");
    const period = resolveDigestPeriod({ frequency: "daily", now });

    expect(period.periodStartDate).toBe("2026-02-19");
    expect(period.periodEndDate).toBe("2026-02-20");
  });

  it("computes default weekly period using previous full ISO week", () => {
    const now = new Date("2026-02-20T10:15:00.000Z");
    const period = resolveDigestPeriod({ frequency: "weekly", now });

    expect(period.periodStartDate).toBe("2026-02-09");
    expect(period.periodEndDate).toBe("2026-02-16");
  });

  it("respects explicit period input when valid", () => {
    const period = resolveDigestPeriodFromInput({
      frequency: "weekly",
      periodStart: "2026-02-01",
      periodEnd: "2026-02-08",
      now: new Date("2026-02-20T10:15:00.000Z"),
    });

    expect(period.periodStartDate).toBe("2026-02-01");
    expect(period.periodEndDate).toBe("2026-02-08");
  });

  it("extracts top corrections and consolidated rules from edit feedback", () => {
    const digest = buildLearningDigest({
      frequency: "weekly",
      periodStart: "2026-02-09",
      periodEnd: "2026-02-16",
      events: [
        {
          id: "1",
          context_hint: "user-edit-feedback",
          instruction:
            "Correccion de propuesta IA por edicion del usuario.\nResumen: se perdio Letania Maldita (accion) y una reaccion.",
        },
        {
          id: "2",
          context_hint: "user-edit-feedback",
          instruction:
            "Correccion de propuesta IA por edicion del usuario.\nResumen: CR y XP no son coherentes con HP y CA.",
        },
        {
          id: "3",
          context_hint: "bestiary-editor",
          instruction: "crear criatura",
        },
      ],
    });

    expect(digest.sourceEventCount).toBe(3);
    expect(digest.editFeedbackCount).toBe(2);
    expect(digest.summaryJson.topCorrections.length).toBeGreaterThan(0);
    expect(
      digest.summaryJson.consolidatedRules.some((entry) =>
        entry.rule.includes("acciones") || entry.rule.includes("CR")
      )
    ).toBe(true);
    expect(digest.summaryMarkdown).toContain("Reglas consolidadas");
  });
});

