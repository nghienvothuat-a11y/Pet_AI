"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  NORMAL_PET_THOUGHTS,
  type PetHealthAnalysis,
  type RiskLevel
} from "@/lib/petAnalysis";

type AnalyzeResponse = {
  analysis?: PetHealthAnalysis;
  error?: string;
};

type AppLanguage = "en" | "vi";

const uiText = {
  en: {
    languageLabel: "Language",
    heroEyebrow: "Pet health check",
    heroCopy: "Quickly check your pet's health from a clear photo and symptoms you noticed.",
    addPhoto: "Add your pet photo",
    addPhotoHint: "A clear photo of the face, eyes, skin, or unusual fur area helps improve the result.",
    takePhoto: "Take photo",
    choosePhoto: "Choose photo",
    symptomsPlaceholder: "Enter symptoms so AI can analyze more accurately",
    selected: "Selected",
    uploadImage: "Image to upload",
    analyze: "Analyze health",
    analyzing: "Analyzing...",
    changePhoto: "Change photo",
    safety: "Results are preliminary screening only and do not replace a veterinarian's diagnosis.",
    uploadStatus: "Uploading image to server...",
    analyzingStatus: "AI is analyzing the image. This may take 10-30 seconds.",
    doneStatus: "Analysis complete. Results are below.",
    chooseError: "Please take or choose a photo first.",
    invalidImage: "Please choose an image file.",
    compressionError: "Could not compress the image automatically. If analysis fails, try a smaller JPG/PNG.",
    ready: "Ready to analyze",
    result: "Result",
    quickSummary: "Quick summary",
    prediction: "Prediction",
    suspected: "Suspected",
    petThought: "A little imagination",
    combinedSummary: "Short summary",
    limitations: "Limitations",
    showDetails: "Show details",
    hide: "Hide",
    noClearConcern: "no clear concerning signs",
    unclearObservation: "the image is not clear enough for detailed observations",
    followUp: "keep monitoring",
    mainObservation: "Main observation",
    concernPoint: "Point to watch",
    nextStep: "Next step",
    vetAdvice: "Vet advice",
    petEmotion: "Pet emotion",
    risk: {
      low: "Low",
      medium: "Medium",
      high: "High",
      urgent: "See a vet now",
      unknown: "Unknown"
    }
  },
  vi: {
    languageLabel: "Ngôn ngữ",
    heroEyebrow: "Pet health check",
    heroCopy: "Kiểm tra nhanh sức khỏe bé cưng từ ảnh rõ nét và triệu chứng bạn quan sát được.",
    addPhoto: "Thêm ảnh bé cưng",
    addPhotoHint: "Ảnh rõ mặt, mắt, da hoặc vùng lông bất thường sẽ giúp kết quả tốt hơn.",
    takePhoto: "Chụp ảnh",
    choosePhoto: "Chọn ảnh",
    symptomsPlaceholder: "Nhập thông tin triệu chứng để AI phân tích chính xác hơn",
    selected: "Đã chọn",
    uploadImage: "Ảnh gửi đi",
    analyze: "Phân tích sức khỏe",
    analyzing: "Đang phân tích...",
    changePhoto: "Đổi ảnh",
    safety: "Kết quả chỉ là sàng lọc sơ bộ và không thay thế chẩn đoán của bác sĩ thú y.",
    uploadStatus: "Đang gửi ảnh lên server...",
    analyzingStatus: "AI đang phân tích ảnh. Bước này có thể mất 10-30 giây.",
    doneStatus: "Đã phân tích xong. Kết quả nằm bên dưới.",
    chooseError: "Vui lòng chụp hoặc chọn ảnh trước.",
    invalidImage: "Vui lòng chọn một file ảnh.",
    compressionError: "Không thể nén ảnh tự động. Nếu phân tích lỗi, hãy thử chọn ảnh JPG/PNG nhỏ hơn.",
    ready: "Sẵn sàng phân tích",
    result: "Kết quả",
    quickSummary: "Tóm tắt nhanh",
    prediction: "Dự đoán",
    suspected: "Nghi ngờ bị",
    petThought: "Một chút tưởng tượng",
    combinedSummary: "Tổng hợp ngắn",
    limitations: "Giới hạn",
    showDetails: "Xem chi tiết",
    hide: "Ẩn",
    noClearConcern: "chưa thấy dấu hiệu đáng lo rõ ràng",
    unclearObservation: "ảnh chưa đủ rõ để quan sát chi tiết",
    followUp: "tiếp tục theo dõi thêm",
    mainObservation: "Quan sát chính",
    concernPoint: "Điểm cần chú ý",
    nextStep: "Nên làm tiếp",
    vetAdvice: "Lời khuyên thú y",
    petEmotion: "Cảm xúc của bé",
    risk: {
      low: "Thấp",
      medium: "Trung bình",
      high: "Cao",
      urgent: "Cần gặp bác sĩ ngay",
      unknown: "Chưa rõ"
    }
  }
} satisfies Record<AppLanguage, Record<string, unknown>>;

