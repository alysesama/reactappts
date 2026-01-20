# 04 - Feature Movies: TMDB

## Mục tiêu

Feature Movies là một mini-app tương tác với **The Movie Database (TMDB)**:

- hiển thị các tab (Trending / Popular TV / Now Playing / Upcoming / Search)
- search movie (debounce)
- mở detail panel (fetch details/credits/videos song song)
- hỗ trợ login TMDB user (v4 request token -> access token -> convert session v3)
- hiển thị danh sách Favorite/Watchlist của user
- cho phép toggle Favorite/Watchlist (ghi lên TMDB + update cache local)
- có debug mode (DEV) để simulate lỗi mạng/auth/bad 200/delay

Entry UI:

- `src/pages/MoviesPage.tsx` -> `feature/movies/ui/MoviesApp`

## Files chính

- UI shell: `src/feature/movies/ui/MoviesApp.tsx`
- Search:
  - `src/feature/movies/ui/SearchBar.tsx`
  - `src/feature/movies/ui/SearchResults.tsx`
  - `src/feature/movies/hooks/useDebouncedValue.ts`
  - `src/feature/movies/hooks/useTmdbMovieSearch.ts`
- Tabs:
  - `src/feature/movies/tabs/TrendingTab.tsx`
  - `src/feature/movies/tabs/PopularTab.tsx`
  - `src/feature/movies/tabs/NowPlayingTab.tsx`
  - `src/feature/movies/tabs/UpcomingTab.tsx`
  - `src/feature/movies/tabs/SearchTab.tsx`
- Detail:
  - `src/feature/movies/ui/MovieDetailPanel.tsx`
  - `src/feature/movies/hooks/useTmdbMediaDetail.ts`
- API client:
  - `src/feature/movies/api/tmdbClient.ts`
- Auth:
  - `src/feature/movies/auth/tmdbUserAuth.ts`
  - `src/feature/movies/hooks/useTmdbUserAuth.ts`
- User lists:
  - `src/feature/movies/hooks/useTmdbUserLists.ts`
  - `src/feature/movies/ui/MoviesUserListsPanel.tsx`
- Debug:
  - `src/feature/movies/debug/moviesDebugConfig.ts`
  - `src/feature/movies/debug/useMoviesDebug.ts`
  - `src/feature/movies/ui/MoviesDebugPanel.tsx`

## API keys & auth ưu tiên

TMDB client ưu tiên auth theo thứ tự:

1) `VITE_TMDB_READ_ACCESS_TOKEN` (Bearer token)
2) fallback: `VITE_TMDB_API_KEY` (query param `api_key`)

Logic nằm trong `buildQuery()` (tmdbClient).

## API client: `tmdbClient.ts`

### `tmdbGet(path, params, signal)`

- normalize `path` bắt đầu bằng `/`
- build URL từ base `https://api.themoviedb.org/3`
- build query:
  - auto add `language=en-US` (có thể tắt ở request khác)
  - tự add `api_key` nếu **không có Bearer token**
- set header:
  - `Accept: application/json`
  - `Authorization: Bearer ...` nếu có token
- nếu response không ok -> throw Error kèm status + body text (nếu đọc được)

### `tmdbPost / tmdbDelete / tmdbV4Post / tmdbV4Delete`

- dùng helper `tmdbRequest()`
- support:
  - `bearerToken` override (quan trọng cho v3 convert session bằng v4 token)
  - `includeLanguage: false` cho TMDB v4 endpoints

## Luồng UI tổng

`MoviesApp.tsx` quản lý các state UI:

- `searchText`, `isSearchOpen`
- `selectedMedia: {type: "movie"|"tv", id} | null`
- debug UI (DEV): `isDebugOpen`

Các hook chính:

- `useDebouncedValue(searchText, 350)`
- `useTmdbMovieSearch(debounced)` -> `status/error/results`
- `useTmdbUserAuth()` -> trạng thái user/session
- `useTmdbUserLists({enabled, accountId, sessionId, refreshKey})`

### Search

- input -> set `searchText`
- debounce 350ms
- `useTmdbMovieSearch` gọi `/search/movie` với:
  - `include_adult=false`
  - `page=1`
- lọc bad data: nếu `results` có nhưng tất cả đều thiếu `title` -> báo lỗi `Something is wrong when load movie data.`
- UI chỉ hiển thị tối đa 5 item

