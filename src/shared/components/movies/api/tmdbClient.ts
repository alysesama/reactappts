const TMDB_BASE_URL = "https://api.themoviedb.org/3";
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

function buildQuery(params?: Record<string, string | number | boolean | undefined | null>) {
    const q = new URLSearchParams();

    const withLanguage: Record<string, string | number | boolean | undefined | null> = {
        language: DEFAULT_LANGUAGE,
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
    const url = new URL(
        `${TMDB_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
    );

    const query = buildQuery(params);
    url.search = query.toString();

    const token = getTmdbReadAccessToken();
    const headers: HeadersInit = {
        Accept: "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
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

    return (await res.json()) as T;
}
