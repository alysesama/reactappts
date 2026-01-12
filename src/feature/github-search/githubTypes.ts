export type GitHubLicense = {
    key?: string | null;
    spdx_id?: string | null;
    url?: string | null;
};

export type GitHubUser = {
    login: string;
    name: string | null;
    avatar_url: string;
    html_url: string;
    bio: string | null;
    public_repos: number;
    followers: number;
    following: number;
    company: string | null;
    location: string | null;
    blog: string | null;
    twitter_username: string | null;
    email: string | null;
    created_at: string;
    updated_at: string;
};

export type GitHubRepo = {
    id: number;
    name: string;
    description: string | null;
    html_url: string;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    watchers_count: number;
    created_at: string;
    updated_at: string;
    topics?: string[];
    license?: GitHubLicense | null;
};

export type RepoSortField =
    | "stars"
    | "name"
    | "forks"
    | "watchers"
    | "created_at"
    | "updated_at"
    | "language"
    | "license";

export type RepoSortOrder = "asc" | "desc";

export type SearchStatus = "idle" | "loading" | "success" | "error";
