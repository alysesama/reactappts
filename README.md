
# reactappts

Ứng dụng React + TypeScript (Vite) dạng “multi mini-app” chạy trong một shell chung, điều hướng bằng `react-router-dom` (dùng `HashRouter` để tương thích deploy static/GitHub Pages).

## Tech stack

- **Runtime**: Vite
- **UI**: React
- **Routing**: `react-router-dom` (Hash Router)
- **Style**: CSS thuần trong `src/styles/**`

## Cách chạy

```bash
npm install
npm run dev
```

Build/preview:

```bash
npm run build
npm run preview
```

## Biến môi trường

Project cấu hình `envDir` là thư mục `env/` (xem `vite.config.ts`).

Tạo file `env/.env` và khai báo các biến sau (không commit key thật lên repo):

- **`VITE_OPENWEATHER_API_KEY`**: dùng cho feature Weather (OpenWeather)
- **`VITE_TMDB_READ_ACCESS_TOKEN`** *(khuyến nghị)*: TMDB Read Access Token (Bearer)
- **`VITE_TMDB_API_KEY`** *(fallback)*: TMDB API Key (query param)

Lưu ý:

- **TMDB auth**: code sẽ ưu tiên `VITE_TMDB_READ_ACCESS_TOKEN`. Nếu token trống thì mới dùng `VITE_TMDB_API_KEY`.
- Thư mục `env/` đang được `.gitignore` ignore. Nếu bạn đã từng commit nhầm key lên git, hãy **rotate/revoke** key và xoá khỏi history.

## Structure (thư mục chính)

```text
src/
  app/
    main.tsx            # mount React root + HashRouter
    routes.tsx          # khai báo Routes + generate route từ APP_PAGES
    pageRegistry.ts     # định nghĩa APP_PAGES + mapping link -> path
    pageComponents.tsx  # mapping link -> React component

  pages/
    Main.tsx            # app shell: ContentContainer + BottomNavbar + <Outlet/>
    HomePage.tsx
    MoviesPage.tsx
    TodoAppPage.tsx
    GitHubUserSearchPage.tsx
    NotFoundPage.tsx

  feature/
    main/               # shell UI (BottomNavbar, ContentContainer)
    home/               # Weather + HomeMenu
    movies/             # TMDB app (tabs, hooks, api client, debug)
    todo/               # Todo app (model + UI)
    github-search/      # GitHub user & repos search

  styles/               # CSS theo từng feature

index.html              # load /src/main.tsx
```

## Main flow (luồng hoạt động chính)

### 1) Bootstrapping

- `index.html` load entry `src/main.tsx`
- `src/main.tsx` chỉ import `src/app/main.tsx`
- `src/app/main.tsx`
  - tạo React root (`createRoot`)
  - bọc `HashRouter`
  - render `AppRoutes`

### 2) Routing + Layout

- `src/app/pageRegistry.ts`
  - khai báo danh sách `APP_PAGES` (Home/Movies/Todo/GitHub Search)
  - `getPagePath()` chuyển `MoviesPage` -> `movies` (kebab-case)
- `src/app/pageComponents.tsx`
  - map `link` (vd `MoviesPage`) sang component page tương ứng
- `src/app/routes.tsx`
  - route root (`/`) render `pages/Main.tsx`
  - route index redirect sang page đầu tiên trong `APP_PAGES`
  - generate các route con dựa trên `APP_PAGES`
  - fallback `*` -> `NotFoundPage`

Ví dụ URL khi chạy:

- `/#/home`
- `/#/movies`
- `/#/todo-app`
- `/#/git-hub-user-search`

### 3) App shell

- `pages/Main.tsx` là “khung” chung:
  - `<ContentContainer>` bọc `<Outlet />` để hiển thị page hiện tại
  - `<BottomNavbar pages={APP_PAGES} />` điều hướng giữa các page

### 4) Page -> Feature

