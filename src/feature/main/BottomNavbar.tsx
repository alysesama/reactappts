import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { NavLink, useLocation } from "react-router-dom";
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
    const location = useLocation();
    const [isScrollable, setIsScrollable] = useState(false);
    const [activeIndicator, setActiveIndicator] = useState<{
        x: number;
        width: number;
        visible: boolean;
    }>({ x: 0, width: 0, visible: false });

    const recomputeActiveIndicator = useCallback(() => {
        const nav = navRef.current;
        if (!nav) return;

        const active = nav.querySelector(
            ".app-nav__item.is-active"
        ) as HTMLElement | null;

        if (!active) {
            setActiveIndicator((prev) =>
                prev.visible
                    ? { ...prev, visible: false }
                    : prev
            );
            return;
        }

        setActiveIndicator({
            x: active.offsetLeft,
            width: active.offsetWidth,
            visible: true,
        });
    }, []);

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

        recomputeActiveIndicator();
    }, [pages.length, recomputeActiveIndicator]);

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

    useLayoutEffect(() => {
        const id = window.requestAnimationFrame(() => {
            recomputeActiveIndicator();
        });

        return () => {
            window.cancelAnimationFrame(id);
        };
    }, [
        location.pathname,
        pages.length,
        recomputeActiveIndicator,
    ]);

    return (
        <nav
            ref={navRef}
            className={`app-nav${
                isScrollable ? " app-nav--scroll" : ""
            }`}
        >
            <span
                className="app-nav__active-indicator"
                style={{
                    width: activeIndicator.width,
                    transform: `translateX(${activeIndicator.x}px)`,
                    opacity: activeIndicator.visible
                        ? 1
                        : 0,
                }}
            />
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
