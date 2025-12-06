// src/app/campaigns/[id]/player/ui/InfoBox.tsx
type InfoBoxProps = {
    label: string;
    value: string | number;
    sub?: string;
};

export function InfoBox({ label, value, sub }: InfoBoxProps) {
    return (
        <div className="border border-zinc-800 rounded-lg px-3 py-2">
            <div className="text-[11px] text-zinc-500 uppercase tracking-wide">
                {label}
            </div>
            <div className="text-lg font-semibold text-zinc-100">{value}</div>
            {sub && <div className="text-[11px] text-zinc-500 mt-1">{sub}</div>}
        </div>
    );
}
