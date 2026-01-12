import { useCallback, useEffect, useState } from "react";
import { tmdbGet } from "../api/tmdbClient";
import type { TmdbPagedResult, TmdbTv } from "../types/tmdbTypes";
import type { RemoteStatus } from "./useTmdbMovieList";

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
                    setTv(data.results ?? []);
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
