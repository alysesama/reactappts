export type WeatherDebugConfig = {
    enabled: boolean;
    bypassCache: boolean;
    simulateMissingApiKey: boolean;
    simulateBadOneCallUrl: boolean;
    simulateHttpStatus: "" | "401" | "404" | "429" | "500";
    simulateOkButNoData: boolean;
    corruptCurrent: boolean;
    corruptHourly: boolean;
    corruptDaily: boolean;
    simulateDelayMs: number;
    fixedNowSeconds: number | null;
    autoFetchMode: "normal" | "delay" | "idle";
    autoFetchDelayMs: number;
};

export function getDefaultWeatherDebugConfig(): WeatherDebugConfig {
    return {
        enabled: false,
        bypassCache: false,
        simulateMissingApiKey: false,
        simulateBadOneCallUrl: false,
        simulateHttpStatus: "",
        simulateOkButNoData: false,
        corruptCurrent: false,
        corruptHourly: false,
        corruptDaily: false,
        simulateDelayMs: 0,
        fixedNowSeconds: null,
        autoFetchMode: "normal",
        autoFetchDelayMs: 1200,
    };
}
