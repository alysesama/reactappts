import "@/styles/github-search/RepoList.css";
import type {
    GitHubRepo,
    RepoSortField,
    RepoSortOrder,
} from "./githubTypes";
import RepoItem from "./RepoItem";

export default function RepoList({
    repos,
    sortField,
    onSortFieldChange,
    sortOrder,
    onToggleSortOrder,
    searchText,
    onSearchTextChange,
}: {
    repos: GitHubRepo[];
    sortField: RepoSortField;
    onSortFieldChange: (field: RepoSortField) => void;
    sortOrder: RepoSortOrder;
    onToggleSortOrder: () => void;
    searchText: string;
    onSearchTextChange: (next: string) => void;
}) {
    return (
        <div className="github-panel github-panel--repos">
            <div className="github-repos">
                <div className="github-repos__header">
                    <h3 className="github-repos__title">
                        Repositories ({repos.length})
                    </h3>
                    <div className="github-repos__controls">
                        <button
                            type="button"
                            className="github-repos__sort-toggle"
                            onClick={onToggleSortOrder}
                        >
                            {sortOrder === "asc"
                                ? "↑"
                                : "↓"}
                        </button>
                        <select
                            className="github-repos__sort-select"
                            value={sortField}
                            onChange={(e) =>
                                onSortFieldChange(
                                    e.target
                                        .value as RepoSortField
                                )
                            }
                        >
                            <option value="stars">
                                Stars
                            </option>
                            <option value="name">
                                Repo name
                            </option>
                            <option value="forks">
                                Forks
                            </option>
                            <option value="watchers">
                                Watchers
                            </option>
                            <option value="created_at">
                                Create time
                            </option>
                            <option value="updated_at">
                                Last update
                            </option>
                            <option value="language">
                                Language
                            </option>
                            <option value="license">
                                License
                            </option>
                        </select>
                        <input
                            type="text"
                            className="github-repos__search-input"
                            placeholder="Search by keyword (name, desc, language, license)..."
                            value={searchText}
                            onChange={(e) =>
                                onSearchTextChange(
                                    e.target.value
                                )
                            }
                        />
                    </div>
                </div>
                {repos.length === 0 ? (
                    <div className="github-repos__empty">
                        Không có repository nào
                    </div>
                ) : (
                    <div className="github-repos__grid">
                        {repos.map((repo) => (
                            <RepoItem
                                key={repo.id}
                                repo={repo}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
