import "@/styles/movies/ui/MediaRowCarousel.css";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import MediaBackdropOverlayCard from "./MediaBackdropOverlayCard";

const TRANSITION_MS = 380;
const DEFAULT_AUTO_MS = 9000;

export type MediaRowCarouselItem = {
    id: number;
    title: string;
    backdrop_path: string | null;
    poster_path: string | null;
    genre: string;
    rating: number;
};

function wrapIndex(i: number, len: number) {
    if (len <= 0) return 0;
    const m = i % len;
    return m < 0 ? m + len : m;
}

export default function MediaRowCarousel({
    items,
    onPick,
    autoMs = DEFAULT_AUTO_MS,
}: {
    items: MediaRowCarouselItem[];
    onPick: (id: number) => void;
    autoMs?: number;
}) {
    const len = items.length;

    const [startIndex, setStartIndex] = useState(0);
    const startIndexRef = useRef(0);

    const [isTransitioning, setIsTransitioning] =
        useState(false);
    const isTransitioningRef = useRef(false);

    const [direction, setDirection] = useState<
        "next" | "prev" | null
    >(null);

    const [offsetPx, setOffsetPx] = useState(0);
    const [disableTransition, setDisableTransition] =
        useState(false);

    const stepPxRef = useRef(0);
    const lastMeasuredStepPxRef = useRef(0);
    const trackRef = useRef<HTMLDivElement | null>(null);
    const firstCellRef = useRef<HTMLDivElement | null>(
        null
    );

    const transitionTimeoutRef = useRef<number | null>(
        null
    );

    const autoTimeoutRef = useRef<number | null>(null);
    const autoTickRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        startIndexRef.current = startIndex;
    }, [startIndex]);

    useEffect(() => {
        isTransitioningRef.current = isTransitioning;
    }, [isTransitioning]);

    const measureStepPx = useCallback(() => {
        const cell = firstCellRef.current;
        const track = trackRef.current;
        if (!cell || !track) return 0;

        const rect = cell.getBoundingClientRect();
        const styles = window.getComputedStyle(track);
        const gapRaw =
            styles.gap || styles.columnGap || "0px";
        const gap = Number.parseFloat(gapRaw) || 0;

        const next = rect.width + gap;
        if (!Number.isFinite(next) || next <= 0) return 0;

        stepPxRef.current = next;
        lastMeasuredStepPxRef.current = next;
        return next;
    }, []);

    const cancelTransitionAndReset = useCallback(() => {
        if (transitionTimeoutRef.current !== null) {
            window.clearTimeout(
                transitionTimeoutRef.current
            );
            transitionTimeoutRef.current = null;
        }

        setDisableTransition(true);
        setDirection(null);
        setOffsetPx(0);
        setIsTransitioning(false);
        isTransitioningRef.current = false;

        window.requestAnimationFrame(() => {
            setDisableTransition(false);
        });
    }, []);

    useEffect(() => {
        // Ensure step is measured after DOM updates on items changes.
        const id = window.setTimeout(() => {
            measureStepPx();
        }, 0);
        return () => window.clearTimeout(id);
    }, [items.length, measureStepPx]);

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        const ro = new ResizeObserver(() => {
            const prev = lastMeasuredStepPxRef.current;
            const next = measureStepPx();
            if (!next || !prev) return;

            // If viewport size changes, the previously animated offset
            // may become incorrect. Reset immediately to avoid a visible
            // "slide then snap back" glitch.
            if (Math.abs(next - prev) > 0.5) {
                if (
                    isTransitioningRef.current ||
                    offsetPx !== 0
                ) {
                    cancelTransitionAndReset();
                }
            }
        });

        ro.observe(track);
        return () => {
            ro.disconnect();
        };
    }, [cancelTransitionAndReset, measureStepPx, offsetPx]);

    useEffect(() => {
        const id = window.setTimeout(() => {
            setStartIndex(0);
            startIndexRef.current = 0;
            setIsTransitioning(false);
            isTransitioningRef.current = false;
            setDirection(null);
            setOffsetPx(0);
            setDisableTransition(false);
        }, 0);

        return () => {
            window.clearTimeout(id);
        };
    }, [items.length]);

    const visible = useMemo(() => {
        if (len === 0) return [] as MediaRowCarouselItem[];

        if (!direction) {
            return new Array(5)
                .fill(0)
                .map(
                    (_, i) =>
                        items[
                            wrapIndex(startIndex + i, len)
                        ]
                )
                .filter(Boolean);
        }

        if (direction === "next") {
            return new Array(6)
                .fill(0)
                .map(
                    (_, i) =>
                        items[
                            wrapIndex(startIndex + i, len)
                        ]
                )
                .filter(Boolean);
        }

        return new Array(6)
            .fill(0)
            .map(
                (_, i) =>
                    items[
                        wrapIndex(startIndex - 1 + i, len)
                    ]
            )
            .filter(Boolean);
    }, [direction, items, len, startIndex]);

    const clearAuto = useCallback(() => {
        if (autoTimeoutRef.current !== null) {
            window.clearTimeout(autoTimeoutRef.current);
            autoTimeoutRef.current = null;
        }
    }, []);

    const scheduleAuto = useCallback(() => {
        clearAuto();
        if (len < 2) return;

        autoTimeoutRef.current = window.setTimeout(() => {
            autoTickRef.current?.();
        }, autoMs);
    }, [autoMs, clearAuto, len]);

    useEffect(() => {
        scheduleAuto();
        return () => {
            clearAuto();
        };
    }, [clearAuto, scheduleAuto]);

    useEffect(() => {
        return () => {
            clearAuto();
        };
    }, [clearAuto]);

    const resetAfterTransition = useCallback(
        (nextStartIndex: number) => {
            setDisableTransition(true);
            setStartIndex(nextStartIndex);
            startIndexRef.current = nextStartIndex;
            setDirection(null);
            setOffsetPx(0);
            setIsTransitioning(false);
            isTransitioningRef.current = false;

            window.requestAnimationFrame(() => {
                setDisableTransition(false);
            });
        },
        []
    );

    const startNext = useCallback(() => {
        if (len < 2) return;
        if (isTransitioningRef.current) return;

        clearAuto();

        const step = stepPxRef.current;
        if (!step) {
            const next = wrapIndex(
                startIndexRef.current + 1,
                len
            );
            setStartIndex(next);
            startIndexRef.current = next;
            scheduleAuto();
            return;
        }

        setIsTransitioning(true);
        isTransitioningRef.current = true;

        setDirection("next");
        setDisableTransition(true);
        setOffsetPx(0);

        window.requestAnimationFrame(() => {
            setDisableTransition(false);
            setOffsetPx(-step);
        });

        if (transitionTimeoutRef.current !== null) {
            window.clearTimeout(
                transitionTimeoutRef.current
            );
            transitionTimeoutRef.current = null;
        }

        transitionTimeoutRef.current = window.setTimeout(
            () => {
                const next = wrapIndex(
                    startIndexRef.current + 1,
                    len
                );
                resetAfterTransition(next);
                scheduleAuto();
                transitionTimeoutRef.current = null;
            },
            TRANSITION_MS
        );
    }, [
        clearAuto,
        len,
        resetAfterTransition,
        scheduleAuto,
    ]);

    useEffect(() => {
        if (len < 2) {
            autoTickRef.current = null;
            return;
        }

        autoTickRef.current = () => {
            startNext();
        };
    }, [len, startNext]);

    const startPrev = useCallback(() => {
        if (len < 2) return;
        if (isTransitioningRef.current) return;

        clearAuto();

        const step = stepPxRef.current;
        if (!step) {
            const next = wrapIndex(
                startIndexRef.current - 1,
                len
            );
            setStartIndex(next);
            startIndexRef.current = next;
            scheduleAuto();
            return;
        }

        setIsTransitioning(true);
        isTransitioningRef.current = true;

        setDirection("prev");
        setDisableTransition(true);
        setOffsetPx(-step);

        window.requestAnimationFrame(() => {
            setDisableTransition(false);
            setOffsetPx(0);
        });

        if (transitionTimeoutRef.current !== null) {
            window.clearTimeout(
                transitionTimeoutRef.current
            );
            transitionTimeoutRef.current = null;
        }

        transitionTimeoutRef.current = window.setTimeout(
            () => {
                const next = wrapIndex(
                    startIndexRef.current - 1,
                    len
                );
                resetAfterTransition(next);
                scheduleAuto();
                transitionTimeoutRef.current = null;
            },
            TRANSITION_MS
        );
    }, [
        clearAuto,
        len,
        resetAfterTransition,
        scheduleAuto,
    ]);

    const canNav = len >= 2 && !isTransitioning;

    return (
        <div className="mv-row-carousel">
            <button
                type="button"
                className="mv-row-carousel__nav mv-row-carousel__nav--prev"
                aria-label="Previous"
                onClick={startPrev}
                disabled={!canNav}
            >
                <span className="mv-row-carousel__nav-icon">
                    <i
                        className="fa-solid fa-angle-left"
                        aria-hidden="true"
                    />
                </span>
            </button>

            <button
                type="button"
                className="mv-row-carousel__nav mv-row-carousel__nav--next"
                aria-label="Next"
                onClick={startNext}
                disabled={!canNav}
            >
                <span className="mv-row-carousel__nav-icon">
                    <i
                        className="fa-solid fa-angle-right"
                        aria-hidden="true"
                    />
                </span>
            </button>

            <div className="mv-row-carousel__viewport">
                <div
                    ref={trackRef}
                    className={`mv-row-carousel__track${
                        direction
                            ? ` is-animating is-animating--${direction}`
                            : ""
                    }${
                        disableTransition
                            ? " is-resetting"
                            : ""
                    }`}
                    style={{
                        transform: `translate3d(${offsetPx}px, 0, 0)`,
                    }}
                >
                    {visible.map((m, idx) => (
                        <div
                            key={`${m.id}-${idx}`}
                            className="mv-row-carousel__cell"
                            ref={
                                idx === 0
                                    ? firstCellRef
                                    : undefined
                            }
                        >
                            <MediaBackdropOverlayCard
                                title={m.title}
                                backdropPath={
                                    m.backdrop_path
                                }
                                posterPath={m.poster_path}
                                genre={m.genre}
                                rating={m.rating}
                                onClick={() => onPick(m.id)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
