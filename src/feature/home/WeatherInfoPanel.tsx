import "@/styles/home/WeatherInfoPanel.css";

type Props = {
    data: unknown;
    address?: string | null;
};

export default function WeatherInfoPanel({
    data,
    address,
}: Props) {
    const dt = getDtSeconds(data);
    const weather = getWeather(data);

    const contentKey = `${dt ?? "--"}-${
        weather?.icon ?? "--"
    }-${address ?? "--"}`;

    const temp = getTemp(data);
    const feelsLike = getFeelsLike(data);

    const pressure = getNumber(data, "pressure");
    const humidity = getNumber(data, "humidity");
    const dewPoint = getNumber(data, "dew_point");
    const uvi = getNumber(data, "uvi");
    const clouds = getNumber(data, "clouds");

    const windSpeed = getNumber(data, "wind_speed");
    const windDeg = getNumber(data, "wind_deg");
    const windGust = getNumber(data, "wind_gust");

    const values = {
        temp: formatTemp(temp),
        feelsLike: formatTemp(feelsLike),
        pressure: formatPressure(pressure),
        humidity: formatPercent(humidity),
        dewPoint: formatCelsius(dewPoint),
        uvi: formatNumber(uvi),
        clouds: formatPercent(clouds),
        windSpeed: formatWindSpeed(windSpeed),
        windDeg: formatDegrees(windDeg),
        windGust: formatWindSpeed(windGust),
    };

    const sections: Array<{
        key: string;
        iconClass: string;
        rows: Array<{ label: string; value: string }>;
    }> = [
        {
            key: "temperature",
            iconClass: "fa-solid fa-temperature-high",
            rows: [
                {
                    label: "Temperature",
                    value: values.temp,
                },
                {
                    label: "Feels like",
                    value: values.feelsLike,
                },
            ],
        },
        {
            key: "pressure",
            iconClass: "fa-solid fa-gauge-high",
            rows: [
                {
                    label: "Pressure",
                    value: values.pressure,
                },
            ],
        },
        {
            key: "humidity",
            iconClass: "fa-solid fa-water",
            rows: [
                {
                    label: "Humidity",
                    value: values.humidity,
                },
                {
                    label: "Dew point",
                    value: values.dewPoint,
                },
            ],
        },
        {
            key: "uv",
            iconClass: "fa-solid fa-person-rays",
            rows: [{ label: "UVI", value: values.uvi }],
        },
        {
            key: "cloud",
            iconClass: "fa-solid fa-cloud",
            rows: [
                { label: "Clouds", value: values.clouds },
            ],
        },
        {
            key: "wind",
            iconClass: "fa-solid fa-wind",
            rows: [
                {
                    label: "Wind speed",
                    value: values.windSpeed,
                },
                {
                    label: "Wind degrees",
                    value: values.windDeg,
                },
                {
                    label: "Wind gust",
                    value: values.windGust,
                },
            ],
        },
    ];

    return (
        <section className="weather-info-panel">
            <div
                key={contentKey}
                className="weather-info-panel__content"
            >
                <div className="weather-info-panel__header">
                    {weather?.icon ? (
                        <img
                            className="weather-info-panel__icon"
                            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                            alt=""
                            loading="lazy"
                        />
                    ) : (
                        <div className="weather-info-panel__icon-placeholder" />
                    )}
                    <div className="weather-info-panel__header-text">
                        <div className="weather-info-panel__dt">
                            {formatDt(dt)}
                            {address ? (
                                <span className="weather-info-panel__address">
                                    {" "}
                                    • {address}
                                </span>
                            ) : null}
                        </div>
                        <div className="weather-info-panel__desc">
                            {weather?.description
                                ? weather.description
                                      .split(" ")
                                      .map(
                                          (s) =>
                                              s
                                                  .charAt(0)
                                                  .toUpperCase() +
                                              s.slice(1)
                                      )
                                      .join(" ")
                                : "--"}
                        </div>
                    </div>
                </div>

                <div className="weather-info-panel__sections">
                    {sections.map((s) => (
                        <div
                            key={s.key}
                            className="weather-info-panel__section"
                        >
                            <div className="weather-info-panel__section-icon">
                                <i
                                    className={s.iconClass}
                                />
                            </div>
                            <div className="weather-info-panel__section-group">
                                {s.rows.map((r) => (
                                    <InfoRow
                                        key={r.label}
                                        label={r.label}
                                        value={r.value}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function InfoRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="weather-info-panel__row">
            <div className="weather-info-panel__label">
                {label}
            </div>
            <div
                className={`weather-info-panel__value${
                    value === "--"
                        ? " weather-info-panel__value--empty"
                        : ""
                }`}
            >
                {value}
            </div>
        </div>
    );
}

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function getNumber(
    obj: unknown,
    key: string
): number | null {
    if (!isRecord(obj)) return null;
    const v = obj[key];
    return typeof v === "number" && Number.isFinite(v)
        ? v
        : null;
}

function getDtSeconds(obj: unknown): number | null {
    return getNumber(obj, "dt");
}

function getWeather(obj: unknown): {
    description: string | null;
    icon: string | null;
} | null {
    if (!isRecord(obj)) return null;
    const weather = obj.weather;
    if (!Array.isArray(weather) || weather.length === 0)
        return null;
    const first = weather[0];
    if (!isRecord(first)) return null;
    const description =
        typeof first.description === "string"
            ? first.description
            : null;
    const icon =
        typeof first.icon === "string" ? first.icon : null;
    return { description, icon };
}

type TempValue =
    | { kind: "single"; value: number }
    | { kind: "range"; min: number; max: number }
    | null;

function getTemp(obj: unknown): TempValue {
    if (!isRecord(obj)) return null;
    const temp = obj.temp;

    if (typeof temp === "number" && Number.isFinite(temp)) {
        return { kind: "single", value: temp };
    }

    if (isRecord(temp)) {
        const directMin = temp.min;
        const directMax = temp.max;
        if (
            typeof directMin === "number" &&
            Number.isFinite(directMin) &&
            typeof directMax === "number" &&
            Number.isFinite(directMax)
        ) {
            return {
                kind: "range",
                min: directMin,
                max: directMax,
            };
        }

        const derived = deriveMinMaxFromRecord(temp);
        if (derived) {
            return {
                kind: "range",
                min: derived.min,
                max: derived.max,
            };
        }
    }

    return null;
}

function getFeelsLike(obj: unknown): TempValue {
    if (!isRecord(obj)) return null;
    const feels = obj.feels_like;

    if (
        typeof feels === "number" &&
        Number.isFinite(feels)
    ) {
        return { kind: "single", value: feels };
    }

    if (isRecord(feels)) {
        const directMin = feels.min;
        const directMax = feels.max;
        if (
            typeof directMin === "number" &&
            Number.isFinite(directMin) &&
            typeof directMax === "number" &&
            Number.isFinite(directMax)
        ) {
            return {
                kind: "range",
                min: directMin,
                max: directMax,
            };
        }

        const derived = deriveMinMaxFromRecord(feels);
        if (derived) {
            return {
                kind: "range",
                min: derived.min,
                max: derived.max,
            };
        }
    }

    return null;
}

function deriveMinMaxFromRecord(
    record: Record<string, unknown>
): { min: number; max: number } | null {
    let min: number | null = null;
    let max: number | null = null;

    for (const v of Object.values(record)) {
        if (typeof v !== "number" || !Number.isFinite(v))
            continue;
        if (min === null || v < min) min = v;
        if (max === null || v > max) max = v;
    }

    if (min === null || max === null) return null;
    return { min, max };
}

function formatDt(dt: number | null) {
    if (dt === null) return "--";
    const d = new Date(dt * 1000);
    const hh = String(d.getHours()).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${hh}h ${dd}/${mm}/${yy}`;
}

function formatCelsius(value: number | null) {
    if (value === null) return "--";
    return `${Math.round(value)}°C`;
}

function formatTemp(value: TempValue) {
    if (!value) return "--";
    if (value.kind === "single") {
        return formatCelsius(value.value);
    }
    return `${Math.round(value.min)}°C | ${Math.round(
        value.max
    )}°C`;
}

function formatPressure(value: number | null) {
    if (value === null) return "--";
    return `${Math.round(value)} hPa`;
}

function formatPercent(value: number | null) {
    if (value === null) return "--";
    return `${Math.round(value)}%`;
}

function formatNumber(value: number | null) {
    if (value === null) return "--";
    return `${value}`;
}

function formatWindSpeed(value: number | null) {
    if (value === null) return "--";
    return `${value} m/s`;
}

function formatDegrees(value: number | null) {
    if (value === null) return "--";
    return `${Math.round(value)}°`;
}
