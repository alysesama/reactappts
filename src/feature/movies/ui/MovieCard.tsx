import { useEffect } from "react";
import "@/styles/movies/ui/MovieCard.css";
import type { TmdbMovie } from "../types/tmdbTypes";
import {
    preloadImage,
    tmdbImageUrl,
} from "../api/tmdbImage";

function formatYear(date?: string) {
    if (!date) return "";
    const year = date.slice(0, 4);
    return year && year !== "0000" ? year : "";
}

export default function MovieCard({
    movie,
    onClick,
}: {
    movie: TmdbMovie;
    onClick: () => void;
}) {
    const posterUrl = tmdbImageUrl(
        movie.poster_path,
        "w342"
    );

    useEffect(() => {
        preloadImage(posterUrl);
    }, [posterUrl]);

    const year = formatYear(movie.release_date);

    return (
        <button
            type="button"
            className="movie-card"
            onClick={onClick}
        >
            <span className="movie-card__poster">
                {posterUrl ? (
                    <img
                        src={posterUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <span className="movie-card__poster-fallback">
                        <i
                            className="fa-solid fa-film"
                            aria-hidden="true"
                        />
                    </span>
                )}
            </span>

            <span className="movie-card__info">
                <span className="movie-card__title">
                    {movie.title}
                </span>
                <span className="movie-card__meta">
                    {year ? `${year} · ` : ""}⭐{" "}
                    {movie.vote_average.toFixed(1)}
                </span>
            </span>
        </button>
    );
}
