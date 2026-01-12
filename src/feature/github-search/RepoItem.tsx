import "@/styles/github-search/RepoItem.css";
import type { GitHubRepo } from "./githubTypes";

function formatDate(dateString?: string | null) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export default function RepoItem({
    repo,
}: {
    repo: GitHubRepo;
}) {
    const licenseText =
        repo.license?.spdx_id || repo.license?.key || null;

    return (
        <div className="github-repo-item">
            <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="github-repo-item__name"
            >
                {repo.name}
            </a>
            <p className="github-repo-item__description">
                {repo.description ||
                    "Không có mô tả cho repository này."}
            </p>
            <div className="github-repo-item__topics">
                {Array.isArray(repo.topics) &&
                repo.topics.length > 0 ? (
                    repo.topics.map((topic) => (
                        <a
                            key={topic}
                            href={`https://github.com/topics/${topic}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="github-repo-item__topic-pill"
                        >
                            {topic}
                        </a>
                    ))
                ) : (
                    <span className="github-repo-item__topic-empty">
                        Không có topic
                    </span>
                )}
            </div>
            <div className="github-repo-item__meta">
                <div className="github-repo-item__meta-top">
                    <div className="github-repo-item__meta-left">
                        {repo.language ? (
                            <a
                                href={`https://github.com/search?q=language:${repo.language}&type=repositories`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="github-repo-item__meta-link"
                            >
                                {repo.language}
                            </a>
                        ) : (
                            <span className="github-repo-item__meta-text">
                                N/A
                            </span>
                        )}
                        <a
                            href={`${repo.html_url}/stargazers`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="github-repo-item__meta-link"
                        >
                            ⭐ {repo.stargazers_count}
                        </a>
                        <a
                            href={`${repo.html_url}/network/members`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="github-repo-item__meta-link"
                        >
                            🍴 {repo.forks_count}
                        </a>
                        <a
                            href={`${repo.html_url}/watchers`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="github-repo-item__meta-link"
                        >
                            👁 {repo.watchers_count}
                        </a>
                    </div>
                </div>
                <div className="github-repo-item__meta-bottom">
                    <div className="github-repo-item__meta-license">
                        {licenseText ? (
                            repo.license?.url ? (
                                <a
                                    href={repo.license.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="github-repo-item__meta-link"
                                >
                                    {licenseText}
                                </a>
                            ) : (
                                <span className="github-repo-item__meta-text">
                                    {licenseText}
                                </span>
                            )
                        ) : (
                            <span className="github-repo-item__meta-text">
                                N/A
                            </span>
                        )}
                    </div>
                    <span className="github-repo-item__update">
                        Cập nhật:{" "}
                        {formatDate(repo.updated_at)}
                    </span>
                </div>
            </div>
        </div>
    );
}
