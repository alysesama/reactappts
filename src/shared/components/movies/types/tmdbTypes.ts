export type TmdbPagedResult<T> = {
    page: number;
    results: T[];
    total_pages: number;
    total_results: number;
};

export type TmdbGenre = {
    id: number;
    name: string;
};

export type TmdbMovie = {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    release_date?: string;
    poster_path: string | null;
    backdrop_path: string | null;
    genre_ids?: number[];
    vote_average: number;
    vote_count: number;
    popularity: number;
};

export type TmdbTv = {
    id: number;
    name: string;
    original_name: string;
    overview: string;
    first_air_date?: string;
    poster_path: string | null;
    backdrop_path: string | null;
    genre_ids?: number[];
    vote_average: number;
    vote_count: number;
    popularity: number;
};

export type TmdbMovieDetails = TmdbMovie & {
    tagline?: string;
    runtime?: number;
    genres?: TmdbGenre[];
    homepage?: string;
    status?: string;
};

export type TmdbTvDetails = TmdbTv & {
    tagline?: string;
    episode_run_time?: number[];
    genres?: TmdbGenre[];
    homepage?: string;
    status?: string;
};

export type TmdbCastMember = {
    id: number;
    name: string;
    character?: string;
    profile_path: string | null;
    order?: number;
};

export type TmdbCredits = {
    id: number;
    cast: TmdbCastMember[];
};

export type TmdbMovieVideo = {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official?: boolean;
};

export type TmdbVideos = {
    id: number;
    results: TmdbMovieVideo[];
};
