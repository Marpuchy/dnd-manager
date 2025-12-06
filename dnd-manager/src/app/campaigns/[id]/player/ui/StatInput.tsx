// src/app/campaigns/[id]/player/ui/StatInput.tsx
import { abilityMod } from "@/lib/dndMath";

type StatInputProps = {
    label: string;
    value: number;
    onChange: (v: number) => void;
};

export function StatInput({ label, value, onChange }: StatInputProps) {
    const mod = abilityMod(value);
    const signed = mod >= 0 ? `+${mod}` : mod;
    return (
        <div className="space-y-1 text-center">
            <div className="text-[11px] text-zinc-400">{label}</div>
            <input
                type="number"
                min={1}
                max={30}
                value={value}
                onChange={(e) => onChange(Number(e.target.value) || 1)}
                className="w-full rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 text-sm text-center outline-none focus:border-purple-500"
            />
            <div className="text-[11px] text-zinc-500">mod {signed}</div>
        </div>
    );
}
