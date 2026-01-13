import "@/styles/movies/ui/MoviesNotifications.css";
import type { MoviesNotification } from "../hooks/useMoviesNotifications";

export default function MoviesNotifications({
    items,
    onClose,
}: {
    items: MoviesNotification[];
    onClose: (id: string) => void;
}) {
    return (
        <div className="mv-notifs" aria-live="polite">
            {items.map((n) => (
                <div
                    key={n.id}
                    className={`mv-notif mv-notif--${
                        n.type
                    }${
                        n.closing
                            ? " mv-notif--closing"
                            : ""
                    }`}
                    role="status"
                >
                    <div className="mv-notif__body">
                        {n.message}
                    </div>
                    <button
                        type="button"
                        className="mv-notif__close"
                        aria-label="Close"
                        onClick={() => onClose(n.id)}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}
