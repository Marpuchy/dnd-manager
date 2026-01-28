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
import { getClientLocale } from "@/lib/i18n/getClientLocale";

const categoryLabels: Record<string, string> = {
    weapon: "Arma",
    armor: "Armadura",
    accessory: "Accesorio",
    consumable: "Consumible",
    tool: "Herramienta",
    misc: "Misceláneo",
};

const targetLabelMap = new Map(
    MODIFIER_TARGETS.map((entry) => [entry.key, entry.label])
);

function getTargetLabel(target: string) {
    const normalized = normalizeTarget(target);
    return targetLabelMap.get(normalized) ?? target;
}

type InventoryPanelProps = {
    details: Details;
};

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
    const tags = [
        item.category ? categoryLabels[item.category] ?? item.category : null,
        item.rarity ? item.rarity : null,
        ...(item.tags ?? []),
        item.attunement
            ? typeof item.attunement === "string"
                ? `Sintonía: ${item.attunement}`
                : "Requiere sintonía"
            : null,
    ].filter(Boolean) as string[];

    return (
        <details className="rounded-2xl border border-ring bg-white/80 p-3">
            <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-ink">{item.name}</p>
                        <p className="text-[11px] text-ink-muted">
                            {categoryLabels[item.category] ?? "Objeto"}
                            {item.quantity ? ` · x${item.quantity}` : ""}
                            {item.weight != null ? ` · ${item.weight} lb` : ""}
                            {item.value ? ` · ${item.value}` : ""}
                        </p>
                    </div>
                    {showEquippedBadge && item.equipped && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/50 text-emerald-700 bg-emerald-50">
                            Equipado
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
                                {getTargetLabel(mod.target)}{" "}
                                {mod.value >= 0 ? `+${mod.value}` : mod.value}
                                {mod.note ? ` · ${mod.note}` : ""}
                            </span>
                        ))}
                    </div>
                )}

                {description && (
                    <Markdown content={description} className="text-ink-muted text-xs" />
                )}
            </div>
        </details>
    );
}

