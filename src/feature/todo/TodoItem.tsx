import "@/styles/todo/TodoItem.css";
import type { TodoTask } from "./todoModel";

function formatUnix(value?: number) {
    if (!value) return "Chưa đặt";
    const date = new Date(value * 1000);
    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function formatDurationSeconds(
    create?: number,
    deadline?: number
) {
    if (!create || !deadline) return "--";
    const diff = Math.max(0, deadline - create);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    return `${String(hours).padStart(2, "0")}:${String(
        minutes
    ).padStart(2, "0")}`;
}

export default function TodoItem({
    task,
    onToggleComplete,
    onTogglePinned,
    onDeleteTask,
}: {
    task: TodoTask;
    onToggleComplete: () => void;
    onTogglePinned: () => void;
    onDeleteTask: () => void;
}) {
    return (
        <div
            className={`todo-item ${
                task.task_complete ? "completed" : ""
            } ${
                task.task_pinned ? "pinned" : ""
            } priority-${task.task_prior}`}
            role="button"
            tabIndex={0}
            onClick={onToggleComplete}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggleComplete();
                }
            }}
        >
            <button
                type="button"
                className={`todo-item__pin${
                    task.task_pinned ? " active" : ""
                }`}
                aria-label={
                    task.task_pinned ? "Bỏ ghim" : "Ghim"
                }
                title={
                    task.task_pinned ? "Bỏ ghim" : "Ghim"
                }
                onClick={(e) => {
                    e.stopPropagation();
                    onTogglePinned();
                }}
            >
                <i
                    className="fa-solid fa-map-pin"
                    aria-hidden="true"
                />
            </button>

            <div className="todo-item__title">
                {task.task_name}
            </div>
            <div className="todo-item__actions">
                <button
                    className="delete"
                    type="button"
                    aria-label="Xoá"
                    title="Xoá"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTask();
                    }}
                >
                    <i
                        className="fa-solid fa-xmark"
                        aria-hidden="true"
                    />
                </button>
            </div>

            {task.task_describle ? (
                <p className="todo-item__description">
                    {task.task_describle}
                </p>
            ) : null}

            <div className="todo-item__meta">
                <span>
                    Task Duration:{" "}
                    {formatDurationSeconds(
                        task.task_create_time,
                        task.task_deadline_time
                    )}
                </span>
                <span>
                    Deadline:{" "}
                    {formatUnix(task.task_deadline_time)}
                </span>
            </div>
        </div>
    );
}
