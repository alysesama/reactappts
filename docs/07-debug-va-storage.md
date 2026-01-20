# 07 - Debug, Storage & Keys

Trang này tổng hợp các key lưu trong browser storage và các cơ chế debug chính.

## Tổng quan storage

- `localStorage`: lưu data cần tồn tại lâu (weather cache, todo tasks, TMDB auth/lists)
- `sessionStorage`: lưu debug config (Movies) theo session

## Weather

### Keys

- `localStorage[weather_info]`: cache thời tiết (`WeatherInfo`)
- `localStorage[weather_debug]`: debug config (chỉ có ý nghĩa trong DEV)

### Khi nào bị xoá

- nếu payload cache không hợp lệ -> code sẽ `removeItem(weather_info)`
- khi chạy production build -> code cố gắng xoá `weather_debug`

## Todo

### Keys

- `localStorage[todo_tasks]`: danh sách tasks

### Đặc điểm

- task id dùng `task_create_time` (unix seconds) và code đảm bảo unique bằng cách +1 nếu trùng.

## Movies (TMDB)

### Keys

- `localStorage[TMDB_USER_AUTH_V1]`: state auth (accessToken + session + user)
- `localStorage[TMDB_USER_AUTH_PENDING_V1]`: request_token pending trong quá trình login redirect
- `localStorage[TMDB_USER_LISTS_V1_${accountId}]`: cache favorite/watchlist

### Debug keys (DEV)

- `sessionStorage[MOVIES_DEBUG_CONFIG_V1]`: debug config
- `sessionStorage[MOVIES_DEBUG_REFRESH_V1]`: refresh id (để force remount MoviesApp trong DEV)

## Env keys

Các biến môi trường được cấu hình trong thư mục `env/` (do `vite.config.ts` set `envDir`).

- `VITE_OPENWEATHER_API_KEY`
- `VITE_TMDB_READ_ACCESS_TOKEN` (khuyến nghị)
- `VITE_TMDB_API_KEY` (fallback)

Lưu ý bảo mật:

- không commit key thật
- nếu lỡ commit -> rotate/revoke key và xoá khỏi git history

## Debug patterns dùng trong codebase

- **Simulate delay**: dùng `setTimeout`/`Promise` trước khi fetch
- **Simulate HTTP status**: throw error có message chứa status
- **Bad 200**: trả về status 200 nhưng payload bị transform thành bad data để test UI
- **Bypass cache**: bỏ qua điều kiện `nextRefreshTime` và ép fetch lại
