import type { FormEvent } from "react";
import "@/styles/github-search/FilterBar.css";
import type { SearchStatus } from "./githubTypes";

export default function FilterBar({
    username,
    onUsernameChange,
    onSubmit,
    status,
}: {
    username: string;
    onUsernameChange: (next: string) => void;
    onSubmit: () => void;
    status: SearchStatus;
}) {
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <form
            className="github-search__form"
            onSubmit={handleSubmit}
        >
            <input
                type="text"
                className="github-search__input"
                placeholder="Nhập GitHub username..."
                value={username}
                onChange={(e) =>
                    onUsernameChange(e.target.value)
                }
            />
            <button
                type="submit"
                className="github-search__button"
                disabled={status === "loading"}
            >
                {status === "loading"
                    ? "Đang tìm..."
                    : "Tìm kiếm"}
            </button>
        </form>
    );
}
