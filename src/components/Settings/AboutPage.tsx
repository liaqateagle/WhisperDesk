import { ExternalLink, Github, Youtube, Facebook } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import { motion } from "framer-motion";

export function AboutPage() {
  const openUrl = (url: string) => {
    open(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-lg space-y-6"
    >
      {/* App info */}
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4">
          <span className="text-3xl">🎙️</span>
        </div>
        <h2 className="text-2xl font-bold gradient-text">WhisperDesk</h2>
        <p className="text-sm text-text-muted mt-1">v1.0.0</p>
        <p className="text-sm text-text-secondary mt-2">
          Free & open-source audio/video transcription
        </p>
      </div>

      {/* Author */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Created by Liaqat Eagle</h3>
        <div className="space-y-2">
          <button
            onClick={() => openUrl("https://github.com/liaqateagle")}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors cursor-pointer w-full"
          >
            <Github className="w-4 h-4" />
            github.com/liaqateagle
            <ExternalLink className="w-3 h-3 ml-auto" />
          </button>
          <button
            onClick={() => openUrl("https://www.youtube.com/@learnwithliaqat/")}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors cursor-pointer w-full"
          >
            <Youtube className="w-4 h-4" />
            youtube.com/@learnwithliaqat
            <ExternalLink className="w-3 h-3 ml-auto" />
          </button>
          <button
            onClick={() => openUrl("https://www.facebook.com/theliaqateagle")}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors cursor-pointer w-full"
          >
            <Facebook className="w-4 h-4" />
            facebook.com/theliaqateagle
            <ExternalLink className="w-3 h-3 ml-auto" />
          </button>
        </div>
      </div>

      {/* SpeakDock */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Part of the SpeakDock ecosystem</h3>
        <p className="text-sm text-text-secondary">
          Need real-time dictation, AI polish, meeting recording, and voice commands?
        </p>
        <button
          onClick={() => openUrl("https://speakdock.com")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors cursor-pointer"
        >
          Try SpeakDock
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Credits */}
      <div className="glass rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-text-primary">Powered by</h3>
        <ul className="space-y-1 text-sm text-text-secondary">
          <li>• whisper.cpp — OpenAI Whisper speech recognition</li>
          <li>• Tauri v2 — lightweight desktop framework</li>
          <li>• React — user interface</li>
          <li>• Symphonia — audio decoding in pure Rust</li>
        </ul>
      </div>

      {/* License */}
      <p className="text-xs text-text-muted text-center">
        License: MIT — free for personal and commercial use
      </p>
    </motion.div>
  );
}
