import React from "react";

type Props = React.PropsWithChildren<{
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
}>;

export default function ClickableRow({ onClick, children, className, style }: Props) {
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
            style={style}
        >
            {children}
        </div>
    );
}
