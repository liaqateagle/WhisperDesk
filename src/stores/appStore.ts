import { create } from "zustand";

export type View = "transcribe" | "history" | "settings";
export type Theme = "dark" | "light" | "system";
export type ExportFormat = "srt" | "vtt" | "txt" | "json" | "markdown";

export interface WordTimestamp {
  word: string;
  start: number; // seconds
  end: number; // seconds
}

export interface Segment {
  start: number;
  end: number;
  text: string;
  words: WordTimestamp[];
}

export interface TranscriptionResult {
  id: string;
  fileName: string;
  filePath: string;
  duration: number; // seconds
  segments: Segment[];
  fullText: string;
  engine: string;
  model: string;
  language: string;
  createdAt: string;
}

export interface WhisperModel {
  name: string;
  size: string;
  downloaded: boolean;
  downloading: boolean;
  downloadProgress: number;
}

export interface AppSettings {
  defaultModel: string;
  language: string;
  theme: Theme;
  defaultExportFormat: ExportFormat;
  speakdockBannerDismissed: boolean;
}

interface AppState {
  // Navigation
  currentView: View;
  setCurrentView: (view: View) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Transcription state
  selectedFile: File | null;
  selectedFilePath: string | null;
  isTranscribing: boolean;
  transcriptionProgress: number;
  transcriptionStatus: string;
  currentResult: TranscriptionResult | null;

  setSelectedFile: (file: File | null, path: string | null) => void;
  setTranscribing: (isTranscribing: boolean) => void;
  setTranscriptionProgress: (progress: number, status: string) => void;
  setCurrentResult: (result: TranscriptionResult | null) => void;

  // Models
  models: WhisperModel[];
  selectedModel: string;
  setModels: (models: WhisperModel[]) => void;
  setSelectedModel: (model: string) => void;
  updateModelDownloadProgress: (name: string, progress: number) => void;
  setModelDownloaded: (name: string, downloaded: boolean) => void;

  // History
  history: TranscriptionResult[];
  setHistory: (history: TranscriptionResult[]) => void;

  // Settings
  settings: AppSettings;
  setSettings: (settings: Partial<AppSettings>) => void;

  // Audio playback
  currentTime: number;
  isPlaying: boolean;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
}

const DEFAULT_MODELS: WhisperModel[] = [
  { name: "tiny", size: "75 MB", downloaded: false, downloading: false, downloadProgress: 0 },
  { name: "base", size: "142 MB", downloaded: false, downloading: false, downloadProgress: 0 },
  { name: "small", size: "466 MB", downloaded: false, downloading: false, downloadProgress: 0 },
  { name: "medium", size: "1.5 GB", downloaded: false, downloading: false, downloadProgress: 0 },
  { name: "large-v3", size: "3.1 GB", downloaded: false, downloading: false, downloadProgress: 0 },
  { name: "large-v3-turbo", size: "1.6 GB", downloaded: false, downloading: false, downloadProgress: 0 },
];

export const useAppStore = create<AppState>((set) => ({
  currentView: "transcribe",
  setCurrentView: (view) => set({ currentView: view }),

  theme: "dark",
  setTheme: (theme) => {
    set({ theme });
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else if (theme === "dark") {
      root.classList.remove("light");
    } else {
      // system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("light", !prefersDark);
    }
  },

  selectedFile: null,
  selectedFilePath: null,
  isTranscribing: false,
  transcriptionProgress: 0,
  transcriptionStatus: "",
  currentResult: null,

  setSelectedFile: (file, path) => set({ selectedFile: file, selectedFilePath: path }),
  setTranscribing: (isTranscribing) => set({ isTranscribing }),
  setTranscriptionProgress: (progress, status) =>
    set({ transcriptionProgress: progress, transcriptionStatus: status }),
  setCurrentResult: (result) => set({ currentResult: result }),

  models: DEFAULT_MODELS,
  selectedModel: "base",
  setModels: (models) => set({ models }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  updateModelDownloadProgress: (name, progress) =>
    set((state) => ({
      models: state.models.map((m) =>
        m.name === name ? { ...m, downloadProgress: progress, downloading: progress < 100 } : m
      ),
    })),
  setModelDownloaded: (name, downloaded) =>
    set((state) => ({
      models: state.models.map((m) =>
        m.name === name ? { ...m, downloaded, downloading: false, downloadProgress: downloaded ? 100 : 0 } : m
      ),
    })),

  history: [],
  setHistory: (history) => set({ history }),

  settings: {
    defaultModel: "base",
    language: "auto",
    theme: "dark",
    defaultExportFormat: "srt",
    speakdockBannerDismissed: false,
  },
  setSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  currentTime: 0,
  isPlaying: false,
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
}));
