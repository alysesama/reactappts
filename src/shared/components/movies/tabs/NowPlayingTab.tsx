import { useMemo } from "react";
import MediaRowCarousel, {
    type MediaRowCarouselItem,
} from "../ui/MediaRowCarousel";
import Section2TabShell from "../ui/Section2TabShell";
import { useTmdbGenres } from "../hooks/useTmdbGenres";
import { useTmdbMovieList } from "../hooks/useTmdbMovieList";

export default function NowPlayingTab({
    onPickMovie,
}: {
    onPickMovie: (movieId: number) => void;
}) {
    const { status, error, movies } = useTmdbMovieList(
        "/movie/now_playing"
    );

    const { genreMap } = useTmdbGenres();

    const items = useMemo(() => {
        return movies
            .slice(0, 10)
            .map((m): MediaRowCarouselItem => {
                const genreId = (m.genre_ids ?? [])[0];
                const genre = genreId
                    ? genreMap[genreId] ?? ""
                    : "";

                return {
                    id: m.id,
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
                <div className="movies-tab__error">
                    {error || "Failed to load"}
                </div>
            ) : null}

            <MediaRowCarousel
                items={items}
                onPick={onPickMovie}
            />

            {status === "loading" && items.length === 0 ? (
                <div className="movies-tab__loading">
                    Loading...
                </div>
            ) : null}
        </Section2TabShell>
    );
}
