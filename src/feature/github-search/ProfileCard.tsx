import "@/styles/github-search/ProfileCard.css";
import type { GitHubUser } from "./githubTypes";

function formatDate(dateString?: string | null) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export default function ProfileCard({
    user,
}: {
    user: GitHubUser;
}) {
    return (
        <div className="github-panel github-panel--info">
            <div className="github-info">
                <div className="github-info__avatar">
                    <img
                        src={user.avatar_url}
                        alt={user.login}
                    />
                </div>
                <div className="github-info__details">
                    <h2 className="github-info__name">
                        <a
                            href={user.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="github-info__link"
                        >
                            {user.name || user.login}
                        </a>
                    </h2>
                    <p className="github-info__username">
                        @{user.login}
                    </p>
                    <p className="github-info__bio">
                        {user.bio || "No bio available."}
                    </p>
                    <div className="github-info__stats">
                        <div className="github-stat">
                            <span className="github-stat__label">
                                Repos
                            </span>
                            <span className="github-stat__value">
                                {user.public_repos}
                            </span>
                        </div>
                        <div className="github-stat">
                            <span className="github-stat__label">
                                Followers
                            </span>
                            <span className="github-stat__value">
                                {user.followers}
                            </span>
                        </div>
                        <div className="github-stat">
                            <span className="github-stat__label">
                                Following
                            </span>
                            <span className="github-stat__value">
                                {user.following}
                            </span>
                        </div>
                    </div>
                    <div className="github-info__extra">
                        <div className="github-info__row">
                            <span className="github-info__row-label">
                                Company:
                            </span>
                            <span className="github-info__row-value">
                                {user.company || "None"}
                            </span>
                        </div>
                        <div className="github-info__row">
                            <span className="github-info__row-label">
                                Location:
                            </span>
                            <span className="github-info__row-value">
                                {user.location
                                    ? user.location
                                          .charAt(0)
                                          .toUpperCase() +
                                      user.location.slice(1)
                                    : "None"}
                            </span>
                        </div>
                        <div className="github-info__row">
                            <span className="github-info__row-label">
                                Website:
                            </span>
                            <span className="github-info__row-value">
                                {user.blog ? (
                                    <a
                                        href={user.blog}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {user.blog}
                                    </a>
                                ) : (
                                    "None"
                                )}
                            </span>
                        </div>
                        <div className="github-info__row">
                            <span className="github-info__row-label">
                                Twitter:
                            </span>
                            <span className="github-info__row-value">
                                {user.twitter_username ? (
                                    <a
                                        href={`https://twitter.com/${user.twitter_username}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        @
                                        {
                                            user.twitter_username
                                        }
                                    </a>
                                ) : (
                                    "None"
                                )}
                            </span>
                        </div>
                        <div className="github-info__row">
                            <span className="github-info__row-label">
                                Email:
                            </span>
                            <span className="github-info__row-value">
                                {user.email || "None"}
                            </span>
                        </div>
                        <div className="github-info__row">
                            <span className="github-info__row-label">
                                Account created:
                            </span>
                            <span className="github-info__row-value">
                                {formatDate(
                                    user.created_at
                                )}
                            </span>
                        </div>
                        <div className="github-info__row">
                            <span className="github-info__row-label">
                                Last activity:
                            </span>
                            <span className="github-info__row-value">
                                {formatDate(
                                    user.updated_at
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
