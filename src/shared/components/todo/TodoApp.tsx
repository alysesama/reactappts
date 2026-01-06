import { useEffect, useMemo, useState } from "react";
import "@/styles/todo/TodoApp.css";
import { loremIpsum } from "lorem-ipsum";

import TodoHeader from "./TodoHeader";
import TodoInput, { type TodoInputData } from "./TodoInput";
import TodoList from "./TodoList";
import {
    clampPriority,
    fallbackTasks,
    loadStoredTasks,
    type TodoTask,
} from "./todoModel";

const STORAGE_KEY = "todo_tasks";

function randomBetween(min: number, max: number) {
    return (
        Math.floor(Math.random() * (max - min + 1)) + min
    );
}

function capitalize(text: string) {
    return text
        ? text.charAt(0).toUpperCase() + text.slice(1)
        : text;
}

function generateWords(count: number) {
    return loremIpsum({
        count,
        units: "words",
        format: "plain",
    });
}

export default function TodoApp() {
    const [tasks, setTasks] = useState<TodoTask[]>(() => {
        if (typeof window === "undefined")
            return fallbackTasks();
        return loadStoredTasks(STORAGE_KEY);
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(tasks)
            );
        } catch {
            // ignore
        }
    }, [tasks]);

    useEffect(() => {
        const id = window.setTimeout(() => {
            const now = Math.floor(Date.now() / 1000);
            setTasks((prev) => {
                const updated = prev.map((task) => {
                    if (
                        !task.task_complete &&
                        task.task_deadline_time &&
                        task.task_deadline_time < now
                    ) {
                        return {
                            ...task,
                            task_complete: true,
                        };
                    }
                    return task;
                });

                const hasChanges = updated.some(
                    (task, index) =>
                        task.task_complete !==
                        prev[index]?.task_complete
                );

                return hasChanges ? updated : prev;
            });
        }, 0);

        return () => {
            window.clearTimeout(id);
        };
    }, []);

    const filteredTasks = useMemo(() => {
        const keyword = searchTerm.toLowerCase();

        const next = tasks.filter((task) => {
            const name = task.task_name.toLowerCase();
            const description =
                task.task_describle?.toLowerCase() ?? "";
            return (
                name.includes(keyword) ||
                description.includes(keyword)
            );
        });

        next.sort((a, b) => {
            if (a.task_complete !== b.task_complete) {
                return a.task_complete ? 1 : -1;
            }
            if (a.task_pinned !== b.task_pinned) {
                return a.task_pinned ? -1 : 1;
            }
            if (a.task_prior !== b.task_prior) {
                return b.task_prior - a.task_prior;
            }

            const aDeadline =
                a.task_deadline_time ??
                Number.POSITIVE_INFINITY;
            const bDeadline =
                b.task_deadline_time ??
                Number.POSITIVE_INFINITY;
            if (aDeadline !== bDeadline) {
                return aDeadline - bDeadline;
            }

            return a.task_name.localeCompare(
                b.task_name,
                "vi",
                {
                    sensitivity: "base",
                }
            );
        });

        return next;
    }, [tasks, searchTerm]);

    const handleAddTask = (data: TodoInputData) => {
        setTasks((prev) => {
            const existingTimes = new Set(
                prev.map((t) => t.task_create_time)
            );

            let timestamp =
                data.task_create_time ??
                Math.floor(Date.now() / 1000);
            while (existingTimes.has(timestamp)) {
                timestamp += 1;
            }

            const deadline =
                typeof data.task_deadline_time === "number"
                    ? data.task_deadline_time
                    : timestamp + 86400;

            const normalizedTask: TodoTask = {
                task_complete: data.task_complete ?? false,
                task_pinned: data.task_pinned ?? false,
                task_name:
                    data.task_name?.trim() ||
                    "Công việc mới",
                task_describle:
                    data.task_describle?.trim() || "",
                task_prior: clampPriority(data.task_prior),
                task_create_time: timestamp,
                task_deadline_time: deadline,
            };

            return [normalizedTask, ...prev];
        });
    };

    const handleAddTaskFromOverlay = (
        data: TodoInputData
    ) => {
        handleAddTask(data);
        setIsAddOpen(false);
    };

    const handleGenerateRandomTask = () => {
        const now = Math.floor(Date.now() / 1000);
        const deadlineOffset = randomBetween(7200, 14400);
        const randomDescription = loremIpsum({
            count: 1,
            units: "sentences",
            format: "plain",
        });

        handleAddTask({
            task_name: capitalize(
                generateWords(randomBetween(3, 5))
            ),
            task_describle: randomDescription,
            task_prior: randomBetween(0, 2),
            task_deadline_time: now + deadlineOffset,
        });
    };

    const handleDeleteTask = (timestamp: number) => {
        setTasks((prev) =>
            prev.filter(
                (task) =>
                    task.task_create_time !== timestamp
            )
        );
    };

    const handleToggleComplete = (timestamp: number) => {
        setTasks((prev) =>
            prev.map((task) =>
                task.task_create_time === timestamp
                    ? {
                          ...task,
                          task_complete:
                              !task.task_complete,
                      }
                    : task
            )
        );
    };

    const handleTogglePinned = (timestamp: number) => {
        setTasks((prev) =>
            prev.map((task) =>
                task.task_create_time === timestamp
                    ? {
                          ...task,
                          task_pinned: !task.task_pinned,
                      }
                    : task
            )
        );
    };

    return (
        <div className="todo-shell">
            <div className="todo-card">
                <TodoHeader
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onOpenAdd={() => setIsAddOpen(true)}
                    onRandomAdd={handleGenerateRandomTask}
                />

                <div className="todo-body">
                    <TodoList
                        tasks={filteredTasks}
                        onDeleteTask={handleDeleteTask}
                        onToggleComplete={
                            handleToggleComplete
                        }
                        onTogglePinned={handleTogglePinned}
                    />
                </div>
            </div>

            {isAddOpen ? (
                <div
                    className="todo-overlay"
                    onMouseDown={() => setIsAddOpen(false)}
                >
                    <div
                        className="todo-overlay__panel"
                        onMouseDown={(e) =>
                            e.stopPropagation()
                        }
                    >
                        <div className="todo-overlay__header">
                            <div className="todo-overlay__title">
                                Add new task
                            </div>
                            <button
                                type="button"
                                className="todo-overlay__close"
                                onClick={() =>
                                    setIsAddOpen(false)
                                }
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="todo-overlay__content">
                            <TodoInput
                                onAddTask={
                                    handleAddTaskFromOverlay
                                }
                            />
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
