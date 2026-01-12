import { useEffect, useMemo, useState } from "react";
import { tmdbGet } from "../api/tmdbClient";
import type { TmdbMovie, TmdbPagedResult } from "../types/tmdbTypes";
import type { RemoteStatus } from "./useTmdbMovieList";

const MOVIE_LIST_BAD_DATA_ERROR = "Something is wrong when load movie data.";

function isNonEmptyString(v: unknown) {
    return typeof v === "string" && v.trim().length > 0;
}

export function useTmdbMovieSearch(query: string) {
    const [status, setStatus] = useState<RemoteStatus>("idle");
    const [error, setError] = useState<string>("");
    const [results, setResults] = useState<TmdbMovie[]>([]);

    const trimmed = useMemo(() => query.trim(), [query]);

    useEffect(() => {
        const controller = new AbortController();

        const id = window.setTimeout(() => {
            if (!trimmed) {
                setStatus("idle");
                setError("");
                setResults([]);
                return;
            }

            setStatus("loading");
            setError("");

            tmdbGet<TmdbPagedResult<TmdbMovie>>(
                "/search/movie",
                {
                    query: trimmed,
                    include_adult: false,
                    page: 1,
                },
                controller.signal
            )
                .then((data) => {
                    const cleaned = (data.results ?? []).filter((m) =>
                        isNonEmptyString(
                            (m as unknown as Record<string, unknown>).title
                        )
                    );

                    if ((data.results ?? []).length > 0 && cleaned.length === 0) {
                        setResults([]);
                        setError(MOVIE_LIST_BAD_DATA_ERROR);
                        setStatus("error");
                        return;
                    }

                    const list = cleaned
                        .filter((m) =>
                            isNonEmptyString(
                                (m as unknown as Record<string, unknown>).title
                            )
                        )
                        .slice(0, 5);
                    setResults(list);
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
    }, [trimmed]);

    return {
        status,
        error,
        results,
    };
}
