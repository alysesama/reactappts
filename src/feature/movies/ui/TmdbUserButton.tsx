import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import "@/styles/movies/ui/TmdbUserButton.css";

function maskSecret(value: string) {
    const v = (value || "").trim();
    if (!v) return "";
    if (v.length <= 8) return v;
    return `${v.slice(0, 4)}********${v.slice(-4)}`;
}

export default function TmdbUserButton({
    status,
    error,
    accountId,
    sessionId,
    username,
    avatarUrl,
    accessToken,
    expiresAt,
    onLogin,
    onLogout,
}: {
    status: "idle" | "loading" | "ready" | "error";
    error: string;
    accountId: string;
    sessionId: string;
    username: string;
    avatarUrl: string;
    accessToken: string;
    expiresAt: number | null;
    onLogin: () => void;
    onLogout: () => void;
}) {
    const isAuthed = status === "ready" && !!accessToken;
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;
        const onDocMouseDown = (e: MouseEvent) => {
            const root = rootRef.current;
            if (!root) return;
            if (
                e.target instanceof Node &&
                root.contains(e.target)
            )
                return;
            setOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        document.addEventListener(
            "mousedown",
            onDocMouseDown
        );
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener(
                "mousedown",
                onDocMouseDown
            );
            window.removeEventListener(
                "keydown",
                onKeyDown
            );
        };
    }, [open]);

    const initials = useMemo(() => {
        const u = (username || "").trim();
        if (!u) return "U";
        return u.slice(0, 1).toUpperCase();
    }, [username]);

    if (!isAuthed) {
        return (
            <div className="tmdb-user" ref={rootRef}>
                <button
                    type="button"
                    className="tmdb-user__login"
                    onClick={() => onLogin()}
                    disabled={status === "loading"}
                >
                    {status === "loading"
                        ? "Logging in…"
                        : "Login"}
                </button>
                {status === "error" && error ? (
                    <div className="tmdb-user__error">
                        {error}
                    </div>
                ) : null}
            </div>
        );
    }

    return (
        <div className="tmdb-user" ref={rootRef}>
            <button
                type="button"
                className="tmdb-user__avatar-btn"
                onClick={() => setOpen((v) => !v)}
                aria-label="TMDB user"
                title={username}
            >
                {avatarUrl ? (
                    <img
                        className="tmdb-user__avatar"
                        src={avatarUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <span className="tmdb-user__avatar-fallback">
                        {initials}
                    </span>
                )}
            </button>

            {open ? (
                <div
                    className="tmdb-user__tooltip"
                    role="dialog"
                >
                    <div className="tmdb-user__tooltip-title">
                        TMDB
                    </div>

                    <div className="tmdb-user__row">
                        <div className="tmdb-user__k">
                            Username
                        </div>
                        <div className="tmdb-user__v">
                            {username}
                        </div>
                    </div>

                    <div className="tmdb-user__row">
                        <div className="tmdb-user__k">
                            Account
                        </div>
                        <div className="tmdb-user__v">
                            {accountId}
                        </div>
                    </div>

                    <div className="tmdb-user__row">
                        <div className="tmdb-user__k">
                            Session
                        </div>
                        <div className="tmdb-user__token">
                            {maskSecret(sessionId)}
                        </div>
                    </div>

                    <div className="tmdb-user__row">
                        <div className="tmdb-user__k">
                            Expires
                        </div>
                        <div className="tmdb-user__v">
                            {expiresAt
                                ? new Date(
                                      expiresAt
                                  ).toLocaleString()
                                : ""}
                        </div>
                    </div>

                    <div className="tmdb-user__row tmdb-user__row--token">
                        <div className="tmdb-user__k">
                            User Token
                        </div>
                        <div className="tmdb-user__token">
                            {maskSecret(accessToken)}
                        </div>
                    </div>

                    <button
                        type="button"
                        className="tmdb-user__logout"
                        onClick={() => {
                            setOpen(false);
                            onLogout();
                        }}
                    >
                        Logout
                    </button>
                </div>
            ) : null}
        </div>
    );
}
