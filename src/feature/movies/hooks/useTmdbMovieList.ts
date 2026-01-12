import { useCallback, useEffect, useState } from "react";
import { tmdbGet } from "../api/tmdbClient";
import type { TmdbMovie, TmdbPagedResult } from "../types/tmdbTypes";

export type RemoteStatus = "idle" | "loading" | "success" | "error";

const MOVIE_LIST_BAD_DATA_ERROR = "Something is wrong when load movie data.";

function isNonEmptyString(v: unknown) {
    return typeof v === "string" && v.trim().length > 0;
}

export function useTmdbMovieList(
    path: string,
    params?: Record<string, string | number | boolean | undefined | null>,
    options?: {
        enabled?: boolean;
    }
) {
    const [status, setStatus] = useState<RemoteStatus>("idle");
    const [error, setError] = useState<string>("");
    const [movies, setMovies] = useState<TmdbMovie[]>([]);

    const enabled = options?.enabled ?? true;

    const fetchList = useCallback(() => {
        const controller = new AbortController();

        const id = window.setTimeout(() => {
            if (!enabled) {
                setStatus("idle");
                setError("");
                setMovies([]);
                return;
            }

            setStatus("loading");
            setError("");

            tmdbGet<TmdbPagedResult<TmdbMovie>>(
                path,
                params,
                controller.signal
            )
                .then((data) => {
                    const cleaned = (data.results ?? []).filter((m) =>
                        isNonEmptyString(
                            (m as unknown as Record<string, unknown>).title
                        )
                    );

                    if ((data.results ?? []).length > 0 && cleaned.length === 0) {
                        setMovies([]);
                        setError(MOVIE_LIST_BAD_DATA_ERROR);
                        setStatus("error");
                        return;
                    }

                    setMovies(cleaned);
                    setStatus("success");
                })
                .catch((e: unknown) => {
                    if (controller.signal.aborted) return;
                    setError(
                        e instanceof Error ? e.message : "Unknown error"
                    );
                    setStatus("error");
                });
        }, 0);

        return () => {
            window.clearTimeout(id);
            controller.abort();
        };
    }, [enabled, path, params]);

    useEffect(() => {
        const abort = fetchList();
        return () => abort();
    }, [fetchList]);

    return {
        status,
        error,
        movies,
        refetch: fetchList,
    };
}
