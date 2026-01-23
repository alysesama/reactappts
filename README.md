
# reactappts (staging)

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

# Tài liệu dự án `reactappts`

Tài liệu này mô tả **main flow** và cách các **feature** hoạt động trong dự án.

## Mục lục

- [01 - Khởi động & Routing](./docs/01-khoi-dong-va-routing.md)
- [02 - App Shell & Điều hướng](./docs/02-app-shell-va-dieu-huong.md)
- [03 - Feature Home: Weather](./docs/03-feature-home-weather.md)
- [04 - Feature Movies: TMDB](./docs/04-feature-movies-tmdb.md)
- [05 - Feature Todo App](./docs/05-feature-todo-app.md)
- [06 - Feature GitHub Search](./docs/06-feature-github-search.md)
- [07 - Debug, Storage & Keys](./docs/07-debug-va-storage.md)
- [08 - Env & Deploy](./docs/08-env-va-deploy.md)

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
