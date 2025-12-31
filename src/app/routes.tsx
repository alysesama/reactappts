import { Route, Routes } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import HomePage from "../pages/HomePage";
import WorkspacePage from "../pages/WorkspacePage";
import NotFoundPage from "../pages/NotFoundPage";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<RootLayout />}>
                <Route index element={<HomePage />} />
                <Route
                    path="workspace"
                    element={<WorkspacePage />}
                />
                <Route
                    path="*"
                    element={<NotFoundPage />}
                />
            </Route>
        </Routes>
    );
}
