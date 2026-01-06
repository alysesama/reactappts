export type TodoTask = {
    task_complete: boolean;
    task_pinned: boolean;
    task_name: string;
    task_describle?: string;
    task_prior: number;
    task_create_time: number;
    task_deadline_time?: number;
};

export type TodoFilter = "all" | "active" | "completed" | "high";

export function clampPriority(value: unknown) {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return 1;
    return Math.min(2, Math.max(0, numeric));
}

export function fallbackTasks(): TodoTask[] {
    const now = Math.floor(Date.now() / 1000);
    return [
        {
            task_complete: false,
            task_pinned: false,
            task_name: "Thiết kế UI màn Dashboard",
            task_describle:
                "Hoàn thiện các wireframe chính và thống nhất dữ liệu biểu đồ với team backend.",
            task_prior: 2,
            task_create_time: now - 7200,
            task_deadline_time: now + 7200,
        },
        {
            task_complete: true,
            task_pinned: false,
            task_name: "Chuẩn bị workshop React",
            task_describle:
                "Tổng hợp slides về hooks, state management và demo code cho buổi chia sẻ nội bộ.",
            task_prior: 1,
            task_create_time: now - 17200,
            task_deadline_time: now + 12000,
        },
        {
            task_complete: false,
            task_pinned: false,
            task_name: "Review code pull request #108",
            task_describle:
                "Tập trung kiểm tra phần auth guard, performance và các edge cases liên quan.",
            task_prior: 0,
            task_create_time: now - 36000,
            task_deadline_time: now + 14400,
        },
    ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function parseTask(value: unknown): TodoTask | null {
    if (!isRecord(value)) return null;

    const task_complete = value.task_complete;
    const task_pinned = value.task_pinned;
    const task_name = value.task_name;
    const task_describle = value.task_describle;
    const task_prior = value.task_prior;
    const task_create_time = value.task_create_time;
    const task_deadline_time = value.task_deadline_time;

    if (typeof task_complete !== "boolean") return null;
    if (typeof task_name !== "string") return null;
    if (!isFiniteNumber(task_create_time)) return null;

    return {
        task_complete,
        task_pinned: typeof task_pinned === "boolean" ? task_pinned : false,
        task_name,
        task_describle:
            typeof task_describle === "string"
                ? task_describle
                : "",
        task_prior: clampPriority(task_prior),
        task_create_time: Math.floor(task_create_time),
        task_deadline_time: isFiniteNumber(task_deadline_time)
            ? Math.floor(task_deadline_time)
            : undefined,
    };
}

export function loadStoredTasks(storageKey: string): TodoTask[] {
    if (typeof window === "undefined") return fallbackTasks();

    try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
            const parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                const tasks = parsed
                    .map(parseTask)
                    .filter(Boolean) as TodoTask[];
                if (tasks.length > 0) return tasks;
            }
        }
    } catch {
        // ignore
    }

    return fallbackTasks();
}
