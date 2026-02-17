import { getSpellSlotsFor } from "@/lib/spellSlots";

export type ArtificerLocale = "en" | "es";

type SpellClassRef = {
    index: string;
    name: string;
    url: string;
};

type SpellRecordLike = {
    index?: string;
    name?: string;
    classes?: SpellClassRef[];
    [key: string]: unknown;
};

type DatasetLike<T extends { index?: string }> = {
    total: number;
    results: T[];
    byIndex: Record<string, T>;
};

type LearnableSpellRef = {
    index: string;
    name: string;
    url: string;
};

type ArtificerSpellEntry = {
    index: string;
    name: string;
    level: number;
};

type FallbackSpellText = {
    en: {
        short: string;
        full: string;
    };
    es: {
        short: string;
        full: string;
    };
};

const ARTIFICER_CLASS_REF = {
    index: "artificer",
    url: "/api/classes/artificer",
};

const ARTIFICER_SPELLS_BY_LEVEL: Record<number, ArtificerSpellEntry[]> = {
    0: [
        { index: "acid-splash", name: "Acid Splash", level: 0 },
        { index: "create-bonfire", name: "Create Bonfire", level: 0 },
        { index: "fire-bolt", name: "Fire Bolt", level: 0 },
        { index: "frostbite", name: "Frostbite", level: 0 },
        { index: "guidance", name: "Guidance", level: 0 },
        { index: "light", name: "Light", level: 0 },
        { index: "mage-hand", name: "Mage Hand", level: 0 },
        { index: "magic-stone", name: "Magic Stone", level: 0 },
        { index: "mending", name: "Mending", level: 0 },
        { index: "message", name: "Message", level: 0 },
        { index: "poison-spray", name: "Poison Spray", level: 0 },
        { index: "prestidigitation", name: "Prestidigitation", level: 0 },
        { index: "ray-of-frost", name: "Ray of Frost", level: 0 },
        { index: "resistance", name: "Resistance", level: 0 },
        { index: "shocking-grasp", name: "Shocking Grasp", level: 0 },
        { index: "spare-the-dying", name: "Spare the Dying", level: 0 },
        { index: "thorn-whip", name: "Thorn Whip", level: 0 },
    ],
    1: [
        { index: "absorb-elements", name: "Absorb Elements", level: 1 },
        { index: "alarm", name: "Alarm", level: 1 },
        { index: "catapult", name: "Catapult", level: 1 },
        { index: "cure-wounds", name: "Cure Wounds", level: 1 },
        { index: "detect-magic", name: "Detect Magic", level: 1 },
        { index: "disguise-self", name: "Disguise Self", level: 1 },
        { index: "expeditious-retreat", name: "Expeditious Retreat", level: 1 },
        { index: "faerie-fire", name: "Faerie Fire", level: 1 },
        { index: "false-life", name: "False Life", level: 1 },
        { index: "feather-fall", name: "Feather Fall", level: 1 },
        { index: "grease", name: "Grease", level: 1 },
        { index: "identify", name: "Identify", level: 1 },
        { index: "jump", name: "Jump", level: 1 },
        { index: "longstrider", name: "Longstrider", level: 1 },
        {
            index: "purify-food-and-drink",
            name: "Purify Food and Drink",
            level: 1,
        },
        { index: "sanctuary", name: "Sanctuary", level: 1 },
        { index: "snare", name: "Snare", level: 1 },
        {
            index: "tashas-caustic-brew",
            name: "Tasha's Caustic Brew",
            level: 1,
        },
    ],
    2: [
        { index: "aid", name: "Aid", level: 2 },
        { index: "alter-self", name: "Alter Self", level: 2 },
        { index: "arcane-lock", name: "Arcane Lock", level: 2 },
        { index: "blur", name: "Blur", level: 2 },
        { index: "continual-flame", name: "Continual Flame", level: 2 },
        { index: "darkvision", name: "Darkvision", level: 2 },
        { index: "enhance-ability", name: "Enhance Ability", level: 2 },
        { index: "enlarge-reduce", name: "Enlarge/Reduce", level: 2 },
        { index: "heat-metal", name: "Heat Metal", level: 2 },
        { index: "invisibility", name: "Invisibility", level: 2 },
        { index: "lesser-restoration", name: "Lesser Restoration", level: 2 },
        { index: "levitate", name: "Levitate", level: 2 },
        { index: "magic-mouth", name: "Magic Mouth", level: 2 },
        { index: "magic-weapon", name: "Magic Weapon", level: 2 },
        {
            index: "protection-from-poison",
            name: "Protection from Poison",
            level: 2,
        },
        { index: "pyrotechnics", name: "Pyrotechnics", level: 2 },
        { index: "rope-trick", name: "Rope Trick", level: 2 },
        {
            index: "see-invisibility",
            name: "See Invisibility",
            level: 2,
        },
        { index: "skywrite", name: "Skywrite", level: 2 },
        { index: "spider-climb", name: "Spider Climb", level: 2 },
        { index: "web", name: "Web", level: 2 },
    ],
    3: [
        { index: "blink", name: "Blink", level: 3 },
        { index: "catnap", name: "Catnap", level: 3 },
        {
            index: "create-food-and-water",
            name: "Create Food and Water",
            level: 3,
        },
        { index: "dispel-magic", name: "Dispel Magic", level: 3 },
        { index: "elemental-weapon", name: "Elemental Weapon", level: 3 },
        { index: "flame-arrows", name: "Flame Arrows", level: 3 },
        { index: "fly", name: "Fly", level: 3 },
        { index: "glyph-of-warding", name: "Glyph of Warding", level: 3 },
        { index: "haste", name: "Haste", level: 3 },
        {
            index: "intellect-fortress",
            name: "Intellect Fortress",
            level: 3,
        },
        {
            index: "protection-from-energy",
            name: "Protection from Energy",
            level: 3,
        },
        { index: "revivify", name: "Revivify", level: 3 },
        { index: "tiny-servant", name: "Tiny Servant", level: 3 },
        { index: "water-breathing", name: "Water Breathing", level: 3 },
        { index: "water-walk", name: "Water Walk", level: 3 },
    ],
    4: [
        { index: "arcane-eye", name: "Arcane Eye", level: 4 },
        { index: "fabricate", name: "Fabricate", level: 4 },
        { index: "fire-shield", name: "Fire Shield", level: 4 },
        {
            index: "freedom-of-movement",
            name: "Freedom of Movement",
            level: 4,
        },
        {
            index: "leomunds-secret-chest",
            name: "Leomund's Secret Chest",
            level: 4,
        },
        {
            index: "mordenkainens-faithful-hound",
            name: "Mordenkainen's Faithful Hound",
            level: 4,
        },
        {
            index: "otilukes-resilient-sphere",
            name: "Otiluke's Resilient Sphere",
            level: 4,
        },
        { index: "stone-shape", name: "Stone Shape", level: 4 },
        { index: "summon-construct", name: "Summon Construct", level: 4 },
    ],
    5: [
        { index: "animate-objects", name: "Animate Objects", level: 5 },
        { index: "bigbys-hand", name: "Bigby's Hand", level: 5 },
        { index: "creation", name: "Creation", level: 5 },
        {
            index: "greater-restoration",
            name: "Greater Restoration",
            level: 5,
        },
        {
            index: "skill-empowerment",
            name: "Skill Empowerment",
            level: 5,
        },
        { index: "transmute-rock", name: "Transmute Rock", level: 5 },
        { index: "wall-of-stone", name: "Wall of Stone", level: 5 },
    ],
};

