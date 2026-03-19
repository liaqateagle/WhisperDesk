import { useState, useEffect } from "react";
import { Search, Trash2, Clock, FileAudio, BarChart3, AlertCircle } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore, TranscriptionResult } from "../../stores/appStore";
import { formatDuration } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface HistoryStats {
  totalFiles: number;
  totalHours: number;
  totalWords: number;
}

export function HistoryList() {
  const { history, setHistory, setCurrentResult, setCurrentView } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<HistoryStats>({ totalFiles: 0, totalHours: 0, totalWords: 0 });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  const loadHistory = async () => {
    try {
      const result = await invoke<TranscriptionResult[]>("get_history");
      setHistory(result);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const loadStats = async () => {
    try {
      const result = await invoke<HistoryStats>("get_stats");
      setStats(result);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  const openTranscript = async (id: string) => {
    try {
      const result = await invoke<TranscriptionResult>("get_transcript", { id });
      setCurrentResult(result);
      setCurrentView("transcribe");
    } catch (err) {
      console.error("Failed to load transcript:", err);
    }
  };

  const deleteTranscript = async (id: string) => {
    try {
      await invoke("delete_transcript", { id });
      setHistory(history.filter((h) => h.id !== id));
      setConfirmDelete(null);
      loadStats();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const clearAll = async () => {
    try {
      await invoke("clear_history");
      setHistory([]);
      loadStats();
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const filtered = history.filter(
    (h) =>
      !searchQuery ||
      h.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.fullText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <h1 className="text-xl font-bold text-text-primary">History</h1>
        {history.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-text-muted hover:text-error transition-colors cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-4 px-6 pb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass text-sm">
          <FileAudio className="w-4 h-4 text-primary" />
          <span className="text-text-muted">{stats.totalFiles} files</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass text-sm">
          <Clock className="w-4 h-4 text-accent" />
          <span className="text-text-muted">{stats.totalHours.toFixed(1)}h processed</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass text-sm">
          <BarChart3 className="w-4 h-4 text-secondary" />
          <span className="text-text-muted">{stats.totalWords.toLocaleString()} words</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass">
          <Search className="w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history..."
            className="flex-1 bg-transparent text-sm outline-none text-text-primary placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <Clock className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">
              {history.length === 0 ? "No transcriptions yet" : "No results found"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="flex items-center gap-3 p-3 rounded-xl glass glass-hover cursor-pointer group transition-all"
                  onClick={() => openTranscript(item.id)}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 flex-shrink-0">
                    <FileAudio className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-text-primary truncate">
                      {item.fileName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                      <span>{formatDuration(item.duration)}</span>
                      <span>·</span>
                      <span>{item.model}</span>
                      <span>·</span>
                      <span>{item.language}</span>
                      <span>·</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirmDelete === item.id) {
                        deleteTranscript(item.id);
                      } else {
                        setConfirmDelete(item.id);
                        setTimeout(() => setConfirmDelete(null), 3000);
                      }
                    }}
                    className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer ${
                      confirmDelete === item.id
                        ? "bg-error/10 text-error"
                        : "hover:bg-error/10 text-text-muted hover:text-error"
                    }`}
                    title={confirmDelete === item.id ? "Click again to confirm" : "Delete"}
                  >
                    {confirmDelete === item.id ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
