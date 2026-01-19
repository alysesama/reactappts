import { useMemo } from "react";
import MediaRowCarousel, {
    type MediaRowCarouselItem,
} from "../ui/MediaRowCarousel";
import Section2TabShell from "../ui/Section2TabShell";
import MoviesTabError from "../ui/MoviesTabError";
import { useTmdbTvGenres } from "../hooks/useTmdbTvGenres";
import { useTmdbTvList } from "../hooks/useTmdbTvList";
import type {
    UserListItem,
    UserListsStatus,
} from "../hooks/useTmdbUserLists";

export default function PopularTab({
    onPickTv,
    accountId,
    sessionId,
    userListsStatus,
    isFavorite,
    isWatchlist,
    setFavoriteLocal,
    setWatchlistLocal,
}: {
    onPickTv: (tvId: number) => void;
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
    const { status, error, tv, refetch } =
        useTmdbTvList("/tv/popular");
    const { genreMap } = useTmdbTvGenres();

    const items = useMemo(() => {
        return tv
            .slice(0, 10)
            .map((t): MediaRowCarouselItem => {
                const genreId = (t.genre_ids ?? [])[0];
                const genre = genreId
                    ? (genreMap[genreId] ?? "")
                    : "";

                return {
                    id: t.id,
                    mediaType: "tv",
                    title: t.name,
                    backdrop_path: t.backdrop_path,
                    poster_path: t.poster_path,
                    genre,
                    rating: t.vote_average ?? 0,
                };
            });
    }, [genreMap, tv]);

    return (
        <Section2TabShell label="Popular TV show">
            {status === "error" ? (
                <MoviesTabError
                    error={error}
                    onRetry={() => refetch()}
                />
            ) : (
                <MediaRowCarousel
                    items={items}
                    onPick={onPickTv}
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
