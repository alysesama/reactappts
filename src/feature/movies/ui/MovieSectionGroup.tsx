import { Children, type ReactNode } from "react";
import "@/styles/movies/ui/MovieSectionGroup.css";

export default function MovieSectionGroup({
    children,
    className,
    variant = "default",
}: {
    children: ReactNode;
    className?: string;
    variant?: "default" | "single";
}) {
    const panels = Children.toArray(children);
    const isSingle = variant === "single";

    const cls = [
        "movies-section-group",
        isSingle ? "movies-section-group--single" : "",
        className ?? "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <section className={cls}>
            <div className="movies-section-group__body">
                {panels.map((p, idx) => (
                    <div
                        key={idx}
                        className="movies-section-group__panel"
                    >
                        {p}
                    </div>
                ))}
            </div>
        </section>
    );
}
