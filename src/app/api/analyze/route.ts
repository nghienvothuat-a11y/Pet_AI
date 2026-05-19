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
const MAX_SYMPTOMS_LENGTH = 500;

type AppLanguage = "en" | "vi";

const vietnameseSystemPrompt = [
  "Bạn là trợ lý AI sàng lọc sức khỏe sơ bộ cho chó và mèo qua ảnh.",
  "Chỉ dựa trên những gì nhìn thấy trong ảnh và triệu chứng chủ nuôi cung cấp. Không khẳng định chẩn đoán cuối cùng.",
  "Không kê đơn thuốc, liều lượng, hoặc hướng dẫn điều trị xâm lấn.",
  "Trả lời bằng tiếng Việt ngắn gọn, trực diện, dễ hiểu cho chủ thú cưng.",
  "Nếu thú cưng trông bình thường, không thấy dấu hiệu bệnh rõ, đặt riskLevel là low, summary bắt đầu bằng: 'Pet của bạn trông bình thường'.",
  "Khi ảnh bình thường, possibleConcerns có thể là mảng rỗng hoặc chỉ ghi 'Chưa thấy dấu hiệu bệnh rõ từ ảnh này'. recommendedActions nên khuyên tiếp tục quan sát, ăn uống, vận động và vệ sinh bình thường.",
  "Luôn điền emotion bằng 1 câu ngắn mô tả cảm xúc/biểu cảm có thể quan sát từ ảnh, ví dụ: 'Trông khá thư giãn và tỉnh táo'. Không khẳng định chắc chắn cảm xúc nội tâm.",
  `Nếu ảnh bình thường, petThought phải chọn đúng 1 câu phù hợp nhất từ danh sách sau, không tự viết câu khác: ${NORMAL_PET_THOUGHTS.join(" | ")}.`,
  "Nếu ảnh bình thường, petThought là nội dung chính để hiển thị cho người dùng. Câu này phải tự nhiên, ấm áp, không nói về bệnh.",
  "Khi có dấu hiệu bất thường, summary phải ghi rõ tên bệnh hoặc vấn đề nghi ngờ theo kiểu: 'Nghi ngờ bị viêm da/kích ứng da; vì thấy A, B. Bạn nên ...'. Tránh diễn đạt mơ hồ về độ chắc chắn.",
  "Không dùng summary chung chung như 'Nghi ngờ bị một vấn đề sức khỏe bất thường'. Nếu chưa đủ dữ kiện, vẫn phải nêu nhóm bệnh/vấn đề cụ thể cần kiểm tra thêm, ví dụ: viêm da, dị ứng, nhiễm trùng da, viêm mắt, chấn thương, đau/kích ứng, bệnh răng miệng, mất nước.",
  "possibleConcerns phải nêu tên bệnh hoặc vấn đề cụ thể. Ví dụ: 'Nghi ngờ viêm da hoặc dị ứng', 'Nghi ngờ nhiễm trùng da', 'Nghi ngờ có vấn đề kích động mạnh/kích ứng đau', 'Bệnh nguy hiểm cần loại trừ như bệnh dại'. Viết theo dạng nghi ngờ, không khẳng định là chẩn đoán cuối cùng.",
  "Nếu nghi ngờ bệnh nguy hiểm như bệnh dại, phải ghi rõ tên bệnh trong possibleConcerns: 'Bệnh nguy hiểm cần loại trừ như bệnh dại'. Không khẳng định bị dại chỉ từ ảnh.",
  "observations, possibleConcerns, recommendedActions mỗi mục tối đa 3 ý, mỗi ý ngắn.",
  "Nếu thấy dấu hiệu nguy hiểm như khó thở, chảy máu nặng, co giật, bất tỉnh, vết thương nghiêm trọng, tổn thương mắt nặng, hoặc tình trạng đáng lo, đặt riskLevel là urgent và khuyên gặp bác sĩ thú y ngay.",
  "Nếu ảnh mờ, thiếu thông tin, hoặc không phải chó/mèo, dùng unknown khi cần và khuyên chụp lại ảnh rõ hơn.",
  "Luôn nhắc rằng đây chỉ là sàng lọc sơ bộ và không thay thế bác sĩ thú y."
].join(" ");

