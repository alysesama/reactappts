import "@/styles/movies/ui/SearchResults.css";
import type { TmdbMovie } from "../types/tmdbTypes";
import {
    preloadImage,
    tmdbImageUrl,
} from "../api/tmdbImage";
import { ratingColor } from "../utils/ratingColor";
import { useEffect } from "react";

function formatYear(date?: string) {
    if (!date) return "";
    const year = date.slice(0, 4);
    return year && year !== "0000" ? year : "";
}

export default function SearchResults({
    visible,
    status,
    error,
    results,
    onPickMovie,
}: {
    visible: boolean;
    status: "idle" | "loading" | "success" | "error";
    error: string;
    results: TmdbMovie[];
    onPickMovie: (movieId: number) => void;
}) {
    useEffect(() => {
        if (!visible) return;
        results.forEach((m) => {
            const url = tmdbImageUrl(m.poster_path, "w185");
            preloadImage(url);
        });
    }, [visible, results]);

    if (!visible) return null;

    return (
        <div
            className="movies-search-results"
            role="listbox"
        >
            {status === "loading" ? (
                <div className="movies-search-results__hint">
                    Searching...
                </div>
            ) : null}

            {status === "error" ? (
                <div className="movies-search-results__hint movies-search-results__hint--error">
                    {error || "Search failed"}
                </div>
            ) : null}

            {status === "success" &&
            results.length === 0 ? (
                <div className="movies-search-results__hint">
                    No results
                </div>
            ) : null}

            {results.map((m) => {
                const poster = tmdbImageUrl(
                    m.poster_path,
                    "w185"
                );
                const year = formatYear(m.release_date);
                const rating = m.vote_average ?? 0;
                const ratingText = Number.isFinite(rating)
                    ? rating.toFixed(1)
                    : "0.0";
                return (
                    <button
                        key={m.id}
                        type="button"
                        className="movies-search-results__item"
                        onClick={() => onPickMovie(m.id)}
                    >
                        <span className="movies-search-results__thumb">
                            {poster ? (
                                <img
                                    src={poster}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                />
                            ) : (
                                <span className="movies-search-results__thumb-fallback">
                                    <i
                                        className="fa-solid fa-film"
                                        aria-hidden="true"
                                    />
                                </span>
                            )}
                        </span>
                        <span className="movies-search-results__meta">
                            <span className="movies-search-results__title">
                                {m.title}
                            </span>
                            <span className="movies-search-results__sub">
                                {year ? (
                                    <span className="movies-search-results__year">
                                        {year}
                                    </span>
                                ) : null}

                                <span
                                    className="movies-search-results__rating"
                                    style={{
                                        color: ratingColor(
                                            rating
                                        ),
                                    }}
                                >
                                    <i
                                        className="fa-solid fa-star"
                                        aria-hidden="true"
                                    />
                                    <span className="movies-search-results__rating-value">
                                        {ratingText}
                                    </span>
                                </span>
                            </span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
