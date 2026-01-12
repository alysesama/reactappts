import { Outlet } from "react-router-dom";
import { APP_PAGES } from "@/app/pageRegistry";
import BottomNavbar from "@/feature/main/BottomNavbar";
import ContentContainer from "@/feature/main/ContentContainer";
import "@/styles/main/Main.css";

export default function Main() {
    return (
        <div className="app-shell">
            <ContentContainer>
                <Outlet />
            </ContentContainer>

            <BottomNavbar pages={APP_PAGES} />
        </div>
    );
}
