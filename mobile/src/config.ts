import { Platform } from "react-native";
import Constants from "expo-constants";

const configuredApiUrl = Constants.expoConfig?.extra?.apiUrl;

export const API_URL =
  typeof configuredApiUrl === "string" && configuredApiUrl
    ? configuredApiUrl
    : Platform.OS === "android"
      ? "http://10.0.2.2:3000/api/analyze"
      : "http://localhost:3000/api/analyze";

export const CONTACT_EMAIL = "nghienvothuat@gmail.com";
