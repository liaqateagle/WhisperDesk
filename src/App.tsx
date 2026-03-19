import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "./stores/appStore";
import { Sidebar } from "./components/Sidebar";
import { DropZone } from "./components/Transcribe/DropZone";
import { TranscriptView } from "./components/Transcribe/TranscriptView";
import { HistoryList } from "./components/History/HistoryList";
import { SettingsPage } from "./components/Settings/SettingsPage";
import { SpeakDockBanner } from "./components/common/SpeakDockBanner";
import { Footer } from "./components/common/Footer";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function App() {
  const { currentView, currentResult, settings } = useAppStore();

  const renderView = () => {
    if (currentView === "transcribe") {
      if (currentResult) {
        return <TranscriptView key="transcript" />;
      }
      return <DropZone key="dropzone" />;
    }
    if (currentView === "history") {
      return <HistoryList key="history" />;
    }
    return <SettingsPage key="settings" />;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-primary">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        {!settings.speakdockBannerDismissed && <SpeakDockBanner />}
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView + (currentResult ? "-result" : "")}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </div>
  );
}
