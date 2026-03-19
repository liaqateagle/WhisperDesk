<p align="center">
  <img src="src-tauri/icons/128x128@2x.png" width="128" height="128" alt="WhisperDesk Logo" />
</p>

<h1 align="center">WhisperDesk</h1>

<p align="center">
  <strong>Free, open-source audio & video transcription. Local. Private. Beautiful.</strong>
</p>

<p align="center">
  <a href="https://github.com/liaqateagle/whisperdesk/releases">Download</a> ·
  <a href="#features">Features</a> ·
  <a href="https://speakdock.com">SpeakDock (Pro Tool)</a> ·
  <a href="https://www.youtube.com/@learnwithliaqat/">YouTube</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey" alt="Platform" />
  <img src="https://img.shields.io/badge/tauri-v2-orange" alt="Tauri v2" />
  <img src="https://img.shields.io/github/stars/liaqateagle/whisperdesk?style=social" alt="Stars" />
</p>

---

## Features

- **Local & Private** — 100% offline transcription, no cloud, no API keys, no telemetry
- **Word-Level Timestamps** — Click any word to jump to that point in the audio
- **Interactive Transcript** — Real-time word highlighting during playback
- **Multiple Export Formats** — SRT, VTT, TXT, JSON, Markdown
- **Model Manager** — Download Whisper models (tiny → large-v3) with progress bars
- **Transcription History** — SQLite-backed history with search and stats
- **Beautiful UI** — Dark/light mode, glassmorphism, smooth animations
- **99 Languages** — Full Whisper language support
- **Built-in Audio Player** — Play, pause, seek, speed control (0.5x–2x)

## Supported Formats

**Audio:** MP3, WAV, M4A, OGG, FLAC, WMA, AAC

## Tech Stack

- **Tauri v2** — Lightweight desktop framework (Rust + Web)
- **React 19 + TypeScript** — Frontend
- **Tailwind CSS v4** — Styling
- **whisper-rs** — OpenAI Whisper.cpp speech recognition
- **Symphonia** — Pure Rust audio decoding
- **SQLite** — Transcription history
- **Framer Motion** — Animations
- **Lucide React** — Icons

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) 1.70+
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)

### Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

### First Use

1. Go to **Settings → Models** and download a Whisper model (start with "base" for good quality/speed balance)
2. Go to **Transcribe** and drop an audio file
3. Click **Start Transcription**
4. View, edit, search, and export your transcript

## Whisper Models

| Model | Size | Speed | Quality |
|-------|------|-------|---------|
| tiny | 75 MB | Fastest | Basic |
| base | 142 MB | Fast | Good |
| small | 466 MB | Medium | Better |
| medium | 1.5 GB | Slow | Great |
| large-v3 | 3.1 GB | Slowest | Best |
| large-v3-turbo | 1.6 GB | Fast | Great |

## Part of the SpeakDock Ecosystem

WhisperDesk is the free, open-source companion to [SpeakDock](https://speakdock.com) — our commercial real-time dictation and voice command tool.

**WhisperDesk** = File transcription (open source, free)
**SpeakDock** = Real-time dictation, AI polish, meeting recording, voice commands (commercial)

## Author

**Liaqat Eagle**

- 🌐 [GitHub](https://github.com/liaqateagle)
- 📺 [YouTube](https://www.youtube.com/@learnwithliaqat/)
- 📘 [Facebook](https://www.facebook.com/theliaqateagle)

## License

MIT — free for personal and commercial use. See [LICENSE](LICENSE).

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.
