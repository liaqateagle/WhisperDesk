import { X, ExternalLink } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import { useAppStore } from "../../stores/appStore";
import { motion } from "framer-motion";

export function SpeakDockBanner() {
  const { setSettings } = useAppStore();

  const dismiss = () => {
    setSettings({ speakdockBannerDismissed: true });
  };

  const openSpeakDock = () => {
    open("https://speakdock.com");
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="border-b border-border bg-primary/5 overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 text-sm text-text-secondary">
          <strong className="text-text-primary">WhisperDesk</strong> is great for file transcription.
          Need real-time dictation, AI text polish, meeting recording, and voice commands?
        </div>
        <button
          onClick={openSpeakDock}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-hover transition-colors cursor-pointer"
        >
          Try SpeakDock
          <ExternalLink className="w-3 h-3" />
        </button>
        <button
          onClick={dismiss}
          className="p-1 rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
