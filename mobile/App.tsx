import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Camera, CameraType } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

const configuredApiUrl = Constants.expoConfig?.extra?.apiUrl;
const API_URL =
  typeof configuredApiUrl === "string" && configuredApiUrl
    ? configuredApiUrl
    : Platform.OS === "android"
      ? "http://10.0.2.2:3000/api/analyze"
      : "http://localhost:3000/api/analyze";
const APP_LOGO = require("./assets/logo-ai-paw.png");
const SCAN_HISTORY_KEY = "bosscare.scanHistory.v1";
const SCAN_HISTORY_LIMIT = 100;
const SCAN_HISTORY_DIR = `${FileSystem.documentDirectory || ""}bosscare-scan-history/`;

type AppLanguage = "en" | "vi";

const uiText = {
  en: {
    language: "Language",
    heroEyebrow: "Pet health check",
    heroTitle: "BossCare",
    heroSubtitle: "Quickly check your pet's health from a clear photo.",
    addPhoto: "Add your pet photo",
    addPhotoHint: "A clear photo of the face, eyes, skin, or unusual fur area helps improve the result.",
    takePhoto: "Take photo",
    choosePhoto: "Choose photo",
    symptomsPlaceholder: "Enter symptoms so AI can analyze more accurately",
    analyze: "Analyze health",
    analyzing: "Analyzing...",
    uploadStatus: "Uploading image to server...",
    analyzingStatus: "AI is analyzing the image. Please wait...",
    doneStatus: "Analysis complete.",
    chooseImageError: "Please choose or take a photo first.",
    deniedTitle: "Permission denied",
    libraryDenied: "The app needs photo library access to choose a pet photo.",
    cameraDenied: "The app needs camera access to take a pet photo.",
    cameraSettingsTitle: "Cannot open camera",
    cameraSettings: "Please allow camera permission in Settings and try again.",
    pickerErrorTitle: "Cannot open photo library",
    captureErrorTitle: "Cannot take photo",
    tryAgain: "Please try again.",
    close: "Close",
    cameraHint: "Place your pet's face or the area to check in the center",
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
    viewResult: "View result",
    history: "History",
    historyTitle: "Scan history",
    historySubtitle: "Saved on this device only",
    historyLocalNote: "History is stored locally on this phone and is not uploaded to BossCare cloud storage.",
    noHistoryTitle: "No scans yet",
    noHistoryText: "Your completed scans will appear here after analysis.",
    back: "Back",
    delete: "Delete",
    clearHistory: "Clear history",
    clearHistoryTitle: "Clear scan history?",
    clearHistoryMessage: "This removes locally saved scan records and copied photos from this phone.",
    cancel: "Cancel",
    symptomsLabel: "Symptoms",
    noSymptoms: "No symptoms entered",
    cannotAnalyzeTitle: "Cannot analyze",
    nonPetAnalyzeError: "This isn't a picture of a cat/dog, so it can't be analyzed.",
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
    safety: "BossCare is only preliminary screening. If your pet has breathing trouble, bleeding, seizures, prolonged appetite loss, or severe pain, see a veterinarian immediately."
  },
  vi: {
    language: "Ngôn ngữ",
    heroEyebrow: "Pet health check",
    heroTitle: "BossCare",
    heroSubtitle: "Kiểm tra nhanh sức khỏe bé cưng từ một bức ảnh rõ nét.",
    addPhoto: "Thêm ảnh bé cưng",
    addPhotoHint: "Ảnh rõ mặt, mắt, da hoặc vùng lông bất thường sẽ giúp kết quả tốt hơn.",
    takePhoto: "Chụp ảnh",
    choosePhoto: "Chọn ảnh",
    symptomsPlaceholder: "Nhập thông tin triệu chứng để AI phân tích chính xác hơn",
    analyze: "Phân tích sức khỏe",
    analyzing: "Đang phân tích...",
    uploadStatus: "Đang gửi ảnh lên server...",
    analyzingStatus: "AI đang phân tích ảnh. Vui lòng đợi...",
    doneStatus: "Phân tích hoàn tất.",
    chooseImageError: "Vui lòng chọn hoặc chụp một ảnh trước.",
    deniedTitle: "Quyền truy cập bị từ chối",
    libraryDenied: "Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh thú cưng.",
    cameraDenied: "Ứng dụng cần quyền truy cập camera để chụp ảnh thú cưng.",
    cameraSettingsTitle: "Không thể mở camera",
    cameraSettings: "Hãy cấp quyền camera trong Settings rồi thử lại.",
    pickerErrorTitle: "Không thể mở thư viện ảnh",
    captureErrorTitle: "Không thể chụp ảnh",
    tryAgain: "Vui lòng thử lại.",
    close: "Đóng",
    cameraHint: "Đưa mặt hoặc vùng cần kiểm tra của bé vào giữa khung",
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
    viewResult: "Xem lại kết quả",
    history: "Lịch sử",
    historyTitle: "Lịch sử quét",
    historySubtitle: "Chỉ lưu trên máy này",
    historyLocalNote: "Lịch sử chỉ được lưu cục bộ trên điện thoại này và không tải lên kho cloud của BossCare.",
    noHistoryTitle: "Chưa có lần quét",
    noHistoryText: "Các lần quét hoàn tất sẽ xuất hiện ở đây sau khi phân tích.",
    back: "Quay lại",
    delete: "Xóa",
    clearHistory: "Xóa lịch sử",
    clearHistoryTitle: "Xóa lịch sử quét?",
    clearHistoryMessage: "Thao tác này xóa các bản ghi scan và ảnh đã copy đang lưu cục bộ trên điện thoại.",
    cancel: "Hủy",
    symptomsLabel: "Triệu chứng",
    noSymptoms: "Không nhập triệu chứng",
    cannotAnalyzeTitle: "Không thể phân tích",
    nonPetAnalyzeError: "Không phải ảnh chó/mèo nên không thể phân tích.",
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
    safety: "BossCare chỉ hỗ trợ sàng lọc ban đầu. Nếu bé khó thở, chảy máu, co giật, bỏ ăn kéo dài hoặc đau nhiều, hãy đưa bé đến bác sĩ thú y ngay."
  }
};

