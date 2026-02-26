import { X } from "lucide-react";
import type { ReactNode } from "react";

type OverlayModalProps = {
    open: boolean;
    title?: ReactNode;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
    maxWidthClassName?: string;
    bodyClassName?: string;
};

export function OverlayModal({
    open,
    title,
    onClose,
    children,
    footer,
    maxWidthClassName = "max-w-3xl",
    bodyClassName = "",
}: OverlayModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div
                role="dialog"
                aria-modal="true"
                className={`w-full ${maxWidthClassName} max-h-[92vh] overflow-hidden rounded-lg border border-ring bg-panel shadow-[0_24px_64px_rgba(15,12,8,0.42)]`}
            >
                <div className="flex items-center justify-between border-b border-ring px-4 py-3">
                    <h2 className="text-base font-semibold text-ink">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-ring bg-white/70 text-ink-muted hover:text-ink hover:bg-white"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className={`p-4 ${bodyClassName}`.trim()}>{children}</div>
                {footer ? <div className="border-t border-ring px-4 py-3">{footer}</div> : null}
            </div>
        </div>
    );
}

