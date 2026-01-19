import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import "@/styles/movies/ui/MoviesApp.css";
import "@/styles/movies/ui/Section2Group.css";
import "@/styles/movies/ui/Section2Panel.css";

import SearchBar from "./SearchBar";
import SearchResults from "./SearchResults";
import MovieDetailPanel from "./MovieDetailPanel";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useTmdbMovieSearch } from "../hooks/useTmdbMovieSearch";
import { useTmdbUserAuth } from "../hooks/useTmdbUserAuth";
import { useMoviesNotifications } from "../hooks/useMoviesNotifications";
import { useTmdbUserLists } from "../hooks/useTmdbUserLists";
import MoviesNotifications from "./MoviesNotifications";
import MoviesUserListsPanel from "./MoviesUserListsPanel";
import TmdbUserButton from "./TmdbUserButton";
import MovieSectionGroup from "./MovieSectionGroup";
import TrendingTab from "../tabs/TrendingTab";
import PopularTab from "../tabs/PopularTab";
import NowPlayingTab from "../tabs/NowPlayingTab";
import SearchTab from "../tabs/SearchTab";
import UpcomingTab from "../tabs/UpcomingTab";
import MoviesDebugPanel from "./MoviesDebugPanel";
import { useMoviesDebugRefreshId } from "../debug/useMoviesDebug";

