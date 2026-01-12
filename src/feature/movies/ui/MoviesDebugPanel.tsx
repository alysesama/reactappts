import "@/styles/movies/ui/MoviesDebugPanel.css";
import {
    bumpMoviesDebugRefreshId,
    resetMoviesDebugConfig,
    updateMoviesDebugConfig,
    type MoviesDebugHttpStatus,
} from "../debug/moviesDebugConfig";
import {
    useMoviesDebugConfig,
    useMoviesDebugRefreshId,
} from "../debug/useMoviesDebug";

function formatMs(ms: number) {
    return `${ms}ms`;
}

export default function MoviesDebugPanel({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const cfg = useMoviesDebugConfig();
    const refreshId = useMoviesDebugRefreshId();

    if (!open) return null;

    return (
        <div className="mv-debug">
            <div
                className="mv-debug__backdrop"
                onMouseDown={onClose}
                aria-hidden="true"
            />

            <div
                className="mv-debug__panel"
                role="dialog"
                aria-modal="true"
            >
                <div className="mv-debug__header">
                    <div className="mv-debug__title">
                        Movies debug
                    </div>
                    <button
                        type="button"
                        className="mv-debug__close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <div className="mv-debug__body">
                    <label className="mv-debug__row mv-debug__row--toggle">
                        <input
                            type="checkbox"
                            checked={cfg.enabled}
                            onChange={(e) => {
                                const enabled =
                                    e.target.checked;
                                updateMoviesDebugConfig(
                                    (p) => ({
                                        ...p,
                                        enabled,
                                    })
                                );
                            }}
                        />
                        <span className="mv-debug__row-label">
                            Enabled
                        </span>
                    </label>

                    <div className="mv-debug__group">
                        <div className="mv-debug__group-title">
                            Auth
                        </div>
                        <select
                            className="mv-debug__select"
                            value={cfg.authMode}
                            onChange={(e) => {
                                const v = e.target.value as
                                    | "normal"
                                    | "missing"
                                    | "invalid";
                                updateMoviesDebugConfig(
                                    (p) => ({
                                        ...p,
                                        authMode: v,
                                    })
                                );
                            }}
                        >
                            <option value="normal">
                                Normal
                            </option>
                            <option value="missing">
                                Missing token/key
                            </option>
                            <option value="invalid">
                                Invalid token/key
                            </option>
                        </select>
                    </div>

                    <div className="mv-debug__group">
                        <div className="mv-debug__group-title">
                            URL
                        </div>
                        <select
                            className="mv-debug__select"
                            value={cfg.urlMode}
                            onChange={(e) => {
                                const v = e.target.value as
                                    | "normal"
                                    | "bad_path"
                                    | "bad_base";
                                updateMoviesDebugConfig(
                                    (p) => ({
                                        ...p,
                                        urlMode: v,
                                    })
                                );
                            }}
                        >
                            <option value="normal">
                                Normal
                            </option>
                            <option value="bad_path">
                                Bad path
                            </option>
                            <option value="bad_base">
                                Bad base
                            </option>
                        </select>
                    </div>

                    <div className="mv-debug__group">
                        <div className="mv-debug__group-title">
                            HTTP simulate
                        </div>
                        <label className="mv-debug__row mv-debug__row--toggle">
                            <input
                                type="checkbox"
                                checked={
                                    cfg.httpSim.enabled
                                }
                                onChange={(e) => {
                                    const enabled =
                                        e.target.checked;
                                    updateMoviesDebugConfig(
                                        (p) => ({
                                            ...p,
                                            httpSim: {
                                                ...p.httpSim,
                                                enabled,
                                            },
                                        })
                                    );
                                }}
                            />
                            <span className="mv-debug__row-label">
                                Enable status
                            </span>
                        </label>

                        <select
                            className="mv-debug__select"
                            value={cfg.httpSim.status}
                            onChange={(e) => {
                                const s = Number(
                                    e.target.value
                                ) as MoviesDebugHttpStatus;
                                updateMoviesDebugConfig(
                                    (p) => ({
                                        ...p,
                                        httpSim: {
                                            ...p.httpSim,
                                            status: s,
                                        },
                                    })
                                );
                            }}
                            disabled={!cfg.httpSim.enabled}
                        >
                            <option value={401}>401</option>
                            <option value={404}>404</option>
                            <option value={429}>429</option>
                            <option value={500}>500</option>
                        </select>
                    </div>

                    <div className="mv-debug__group">
                        <div className="mv-debug__group-title">
                            Delay
                        </div>
                        <div className="mv-debug__row">
                            <div className="mv-debug__row-label">
                                {formatMs(cfg.delayMs)}
                            </div>
                            <input
                                className="mv-debug__range"
                                type="range"
                                min={0}
                                max={5000}
                                step={50}
                                value={cfg.delayMs}
                                onChange={(e) => {
                                    const delayMs = Number(
                                        e.target.value
                                    );
                                    updateMoviesDebugConfig(
                                        (p) => ({
                                            ...p,
                                            delayMs,
                                        })
                                    );
                                }}
                            />
                        </div>
                    </div>

                    <div className="mv-debug__group">
                        <div className="mv-debug__group-title">
                            200 bad data
                        </div>

                        <div className="mv-debug__row">
                            <div className="mv-debug__row-label">
                                Mode
                            </div>
                            <select
                                className="mv-debug__select"
                                value={cfg.bad200.mode}
                                onChange={(e) => {
                                    const mode = e.target
                                        .value as
                                        | "off"
                                        | "soft"
                                        | "hard";
                                    updateMoviesDebugConfig(
                                        (p) => ({
                                            ...p,
                                            bad200: {
                                                ...p.bad200,
                                                mode,
                                            },
                                        })
                                    );
                                }}
                            >
                                <option value="off">
                                    Off
                                </option>
                                <option value="soft">
                                    Soft bad
                                </option>
                                <option value="hard">
                                    Hard bad
                                </option>
                            </select>
                        </div>

                        <div className="mv-debug__row">
                            <div className="mv-debug__row-label">
                                Pick
                            </div>
                            <select
                                className="mv-debug__select"
                                value={cfg.bad200.pick}
                                onChange={(e) => {
                                    const pick = e.target
                                        .value as
                                        | "all"
                                        | "random";
                                    updateMoviesDebugConfig(
                                        (p) => ({
                                            ...p,
                                            bad200: {
                                                ...p.bad200,
                                                pick,
                                            },
                                        })
                                    );
                                }}
                                disabled={
                                    cfg.bad200.mode ===
                                    "off"
                                }
                            >
                                <option value="all">
                                    All
                                </option>
                                <option value="random">
                                    Random
                                </option>
                            </select>
                        </div>

                        <div className="mv-debug__row">
                            <div className="mv-debug__row-label">
                                Rate
                            </div>
                            <input
                                className="mv-debug__input"
                                type="number"
                                min={0}
                                max={1}
                                step={0.05}
                                value={cfg.bad200.rate}
                                disabled={
                                    cfg.bad200.mode ===
                                        "off" ||
                                    cfg.bad200.pick !==
                                        "random"
                                }
                                onChange={(e) => {
                                    const rate = Number(
                                        e.target.value
                                    );
                                    updateMoviesDebugConfig(
                                        (p) => ({
                                            ...p,
                                            bad200: {
                                                ...p.bad200,
                                                rate: Number.isFinite(
                                                    rate
                                                )
                                                    ? Math.max(
                                                          0,
                                                          Math.min(
                                                              1,
                                                              rate
                                                          )
                                                      )
                                                    : p
                                                          .bad200
                                                          .rate,
                                            },
                                        })
                                    );
                                }}
                            />
                        </div>

                        <div className="mv-debug__targets">
                            {(
                                [
                                    [
                                        "trending",
                                        "Trending",
                                    ],
                                    [
                                        "nowPlaying",
                                        "Now playing",
                                    ],
                                    [
                                        "upcoming",
                                        "Upcoming",
                                    ],
                                    [
                                        "popularTv",
                                        "Popular TV",
                                    ],
                                    [
                                        "searchMovie",
                                        "Search",
                                    ],
                                    [
                                        "discover",
                                        "Discover",
                                    ],
                                    ["detail", "Detail"],
                                    ["genres", "Genres"],
                                ] as const
                            ).map(([key, label]) => (
                                <label
                                    key={key}
                                    className="mv-debug__target"
                                >
                                    <input
                                        type="checkbox"
                                        checked={
                                            cfg.bad200
                                                .targets[
                                                key
                                            ]
                                        }
                                        disabled={
                                            cfg.bad200
                                                .mode ===
                                            "off"
                                        }
                                        onChange={(e) => {
                                            const checked =
                                                e.target
                                                    .checked;
                                            updateMoviesDebugConfig(
                                                (p) => ({
                                                    ...p,
                                                    bad200: {
                                                        ...p.bad200,
                                                        targets:
                                                            {
                                                                ...p
                                                                    .bad200
                                                                    .targets,
                                                                [key]: checked,
                                                            },
                                                    },
                                                })
                                            );
                                        }}
                                    />
                                    <span>{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mv-debug__footer">
                    <button
                        type="button"
                        className="mv-debug__btn"
                        onClick={() =>
                            bumpMoviesDebugRefreshId()
                        }
                    >
                        Refresh ({refreshId})
                    </button>

                    <button
                        type="button"
                        className="mv-debug__btn mv-debug__btn--ghost"
                        onClick={() =>
                            resetMoviesDebugConfig()
                        }
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
}
