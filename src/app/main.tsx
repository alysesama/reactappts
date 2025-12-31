import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import AppRoutes from "./routes";
import "../styles/global.css";

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <HashRouter>
            <AppRoutes />
        </HashRouter>
    </React.StrictMode>
);
