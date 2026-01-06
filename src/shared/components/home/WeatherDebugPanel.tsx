import type { ChangeEvent } from "react";
import type { WeatherDebugConfig } from "./WeatherDebugConfig";

type Props = {
    debug: WeatherDebugConfig;
    onUpdate: (patch: Partial<WeatherDebugConfig>) => void;
    onTriggerRefresh: () => void;
    onClearCache: () => void;
    onSetFixedNowToNow: () => void;
};

export default function WeatherDebugPanel({
    debug,
    onUpdate,
    onTriggerRefresh,
    onClearCache,
    onSetFixedNowToNow,
}: Props) {
    return (
        <details className="weather-debug">
            <summary className="weather-debug__summary">
                Weather Debug
            </summary>
            <div className="weather-debug__body">
                <label className="weather-debug__row">
                    <input
                        type="checkbox"
                        checked={debug.enabled}
                        onChange={(e) =>
                            onUpdate({
                                enabled: e.target.checked,
                            })
                        }
                    />
                    <span>Enable debug overrides</span>
                </label>

                <label className="weather-debug__row">
                    <input
                        type="checkbox"
                        checked={debug.bypassCache}
                        onChange={(e) =>
                            onUpdate({
                                bypassCache:
                                    e.target.checked,
                            })
                        }
                        disabled={!debug.enabled}
                    />
                    <span>Bypass cache</span>
                </label>

                <label className="weather-debug__row">
                    <input
                        type="checkbox"
                        checked={
                            debug.simulateMissingApiKey
                        }
                        onChange={(e) =>
                            onUpdate({
                                simulateMissingApiKey:
                                    e.target.checked,
                            })
                        }
                        disabled={!debug.enabled}
                    />
                    <span>Simulate missing API key</span>
                </label>

                <label className="weather-debug__row">
                    <input
                        type="checkbox"
                        checked={
                            debug.simulateBadOneCallUrl
                        }
                        onChange={(e) =>
                            onUpdate({
                                simulateBadOneCallUrl:
                                    e.target.checked,
                            })
                        }
                        disabled={!debug.enabled}
                    />
                    <span>Simulate bad OneCall URL</span>
                </label>

                <label className="weather-debug__row">
                    <span>Simulate HTTP status</span>
                    <select
                        value={debug.simulateHttpStatus}
                        onChange={(
                            e: ChangeEvent<HTMLSelectElement>
                        ) =>
                            onUpdate({
                                simulateHttpStatus: e.target
                                    .value as WeatherDebugConfig["simulateHttpStatus"],
                            })
                        }
                        disabled={!debug.enabled}
                    >
                        <option value="">None</option>
                        <option value="401">401</option>
                        <option value="404">404</option>
                        <option value="429">429</option>
                        <option value="500">500</option>
                    </select>
                </label>

                <label className="weather-debug__row">
                    <input
                        type="checkbox"
                        checked={debug.simulateOkButNoData}
                        onChange={(e) =>
                            onUpdate({
                                simulateOkButNoData:
                                    e.target.checked,
                            })
                        }
                        disabled={!debug.enabled}
                    />
                    <span>Simulate 200 OK but no data</span>
                </label>

                <label className="weather-debug__row">
                    <input
                        type="checkbox"
                        checked={debug.corruptCurrent}
                        onChange={(e) =>
                            onUpdate({
                                corruptCurrent:
                                    e.target.checked,
                            })
                        }
                        disabled={!debug.enabled}
                    />
                    <span>Corrupt current</span>
                </label>

                <label className="weather-debug__row">
                    <input
                        type="checkbox"
                        checked={debug.corruptHourly}
                        onChange={(e) =>
                            onUpdate({
                                corruptHourly:
                                    e.target.checked,
                            })
                        }
                        disabled={!debug.enabled}
                    />
                    <span>Corrupt hourly</span>
                </label>

                <label className="weather-debug__row">
                    <input
                        type="checkbox"
                        checked={debug.corruptDaily}
                        onChange={(e) =>
                            onUpdate({
                                corruptDaily:
                                    e.target.checked,
                            })
                        }
                        disabled={!debug.enabled}
                    />
                    <span>Corrupt daily</span>
                </label>

                <label className="weather-debug__row">
                    <span>Simulate delay (ms)</span>
                    <input
                        type="number"
                        min={0}
                        value={debug.simulateDelayMs}
                        onChange={(e) =>
                            onUpdate({
                                simulateDelayMs: Number(
                                    e.target.value || 0
                                ),
                            })
                        }
                        disabled={!debug.enabled}
                    />
                </label>

                <label className="weather-debug__row">
                    <span>Fixed now (unix seconds)</span>
                    <input
                        type="number"
                        value={
                            debug.fixedNowSeconds === null
                                ? ""
                                : debug.fixedNowSeconds
                        }
                        placeholder="(empty = real time)"
                        onChange={(e) => {
                            const raw = e.target.value;
                            onUpdate({
                                fixedNowSeconds: raw
                                    ? Number(raw)
                                    : null,
                            });
                        }}
                        disabled={!debug.enabled}
                    />
                    <button
                        type="button"
                        onClick={onSetFixedNowToNow}
                        disabled={!debug.enabled}
                    >
                        Set to now
                    </button>
                </label>

                <label className="weather-debug__row">
                    <span>Auto fetch</span>
                    <select
                        value={debug.autoFetchMode}
                        onChange={(
                            e: ChangeEvent<HTMLSelectElement>
                        ) =>
                            onUpdate({
                                autoFetchMode: e.target
                                    .value as WeatherDebugConfig["autoFetchMode"],
                            })
                        }
                        disabled={!debug.enabled}
                    >
                        <option value="normal">
                            Normal
                        </option>
                        <option value="delay">Delay</option>
                        <option value="idle">
                            Idle (no auto fetch)
                        </option>
                    </select>
                    <input
                        type="number"
                        min={0}
                        value={debug.autoFetchDelayMs}
                        onChange={(e) =>
                            onUpdate({
                                autoFetchDelayMs: Number(
                                    e.target.value || 0
                                ),
                            })
                        }
                        disabled={
                            !debug.enabled ||
                            debug.autoFetchMode !== "delay"
                        }
                    />
                </label>

                <div className="weather-debug__actions">
                    <button
                        type="button"
                        onClick={onTriggerRefresh}
                    >
                        Trigger refresh
                    </button>
                    <button
                        type="button"
                        onClick={onClearCache}
                    >
                        Clear weather cache
                    </button>
                </div>
            </div>
        </details>
    );
}
