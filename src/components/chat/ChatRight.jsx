import { useEffect, useState, useMemo } from "react";
import { Trash2, AlertTriangle, Ban, Image, FileText, Link2, Pin, BellOff, Eraser, Info, Phone, Video, MoreHorizontal } from "lucide-react";
import { db } from "../../firebase/firebase";
import { useChat } from "../../Context/ChatContext";
import { collection, deleteDoc, doc, getDocs, updateDoc, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";

const formatLastSeen = (timestamp) => {
  if (!timestamp) return "Unknown";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    if (diffMs < 60000) return "Just now";
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
    return date.toLocaleDateString();
  } catch {
    return "Recently";
  }
};

export default function ChatRight() {
  const { activeChat, usersMap, onlineUsers } = useChat();
  const [media, setMedia] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const friendStatus = useMemo(() => {
    if (!activeChat) return {};
    const user = usersMap[activeChat.user.id];
    const onlineInfo = onlineUsers[user?.id] || {};
    return {
      online: user?.online || onlineInfo.online || false,
      status: user?.status || onlineInfo.status || "offline",
      customStatus: user?.customStatus || onlineInfo.customStatus || "",
      lastSeen: user?.lastSeen || onlineInfo.lastSeen || null,
    };
  }, [activeChat, usersMap, onlineUsers]);

  useEffect(() => {
    if (!activeChat) return;
    const unsub = onSnapshot(
      collection(db, "chats", activeChat.chatId, "messages"),
      (snap) => setMedia(snap.docs.map((doc) => doc.data()).filter((msg) => msg.imageUrl))
    );
    return () => unsub();
  }, [activeChat]);

  const handleClearChat = async () => {
    if (!window.confirm("Clear all messages?")) return;
    const snapshot = await getDocs(collection(db, "chats", activeChat.chatId, "messages"));
    await Promise.all(snapshot.docs.map((docItem) => deleteDoc(doc(db, "chats", activeChat.chatId, "messages", docItem.id))));
  };

  const handleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    await updateDoc(doc(db, "chats", activeChat.chatId), { muted: newMuted });
  };

  const handlePin = async () => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    await updateDoc(doc(db, "chats", activeChat.chatId), { pinned: newPinned });
  };

  if (!activeChat) {
    return (
      <div className="hidden lg:flex h-full w-full items-center justify-center bg-[var(--bg-card)]">
        <div className="text-center p-6">
          <div className="w-20 h-20 bg-[var(--bg-card-hover)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Info size={28} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--text-secondary)]">Select a chat</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">View details here</p>
        </div>
      </div>
    );
  }

  const user = activeChat.user;

  return (
    <div className="hidden lg:flex w-full h-full flex-col bg-[var(--bg-card)]">
      {/* Profile Header */}
      <div className="px-6 py-8 border-b border-[var(--border)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/10"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <div className="absolute -top-1 -left-1 -right-1 -bottom-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1.5">
              <img
                src={user.profile || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                className="h-20 w-20 rounded-full object-cover border-2 border-[var(--bg-card)]"
                alt={user.name}
              />
            </div>
            {friendStatus.online && (
              <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[var(--bg-card)] shadow-md ${
                friendStatus.status === "online" ? "bg-emerald-500" : friendStatus.status === "away" ? "bg-amber-500" : "bg-red-500"
              }`} />
            )}
          </div>
          <h2 className="mt-5 font-extrabold text-lg text-[var(--text)]">{user.name}</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">@{user.username || user.email}</p>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold mt-3 border ${
            friendStatus.online
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50"
              : "bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border-[var(--border)]"
          }`}>
            {friendStatus.online && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>}
            {friendStatus.online
              ? friendStatus.customStatus || friendStatus.status
              : friendStatus.lastSeen
                ? `Last seen ${formatLastSeen(friendStatus.lastSeen)}`
                : "Offline"}
          </span>

          {friendStatus.customStatus && (
            <p className="text-[11px] text-[var(--text-muted)] mt-2 italic">"{friendStatus.customStatus}"</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-5 border-b border-[var(--border)]">
        <div className="flex justify-around">
          {[
            { icon: Phone, label: "Call" },
            { icon: Video, label: "Video" },
            { icon: BellOff, label: "Mute", active: isMuted, onClick: handleMute },
            { icon: Pin, label: "Pin", active: isPinned, onClick: handlePin },
          ].map((action) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.onClick}
              className={`flex flex-col items-center gap-2 px-4 py-3 rounded-2xl transition-all ${
                action.active
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-500/30"
                  : "hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)]"
              }`}
            >
              <action.icon size={18} />
              <span className="text-[10px] font-semibold">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Shared Media */}
      <div className="px-6 py-5 border-b border-[var(--border)] flex-1 overflow-y-auto">
        <h3 className="text-xs font-bold text-[var(--text-secondary)] mb-4 flex items-center gap-2 uppercase tracking-wider">
          <Image size={13} className="text-indigo-500" />
          Shared Media ({media.length})
        </h3>
        {media.length === 0 ? (
          <div className="text-center py-10 bg-[var(--bg-card-hover)] rounded-2xl">
            <div className="w-14 h-14 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Image size={24} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-xs text-[var(--text-muted)]">No media shared yet</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {media.slice(0, 9).map((item, i) => (
                <motion.img
                  key={`${item.imageUrl}-${i}`}
                  whileHover={{ scale: 1.08 }}
                  src={item.imageUrl}
                  className="h-16 w-16 object-cover rounded-xl cursor-pointer shadow-md"
                  alt={`media-${i}`}
                  onClick={() => window.open(item.imageUrl, "_blank")}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 mt-auto space-y-1">
        <InfoItem icon={<Eraser size={15} />} label="Clear Chat" onClick={handleClearChat} variant="warning" />
        <InfoItem icon={<Ban size={15} />} label="Block User" variant="danger" />
        <InfoItem icon={<AlertTriangle size={15} />} label="Report User" variant="danger" />
        <InfoItem icon={<Trash2 size={15} />} label="Delete Chat" variant="danger" />
      </div>
    </div>
  );
}

function InfoItem({ icon, label, onClick, variant }) {
  const variantMap = {
    warning: "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20",
    danger: "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20",
  };

  return (
    <motion.button
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center gap-3 w-full text-xs hover:bg-[var(--bg-card-hover)] rounded-xl py-2.5 px-3 transition-all font-medium ${variantMap[variant] || "text-[var(--text-secondary)]"}`}
    >
      {icon}
      {label}
    </motion.button>
  );
}
