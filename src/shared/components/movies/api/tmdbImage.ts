const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type TmdbImageSize = "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original";

const preloadCache = new Map<string, Promise<void>>();

export function tmdbImageUrl(
    path: string | null | undefined,
    size: TmdbImageSize
) {
    if (!path) return "";
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function preloadImage(url: string) {
    if (!url) return Promise.resolve();

    const existing = preloadCache.get(url);
    if (existing) return existing;

    const p = new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
    });

    preloadCache.set(url, p);
    return p;
}
