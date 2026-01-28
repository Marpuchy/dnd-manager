"use client";

import { useState } from "react";
import Markdown from "@/app/components/Markdown";
import { useUserSettings } from "@/app/components/SettingsProvider";

// src/app/campaigns/[id]/player/ui/FormFields.tsx
type TextFieldProps = {
    label: string;
    value: string;
    onChange: (v: string) => void;
    required?: boolean;
};

export function TextField({
                              label,
                              value,
                              onChange,
                              required,
                          }: TextFieldProps) {
    return (
        <div className="space-y-1">
            <label className="text-sm text-ink-muted">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
        </div>
    );
}

type NumberFieldProps = {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
};

export function NumberField({
                                label,
                                value,
                                onChange,
                                min,
                                max,
                            }: NumberFieldProps) {
    return (
        <div className="space-y-1">
            <label className="text-sm text-ink-muted">{label}</label>
            <input
                type="number"
                value={value}
                min={min}
                max={max}
                onChange={(e) => onChange(Number(e.target.value) || 0)}
                className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
        </div>
    );
}

type TextareaFieldProps = {
    label: string;
    value: string;
    onChange: (v: string) => void;
};

export function TextareaField({
                                  label,
                                  value,
                                  onChange,
                              }: TextareaFieldProps) {
    return (
        <div className="space-y-1">
            <label className="text-sm text-ink-muted">{label}</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent resize-y"
            />
        </div>
    );
}

type MarkdownFieldProps = {
    label: string;
    value: string;
    onChange: (v: string) => void;
    helper?: string;
    rows?: number;
};

export function MarkdownField({
                                  label,
                                  value,
                                  onChange,
                                  helper,
                                  rows = 4,
                              }: MarkdownFieldProps) {
    const [preview, setPreview] = useState(false);
    const { settings } = useUserSettings();

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <label className="text-sm text-ink-muted">{label}</label>
                <button
                    type="button"
                    onClick={() => setPreview((v) => !v)}
                    className="text-[11px] px-2 py-0.5 rounded-md border border-ring bg-white/70 text-ink hover:bg-white"
                >
                    {preview ? "Editar" : "Previsualizar"}
                </button>
            </div>

            {helper && settings.showHints && (
                <p className="text-[11px] text-ink-muted">{helper}</p>
            )}

            {preview ? (
                <div className="rounded-md border border-ring bg-white/80 p-3">
                    <Markdown content={value || "_Sin contenido_"} className="text-ink-muted text-xs" />
                </div>
            ) : (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={rows}
                    className="w-full rounded-md bg-white/80 border border-ring px-3 py-2 text-sm text-ink outline-none focus:border-accent resize-y"
                />
            )}
        </div>
    );
}
