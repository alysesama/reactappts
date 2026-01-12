import "@/styles/github-search/GitHubUserSearch.css";
import FilterBar from "./FilterBar";
import ProfileCard from "./ProfileCard";
import RepoList from "./RepoList";
import { useGithubUserSearch } from "./useGithubUserSearch";

export default function GitHubUserSearch() {
    const {
        username,
        setUsername,
        userInfo,
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
    } = useGithubUserSearch();

    return (
        <div className="github-search">
            <FilterBar
                username={username}
                onUsernameChange={setUsername}
                onSubmit={handleSubmitUsername}
                status={status}
            />

            {error ? (
                <div className="github-search__error">
                    {error}
                </div>
            ) : null}

            {userInfo ? (
                <div className="github-panels">
                    <ProfileCard user={userInfo} />
                    <RepoList
                        repos={processedRepos}
                        sortField={sortField}
                        onSortFieldChange={setSortField}
                        sortOrder={sortOrder}
                        onToggleSortOrder={
                            handleToggleSortOrder
                        }
                        searchText={searchText}
                        onSearchTextChange={setSearchText}
                    />
                </div>
            ) : null}
        </div>
    );
}
