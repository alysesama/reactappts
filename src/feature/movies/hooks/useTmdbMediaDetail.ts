import { useEffect, useMemo, useState } from "react";
import { tmdbGet } from "../api/tmdbClient";
import type {
    TmdbCredits,
    TmdbMovieDetails,
    TmdbTvDetails,
    TmdbVideos,
} from "../types/tmdbTypes";
import type { RemoteStatus } from "./useTmdbMovieList";

const MEDIA_DETAIL_BAD_DATA_ERROR =
    "Something is wrong when load movie data.";

function isNonEmptyString(v: unknown) {
    return typeof v === "string" && v.trim().length > 0;
}

export type TmdbMediaType = "movie" | "tv";

export type TmdbMediaRef = {
    type: TmdbMediaType;
    id: number;
} | null;

export type TmdbMediaDetails = TmdbMovieDetails | TmdbTvDetails;

export function useTmdbMediaDetail(media: TmdbMediaRef) {
    const [status, setStatus] = useState<RemoteStatus>("idle");
    const [error, setError] = useState<string>("");
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
    const [credits, setCredits] = useState<TmdbCredits | null>(null);
    const [videos, setVideos] = useState<TmdbVideos | null>(null);

    const normalized = useMemo(() => {
        if (!media) return null;
        if (typeof media.id !== "number") return null;
        if (media.type !== "movie" && media.type !== "tv") return null;
        return media;
    }, [media]);

    useEffect(() => {
        const controller = new AbortController();

        const timeoutId = window.setTimeout(() => {
            if (!normalized) {
                setStatus("idle");
                setError("");
                setDetails(null);
                setCredits(null);
                setVideos(null);
                return;
            }

            const { type, id } = normalized;

            setStatus("loading");
            setError("");

            Promise.all([
                tmdbGet<TmdbMediaDetails>(
                    `/${type}/${id}`,
                    undefined,
                    controller.signal
                ),
                tmdbGet<TmdbCredits>(
                    `/${type}/${id}/credits`,
                    undefined,
                    controller.signal
                ),
                tmdbGet<TmdbVideos>(
                    `/${type}/${id}/videos`,
                    undefined,
                    controller.signal
                ),
            ])
                .then(([d, c, v]) => {
                    if (type === "movie") {
                        const title =
                            (d as unknown as Record<string, unknown>).title;
                        if (!isNonEmptyString(title)) {
                            throw new Error(MEDIA_DETAIL_BAD_DATA_ERROR);
                        }
                    } else {
                        const name =
                            (d as unknown as Record<string, unknown>).name;
                        if (!isNonEmptyString(name)) {
                            throw new Error(MEDIA_DETAIL_BAD_DATA_ERROR);
                        }
                    }

                    setDetails(d);
                    setCredits(c);
                    setVideos(v);
                    setStatus("success");
                })
                .catch((e: unknown) => {
                    if (controller.signal.aborted) return;

                    setDetails(null);
                    setCredits(null);
                    setVideos(null);
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
    }, [normalized]);

    return {
        status,
        error,
        details,
        credits,
        videos,
    };
}
