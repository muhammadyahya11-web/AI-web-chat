import { NavLink } from "react-router-dom";
import { MessageCircle, Users, Cpu, User, LogOut, ChevronLeft, ChevronRight, Circle } from "lucide-react";
import { useContext, useState } from "react";
import { UserContext } from "./Usercontext";

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useContext(UserContext);

  const linkClass = ({ isActive }) =>
    `flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl transition-all duration-200
     ${isActive ? "bg-white/20 text-white font-semibold shadow-lg backdrop-blur-sm" : "text-white/90 font-medium hover:bg-white/10"}`;

  return (
    <aside
      className={`${collapsed ? "w-[70px]" : "w-[250px]"} group h-full bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col justify-between transition-all duration-300 shadow-2xl`}
    >
      {/* Logo area */}
      <div>
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          {!collapsed && (
            <h1 className="text-xl font-bold text-white tracking-wide">ChatApp</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 transition hidden sm:block"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col justify-center items-center gap-1 w-full px-3 py-4">
          <NavLink to="/" className={linkClass}>
            <MessageCircle size={20} />
            {!collapsed && <span className="text-xs">Chat</span>}
          </NavLink>

          <NavLink to="/friends" className={linkClass}>
            <Users size={20} />
            {!collapsed && <span className="text-xs">Friends</span>}
          </NavLink>

          <NavLink to="/status" className={linkClass}>
            <Circle size={20} />
            {!collapsed && <span className="text-xs">Status</span>}
          </NavLink>

          <NavLink to="/aiboot" className={linkClass}>
            <Cpu size={20} />
            {!collapsed && <span className="text-xs">AIBoot</span>}
          </NavLink>

          <NavLink to="/profile" className={linkClass}>
            <User size={20} />
            {!collapsed && <span className="text-xs">Profile</span>}
          </NavLink>
        </nav>
      </div>

      {/* Bottom */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-white hover:bg-red-500/20 hover:text-red-300 transition w-full"
        >
          <LogOut size={20} />
          {!collapsed && <span className="text-xs">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
