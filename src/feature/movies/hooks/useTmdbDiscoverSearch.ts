import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tmdbGet } from "../api/tmdbClient";
import type {
    TmdbMovie,
    TmdbPagedResult,
    TmdbTv,
} from "../types/tmdbTypes";
import type { RemoteStatus } from "./useTmdbMovieList";

export type DiscoverMediaType = "movie" | "tv";

export type DiscoverSortByMovie =
    | "popularity.desc"
    | "popularity.asc"
    | "vote_average.desc"
    | "vote_average.asc"
    | "primary_release_date.desc"
    | "primary_release_date.asc"
    | "original_title.asc"
    | "original_title.desc";

export type DiscoverSortByTv =
    | "popularity.desc"
    | "popularity.asc"
    | "vote_average.desc"
    | "vote_average.asc"
    | "first_air_date.desc"
    | "first_air_date.asc"
    | "name.asc"
    | "name.desc";

export type DiscoverSortBy = DiscoverSortByMovie | DiscoverSortByTv;

export type DiscoverFilters = {
    mediaType: DiscoverMediaType;
    keywords: string[];
    sortBy: DiscoverSortBy;
    genreIds: number[];
    releaseFrom: string;
    releaseTo: string;
    originalLanguage: string;
    ratingMin: number;
    ratingMax: number;
    durationMin: number;
    durationMax: number;
};

export type SearchMediaItem = {
    id: number;
    mediaType: DiscoverMediaType;
    title: string;
    poster_path: string | null;
    genre_ids: number[];
    vote_average: number;
};

const DISCOVER_BAD_DATA_ERROR = "Something is wrong when load movie data.";

type TmdbKeyword = {
    id: number;
    name: string;
};

type TmdbKeywordSearchResult = TmdbPagedResult<TmdbKeyword>;

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

function isNonEmptyString(v: unknown) {
    return typeof v === "string" && v.trim().length > 0;
}

async function resolveKeywordIds(
    keywords: string[],
    signal: AbortSignal
) {
    const trimmed = keywords
        .map((k) => k.trim())
        .filter(Boolean);
    if (trimmed.length === 0) return [] as number[];

    const ids = await Promise.all(
        trimmed.map(async (q) => {
            const data = await tmdbGet<TmdbKeywordSearchResult>(
                "/search/keyword",
                { query: q, page: 1 },
                signal
            );
            return data.results?.[0]?.id ?? null;
        })
    );

    return ids.filter((x): x is number => typeof x === "number");
}

function buildDiscoverParams(
    filters: DiscoverFilters,
    page: number,
    keywordIds: number[]
) {
    const ratingMin = clamp(filters.ratingMin, 0, 10);
    const ratingMax = clamp(filters.ratingMax, 0, 10);

    const params: Record<string, string | number | boolean | undefined> = {
        include_adult: false,
        page,
        sort_by: filters.sortBy,
        with_original_language: filters.originalLanguage || undefined,
        "vote_average.gte": Number.isFinite(ratingMin)
            ? ratingMin
            : undefined,
        "vote_average.lte": Number.isFinite(ratingMax)
            ? ratingMax
            : undefined,
    };

    if (filters.genreIds.length) {
        params.with_genres = filters.genreIds.join(",");
    }

    if (keywordIds.length) {
        params.with_keywords = keywordIds.join(",");
    }

    if (filters.mediaType === "movie") {
        params["primary_release_date.gte"] =
            filters.releaseFrom || undefined;
        params["primary_release_date.lte"] =
            filters.releaseTo || undefined;

        if (filters.durationMin > 0) {
            params["with_runtime.gte"] = filters.durationMin;
        }
        if (filters.durationMax > 0 && filters.durationMax < 300) {
            params["with_runtime.lte"] = filters.durationMax;
        }
    } else {
        params["first_air_date.gte"] =
            filters.releaseFrom || undefined;
        params["first_air_date.lte"] =
            filters.releaseTo || undefined;
    }

    return params;
}

function mapResultToItem(
    mediaType: DiscoverMediaType,
    r: TmdbMovie | TmdbTv
): SearchMediaItem | null {
    if (mediaType === "movie") {
        const m = r as TmdbMovie;

        if (!isNonEmptyString((m as unknown as Record<string, unknown>).title)) {
            return null;
        }

        return {
            id: m.id,
            mediaType,
            title: m.title,
            poster_path: m.poster_path,
            genre_ids: m.genre_ids ?? [],
            vote_average: m.vote_average ?? 0,
        };
    }

    const t = r as TmdbTv;

    if (!isNonEmptyString((t as unknown as Record<string, unknown>).name)) {
        return null;
    }

    return {
        id: t.id,
        mediaType,
        title: t.name,
        poster_path: t.poster_path,
        genre_ids: t.genre_ids ?? [],
        vote_average: t.vote_average ?? 0,
    };
}

