import { NextResponse } from "next/server";
import {
  extractResponseText,
  NORMAL_PET_THOUGHTS,
  parseAnalysis,
  petHealthJsonSchema,
  validateImageFile
} from "@/lib/petAnalysis";

export const runtime = "nodejs";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_TIMEOUT_MS = 75_000;

const systemPrompt = [
  "Bạn là trợ lý AI sàng lọc sức khỏe sơ bộ cho chó và mèo qua ảnh.",
  "Chỉ dựa trên những gì nhìn thấy trong ảnh. Không chẩn đoán chắc chắn bệnh.",
  "Không kê đơn thuốc, liều lượng, hoặc hướng dẫn điều trị xâm lấn.",
  "Trả lời bằng tiếng Việt ngắn gọn, trực diện, dễ hiểu cho chủ thú cưng.",
  "Nếu thú cưng trông bình thường, không thấy dấu hiệu bệnh rõ, đặt riskLevel là low, summary bắt đầu bằng: 'Pet của bạn trông bình thường'.",
  "Khi ảnh bình thường, possibleConcerns có thể là mảng rỗng hoặc chỉ ghi 'Chưa thấy dấu hiệu bệnh rõ từ ảnh này'. recommendedActions nên khuyên tiếp tục quan sát, ăn uống, vận động và vệ sinh bình thường.",
  "Luôn điền emotion bằng 1 câu ngắn mô tả cảm xúc/biểu cảm có thể quan sát từ ảnh, ví dụ: 'Trông khá thư giãn và tỉnh táo'. Không khẳng định chắc chắn cảm xúc nội tâm.",
  `Nếu ảnh bình thường, petThought phải chọn đúng 1 câu phù hợp nhất từ danh sách sau, không tự viết câu khác: ${NORMAL_PET_THOUGHTS.join(" | ")}.`,
  "Nếu ảnh bình thường, petThought là nội dung chính để hiển thị cho người dùng. Câu này phải tự nhiên, ấm áp, không nói về bệnh.",
  "summary phải là 1 câu ngắn theo kiểu: 'Có thể là bệnh/vấn đề X, nhưng không chắc chắn; vì thấy A, B. Bạn nên ...'.",
  "possibleConcerns phải nêu các bệnh hoặc vấn đề có thể gặp, ví dụ: viêm da, nhiễm trùng, ký sinh trùng, dị ứng, viêm mắt, chấn thương, bệnh răng miệng, mất nước, hoặc bệnh nguy hiểm cần loại trừ. Không dùng câu khẳng định chắc chắn.",
  "Nếu nghi ngờ bệnh nguy hiểm như bệnh dại, chỉ nói 'có dấu hiệu cần loại trừ bệnh nguy hiểm như dại', không khẳng định bị dại chỉ từ ảnh.",
  "observations, possibleConcerns, recommendedActions mỗi mục tối đa 3 ý, mỗi ý ngắn.",
  "Nếu thấy dấu hiệu nguy hiểm như khó thở, chảy máu nặng, co giật, bất tỉnh, vết thương nghiêm trọng, tổn thương mắt nặng, hoặc tình trạng đáng lo, đặt riskLevel là urgent và khuyên gặp bác sĩ thú y ngay.",
  "Nếu ảnh mờ, thiếu thông tin, hoặc không phải chó/mèo, dùng unknown khi cần và khuyên chụp lại ảnh rõ hơn.",
  "Luôn nhắc rằng đây chỉ là sàng lọc sơ bộ và không thay thế bác sĩ thú y."
].join(" ");

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return jsonError("Server chưa cấu hình OPENAI_API_KEY.", 500);
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonError("Request không hợp lệ. Vui lòng gửi ảnh bằng multipart/form-data.");
  }

  const image = formData.get("image");

  if (!(image instanceof File)) {
    return jsonError("Vui lòng chọn một ảnh để phân tích.");
  }

  const validationError = validateImageFile(image);
  if (validationError) {
    return jsonError(validationError);
  }

  const arrayBuffer = await image.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString("base64");
  const imageUrl = `data:${image.type};base64,${base64Image}`;
  const model = process.env.OPENAI_MODEL || "gpt-5.5";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "Hãy phân tích ảnh thú cưng này theo schema JSON đã yêu cầu. Đây là công cụ sàng lọc sơ bộ, không phải chẩn đoán."
              },
              {
                type: "input_image",
                image_url: imageUrl
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "pet_health_screening",
            schema: petHealthJsonSchema,
            strict: true
          }
        }
      })
    });
  } catch (error) {
    console.error("OpenAI request failed", error);
    return jsonError("OpenAI phản hồi quá chậm hoặc kết nối bị lỗi. Vui lòng thử lại với ảnh rõ và nhỏ hơn.", 504);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI API error", response.status, errorText);
    return jsonError("Không thể phân tích ảnh lúc này. Vui lòng thử lại sau.", 502);
  }

  const payload = (await response.json()) as unknown;
  const responseText = extractResponseText(payload);

  if (!responseText) {
    console.error("OpenAI response missing text", JSON.stringify(payload));
    return jsonError("AI không trả về kết quả hợp lệ. Vui lòng thử lại.", 502);
  }

  try {
    return NextResponse.json({ analysis: parseAnalysis(responseText) });
  } catch (error) {
    console.error(error);
    return jsonError("Kết quả AI không đúng định dạng mong đợi. Vui lòng thử lại.", 502);
  }
}
