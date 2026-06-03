import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import type { AppLanguage, AppSettings, HealthAnalysis, ScanHistoryItem } from "./types";

const SCAN_HISTORY_KEY = "bosscare.scanHistory.v1";
const APP_SETTINGS_KEY = "bosscare.appSettings.v1";
export const SCAN_HISTORY_LIMIT = 100;
const SCAN_HISTORY_DIR = `${FileSystem.documentDirectory || ""}bosscare-scan-history/`;

export async function loadScanHistory(): Promise<ScanHistoryItem[]> {
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

export async function persistScanHistory(items: ScanHistoryItem[]) {
  await AsyncStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(items.slice(0, SCAN_HISTORY_LIMIT)));
}

export async function createScanHistoryItem({
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

export async function deleteHistoryImage(imageUri: string) {
  try {
    if (!imageUri.startsWith(SCAN_HISTORY_DIR)) {
      return;
    }

    await FileSystem.deleteAsync(imageUri, { idempotent: true });
  } catch (deleteError) {
    console.warn("Could not delete scan history image", deleteError);
  }
}

export async function loadAppSettings(): Promise<AppSettings> {
  const rawSettings = await AsyncStorage.getItem(APP_SETTINGS_KEY);
  const fallback: AppSettings = {
    language: "en",
    backgroundMusicEnabled: true,
    soundEffectsEnabled: true
  };

  if (!rawSettings) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawSettings) as Partial<AppSettings>;

    return {
      language: parsed.language === "vi" || parsed.language === "en" ? parsed.language : fallback.language,
      backgroundMusicEnabled:
        typeof parsed.backgroundMusicEnabled === "boolean"
          ? parsed.backgroundMusicEnabled
          : fallback.backgroundMusicEnabled,
      soundEffectsEnabled:
        typeof parsed.soundEffectsEnabled === "boolean" ? parsed.soundEffectsEnabled : fallback.soundEffectsEnabled
    };
  } catch {
    return fallback;
  }
}

export async function persistAppSettings(settings: AppSettings) {
  await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
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
