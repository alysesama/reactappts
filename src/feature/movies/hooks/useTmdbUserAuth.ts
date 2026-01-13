import { useCallback, useEffect, useMemo, useState } from "react";
import {
    clearTmdbUserAuth,
    completeTmdbUserLoginFromPending,
    completeTmdbUserLoginFromRedirect,
    readTmdbUserAuth,
    startTmdbUserLogin,
    type TmdbUserAuthState,
} from "../auth/tmdbUserAuth";

export type TmdbUserAuthStatus = "idle" | "loading" | "ready" | "error";

export function useTmdbUserAuth() {
    const [state, setState] = useState<TmdbUserAuthState | null>(() => {
        if (typeof window === "undefined") return null;
        return readTmdbUserAuth();
    });

    const [status, setStatus] = useState<TmdbUserAuthStatus>(() =>
        state ? "ready" : "idle"
    );
    const [error, setError] = useState<string>("");
    const [loginSuccessAt, setLoginSuccessAt] = useState<number | null>(null);

    useEffect(() => {
        if (!state) return;

        const ms = Math.max(0, state.expiresAt - Date.now());
        const id = window.setTimeout(() => {
            clearTmdbUserAuth();
            setState(null);
            setStatus("idle");
        }, ms);

        return () => window.clearTimeout(id);
    }, [state]);

    useEffect(() => {
        if (state) return;

        const requestTokenPresent = (() => {
            const s = new URLSearchParams(window.location.search);
            if (s.get("request_token")) return true;

            const hash = window.location.hash || "";
            const idx = hash.indexOf("?");
            if (idx >= 0) {
                const q = hash.slice(idx + 1);
                const hs = new URLSearchParams(q);
                if (hs.get("request_token")) return true;
            }

            return false;
        })();

        if (requestTokenPresent) {
            setStatus("loading");
            setError("");

            completeTmdbUserLoginFromRedirect()
                .then((next) => {
                    if (!next) {
                        setStatus("idle");
                        return;
                    }
                    setState(next);
                    setStatus("ready");
                    setLoginSuccessAt(Date.now());
                })
                .catch((e: unknown) => {
                    setStatus("error");
                    setError(
                        e instanceof Error ? e.message : "Unknown error"
                    );
                });
            return;
        }

        completeTmdbUserLoginFromPending()
            .then((next) => {
                if (!next) return;
                setState(next);
                setStatus("ready");
                setLoginSuccessAt(Date.now());
            })
            .catch((e: unknown) => {
                setStatus("error");
                setError(e instanceof Error ? e.message : "Unknown error");
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = useCallback(() => {
        setError("");
        setStatus("loading");
        void startTmdbUserLogin();
    }, []);

    const logout = useCallback(() => {
        clearTmdbUserAuth();
        setState(null);
        setStatus("idle");
        setError("");
        setLoginSuccessAt(null);
    }, []);

    const user = useMemo(() => state?.user ?? null, [state]);
    const accessToken = state?.accessToken ?? "";

    return {
        status,
        error,
        state,
        user,
        accessToken,
        loginSuccessAt,
        login,
        logout,
    };
}
