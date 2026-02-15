import { describe, expect, it } from "vitest";
import {
    getClassAbilityTimeline,
    getClassAbilities,
    getClassSubclasses,
    getSubclassName,
} from "../src/lib/dnd/classAbilities";

describe("class abilities progression", () => {
    it("returns level-gated base class features", () => {
        const level2 = getClassAbilities("barbarian", 2);
        const level5 = getClassAbilities("barbarian", 5);

        expect(level2.some((ability) => ability.name === "Rage")).toBe(true);
        expect(level2.some((ability) => ability.name === "Extra Attack")).toBe(
            false
        );
        expect(level5.some((ability) => ability.name === "Extra Attack")).toBe(
            true
        );
    });

    it("includes subclass features only when a subclass is selected", () => {
        const subclasses = getClassSubclasses("druid", 3);
        expect(subclasses.length).toBeGreaterThan(0);

        const subclassId =
            subclasses.find((subclass) => subclass.features.length > 0)?.id ??
            subclasses[0].id;
        const withoutSubclass = getClassAbilities("druid", 3);
        const withSubclass = getClassAbilities("druid", 3, subclassId);

        expect(
            withoutSubclass.some((ability) => ability.subclassId === subclassId)
        ).toBe(false);
        expect(
            withSubclass.some((ability) => ability.subclassId === subclassId)
        ).toBe(true);
    });

    it("resolves subclass names with localized class labels", () => {
        const name = getSubclassName(
            "druida",
            "druid:circle-of-the-land"
        );
        expect(name).toBe("Circle of the Land");
    });

    it("contains iconic class features for bard and paladin", () => {
        const bardAbilities = getClassAbilities("bard", 1);
        const paladinAbilities = getClassAbilities("paladin", 2);

        expect(
            bardAbilities.some((ability) => ability.name === "Bardic Inspiration")
        ).toBe(true);
        expect(
            paladinAbilities.some((ability) =>
                ability.name.includes("Divine Smite")
            )
        ).toBe(true);
    });

    it("returns translated class abilities when locale is es", () => {
        const bardAbilitiesEs = getClassAbilities("bard", 1, undefined, "es");
        expect(
            bardAbilitiesEs.some((ability) => ability.name.includes("Inspiración"))
        ).toBe(true);
    });

    it("exposes expanded official subclass catalog for selection", () => {
        const bardSubclasses = getClassSubclasses("bard");
        expect(
            bardSubclasses.some((subclass) => subclass.id === "bard:college-of-dance")
        ).toBe(true);
        expect(
            bardSubclasses.some((subclass) => subclass.id === "bard:college-of-whispers")
        ).toBe(true);
    });

    it("splits class abilities into learned and upcoming timeline", () => {
        const timeline = getClassAbilityTimeline("barbarian", 5);
        expect(timeline.learned.some((ability) => ability.name === "Extra Attack")).toBe(
            true
        );
        expect(
            timeline.upcoming.some(
                (ability) => ability.name === "Relentless Rage"
            )
        ).toBe(true);
    });
});
