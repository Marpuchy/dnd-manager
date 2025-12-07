// scripts/migrate_characters_parse.js
// Requiere: npm i @supabase/supabase-js
// Uso:
//   export SUPABASE_URL="https://xyz.supabase.co"
//   export SUPABASE_KEY="service-role-key-xxx"   (SERVICE ROLE KEY recomendado para insertar)
//   node scripts/migrate_characters_parse.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("ERROR: Define SUPABASE_URL y SUPABASE_KEY (service role) en variables de entorno.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

function normalizeAbilityKey(k) {
    if (!k) return undefined;
    const s = String(k).trim().toLowerCase();
    if (['str','strength','fue','fuerza'].includes(s)) return 'STR';
    if (['dex','dexterity','des','destreza'].includes(s)) return 'DEX';
    if (['con','constitution','construccion','constitución','constitucion'].includes(s)) return 'CON';
    if (['int','intelligence','inteligencia'].includes(s)) return 'INT';
    if (['wis','wisdom','sab','sabiduria','sabiduría'].includes(s)) return 'WIS';
    if (['cha','charisma','car','carisma'].includes(s)) return 'CHA';
    const up = String(k).toUpperCase();
    if (['STR','DEX','CON','INT','WIS','CHA'].includes(up)) return up;
    return undefined;
}

async function insertWeaponIfNotExists(payload) {
    // evita duplicados básicos por character + name + meta.raw
    try {
        await supabase.from('character_weapons').insert(payload);
    } catch (e) {
        console.error('Insert weapon error', e);
    }
}

async function migratePage(offset = 0, pageSize = 200) {
    const { data: rows, error } = await supabase
        .from('characters')
        .select('*')
        .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!rows || rows.length === 0) return false;

    for (const c of rows) {
        const cid = c.id;

        try {
            // 1) details.weaponEquipped object -> character_weapons
            if (c.details && c.details.weaponEquipped && typeof c.details.weaponEquipped === 'object') {
                const w = c.details.weaponEquipped;
                await supabase.from('character_weapons').insert({
                    character_id: cid,
                    name: w.name || null,
                    damage: w.damage || null,
                    stat_ability: normalizeAbilityKey(w.statAbility || w.ability || null),
                    modifier: Number(w.modifier || w.mod || 0),
                    is_proficient: !!w.isProficient || !!w.proficient || false,
                    description: w.description || null,
                    equipped: true,
                    meta: w
                });
            }

            // 2) characters.weapons (texto) -> parse line by line
            if (c.weapons && typeof c.weapons === 'string') {
                const lines = c.weapons.split('\n').map(l => l.trim()).filter(Boolean);
                for (const line of lines) {
                    let meta = null;
                    let name = line;
                    let damage = null;
                    let stat_ability = null;
                    let modifier = 0;

                    // trailing JSON heuristic
                    const m = line.match(/(\{.*\})\s*$/);
                    if (m) {
                        try {
                            meta = JSON.parse(m[1]);
                            name = line.replace(m[1], '').trim();
                            damage = meta.damage || null;
                            stat_ability = normalizeAbilityKey(meta.statAbility || meta.ability);
                            modifier = Number(meta.modifier || 0);
                        } catch (err) {
                            meta = { raw: line };
                        }
                    } else {
                        // heuristic: "Name - 1d8 + STR"
                        const mm = line.match(/^(.+?)[\-\:]\s*(\d+d\d+.*)$/i);
                        if (mm) {
                            name = mm[1].trim();
                            damage = mm[2].trim();
                        }
                    }

                    await supabase.from('character_weapons').insert({
                        character_id: cid,
                        name,
                        damage,
                        stat_ability,
                        modifier,
                        description: null,
                        equipped: false,
                        meta: meta || { raw: line }
                    });
                }
            }

            // 3) details.weapons array
            if (c.details && Array.isArray(c.details.weapons)) {
                for (const w of c.details.weapons) {
                    await supabase.from('character_weapons').insert({
                        character_id: cid,
                        name: w.name || null,
                        damage: w.damage || null,
                        stat_ability: normalizeAbilityKey(w.statAbility || w.ability || null),
                        modifier: Number(w.modifier || w.mod || 0),
                        is_proficient: !!w.isProficient || !!w.proficient || false,
                        description: w.description || null,
                        equipped: !!w.equipped,
                        meta: w
                    });
                }
            }

            // 4) details.armors array
            if (c.details && Array.isArray(c.details.armors)) {
                for (const a of c.details.armors) {
                    await supabase.from('character_armors').insert({
                        character_id: cid,
                        name: a.name || null,
                        bonus: Number(a.bonus || 0),
                        stat_ability: normalizeAbilityKey(a.statAbility || a.ability || null),
                        stat_modifier: Number(a.statModifier || 0),
                        equipped: !!a.equipped,
                        meta: a
                    });
                }
            }

            // 5) inventory -> character_equipments (simple)
            if (c.inventory && typeof c.inventory === 'string') {
                const lines = c.inventory.split('\n').map(l => l.trim()).filter(Boolean);
                for (const L of lines) {
                    let parsed = null;
                    let name = L;
                    let ability = null;
                    let modifier = 0;
                    const jm = L.match(/(\{.*\})\s*$/);
                    if (jm) {
                        try {
                            parsed = JSON.parse(jm[1]);
                            name = L.replace(jm[1], '').trim();
                            ability = normalizeAbilityKey(parsed.ability || parsed.statAbility);
                            modifier = Number(parsed.modifier || 0);
                        } catch {}
                    }
                    await supabase.from('character_equipments').insert({
                        character_id: cid,
                        name,
                        type: parsed?.type || null,
                        description: parsed?.description || null,
                        ability,
                        modifier,
                        modifiers: parsed?.modifiers || [],
                        equipped: false,
                        meta: parsed || { raw: L }
                    });
                }
            }

        } catch (err) {
            console.error('Error migrating character', cid, err);
        }
    }

    return rows.length === pageSize;
}

(async () => {
    try {
        let cont = true;
        let page = 0;
        while (cont) {
            cont = await migratePage(page * 200, 200);
            page++;
            console.log('Page', page, 'done');
        }
        console.log('Migration finished');
    } catch (err) {
        console.error('Fatal', err);
    }
})();
