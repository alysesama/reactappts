# 02 - App Shell & Điều hướng

## Mục tiêu của shell

`App Shell` là khung UI chung cho toàn bộ mini-app:

- giữ layout nhất quán
- render nội dung page theo route (`<Outlet />`)
- cung cấp điều hướng giữa các page (Bottom navbar)

## Layout chính: `pages/Main.tsx`

- Wrapper root: `<div className="app-shell">`
- `<ContentContainer>` bọc `<Outlet />`
- `<BottomNavbar pages={APP_PAGES} />`

### `ContentContainer`

File: `src/feature/main/ContentContainer.tsx`

- Dùng `useLocation()` để lấy `location.pathname`
- Render nội dung trong `div.app-content__page` với `key={location.pathname}`
  - mục đích: khi đổi route, React remount page container để reset animation/scroll state theo CSS.

### `BottomNavbar`

File: `src/feature/main/BottomNavbar.tsx`

- Render danh sách tab từ `pages: AppPage[]`
- Mỗi tab là một `NavLink`:
  - `to={\`/${getPagePath(p)}\`}`
  - auto add class `is-active` khi route match
- Tự động tính chế độ scroll nếu:
  - số tab nhiều hơn `maxTabsBeforeScroll = 6`, hoặc
  - width mỗi tab nhỏ hơn `minTabWidthPx = 200`
- Active indicator:
  - query DOM `.app-nav__item.is-active`
  - lấy `offsetLeft` + `offsetWidth`
  - set inline style để vẽ thanh indicator chạy theo tab active
- Recompute khi:
  - `resize`
  - `ResizeObserver` (nếu browser hỗ trợ)
  - `location.pathname` thay đổi

## Page wrapper

Các file trong `src/pages/*Page.tsx` thường chỉ là wrapper để render feature tương ứng:

- `HomePage` -> `feature/home/*`
- `MoviesPage` -> `feature/movies/ui/MoviesApp`
- `TodoAppPage` -> `feature/todo/TodoApp`
- `GitHubUserSearchPage` -> `feature/github-search/GitHubUserSearch`

Điều này giúp:

- routing layer đơn giản
- feature layer tách biệt rõ ràng

## NotFound

`src/pages/NotFoundPage.tsx`:

- hiển thị `404 - Page not found`
- có link `to="/"` để quay lại root (sẽ được redirect sang page mặc định)
