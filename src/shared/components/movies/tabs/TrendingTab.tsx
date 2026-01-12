import "@/styles/movies/tabs/TrendingTab.css";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    preloadImage,
    tmdbImageUrl,
} from "../api/tmdbImage";
import { useTmdbGenres } from "../hooks/useTmdbGenres";
import { useTmdbMovieList } from "../hooks/useTmdbMovieList";

const CROSSFADE_MS = 1200;
const AUTO_SWITCH_MS = 6500;

function clamp01(v: number) {
    return Math.min(1, Math.max(0, v));
}

function ratingColor(rating0to10: number) {
    const t = clamp01(rating0to10 / 10);

    const r0 = 239;
    const g0 = 68;
    const b0 = 68;

    const r1 = 34;
    const g1 = 197;
    const b1 = 94;

    const r = Math.round(r0 + (r1 - r0) * t);
    const g = Math.round(g0 + (g1 - g0) * t);
    const b = Math.round(b0 + (b1 - b0) * t);

    return `rgb(${r}, ${g}, ${b})`;
}

export default function TrendingTab({
    onPickMovie,
}: {
    onPickMovie: (movieId: number) => void;
}) {
    const { status, error, movies } = useTmdbMovieList(
        "/trending/movie/day"
    );

    const { genreMap } = useTmdbGenres();

    const items = useMemo(
        () => movies.slice(0, 5),
        [movies]
    );

    const [activeIndex, setActiveIndex] = useState(0);
    const [prevIndex, setPrevIndex] = useState<
        number | null
    >(null);
    const [isTransitioning, setIsTransitioning] =
        useState(false);
    const activeIndexRef = useRef(0);
    const clearPrevTimeoutRef = useRef<number | null>(null);
    const autoTimeoutRef = useRef<number | null>(null);
    const isTransitioningRef = useRef(false);
    const autoTickRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        activeIndexRef.current = activeIndex;
    }, [activeIndex]);

    useEffect(() => {
        isTransitioningRef.current = isTransitioning;
    }, [isTransitioning]);

    useEffect(() => {
        const id = window.setTimeout(() => {
            setActiveIndex(0);
            setPrevIndex(null);
            setIsTransitioning(false);
            isTransitioningRef.current = false;
        }, 0);

        return () => {
            window.clearTimeout(id);
        };
    }, [items.length]);

    const scheduleClearPrev = useCallback(() => {
        if (clearPrevTimeoutRef.current !== null) {
            window.clearTimeout(
                clearPrevTimeoutRef.current
            );
        }

        clearPrevTimeoutRef.current = window.setTimeout(
            () => {
                setPrevIndex(null);
                setIsTransitioning(false);
                isTransitioningRef.current = false;
                clearPrevTimeoutRef.current = null;
            },
            CROSSFADE_MS
        );
    }, []);

    useEffect(() => {
        return () => {
            if (clearPrevTimeoutRef.current !== null) {
                window.clearTimeout(
                    clearPrevTimeoutRef.current
                );
            }

            if (autoTimeoutRef.current !== null) {
                window.clearTimeout(autoTimeoutRef.current);
            }
        };
    }, []);

    const transitionTo = useCallback(
        (nextIndex: number) => {
            if (items.length < 2) return;
            if (isTransitioningRef.current) return;

            const current = activeIndexRef.current;
            if (current === nextIndex) return;

            setIsTransitioning(true);
            isTransitioningRef.current = true;

            setPrevIndex(current);
            setActiveIndex(nextIndex);
            activeIndexRef.current = nextIndex;

            scheduleClearPrev();
        },
        [items.length, scheduleClearPrev]
    );

    const scheduleAutoSwitch = useCallback(() => {
        if (autoTimeoutRef.current !== null) {
            window.clearTimeout(autoTimeoutRef.current);
        }
        if (items.length < 2) return;

        autoTimeoutRef.current = window.setTimeout(() => {
            autoTickRef.current?.();
        }, AUTO_SWITCH_MS);
    }, [items.length]);

    useEffect(() => {
        if (items.length < 2) {
            autoTickRef.current = null;
            return;
        }

        autoTickRef.current = () => {
            const current = activeIndexRef.current;
            const next = (current + 1) % items.length;
            transitionTo(next);
            scheduleAutoSwitch();
        };
    }, [items.length, scheduleAutoSwitch, transitionTo]);

    useEffect(() => {
        scheduleAutoSwitch();
        return () => {
            if (autoTimeoutRef.current !== null) {
                window.clearTimeout(autoTimeoutRef.current);
                autoTimeoutRef.current = null;
            }
        };
    }, [scheduleAutoSwitch]);

    const active = items[activeIndex];
    const prev =
        prevIndex !== null ? items[prevIndex] : undefined;

    const getBackdropUrl = useCallback(
        (m?: typeof active) => {
            if (!m) return "";
            return (
                tmdbImageUrl(m.backdrop_path, "original") ||
                tmdbImageUrl(m.poster_path, "w780") ||
                ""
            );
        },
        []
    );

    const activeBackdropUrl = useMemo(() => {
        return getBackdropUrl(active);
    }, [active, getBackdropUrl]);

    const prevBackdropUrl = useMemo(() => {
        return getBackdropUrl(prev);
    }, [getBackdropUrl, prev]);

    useEffect(() => {
        items.forEach((m) => {
            const url = getBackdropUrl(m);
            preloadImage(url);
        });
    }, [getBackdropUrl, items]);

    useEffect(() => {
        if (!activeBackdropUrl) return;
        preloadImage(activeBackdropUrl);

        const next =
            items[(activeIndex + 1) % (items.length || 1)];
        if (!next) return;
        const nextUrl =
            tmdbImageUrl(next.backdrop_path, "original") ||
            tmdbImageUrl(next.poster_path, "w780") ||
            "";
        preloadImage(nextUrl);
    }, [activeBackdropUrl, activeIndex, items]);

    const handlePrev = useCallback(() => {
        if (items.length < 2) return;
        if (isTransitioningRef.current) return;

        const current = activeIndexRef.current;
        const next =
            (current - 1 + items.length) % items.length;
        transitionTo(next);
        scheduleAutoSwitch();
    }, [items.length, scheduleAutoSwitch, transitionTo]);

    const handleNext = useCallback(() => {
        if (items.length < 2) return;
        if (isTransitioningRef.current) return;

        const current = activeIndexRef.current;
        const next = (current + 1) % items.length;
        transitionTo(next);
        scheduleAutoSwitch();
    }, [items.length, scheduleAutoSwitch, transitionTo]);

    const activeGenres = useMemo(() => {
        const ids = active?.genre_ids ?? [];
        if (!ids.length) return [] as string[];
        return ids
            .map((id) => genreMap[id] ?? `Genre ${id}`)
            .slice(0, 3);
    }, [active, genreMap]);

    const activeOverview = (active?.overview ?? "").trim();
    const activeRating = active?.vote_average ?? 0;
    const activeRatingText = active
        ? activeRating.toFixed(1)
        : "";

    return (
        <div className="movies-tab movies-tab--trending">
            <div className="movies-tab__header">
                <div className="movies-tab__label">
                    Trending
                </div>
            </div>

            {status === "error" ? (
                <div className="movies-trending-carousel__error">
                    {error || "Failed to load"}
                </div>
            ) : null}

            <div className="movies-trending-carousel">
                <button
                    type="button"
                    className="movies-trending-carousel__nav movies-trending-carousel__nav--prev"
                    aria-label="Previous"
                    onClick={handlePrev}
                    disabled={
                        items.length < 2 || isTransitioning
                    }
                >
                    <span className="movies-trending-carousel__nav-icon">
                        <i
                            className="fa-solid fa-angle-left"
                            aria-hidden="true"
                        />
                    </span>
                </button>

                <button
                    type="button"
                    className="movies-trending-carousel__nav movies-trending-carousel__nav--next"
                    aria-label="Next"
                    onClick={handleNext}
                    disabled={
                        items.length < 2 || isTransitioning
                    }
                >
                    <span className="movies-trending-carousel__nav-icon">
                        <i
                            className="fa-solid fa-angle-right"
                            aria-hidden="true"
                        />
                    </span>
                </button>

                {prev ? (
                    <div className="movies-trending-carousel__slide movies-trending-carousel__slide--prev">
                        <span className="movies-trending-carousel__media">
                            {prevBackdropUrl ? (
                                <img
                                    src={prevBackdropUrl}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                />
                            ) : (
                                <span className="movies-trending-carousel__fallback" />
                            )}
                        </span>
                    </div>
                ) : null}

                <button
                    type="button"
                    key={active?.id ?? "empty"}
                    className="movies-trending-carousel__slide movies-trending-carousel__slide--active"
                    onClick={() =>
                        active
                            ? onPickMovie(active.id)
                            : undefined
                    }
                    disabled={!active}
                >
                    <span className="movies-trending-carousel__media">
                        {activeBackdropUrl ? (
                            <img
                                src={activeBackdropUrl}
                                alt=""
                                loading="lazy"
                                decoding="async"
                            />
                        ) : (
                            <span className="movies-trending-carousel__fallback" />
                        )}
                    </span>

                    <span className="movies-trending-carousel__text">
                        <span className="movies-trending-carousel__title-row">
                            <span className="movies-trending-carousel__title">
                                {active?.title ?? ""}
                            </span>
                            {active ? (
                                <span
                                    className="movies-trending-carousel__rating"
                                    style={{
                                        color: ratingColor(
                                            activeRating
                                        ),
                                    }}
                                >
                                    <i
                                        className="fa-solid fa-star"
                                        aria-hidden="true"
                                    />
                                    <span className="movies-trending-carousel__rating-value">
                                        {activeRatingText}
                                    </span>
                                </span>
                            ) : null}
                        </span>
                        {activeGenres.length ? (
                            <span className="movies-trending-carousel__genres">
                                {activeGenres.map((g) => (
                                    <span
                                        key={g}
                                        className="movies-trending-carousel__genre-pill"
                                    >
                                        {g}
                                    </span>
                                ))}
                            </span>
                        ) : null}
                        {activeOverview ? (
                            <span className="movies-trending-carousel__overview">
                                {activeOverview}
                            </span>
                        ) : null}
                    </span>
                </button>

                {status === "loading" &&
                items.length === 0 ? (
                    <div className="movies-trending-carousel__loading">
                        Loading...
                    </div>
                ) : null}
            </div>
        </div>
    );
}
