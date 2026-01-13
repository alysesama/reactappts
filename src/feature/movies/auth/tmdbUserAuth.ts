import { tmdbGet, tmdbPost, tmdbV4Post } from "../api/tmdbClient";
import { tmdbImageUrl } from "../api/tmdbImage";
import type {
    TmdbAccountDetails,
    TmdbV3ConvertSessionResponse,
    TmdbV4CreateAccessTokenResponse,
    TmdbV4CreateRequestTokenResponse,
} from "../types/tmdbTypes";

export type TmdbAuthedUser = {
    accountId: string;
    sessionId: string;
    username: string;
    avatarUrl: string;
};

export type TmdbUserAuthState = {
    accessToken: string;
    expiresAt: number;
    user: TmdbAuthedUser;
};

const STORAGE_KEY = "TMDB_USER_AUTH_V1";
const PENDING_KEY = "TMDB_USER_AUTH_PENDING_V1";

function nowMs() {
    return Date.now();
}

export function readTmdbUserAuth(): TmdbUserAuthState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object") return null;
        const obj = parsed as Record<string, unknown>;

        const accessToken = obj.accessToken;
        const expiresAt = obj.expiresAt;
        const user = obj.user;

        if (typeof accessToken !== "string" || !accessToken.trim()) {
            return null;
        }
        if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) {
            return null;
        }
        if (expiresAt <= nowMs()) {
            clearTmdbUserAuth();
            return null;
        }
        if (!user || typeof user !== "object") return null;
        const u = user as Record<string, unknown>;

        const accountId = u.accountId;
        const sessionId = u.sessionId;
        const username = u.username;
        const avatarUrl = u.avatarUrl;

        if (typeof accountId !== "string" || !accountId.trim()) return null;
        if (typeof sessionId !== "string" || !sessionId.trim()) return null;
        if (typeof username !== "string" || !username.trim()) return null;
        if (typeof avatarUrl !== "string") return null;

        return {
            accessToken: accessToken.trim(),
            expiresAt,
            user: {
                accountId: accountId.trim(),
                sessionId: sessionId.trim(),
                username: username.trim(),
                avatarUrl,
            },
        };
    } catch {
        return null;
    }
}

