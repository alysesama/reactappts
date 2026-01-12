import type { GitHubRepo, GitHubUser } from "./githubTypes";

const GITHUB_API_BASE = "https://api.github.com";

async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url, {
        headers: {
            Accept: "application/vnd.github+json",
        },
    });

    if (!res.ok) {
        const status = res.status;

        if (status === 404) {
            throw new Error("Không tìm thấy user này");
        }

        if (status === 403) {
            throw new Error(
                "GitHub API bị giới hạn hoặc không có quyền truy cập"
            );
        }

        throw new Error("Không thể tải dữ liệu từ GitHub");
    }

    return (await res.json()) as T;
}

export async function fetchGitHubUser(username: string) {
    return await fetchJson<GitHubUser>(
        `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}`
    );
}

export async function fetchGitHubRepos(username: string) {
    const allRepos: GitHubRepo[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const url = `${GITHUB_API_BASE}/users/${encodeURIComponent(
            username
        )}/repos?sort=updated&per_page=100&page=${page}`;

        const repos = await fetchJson<GitHubRepo[]>(url);
        allRepos.push(...repos);

        if (repos.length < 100) {
            hasMore = false;
        } else {
            page += 1;
        }

        if (page > 10) {
            hasMore = false;
        }
    }

    return allRepos;
}
