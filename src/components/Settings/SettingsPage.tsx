import { useState } from "react";
import { Settings, Palette, Download, Info, Globe } from "lucide-react";
import { useAppStore, Theme, ExportFormat } from "../../stores/appStore";
import { ModelManager } from "./ModelManager";
import { AboutPage } from "./AboutPage";
import { motion } from "framer-motion";

type SettingsTab = "general" | "models" | "about";

const WHISPER_LANGUAGES = [
  "auto", "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Assamese",
  "Azerbaijani", "Bashkir", "Basque", "Belarusian", "Bengali", "Bosnian", "Breton",
  "Bulgarian", "Cantonese", "Catalan", "Chinese", "Croatian", "Czech", "Danish",
  "Dutch", "English", "Estonian", "Faroese", "Finnish", "French", "Galician",
  "Georgian", "German", "Greek", "Gujarati", "Haitian Creole", "Hausa", "Hawaiian",
  "Hebrew", "Hindi", "Hungarian", "Icelandic", "Indonesian", "Italian", "Japanese",
  "Javanese", "Kannada", "Kazakh", "Khmer", "Korean", "Lao", "Latin", "Latvian",
  "Lingala", "Lithuanian", "Luxembourgish", "Macedonian", "Malagasy", "Malay",
  "Malayalam", "Maltese", "Maori", "Marathi", "Mongolian", "Myanmar", "Nepali",
  "Norwegian", "Occitan", "Pashto", "Persian", "Polish", "Portuguese", "Punjabi",
  "Romanian", "Russian", "Sanskrit", "Serbian", "Shona", "Sindhi", "Sinhala",
  "Slovak", "Slovenian", "Somali", "Spanish", "Sundanese", "Swahili", "Swedish",
  "Tagalog", "Tajik", "Tamil", "Tatar", "Telugu", "Thai", "Tibetan", "Turkish",
  "Turkmen", "Ukrainian", "Urdu", "Uzbek", "Vietnamese", "Welsh", "Yiddish", "Yoruba",
];

export function SettingsPage() {
  const { settings, setSettings, setTheme } = useAppStore();
  const [tab, setTab] = useState<SettingsTab>("general");

  const tabs: { id: SettingsTab; icon: typeof Settings; label: string }[] = [
    { id: "general", icon: Settings, label: "General" },
    { id: "models", icon: Download, label: "Models" },
    { id: "about", icon: Info, label: "About" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pb-4">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
              tab === id
                ? "bg-primary/10 text-primary font-medium"
                : "text-text-muted hover:text-text-secondary hover:bg-bg-hover"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {tab === "general" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 max-w-lg"
          >
            {/* Theme */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                <Palette className="w-4 h-4" />
                Theme
              </label>
              <div className="flex gap-2">
                {(["dark", "light", "system"] as Theme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setSettings({ theme: t });
                      setTheme(t);
                    }}
                    className={`px-4 py-2 rounded-xl text-sm capitalize transition-all cursor-pointer ${
                      settings.theme === t
                        ? "bg-primary text-white"
                        : "glass glass-hover text-text-secondary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                <Globe className="w-4 h-4" />
                Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ language: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass text-sm text-text-primary bg-bg-secondary outline-none focus:border-primary transition-colors"
              >
                {WHISPER_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang.toLowerCase()}>
                    {lang === "auto" ? "Auto-detect" : lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Default Export Format */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                <Download className="w-4 h-4" />
                Default Export Format
              </label>
              <div className="flex flex-wrap gap-2">
                {(["srt", "vtt", "txt", "json", "markdown"] as ExportFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setSettings({ defaultExportFormat: fmt })}
                    className={`px-3 py-1.5 rounded-lg text-sm uppercase transition-all cursor-pointer ${
                      settings.defaultExportFormat === fmt
                        ? "bg-primary text-white"
                        : "glass glass-hover text-text-secondary"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {tab === "models" && <ModelManager />}
        {tab === "about" && <AboutPage />}
      </div>
    </div>
  );
}
