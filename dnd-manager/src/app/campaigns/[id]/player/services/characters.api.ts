// src/app/campaigns/[id]/player/services/characters.api.ts
import { supabase } from "@/lib/supabaseClient";
import type { Armor, Weapon, Stats } from "../playerShared";
import { inspectError } from "../utils/inspectError";

/**
 * Upsert character stats (character_stats table)
 */
export async function upsertStats(character_id: string, stats: Stats) {
    const payload = {
        character_id,
        str: Number(stats.str ?? 8),
        dex: Number(stats.dex ?? 8),
        con: Number(stats.con ?? 8),
        int: Number(stats.int ?? 8),
        wis: Number(stats.wis ?? 8),
        cha: Number(stats.cha ?? 8),
        updated_at: new Date().toISOString(),
    };
    return supabase.from("character_stats").upsert(payload, { onConflict: "character_id" });
}

/**
 * Create or update weapon row
 */
export async function createOrUpdateWeapon(character_id: string, weapon: Partial<Weapon>) {
    if (weapon.equipped) {
        const { error: unequipErr } = await supabase.from("character_weapons").update({ equipped: false }).eq("character_id", character_id);
        if (unequipErr) return { data: null, error: unequipErr };
    }

    if (weapon.id) {
        const { data, error } = await supabase.from("character_weapons").update({
            name: weapon.name,
            damage: weapon.damage ?? null,
            stat_ability: weapon.stat_ability ?? null,
            modifier: Number(weapon.modifier ?? 0),
            is_proficient: !!weapon.is_proficient,
            description: weapon.description ?? null,
            equipped: !!weapon.equipped,
        }).eq("id", weapon.id).select("*");
        return { data, error };
    } else {
        const { data, error } = await supabase.from("character_weapons").insert([{
            character_id,
            name: weapon.name,
            damage: weapon.damage ?? null,
            stat_ability: weapon.stat_ability ?? null,
            modifier: Number(weapon.modifier ?? 0),
            is_proficient: !!weapon.is_proficient,
            description: weapon.description ?? null,
            equipped: !!weapon.equipped,
            meta: {}
        }]).select("*");
        return { data, error };
    }
}

/**
 * Create or update armor row
 *
 * Ahora maneja description y modifiers (JSON) en la tabla character_armors.
 * Mantiene la lógica de "unequip" para forzar que sólo una armadura esté equipada.
 */
export async function createOrUpdateArmor(character_id: string, armor: Partial<Armor>) {
    // si viene equipped true, deseleccionamos otras armaduras del personaje
    if (armor.equipped) {
        const { error: unequipErr } = await supabase.from("character_armors").update({ equipped: false }).eq("character_id", character_id);
        if (unequipErr) return { data: null, error: unequipErr };
    }

    // normalizar campos que pueden venir con nombres distintos (legacy)
    const statAbility = (armor as any).stat_ability ?? (armor as any).ability ?? null;
    const statModifier = Number((armor as any).stat_modifier ?? (armor as any).statModifier ?? 0);
    const description =
        (armor as any).description ??
        (armor as any).desc ??
        (armor as any).text ??
        (armor as any).info ??
        (armor as any).notes ??
        null;
    const modifiers = Array.isArray((armor as any).modifiers) ? (armor as any).modifiers : null;

    try {
        if (armor.id) {
            // UPDATE
            const { data, error } = await supabase
                .from("character_armors")
                .update({
                    name: armor.name,
                    bonus: Number(armor.bonus ?? 0),
                    stat_ability: statAbility ?? null,
                    stat_modifier: statModifier,
                    equipped: !!armor.equipped,
                    description: description ?? null,
                    modifiers: modifiers ?? null,
                })
                .eq("id", armor.id)
                .select("*");

            if (error) {
                console.error("Error updating character_armors:", inspectError(error), { character_id, armor });
            }
            return { data, error };
        } else {
            // INSERT
            const { data, error } = await supabase
                .from("character_armors")
                .insert([{
                    character_id,
                    name: armor.name,
                    bonus: Number(armor.bonus ?? 0),
                    stat_ability: statAbility ?? null,
                    stat_modifier: statModifier,
                    equipped: !!armor.equipped,
                    description: description ?? null,
                    modifiers: modifiers ?? null,
                    meta: {}
                }])
                .select("*");

            if (error) {
                console.error("Error inserting into character_armors:", inspectError(error), { character_id, armor });
            }
            return { data, error };
        }
    } catch (err) {
        console.error("Exception in createOrUpdateArmor:", err, { character_id, armor });
        return { data: null, error: err };
    }
}