function MoviesAppInner() {
    const [searchText, setSearchText] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<{
        type: "movie" | "tv";
        id: number;
    } | null>(null);

    const isDev = import.meta.env.DEV;
    const [isDebugOpen, setIsDebugOpen] = useState(false);

    const debounced = useDebouncedValue(searchText, 350);
    const { status, error, results } =
        useTmdbMovieSearch(debounced);

    const tmdbAuth = useTmdbUserAuth();
    const {
        items: notifItems,
        notify,
        close: closeNotif,
    } = useMoviesNotifications();
    const lastUserDataErrorRef = useRef<string>("");

    const LOGIN_NOTIF_SIG_KEY =
        "TMDB_LOGIN_SUCCESS_NOTIF_SIG_V1";

    const isLoggedIn =
        tmdbAuth.status === "ready" &&
        !!tmdbAuth.user?.sessionId;

    const userLists = useTmdbUserLists({
        enabled: isLoggedIn,
        accountId: tmdbAuth.user?.accountId ?? "",
        sessionId: tmdbAuth.user?.sessionId ?? "",
        refreshKey: tmdbAuth.loginSuccessAt,
    });

    const [userListsOpen, setUserListsOpen] =
        useState(false);
    const [userListsKind, setUserListsKind] = useState<
        "favorite" | "watchlist"
    >("favorite");

    const userListsCloseTimerRef = useRef<number | null>(
        null,
    );

    const openUserLists = useCallback(() => {
        if (userListsCloseTimerRef.current) {
            window.clearTimeout(
                userListsCloseTimerRef.current,
            );
            userListsCloseTimerRef.current = null;
        }
        setUserListsOpen(true);
    }, []);

    const scheduleCloseUserLists = useCallback(() => {
        if (userListsCloseTimerRef.current) {
            window.clearTimeout(
                userListsCloseTimerRef.current,
            );
        }
        userListsCloseTimerRef.current = window.setTimeout(
            () => {
                setUserListsOpen(false);
                userListsCloseTimerRef.current = null;
            },
            120,
        );
    }, []);

    useEffect(() => {
        return () => {
            if (userListsCloseTimerRef.current) {
                window.clearTimeout(
                    userListsCloseTimerRef.current,
                );
                userListsCloseTimerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!tmdbAuth.loginSuccessAt) return;
        const expiresAt = tmdbAuth.state?.expiresAt;
        if (!expiresAt) return;

        const sig = `${tmdbAuth.user?.sessionId ?? ""}_${expiresAt}`;
        const lastSig = sessionStorage.getItem(
            LOGIN_NOTIF_SIG_KEY,
        );
        if (lastSig && lastSig === sig) return;

        notify({
            type: "good",
            message: `Login successfully, session expired at ${new Date(
                expiresAt,
            ).toLocaleString()}`,
        });
        sessionStorage.setItem(LOGIN_NOTIF_SIG_KEY, sig);
    }, [
        notify,
        tmdbAuth.loginSuccessAt,
        tmdbAuth.user?.sessionId,
        tmdbAuth.state?.expiresAt,
    ]);

    useEffect(() => {
        if (!isLoggedIn) {
            lastUserDataErrorRef.current = "";
            return;
        }
        if (
            userLists.status !== "error" ||
            !userLists.error
        )
            return;

        const msg = `Something is wrong when trying to load user data: ${userLists.error}`;
        if (lastUserDataErrorRef.current === msg) return;
        lastUserDataErrorRef.current = msg;

        notify({
            type: "bad",
            message: msg,
        });
    }, [
        isLoggedIn,
        notify,
        userLists.error,
        userLists.status,
    ]);

    const showResults = useMemo(() => {
        const hasQuery = searchText.trim().length > 0;
        return isSearchOpen && hasQuery;
    }, [isSearchOpen, searchText]);

    const closeSearch = useCallback(() => {
        setIsSearchOpen(false);
    }, []);

    const handlePickMovie = useCallback((id: number) => {
        setSelectedMedia({ type: "movie", id });
        setIsSearchOpen(false);
    }, []);

    const handlePickTv = useCallback((id: number) => {
        setSelectedMedia({ type: "tv", id });
        setIsSearchOpen(false);
    }, []);

    useEffect(() => {
        if (!showResults) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closeSearch();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener(
                "keydown",
                onKeyDown,
            );
        };
    }, [showResults, closeSearch]);

    const handleCloseDetail = useCallback(() => {
        setSelectedMedia(null);
    }, []);

    return (
        <div className="movies-shell">
            <MoviesNotifications
                items={notifItems}
                onClose={closeNotif}
            />
            <div className="movies-vw-guard" role="alert">
                <div className="movies-vw-guard__panel">
                    <div className="movies-vw-guard__title">
                        Screen too small
                    </div>
                    <div className="movies-vw-guard__text">
                        Please expand your window to at
                        least 1280px wide to view Movies.
                    </div>
                </div>
            </div>

            {showResults ? (
                <div
                    className="movies-search-backdrop"
                    onMouseDown={closeSearch}
                    aria-hidden="true"
                />
            ) : null}

            <div className="movies-shell__top">
                <div className="movies-shell__search">
                    {isDev ? (
                        <button
                            type="button"
                            className="movies-debug-toggle"
                            aria-label="Movies debug"
                            onClick={() =>
                                setIsDebugOpen((v) => !v)
                            }
                        >
                            <i
                                className="fa-solid fa-bug"
                                aria-hidden="true"
                            />
                        </button>
                    ) : null}

                    <div className="movies-shell__search-main">
                        <SearchBar
                            value={searchText}
                            onChange={setSearchText}
                            onFocus={() =>
                                setIsSearchOpen(true)
                            }
                            onClear={() => closeSearch()}
                            placeholder="Search movies (TMDB)..."
                        />

                        <SearchResults
                            visible={showResults}
                            status={status}
                            error={error}
                            results={results}
                            onPickMovie={(id) =>
                                handlePickMovie(id)
                            }
                        />

                        {isDev ? (
                            <MoviesDebugPanel
                                open={isDebugOpen}
                                onClose={() =>
                                    setIsDebugOpen(false)
                                }
                            />
                        ) : null}
                    </div>

                    <div className="movies-shell__account">
                        {isLoggedIn ? (
                            <div className="movies-account__lists-wrap">
                                <button
                                    type="button"
                                    className="movies-account__lists"
                                    aria-label="User lists"
                                    onMouseEnter={
                                        openUserLists
                                    }
                                    onMouseLeave={
                                        scheduleCloseUserLists
                                    }
                                    onFocus={openUserLists}
                                >
                                    <i
                                        className="fa-solid fa-table-list"
                                        aria-hidden="true"
                                    />
                                </button>

                                <MoviesUserListsPanel
                                    open={
                                        isLoggedIn &&
                                        userListsOpen
                                    }
                                    status={
                                        userLists.status
                                    }
                                    kind={userListsKind}
                                    items={
                                        userListsKind ===
                                        "favorite"
                                            ? userLists.favoriteAll
                                            : userLists.watchlistAll
                                    }
                                    onClose={() =>
                                        setUserListsOpen(
                                            false,
                                        )
                                    }
                                    onChangeKind={
                                        setUserListsKind
                                    }
                                    onPickMedia={(m: {
                                        type:
                                            | "movie"
                                            | "tv";
                                        id: number;
                                    }) => {
                                        setSelectedMedia({
                                            type: m.type,
                                            id: m.id,
                                        });
                                        setUserListsOpen(
                                            false,
                                        );
                                    }}
                                    onMouseEnter={
                                        openUserLists
                                    }
                                    onMouseLeave={
                                        scheduleCloseUserLists
                                    }
                                />
                            </div>
                        ) : null}

                        <TmdbUserButton
                            status={tmdbAuth.status}
                            error={tmdbAuth.error}
                            accountId={
                                tmdbAuth.user?.accountId ??
                                ""
                            }
                            sessionId={
                                tmdbAuth.user?.sessionId ??
                                ""
                            }
                            username={
                                tmdbAuth.user?.username ??
                                ""
                            }
                            avatarUrl={
                                tmdbAuth.user?.avatarUrl ??
                                ""
                            }
                            accessToken={
                                tmdbAuth.accessToken
                            }
                            expiresAt={
                                tmdbAuth.state?.expiresAt ??
                                null
                            }
                            onLogin={tmdbAuth.login}
                            onLogout={() => {
                                setUserListsOpen(false);
                                sessionStorage.removeItem(
                                    LOGIN_NOTIF_SIG_KEY,
                                );
                                tmdbAuth.logout();
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="movies-shell__content">
                <MovieSectionGroup variant="single">
                    <TrendingTab
                        onPickMovie={handlePickMovie}
                        accountId={
                            tmdbAuth.user?.accountId ?? ""
                        }
                        sessionId={
                            tmdbAuth.user?.sessionId ?? ""
                        }
                        userListsStatus={userLists.status}
                        isFavoriteMovie={
                            userLists.isFavoriteMovie
                        }
                        isWatchlistMovie={
                            userLists.isWatchlistMovie
                        }
                        setFavoriteMovieLocal={
                            userLists.setFavoriteMovieLocal
                        }
                        setWatchlistMovieLocal={
                            userLists.setWatchlistMovieLocal
                        }
                    />
                </MovieSectionGroup>

                <MovieSectionGroup className="movies-section-group--section2">
                    <PopularTab
                        onPickTv={handlePickTv}
                        accountId={
                            tmdbAuth.user?.accountId ?? ""
                        }
                        sessionId={
                            tmdbAuth.user?.sessionId ?? ""
                        }
                        userListsStatus={userLists.status}
                        isFavorite={userLists.isFavorite}
                        isWatchlist={userLists.isWatchlist}
                        setFavoriteLocal={
                            userLists.setFavoriteLocal
                        }
                        setWatchlistLocal={
                            userLists.setWatchlistLocal
                        }
                    />
                    <NowPlayingTab
                        onPickMovie={handlePickMovie}
                        accountId={
                            tmdbAuth.user?.accountId ?? ""
                        }
                        sessionId={
                            tmdbAuth.user?.sessionId ?? ""
                        }
                        userListsStatus={userLists.status}
                        isFavorite={userLists.isFavorite}
                        isWatchlist={userLists.isWatchlist}
                        setFavoriteLocal={
                            userLists.setFavoriteLocal
                        }
                        setWatchlistLocal={
                            userLists.setWatchlistLocal
                        }
                    />
                    <UpcomingTab
                        onPickMovie={handlePickMovie}
                        accountId={
                            tmdbAuth.user?.accountId ?? ""
                        }
                        sessionId={
                            tmdbAuth.user?.sessionId ?? ""
                        }
                        userListsStatus={userLists.status}
                        isFavorite={userLists.isFavorite}
                        isWatchlist={userLists.isWatchlist}
                        setFavoriteLocal={
                            userLists.setFavoriteLocal
                        }
                        setWatchlistLocal={
                            userLists.setWatchlistLocal
                        }
                    />
                </MovieSectionGroup>

                <MovieSectionGroup>
                    <SearchTab
                        onPickMedia={({ type, id }) =>
                            type === "movie"
                                ? handlePickMovie(id)
                                : handlePickTv(id)
                        }
                        accountId={
                            tmdbAuth.user?.accountId ?? ""
                        }
                        sessionId={
                            tmdbAuth.user?.sessionId ?? ""
                        }
                        userListsStatus={userLists.status}
                        isFavorite={userLists.isFavorite}
                        isWatchlist={userLists.isWatchlist}
                        setFavoriteLocal={
                            userLists.setFavoriteLocal
                        }
                        setWatchlistLocal={
                            userLists.setWatchlistLocal
                        }
                    />
                </MovieSectionGroup>
            </div>

            <MovieDetailPanel
                media={selectedMedia}
                onClose={handleCloseDetail}
            />
        </div>
    );
}

export default function MoviesApp() {
    const isDev = import.meta.env.DEV;

    if (!isDev) return <MoviesAppInner />;

    return <MoviesAppDev />;
}

function MoviesAppDev() {
    const refreshId = useMoviesDebugRefreshId();
    return <MoviesAppInner key={refreshId} />;
}
