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
import MoviesNotifications from "./MoviesNotifications";
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
    const lastLoginNotifiedAtRef = useRef<number | null>(
        null
    );

    useEffect(() => {
        if (!tmdbAuth.loginSuccessAt) return;
        if (
            lastLoginNotifiedAtRef.current ===
            tmdbAuth.loginSuccessAt
        )
            return;
        const expiresAt = tmdbAuth.state?.expiresAt;
        if (!expiresAt) return;

        notify({
            type: "good",
            message: `Đăng nhập thành công, session hết hạn lúc ${new Date(
                expiresAt
            ).toLocaleString()}`,
        });
        lastLoginNotifiedAtRef.current =
            tmdbAuth.loginSuccessAt;
    }, [
        notify,
        tmdbAuth.loginSuccessAt,
        tmdbAuth.state?.expiresAt,
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
                onKeyDown
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
                            onLogout={tmdbAuth.logout}
                        />
                    </div>
                </div>
            </div>

            <div className="movies-shell__content">
                <MovieSectionGroup variant="single">
                    <TrendingTab
                        onPickMovie={handlePickMovie}
                    />
                </MovieSectionGroup>

                <MovieSectionGroup className="movies-section-group--section2">
                    <PopularTab onPickTv={handlePickTv} />
                    <NowPlayingTab
                        onPickMovie={handlePickMovie}
                    />
                    <UpcomingTab
                        onPickMovie={handlePickMovie}
                    />
                </MovieSectionGroup>

                <MovieSectionGroup>
                    <SearchTab
                        onPickMedia={({ type, id }) =>
                            type === "movie"
                                ? handlePickMovie(id)
                                : handlePickTv(id)
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
