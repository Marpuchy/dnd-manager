"use client";

import React from "react";
import { Details } from "../../playerShared";
import Markdown from "@/app/components/Markdown";
import {
  MODIFIER_TARGETS,
  ensureDetailsItems,
  getLocalizedText,
  normalizeTarget,
} from "@/lib/character/items";
import { useClientLocale } from "@/lib/i18n/useClientLocale";
import { tr } from "@/lib/i18n/translate";

const categoryLabels = {
  weapon: { es: "Arma", en: "Weapon" },
  armor: { es: "Armadura", en: "Armor" },
  accessory: { es: "Accesorio", en: "Accessory" },
  consumable: { es: "Consumible", en: "Consumable" },
  tool: { es: "Herramienta", en: "Tool" },
  misc: { es: "Miscelaneo", en: "Miscellaneous" },
} as const;

const targetLabelMapEs = new Map(
  MODIFIER_TARGETS.map((entry) => [entry.key, entry.label])
);

const targetLabelMapEn = new Map<string, string>([
  ["STR", "Strength (STR)"],
  ["DEX", "Dexterity (DEX)"],
  ["CON", "Constitution (CON)"],
  ["INT", "Intelligence (INT)"],
  ["WIS", "Wisdom (WIS)"],
  ["CHA", "Charisma (CHA)"],
  ["AC", "Armor Class (AC)"],
  ["HP_MAX", "Maximum HP"],
  ["HP_CURRENT", "Current HP"],
  ["SPEED", "Speed"],
  ["INITIATIVE", "Initiative"],
  ["PROFICIENCY", "Proficiency Bonus"],
  ["PASSIVE_PERCEPTION", "Passive Perception"],
  ["SPELL_ATTACK", "Spell Attack"],
  ["SPELL_DC", "Spell DC"],
  ["ATTACK_BONUS", "Attack Bonus"],
  ["DAMAGE_BONUS", "Damage Bonus"],
  ["SAVE_STR", "Saving Throw STR"],
  ["SAVE_DEX", "Saving Throw DEX"],
  ["SAVE_CON", "Saving Throw CON"],
  ["SAVE_INT", "Saving Throw INT"],
  ["SAVE_WIS", "Saving Throw WIS"],
  ["SAVE_CHA", "Saving Throw CHA"],
  ["SKILL_ACROBATICS", "Skill: Acrobatics"],
  ["SKILL_ANIMAL_HANDLING", "Skill: Animal Handling"],
  ["SKILL_ARCANA", "Skill: Arcana"],
  ["SKILL_ATHLETICS", "Skill: Athletics"],
  ["SKILL_DECEPTION", "Skill: Deception"],
  ["SKILL_HISTORY", "Skill: History"],
  ["SKILL_INSIGHT", "Skill: Insight"],
  ["SKILL_INTIMIDATION", "Skill: Intimidation"],
  ["SKILL_INVESTIGATION", "Skill: Investigation"],
  ["SKILL_MEDICINE", "Skill: Medicine"],
  ["SKILL_NATURE", "Skill: Nature"],
  ["SKILL_PERCEPTION", "Skill: Perception"],
  ["SKILL_PERFORMANCE", "Skill: Performance"],
  ["SKILL_PERSUASION", "Skill: Persuasion"],
  ["SKILL_RELIGION", "Skill: Religion"],
  ["SKILL_SLEIGHT_OF_HAND", "Skill: Sleight of Hand"],
  ["SKILL_STEALTH", "Skill: Stealth"],
  ["SKILL_SURVIVAL", "Skill: Survival"],
]);

function getTargetLabel(target: string, locale: string) {
  const normalized = normalizeTarget(target);
  return locale === "en"
    ? targetLabelMapEn.get(normalized) ?? target
    : targetLabelMapEs.get(normalized) ?? target;
}

type InventoryPanelProps = {
  details: Details;
};

function getCategoryLabel(category: string | undefined, locale: string) {
  if (!category) return tr(locale, "Objeto", "Item");
  const key = category as keyof typeof categoryLabels;
  const entry = categoryLabels[key];
  if (!entry) return category;
  return locale === "en" ? entry.en : entry.es;
}

function getAttachmentTypeLabel(type: string, locale: string) {
  const map: Record<string, { es: string; en: string }> = {
    action: { es: "Accion", en: "Action" },
    ability: { es: "Habilidad", en: "Ability" },
    trait: { es: "Rasgo", en: "Trait" },
    spell: { es: "Hechizo", en: "Spell" },
    cantrip: { es: "Truco", en: "Cantrip" },
    classFeature: { es: "Rasgo de clase", en: "Class feature" },
    other: { es: "Otro", en: "Other" },
  };
  const entry = map[type];
  if (!entry) return type;
  return locale === "en" ? entry.en : entry.es;
}

