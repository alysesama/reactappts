import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import "@/styles/home/Weather.css";

import WeatherDailyPanel from "./WeatherDailyPanel";
import WeatherHourlyPanel from "./WeatherHourlyPanel";
import WeatherInfoPanel from "./WeatherInfoPanel";
import WeatherDebugPanel from "./WeatherDebugPanel";
import {
    getDefaultWeatherDebugConfig,
    type WeatherDebugConfig,
} from "./WeatherDebugConfig";

const DEBUG_UI_ENABLED = import.meta.env.DEV;
const DEFAULT_DEBUG = getDefaultWeatherDebugConfig();

type GeoState =
    | { status: "idle" | "loading" }
    | { status: "error"; message: string }
    | {
          status: "ready";
          coords: {
              lat: number;
              lon: number;
              accuracy?: number;
          };
      };

type WeatherInfo = {
    nextRefreshTime: number;
    address: string | null;
    coords: { lat: number; lon: number } | null;
    current: unknown;
    hourly: unknown;
    daily: unknown;
};

type WeatherState =
    | { status: "idle" | "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; info: WeatherInfo };

const STORAGE_KEY = "weather_info";
const DEBUG_STORAGE_KEY = "weather_debug";
const REFRESH_SECONDS = 1800;

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function getProp(obj: unknown, key: string): unknown {
    return isRecord(obj) ? obj[key] : undefined;
}

function corruptCurrentPayload(value: unknown): unknown {
    if (isRecord(value)) {
        return {
            ...value,
            dt: "bad",
            temp: "bad",
            feels_like: "bad",
            weather: "bad",
        };
    }
    return {
        dt: "bad",
        temp: "bad",
        feels_like: "bad",
        weather: "bad",
    };
}

function corruptHourlyPayload(): unknown {
    return [
        { dt: "bad", temp: "bad", weather: [] },
        null,
        123,
        { dt: Number.NaN, temp: 99999, weather: [{}] },
    ];
}

function corruptDailyPayload(): unknown {
    return [
        {
            dt: "bad",
            temp: "bad",
            weather: "bad",
            sunrise: "bad",
            sunset: "bad",
        },
        {
            dt: nowUnixSeconds() + 86400,
            temp: { min: "bad", max: "bad" },
            weather: [{ icon: 123 }],
        },
        123,
    ];
}

function isValidCurrent(value: unknown): boolean {
    if (!isRecord(value)) return false;
    if (!isFiniteNumber(value.dt)) return false;
    if (!isFiniteNumber(value.temp)) return false;
    return true;
}

function isValidHourly(value: unknown): boolean {
    if (!Array.isArray(value) || value.length === 0)
        return false;
    for (const item of value) {
        if (!isRecord(item)) return false;
        if (!isFiniteNumber(item.dt)) return false;
        if (!isFiniteNumber(item.temp)) return false;
    }
    return true;
}

function isValidDaily(value: unknown): boolean {
    if (!Array.isArray(value) || value.length === 0)
        return false;
    for (const item of value) {
        if (!isRecord(item)) return false;
        if (!isFiniteNumber(item.dt)) return false;
        const temp = item.temp;
        if (!isRecord(temp)) return false;
        if (!isFiniteNumber(temp.min)) return false;
        if (!isFiniteNumber(temp.max)) return false;
    }
    return true;
}

function isValidWeatherPayload(info: WeatherInfo): boolean {
    return (
        isValidCurrent(info.current) &&
        isValidHourly(info.hourly) &&
        isValidDaily(info.daily)
    );
}

function isFiniteNumber(value: unknown): value is number {
    return (
        typeof value === "number" && Number.isFinite(value)
    );
}

function nowUnixSeconds() {
    return Math.floor(Date.now() / 1000);
}

function readWeatherDebug(): WeatherDebugConfig {
    const defaults = getDefaultWeatherDebugConfig();

    try {
        const raw = localStorage.getItem(DEBUG_STORAGE_KEY);
        if (!raw) return defaults;
        const parsed: unknown = JSON.parse(raw);
        if (!isRecord(parsed)) return defaults;

        const enabled = getProp(parsed, "enabled");
        const bypassCache = getProp(parsed, "bypassCache");
        const simulateMissingApiKey = getProp(
            parsed,
            "simulateMissingApiKey"
        );
        const simulateBadOneCallUrl = getProp(
            parsed,
            "simulateBadOneCallUrl"
        );
        const simulateHttpStatus = getProp(
            parsed,
            "simulateHttpStatus"
        );
        const simulateOkButNoData = getProp(
            parsed,
            "simulateOkButNoData"
        );
        const corruptCurrent = getProp(
            parsed,
            "corruptCurrent"
        );
        const corruptHourly = getProp(
            parsed,
            "corruptHourly"
        );
        const corruptDaily = getProp(
            parsed,
            "corruptDaily"
        );
        const simulateDelayMs = getProp(
            parsed,
            "simulateDelayMs"
        );
        const fixedNowSeconds = getProp(
            parsed,
            "fixedNowSeconds"
        );
        const autoFetchMode = getProp(
            parsed,
            "autoFetchMode"
        );
        const autoFetchDelayMs = getProp(
            parsed,
            "autoFetchDelayMs"
        );

        const isBool = (v: unknown): v is boolean =>
            typeof v === "boolean";

        return {
            enabled: isBool(enabled)
                ? enabled
                : defaults.enabled,
            bypassCache: isBool(bypassCache)
                ? bypassCache
                : defaults.bypassCache,
            simulateMissingApiKey: isBool(
                simulateMissingApiKey
            )
                ? simulateMissingApiKey
                : defaults.simulateMissingApiKey,
            simulateBadOneCallUrl: isBool(
                simulateBadOneCallUrl
            )
                ? simulateBadOneCallUrl
                : defaults.simulateBadOneCallUrl,
            simulateHttpStatus:
                simulateHttpStatus === "401" ||
                simulateHttpStatus === "404" ||
                simulateHttpStatus === "429" ||
                simulateHttpStatus === "500"
                    ? simulateHttpStatus
                    : "",
            simulateOkButNoData: isBool(simulateOkButNoData)
                ? simulateOkButNoData
                : defaults.simulateOkButNoData,
            corruptCurrent: isBool(corruptCurrent)
                ? corruptCurrent
                : defaults.corruptCurrent,
            corruptHourly: isBool(corruptHourly)
                ? corruptHourly
                : defaults.corruptHourly,
            corruptDaily: isBool(corruptDaily)
                ? corruptDaily
                : defaults.corruptDaily,
            simulateDelayMs: isFiniteNumber(simulateDelayMs)
                ? Math.max(0, Math.floor(simulateDelayMs))
                : defaults.simulateDelayMs,
            fixedNowSeconds: isFiniteNumber(fixedNowSeconds)
                ? Math.floor(fixedNowSeconds)
                : null,
            autoFetchMode:
                autoFetchMode === "normal" ||
                autoFetchMode === "delay" ||
                autoFetchMode === "idle"
                    ? autoFetchMode
                    : defaults.autoFetchMode,
            autoFetchDelayMs: isFiniteNumber(
                autoFetchDelayMs
            )
                ? Math.max(0, Math.floor(autoFetchDelayMs))
                : defaults.autoFetchDelayMs,
        };
    } catch {
        return defaults;
    }
}

function writeWeatherDebug(next: WeatherDebugConfig) {
    try {
        localStorage.setItem(
            DEBUG_STORAGE_KEY,
            JSON.stringify(next)
        );
    } catch {
        // ignore
    }
}

function getNowSeconds(debug: WeatherDebugConfig) {
    return debug.enabled && debug.fixedNowSeconds !== null
        ? debug.fixedNowSeconds
        : nowUnixSeconds();
}

function sleepMs(ms: number) {
    return new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

async function fetchJson(url: string) {
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `${res.status} ${res.statusText}${
                text ? ` - ${text}` : ""
            }`
        );
    }
    return res.json();
}

