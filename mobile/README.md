# BossCare Mobile (Expo)

Ứng dụng mobile React Native/Expo cho project `BossCare`.

## Mục đích

Ứng dụng này là client iOS/Android để chọn hoặc chụp ảnh chó/mèo rồi gửi lên backend Next.js của project để phân tích.

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

## Ghi chú

- Backend OpenAI vẫn chạy ở server. Mobile app chỉ gửi ảnh đến API và hiển thị kết quả.
- Nếu muốn dùng máy thật, đảm bảo điện thoại và máy dev cùng mạng LAN.
- Nếu muốn tiếp tục, có thể bổ sung `expo-camera` để xây dựng UI camera native hơn.
