import {
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";
import "@/styles/todo/TodoInput.css";

export type TodoInputData = {
    task_complete?: boolean;
    task_pinned?: boolean;
    task_name?: string;
    task_describle?: string;
    task_prior?: number;
    task_create_time?: number;
    task_deadline_time?: number;
};

type FormState = {
    task_name: string;
    task_describle: string;
    task_prior: number;
    task_deadline: string;
    task_pinned: boolean;
};

const defaultForm: FormState = {
    task_name: "",
    task_describle: "",
    task_prior: 1,
    task_deadline: "",
    task_pinned: false,
};

function toUnixTime(timeValue: string) {
    if (!timeValue) return undefined;

    const [hours, minutes] = timeValue
        .split(":")
        .map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return undefined;
    }

    const today = new Date();
    today.setHours(hours, minutes, 0, 0);

    const now = new Date();
    if (today < now) {
        today.setDate(today.getDate() + 1);
    }

    return Math.floor(today.getTime() / 1000);
}

export default function TodoInput({
    onAddTask,
}: {
    onAddTask: (data: TodoInputData) => void;
}) {
    const [form, setForm] =
        useState<FormState>(defaultForm);
    const [error, setError] = useState("");
    const [nowSeconds, setNowSeconds] = useState(0);

    useEffect(() => {
        const update = () => {
            setNowSeconds(Math.floor(Date.now() / 1000));
        };
        update();
        const id = window.setInterval(update, 30_000);
        return () => {
            window.clearInterval(id);
        };
    }, []);

    const handleDeadlineChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const value = event.target.value;
        let cleaned = value.replace(/[^\d:]/g, "");

        if (
            cleaned.length > 2 &&
            cleaned.length <= 4 &&
            !cleaned.includes(":")
        ) {
            cleaned =
                cleaned.slice(0, 2) +
                ":" +
                cleaned.slice(2);
        } else if (cleaned.length > 5) {
            cleaned = cleaned.slice(0, 5);
        }

        const timeRegex =
            /^([0-1]?[0-9]|2[0-3])(:([0-5]?[0-9])?)?$/;
        if (cleaned === "" || timeRegex.test(cleaned)) {
            setForm((prev) => ({
                ...prev,
                task_deadline: cleaned,
            }));
        }
    };

    const handleTaskNameChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const value = event.target.value;
        setForm((prev) => ({ ...prev, task_name: value }));
    };

    const handleTaskDescribleChange = (
        event: ChangeEvent<HTMLTextAreaElement>
    ) => {
        const value = event.target.value;
        setForm((prev) => ({
            ...prev,
            task_describle: value,
        }));
    };

    const handleSelectPriority = (value: number) => {
        setForm((prev) => ({ ...prev, task_prior: value }));
    };

    const handleTogglePinned = () => {
        setForm((prev) => ({
            ...prev,
            task_pinned: !prev.task_pinned,
        }));
    };

    const deadlineUnix = useMemo(
        () => toUnixTime(form.task_deadline),
        [form.task_deadline]
    );

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();

        if (!form.task_name.trim()) {
            setError("Tên công việc không được để trống");
            return;
        }

        onAddTask({
            task_name: form.task_name.trim(),
            task_describle: form.task_describle.trim(),
            task_prior: Number(form.task_prior),
            task_pinned: form.task_pinned,
            task_deadline_time: toUnixTime(
                form.task_deadline
            ),
        });

        setForm(defaultForm);
        setError("");
    };

    const durationSeconds =
        deadlineUnix && deadlineUnix > nowSeconds
            ? deadlineUnix - nowSeconds
            : null;
    const durationText =
        durationSeconds === null
            ? "--"
            : `${String(
                  Math.floor(durationSeconds / 3600)
              ).padStart(2, "0")}:${String(
                  Math.floor((durationSeconds % 3600) / 60)
              ).padStart(2, "0")}`;

    return (
        <form
            className="todo-input-panel"
            onSubmit={handleSubmit}
        >
            <div
                className={`todo-input-card priority-${form.task_prior}`}
            >
                <button
                    type="button"
                    className={`todo-input-card__pin${
                        form.task_pinned ? " active" : ""
                    }`}
                    aria-label={
                        form.task_pinned
                            ? "Bỏ ghim"
                            : "Ghim"
                    }
                    title={
                        form.task_pinned
                            ? "Bỏ ghim"
                            : "Ghim"
                    }
                    onClick={handleTogglePinned}
                >
                    <i
                        className="fa-solid fa-map-pin"
                        aria-hidden="true"
                    />
                </button>

                <div className="todo-input-card__field">
                    <input
                        id="task_name"
                        name="task_name"
                        className="todo-input-card__title-input"
                        placeholder="Task name..."
                        value={form.task_name}
                        onChange={handleTaskNameChange}
                    />
                </div>

                <div className="todo-input-card__field">
                    <textarea
                        id="task_describle"
                        name="task_describle"
                        className="todo-input-card__description-input"
                        placeholder="Describle about this task..."
                        value={form.task_describle}
                        onChange={handleTaskDescribleChange}
                    />
                </div>

                <div className="todo-input-card__meta">
                    <div className="todo-input-card__meta-item">
                        <div className="todo-input-card__meta-label">
                            Deadline
                        </div>
                        <input
                            id="task_deadline"
                            name="task_deadline"
                            type="text"
                            className="todo-input-card__meta-input"
                            value={form.task_deadline}
                            onChange={handleDeadlineChange}
                            pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                            placeholder="HH:mm"
                            maxLength={5}
                            inputMode="numeric"
                        />
                    </div>
                </div>

                {error ? (
                    <p className="todo-input-card__error">
                        {error}
                    </p>
                ) : null}
            </div>

            <div className="todo-input-footer">
                <div className="todo-input-footer__priority">
                    <button
                        type="button"
                        className={`todo-priority-swatch priority-0${
                            form.task_prior === 0
                                ? " active"
                                : ""
                        }`}
                        aria-label="Ưu tiên thấp"
                        title="Ưu tiên thấp"
                        onClick={() =>
                            handleSelectPriority(0)
                        }
                    />
                    <button
                        type="button"
                        className={`todo-priority-swatch priority-1${
                            form.task_prior === 1
                                ? " active"
                                : ""
                        }`}
                        aria-label="Ưu tiên trung bình"
                        title="Ưu tiên trung bình"
                        onClick={() =>
                            handleSelectPriority(1)
                        }
                    />
                    <button
                        type="button"
                        className={`todo-priority-swatch priority-2${
                            form.task_prior === 2
                                ? " active"
                                : ""
                        }`}
                        aria-label="Ưu tiên cao"
                        title="Ưu tiên cao"
                        onClick={() =>
                            handleSelectPriority(2)
                        }
                    />
                </div>

                <button
                    type="submit"
                    className="todo-input-footer__add"
                    aria-label="Add"
                    title="Add"
                >
                    <i
                        className="fa-solid fa-plus"
                        aria-hidden="true"
                    />
                </button>
            </div>
        </form>
    );
}
