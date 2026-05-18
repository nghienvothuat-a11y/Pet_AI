export type RiskLevel = "low" | "medium" | "high" | "urgent" | "unknown";
export type PetTypeGuess = "dog" | "cat" | "unknown";

export type PetHealthAnalysis = {
  petTypeGuess: PetTypeGuess;
  summary: string;
  observations: string[];
  riskLevel: RiskLevel;
  possibleConcerns: string[];
  recommendedActions: string[];
  vetCareAdvice: string;
  emotion: string;
  petThought: string;
  limitations: string;
};

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const NORMAL_PET_THOUGHTS = [
  "Tôi đang vui vì bạn ở đây.",
  "Tôi thấy khá thoải mái lúc này.",
  "Tôi đang rất thư giãn.",
  "Tôi chỉ đang tò mò nhìn bạn thôi.",
  "Tôi cảm thấy an toàn bên cạnh bạn.",
  "Tôi đang chờ bạn chơi với tôi.",
  "Tôi thấy hôm nay khá dễ chịu.",
  "Tôi đang tận hưởng khoảnh khắc này.",
  "Tôi hơi buồn ngủ một chút.",
  "Tôi đang muốn được vuốt ve.",
  "Tôi thấy mọi thứ ổn mà.",
  "Tôi đang rất bình tĩnh.",
  "Tôi chỉ đang nghỉ ngơi thôi.",
  "Tôi đang nhìn bạn vì tôi quan tâm.",
  "Tôi thấy bạn làm tôi yên tâm.",
  "Tôi đang có tâm trạng khá tốt.",
  "Tôi muốn chơi một chút.",
  "Tôi đang chờ món ngon của mình.",
  "Tôi thấy nơi này thật quen thuộc.",
  "Tôi đang nằm nghỉ cho thoải mái.",
  "Tôi hơi tò mò về thứ trước mặt.",
  "Tôi đang rất tỉnh táo.",
  "Tôi cảm thấy sạch sẽ và dễ chịu.",
  "Tôi đang muốn ở gần bạn.",
  "Tôi thấy không có gì đáng lo đâu.",
  "Tôi đang tận hưởng sự yên tĩnh.",
  "Tôi muốn bạn chú ý đến tôi.",
  "Tôi đang ngoan mà, đúng không?",
  "Tôi thấy mình ổn hôm nay.",
  "Tôi đang chờ bạn gọi tên tôi.",
  "Tôi hơi lười một chút thôi.",
  "Tôi đang cảm thấy được yêu thương.",
  "Tôi muốn được ôm một chút.",
  "Tôi đang quan sát mọi thứ xung quanh.",
  "Tôi thấy ánh nhìn của bạn thật quen.",
  "Tôi đang muốn đi dạo.",
  "Tôi chỉ đang tạo dáng thôi.",
  "Tôi thấy mình khá tự tin hôm nay.",
  "Tôi đang chờ một lời khen.",
  "Tôi muốn bạn chơi với tôi thêm chút nữa.",
  "Tôi đang rất thoải mái trong chỗ của mình.",
  "Tôi thấy hơi phấn khích.",
  "Tôi đang mong bạn lại gần hơn.",
  "Tôi thấy đây là lúc để nghỉ ngơi.",
  "Tôi đang vui vẻ theo cách của mình.",
  "Tôi muốn được thưởng một món nhỏ.",
  "Tôi đang cảm thấy bình yên.",
  "Tôi thấy bạn là người tôi tin tưởng.",
  "Tôi đang chỉ muốn nằm cạnh bạn thôi.",
  "Tôi thấy hôm nay là một ngày ổn."
] as const;

