import "@/styles/movies/tabs/Section2Tab.css";
import type { ReactNode } from "react";

export default function Section2TabShell({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="mv-s2-tab">
            <div className="mv-s2-tab__header">
                <div className="mv-s2-tab__label">
                    {label}
                </div>
                <div className="mv-s2-tab__line" />
            </div>
            <div className="mv-s2-tab__body">
                {children}
            </div>
        </div>
    );
}
