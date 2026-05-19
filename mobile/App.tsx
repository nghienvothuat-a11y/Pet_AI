import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Constants from "expo-constants";
import { Camera, CameraType } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

const configuredApiUrl = Constants.expoConfig?.extra?.apiUrl;
const API_URL =
  typeof configuredApiUrl === "string" && configuredApiUrl
    ? configuredApiUrl
    : Platform.OS === "android"
      ? "http://10.0.2.2:3000/api/analyze"
      : "http://localhost:3000/api/analyze";
const APP_LOGO = require("./assets/logo-ai-paw.png");

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

export default function App() {
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
  const cameraRef = useRef<Camera | null>(null);
  const selectedImageUri = !image || image.canceled ? null : image.assets?.[0]?.uri;

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
              <Text style={styles.cameraCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cameraBottomBar}>
            <Text style={styles.cameraHint}>Đưa mặt hoặc vùng cần kiểm tra của bé vào giữa khung</Text>
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

  async function requestLibraryPermission() {
    const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!libraryPermission.granted) {
      Alert.alert(
        "Quyền truy cập bị từ chối",
        "Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh thú cưng."
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
        "Quyền truy cập bị từ chối",
        "Ứng dụng cần quyền truy cập camera để chụp ảnh thú cưng."
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
        "Không thể mở thư viện ảnh",
        pickerError instanceof Error ? pickerError.message : "Vui lòng thử lại."
      );
      return;
    }

    if (!result.canceled) {
      setImage(result as ImagePicker.ImagePickerResult);
      setAnalysis(null);
      setError(null);
      setStatus(null);
    }
  }

  async function takePhoto() {
    const cameraPermissionStatus = await Camera.getCameraPermissionsAsync();
    if (Platform.OS === "ios" && !cameraPermissionStatus.canAskAgain && !cameraPermissionStatus.granted) {
      Alert.alert("Không thể mở camera", "Hãy cấp quyền camera trong Settings rồi thử lại.");
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
      setIsCameraOpen(false);
      setIsCameraReady(false);
    } catch (cameraError) {
      Alert.alert(
        "Không thể chụp ảnh",
        cameraError instanceof Error ? cameraError.message : "Vui lòng thử lại."
      );
    } finally {
      setIsCapturing(false);
    }
  }

  async function analyzeImage() {
    if (!image || image.canceled || !image.assets?.length) {
      setError("Vui lòng chọn hoặc chụp một ảnh trước.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus("Đang gửi ảnh lên server...");
    setAnalysis(null);

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

    try {
      setStatus("AI đang phân tích ảnh. Vui lòng đợi...");
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể phân tích ảnh lúc này.");
      }

      setAnalysis(data.analysis);
      setStatus("Phân tích hoàn tất.");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Đã xảy ra lỗi khi gửi ảnh.");
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandMark}>
          <Image source={APP_LOGO} style={styles.brandLogo} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Pet health check</Text>
          <Text style={styles.title}>Pet_AI</Text>
          <Text style={styles.subtitle}>Kiểm tra nhanh sức khỏe bé cưng từ một bức ảnh rõ nét.</Text>
        </View>
      </View>

      <View style={styles.photoPanel}>
        {selectedImageUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: selectedImageUri }} style={styles.preview} />
            <View style={styles.readyBadge}>
              <Text style={styles.readyBadgeText}>Sẵn sàng phân tích</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.emptyPreview} onPress={pickImage} activeOpacity={0.86}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>+</Text>
            </View>
            <Text style={styles.emptyTitle}>Thêm ảnh bé cưng</Text>
            <Text style={styles.emptyText}>Ảnh rõ mặt, mắt, da hoặc vùng lông bất thường sẽ giúp kết quả tốt hơn.</Text>
          </TouchableOpacity>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto} activeOpacity={0.85}>
            <Text style={styles.buttonIcon}>CA</Text>
            <Text style={styles.secondaryButtonText}>Chụp ảnh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={pickImage} activeOpacity={0.85}>
            <Text style={styles.buttonIcon}>PH</Text>
            <Text style={styles.secondaryButtonText}>Chọn ảnh</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.symptomsInput}
          value={symptoms}
          onChangeText={setSymptoms}
          placeholder="Nhập thông tin triệu chứng để AI phân tích chính xác hơn"
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
          <Text style={styles.analyzeButtonText}>{isLoading ? "Đang phân tích..." : "Phân tích sức khỏe"}</Text>
        </TouchableOpacity>

        {status ? <Text style={styles.status}>{status}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      {analysis ? (
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>Kết quả</Text>
              <Text style={styles.resultHeading}>Tình trạng sơ bộ</Text>
            </View>
            <RiskChip riskLevel={analysis.riskLevel} />
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.cardLabel}>{analysis.petTypeGuess}</Text>
            <Text style={styles.summaryText}>{analysis.summary}</Text>
          </View>

          <View style={styles.quickResultCard}>
            <Text style={styles.quickResultLabel}>Kết luận nhanh</Text>
            <Text style={styles.quickResultText}>
              Nghi ngờ bị {getConcernText(analysis)}. Lý do: {getObservationText(analysis)}.
            </Text>
          </View>

          <ResultCard title="Quan sát thấy" items={analysis.observations} />
          <ResultCard title="Điểm cần chú ý" items={analysis.possibleConcerns} emptyText="Chưa thấy dấu hiệu đáng lo rõ ràng." />
          <ResultCard title="Nên làm tiếp" items={analysis.recommendedActions} />
          <InfoCard title="Lời khuyên thú y" value={analysis.vetCareAdvice} />
          <InfoCard title="Cảm xúc của bé" value={analysis.emotion} />
          <InfoCard title="Một chút tưởng tượng" value={analysis.petThought} />
          <InfoCard title="Giới hạn" value={analysis.limitations} muted />
        </View>
      ) : null}

      <Text style={styles.safetyNote}>
        Pet_AI chỉ hỗ trợ sàng lọc ban đầu. Nếu bé khó thở, chảy máu, co giật, bỏ ăn kéo dài hoặc đau nhiều,
        hãy đưa bé đến bác sĩ thú y ngay.
      </Text>
    </ScrollView>
  );
}

function getConcernText(analysis: HealthAnalysis) {
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

function getObservationText(analysis: HealthAnalysis) {
  return analysis.observations.slice(0, 3).join(", ") || "ảnh chưa đủ rõ để đánh giá";
}

function stripLeadingConcernPhrase(text: string) {
  return text
    .replace(/^nghi ngờ\s+(bị|có)?\s*/i, "")
    .replace(/^bị\s+/i, "")
    .trim();
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
      <Text style={styles.loadingTitle}>Pet_AI</Text>
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

function ResultCard({ title, items, emptyText = "Không có mục nào." }: { title: string; items: string[]; emptyText?: string }) {
  return (
    <View style={styles.resultCard}>
      <Text style={styles.resultLabel}>{title}</Text>
      {items.length > 0 ? (
        items.map((item, index) => (
          <Text key={index} style={styles.resultValue}>
            • {item}
          </Text>
        ))
      ) : (
        <Text style={styles.resultValue}>{emptyText}</Text>
      )}
    </View>
  );
}

function InfoCard({ title, value, muted = false }: { title: string; value: string; muted?: boolean }) {
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
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1DFCC"
  },
  mutedCard: {
    backgroundColor: "#FBF2E8"
  },
  resultLabel: {
    fontWeight: "900",
    color: "#26352B",
    marginBottom: 8,
    fontSize: 15
  },
  resultValue: {
    color: "#545D52",
    lineHeight: 22,
    fontSize: 14,
    marginBottom: 4
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
