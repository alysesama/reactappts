import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { tmdbGet } from "../api/tmdbClient";
import type { TmdbMovie, TmdbPagedResult, TmdbTv } from "../types/tmdbTypes";

export type UserListsStatus = "idle" | "loading" | "success" | "error";

export type UserListKind = "favorite" | "watchlist";

export type UserListItem = {
    id: number;
    mediaType: "movie" | "tv";
    title: string;
    poster_path: string | null;
    vote_average: number;
};

type CachedUserLists = {
    updatedAt: number;
    favoriteMovies: UserListItem[];
    favoriteTv: UserListItem[];
    watchlistMovies: UserListItem[];
    watchlistTv: UserListItem[];
};

function cacheKey(accountId: string) {
    return `TMDB_USER_LISTS_V1_${accountId}`;
}

function readCache(accountId: string): CachedUserLists | null {
    try {
        const raw = localStorage.getItem(cacheKey(accountId));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object") return null;
        const obj = parsed as Record<string, unknown>;

        const updatedAt = obj.updatedAt;
        if (typeof updatedAt !== "number" || !Number.isFinite(updatedAt)) return null;

        const favoriteMovies = Array.isArray(obj.favoriteMovies)
            ? (obj.favoriteMovies as unknown[])
            : [];
        const favoriteTv = Array.isArray(obj.favoriteTv)
            ? (obj.favoriteTv as unknown[])
            : [];
        const watchlistMovies = Array.isArray(obj.watchlistMovies)
            ? (obj.watchlistMovies as unknown[])
            : [];
        const watchlistTv = Array.isArray(obj.watchlistTv)
            ? (obj.watchlistTv as unknown[])
            : [];

        const toItem = (x: unknown): UserListItem | null => {
            if (!x || typeof x !== "object") return null;
            const r = x as Record<string, unknown>;
            const id = r.id;
            const mediaType = r.mediaType;
            const title = r.title;
            const poster_path = r.poster_path;
            const vote_average = r.vote_average;

            if (typeof id !== "number") return null;
            if (mediaType !== "movie" && mediaType !== "tv") return null;
            if (typeof title !== "string") return null;
            if (poster_path !== null && typeof poster_path !== "string") return null;
            if (typeof vote_average !== "number") return null;

            return {
                id,
                mediaType,
                title,
                poster_path,
                vote_average,
            };
        };

        const mapClean = (list: unknown[]) =>
            list
                .map(toItem)
                .filter((x): x is UserListItem => !!x);

        return {
            updatedAt,
            favoriteMovies: mapClean(favoriteMovies),
            favoriteTv: mapClean(favoriteTv),
            watchlistMovies: mapClean(watchlistMovies),
            watchlistTv: mapClean(watchlistTv),
        };
    } catch {
        return null;
    }
}

function writeCache(accountId: string, data: CachedUserLists) {
    localStorage.setItem(cacheKey(accountId), JSON.stringify(data));
}

function toMovieItem(m: TmdbMovie): UserListItem {
    return {
        id: m.id,
        mediaType: "movie",
        title: m.title,
        poster_path: m.poster_path,
        vote_average: m.vote_average,
    };
}

function toTvItem(t: TmdbTv): UserListItem {
    return {
        id: t.id,
        mediaType: "tv",
        title: t.name,
        poster_path: t.poster_path,
        vote_average: t.vote_average,
    };
}

async function fetchAllPages<T>(
    path: string,
    sessionId: string,
    mapItem: (x: T) => UserListItem,
    signal: AbortSignal
) {
    const first = await tmdbGet<TmdbPagedResult<T>>(
        path,
        { session_id: sessionId, page: 1 },
        signal
    );

    const items: UserListItem[] = (first.results ?? []).map(mapItem);

    const totalPages = Math.max(1, first.total_pages ?? 1);
    for (let page = 2; page <= totalPages; page++) {
        const data = await tmdbGet<TmdbPagedResult<T>>(
            path,
            { session_id: sessionId, page },
            signal
        );
        items.push(...(data.results ?? []).map(mapItem));
    }

    return items;
}

export function useTmdbUserLists({
    enabled,
    accountId,
    sessionId,
    refreshKey,
}: {
    enabled: boolean;
    accountId: string;
    sessionId: string;
    refreshKey: number | null;
}) {
    const [status, setStatus] = useState<UserListsStatus>("idle");
    const [error, setError] = useState<string>("");

    const [favoriteMovies, setFavoriteMovies] = useState<UserListItem[]>([]);
    const [favoriteTv, setFavoriteTv] = useState<UserListItem[]>([]);
    const [watchlistMovies, setWatchlistMovies] = useState<UserListItem[]>([]);
    const [watchlistTv, setWatchlistTv] = useState<UserListItem[]>([]);

    const abortRef = useRef<AbortController | null>(null);

    const applyCacheIfAny = useCallback(() => {
        if (!accountId) return;
        const cached = readCache(accountId);
        if (!cached) return;
        setFavoriteMovies(cached.favoriteMovies);
        setFavoriteTv(cached.favoriteTv);
        setWatchlistMovies(cached.watchlistMovies);
        setWatchlistTv(cached.watchlistTv);
    }, [accountId]);

    const load = useCallback(() => {
        if (!enabled || !accountId || !sessionId) {
            setStatus("idle");
            setError("");
            setFavoriteMovies([]);
            setFavoriteTv([]);
            setWatchlistMovies([]);
            setWatchlistTv([]);
            return;
        }

        applyCacheIfAny();

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setStatus("loading");
        setError("");

        Promise.all([
            fetchAllPages<TmdbMovie>(
                `/account/${accountId}/favorite/movies`,
                sessionId,
                toMovieItem,
                controller.signal
            ),
            fetchAllPages<TmdbTv>(
                `/account/${accountId}/favorite/tv`,
                sessionId,
                toTvItem,
                controller.signal
            ),
            fetchAllPages<TmdbMovie>(
                `/account/${accountId}/watchlist/movies`,
                sessionId,
                toMovieItem,
                controller.signal
            ),
            fetchAllPages<TmdbTv>(
                `/account/${accountId}/watchlist/tv`,
                sessionId,
                toTvItem,
                controller.signal
            ),
        ])
            .then(([fm, ft, wm, wt]) => {
                if (controller.signal.aborted) return;

                setFavoriteMovies(fm);
                setFavoriteTv(ft);
                setWatchlistMovies(wm);
                setWatchlistTv(wt);
                setStatus("success");

                writeCache(accountId, {
                    updatedAt: Date.now(),
                    favoriteMovies: fm,
                    favoriteTv: ft,
                    watchlistMovies: wm,
                    watchlistTv: wt,
                });
            })
            .catch((e: unknown) => {
                if (controller.signal.aborted) return;
                setStatus("error");
                setError(e instanceof Error ? e.message : "Unknown error");
            });
    }, [accountId, applyCacheIfAny, enabled, sessionId]);

    useEffect(() => {
        const id = window.setTimeout(() => {
            load();
        }, 0);

        return () => {
            window.clearTimeout(id);
            abortRef.current?.abort();
        };
    }, [load, refreshKey]);

    const favoriteAll = useMemo(
        () => [...favoriteMovies, ...favoriteTv],
        [favoriteMovies, favoriteTv]
    );
    const watchlistAll = useMemo(
        () => [...watchlistMovies, ...watchlistTv],
        [watchlistMovies, watchlistTv]
    );

    return {
        status,
        error,
        favoriteMovies,
        favoriteTv,
        watchlistMovies,
        watchlistTv,
        favoriteAll,
        watchlistAll,
        reload: load,
    };
}
