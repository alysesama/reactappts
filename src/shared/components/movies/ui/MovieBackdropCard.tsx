import { useEffect } from "react";
import "@/styles/movies/ui/MovieBackdropCard.css";
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

export default function MovieBackdropCard({
    movie,
    onClick,
}: {
    movie: TmdbMovie;
    onClick: () => void;
}) {
    const backdropUrl = tmdbImageUrl(
        movie.backdrop_path,
        "w780"
    );
    const posterUrl = tmdbImageUrl(
        movie.poster_path,
        "w342"
    );

    useEffect(() => {
        preloadImage(backdropUrl);
        preloadImage(posterUrl);
    }, [backdropUrl, posterUrl]);

    const year = formatYear(movie.release_date);

    return (
        <button
            type="button"
            className="movie-backdrop-card"
            onClick={onClick}
        >
            <span className="movie-backdrop-card__media">
                {backdropUrl ? (
                    <img
                        src={backdropUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                    />
                ) : posterUrl ? (
                    <img
                        src={posterUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <span className="movie-backdrop-card__fallback">
                        <i
                            className="fa-solid fa-film"
                            aria-hidden="true"
                        />
                    </span>
                )}
            </span>

            <span className="movie-backdrop-card__info">
                <span className="movie-backdrop-card__title">
                    {movie.title}
                </span>
                <span className="movie-backdrop-card__meta">
                    {year ? `${year} · ` : ""}⭐{" "}
                    {movie.vote_average.toFixed(1)}
                </span>
            </span>
        </button>
    );
}
