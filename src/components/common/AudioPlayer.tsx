import { useRef, useEffect, useState, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { readFile } from "@tauri-apps/plugin-fs";
import { useAppStore } from "../../stores/appStore";
import { formatTime } from "../../lib/utils";

interface AudioPlayerProps {
  filePath: string;
  duration: number;
  onTimeUpdate?: (time: number) => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function AudioPlayer({ filePath, duration, onTimeUpdate }: AudioPlayerProps) {
  const { currentTime, isPlaying, setCurrentTime, setIsPlaying } = useAppStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState(1);
  const [audioSrc, setAudioSrc] = useState<string>("");

  // Load audio from file path via Tauri fs plugin -> Blob URL
  useEffect(() => {
    let blobUrl = "";
    const loadAudio = async () => {
      try {
        const bytes = await readFile(filePath);
        const ext = filePath.split(".").pop()?.toLowerCase() || "wav";
        const mimeMap: Record<string, string> = {
          mp3: "audio/mpeg",
          wav: "audio/wav",
          m4a: "audio/mp4",
          ogg: "audio/ogg",
          flac: "audio/flac",
          aac: "audio/aac",
          wma: "audio/x-ms-wma",
        };
        const mime = mimeMap[ext] || "audio/mpeg";
        const blob = new Blob([bytes], { type: mime });
        blobUrl = URL.createObjectURL(blob);
        setAudioSrc(blobUrl);
      } catch (err) {
        console.error("Failed to load audio:", err);
      }
    };
    loadAudio();
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [filePath]);

  // Attach event listeners — re-run when audioSrc changes so the element exists
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioSrc, setCurrentTime, setIsPlaying, onTimeUpdate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
  }, [speed, audioSrc]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  const seek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const time = ratio * duration;
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
    [duration, setCurrentTime]
  );

  const skip = useCallback(
    (seconds: number) => {
      if (audioRef.current) {
        const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    },
    [duration, setCurrentTime]
  );

  const cycleSpeed = () => {
    const currentIndex = SPEEDS.indexOf(speed);
    const nextIndex = (currentIndex + 1) % SPEEDS.length;
    setSpeed(SPEEDS[nextIndex]);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 px-4 py-3 glass rounded-xl">
      <audio ref={audioRef} src={audioSrc || undefined} preload="auto" />

      {/* Controls */}
      <button
        onClick={() => skip(-10)}
        className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        title="Back 10s"
      >
        <SkipBack className="w-4 h-4" />
      </button>

      <button
        onClick={togglePlay}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <button
        onClick={() => skip(10)}
        className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        title="Forward 10s"
      >
        <SkipForward className="w-4 h-4" />
      </button>

      {/* Time */}
      <span className="text-xs text-text-muted min-w-[42px]">{formatTime(currentTime)}</span>

      {/* Progress bar */}
      <div
        ref={progressRef}
        onClick={seek}
        className="flex-1 h-1.5 rounded-full bg-bg-tertiary cursor-pointer group relative"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${progress}%`, marginLeft: "-6px" }}
        />
      </div>

      <span className="text-xs text-text-muted min-w-[42px] text-right">{formatTime(duration)}</span>

      {/* Speed */}
      <button
        onClick={cycleSpeed}
        className="px-2 py-1 rounded-lg text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer min-w-[40px]"
      >
        {speed}x
      </button>
    </div>
  );
}
