import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import "@/styles/main/ContentContainer.css";

export default function ContentContainer({
    children,
}: {
    children: ReactNode;
}) {
    const location = useLocation();

    return (
        <div className="app-content">
            <div
                key={location.pathname}
                className="app-content__page"
            >
                {children}
            </div>
        </div>
    );
}
