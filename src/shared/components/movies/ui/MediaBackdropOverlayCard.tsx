import { useEffect, useMemo } from "react";
import "@/styles/movies/ui/MediaBackdropOverlayCard.css";
import {
    preloadImage,
    tmdbImageUrl,
} from "../api/tmdbImage";
import { ratingColor } from "../utils/ratingColor";

export default function MediaBackdropOverlayCard({
    title,
    backdropPath,
    posterPath,
    genre,
    rating,
    onClick,
}: {
    title: string;
    backdropPath: string | null;
    posterPath: string | null;
    genre: string;
    rating: number;
    onClick: () => void;
}) {
    const imageUrl = useMemo(() => {
        return (
            tmdbImageUrl(backdropPath, "w780") ||
            tmdbImageUrl(posterPath, "w500") ||
            ""
        );
    }, [backdropPath, posterPath]);

    useEffect(() => {
        preloadImage(imageUrl);
    }, [imageUrl]);

    const ratingText = Number.isFinite(rating)
        ? rating.toFixed(1)
        : "0.0";

    return (
        <button
            type="button"
            className="mv-media-card"
            onClick={onClick}
        >
            <span className="mv-media-card__media">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <span className="mv-media-card__fallback">
                        <i
                            className="fa-solid fa-film"
                            aria-hidden="true"
                        />
                    </span>
                )}
            </span>

            <span className="mv-media-card__overlay">
                <span className="mv-media-card__top">
                    {genre ? (
                        <span className="mv-media-card__genre">
                            {genre}
                        </span>
                    ) : (
                        <span />
                    )}

                    <span
                        className="mv-media-card__rating"
                        style={{
                            backgroundColor:
                                ratingColor(rating),
                        }}
                    >
                        <span className="mv-media-card__rating-value">
                            {ratingText}
                        </span>
                    </span>
                </span>

                <span className="mv-media-card__title">
                    {title}
                </span>
            </span>
        </button>
    );
}
