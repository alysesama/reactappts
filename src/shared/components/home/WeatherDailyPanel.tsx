import "@/styles/home/WeatherDailyPanel.css";

type Props = {
    current: unknown;
    daily: unknown;
    selected: unknown | null;
    onSelect: (data: unknown) => void;
};

export default function WeatherDailyPanel({
    current,
    daily,
    selected,
    onSelect,
}: Props) {
    const currentDt = getDtSeconds(current);
    const selectedDt = getDtSeconds(selected);

    const dailyList = asArray(daily);

    const items = dailyList
        .filter((x) => {
            if (currentDt === null) return true;
            const dt = getDtSeconds(x);
            return dt !== null && dt > currentDt;
        })
        .map((x) => {
            const dt = getDtSeconds(x);
            return {
                key: dt ? String(dt) : cryptoKey(x),
                dt,
                data: x,
            };
        });

    return (
        <section className="weather-daily-panel">
            <div className="weather-daily-panel__list">
                {items.map((it) => {
                    const date = it.dt
                        ? new Date(it.dt * 1000)
                        : null;
                    const dow = date
                        ? date.toLocaleDateString(
                              undefined,
                              {
                                  weekday: "short",
                              }
                          )
                        : "--";
                    const md = date
                        ? date.toLocaleDateString(
                              undefined,
                              {
                                  month: "short",
                                  day: "2-digit",
                              }
                          )
                        : "--";

                    const icon = getWeatherIcon(it.data);
                    const temps = getDailyTemps(it.data);
                    const suntime = getSuntimeStyle(
                        it.data,
                        it.dt
                    );
                    const isActive =
                        selectedDt !== null &&
                        it.dt !== null &&
                        selectedDt === it.dt;

                    return (
                        <button
                            key={it.key}
                            type="button"
                            className={
                                "weather-daily-panel__item" +
                                (isActive
                                    ? " weather-daily-panel__item--active"
                                    : "")
                            }
                            onClick={() =>
                                onSelect(it.data)
                            }
                        >
                            <div className="weather-daily-panel__item-left">
                                <div className="weather-daily-panel__item-dow">
                                    {dow}
                                    <span>,</span>
                                </div>
                                <div className="weather-daily-panel__item-md">
                                    {md}
                                </div>
                            </div>

                            <div className="weather-daily-panel__item-mid">
                                {icon ? (
                                    <img
                                        className="weather-daily-panel__item-icon"
                                        src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
                                        alt=""
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="weather-daily-panel__item-icon-placeholder" />
                                )}
                            </div>

                            <div className="weather-daily-panel__item-right">
                                <div className="weather-daily-panel__item-temp">
                                    {temps.min === null
                                        ? "--"
                                        : `${Math.round(
                                              temps.min
                                          )}°`}
                                </div>

                                <div className="weather-daily-panel__suntime">
                                    {suntime ? (
                                        <div
                                            className="weather-daily-panel__suntime-bar"
                                            style={{
                                                left: `${suntime.leftPct}%`,
                                                width: `${suntime.widthPct}%`,
                                            }}
                                        />
                                    ) : null}
                                </div>

                                <div className="weather-daily-panel__item-temp weather-daily-panel__item-temp--max">
                                    {temps.max === null
                                        ? "--"
                                        : `${Math.round(
                                              temps.max
                                          )}°`}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

function getDtSeconds(value: unknown): number | null {
    if (!isRecord(value)) return null;
    const dt = value.dt;
    return typeof dt === "number" && Number.isFinite(dt)
        ? dt
        : null;
}

function getDailyTemps(value: unknown): {
    min: number | null;
    max: number | null;
} {
    if (!isRecord(value)) return { min: null, max: null };
    const temp = value.temp;
    if (!isRecord(temp)) return { min: null, max: null };

    const min = temp.min;
    const max = temp.max;

    return {
        min:
            typeof min === "number" && Number.isFinite(min)
                ? min
                : null,
        max:
            typeof max === "number" && Number.isFinite(max)
                ? max
                : null,
    };
}

function getWeatherIcon(value: unknown): string | null {
    if (!isRecord(value)) return null;
    const weather = value.weather;
    if (!Array.isArray(weather) || weather.length === 0)
        return null;
    const first = weather[0];
    if (!isRecord(first)) return null;
    const icon = first.icon;
    return typeof icon === "string" ? icon : null;
}

function getNumberProp(
    value: unknown,
    key: string
): number | null {
    if (!isRecord(value)) return null;
    const v = value[key];
    return typeof v === "number" && Number.isFinite(v)
        ? v
        : null;
}

function getSuntimeStyle(
    value: unknown,
    dtSeconds: number | null
): { leftPct: number; widthPct: number } | null {
    const sunrise = getNumberProp(value, "sunrise");
    const sunset = getNumberProp(value, "sunset");
    if (sunrise === null || sunset === null) return null;
    if (dtSeconds === null) return null;

    const dayDate = new Date(dtSeconds * 1000);
    dayDate.setHours(0, 0, 0, 0);
    const start = Math.floor(dayDate.getTime() / 1000);
    const daySeconds = 86400;

    const leftRaw = (sunrise - start) / daySeconds;
    const rightRaw = (sunset - start) / daySeconds;

    const left = clamp01(leftRaw);
    const right = clamp01(rightRaw);
    const width = Math.max(0, right - left);
    return {
        leftPct: left * 100,
        widthPct: width * 100,
    };
}

function clamp01(value: number) {
    return Math.min(1, Math.max(0, value));
}

function cryptoKey(value: unknown): string {
    try {
        return JSON.stringify(value).slice(0, 32);
    } catch {
        return String(Date.now());
    }
}
