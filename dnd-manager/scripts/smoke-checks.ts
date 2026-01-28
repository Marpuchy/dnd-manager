import { getAbilityBonusesFromDetails } from "../src/lib/character/abilityBonuses";
import { parseInventoryText } from "../src/lib/character/inventoryParser";
import { getMaxSpellLevelForClass } from "../src/lib/spells/spellLevels";

function assert(condition: boolean, message: string) {
    if (!condition) throw new Error(message);
}

const bonuses = getAbilityBonusesFromDetails({
    inventory: '{"name":"Test","ability":"STR","modifier":2}',
    equipment: "",
    weaponsExtra: "",
});
assert(bonuses.STR === 2, "Expected STR bonus from inventory");

const parsed = parseInventoryText('{"name":"Rope"}\nTorch');
assert(parsed.length === 2, "Expected two inventory entries");
assert(parsed[0].kind === "json" && parsed[1].kind === "text", "Expected mixed json/text parsing");

assert(getMaxSpellLevelForClass("wizard", 5) === 3, "Expected wizard level 5 max spell level 3");
assert(getMaxSpellLevelForClass("paladin", 4) === 2, "Expected paladin level 4 max spell level 2");

console.log("Smoke checks passed");
