import { useCallback, useEffect, useMemo, useState } from "react";
import { tmdbGet } from "../api/tmdbClient";
import type { TmdbGenre } from "../types/tmdbTypes";
import type { RemoteStatus } from "./useTmdbMovieList";

export function useTmdbTvGenres() {
    const [status, setStatus] = useState<RemoteStatus>("idle");
    const [error, setError] = useState<string>("");
    const [genres, setGenres] = useState<TmdbGenre[]>([]);

    const fetchGenres = useCallback(() => {
        const controller = new AbortController();

        const id = window.setTimeout(() => {
            setStatus("loading");
            setError("");

            tmdbGet<{ genres: TmdbGenre[] }>(
                "/genre/tv/list",
                undefined,
                controller.signal
            )
                .then((data) => {
                    setGenres(data.genres ?? []);
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
    }, []);

    useEffect(() => {
        const abort = fetchGenres();
        return () => abort();
    }, [fetchGenres]);

    const genreMap = useMemo(() => {
        const m: Record<number, string> = {};
        genres.forEach((g) => {
            m[g.id] = g.name;
        });
        return m;
    }, [genres]);

    return {
        status,
        error,
        genres,
        genreMap,
        refetch: fetchGenres,
    };
}
