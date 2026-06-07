import { useContext } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Signup from "./pages/AuthPage";
import Profile from "./pages/Profile";
import ChatLayout from "./components/chat/ChatLayout";
import Sidebar from "./components/Sidebar";
import { UserContext } from "./components/Usercontext";
import AIChatMemory from "./pages/Ai";
import FriendsLayout from "./components/Friends/FriendsLayout";
import StatusLayout from "./pages/Status";
import { ChatProvider } from "./Context/ChatContext";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";

function AppRoutes() {
  const { tooken } = useContext(UserContext);
  const location = useLocation();

  if (!tooken) {
    return <Signup key={location.pathname} />;
  }

  return (
    <ChatProvider>
      <div className="h-screen w-screen flex overflow-hidden bg-[var(--bg)]">
        <Sidebar />
        <div className="flex-1 lg:ml-[76px] md:ml-[76px] sm:ml-0 sm:pb-[64px] h-full overflow-hidden">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<ChatLayout key="chat" />} />
              <Route path="/friends" element={<FriendsLayout key="friends" />} />
              <Route path="/aiboot" element={<AIChatMemory key="ai" />} />
              <Route path="/profile" element={<Profile key="profile" />} />
              <Route path="/status" element={<StatusLayout key="status" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </div>
    </ChatProvider>
  );
}

export default function App() {
  const { loading } = useContext(UserContext);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg)]">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-white font-extrabold text-2xl">Y</span>
          </div>
          <p className="text-[var(--text-muted)] text-sm font-medium">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="*" element={<AppRoutes />} />
    </Routes>
  );
}
