import "@/styles/movies/ui/MovieSection.css";
import MovieCard from "./MovieCard";
import { useTmdbMovieList } from "../hooks/useTmdbMovieList";

export default function MovieSection({
    title,
    path,
    onPickMovie,
}: {
    title: string;
    path: string;
    onPickMovie: (movieId: number) => void;
}) {
    const { status, error, movies, refetch } =
        useTmdbMovieList(path);

    return (
        <section className="movie-section">
            <header className="movie-section__header">
                <h2 className="movie-section__title">
                    {title}
                </h2>
                {status === "error" ? (
                    <button
                        type="button"
                        className="movie-section__retry"
                        onClick={() => refetch()}
                    >
                        Retry
                    </button>
                ) : null}
            </header>

            {status === "error" ? (
                <div className="movie-section__error">
                    {error || "Failed to load"}
                </div>
            ) : null}

            <div className="movie-section__row" role="list">
                {movies.map((m) => (
                    <div
                        key={m.id}
                        className="movie-section__item"
                        role="listitem"
                    >
                        <MovieCard
                            movie={m}
                            onClick={() =>
                                onPickMovie(m.id)
                            }
                        />
                    </div>
                ))}

                {status === "loading" &&
                movies.length === 0 ? (
                    <div className="movie-section__loading">
                        Loading...
                    </div>
                ) : null}
            </div>
        </section>
    );
}
