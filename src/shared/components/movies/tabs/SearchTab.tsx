import "@/styles/movies/tabs/SearchTab.css";
import {
    useCallback,
    useMemo,
    useRef,
    useState,
} from "react";
import MediaPosterOverlayCard from "../ui/MediaPosterOverlayCard";
import {
    useTmdbDiscoverSearch,
    type DiscoverFilters,
    type DiscoverSortBy,
} from "../hooks/useTmdbDiscoverSearch";
import { useTmdbGenres } from "../hooks/useTmdbGenres";
import { useTmdbTvGenres } from "../hooks/useTmdbTvGenres";

function todayIso() {
    const d = new Date();
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function splitKeywords(input: string) {
    return input
        .split(/[^\p{L}\p{N}]+/gu)
        .map((s) => s.trim())
        .filter(Boolean);
}

const RATING_MIN = 0;
const RATING_MAX = 10;
const DURATION_MIN = 0;
const DURATION_MAX = 300;

const DEFAULT_MOVIE_FILTERS: DiscoverFilters = {
    mediaType: "movie",
    keywords: [],
    sortBy: "popularity.desc",
    genreIds: [],
    releaseFrom: "",
    releaseTo: todayIso(),
    originalLanguage: "",
    ratingMin: RATING_MIN,
    ratingMax: RATING_MAX,
    durationMin: DURATION_MIN,
    durationMax: DURATION_MAX,
};

function DualRange({
    min,
    max,
    step,
    valueMin,
    valueMax,
    disabled,
    onChange,
}: {
    min: number;
    max: number;
    step: number;
    valueMin: number;
    valueMax: number;
    disabled?: boolean;
    onChange: (nextMin: number, nextMax: number) => void;
}) {
    const span = max - min || 1;
    const pctMin = ((valueMin - min) / span) * 100;
    const pctMax = ((valueMax - min) / span) * 100;

    return (
        <div
            className={`mv-search__dual-range${
                disabled ? " is-disabled" : ""
            }`}
            style={{
                ["--mv-range-min" as string]: `${pctMin}%`,
                ["--mv-range-max" as string]: `${pctMax}%`,
            }}
        >
            <div className="mv-search__dual-range-track" />
            <input
                className="mv-search__dual-range-input"
                type="range"
                min={min}
                max={max}
                step={step}
                value={valueMin}
                disabled={disabled}
                onChange={(e) => {
                    const nextMin = Number(e.target.value);
                    const clampedMin =
                        nextMin > valueMax
                            ? valueMax
                            : nextMin;
                    onChange(clampedMin, valueMax);
                }}
            />
            <input
                className="mv-search__dual-range-input"
                type="range"
                min={min}
                max={max}
                step={step}
                value={valueMax}
                disabled={disabled}
                onChange={(e) => {
                    const nextMax = Number(e.target.value);
                    const clampedMax =
                        nextMax < valueMin
                            ? valueMin
                            : nextMax;
                    onChange(valueMin, clampedMax);
                }}
            />
        </div>
    );
}

export default function SearchTab({
    onPickMedia,
}: {
    onPickMedia: (media: {
        type: "movie" | "tv";
        id: number;
    }) => void;
}) {
    const { genres: movieGenres, genreMap: movieGenreMap } =
        useTmdbGenres();
    const { genres: tvGenres, genreMap: tvGenreMap } =
        useTmdbTvGenres();

    const [draft, setDraft] = useState<DiscoverFilters>(
        DEFAULT_MOVIE_FILTERS
    );
    const [applied, setApplied] = useState<DiscoverFilters>(
        DEFAULT_MOVIE_FILTERS
    );

    const [keywordInput, setKeywordInput] =
        useState<string>("");

    const activeGenreList =
        draft.mediaType === "movie"
            ? movieGenres
            : tvGenres;

    const activeGenreMap =
        applied.mediaType === "movie"
            ? movieGenreMap
            : tvGenreMap;

    const { status, error, items, hasMore, loadMore } =
        useTmdbDiscoverSearch(applied);

    const scrollerRef = useRef<HTMLDivElement | null>(null);

    const handleScroll = useCallback(() => {
        const el = scrollerRef.current;
        if (!el) return;

        const thresholdPx = 140;
        const dist =
            el.scrollHeight -
            el.scrollTop -
            el.clientHeight;
        if (dist < thresholdPx) {
            loadMore();
        }
    }, [loadMore]);

    const handleApply = useCallback(() => {
        setKeywordInput(draft.keywords.join(", "));
        setApplied(draft);
    }, [draft]);

    const sortOptions = useMemo(() => {
        if (draft.mediaType === "tv") {
            return [
                {
                    value: "popularity.desc",
                    label: "Popularity ↓",
                },
                {
                    value: "popularity.asc",
                    label: "Popularity ↑",
                },
                {
                    value: "vote_average.desc",
                    label: "Rating ↓",
                },
                {
                    value: "vote_average.asc",
                    label: "Rating ↑",
                },
                {
                    value: "first_air_date.desc",
                    label: "First air date ↓",
                },
                {
                    value: "first_air_date.asc",
                    label: "First air date ↑",
                },
                { value: "name.asc", label: "Title A→Z" },
                { value: "name.desc", label: "Title Z→A" },
            ] as Array<{ value: string; label: string }>;
        }

        return [
            {
                value: "popularity.desc",
                label: "Popularity ↓",
            },
            {
                value: "popularity.asc",
                label: "Popularity ↑",
            },
            {
                value: "vote_average.desc",
                label: "Rating ↓",
            },
            {
                value: "vote_average.asc",
                label: "Rating ↑",
            },
            {
                value: "primary_release_date.desc",
                label: "Release date ↓",
            },
            {
                value: "primary_release_date.asc",
                label: "Release date ↑",
            },
            {
                value: "original_title.asc",
                label: "Title A→Z",
            },
            {
                value: "original_title.desc",
                label: "Title Z→A",
            },
        ] as Array<{ value: string; label: string }>;
    }, [draft.mediaType]);

    return (
        <div className="movies-tab movies-tab--search">
            <div className="mv-search">
                <form
                    className="mv-search__filters"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleApply();
                    }}
                >
                    <div className="mv-search__section">
                        <div className="mv-search__label-row">
                            <div className="mv-search__section-title">
                                Type
                            </div>
                            <div className="mv-search__row">
                                <button
                                    type="button"
                                    className={`mv-search__pill${
                                        draft.mediaType ===
                                        "movie"
                                            ? " is-active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        setDraft((p) => ({
                                            ...p,
                                            mediaType:
                                                "movie",
                                            sortBy: "popularity.desc",
                                            durationMin:
                                                DURATION_MIN,
                                            durationMax:
                                                DURATION_MAX,
                                        }))
                                    }
                                >
                                    Movie
                                </button>
                                <button
                                    type="button"
                                    className={`mv-search__pill${
                                        draft.mediaType ===
                                        "tv"
                                            ? " is-active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        setDraft((p) => ({
                                            ...p,
                                            mediaType: "tv",
                                            sortBy: "popularity.desc",
                                            durationMin:
                                                DURATION_MIN,
                                            durationMax:
                                                DURATION_MAX,
                                        }))
                                    }
                                >
                                    TV
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mv-search__section">
                        <div className="mv-search__section-title">
                            Keyword
                        </div>
                        <input
                            className="mv-search__input"
                            value={keywordInput}
                            onChange={(e) => {
                                const v = e.target.value;
                                setKeywordInput(v);
                                setDraft((p) => ({
                                    ...p,
                                    keywords:
                                        splitKeywords(v),
                                }));
                            }}
                            placeholder="Input some keywords..."
                        />
                    </div>

                    <div className="mv-search__section">
                        <div className="mv-search__label-row">
                            <div className="mv-search__section-title">
                                Sort
                            </div>
                            <select
                                className="mv-search__select"
                                value={draft.sortBy}
                                onChange={(e) =>
                                    setDraft((p) => ({
                                        ...p,
                                        sortBy: e.target
                                            .value as DiscoverSortBy,
                                    }))
                                }
                            >
                                {sortOptions.map((o) => (
                                    <option
                                        key={o.value}
                                        value={o.value}
                                    >
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mv-search__section">
                        <div className="mv-search__section-title">
                            Genres
                        </div>
                        <div className="mv-search__genre-grid">
                            {activeGenreList.map((g) => {
                                const isOn =
                                    draft.genreIds.includes(
                                        g.id
                                    );
                                return (
                                    <button
                                        key={g.id}
                                        type="button"
                                        className={`mv-search__chip${
                                            isOn
                                                ? " is-active"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            setDraft(
                                                (p) => {
                                                    const has =
                                                        p.genreIds.includes(
                                                            g.id
                                                        );
                                                    return {
                                                        ...p,
                                                        genreIds:
                                                            has
                                                                ? p.genreIds.filter(
                                                                      (
                                                                          x
                                                                      ) =>
                                                                          x !==
                                                                          g.id
                                                                  )
                                                                : [
                                                                      ...p.genreIds,
                                                                      g.id,
                                                                  ],
                                                    };
                                                }
                                            )
                                        }
                                    >
                                        {g.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mv-search__section">
                        <div className="mv-search__section-title">
                            Release date
                        </div>
                        <div className="mv-search__column">
                            <div className="mv-search__date-column">
                                <div className="mv-search__mini-label">
                                    From
                                </div>
                                <input
                                    className="mv-search__input"
                                    type="date"
                                    value={
                                        draft.releaseFrom
                                    }
                                    onChange={(e) =>
                                        setDraft((p) => ({
                                            ...p,
                                            releaseFrom:
                                                e.target
                                                    .value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="mv-search__date-column">
                                <div className="mv-search__mini-label">
                                    To
                                </div>
                                <input
                                    className="mv-search__input"
                                    type="date"
                                    value={draft.releaseTo}
                                    onChange={(e) =>
                                        setDraft((p) => ({
                                            ...p,
                                            releaseTo:
                                                e.target
                                                    .value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mv-search__section">
                        <div className="mv-search__label-row">
                            <div className="mv-search__section-title">
                                Language
                            </div>
                            <input
                                className="mv-search__input"
                                value={
                                    draft.originalLanguage
                                }
                                onChange={(e) =>
                                    setDraft((p) => ({
                                        ...p,
                                        originalLanguage:
                                            e.target.value,
                                    }))
                                }
                                placeholder='e.g. "en", "ja"'
                            />
                        </div>
                    </div>

                    <div className="mv-search__section">
                        <div className="mv-search__section-title">
                            Ranges
                        </div>

                        <div className="mv-search__range">
                            <div className="mv-search__range-label">
                                Rating:{" "}
                                {draft.ratingMin.toFixed(1)}{" "}
                                -{" "}
                                {draft.ratingMax.toFixed(1)}
                            </div>
                            <DualRange
                                min={RATING_MIN}
                                max={RATING_MAX}
                                step={0.1}
                                valueMin={draft.ratingMin}
                                valueMax={draft.ratingMax}
                                onChange={(
                                    nextMin,
                                    nextMax
                                ) =>
                                    setDraft((p) => ({
                                        ...p,
                                        ratingMin: nextMin,
                                        ratingMax: nextMax,
                                    }))
                                }
                            />
                        </div>

                        <div className="mv-search__range">
                            <div className="mv-search__range-label">
                                Duration (movie only):{" "}
                                {draft.durationMin || 0} -{" "}
                                {draft.durationMax || 0}
                            </div>
                            <DualRange
                                min={DURATION_MIN}
                                max={DURATION_MAX}
                                step={1}
                                valueMin={draft.durationMin}
                                valueMax={draft.durationMax}
                                disabled={
                                    draft.mediaType !==
                                    "movie"
                                }
                                onChange={(
                                    nextMin,
                                    nextMax
                                ) =>
                                    setDraft((p) => ({
                                        ...p,
                                        durationMin:
                                            nextMin,
                                        durationMax:
                                            nextMax,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div className="mv-search__section">
                        <button
                            type="submit"
                            className="mv-search__apply"
                        >
                            Search
                        </button>
                    </div>
                </form>

                <div
                    className="mv-search__results"
                    ref={scrollerRef}
                    onScroll={handleScroll}
                >
                    {status === "error" ? (
                        <div className="movies-tab__error">
                            {error || "Failed to load"}
                        </div>
                    ) : null}

                    <div className="mv-search__grid">
                        {items.map((it) => {
                            const genreId =
                                it.genre_ids?.[0];
                            const genre = genreId
                                ? activeGenreMap[genreId] ??
                                  ""
                                : "";

                            return (
                                <div
                                    key={`${it.mediaType}-${it.id}`}
                                    className="mv-search__cell"
                                >
                                    <MediaPosterOverlayCard
                                        title={it.title}
                                        posterPath={
                                            it.poster_path
                                        }
                                        genre={genre}
                                        rating={
                                            it.vote_average
                                        }
                                        onClick={() =>
                                            onPickMedia({
                                                type: it.mediaType,
                                                id: it.id,
                                            })
                                        }
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {status === "loading" &&
                    items.length === 0 ? (
                        <div className="movies-tab__loading">
                            Loading...
                        </div>
                    ) : null}

                    {hasMore ? (
                        <div className="mv-search__loadmore">
                            Scroll to load more...
                        </div>
                    ) : (
                        <div className="mv-search__loadmore">
                            End
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
