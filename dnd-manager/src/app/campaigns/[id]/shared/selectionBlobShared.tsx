import type { CSSProperties } from "react";

const BESTIARY_SELECTION_RGB = "120, 64, 42";

export function getBestiarySelectionStyle(): CSSProperties {
    return {
        ["--selection-rgb" as string]: BESTIARY_SELECTION_RGB,
        backgroundColor: "rgba(120, 64, 42, 0.09)",
        borderColor: "rgba(120, 64, 42, 0.42)",
        boxShadow: "0 8px 18px rgba(120, 64, 42, 0.12), 0 0 0 1px rgba(120, 64, 42, 0.18)",
    };
}

type SelectionBlobOverlayProps = {
    entryId: string;
    pulse: number;
};

export function SelectionBlobOverlay({ entryId, pulse }: SelectionBlobOverlayProps) {
    if (pulse <= 0) return null;

    return (
        <span
            key={`selection-blob-${entryId}-${pulse}`}
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 player-selection-blob"
        >
            <span className="player-selection-blob__inner">
                <span className="player-selection-blob__blobs">
                    <span className="player-selection-blob__blob" />
                    <span className="player-selection-blob__blob" />
                    <span className="player-selection-blob__blob" />
                    <span className="player-selection-blob__blob" />
                </span>
            </span>
        </span>
    );
}
