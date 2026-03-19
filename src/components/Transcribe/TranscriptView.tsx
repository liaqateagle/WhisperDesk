import { useState, useRef, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  Download,
  Copy,
  Check,
  ChevronDown,
  X,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { useAppStore, ExportFormat, WordTimestamp } from "../../stores/appStore";
import { AudioPlayer } from "../common/AudioPlayer";
import { formatTime } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const EXPORT_FORMATS: { id: ExportFormat; label: string; ext: string }[] = [
  { id: "srt", label: "SRT (Subtitles)", ext: "srt" },
  { id: "vtt", label: "VTT (WebVTT)", ext: "vtt" },
  { id: "txt", label: "Plain Text", ext: "txt" },
  { id: "json", label: "JSON (Timestamps)", ext: "json" },
  { id: "markdown", label: "Markdown", ext: "md" },
];

export function TranscriptView() {
  const {
    currentResult,
    setCurrentResult,
    currentTime,
    setCurrentTime,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingWord, setEditingWord] = useState<{
    segIdx: number;
    wordIdx: number;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const transcriptRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const segments = currentResult?.segments ?? [];
  const fileName = currentResult?.fileName ?? "";
  const filePath = currentResult?.filePath ?? "";
  const duration = currentResult?.duration ?? 0;

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Find matching words for search highlighting
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    const matches = new Set<string>();
    segments.forEach((seg, si) => {
      seg.words.forEach((w, wi) => {
        if (w.word.toLowerCase().includes(q)) {
          matches.add(`${si}-${wi}`);
        }
      });
    });
    return matches;
  }, [searchQuery, segments]);

  if (!currentResult) return null;

  const handleWordClick = (word: WordTimestamp) => {
    setCurrentTime(word.start);
  };

  const startEditing = (segIdx: number, wordIdx: number, word: string) => {
    setEditingWord({ segIdx, wordIdx });
    setEditValue(word);
  };

  const saveEdit = () => {
    if (!editingWord || !currentResult) return;
    const newSegments = [...currentResult.segments];
    const seg = { ...newSegments[editingWord.segIdx] };
    const words = [...seg.words];
    words[editingWord.wordIdx] = { ...words[editingWord.wordIdx], word: editValue };
    seg.words = words;
    seg.text = words.map((w) => w.word).join(" ");
    newSegments[editingWord.segIdx] = seg;
    setCurrentResult({
      ...currentResult,
      segments: newSegments,
      fullText: newSegments.map((s) => s.text).join(" "),
    });
    setEditingWord(null);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(currentResult.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportTranscript = async (format: ExportFormat) => {
    setShowExport(false);
    const ext = EXPORT_FORMATS.find((f) => f.id === format)?.ext || "txt";
    const baseName = fileName.replace(/\.[^/.]+$/, "");

    const path = await save({
      defaultPath: `${baseName}.${ext}`,
      filters: [{ name: format.toUpperCase(), extensions: [ext] }],
    });

    if (path) {
      try {
        await invoke("export_transcript", {
          format,
          segments: currentResult.segments,
          fullText: currentResult.fullText,
          outputPath: path,
        });
      } catch (err) {
        console.error("Export error:", err);
      }
    }
  };

  const isWordActive = (word: WordTimestamp) => {
    return currentTime >= word.start && currentTime < word.end;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button
          onClick={() => setCurrentResult(null)}
          className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-text-primary truncate">{fileName}</h2>
          <p className="text-xs text-text-muted">{formatTime(duration)}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setShowSearch(!showSearch);
              if (!showSearch) setTimeout(() => searchInputRef.current?.focus(), 100);
            }}
            className="p-2 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            title="Search (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={copyToClipboard}
            className="p-2 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            title="Copy transcript"
          >
            {copied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-3 h-3" />
            </button>
            <AnimatePresence>
              {showExport && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 w-48 rounded-xl glass border border-border shadow-xl z-20 py-1"
                >
                  {EXPORT_FORMATS.map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => exportTranscript(fmt.id)}
                      className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover transition-colors cursor-pointer"
                    >
                      {fmt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-2">
              <Search className="w-4 h-4 text-text-muted" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transcript..."
                className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
              {searchQuery && (
                <span className="text-xs text-text-muted">{searchMatches.size} matches</span>
              )}
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
                className="p-1 rounded hover:bg-bg-hover text-text-muted cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Player */}
      <div className="px-4 py-3 border-b border-border">
        <AudioPlayer filePath={filePath} duration={duration} />
      </div>

      {/* Transcript */}
      <div ref={transcriptRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {segments.map((segment, segIdx) => (
            <div key={segIdx} className="group">
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentTime(segment.start)}
                  className="flex-shrink-0 text-xs text-text-muted font-mono mt-0.5 hover:text-primary transition-colors cursor-pointer min-w-[52px]"
                >
                  [{formatTime(segment.start)}]
                </button>
                <p className="text-sm leading-relaxed text-text-primary">
                  {segment.words.map((word, wordIdx) => {
                    const key = `${segIdx}-${wordIdx}`;
                    const active = isWordActive(word);
                    const matched = searchMatches.has(key);

                    if (
                      editingWord &&
                      editingWord.segIdx === segIdx &&
                      editingWord.wordIdx === wordIdx
                    ) {
                      return (
                        <input
                          key={key}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") setEditingWord(null);
                          }}
                          autoFocus
                          className="inline-block bg-primary/20 border border-primary rounded px-1 text-sm outline-none min-w-[20px]"
                          style={{ width: `${editValue.length + 1}ch` }}
                        />
                      );
                    }

                    return (
                      <span
                        key={key}
                        onClick={() => handleWordClick(word)}
                        onDoubleClick={() =>
                          startEditing(segIdx, wordIdx, word.word)
                        }
                        className={`
                          cursor-pointer transition-all duration-150 rounded-sm px-[1px]
                          ${active ? "bg-primary/30 text-primary font-medium" : ""}
                          ${matched ? "bg-warning/30 text-warning" : ""}
                          ${!active && !matched ? "hover:bg-bg-hover" : ""}
                        `}
                        title={`${formatTime(word.start)} - ${formatTime(word.end)}`}
                      >
                        {word.word}{" "}
                      </span>
                    );
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
