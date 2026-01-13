import { useEffect, useMemo, useRef } from "react";
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
}: {
    open: boolean;
    status: UserListsStatus;
    kind: UserListKind;
    items: UserListItem[];
    onClose: () => void;
    onChangeKind: (kind: UserListKind) => void;
}) {
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
            onClose();
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
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
    }, [onClose, open]);

    const emptyText = useMemo(() => {
        if (status === "loading") return "Loading…";
        if (status === "error") return "Failed to load.";
        return "Empty.";
    }, [status]);

    if (!open) return null;

    return (
        <div
            className="mv-userlists"
            ref={rootRef}
            role="dialog"
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
                                  "w92"
                              )
                            : "";

                        return (
                            <div
                                key={`${it.mediaType}_${it.id}`}
                                className="mv-userlists__item"
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
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