export const petHealthJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "petTypeGuess",
    "summary",
    "observations",
    "riskLevel",
    "possibleConcerns",
    "recommendedActions",
    "vetCareAdvice",
    "emotion",
    "petThought",
    "limitations"
  ],
  properties: {
    petTypeGuess: {
      type: "string",
      enum: ["dog", "cat", "unknown"]
    },
    summary: {
      type: "string"
    },
    observations: {
      type: "array",
      items: {
        type: "string"
      }
    },
    riskLevel: {
      type: "string",
      enum: ["low", "medium", "high", "urgent", "unknown"]
    },
    possibleConcerns: {
      type: "array",
      items: {
        type: "string"
      }
    },
    recommendedActions: {
      type: "array",
      items: {
        type: "string"
      }
    },
    vetCareAdvice: {
      type: "string"
    },
    emotion: {
      type: "string"
    },
    petThought: {
      type: "string"
    },
    limitations: {
      type: "string"
    }
  }
} as const;

const riskLevels = new Set<RiskLevel>(["low", "medium", "high", "urgent", "unknown"]);
const petTypes = new Set<PetTypeGuess>(["dog", "cat", "unknown"]);

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Vui lòng tải lên ảnh định dạng JPG, PNG hoặc WebP.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return "Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 8 MB.";
  }

  return null;
}

export function extractResponseText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const maybeOutputText = (payload as { output_text?: unknown }).output_text;
  if (typeof maybeOutputText === "string" && maybeOutputText.trim()) {
    return maybeOutputText;
  }

  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    return null;
  }

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) {
      continue;
    }

    for (const contentItem of content) {
      if (!contentItem || typeof contentItem !== "object") {
        continue;
      }

      const text = (contentItem as { text?: unknown }).text;
      if (typeof text === "string" && text.trim()) {
        return text;
      }
    }
  }

  return null;
}

export function parseAnalysis(text: string): PetHealthAnalysis {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("OpenAI response was not valid JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("OpenAI response JSON was not an object.");
  }

  const value = parsed as Record<string, unknown>;
  const requiredStrings = ["summary", "vetCareAdvice", "emotion", "petThought", "limitations"];
  const requiredArrays = ["observations", "possibleConcerns", "recommendedActions"];

  if (typeof value.petTypeGuess !== "string" || !petTypes.has(value.petTypeGuess as PetTypeGuess)) {
    throw new Error("OpenAI response has an invalid petTypeGuess.");
  }

  if (typeof value.riskLevel !== "string" || !riskLevels.has(value.riskLevel as RiskLevel)) {
    throw new Error("OpenAI response has an invalid riskLevel.");
  }

  for (const field of requiredStrings) {
    if (typeof value[field] !== "string") {
      throw new Error(`OpenAI response is missing ${field}.`);
    }
  }

  for (const field of requiredArrays) {
    if (!Array.isArray(value[field]) || !(value[field] as unknown[]).every((item) => typeof item === "string")) {
      throw new Error(`OpenAI response is missing ${field}.`);
    }
  }

  return normalizeAnalysisText(value as PetHealthAnalysis);
}

function normalizeAnalysisText(analysis: PetHealthAnalysis): PetHealthAnalysis {
  return {
    ...analysis,
    summary: normalizeResultText(analysis.summary),
    observations: analysis.observations.map(normalizeResultText),
    possibleConcerns: analysis.possibleConcerns.map(normalizeResultText),
    recommendedActions: analysis.recommendedActions.map(normalizeResultText),
    vetCareAdvice: normalizeResultText(analysis.vetCareAdvice),
    emotion: normalizeResultText(analysis.emotion),
    petThought: normalizeResultText(analysis.petThought),
    limitations: normalizeResultText(analysis.limitations)
  };
}

function normalizeResultText(text: string) {
  return text
    .replace(/\b[Cc]ó thể là\b/g, "Nghi ngờ bị")
    .replace(/một vấn đề sức khỏe bất thường/gi, "bệnh hoặc vấn đề cụ thể cần bác sĩ thú y kiểm tra thêm")
    .replace(/\s*,?\s*nhưng\s+không\s+chắc\s+chắn/gi, "")
    .replace(/\s*,?\s*nhưng\s+chưa\s+chắc\s+chắn/gi, "")
    .replace(/\bkhông\s+chắc\s+chắn\b/gi, "cần kiểm tra thêm")
    .replace(/\bchưa\s+chắc\s+chắn\b/gi, "cần kiểm tra thêm")
    .replace(/\s{2,}/g, " ")
    .trim();
}