export default function InventoryPanel({ details }: InventoryPanelProps) {
    const safeDetails = ensureDetailsItems(details);
    const items = Array.isArray(safeDetails.items) ? safeDetails.items : [];
    const equippedItems = items.filter((item) => item.equipped);
    const locale = getClientLocale();

    const notesText = safeDetails.notes ?? "";
    const companion = safeDetails.companion;
    const profileEntries = [
        { label: "Trasfondo", value: safeDetails.background },
        { label: "Alineamiento", value: safeDetails.alignment },
        { label: "Rasgos", value: safeDetails.personalityTraits },
        { label: "Ideales", value: safeDetails.ideals },
        { label: "Vínculos", value: safeDetails.bonds },
        { label: "Defectos", value: safeDetails.flaws },
        { label: "Apariencia", value: safeDetails.appearance },
        { label: "Historia", value: safeDetails.backstory },
        { label: "Idiomas", value: safeDetails.languages },
        { label: "Competencias", value: safeDetails.proficiencies },
    ].filter((entry) => entry.value && String(entry.value).trim().length > 0);
    const customSections = Array.isArray(safeDetails.customSections)
        ? safeDetails.customSections
        : [];

    return (
        <div className="space-y-4">
            <div className="border border-ring rounded-2xl p-[var(--panel-pad)] space-y-2 bg-panel/80">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-ink">Equipados</h3>
                    <span className="text-[11px] text-ink-muted">
                        {equippedItems.length} objeto{equippedItems.length === 1 ? "" : "s"}
                    </span>
                </div>
                {equippedItems.length === 0 ? (
                    <p className="text-xs text-ink-muted">No hay objetos equipados.</p>
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
                    <h3 className="text-sm font-semibold text-ink">Inventario</h3>
                    <span className="text-[11px] text-ink-muted">
                        {items.length} objeto{items.length === 1 ? "" : "s"}
                    </span>
                </div>
                {items.length === 0 ? (
                    <p className="text-xs text-ink-muted">Aún no hay objetos registrados.</p>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                        {items.map((item) => (
                            <ItemCard key={item.id} item={item} locale={locale} showEquippedBadge />
                        ))}
                    </div>
                )}
            </div>

            <div className="border border-ring rounded-2xl p-[var(--panel-pad)] space-y-2 bg-panel/80">
                <h3 className="text-sm font-semibold text-ink">Notas del personaje</h3>
                {notesText ? (
                    <Markdown content={notesText} className="text-ink-muted" />
                ) : (
                    <p className="text-xs text-ink-muted">No hay notas guardadas.</p>
                )}
            </div>

            {profileEntries.length > 0 && (
                <div className="border border-ring rounded-2xl p-[var(--panel-pad)] space-y-3 bg-panel/80">
                    <h3 className="text-sm font-semibold text-ink">Perfil</h3>
                    <div className="grid gap-2 md:grid-cols-2">
                        {profileEntries.map((entry) => (
                            <div key={entry.label} className="rounded-xl border border-ring bg-white/80 p-3">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                                    {entry.label}
                                </p>
                                <Markdown content={String(entry.value)} className="text-ink-muted text-xs mt-2" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {customSections.length > 0 && (
                <div className="border border-ring rounded-2xl p-[var(--panel-pad)] space-y-3 bg-panel/80">
                    <h3 className="text-sm font-semibold text-ink">Notas personalizadas</h3>
                    <div className="space-y-3">
                        {customSections.map((section) => (
                            <details key={section.id} className="rounded-xl border border-ring bg-white/80 p-3">
                                <summary className="cursor-pointer text-sm font-semibold text-ink">
                                    {section.title}
                                </summary>
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
                    <h3 className="text-sm font-semibold text-ink">Compañero / Mascota</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-ring bg-white/80 p-3">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                                Nombre
                            </p>
                            <p className="text-sm text-ink mt-2">{companion.name}</p>
                            {companion.kind && (
                                <p className="text-[11px] text-ink-muted mt-1">{companion.kind}</p>
                            )}
                            {companion.size && (
                                <p className="text-[11px] text-ink-muted mt-1">
                                    Tamaño: {companion.size}
                                </p>
                            )}
                        </div>
                        <div className="rounded-xl border border-ring bg-white/80 p-3 grid grid-cols-2 gap-2 text-xs text-ink-muted">
                            <div>
                                <p className="uppercase tracking-[0.2em] text-[10px]">CA</p>
                                <p className="text-sm text-ink">{companion.armorClass ?? "—"}</p>
                            </div>
                            <div>
                                <p className="uppercase tracking-[0.2em] text-[10px]">Velocidad</p>
                                <p className="text-sm text-ink">{companion.speed ?? "—"} ft</p>
                            </div>
                            <div>
                                <p className="uppercase tracking-[0.2em] text-[10px]">Vida</p>
                                <p className="text-sm text-ink">
                                    {companion.currentHp ?? "—"} / {companion.maxHp ?? "—"}
                                </p>
                            </div>
                            <div>
                                <p className="uppercase tracking-[0.2em] text-[10px]">Notas</p>
                                <p className="text-sm text-ink">{companion.notes ? "Sí" : "—"}</p>
                            </div>
                        </div>
                    </div>

                    {companion.abilities && (
                        <details className="rounded-xl border border-ring bg-white/80 p-3">
                            <summary className="cursor-pointer text-sm font-semibold text-ink">
                                Habilidades y rasgos
                            </summary>
                            <div className="mt-2">
                                <Markdown content={companion.abilities} className="text-ink-muted text-xs" />
                            </div>
                        </details>
                    )}

                    {companion.spells && (
                        <details className="rounded-xl border border-ring bg-white/80 p-3">
                            <summary className="cursor-pointer text-sm font-semibold text-ink">
                                Hechizos y efectos
                            </summary>
                            <div className="mt-2">
                                <Markdown content={companion.spells} className="text-ink-muted text-xs" />
                            </div>
                        </details>
                    )}

                    {companion.notes && (
                        <details className="rounded-xl border border-ring bg-white/80 p-3">
                            <summary className="cursor-pointer text-sm font-semibold text-ink">
                                Notas del compañero
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
