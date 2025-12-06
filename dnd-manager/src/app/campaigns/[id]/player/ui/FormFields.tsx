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
            <label className="text-sm text-zinc-300">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-purple-500"
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
            <label className="text-sm text-zinc-300">{label}</label>
            <input
                type="number"
                value={value}
                min={min}
                max={max}
                onChange={(e) => onChange(Number(e.target.value) || 0)}
                className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-purple-500"
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
            <label className="text-sm text-zinc-300">{label}</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-purple-500 resize-y"
            />
        </div>
    );
}
