import { describe, expect, it } from "vitest";
import { getSpellSlotsFor } from "../src/lib/spellSlots";
import { getMaxSpellLevelForClass } from "../src/lib/spells/spellLevels";

describe("class spell sync", () => {
    it("returns half-caster slots at high levels", () => {
        const paladinSlots = getSpellSlotsFor("paladin", 17) as Record<number, number>;
        expect(paladinSlots[4]).toBe(3);
        expect(paladinSlots[5]).toBe(1);
    });

    it("supports artificer spell progression", () => {
        const artificerSlots = getSpellSlotsFor("artificer", 1) as Record<number, number>;
        expect(artificerSlots[1]).toBe(2);
    });

    it("returns 0 max spell level for non-caster classes", () => {
        expect(getMaxSpellLevelForClass("fighter", 20)).toBe(0);
    });
});

