import type { ReactNode } from "react";
import "@/styles/main/ContentContainer.css";

export default function ContentContainer({
    children,
}: {
    children: ReactNode;
}) {
    return <div className="app-content">{children}</div>;
}