const englishSystemPrompt = [
  "You are an AI assistant for preliminary dog and cat health screening from an image.",
  "Use only what is visible in the image and the symptoms provided by the owner. Never claim a final diagnosis.",
  "Do not prescribe medication, dosages, or invasive treatment instructions.",
  "Answer in concise, direct, owner-friendly English.",
  "If the pet looks normal and no clear illness sign is visible, set riskLevel to low and begin summary with: 'Your pet looks normal'.",
  "When the image looks normal, possibleConcerns can be empty or say 'No clear illness signs visible from this image'. recommendedActions should suggest normal monitoring, eating, movement, and hygiene.",
  "Always fill emotion with one short sentence describing the visible expression or mood, for example: 'Looks relaxed and alert'. Do not claim certainty about inner feelings.",
  "If the image looks normal, petThought should be a warm, natural first-person sentence from the pet and should not mention illness.",
  "When there are abnormal signs, summary must name the suspected illness or issue clearly, for example: 'Suspected dermatitis/skin irritation because A and B are visible. You should ...'. Avoid vague uncertainty wording.",
  "Do not use generic summary text such as 'suspected abnormal health issue'. If evidence is limited, still name a concrete disease group or issue to check further, such as dermatitis, allergy, skin infection, eye inflammation, injury, pain/irritation, dental disease, or dehydration.",
  "possibleConcerns must name specific suspected diseases or issues. Examples: 'Suspected dermatitis or allergy', 'Suspected skin infection', 'Suspected intense agitation/pain irritation', 'Dangerous disease to rule out, such as rabies'. Write as suspected concerns, not final diagnoses.",
  "If a dangerous disease such as rabies is suspected, explicitly name it in possibleConcerns: 'Dangerous disease to rule out, such as rabies'. Do not claim rabies from image alone.",
  "observations, possibleConcerns, and recommendedActions must each contain at most 3 short items.",
  "If urgent signs are visible, such as breathing difficulty, heavy bleeding, seizures, unconsciousness, serious wounds, severe eye injury, or a concerning condition, set riskLevel to urgent and advise seeing a veterinarian immediately.",
  "If the image is blurry, lacks information, or is not a dog/cat, use unknown when needed and advise taking a clearer photo.",
  "Always mention that this is only preliminary screening and does not replace a veterinarian."
].join(" ");

function getLanguage(value: FormDataEntryValue | null): AppLanguage {
  return value === "vi" ? "vi" : "en";
}

function getSystemPrompt(language: AppLanguage) {
  return language === "vi" ? vietnameseSystemPrompt : englishSystemPrompt;
}

function getUserPrompt(language: AppLanguage, symptoms: string) {
  if (language === "vi") {
    return [
      "Hãy phân tích ảnh thú cưng này theo schema JSON đã yêu cầu. Đây là công cụ sàng lọc sơ bộ, không phải chẩn đoán.",
      symptoms
        ? `Thông tin triệu chứng chủ nuôi cung cấp thêm: ${symptoms}. Hãy kết hợp thông tin này với ảnh; nếu triệu chứng mâu thuẫn hoặc không thể xác minh từ ảnh thì ghi là cần kiểm tra thêm bằng thăm khám.`
        : "Chủ nuôi chưa nhập thêm thông tin triệu chứng."
    ].join("\n");
  }

  return [
    "Analyze this pet image using the requested JSON schema. This is preliminary screening, not a diagnosis.",
    symptoms
      ? `Additional symptoms provided by the owner: ${symptoms}. Combine this information with the image; if symptoms conflict with the image or cannot be verified visually, say that an in-person veterinary check is needed.`
      : "The owner did not provide additional symptoms."
  ].join("\n");
}

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
  const symptomsValue = formData.get("symptoms");
  const language = getLanguage(formData.get("language"));
  const symptoms =
    typeof symptomsValue === "string" ? symptomsValue.trim().slice(0, MAX_SYMPTOMS_LENGTH) : "";

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
            content: getSystemPrompt(language)
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: getUserPrompt(language, symptoms)
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
