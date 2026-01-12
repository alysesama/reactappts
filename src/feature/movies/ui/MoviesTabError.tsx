import "@/styles/movies/ui/MoviesTabError.css";

export default function MoviesTabError({
    error,
    onRetry,
    variant = "fill",
}: {
    error: string;
    onRetry: () => void;
    variant?: "fill" | "overlay" | "inline";
}) {
    return (
        <div
            className={`mv-tab-error mv-tab-error--${variant}`}
            role="alert"
        >
            <div className="mv-tab-error__log">
                {error || "Failed to load"}
            </div>
            <button
                type="button"
                className="mv-tab-error__btn"
                onClick={onRetry}
            >
                Refresh
            </button>
        </div>
    );
}
