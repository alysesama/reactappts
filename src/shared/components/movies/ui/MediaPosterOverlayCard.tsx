import { useEffect, useMemo } from "react";
import "@/styles/movies/ui/MediaPosterOverlayCard.css";
import {
    preloadImage,
    tmdbImageUrl,
} from "../api/tmdbImage";
import { ratingColor } from "../utils/ratingColor";

export default function MediaPosterOverlayCard({
    title,
    posterPath,
    genre,
    rating,
    onClick,
}: {
    title: string;
    posterPath: string | null;
    genre: string;
    rating: number;
    onClick: () => void;
}) {
    const imageUrl = useMemo(() => {
        return tmdbImageUrl(posterPath, "w342") || "";
    }, [posterPath]);

    useEffect(() => {
        preloadImage(imageUrl);
    }, [imageUrl]);

    const ratingText = Number.isFinite(rating)
        ? rating.toFixed(1)
        : "0.0";

    return (
        <button
            type="button"
            className="mv-poster-card"
            onClick={onClick}
        >
            <span className="mv-poster-card__media">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <span className="mv-poster-card__fallback">
                        <i
                            className="fa-solid fa-film"
                            aria-hidden="true"
                        />
                    </span>
                )}
            </span>

            <span className="mv-poster-card__overlay">
                <span className="mv-poster-card__top">
                    {genre ? (
                        <span className="mv-poster-card__genre">
                            {genre}
                        </span>
                    ) : (
                        <span />
                    )}

                    <span
                        className="mv-poster-card__rating"
                        style={{
                            backgroundColor:
                                ratingColor(rating),
                        }}
                    >
                        <span className="mv-poster-card__rating-value">
                            {ratingText}
                        </span>
                    </span>
                </span>

                <span className="mv-poster-card__title">
                    {title}
                </span>
            </span>
        </button>
    );
}
