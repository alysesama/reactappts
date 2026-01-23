import { Link } from "react-router-dom";
import { APP_PAGES, getPagePath } from "@/app/pageRegistry";
import "@/styles/home/HomeMenu.css";

export default function HomeMenu() {
    const pages = APP_PAGES.filter(
        (p) => p.link !== "HomePage",
    );

    return (
        <section className="home-menu test">
            <div className="home-menu__grid">
                {pages.map((p) => {
                    const to = `/${getPagePath(p)}`;
                    return (
                        <Link
                            key={p.link}
                            className="home-menu__item"
                            to={to}
                        >
                            <div className="home-menu__item-top">
                                <i
                                    className={`home-menu__icon ${p.iconClass}`}
                                />
                                <div className="home-menu__name">
                                    {p.name}
                                </div>
                            </div>
                            <div className="home-menu__desc">
                                {p.description}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
