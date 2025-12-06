// src/app/campaigns/[id]/player/ui/StatDisplay.tsx
import { abilityMod } from "@/lib/dndMath";

export function StatDisplay({ label, value }: { label: string; value: number }) {
    const mod = abilityMod(value);
    const signed = mod >= 0 ? `+${mod}` : mod;
    return (
        <div className="space-y-1 text-center">
            <div className="text-[11px] text-zinc-400">{label}</div>
            <div className="text-lg font-semibold text-zinc-100">
                {value} <span className="text-xs text-zinc-400">({signed})</span>
            </div>
        </div>
    );
}
