// import { Link } from "react-router-dom";
import Weather from "../feature/home/Weather";
import HomeMenu from "../feature/home/HomeMenu";
import "@/styles/home/HomePage.css";

export default function HomePage() {
    return (
        <section className="home-page">
            <div className="home-page__left">
                <Weather />
            </div>
            <div className="home-page__right">
                <HomeMenu />
            </div>
        </section>
    );
}
