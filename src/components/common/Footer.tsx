import { ExternalLink } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";

export function Footer() {
  const openSpeakDock = () => {
    open("https://speakdock.com");
  };

  return (
    <footer className="flex items-center justify-center px-4 py-2 border-t border-border text-text-muted text-xs gap-1">
      <span>Made with ❤️ by Liaqat Eagle</span>
      <span className="mx-1">·</span>
      <button
        onClick={openSpeakDock}
        className="inline-flex items-center gap-1 text-primary hover:text-primary-hover transition-colors cursor-pointer"
      >
        Need more? Try SpeakDock
        <ExternalLink className="w-3 h-3" />
      </button>
    </footer>
  );
}
