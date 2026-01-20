# 05 - Feature Todo App

## Mục tiêu

Feature Todo App là một mini-app quản lý công việc đơn giản:

- add task (qua overlay form)
- pin/unpin
- toggle complete
- delete task
- search theo tên/mô tả
- auto-complete task nếu đã quá deadline
- persistence bằng `localStorage`
- có nút tạo task demo ngẫu nhiên (lorem ipsum)

Entry UI:

- `src/pages/TodoAppPage.tsx` -> `feature/todo/TodoApp`

## Files chính

- `src/feature/todo/TodoApp.tsx`
- `src/feature/todo/todoModel.ts`
- `src/feature/todo/TodoHeader.tsx`
- `src/feature/todo/TodoInput.tsx`
- `src/feature/todo/TodoList.tsx`
- `src/feature/todo/TodoItem.tsx`

## Data model

`TodoTask` (todoModel):

- `task_complete: boolean`
- `task_pinned: boolean`
- `task_name: string`
- `task_describle?: string`
- `task_prior: number` (0..2)
- `task_create_time: number` (unix seconds) *(được dùng như id)*
- `task_deadline_time?: number` (unix seconds)

Priority clamp: `clampPriority(value)` -> 0..2.

## Persistence

- Storage key: `todo_tasks`
- Khi mount, `TodoApp` load tasks bằng `loadStoredTasks(STORAGE_KEY)`:
  - parse JSON array
  - validate từng task qua `parseTask`
  - nếu không có/không hợp lệ -> fallback `fallbackTasks()` (dữ liệu demo)

- Khi `tasks` thay đổi, `useEffect` ghi lại vào localStorage.

## Auto-complete khi quá deadline

Khi mount, có `useEffect` chạy một lần:

- lấy `now` (unix seconds)
- map qua tasks:
  - nếu task chưa complete và `task_deadline_time < now` -> set `task_complete=true`

## Search & sorting

`filteredTasks` computed bằng `useMemo`:

### 1) Search

- keyword = `searchTerm.toLowerCase()`
- match `task_name` hoặc `task_describle`

### 2) Sorting (thứ tự ưu tiên)

- chưa complete trước (`task_complete=false` đứng trước)
- pinned trước (`task_pinned=true` đứng trước)
- priority cao trước (`task_prior` giảm dần)
- deadline gần trước (`task_deadline_time` tăng dần, thiếu deadline -> +infinity)
- cuối cùng sort theo tên (locale `vi`, `sensitivity: base`)

## Add task

- Nút mở overlay `isAddOpen`
- `TodoInput` submit trả về `TodoInputData`
- `handleAddTask(data)` normalize:
  - `task_create_time`: dùng time hiện tại (unix seconds), nếu trùng với task khác thì +1 cho đến khi unique
  - `task_deadline_time`: nếu không cung cấp -> default `timestamp + 86400` (1 ngày)
  - `task_name`: fallback `"Công việc mới"`
  - `task_prior`: clamp 0..2

Task mới được prepend vào list: `[newTask, ...prev]`.

### Generate random task

- dùng `lorem-ipsum`
- random priority 0..2
- random deadline offset 2h..4h

## Update / delete

- delete: filter theo `task_create_time`
- toggle complete/pinned: map và flip boolean theo `task_create_time`

## Form nhập task (`TodoInput.tsx`)

- state form:
  - `task_name`, `task_describle`, `task_prior`, `task_deadline` (string `HH:mm`), `task_pinned`

- deadline input:
  - auto format `HH:mm`
  - regex validate `^([0-1]?[0-9]|2[0-3])(:([0-5]?[0-9])?)?$` trong khi gõ
  - khi submit, convert `HH:mm` -> unix seconds bằng `toUnixTime()`:
    - set giờ/phút trên ngày hôm nay
    - nếu đã qua giờ hiện tại -> tự chuyển sang ngày mai

- validation:
  - `task_name` không được rỗng