/**
 * Deterministic create/update of characters table.
 */
export async function createOrUpdateCharacterRow(
    character_id: string | null,
    user_id: string | null,
    campaign_id_resolved: string | null,
    basePayload: Record<string, any>
) {
    if (!campaign_id_resolved) {
        const msg = "No se ha resuelto campaign_id en createOrUpdateCharacterRow: abortando.";
        console.error(msg, { character_id, user_id, campaign_id_resolved });
        return { data: null, error: new Error(msg) };
    }

    try {
        if (character_id) {
            const { data, error } = await supabase
                .from("characters")
                .update(basePayload)
                .eq("id", character_id)
                .select("id")
                .maybeSingle();

            if (error) {
                console.error("Supabase update error characters:", inspectError(error), { character_id, basePayload });
                return { data: null, error };
            }
            return { data, error: null };
        }

        // INSERT
        const { data: insertData, error: insertErr } = await supabase
            .from("characters")
            .insert([basePayload])
            .select("id")
            .maybeSingle();

        if (insertErr) {
            console.error("Supabase insert error characters:", inspectError(insertErr), { basePayload });
            return { data: null, error: insertErr };
        }

        if (insertData && (insertData as any).id) {
            return { data: insertData, error: null };
        }

        // FALLBACK select in case insert didn't return id (RLS)
        const { data: found, error: findErr } = await supabase
            .from("characters")
            .select("id, created_at")
            .eq("campaign_id", campaign_id_resolved)
            .eq("user_id", user_id ?? null)
            .ilike("name", String(basePayload.name ?? "").trim())
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (findErr) {
            console.error("Fallback select error when trying to resolve inserted character id:", inspectError(findErr));
            return { data: null, error: findErr };
        }
        if (found && (found as any).id) {
            return { data: found, error: null };
        }
        return { data: null, error: null };
    } catch (err) {
        console.error("Exception in createOrUpdateCharacterRow:", err);
        return { data: null, error: err };
    }
}

/**
 * Update details JSON on characters table (merge-safe).
 *
 * Hace un merge superficial entre el details actual y detailsPatch, de modo que
 * no se pierdan subcampos como `armors` si no se incluyen en el parche.
 *
 * Si necesitas merges más ricos (merge por id en armors), lo implementamos también.
 */
export async function updateCharacterDetails(character_id: string, detailsPatch: any) {
    if (!character_id) return { data: null, error: new Error("missing character_id") };

    try {
        // 1) leer detalles actuales
        const { data: existingRow, error: getErr } = await supabase
            .from("characters")
            .select("details")
            .eq("id", character_id)
            .maybeSingle();

        if (getErr) {
            console.error("Error leyendo details actuales:", inspectError(getErr));
            return { data: null, error: getErr };
        }

        const currentDetails = (existingRow && (existingRow as any).details) || {};

        // 2) merge superficial (nivel 1)
        const merged: any = { ...currentDetails, ...(detailsPatch || {}) };

        // 3) preservamos armors si no vienen en el parche
        if (!Object.prototype.hasOwnProperty.call(detailsPatch || {}, "armors")) {
            merged.armors = currentDetails?.armors ?? merged.armors ?? null;
        } else {
            // si vienen armors en detailsPatch, los usamos tal cual (podríamos hacer merge por id aquí)
            merged.armors = detailsPatch.armors ?? null;
        }

        // 4) write back
        const { data: updData, error: updErr } = await supabase
            .from("characters")
            .update({ details: merged })
            .eq("id", character_id)
            .select("details")
            .maybeSingle();

        if (updErr) {
            console.error("Error actualizando details (merge):", inspectError(updErr));
            return { data: null, error: updErr };
        }

        return { data: updData, error: null };
    } catch (err) {
        console.error("Exception in updateCharacterDetails:", err);
        return { data: null, error: err };
    }

}
// Añadir al final de src/app/campaigns/[id]/player/services/characters.api.ts

