# 08 - Env & Deploy

## Env

### `envDir`

Dự án cấu hình Vite `envDir` là thư mục `env/`:

- xem `vite.config.ts`:
  - `envDir: path.resolve(__dirname, 'env')`

Vì vậy file env chính là:

- `env/.env`

### Các biến

- `VITE_OPENWEATHER_API_KEY`
- `VITE_TMDB_READ_ACCESS_TOKEN` *(khuyến nghị)*
- `VITE_TMDB_API_KEY` *(fallback)*

## Scripts

Trong `package.json`:

- `npm run dev`: chạy Vite dev server
- `npm run build`: `tsc -b` và `vite build`
- `npm run preview`: preview build

## Deploy GitHub Pages

`vite.config.ts` cấu hình `base` phụ thuộc biến môi trường `GITHUB_REPOSITORY`:

- nếu có `GITHUB_REPOSITORY = owner/repo`:
  - `base = /repo/`
- nếu không:
  - `base = /`

Điều này giúp build ra đúng subpath khi deploy GitHub Pages.

## Routing khi deploy static

App dùng `HashRouter`, nên việc refresh/đi thẳng vào route con vẫn hoạt động với static host (không cần cấu hình rewrite 404->index).