type HealthAnalysis = {
  petTypeGuess: string;
  summary: string;
  observations: string[];
  riskLevel: string;
  possibleConcerns: string[];
  recommendedActions: string[];
  vetCareAdvice: string;
  emotion: string;
  petThought: string;
  limitations: string;
};

type ScanHistoryItem = {
  id: string;
  createdAt: string;
  imageUri: string;
  symptoms: string;
  language: AppLanguage;
  analysis: HealthAnalysis;
};

type AnalyzeResponse = {
  analysis?: HealthAnalysis;
  error?: string;
};

export default function App() {
  const [language, setLanguage] = useState<AppLanguage>("en");
  const [isAppReady, setIsAppReady] = useState(false);
  const [image, setImage] = useState<ImagePicker.ImagePickerResult | null>(null);
  const [analysis, setAnalysis] = useState<HealthAnalysis | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [isResultDetailVisible, setIsResultDetailVisible] = useState(false);
  const [screen, setScreen] = useState<"scan" | "history">("scan");
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ScanHistoryItem | null>(null);
  const [isHistoryResultVisible, setIsHistoryResultVisible] = useState(false);
  const [isHistoryDetailVisible, setIsHistoryDetailVisible] = useState(false);
  const cameraRef = useRef<Camera | null>(null);
  const selectedImageUri = !image || image.canceled ? null : image.assets?.[0]?.uri;
  const text = uiText[language];

  useEffect(() => {
    let isMounted = true;

    loadScanHistory()
      .then((items) => {
        if (isMounted) {
          setScanHistory(items);
        }
      })
      .catch((historyError) => {
        console.warn("Could not load scan history", historyError);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isAppReady) {
    return <LoadingScreen onFinish={() => setIsAppReady(true)} />;
  }

  if (isCameraOpen) {
    return (
      <View style={styles.cameraScreen}>
        <Camera
          ref={cameraRef}
          style={styles.cameraPreview}
          type={CameraType.back}
          ratio="4:3"
          onCameraReady={() => setIsCameraReady(true)}
        >
          <View style={styles.cameraTopBar}>
            <TouchableOpacity
              style={styles.cameraCloseButton}
              onPress={() => {
                setIsCameraOpen(false);
                setIsCameraReady(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.cameraCloseText}>{text.close}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cameraBottomBar}>
            <Text style={styles.cameraHint}>{text.cameraHint}</Text>
            <TouchableOpacity
              style={[styles.captureButton, (!isCameraReady || isCapturing) && styles.captureButtonDisabled]}
              onPress={capturePhoto}
              disabled={!isCameraReady || isCapturing}
              activeOpacity={0.85}
            >
              <View style={styles.captureButtonInner}>
                {isCapturing ? <ActivityIndicator color="#2F8F62" /> : null}
              </View>
            </TouchableOpacity>
          </View>
        </Camera>
      </View>
    );
  }

  if (screen === "history") {
    return (
      <HistoryScreen
        items={scanHistory}
        language={language}
        onBack={() => setScreen("scan")}
        onOpenItem={(item) => {
          setSelectedHistoryItem(item);
          setIsHistoryDetailVisible(false);
          setIsHistoryResultVisible(true);
        }}
        onDeleteItem={deleteHistoryItem}
        onClearHistory={clearHistory}
        selectedItem={selectedHistoryItem}
        historyResultVisible={isHistoryResultVisible}
        historyDetailVisible={isHistoryDetailVisible}
        onToggleHistoryDetail={() => setIsHistoryDetailVisible((visible) => !visible)}
        onCloseHistoryResult={() => setIsHistoryResultVisible(false)}
      />
    );
  }

  async function requestLibraryPermission() {
    const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!libraryPermission.granted) {
      Alert.alert(
        text.deniedTitle,
        text.libraryDenied
      );
      return false;
    }

    return true;
  }

  async function requestCameraPermission() {
    const cameraAvailable = await Camera.getCameraPermissionsAsync();
    const cameraPermission = cameraAvailable.granted ? cameraAvailable : await Camera.requestCameraPermissionsAsync();

    if (!cameraPermission.granted) {
      Alert.alert(
        text.deniedTitle,
        text.cameraDenied
      );
      return false;
    }

    return true;
  }

  async function pickImage() {
    const permission = await requestLibraryPermission();
    if (!permission) {
      return;
    }

    let result: ImagePicker.ImagePickerResult;

    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8
      });
    } catch (pickerError) {
      Alert.alert(
        text.pickerErrorTitle,
        pickerError instanceof Error ? pickerError.message : text.tryAgain
      );
      return;
    }

    if (!result.canceled) {
      setImage(result as ImagePicker.ImagePickerResult);
      setAnalysis(null);
      setError(null);
      setStatus(null);
      setIsResultModalVisible(false);
      setIsResultDetailVisible(false);
    }
  }

  async function takePhoto() {
    const cameraPermissionStatus = await Camera.getCameraPermissionsAsync();
    if (Platform.OS === "ios" && !cameraPermissionStatus.canAskAgain && !cameraPermissionStatus.granted) {
      Alert.alert(text.cameraSettingsTitle, text.cameraSettings);
      return;
    }

    const permission = await requestCameraPermission();
    if (!permission) {
      return;
    }

    setError(null);
    setStatus(null);
    setIsCameraReady(false);
    setIsCameraOpen(true);
  }

  async function capturePhoto() {
    if (!cameraRef.current || isCapturing) {
      return;
    }

    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.82,
        skipProcessing: false
      });
      setImage({
        canceled: false,
        assets: [
          {
            uri: photo.uri,
            width: photo.width,
            height: photo.height,
            type: "image",
            fileName: "pet-camera.jpg"
          }
        ]
      } as ImagePicker.ImagePickerResult);
      setAnalysis(null);
      setError(null);
      setStatus(null);
      setIsResultModalVisible(false);
      setIsResultDetailVisible(false);
      setIsCameraOpen(false);
      setIsCameraReady(false);
    } catch (cameraError) {
      Alert.alert(
        text.captureErrorTitle,
        cameraError instanceof Error ? cameraError.message : text.tryAgain
      );
    } finally {
      setIsCapturing(false);
    }
  }

  async function analyzeImage() {
    if (!image || image.canceled || !image.assets?.length) {
      setError(text.chooseImageError);
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus(text.uploadStatus);
    setAnalysis(null);
    setIsResultModalVisible(false);
    setIsResultDetailVisible(false);

    const asset = image.assets[0];
    const uri = asset.uri;
    const fileName = asset.fileName || uri.split("/").pop() || "pet.jpg";
    const fileType = asset.type === "image" ? "image/jpeg" : "application/octet-stream";

    const formData = new FormData();
    formData.append("image", {
      uri,
      name: fileName,
      type: fileType
    } as any);
    formData.append("symptoms", symptoms.trim());
    formData.append("language", language);

    try {
      setStatus(text.analyzingStatus);
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData
      });

      const responseText = await response.text();
      const data = parseAnalyzeResponse(responseText, text.nonPetAnalyzeError);

      if (!response.ok) {
        throw new Error(data.error || text.nonPetAnalyzeError);
      }

      if (!data.analysis || data.analysis.petTypeGuess === "unknown") {
        throw new Error(text.nonPetAnalyzeError);
      }

      setAnalysis(data.analysis);
      await saveCurrentScanToHistory({
        analysis: data.analysis,
        imageUri: uri,
        symptoms: symptoms.trim(),
        language
      });
      setIsResultDetailVisible(false);
      setIsResultModalVisible(true);
      setStatus(text.doneStatus);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : text.nonPetAnalyzeError;
      Alert.alert(text.cannotAnalyzeTitle, message);
      setError(null);
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveCurrentScanToHistory({
    analysis: nextAnalysis,
    imageUri,
    symptoms: nextSymptoms,
    language: nextLanguage
  }: {
    analysis: HealthAnalysis;
    imageUri: string;
    symptoms: string;
    language: AppLanguage;
  }) {
    try {
      const item = await createScanHistoryItem({
        analysis: nextAnalysis,
        imageUri,
        symptoms: nextSymptoms,
        language: nextLanguage
      });
      const nextHistory = [item, ...scanHistory].slice(0, SCAN_HISTORY_LIMIT);
      await persistScanHistory(nextHistory);
      setScanHistory(nextHistory);
    } catch (historyError) {
      console.warn("Could not save scan history", historyError);
    }
  }

  async function deleteHistoryItem(item: ScanHistoryItem) {
    const nextHistory = scanHistory.filter((historyItem) => historyItem.id !== item.id);
    await persistScanHistory(nextHistory);
    await deleteHistoryImage(item.imageUri);
    setScanHistory(nextHistory);

    if (selectedHistoryItem?.id === item.id) {
      setSelectedHistoryItem(null);
      setIsHistoryResultVisible(false);
      setIsHistoryDetailVisible(false);
    }
  }

  function clearHistory() {
    Alert.alert(text.clearHistoryTitle, text.clearHistoryMessage, [
      { text: text.cancel, style: "cancel" },
      {
        text: text.clearHistory,
        style: "destructive",
        onPress: async () => {
          const itemsToDelete = scanHistory;
          await persistScanHistory([]);
          await Promise.all(itemsToDelete.map((item) => deleteHistoryImage(item.imageUri)));
          setScanHistory([]);
          setSelectedHistoryItem(null);
          setIsHistoryResultVisible(false);
          setIsHistoryDetailVisible(false);
        }
      }
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandMark}>
          <Image source={APP_LOGO} style={styles.brandLogo} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>{text.heroEyebrow}</Text>
          <Text style={styles.title}>{text.heroTitle}</Text>
          <Text style={styles.subtitle}>{text.heroSubtitle}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.historyEntryButton} onPress={() => setScreen("history")} activeOpacity={0.86}>
        <View>
          <Text style={styles.historyEntryTitle}>{text.history}</Text>
          <Text style={styles.historyEntrySubtitle}>{text.historySubtitle}</Text>
        </View>
        <Text style={styles.historyEntryCount}>{scanHistory.length}</Text>
      </TouchableOpacity>

      <View style={styles.languageRow}>
        <Text style={styles.languageLabel}>{text.language}</Text>
        <View style={styles.languageToggle}>
          <TouchableOpacity
            style={[styles.languageOption, language === "en" && styles.languageOptionActive]}
            onPress={() => {
              setLanguage("en");
              setAnalysis(null);
              setIsResultModalVisible(false);
              setIsResultDetailVisible(false);
            }}
            activeOpacity={0.82}
          >
          <Text style={[styles.languageOptionText, language === "en" && styles.languageOptionTextActive]}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.languageOption, language === "vi" && styles.languageOptionActive]}
            onPress={() => {
              setLanguage("vi");
              setAnalysis(null);
              setIsResultModalVisible(false);
              setIsResultDetailVisible(false);
            }}
            activeOpacity={0.82}
          >
          <Text style={[styles.languageOptionText, language === "vi" && styles.languageOptionTextActive]}>Tiếng Việt</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.photoPanel}>
        {selectedImageUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: selectedImageUri }} style={styles.preview} />
            <View style={styles.readyBadge}>
              <Text style={styles.readyBadgeText}>{text.ready}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.emptyPreview} onPress={pickImage} activeOpacity={0.86}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>+</Text>
            </View>
            <Text style={styles.emptyTitle}>{text.addPhoto}</Text>
            <Text style={styles.emptyText}>{text.addPhotoHint}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto} activeOpacity={0.85}>
            <Text style={styles.buttonIcon}>CA</Text>
            <Text style={styles.secondaryButtonText}>{text.takePhoto}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={pickImage} activeOpacity={0.85}>
            <Text style={styles.buttonIcon}>PH</Text>
            <Text style={styles.secondaryButtonText}>{text.choosePhoto}</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.symptomsInput}
          value={symptoms}
          onChangeText={setSymptoms}
          placeholder={text.symptomsPlaceholder}
          placeholderTextColor="#A99B8B"
          multiline
          textAlignVertical="top"
          maxLength={500}
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.analyzeButton, (!selectedImageUri || isLoading) && styles.disabledButton]}
          onPress={analyzeImage}
          disabled={isLoading || !selectedImageUri}
          activeOpacity={0.9}
        >
          {isLoading ? <ActivityIndicator color="#ffffff" /> : null}
          <Text style={styles.analyzeButtonText}>{isLoading ? text.analyzing : text.analyze}</Text>
        </TouchableOpacity>

        {status ? <Text style={styles.status}>{status}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      {analysis && selectedImageUri ? (
        <>
          {!isResultModalVisible ? (
            <TouchableOpacity
              style={styles.reopenResultButton}
              onPress={() => setIsResultModalVisible(true)}
              activeOpacity={0.86}
            >
              <Text style={styles.reopenResultButtonText}>{text.viewResult}</Text>
            </TouchableOpacity>
          ) : null}
          <AnalysisResultModal
            analysis={analysis}
            imageUri={selectedImageUri}
            language={language}
            visible={isResultModalVisible}
            detailsVisible={isResultDetailVisible}
            onToggleDetails={() => setIsResultDetailVisible((visible) => !visible)}
            onClose={() => setIsResultModalVisible(false)}
          />
        </>
      ) : null}

      <Text style={styles.safetyNote}>
        {text.safety}
      </Text>
    </ScrollView>
  );
}

