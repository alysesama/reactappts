import { useSyncExternalStore } from "react";
import {
    readMoviesDebugConfig,
    readMoviesDebugRefreshId,
    subscribeMoviesDebug,
    type MoviesDebugConfig,
} from "./moviesDebugConfig";

export function useMoviesDebugConfig(): MoviesDebugConfig {
    return useSyncExternalStore(
        subscribeMoviesDebug,
        readMoviesDebugConfig,
        readMoviesDebugConfig
    );
}

export function useMoviesDebugRefreshId(): number {
    return useSyncExternalStore(
        subscribeMoviesDebug,
        readMoviesDebugRefreshId,
        readMoviesDebugRefreshId
    );
}
