import { useState, useCallback } from "react";
import { Menu, X, ArrowLeft } from "lucide-react";
import ChatLeft from "./ChatLeft";
import ChatCenter from "./ChatCenter";
import ChatRight from "./ChatRight";

export default function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen(s => !s), []);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full w-full overflow-hidden bg-[var(--bg)] relative">
      {/* Mobile Header - Only visible on mobile when a chat is open OR no chat */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-3 py-2.5 bg-white/95 backdrop-blur-lg border-b border-[var(--border)] shadow-sm">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition active:scale-95"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h1 className="font-bold text-base bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex-1 text-center">
          Messages
        </h1>
        <button
          onClick={() => setRightPanelOpen(r => !r)}
          className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition"
        >
          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
            i
          </span>
        </button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30" onClick={closeSidebar} />}
      {rightPanelOpen && <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30" onClick={() => setRightPanelOpen(false)} />}

      {/* Left Sidebar - Chat List */}
      <div
        className={`
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:relative md:left-0
          fixed top-0 left-0 h-full bottom-0
          w-[320px] md:w-[300px] lg:w-[320px] max-w-[85vw]
          z-40 bg-[var(--bg-card)] md:bg-transparent
          border-r border-[var(--border)] md:border-0
          transition-transform duration-300 ease-in-out
          flex flex-col shadow-2xl md:shadow-none
          md:flex-1 md:max-w-[300px] lg:max-w-[320px]
        `}
      >
        <div className="md:hidden flex-shrink-0 flex items-center justify-between px-4 py-4 border-b border-[var(--border)] pt-14">
          <h2 className="font-bold text-lg text-[var(--text)]">Chats</h2>
          <button onClick={closeSidebar} className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition">
            <X size={18} />
          </button>
        </div>
        <ChatLeft />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 min-w-0 flex flex-col bg-[var(--bg)] mt-[52px] md:mt-0">
        <ChatCenter />
      </div>

      {/* Right Info Panel - Hidden on mobile/tablet, visible on desktop */}
      <div
        className={`
          ${rightPanelOpen ? "translate-x-0" : "translate-x-full"}
          lg:translate-x-0 lg:relative lg:right-auto
          fixed top-0 right-0 h-full bottom-0
          w-[320px] max-w-[85vw]
          z-40 bg-[var(--bg-card)] lg:bg-transparent
          border-l border-[var(--border)] lg:border-0
          transition-transform duration-300 ease-in-out
          flex flex-col shadow-2xl lg:shadow-none
          lg:flex-[0_0_300px] xl:flex-[0_0_340px]
        `}
      >
        <div className="lg:hidden flex-shrink-0 flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
          <h2 className="font-bold text-lg text-[var(--text)]">Details</h2>
          <button onClick={() => setRightPanelOpen(false)} className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition">
            <X size={18} />
          </button>
        </div>
        <ChatRight />
      </div>
    </div>
  );
}
