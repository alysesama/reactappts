import {
    useCallback,
    useEffect,
    useMemo,
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
import MovieSectionGroup from "./MovieSectionGroup";
import TrendingTab from "../tabs/TrendingTab";
import PopularTab from "../tabs/PopularTab";
import NowPlayingTab from "../tabs/NowPlayingTab";
import SearchTab from "../tabs/SearchTab";
import UpcomingTab from "../tabs/UpcomingTab";

export default function MoviesApp() {
    const [searchText, setSearchText] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<{
        type: "movie" | "tv";
        id: number;
    } | null>(null);

    const debounced = useDebouncedValue(searchText, 350);
    const { status, error, results } =
        useTmdbMovieSearch(debounced);

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
            {showResults ? (
                <div
                    className="movies-search-backdrop"
                    onMouseDown={closeSearch}
                    aria-hidden="true"
                />
            ) : null}

            <div className="movies-shell__top">
                <div className="movies-shell__search">
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
