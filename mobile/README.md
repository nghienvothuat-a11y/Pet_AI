# BossCare Mobile (Expo)

Ứng dụng mobile React Native/Expo cho project `BossCare`.

## Mục đích

Ứng dụng này là client iOS/Android để chọn hoặc chụp ảnh chó/mèo rồi gửi lên backend Next.js của project để phân tích. App cũng lưu lịch sử scan cục bộ và tích hợp Google AdMob banner/interstitial.

## Cài đặt

Từ thư mục `mobile`:

```bash
cd mobile
npm install
```

## Chạy app

### Chạy backend Next.js ở project gốc

Trong thư mục gốc `BossCare`:

```bash
npm run dev
```

### Chạy app Expo

```bash
npm run start
```

Sau đó mở app trên iOS Simulator hoặc Android Emulator.

## API endpoint

Mặc định `App.tsx` dùng URL:

- iOS simulator: `http://localhost:3000/api/analyze`
- Android emulator: `http://10.0.2.2:3000/api/analyze`

Nếu dùng thiết bị thật, cần đổi `API_URL` trong `mobile/App.tsx` thành địa chỉ IP của máy chủ dev, ví dụ:

```ts
const API_URL = "http://192.168.1.100:3000/api/analyze";
```

Hoặc nếu backend đã deploy, dùng URL production như:

```ts
const API_URL = "https://pet-ai-sooty.vercel.app/api/analyze";
```

Build production hiện đọc endpoint từ `expo.extra.apiUrl` trong `app.json`.

## AdMob

AdMob được cấu hình trong `app.json` và `src/useAdMobAds.tsx`:

- iOS App ID: `ca-app-pub-7806638519709442~7620954816`
- Bottom banner: `ca-app-pub-7806638519709442/2642440398`
- Interstitial: `ca-app-pub-7806638519709442/6060765050`

`expo.extra.useAdMobTestAds` nên để `false` cho bản App Store production. Khi cần xác minh bề mặt quảng cáo trên TestFlight trước khi AdMob live units có inventory, có thể bật `true` và upload build riêng chỉ để test.

## App Store assets

Asset distribution nằm ở project root:

- `appstore-assets/icon/app-icon-1024.png`
- `appstore-assets/screenshots/final/`
- `appstore-assets/metadata/app-store-listing.md`
- `appstore-assets/metadata/review-notes.md`
- `appstore-assets/metadata/assets-checklist.md`

## Ghi chú

- Backend OpenAI vẫn chạy ở server. Mobile app chỉ gửi ảnh đến API và hiển thị kết quả.
- Lịch sử scan được lưu cục bộ trên máy bằng AsyncStorage và Expo FileSystem, không lưu vào cloud của BossCare.
- Ảnh trong lịch sử được copy vào vùng lưu trữ riêng của app để hạn chế phụ thuộc vào file tạm từ camera/thư viện ảnh.
- iOS `NSMicrophoneUsageDescription` được khai báo vì SDK camera/audio có thể tham chiếu microphone API; BossCare không ghi âm để phân tích.
- Nếu muốn dùng máy thật, đảm bảo điện thoại và máy dev cùng mạng LAN.
