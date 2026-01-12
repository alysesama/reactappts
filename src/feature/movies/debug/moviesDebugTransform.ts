import type {
    MoviesDebugBad200Mode,
    MoviesDebugConfig,
    MoviesDebugTargets,
} from "./moviesDebugConfig";

function hashString(s: string) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
        h = (h * 33) ^ s.charCodeAt(i);
    }
    return h >>> 0;
}

function rand01(seed: string) {
    return (hashString(seed) % 10_000) / 10_000;
}

export type MoviesDebugTargetKey = keyof MoviesDebugTargets;

export function targetKeyFromPath(path: string): MoviesDebugTargetKey | null {
    if (path.startsWith("/trending/movie")) return "trending";
    if (path.startsWith("/movie/now_playing")) return "nowPlaying";
    if (path.startsWith("/movie/upcoming")) return "upcoming";
    if (path.startsWith("/tv/popular")) return "popularTv";
    if (path.startsWith("/search/movie")) return "searchMovie";
    if (path.startsWith("/discover/movie") || path.startsWith("/discover/tv")) return "discover";

    if (path.startsWith("/genre/movie/list") || path.startsWith("/genre/tv/list")) return "genres";

    if (/^\/(movie|tv)\/[0-9]+(\/credits|\/videos)?$/.test(path)) return "detail";

    return null;
}

function shouldCorrupt(seed: string, cfg: MoviesDebugConfig) {
    if (cfg.bad200.pick === "all") return true;
    return rand01(seed) < cfg.bad200.rate;
}

function corruptValueSoft(key: string, value: unknown) {
    if (key === "poster_path" || key === "backdrop_path") {
        // Type-safe but visibly wrong: simulate missing images.
        return "";
    }

    if (key === "vote_average") {
        // Type-safe but visibly wrong.
        return 0;
    }

    if (key === "title" || key === "name") {
        // Type-safe but visibly wrong.
        return "";
    }

    if (key === "overview") {
        return "";
    }

    return value;
}

function corruptValueHard(key: string) {
    if (key === "id") return undefined;
    if (key === "vote_average") return "oops";
    if (key === "genre_ids") return "not-an-array";
    if (key === "poster_path" || key === "backdrop_path") return 123;
    if (key === "title" || key === "name") return null;
    return undefined;
}

function getNumberProp(obj: unknown, key: string): number | null {
    if (!obj || typeof obj !== "object") return null;
    const rec = obj as Record<string, unknown>;
    const v = rec[key];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function corruptItem(mode: MoviesDebugBad200Mode, item: unknown) {
    if (!item || typeof item !== "object") return item;

    const obj = item as Record<string, unknown>;

    if (mode === "soft") {
        return {
            ...obj,
            title: corruptValueSoft("title", obj.title),
            name: corruptValueSoft("name", obj.name),
            poster_path: corruptValueSoft("poster_path", obj.poster_path),
            backdrop_path: corruptValueSoft("backdrop_path", obj.backdrop_path),
            vote_average: corruptValueSoft("vote_average", obj.vote_average),
            overview: corruptValueSoft("overview", obj.overview),
            genre_ids: [],
        };
    }

    return {
        ...obj,
        id: corruptValueHard("id"),
        title: corruptValueHard("title"),
        name: corruptValueHard("name"),
        poster_path: corruptValueHard("poster_path"),
        backdrop_path: corruptValueHard("backdrop_path"),
        vote_average: corruptValueHard("vote_average"),
        genre_ids: corruptValueHard("genre_ids"),
    };
}

export function transformTmdb200(path: string, data: unknown, cfg: MoviesDebugConfig): unknown {
    if (cfg.bad200.mode === "off") return data;

    const target = targetKeyFromPath(path);
    if (!target) return data;
    if (!cfg.bad200.targets[target]) return data;

    const mode = cfg.bad200.mode;

    if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;

        if (Array.isArray(obj.results)) {
            const results = obj.results as unknown[];
            const next = results.map((it, idx) => {
                const id = getNumberProp(it, "id");
                const stableId = id !== null ? String(id) : String(idx);
                const stableSeed = `${path}|${stableId}|${mode}`;
                return shouldCorrupt(stableSeed, cfg)
                    ? corruptItem(mode, it)
                    : it;
            });

            return {
                ...obj,
                results: next,
            };
        }

        if (Array.isArray(obj.genres)) {
            const genres = obj.genres as unknown[];
            const next = genres.map((g, idx) => {
                const id = getNumberProp(g, "id");
                const stableId = id !== null ? String(id) : String(idx);
                const stableSeed = `${path}|genre|${stableId}|${mode}`;
                if (!shouldCorrupt(stableSeed, cfg)) return g;

                if (mode === "soft") {
                    return {
                        ...(g as Record<string, unknown>),
                        name: "",
                    };
                }

                return {
                    ...(g as Record<string, unknown>),
                    id: undefined,
                    name: null,
                };
            });

            return {
                ...obj,
                genres: next,
            };
        }

        const seed = `${path}|object|${mode}`;
        if (!shouldCorrupt(seed, cfg)) return data;

        return corruptItem(mode, obj);
    }

    return data;
}
