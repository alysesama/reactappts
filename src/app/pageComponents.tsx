import type { ComponentType } from "react";
import HomePage from "../pages/HomePage";
import GitHubUserSearchPage from "../pages/GitHubUserSearchPage";
import TodoAppPage from "../pages/TodoAppPage";
import WorkspacePage from "../pages/WorkspacePage";

export const PAGE_COMPONENTS: Record<
    string,
    ComponentType<Record<string, never>>
> = {
    HomePage,
    GitHubUserSearchPage,
    TodoAppPage,
    WorkspacePage,
    WorkspacePage1: WorkspacePage,
    WorkspacePage2: WorkspacePage,
    WorkspacePage3: WorkspacePage,
    WorkspacePage4: WorkspacePage,
};