function getConcernText(analysis: HealthAnalysis, language: AppLanguage) {
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

function getObservationText(analysis: HealthAnalysis) {
  return analysis.observations.slice(0, 3).join(", ") || "ảnh chưa đủ rõ để đánh giá";
}

function getShortCombinedSummary(analysis: HealthAnalysis, language: AppLanguage) {
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

function stripLeadingConcernPhrase(text: string) {
  return text
    .replace(/^nghi ngờ\s+(bị|có)?\s*/i, "")
    .replace(/^suspected\s+/i, "")
    .replace(/^bị\s+/i, "")
    .trim();
}

function getPetThought(analysis: HealthAnalysis, language: AppLanguage) {
  if (isNonPetAnalysis(analysis)) {
    return uiText[language].retakePetPhoto;
  }

  if (isAbnormalAnalysis(analysis)) {
    return uiText[language].abnormalPetThought;
  }

  return analysis.petThought;
}

function isAbnormalAnalysis(analysis: HealthAnalysis) {
  if (isNonPetAnalysis(analysis)) {
    return false;
  }

  if (analysis.riskLevel === "medium" || analysis.riskLevel === "high" || analysis.riskLevel === "urgent") {
    return true;
  }

  return analysis.possibleConcerns.some(isSpecificConcern) || hasSuspectedDiseaseLanguage(analysis.summary);
}

function isNonPetAnalysis(analysis: HealthAnalysis) {
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

function inferCommonConcern(analysis: HealthAnalysis, language: AppLanguage) {
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
      keywords: ["nam", "fungal", "ringworm", "hoi long", "rung long", "round patch"],
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

function parseAnalyzeResponse(responseText: string, fallbackError: string): AnalyzeResponse {
  try {
    const parsed = JSON.parse(responseText) as AnalyzeResponse;

    if (!parsed || typeof parsed !== "object") {
      throw new Error(fallbackError);
    }

    return parsed;
  } catch {
    throw new Error(fallbackError);
  }
}

async function loadScanHistory(): Promise<ScanHistoryItem[]> {
  const rawHistory = await AsyncStorage.getItem(SCAN_HISTORY_KEY);

  if (!rawHistory) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawHistory);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isScanHistoryItem).slice(0, SCAN_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

async function persistScanHistory(items: ScanHistoryItem[]) {
  await AsyncStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(items.slice(0, SCAN_HISTORY_LIMIT)));
}

async function createScanHistoryItem({
  analysis,
  imageUri,
  symptoms,
  language
}: {
  analysis: HealthAnalysis;
  imageUri: string;
  symptoms: string;
  language: AppLanguage;
}): Promise<ScanHistoryItem> {
  const id = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
  const copiedImageUri = await copyScanImageToLocalHistory(imageUri, id);

  return {
    id,
    createdAt: new Date().toISOString(),
    imageUri: copiedImageUri,
    symptoms,
    language,
    analysis
  };
}

async function copyScanImageToLocalHistory(imageUri: string, id: string) {
  await FileSystem.makeDirectoryAsync(SCAN_HISTORY_DIR, { intermediates: true });
  const destination = `${SCAN_HISTORY_DIR}${id}${getImageExtension(imageUri)}`;

  await FileSystem.copyAsync({
    from: imageUri,
    to: destination
  });

  return destination;
}

async function deleteHistoryImage(imageUri: string) {
  try {
    if (!imageUri.startsWith(SCAN_HISTORY_DIR)) {
      return;
    }

    await FileSystem.deleteAsync(imageUri, { idempotent: true });
  } catch (deleteError) {
    console.warn("Could not delete scan history image", deleteError);
  }
}

function getImageExtension(imageUri: string) {
  const extension = imageUri.match(/\.(jpe?g|png|webp|heic)$/i)?.[0]?.toLowerCase();
  return extension || ".jpg";
}

function isScanHistoryItem(value: unknown): value is ScanHistoryItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<ScanHistoryItem>;

  return (
    typeof item.id === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.imageUri === "string" &&
    typeof item.symptoms === "string" &&
    (item.language === "en" || item.language === "vi") &&
    Boolean(item.analysis) &&
    typeof item.analysis?.summary === "string" &&
    Array.isArray(item.analysis?.possibleConcerns)
  );
}

function formatHistoryDate(value: string, language: AppLanguage) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(language === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function HistoryScreen({
  items,
  language,
  onBack,
  onOpenItem,
  onDeleteItem,
  onClearHistory,
  selectedItem,
  historyResultVisible,
  historyDetailVisible,
  onToggleHistoryDetail,
  onCloseHistoryResult
}: {
  items: ScanHistoryItem[];
  language: AppLanguage;
  onBack: () => void;
  onOpenItem: (item: ScanHistoryItem) => void;
  onDeleteItem: (item: ScanHistoryItem) => void | Promise<void>;
  onClearHistory: () => void;
  selectedItem: ScanHistoryItem | null;
  historyResultVisible: boolean;
  historyDetailVisible: boolean;
  onToggleHistoryDetail: () => void;
  onCloseHistoryResult: () => void;
}) {
  const text = uiText[language];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.historyHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.84}>
          <Text style={styles.backButtonText}>{text.back}</Text>
        </TouchableOpacity>
        <View style={styles.historyHeaderCopy}>
          <Text style={styles.kicker}>{text.historySubtitle}</Text>
          <Text style={styles.historyTitle}>{text.historyTitle}</Text>
        </View>
      </View>

      <View style={styles.localHistoryNote}>
        <Text style={styles.localHistoryNoteText}>{text.historyLocalNote}</Text>
      </View>

      {items.length ? (
        <View style={styles.historyList}>
          {items.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <TouchableOpacity style={styles.historyCardMain} onPress={() => onOpenItem(item)} activeOpacity={0.86}>
                <Image source={{ uri: item.imageUri }} style={styles.historyThumbnail} />
                <View style={styles.historyCardCopy}>
                  <Text style={styles.historyDate}>{formatHistoryDate(item.createdAt, language)}</Text>
                  <Text style={styles.historyConcern} numberOfLines={2}>
                    {getConcernText(item.analysis, item.language)}
                  </Text>
                  <Text style={styles.historySymptoms} numberOfLines={1}>
                    {text.symptomsLabel}: {item.symptoms || text.noSymptoms}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteHistoryButton} onPress={() => onDeleteItem(item)} activeOpacity={0.82}>
                <Text style={styles.deleteHistoryButtonText}>{text.delete}</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.clearHistoryButton} onPress={onClearHistory} activeOpacity={0.82}>
            <Text style={styles.clearHistoryButtonText}>{text.clearHistory}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyHistory}>
          <Text style={styles.emptyHistoryTitle}>{text.noHistoryTitle}</Text>
          <Text style={styles.emptyHistoryText}>{text.noHistoryText}</Text>
        </View>
      )}

      {selectedItem ? (
        <AnalysisResultModal
          analysis={selectedItem.analysis}
          imageUri={selectedItem.imageUri}
          language={selectedItem.language}
          visible={historyResultVisible}
          detailsVisible={historyDetailVisible}
          onToggleDetails={onToggleHistoryDetail}
          onClose={onCloseHistoryResult}
        />
      ) : null}
    </ScrollView>
  );
}