export function useTmdbDiscoverSearch(filters: DiscoverFilters) {
    const [status, setStatus] = useState<RemoteStatus>("idle");
    const [error, setError] = useState<string>("");

    const [refreshNonce, setRefreshNonce] = useState(0);

    const [items, setItems] = useState<SearchMediaItem[]>([]);
    const [hasMore, setHasMore] = useState(false);

    const pageRef = useRef(0);
    const totalPagesRef = useRef(0);
    const bufferRef = useRef<SearchMediaItem[]>([]);
    const keywordIdsRef = useRef<number[]>([]);

    const inflightRef = useRef(false);

    const signature = useMemo(() => {
        return JSON.stringify({
            mediaType: filters.mediaType,
            keywords: [...filters.keywords].map((k) => k.trim()).filter(Boolean).sort(),
            sortBy: filters.sortBy,
            genreIds: [...filters.genreIds].slice().sort((a, b) => a - b),
            releaseFrom: filters.releaseFrom,
            releaseTo: filters.releaseTo,
            originalLanguage: filters.originalLanguage,
            ratingMin: filters.ratingMin,
            ratingMax: filters.ratingMax,
            durationMin: filters.durationMin,
            durationMax: filters.durationMax,
        });
    }, [filters]);

    const fetchPage = useCallback(
        async (
            controller: AbortController,
            page: number
        ): Promise<TmdbPagedResult<TmdbMovie | TmdbTv>> => {
            const path =
                filters.mediaType === "movie"
                    ? "/discover/movie"
                    : "/discover/tv";

            const params = buildDiscoverParams(
                filters,
                page,
                keywordIdsRef.current
            );

            return tmdbGet<TmdbPagedResult<TmdbMovie | TmdbTv>>(
                path,
                params,
                controller.signal
            );
        },
        [filters]
    );

    const consumeFromBuffer = useCallback((count = 18) => {
        if (bufferRef.current.length === 0) return [] as SearchMediaItem[];
        return bufferRef.current.splice(0, count);
    }, []);

    const loadMore = useCallback(() => {
        if (inflightRef.current) return;
        if (!hasMore) return;

        const buffered = consumeFromBuffer(18);
        const missing = 18 - buffered.length;
        if (missing <= 0) {
            setItems((prev) => [...prev, ...buffered]);
            setHasMore(
                bufferRef.current.length > 0 ||
                    pageRef.current < totalPagesRef.current
            );
            return;
        }

        // If we had some buffered items but not enough, keep them and
        // try to fetch more to reach the desired batch size.
        if (
            buffered.length > 0 &&
            pageRef.current >= totalPagesRef.current
        ) {
            setItems((prev) => [...prev, ...buffered]);
            setHasMore(bufferRef.current.length > 0);
            return;
        }

        const controller = new AbortController();
        inflightRef.current = true;
        setStatus((s) => (s === "idle" ? "loading" : s));

        const nextPage = pageRef.current + 1;

        fetchPage(controller, nextPage)
            .then((data) => {
                if (controller.signal.aborted) return;

                pageRef.current = data.page;
                totalPagesRef.current = data.total_pages;

                const mapped = (data.results ?? []).map((r) =>
                    mapResultToItem(filters.mediaType, r)
                ).filter((x): x is SearchMediaItem => x !== null);

                bufferRef.current.push(...mapped);
                const take = consumeFromBuffer(missing);
                setItems((prev) => [...prev, ...buffered, ...take]);

                setHasMore(
                    bufferRef.current.length > 0 ||
                        pageRef.current < totalPagesRef.current
                );
                setStatus("success");
            })
            .catch((e: unknown) => {
                if (controller.signal.aborted) return;
                setError(
                    e instanceof Error ? e.message : "Unknown error"
                );
                setStatus("error");
            })
            .finally(() => {
                inflightRef.current = false;
            });

        return () => controller.abort();
    }, [consumeFromBuffer, fetchPage, filters.mediaType, hasMore]);

    const refetch = useCallback(() => {
        setRefreshNonce((n) => n + 1);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const initId = window.setTimeout(() => {
            inflightRef.current = true;
            setStatus("loading");
            setError("");
            setItems([]);
            setHasMore(false);
            bufferRef.current = [];
            pageRef.current = 0;
            totalPagesRef.current = 0;
            keywordIdsRef.current = [];
        }, 0);

        const seed = async () => {
            const keywordIds = await resolveKeywordIds(
                filters.keywords,
                controller.signal
            );
            if (controller.signal.aborted) return;
            keywordIdsRef.current = keywordIds;

            // Initial load: try to get at least ~30 items.
            const first = await fetchPage(controller, 1);
            if (controller.signal.aborted) return;

            pageRef.current = first.page;
            totalPagesRef.current = first.total_pages;

            const merged: Array<TmdbMovie | TmdbTv> = [
                ...(first.results ?? []),
            ];

            if (
                merged.length < 30 &&
                first.total_pages >= 2
            ) {
                const second = await fetchPage(controller, 2);
                if (controller.signal.aborted) return;
                merged.push(...(second.results ?? []));
                pageRef.current = second.page;
                totalPagesRef.current = second.total_pages;
            }

            const mapped = merged.map((r) =>
                mapResultToItem(filters.mediaType, r)
            ).filter((x): x is SearchMediaItem => x !== null);

            if (merged.length > 0 && mapped.length === 0) {
                throw new Error(DISCOVER_BAD_DATA_ERROR);
            }

            bufferRef.current = mapped;
            const take = consumeFromBuffer(30);
            setItems(take);

            setHasMore(
                bufferRef.current.length > 0 ||
                    pageRef.current < totalPagesRef.current
            );
            setStatus("success");
        };

        seed()
            .catch((e: unknown) => {
                if (controller.signal.aborted) return;
                setError(
                    e instanceof Error ? e.message : "Unknown error"
                );
                setStatus("error");
            })
            .finally(() => {
                inflightRef.current = false;
            });

        return () => {
            window.clearTimeout(initId);
            controller.abort();
        };
    }, [
        consumeFromBuffer,
        fetchPage,
        filters.mediaType,
        filters.keywords,
        signature,
        refreshNonce,
    ]);

    return {
        status,
        error,
        items,
        hasMore,
        loadMore,
        refetch,
    };
}
