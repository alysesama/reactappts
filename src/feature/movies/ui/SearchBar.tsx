import { useEffect, useRef, type ReactNode } from "react";
import "@/styles/movies/ui/SearchBar.css";

export default function SearchBar({
    value,
    onChange,
    onFocus,
    onClear,
    placeholder,
    right,
}: {
    value: string;
    onChange: (value: string) => void;
    onFocus?: () => void;
    onClear?: () => void;
    placeholder?: string;
    right?: ReactNode;
}) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        // keep focus UX friendly when coming back from detail panel
        const el = inputRef.current;
        if (!el) return;
    }, []);

    return (
        <div className="movies-search">
            <div className="movies-search__bar">
                <i
                    className="fa-solid fa-magnifying-glass"
                    aria-hidden="true"
                />
                <input
                    ref={inputRef}
                    className="movies-search__input"
                    value={value}
                    onChange={(e) =>
                        onChange(e.target.value)
                    }
                    onFocus={() => onFocus?.()}
                    placeholder={
                        placeholder ?? "Search movies..."
                    }
                    spellCheck={false}
                />
                {right ? right : null}
                {value ? (
                    <button
                        type="button"
                        className="movies-search__clear"
                        onClick={() => {
                            onChange("");
                            onClear?.();
                        }}
                        aria-label="Clear"
                    >
                        ×
                    </button>
                ) : null}
            </div>
        </div>
    );
}
