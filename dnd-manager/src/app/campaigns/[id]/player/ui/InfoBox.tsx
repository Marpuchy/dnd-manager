// src/app/campaigns/[id]/player/ui/InfoBox.tsx
type InfoBoxProps = {
    label: string;
    value: string | number;
    sub?: string;
};

export function InfoBox({ label, value, sub }: InfoBoxProps) {
    return (
        <div className="border border-ring rounded-lg px-3 py-2 bg-white/80">
            <div className="text-[11px] text-ink-muted uppercase tracking-wide">
                {label}
            </div>
            <div className="text-lg font-semibold text-ink">{value}</div>
            {sub && <div className="text-[11px] text-ink-muted mt-1">{sub}</div>}
        </div>
    );
}
