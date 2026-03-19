import { useEffect } from "react";
import { Download, Trash2, Check, Loader2, HardDrive } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useAppStore } from "../../stores/appStore";
import { motion } from "framer-motion";

export function ModelManager() {
  const {
    models,
    selectedModel,
    setSelectedModel,
    setModels,
    updateModelDownloadProgress,
    setModelDownloaded,
  } = useAppStore();

  useEffect(() => {
    refreshModels();
  }, []);

  const refreshModels = async () => {
    try {
      const result = await invoke<{ name: string; size: string; downloaded: boolean }[]>(
        "list_models"
      );
      setModels(
        result.map((m) => ({
          ...m,
          downloading: false,
          downloadProgress: m.downloaded ? 100 : 0,
        }))
      );
    } catch (err) {
      console.error("Failed to list models:", err);
    }
  };

  const downloadModel = async (name: string) => {
    updateModelDownloadProgress(name, 0);

    try {
      const unlisten = await listen<{ model: string; progress: number }>(
        "model-download-progress",
        (event) => {
          if (event.payload.model === name) {
            updateModelDownloadProgress(name, event.payload.progress);
          }
        }
      );

      await invoke("download_model", { modelName: name });
      unlisten();
      setModelDownloaded(name, true);
    } catch (err) {
      console.error("Download error:", err);
      updateModelDownloadProgress(name, 0);
    }
  };

  const deleteModel = async (name: string) => {
    try {
      await invoke("delete_model", { modelName: name });
      setModelDownloaded(name, false);
      if (selectedModel === name) {
        const firstDownloaded = models.find((m) => m.downloaded && m.name !== name);
        if (firstDownloaded) setSelectedModel(firstDownloaded.name);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      <p className="text-sm text-text-muted mb-4">
        Download Whisper models for local transcription. Larger models are more accurate but slower.
      </p>

      {models.map((model) => (
        <div
          key={model.name}
          className={`flex items-center gap-3 p-3 rounded-xl glass transition-all ${
            model.name === selectedModel ? "border-primary/30" : ""
          }`}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-bg-tertiary flex-shrink-0">
            <HardDrive className="w-5 h-5 text-text-muted" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-text-primary">{model.name}</h3>
              <span className="text-xs text-text-muted">{model.size}</span>
              {model.downloaded && (
                <span className="flex items-center gap-1 text-xs text-success">
                  <Check className="w-3 h-3" /> Downloaded
                </span>
              )}
            </div>

            {model.downloading && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>Downloading...</span>
                  <span>{Math.round(model.downloadProgress)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    animate={{ width: `${model.downloadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {model.downloaded ? (
              <>
                {model.name !== selectedModel && (
                  <button
                    onClick={() => setSelectedModel(model.name)}
                    className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    Select
                  </button>
                )}
                {model.name === selectedModel && (
                  <span className="px-3 py-1.5 rounded-lg text-xs text-primary bg-primary/10 font-medium">
                    Active
                  </span>
                )}
                <button
                  onClick={() => deleteModel(model.name)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                  title="Delete model"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : model.downloading ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <button
                onClick={() => downloadModel(model.name)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-hover transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
