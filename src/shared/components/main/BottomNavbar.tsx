import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { NavLink } from "react-router-dom";
import {
    getPagePath,
    type AppPage,
} from "@/app/pageRegistry";
import "@/styles/main/BottomNavbar.css";

export default function BottomNavbar({
    pages,
}: {
    pages: AppPage[];
}) {
    const navRef = useRef<HTMLElement | null>(null);
    const [isScrollable, setIsScrollable] = useState(false);

    const recomputeScrollable = useCallback(() => {
        const maxTabsBeforeScroll = 6;
        const minTabWidthPx = 200;

        const el = navRef.current;
        if (!el) return;

        const width = el.clientWidth;
        const tabWidth = pages.length
            ? width / pages.length
            : width;

        setIsScrollable(
            pages.length > maxTabsBeforeScroll ||
                tabWidth < minTabWidthPx
        );
    }, [pages.length]);

    useEffect(() => {
        const id = window.setTimeout(() => {
            recomputeScrollable();
        }, 0);

        const onResize = () => recomputeScrollable();
        window.addEventListener("resize", onResize);

        const ro =
            "ResizeObserver" in window
                ? new ResizeObserver(() => {
                      recomputeScrollable();
                  })
                : null;
        if (ro && navRef.current)
            ro.observe(navRef.current);

        return () => {
            window.clearTimeout(id);
            window.removeEventListener("resize", onResize);
            ro?.disconnect();
        };
    }, [recomputeScrollable]);

    return (
        <nav
            ref={navRef}
            className={`app-nav${
                isScrollable ? " app-nav--scroll" : ""
            }`}
        >
            {pages.map((p) => (
                <NavLink
                    key={p.link}
                    to={`/${getPagePath(p)}`}
                    className={({ isActive }) =>
                        `app-nav__item${
                            isActive ? " is-active" : ""
                        }`
                    }
                    title={p.description}
                >
                    <span className="app-nav__icon">
                        {p.iconClass ? (
                            <i
                                className={p.iconClass}
                                aria-hidden="true"
                            />
                        ) : null}
                    </span>
                    <span className="app-nav__label">
                        {p.name}
                    </span>
                </NavLink>
            ))}
        </nav>
    );
}
