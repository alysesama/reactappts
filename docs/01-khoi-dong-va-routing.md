# 01 - Khởi động & Routing

## Tổng quan

Dự án là một ứng dụng React + TypeScript (Vite) theo kiểu **"multi mini-app"**: nhiều mini app/feature chạy chung trong một shell.

Điều hướng dùng `react-router-dom` với `HashRouter` để phù hợp deploy static (vd GitHub Pages).

## Entry point (Bootstrapping)

- `index.html` load entry: `src/main.tsx`
- `src/main.tsx` chỉ import: `./app/main`
- `src/app/main.tsx`:
  - tạo React root: `createRoot(document.getElementById("root")!)`
  - wrap bằng `HashRouter`
  - render `AppRoutes`
  - import global CSS: `src/styles/global.css`

### Sơ đồ luồng

`index.html` -> `src/main.tsx` -> `src/app/main.tsx` -> `<HashRouter>` -> `<AppRoutes>`

## Routing

File chính:

- `src/app/routes.tsx`
- `src/app/pageRegistry.ts`
- `src/app/pageComponents.tsx`

### 1) Registry trang (`pageRegistry.ts`)

- `APP_PAGES`: danh sách page (Home/Movies/Todo/GitHub Search)
- `linkToPath(link: string)`:
  - bỏ suffix `Page`
  - chuyển CamelCase -> kebab-case
  - thay `_` -> `-`
  - lowercase

Ví dụ:

- `MoviesPage` -> `movies`
- `TodoAppPage` -> `todo-app`
- `GitHubUserSearchPage` -> `git-hub-user-search`

### 2) Map page -> component (`pageComponents.tsx`)

`PAGE_COMPONENTS` map `link` (string) sang React component tương ứng.

Ví dụ:

- `HomePage` -> `pages/HomePage.tsx`
- `MoviesPage` -> `pages/MoviesPage.tsx`

### 3) Khai báo routes (`routes.tsx`)

- Route root `path="/"` render `pages/Main.tsx` (layout shell)
- Route `index` redirect sang page đầu tiên của `APP_PAGES`
- Generate route con theo `APP_PAGES`:
  - `path={getPagePath(p)}`
  - `element={<Component />}`
- Fallback `path="*"` -> `NotFoundPage`

### URL format

Vì dùng `HashRouter`, URL sẽ có dạng:

- `/#/home`
- `/#/movies`
- `/#/todo-app`
- `/#/git-hub-user-search`

## Notes

- Alias `@` trỏ tới `src/` (config ở `vite.config.ts` + `tsconfig.app.json`).
