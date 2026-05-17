import { useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

const API_URL = Platform.OS === "android" ? "http://10.0.2.2:3000/api/analyze" : "http://localhost:3000/api/analyze";

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
  const [image, setImage] = useState<ImagePicker.ImagePickerResult | null>(null);
  const [analysis, setAnalysis] = useState<HealthAnalysis | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    const cameraAvailable = await ImagePicker.getCameraPermissionsAsync();
    const cameraPermission = cameraAvailable.granted ? cameraAvailable : await ImagePicker.requestCameraPermissionsAsync();

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
    const cameraPermissionStatus = await ImagePicker.getCameraPermissionsAsync();
    if (Platform.OS === "ios" && !cameraPermissionStatus.canAskAgain && !cameraPermissionStatus.granted) {
      Alert.alert("Không thể mở camera", "Hãy cấp quyền camera trong Settings rồi thử lại.");
      return;
    }

    const permission = await requestCameraPermission();
    if (!permission) {
      return;
    }

    let result: ImagePicker.ImagePickerResult;

    try {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8
      });
    } catch (cameraError) {
      Alert.alert(
        "Không thể mở camera",
        Platform.OS === "ios"
          ? "iOS Simulator thường không hỗ trợ camera. Hãy dùng Chọn ảnh để test trên simulator, hoặc chạy trên iPhone thật để chụp ảnh."
          : cameraError instanceof Error
            ? cameraError.message
            : "Vui lòng thử lại."
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
      <Text style={styles.title}>Pet_AI Mobile</Text>
      <Text style={styles.subtitle}>Sàng lọc sức khỏe chó mèo bằng ảnh</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>Chụp ảnh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Chọn ảnh</Text>
        </TouchableOpacity>
      </View>

      {image && image.assets?.[0]?.uri ? (
        <Image source={{ uri: image.assets[0].uri }} style={styles.preview} />
      ) : (
        <View style={styles.emptyPreview}>
          <Text style={styles.emptyText}>Chưa có ảnh</Text>
        </View>
      )}

      <TouchableOpacity style={[styles.button, styles.analyzeButton]} onPress={analyzeImage} disabled={isLoading}>
        <Text style={styles.buttonText}>{isLoading ? "Đang phân tích..." : "Phân tích sức khỏe"}</Text>
      </TouchableOpacity>

      {status ? <Text style={styles.status}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {analysis ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultHeading}>Kết quả phân tích</Text>
          <ResultRow label="Loại thú cưng" value={analysis.petTypeGuess} />
          <ResultRow label="Mức rủi ro" value={analysis.riskLevel} />
          <ResultText label="Tóm tắt" value={analysis.summary} />
          <ResultList label="Quan sát" items={analysis.observations} />
          <ResultList label="Lo ngại" items={analysis.possibleConcerns} />
          <ResultList label="Hành động đề xuất" items={analysis.recommendedActions} />
          <ResultText label="Lời khuyên thú y" value={analysis.vetCareAdvice} />
          <ResultText label="Cảm xúc" value={analysis.emotion} />
          <ResultText label="Suy nghĩ pet" value={analysis.petThought} />
          <ResultText label="Giới hạn" value={analysis.limitations} />
        </View>
      ) : null}

      <View style={styles.noteBox}>
        <Text style={styles.noteTitle}>Lưu ý</Text>
        <Text style={styles.noteText}>
          Ứng dụng này cần backend Next.js đang chạy trên máy hoặc trên server để gọi API.
        </Text>
        <Text style={styles.noteText}>Mặc định đang dùng: {API_URL}</Text>
        <Text style={styles.noteText}>
          Nếu dùng thiết bị thật, hãy cập nhật `API_URL` trong `App.tsx` thành địa chỉ IP của máy chủ.
        </Text>
      </View>
    </ScrollView>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}:</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

function ResultText({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultBlock}>
      <Text style={styles.resultLabel}>{label}:</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

function ResultList({ label, items }: { label: string; items: string[] }) {
  return (
    <View style={styles.resultBlock}>
      <Text style={styles.resultLabel}>{label}:</Text>
      {items.length > 0 ? (
        items.map((item, index) => (
          <Text key={index} style={styles.resultValue}>
            • {item}
          </Text>
        ))
      ) : (
        <Text style={styles.resultValue}>Không có mục nào.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#f8fafc",
    minHeight: "100%"
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827"
  },
  subtitle: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 20
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center"
  },
  analyzeButton: {
    marginTop: 12,
    backgroundColor: "#16a34a"
  },
  buttonText: {
    color: "white",
    fontWeight: "600"
  },
  preview: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: "#d1d5db"
  },
  emptyPreview: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 14,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12
  },
  emptyText: {
    color: "#6b7280"
  },
  status: {
    color: "#0f766e",
    marginTop: 10,
    fontWeight: "600"
  },
  error: {
    color: "#b91c1c",
    marginTop: 10,
    fontWeight: "600"
  },
  resultBox: {
    marginTop: 24,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  resultHeading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827"
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  resultBlock: {
    marginBottom: 10
  },
  resultLabel: {
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4
  },
  resultValue: {
    color: "#374151",
    lineHeight: 22
  },
  noteBox: {
    marginTop: 24,
    padding: 14,
    backgroundColor: "#e0f2fe",
    borderRadius: 14
  },
  noteTitle: {
    fontWeight: "700",
    marginBottom: 6,
    color: "#0c4a6e"
  },
  noteText: {
    color: "#0f172a",
    marginBottom: 4,
    lineHeight: 20
  }
});