export function writeTmdbUserAuth(next: TmdbUserAuthState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearTmdbUserAuth() {
    localStorage.removeItem(STORAGE_KEY);
}

type PendingRequestToken = {
    requestToken: string;
    createdAt: number;
};

function writePendingRequestToken(requestToken: string) {
    const pending: PendingRequestToken = {
        requestToken,
        createdAt: nowMs(),
    };
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

function readPendingRequestToken(): PendingRequestToken | null {
    try {
        const raw = localStorage.getItem(PENDING_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object") return null;
        const obj = parsed as Record<string, unknown>;
        const requestToken = obj.requestToken;
        const createdAt = obj.createdAt;
        if (typeof requestToken !== "string" || !requestToken.trim()) return null;
        if (typeof createdAt !== "number" || !Number.isFinite(createdAt)) return null;
        return { requestToken: requestToken.trim(), createdAt };
    } catch {
        return null;
    }
}

function clearPendingRequestToken() {
    localStorage.removeItem(PENDING_KEY);
}

export function openTmdbAuthPopup() {
    const w = 520;
    const h = 720;
    const left = Math.max(0, Math.floor(window.screenX + (window.outerWidth - w) / 2));
    const top = Math.max(0, Math.floor(window.screenY + (window.outerHeight - h) / 2));

    const popup = window.open(
        "about:blank",
        "tmdb_auth",
        `popup=yes,width=${w},height=${h},left=${left},top=${top}`
    );
    popup?.focus();
    return popup;
}

function parseRequestTokenFromUrl(): string {
    const searchParams = new URLSearchParams(window.location.search);
    const fromSearch = searchParams.get("request_token") || "";
    if (fromSearch) return fromSearch;

    const hash = window.location.hash || "";
    const qIndex = hash.indexOf("?");
    if (qIndex >= 0) {
        const qs = hash.slice(qIndex + 1);
        const fromHash = new URLSearchParams(qs).get("request_token") || "";
        if (fromHash) return fromHash;
    }

    return "";
}

function parseRequestTokenFromUrlLike(urlLike: string) {
    try {
        const url = new URL(urlLike);
        const q = url.searchParams.get("request_token");
        if (q) return q;

        const hash = url.hash || "";
        const idx = hash.indexOf("?");
        if (idx >= 0) {
            const qs = hash.slice(idx + 1);
            const hq = new URLSearchParams(qs);
            const htoken = hq.get("request_token");
            if (htoken) return htoken;
        }
    } catch {
        // ignore
    }
    return "";
}

async function completeTmdbUserLogin(request_token: string) {
    const tokenRes = await tmdbV4Post<TmdbV4CreateAccessTokenResponse>(
        "/auth/access_token",
        { request_token },
        undefined,
        undefined
    );

    const accessToken = tokenRes.access_token;
    const accountId = tokenRes.account_id;

    if (!accessToken || !accountId) {
        throw new Error("Failed to create user access token");
    }

    const sessionRes = await tmdbPost<TmdbV3ConvertSessionResponse>(
        "/authentication/session/convert/4",
        { access_token: accessToken },
        undefined,
        undefined,
        {
            bearerToken: accessToken,
            includeLanguage: false,
        }
    );

    const sessionId = sessionRes.session_id;
    if (!sessionId) {
        throw new Error("Failed to create session id");
    }

    const account = await tmdbGet<TmdbAccountDetails>(
        "/account",
        { session_id: sessionId },
        undefined
    );

    const user: TmdbAuthedUser = {
        accountId: String(account.id ?? accountId),
        sessionId,
        username: account.username || "",
        avatarUrl: pickAvatarUrl(account),
    };

    if (!user.username) {
        user.username = String(accountId);
    }

    const expiresAt = nowMs() + 15 * 60 * 1000;
    const next: TmdbUserAuthState = {
        accessToken,
        expiresAt,
        user,
    };

    writeTmdbUserAuth(next);
    return next;
}

export async function startTmdbUserLoginInPopup(popup: Window) {
    const redirect_to = buildRedirectTo();
    const res = await tmdbV4Post<TmdbV4CreateRequestTokenResponse>(
        "/auth/request_token",
        { redirect_to },
        undefined,
        undefined
    );

    const requestToken = res.request_token;
    if (!requestToken) throw new Error("Failed to create request token");

    const approveUrl = `https://www.themoviedb.org/auth/access?request_token=${encodeURIComponent(
        requestToken
    )}`;

    try {
        popup.location.href = approveUrl;
    } catch {
        // ignore
    }

    const startedAt = nowMs();
    const timeoutMs = 2 * 60 * 1000;

    return await new Promise<TmdbUserAuthState>((resolve, reject) => {
        const id = window.setInterval(() => {
            try {
                if (popup.closed) {
                    window.clearInterval(id);
                    reject(new Error("Login cancelled"));
                    return;
                }

                if (nowMs() - startedAt > timeoutMs) {
                    window.clearInterval(id);
                    try {
                        popup.close();
                    } catch {
                        // ignore
                    }
                    reject(new Error("Login timeout"));
                    return;
                }

                const href = popup.location.href;
                const token = parseRequestTokenFromUrlLike(href);
                if (!token) return;

                window.clearInterval(id);
                try {
                    popup.close();
                } catch {
                    // ignore
                }

                completeTmdbUserLogin(token)
                    .then(resolve)
                    .catch(reject);
            } catch {
                // while on tmdb.org (cross-origin) this will throw, keep polling
            }
        }, 500);
    });
}

function cleanRequestTokenFromUrl() {
    try {
        const url = new URL(window.location.href);
        url.searchParams.delete("request_token");

        if (url.hash.includes("?")) {
            const [hashPath, hashQuery] = url.hash.split("?", 2);
            const qp = new URLSearchParams(hashQuery);
            qp.delete("request_token");
            const qs = qp.toString();
            url.hash = qs ? `${hashPath}?${qs}` : hashPath;
        }

        window.history.replaceState({}, "", url.toString());
    } catch {
        // ignore
    }
}

function buildRedirectTo() {
    const origin = window.location.origin;
    const basePath = window.location.pathname;
    const search = window.location.search;

    const url = new URL(`${origin}${basePath}${search}`);
    url.searchParams.delete("request_token");

    url.hash = "#/movies";
    return url.toString();
}

function gravatarUrl(hash: string, size: number) {
    const normalized = hash.trim();
    if (!normalized) return "";
    return `https://www.gravatar.com/avatar/${normalized}?s=${encodeURIComponent(
        size
    )}&d=identicon`;
}

function pickAvatarUrl(account: TmdbAccountDetails) {
    const tmdbPath = account.avatar?.tmdb?.avatar_path;
    if (tmdbPath) {
        return tmdbImageUrl(tmdbPath, "w92");
    }

    const hash = account.avatar?.gravatar?.hash;
    if (hash) {
        return gravatarUrl(hash, 92);
    }

    return "";
}

export async function startTmdbUserLogin() {
    const redirect_to = buildRedirectTo();
    const res = await tmdbV4Post<TmdbV4CreateRequestTokenResponse>(
        "/auth/request_token",
        { redirect_to },
        undefined,
        undefined
    );

    const requestToken = res.request_token;
    if (!requestToken) throw new Error("Failed to create request token");

    writePendingRequestToken(requestToken);

    const approveUrl = `https://www.themoviedb.org/auth/access?request_token=${encodeURIComponent(
        requestToken
    )}`;

    window.location.assign(approveUrl);
}

export async function completeTmdbUserLoginFromRedirect() {
    const request_token = parseRequestTokenFromUrl();
    if (!request_token) return null;

    const next = await completeTmdbUserLogin(request_token);
    clearPendingRequestToken();
    cleanRequestTokenFromUrl();
    return next;
}

export async function completeTmdbUserLoginFromPending() {
    const pending = readPendingRequestToken();
    if (!pending) return null;

    const maxAgeMs = 10 * 60 * 1000;
    if (nowMs() - pending.createdAt > maxAgeMs) {
        clearPendingRequestToken();
        return null;
    }

    try {
        const next = await completeTmdbUserLogin(pending.requestToken);
        clearPendingRequestToken();
        return next;
    } catch {
        clearPendingRequestToken();
        throw new Error("Failed to complete login");
    }
}
