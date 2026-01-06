import "@/styles/todo/TodoList.css";
import TodoItem from "./TodoItem";
import type { TodoTask } from "./todoModel";

export default function TodoList({
    tasks,
    onDeleteTask,
    onToggleComplete,
    onTogglePinned,
}: {
    tasks: TodoTask[];
    onDeleteTask: (timestamp: number) => void;
    onToggleComplete: (timestamp: number) => void;
    onTogglePinned: (timestamp: number) => void;
}) {
    if (tasks.length === 0) {
        return (
            <div className="todo-list todo-list__empty">
                <h4>Chưa có công việc nào ở đây</h4>
                <p>
                    Thêm task mới hoặc thử tìm kiếm để xem
                    danh sách khác.
                </p>
            </div>
        );
    }

    return (
        <div className="todo-list">
            {tasks.map((task) => (
                <TodoItem
                    key={task.task_create_time}
                    task={task}
                    onToggleComplete={() =>
                        onToggleComplete(
                            task.task_create_time
                        )
                    }
                    onTogglePinned={() =>
                        onTogglePinned(
                            task.task_create_time
                        )
                    }
                    onDeleteTask={() =>
                        onDeleteTask(task.task_create_time)
                    }
                />
            ))}
        </div>
    );
}
