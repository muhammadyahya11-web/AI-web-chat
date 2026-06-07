import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, UserPlus, X, MessageCircle, Sparkles } from "lucide-react";
import { useChat } from "../../Context/ChatContext";
import { db } from "../../firebase/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatLeft() {
  const {
    currentUser,
    setActiveChat,
    usersMap,
    onlineUsers,
    friends,
    isFriend,
  } = useChat();

  const [search, setSearch] = useState("");
  const [localChats, setLocalChats] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(query(collection(db, "chats")), (snapshot) => {
      const userChats = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((chat) => chat.users && chat.users.includes(currentUser.uid))
        .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
      setLocalChats(userChats);
    });
    return () => unsub();
  }, [currentUser]);

  const startChat = useCallback(async (friendId) => {
    if (!currentUser) return;
    const existing = localChats.find((c) =>
      c.users.includes(currentUser.uid) && c.users.includes(friendId)
    );

    if (existing) {
      setActiveChat({ chatId: existing.id, user: usersMap[friendId] });
      setShowNewChat(false);
      setNewChatSearch("");
      return;
    }

    const chatId = `${currentUser.uid}_${friendId}_${Date.now()}`;
    await setDoc(doc(db, "chats", chatId), {
      users: [currentUser.uid, friendId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      typing: {},
    });
    setActiveChat({ chatId, user: usersMap[friendId] });
    setShowNewChat(false);
    setNewChatSearch("");
  }, [currentUser, localChats, usersMap, setActiveChat]);

  const filteredChats = useMemo(() => {
    if (!currentUser) return [];
    const searchText = search.toLowerCase().trim();
    return localChats.filter((chat) => {
      if (!chat.users) return false;
      const friendId = chat.users.find((id) => id !== currentUser.uid);
      if (!friendId) return false;
      const friend = usersMap[friendId];
      if (!friend) return false;
      if (!isFriend(friendId)) return false;
      if (!searchText) return true;
      return friend.name?.toLowerCase().includes(searchText) ||
             friend.username?.toLowerCase().includes(searchText);
    });
  }, [search, localChats, usersMap, currentUser, isFriend]);

  const friendUsers = useMemo(() => {
    if (!currentUser) return [];
    return friends
      .map((f) => {
        const friendId = f.users.find((id) => id !== currentUser.uid);
        return friendId ? usersMap[friendId] : null;
      })
      .filter(Boolean);
  }, [friends, usersMap, currentUser]);

  const filteredFriendsForNewChat = useMemo(() => {
    if (!newChatSearch.trim()) return friendUsers;
    const text = newChatSearch.toLowerCase().trim();
    return friendUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(text) ||
        u.username?.toLowerCase().includes(text) ||
        u.email?.toLowerCase().includes(text)
    );
  }, [newChatSearch, friendUsers]);

  const getUserStatus = (userId) => {
    return onlineUsers[userId] || { online: false, status: "offline" };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "online": return "bg-emerald-500";
      case "away": return "bg-amber-500";
      case "busy": return "bg-red-500";
      default: return "bg-slate-400";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-card)]">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-lg text-[var(--text)] tracking-tight">Chats</h2>
          <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">{friends.length} friends</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowNewChat(!showNewChat)}
          className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition"
        >
          {showNewChat
            ? <X size={18} className="text-[var(--text-secondary)]" />
            : <UserPlus size={18} className="text-indigo-600 dark:text-indigo-400" />}
        </motion.button>
      </div>

      {/* New Chat Panel */}
      <AnimatePresence>
        {showNewChat && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 py-3 border-b border-[var(--border)] bg-[var(--bg-card-hover)]"
          >
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-[var(--text-muted)] w-4 h-4" />
              <input
                type="text"
                placeholder="Search friends..."
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-700 border border-[var(--border)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition text-[var(--text)] placeholder:text-[var(--text-muted)]"
                value={newChatSearch}
                onChange={(e) => setNewChatSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="mt-3 max-h-52 overflow-y-auto space-y-1.5">
              {filteredFriendsForNewChat.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-6">No friends found</p>
              ) : (
                filteredFriendsForNewChat.map((user) => (
                  <motion.button
                    key={user.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startChat(user.id)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition text-left"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={user.profile || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent hover:ring-indigo-200 transition"
                        alt={user.name}
                      />
                      {getUserStatus(user.id).online && (
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${getStatusColor(getUserStatus(user.id).status)} rounded-full border-2 border-[var(--bg-card)] shadow-sm`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text)] truncate">{user.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">
                        {getUserStatus(user.id).online ? "Online" : "Offline"}
                      </p>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="px-3 py-3">
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 text-[var(--text-muted)] w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition text-[var(--text)] placeholder:text-[var(--text-muted)]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {filteredChats.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-[var(--text-muted)] text-xs mt-16 px-6"
          >
            <div className="w-16 h-16 bg-[var(--bg-card-hover)] rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={24} className="text-[var(--text-muted)]" />
            </div>
            <p className="font-medium">
              {search ? "No chats found" : "No chats yet"}
            </p>
            <p className="mt-1 text-[11px]">
              {search ? "Try a different search" : "Add friends to start chatting!"}
            </p>
          </motion.div>
        ) : (
          <div className="px-2 py-1 space-y-0.5">
            {filteredChats.map((chat, idx) => {
              const friendId = chat.users.find((id) => id !== currentUser.uid);
              const friend = usersMap[friendId];
              if (!friend) return null;

              const status = getUserStatus(friendId);
              const isTyping = chat.typing && chat.typing[friendId];
              const unreadCount = chat.unread?.[currentUser.uid] || 0;

              return (
                <motion.button
                  key={chat.id}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => {
                    startChat(friendId);
                    setActiveChat({ chatId: chat.id, user: friend });
                  }}
                  className="flex items-center gap-3 w-full px-3 py-3 cursor-pointer rounded-2xl hover:bg-[var(--bg-card-hover)] transition-all group"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={friend.profile || `https://ui-avatars.com/api/?name=${friend.name}&background=random`}
                      alt={friend.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-indigo-200/50 transition"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${getStatusColor(status.status)} rounded-full border-2 border-[var(--bg-card)] shadow-sm`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-sm text-[var(--text)] truncate">{friend.name}</p>
                      {chat.updatedAt?.seconds && (
                        <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0 ml-2 font-medium">
                          {new Date(chat.updatedAt.seconds * 1000).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {isTyping ? (
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1.5">
                          <span className="flex gap-0.5">
                            <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                            <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                            <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                          </span>
                          Typing...
                        </p>
                      ) : (
                        <>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.online ? "bg-emerald-400" : "bg-[var(--border)]"}`} />
                          <p className="text-xs text-[var(--text-secondary)] truncate">{chat.lastMessage || "Start conversation"}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {unreadCount > 0 && (
                    <motion.div
                      whileScale={1.1}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] px-2.5 py-1 rounded-full font-bold min-w-[22px] text-center shadow-md"
                    >
                      {unreadCount}
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
