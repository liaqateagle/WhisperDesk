import { FileAudio, History, Settings, Mic } from "lucide-react";
import { useAppStore, View } from "../stores/appStore";
import { motion } from "framer-motion";

const navItems: { id: View; icon: typeof FileAudio; label: string }[] = [
  { id: "transcribe", icon: FileAudio, label: "Transcribe" },
  { id: "history", icon: History, label: "History" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const { currentView, setCurrentView, setCurrentResult } = useAppStore();

  return (
    <div className="flex flex-col items-center w-[68px] bg-bg-secondary border-r border-border py-4 gap-1">
      {/* Logo */}
      <div className="flex items-center justify-center w-10 h-10 mb-4 rounded-xl bg-primary/20">
        <Mic className="w-5 h-5 text-primary" />
      </div>

      {/* Nav items */}
      {navItems.map(({ id, icon: Icon, label }) => {
        const isActive = currentView === id;
        return (
          <button
            key={id}
            onClick={() => {
              setCurrentView(id);
              if (id !== "transcribe") setCurrentResult(null);
            }}
            className={`
              relative flex flex-col items-center justify-center w-12 h-12 rounded-xl
              transition-all duration-200 cursor-pointer group
              ${isActive ? "text-primary" : "text-text-muted hover:text-text-secondary"}
            `}
            title={label}
          >
            {isActive && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 bg-primary/10 rounded-xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <Icon className="w-5 h-5 relative z-10" />
            <span className="text-[10px] mt-0.5 relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
