import "@/styles/home/WeatherHourlyPanel.css";

type Props = {
    current: unknown;
    hourly: unknown;
    selected: unknown | null;
    onSelect: (data: unknown) => void;
};

export default function WeatherHourlyPanel({
    current,
    hourly,
    selected,
    onSelect,
}: Props) {
    const currentDt = getDtSeconds(current);
    const selectedDt = getDtSeconds(selected);

    const hourlyList = asArray(hourly);

    const startIndex =
        currentDt === null
            ? 0
            : hourlyList.findIndex((x) => {
                  const dt = getDtSeconds(x);
                  return dt !== null && dt > currentDt;
              });

    const sliced =
        startIndex === -1
            ? []
            : hourlyList.slice(startIndex, startIndex + 23);

    const items: Array<{
        key: string;
        label: string;
        data: unknown;
    }> = [
        {
            key: "current",
            label: "Current",
            data: current,
        },
        ...sliced.map((x) => {
            const dt = getDtSeconds(x);
            const label = dt
                ? String(new Date(dt * 1000).getHours())
                : "--";
            return {
                key: dt ? String(dt) : cryptoKey(x),
                label,
                data: x,
            };
        }),
    ];

    return (
        <section className="weather-hourly-panel">
            <div className="weather-hourly-panel__list">
                {items.map((it) => {
                    const dt = getDtSeconds(it.data);
                    const icon = getWeatherIcon(it.data);
                    const temp = getTemp(it.data);
                    const isActive =
                        it.key === "current"
                            ? selectedDt === currentDt
                            : selectedDt !== null &&
                              dt !== null &&
                              selectedDt === dt;

                    return (
                        <button
                            key={it.key}
                            type="button"
                            className={
                                "weather-hourly-panel__item" +
                                (isActive
                                    ? " weather-hourly-panel__item--active"
                                    : "")
                            }
                            onClick={() =>
                                onSelect(it.data)
                            }
                        >
                            <div className="weather-hourly-panel__item-hour">
                                {it.label === "Current"
                                    ? "Current"
                                    : it.label}
                            </div>
                            {icon ? (
                                <img
                                    className="weather-hourly-panel__item-icon"
                                    src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
                                    alt=""
                                    loading="lazy"
                                />
                            ) : (
                                <div className="weather-hourly-panel__item-icon-placeholder" />
                            )}
                            <div className="weather-hourly-panel__item-temp">
                                {temp === null
                                    ? "--"
                                    : `${Math.round(
                                          temp
                                      )}°`}
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

function getTemp(value: unknown): number | null {
    if (!isRecord(value)) return null;
    const temp = value.temp;
    return typeof temp === "number" && Number.isFinite(temp)
        ? temp
        : null;
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

function cryptoKey(value: unknown): string {
    try {
        return JSON.stringify(value).slice(0, 32);
    } catch {
        return String(Date.now());
    }
}