/**
 * Fetch character row + related armors and weapons, y devuelve un objeto
 * con character + details poblado (armors y weaponEquipped) para el cliente.
 *
 * NOTA: requiere que la tabla character_armors tenga character_id FK y que
 * supabase detecte la relación. Si no está definida, hacemos dos queries separadas.
 */
export async function fetchCharacterWithAssets(character_id: string) {
    if (!character_id) return { data: null, error: new Error("missing character_id") };

    try {
        // Intentamos un select con relaciones; si no tienes FK/relación en supabase, la respuesta será vacía o fallará.
        const { data: charRow, error: charErr } = await supabase
            .from("characters")
            .select("*, character_armors(*), character_weapons(*)")
            .eq("id", character_id)
            .maybeSingle();

        if (charErr) {
            // fallback: obtenemos character por separado y luego armors/weapons por queries separadas
            console.warn("fetchCharacterWithAssets: relation select falló, usando fallback. Error:", inspectError(charErr));
            const { data: characterOnly, error: cErr } = await supabase.from("characters").select("*").eq("id", character_id).maybeSingle();
            if (cErr) return { data: null, error: cErr };

            const { data: armorsData, error: aErr } = await supabase.from("character_armors").select("*").eq("character_id", character_id);
            if (aErr) return { data: null, error: aErr };

            const { data: weaponsData, error: wErr } = await supabase.from("character_weapons").select("*").eq("character_id", character_id);
            if (wErr) return { data: null, error: wErr };

            const mergedDetails = {
                ...(characterOnly?.details ?? {}),
                armors: Array.isArray(armorsData) ? armorsData : [],
                weapons: Array.isArray(weaponsData) ? weaponsData : [],
            };

            const out = { ...(characterOnly || {}), details: mergedDetails };
            return { data: out, error: null };
        }

        // si llegamos aquí, charRow contiene character + possible related rows
        if (!charRow) return { data: null, error: null };

        // normalizar armors y weapons desde la respuesta
        const armorsFromRel = Array.isArray((charRow as any).character_armors) ? (charRow as any).character_armors : [];
        const weaponsFromRel = Array.isArray((charRow as any).character_weapons) ? (charRow as any).character_weapons : [];

        const currentDetails = (charRow as any).details ?? {};

        const mergedDetails = {
            ...currentDetails,
            armors: armorsFromRel.length > 0 ? armorsFromRel : (currentDetails.armors ?? []),
            // Mantener weaponEquipped en details si existe, sino intentar elegir la primera equipada en character_weapons
            weaponEquipped:
                currentDetails.weaponEquipped ??
                (weaponsFromRel.find((w: any) => !!w.equipped) ?? (weaponsFromRel.length > 0 ? weaponsFromRel[0] : undefined)),
        };

        const out = {
            ...charRow,
            details: mergedDetails,
        };

        // limpiamos claves relacionales para no enviar duplicados
        delete (out as any).character_armors;
        delete (out as any).character_weapons;

        return { data: out, error: null };
    } catch (err) {
        console.error("fetchCharacterWithAssets - exception:", err);
        return { data: null, error: err };
    }
}