function LoadingScreen({ onFinish }: { onFinish: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const progressAnimation = Animated.timing(progress, {
      toValue: 1,
      duration: 2400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    });
    const bounceAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 320,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 320,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false
        })
      ])
    );

    progressAnimation.start();
    bounceAnimation.start();

    const timer = setTimeout(onFinish, 2700);
    return () => {
      clearTimeout(timer);
      progressAnimation.stop();
      bounceAnimation.stop();
    };
  }, [bounce, onFinish, progress]);

  const dogTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 226]
  });
  const dogTranslateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -7]
  });
  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["8%", "100%"]
  });

  return (
    <View style={styles.loadingScreen}>
      <View style={styles.loadingHalo}>
        <View style={styles.loadingLogo}>
          <Image source={APP_LOGO} style={styles.loadingLogoImage} />
        </View>
      </View>
      <Text style={styles.loadingTitle}>BossCare</Text>
      <Text style={styles.loadingSubtitle}>Đang chuẩn bị góc kiểm tra cho bé cưng...</Text>

      <View style={styles.loadingTrackWrap}>
        <Animated.View
          style={[
            styles.runningDog,
            {
              transform: [{ translateX: dogTranslateX }, { translateY: dogTranslateY }, { scaleX: -1 }]
            }
          ]}
        >
          <Text style={styles.runningDogText}>🐕</Text>
        </Animated.View>
        <View style={styles.loadingTrack}>
          <Animated.View style={[styles.loadingFill, { width: barWidth }]} />
        </View>
      </View>

      <View style={styles.loadingPaws}>
        <Text style={styles.loadingPaw}>•</Text>
        <Text style={styles.loadingPaw}>•</Text>
        <Text style={styles.loadingPaw}>•</Text>
      </View>
    </View>
  );
}

