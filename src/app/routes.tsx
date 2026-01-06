import { Navigate, Route, Routes } from "react-router-dom";
import { APP_PAGES, getPagePath } from "./pageRegistry";
import { PAGE_COMPONENTS } from "./pageComponents";
import Main from "../pages/Main";
import NotFoundPage from "../pages/NotFoundPage";

const DEFAULT_PAGE_PATH = APP_PAGES[0]
    ? getPagePath(APP_PAGES[0])
    : "home";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Main />}>
                <Route
                    index
                    element={
                        <Navigate
                            to={DEFAULT_PAGE_PATH}
                            replace
                        />
                    }
                />
                {APP_PAGES.map((p) => {
                    const Component =
                        PAGE_COMPONENTS[p.link];
                    if (!Component) return null;

                    return (
                        <Route
                            key={p.link}
                            path={getPagePath(p)}
                            element={<Component />}
                        />
                    );
                })}
                <Route
                    path="*"
                    element={<NotFoundPage />}
                />
            </Route>
        </Routes>
    );
}
