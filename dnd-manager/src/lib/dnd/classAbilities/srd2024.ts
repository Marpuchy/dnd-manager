import { ClassProgression } from "./types";

export const CLASS_PROGRESSIONS_2024: Record<string, ClassProgression> = {
  barbarian: {
    classId: "barbarian",
    className: "Barbarian",
    source: "D&D Free Rules 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "barbarian:lvl1:rage:1",
        name: "Rage",
        class: "barbarian",
        level: 1,
        description: "You can imbue yourself with a primal power called Rage, a force that grants you extraordinary might and resilience. You can enter it as a Bonus Action if you arent wearing Heavy armor.\n\nYou can enter your Rage the number of times shown for your Barbarian level in the Rages column of the Barbarian Features table. You regain one expended use when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest.\n\nWhile active, your Rage follows the rules below.\n\nDamage Resistance. You have Resistance to Bludgeoning, Piercing, and Slashing damage.\n\nRage Damage. When you make an attack using Strengthwith either a weapon or an Unarmed Strikeand deal damage to the target, you gain a bonus to the damage that increases as you gain levels as a Barbarian, as shown in the Rage Damage column of the Barbarian Features table.\n\nStrength Advantage. You have Advantage on Strength checks and Strength saving throws.\n\nNo Concentration or Spells. You cant maintain Concentration, and you cant cast spells.\n\nDuration. The Rage lasts until the end of your next turn, and it ends early if you don Heavy armor or have the Incapacitated condition. If your Rage is still active on your next turn, you can extend the Rage for another round by doing one of the following:\n\nEach time the Rage is extended, it lasts until the end of your next turn. You can maintain a Rage for up to 10 minutes."
      },
      {
        id: "barbarian:lvl1:unarmored-defense:2",
        name: "Unarmored Defense",
        class: "barbarian",
        level: 1,
        description: "While you arent wearing any armor, your base Armor Class equals 10 plus your Dexterity and Constitution modifiers. You can use a Shield and still gain this benefit."
      },
      {
        id: "barbarian:lvl1:weapon-mastery:3",
        name: "Weapon Mastery",
        class: "barbarian",
        level: 1,
        description: "Your training with weapons allows you to use the mastery properties of two kinds of Simple or Martial Melee weapons of your choice, such as Greataxes and Handaxes. Whenever you finish a Long Rest, you can practice weapon drills and change one of those weapon choices.\n\nWhen you reach certain Barbarian levels, you gain the ability to use the mastery properties of more kinds of weapons, as shown in the Weapon Mastery column of the Barbarian Features table."
      },
      {
        id: "barbarian:lvl2:danger-sense:1",
        name: "Danger Sense",
        class: "barbarian",
        level: 2,
        description: "You gain an uncanny sense of when things arent as they should be, giving you an edge when you dodge perils. You have Advantage on Dexterity saving throws unless you have the Incapacitated condition."
      },
      {
        id: "barbarian:lvl2:reckless-attack:2",
        name: "Reckless Attack",
        class: "barbarian",
        level: 2,
        description: "You can throw aside all concern for defense to attack with increased ferocity. When you make your first attack roll on your turn, you can decide to attack recklessly. Doing so gives you Advantage on attack rolls using Strength until the start of your next turn, but attack rolls against you have Advantage during that time."
      },
      {
        id: "barbarian:lvl3:barbarian-subclass:1",
        name: "Barbarian Subclass",
        class: "barbarian",
        level: 3,
        description: "You gain a Barbarian subclass of your choice. The Path of the Berserker subclass is detailed after this classs description. A subclass is a specialization that grants you features at certain Barbarian levels. For the rest of your career, you gain each of your subclasss features that are of your Barbarian level or lower."
      },
      {
        id: "barbarian:lvl3:primal-knowledge:2",
        name: "Primal Knowledge",
        class: "barbarian",
        level: 3,
        description: "You gain proficiency in another skill of your choice from the skill list available to Barbarians at level 1.\n\nIn addition, while your Rage is active, you can channel primal power when you attempt certain tasks; whenever you make an ability check using one of the following skills, you can make it as a Strength check even if it normally uses a different ability: Acrobatics, Intimidation, Perception, Stealth, or Survival. When you use this ability, your Strength represents primal power coursing through you, honing your agility, bearing, and senses."
      },
      {
        id: "barbarian:lvl4:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "barbarian",
        level: 4,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Barbarian levels 8, 12, and 16."
      },
      {
        id: "barbarian:lvl5:extra-attack:1",
        name: "Extra Attack",
        class: "barbarian",
        level: 5,
        description: "You can attack twice instead of once whenever you take the Attack action on your turn."
      },
      {
        id: "barbarian:lvl5:fast-movement:2",
        name: "Fast Movement",
        class: "barbarian",
        level: 5,
        description: "Your speed increases by 10 feet while you arent wearing Heavy armor."
      },
      {
        id: "barbarian:lvl6:subclass-feature:1",
        name: "Subclass feature",
        class: "barbarian",
        level: 6
      },
      {
        id: "barbarian:lvl7:feral-instinct:1",
        name: "Feral Instinct",
        class: "barbarian",
        level: 7,
        description: "Your instincts are so honed that you have Advantage on Initiative rolls."
      },
      {
        id: "barbarian:lvl7:instinctive-pounce:2",
        name: "Instinctive Pounce",
        class: "barbarian",
        level: 7,
        description: "As part of the Bonus Action you take to enter your Rage, you can move up to half your Speed."
      },
      {
        id: "barbarian:lvl8:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "barbarian",
        level: 8,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Barbarian levels 8, 12, and 16."
      },
      {
        id: "barbarian:lvl9:brutal-strike:1",
        name: "Brutal Strike",
        class: "barbarian",
        level: 9,
        description: "If you use Reckless Attack, you can forgo any Advantage on one Strength-based attack roll of your choice on your turn. The chosen attack roll mustnt have Disadvantage. If the chosen attack roll hits, the target takes an extra 1d10 damage of the same type dealt by the weapon or Unarmed Strike, and you can cause one Brutal Strike effect of your choice. You have the following effect options.\n\nForceful Blow. The target is pushed 15 feet straight away from you. You can then move up to half your Speed straight toward the target without provoking Opportunity Attacks.\n\nHamstring Blow. The targets Speed is reduced by 15 feet until the start of your next turn. A target can be affected by only one Hamstring Blow at a timethe most recent one."
      },
      {
        id: "barbarian:lvl10:subclass-feature:1",
        name: "Subclass feature",
        class: "barbarian",
        level: 10
      },
      {
        id: "barbarian:lvl11:relentless-rage:1",
        name: "Relentless Rage",
        class: "barbarian",
        level: 11,
        description: "Your Rage can keep you fighting despite grievous wounds. If you drop to 0 Hit Points while your Rage is active and dont die outright, you can make a DC 10 Constitution saving throw. If you succeed, your Hit Points instead change to a number equal to twice your Barbarian level.\n\nEach time you use this feature after the first, the DC increases by 5. When you finish a Short or Long Rest, the DC resets to 10."
      },
      {
        id: "barbarian:lvl12:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "barbarian",
        level: 12,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Barbarian levels 8, 12, and 16."
      },
      {
        id: "barbarian:lvl13:improved-brutal-strike:1",
        name: "Improved Brutal Strike",
        class: "barbarian",
        level: 13,
        description: "You have honed new ways to attack furiously. The following effects are now among your Brutal Strike options.\n\nStaggering Blow. The target has Disadvantage on the next saving throw it makes, and it cant make Opportunity Attacks until the start of your next turn.\n\nSundering Blow. Before the start of your next turn, the next attack roll made by another creature against the target gains a +5 bonus to the roll. An attack roll can gain only one Sundering Blow bonus."
      },
      {
        id: "barbarian:lvl14:subclass-feature:1",
        name: "Subclass feature",
        class: "barbarian",
        level: 14
      },
      {
        id: "barbarian:lvl15:persistent-rage:1",
        name: "Persistent Rage",
        class: "barbarian",
        level: 15,
        description: "When you roll Initiative, you can regain all expended uses of Rage. After you regain uses of Rage in this way, you cant do so again until you finish a Long Rest.\n\nIn addition, your Rage is so fierce that it now lasts for 10 minutes without you needing to do anything to extend it from round to round. Your Rage ends early if you have the Unconscious condition (not just the Incapacitated condition) or don Heavy armor."
      },
      {
        id: "barbarian:lvl16:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "barbarian",
        level: 16,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Barbarian levels 8, 12, and 16."
      },
      {
        id: "barbarian:lvl17:improved-brutal-strike:1",
        name: "Improved Brutal Strike",
        class: "barbarian",
        level: 17,
        description: "The extra damage of your Brutal Strike increases to 2d10. In addition, you can use two different Brutal Strike effects whenever you use your Brutal Strike feature."
      },
      {
        id: "barbarian:lvl18:indomitable-might:1",
        name: "Indomitable Might",
        class: "barbarian",
        level: 18,
        description: "If your total for a Strength check or Strength saving throw is less than your Strength score, you can use that score in place of the total."
      },
      {
        id: "barbarian:lvl19:epic-boon:1",
        name: "Epic Boon",
        class: "barbarian",
        level: 19,
        description: "You gain an Epic Boon feat (see Feats) or another feat of your choice for which you qualify. Boon of Irresistible Offense is recommended."
      },
      {
        id: "barbarian:lvl20:primal-champion:1",
        name: "Primal Champion",
        class: "barbarian",
        level: 20,
        description: "You embody primal power. Your Strength and Constitution scores increase by 4, to a maximum of 25."
      }
    ],
    subclasses: [
      {
        id: "barbarian:path-of-the-berserker",
        name: "Path of the Berserker",
        classId: "barbarian",
        unlockLevel: 3,
        source: "D&D Free Rules 2024",
        features: [
          {
            id: "barbarian:path-of-the-berserker:lvl3:frenzy",
            name: "Frenzy",
            class: "barbarian",
            level: 3,
            subclassId: "barbarian:path-of-the-berserker",
            subclassName: "Path of the Berserker",
            description: "If you use Reckless Attack while your Rage is active, you deal extra damage to the first target you hit on your turn with a Strength-based attack. To determine the extra damage, roll a number of d6s equal to your Rage Damage bonus, and add them together. The damage has the same type as the weapon or Unarmed Strike used for the attack."
          },
          {
            id: "barbarian:path-of-the-berserker:lvl6:mindless-rage",
            name: "Mindless Rage",
            class: "barbarian",
            level: 6,
            subclassId: "barbarian:path-of-the-berserker",
            subclassName: "Path of the Berserker",
            description: "You have Immunity to the Charmed and Frightened conditions while your Rage is active. If youre Charmed or Frightened when you enter your Rage, the condition ends on you."
          },
          {
            id: "barbarian:path-of-the-berserker:lvl10:retaliation",
            name: "Retaliation",
            class: "barbarian",
            level: 10,
            subclassId: "barbarian:path-of-the-berserker",
            subclassName: "Path of the Berserker",
            description: "When you take damage from a creature that is within 5 feet of you, you can take a Reaction to make one melee attack against that creature, using a weapon or an Unarmed Strike."
          },
          {
            id: "barbarian:path-of-the-berserker:lvl14:intimidating-presence",
            name: "Intimidating Presence",
            class: "barbarian",
            level: 14,
            subclassId: "barbarian:path-of-the-berserker",
            subclassName: "Path of the Berserker",
            description: "As a Bonus Action, you can strike terror into others with your menacing presence and primal power. When you do so, each creature of your choice in a 30-foot Emanation originating from you must make a Wisdom saving throw (DC 8 plus your Strength modifier and Proficiency Bonus). On a failed save, a creature has the Frightened condition for 1 minute. At the end of each of the Frightened creatures turns, the creature repeats the save, ending the effect on itself on a success.\n\nOnce you use this feature, you cant use it again until you finish a Long Rest unless you expend a use of your Rage (no action required) to restore your use of it."
          }
        ]
      }
    ]
  },
  bard: {
    classId: "bard",
    className: "Bard",
    source: "D&D Free Rules 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "bard:lvl1:bardic-inspiration:1",
        name: "Bardic Inspiration",
        class: "bard",
        level: 1,
        description: "You can supernaturally inspire others through words, music, or dance. This inspiration is represented by your Bardic Inspiration die, which is a d6.\n\nUsing Bardic Inspiration. As a Bonus Action, you can inspire another creature within 60 feet of yourself who can see or hear you. That creature gains one of your Bardic Inspiration dice. A creature can have only one Bardic Inspiration die at a time.\n\nOnce within the next hour when the creature fails a D20 Test, the creature can roll the Bardic Inspiration die and add the number rolled to the d20, potentially turning the failure into a success. A Bardic Inspiration die is expended when its rolled.\n\nNumber of Uses. You can confer a Bardic Inspiration die a number of times equal to your Charisma modifier (minimum of once), and you regain all expended uses when you finish a Long Rest.\n\nAt Higher Levels. Your Bardic Inspiration die changes when you reach certain Bard levels, as shown in the Bardic Die column of the Bard Features table. The die becomes a d8 at level 5, a d10 at level 10, and a d12 at level 15."
      },
      {
        id: "bard:lvl1:spellcasting:2",
        name: "Spellcasting",
        class: "bard",
        level: 1,
        description: "You have learned to cast spells through your bardic arts. See Spells for the rules on spellcasting. The information below details how you use those rules with Bard spells, which appear in the Bard spell list later in the classs description.\n\nCantrips. You know two cantrips of your choice from the Bard spell list. Dancing Lights and Vicious Mockery are recommended.\n\nWhenever you gain a Bard level, you can replace one of your cantrips with another cantrip of your choice from the Bard spell list.\n\nWhen you reach Bard levels 4 and 10, you learn another cantrip of your choice from the Bard spell list, as shown in the Cantrips column of the Bard Features table.\n\nSpell Slots. The Bard Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.\n\nPrepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose four level 1 spells from the Bard spell list. Charm Person, Color Spray, Dissonant Whispers, and Healing Word are recommended.\n\nThe number of spells on your list increases as you gain Bard levels, as shown in the Prepared Spells column of the Bard Features table. Whenever that number increases, choose additional spells from the Bard spell list until the number of spells on your list matches the number on the table. The chosen spells must be of a level for which you have spell slots. For example, if youre a level 3 Bard, your list of prepared spells can include six spells of levels 1 and 2 in any combination.\n\nIf another Bard feature gives you spells that you always have prepared, those spells dont count against the number of spells you can prepare with this feature, but those spells otherwise count as Bard spells for you.\n\nChanging Your Prepared Spells. Whenever you gain a Bard level, you can replace one spell on your list with another Bard spell for which you have spell slots.\n\nSpellcasting Ability. Charisma is your spellcasting ability for your Bard spells.\n\nSpellcasting Focus. You can use a Musical Instrument as a Spellcasting Focus for your Bard spells."
      },
      {
        id: "bard:lvl2:expertise:1",
        name: "Expertise",
        class: "bard",
        level: 2,
        description: "You gain Expertise (see the rules glossary) in two of your skill proficiencies of your choice. Performance and Persuasion are recommended if you have proficiency in them.\n\nAt Bard level 9, you gain Expertise in two more of your skill proficiencies of your choice."
      },
      {
        id: "bard:lvl2:jack-of-all-trades:2",
        name: "Jack of All Trades",
        class: "bard",
        level: 2,
        description: "You can add half your Proficiency Bonus (round down) to any ability check you make that uses a skill proficiency you lack and that doesnt otherwise use your Proficiency Bonus.\n\nFor example, if you make a Strength (Athletics) check and lack Athletics proficiency, you can add half your Proficiency Bonus to the check.\n\nA Bards Repertoire\n\nDoes your Bard beat a drum while chanting the deeds of ancient heroes' Strum a lute while crooning romantic tunes' Perform arias of stirring power' Recite dramatic monologues from classic tragedies' Use the rhythm of a folk dance to coordinate the movement of allies in battle' Compose naughty limericks'\n\nWhen you play a Bard, consider the style of artistic performance you favor, the moods you might invoke, and the themes that inspire your own creations. Are your poems inspired by moments of natural beauty, or are they brooding reflections on loss' Do you prefer lofty hymns or rowdy tavern songs' Are you drawn to laments for the fallen or celebrations of joy' Do you dance merry jigs or perform elaborate interpretive choreography' Do you focus on one style of performance or strive to master them all'"
      },
      {
        id: "bard:lvl3:bard-subclass:1",
        name: "Bard Subclass",
        class: "bard",
        level: 3,
        description: "You gain a Bard subclass of your choice. The College of Lore subclass is detailed after this classs description. A subclass is a specialization that grants you features at certain Bard levels. For the rest of your career, you gain each of your subclasss features that are of your Bard level or lower."
      },
      {
        id: "bard:lvl4:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "bard",
        level: 4,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Bard levels 8, 12, and 16."
      },
      {
        id: "bard:lvl5:font-of-inspiration:1",
        name: "Font of Inspiration",
        class: "bard",
        level: 5,
        description: "You now regain all your expended uses of Bardic Inspiration when you finish a Short or Long Rest.\n\nIn addition, you can expend a spell slot (no action required) to regain one expended use of Bardic Inspiration."
      },
      {
        id: "bard:lvl6:subclass-feature:1",
        name: "Subclass feature",
        class: "bard",
        level: 6
      },
      {
        id: "bard:lvl7:countercharm:1",
        name: "Countercharm",
        class: "bard",
        level: 7,
        description: "You can use musical notes or words of power to disrupt mind-influencing effects. If you or a creature within 30 feet of you fails a saving throw against an effect that applies the Charmed or Frightened condition, you can take a Reaction to cause the save to be rerolled, and the new roll has Advantage."
      },
      {
        id: "bard:lvl8:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "bard",
        level: 8,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Bard levels 8, 12, and 16."
      },
      {
        id: "bard:lvl9:expertise:1",
        name: "Expertise",
        class: "bard",
        level: 9,
        description: "You gain Expertise (see the rules glossary) in two of your skill proficiencies of your choice. Performance and Persuasion are recommended if you have proficiency in them.\n\nAt Bard level 9, you gain Expertise in two more of your skill proficiencies of your choice."
      },
      {
        id: "bard:lvl10:magical-secrets:1",
        name: "Magical Secrets",
        class: "bard",
        level: 10,
        description: "Youve learned secrets from various magical traditions. Whenever you reach a Bard level (including this level) and the Prepared Spells number in the Bard Features table increases, you can choose any of your new prepared spells from the Bard, Cleric, Druid, and Wizard spell lists, and the chosen spells count as Bard spells for you (see a classs section for its spell list). In addition, whenever you replace a spell prepared for this class, you can replace it with a spell from those lists."
      },
      {
        id: "bard:lvl11:feature:1",
        name: "",
        class: "bard",
        level: 11
      },
      {
        id: "bard:lvl12:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "bard",
        level: 12,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Bard levels 8, 12, and 16."
      },
      {
        id: "bard:lvl13:feature:1",
        name: "",
        class: "bard",
        level: 13
      },
      {
        id: "bard:lvl14:subclass-feature:1",
        name: "Subclass feature",
        class: "bard",
        level: 14
      },
      {
        id: "bard:lvl15:feature:1",
        name: "",
        class: "bard",
        level: 15
      },
      {
        id: "bard:lvl16:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "bard",
        level: 16,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Bard levels 8, 12, and 16."
      },
      {
        id: "bard:lvl17:feature:1",
        name: "",
        class: "bard",
        level: 17
      },
      {
        id: "bard:lvl18:superior-inspiration:1",
        name: "Superior Inspiration",
        class: "bard",
        level: 18,
        description: "When you roll Initiative, you regain expended uses of Bardic Inspiration until you have two if you have fewer than that."
      },
      {
        id: "bard:lvl19:epic-boon:1",
        name: "Epic Boon",
        class: "bard",
        level: 19,
        description: "You gain an Epic Boon feat (see Feats) or another feat of your choice for which you qualify. Boon of Spell Recall is recommended."
      },
      {
        id: "bard:lvl20:words-of-creation:1",
        name: "Words of Creation",
        class: "bard",
        level: 20,
        description: "You have mastered two of the Words of Creation: the words of life and death. You therefore always have the Power Word Heal and Power Word Kill spells prepared. When you cast either spell, you can target a second creature with it if that creature is within 10 feet of the first target."
      }
    ],
    subclasses: [
      {
        id: "bard:college-of-lore",
        name: "College of Lore",
        classId: "bard",
        unlockLevel: 3,
        source: "D&D Free Rules 2024",
        features: [
          {
            id: "bard:college-of-lore:lvl3:bonus-proficiencies",
            name: "Bonus Proficiencies",
            class: "bard",
            level: 3,
            subclassId: "bard:college-of-lore",
            subclassName: "College of Lore",
            description: "You gain proficiency with three skills of your choice."
          },
          {
            id: "bard:college-of-lore:lvl3:cutting-words",
            name: "Cutting Words",
            class: "bard",
            level: 3,
            subclassId: "bard:college-of-lore",
            subclassName: "College of Lore",
            description: "You learn to use your wit to supernaturally distract, confuse, and otherwise sap the confidence and competence of others. When a creature that you can see within 60 feet of yourself makes a damage roll or succeeds on an ability check or attack roll, you can take a Reaction to expend one use of your Bardic Inspiration; roll your Bardic Inspiration die, and subtract the number rolled from the creatures roll, reducing the damage or potentially turning the success into a failure."
          },
          {
            id: "bard:college-of-lore:lvl6:magical-discoveries",
            name: "Magical Discoveries",
            class: "bard",
            level: 6,
            subclassId: "bard:college-of-lore",
            subclassName: "College of Lore",
            description: "You learn two spells of your choice. These spells can come from the Cleric, Druid, or Wizard spell list or any combination thereof (see a classs section for its spell list). A spell you choose must be a cantrip or a spell for which you have spell slots, as shown in the Bard Features table.\n\nYou always have the chosen spells prepared, and whenever you gain a Bard level, you can replace one of the spells with another spell that meets these requirements."
          },
          {
            id: "bard:college-of-lore:lvl14:peerless-skill",
            name: "Peerless Skill",
            class: "bard",
            level: 14,
            subclassId: "bard:college-of-lore",
            subclassName: "College of Lore",
            description: "When you make an ability check or attack roll and fail, you can expend one use of Bardic Inspiration; roll the Bardic Inspiration die, and add the number rolled to the d20, potentially turning a failure into a success. On a failure, the Bardic Inspiration isnt expended."
          }
        ]
      }
    ]
  },
  cleric: {
    classId: "cleric",
    className: "Cleric",
    source: "D&D Free Rules 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "cleric:lvl1:spellcasting:1",
        name: "Spellcasting",
        class: "cleric",
        level: 1,
        description: "You have learned to cast spells through prayer and meditation. See Spells for the rules on spellcasting. The information below details how you use those rules with Cleric spells, which appear on the Cleric spell list later in the classs description.\n\nCantrips. You know three cantrips of your choice from the Cleric spell list. Guidance, Sacred Flame, and Thaumaturgy are recommended.\n\nWhenever you gain a Cleric level, you can replace one of your cantrips with another cantrip of your choice from the Cleric spell list.\n\nWhen you reach Cleric levels 4 and 10, you learn another cantrip of your choice from the Cleric spell list, as shown in the Cantrips column of the Cleric Features table.\n\nSpell Slots. The Cleric Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.\n\nPrepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose four level 1 spells from the Cleric spell list. Bless, Cure Wounds, Guiding Bolt, and Shield of Faith are recommended.\n\nThe number of spells on your list increases as you gain Cleric levels, as shown in the Prepared Spells column of the Cleric Features table. Whenever that number increases, choose additional spells from the Cleric spell list until the number of spells on your list matches the number on the table. The chosen spells must be of a level for which you have spell slots. For example, if youre a level 3 Cleric, your list of prepared spells can include six spells of levels 1 and 2 in any combination.\n\nIf another Cleric feature gives you spells that you always have prepared, those spells dont count against the number of spells you can prepare with this feature, but those spells otherwise count as Cleric spells for you.\n\nChanging Your Prepared Spells. Whenever you finish a Long Rest, you can change your list of prepared spells, replacing any of the spells there with other Cleric spells for which you have spell slots.\n\nSpellcasting Ability. Wisdom is your spellcasting ability for your Cleric spells.\n\nSpellcasting Focus. You can use a Holy Symbol as a Spellcasting Focus for your Cleric spells."
      },
      {
        id: "cleric:lvl1:divine-order:2",
        name: "Divine Order",
        class: "cleric",
        level: 1,
        description: "You have dedicated yourself to one of the following sacred roles of your choice.\n\nProtector. Trained for battle, you gain proficiency with Martial weapons and training with Heavy armor.\n\nThaumaturge. You know one extra cantrip from the Cleric spell list. In addition, your mystical connection to the divine gives you a bonus to your Intelligence (Arcana or Religion) checks. The bonus equals your Wisdom modifier (minimum of +1)."
      },
      {
        id: "cleric:lvl2:channel-divinity:1",
        name: "Channel Divinity",
        class: "cleric",
        level: 2,
        description: "You can channel divine energy directly from the Outer Planes to fuel magical effects. You start with two such effects: Divine Spark and Turn Undead, each of which is described below. Each time you use this classs Channel Divinity, choose which Channel Divinity effect from this class to create. You gain additional effect options at higher Cleric levels.\n\nYou can use this classs Channel Divinity twice. You regain one of its expended uses when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest. You gain additional uses when you reach certain Cleric levels, as shown in the Channel Divinity column of the Cleric Features table.\n\nIf a Channel Divinity effect requires a saving throw, the DC equals the spell save DC from this classs Spellcasting feature.\n\nDivine Spark. As a Magic action, you point your Holy Symbol at another creature you can see within 30 feet of yourself and focus divine energy at it. Roll 1d8 and add your Wisdom modifier. You either restore Hit Points to the creature equal to that total or force the creature to make a Constitution saving throw. On a failed save, the creature takes Necrotic or Radiant damage (your choice) equal to that total. On a successful save, the creature takes half as much damage (round down).\n\nYou roll an additional d8 when you reach Cleric levels 7 (2d8), 13 (3d8), and 18 (4d8).\n\nTurn Undead. As a Magic action, you present your Holy Symbol and censure Undead creatures. Each Undead of your choice within 30 feet of you must make a Wisdom saving throw. If the creature fails its save, it has the Frightened and Incapacitated conditions for 1 minute. For that duration, it tries to move as far from you as it can on its turns. This effect ends early on the creature if it takes any damage, if you have the Incapacitated condition, or if you die."
      },
      {
        id: "cleric:lvl3:cleric-subclass:1",
        name: "Cleric Subclass",
        class: "cleric",
        level: 3,
        description: "You gain a Cleric subclass of your choice. The Life Domain subclass is detailed after this classs description. A subclass is a specialization that grants you features at certain Cleric levels. For the rest of your career, you gain each of your subclasss features that are of your Cleric level or lower."
      },
      {
        id: "cleric:lvl4:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "cleric",
        level: 4,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Cleric levels 8, 12, and 16."
      },
      {
        id: "cleric:lvl5:sear-undead:1",
        name: "Sear Undead",
        class: "cleric",
        level: 5,
        description: "Whenever you use Turn Undead, you can roll a number of d8s equal to your Wisdom modifier (minimum of 1d8) and add the rolls together. Each Undead that fails its saving throw against that use of Turn Undead takes Radiant damage equal to the rolls total. This damage doesnt end the turn effect."
      },
      {
        id: "cleric:lvl6:subclass-feature:1",
        name: "Subclass feature",
        class: "cleric",
        level: 6
      },
      {
        id: "cleric:lvl7:blessed-strikes:1",
        name: "Blessed Strikes",
        class: "cleric",
        level: 7,
        description: "Divine power infuses you in battle. You gain one of the following options of your choice (if you get either option from a Cleric subclass in an older book, use only the option you choose for this feature).\n\nDivine Strike. Once on each of your turns when you hit a creature with an attack roll using a weapon, you can cause the target to take an extra 1d8 Necrotic or Radiant damage (your choice).\n\nPotent Spellcasting. Add your Wisdom modifier to the damage you deal with any Cleric cantrip."
      },
      {
        id: "cleric:lvl8:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "cleric",
        level: 8,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Cleric levels 8, 12, and 16."
      },
      {
        id: "cleric:lvl9:feature:1",
        name: "",
        class: "cleric",
        level: 9
      },
      {
        id: "cleric:lvl10:divine-intervention:1",
        name: "Divine Intervention",
        class: "cleric",
        level: 10,
        description: "You can call on your deity or pantheon to intervene on your behalf. As a Magic action, choose any Cleric spell of level 5 or lower that doesnt require a Reaction to cast. As part of the same action, you cast that spell without expending a spell slot or needing Material components. You cant use this feature again until you finish a Long Rest."
      },
      {
        id: "cleric:lvl11:feature:1",
        name: "",
        class: "cleric",
        level: 11
      },
      {
        id: "cleric:lvl12:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "cleric",
        level: 12,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Cleric levels 8, 12, and 16."
      },
      {
        id: "cleric:lvl13:feature:1",
        name: "",
        class: "cleric",
        level: 13
      },
      {
        id: "cleric:lvl14:improved-blessed-strikes:1",
        name: "Improved Blessed Strikes",
        class: "cleric",
        level: 14,
        description: "The option you chose for Blessed Strikes grows more powerful.\n\nDivine Strike. The extra damage of your Divine Strike increases to 2d8.\n\nPotent Spellcasting. When you cast a Cleric cantrip and deal damage to a creature with it, you can give vitality to yourself or another creature within 60 feet of yourself, granting a number of Temporary Hit Points equal to twice your Wisdom modifier."
      },
      {
        id: "cleric:lvl15:feature:1",
        name: "",
        class: "cleric",
        level: 15
      },
      {
        id: "cleric:lvl16:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "cleric",
        level: 16,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Cleric levels 8, 12, and 16."
      },
      {
        id: "cleric:lvl17:subclass-feature:1",
        name: "Subclass feature",
        class: "cleric",
        level: 17
      },
      {
        id: "cleric:lvl18:feature:1",
        name: "",
        class: "cleric",
        level: 18
      },
      {
        id: "cleric:lvl19:epic-boon:1",
        name: "Epic Boon",
        class: "cleric",
        level: 19,
        description: "You gain an Epic Boon feat (see Feats) or another feat of your choice for which you qualify. Boon of Fate is recommended."
      },
      {
        id: "cleric:lvl20:greater-divine-intervention:1",
        name: "Greater Divine Intervention",
        class: "cleric",
        level: 20,
        description: "You can call on even more powerful divine intervention. When you use your Divine Intervention feature, you can choose Wish when you select a spell. If you do so, you cant use Divine Intervention again until you finish 2d4 Long Rests."
      }
    ],
    subclasses: [
      {
        id: "cleric:life-domain",
        name: "Life Domain",
        classId: "cleric",
        unlockLevel: 3,
        source: "D&D Free Rules 2024",
        features: [
          {
            id: "cleric:life-domain:lvl3:disciple-of-life",
            name: "Disciple of Life",
            class: "cleric",
            level: 3,
            subclassId: "cleric:life-domain",
            subclassName: "Life Domain",
            description: "When a spell you cast with a spell slot restores Hit Points to a creature, that creature regains additional Hit Points on the turn you cast the spell. The additional Hit Points equal 2 plus the spell slots level."
          },
          {
            id: "cleric:life-domain:lvl3:life-domain-spells",
            name: "Life Domain Spells",
            class: "cleric",
            level: 3,
            subclassId: "cleric:life-domain",
            subclassName: "Life Domain",
            description: "Your connection to this divine domain ensures you always have certain spells ready. When you reach a Cleric level specified in the Life Domain Spells table, you thereafter always have the listed spells prepared."
          },
          {
            id: "cleric:life-domain:lvl3:preserve-life",
            name: "Preserve Life",
            class: "cleric",
            level: 3,
            subclassId: "cleric:life-domain",
            subclassName: "Life Domain",
            description: "As a Magic action, you present your Holy Symbol and expend a use of your Channel Divinity to evoke healing energy that can restore a number of Hit Points equal to five times your Cleric level. Choose Bloodied creatures within 30 feet of yourself (which can include you), and divide those Hit Points among them. This feature can restore a creature to no more than half its Hit Point maximum."
          },
          {
            id: "cleric:life-domain:lvl6:blessed-healer",
            name: "Blessed Healer",
            class: "cleric",
            level: 6,
            subclassId: "cleric:life-domain",
            subclassName: "Life Domain",
            description: "The healing spells you cast on others heal you as well. Immediately after you cast a spell with a spell slot that restores Hit Points to one or more creatures other than yourself, you regain Hit Points equal to 2 plus the spell slots level."
          },
          {
            id: "cleric:life-domain:lvl17:supreme-healing",
            name: "Supreme Healing",
            class: "cleric",
            level: 17,
            subclassId: "cleric:life-domain",
            subclassName: "Life Domain",
            description: "When you would normally roll one or more dice to restore Hit Points to a creature with a spell or Channel Divinity, dont roll those dice for the healing; instead use the highest number possible for each die. For example, instead of restoring 2d6 Hit Points to a creature with a spell, you restore 12."
          }
        ]
      }
    ]
  },
  druid: {
    classId: "druid",
    className: "Druid",
    source: "D&D Free Rules 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "druid:lvl1:spellcasting:1",
        name: "Spellcasting",
        class: "druid",
        level: 1,
        description: "You have learned to cast spells through studying the mystical forces of nature. See Spells for the rules on spellcasting. The information below details how you use those rules with Druid spells, which appear on the Druid spell list later in the classs description.\n\nCantrips. You know two cantrips of your choice from the Druid spell list. Druidcraft and Produce Flame are recommended.\n\nWhenever you gain a Druid level, you can replace one of your cantrips with another cantrip of your choice from the Druid spell list.\n\nWhen you reach Druid levels 4 and 10, you learn another cantrip of your choice from the Druid spell list, as shown in the Cantrips column of the Druid Features table.\n\nSpell Slots. The Druid Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.\n\nPrepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose four level 1 spells from the Druid spell list. Animal Friendship, Cure Wounds, Faerie Fire, and Thunderwave are recommended.\n\nThe number of spells on your list increases as you gain Druid levels, as shown in the Prepared Spells column of the Druid Features table. Whenever that number increases, choose additional spells from the Druid spell list until the number of spells on your list matches the number on the table. The chosen spells must be of a level for which you have spell slots. For example, if youre a level 3 Druid, your list of prepared spells can include six spells of levels 1 and 2 in any combination.\n\nIf another Druid feature gives you spells that you always have prepared, those spells dont count against the number of spells you can prepare with this feature, but those spells otherwise count as Druid spells for you.\n\nChanging Your Prepared Spells. Whenever you finish a Long Rest, you can change your list of prepared spells, replacing any of the spells with other Druid spells for which you have spell slots.\n\nSpellcasting Ability. Wisdom is your spellcasting ability for your Druid spells.\n\nSpellcasting Focus. You can use a Druidic Focus as a Spellcasting Focus for your Druid spells."
      },
      {
        id: "druid:lvl1:druidic:2",
        name: "Druidic",
        class: "druid",
        level: 1,
        description: "You know Druidic, the secret language of Druids. While learning this ancient tongue, you also unlocked the magic of communicating with animals; you always have the Speak with Animals spell prepared.\n\nYou can use Druidic to leave hidden messages. You and others who know Druidic automatically spot such a message. Others spot the messages presence with a successful DC 15 Intelligence (Investigation) check but cant decipher it without magic."
      },
      {
        id: "druid:lvl1:primal-order:3",
        name: "Primal Order",
        class: "druid",
        level: 1,
        description: "You have dedicated yourself to one of the following sacred roles of your choice.\n\nMagician. You know one extra cantrip from the Druid spell list. In addition, your mystical connection to nature gives you a bonus to your Intelligence (Arcana or Nature) checks. The bonus equals your Wisdom modifier (minimum bonus of +1).\n\nWarden. Trained for battle, you gain proficiency with Martial weapons and training with Medium armor."
      },
      {
        id: "druid:lvl2:wild-shape:1",
        name: "Wild Shape",
        class: "druid",
        level: 2,
        description: "The power of nature allows you to assume the form of an animal. As a Bonus Action, you shape-shift into a Beast form that you have learned for this feature (see Known Forms below). You stay in that form for a number of hours equal to half your Druid level or until you use Wild Shape again, have the Incapacitated condition, or die. You can also leave the form early as a Bonus Action.\n\nNumber of Uses. You can use Wild Shape twice. You regain one expended use when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest.\n\nYou gain additional uses when you reach certain Druid levels, as shown in the Wild Shape column of the Druid Features table.\n\nKnown Forms. You know four Beast forms for this feature, chosen from among Beast stat blocks that have a maximum Challenge Rating of 1/4 and that lack a Fly Speed (see appendix B for stat block options). The Rat, Riding Horse, Spider, and Wolf are recommended. Whenever you finish a Long Rest, you can replace one of your known forms with another eligible form.\n\nWhen you reach certain Druid levels, your number of known forms and the maximum Challenge Rating for those forms increases, as shown in the Beast Shapes table. In addition, starting at level 8, you can adopt a form that has a Fly Speed.\n\nWhen choosing known forms, you may look in the Monster Manual or elsewhere for eligible Beasts if the Dungeon Master permits you to do so."
      },
      {
        id: "druid:lvl2:wild-companion:2",
        name: "Wild Companion",
        class: "druid",
        level: 2,
        description: "You can summon a nature spirit that assumes an animal form to aid you. As a Magic action, you can expend a spell slot or a use of Wild Shape to cast the Find Familiar spell without Material components.\n\nWhen you cast the spell in this way, the familiar is Fey and disappears when you finish a Long Rest."
      },
      {
        id: "druid:lvl3:druid-subclass:1",
        name: "Druid Subclass",
        class: "druid",
        level: 3,
        description: "You gain a Druid subclass of your choice. The Circle of the Land subclass is detailed after this classs description. A subclass is a specialization that grants you features at certain Druid levels. For the rest of your career, you gain each of your subclasss features that are of your Druid level or lower."
      },
      {
        id: "druid:lvl4:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "druid",
        level: 4,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Druid levels 8, 12, and 16."
      },
      {
        id: "druid:lvl5:wild-resurgence:1",
        name: "Wild Resurgence",
        class: "druid",
        level: 5,
        description: "Once on each of your turns, if you have no uses of Wild Shape left, you can give yourself one use by expending a spell slot (no action required).\n\nIn addition, you can expend one use of Wild Shape (no action required) to give yourself a level 1 spell slot, but you cant do so again until you finish a Long Rest."
      },
      {
        id: "druid:lvl6:subclass-feature:1",
        name: "Subclass feature",
        class: "druid",
        level: 6
      },
      {
        id: "druid:lvl7:elemental-fury:1",
        name: "Elemental Fury",
        class: "druid",
        level: 7,
        description: "The might of the elements flows through you. You gain one of the following options of your choice.\n\nPotent Spellcasting. Add your Wisdom modifier to the damage you deal with any Druid cantrip.\n\nPrimal Strike. Once on each of your turns when you hit a creature with an attack roll using a weapon or a Beast forms attack in Wild Shape, you can cause the target to take an extra 1d8 Cold, Fire, Lightning, or Thunder damage (choose when you hit)."
      },
      {
        id: "druid:lvl8:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "druid",
        level: 8,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Druid levels 8, 12, and 16."
      },
      {
        id: "druid:lvl9:feature:1",
        name: "",
        class: "druid",
        level: 9
      },
      {
        id: "druid:lvl10:subclass-feature:1",
        name: "Subclass feature",
        class: "druid",
        level: 10
      },
      {
        id: "druid:lvl11:feature:1",
        name: "",
        class: "druid",
        level: 11
      },
      {
        id: "druid:lvl12:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "druid",
        level: 12,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Druid levels 8, 12, and 16."
      },
      {
        id: "druid:lvl13:feature:1",
        name: "",
        class: "druid",
        level: 13
      },
      {
        id: "druid:lvl14:subclass-feature:1",
        name: "Subclass feature",
        class: "druid",
        level: 14
      },
      {
        id: "druid:lvl15:improved-elemental-fury:1",
        name: "Improved Elemental Fury",
        class: "druid",
        level: 15,
        description: "The option you chose for Elemental Fury grows more powerful, as detailed below.\n\nPotent Spellcasting. When you cast a Druid cantrip with a range of 10 feet or greater, the spells range increases by 300 feet.\n\nPrimal Strike. The extra damage of your Primal Strike increases to 2d8."
      },
      {
        id: "druid:lvl16:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "druid",
        level: 16,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Druid levels 8, 12, and 16."
      },
      {
        id: "druid:lvl17:feature:1",
        name: "",
        class: "druid",
        level: 17
      },
      {
        id: "druid:lvl18:beast-spells:1",
        name: "Beast Spells",
        class: "druid",
        level: 18,
        description: "While using Wild Shape, you can cast spells in Beast form, except for any spell that has a Material component with a cost specified or that consumes its Material component."
      },
      {
        id: "druid:lvl19:epic-boon:1",
        name: "Epic Boon",
        class: "druid",
        level: 19,
        description: "You gain an Epic Boon feat (see Feats) or another feat of your choice for which you qualify. Boon of Dimensional Travel is recommended."
      },
      {
        id: "druid:lvl20:archdruid:1",
        name: "Archdruid",
        class: "druid",
        level: 20,
        description: "The vitality of nature constantly blooms within you, granting you the following benefits.\n\nEvergreen Wild Shape. Whenever you roll Initiative and have no uses of Wild Shape left, you regain one expended use of it.\n\nNature Magician. You can convert uses of Wild Shape into a spell slot (no action required). Choose a number of your unexpended uses of Wild Shape and convert them into a single spell slot, with each use contributing 2 spell levels. For example, if you convert two uses of Wild Shape, you produce a level 4 spell slot. Once you use this benefit, you cant do so again until you finish a Long Rest.\n\nLongevity. The primal magic that you wield causes you to age more slowly. For every ten years that pass, your body ages only one year."
      }
    ],
    subclasses: [
      {
        id: "druid:circle-of-the-land",
        name: "Circle of the Land",
        classId: "druid",
        unlockLevel: 3,
        source: "D&D Free Rules 2024",
        features: [
          {
            id: "druid:circle-of-the-land:lvl3:circle-of-the-land-spells",
            name: "Circle of the Land Spells",
            class: "druid",
            level: 3,
            subclassId: "druid:circle-of-the-land",
            subclassName: "Circle of the Land",
            description: "Whenever you finish a Long Rest, choose one type of land: arid, polar, temperate, or tropical. Consult the table below that corresponds to the chosen type; you have the spells listed for your Druid level and lower prepared."
          },
          {
            id: "druid:circle-of-the-land:lvl3:land-s-aid",
            name: "Lands Aid",
            class: "druid",
            level: 3,
            subclassId: "druid:circle-of-the-land",
            subclassName: "Circle of the Land",
            description: "As a Magic action, you can expend a use of your Wild Shape and choose a point within 60 feet of yourself. Vitality-giving flowers and life-draining thorns appear for a moment in a 10-foot-radius Sphere centered on that point. Each creature of your choice in the Sphere must make a Constitution saving throw against your spell save DC, taking 2d6 Necrotic damage on a failed save or half as much damage on a successful one. One creature of your choice in that area regains 2d6 Hit Points.\n\nThe damage and healing increase by 1d6 when you reach Druid levels 10 (3d6) and 14 (4d6)."
          },
          {
            id: "druid:circle-of-the-land:lvl6:natural-recovery",
            name: "Natural Recovery",
            class: "druid",
            level: 6,
            subclassId: "druid:circle-of-the-land",
            subclassName: "Circle of the Land",
            description: "You can cast one of the level 1+ spells that you have prepared from your Circle Spells feature without expending a spell slot, and you must finish a Long Rest before you do so again.\n\nIn addition, when you finish a Short Rest, you can choose expended spell slots to recover. The spell slots can have a combined level that is equal to or less than half your Druid level (round up), and none of them can be level 6+. For example, if youre a level 6 Druid, you can recover up to three levels worth of spell slots. You can recover a level 3 spell slot, a level 2 and a level 1 spell slot, or three level 1 spell slots. Once you recover spell slots with this feature, you cant do so again until you finish a Long Rest."
          },
          {
            id: "druid:circle-of-the-land:lvl10:nature-s-ward",
            name: "Natures Ward",
            class: "druid",
            level: 10,
            subclassId: "druid:circle-of-the-land",
            subclassName: "Circle of the Land",
            description: "You are immune to the Poisoned condition, and you have Resistance to a damage type associated with your current land choice in the Circle Spells feature, as shown in the Natures Ward table."
          },
          {
            id: "druid:circle-of-the-land:lvl14:nature-s-sanctuary",
            name: "Natures Sanctuary",
            class: "druid",
            level: 14,
            subclassId: "druid:circle-of-the-land",
            subclassName: "Circle of the Land",
            description: "As a Magic action, you can expend a use of your Wild Shape and cause spectral trees and vines to appear in a 15-foot Cube on the ground within 120 feet of yourself. They last there for 1 minute or until you have the Incapacitated condition or die. You and your allies have Half Cover while in that area, and your allies gain the current Resistance of your Natures Ward while there.\n\nAs a Bonus Action, you can move the Cube up to 60 feet to ground within 120 feet of yourself."
          }
        ]
      }
    ]
  },
  fighter: {
    classId: "fighter",
    className: "Fighter",
    source: "D&D Free Rules 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "fighter:lvl1:fighting-style:1",
        name: "Fighting Style",
        class: "fighter",
        level: 1,
        description: "You have honed your martial prowess and gain a Fighting Style feat of your choice (see Feats). Defense is recommended.\n\nWhenever you gain a Fighter level, you can replace the feat you chose with a different Fighting Style feat."
      },
      {
        id: "fighter:lvl1:second-wind:2",
        name: "Second Wind",
        class: "fighter",
        level: 1,
        description: "You have a limited well of physical and mental stamina that you can draw on. As a Bonus Action, you can use it to regain Hit Points equal to 1d10 plus your Fighter level.\n\nYou can use this feature twice. You regain one expended use when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest.\n\nWhen you reach certain Fighter levels, you gain more uses of this feature, as shown in the Second Wind column of the Fighter Features table."
      },
      {
        id: "fighter:lvl1:weapon-mastery:3",
        name: "Weapon Mastery",
        class: "fighter",
        level: 1,
        description: "Your training with weapons allows you to use the mastery properties of three kinds of Simple or Martial weapons of your choice. Whenever you finish a Long Rest, you can practice weapon drills and change one of those weapon choices.\n\nWhen you reach certain Fighter levels, you gain the ability to use the mastery properties of more kinds of weapons, as shown in the Weapon Mastery column of the Fighter Features table."
      },
      {
        id: "fighter:lvl2:action-surge-one-use:1",
        name: "Action Surge (one use)",
        class: "fighter",
        level: 2
      },
      {
        id: "fighter:lvl2:tactical-mind:2",
        name: "Tactical Mind",
        class: "fighter",
        level: 2,
        description: "You have a mind for tactics on and off the battlefield. When you fail an ability check, you can expend a use of your Second Wind to push yourself toward success. Rather than regaining Hit Points, you roll 1d10 and add the number rolled to the ability check, potentially turning it into a success. If the check still fails, this use of Second Wind isnt expended."
      },
      {
        id: "fighter:lvl3:fighter-subclass:1",
        name: "Fighter Subclass",
        class: "fighter",
        level: 3,
        description: "You gain a Fighter subclass of your choice. The Champion subclass is detailed after this classs description. A subclass is a specialization that grants you features at certain Fighter levels. For the rest of your career, you gain each of your subclasss features that are of your Fighter level or lower."
      },
      {
        id: "fighter:lvl4:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "fighter",
        level: 4,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Fighter levels 6, 8, 12, 14, and 16."
      },
      {
        id: "fighter:lvl5:extra-attack:1",
        name: "Extra Attack",
        class: "fighter",
        level: 5,
        description: "You can attack twice instead of once whenever you take the Attack action on your turn."
      },
      {
        id: "fighter:lvl5:tactical-shift:2",
        name: "Tactical Shift",
        class: "fighter",
        level: 5,
        description: "Whenever you activate your Second Wind with a Bonus Action, you can move up to half your Speed without provoking Opportunity Attacks."
      },
      {
        id: "fighter:lvl6:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "fighter",
        level: 6,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Fighter levels 6, 8, 12, 14, and 16."
      },
      {
        id: "fighter:lvl7:subclass-feature:1",
        name: "Subclass feature",
        class: "fighter",
        level: 7
      },
      {
        id: "fighter:lvl8:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "fighter",
        level: 8,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Fighter levels 6, 8, 12, 14, and 16."
      },
      {
        id: "fighter:lvl9:indomitable-one-use:1",
        name: "Indomitable (one use)",
        class: "fighter",
        level: 9
      },
      {
        id: "fighter:lvl9:tactical-master:2",
        name: "Tactical Master",
        class: "fighter",
        level: 9,
        description: "When you attack with a weapon whose mastery property you can use, you can replace that property with the Push, Sap, or Slow property for that attack."
      },
      {
        id: "fighter:lvl10:subclass-feature:1",
        name: "Subclass feature",
        class: "fighter",
        level: 10
      },
      {
        id: "fighter:lvl11:two-extra-attacks:1",
        name: "Two Extra Attacks",
        class: "fighter",
        level: 11,
        description: "You can attack three times instead of once whenever you take the Attack action on your turn."
      },
      {
        id: "fighter:lvl12:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "fighter",
        level: 12,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Fighter levels 6, 8, 12, 14, and 16."
      },
      {
        id: "fighter:lvl13:indomitable-two-uses:1",
        name: "Indomitable (two uses)",
        class: "fighter",
        level: 13
      },
      {
        id: "fighter:lvl13:studied-attacks:2",
        name: "Studied Attacks",
        class: "fighter",
        level: 13,
        description: "You study your opponents and learn from each attack you make. If you make an attack roll against a creature and miss, you have Advantage on your next attack roll against that creature before the end of your next turn."
      },
      {
        id: "fighter:lvl14:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "fighter",
        level: 14,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Fighter levels 6, 8, 12, 14, and 16."
      },
      {
        id: "fighter:lvl15:subclass-feature:1",
        name: "Subclass feature",
        class: "fighter",
        level: 15
      },
      {
        id: "fighter:lvl16:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "fighter",
        level: 16,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Fighter levels 6, 8, 12, 14, and 16."
      },
      {
        id: "fighter:lvl17:action-surge-two-uses:1",
        name: "Action Surge (two uses)",
        class: "fighter",
        level: 17
      },
      {
        id: "fighter:lvl17:indomitable-three-uses:2",
        name: "Indomitable (three uses)",
        class: "fighter",
        level: 17
      },
      {
        id: "fighter:lvl18:subclass-feature:1",
        name: "Subclass feature",
        class: "fighter",
        level: 18
      },
      {
        id: "fighter:lvl19:epic-boon:1",
        name: "Epic Boon",
        class: "fighter",
        level: 19,
        description: "You gain an Epic Boon feat (see Feats) or another feat of your choice for which you qualify. Boon of Combat Prowess is recommended."
      },
      {
        id: "fighter:lvl20:three-extra-attacks:1",
        name: "Three Extra Attacks",
        class: "fighter",
        level: 20,
        description: "You can attack four times instead of once whenever you take the Attack action on your turn."
      }
    ],
    subclasses: [
      {
        id: "fighter:champion",
        name: "Champion",
        classId: "fighter",
        unlockLevel: 3,
        source: "D&D Free Rules 2024",
        features: [
          {
            id: "fighter:champion:lvl3:improved-critical",
            name: "Improved Critical",
            class: "fighter",
            level: 3,
            subclassId: "fighter:champion",
            subclassName: "Champion",
            description: "Your attack rolls with weapons and Unarmed Strikes can score a Critical Hit on a roll of 19 or 20 on the d20."
          },
          {
            id: "fighter:champion:lvl3:remarkable-athlete",
            name: "Remarkable Athlete",
            class: "fighter",
            level: 3,
            subclassId: "fighter:champion",
            subclassName: "Champion",
            description: "Thanks to your athleticism, you have Advantage on Initiative rolls and Strength (Athletics) checks.\n\nIn addition, immediately after you score a Critical Hit, you can move up to half your Speed without provoking Opportunity Attacks."
          },
          {
            id: "fighter:champion:lvl7:additional-fighting-style",
            name: "Additional Fighting Style",
            class: "fighter",
            level: 7,
            subclassId: "fighter:champion",
            subclassName: "Champion",
            description: "You gain another Fighting Style feat of your choice."
          },
          {
            id: "fighter:champion:lvl10:heroic-warrior",
            name: "Heroic Warrior",
            class: "fighter",
            level: 10,
            subclassId: "fighter:champion",
            subclassName: "Champion",
            description: "The thrill of battle drives you toward victory. During combat, you can give yourself Heroic Inspiration whenever you start your turn without it."
          },
          {
            id: "fighter:champion:lvl15:superior-critical",
            name: "Superior Critical",
            class: "fighter",
            level: 15,
            subclassId: "fighter:champion",
            subclassName: "Champion",
            description: "Your attack rolls with weapons and Unarmed Strikes can now score a Critical Hit on a roll of 1820 on the d20."
          },
          {
            id: "fighter:champion:lvl18:survivor",
            name: "Survivor",
            class: "fighter",
            level: 18,
            subclassId: "fighter:champion",
            subclassName: "Champion",
            description: "You attain the pinnacle of resilience in battle, giving you these benefits.\n\nDefy Death. You have Advantage on Death Saving Throws. Moreover, when you roll 1820 on a Death Saving Throw, you gain the benefit of rolling a 20 on it.\n\nHeroic Rally. At the start of each of your turns, you regain Hit Points equal to 5 plus your Constitution modifier if you are Bloodied and have at least 1 Hit Point."
          }
        ]
      }
    ]
  },
  monk: {
    classId: "monk",
    className: "Monk",
    source: "D&D Free Rules 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "monk:lvl1:martial-arts:1",
        name: "Martial Arts",
        class: "monk",
        level: 1,
        description: "Your practice of martial arts gives you mastery of combat styles that use your Unarmed Strike and Monk weapons, which are the following:\n\nYou gain the following benefits while you are unarmed or wielding only Monk weapons and you arent wearing armor or wielding a Shield.\n\nBonus Unarmed Strike. You can make an Unarmed Strike as a Bonus Action.\n\nMartial Arts Die. You can roll 1d6 in place of the normal damage of your Unarmed Strike or Monk weapons. This die changes as you gain Monk levels, as shown in the Martial Arts column of the Monk Features table.\n\nDexterous Attacks. You can use your Dexterity modifier instead of your Strength modifier for the attack and damage rolls of your Unarmed Strikes and Monk weapons. In addition, when you use the Grapple or Shove option of your Unarmed Strike, you can use your Dexterity modifier instead of your Strength modifier to determine the save DC."
      },
      {
        id: "monk:lvl1:unarmored-defense:2",
        name: "Unarmored Defense",
        class: "monk",
        level: 1,
        description: "While you arent wearing armor or wielding a Shield, your base Armor Class equals 10 plus your Dexterity and Wisdom modifiers."
      },
      {
        id: "monk:lvl2:monk-s-focus:1",
        name: "Monks Focus",
        class: "monk",
        level: 2,
        description: "Your focus and martial training allow you to harness a well of extraordinary energy within yourself. This energy is represented by Focus Points. Your Monk level determines the number of points you have, as shown in the Focus Points column of the Monk Features table.\n\nYou can expend these points to enhance or fuel certain Monk features. You start knowing three such features: Flurry of Blows, Patient Defense, and Step of the Wind, each of which is detailed below.\n\nWhen you expend a Focus Point, it is unavailable until you finish a Short or Long Rest, at the end of which you regain all your expended points.\n\nSome features that use Focus Points require your target to make a saving throw. The save DC equals 8 plus your Wisdom modifier and Proficiency Bonus.\n\nFlurry of Blows. You can expend 1 Focus Point to make two Unarmed Strikes as a Bonus Action.\n\nPatient Defense. You can take the Disengage action as a Bonus Action. Alternatively, you can expend 1 Focus Point to take both the Disengage and the Dodge actions as a Bonus Action.\n\nStep of the Wind. You can take the Dash action as a Bonus Action. Alternatively, you can expend 1 Focus Point to take both the Disengage and Dash actions as a Bonus Action, and your jump distance is doubled for the turn."
      },
      {
        id: "monk:lvl2:unarmored-movement:2",
        name: "Unarmored Movement",
        class: "monk",
        level: 2,
        description: "Your speed increases by 10 feet while you arent wearing armor or wielding a Shield. This bonus increases when you reach certain Monk levels, as shown on the Monk Features table."
      },
      {
        id: "monk:lvl2:uncanny-metabolism:3",
        name: "Uncanny Metabolism",
        class: "monk",
        level: 2,
        description: "When you roll Initiative, you can regain all expended Focus Points. When you do so, roll your Martial Arts die, and regain a number of Hit Points equal to your Monk level plus the number rolled.\n\nOnce you use this feature, you cant use it again until you finish a Long Rest."
      },
      {
        id: "monk:lvl3:deflect-attacks:1",
        name: "Deflect Attacks",
        class: "monk",
        level: 3,
        description: "When an attack roll hits you and its damage includes Bludgeoning, Piercing, or Slashing damage, you can take a Reaction to reduce the attacks total damage against you. The reduction equals 1d10 plus your Dexterity modifier and Monk level.\n\nIf you reduce the damage to 0, you can expend 1 Focus Point to redirect some of the attacks force. If you do so, choose a creature you can see within 5 feet of yourself if the attack was a melee attack or a creature you can see within 60 feet of yourself that isnt behind Total Cover if the attack was a ranged attack. That creature must succeed on a Dexterity saving throw or take damage equal to two rolls of your Martial Arts die plus your Dexterity modifier. The damage is the same type dealt by the attack."
      },
      {
        id: "monk:lvl3:monk-subclass:2",
        name: "Monk Subclass",
        class: "monk",
        level: 3,
        description: "You gain a Monk subclass of your choice. The Warrior of the Open Hand subclass is detailed after this classs description. A subclass is a specialization that grants you features at certain Monk levels. For the rest of your career, you gain each of your subclasss features that are of your Monk level or lower."
      },
      {
        id: "monk:lvl4:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "monk",
        level: 4,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Monk levels 8, 12, and 16."
      },
      {
        id: "monk:lvl4:slow-fall:2",
        name: "Slow Fall",
        class: "monk",
        level: 4,
        description: "You can take a Reaction when you fall to reduce any damage you take from the fall by an amount equal to five times your Monk level."
      },
      {
        id: "monk:lvl5:extra-attack:1",
        name: "Extra Attack",
        class: "monk",
        level: 5,
        description: "You can attack twice instead of once whenever you take the Attack action on your turn."
      },
      {
        id: "monk:lvl5:stunning-strike:2",
        name: "Stunning Strike",
        class: "monk",
        level: 5,
        description: "Once per turn when you hit a creature with a Monk weapon or an Unarmed Strike, you can expend 1 Focus Point to attempt a stunning strike. The target must make a Constitution saving throw. On a failed save, the target has the Stunned condition until the start of your next turn. On a successful save, the targets Speed is halved until the start of your next turn, and the next attack roll made against the target before then has Advantage."
      },
      {
        id: "monk:lvl6:empowered-strikes:1",
        name: "Empowered Strikes",
        class: "monk",
        level: 6,
        description: "Whenever you deal damage with your Unarmed Strike, it can deal your choice of Force damage or its normal damage type."
      },
      {
        id: "monk:lvl6:subclass-feature:2",
        name: "Subclass feature",
        class: "monk",
        level: 6
      },
      {
        id: "monk:lvl7:evasion:1",
        name: "Evasion",
        class: "monk",
        level: 7,
        description: "When youre subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw and only half damage if you fail.\n\nYou dont benefit from this feature if you have the Incapacitated condition."
      },
      {
        id: "monk:lvl8:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "monk",
        level: 8,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Monk levels 8, 12, and 16."
      },
      {
        id: "monk:lvl9:acrobatic-movement:1",
        name: "Acrobatic Movement",
        class: "monk",
        level: 9,
        description: "While you arent wearing armor or wielding a Shield, you gain the ability to move along vertical surfaces and across liquids on your turn without falling during the movement."
      },
      {
        id: "monk:lvl10:heightened-focus:1",
        name: "Heightened Focus",
        class: "monk",
        level: 10,
        description: "Your Flurry of Blows, Patient Defense, and Step of the Wind gain the following benefits.\n\nFlurry of Blows. You can expend 1 Focus Point to use Flurry of Blows and make three Unarmed Strikes with it instead of two.\n\nPatient Defense. When you expend a Focus Point to use Patient Defense, you gain a number of Temporary Hit Points equal to two rolls of your Martial Arts die.\n\nStep of the Wind. When you expend a Focus Point to use Step of the Wind, you can choose a willing creature within 5 feet of yourself that is Large or smaller. You move the creature with you until the end of your turn. The creatures movement doesnt provoke Opportunity Attacks."
      },
      {
        id: "monk:lvl10:self-restoration:2",
        name: "Self-Restoration",
        class: "monk",
        level: 10,
        description: "Through sheer force of will, you can remove one of the following conditions from yourself at the end of each of your turns: Charmed, Frightened, or Poisoned.\n\nIn addition, forgoing food and drink doesnt give you levels of Exhaustion."
      },
      {
        id: "monk:lvl11:subclass-feature:1",
        name: "Subclass feature",
        class: "monk",
        level: 11
      },
      {
        id: "monk:lvl12:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "monk",
        level: 12,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Monk levels 8, 12, and 16."
      },
      {
        id: "monk:lvl13:deflect-energy:1",
        name: "Deflect Energy",
        class: "monk",
        level: 13,
        description: "You can now use your Deflect Attacks feature against attacks that deal any damage type, not just Bludgeoning, Piercing, or Slashing."
      },
      {
        id: "monk:lvl14:disciplined-survivor:1",
        name: "Disciplined Survivor",
        class: "monk",
        level: 14,
        description: "Your physical and mental discipline grant you proficiency in all saving throws.\n\nAdditionally, whenever you make a saving throw and fail, you can expend 1 Focus Point to reroll it, and you must use the new roll."
      },
      {
        id: "monk:lvl15:perfect-focus:1",
        name: "Perfect Focus",
        class: "monk",
        level: 15,
        description: "When you roll Initiative and dont use Uncanny Metabolism, you regain expended Focus Points until you have 4 if you have 3 or fewer."
      },
      {
        id: "monk:lvl16:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "monk",
        level: 16,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Monk levels 8, 12, and 16."
      },
      {
        id: "monk:lvl17:subclass-feature:1",
        name: "Subclass feature",
        class: "monk",
        level: 17
      },
      {
        id: "monk:lvl18:superior-defense:1",
        name: "Superior Defense",
        class: "monk",
        level: 18,
        description: "At the start of your turn, you can expend 3 Focus Points to bolster yourself against harm for 1 minute or until you have the Incapacitated condition. During that time, you have Resistance to all damage except Force damage."
      },
      {
        id: "monk:lvl19:epic-boon:1",
        name: "Epic Boon",
        class: "monk",
        level: 19,
        description: "You gain an Epic Boon feat (see Feats) or another feat of your choice for which you qualify. Boon of Irresistible Offense is recommended."
      },
      {
        id: "monk:lvl20:body-and-mind:1",
        name: "Body and Mind",
        class: "monk",
        level: 20,
        description: "You have developed your body and mind to new heights. Your Dexterity and Wisdom scores increase by 4, to a maximum of 25."
      }
    ],
    subclasses: [
      {
        id: "monk:warrior-of-the-open-hand",
        name: "Warrior of the Open Hand",
        classId: "monk",
        unlockLevel: 3,
        source: "D&D Free Rules 2024",
        features: [
          {
            id: "monk:warrior-of-the-open-hand:lvl3:open-hand-technique",
            name: "Open Hand Technique",
            class: "monk",
            level: 3,
            subclassId: "monk:warrior-of-the-open-hand",
            subclassName: "Warrior of the Open Hand",
            description: "Whenever you hit a creature with an attack granted by your Flurry of Blows, you can impose one of the following effects on that target.\n\nAddle. The target cant make Opportunity Attacks until the start of its next turn.\n\nPush. The target must succeed on a Strength saving throw or be pushed up to 15 feet away from you.\n\nTopple. The target must succeed on a Dexterity saving throw or have the Prone condition."
          },
          {
            id: "monk:warrior-of-the-open-hand:lvl6:wholeness-of-body",
            name: "Wholeness of Body",
            class: "monk",
            level: 6,
            subclassId: "monk:warrior-of-the-open-hand",
            subclassName: "Warrior of the Open Hand",
            description: "You gain the ability to heal yourself. As a Bonus Action, you can roll your Martial Arts die. You regain a number of Hit Points equal to the number rolled plus your Wisdom modifier (minimum of 1 Hit Point regained).\n\nYou can use this feature a number of times equal to your Wisdom modifier (minimum of once), and you regain all expended uses when you finish a Long Rest."
          },
          {
            id: "monk:warrior-of-the-open-hand:lvl11:fleet-step",
            name: "Fleet Step",
            class: "monk",
            level: 11,
            subclassId: "monk:warrior-of-the-open-hand",
            subclassName: "Warrior of the Open Hand",
            description: "When you take a Bonus Action other than Step of the Wind, you can also use Step of the Wind immediately after that Bonus Action."
          },
          {
            id: "monk:warrior-of-the-open-hand:lvl17:quivering-palm",
            name: "Quivering Palm",
            class: "monk",
            level: 17,
            subclassId: "monk:warrior-of-the-open-hand",
            subclassName: "Warrior of the Open Hand",
            description: "You gain the ability to set up lethal vibrations in someones body. When you hit a creature with an Unarmed Strike, you can expend 4 Focus Points to start these imperceptible vibrations, which last for a number of days equal to your Monk level. The vibrations are harmless unless you take an action to end them. Alternatively, when you take the Attack action on your turn, you can forgo one of the attacks to end the vibrations. To end them, you and the target must be on the same plane of existence. When you end them, the target must make a Constitution saving throw, taking 10d12 Force damage on a failed save or half as much damage on a successful one.\n\nYou can have only one creature under the effect of this feature at a time. You can end the vibrations harmlessly (no action required)."
          }
        ]
      }
    ]
  },
  paladin: {
    classId: "paladin",
    className: "Paladin",
    source: "D&D Free Rules 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "paladin:lvl1:lay-on-hands:1",
        name: "Lay On Hands",
        class: "paladin",
        level: 1,
        description: "Your blessed touch can heal wounds. You have a pool of healing power that replenishes when you finish a Long Rest. With that pool, you can restore a total number of Hit Points equal to five times your Paladin level.\n\nAs a Bonus Action, you can touch a creature (which could be yourself) and draw power from the pool of healing to restore a number of Hit Points to that creature, up to the maximum amount remaining in the pool.\n\nYou can also expend 5 Hit Points from the pool of healing power to remove the Poisoned condition from the creature; those points dont also restore Hit Points to the creature."
      },
      {
        id: "paladin:lvl1:spellcasting:2",
        name: "Spellcasting",
        class: "paladin",
        level: 1,
        description: "You have learned to cast spells through prayer and meditation. See Spells for the rules on spellcasting. The information below details how you use those rules with Paladin spells, which appear in the Paladin spell list later in the classs description.\n\nSpell Slots. The Paladin Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.\n\nPrepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 Paladin spells. Heroism and Searing Smite are recommended.\n\nThe number of spells on your list increases as you gain Paladin levels, as shown in the Prepared Spells column of the Paladin Features table. Whenever that number increases, choose additional Paladin spells until the number of spells on your list matches the number in the Paladin Features table. The chosen spells must be of a level for which you have spell slots. For example, if youre a level 5 Paladin, your list of prepared spells can include six Paladin spells of level 1 or 2 in any combination.\n\nIf another Paladin feature gives you spells that you always have prepared, those spells dont count against the number of spells you can prepare with this feature, but those spells otherwise count as Paladin spells for you.\n\nChanging Your Prepared Spells. Whenever you finish a Long Rest, you can replace one spell on your list with another Paladin spell for which you have spell slots.\n\nSpellcasting Ability. Charisma is your spellcasting ability for your Paladin spells.\n\nSpellcasting Focus. You can use a Holy Symbol as a Spellcasting Focus for your Paladin spells."
      },
      {
        id: "paladin:lvl1:weapon-mastery:3",
        name: "Weapon Mastery",
        class: "paladin",
        level: 1,
        description: "Your training with weapons allows you to use the mastery properties of two kinds of weapons of your choice with which you have proficiency, such as Longswords and Javelins.\n\nWhenever you finish a Long Rest, you can change the kinds of weapons you chose. For example, you could switch to using the mastery properties of Halberds and Flails."
      },
      {
        id: "paladin:lvl2:fighting-style:1",
        name: "Fighting Style",
        class: "paladin",
        level: 2,
        description: "You gain a Fighting Style feat of your choice (see Feats for feats). Instead of choosing one of those feats, you can choose the option below.\n\nBlessed Warrior. You learn two Cleric cantrips of your choice (see the Cleric classs section for a list of Cleric spells). Guidance and Sacred Flame are recommended. The chosen cantrips count as Paladin spells for you, and Charisma is your spellcasting ability for them. Whenever you gain a Paladin level, you can replace one of these cantrips with another Cleric cantrip."
      },
      {
        id: "paladin:lvl2:divine-smite-paladin-s-smite:2",
        name: "Divine Smite (Paladin's Smite)",
        class: "paladin",
        level: 2,
        description: "You always have the Divine Smite spell prepared. In addition, you can cast it without expending a spell slot, but you must finish a Long Rest before you can cast it in this way again."
      },
      {
        id: "paladin:lvl3:channel-divinity:1",
        name: "Channel Divinity",
        class: "paladin",
        level: 3,
        description: "You can channel divine energy directly from the Outer Planes, using it to fuel magical effects. You start with one such effect: Divine Sense, which is described below. Other Paladin features give additional Channel Divinity effect options. Each time you use this classs Channel Divinity, you choose which effect from this class to create.\n\nYou can use this classs Channel Divinity twice. You regain one of its expended uses when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest. You gain an additional use when you reach Paladin level 11.\n\nIf a Channel Divinity effect requires a saving throw, the DC equals the spell save DC from this classs Spellcasting feature.\n\nDivine Sense. As a Bonus Action, you can open your awareness to detect Celestials, Fiends, and Undead. For the next 10 minutes or until you have the Incapacitated condition, you know the location of any creature of those types within 60 feet of yourself, and you know its creature type. Within the same radius, you also detect the presence of any place or object that has been consecrated or desecrated, as with the Hallow spell."
      },
      {
        id: "paladin:lvl3:paladin-subclass:2",
        name: "Paladin Subclass",
        class: "paladin",
        level: 3,
        description: "You gain a Paladin subclass of your choice. The Oath of Devotion subclass is detailed after this classs description. A subclass is a specialization that grants you features at certain Paladin levels. For the rest of your career, you gain each of your subclasss features that are of your Paladin level or lower.\n\nBreaking Your Oath\n\nA Paladin tries to hold to the highest standards of conduct, but even the most dedicated are fallible. Sometimes a Paladin transgresses their oath.\n\nA Paladin who has broken a vow typically seeks absolution, spending an all-night vigil as a sign of penitence or undertaking a fast. After a rite of forgiveness, the Paladin starts fresh.\n\nIf your Paladin unrepentantly violates their oath, talk to your DM. Your Paladin should probably take a more appropriate subclass or even abandon the class and adopt another one."
      },
      {
        id: "paladin:lvl4:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "paladin",
        level: 4,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Paladin levels 8, 12, and 16."
      },
      {
        id: "paladin:lvl5:extra-attack:1",
        name: "Extra Attack",
        class: "paladin",
        level: 5,
        description: "You can attack twice instead of once whenever you take the Attack action on your turn."
      },
      {
        id: "paladin:lvl5:faithful-steed:2",
        name: "Faithful Steed",
        class: "paladin",
        level: 5,
        description: "You can call on the aid of an otherworldly steed. You always have the Find Steed spell prepared.\n\nYou can also cast the spell once without expending a spell slot, and you regain the ability to do so when you finish a Long Rest."
      },
      {
        id: "paladin:lvl6:aura-of-protection:1",
        name: "Aura of Protection",
        class: "paladin",
        level: 6,
        description: "You radiate a protective, unseeable aura in a 10-foot Emanation that originates from you. The aura is inactive while you have the Incapacitated condition.\n\nYou and your allies in the aura gain a bonus to saving throws equal to your Charisma modifier (minimum bonus of +1).\n\nIf another Paladin is present, a creature can benefit from only one Aura of Protection at a time; the creature chooses which aura while in them."
      },
      {
        id: "paladin:lvl7:subclass-feature:1",
        name: "Subclass feature",
        class: "paladin",
        level: 7
      },
      {
        id: "paladin:lvl8:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "paladin",
        level: 8,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Paladin levels 8, 12, and 16."
      },
      {
        id: "paladin:lvl9:abjure-foes:1",
        name: "Abjure Foes",
        class: "paladin",
        level: 9,
        description: "As a Magic action, you can expend one use of this classs Channel Divinity to overwhelm foes with awe. As you present your Holy Symbol or weapon, you can target a number of creatures equal to your Charisma modifier (minimum of one creature) that you can see within 60 feet of yourself. Each target must succeed on a Wisdom saving throw or have the Frightened condition for 1 minute or until it takes any damage. While Frightened in this way, a target can do only one of the following on its turns: move, take an action, or take a Bonus Action."
      },
      {
        id: "paladin:lvl10:aura-of-courage:1",
        name: "Aura of Courage",
        class: "paladin",
        level: 10,
        description: "You and your allies have Immunity to the Frightened condition while in your Aura of Protection. If a Frightened ally enters the aura, that condition has no effect on that ally while there."
      },
      {
        id: "paladin:lvl11:radiant-strikes:1",
        name: "Radiant Strikes",
        class: "paladin",
        level: 11,
        description: "Your strikes now carry supernatural power. When you hit a target with an attack roll using a Melee weapon or an Unarmed Strike, the target takes an extra 1d8 Radiant damage."
      },
      {
        id: "paladin:lvl12:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "paladin",
        level: 12,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Paladin levels 8, 12, and 16."
      },
      {
        id: "paladin:lvl13:feature:1",
        name: "",
        class: "paladin",
        level: 13
      },
      {
        id: "paladin:lvl14:restoring-touch:1",
        name: "Restoring Touch",
        class: "paladin",
        level: 14,
        description: "When you use Lay On Hands on a creature, you can also remove one or more of the following conditions from the creature: Blinded, Charmed, Deafened, Frightened, Paralyzed, or Stunned. You must expend 5 Hit Points from the healing pool of Lay On Hands for each of these conditions you remove; those points dont also restore Hit Points to the creature."
      },
      {
        id: "paladin:lvl15:subclass-feature:1",
        name: "Subclass feature",
        class: "paladin",
        level: 15
      },
      {
        id: "paladin:lvl16:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "paladin",
        level: 16,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Paladin levels 8, 12, and 16."
      },
      {
        id: "paladin:lvl17:feature:1",
        name: "",
        class: "paladin",
        level: 17
      },
      {
        id: "paladin:lvl18:aura-expansion:1",
        name: "Aura Expansion",
        class: "paladin",
        level: 18,
        description: "Your Aura of Protection is now a 30-foot Emanation."
      },
      {
        id: "paladin:lvl19:epic-boon:1",
        name: "Epic Boon",
        class: "paladin",
        level: 19,
        description: "You gain an Epic Boon feat (see Feats) or another feat of your choice for which you qualify. Boon of Truesight is recommended."
      },
      {
        id: "paladin:lvl20:subclass-feature:1",
        name: "Subclass feature",
        class: "paladin",
        level: 20
      }
    ],
    subclasses: [
      {
        id: "paladin:oath-of-devotion",
        name: "Oath of Devotion",
        classId: "paladin",
        unlockLevel: 3,
        source: "D&D Free Rules 2024",
        features: [
          {
            id: "paladin:oath-of-devotion:lvl3:oath-of-devotion-spells",
            name: "Oath of Devotion Spells",
            class: "paladin",
            level: 3,
            subclassId: "paladin:oath-of-devotion",
            subclassName: "Oath of Devotion",
            description: "The magic of your oath ensures you always have certain spells ready; when you reach a Paladin level specified in the Oath of Devotion Spells table, you thereafter always have the listed spells prepared."
          },
          {
            id: "paladin:oath-of-devotion:lvl3:sacred-weapon",
            name: "Sacred Weapon",
            class: "paladin",
            level: 3,
            subclassId: "paladin:oath-of-devotion",
            subclassName: "Oath of Devotion",
            description: "When you take the Attack action, you can expend one use of your Channel Divinity to imbue one Melee weapon that you are holding with positive energy. For 10 minutes or until you use this feature again, you add your Charisma modifier to attack rolls you make with that weapon (minimum bonus of +1), and each time you hit with it, you cause it to deal its normal damage type or Radiant damage.\n\nThe weapon also emits Bright Light in a 20-foot radius and Dim Light 20 feet beyond that.\n\nYou can end this effect early (no action required). This effect also ends if you arent carrying the weapon."
          },
          {
            id: "paladin:oath-of-devotion:lvl7:aura-of-devotion",
            name: "Aura of Devotion",
            class: "paladin",
            level: 7,
            subclassId: "paladin:oath-of-devotion",
            subclassName: "Oath of Devotion",
            description: "You and your allies have Immunity to the Charmed condition while in your Aura of Protection. If a Charmed ally enters the aura, that condition has no effect on that ally while there."
          },
          {
            id: "paladin:oath-of-devotion:lvl15:smite-of-protection",
            name: "Smite of Protection",
            class: "paladin",
            level: 15,
            subclassId: "paladin:oath-of-devotion",
            subclassName: "Oath of Devotion",
            description: "Your magical smite now radiates protective energy. Whenever you cast Divine Smite, you and your allies have Half Cover while in your Aura of Protection. The aura has this benefit until the start of your next turn."
          },
          {
            id: "paladin:oath-of-devotion:lvl20:holy-nimbus",
            name: "Holy Nimbus",
            class: "paladin",
            level: 20,
            subclassId: "paladin:oath-of-devotion",
            subclassName: "Oath of Devotion",
            description: "As a Bonus Action, you can imbue your Aura of Protection with holy power, granting the benefits below for 10 minutes or until you end them (no action required). Once you use this feature, you cant use it again until you finish a Long Rest. You can also restore your use of it by expending a level 5 spell slot (no action required).\n\nHoly Ward. You have Advantage on any saving throw you are forced to make by a Fiend or an Undead.\n\nRadiant Damage. Whenever an enemy starts its turn in the aura, that creature takes Radiant damage equal to your Charisma modifier plus your Proficiency Bonus.\n\nSunlight. The aura is filled with Bright Light that is sunlight."
          }
        ]
      }
    ]
  },
  ranger: {
    classId: "ranger",
    className: "Ranger",
    source: "D&D Free Rules 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "ranger:lvl1:spellcasting:1",
        name: "Spellcasting",
        class: "ranger",
        level: 1,
        description: "You have learned to channel the magical essence of nature to cast spells. See Spells for the rules on spellcasting. The information below details how you use those rules with Ranger spells, which appear in the Ranger spell list later in the classs description.\n\nSpell Slots. The Ranger Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.\n\nPrepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 Ranger spells. Cure Wounds and Ensnaring Strike are recommended.\n\nThe number of spells on your list increases as you gain Ranger levels, as shown in the Prepared Spells column of the Ranger Features table. Whenever that number increases, choose additional Ranger spells until the number of spells on your list matches the number in the Ranger Features table. The chosen spells must be of a level for which you have spell slots. For example, if youre a level 5 Ranger, your list of prepared spells can include six Ranger spells of level 1 or 2 in any combination.\n\nIf another Ranger feature gives you spells that you always have prepared, those spells dont count against the number of spells you can prepare with this feature, but those spells otherwise count as Ranger spells for you.\n\nChanging Your Prepared Spells. Whenever you finish a Long Rest, you can replace one spell on your list with another Ranger spell for which you have spell slots.\n\nSpellcasting Ability. Wisdom is your spellcasting ability for your Ranger spells.\n\nSpellcasting Focus. You can use a Druidic Focus as a Spellcasting Focus for your Ranger spells."
      },
      {
        id: "ranger:lvl1:favored-enemy:2",
        name: "Favored Enemy",
        class: "ranger",
        level: 1,
        description: "You always have the Hunters Mark spell prepared. You can cast it twice without expending a spell slot, and you regain all expended uses of this ability when you finish a Long Rest.\n\nThe number of times you can cast the spell without a spell slot increases when you reach certain Ranger levels, as shown in the Favored Enemy column of the Ranger Features table."
      },
      {
        id: "ranger:lvl1:weapon-mastery:3",
        name: "Weapon Mastery",
        class: "ranger",
        level: 1,
        description: "Your training with weapons allows you to use the mastery properties of two kinds of weapons of your choice with which you have proficiency, such as Longbows and Shortswords.\n\nWhenever you finish a Long Rest, you can change the kinds of weapons you chose. For example, you could switch to using the mastery properties of Scimitars and Longswords."
      },
      {
        id: "ranger:lvl2:deft-explorer:1",
        name: "Deft Explorer",
        class: "ranger",
        level: 2,
        description: "Thanks to your travels, you gain the following benefits.\n\nExpertise. Choose one of your skill proficiencies with which you lack Expertise. You gain Expertise in that skill.\n\nLanguages. You know two languages of your choice from the language tables in Creating a Character."
      },
      {
        id: "ranger:lvl2:fighting-style:2",
        name: "Fighting Style",
        class: "ranger",
        level: 2,
        description: "You gain a Fighting Style feat of your choice (see Feats). Instead of choosing one of those feats, you can choose the option below.\n\nDruidic Warrior. You learn two Druid cantrips of your choice (see the Druid classs section for a list of Druid spells). Guidance and Starry Wisp are recommended. The chosen cantrips count as Ranger spells for you, and Wisdom is your spellcasting ability for them. Whenever you gain a Ranger level, you can replace one of these cantrips with another Druid cantrip."
      },
      {
        id: "ranger:lvl3:ranger-subclass:1",
        name: "Ranger Subclass",
        class: "ranger",
        level: 3,
        description: "You gain a Ranger subclass of your choice. The Hunter subclass is detailed after this classs description. A subclass is a specialization that grants you features at certain Ranger levels. For the rest of your career, you gain each of your subclasss features that are of your Ranger level or lower."
      },
      {
        id: "ranger:lvl4:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "ranger",
        level: 4,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Ranger levels 8, 12, and 16."
      },
      {
        id: "ranger:lvl5:extra-attack:1",
        name: "Extra Attack",
        class: "ranger",
        level: 5,
        description: "You can attack twice instead of once whenever you take the Attack action on your turn."
      },
      {
        id: "ranger:lvl6:roving:1",
        name: "Roving",
        class: "ranger",
        level: 6,
        description: "Your Speed increases by 10 feet while you arent wearing Heavy armor. You also have a Climb Speed and a Swim Speed equal to your Speed."
      },
      {
        id: "ranger:lvl7:subclass-feature:1",
        name: "Subclass feature",
        class: "ranger",
        level: 7
      },
      {
        id: "ranger:lvl8:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "ranger",
        level: 8,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Ranger levels 8, 12, and 16."
      },
      {
        id: "ranger:lvl9:expertise:1",
        name: "Expertise",
        class: "ranger",
        level: 9,
        description: "Choose two of your skill proficiencies with which you lack Expertise. You gain Expertise in those skills."
      },
      {
        id: "ranger:lvl10:tireless:1",
        name: "Tireless",
        class: "ranger",
        level: 10,
        description: "Primal forces now help fuel you on your journeys, granting you the following benefits.\n\nTemporary Hit Points. As a Magic action, you can give yourself a number of Temporary Hit Points equal to 1d8 plus your Wisdom modifier (minimum of 1). You can use this action a number of times equal to your Wisdom modifier (minimum of once), and you regain all expended uses when you finish a Long Rest.\n\nDecrease Exhaustion. Whenever you finish a Short Rest, your Exhaustion level, if any, decreases by 1."
      },
      {
        id: "ranger:lvl11:subclass-feature:1",
        name: "Subclass feature",
        class: "ranger",
        level: 11
      },
      {
        id: "ranger:lvl12:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "ranger",
        level: 12,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Ranger levels 8, 12, and 16."
      },
      {
        id: "ranger:lvl13:relentless-hunter:1",
        name: "Relentless Hunter",
        class: "ranger",
        level: 13,
        description: "Taking damage cant break your Concentration on Hunters Mark."
      },
      {
        id: "ranger:lvl14:nature-s-veil:1",
        name: "Natures Veil",
        class: "ranger",
        level: 14,
        description: "You invoke spirits of nature to magically hide yourself. As a Bonus Action, you can give yourself the Invisible condition until the end of your next turn.\n\nYou can use this feature a number of times equal to your Wisdom modifier (minimum of once), and you regain all expended uses when you finish a Long Rest."
      },
      {
        id: "ranger:lvl15:subclass-feature:1",
        name: "Subclass feature",
        class: "ranger",
        level: 15
      },
      {
        id: "ranger:lvl16:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "ranger",
        level: 16,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Ranger levels 8, 12, and 16."
      },
      {
        id: "ranger:lvl17:precise-hunter:1",
        name: "Precise Hunter",
        class: "ranger",
        level: 17,
        description: "You have Advantage on attack rolls against the creature currently marked by your Hunters Mark."
      },
      {
        id: "ranger:lvl18:feral-senses:1",
        name: "Feral Senses",
        class: "ranger",
        level: 18,
        description: "Your connection to the forces of nature grants you Blindsight with a range of 30 feet."
      },
      {
        id: "ranger:lvl19:epic-boon:1",
        name: "Epic Boon",
        class: "ranger",
        level: 19,
        description: "You gain an Epic Boon feat (see Feats) or another feat of your choice for which you qualify. Boon of Dimensional Travel is recommended."
      },
      {
        id: "ranger:lvl20:foe-slayer:1",
        name: "Foe Slayer",
        class: "ranger",
        level: 20,
        description: "The damage die of your Hunters Mark is a d10 rather than a d6."
      }
    ],
    subclasses: [
      {
        id: "ranger:hunter",
        name: "Hunter",
        classId: "ranger",
        unlockLevel: 3,
        source: "D&D Free Rules 2024",
        features: [
          {
            id: "ranger:hunter:lvl3:hunter-s-lore",
            name: "Hunters Lore",
            class: "ranger",
            level: 3,
            subclassId: "ranger:hunter",
            subclassName: "Hunter",
            description: "You can call on the forces of nature to reveal certain strengths and weaknesses of your prey. While a creature is marked by your Hunters Mark, you know whether that creature has any Immunities, Resistances, or Vulnerabilities, and if the creature has any, you know what they are."
          },
          {
            id: "ranger:hunter:lvl3:hunter-s-prey",
            name: "Hunters Prey",
            class: "ranger",
            level: 3,
            subclassId: "ranger:hunter",
            subclassName: "Hunter",
            description: "You gain one of the following feature options of your choice. Whenever you finish a Short or Long Rest, you can replace the chosen option with the other one.\n\nColossus Slayer. Your tenacity can wear down even the most resilient foes. When you hit a creature with a weapon, the weapon deals an extra 1d8 damage to the target if its missing any of its Hit Points. You can deal this extra damage only once per turn.\n\nHorde Breaker. Once on each of your turns when you make an attack with a weapon, you can make another attack with the same weapon against a different creature that is within 5 feet of the original target, that is within the weapons range, and that you havent attacked this turn."
          },
          {
            id: "ranger:hunter:lvl7:defensive-tactics",
            name: "Defensive Tactics",
            class: "ranger",
            level: 7,
            subclassId: "ranger:hunter",
            subclassName: "Hunter",
            description: "You gain one of the following feature options of your choice. Whenever you finish a Short or Long Rest, you can replace the chosen option with the other one.\n\nEscape the Horde. Opportunity Attacks have Disadvantage against you.\n\nMultiattack Defense. When a creature hits you with an attack roll, that creature has Disadvantage on all other attack rolls against you this turn."
          },
          {
            id: "ranger:hunter:lvl11:superior-hunter-s-prey",
            name: "Superior Hunters Prey",
            class: "ranger",
            level: 11,
            subclassId: "ranger:hunter",
            subclassName: "Hunter",
            description: "Once per turn when you deal damage to a creature marked by your Hunters Mark, you can also deal that spells extra damage to a different creature that you can see within 30 feet of the first creature."
          },
          {
            id: "ranger:hunter:lvl15:superior-hunter-s-defense",
            name: "Superior Hunters Defense",
            class: "ranger",
            level: 15,
            subclassId: "ranger:hunter",
            subclassName: "Hunter",
            description: "When you take damage, you can take a Reaction to give yourself Resistance to that damage and any other damage of the same type until the end of the current turn."
          }
        ]
      }
    ]
  },
  rogue: {
    classId: "rogue",
    className: "Rogue",
    source: "D&D Free Rules 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "rogue:lvl1:expertise:1",
        name: "Expertise",
        class: "rogue",
        level: 1,
        description: "You gain Expertise in two of your skill proficiencies of your choice. Sleight of Hand and Stealth are recommended if you have proficiency in them.\n\nAt Rogue level 6, you gain Expertise in two more of your skill proficiencies of your choice."
      },
      {
        id: "rogue:lvl1:sneak-attack:2",
        name: "Sneak Attack",
        class: "rogue",
        level: 1,
        description: "You know how to strike subtly and exploit a foes distraction. Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack roll if you have Advantage on the roll and the attack uses a Finesse or a Ranged weapon. The extra damages type is the same as the weapons type.\n\nYou dont need Advantage on the attack roll if at least one of your allies is within 5 feet of the target, the ally doesnt have the Incapacitated condition, and you dont have Disadvantage on the attack roll.\n\nThe extra damage increases as you gain Rogue levels, as shown in the Sneak Attack column of the Rogue Features table."
      },
      {
        id: "rogue:lvl1:thieves-cant:3",
        name: "Thieves Cant",
        class: "rogue",
        level: 1,
        description: "You picked up various languages in the communities where you plied your roguish talents. You know Thieves Cant and one other language of your choice, which you choose from the language tables in Creating a Character."
      },
      {
        id: "rogue:lvl1:weapon-mastery:4",
        name: "Weapon Mastery",
        class: "rogue",
        level: 1,
        description: "Your training with weapons allows you to use the mastery properties of two kinds of weapons of your choice with which you have proficiency, such as Daggers and Shortbows.\n\nWhenever you finish a Long Rest, you can change the kinds of weapons you chose. For example, you could switch to using the mastery properties of Scimitars and Shortswords."
      },
      {
        id: "rogue:lvl2:cunning-action:1",
        name: "Cunning Action",
        class: "rogue",
        level: 2,
        description: "Your quick thinking and agility allow you to move and act quickly. On your turn, you can take one of the following actions as a Bonus Action: Dash, Disengage, or Hide."
      },
      {
        id: "rogue:lvl3:rogue-subclass:1",
        name: "Rogue Subclass",
        class: "rogue",
        level: 3,
        description: "You gain a Rogue subclass of your choice. The Thief subclass is detailed after this classs description. A subclass is a specialization that grants you features at certain Rogue levels. For the rest of your career, you gain each of your subclasss features that are of your Rogue level or lower."
      },
      {
        id: "rogue:lvl3:steady-aim:2",
        name: "Steady Aim",
        class: "rogue",
        level: 3,
        description: "As a Bonus Action, you give yourself Advantage on your next attack roll on the current turn. You can use this feature only if you havent moved during this turn, and after you use it, your Speed is 0 until the end of the current turn."
      },
      {
        id: "rogue:lvl4:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "rogue",
        level: 4,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Rogue levels 8, 10, 12, and 16."
      },
      {
        id: "rogue:lvl5:cunning-strike:1",
        name: "Cunning Strike",
        class: "rogue",
        level: 5,
        description: "Youve developed cunning ways to use your Sneak Attack. When you deal Sneak Attack damage, you can add one of the following Cunning Strike effects. Each effect has a die cost, which is the number of Sneak Attack damage dice you must forgo to add the effect. You remove the die before rolling, and the effect occurs immediately after the attacks damage is dealt. For example, if you add the Poison effect, remove 1d6 from the Sneak Attacks damage before rolling.\n\nIf a Cunning Strike effect requires a saving throw, the DC equals 8 plus your Dexterity modifier and Proficiency Bonus.\n\nPoison (Cost: 1d6). You add a toxin to your strike, forcing the target to make a Constitution saving throw. On a failed save, the target has the Poisoned condition for 1 minute. At the end of each of its turns, the Poisoned target repeats the save, ending the effect on itself on a success.\n\nTo use this effect, you must have a Poisoners Kit on your person.\n\nTrip (Cost: 1d6). If the target is Large or smaller, it must succeed on a Dexterity saving throw or have the Prone condition.\n\nWithdraw (Cost: 1d6). Immediately after the attack, you move up to half your Speed without provoking Opportunity Attacks."
      },
      {
        id: "rogue:lvl5:uncanny-dodge:2",
        name: "Uncanny Dodge",
        class: "rogue",
        level: 5,
        description: "When an attacker that you can see hits you with an attack roll, you can take a Reaction to halve the attacks damage against you (round down)."
      },
      {
        id: "rogue:lvl6:expertise:1",
        name: "Expertise",
        class: "rogue",
        level: 6,
        description: "You gain Expertise in two of your skill proficiencies of your choice. Sleight of Hand and Stealth are recommended if you have proficiency in them.\n\nAt Rogue level 6, you gain Expertise in two more of your skill proficiencies of your choice."
      },
      {
        id: "rogue:lvl7:evasion:1",
        name: "Evasion",
        class: "rogue",
        level: 7,
        description: "You can nimbly dodge out of the way of certain dangers. When youre subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw and only half damage if you fail. You cant use this feature if you have the Incapacitated condition."
      },
      {
        id: "rogue:lvl7:reliable-talent:2",
        name: "Reliable Talent",
        class: "rogue",
        level: 7,
        description: "Whenever you make an ability check that uses one of your skill or tool proficiencies, you can treat a d20 roll of 9 or lower as a 10."
      },
      {
        id: "rogue:lvl8:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "rogue",
        level: 8,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Rogue levels 8, 10, 12, and 16."
      },
      {
        id: "rogue:lvl9:subclass-feature:1",
        name: "Subclass feature",
        class: "rogue",
        level: 9
      },
      {
        id: "rogue:lvl10:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "rogue",
        level: 10,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Rogue levels 8, 10, 12, and 16."
      },
      {
        id: "rogue:lvl11:improved-cunning-strike:1",
        name: "Improved Cunning Strike",
        class: "rogue",
        level: 11,
        description: "You can use up to two Cunning Strike effects when you deal Sneak Attack damage, paying the die cost for each effect."
      },
      {
        id: "rogue:lvl12:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "rogue",
        level: 12,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Rogue levels 8, 10, 12, and 16."
      },
      {
        id: "rogue:lvl13:subclass-feature:1",
        name: "Subclass feature",
        class: "rogue",
        level: 13
      },
      {
        id: "rogue:lvl14:devious-strikes:1",
        name: "Devious Strikes",
        class: "rogue",
        level: 14,
        description: "Youve practiced new ways to use your Sneak Attack deviously. The following effects are now among your Cunning Strike options.\n\nDaze (Cost: 2d6). The target must succeed on a Constitution saving throw, or on its next turn, it can do only one of the following: move or take an action or a Bonus Action.\n\nKnock Out (Cost: 6d6). The target must succeed on a Constitution saving throw, or it has the Unconscious condition for 1 minute or until it takes any damage. The Unconscious target repeats the save at the end of each of its turns, ending the effect on itself on a success.\n\nObscure (Cost: 3d6). The target must succeed on a Dexterity saving throw, or it has the Blinded condition until the end of its next turn."
      },
      {
        id: "rogue:lvl15:slippery-mind:1",
        name: "Slippery Mind",
        class: "rogue",
        level: 15,
        description: "Your cunning mind is exceptionally difficult to control. You gain proficiency in Wisdom and Charisma saving throws."
      },
      {
        id: "rogue:lvl16:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "rogue",
        level: 16,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Rogue levels 8, 10, 12, and 16."
      },
      {
        id: "rogue:lvl17:subclass-feature:1",
        name: "Subclass feature",
        class: "rogue",
        level: 17
      },
      {
        id: "rogue:lvl18:elusive:1",
        name: "Elusive",
        class: "rogue",
        level: 18,
        description: "Youre so evasive that attackers rarely gain the upper hand against you. No attack roll can have Advantage against you unless you have the Incapacitated condition."
      },
      {
        id: "rogue:lvl19:epic-boon:1",
        name: "Epic Boon",
        class: "rogue",
        level: 19,
        description: "You gain an Epic Boon feat (see Feats) or another feat of your choice for which you qualify. Boon of the Night Spirit is recommended."
      },
      {
        id: "rogue:lvl20:stroke-of-luck:1",
        name: "Stroke of Luck",
        class: "rogue",
        level: 20,
        description: "You have a marvelous knack for succeeding when you need to. If you fail a D20 Test, you can turn the roll into a 20.\n\nOnce you use this feature, you cant use it again until you finish a Short or Long Rest."
      }
    ],
    subclasses: [
      {
        id: "rogue:thief",
        name: "Thief",
        classId: "rogue",
        unlockLevel: 3,
        source: "D&D Free Rules 2024",
        features: [
          {
            id: "rogue:thief:lvl3:fast-hands",
            name: "Fast Hands",
            class: "rogue",
            level: 3,
            subclassId: "rogue:thief",
            subclassName: "Thief",
            description: "As a Bonus Action, you can do one of the following.\n\nSleight of Hand. Make a Dexterity (Sleight of Hand) check to pick a lock or disarm a trap with Thieves Tools or to pick a pocket.\n\nUse an Object. Take the Utilize action, or take the Magic action to use a magic item that requires that action."
          },
          {
            id: "rogue:thief:lvl3:second-story-work",
            name: "Second-Story Work",
            class: "rogue",
            level: 3,
            subclassId: "rogue:thief",
            subclassName: "Thief",
            description: "Youve trained to get into especially hard-to-reach places, granting you these benefits.\n\nClimber. You gain a Climb Speed equal to your Speed.\n\nJumper. You can determine your jump distance using your Dexterity rather than your Strength."
          },
          {
            id: "rogue:thief:lvl9:supreme-sneak",
            name: "Supreme Sneak",
            class: "rogue",
            level: 9,
            subclassId: "rogue:thief",
            subclassName: "Thief",
            description: "You gain the following Cunning Strike option.\n\nStealth Attack (Cost: 1d6). If you have the Hide actions Invisible condition, this attack doesnt end that condition on you if you end the turn behind Three-Quarters Cover or Total Cover."
          },
          {
            id: "rogue:thief:lvl13:use-magic-device",
            name: "Use Magic Device",
            class: "rogue",
            level: 13,
            subclassId: "rogue:thief",
            subclassName: "Thief",
            description: "Youve learned how to maximize use of magic items, granting you the following benefits.\n\nAttunement. You can attune to up to four magic items at once.\n\nCharges. Whenever you use a magic item property that expends charges, roll 1d6. On a roll of 6, you use the property without expending the charges.\n\nScrolls. You can use any Spell Scroll, using Intelligence as your spellcasting ability for the spell. If the spell is a cantrip or a level 1 spell, you can cast it reliably. If the scroll contains a higher-level spell, you must first succeed on an Intelligence (Arcana) check (DC 10 plus the spells level). On a successful check, you cast the spell from the scroll. On a failed check, the scroll disintegrates."
          },
          {
            id: "rogue:thief:lvl17:thief-s-reflexes",
            name: "Thiefs Reflexes",
            class: "rogue",
            level: 17,
            subclassId: "rogue:thief",
            subclassName: "Thief",
            description: "You are adept at laying ambushes and quickly escaping danger. You can take two turns during the first round of any combat. You take your first turn at your normal Initiative and your second turn at your Initiative minus 10."
          }
        ]
      }
    ]
  },
  sorcerer: {
    classId: "sorcerer",
    className: "Sorcerer",
    source: "D&D Free Rules 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "sorcerer:lvl1:spellcasting:1",
        name: "Spellcasting",
        class: "sorcerer",
        level: 1,
        description: "Drawing from your innate magic, you can cast spells. See Spells for the rules on spellcasting. The information below details how you use those rules with Sorcerer spells, which appear in the Sorcerer spell list later in the classs description.\n\nCantrips. You know four Sorcerer cantrips of your choice. Light, Prestidigitation, Shocking Grasp, and Sorcerous Burst are recommended. Whenever you gain a Sorcerer level, you can replace one of your cantrips from this feature with another Sorcerer cantrip of your choice.\n\nWhen you reach Sorcerer levels 4 and 10, you learn another Sorcerer cantrip of your choice, as shown in the Cantrips column of the Sorcerer Features table.\n\nSpell Slots. The Sorcerer Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.\n\nPrepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 Sorcerer spells. Burning Hands and Detect Magic are recommended.\n\nThe number of spells on your list increases as you gain Sorcerer levels, as shown in the Prepared Spells column of the Sorcerer Features table. Whenever that number increases, choose additional Sorcerer spells until the number of spells on your list matches the number in the Sorcerer Features table. The chosen spells must be of a level for which you have spell slots. For example, if youre a level 3 Sorcerer, your list of prepared spells can include six Sorcerer spells of level 1 or 2 in any combination.\n\nIf another Sorcerer feature gives you spells that you always have prepared, those spells dont count against the number of spells you can prepare with this feature, but those spells otherwise count as Sorcerer spells for you.\n\nChanging Your Prepared Spells. Whenever you gain a Sorcerer level, you can replace one spell on your list with another Sorcerer spell for which you have spell slots.\n\nSpellcasting Ability. Charisma is your spellcasting ability for your Sorcerer spells.\n\nSpellcasting Focus. You can use an Arcane Focus as a Spellcasting Focus for your Sorcerer spells."
      },
      {
        id: "sorcerer:lvl1:innate-sorcery:2",
        name: "Innate Sorcery",
        class: "sorcerer",
        level: 1,
        description: "An event in your past left an indelible mark on you, infusing you with simmering magic. As a Bonus Action, you can unleash that magic for 1 minute, during which you gain the following benefits:\n\nYou can use this feature twice, and you regain all expended uses of it when you finish a Long Rest."
      },
      {
        id: "sorcerer:lvl2:font-of-magic:1",
        name: "Font of Magic",
        class: "sorcerer",
        level: 2,
        description: "You can tap into the wellspring of magic within yourself. This wellspring is represented by Sorcery Points, which allow you to create a variety of magical effects.\n\nYou have 2 Sorcery Points, and you gain more as you reach higher levels, as shown in the Sorcery Points column of the Sorcerer Features table. You cant have more Sorcery Points than the number shown in the table for your level. You regain all expended Sorcery Points when you finish a Long Rest.\n\nYou can use your Sorcery Points to fuel the options below, along with other features, such as Metamagic, that use those points.\n\nConverting Spell Slots to Sorcery Points. You can expend a spell slot to gain a number of Sorcery Points equal to the slots level (no action required).\n\nCreating Spell Slots. As a Bonus Action, you can transform unexpended Sorcery Points into one spell slot. The Creating Spell Slots table shows the cost of creating a spell slot of a given level, and it lists the minimum Sorcerer level you must be to create a slot. You can create a spell slot no higher than level 5.\n\nAny spell slot you create with this feature vanishes when you finish a Long Rest."
      },
      {
        id: "sorcerer:lvl2:metamagic:2",
        name: "Metamagic",
        class: "sorcerer",
        level: 2,
        description: "Because your magic flows from within, you can alter your spells to suit your needs; you gain two Metamagic options of your choice from Metamagic Options later in this classs description. You use the chosen options to temporarily modify spells you cast. To use an option, you must spend the number of Sorcery Points that it costs.\n\nYou can use only one Metamagic option on a spell when you cast it unless otherwise noted in one of those options.\n\nWhenever you gain a Sorcerer level, you can replace one of your Metamagic options with one you dont know. You gain two more options at Sorcerer level 10 and two more at Sorcerer level 17."
      },
      {
        id: "sorcerer:lvl3:sorcerer-subclass:1",
        name: "Sorcerer Subclass",
        class: "sorcerer",
        level: 3,
        description: "You gain a Sorcerer subclass of your choice. The Draconic Sorcery subclass is detailed after this classs description. A subclass is a specialization that grants you features at certain Sorcerer levels. For the rest of your career, you gain each of your subclasss features that are of your Sorcerer level or lower."
      },
      {
        id: "sorcerer:lvl4:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "sorcerer",
        level: 4,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Sorcerer levels 8, 12, and 16."
      },
      {
        id: "sorcerer:lvl5:sorcerous-restoration:1",
        name: "Sorcerous Restoration",
        class: "sorcerer",
        level: 5,
        description: "When you finish a Short Rest, you can regain expended Sorcery Points, but no more than a number equal to half your Sorcerer level (round down). Once you use this feature, you cant do so again until you finish a Long Rest."
      },
      {
        id: "sorcerer:lvl6:subclass-feature:1",
        name: "Subclass feature",
        class: "sorcerer",
        level: 6
      },
      {
        id: "sorcerer:lvl7:sorcery-incarnate:1",
        name: "Sorcery Incarnate",
        class: "sorcerer",
        level: 7,
        description: "If you have no uses of Innate Sorcery left, you can use it if you spend 2 Sorcery Points when you take the Bonus Action to activate it.\n\nIn addition, while your Innate Sorcery feature is active, you can use up to two of your Metamagic options on each spell you cast."
      },
      {
        id: "sorcerer:lvl8:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "sorcerer",
        level: 8,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Sorcerer levels 8, 12, and 16."
      },
      {
        id: "sorcerer:lvl9:feature:1",
        name: "",
        class: "sorcerer",
        level: 9
      },
      {
        id: "sorcerer:lvl10:metamagic:1",
        name: "Metamagic",
        class: "sorcerer",
        level: 10,
        description: "Because your magic flows from within, you can alter your spells to suit your needs; you gain two Metamagic options of your choice from Metamagic Options later in this classs description. You use the chosen options to temporarily modify spells you cast. To use an option, you must spend the number of Sorcery Points that it costs.\n\nYou can use only one Metamagic option on a spell when you cast it unless otherwise noted in one of those options.\n\nWhenever you gain a Sorcerer level, you can replace one of your Metamagic options with one you dont know. You gain two more options at Sorcerer level 10 and two more at Sorcerer level 17."
      },
      {
        id: "sorcerer:lvl11:feature:1",
        name: "",
        class: "sorcerer",
        level: 11
      },
      {
        id: "sorcerer:lvl12:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "sorcerer",
        level: 12,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Sorcerer levels 8, 12, and 16."
      },
      {
        id: "sorcerer:lvl13:feature:1",
        name: "",
        class: "sorcerer",
        level: 13
      },
      {
        id: "sorcerer:lvl14:subclass-feature:1",
        name: "Subclass feature",
        class: "sorcerer",
        level: 14
      },
      {
        id: "sorcerer:lvl15:feature:1",
        name: "",
        class: "sorcerer",
        level: 15
      },
      {
        id: "sorcerer:lvl16:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "sorcerer",
        level: 16,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Sorcerer levels 8, 12, and 16."
      },
      {
        id: "sorcerer:lvl17:metamagic:1",
        name: "Metamagic",
        class: "sorcerer",
        level: 17,
        description: "Because your magic flows from within, you can alter your spells to suit your needs; you gain two Metamagic options of your choice from Metamagic Options later in this classs description. You use the chosen options to temporarily modify spells you cast. To use an option, you must spend the number of Sorcery Points that it costs.\n\nYou can use only one Metamagic option on a spell when you cast it unless otherwise noted in one of those options.\n\nWhenever you gain a Sorcerer level, you can replace one of your Metamagic options with one you dont know. You gain two more options at Sorcerer level 10 and two more at Sorcerer level 17."
      },
      {
        id: "sorcerer:lvl18:subclass-feature:1",
        name: "Subclass feature",
        class: "sorcerer",
        level: 18
      },
      {
        id: "sorcerer:lvl19:epic-boon:1",
        name: "Epic Boon",
        class: "sorcerer",
        level: 19,
        description: "You gain an Epic Boon feat (see Feats) or another feat of your choice for which you qualify. Boon of Dimensional Travel is recommended."
      },
      {
        id: "sorcerer:lvl20:arcane-apotheosis:1",
        name: "Arcane Apotheosis",
        class: "sorcerer",
        level: 20
      }
    ],
    subclasses: [
      {
        id: "sorcerer:draconic-sorcery",
        name: "Draconic Sorcery",
        classId: "sorcerer",
        unlockLevel: 3,
        source: "D&D Free Rules 2024",
        features: [
          {
            id: "sorcerer:draconic-sorcery:lvl3:draconic-resilience",
            name: "Draconic Resilience",
            class: "sorcerer",
            level: 3,
            subclassId: "sorcerer:draconic-sorcery",
            subclassName: "Draconic Sorcery",
            description: "The magic in your body manifests physical traits of your draconic gift. Your Hit Point maximum increases by 3, and it increases by 1 whenever you gain another Sorcerer level.\n\nParts of you are also covered by dragon-like scales. While you arent wearing armor, your base Armor Class equals 10 plus your Dexterity and Charisma modifiers."
          },
          {
            id: "sorcerer:draconic-sorcery:lvl3:draconic-spells",
            name: "Draconic Spells",
            class: "sorcerer",
            level: 3,
            subclassId: "sorcerer:draconic-sorcery",
            subclassName: "Draconic Sorcery",
            description: "When you reach a Sorcerer level specified in the Draconic Spells table, you thereafter always have the listed spells prepared."
          },
          {
            id: "sorcerer:draconic-sorcery:lvl6:elemental-affinity",
            name: "Elemental Affinity",
            class: "sorcerer",
            level: 6,
            subclassId: "sorcerer:draconic-sorcery",
            subclassName: "Draconic Sorcery",
            description: "Your draconic magic has an affinity with a damage type associated with dragons. Choose one of those types: Acid, Cold, Fire, Lightning, or Poison.\n\nYou have Resistance to that damage type, and when you cast a spell that deals damage of that type, you can add your Charisma modifier to one damage roll of that spell."
          },
          {
            id: "sorcerer:draconic-sorcery:lvl14:dragon-wings",
            name: "Dragon Wings",
            class: "sorcerer",
            level: 14,
            subclassId: "sorcerer:draconic-sorcery",
            subclassName: "Draconic Sorcery",
            description: "As a Bonus Action, you can cause draconic wings to appear on your back. The wings last for 1 hour or until you dismiss them (no action required). For the duration, you have a Fly Speed of 60 feet.\n\nOnce you use this feature, you cant use it again until you finish a Long Rest unless you spend 3 Sorcery Points (no action required) to restore your use of it."
          },
          {
            id: "sorcerer:draconic-sorcery:lvl18:dragon-companion",
            name: "Dragon Companion",
            class: "sorcerer",
            level: 18,
            subclassId: "sorcerer:draconic-sorcery",
            subclassName: "Draconic Sorcery",
            description: "You can cast Summon Dragon without a Material component. You can also cast it once without a spell slot, and you regain the ability to cast it in this way when you finish a Long Rest.\n\nWhenever you start casting the spell, you can modify it so that it doesnt require Concentration. If you do so, the spells duration becomes 1 minute for that casting."
          }
        ]
      }
    ]
  },
  warlock: {
    classId: "warlock",
    className: "Warlock",
    source: "D&D Free Rules 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "warlock:lvl1:eldritch-invocations:1",
        name: "Eldritch Invocations",
        class: "warlock",
        level: 1,
        description: "You have unearthed Eldritch Invocations, pieces of forbidden knowledge that imbue you with an abiding magical ability or other lessons. You gain one invocation of your choice, such as Pact of the Tome. Invocations are described in the Eldritch Invocation Options section later in this classs description.\n\nPrerequisites. If an invocation has a prerequisite, you must meet it to learn that invocation. For example, if an invocation requires you to be a level 5+ Warlock, you can select the invocation once you reach Warlock level 5.\n\nReplacing and Gaining Invocations. Whenever you gain a Warlock level, you can replace one of your invocations with another one for which you qualify. You cant replace an invocation if its a prerequisite for another invocation that you have.\n\nWhen you gain certain Warlock levels, you gain more invocations of your choice, as shown in the Invocations column of the Warlock Features table.\n\nYou cant pick the same invocation more than once unless its description says otherwise."
      },
      {
        id: "warlock:lvl1:pact-magic:2",
        name: "Pact Magic",
        class: "warlock",
        level: 1,
        description: "Through occult ceremony, you have formed a pact with a mysterious entity to gain magical powers. The entity is a voice in the shadowsits identity unclearbut its boon to you is concrete: the ability to cast spells. See Spells for the rules on spellcasting. The information below details how you use those rules with Warlock spells, which appear in the Warlock spell list later in the classs description.\n\nCantrips. You know two Warlock cantrips of your choice. Eldritch Blast and Prestidigitation are recommended. Whenever you gain a Warlock level, you can replace one of your cantrips from this feature with another Warlock cantrip of your choice.\n\nWhen you reach Warlock levels 4 and 10, you learn another Warlock cantrip of your choice, as shown in the Cantrips column of the Warlock Features table.\n\nSpell Slots. The Warlock Features table shows how many spell slots you have to cast your Warlock spells of levels 15. The table also shows the level of those slots, all of which are the same level. You regain all expended Pact Magic spell slots when you finish a Short or Long Rest.\n\nFor example, when youre a level 5 Warlock, you have two level 3 spell slots. To cast the level 1 spell Witch Bolt, you must spend one of those slots, and you cast it as a level 3 spell.\n\nPrepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 Warlock spells. Charm Person and Hex are recommended.\n\nThe number of spells on your list increases as you gain Warlock levels, as shown in the Prepared Spells column of the Warlock Features table. Whenever that number increases, choose additional Warlock spells until the number of spells on your list matches the number in the table. The chosen spells must be of a level no higher than whats shown in the tables Slot Level column for your level. When you reach level 6, for example, you learn a new Warlock spell, which can be of levels 13.\n\nIf another Warlock feature gives you spells that you always have prepared, those spells dont count against the number of spells you can prepare with this feature, but those spells otherwise count as Warlock spells for you.\n\nChanging Your Prepared Spells. Whenever you gain a Warlock level, you can replace one spell on your list with another Warlock spell of an eligible level.\n\nSpellcasting Ability. Charisma is the spellcasting ability for your Warlock spells.\n\nSpellcasting Focus. You can use an Arcane Focus as a Spellcasting Focus for your Warlock spells."
      },
      {
        id: "warlock:lvl2:magical-cunning:1",
        name: "Magical Cunning",
        class: "warlock",
        level: 2,
        description: "You can perform an esoteric rite for 1 minute. At the end of it, you regain expended Pact Magic spell slots but no more than a number equal to half your maximum (round up). Once you use this feature, you cant do so again until you finish a Long Rest."
      },
      {
        id: "warlock:lvl3:warlock-subclass:1",
        name: "Warlock Subclass",
        class: "warlock",
        level: 3,
        description: "You gain a Warlock subclass of your choice. The Fiend Patron subclass is detailed after this classs description. A subclass is a specialization that grants you features at certain Warlock levels. For the rest of your career, you gain each of your subclasss features that are of your Warlock level or lower."
      },
      {
        id: "warlock:lvl4:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "warlock",
        level: 4,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Warlock levels 8, 12, and 16."
      },
      {
        id: "warlock:lvl5:feature:1",
        name: "",
        class: "warlock",
        level: 5
      },
      {
        id: "warlock:lvl6:subclass-feature:1",
        name: "Subclass feature",
        class: "warlock",
        level: 6
      },
      {
        id: "warlock:lvl7:feature:1",
        name: "",
        class: "warlock",
        level: 7
      },
      {
        id: "warlock:lvl8:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "warlock",
        level: 8,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Warlock levels 8, 12, and 16."
      },
      {
        id: "warlock:lvl9:contact-patron:1",
        name: "Contact Patron",
        class: "warlock",
        level: 9,
        description: "In the past, you usually contacted your patron through intermediaries. Now you can communicate directly; you always have the Contact Other Plane spell prepared. With this feature, you can cast the spell without expending a spell slot to contact your patron, and you automatically succeed on the spells saving throw.\n\nOnce you cast the spell with this feature, you cant do so in this way again until you finish a Long Rest."
      },
      {
        id: "warlock:lvl10:subclass-feature:1",
        name: "Subclass feature",
        class: "warlock",
        level: 10
      },
      {
        id: "warlock:lvl11:mystic-arcanum-level-6-spell:1",
        name: "Mystic Arcanum (level 6 spell)",
        class: "warlock",
        level: 11
      },
      {
        id: "warlock:lvl12:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "warlock",
        level: 12,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Warlock levels 8, 12, and 16."
      },
      {
        id: "warlock:lvl13:mystic-arcanum-level-7-spell:1",
        name: "Mystic Arcanum (level 7 spell)",
        class: "warlock",
        level: 13
      },
      {
        id: "warlock:lvl14:subclass-feature:1",
        name: "Subclass feature",
        class: "warlock",
        level: 14
      },
      {
        id: "warlock:lvl15:mystic-arcanum-level-8-spell:1",
        name: "Mystic Arcanum (level 8 spell)",
        class: "warlock",
        level: 15
      },
      {
        id: "warlock:lvl16:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "warlock",
        level: 16,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Warlock levels 8, 12, and 16."
      },
      {
        id: "warlock:lvl17:mystic-arcanum-level-9-spell:1",
        name: "Mystic Arcanum (level 9 spell)",
        class: "warlock",
        level: 17
      },
      {
        id: "warlock:lvl18:feature:1",
        name: "",
        class: "warlock",
        level: 18
      },
      {
        id: "warlock:lvl19:epic-boon:1",
        name: "Epic Boon",
        class: "warlock",
        level: 19,
        description: "You gain an Epic Boon feat (see Feats) or another feat of your choice for which you qualify. Boon of Fate is recommended."
      },
      {
        id: "warlock:lvl20:eldritch-master:1",
        name: "Eldritch Master",
        class: "warlock",
        level: 20,
        description: "When you use your Magical Cunning feature, you regain all your expended Pact Magic spell slots."
      }
    ],
    subclasses: [
      {
        id: "warlock:fiend-patron",
        name: "Fiend Patron",
        classId: "warlock",
        unlockLevel: 3,
        source: "D&D Free Rules 2024",
        features: [
          {
            id: "warlock:fiend-patron:lvl3:dark-one-s-blessing",
            name: "Dark Ones Blessing",
            class: "warlock",
            level: 3,
            subclassId: "warlock:fiend-patron",
            subclassName: "Fiend Patron",
            description: "When you reduce an enemy to 0 Hit Points, you gain Temporary Hit Points equal to your Charisma modifier plus your Warlock level (minimum of 1 Temporary Hit Point). You also gain this benefit if someone else reduces an enemy within 10 feet of you to 0 Hit Points."
          },
          {
            id: "warlock:fiend-patron:lvl3:fiend-spells",
            name: "Fiend Spells",
            class: "warlock",
            level: 3,
            subclassId: "warlock:fiend-patron",
            subclassName: "Fiend Patron",
            description: "The magic of your patron ensures you always have certain spells ready; when you reach a Warlock level specified in the Fiend Spells table, you thereafter always have the listed spells prepared."
          },
          {
            id: "warlock:fiend-patron:lvl6:dark-one-s-own-luck",
            name: "Dark Ones Own Luck",
            class: "warlock",
            level: 6,
            subclassId: "warlock:fiend-patron",
            subclassName: "Fiend Patron",
            description: "You can call on your fiendish patron to alter fate in your favor. When you make an ability check or a saving throw, you can use this feature to add 1d10 to your roll. You can do so after seeing the roll but before any of the rolls effects occur.\n\nYou can use this feature a number of times equal to your Charisma modifier (minimum of once), but you can use it no more than once per roll. You regain all expended uses when you finish a Long Rest."
          },
          {
            id: "warlock:fiend-patron:lvl10:fiendish-resilience",
            name: "Fiendish Resilience",
            class: "warlock",
            level: 10,
            subclassId: "warlock:fiend-patron",
            subclassName: "Fiend Patron",
            description: "Choose one damage type, other than Force, whenever you finish a Short or Long Rest. You have Resistance to that damage type until you choose a different one with this feature."
          },
          {
            id: "warlock:fiend-patron:lvl14:hurl-through-hell",
            name: "Hurl Through Hell",
            class: "warlock",
            level: 14,
            subclassId: "warlock:fiend-patron",
            subclassName: "Fiend Patron",
            description: "Once per turn when you hit a creature with an attack roll, you can try to instantly transport the target through the Lower Planes. The target must succeed on a Charisma saving throw against your spell save DC, or the target disappears and hurtles through a nightmare landscape. The target takes 8d10 Psychic damage if it isnt a Fiend, and it has the Incapacitated condition until the end of your next turn, when it returns to the space it previously occupied or the nearest unoccupied space.\n\nOnce you use this feature, you cant use it again until you finish a Long Rest unless you expend a Pact Magic spell slot (no action required) to restore your use of it."
          }
        ]
      }
    ]
  },
  wizard: {
    classId: "wizard",
    className: "Wizard",
    source: "D&D Free Rules 2024",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "wizard:lvl1:spellcasting:1",
        name: "Spellcasting",
        class: "wizard",
        level: 1,
        description: "As a student of arcane magic, you have learned to cast spells. See Spells for the rules on spellcasting. The information below details how you use those rules with Wizard spells, which appear in the Wizard spell list later in the classs description.\n\nCantrips. You know three Wizard cantrips of your choice. Light, Mage Hand, and Ray of Frost are recommended. Whenever you finish a Long Rest, you can replace one of your cantrips from this feature with another Wizard cantrip of your choice.\n\nWhen you reach Wizard levels 4 and 10, you learn another Wizard cantrip of your choice, as shown in the Cantrips column of the Wizard Features table.\n\nSpellbook. Your wizardly apprenticeship culminated in the creation of a unique book: your spellbook. It is a Tiny object that weighs 3 pounds, contains 100 pages, and can be read only by you or someone casting Identify. You determine the books appearance and materials, such as a gilt-edged tome or a collection of vellum bound with twine.\n\nThe book contains the level 1+ spells you know. It starts with six level 1 Wizard spells of your choice. Detect Magic, Feather Fall, Mage Armor, Magic Missile, Sleep, and Thunderwave are recommended.\n\nWhenever you gain a Wizard level after 1, add two Wizard spells of your choice to your spellbook. Each of these spells must be of a level for which you have spell slots, as shown in the Wizard Features table. The spells are the culmination of arcane research you do regularly.\n\nSpell Slots. The Wizard Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.\n\nPrepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To do so, choose four spells from your spellbook. The chosen spells must be of a level for which you have spell slots.\n\nThe number of spells on your list increases as you gain Wizard levels, as shown in the Prepared Spells column of the Wizard Features table. Whenever that number increases, choose additional Wizard spells until the number of spells on your list matches the number in the table. The chosen spells must be of a level for which you have spell slots. For example, if youre a level 3 Wizard, your list of prepared spells can include six spells of levels 1 and 2 in any combination, chosen from your spellbook.\n\nIf another Wizard feature gives you spells that you always have prepared, those spells dont count against the number of spells you can prepare with this feature, but those spells otherwise count as Wizard spells for you.\n\nChanging Your Prepared Spells. Whenever you finish a Long Rest, you can change your list of prepared spells, replacing any of the spells there with spells from your spellbook.\n\nSpellcasting Ability. Intelligence is your spellcasting ability for your Wizard spells.\n\nSpellcasting Focus. You can use an Arcane Focus or your spellbook as a Spellcasting Focus for your Wizard spells.\n\nExpanding and Replacing a Spellbook\n\nThe spells you add to your spellbook as you gain levels reflect your ongoing magical research, but you might find other spells during your adventures that you can add to the book. You could discover a Wizard spell on a Spell Scroll, for example, and then copy it into your spellbook.\n\nCopying a Spell into the Book. When you find a level 1+ Wizard spell, you can copy it into your spellbook if its of a level you can prepare and if you have time to copy it. For each level of the spell, the transcription takes 2 hours and costs 50 GP. Afterward you can prepare the spell like the other spells in your spellbook.\n\nCopying the Book. You can copy a spell from your spellbook into another book. This is like copying a new spell into your spellbook but faster, since you already know how to cast the spell. You need spend only 1 hour and 10 GP for each level of the copied spell.\n\nIf you lose your spellbook, you can use the same procedure to transcribe the Wizard spells that you have prepared into a new spellbook. Filling out the remainder of the new book requires you to find new spells to do so. For this reason, many wizards keep a backup spellbook."
      },
      {
        id: "wizard:lvl1:ritual-adept:2",
        name: "Ritual Adept",
        class: "wizard",
        level: 1,
        description: "You can cast any spell as a Ritual if that spell has the Ritual tag and the spell is in your spellbook. You neednt have the spell prepared, but you must read from the book to cast a spell in this way."
      },
      {
        id: "wizard:lvl1:arcane-recovery:3",
        name: "Arcane Recovery",
        class: "wizard",
        level: 1,
        description: "You can regain some of your magical energy by studying your spellbook. When you finish a Short Rest, you can choose expended spell slots to recover. The spell slots can have a combined level equal to no more than half your Wizard level (round up), and none of the slots can be level 6 or higher. For example, if youre a level 4 Wizard, you can recover up to two levels worth of spell slots, regaining either one level 2 spell slot or two level 1 spell slots.\n\nOnce you use this feature, you cant do so again until you finish a Long Rest."
      },
      {
        id: "wizard:lvl2:scholar:1",
        name: "Scholar",
        class: "wizard",
        level: 2,
        description: "While studying magic, you also specialized in another field of study. Choose one of the following skills in which you have proficiency: Arcana, History, Investigation, Medicine, Nature, or Religion. You have Expertise in the chosen skill."
      },
      {
        id: "wizard:lvl3:wizard-subclass:1",
        name: "Wizard Subclass",
        class: "wizard",
        level: 3,
        description: "You gain a Wizard subclass of your choice. The Evoker subclass is detailed after this classs description. A subclass is a specialization that grants you features at certain Wizard levels. For the rest of your career, you gain each of your subclasss features that are of your Wizard level or lower."
      },
      {
        id: "wizard:lvl4:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "wizard",
        level: 4,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Wizard levels 8, 12, and 16."
      },
      {
        id: "wizard:lvl5:memorize-spell:1",
        name: "Memorize Spell",
        class: "wizard",
        level: 5,
        description: "Whenever you finish a Short Rest, you can study your spellbook and replace one of the level 1+ Wizard spells you have prepared for your Spellcasting feature with another level 1+ spell from the book."
      },
      {
        id: "wizard:lvl6:subclass-feature:1",
        name: "Subclass feature",
        class: "wizard",
        level: 6
      },
      {
        id: "wizard:lvl7:feature:1",
        name: "",
        class: "wizard",
        level: 7
      },
      {
        id: "wizard:lvl8:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "wizard",
        level: 8,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Wizard levels 8, 12, and 16."
      },
      {
        id: "wizard:lvl9:feature:1",
        name: "",
        class: "wizard",
        level: 9
      },
      {
        id: "wizard:lvl10:subclass-feature:1",
        name: "Subclass feature",
        class: "wizard",
        level: 10
      },
      {
        id: "wizard:lvl11:feature:1",
        name: "",
        class: "wizard",
        level: 11
      },
      {
        id: "wizard:lvl12:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "wizard",
        level: 12,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Wizard levels 8, 12, and 16."
      },
      {
        id: "wizard:lvl13:feature:1",
        name: "",
        class: "wizard",
        level: 13
      },
      {
        id: "wizard:lvl14:subclass-feature:1",
        name: "Subclass feature",
        class: "wizard",
        level: 14
      },
      {
        id: "wizard:lvl15:feature:1",
        name: "",
        class: "wizard",
        level: 15
      },
      {
        id: "wizard:lvl16:ability-score-improvement:1",
        name: "Ability Score Improvement",
        class: "wizard",
        level: 16,
        description: "You gain the Ability Score Improvement feat (see Feats) or another feat of your choice for which you qualify. You gain this feature again at Wizard levels 8, 12, and 16."
      },
      {
        id: "wizard:lvl17:feature:1",
        name: "",
        class: "wizard",
        level: 17
      },
      {
        id: "wizard:lvl18:spell-mastery:1",
        name: "Spell Mastery",
        class: "wizard",
        level: 18,
        description: "You have achieved such mastery over certain spells that you can cast them at will. Choose a level 1 and a level 2 spell in your spellbook that have a casting time of an action. You always have those spells prepared, and you can cast them at their lowest level without expending a spell slot. To cast either spell at a higher level, you must expend a spell slot.\n\nWhenever you finish a Long Rest, you can study your spellbook and replace one of those spells with an eligible spell of the same level from the book."
      },
      {
        id: "wizard:lvl19:epic-boon:1",
        name: "Epic Boon",
        class: "wizard",
        level: 19,
        description: "You gain an Epic Boon feat (see Feats) or another feat of your choice for which you qualify. Boon of Spell Recall is recommended."
      },
      {
        id: "wizard:lvl20:signature-spells:1",
        name: "Signature Spells",
        class: "wizard",
        level: 20,
        description: "Choose two level 3 spells in your spellbook as your signature spells. You always have these spells prepared, and you can cast each of them once at level 3 without expending a spell slot. When you do so, you cant cast them in this way again until you finish a Short or Long Rest. To cast either spell at a higher level, you must expend a spell slot."
      }
    ],
    subclasses: [
      {
        id: "wizard:evoker",
        name: "Evoker",
        classId: "wizard",
        unlockLevel: 3,
        source: "D&D Free Rules 2024",
        features: [
          {
            id: "wizard:evoker:lvl3:evocation-savant",
            name: "Evocation Savant",
            class: "wizard",
            level: 3,
            subclassId: "wizard:evoker",
            subclassName: "Evoker",
            description: "Choose two Wizard spells from the Evocation school, each of which must be no higher than level 2, and add them to your spellbook for free.\n\nIn addition, whenever you gain access to a new level of spell slots in this class, you can add one Wizard spell from the Evocation school to your spellbook for free. The chosen spell must be of a level for which you have spell slots."
          },
          {
            id: "wizard:evoker:lvl3:potent-cantrip",
            name: "Potent Cantrip",
            class: "wizard",
            level: 3,
            subclassId: "wizard:evoker",
            subclassName: "Evoker",
            description: "Your damaging cantrips affect even creatures that avoid the brunt of the effect. When you cast a cantrip at a creature and you miss with the attack roll or the target succeeds on a saving throw against the cantrip, the target takes half the cantrips damage (if any) but suffers no additional effect from the cantrip."
          },
          {
            id: "wizard:evoker:lvl6:sculpt-spells",
            name: "Sculpt Spells",
            class: "wizard",
            level: 6,
            subclassId: "wizard:evoker",
            subclassName: "Evoker",
            description: "You can create pockets of relative safety within the effects of your evocations. When you cast an Evocation spell that affects other creatures that you can see, you can choose a number of them equal to 1 plus the spells level. The chosen creatures automatically succeed on their saving throws against the spell, and they take no damage if they would normally take half damage on a successful save."
          },
          {
            id: "wizard:evoker:lvl10:empowered-evocation",
            name: "Empowered Evocation",
            class: "wizard",
            level: 10,
            subclassId: "wizard:evoker",
            subclassName: "Evoker",
            description: "Whenever you cast a Wizard spell from the Evocation school, you can add your Intelligence modifier to one damage roll of that spell."
          },
          {
            id: "wizard:evoker:lvl14:overchannel",
            name: "Overchannel",
            class: "wizard",
            level: 14,
            subclassId: "wizard:evoker",
            subclassName: "Evoker",
            description: "You can increase the power of your spells. When you cast a Wizard spell with a spell slot of levels 15 that deals damage, you can deal maximum damage with that spell on the turn you cast it.\n\nThe first time you do so, you suffer no adverse effect. If you use this feature again before you finish a Long Rest, you take 2d12 Necrotic damage for each level of the spell slot immediately after you cast it. This damage ignores Resistance and Immunity.\n\nEach time you use this feature again before finishing a Long Rest, the Necrotic damage per spell level increases by 1d12.\n\n//"
          }
        ]
      }
    ]
  },
  artificer: {
    classId: "artificer",
    className: "Artificer",
    source: "5e Artificer integration",
    subclassUnlockLevel: 3,
    classFeatures: [
      {
        id: "artificer:lvl1:magical-tinkering",
        name: "Magical Tinkering",
        class: "artificer",
        level: 1,
        description:
          "You can touch a Tiny nonmagical object and give it one minor magical effect (light, recorded message, odor/sound, or a static visual effect). You can maintain several active effects at once and refresh them after rests."
      },
      {
        id: "artificer:lvl1:spellcasting",
        name: "Spellcasting",
        class: "artificer",
        level: 1,
        description:
          "You cast spells using Intelligence as your spellcasting ability. Artificers prepare spells from the Artificer list and can use thieves' tools or artisan's tools as a spellcasting focus."
      },
      {
        id: "artificer:lvl2:infuse-item",
        name: "Infuse Item",
        class: "artificer",
        level: 2,
        description:
          "You learn magical infusions and can turn nonmagical items into magic items at the end of a Long Rest. The number of active infusions is limited by your level."
      },
      {
        id: "artificer:lvl3:right-tool-for-the-job",
        name: "The Right Tool for the Job",
        class: "artificer",
        level: 3,
        description:
          "With tinker's tools, you can create one set of artisan's tools in an hour if you have the necessary metal."
      },
      {
        id: "artificer:lvl3:artificer-specialist",
        name: "Artificer Subclass",
        class: "artificer",
        level: 3,
        description:
          "Choose an Artificer Specialist: Alchemist, Armorer, Artillerist, or Battle Smith. Your specialist grants extra features at levels 3, 5, 9, and 15."
      },
      {
        id: "artificer:lvl4:asi",
        name: "Ability Score Improvement",
        class: "artificer",
        level: 4,
        description:
          "Increase one ability score by 2, or increase two ability scores by 1 each, or take a feat if feats are allowed."
      },
      {
        id: "artificer:lvl5:specialist-feature",
        name: "Artificer Specialist Feature",
        class: "artificer",
        level: 5,
        description: "You gain your specialist's level 5 feature."
      },
      {
        id: "artificer:lvl6:tool-expertise",
        name: "Tool Expertise",
        class: "artificer",
        level: 6,
        description:
          "Your proficiency bonus is doubled for ability checks made with any tool proficiency you have."
      },
      {
        id: "artificer:lvl7:flash-of-genius",
        name: "Flash of Genius",
        class: "artificer",
        level: 7,
        description:
          "When you or a creature you can see within 30 feet makes an ability check or saving throw, you can use your reaction to add your Intelligence modifier. Uses per Long Rest equal your Intelligence modifier (minimum 1)."
      },
      {
        id: "artificer:lvl8:asi",
        name: "Ability Score Improvement",
        class: "artificer",
        level: 8,
        description:
          "Increase one ability score by 2, or increase two ability scores by 1 each, or take a feat if feats are allowed."
      },
      {
        id: "artificer:lvl9:specialist-feature",
        name: "Artificer Specialist Feature",
        class: "artificer",
        level: 9,
        description: "You gain your specialist's level 9 feature."
      },
      {
        id: "artificer:lvl10:magic-item-adept",
        name: "Magic Item Adept",
        class: "artificer",
        level: 10,
        description:
          "Attuning to magic items becomes easier for you: you can attune up to 4 items at once, and crafting common or uncommon magic items is faster and cheaper."
      },
      {
        id: "artificer:lvl11:spell-storing-item",
        name: "Spell-Storing Item",
        class: "artificer",
        level: 11,
        description:
          "Store a 1st- or 2nd-level Artificer spell in an object and let a creature use an action to cast it several times."
      },
      {
        id: "artificer:lvl12:asi",
        name: "Ability Score Improvement",
        class: "artificer",
        level: 12,
        description:
          "Increase one ability score by 2, or increase two ability scores by 1 each, or take a feat if feats are allowed."
      },
      {
        id: "artificer:lvl14:magic-item-savant",
        name: "Magic Item Savant",
        class: "artificer",
        level: 14,
        description:
          "You can attune up to 5 magic items, and you ignore class, race, spell, and level requirements on attunement."
      },
      {
        id: "artificer:lvl15:specialist-feature",
        name: "Artificer Specialist Feature",
        class: "artificer",
        level: 15,
        description: "You gain your specialist's level 15 feature."
      },
      {
        id: "artificer:lvl16:asi",
        name: "Ability Score Improvement",
        class: "artificer",
        level: 16,
        description:
          "Increase one ability score by 2, or increase two ability scores by 1 each, or take a feat if feats are allowed."
      },
      {
        id: "artificer:lvl18:magic-item-master",
        name: "Magic Item Master",
        class: "artificer",
        level: 18,
        description:
          "You can attune up to 6 magic items at once."
      },
      {
        id: "artificer:lvl19:asi",
        name: "Ability Score Improvement",
        class: "artificer",
        level: 19,
        description:
          "Increase one ability score by 2, or increase two ability scores by 1 each, or take a feat if feats are allowed."
      },
      {
        id: "artificer:lvl20:soul-of-artifice",
        name: "Soul of Artifice",
        class: "artificer",
        level: 20,
        description:
          "You gain +1 to all saving throws for each magic item you are attuned to, and you can use your reaction to end one infusion instead of dropping to 0 hit points."
      }
    ],
    subclasses: [
      {
        id: "artificer:alchemist",
        name: "Alchemist",
        classId: "artificer",
        unlockLevel: 3,
        source: "5e Artificer integration",
        features: [
          {
            id: "artificer:alchemist:lvl3:tool-proficiency",
            name: "Tool Proficiency",
            class: "artificer",
            level: 3,
            subclassId: "artificer:alchemist",
            subclassName: "Alchemist",
            description:
              "You gain proficiency with alchemist's supplies."
          },
          {
            id: "artificer:alchemist:lvl3:alchemist-spells",
            name: "Alchemist Spells",
            class: "artificer",
            level: 3,
            subclassId: "artificer:alchemist",
            subclassName: "Alchemist",
            description:
              "You always have extra spells prepared from your specialist list at Artificer levels 3, 5, 9, 13, and 17."
          },
          {
            id: "artificer:alchemist:lvl3:experimental-elixir",
            name: "Experimental Elixir",
            class: "artificer",
            level: 3,
            subclassId: "artificer:alchemist",
            subclassName: "Alchemist",
            description:
              "At the end of a Long Rest you create a random magical elixir; you can also spend spell slots to create specific elixirs."
          },
          {
            id: "artificer:alchemist:lvl5:alchemical-savant",
            name: "Alchemical Savant",
            class: "artificer",
            level: 5,
            subclassId: "artificer:alchemist",
            subclassName: "Alchemist",
            description:
              "When casting a spell with alchemist's supplies as focus, add your Intelligence modifier to one healing or damage roll of listed spell types."
          },
          {
            id: "artificer:alchemist:lvl9:restorative-reagents",
            name: "Restorative Reagents",
            class: "artificer",
            level: 9,
            subclassId: "artificer:alchemist",
            subclassName: "Alchemist",
            description:
              "You gain temporary hit points when creatures drink your elixirs, and you can cast Lesser Restoration without expending a spell slot a limited number of times."
          },
          {
            id: "artificer:alchemist:lvl15:chemical-mastery",
            name: "Chemical Mastery",
            class: "artificer",
            level: 15,
            subclassId: "artificer:alchemist",
            subclassName: "Alchemist",
            description:
              "You gain resistance to acid and poison damage and immunity to the poisoned condition, and you can cast Greater Restoration and Heal with this feature."
          }
        ]
      },
      {
        id: "artificer:armorer",
        name: "Armorer",
        classId: "artificer",
        unlockLevel: 3,
        source: "5e Artificer integration",
        features: [
          {
            id: "artificer:armorer:lvl3:tools-of-the-trade",
            name: "Tools of the Trade",
            class: "artificer",
            level: 3,
            subclassId: "artificer:armorer",
            subclassName: "Armorer",
            description:
              "You gain proficiency with heavy armor and smith's tools."
          },
          {
            id: "artificer:armorer:lvl3:armorer-spells",
            name: "Armorer Spells",
            class: "artificer",
            level: 3,
            subclassId: "artificer:armorer",
            subclassName: "Armorer",
            description:
              "You always have extra Armorer spells prepared at specialist milestones."
          },
          {
            id: "artificer:armorer:lvl3:arcane-armor",
            name: "Arcane Armor",
            class: "artificer",
            level: 3,
            subclassId: "artificer:armorer",
            subclassName: "Armorer",
            description:
              "Your armor becomes your arcane focus and can be donned or removed more efficiently. It replaces missing limbs and cannot be removed against your will."
          },
          {
            id: "artificer:armorer:lvl3:armor-model",
            name: "Armor Model",
            class: "artificer",
            level: 3,
            subclassId: "artificer:armorer",
            subclassName: "Armorer",
            description:
              "Choose Guardian or Infiltrator model, each granting built-in weapons and different combat benefits."
          },
          {
            id: "artificer:armorer:lvl5:extra-attack",
            name: "Extra Attack",
            class: "artificer",
            level: 5,
            subclassId: "artificer:armorer",
            subclassName: "Armorer",
            description:
              "You can attack twice, instead of once, whenever you take the Attack action."
          },
          {
            id: "artificer:armorer:lvl9:armor-modifications",
            name: "Armor Modifications",
            class: "artificer",
            level: 9,
            subclassId: "artificer:armorer",
            subclassName: "Armorer",
            description:
              "Your Arcane Armor counts as separate items (armor, boots, helm, special weapon), allowing additional infusions."
          },
          {
            id: "artificer:armorer:lvl15:perfected-armor",
            name: "Perfected Armor",
            class: "artificer",
            level: 15,
            subclassId: "artificer:armorer",
            subclassName: "Armorer",
            description:
              "Your Guardian and Infiltrator models gain stronger control and mobility effects."
          }
        ]
      },
      {
        id: "artificer:artillerist",
        name: "Artillerist",
        classId: "artificer",
        unlockLevel: 3,
        source: "5e Artificer integration",
        features: [
          {
            id: "artificer:artillerist:lvl3:tool-proficiency",
            name: "Tool Proficiency",
            class: "artificer",
            level: 3,
            subclassId: "artificer:artillerist",
            subclassName: "Artillerist",
            description:
              "You gain proficiency with woodcarver's tools."
          },
          {
            id: "artificer:artillerist:lvl3:artillerist-spells",
            name: "Artillerist Spells",
            class: "artificer",
            level: 3,
            subclassId: "artificer:artillerist",
            subclassName: "Artillerist",
            description:
              "You always have extra Artillerist spells prepared at specialist milestones."
          },
          {
            id: "artificer:artillerist:lvl3:eldritch-cannon",
            name: "Eldritch Cannon",
            class: "artificer",
            level: 3,
            subclassId: "artificer:artillerist",
            subclassName: "Artillerist",
            description:
              "Create a magical cannon (Flamethrower, Force Ballista, or Protector) that can be commanded as a bonus action."
          },
          {
            id: "artificer:artillerist:lvl5:arcane-firearm",
            name: "Arcane Firearm",
            class: "artificer",
            level: 5,
            subclassId: "artificer:artillerist",
            subclassName: "Artillerist",
            description:
              "Turn a wand, staff, or rod into an Arcane Firearm and add extra damage to one Artificer spell damage roll."
          },
          {
            id: "artificer:artillerist:lvl9:explosive-cannon",
            name: "Explosive Cannon",
            class: "artificer",
            level: 9,
            subclassId: "artificer:artillerist",
            subclassName: "Artillerist",
            description:
              "Your cannons deal more damage and can be detonated to create an area explosion."
          },
          {
            id: "artificer:artillerist:lvl15:fortified-position",
            name: "Fortified Position",
            class: "artificer",
            level: 15,
            subclassId: "artificer:artillerist",
            subclassName: "Artillerist",
            description:
              "You and allies near your cannon gain improved protection, and you can control two cannons at once."
          }
        ]
      },
      {
        id: "artificer:battle-smith",
        name: "Battle Smith",
        classId: "artificer",
        unlockLevel: 3,
        source: "5e Artificer integration",
        features: [
          {
            id: "artificer:battle-smith:lvl3:tool-proficiency",
            name: "Tool Proficiency",
            class: "artificer",
            level: 3,
            subclassId: "artificer:battle-smith",
            subclassName: "Battle Smith",
            description:
              "You gain proficiency with smith's tools."
          },
          {
            id: "artificer:battle-smith:lvl3:battle-smith-spells",
            name: "Battle Smith Spells",
            class: "artificer",
            level: 3,
            subclassId: "artificer:battle-smith",
            subclassName: "Battle Smith",
            description:
              "You always have extra Battle Smith spells prepared at specialist milestones."
          },
          {
            id: "artificer:battle-smith:lvl3:battle-ready",
            name: "Battle Ready",
            class: "artificer",
            level: 3,
            subclassId: "artificer:battle-smith",
            subclassName: "Battle Smith",
            description:
              "You gain martial weapon proficiency and can use Intelligence for attack and damage rolls with magic weapons."
          },
          {
            id: "artificer:battle-smith:lvl3:steel-defender",
            name: "Steel Defender",
            class: "artificer",
            level: 3,
            subclassId: "artificer:battle-smith",
            subclassName: "Battle Smith",
            description:
              "You build a Steel Defender companion that acts in combat and can protect allies with its reaction."
          },
          {
            id: "artificer:battle-smith:lvl5:extra-attack",
            name: "Extra Attack",
            class: "artificer",
            level: 5,
            subclassId: "artificer:battle-smith",
            subclassName: "Battle Smith",
            description:
              "You can attack twice, instead of once, whenever you take the Attack action."
          },
          {
            id: "artificer:battle-smith:lvl9:arcane-jolt",
            name: "Arcane Jolt",
            class: "artificer",
            level: 9,
            subclassId: "artificer:battle-smith",
            subclassName: "Battle Smith",
            description:
              "When you or your Steel Defender hits a target, you can deal extra force damage or restore hit points to a nearby creature."
          },
          {
            id: "artificer:battle-smith:lvl15:improved-defender",
            name: "Improved Defender",
            class: "artificer",
            level: 15,
            subclassId: "artificer:battle-smith",
            subclassName: "Battle Smith",
            description:
              "Your Steel Defender gains stronger damage and durability, and its Deflect Attack reaction improves."
          }
        ]
      }
    ]
  }
};
