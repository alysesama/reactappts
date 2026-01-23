import type { ComponentType } from "react";
import HomePage from "../pages/HomePage";
import MoviesPage from "../pages/MoviesPage";
import MSRPage from "../pages/MSRPage";
import GitHubUserSearchPage from "../pages/GitHubUserSearchPage";
import TodoAppPage from "../pages/TodoAppPage";

export const PAGE_COMPONENTS: Record<
    string,
    ComponentType<Record<string, never>>
> = {
    HomePage,
    MoviesPage,
    MSRPage,
    GitHubUserSearchPage,
    TodoAppPage,
};
