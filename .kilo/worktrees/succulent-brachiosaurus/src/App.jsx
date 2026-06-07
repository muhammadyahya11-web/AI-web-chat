import { useContext } from "react";
import { Route, Routes } from "react-router-dom";
import Signup from "./pages/AuthPage";
import Profile from "./pages/Profile";
import ChatLayout from "./components/chat/ChatLayout";
import Sidebar from "./components/Sidebar";
import { UserContext } from "./components/Usercontext";
import AIChatMemory from "./pages/Ai";
import FriendsLayout from "./components/Friends/FriendsLayout";
import StatusLayout from "./pages/Status";

function App() {
  const { tooken } = useContext(UserContext);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      {tooken ? (
        <div
          className="
            flex flex-col-reverse
            sm:grid sm:grid-cols-[250px_1fr]
            w-full max-w-6xl
            h-full
            sm:h-[95vh]
            bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-200
          "
        >
          <Sidebar />

          <Routes>
            <Route path="/" element={<ChatLayout />} />
            <Route path="/friends" element={<FriendsLayout />} />
            <Route path="/aiboot" element={<AIChatMemory />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/status" element={<StatusLayout />} />
          </Routes>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Signup />} />
        </Routes>
      )}
    </div>
  );
}

export default App;