function ItemCard({
  item,
  locale,
  showEquippedBadge,
}: {
  item: any;
  locale: string;
  showEquippedBadge?: boolean;
}) {
  const description = getLocalizedText(item.description, locale);
  const modifiers = Array.isArray(item.modifiers) ? item.modifiers : [];
  const attachments = Array.isArray(item.attachments) ? item.attachments : [];
  const tags = [
    item.category ? getCategoryLabel(item.category, locale) : null,
    item.rarity ? item.rarity : null,
    ...(item.tags ?? []),
    item.attunement
      ? typeof item.attunement === "string"
        ? `${tr(locale, "Sintonia", "Attunement")}: ${item.attunement}`
        : tr(locale, "Requiere sintonia", "Requires attunement")
      : null,
  ].filter(Boolean) as string[];

  return (
    <details className="rounded-2xl border border-ring bg-white/80 p-3">
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">{item.name}</p>
            <p className="text-[11px] text-ink-muted">
              {getCategoryLabel(item.category, locale)}
              {item.quantity ? ` · x${item.quantity}` : ""}
              {item.weight != null ? ` · ${item.weight} lb` : ""}
              {item.value ? ` · ${item.value}` : ""}
            </p>
          </div>
          {showEquippedBadge && item.equipped && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/50 text-emerald-700 bg-emerald-50">
              {tr(locale, "Equipado", "Equipped")}
            </span>
          )}
        </div>
      </summary>

      <div className="mt-3 space-y-2 text-xs text-ink-muted">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full border border-ring text-[10px] text-ink-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {modifiers.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {modifiers.map((mod: any, i: number) => (
              <span
                key={`${mod.target}-${i}`}
                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  mod.value >= 0
                    ? "border-emerald-500/50 text-emerald-700 bg-emerald-50"
                    : "border-rose-500/50 text-rose-700 bg-rose-50"
                }`}
              >
                {getTargetLabel(mod.target, locale)} {mod.value >= 0 ? `+${mod.value}` : mod.value}
                {mod.note ? ` · ${mod.note}` : ""}
              </span>
            ))}
          </div>
        )}

        {description && <Markdown content={description} className="text-ink-muted text-xs" />}

        {attachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              {tr(locale, "Adjuntos", "Attachments")}
            </p>
            {attachments.map((attachment: any) => {
              const attachmentDescription = getLocalizedText(
                attachment.description,
                locale
              );
              return (
                <div
                  key={attachment.id}
                  className="rounded-md border border-ring bg-panel/70 p-2"
                >
                  <p className="text-xs font-semibold text-ink">
                    {attachment.name}
                    {typeof attachment.level === "number"
                      ? ` · ${tr(locale, "Nivel", "Level")} ${attachment.level}`
                      : ""}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {getAttachmentTypeLabel(String(attachment.type ?? "other"), locale)}
                  </p>
                  {attachmentDescription && (
                    <Markdown
                      content={attachmentDescription}
                      className="mt-1 text-ink-muted text-xs"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </details>
  );
}

export default function InventoryPanel({ details }: InventoryPanelProps) {
  const safeDetails = ensureDetailsItems(details);
  const items = Array.isArray(safeDetails.items) ? safeDetails.items : [];
  const equippedItems = items.filter((item) => item.equipped);
  const locale = useClientLocale();

  const notesText = safeDetails.notes ?? "";
  const companion = safeDetails.companion;
  const profileEntries = [
    { label: tr(locale, "Trasfondo", "Background"), value: safeDetails.background },
    { label: tr(locale, "Alineamiento", "Alignment"), value: safeDetails.alignment },
    { label: tr(locale, "Rasgos", "Traits"), value: safeDetails.personalityTraits },
    { label: tr(locale, "Ideales", "Ideals"), value: safeDetails.ideals },
    { label: tr(locale, "Vinculos", "Bonds"), value: safeDetails.bonds },
    { label: tr(locale, "Defectos", "Flaws"), value: safeDetails.flaws },
    { label: tr(locale, "Apariencia", "Appearance"), value: safeDetails.appearance },
    { label: tr(locale, "Historia", "Backstory"), value: safeDetails.backstory },
    { label: tr(locale, "Idiomas", "Languages"), value: safeDetails.languages },
    { label: tr(locale, "Competencias", "Proficiencies"), value: safeDetails.proficiencies },
  ].filter((entry) => entry.value && String(entry.value).trim().length > 0);
  const customSections = Array.isArray(safeDetails.customSections)
    ? safeDetails.customSections
    : [];

  return (
    <div className="space-y-4 min-w-0 overflow-x-hidden">
      <div className="border border-ring rounded-2xl p-[var(--panel-pad)] space-y-2 bg-panel/80">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">{tr(locale, "Equipados", "Equipped")}</h3>
          <span className="text-[11px] text-ink-muted">
            {equippedItems.length} {tr(locale, `objeto${equippedItems.length === 1 ? "" : "s"}`, `item${equippedItems.length === 1 ? "" : "s"}`)}
          </span>
        </div>
        {equippedItems.length === 0 ? (
          <p className="text-xs text-ink-muted">{tr(locale, "No hay objetos equipados.", "No equipped items.")}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {equippedItems.map((item) => (
              <ItemCard key={item.id} item={item} locale={locale} />
            ))}
          </div>
        )}
      </div>

      <div className="border border-ring rounded-2xl p-[var(--panel-pad)] space-y-2 bg-panel/80">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">{tr(locale, "Inventario", "Inventory")}</h3>
          <span className="text-[11px] text-ink-muted">
            {items.length} {tr(locale, `objeto${items.length === 1 ? "" : "s"}`, `item${items.length === 1 ? "" : "s"}`)}
          </span>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-ink-muted">{tr(locale, "Aun no hay objetos registrados.", "No items recorded yet.")}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} locale={locale} showEquippedBadge />
            ))}
          </div>
        )}
      </div>

      <div className="border border-ring rounded-2xl p-[var(--panel-pad)] space-y-2 bg-panel/80">
        <h3 className="text-sm font-semibold text-ink">{tr(locale, "Notas del personaje", "Character notes")}</h3>
        {notesText ? (
          <Markdown content={notesText} className="text-ink-muted" />
        ) : (
          <p className="text-xs text-ink-muted">{tr(locale, "No hay notas guardadas.", "No saved notes.")}</p>
        )}
      </div>

      {profileEntries.length > 0 && (
        <div className="border border-ring rounded-2xl p-[var(--panel-pad)] space-y-3 bg-panel/80">
          <h3 className="text-sm font-semibold text-ink">{tr(locale, "Perfil", "Profile")}</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {profileEntries.map((entry) => (
              <div key={entry.label} className="rounded-xl border border-ring bg-white/80 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">{entry.label}</p>
                <Markdown content={String(entry.value)} className="text-ink-muted text-xs mt-2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {customSections.length > 0 && (
        <div className="border border-ring rounded-2xl p-[var(--panel-pad)] space-y-3 bg-panel/80">
          <h3 className="text-sm font-semibold text-ink">{tr(locale, "Notas personalizadas", "Custom notes")}</h3>
          <div className="space-y-3">
            {customSections.map((section) => (
              <details key={section.id} className="rounded-xl border border-ring bg-white/80 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-ink">{section.title}</summary>
                <div className="mt-2">
                  <Markdown content={section.content ?? ""} className="text-ink-muted text-xs" />
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {companion && (
        <div className="border border-ring rounded-2xl p-[var(--panel-pad)] space-y-3 bg-panel/80">
          <h3 className="text-sm font-semibold text-ink">{tr(locale, "Companero / Mascota", "Companion / Pet")}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-ring bg-white/80 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">{tr(locale, "Nombre", "Name")}</p>
              <p className="text-sm text-ink mt-2">{companion.name}</p>
              {companion.kind && <p className="text-[11px] text-ink-muted mt-1">{companion.kind}</p>}
              {companion.size && (
                <p className="text-[11px] text-ink-muted mt-1">
                  {tr(locale, "Tamano", "Size")}: {companion.size}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-ring bg-white/80 p-3 grid grid-cols-2 gap-2 text-xs text-ink-muted">
              <div>
                <p className="uppercase tracking-[0.2em] text-[10px]">AC</p>
                <p className="text-sm text-ink">{companion.armorClass ?? "-"}</p>
              </div>
              <div>
                <p className="uppercase tracking-[0.2em] text-[10px]">{tr(locale, "Velocidad", "Speed")}</p>
                <p className="text-sm text-ink">{companion.speed ?? "-"} ft</p>
              </div>
              <div>
                <p className="uppercase tracking-[0.2em] text-[10px]">{tr(locale, "Vida", "Life")}</p>
                <p className="text-sm text-ink">
                  {companion.currentHp ?? "-"} / {companion.maxHp ?? "-"}
                </p>
              </div>
              <div>
                <p className="uppercase tracking-[0.2em] text-[10px]">{tr(locale, "Notas", "Notes")}</p>
                <p className="text-sm text-ink">{companion.notes ? tr(locale, "Si", "Yes") : "-"}</p>
              </div>
            </div>
          </div>

          {companion.abilities && (
            <details className="rounded-xl border border-ring bg-white/80 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-ink">
                {tr(locale, "Habilidades y rasgos", "Abilities and traits")}
              </summary>
              <div className="mt-2">
                <Markdown content={companion.abilities} className="text-ink-muted text-xs" />
              </div>
            </details>
          )}

          {companion.spells && (
            <details className="rounded-xl border border-ring bg-white/80 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-ink">
                {tr(locale, "Hechizos y efectos", "Spells and effects")}
              </summary>
              <div className="mt-2">
                <Markdown content={companion.spells} className="text-ink-muted text-xs" />
              </div>
            </details>
          )}

          {companion.notes && (
            <details className="rounded-xl border border-ring bg-white/80 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-ink">
                {tr(locale, "Notas del companero", "Companion notes")}
              </summary>
              <div className="mt-2">
                <Markdown content={companion.notes} className="text-ink-muted text-xs" />
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
