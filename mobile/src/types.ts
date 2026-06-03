export type AppLanguage = "en" | "vi";

export type HealthAnalysis = {
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

export type ScanHistoryItem = {
  id: string;
  createdAt: string;
  imageUri: string;
  symptoms: string;
  language: AppLanguage;
  analysis: HealthAnalysis;
};

export type AnalyzeResponse = {
  analysis?: HealthAnalysis;
  error?: string;
};

export type AppSettings = {
  language: AppLanguage;
  backgroundMusicEnabled: boolean;
  soundEffectsEnabled: boolean;
};
