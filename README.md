# Pet_AI

Pet_AI là ứng dụng web mobile-first cho phép người dùng chụp hoặc tải ảnh chó/mèo lên để AI phân tích sơ bộ tình trạng sức khỏe.

Ứng dụng trả lời bằng tiếng Việt theo hướng thận trọng:

- Nếu thấy dấu hiệu bất thường: nêu bệnh/vấn đề có thể gặp, nhưng không khẳng định chắc chắn.
- Nếu ảnh trông bình thường: trả lời pet có vẻ bình thường và mô tả cảm xúc/biểu cảm quan sát được.
- Luôn nhắc rằng kết quả chỉ là sàng lọc sơ bộ, không thay thế bác sĩ thú y.

## Tính năng

- Chụp ảnh bằng camera hoặc chọn ảnh từ thư viện.
- Preview ảnh trước khi phân tích.
- Tự nén/chuyển ảnh về JPEG khi cần để upload ổn định hơn.
- Gửi ảnh qua backend route `/api/analyze`.
- Gọi OpenAI Responses API với image input.
- Trả kết quả ngắn gọn:
  - “Có thể là ..., nhưng không chắc chắn...”
  - Hoặc “Pet của bạn trông bình thường...”
- Hiển thị mức rủi ro: thấp, trung bình, cao, cần gặp bác sĩ ngay, chưa rõ.
- Không lưu ảnh hoặc kết quả vào database trong MVP.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- OpenAI Responses API
- Vercel deployment

## Cài đặt local

```bash
npm install
cp .env.example .env.local
```

Thêm OpenAI API key vào `.env.local`:

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.5
```

Chạy development server:

```bash
npm run dev
```

Mở trên máy hiện tại:

```text
http://localhost:3000
```

Nếu muốn test từ thiết bị khác cùng mạng:

```bash
npm run dev -- --hostname 0.0.0.0
```

Sau đó mở bằng IP LAN của máy đang chạy app, ví dụ:

```text
http://192.168.1.48:3000
```

## Scripts

```bash
npm run dev      # chạy app local ở chế độ development
npm run build    # build production
npm run start    # chạy production server sau khi build
npm run lint     # kiểm tra TypeScript
npm test         # chạy test Node.js
```

## Deploy Vercel

Project đã được deploy lên Vercel:

```text
https://pet-ai-sooty.vercel.app
```

Các biến môi trường cần có trên Vercel Production:

```text
OPENAI_API_KEY
OPENAI_MODEL
```

Deploy lại production:

```bash
npx vercel --prod
```

## Cấu trúc chính

```text
src/app/page.tsx              # UI upload/chụp ảnh và hiển thị kết quả
src/app/api/analyze/route.ts  # API route gọi OpenAI
src/lib/petAnalysis.ts        # schema, types, validate và parse kết quả AI
test/petAnalysis.test.mjs     # test cho parse/extract helper
```

## Luồng xử lý

1. Người dùng chọn hoặc chụp ảnh.
2. Frontend preview ảnh và cố gắng nén/chuyển ảnh sang JPEG nếu cần.
3. Người dùng bấm “Phân tích sức khỏe”.
4. Frontend gửi ảnh tới `/api/analyze`.
5. Backend validate định dạng/dung lượng ảnh.
6. Backend gọi OpenAI Responses API với prompt an toàn.
7. AI trả JSON theo schema cố định.
8. UI hiển thị kết quả ngắn gọn cho người dùng.

## Nguyên tắc an toàn

Pet_AI chỉ là công cụ hỗ trợ sàng lọc sơ bộ.

Ứng dụng không:

- Chẩn đoán chắc chắn bệnh.
- Kê thuốc hoặc liều lượng.
- Thay thế bác sĩ thú y.
- Khẳng định bệnh nguy hiểm như bệnh dại chỉ từ ảnh.

Nếu AI thấy dấu hiệu nghiêm trọng như khó thở, chảy máu nặng, co giật, bất tỉnh, tổn thương mắt nặng hoặc vết thương nghiêm trọng, kết quả phải khuyến cáo gặp bác sĩ thú y ngay.

## Lưu ý bảo mật

- Không commit `.env.local`.
- Không đưa `OPENAI_API_KEY` vào frontend.
- API key chỉ được dùng trong server route.
- Nếu API key từng bị chia sẻ công khai, nên rotate key trong OpenAI dashboard.