const riskLabels: Record<AppLanguage, Record<RiskLevel, string>> = {
  en: uiText.en.risk,
  vi: uiText.vi.risk
};

const riskClasses: Record<RiskLevel, string> = {
  low: "riskLow",
  medium: "riskMedium",
  high: "riskHigh",
  urgent: "riskUrgent",
  unknown: "riskUnknown"
};

export default function Home() {
  const [language, setLanguage] = useState<AppLanguage>("en");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [analysis, setAnalysis] = useState<PetHealthAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const text = uiText[language];

  const canSubmit = useMemo(() => Boolean(imageFile) && !isLoading, [imageFile, isLoading]);

  useEffect(() => {
    if (!analysis) {
      return;
    }

    resultRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, [analysis]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(text.invalidImage);
      return;
    }

    setAnalysis(null);
    setError(null);
    setStatusMessage(null);
    setOriginalFileName(file.name);

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return nextPreviewUrl;
    });

    try {
      setImageFile(await normalizeImageForUpload(file));
    } catch {
      setImageFile(file);
      setError(text.compressionError);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!imageFile) {
      setError(text.chooseError);
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatusMessage(text.uploadStatus);
    setAnalysis(null);

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("symptoms", symptoms.trim());
    formData.append("language", language);

    try {
      setStatusMessage(text.analyzingStatus);
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData
      });
      const data = (await response.json()) as AnalyzeResponse;

      if (!response.ok || !data.analysis) {
        throw new Error(data.error || "Không thể phân tích ảnh lúc này.");
      }

      setAnalysis(data.analysis);
      setStatusMessage(text.doneStatus);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Đã có lỗi xảy ra.");
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  }

  function clearImage() {
    setImageFile(null);
    setOriginalFileName(null);
    setPreviewUrl(null);
    setAnalysis(null);
    setError(null);
    setStatusMessage(null);
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="brandMark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-ai-paw.png" alt="BossCare logo" />
        </div>
        <div className="heroCopy">
          <p className="eyebrow">{text.heroEyebrow}</p>
          <h1>BossCare</h1>
          <p>{text.heroCopy}</p>
        </div>
        <label className="languageSelect">
          <span>{text.languageLabel}</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value as AppLanguage)}>
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </label>
      </section>

      <form className="capturePanel" onSubmit={handleSubmit}>
        <div className="previewBox">
          {previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Selected pet" />
              <span className="readyBadge">{text.ready}</span>
            </>
          ) : (
            <label className="emptyPreview">
              <input type="file" accept="image/*" onChange={handleFileChange} aria-label={text.choosePhoto} />
              <span className="emptyIcon">+</span>
              <strong>{text.addPhoto}</strong>
              <span>{text.addPhotoHint}</span>
            </label>
          )}
        </div>

        <div className="buttonRow">
          <label className="secondaryButton filePicker">
            <span className="buttonIcon">CA</span>
            <span>{text.takePhoto}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              aria-label={text.takePhoto}
            />
          </label>
          <label className="secondaryButton filePicker">
            <span className="buttonIcon">PH</span>
            <span>{text.choosePhoto}</span>
            <input type="file" accept="image/*" onChange={handleFileChange} aria-label={text.choosePhoto} />
          </label>
        </div>

        <textarea
          className="symptomsInput"
          value={symptoms}
          onChange={(event) => setSymptoms(event.target.value)}
          placeholder={text.symptomsPlaceholder}
          maxLength={500}
          disabled={isLoading}
        />

        {imageFile ? (
          <p className="fileMeta">
            {text.selected}: {originalFileName || imageFile.name} · {text.uploadImage}: {formatBytes(imageFile.size)}
          </p>
        ) : null}

        <div className="actionRow">
          <button type="submit" className="primaryButton" disabled={!canSubmit}>
            {isLoading ? text.analyzing : text.analyze}
          </button>
          {imageFile ? (
            <button type="button" className="textButton" onClick={clearImage} disabled={isLoading}>
              {text.changePhoto}
            </button>
          ) : null}
        </div>

        <p className="safetyNote">
          {text.safety}
        </p>
      </form>

      {statusMessage ? <div className="statusBox">{statusMessage}</div> : null}
      {error ? <div className="alert">{error}</div> : null}
      <div ref={resultRef}>{analysis ? <AnalysisResult analysis={analysis} language={language} /> : null}</div>
    </main>
  );
}

