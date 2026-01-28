"use client";

import React, { useState } from "react";
import { SpellMeta } from "../playerShared";

type Props = {
    onClose: () => void;
    onCreate: (spell: SpellMeta) => void;
};

const SCHOOLS = [
    "AbjuraciÃ³n",
    "AdivinaciÃ³n",
    "ConjuraciÃ³n",
    "Encantamiento",
    "EvocaciÃ³n",
    "IlusiÃ³n",
    "Nigromancia",
    "TransmutaciÃ³n",
];

const inputClass =
    "w-full border border-ring px-2 py-1 rounded bg-white/80 text-ink text-xs focus:outline-none focus:ring-1 focus:ring-accent/40";

export default function CreateCustomSpellModal({
                                                   onClose,
                                                   onCreate,
                                               }: Props) {
    const [form, setForm] = useState({
        name: "",
        level: 0,
        school: "EvocaciÃ³n",
        casting_time: "",
        rangeFeet: "",
        duration: "",
        components: [] as string[],
        ritual: false,
        description: "",
    });

    function toggleComponent(c: string) {
        setForm((f) => ({
            ...f,
            components: f.components.includes(c)
                ? f.components.filter((x) => x !== c)
                : [...f.components, c],
        }));
    }

    function submit() {
        if (!form.name.trim()) return;

        let range = "";
        if (form.rangeFeet === "0") {
            range = "Touch";
        } else if (form.rangeFeet !== "") {
            range = `${form.rangeFeet} ft`;
        }

        const spell: SpellMeta = {
            index: `custom_${crypto.randomUUID()}`,
            name: form.name.trim(),
            level: Number(form.level),
            school: form.school,
            casting_time: form.casting_time,
            range,
            duration: form.duration,
            components: form.components,
            ritual: form.ritual,
            fullDesc: form.description || undefined,
            shortDesc: form.description
                ? form.description.split("\n")[0]
                : undefined,
        };

        onCreate(spell);
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
            <div className="bg-panel/90 border border-ring rounded-lg w-full max-w-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold text-ink">
                    Crear hechizo personalizado
                </h3>

                {/* Nombre */}
                <div>
                    <label className="text-[11px] text-ink-muted">Nombre</label>
                    <input
                        className={inputClass}
                        value={form.name}
                        onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                        }
                    />
                </div>

                {/* Nivel y escuela */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[11px] text-ink-muted">Nivel</label>
                        <input
                            type="number"
                            min={0}
                            max={9}
                            className={inputClass}
                            value={form.level}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    level: Number(e.target.value),
                                })
                            }
                        />
                    </div>

                    <div>
                        <label className="text-[11px] text-ink-muted">Escuela</label>
                        <select
                            className={inputClass}
                            value={form.school}
                            onChange={(e) =>
                                setForm({ ...form, school: e.target.value })
                            }
                        >
                            {SCHOOLS.map((s) => (
                                <option
                                    key={s}
                                    value={s}
                                    className="bg-white/80 text-ink"
                                >
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Casting / Range / Duration */}
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-[11px] text-ink-muted">
                            Tiempo de lanzamiento
                        </label>
                        <input
                            className={inputClass}
                            placeholder="AcciÃ³n, AcciÃ³n adicional, ReacciÃ³nâ€¦"
                            value={form.casting_time}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    casting_time: e.target.value,
                                })
                            }
                        />
                    </div>

                    <div>
                        <label className="text-[11px] text-ink-muted">
                            Alcance (0 = Touch)
                        </label>
                        <div className="flex">
                            <input
                                type="number"
                                min={0}
                                className={`${inputClass} rounded-r-none`}
                                placeholder="0"
                                value={
                                    form.rangeFeet === ""
                                        ? ""
                                        : Number(form.rangeFeet)
                                }
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === "") {
                                        setForm({ ...form, rangeFeet: "" });
                                        return;
                                    }
                                    const n = Number(v);
                                    if (n < 0) return;
                                    setForm({
                                        ...form,
                                        rangeFeet: String(n),
                                    });
                                }}
                            />
                            <div className="border border-ring border-l-0 px-2 py-1 rounded-r text-xs text-ink-muted flex items-center bg-white/80">
                                ft
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] text-ink-muted">
                            DuraciÃ³n
                        </label>
                        <input
                            className={inputClass}
                            placeholder="ConcentraciÃ³n, hasta 1 minutoâ€¦"
                            value={form.duration}
                            onChange={(e) =>
                                setForm({ ...form, duration: e.target.value })
                            }
                        />
                    </div>
                </div>

                {/* Componentes + Ritual */}
                <div className="flex flex-wrap gap-4 text-xs text-ink">
                    {["V", "S", "M"].map((c) => (
                        <label key={c} className="flex gap-1 items-center">
                            <input
                                type="checkbox"
                                checked={form.components.includes(c)}
                                onChange={() => toggleComponent(c)}
                            />
                            {c}
                        </label>
                    ))}

                    <label className="flex gap-1 items-center">
                        <input
                            type="checkbox"
                            checked={form.ritual}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    ritual: e.target.checked,
                                })
                            }
                        />
                        Ritual
                    </label>
                </div>

                {/* DescripciÃ³n */}
                <div>
                    <label className="text-[11px] text-ink-muted">
                        DescripciÃ³n
                    </label>
                    <textarea
                        className={inputClass}
                        rows={5}
                        placeholder="DescripciÃ³n completa del hechizoâ€¦"
                        value={form.description}
                        onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                        }
                    />
                </div>

                {/* Acciones */}
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        className="text-xs border border-ring px-3 py-1 rounded text-ink hover:bg-ink/5"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    <button
                        className="text-xs border border-ring px-3 py-1 rounded text-ink hover:bg-ink/5"
                        onClick={submit}
                    >
                        Crear
                    </button>
                </div>
            </div>
        </div>
    );
}

