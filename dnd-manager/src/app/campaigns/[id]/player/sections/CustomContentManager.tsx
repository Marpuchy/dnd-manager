"use client";

import React, { useMemo, useState } from "react";
import Markdown from "@/app/components/Markdown";
import {
    CustomFeatureEntry,
    CustomSpellEntry,
    LocalizedText,
} from "@/lib/types/dnd";
import {
    getLocalizedText,
    normalizeLocalizedText,
} from "@/lib/character/items";

type FormType = "spell" | "cantrip" | "trait" | "classAbility";

type CustomContentManagerProps = {
    locale: string;
    customSpells: CustomSpellEntry[];
    setCustomSpells: (v: CustomSpellEntry[]) => void;
    customCantrips: CustomSpellEntry[];
    setCustomCantrips: (v: CustomSpellEntry[]) => void;
    customTraits: CustomFeatureEntry[];
    setCustomTraits: (v: CustomFeatureEntry[]) => void;
    customClassAbilities: CustomFeatureEntry[];
    setCustomClassAbilities: (v: CustomFeatureEntry[]) => void;
};

function buildLocalized(text: string, locale: string): LocalizedText | undefined {
    return normalizeLocalizedText(text, locale);
}

export default function CustomContentManager({
                                                 locale,
                                                 customSpells,
                                                 setCustomSpells,
                                                 customCantrips,
                                                 setCustomCantrips,
                                                 customTraits,
                                                 setCustomTraits,
                                                 customClassAbilities,
                                                 setCustomClassAbilities,
                                             }: CustomContentManagerProps) {
    const [formType, setFormType] = useState<FormType>("spell");
    const [editing, setEditing] = useState<{ id: string; type: FormType } | null>(
        null
    );

    const [name, setName] = useState("");
    const [level, setLevel] = useState(1);
    const [school, setSchool] = useState("");
    const [description, setDescription] = useState("");

    const title = useMemo(() => {
        switch (formType) {
            case "spell":
                return "Hechizo";
            case "cantrip":
                return "Truco";
            case "trait":
                return "Rasgo";
            case "classAbility":
                return "Habilidad de clase";
            default:
                return "Contenido";
        }
    }, [formType]);

    function resetForm() {
        setName("");
        setLevel(1);
        setSchool("");
        setDescription("");
        setEditing(null);
    }

    function startEdit(entry: CustomSpellEntry | CustomFeatureEntry, type: FormType) {
        setFormType(type);
        setEditing({ id: entry.id, type });
        setName(entry.name ?? "");
        if ("level" in entry && typeof entry.level === "number") {
            setLevel(entry.level);
        } else {
            setLevel(1);
        }
        if ("school" in entry && entry.school) {
            setSchool(entry.school ?? "");
        } else {
            setSchool("");
        }
        const desc =
            "description" in entry ? getLocalizedText(entry.description, locale) : "";
        setDescription(desc);
    }

    function handleSave() {
        const trimmed = name.trim();
        if (!trimmed) {
            resetForm();
            return;
        }

        const desc = buildLocalized(description, locale);

        if (formType === "spell" || formType === "cantrip") {
            const entry: CustomSpellEntry = {
                id: editing?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: trimmed,
                level: formType === "cantrip" ? 0 : Math.max(1, Math.min(9, Number(level) || 1)),
                school: school.trim() || undefined,
                description: desc,
            };

            if (formType === "cantrip") {
                const list = Array.isArray(customCantrips) ? customCantrips : [];
                const updated = editing
                    ? list.map((item) => (item.id === entry.id ? entry : item))
                    : [...list, entry];
                setCustomCantrips(updated);
            } else {
                const list = Array.isArray(customSpells) ? customSpells : [];
                const updated = editing
                    ? list.map((item) => (item.id === entry.id ? entry : item))
                    : [...list, entry];
                setCustomSpells(updated);
            }
        } else {
            const entry: CustomFeatureEntry = {
                id: editing?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: trimmed,
                level: formType === "classAbility" ? Number(level) || undefined : undefined,
                description: desc,
            };

            if (formType === "trait") {
                const list = Array.isArray(customTraits) ? customTraits : [];
                const updated = editing
                    ? list.map((item) => (item.id === entry.id ? entry : item))
                    : [...list, entry];
                setCustomTraits(updated);
            } else {
                const list = Array.isArray(customClassAbilities)
                    ? customClassAbilities
                    : [];
                const updated = editing
                    ? list.map((item) => (item.id === entry.id ? entry : item))
                    : [...list, entry];
                setCustomClassAbilities(updated);
            }
        }

        resetForm();
    }

    function removeEntry(id: string, type: FormType) {
        if (type === "spell") {
            setCustomSpells(customSpells.filter((item) => item.id !== id));
            return;
        }
        if (type === "cantrip") {
            setCustomCantrips(customCantrips.filter((item) => item.id !== id));
            return;
        }
        if (type === "trait") {
            setCustomTraits(customTraits.filter((item) => item.id !== id));
            return;
        }
        setCustomClassAbilities(customClassAbilities.filter((item) => item.id !== id));
    }

    function renderList(
        label: string,
        entries: Array<CustomSpellEntry | CustomFeatureEntry>,
        type: FormType
    ) {
        if (!entries.length) return null;

        return (
            <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                    {label}
                </h4>
                <div className="grid gap-2 md:grid-cols-2">
                    {entries.map((entry) => {
                        const desc = getLocalizedText(entry.description, locale);
                        return (
                            <details
                                key={entry.id}
                                className="rounded-2xl border border-ring bg-white/80 p-3"
                            >
                                <summary className="cursor-pointer list-none">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-ink">
                                                {entry.name}
                                            </p>
                                            {"level" in entry && entry.level != null && (
                                                <p className="text-[11px] text-ink-muted">
                                                    Nivel {entry.level}
                                                    {"school" in entry && entry.school
                                                        ? ` · ${entry.school}`
                                                        : ""}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    startEdit(entry, type);
                                                }}
                                                className="text-[10px] px-2 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    removeEntry(entry.id, type);
                                                }}
                                                className="text-[10px] px-2 py-1 rounded-md border border-red-400/70 text-red-600 bg-red-50 hover:bg-red-100"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </summary>
                                {desc ? (
                                    <div className="mt-2">
                                        <Markdown
                                            content={desc}
                                            className="text-ink-muted text-xs"
                                        />
                                    </div>
                                ) : (
                                    <p className="mt-2 text-[11px] text-ink-muted">
                                        Sin descripción.
                                    </p>
                                )}
                            </details>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <section className="space-y-4">
            <div className="rounded-2xl border border-ring bg-panel/80 p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-ink-muted">
                            Crear
                        </p>
                        <h3 className="text-sm font-semibold text-ink">
                            {editing ? `Editar ${title}` : `Nuevo ${title}`}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {editing && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-[11px] px-3 py-1 rounded-md border border-ring bg-white/70 hover:bg-white"
                            >
                                Cancelar edición
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleSave}
                            className="text-[11px] px-3 py-1 rounded-md border border-accent/60 bg-accent/10 hover:bg-accent/20"
                        >
                            {editing ? "Guardar cambios" : "Crear"}
                        </button>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                        <label className="text-xs text-ink-muted">Tipo</label>
                        <select
                            value={formType}
                            onChange={(event) =>
                                setFormType(event.target.value as FormType)
                            }
                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                        >
                            <option value="spell">Hechizo</option>
                            <option value="cantrip">Truco</option>
                            <option value="trait">Rasgo</option>
                            <option value="classAbility">Habilidad de clase</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-ink-muted">Nombre</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                        />
                    </div>
                </div>

                {(formType === "spell" || formType === "classAbility") && (
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-xs text-ink-muted">
                                Nivel {formType === "spell" ? "del hechizo" : "recomendado"}
                            </label>
                            <input
                                type="number"
                                min={formType === "spell" ? 1 : 0}
                                max={formType === "spell" ? 9 : 20}
                                value={level}
                                onChange={(event) => setLevel(Number(event.target.value) || 1)}
                                className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                            />
                        </div>
                        {formType === "spell" && (
                            <div className="space-y-1">
                                <label className="text-xs text-ink-muted">Escuela</label>
                                <input
                                    type="text"
                                    value={school}
                                    onChange={(event) => setSchool(event.target.value)}
                                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                                />
                            </div>
                        )}
                    </div>
                )}

                <details className="rounded-xl border border-ring bg-white/80 p-3">
                    <summary className="cursor-pointer text-xs text-ink-muted">
                        Descripción (Markdown)
                    </summary>
                    <div className="mt-2">
                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            rows={4}
                            className="w-full rounded-md bg-white/90 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                        />
                    </div>
                </details>
            </div>

            <div className="space-y-4">
                {renderList("Trucos personalizados", customCantrips, "cantrip")}
                {renderList("Hechizos personalizados", customSpells, "spell")}
                {renderList("Rasgos personalizados", customTraits, "trait")}
                {renderList("Habilidades de clase personalizadas", customClassAbilities, "classAbility")}
            </div>
        </section>
    );
}
