import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import "@/styles/movies/ui/MoviesUserListsPanel.css";
import type {
    UserListItem,
    UserListKind,
    UserListsStatus,
} from "../hooks/useTmdbUserLists";
import { tmdbImageUrl } from "../api/tmdbImage";

function formatTitle(item: UserListItem) {
    return item.title;
}

export default function MoviesUserListsPanel({
    open,
    status,
    kind,
    items,
    onClose,
    onChangeKind,
    onPickMedia,
    onMouseEnter,
    onMouseLeave,
}: {
    open: boolean;
    status: UserListsStatus;
    kind: UserListKind;
    items: UserListItem[];
    onClose: () => void;
    onChangeKind: (kind: UserListKind) => void;
    onPickMedia?: (m: {
        type: "movie" | "tv";
        id: number;
    }) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const closeTimerRef = useRef<number | null>(null);
    const effectTimerRef = useRef<number | null>(null);
    const [rendered, setRendered] = useState(false);
    const [phase, setPhase] = useState<
        "opening" | "open" | "closing"
    >("open");

    useEffect(() => {
        if (effectTimerRef.current) {
            window.clearTimeout(effectTimerRef.current);
            effectTimerRef.current = null;
        }

        if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }

        if (open) {
            effectTimerRef.current = window.setTimeout(
                () => {
                    setRendered(true);
                    setPhase("opening");
                    window.requestAnimationFrame(() => {
                        setPhase("open");
                    });
                    effectTimerRef.current = null;
                },
                0,
            );
            return;
        }

        if (!rendered) return;
        effectTimerRef.current = window.setTimeout(() => {
            setPhase("closing");
            closeTimerRef.current = window.setTimeout(
                () => {
                    setRendered(false);
                    setPhase("open");
                    closeTimerRef.current = null;
                },
                160,
            );
            effectTimerRef.current = null;
        }, 0);
    }, [open, rendered]);

    useEffect(() => {
        if (!rendered || !open) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener(
                "keydown",
                onKeyDown,
            );
        };
    }, [onClose, open, rendered]);

    const emptyText = useMemo(() => {
        if (status === "loading") return "Loading…";
        if (status === "error") return "Failed to load.";
        return "Empty.";
    }, [status]);

    if (!rendered) return null;

    const className =
        phase === "open"
            ? "mv-userlists mv-userlists--open"
            : phase === "closing"
              ? "mv-userlists mv-userlists--closing"
              : "mv-userlists";

    return (
        <div
            className={className}
            ref={rootRef}
            role="dialog"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="mv-userlists__nav">
                <button
                    type="button"
                    className={
                        kind === "favorite"
                            ? "mv-userlists__tab mv-userlists__tab--active"
                            : "mv-userlists__tab"
                    }
                    onClick={() => onChangeKind("favorite")}
                >
                    Favorite
                </button>
                <button
                    type="button"
                    className={
                        kind === "watchlist"
                            ? "mv-userlists__tab mv-userlists__tab--active"
                            : "mv-userlists__tab"
                    }
                    onClick={() =>
                        onChangeKind("watchlist")
                    }
                >
                    Watchlist
                </button>
            </div>

            <div
                className="mv-userlists__list"
                aria-label="User lists"
            >
                {items.length === 0 ? (
                    <div className="mv-userlists__empty">
                        {emptyText}
                    </div>
                ) : (
                    items.map((it) => {
                        const title = formatTitle(it);
                        const posterUrl = it.poster_path
                            ? tmdbImageUrl(
                                  it.poster_path,
                                  "w92",
                              )
                            : "";

                        return (
                            <button
                                type="button"
                                key={`${it.mediaType}_${it.id}`}
                                className="mv-userlists__item"
                                onClick={() =>
                                    onPickMedia?.({
                                        type: it.mediaType,
                                        id: it.id,
                                    })
                                }
                            >
                                <div className="mv-userlists__thumb">
                                    {posterUrl ? (
                                        <img
                                            src={posterUrl}
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    ) : (
                                        <i
                                            className="fa-regular fa-image"
                                            aria-hidden="true"
                                        />
                                    )}
                                </div>
                                <div className="mv-userlists__meta">
                                    <div className="mv-userlists__title">
                                        {title}
                                    </div>
                                    <div className="mv-userlists__sub">
                                        {it.mediaType ===
                                        "movie"
                                            ? "Movie"
                                            : "TV"}
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
