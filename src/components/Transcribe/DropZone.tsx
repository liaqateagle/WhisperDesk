import { useState, useCallback, useRef } from "react";
import { Upload, FileAudio, Loader2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { useAppStore } from "../../stores/appStore";
import { formatFileSize, SUPPORTED_AUDIO_EXTENSIONS } from "../../lib/utils";

export function DropZone() {
  const {
    isTranscribing,
    transcriptionProgress,
    transcriptionStatus,
    setTranscribing,
    setTranscriptionProgress,
    setCurrentResult,
    models,
    selectedModel,
    setSelectedModel,
  } = useAppStore();

  const [isDragOver, setIsDragOver] = useState(false);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: number;
    path: string;
  } | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadedModels = models.filter((m) => m.downloaded);

  const handleFile = useCallback(async (filePath: string, fileName: string, fileSize: number) => {
    setFileInfo({ name: fileName, size: fileSize, path: filePath });
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        if (SUPPORTED_AUDIO_EXTENSIONS.includes(ext)) {
          handleFile(file.name, file.name, file.size);
        }
      }
    },
    [handleFile]
  );

  const browseFiles = async () => {
    const result = await openDialog({
      multiple: false,
      filters: [
        {
          name: "Audio Files",
          extensions: SUPPORTED_AUDIO_EXTENSIONS,
        },
      ],
    });
    if (result) {
      const path = typeof result === "string" ? result : result;
      const name = String(path).split(/[\\/]/).pop() || "file";
      handleFile(String(path), name, 0);
    }
  };

  const startTranscription = async () => {
    if (!fileInfo) return;

    setTranscribing(true);
    setTranscriptionProgress(0, "Loading model...");

    try {
      const unlisten = await listen<{ progress: number; status: string }>(
        "transcription-progress",
        (event) => {
          setTranscriptionProgress(event.payload.progress, event.payload.status);
        }
      );

      const result = await invoke("transcribe_file", {
        filePath: fileInfo.path,
        modelName: selectedModel,
        language: "auto",
      });

      unlisten();
      setTranscribing(false);
      setCurrentResult(result as ReturnType<typeof useAppStore.getState>["currentResult"]);
    } catch (err) {
      console.error("Transcription error:", err);
      setTranscribing(false);
      setTranscriptionProgress(0, `Error: ${err}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <AnimatePresence mode="wait">
        {isTranscribing ? (
          <motion.div
            key="progress"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-6 w-full max-w-md"
          >
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <div className="w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary">{transcriptionStatus}</span>
                <span className="text-primary font-medium">{Math.round(transcriptionProgress)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-bg-tertiary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  animate={{ width: `${transcriptionProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            <p className="text-text-muted text-sm">
              {fileInfo?.name}
            </p>
          </motion.div>
        ) : fileInfo ? (
          <motion.div
            key="file-ready"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-6 w-full max-w-md"
          >
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/10">
              <FileAudio className="w-10 h-10 text-accent" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-text-primary">{fileInfo.name}</h3>
              {fileInfo.size > 0 && (
                <p className="text-text-muted text-sm mt-1">{formatFileSize(fileInfo.size)}</p>
              )}
            </div>

            {/* Model selector */}
            <div className="relative w-full max-w-xs">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl glass glass-hover transition-all cursor-pointer"
              >
                <span className="text-sm text-text-secondary">
                  Model: <span className="text-text-primary font-medium">{selectedModel}</span>
                </span>
                <ChevronDown className="w-4 h-4 text-text-muted" />
              </button>
              {showModelDropdown && (
                <div className="absolute top-full mt-1 w-full rounded-xl glass border border-border shadow-xl z-20 py-1">
                  {downloadedModels.length === 0 ? (
                    <p className="px-4 py-2 text-sm text-text-muted">
                      No models downloaded. Go to Settings to download a model.
                    </p>
                  ) : (
                    downloadedModels.map((m) => (
                      <button
                        key={m.name}
                        onClick={() => {
                          setSelectedModel(m.name);
                          setShowModelDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-bg-hover transition-colors cursor-pointer ${
                          m.name === selectedModel ? "text-primary" : "text-text-secondary"
                        }`}
                      >
                        {m.name} ({m.size})
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setFileInfo(null)}
                className="px-4 py-2.5 rounded-xl glass glass-hover text-sm text-text-secondary transition-all cursor-pointer"
              >
                Change File
              </button>
              <button
                onClick={startTranscription}
                disabled={downloadedModels.length === 0}
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer glow"
              >
                Start Transcription
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg"
          >
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={browseFiles}
              className={`
                flex flex-col items-center justify-center gap-4 p-12 rounded-2xl
                border-2 border-dashed transition-all duration-300 cursor-pointer
                ${
                  isDragOver
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:bg-bg-hover"
                }
              `}
            >
              <div
                className={`flex items-center justify-center w-16 h-16 rounded-2xl transition-colors ${
                  isDragOver ? "bg-primary/20" : "bg-bg-tertiary"
                }`}
              >
                <Upload
                  className={`w-8 h-8 transition-colors ${
                    isDragOver ? "text-primary" : "text-text-muted"
                  }`}
                />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-text-primary">
                  Drop audio files here
                </p>
                <p className="text-sm text-text-muted mt-1">
                  or click to browse
                </p>
              </div>
              <p className="text-xs text-text-muted">
                Supports: MP3, WAV, M4A, OGG, FLAC, WMA, AAC
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 mt-6 text-sm text-text-muted">
              <span>Engine: Whisper (Local)</span>
              <span>·</span>
              <span>Model: {selectedModel}</span>
              <span>·</span>
              <span className="text-success">Ready to transcribe</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_AUDIO_EXTENSIONS.map((e) => `.${e}`).join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFile(file.name, file.name, file.size);
          }
        }}
      />
    </div>
  );
}