async function normalizeImageForUpload(file: File): Promise<File> {
  const isAllowedType = ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]);

  if (isAllowedType && file.size <= MAX_IMAGE_BYTES) {
    return file;
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = imageUrl;
    await image.decode();

    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) {
      return file;
    }

    return new File([blob], replaceExtension(file.name, "jpg"), {
      type: "image/jpeg",
      lastModified: Date.now()
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function replaceExtension(fileName: string, nextExtension: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "");
  return `${baseName || "pet-photo"}.${nextExtension}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function AnalysisResult({ analysis, language }: { analysis: PetHealthAnalysis; language: AppLanguage }) {
  const text = uiText[language];
  const concernText = getConcernText(analysis);
  const petThought = normalizePetThought(analysis.petThought, language);

  return (
    <section className="resultPanel" aria-live="polite">
      <div className="resultHeader">
        <div>
          <p className="eyebrow">{text.result}</p>
          <h2>{text.quickSummary}</h2>
        </div>
        <span className={`riskBadge ${riskClasses[analysis.riskLevel]}`}>{riskLabels[language][analysis.riskLevel]}</span>
      </div>

      <div className="quickResult">
        <p className="quickLabel">{text.prediction}</p>
        <p>
          {text.suspected} <strong>{concernText}</strong>.
        </p>
        <p className="quickLabel">{text.petThought}</p>
        <p className="petThought">“{petThought}”</p>
      </div>

      <InfoCard title={text.combinedSummary} value={getShortCombinedSummary(analysis, language)} text={text} />
      <InfoCard title={text.limitations} value={analysis.limitations} text={text} muted />
    </section>
  );
}

function getConcernText(analysis: PetHealthAnalysis) {
  const concernText = analysis.possibleConcerns
    .filter((concern) => !concern.toLowerCase().includes("chưa thấy"))
    .slice(0, 2)
    .join(", ");

  if (concernText) {
    return stripLeadingConcernPhrase(concernText);
  }

  const summaryConcern = analysis.summary.match(/nghi ngờ (?:bị|có)?\s*([^.;]+)/i)?.[1]?.trim();
  if (summaryConcern) {
    return stripLeadingConcernPhrase(summaryConcern);
  }

  return "bệnh hoặc vấn đề cụ thể cần bác sĩ thú y kiểm tra thêm";
}

function stripLeadingConcernPhrase(text: string) {
  return text
    .replace(/^nghi ngờ\s+(bị|có)?\s*/i, "")
    .replace(/^bị\s+/i, "")
    .trim();
}

function getShortCombinedSummary(analysis: PetHealthAnalysis, language: AppLanguage) {
  const text = uiText[language];
  const observations = analysis.observations.slice(0, 2).join(", ") || text.unclearObservation;
  const concerns =
    analysis.possibleConcerns
      .filter((concern) => !concern.toLowerCase().includes("chưa thấy"))
      .slice(0, 2)
      .join(", ") || text.noClearConcern;
  const actions = analysis.recommendedActions.slice(0, 2).join(", ") || text.followUp;

  return `${analysis.summary} ${text.mainObservation}: ${observations}. ${text.concernPoint}: ${concerns}. ${text.nextStep}: ${actions}. ${text.vetAdvice}: ${analysis.vetCareAdvice} ${text.petEmotion}: ${analysis.emotion}.`;
}

function normalizePetThought(petThought: string, language: AppLanguage) {
  const cleanThought = petThought.trim();

  if (language === "en") {
    return cleanThought;
  }

  if (NORMAL_PET_THOUGHTS.includes(cleanThought as (typeof NORMAL_PET_THOUGHTS)[number])) {
    return cleanThought;
  }

  const index = Math.abs(hashText(cleanThought || "normal-pet")) % NORMAL_PET_THOUGHTS.length;
  return NORMAL_PET_THOUGHTS[index];
}

function hashText(text: string) {
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }

  return hash;
}


function InfoCard({
  title,
  value,
  text,
  muted = false
}: {
  title: string;
  value: string;
  text: (typeof uiText)[AppLanguage];
  muted?: boolean;
}) {
  return (
    <details className={`resultCard ${muted ? "mutedCard" : ""}`}>
      <summary>{title}<span>{text.showDetails}</span></summary>
      <p>{value}</p>
    </details>
  );
}