const ARTIFICER_SPELL_INDEX_SET = new Set(
    Object.values(ARTIFICER_SPELLS_BY_LEVEL)
        .flat()
        .map((entry) => entry.index)
);

const ARTIFICER_FALLBACK_SPELL_TEXT: Record<string, FallbackSpellText> = {
    "create-bonfire": {
        en: {
            short: "Create a magical bonfire on the ground that burns creatures entering or ending their turn in it.",
            full: "You create a bonfire in a 5-foot cube on ground you can see. Creatures in the fire take fire damage on a failed Dexterity save when it appears, enters their space, or ends their turn there.",
        },
        es: {
            short: "Creas una hoguera magica en el suelo que quema a las criaturas que entran o terminan su turno dentro.",
            full: "Creas una hoguera en un cubo de 5 pies en un punto del suelo que puedas ver. Una criatura sufre dano de fuego con una tirada de Destreza fallida cuando aparece, entra o termina su turno ahi.",
        },
    },
    frostbite: {
        en: {
            short: "A numbing cold attacks a creature, dealing cold damage and hindering its next weapon strike.",
            full: "A creature you can see must make a Constitution save. On a failure, it takes cold damage and has disadvantage on the next weapon attack roll it makes before the end of its next turn.",
        },
        es: {
            short: "Un frio entumecedor ataca a una criatura, causa dano de frio y dificulta su siguiente ataque con arma.",
            full: "Una criatura que puedas ver debe superar una salvacion de Constitucion. Si falla, sufre dano de frio y tiene desventaja en su siguiente tirada de ataque con arma antes del final de su proximo turno.",
        },
    },
    "magic-stone": {
        en: {
            short: "You imbue pebbles with magic so they can be hurled for spell-powered bludgeoning damage.",
            full: "You touch up to three pebbles and imbue them with magic. A creature can throw one or sling it as a ranged spell attack that deals magical bludgeoning damage on a hit.",
        },
        es: {
            short: "Imbuyes guijarros con magia para lanzarlos y causar dano contundente magico.",
            full: "Tocas hasta tres guijarros y los cargas con magia. Una criatura puede lanzarlos o dispararlos con honda como ataque de conjuro a distancia que causa dano contundente magico al impactar.",
        },
    },
    "thorn-whip": {
        en: {
            short: "A vine-like whip lashes a target, dealing piercing damage and pulling it closer.",
            full: "Make a melee spell attack against a creature in range. On a hit, the target takes piercing damage and can be pulled up to 10 feet closer to you.",
        },
        es: {
            short: "Un latigo de espinas golpea a un objetivo, causa dano perforante y lo arrastra.",
            full: "Haz un ataque de conjuro cuerpo a cuerpo contra una criatura en alcance. Si impacta, el objetivo sufre dano perforante y puedes arrastrarlo hasta 10 pies hacia ti.",
        },
    },
    "absorb-elements": {
        en: {
            short: "As a reaction, you absorb incoming elemental energy, gaining resistance and empowering your next melee strike.",
            full: "When you take acid, cold, fire, lightning, or thunder damage, you can use your reaction to gain resistance to that instance of damage. Your next melee attack adds extra damage of the absorbed type.",
        },
        es: {
            short: "Como reaccion, absorbes energia elemental entrante, ganas resistencia y potencias tu siguiente golpe cuerpo a cuerpo.",
            full: "Cuando recibes dano de acido, frio, fuego, rayo o trueno, puedes usar tu reaccion para obtener resistencia ante ese dano. Tu siguiente ataque cuerpo a cuerpo inflige dano extra del tipo absorbido.",
        },
    },
    catapult: {
        en: {
            short: "Hurl an unattended object through the air; creatures struck take heavy bludgeoning damage.",
            full: "Choose one object weighing 1 to 5 pounds and launch it in a line. A creature in its path must make a Dexterity save or take bludgeoning damage from the impact.",
        },
        es: {
            short: "Lanzas un objeto sin sujetar por el aire; las criaturas golpeadas reciben dano contundente alto.",
            full: "Elige un objeto de 1 a 5 libras y disparalo en linea recta. Una criatura en su trayectoria debe superar una salvacion de Destreza o sufre dano contundente por el impacto.",
        },
    },
    snare: {
        en: {
            short: "Set an invisible magical trap on the ground that restrains and suspends the first creature that triggers it.",
            full: "You create a hidden magical snare in a 5-foot radius on the ground. The first creature that triggers it makes a Dexterity save or is hoisted and restrained until released.",
        },
        es: {
            short: "Colocas una trampa magica invisible en el suelo que inmoviliza y eleva a la primera criatura que la active.",
            full: "Creas una trampa magica oculta en un radio de 5 pies sobre el suelo. La primera criatura que la activa hace una salvacion de Destreza o queda elevada e inmovilizada hasta ser liberada.",
        },
    },
    "tashas-caustic-brew": {
        en: {
            short: "A stream of acid coats creatures in a line, burning them repeatedly until cleaned off.",
            full: "You spray acid in a line. Affected creatures take acid damage on a failed Dexterity save and continue taking acid damage at the start of each turn until they use an action to remove the acid.",
        },
        es: {
            short: "Un chorro de acido cubre criaturas en linea y las quema de forma repetida hasta limpiarlo.",
            full: "Rocias acido en linea recta. Las criaturas afectadas reciben dano de acido con una salvacion de Destreza fallida y siguen recibiendolo al inicio de cada turno hasta usar una accion para limpiarse.",
        },
    },
    pyrotechnics: {
        en: {
            short: "Transform an existing flame into blinding fireworks or an obscuring smoke cloud.",
            full: "Choose a nonmagical flame in range and convert it into either dazzling fireworks or thick smoke. Fireworks can blind nearby creatures; smoke creates heavy obscurity.",
        },
        es: {
            short: "Transforma una llama existente en fuegos artificiales cegadores o una nube de humo.",
            full: "Elige una llama no magica en alcance y conviertela en fuegos artificiales brillantes o humo denso. Los fuegos pueden cegar y el humo crea ocultacion intensa.",
        },
    },
    skywrite: {
        en: {
            short: "Conjure drifting words in the sky visible from great distance.",
            full: "You form up to ten words in one part of the sky. The message remains for the duration and can be seen clearly from far away.",
        },
        es: {
            short: "Conjuras palabras flotantes en el cielo visibles desde gran distancia.",
            full: "Formas hasta diez palabras en una zona del cielo. El mensaje permanece durante la duracion y puede verse claramente desde muy lejos.",
        },
    },
    catnap: {
        en: {
            short: "Up to three willing creatures take a brief magical nap and gain the benefits of a short rest.",
            full: "Willing creatures of your choice fall unconscious for 10 minutes and cannot be awakened by noise. After the duration, they gain the benefits of a short rest.",
        },
        es: {
            short: "Hasta tres criaturas voluntarias toman una siesta magica breve y obtienen descanso corto.",
            full: "Criaturas voluntarias elegidas quedan inconscientes 10 minutos y no despiertan por ruido. Al terminar, obtienen los beneficios de un descanso corto.",
        },
    },
    "elemental-weapon": {
        en: {
            short: "Imbue a weapon with elemental power, increasing attack potency and adding elemental damage.",
            full: "A nonmagical weapon becomes a magic weapon and gains a bonus to attack rolls. Hits also deal extra acid, cold, fire, lightning, or thunder damage.",
        },
        es: {
            short: "Imbuyes un arma con poder elemental, aumentando su precision y dano elemental.",
            full: "Un arma no magica se vuelve magica y gana bonificador a tiradas de ataque. Sus impactos tambien infligen dano adicional de acido, frio, fuego, rayo o trueno.",
        },
    },
    "flame-arrows": {
        en: {
            short: "Enchant ammunition so each shot deals extra fire damage on hit.",
            full: "You touch quiver ammunition and enchant a number of pieces. A fired piece deals extra fire damage to the target on a hit, then loses the enchantment.",
        },
        es: {
            short: "Encantas municion para que cada disparo cause dano extra de fuego al impactar.",
            full: "Tocas municion de un carcaj y encantas varias piezas. Una pieza disparada inflige dano extra de fuego al objetivo si impacta y despues pierde el encantamiento.",
        },
    },
    "intellect-fortress": {
        en: {
            short: "Create a psychic ward that grants mental resilience and psychic damage resistance.",
            full: "A creature you can see gains resistance to psychic damage and advantage on Intelligence, Wisdom, and Charisma saving throws for the duration.",
        },
        es: {
            short: "Creas una defensa psiquica que otorga resistencia mental y al dano psiquico.",
            full: "Una criatura que puedas ver obtiene resistencia al dano psiquico y ventaja en salvaciones de Inteligencia, Sabiduria y Carisma durante la duracion.",
        },
    },
    "tiny-servant": {
        en: {
            short: "Animate a Tiny object into a simple servant that follows commands.",
            full: "You animate a Tiny nonmagical object into a servant creature. It acts on your initiative, obeys verbal commands, and lasts for the spell duration.",
        },
        es: {
            short: "Animas un objeto diminuto en un sirviente simple que sigue ordenes.",
            full: "Animas un objeto no magico diminuto para convertirlo en criatura sirviente. Actua en tu iniciativa, obedece ordenes verbales y dura hasta el fin del conjuro.",
        },
    },
    "leomunds-secret-chest": {
        en: {
            short: "Hide a chest on the Ethereal Plane and summon it back with its miniature replica.",
            full: "You hide a large chest and its contents on the Ethereal Plane while retaining a tiny replica. You can use the replica to call the chest back temporarily.",
        },
        es: {
            short: "Ocultas un cofre en el Plano Etereo y lo recuperas con su replica miniatura.",
            full: "Ocultas un cofre grande con su contenido en el Plano Etereo mientras conservas una replica pequena. Con la replica puedes traer de vuelta el cofre temporalmente.",
        },
    },
    "mordenkainens-faithful-hound": {
        en: {
            short: "Conjure an invisible guard hound that watches an area and bites hostile creatures.",
            full: "You create an invisible watchdog at a point in range. It barks at hidden creatures and damages hostile targets that come close.",
        },
        es: {
            short: "Conjuras un sabueso guardia invisible que vigila un area y muerde a criaturas hostiles.",
            full: "Creas un perro guardian invisible en un punto de alcance. Ladra a criaturas ocultas y dana a objetivos hostiles que se acerquen.",
        },
    },
    "otilukes-resilient-sphere": {
        en: {
            short: "Trap a creature or object in a durable sphere of force.",
            full: "A creature you choose is enclosed in a shimmering sphere of force on a failed Dexterity save. The sphere blocks physical effects and can be moved by external force.",
        },
        es: {
            short: "Atrapas una criatura u objeto dentro de una esfera de fuerza resistente.",
            full: "Una criatura elegida queda encerrada en una esfera de fuerza con una salvacion de Destreza fallida. La esfera bloquea efectos fisicos y puede moverse con fuerza externa.",
        },
    },
    "summon-construct": {
        en: {
            short: "Summon a construct spirit that fights on your side.",
            full: "You call a construct spirit that takes a chosen form and obeys your commands. It acts in combat with stats based on spell level.",
        },
        es: {
            short: "Invocas un espiritu constructo que combate a tu lado.",
            full: "Llamas a un espiritu constructo que toma una forma elegida y obedece tus ordenes. Actua en combate con estadisticas escaladas por nivel de conjuro.",
        },
    },
    "bigbys-hand": {
        en: {
            short: "Create a powerful magical hand that can strike, shove, grapple, or shield.",
            full: "You conjure a Large hand of force that appears in range and can be commanded each turn to perform different combat functions such as attack, interpose, or grasp.",
        },
        es: {
            short: "Creas una mano magica poderosa que puede golpear, empujar, agarrar o proteger.",
            full: "Conjuras una mano de fuerza grande que aparece en alcance y puede recibir ordenes cada turno para distintas funciones de combate como atacar, interponerse o sujetar.",
        },
    },
    "skill-empowerment": {
        en: {
            short: "Grant a creature expertise in one proficient skill for the duration.",
            full: "You empower one willing creature and choose one skill in which it is proficient. It doubles its proficiency bonus for ability checks made with that skill.",
        },
        es: {
            short: "Otorgas a una criatura pericia en una habilidad en la que ya sea competente.",
            full: "Potencias a una criatura voluntaria y eliges una habilidad en la que sea competente. Duplica su bonificador por competencia en pruebas de esa habilidad.",
        },
    },
    "transmute-rock": {
        en: {
            short: "Turn rock into mud or mud into rock across a large area, hindering movement or trapping creatures.",
            full: "You reshape terrain in a cube area, converting stone to thick mud or mud to hard stone. The effect can restrain creatures and alter movement dramatically.",
        },
        es: {
            short: "Transformas roca en barro o barro en roca en un area amplia, dificultando movimiento o atrapando criaturas.",
            full: "Remodelas el terreno en un gran cubo, convirtiendo piedra en barro espeso o barro en roca dura. El efecto puede inmovilizar criaturas y cambiar mucho el desplazamiento.",
        },
    },
};

