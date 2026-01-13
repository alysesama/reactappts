import { readMoviesDebugConfig } from "../debug/moviesDebugConfig";
import { transformTmdb200 } from "../debug/moviesDebugTransform";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_V4_BASE_URL = "https://api.themoviedb.org/4";
const DEFAULT_LANGUAGE = "en-US";

function getTmdbReadAccessToken() {
    const token = import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN;
    return typeof token === "string" && token.trim()
        ? token.trim()
        : "";
}

function getTmdbApiKey() {
    const key = import.meta.env.VITE_TMDB_API_KEY;
    return typeof key === "string" && key.trim() ? key.trim() : "";
}

function buildQuery(
    params?: Record<string, string | number | boolean | undefined | null>,
    options?: {
        includeLanguage?: boolean;
    }
) {
    const q = new URLSearchParams();

    const includeLanguage = options?.includeLanguage !== false;

    const withLanguage: Record<string, string | number | boolean | undefined | null> =
        includeLanguage
            ? {
                  language: DEFAULT_LANGUAGE,
                  ...params,
              }
            : {
                  ...params,
              };

    for (const [k, v] of Object.entries(withLanguage)) {
        if (v === undefined || v === null) continue;
        q.set(k, String(v));
    }

    const token = getTmdbReadAccessToken();
    const apiKey = getTmdbApiKey();

    if (!token && apiKey && !q.has("api_key")) {
        q.set("api_key", apiKey);
    }

    return q;
}

export async function tmdbGet<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined | null>,
    signal?: AbortSignal
): Promise<T> {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    const isDev = import.meta.env.DEV;
    const debugCfg = isDev ? readMoviesDebugConfig() : null;
    const useDebug = !!(isDev && debugCfg?.enabled);

    const urlMode = useDebug ? debugCfg!.urlMode : "normal";
    const baseUrl =
        urlMode === "bad_base"
            ? "https://api.invalid.themoviedb.org/3"
            : TMDB_BASE_URL;
    const effectivePath =
        urlMode === "bad_path" ? `/__bad${normalizedPath}` : normalizedPath;

    const url = new URL(`${baseUrl}${effectivePath}`);

    const query = buildQuery(params);
    url.search = query.toString();

    let token = getTmdbReadAccessToken();
    let apiKey = getTmdbApiKey();

    if (useDebug) {
        if (debugCfg!.authMode === "missing") {
            token = "";
            apiKey = "";
            url.searchParams.delete("api_key");
        } else if (debugCfg!.authMode === "invalid") {
            token = "invalid";
            apiKey = "invalid";
            url.searchParams.set("api_key", apiKey);
        }

        if (!token && apiKey) {
            url.searchParams.set("api_key", apiKey);
        }
    }

    const headers: HeadersInit = {
        Accept: "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (useDebug && debugCfg!.delayMs > 0) {
        await new Promise<void>((resolve, reject) => {
            if (signal?.aborted) {
                reject(new DOMException("Aborted", "AbortError"));
                return;
            }

            const onAbort = () => {
                cleanup();
                reject(new DOMException("Aborted", "AbortError"));
            };

            const cleanup = () => {
                if (signal) signal.removeEventListener("abort", onAbort);
            };

            if (signal) signal.addEventListener("abort", onAbort);

            window.setTimeout(() => {
                cleanup();
                resolve();
            }, debugCfg!.delayMs);
        });
    }

    if (useDebug && debugCfg!.httpSim.enabled) {
        const status = debugCfg!.httpSim.status;
        const statusText =
            status === 401
                ? "Unauthorized"
                : status === 404
                  ? "Not Found"
                  : status === 429
                    ? "Too Many Requests"
                    : "Internal Server Error";
        throw new Error(`TMDB request failed: ${status} ${statusText}`);
    }

    const res = await fetch(url.toString(), {
        method: "GET",
        headers,
        signal,
    });

    if (!res.ok) {
        let detail = "";
        try {
            detail = await res.text();
        } catch {
            // ignore
        }
        throw new Error(
            `TMDB request failed: ${res.status} ${res.statusText}${detail ? ` - ${detail}` : ""}`
        );
    }

    const json = (await res.json()) as unknown;

    if (useDebug && debugCfg!.bad200.mode !== "off") {
        return transformTmdb200(normalizedPath, json, debugCfg!) as T;
    }

    return json as T;
}

async function tmdbRequest<T>(
    {
        baseUrl,
        method,
        path,
        params,
        body,
        signal,
        bearerToken,
        includeLanguage,
    }: {
        baseUrl: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        path: string;
        params?: Record<string, string | number | boolean | undefined | null>;
        body?: unknown;
        signal?: AbortSignal;
        bearerToken?: string;
        includeLanguage?: boolean;
    }
): Promise<T> {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    const url = new URL(`${baseUrl}${normalizedPath}`);
    const query = buildQuery(params, {
        includeLanguage: includeLanguage !== false,
    });
    url.search = query.toString();

    const token = bearerToken ?? getTmdbReadAccessToken();

    const headers: HeadersInit = {
        Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    const res = await fetch(url.toString(), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
    });

    if (!res.ok) {
        let detail = "";
        try {
            detail = await res.text();
        } catch {
            // ignore
        }
        throw new Error(
            `TMDB request failed: ${res.status} ${res.statusText}${detail ? ` - ${detail}` : ""}`
        );
    }

    if (res.status === 204) return undefined as T;

    const json = (await res.json()) as unknown;
    return json as T;
}

export async function tmdbPost<T>(
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined | null>,
    signal?: AbortSignal,
    options?: {
        bearerToken?: string;
        includeLanguage?: boolean;
    }
) {
    return tmdbRequest<T>({
        baseUrl: TMDB_BASE_URL,
        method: "POST",
        path,
        params,
        body,
        signal,
        bearerToken: options?.bearerToken,
        includeLanguage: options?.includeLanguage,
    });
}

export async function tmdbDelete<T>(
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined | null>,
    signal?: AbortSignal,
    options?: {
        bearerToken?: string;
        includeLanguage?: boolean;
    }
) {
    return tmdbRequest<T>({
        baseUrl: TMDB_BASE_URL,
        method: "DELETE",
        path,
        params,
        body,
        signal,
        bearerToken: options?.bearerToken,
        includeLanguage: options?.includeLanguage,
    });
}

export async function tmdbV4Post<T>(
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined | null>,
    signal?: AbortSignal,
    bearerToken?: string
) {
    return tmdbRequest<T>({
        baseUrl: TMDB_V4_BASE_URL,
        method: "POST",
        path,
        params,
        body,
        signal,
        bearerToken,
        includeLanguage: false,
    });
}

export async function tmdbV4Delete<T>(
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined | null>,
    signal?: AbortSignal,
    bearerToken?: string
) {
    return tmdbRequest<T>({
        baseUrl: TMDB_V4_BASE_URL,
        method: "DELETE",
        path,
        params,
        body,
        signal,
        bearerToken,
        includeLanguage: false,
    });
}
