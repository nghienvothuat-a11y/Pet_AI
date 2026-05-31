"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
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
const LANGUAGE_STORAGE_KEY = "bosscare-language";

const uiText = {
  en: {
    languageLabel: "Language",
    heroEyebrow: "Pet health check",
    heroCopy: "Quickly check your pet's health from a clear photo and symptoms you noticed.",
    addPhoto: "Add your pet photo",
    addPhotoHint: "A clear photo of the face, eyes, skin, or unusual fur area helps improve the result.",
    takePhoto: "Take photo",
    takePhotoHint: "Use camera",
    choosePhoto: "Choose photo",
    choosePhotoHint: "From library",
    symptomsLabel: "Symptoms (optional)",
    symptomsHint: "For example: coughing, not eating, vomiting, itching...",
    symptomsPlaceholder: "Enter symptoms so AI can analyze more accurately",
    selected: "Selected",
    uploadImage: "Image to upload",
    analyze: "Analyze health",
    analyzing: "Analyzing...",
    analyzeHint: "AI will review the photo and your notes",
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
    abnormalPetThought: "I need to see a veterinarian now.",
    combinedSummary: "Short summary",
    limitations: "Limitations",
    showDetails: "Show details",
    hide: "Hide",
    close: "Close",
    viewResult: "View result",
    noPetPrefix: "Conclusion",
    noPetConcern: "No clear dog or cat was detected in this image",
    retakePetPhoto: "Please choose a clear dog or cat photo for health screening.",
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
    heroEyebrow: "Kiểm tra sức khỏe thú cưng",
    heroCopy: "Kiểm tra nhanh sức khỏe bé cưng từ ảnh rõ nét và triệu chứng bạn quan sát được.",
    addPhoto: "Thêm ảnh bé cưng",
    addPhotoHint: "Ảnh rõ mặt, mắt, da hoặc vùng lông bất thường sẽ giúp kết quả tốt hơn.",
    takePhoto: "Chụp ảnh",
    takePhotoHint: "Dùng camera",
    choosePhoto: "Chọn ảnh",
    choosePhotoHint: "Từ thư viện",
    symptomsLabel: "Mô tả triệu chứng (không bắt buộc)",
    symptomsHint: "Ví dụ: ho, bỏ ăn, nôn, tiêu chảy, ngứa, ...",
    symptomsPlaceholder: "Nhập thông tin triệu chứng để AI phân tích chính xác hơn",
    selected: "Đã chọn",
    uploadImage: "Ảnh gửi đi",
    analyze: "Phân tích sức khỏe",
    analyzing: "Đang phân tích...",
    analyzeHint: "AI sẽ xem ảnh và ghi chú của bạn",
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
    abnormalPetThought: "Tôi cần đến gặp bác sĩ ngay.",
    combinedSummary: "Tổng hợp ngắn",
    limitations: "Giới hạn",
    showDetails: "Xem chi tiết",
    hide: "Ẩn",
    close: "Đóng",
    viewResult: "Xem lại kết quả",
    noPetPrefix: "Kết luận",
    noPetConcern: "Không nhận diện rõ chó hoặc mèo trong ảnh này",
    retakePetPhoto: "Hãy chọn ảnh chó/mèo rõ hơn để sàng lọc sức khỏe.",
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
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isResultDetailOpen, setIsResultDetailOpen] = useState(false);
  const text = uiText[language];

  const canSubmit = useMemo(() => Boolean(imageFile) && !isLoading, [imageFile, isLoading]);

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (savedLanguage === "en" || savedLanguage === "vi") {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    document.body.classList.toggle("modalOpen", isResultModalOpen);

    return () => {
      document.body.classList.remove("modalOpen");
    };
  }, [isResultModalOpen]);

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
      setIsResultDetailOpen(false);
      setIsResultModalOpen(true);
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
    setIsResultModalOpen(false);
    setIsResultDetailOpen(false);
  }

  function handleLanguageChange(nextLanguage: AppLanguage) {
    setLanguage(nextLanguage);
    setAnalysis(null);
    setError(null);
    setStatusMessage(null);
    setIsResultModalOpen(false);
    setIsResultDetailOpen(false);
  }

  return (
    <main className="shell">
      <section className="appFrame">
        <header className="hero">
          <div className="heroCopy">
            <div className="brandRow">
              <div className="brandMark">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-ai-paw.png" alt="BossCare logo" />
              </div>
              <div>
                <p className="eyebrow">{text.heroEyebrow}</p>
                <h1>BossCare</h1>
              </div>
            </div>
            <p className="heroText">{text.heroCopy}</p>
          </div>

          <div className="heroVisual" aria-hidden="true">
            <div className="heroVisualHalo" />
            <div className="heroVisualCard">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-ai-paw.png" alt="" />
            </div>
            <span className="heroSpark heroSparkOne" />
            <span className="heroSpark heroSparkTwo" />
          </div>
        </header>

        <div className="languageRow">
          <div className="languageLabel">
            <span className="languageLabelIcon" aria-hidden="true">
              <GlobeGlyph />
            </span>
            <span>{text.languageLabel}</span>
          </div>
          <div className="segmentedControl" role="tablist" aria-label={text.languageLabel}>
            <button
              type="button"
              className={`segment ${language === "en" ? "segmentActive" : ""}`}
              onClick={() => handleLanguageChange("en")}
              aria-pressed={language === "en"}
            >
              English
            </button>
            <button
              type="button"
              className={`segment ${language === "vi" ? "segmentActive" : ""}`}
              onClick={() => handleLanguageChange("vi")}
              aria-pressed={language === "vi"}
            >
              Tiếng Việt
            </button>
          </div>
        </div>

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
                <span className="emptyIcon">
                  <PlusGlyph />
                </span>
                <strong>{text.addPhoto}</strong>
                <span>{text.addPhotoHint}</span>
              </label>
            )}
          </div>

          <div className="buttonRow">
            <label className="secondaryButton filePicker filePickerGreen">
              <span className="buttonIcon">
                <CameraGlyph />
              </span>
              <span className="buttonCopy">
                <span className="buttonTitle">{text.takePhoto}</span>
                <span className="buttonSubtitle">{text.takePhotoHint}</span>
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                aria-label={text.takePhoto}
              />
            </label>
            <label className="secondaryButton filePicker filePickerPeach">
              <span className="buttonIcon">
                <ImageGlyph />
              </span>
              <span className="buttonCopy">
                <span className="buttonTitle">{text.choosePhoto}</span>
                <span className="buttonSubtitle">{text.choosePhotoHint}</span>
              </span>
              <input type="file" accept="image/*" onChange={handleFileChange} aria-label={text.choosePhoto} />
            </label>
          </div>

          <label className="symptomsCard">
            <div className="symptomsCardTop">
              <div className="symptomsCardIcon" aria-hidden="true">
                <NotesGlyph />
              </div>
              <div className="symptomsCardCopy">
                <span className="symptomsCardTitle">{text.symptomsLabel}</span>
                <span className="symptomsCardHint">{text.symptomsHint}</span>
              </div>
              <span className="symptomsEdit" aria-hidden="true">
                <EditGlyph />
              </span>
            </div>
            <textarea
              className="symptomsInput"
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
              placeholder={text.symptomsPlaceholder}
              maxLength={500}
              disabled={isLoading}
            />
          </label>

          {imageFile ? (
            <div className="fileMetaRow">
              <div className="fileMetaCopy">
                <span>{text.selected}</span>
                <strong>{originalFileName || imageFile.name}</strong>
                <small>
                  {text.uploadImage}: {formatBytes(imageFile.size)}
                </small>
              </div>
              <button type="button" className="textButton inlineTextButton" onClick={clearImage} disabled={isLoading}>
                {text.changePhoto}
              </button>
            </div>
          ) : null}

          <button type="submit" className="primaryButton analyzeButton" disabled={!canSubmit}>
            <span className="analyzeButtonIcon" aria-hidden="true">
              <StethoscopeGlyph />
            </span>
            <span className="analyzeButtonCopy">
              <span>{isLoading ? text.analyzing : text.analyze}</span>
              <small>{text.analyzeHint}</small>
            </span>
          </button>

          <div className="safetyCard">
            <span className="safetyIcon" aria-hidden="true">
              <ShieldGlyph />
            </span>
            <p className="safetyNote">{text.safety}</p>
          </div>
        </form>

        {statusMessage ? <div className="statusBox">{statusMessage}</div> : null}
        {error ? <div className="alert">{error}</div> : null}
        {analysis && !isResultModalOpen ? (
          <button type="button" className="reopenResultButton" onClick={() => setIsResultModalOpen(true)}>
            {text.viewResult}
          </button>
        ) : null}
        {analysis && previewUrl && isResultModalOpen ? (
          <AnalysisResultModal
            analysis={analysis}
            imageUrl={previewUrl}
            language={language}
            isDetailOpen={isResultDetailOpen}
            onToggleDetails={() => setIsResultDetailOpen((current) => !current)}
            onClose={() => setIsResultModalOpen(false)}
          />
        ) : null}
      </section>
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

