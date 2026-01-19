import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import "@/styles/movies/ui/MediaBackdropOverlayCard.css";
import {
    preloadImage,
    tmdbImageUrl,
} from "../api/tmdbImage";
import { tmdbPost } from "../api/tmdbClient";
import type {
    UserListItem,
    UserListsStatus,
} from "../hooks/useTmdbUserLists";
import { ratingColor } from "../utils/ratingColor";

export default function MediaBackdropOverlayCard({
    mediaType,
    mediaId,
    title,
    backdropPath,
    posterPath,
    genre,
    rating,
    onClick,
    accountId,
    sessionId,
    userListsStatus,
    isFavorite,
    isWatchlist,
    setFavoriteLocal,
    setWatchlistLocal,
}: {
    mediaType: "movie" | "tv";
    mediaId: number;
    title: string;
    backdropPath: string | null;
    posterPath: string | null;
    genre: string;
    rating: number;
    onClick: () => void;
    accountId: string;
    sessionId: string;
    userListsStatus: UserListsStatus;
    isFavorite: (
        mediaType: "movie" | "tv",
        id: number,
    ) => boolean;
    isWatchlist: (
        mediaType: "movie" | "tv",
        id: number,
    ) => boolean;
    setFavoriteLocal: (
        item: UserListItem,
        active: boolean,
    ) => void;
    setWatchlistLocal: (
        item: UserListItem,
        active: boolean,
    ) => void;
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

    const [isFavoritePending, setIsFavoritePending] =
        useState(false);
    const [isWatchlistPending, setIsWatchlistPending] =
        useState(false);

    useEffect(() => {
        setIsFavoritePending(false);
        setIsWatchlistPending(false);
    }, [mediaId]);

    const canMutate =
        !!accountId &&
        !!sessionId &&
        userListsStatus !== "loading";

    const favActive = isFavorite(mediaType, mediaId);
    const wlActive = isWatchlist(mediaType, mediaId);

    const buildItem = useCallback((): UserListItem => {
        return {
            id: mediaId,
            mediaType,
            title,
            poster_path: posterPath,
            vote_average: rating,
        };
    }, [mediaId, mediaType, posterPath, rating, title]);

    const toggleFavorite = useCallback(
        async (next: boolean) => {
            if (!canMutate) return;
            if (isFavoritePending) return;

            setIsFavoritePending(true);
            try {
                await tmdbPost<unknown>(
                    `/account/${accountId}/favorite`,
                    {
                        media_type: mediaType,
                        media_id: mediaId,
                        favorite: next,
                    },
                    { session_id: sessionId },
                );
                setFavoriteLocal(buildItem(), next);
            } finally {
                setIsFavoritePending(false);
            }
        },
        [
            accountId,
            buildItem,
            canMutate,
            isFavoritePending,
            mediaId,
            mediaType,
            sessionId,
            setFavoriteLocal,
        ],
    );

    const toggleWatchlist = useCallback(
        async (next: boolean) => {
            if (!canMutate) return;
            if (isWatchlistPending) return;

            setIsWatchlistPending(true);
            try {
                await tmdbPost<unknown>(
                    `/account/${accountId}/watchlist`,
                    {
                        media_type: mediaType,
                        media_id: mediaId,
                        watchlist: next,
                    },
                    { session_id: sessionId },
                );
                setWatchlistLocal(buildItem(), next);
            } finally {
                setIsWatchlistPending(false);
            }
        },
        [
            accountId,
            buildItem,
            canMutate,
            isWatchlistPending,
            mediaId,
            mediaType,
            sessionId,
            setWatchlistLocal,
        ],
    );

    return (
        <div
            className="mv-media-card"
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick();
                }
            }}
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

                    <span className="mv-media-card__side">
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

                        <span className="mv-media-card__actions">
                            <button
                                type="button"
                                className={
                                    favActive
                                        ? "mv-media-card__action mv-media-card__action--favorite mv-media-card__action--active"
                                        : "mv-media-card__action mv-media-card__action--favorite"
                                }
                                aria-label="Toggle favorite"
                                aria-pressed={favActive}
                                disabled={
                                    !canMutate ||
                                    isFavoritePending
                                }
                                onClick={(e) => {
                                    e.stopPropagation();
                                    void toggleFavorite(
                                        !favActive,
                                    );
                                }}
                            >
                                <i
                                    className="fa-solid fa-heart"
                                    aria-hidden="true"
                                />
                            </button>
                            <button
                                type="button"
                                className={
                                    wlActive
                                        ? "mv-media-card__action mv-media-card__action--watchlist mv-media-card__action--active"
                                        : "mv-media-card__action mv-media-card__action--watchlist"
                                }
                                aria-label="Toggle watchlist"
                                aria-pressed={wlActive}
                                disabled={
                                    !canMutate ||
                                    isWatchlistPending
                                }
                                onClick={(e) => {
                                    e.stopPropagation();
                                    void toggleWatchlist(
                                        !wlActive,
                                    );
                                }}
                            >
                                <i
                                    className="fa-solid fa-bookmark"
                                    aria-hidden="true"
                                />
                            </button>
                        </span>
                    </span>
                </span>

                <span className="mv-media-card__title">
                    {title}
                </span>
            </span>
        </div>
    );
}