function getFallbackSpellText(
    index: string,
    locale: ArtificerLocale,
    spellName: string
) {
    const fallback = ARTIFICER_FALLBACK_SPELL_TEXT[index];
    if (!fallback) {
        return {
            short:
                locale === "es"
                    ? `${spellName}: conjuro del artificiero disponible en esta lista local.`
                    : `${spellName}: artificer spell available in this local list.`,
            full:
                locale === "es"
                    ? `Este conjuro (${spellName}) se incluye para completar la compatibilidad del artificiero y su lista local de conjuros.`
                    : `This spell (${spellName}) is included to complete artificer compatibility in the local spell list.`,
        };
    }
    return locale === "es" ? fallback.es : fallback.en;
}

function buildSpellNameFromIndex(index: string): string {
    return index
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function getArtificerClassName(locale: ArtificerLocale): string {
    return locale === "es" ? "Artificiero" : "Artificer";
}

function getMaxArtificerSpellLevel(level: number): number {
    const slots = getSpellSlotsFor("artificer", level);
    if (!slots) return 0;
    if ("slots" in (slots as any)) {
        return Number((slots as any).slotLevel ?? 0);
    }
    return Object.entries(slots as Record<number, number>).reduce(
        (maxLevel, [spellLevel, amount]) => {
            const lvl = Number(spellLevel);
            if (Number(amount) <= 0) return maxLevel;
            return Math.max(maxLevel, lvl);
        },
        0
    );
}

function getArtificerLearnableSpellRefsForLevel(
    level: number,
    spellByIndex?: Record<string, { name?: string }>
): LearnableSpellRef[] {
    const maxLevel = getMaxArtificerSpellLevel(level);
    if (maxLevel <= 0) return [];

    const refs: LearnableSpellRef[] = [];
    for (let spellLevel = 0; spellLevel <= maxLevel; spellLevel += 1) {
        const entries = ARTIFICER_SPELLS_BY_LEVEL[spellLevel] ?? [];
        for (const entry of entries) {
            const index = entry.index;
            refs.push({
                index,
                name:
                    spellByIndex?.[index]?.name ??
                    entry.name ??
                    buildSpellNameFromIndex(index),
                url: `/api/spells/${index}`,
            });
        }
    }

    return refs;
}

function buildArtificerClassLearningRecord(
    locale: ArtificerLocale,
    spellByIndex?: Record<string, { name?: string }>
) {
    const subclasses = [
        {
            index: "artificer:alchemist",
            name: locale === "es" ? "Alquimista" : "Alchemist",
            url: "/api/subclasses/artificer:alchemist",
        },
        {
            index: "artificer:armorer",
            name: locale === "es" ? "Armero" : "Armorer",
            url: "/api/subclasses/artificer:armorer",
        },
        {
            index: "artificer:artillerist",
            name: locale === "es" ? "Artillero" : "Artillerist",
            url: "/api/subclasses/artificer:artillerist",
        },
        {
            index: "artificer:battle-smith",
            name: locale === "es" ? "Herrero de Batalla" : "Battle Smith",
            url: "/api/subclasses/artificer:battle-smith",
        },
    ];

    const levels = Array.from({ length: 20 }, (_, offset) => {
        const currentLevel = offset + 1;
        return {
            level: currentLevel,
            ability_score_bonuses: [4, 8, 12, 16, 19].includes(currentLevel) ? 1 : 0,
            prof_bonus: Math.floor((currentLevel - 1) / 4) + 2,
            features: [],
            featureRefs: [],
            spellcasting: null,
            learnableSpells: getArtificerLearnableSpellRefsForLevel(
                currentLevel,
                spellByIndex
            ),
        };
    });

    return {
        index: "artificer",
        name: getArtificerClassName(locale),
        hit_die: 8,
        proficiency_choices: [],
        proficiencies: [],
        saving_throws: [
            {
                index: "con",
                name: locale === "es" ? "Constitucion" : "Constitution",
                url: "/api/ability-scores/con",
            },
            {
                index: "int",
                name: locale === "es" ? "Inteligencia" : "Intelligence",
                url: "/api/ability-scores/int",
            },
        ],
        starting_equipment: [],
        starting_equipment_options: [],
        class_levels: "/api/classes/artificer/levels",
        multi_classing: null,
        subclasses,
        spellcasting: null,
        spells: "/api/classes/artificer/spells",
        url: "/api/classes/artificer",
        levels,
    };
}

export function isArtificerSpellIndex(index: string | null | undefined): boolean {
    if (!index) return false;
    return ARTIFICER_SPELL_INDEX_SET.has(index);
}

export function withArtificerClassTag<T extends SpellRecordLike>(
    spell: T,
    locale: ArtificerLocale
): T {
    const index = String(spell?.index ?? "");
    if (!isArtificerSpellIndex(index)) {
        return spell;
    }

    const classes = Array.isArray(spell.classes) ? [...spell.classes] : [];
    const alreadyTagged = classes.some(
        (entry) => String(entry?.index ?? "").toLowerCase() === "artificer"
    );

    if (!alreadyTagged) {
        classes.push({
            index: ARTIFICER_CLASS_REF.index,
            name: getArtificerClassName(locale),
            url: ARTIFICER_CLASS_REF.url,
        });
    }

    return {
        ...spell,
        classes,
    };
}

export function augmentSpellsDatasetWithArtificer<T extends SpellRecordLike>(
    dataset: DatasetLike<T>,
    locale: ArtificerLocale
): DatasetLike<T> {
    const nextByIndexMap = new Map<string, T>();

    for (const spell of dataset.results) {
        const withTag = withArtificerClassTag(spell, locale);
        const index = String(withTag?.index ?? "");
        if (!index) continue;
        nextByIndexMap.set(index, withTag);
    }

    for (const entry of Object.values(ARTIFICER_SPELLS_BY_LEVEL).flat()) {
        if (nextByIndexMap.has(entry.index)) continue;
        const placeholder = withArtificerClassTag(
            {
                index: entry.index,
                name: entry.name,
                level: entry.level,
                school: null,
                range: null,
                casting_time: null,
                duration: null,
                components: [],
                material: null,
                ritual: false,
                concentration: false,
                attack_type: null,
                damage: null,
                dc: null,
                area_of_effect: null,
                subclasses: [],
                desc: [],
                higher_level: [],
                shortDesc: getFallbackSpellText(entry.index, locale, entry.name).short,
                fullDesc: getFallbackSpellText(entry.index, locale, entry.name).full,
                url: `/api/spells/${entry.index}`,
            } as unknown as T,
            locale
        );
        nextByIndexMap.set(entry.index, placeholder);
    }

    const nextResults = Array.from(nextByIndexMap.values()).sort((a, b) => {
        const levelDiff = Number((a as any)?.level ?? 0) - Number((b as any)?.level ?? 0);
        if (levelDiff !== 0) return levelDiff;
        return String((a as any)?.name ?? "").localeCompare(
            String((b as any)?.name ?? "")
        );
    });

    const nextByIndex = Object.fromEntries(
        nextResults
            .filter((entry) => entry?.index)
            .map((entry) => [String(entry.index), entry])
    ) as Record<string, T>;

    return {
        total: nextResults.length,
        results: nextResults,
        byIndex: nextByIndex,
    };
}

export function augmentClassLearningWithArtificer<T extends { index?: string }>(
    dataset: DatasetLike<T>,
    locale: ArtificerLocale,
    spellByIndex?: Record<string, { name?: string }>
): DatasetLike<T> {
    const artificerRecord = buildArtificerClassLearningRecord(
        locale,
        spellByIndex
    ) as unknown as T;

    const existingIndex = dataset.results.findIndex(
        (entry) => String(entry?.index ?? "") === "artificer"
    );

    const nextResults = [...dataset.results];
    if (existingIndex >= 0) {
        nextResults[existingIndex] = artificerRecord;
    } else {
        nextResults.push(artificerRecord);
    }

    const nextByIndex = Object.fromEntries(
        nextResults
            .filter((entry) => entry?.index)
            .map((entry) => [String(entry.index), entry])
    ) as Record<string, T>;

    return {
        total: nextResults.length,
        results: nextResults,
        byIndex: nextByIndex,
    };
}
