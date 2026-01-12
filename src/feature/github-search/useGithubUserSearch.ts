import { useEffect, useMemo, useState } from "react";
import { fetchGitHubRepos, fetchGitHubUser } from "./githubApi";
import type {
    GitHubRepo,
    GitHubUser,
    RepoSortField,
    RepoSortOrder,
    SearchStatus,
} from "./githubTypes";

function useDebouncedValue<T>(value: T, delayMs: number) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const id = window.setTimeout(() => {
            setDebounced(value);
        }, delayMs);

        return () => {
            window.clearTimeout(id);
        };
    }, [value, delayMs]);

    return debounced;
}

export function useGithubUserSearch() {
    const [username, setUsername] = useState("");
    const [userInfo, setUserInfo] = useState<GitHubUser | null>(null);
    const [repos, setRepos] = useState<GitHubRepo[]>([]);

    const [sortField, setSortField] = useState<RepoSortField>("stars");
    const [sortOrder, setSortOrder] = useState<RepoSortOrder>("desc");

    const [searchText, setSearchText] = useState("");
    const debouncedSearchText = useDebouncedValue(searchText, 400);

    const [status, setStatus] = useState<SearchStatus>("idle");
    const [error, setError] = useState("");

    const handleSubmitUsername = async () => {
        const trimmed = username.trim();
        if (!trimmed) {
            setError("Vui lòng nhập username");
            return;
        }

        setStatus("loading");
        setError("");
        setUserInfo(null);
        setRepos([]);
        setSortField("stars");
        setSortOrder("desc");
        setSearchText("");

        try {
            const userData = await fetchGitHubUser(trimmed);
            setUserInfo(userData);

            const allRepos = await fetchGitHubRepos(trimmed);
            setRepos(allRepos);

            setStatus("success");
        } catch (e) {
            setStatus("error");
            setError(
                e instanceof Error
                    ? e.message
                    : "Đã xảy ra lỗi khi tìm kiếm user"
            );
        }
    };

    const handleToggleSortOrder = () => {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    };

    const processedRepos = useMemo(() => {
        const items = repos;

        const keywords = debouncedSearchText
            .split(",")
            .map((kw) => kw.trim().toLowerCase())
            .filter(Boolean);

        let filtered = items;
        if (keywords.length > 0) {
            filtered = items.filter((repo) => {
                const licenseText =
                    repo.license?.spdx_id || repo.license?.key || "";
                const topicsText = Array.isArray(repo.topics)
                    ? repo.topics.join(" ")
                    : "";

                const haystack = (
                    (repo.name || "") +
                    " " +
                    (repo.description || "") +
                    " " +
                    (repo.language || "") +
                    " " +
                    licenseText +
                    " " +
                    topicsText
                ).toLowerCase();

                return keywords.every((kw) => haystack.includes(kw));
            });
        }

        const getPrimaryValue = (repo: GitHubRepo) => {
            switch (sortField) {
                case "name":
                    return (repo.name || "").toLowerCase();
                case "stars":
                    return repo.stargazers_count || 0;
                case "forks":
                    return repo.forks_count || 0;
                case "watchers":
                    return repo.watchers_count || 0;
                case "created_at":
                    return new Date(repo.created_at).getTime();
                case "updated_at":
                    return new Date(repo.updated_at).getTime();
                case "language":
                    return (repo.language || "").toLowerCase();
                case "license":
                    return (
                        repo.license?.spdx_id || repo.license?.key || ""
                    ).toLowerCase();
                default:
                    return repo.stargazers_count || 0;
            }
        };

        const getSecondaryValue = (repo: GitHubRepo) =>
            (repo.name || "").toLowerCase();

        return [...filtered].sort((a, b) => {
            const av = getPrimaryValue(a);
            const bv = getPrimaryValue(b);

            if (av < bv) {
                return sortOrder === "asc" ? -1 : 1;
            }
            if (av > bv) {
                return sortOrder === "asc" ? 1 : -1;
            }

            const an = getSecondaryValue(a);
            const bn = getSecondaryValue(b);
            return an.localeCompare(bn);
        });
    }, [repos, sortField, sortOrder, debouncedSearchText]);

    return {
        username,
        setUsername,
        userInfo,
        repos,
        sortField,
        setSortField,
        sortOrder,
        searchText,
        setSearchText,
        status,
        error,
        processedRepos,
        handleSubmitUsername,
        handleToggleSortOrder,
    };
}