function AnalysisResultModal({
  analysis,
  imageUrl,
  language,
  isDetailOpen,
  onToggleDetails,
  onClose
}: {
  analysis: PetHealthAnalysis;
  imageUrl: string;
  language: AppLanguage;
  isDetailOpen: boolean;
  onToggleDetails: () => void;
  onClose: () => void;
}) {
  const text = uiText[language];
  const concernText = getConcernText(analysis, language);
  const petThought = getPetThought(analysis, language);
  const isNonPet = isNonPetAnalysis(analysis);

  return (
    <div className="resultOverlay" role="presentation" onClick={onClose}>
      <section
        className="resultModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="analysis-result-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modalPetPhotoWrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="modalPetPhoto" src={imageUrl} alt="Analyzed pet" />
          <span className={`riskBadge modalRiskBadge ${riskClasses[analysis.riskLevel]}`}>
            {riskLabels[language][analysis.riskLevel]}
          </span>
        </div>

        <div className="resultModalBody">
          <div className="resultHeader">
            <div>
              <p className="eyebrow">{text.result}</p>
              <h2 id="analysis-result-title">{text.quickSummary}</h2>
            </div>
          </div>

          <div className="quickResult modalQuickResult">
            <p className="quickLabel">{text.prediction}</p>
            {isNonPet ? (
              <p>
                {text.noPetPrefix}: <strong>{concernText}</strong>.
              </p>
            ) : (
              <p>
                {text.suspected} <strong>{concernText}</strong>.
              </p>
            )}
            <p className="quickLabel">{text.petThought}</p>
            <p className="petThought">"{petThought}"</p>
          </div>

          {isDetailOpen ? (
            <div className="modalDetails">
              <DetailCard title={text.combinedSummary} value={getShortCombinedSummary(analysis, language)} />
              <DetailCard title={text.limitations} value={analysis.limitations} muted />
            </div>
          ) : null}

          <div className="modalActionRow">
            <button type="button" className="secondaryModalButton" onClick={onToggleDetails}>
              {isDetailOpen ? text.hide : text.showDetails}
            </button>
            <button type="button" className="primaryModalButton" onClick={onClose}>
              {text.close}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function getConcernText(analysis: PetHealthAnalysis, language: AppLanguage) {
  if (isNonPetAnalysis(analysis)) {
    return uiText[language].noPetConcern;
  }

  const concernText = analysis.possibleConcerns
    .filter((concern) => isSpecificConcern(concern))
    .slice(0, 2)
    .join(", ");

  if (concernText) {
    return stripLeadingConcernPhrase(concernText);
  }

  const summaryConcern =
    language === "vi"
      ? analysis.summary.match(/nghi ngờ (?:bị|có)?\s*([^.;]+)/i)?.[1]?.trim()
      : analysis.summary.match(/suspected\s+([^.;]+)/i)?.[1]?.trim();

  if (summaryConcern && isSpecificConcern(summaryConcern)) {
    return stripLeadingConcernPhrase(summaryConcern);
  }

  return inferCommonConcern(analysis, language);
}

function stripLeadingConcernPhrase(text: string) {
  return text
    .replace(/^nghi ngờ\s+(bị|có)?\s*/i, "")
    .replace(/^suspected\s+/i, "")
    .replace(/^bị\s+/i, "")
    .trim();
}

function getShortCombinedSummary(analysis: PetHealthAnalysis, language: AppLanguage) {
  const text = uiText[language];
  const observations = analysis.observations.slice(0, 2).join(", ") || text.unclearObservation;
  const concerns =
    isNonPetAnalysis(analysis)
      ? text.noPetConcern
      : analysis.possibleConcerns
          .filter((concern) => isSpecificConcern(concern))
          .slice(0, 2)
          .join(", ") || text.noClearConcern;
  const actions = analysis.recommendedActions.slice(0, 2).join(", ") || text.followUp;

  return `${analysis.summary} ${text.mainObservation}: ${observations}. ${text.concernPoint}: ${concerns}. ${text.nextStep}: ${actions}. ${text.vetAdvice}: ${analysis.vetCareAdvice} ${text.petEmotion}: ${analysis.emotion}.`;
}

function getPetThought(analysis: PetHealthAnalysis, language: AppLanguage) {
  if (isNonPetAnalysis(analysis)) {
    return uiText[language].retakePetPhoto;
  }

  if (isAbnormalAnalysis(analysis)) {
    return uiText[language].abnormalPetThought;
  }

  return normalizePetThought(analysis.petThought, language);
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

function isAbnormalAnalysis(analysis: PetHealthAnalysis) {
  if (isNonPetAnalysis(analysis)) {
    return false;
  }

  if (analysis.riskLevel === "medium" || analysis.riskLevel === "high" || analysis.riskLevel === "urgent") {
    return true;
  }

  return analysis.possibleConcerns.some(isSpecificConcern) || hasSuspectedDiseaseLanguage(analysis.summary);
}

function isNonPetAnalysis(analysis: PetHealthAnalysis) {
  return analysis.petTypeGuess === "unknown";
}

function isSpecificConcern(text: string) {
  const searchable = normalizeForSearch(text);

  if (!searchable) {
    return false;
  }

  const normalPhrases = [
    "chua thay",
    "khong thay",
    "no clear",
    "looks normal",
    "trong binh thuong",
    "binh thuong"
  ];

  if (normalPhrases.some((phrase) => searchable.includes(phrase))) {
    return false;
  }

  const genericPhrases = [
    "mot van de suc khoe bat thuong",
    "van de suc khoe bat thuong",
    "benh hoac van de cu the",
    "can bac si thu y kiem tra them",
    "can kiem tra them",
    "chua ro",
    "abnormal health issue",
    "health issue",
    "needs further checking",
    "unclear"
  ];

  return !genericPhrases.some((phrase) => searchable.includes(phrase));
}

function hasSuspectedDiseaseLanguage(text: string) {
  const searchable = normalizeForSearch(text);
  return searchable.includes("nghi ngo") || searchable.includes("suspected");
}

function inferCommonConcern(analysis: PetHealthAnalysis, language: AppLanguage) {
  const searchable = normalizeForSearch(
    [
      analysis.summary,
      analysis.vetCareAdvice,
      analysis.emotion,
      ...analysis.observations,
      ...analysis.possibleConcerns,
      ...analysis.recommendedActions
    ].join(" ")
  );

  const matches = [
    {
      keywords: ["mat", "eye", "conjunctivitis", "do mat", "chay nuoc mat", "dich mat"],
      vi: "viêm mắt hoặc viêm kết mạc",
      en: "eye inflammation or conjunctivitis"
    },
    {
      keywords: ["tai", "ear", "lac dau", "mui hoi tai", "ear odor", "head shaking"],
      vi: "viêm tai",
      en: "ear infection"
    },
    {
      keywords: ["nam", "fungal", "ringworm", "hoi long", "rụng lông", "round patch"],
      vi: "nấm da",
      en: "ringworm or fungal skin disease"
    },
    {
      keywords: ["bo chet", "ve", "ran", "flea", "tick", "parasite"],
      vi: "ký sinh trùng da",
      en: "skin parasites"
    },
    {
      keywords: ["da", "long", "skin", "fur", "ngua", "itch", "rash", "do", "red", "vay", "scab"],
      vi: "viêm da hoặc dị ứng da",
      en: "dermatitis or skin allergy"
    },
    {
      keywords: ["rang", "mieng", "loi", "nuou", "tooth", "teeth", "gum", "mouth", "drool"],
      vi: "bệnh răng miệng",
      en: "dental or oral disease"
    },
    {
      keywords: ["vet thuong", "chay mau", "sung", "chan thuong", "wound", "bleeding", "swelling", "injury"],
      vi: "chấn thương hoặc nhiễm trùng vết thương",
      en: "injury or wound infection"
    },
    {
      keywords: ["kho tho", "ho", "mui", "tho", "breathing", "cough", "nasal", "respiratory"],
      vi: "nhiễm trùng hô hấp",
      en: "respiratory infection"
    },
    {
      keywords: ["non", "tieu chay", "phan", "bung", "vomit", "diarrhea", "stool", "abdomen"],
      vi: "rối loạn tiêu hóa",
      en: "digestive upset"
    },
    {
      keywords: ["mat nuoc", "kho", "liet", "dehydration", "dry", "lethargy"],
      vi: "mất nước hoặc suy kiệt",
      en: "dehydration or weakness"
    },
    {
      keywords: ["dau", "kich ung", "pain", "irritation", "agitation"],
      vi: "đau hoặc kích ứng",
      en: "pain or irritation"
    }
  ];

  const match = matches.find((item) => item.keywords.some((keyword) => searchable.includes(normalizeForSearch(keyword))));

  if (match) {
    return language === "vi" ? match.vi : match.en;
  }

  return language === "vi" ? "viêm da, đau hoặc kích ứng cần kiểm tra thêm" : "dermatitis, pain, or irritation that needs further checking";
}

function normalizeForSearch(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hashText(text: string) {
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }

  return hash;
}


function GlobeGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 12h18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 3c2.8 2.2 4.2 5 4.2 9S14.8 17.8 12 21c-2.8-3.2-4.2-6-4.2-9S9.2 5.2 12 3Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function PlusGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function CameraGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 7.5h2.2l1.5-2h2.6l1.5 2H17a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9.5a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ImageGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <path d="M6 17l4.2-4.2 2.8 2.8 2.2-2.2L18 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NotesGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4h7l4 4v12H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 4v4h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.5 11h7M8.5 14h7M8.5 17h5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EditGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13 7l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function StethoscopeGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5v5a3 3 0 0 0 6 0V5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 10v2.2c0 2.8 2.2 5 5 5s5-2.2 5-5v-4.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="19" cy="18" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 5H5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ShieldGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 19 6v5c0 4.9-3.3 8.9-7 10-3.7-1.1-7-5.1-7-10V6l7-3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.2 12.2 11 14l3.8-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DetailCard({
  title,
  value,
  muted = false
}: {
  title: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className={`resultCard detailCard ${muted ? "mutedCard" : ""}`}>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}
