import React from "react";

type Props = React.PropsWithChildren<{
    onClick?: () => void;
    className?: string;
}>;

export default function ClickableRow({ onClick, children, className }: Props) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            className={
                "cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/40 " +
                (className ?? "")
            }
        >
            {children}
        </div>
    );
}
