import "@/styles/todo/TodoHeader.css";

export default function TodoHeader({
    searchTerm,
    onSearchChange,
    onOpenAdd,
    onRandomAdd,
}: {
    searchTerm: string;
    onSearchChange: (next: string) => void;
    onOpenAdd: () => void;
    onRandomAdd: () => void;
}) {
    return (
        <header className="todo-header">
            <div className="todo-controls">
                <input
                    className="search-input"
                    placeholder="Tìm kiếm công việc..."
                    value={searchTerm}
                    onChange={(e) =>
                        onSearchChange(e.target.value)
                    }
                />

                <div className="todo-controls__actions">
                    <button
                        type="button"
                        className="todo-action-button primary"
                        onClick={onOpenAdd}
                        aria-label="Add"
                        title="Add"
                    >
                        <i
                            className="fa-solid fa-plus"
                            aria-hidden="true"
                        />
                    </button>
                    <button
                        type="button"
                        className="todo-action-button secondary"
                        onClick={onRandomAdd}
                        aria-label="Random Add"
                        title="Random Add"
                    >
                        <i
                            className="fa-solid fa-dice"
                            aria-hidden="true"
                        />
                    </button>
                </div>
            </div>
        </header>
    );
}
