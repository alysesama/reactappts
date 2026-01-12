export type MoviesDebugHttpStatus = 401 | 404 | 429 | 500;

export type MoviesDebugAuthMode = "normal" | "missing" | "invalid";
export type MoviesDebugUrlMode = "normal" | "bad_path" | "bad_base";

export type MoviesDebugBad200Mode = "off" | "soft" | "hard";
export type MoviesDebugBad200Pick = "all" | "random";

export type MoviesDebugTargets = {
    trending: boolean;
    nowPlaying: boolean;
    upcoming: boolean;
    popularTv: boolean;
    searchMovie: boolean;
    discover: boolean;
    detail: boolean;
    genres: boolean;
};

export type MoviesDebugConfig = {
    enabled: boolean;

    authMode: MoviesDebugAuthMode;
    urlMode: MoviesDebugUrlMode;

    delayMs: number;

    httpSim: {
        enabled: boolean;
        status: MoviesDebugHttpStatus;
    };

    bad200: {
        mode: MoviesDebugBad200Mode;
        pick: MoviesDebugBad200Pick;
        rate: number;
        targets: MoviesDebugTargets;
    };
};

const CONFIG_KEY = "MOVIES_DEBUG_CONFIG_V1";
const REFRESH_KEY = "MOVIES_DEBUG_REFRESH_V1";

const listeners = new Set<() => void>();

const DEFAULT_CONFIG: MoviesDebugConfig = {
    enabled: false,
    authMode: "normal",
    urlMode: "normal",
    delayMs: 0,
    httpSim: {
        enabled: false,
        status: 401,
    },
    bad200: {
        mode: "off",
        pick: "all",
        rate: 0.35,
        targets: {
            trending: true,
            nowPlaying: true,
            upcoming: true,
            popularTv: true,
            searchMovie: true,
            discover: true,
            detail: true,
            genres: false,
        },
    },
};

let cachedRaw: string | null = null;
let cachedConfig: MoviesDebugConfig | null = null;

export function subscribeMoviesDebug(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

function emit() {
    listeners.forEach((l) => l());
}

export function getDefaultMoviesDebugConfig(): MoviesDebugConfig {
    return DEFAULT_CONFIG;
}

function clampNumber(n: unknown, min: number, max: number, fallback: number) {
    const v = typeof n === "number" ? n : Number(n);
    if (!Number.isFinite(v)) return fallback;
    return Math.max(min, Math.min(max, v));
}

function normalizeTargets(t: unknown): MoviesDebugTargets {
    const d = getDefaultMoviesDebugConfig().bad200.targets;
    const obj = (t && typeof t === "object" ? (t as Record<string, unknown>) : {}) as Record<
        string,
        unknown
    >;

    return {
        trending: typeof obj.trending === "boolean" ? obj.trending : d.trending,
        nowPlaying: typeof obj.nowPlaying === "boolean" ? obj.nowPlaying : d.nowPlaying,
        upcoming: typeof obj.upcoming === "boolean" ? obj.upcoming : d.upcoming,
        popularTv: typeof obj.popularTv === "boolean" ? obj.popularTv : d.popularTv,
        searchMovie: typeof obj.searchMovie === "boolean" ? obj.searchMovie : d.searchMovie,
        discover: typeof obj.discover === "boolean" ? obj.discover : d.discover,
        detail: typeof obj.detail === "boolean" ? obj.detail : d.detail,
        genres: typeof obj.genres === "boolean" ? obj.genres : d.genres,
    };
}

export function readMoviesDebugConfig(): MoviesDebugConfig {
    const d = getDefaultMoviesDebugConfig();

    try {
        const raw = sessionStorage.getItem(CONFIG_KEY);
        if (!raw) return d;

        if (raw === cachedRaw && cachedConfig) {
            return cachedConfig;
        }

        const parsed = JSON.parse(raw) as Partial<MoviesDebugConfig>;
        if (!parsed || typeof parsed !== "object") return d;

        const authMode =
            parsed.authMode === "missing" ||
            parsed.authMode === "invalid" ||
            parsed.authMode === "normal"
                ? parsed.authMode
                : d.authMode;

        const urlMode =
            parsed.urlMode === "bad_path" ||
            parsed.urlMode === "bad_base" ||
            parsed.urlMode === "normal"
                ? parsed.urlMode
                : d.urlMode;

        const httpStatus: MoviesDebugHttpStatus =
            parsed.httpSim?.status === 404 ||
            parsed.httpSim?.status === 401 ||
            parsed.httpSim?.status === 429 ||
            parsed.httpSim?.status === 500
                ? parsed.httpSim.status
                : d.httpSim.status;

        const badMode: MoviesDebugBad200Mode =
            parsed.bad200?.mode === "soft" ||
            parsed.bad200?.mode === "hard" ||
            parsed.bad200?.mode === "off"
                ? parsed.bad200.mode
                : d.bad200.mode;

        const badPick: MoviesDebugBad200Pick =
            parsed.bad200?.pick === "random" || parsed.bad200?.pick === "all"
                ? parsed.bad200.pick
                : d.bad200.pick;

        const next: MoviesDebugConfig = {
            enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : d.enabled,
            authMode,
            urlMode,
            delayMs: clampNumber(parsed.delayMs, 0, 30_000, d.delayMs),
            httpSim: {
                enabled:
                    typeof parsed.httpSim?.enabled === "boolean"
                        ? parsed.httpSim.enabled
                        : d.httpSim.enabled,
                status: httpStatus,
            },
            bad200: {
                mode: badMode,
                pick: badPick,
                rate: clampNumber(parsed.bad200?.rate, 0, 1, d.bad200.rate),
                targets: normalizeTargets(parsed.bad200?.targets),
            },
        };

        cachedRaw = raw;
        cachedConfig = next;
        return next;
    } catch {
        return d;
    }
}

export function writeMoviesDebugConfig(next: MoviesDebugConfig) {
    sessionStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    cachedRaw = null;
    cachedConfig = null;
    emit();
}

export function updateMoviesDebugConfig(updater: (prev: MoviesDebugConfig) => MoviesDebugConfig) {
    const prev = readMoviesDebugConfig();
    const next = updater(prev);
    writeMoviesDebugConfig(next);
}

export function resetMoviesDebugConfig() {
    writeMoviesDebugConfig(getDefaultMoviesDebugConfig());
}

export function readMoviesDebugRefreshId(): number {
    try {
        const raw = sessionStorage.getItem(REFRESH_KEY);
        const n = raw ? Number(raw) : 0;
        return Number.isFinite(n) ? n : 0;
    } catch {
        return 0;
    }
}

export function bumpMoviesDebugRefreshId() {
    const next = readMoviesDebugRefreshId() + 1;
    sessionStorage.setItem(REFRESH_KEY, String(next));
    emit();
}