async function fetchAddress(
    coords: { lat: number; lon: number },
    apiKey: string
): Promise<string | null> {
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${encodeURIComponent(
        coords.lat
    )}&lon=${encodeURIComponent(
        coords.lon
    )}&limit=1&appid=${encodeURIComponent(apiKey)}`;

    const data: unknown = await fetchJson(url);
    if (!Array.isArray(data) || data.length === 0) {
        return null;
    }

    const first = data[0];
    if (!isRecord(first)) return null;

    const name =
        typeof first.name === "string" ? first.name : null;
    const state =
        typeof first.state === "string"
            ? first.state
            : null;
    const country =
        typeof first.country === "string"
            ? first.country
            : null;

    if (!name) return null;
    return [name, state, country]
        .filter(Boolean)
        .join(", ");
}

function readCachedWeatherInfo(): WeatherInfo | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (!isRecord(parsed)) return null;

        const nextRefreshTime = getProp(
            parsed,
            "nextRefreshTime"
        );
        if (!isFiniteNumber(nextRefreshTime)) return null;

        const addressRaw = getProp(parsed, "address");
        const address =
            typeof addressRaw === "string" &&
            addressRaw.trim()
                ? addressRaw
                : null;

        const coordsRaw = getProp(parsed, "coords");
        const coords = (() => {
            if (!isRecord(coordsRaw)) return null;
            const lat = coordsRaw.lat;
            const lon = coordsRaw.lon;
            if (
                !isFiniteNumber(lat) ||
                !isFiniteNumber(lon)
            ) {
                return null;
            }
            return { lat, lon };
        })();

        return {
            nextRefreshTime,
            address,
            coords,
            current: getProp(parsed, "current"),
            hourly: getProp(parsed, "hourly"),
            daily: getProp(parsed, "daily"),
        };
    } catch {
        return null;
    }
}

function writeCachedWeatherInfo(info: WeatherInfo) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(info)
        );
    } catch {
        // ignore quota/blocked storage
    }
}

export default function Weather() {
    const apiKey = import.meta.env
        .VITE_OPENWEATHER_API_KEY as string | undefined;

    const [debug, setDebug] = useState<WeatherDebugConfig>(
        () =>
            DEBUG_UI_ENABLED
                ? readWeatherDebug()
                : DEFAULT_DEBUG
    );

    const effectiveDebug = DEBUG_UI_ENABLED
        ? debug
        : DEFAULT_DEBUG;

    useEffect(() => {
        if (DEBUG_UI_ENABLED) return;
        try {
            localStorage.removeItem(DEBUG_STORAGE_KEY);
        } catch {
            // ignore
        }
    }, []);

    const [geo, setGeo] = useState<GeoState>({
        status: "idle",
    });
    const [weather, setWeather] = useState<WeatherState>(
        () => {
            const dbg = readWeatherDebug();
            const cached = readCachedWeatherInfo();
            const now = getNowSeconds(dbg);
            if (cached && cached.nextRefreshTime > now) {
                if (!isValidWeatherPayload(cached)) {
                    try {
                        localStorage.removeItem(
                            STORAGE_KEY
                        );
                    } catch {
                        // ignore
                    }
                    return {
                        status: "error",
                        message: "Bad Data",
                    };
                }
                return { status: "ready", info: cached };
            }
            return { status: "idle" };
        }
    );

    const [selectedInfo, setSelectedInfo] = useState<
        unknown | null
    >(() => {
        const dbg = readWeatherDebug();
        const cached = readCachedWeatherInfo();
        const now = getNowSeconds(dbg);
        if (
            cached &&
            cached.nextRefreshTime > now &&
            isValidWeatherPayload(cached)
        ) {
            return cached.current;
        }
        return null;
    });

    const canUseGeo = useMemo(
        () =>
            typeof navigator !== "undefined" &&
            "geolocation" in navigator,
        []
    );

    const requestLocation = useCallback(async () => {
        if (!canUseGeo) {
            setGeo({
                status: "error",
                message:
                    "Geolocation is not supported in this browser.",
            });
            return;
        }

        setGeo({ status: "loading" });

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGeo({
                    status: "ready",
                    coords: {
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                    },
                });
            },
            (err) => {
                setGeo({
                    status: "error",
                    message: `${err.message} (code: ${err.code})`,
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 12_000,
                maximumAge: 60_000,
            }
        );
    }, [canUseGeo]);

    const fetchAndCache = useCallback(
        async (coords: { lat: number; lon: number }) => {
            if (
                !apiKey ||
                (effectiveDebug.enabled &&
                    effectiveDebug.simulateMissingApiKey)
            ) {
                setWeather({
                    status: "error",
                    message: "Missing API Key.",
                });
                return;
            }

            const { lat, lon } = coords;

            // OpenWeather One Call 3.0
            const url =
                effectiveDebug.enabled &&
                effectiveDebug.simulateBadOneCallUrl
                    ? `https://api.openweathermap.org/data/3.0/onecall__bad?lat=${encodeURIComponent(
                          lat
                      )}&lon=${encodeURIComponent(
                          lon
                      )}&appid=${encodeURIComponent(
                          apiKey
                      )}&units=metric`
                    : `https://api.openweathermap.org/data/3.0/onecall?lat=${encodeURIComponent(
                          lat
                      )}&lon=${encodeURIComponent(
                          lon
                      )}&appid=${encodeURIComponent(
                          apiKey
                      )}&units=metric`;

            setWeather({ status: "loading" });

            if (
                effectiveDebug.enabled &&
                effectiveDebug.simulateDelayMs > 0
            ) {
                await sleepMs(
                    effectiveDebug.simulateDelayMs
                );
            }

            if (
                effectiveDebug.enabled &&
                effectiveDebug.simulateHttpStatus
            ) {
                const code =
                    effectiveDebug.simulateHttpStatus;
                const text =
                    code === "401"
                        ? "Unauthorized"
                        : code === "404"
                        ? "Not Found"
                        : code === "429"
                        ? "Too Many Requests"
                        : "Internal Server Error";
                throw new Error(`${code} ${text}`);
            }

            const data: unknown =
                effectiveDebug.enabled &&
                effectiveDebug.simulateOkButNoData
                    ? {}
                    : await fetchJson(url);

            const address =
                (await fetchAddress(
                    { lat, lon },
                    apiKey
                ).catch(() => null)) ??
                `${lat.toFixed(3)}, ${lon.toFixed(3)}`;

            const info: WeatherInfo = {
                nextRefreshTime:
                    getNowSeconds(effectiveDebug) +
                    REFRESH_SECONDS,
                address,
                coords: { lat, lon },
                current: getProp(data, "current"),
                hourly: getProp(data, "hourly"),
                daily: getProp(data, "daily"),
            };

            if (effectiveDebug.enabled) {
                if (effectiveDebug.corruptCurrent) {
                    info.current = corruptCurrentPayload(
                        info.current
                    );
                }
                if (effectiveDebug.corruptHourly) {
                    info.hourly = corruptHourlyPayload();
                }
                if (effectiveDebug.corruptDaily) {
                    info.daily = corruptDailyPayload();
                }
            }

            if (!isValidWeatherPayload(info)) {
                try {
                    localStorage.removeItem(STORAGE_KEY);
                } catch {
                    // ignore
                }
                setSelectedInfo(null);
                setWeather({
                    status: "error",
                    message: "Bad Data",
                });
                return;
            }

            writeCachedWeatherInfo(info);
            setWeather({ status: "ready", info });
            setSelectedInfo(
                (prev: unknown | null) =>
                    prev ?? info.current
            );
        },
        [apiKey, effectiveDebug]
    );

    const refreshIfNeeded = useCallback(
        (force = false) => {
            const cached = readCachedWeatherInfo();
            const now = getNowSeconds(effectiveDebug);
            if (
                !effectiveDebug.enabled ||
                !effectiveDebug.bypassCache
            ) {
                if (
                    cached &&
                    cached.nextRefreshTime > now
                ) {
                    if (!isValidWeatherPayload(cached)) {
                        try {
                            localStorage.removeItem(
                                STORAGE_KEY
                            );
                        } catch {
                            // ignore
                        }
                        setSelectedInfo(null);
                        setWeather({
                            status: "error",
                            message: "Bad Data",
                        });
                        return;
                    }
                    setWeather({
                        status: "ready",
                        info: cached,
                    });
                    setSelectedInfo(
                        (prev: unknown | null) =>
                            prev ?? cached.current
                    );
                    return;
                }
            }

            if (
                !force &&
                effectiveDebug.enabled &&
                effectiveDebug.autoFetchMode === "idle"
            ) {
                return;
            }

            if (cached?.coords) {
                void fetchAndCache(cached.coords).catch(
                    (e) => {
                        setWeather({
                            status: "error",
                            message:
                                e instanceof Error
                                    ? e.message
                                    : String(e),
                        });
                    }
                );
                return;
            }

            requestLocation();
        },
        [effectiveDebug, fetchAndCache, requestLocation]
    );

    useEffect(() => {
        if (weather.status !== "idle") return;
        if (
            effectiveDebug.enabled &&
            effectiveDebug.autoFetchMode === "idle"
        )
            return;

        const delay =
            effectiveDebug.enabled &&
            effectiveDebug.autoFetchMode === "delay"
                ? effectiveDebug.autoFetchDelayMs
                : 0;

        const id = window.setTimeout(() => {
            refreshIfNeeded();
        }, delay);
        return () => {
            window.clearTimeout(id);
        };
    }, [effectiveDebug, refreshIfNeeded, weather.status]);

    useEffect(() => {
        if (geo.status !== "ready") return;

        let cancelled = false;
        const id = window.setTimeout(() => {
            (async () => {
                try {
                    await fetchAndCache(geo.coords);
                } catch (e) {
                    if (cancelled) return;
                    setWeather({
                        status: "error",
                        message:
                            e instanceof Error
                                ? e.message
                                : String(e),
                    });
                }
            })();
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(id);
        };
    }, [geo, fetchAndCache]);

    const info =
        weather.status === "ready" ? weather.info : null;

    const updateDebug = useCallback(
        (patch: Partial<WeatherDebugConfig>) => {
            if (!DEBUG_UI_ENABLED) return;
            setDebug((prev) => {
                const next = { ...prev, ...patch };
                writeWeatherDebug(next);
                return next;
            });
        },
        []
    );

    const onManualRefresh = useCallback(() => {
        refreshIfNeeded(true);
    }, [refreshIfNeeded]);

    return (
        <section className="weather">
            {DEBUG_UI_ENABLED ? (
                <WeatherDebugPanel
                    debug={debug}
                    onUpdate={updateDebug}
                    onTriggerRefresh={() =>
                        refreshIfNeeded(true)
                    }
                    onClearCache={() => {
                        localStorage.removeItem(
                            STORAGE_KEY
                        );
                        setWeather({ status: "idle" });
                        setSelectedInfo(null);
                    }}
                    onSetFixedNowToNow={() =>
                        updateDebug({
                            fixedNowSeconds:
                                nowUnixSeconds(),
                        })
                    }
                />
            ) : null}

            {geo.status === "error" ? (
                <div className="weather__error">
                    {geo.message}
                </div>
            ) : null}
            {weather.status === "error" ? (
                <div className="weather__error">
                    {weather.message}
                </div>
            ) : null}
            {geo.status === "error" ||
            weather.status === "error" ? (
                <button
                    type="button"
                    className="weather__refresh"
                    onClick={onManualRefresh}
                >
                    Refresh
                </button>
            ) : null}
            {weather.status === "loading" ? (
                <div className="weather__loading">
                    <i className="fa-solid fa-spinner weather__spinner" />
                    Loading…
                </div>
            ) : null}

            {info ? (
                <div className="weather__panels">
                    <WeatherInfoPanel
                        data={selectedInfo ?? info.current}
                        address={info.address}
                    />
                    <WeatherHourlyPanel
                        current={info.current}
                        hourly={info.hourly}
                        selected={selectedInfo}
                        onSelect={(data) =>
                            setSelectedInfo(data)
                        }
                    />
                    <WeatherDailyPanel
                        current={info.current}
                        daily={info.daily}
                        selected={selectedInfo}
                        onSelect={(data) =>
                            setSelectedInfo(data)
                        }
                    />
                </div>
            ) : null}
        </section>
    );
}
