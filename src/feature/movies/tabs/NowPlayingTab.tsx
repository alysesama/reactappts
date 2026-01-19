import { useMemo } from "react";
import MediaRowCarousel, {
    type MediaRowCarouselItem,
} from "../ui/MediaRowCarousel";
import Section2TabShell from "../ui/Section2TabShell";
import MoviesTabError from "../ui/MoviesTabError";
import { useTmdbGenres } from "../hooks/useTmdbGenres";
import { useTmdbMovieList } from "../hooks/useTmdbMovieList";
import type {
    UserListItem,
    UserListsStatus,
} from "../hooks/useTmdbUserLists";

export default function NowPlayingTab({
    onPickMovie,
    accountId,
    sessionId,
    userListsStatus,
    isFavorite,
    isWatchlist,
    setFavoriteLocal,
    setWatchlistLocal,
}: {
    onPickMovie: (movieId: number) => void;
    accountId: string;
    sessionId: string;
    userListsStatus: UserListsStatus;
    isFavorite: (
        mediaType: "movie" | "tv",
        id: number,
    ) => boolean;
    isWatchlist: (
        mediaType: "movie" | "tv",
        id: number,
    ) => boolean;
    setFavoriteLocal: (
        item: UserListItem,
        active: boolean,
    ) => void;
    setWatchlistLocal: (
        item: UserListItem,
        active: boolean,
    ) => void;
}) {
    const { status, error, movies, refetch } =
        useTmdbMovieList("/movie/now_playing");

    const { genreMap } = useTmdbGenres();

    const items = useMemo(() => {
        return movies
            .slice(0, 10)
            .map((m): MediaRowCarouselItem => {
                const genreId = (m.genre_ids ?? [])[0];
                const genre = genreId
                    ? (genreMap[genreId] ?? "")
                    : "";

                return {
                    id: m.id,
                    mediaType: "movie",
                    title: m.title,
                    backdrop_path: m.backdrop_path,
                    poster_path: m.poster_path,
                    genre,
                    rating: m.vote_average ?? 0,
                };
            });
    }, [genreMap, movies]);

    return (
        <Section2TabShell label="Now playing">
            {status === "error" ? (
                <MoviesTabError
                    error={error}
                    onRetry={() => refetch()}
                />
            ) : (
                <MediaRowCarousel
                    items={items}
                    onPick={onPickMovie}
                    accountId={accountId}
                    sessionId={sessionId}
                    userListsStatus={userListsStatus}
                    isFavorite={isFavorite}
                    isWatchlist={isWatchlist}
                    setFavoriteLocal={setFavoriteLocal}
                    setWatchlistLocal={setWatchlistLocal}
                />
            )}

            {status === "loading" && items.length === 0 ? (
                <div className="movies-tab__loading">
                    Loading...
                </div>
            ) : null}
        </Section2TabShell>
    );
}
