import { useEffect, useMemo, useState } from "react";
import "@/styles/movies/ui/MovieDetailPanel.css";
import {
    preloadImage,
    tmdbImageUrl,
} from "../api/tmdbImage";
import type { TmdbTvDetails } from "../types/tmdbTypes";
import { ratingColor } from "../utils/ratingColor";
import {
    useTmdbMediaDetail,
    type TmdbMediaDetails,
    type TmdbMediaRef,
} from "../hooks/useTmdbMediaDetail";

function formatRuntime(runtime?: number) {
    if (!runtime) return "";
    const h = Math.floor(runtime / 60);
    const m = runtime % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
}

function isTvDetails(
    details: TmdbMediaDetails
): details is TmdbTvDetails {
    return "name" in details;
}

function formatYear(date?: string) {
    if (!date) return "";
    const year = date.slice(0, 4);
    return year && year !== "0000" ? year : "";
}

export default function MovieDetailPanel({
    media,
    onClose,
}: {
    media: TmdbMediaRef;
    onClose: () => void;
}) {
    const [renderMedia, setRenderMedia] =
        useState<TmdbMediaRef>(null);
    const [phase, setPhase] = useState<
        "opening" | "open" | "closing"
    >("open");

    useEffect(() => {
        if (media) {
            const t = window.setTimeout(() => {
                setRenderMedia(media);
                setPhase("opening");
                window.requestAnimationFrame(() => {
                    setPhase("open");
                });
            }, 0);
            return () => window.clearTimeout(t);
        }

        if (renderMedia) {
            const t1 = window.setTimeout(() => {
                setPhase("closing");
            }, 0);
            const t2 = window.setTimeout(() => {
                setRenderMedia(null);
                setPhase("open");
            }, 180);

            return () => {
                window.clearTimeout(t1);
                window.clearTimeout(t2);
            };
        }
    }, [media, renderMedia]);

    const { status, error, details, credits, videos } =
        useTmdbMediaDetail(renderMedia);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () =>
            window.removeEventListener(
                "keydown",
                onKeyDown
            );
    }, [onClose]);

    const isOpen = !!renderMedia;

    const title = useMemo(() => {
        if (!details) return "";
        if (isTvDetails(details)) {
            return details.name;
        }

        return details.title;
    }, [details]);

    const date = useMemo(() => {
        if (!details) return "";
        if (isTvDetails(details)) {
            return details.first_air_date ?? "";
        }

        return details.release_date ?? "";
    }, [details]);

    const year = useMemo(() => formatYear(date), [date]);

    const runtimeText = useMemo(() => {
        if (!details) return "";
        if (isTvDetails(details)) {
            const list = details.episode_run_time ?? [];
            const runtime = list.length
                ? list[0]
                : undefined;
            return formatRuntime(runtime);
        }

        return formatRuntime(details.runtime);
    }, [details]);

    const backdropUrl = useMemo(() => {
        if (!details) return "";
        return tmdbImageUrl(
            details.backdrop_path,
            "original"
        );
    }, [details]);

    const posterUrl = useMemo(() => {
        if (!details) return "";
        return tmdbImageUrl(details.poster_path, "w342");
    }, [details]);

    useEffect(() => {
        preloadImage(backdropUrl);
        preloadImage(posterUrl);
    }, [backdropUrl, posterUrl]);

    const topCast = useMemo(() => {
        const cast = credits?.cast ?? [];
        return [...cast]
            .sort(
                (a, b) =>
                    (a.order ?? 999) - (b.order ?? 999)
            )
            .slice(0, 8);
    }, [credits]);

    const trailer = useMemo(() => {
        const list = videos?.results ?? [];
        const yt = list.filter((v) => v.site === "YouTube");
        const trailerLike =
            yt.find((v) => v.type === "Trailer") ?? yt[0];
        return trailerLike ?? null;
    }, [videos]);

    if (!isOpen) return null;

    const overlayClass =
        phase === "open"
            ? "movie-detail-overlay movie-detail-overlay--open"
            : phase === "closing"
            ? "movie-detail-overlay movie-detail-overlay--closing"
            : "movie-detail-overlay";

    return (
        <div
            className={overlayClass}
            onMouseDown={() => onClose()}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="movie-detail"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="movie-detail__close-float"
                    onClick={() => onClose()}
                    aria-label="Close"
                >
                    <i
                        className="fa-solid fa-xmark"
                        aria-hidden="true"
                    />
                </button>

                <div className="movie-detail__body">
                    {!details ? (
                        <div
                            className={`movie-detail__placeholder ${
                                status === "error"
                                    ? "movie-detail__placeholder--error"
                                    : ""
                            }`}
                        >
                            {status === "loading" ? (
                                <div className="movie-detail__placeholder-text">
                                    Loading...
                                </div>
                            ) : status === "error" ? (
                                <div className="movie-detail__placeholder-text">
                                    {error ||
                                        "Failed to load"}
                                </div>
                            ) : (
                                <div className="movie-detail__placeholder-text">
                                    Loading...
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="movie-detail__content">
                            <header className="movie-detail__header">
                                <div className="movie-detail__header-bg">
                                    {backdropUrl ? (
                                        <img
                                            src={
                                                backdropUrl
                                            }
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : null}
                                </div>

                                <div className="movie-detail__header-main">
                                    <div className="movie-detail__poster">
                                        {posterUrl ? (
                                            <img
                                                src={
                                                    posterUrl
                                                }
                                                alt=""
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        ) : (
                                            <div className="movie-detail__poster-fallback">
                                                <i
                                                    className="fa-solid fa-film"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="movie-detail__headline">
                                        <div className="movie-detail__title-row">
                                            <div className="movie-detail__title">
                                                {title}
                                            </div>
                                            {year ? (
                                                <span className="movie-detail__year">
                                                    ({year})
                                                </span>
                                            ) : null}
                                            <span
                                                className="movie-detail__rating"
                                                style={{
                                                    color: ratingColor(
                                                        details.vote_average
                                                    ),
                                                }}
                                            >
                                                <i
                                                    className="fa-solid fa-star"
                                                    aria-hidden="true"
                                                />
                                                <span className="movie-detail__rating-value">
                                                    {details.vote_average.toFixed(
                                                        1
                                                    )}
                                                </span>
                                            </span>
                                        </div>

                                        {details.tagline ? (
                                            <div className="movie-detail__tagline">
                                                {
                                                    details.tagline
                                                }
                                            </div>
                                        ) : null}

                                        {details.genres &&
                                        details.genres
                                            .length ? (
                                            <div className="movie-detail__genres">
                                                {details.genres
                                                    .slice(
                                                        0,
                                                        8
                                                    )
                                                    .map(
                                                        (
                                                            g
                                                        ) => (
                                                            <span
                                                                key={
                                                                    g.id
                                                                }
                                                                className="movie-detail__genre"
                                                            >
                                                                {
                                                                    g.name
                                                                }
                                                            </span>
                                                        )
                                                    )}
                                            </div>
                                        ) : null}

                                        <div className="movie-detail__meta">
                                            {runtimeText ? (
                                                <span>
                                                    {
                                                        runtimeText
                                                    }
                                                </span>
                                            ) : null}
                                            {details.status ? (
                                                <span>
                                                    {runtimeText
                                                        ? " · "
                                                        : ""}
                                                    {
                                                        details.status
                                                    }
                                                </span>
                                            ) : null}
                                        </div>

                                        {trailer ? (
                                            <a
                                                className="movie-detail__trailer"
                                                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Trailer
                                            </a>
                                        ) : null}

                                        <div className="movie-detail__overview">
                                            {details.overview ||
                                                "No overview"}
                                        </div>
                                    </div>
                                </div>
                            </header>

                            <div className="movie-detail__additional">
                                <div className="movie-detail__grid">
                                    <section className="movie-detail__panel">
                                        <h3 className="movie-detail__panel-title">
                                            Cast
                                        </h3>
                                        {topCast.length ? (
                                            <div className="movie-detail__cast">
                                                {topCast.map(
                                                    (c) => {
                                                        const avatar =
                                                            tmdbImageUrl(
                                                                c.profile_path,
                                                                "w154"
                                                            );
                                                        preloadImage(
                                                            avatar
                                                        );
                                                        return (
                                                            <div
                                                                key={
                                                                    c.id
                                                                }
                                                                className="movie-detail__cast-item"
                                                            >
                                                                <div className="movie-detail__cast-avatar">
                                                                    {avatar ? (
                                                                        <img
                                                                            src={
                                                                                avatar
                                                                            }
                                                                            alt=""
                                                                            loading="lazy"
                                                                            decoding="async"
                                                                        />
                                                                    ) : (
                                                                        <span className="movie-detail__cast-avatar-fallback">
                                                                            <i
                                                                                className="fa-solid fa-user"
                                                                                aria-hidden="true"
                                                                            />
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="movie-detail__cast-name">
                                                                    {
                                                                        c.name
                                                                    }
                                                                </div>
                                                                {c.character ? (
                                                                    <div className="movie-detail__cast-role">
                                                                        {
                                                                            c.character
                                                                        }
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        ) : (
                                            <div className="movie-detail__muted">
                                                No cast data
                                            </div>
                                        )}
                                    </section>

                                    <section className="movie-detail__panel">
                                        <h3 className="movie-detail__panel-title">
                                            Quick info
                                        </h3>
                                        <div className="movie-detail__facts">
                                            {date ? (
                                                <div className="movie-detail__fact">
                                                    <span className="movie-detail__fact-k">
                                                        Release
                                                    </span>
                                                    <span className="movie-detail__fact-v">
                                                        {
                                                            date
                                                        }
                                                    </span>
                                                </div>
                                            ) : null}
                                            {details.vote_count ? (
                                                <div className="movie-detail__fact">
                                                    <span className="movie-detail__fact-k">
                                                        Votes
                                                    </span>
                                                    <span className="movie-detail__fact-v">
                                                        {
                                                            details.vote_count
                                                        }
                                                    </span>
                                                </div>
                                            ) : null}
                                            {details.homepage ? (
                                                <div className="movie-detail__fact">
                                                    <span className="movie-detail__fact-k">
                                                        Homepage
                                                    </span>
                                                    <span className="movie-detail__fact-v">
                                                        <a
                                                            className="movie-detail__link"
                                                            href={
                                                                details.homepage
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            Open
                                                        </a>
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
