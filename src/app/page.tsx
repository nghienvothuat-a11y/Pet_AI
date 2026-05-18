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

const riskLabels: Record<RiskLevel, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  urgent: "Cần gặp bác sĩ ngay",
  unknown: "Chưa rõ"
};

const riskClasses: Record<RiskLevel, string> = {
  low: "riskLow",
  medium: "riskMedium",
  high: "riskHigh",
  urgent: "riskUrgent",
  unknown: "riskUnknown"
};

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [analysis, setAnalysis] = useState<PetHealthAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

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
      setError("Vui lòng chọn một file ảnh.");
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
      setError("Không thể nén ảnh tự động. Nếu phân tích lỗi, hãy thử chọn ảnh JPG/PNG nhỏ hơn.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!imageFile) {
      setError("Vui lòng chụp hoặc chọn ảnh trước.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatusMessage("Đang gửi ảnh lên server...");
    setAnalysis(null);

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("symptoms", symptoms.trim());

    try {
      setStatusMessage("AI đang phân tích ảnh. Bước này có thể mất 10-30 giây.");
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData
      });
      const data = (await response.json()) as AnalyzeResponse;

      if (!response.ok || !data.analysis) {
        throw new Error(data.error || "Không thể phân tích ảnh lúc này.");
      }

      setAnalysis(data.analysis);
      setStatusMessage("Đã phân tích xong. Kết quả nằm bên dưới.");
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
          <img src="/logo-ai-paw.png" alt="Pet_AI logo" />
        </div>
        <div className="heroCopy">
          <p className="eyebrow">Pet health check</p>
          <h1>Pet_AI</h1>
          <p>Kiểm tra nhanh sức khỏe bé cưng từ ảnh rõ nét và triệu chứng bạn quan sát được.</p>
        </div>
      </section>

      <form className="capturePanel" onSubmit={handleSubmit}>
        <div className="previewBox">
          {previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Ảnh thú cưng đã chọn" />
              <span className="readyBadge">Sẵn sàng phân tích</span>
            </>
          ) : (
            <label className="emptyPreview">
              <input type="file" accept="image/*" onChange={handleFileChange} aria-label="Chọn ảnh thú cưng" />
              <span className="emptyIcon">+</span>
              <strong>Thêm ảnh bé cưng</strong>
              <span>Ảnh rõ mặt, mắt, da hoặc vùng lông bất thường sẽ giúp kết quả tốt hơn.</span>
            </label>
          )}
        </div>

        <div className="buttonRow">
          <label className="secondaryButton filePicker">
            <span className="buttonIcon">CA</span>
            <span>Chụp ảnh</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              aria-label="Chụp ảnh thú cưng"
            />
          </label>
          <label className="secondaryButton filePicker">
            <span className="buttonIcon">PH</span>
            <span>Chọn ảnh</span>
            <input type="file" accept="image/*" onChange={handleFileChange} aria-label="Chọn ảnh thú cưng" />
          </label>
        </div>

        <textarea
          className="symptomsInput"
          value={symptoms}
          onChange={(event) => setSymptoms(event.target.value)}
          placeholder="Nhập thông tin triệu chứng để AI phân tích chính xác hơn"
          maxLength={500}
          disabled={isLoading}
        />

        {imageFile ? (
          <p className="fileMeta">
            Đã chọn: {originalFileName || imageFile.name} · Ảnh gửi đi: {formatBytes(imageFile.size)}
          </p>
        ) : null}

        <div className="actionRow">
          <button type="submit" className="primaryButton" disabled={!canSubmit}>
            {isLoading ? "Đang phân tích..." : "Phân tích sức khỏe"}
          </button>
          {imageFile ? (
            <button type="button" className="textButton" onClick={clearImage} disabled={isLoading}>
              Đổi ảnh
            </button>
          ) : null}
        </div>

        <p className="safetyNote">
          Kết quả chỉ là sàng lọc sơ bộ và không thay thế chẩn đoán của bác sĩ thú y.
        </p>
      </form>

      {statusMessage ? <div className="statusBox">{statusMessage}</div> : null}
      {error ? <div className="alert">{error}</div> : null}
      <div ref={resultRef}>{analysis ? <AnalysisResult analysis={analysis} /> : null}</div>
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

function AnalysisResult({ analysis }: { analysis: PetHealthAnalysis }) {
  const concernText = analysis.possibleConcerns.slice(0, 2).join(", ");
  const observationText = analysis.observations.slice(0, 3).join(", ");
  const looksNormal =
    analysis.riskLevel === "low" &&
    (!concernText || concernText.toLowerCase().includes("chưa thấy") || analysis.summary.toLowerCase().includes("bình thường"));
  const petThought = normalizePetThought(analysis.petThought);

  return (
    <section className="resultPanel" aria-live="polite">
      <div className="resultHeader">
        <div>
          <p className="eyebrow">Kết quả</p>
          <h2>Tình trạng sơ bộ</h2>
        </div>
        <span className={`riskBadge ${riskClasses[analysis.riskLevel]}`}>{riskLabels[analysis.riskLevel]}</span>
      </div>

      <div className="summaryCard">
        <p className="cardLabel">{analysis.petTypeGuess}</p>
        <p>{analysis.summary}</p>
      </div>

      <div className="quickResult">
        {looksNormal ? (
          <p className="petThought">“{petThought}”</p>
        ) : (
          <p>
            Nghi ngờ bị {concernText || "một vấn đề sức khỏe bất thường"}. Lý do:{" "}
            {observationText || "ảnh chưa đủ rõ để đánh giá"}.
          </p>
        )}
      </div>

      <ResultList title="Quan sát thấy" items={analysis.observations} />
      <ResultList title="Điểm cần chú ý" items={analysis.possibleConcerns} emptyText="Chưa thấy dấu hiệu đáng lo rõ ràng." />
      <ResultList title="Nên làm tiếp" items={analysis.recommendedActions} />
      <InfoCard title="Lời khuyên thú y" value={analysis.vetCareAdvice} />
      <InfoCard title="Cảm xúc của bé" value={analysis.emotion} />
      <InfoCard title="Một chút tưởng tượng" value={analysis.petThought} />
      <InfoCard title="Giới hạn" value={analysis.limitations} muted />
    </section>
  );
}

function normalizePetThought(petThought: string) {
  const cleanThought = petThought.trim();

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


function ResultList({ title, items, emptyText = "Không có mục nào." }: { title: string; items: string[]; emptyText?: string }) {
  return (
    <div className="resultCard">
      <h3>{title}</h3>
      {items.length > 0 ? (
        <ul>
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>{emptyText}</p>
      )}
    </div>
  );
}

function InfoCard({ title, value, muted = false }: { title: string; value: string; muted?: boolean }) {
  return (
    <div className={`resultCard ${muted ? "mutedCard" : ""}`}>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}