### Detail panel

- khi click movie/tv -> set `selectedMedia`
- `MovieDetailPanel` mở overlay
- `useTmdbMediaDetail` fetch song song:
  - `/{type}/{id}` (details)
  - `/{type}/{id}/credits`
  - `/{type}/{id}/videos`
- validate minimal:
  - movie phải có `title`
  - tv phải có `name`

## Login flow (TMDB user)

Có 2 cách trong codebase:

- redirect login (`startTmdbUserLogin`) (được dùng bởi `useTmdbUserAuth().login()`)
- popup login (`startTmdbUserLoginInPopup`) (đã implement nhưng hiện chưa thấy call site chính trong UI shell)

### Redirect login

1) `startTmdbUserLogin()`

- gọi TMDB v4: `POST /auth/request_token` với `{ redirect_to }`
- lưu pending token vào `localStorage[TMDB_USER_AUTH_PENDING_V1]`
- redirect browser tới:
  - `https://www.themoviedb.org/auth/access?request_token=...`

2) Sau khi approve, TMDB redirect về app với `request_token` (query hoặc hash)

- `useTmdbUserAuth` detect `request_token` trong URL
- gọi `completeTmdbUserLoginFromRedirect()`:
  - parse `request_token`
  - `completeTmdbUserLogin(request_token)`
  - clear pending + clean URL (remove request_token)

3) `completeTmdbUserLogin(request_token)`

- v4 create access token:
  - `POST https://api.themoviedb.org/4/auth/access_token`
- convert v4 token -> v3 session:
  - `POST /authentication/session/convert/4` body `{ access_token }`
  - request này dùng `bearerToken = accessToken` và `includeLanguage=false`
- fetch account details:
  - `GET /account?session_id=...`
- persist state:
  - `localStorage[TMDB_USER_AUTH_V1] = {accessToken, expiresAt, user{accountId, sessionId, username, avatarUrl}}`
- TTL trong code: `expiresAt = now + 15 phút`

4) Auto logout

- `useTmdbUserAuth` set timeout theo `expiresAt` để clear auth khi hết hạn.

## User lists (Favorite/Watchlist)

Hook: `useTmdbUserLists`.

- chỉ chạy khi `enabled && accountId && sessionId`
- cache theo account:
  - `localStorage[TMDB_USER_LISTS_V1_${accountId}]`

### Load lists

- gọi song song và fetch tất cả page:
  - `/account/{accountId}/favorite/movies`
  - `/account/{accountId}/favorite/tv`
  - `/account/{accountId}/watchlist/movies`
  - `/account/{accountId}/watchlist/tv`

Mỗi request set `session_id` trong query.

### Local mutate

- `setFavoriteLocal(item, active)` / `setWatchlistLocal(item, active)`:
  - update state + `useRef` list
  - ghi lại cache local

UI xem list:

- `MoviesUserListsPanel` hiển thị panel (favorite/watchlist) khi hover icon list.

## Toggle favorite/watchlist từ UI

Ví dụ trong `TrendingTab.tsx`:

- Toggle favorite:
  - `POST /account/{accountId}/favorite` body `{ media_type: "movie", media_id, favorite: boolean }`
  - query `{ session_id }`
  - sau khi success -> `setFavoriteMovieLocal(item, next)`

- Toggle watchlist:
  - `POST /account/{accountId}/watchlist` body `{ media_type: "movie", media_id, watchlist: boolean }`
  - query `{ session_id }`
  - sau khi success -> `setWatchlistMovieLocal(item, next)`

Các tab khác cũng làm tương tự cho movie/tv (tuỳ UI card).

## Debug mode (DEV)

`moviesDebugConfig.ts` lưu config trong `sessionStorage[MOVIES_DEBUG_CONFIG_V1]`.

Tác dụng chính:

- `authMode`: missing/invalid/normal
- `urlMode`: bad_path/bad_base/normal
- `delayMs`: delay trước khi fetch
- `httpSim`: throw error với status giả lập
- `bad200`: transform JSON 200 OK thành payload xấu (soft/hard)
  - có target theo nhóm request (trending/nowPlaying/upcoming/popularTv/searchMovie/discover/detail/genres)

`MoviesApp.tsx` trong DEV wrap `MoviesAppInner` bằng key `refreshId` (từ `useMoviesDebugRefreshId`) để "force remount" khi người dùng bấm refresh debug.
