import { useEffect, useMemo, useState } from "react";
import { tmdbGet } from "../api/tmdbClient";
import type {
    TmdbCredits,
    TmdbMovieDetails,
    TmdbVideos,
} from "../types/tmdbTypes";
import type { RemoteStatus } from "./useTmdbMovieList";

export function useTmdbMovieDetail(movieId: number | null) {
    const [status, setStatus] = useState<RemoteStatus>("idle");
    const [error, setError] = useState<string>("");
    const [details, setDetails] = useState<TmdbMovieDetails | null>(null);
    const [credits, setCredits] = useState<TmdbCredits | null>(null);
    const [videos, setVideos] = useState<TmdbVideos | null>(null);

    const id = useMemo(() => (typeof movieId === "number" ? movieId : null), [movieId]);

    useEffect(() => {
        const controller = new AbortController();

        const timeoutId = window.setTimeout(() => {
            if (!id) {
                setStatus("idle");
                setError("");
                setDetails(null);
                setCredits(null);
                setVideos(null);
                return;
            }

            setStatus("loading");
            setError("");

            Promise.all([
                tmdbGet<TmdbMovieDetails>(
                    `/movie/${id}`,
                    undefined,
                    controller.signal
                ),
                tmdbGet<TmdbCredits>(
                    `/movie/${id}/credits`,
                    undefined,
                    controller.signal
                ),
                tmdbGet<TmdbVideos>(
                    `/movie/${id}/videos`,
                    undefined,
                    controller.signal
                ),
            ])
                .then(([d, c, v]) => {
                    setDetails(d);
                    setCredits(c);
                    setVideos(v);
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
            window.clearTimeout(timeoutId);
            controller.abort();
        };
    }, [id]);

    return {
        status,
        error,
        details,
        credits,
        videos,
    };
}
