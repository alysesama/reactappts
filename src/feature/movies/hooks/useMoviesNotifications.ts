import { useCallback, useMemo, useRef, useState } from "react";

export type MoviesNotificationType = "good" | "bad" | "unknown";

export type MoviesNotification = {
    id: string;
    type: MoviesNotificationType;
    message: string;
    closing: boolean;
};

function newId() {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function useMoviesNotifications() {
    const [items, setItems] = useState<MoviesNotification[]>([]);
    const timersRef = useRef<Map<string, number>>(new Map());

    const close = useCallback((id: string) => {
        setItems((prev) =>
            prev.map((n) => (n.id === id ? { ...n, closing: true } : n))
        );

        window.setTimeout(() => {
            setItems((prev) => prev.filter((n) => n.id !== id));
        }, 150);

        const t = timersRef.current.get(id);
        if (t !== undefined) {
            window.clearTimeout(t);
            timersRef.current.delete(id);
        }
    }, []);

    const notify = useCallback(
        (input: { type: MoviesNotificationType; message: string }) => {
            const id = newId();
            const next: MoviesNotification = {
                id,
                type: input.type,
                message: input.message,
                closing: false,
            };

            setItems((prev) => [next, ...prev]);

            const t = window.setTimeout(() => {
                close(id);
            }, 8000);
            timersRef.current.set(id, t);

            return id;
        },
        [close]
    );

    const value = useMemo(() => ({ items, notify, close }), [items, notify, close]);
    return value;
}
