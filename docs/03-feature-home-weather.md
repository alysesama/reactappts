# 03 - Feature Home: Weather

## Mục tiêu

Feature Weather hiển thị thời tiết theo vị trí hiện tại của người dùng:

- xin quyền **Geolocation** để lấy `lat/lon`
- gọi **OpenWeather One Call 3.0** để lấy `current/hourly/daily`
- gọi **OpenWeather Reverse Geocoding** để hiển thị địa điểm (tên thành phố/khu vực)
- cache dữ liệu vào `localStorage` để giảm số lần gọi API
- có **debug panel** trong môi trường DEV để mô phỏng lỗi/delay/bad data

Entry UI:

- `src/pages/HomePage.tsx` render:
  - `feature/home/Weather`
  - `feature/home/HomeMenu`

## Files chính

- `src/feature/home/Weather.tsx`
- `src/feature/home/WeatherInfoPanel.tsx`
- `src/feature/home/WeatherHourlyPanel.tsx`
- `src/feature/home/WeatherDailyPanel.tsx`
- `src/feature/home/WeatherDebugPanel.tsx`
- `src/feature/home/WeatherDebugConfig.ts`

## Data model & state

Trong `Weather.tsx` có các state chính:

- `geo: GeoState`
  - `idle` | `loading` | `error` | `ready({lat, lon, accuracy?})`
- `weather: WeatherState`
  - `idle` | `loading` | `error(message)` | `ready({info})`
- `selectedInfo: unknown | null`
  - item đang được chọn để panel Info hiển thị
  - lấy từ `current` hoặc item trong hourly/daily

`WeatherInfo` (cache payload) gồm:

- `nextRefreshTime` (unix seconds)
- `address` (string | null)
- `coords` (`{lat, lon}` | null)
- `current/hourly/daily` (unknown)

## API key

Weather đọc API key từ:

- `import.meta.env.VITE_OPENWEATHER_API_KEY`

Nếu thiếu key (hoặc đang debug simulate missing key) -> set `weather.status = error` với message `Missing API Key.`

## Cache (localStorage)

- Storage key: `weather_info`
- Refresh interval: `REFRESH_SECONDS = 1800` (30 phút)

Luồng cache:

- Khi mount, component cố gắng đọc cache qua `readCachedWeatherInfo()`
- Nếu `cached.nextRefreshTime > now` và payload hợp lệ -> dùng cache luôn (set state `ready`)
- Nếu cache bị lỗi format / bad data:
  - xoá `localStorage[weather_info]`
  - hiển thị lỗi `Bad Data`

### Validate payload

Weather validate dữ liệu bằng:

- `isValidCurrent()`
- `isValidHourly()`
- `isValidDaily()`

Chỉ kiểm một số field quan trọng để tránh crash UI:

- `current.dt`, `current.temp`
- `hourly[].dt`, `hourly[].temp`
- `daily[].dt`, `daily.temp.min/max`

## Luồng lấy vị trí (Geolocation)

Hàm `requestLocation()`:

- kiểm tra `navigator.geolocation` có tồn tại
- gọi `getCurrentPosition` với options:
  - `enableHighAccuracy: true`
  - `timeout: 12_000`
  - `maximumAge: 60_000`

Kết quả:

- success -> `geo.status = ready(coords)`
- error -> `geo.status = error(message)`

## Luồng fetch dữ liệu thời tiết

Hàm trung tâm: `fetchAndCache(coords)`

1) Build URL One Call 3.0:

- normal:
  - `https://api.openweathermap.org/data/3.0/onecall?lat=...&lon=...&appid=...&units=metric`
- debug có thể simulate "bad url" bằng endpoint `onecall__bad`

2) (DEV) Simulate delay / http status / ok but no data

3) Fetch One Call JSON

4) Fetch address (reverse geocoding)

- `https://api.openweathermap.org/geo/1.0/reverse?lat=...&lon=...&limit=1&appid=...`
- nếu không có address -> fallback sang string `"{lat}, {lon}"`

5) Tạo `WeatherInfo` và set `nextRefreshTime = now + REFRESH_SECONDS`

6) (DEV) có thể corrupt payload (current/hourly/daily)

7) Validate payload -> nếu ok:

- write cache: `localStorage.setItem("weather_info", JSON.stringify(info))`
- set state `weather.status = ready(info)`
- set `selectedInfo` nếu đang null

## Auto refresh / manual refresh

`refreshIfNeeded(force?: boolean)`:

- nếu không bypass cache và cache còn hạn -> dùng cache
- nếu có `cached.coords` -> fetch theo coords đó
- nếu chưa có coords -> gọi `requestLocation()`

Manual refresh:

- nút `Refresh` chỉ xuất hiện khi đang error
- gọi `refreshIfNeeded(true)`

## Debug panel (DEV)

Chỉ bật khi `import.meta.env.DEV`.

- Debug config lưu ở `localStorage[weather_debug]`
- Các option chính (`WeatherDebugConfig`):
  - `bypassCache`
  - `simulateMissingApiKey`
  - `simulateBadOneCallUrl`
  - `simulateHttpStatus` (401/404/429/500)
  - `simulateOkButNoData`
  - `corruptCurrent/hourly/daily`
  - `simulateDelayMs`
  - `fixedNowSeconds` (để test cache hết hạn)
  - `autoFetchMode`: `normal | delay | idle`

## HomeMenu (liên kết nhanh)

`src/feature/home/HomeMenu.tsx`:

- build list từ `APP_PAGES`, loại `HomePage`
- render grid link `to={\`/${getPagePath(p)}\`}`