function RiskChip({ riskLevel }: { riskLevel: string }) {
  const tone = getRiskTone(riskLevel);
  return (
    <View style={[styles.riskChip, tone.container]}>
      <Text style={[styles.riskChipText, tone.text]}>{riskLevel}</Text>
    </View>
  );
}

function AnalysisResultModal({
  analysis,
  imageUri,
  language,
  visible,
  detailsVisible,
  onToggleDetails,
  onClose
}: {
  analysis: HealthAnalysis;
  imageUri: string;
  language: AppLanguage;
  visible: boolean;
  detailsVisible: boolean;
  onToggleDetails: () => void;
  onClose: () => void;
}) {
  const text = uiText[language];
  const isNonPet = isNonPetAnalysis(analysis);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <TouchableOpacity style={styles.modalBackdropPressable} activeOpacity={1} onPress={onClose} />
        <View style={styles.resultModal}>
          <View style={styles.modalPhotoWrap}>
            <Image source={{ uri: imageUri }} style={styles.modalPhoto} />
            <View style={styles.modalRiskChipWrap}>
              <RiskChip riskLevel={analysis.riskLevel} />
            </View>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.resultsHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>{text.result}</Text>
                <Text style={styles.resultHeading}>{text.quickSummary}</Text>
              </View>
            </View>

            <View style={styles.quickResultCard}>
              <Text style={styles.quickResultLabel}>{text.prediction}</Text>
              {isNonPet ? (
                <Text style={styles.quickResultText}>
                  {text.noPetPrefix}: <Text style={styles.quickResultStrong}>{getConcernText(analysis, language)}</Text>.
                </Text>
              ) : (
                <Text style={styles.quickResultText}>
                  {text.suspected} <Text style={styles.quickResultStrong}>{getConcernText(analysis, language)}</Text>.
                </Text>
              )}
              <Text style={styles.petThoughtLabel}>{text.petThought}</Text>
              <Text style={styles.petThoughtText}>"{getPetThought(analysis, language)}"</Text>
            </View>

            {detailsVisible ? (
              <View style={styles.modalDetails}>
                <DetailInfoCard title={text.combinedSummary} value={getShortCombinedSummary(analysis, language)} />
                <DetailInfoCard title={text.limitations} value={analysis.limitations} muted />
              </View>
            ) : null}

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalSecondaryButton} onPress={onToggleDetails} activeOpacity={0.84}>
                <Text style={styles.modalSecondaryButtonText}>{detailsVisible ? text.hide : text.showDetails}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryButton} onPress={onClose} activeOpacity={0.88}>
                <Text style={styles.modalPrimaryButtonText}>{text.close}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DetailInfoCard({
  title,
  value,
  muted = false
}: {
  title: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <View style={[styles.resultCard, muted && styles.mutedCard]}>
      <Text style={styles.resultLabel}>{title}</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

function getRiskTone(riskLevel: string) {
  const normalized = riskLevel.toLowerCase();

  if (normalized.includes("cao") || normalized.includes("ngay")) {
    return {
      container: styles.riskHigh,
      text: styles.riskHighText
    };
  }

  if (normalized.includes("trung")) {
    return {
      container: styles.riskMedium,
      text: styles.riskMediumText
    };
  }

  if (normalized.includes("thấp")) {
    return {
      container: styles.riskLow,
      text: styles.riskLowText
    };
  }

  return {
    container: styles.riskUnknown,
    text: styles.riskUnknownText
  };
}

const styles = StyleSheet.create({
  cameraScreen: {
    flex: 1,
    backgroundColor: "#121812"
  },
  cameraPreview: {
    flex: 1,
    justifyContent: "space-between"
  },
  cameraTopBar: {
    paddingTop: 58,
    paddingHorizontal: 18,
    alignItems: "flex-start"
  },
  cameraCloseButton: {
    minHeight: 42,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 248, 239, 0.94)",
    alignItems: "center",
    justifyContent: "center"
  },
  cameraCloseText: {
    color: "#26352B",
    fontWeight: "900",
    fontSize: 14
  },
  cameraBottomBar: {
    paddingHorizontal: 22,
    paddingBottom: 38,
    alignItems: "center"
  },
  cameraHint: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 18,
    textShadowColor: "rgba(0, 0, 0, 0.34)",
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 2 }
  },
  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(255, 255, 255, 0.38)",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },
  captureButtonDisabled: {
    opacity: 0.62
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#FFF8EF",
    alignItems: "center",
    justifyContent: "center",
    padding: 28
  },
  loadingHalo: {
    width: 128,
    height: 128,
    borderRadius: 48,
    backgroundColor: "#FFE8D6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F3D2B4",
    shadowColor: "#6D4C32",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5
  },
  loadingLogo: {
    width: 88,
    height: 88,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  loadingLogoImage: {
    width: "100%",
    height: "100%"
  },
  loadingTitle: {
    color: "#26352B",
    fontSize: 40,
    fontWeight: "900",
    marginTop: 22
  },
  loadingSubtitle: {
    color: "#5E665D",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 42,
    maxWidth: 280
  },
  loadingTrackWrap: {
    width: 270,
    height: 54,
    justifyContent: "flex-end"
  },
  runningDog: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 44,
    height: 34,
    alignItems: "center",
    justifyContent: "center"
  },
  runningDogText: {
    fontSize: 28
  },
  loadingTrack: {
    width: "100%",
    height: 15,
    borderRadius: 999,
    backgroundColor: "#F6DEC5",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EDC59D"
  },
  loadingFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2F8F62"
  },
  loadingPaws: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18
  },
  loadingPaw: {
    color: "#F47C62",
    fontSize: 26,
    fontWeight: "900"
  },
  container: {
    padding: 18,
    paddingTop: 54,
    backgroundColor: "#FFF8EF",
    minHeight: "100%"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22
  },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14
  },
  languageLabel: {
    color: "#5E665D",
    fontSize: 13,
    fontWeight: "900"
  },
  languageToggle: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1DFCC",
    padding: 4
  },
  languageOption: {
    minHeight: 34,
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  languageOptionActive: {
    backgroundColor: "#2F8F62"
  },
  languageOptionText: {
    color: "#5E665D",
    fontSize: 12,
    fontWeight: "900"
  },
  languageOptionTextActive: {
    color: "#FFFFFF"
  },
  historyEntryButton: {
    minHeight: 64,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#CDE6D1",
    backgroundColor: "#EEF7EF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 14,
    shadowColor: "#6D4C32",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2
  },
  historyEntryTitle: {
    color: "#26352B",
    fontSize: 16,
    fontWeight: "900"
  },
  historyEntrySubtitle: {
    color: "#5E665D",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3
  },
  historyEntryCount: {
    minWidth: 38,
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: "#2F8F62",
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16
  },
  backButton: {
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1DFCC",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14
  },
  backButtonText: {
    color: "#2F8F62",
    fontSize: 14,
    fontWeight: "900"
  },
  historyHeaderCopy: {
    flex: 1
  },
  historyTitle: {
    color: "#26352B",
    fontSize: 28,
    fontWeight: "900"
  },
  localHistoryNote: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1DFCC",
    backgroundColor: "#FFF4E8",
    padding: 14,
    marginBottom: 14
  },
  localHistoryNoteText: {
    color: "#74695C",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19
  },
  historyList: {
    gap: 12
  },
  historyCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#F1DFCC",
    backgroundColor: "#FFFFFF",
    padding: 10,
    shadowColor: "#6D4C32",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  historyCardMain: {
    flexDirection: "row",
    gap: 12
  },
  historyThumbnail: {
    width: 86,
    height: 86,
    borderRadius: 18,
    backgroundColor: "#E8DED1"
  },
  historyCardCopy: {
    flex: 1,
    justifyContent: "center"
  },
  historyDate: {
    color: "#8A5D00",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 5
  },
  historyConcern: {
    color: "#26352B",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20
  },
  historySymptoms: {
    color: "#74695C",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 6
  },
  deleteHistoryButton: {
    alignSelf: "flex-end",
    minHeight: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FFD2CA",
    backgroundColor: "#FFF0ED",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    marginTop: 10
  },
  deleteHistoryButtonText: {
    color: "#B84B41",
    fontSize: 13,
    fontWeight: "900"
  },
  clearHistoryButton: {
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FFD2CA",
    backgroundColor: "#FFF0ED",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4
  },
  clearHistoryButtonText: {
    color: "#B84B41",
    fontSize: 14,
    fontWeight: "900"
  },
  emptyHistory: {
    minHeight: 240,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#F2C99E",
    backgroundColor: "#FFF4E8",
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  emptyHistoryTitle: {
    color: "#26352B",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center"
  },
  emptyHistoryText: {
    color: "#74695C",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  brandMark: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    shadowColor: "#7A2F25",
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    overflow: "hidden"
  },
  brandLogo: {
    width: "100%",
    height: "100%"
  },
  headerCopy: {
    flex: 1
  },
  kicker: {
    color: "#5C8A63",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 4
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#26352B"
  },
  subtitle: {
    fontSize: 15,
    color: "#5E665D",
    lineHeight: 21,
    marginTop: 4
  },
  photoPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1DFCC",
    shadowColor: "#6D4C32",
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  previewWrap: {
    position: "relative",
    marginBottom: 14
  },
  preview: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 22,
    backgroundColor: "#E8DED1"
  },
  readyBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: "#2F8F62",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12
  },
  readyBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800"
  },
  emptyPreview: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#F2C99E",
    backgroundColor: "#FFF4E8",
    justifyContent: "center",
    alignItems: "center",
    padding: 26,
    marginBottom: 14
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#F47C62",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14
  },
  emptyIconText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "600",
    lineHeight: 34
  },
  emptyTitle: {
    color: "#26352B",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center"
  },
  emptyText: {
    color: "#74695C",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12
  },
  secondaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#EEF7EF",
    borderWidth: 1,
    borderColor: "#CDE6D1",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 10
  },
  buttonIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#D9F0DE",
    color: "#2F8F62",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 28,
    marginRight: 8
  },
  secondaryButtonText: {
    color: "#2A5F3A",
    fontWeight: "900",
    fontSize: 14
  },
  symptomsInput: {
    minHeight: 92,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F1DFCC",
    backgroundColor: "#FFF8EF",
    color: "#26352B",
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 12
  },
  analyzeButton: {
    minHeight: 58,
    borderRadius: 20,
    backgroundColor: "#2F8F62",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#1A5D3D",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  disabledButton: {
    opacity: 0.58
  },
  analyzeButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
    marginLeft: 8
  },
  status: {
    color: "#2F8F62",
    marginTop: 12,
    fontWeight: "800",
    textAlign: "center"
  },
  error: {
    color: "#B84B41",
    marginTop: 12,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 20
  },
  reopenResultButton: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CDE6D1",
    backgroundColor: "#EEF7EF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    shadowColor: "#6D4C32",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2
  },
  reopenResultButtonText: {
    color: "#2F8F62",
    fontSize: 15,
    fontWeight: "900"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(38, 53, 43, 0.48)",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 24
  },
  modalBackdropPressable: {
    ...StyleSheet.absoluteFillObject
  },
  resultModal: {
    width: "100%",
    maxHeight: "92%",
    borderRadius: 30,
    backgroundColor: "#FFFAF4",
    borderWidth: 1,
    borderColor: "#EFD8BF",
    overflow: "hidden",
    shadowColor: "#252723",
    shadowOpacity: 0.28,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12
  },
  modalPhotoWrap: {
    height: 260,
    margin: 14,
    marginBottom: 0,
    borderRadius: 24,
    backgroundColor: "#FFF3E5",
    overflow: "hidden"
  },
  modalPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover"
  },
  modalRiskChipWrap: {
    position: "absolute",
    right: 12,
    bottom: 12
  },
  modalScroll: {
    maxHeight: 480
  },
  modalBody: {
    padding: 16,
    paddingTop: 14
  },
  modalDetails: {
    marginTop: 2
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2
  },
  modalPrimaryButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "#2F8F62",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    flex: 0.8
  },
  modalPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900"
  },
  modalSecondaryButton: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CDE6D1",
    backgroundColor: "#EEF7EF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    flex: 1
  },
  modalSecondaryButtonText: {
    color: "#2F8F62",
    fontSize: 15,
    fontWeight: "900"
  },
  resultsSection: {
    marginTop: 22
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  sectionEyebrow: {
    color: "#F47C62",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 2
  },
  resultHeading: {
    fontSize: 24,
    fontWeight: "900",
    color: "#26352B"
  },
  riskChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 150
  },
  riskChipText: {
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center"
  },
  riskLow: {
    backgroundColor: "#DFF3E5"
  },
  riskLowText: {
    color: "#28764A"
  },
  riskMedium: {
    backgroundColor: "#FFF0C7"
  },
  riskMediumText: {
    color: "#8A5D00"
  },
  riskHigh: {
    backgroundColor: "#FFE0DC"
  },
  riskHighText: {
    color: "#B24036"
  },
  riskUnknown: {
    backgroundColor: "#ECEBE7"
  },
  riskUnknownText: {
    color: "#5F5B53"
  },
  summaryCard: {
    backgroundColor: "#26352B",
    borderRadius: 22,
    padding: 18,
    marginBottom: 12
  },
  cardLabel: {
    color: "#BFE6C7",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8
  },
  summaryText: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "700"
  },
  quickResultCard: {
    backgroundColor: "#FFF1D8",
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0C58B"
  },
  quickResultLabel: {
    color: "#8A5D00",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 6
  },
  quickResultText: {
    color: "#26352B",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "800"
  },
  quickResultStrong: {
    fontWeight: "900",
    color: "#1F5E3D"
  },
  petThoughtLabel: {
    color: "#8A5D00",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 14,
    marginBottom: 6
  },
  petThoughtText: {
    color: "#26352B",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "900"
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1DFCC"
  },
  resultCardHeader: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  mutedCard: {
    backgroundColor: "#FBF2E8"
  },
  resultLabel: {
    fontWeight: "900",
    color: "#26352B",
    fontSize: 15,
    flex: 1
  },
  resultToggle: {
    color: "#2F8F62",
    fontSize: 12,
    fontWeight: "900"
  },
  resultValue: {
    color: "#545D52",
    lineHeight: 22,
    fontSize: 14,
    marginTop: 8
  },
  safetyNote: {
    color: "#74695C",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 14,
    marginBottom: 28,
    paddingHorizontal: 8
  }
});
