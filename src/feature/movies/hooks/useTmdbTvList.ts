import { useCallback, useEffect, useState } from "react";
import { tmdbGet } from "../api/tmdbClient";
import type { TmdbPagedResult, TmdbTv } from "../types/tmdbTypes";
import type { RemoteStatus } from "./useTmdbMovieList";

const MOVIE_LIST_BAD_DATA_ERROR = "Something is wrong when load movie data.";

function isNonEmptyString(v: unknown) {
    return typeof v === "string" && v.trim().length > 0;
}

export function useTmdbTvList(
    path: string,
    params?: Record<string, string | number | boolean | undefined | null>,
    options?: {
        enabled?: boolean;
    }
) {
    const [status, setStatus] = useState<RemoteStatus>("idle");
    const [error, setError] = useState<string>("");
    const [tv, setTv] = useState<TmdbTv[]>([]);

    const enabled = options?.enabled ?? true;

    const fetchList = useCallback(() => {
        const controller = new AbortController();

        const id = window.setTimeout(() => {
            if (!enabled) {
                setStatus("idle");
                setError("");
                setTv([]);
                return;
            }

            setStatus("loading");
            setError("");

            tmdbGet<TmdbPagedResult<TmdbTv>>(
                path,
                params,
                controller.signal
            )
                .then((data) => {
                    const cleaned = (data.results ?? []).filter((t) =>
                        isNonEmptyString(
                            (t as unknown as Record<string, unknown>).name
                        )
                    );

                    if ((data.results ?? []).length > 0 && cleaned.length === 0) {
                        setTv([]);
                        setError(MOVIE_LIST_BAD_DATA_ERROR);
                        setStatus("error");
                        return;
                    }

                    setTv(cleaned);
                    setStatus("success");
                })
                .catch((e: unknown) => {
                    if (controller.signal.aborted) return;
                    setError(
                        e instanceof Error
                            ? e.message
                            : "Unknown error"
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
        tv,
        refetch: fetchList,
    };
}
