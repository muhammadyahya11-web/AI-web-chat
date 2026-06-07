import { NavLink } from "react-router-dom";
import {
  MessageCircle,
  Users,
  Cpu,
  User,
  Camera,
  MessageSquarePlus,
  Home,
  LogOut,
  Sun,
  Moon,
  ChevronUp,
  Menu,
  X,
} from "lucide-react";
import { useContext, useState, useEffect } from "react";
import { UserContext } from "./Usercontext";

function Sidebar() {
  const { logout, user } = useContext(UserContext);
  const [darkMode, setDarkMode] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.setAttribute("data-theme", !darkMode ? "dark" : "light");
  };

  const toggleDesktop = () => setDesktopExpanded(!desktopExpanded);

  const linkClass = ({ isActive }) =>
    `
    flex items-center gap-3
    px-3 py-3 rounded-xl
    transition-all duration-200
    ${
      isActive
        ? "bg-white/20 text-white shadow-lg backdrop-blur-md"
        : "text-white/70 hover:bg-white/10 hover:text-white"
    }
  `;

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav
        className="
          fixed bottom-0 left-0 right-0 z-50
          h-[64px] sm:hidden
          bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460]
          border-t border-white/10
          backdrop-blur-xl shadow-2xl
          flex items-center justify-around px-2
        "
      >
        <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all ${isActive ? "text-white" : "text-white/50"}`}>
          <Home size={20} />
          <span className="text-[9px] font-bold">Home</span>
        </NavLink>
        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all ${isActive ? "text-white" : "text-white/50"}`}>
          <MessageCircle size={20} />
          <span className="text-[9px] font-bold">Chat</span>
        </NavLink>
        <NavLink to="/friends" className={({ isActive }) => `flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all ${isActive ? "text-white" : "text-white/50"}`}>
          <Users size={20} />
          <span className="text-[9px] font-bold">Friends</span>
        </NavLink>
        <NavLink to="/status" className={({ isActive }) => `flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all ${isActive ? "text-white" : "text-white/50"}`}>
          <Camera size={20} />
          <span className="text-[9px] font-bold">Status</span>
        </NavLink>
        <NavLink to="/aiboot" className={({ isActive }) => `flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all ${isActive ? "text-white" : "text-white/50"}`}>
          <Cpu size={20} />
          <span className="text-[9px] font-bold">AI</span>
        </NavLink>
      </nav>

      {/* Desktop Left Sidebar */}
      <aside
        className="
          hidden sm:flex sm:flex-col
          fixed top-0 left-0
          w-[72px] h-screen
          bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460]
          border-r border-white/10 shadow-2xl backdrop-blur-xl
          z-50 transition-all duration-300
          items-center py-4
        "
      >
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <MessageSquarePlus size={20} className="text-white" />
          </div>
        </div>

        <nav className="flex flex-col items-center gap-1 flex-1">
          <NavLink to="/profile" className={linkClass}>
            <User size={22} />
          </NavLink>
          <NavLink to="/" className={linkClass}>
            <MessageCircle size={22} />
          </NavLink>
          <NavLink to="/friends" className={linkClass}>
            <Users size={22} />
          </NavLink>
          <NavLink to="/status" className={linkClass}>
            <Camera size={22} />
          </NavLink>
          <NavLink to="/aiboot" className={linkClass}>
            <Cpu size={22} />
          </NavLink>
        </nav>

        <div className="flex flex-col items-center gap-2">
          <button onClick={toggleDarkMode} className="p-2.5 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={logout} className="p-2.5 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-200 transition">
            <LogOut size={20} />
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
