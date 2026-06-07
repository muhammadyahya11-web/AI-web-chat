import { useEffect, useState, useMemo } from "react";
import { Trash2, AlertTriangle, Ban, Image, FileText, Link2, Pin, BellOff, Eraser } from "lucide-react";
import { db } from "../../firebase/firebase";
import { useChat } from "../../context/ChatContext";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { motion } from "framer-motion";

const formatLastSeen = (timestamp) => {
  if (!timestamp) return "Unknown";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
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
  const [loadingClear, setLoadingClear] = useState(false);

  const friendStatus = useMemo(() => {
    if (!activeChat) return {};
    const user = usersMap[activeChat.user.id];
    if (user) {
      const onlineInfo = onlineUsers[user.id] || {};
      return {
        online: user.online || onlineInfo.online || false,
        status: user.status || onlineInfo.status || "offline",
        customStatus: user.customStatus || onlineInfo.customStatus || "",
        lastSeen: user.lastSeen || onlineInfo.lastSeen || null,
      };
    }
    return {};
  }, [activeChat, usersMap, onlineUsers]);

  useEffect(() => {
    if (!activeChat) return;
    const unsub = onSnapshot(
      collection(db, "chats", activeChat.chatId, "messages"),
      (snap) => {
        const mediaFiles = snap.docs
          .map((doc) => doc.data())
          .filter((msg) => msg.imageUrl);
        setMedia(mediaFiles);
      }
    );
    return () => unsub();
  }, [activeChat]);

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to clear this chat?")) return;
    setLoadingClear(true);
    const messagesRef = collection(db, "chats", activeChat.chatId, "messages");
    const snapshot = await getDocs(messagesRef);
    await Promise.all(
      snapshot.docs.map((docItem) =>
        deleteDoc(doc(db, "chats", activeChat.chatId, "messages", docItem.id))
      )
    );
    setLoadingClear(false);
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

  if (!activeChat)
    return (
      <div className="h-full flex items-center justify-center bg-white text-gray-400 text-sm border-l">
        Select a chat
      </div>
    );

  const user = activeChat.user;

  const getStatusBadge = () => {
    if (friendStatus.online) {
      const statusColors = {
        online: "bg-green-500",
        away: "bg-yellow-500",
        busy: "bg-red-500",
      };
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white ${statusColors[friendStatus.status] || "bg-green-500"}`}>
          <span className="w-1.5 h-1.5 bg-white rounded-full" />
          {friendStatus.customStatus || friendStatus.status}
        </span>
      );
    }
    return (
      <span className="text-[10px] text-gray-400">
        {friendStatus.lastSeen ? `Last seen ${formatLastSeen(friendStatus.lastSeen)}` : "Offline"}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border-l text-sm overflow-y-auto">
      <div className="flex flex-col items-center px-6 py-6 border-b">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="relative"
        >
          <img
            src={user.profile || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
            className="h-20 w-20 rounded-full object-cover shadow-md ring-2 ring-blue-500"
          />
          {friendStatus.online && (
            <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
              friendStatus.status === "online" ? "bg-green-500" :
              friendStatus.status === "away" ? "bg-yellow-500" : "bg-red-500"
            }`} />
          )}
        </motion.div>
        <h2 className="mt-3 font-semibold text-gray-800">{user.name}</h2>
        <p className="text-xs text-gray-400">@{user.username || user.email}</p>
        <div className="mt-2">{getStatusBadge()}</div>
        {friendStatus.customStatus && !friendStatus.online && (
          <p className="text-[10px] text-blue-500 mt-1">"{friendStatus.customStatus}"</p>
        )}
      </div>

      <div className="px-6 py-4 border-b">
        <h3 className="text-xs font-semibold text-gray-600 mb-3">Shared Media</h3>
        {media.length === 0 ? (
          <p className="text-xs text-gray-400">No media shared yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {media.slice(0, 9).map((item, i) => (
                <motion.img
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  src={item.imageUrl}
                  className="h-16 w-16 object-cover rounded-lg cursor-pointer"
                  onClick={() => window.open(item.imageUrl, "_blank")}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-3">
              <div className="flex items-center gap-1">
                <Image size={14} />
                {media.length} Photos
              </div>
              <div className="flex items-center gap-1">
                <FileText size={14} />
                0 Docs
              </div>
              <div className="flex items-center gap-1">
                <Link2 size={14} />
                0 Links
              </div>
            </div>
          </>
        )}
      </div>

      <div className="px-6 py-4 border-b space-y-4">
        <button
          onClick={handleMute}
          className="flex items-center justify-between w-full hover:text-blue-500 transition"
        >
          <span className="flex items-center gap-2">
            <BellOff size={14} />
            Mute Notifications
          </span>
          <span className="text-xs text-gray-400">{isMuted ? "On" : "Off"}</span>
        </button>
        <button
          onClick={handlePin}
          className="flex items-center justify-between w-full hover:text-blue-500 transition"
        >
          <span className="flex items-center gap-2">
            <Pin size={14} />
            Pin Chat
          </span>
          <span className="text-xs text-gray-400">{isPinned ? "Pinned" : "Unpinned"}</span>
        </button>
      </div>

      <div className="px-6 py-5 border-t space-y-3 bg-white mt-auto">
        <button
          onClick={handleClearChat}
          disabled={loadingClear}
          className="flex items-center gap-2 text-yellow-600 text-xs hover:opacity-80 transition"
        >
          <Eraser size={14} />
          {loadingClear ? "Clearing..." : "Clear Chat"}
        </button>
        <button className="flex items-center gap-2 text-red-500 text-xs hover:opacity-80 transition">
          <Ban size={14} />
          Block User
        </button>
        <button className="flex items-center gap-2 text-red-500 text-xs hover:opacity-80 transition">
          <AlertTriangle size={14} />
          Report User
        </button>
        <button className="flex items-center gap-2 text-red-600 text-xs hover:opacity-80 transition">
          <Trash2 size={14} />
          Delete Chat
        </button>
      </div>
    </div>
  );
}