Mỗi page (`src/pages/*Page.tsx`) thường chỉ là wrapper để render một feature:

- `MoviesPage` -> `feature/movies/ui/MoviesApp`
- `TodoAppPage` -> `feature/todo/TodoApp`
- `GitHubUserSearchPage` -> `feature/github-search/GitHubUserSearch`
- `HomePage` -> `feature/home/Weather` + `feature/home/HomeMenu`

## Features

### 1) Home

- **Weather** (`feature/home/Weather.tsx`)
  - xin quyền geolocation, lấy `lat/lon`
  - gọi OpenWeather One Call 3.0
  - reverse geocoding để hiển thị địa điểm
  - cache kết quả vào `localStorage` (`weather_info`) với `nextRefreshTime`
  - có **debug panel** trong DEV để mô phỏng lỗi/độ trễ/bad data (lưu config trong `localStorage`)

- **HomeMenu** (`feature/home/HomeMenu.tsx`)
  - build danh sách link từ `APP_PAGES` (trừ `HomePage`)

### 2) Movies (TMDB)

Entry UI: `feature/movies/ui/MoviesApp.tsx`

- **Search**
  - input -> debounce (`useDebouncedValue`) -> gọi `useTmdbMovieSearch`
  - `useTmdbMovieSearch` gọi `tmdbGet('/search/movie')`, trả status/error/results

- **Tabs / Lists**
  - các tab như Trending/Popular/Now Playing/Upcoming/Search (tuỳ folder `feature/movies/tabs/*`)

- **Detail panel**
  - click item -> set `selectedMedia` -> mở `MovieDetailPanel`
  - `useTmdbMediaDetail` gọi song song:
    - `/{type}/{id}` (details)
    - `/{type}/{id}/credits`
    - `/{type}/{id}/videos`

- **API client + debug**
  - `feature/movies/api/tmdbClient.ts`: build query, auth (Bearer/api_key), handle errors
  - DEV có chế độ debug (simulate status/delay/bad 200…) thông qua sessionStorage (`MOVIES_DEBUG_CONFIG_V1`)

### 3) Todo App

Entry UI: `feature/todo/TodoApp.tsx`

- **Persistence**: lưu tasks vào `localStorage` key `todo_tasks`
- **Sorting**: ưu tiên
  - chưa complete trước
  - pinned trước
  - priority cao trước
  - deadline gần trước
  - tên theo locale `vi`
- **Search**: lọc theo `task_name` / `task_describle`
- **Auto-complete**: task quá deadline sẽ tự set `task_complete=true`
- **Random task**: sinh task demo bằng `lorem-ipsum`

### 4) GitHub Search

Entry UI: `feature/github-search/GitHubUserSearch.tsx`

- **Fetch GitHub user + repos**
  - submit username -> gọi `fetchGitHubUser()` và `fetchGitHubRepos()`
  - repos fetch theo trang (`per_page=100`), tối đa 10 pages
  - handle một số lỗi phổ biến:
    - `404`: không tìm thấy user
    - `403`: bị rate limit / thiếu quyền

- **Client-side processing** (`useGithubUserSearch.ts`)
  - sort theo field (stars/forks/watchers/created/updated/language/license/name)
  - filter theo keywords (debounce 400ms), hỗ trợ nhiều keyword phân tách bằng dấu `,`

## Notes

- App dùng `HashRouter` nên URL sẽ có dạng `/#/movies`, phù hợp deploy static.
- Alias import `@` trỏ tới `src/` (xem `vite.config.ts`, `tsconfig.app.json`).

## Deploy (GitHub Pages)

`vite.config.ts` có cấu hình `base` theo biến môi trường `GITHUB_REPOSITORY` để build ra đúng subpath khi deploy GitHub Pages.

- Nếu build ở GitHub Actions, thường `GITHUB_REPOSITORY` đã có sẵn (vd `owner/repo`).
- Nếu deploy ở nơi khác, `base` sẽ mặc định là `/`.

