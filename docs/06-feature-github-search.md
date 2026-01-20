# 06 - Feature GitHub Search

## Mục tiêu

Feature GitHub Search cho phép:

- nhập GitHub username
- fetch thông tin user
- fetch danh sách repo (paging)
- sort repo theo nhiều field
- filter repo theo keyword (debounce), hỗ trợ nhiều keyword ngăn cách bằng dấu `,`

Entry UI:

- `src/pages/GitHubUserSearchPage.tsx` -> `feature/github-search/GitHubUserSearch`

## Files chính

- `src/feature/github-search/GitHubUserSearch.tsx`
- `src/feature/github-search/useGithubUserSearch.ts`
- `src/feature/github-search/githubApi.ts`
- `src/feature/github-search/FilterBar.tsx`
- `src/feature/github-search/ProfileCard.tsx`
- `src/feature/github-search/RepoList.tsx`
- `src/feature/github-search/RepoItem.tsx`
- `src/feature/github-search/githubTypes.ts`

## API layer: `githubApi.ts`

Base URL: `https://api.github.com`

### `fetchGitHubUser(username)`

- `GET /users/{username}`
- error handling:
  - 404 -> `Không tìm thấy user này`
  - 403 -> `GitHub API bị giới hạn hoặc không có quyền truy cập`
  - khác -> `Không thể tải dữ liệu từ GitHub`

### `fetchGitHubRepos(username)`

- fetch theo page:
  - `GET /users/{username}/repos?sort=updated&per_page=100&page={page}`
- loop cho đến khi:
  - repos trả về < 100, hoặc
  - đạt giới hạn `page > 10` (tối đa ~1000 repos)

## Main hook: `useGithubUserSearch()`

State chính:

- input:
  - `username`
  - `searchText` (filter text)
- data:
  - `userInfo: GitHubUser | null`
  - `repos: GitHubRepo[]`
- UI state:
  - `status: idle | loading | success | error`
  - `error: string`
- sort:
  - `sortField: RepoSortField` (default `stars`)
  - `sortOrder: asc | desc` (default `desc`)

### Submit username

`handleSubmitUsername()`:

- validate username không rỗng
- reset state (clear userInfo, repos, reset sort/filter)
- gọi tuần tự:
  1) `fetchGitHubUser(trimmed)`
  2) `fetchGitHubRepos(trimmed)`

### Filter theo keyword (debounce)

- debounce `searchText` 400ms (`useDebouncedValue` nội bộ hook)
- parse keywords:
  - split bởi `,`
  - trim, lowercase
  - bỏ keyword rỗng

Logic filter:

- tạo `haystack` từ:
  - `repo.name`, `repo.description`, `repo.language`, `license`, `topics`
- giữ repo khi `keywords.every(kw => haystack.includes(kw))`

### Sorting

- primary sort theo `sortField`:
  - `stars`, `forks`, `watchers`
  - `created_at`, `updated_at`
  - `name`, `language`, `license`
- secondary sort theo `repo.name` để ổn định

## UI components

### `FilterBar`

- form input username
- button submit
- disable button khi `status === loading`

### `RepoList`

- hiển thị số lượng repo
- sort order toggle (↑/↓)
- select sort field
- text input filter (search)
- list repo:
  - nếu `repos.length === 0` -> `Không có repository nào`

