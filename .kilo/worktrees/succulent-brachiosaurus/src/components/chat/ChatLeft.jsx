import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, UserPlus, X } from "lucide-react";
import { useChat } from "../../context/ChatContext";
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

const getStatusColor = (status) => {
  switch (status) {
    case "online": return "bg-green-500";
    case "away": return "bg-yellow-500";
    case "busy": return "bg-red-500";
    case "offline":
    default: return "bg-gray-400";
  }
};

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
  const [chats, setChats] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "chats"));
    const unsub = onSnapshot(q, (snapshot) => {
      const userChats = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((chat) => chat.users && chat.users.includes(currentUser.uid))
        .sort((a, b) => {
          if (!a.updatedAt) return 1;
          if (!b.updatedAt) return -1;
          return b.updatedAt.seconds - a.updatedAt.seconds;
        });
      setChats(userChats);
    });
    return () => unsub();
  }, [currentUser]);

  const startChat = useCallback(async (friendId) => {
    if (!currentUser) return;
    const existing = chats.find((c) =>
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
  }, [currentUser, chats, usersMap, setActiveChat]);

  const filteredChats = useMemo(() => {
    if (!currentUser) return [];
    const searchText = search.toLowerCase().trim();
    return chats.filter((chat) => {
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
  }, [search, chats, usersMap, currentUser, isFriend]);

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
    return onlineUsers[userId] || { online: false, status: "offline", customStatus: "" };
  };

  return (
    <div className="flex flex-col h-full bg-white border-r">
      <div className="px-4 py-4 border-b flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm text-gray-800">Chats</h2>
          <p className="text-[10px] text-gray-400">{friends.length} friends</p>
        </div>
        <button
          onClick={() => setShowNewChat(!showNewChat)}
          className="p-2 rounded-full hover:bg-gray-100 transition text-gray-500"
        >
          {showNewChat ? <X size={18} /> : <UserPlus size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {showNewChat && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 py-3 border-b bg-gray-50"
          >
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search friends to chat..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-full bg-white border border-gray-200 focus:ring-2 focus:ring-blue-400 outline-none"
                value={newChatSearch}
                onChange={(e) => setNewChatSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="mt-2 max-h-40 overflow-y-auto">
              {filteredFriendsForNewChat.length === 0 ? (
                <p className="text-[10px] text-gray-400 text-center py-2">No friends found</p>
              ) : (
                filteredFriendsForNewChat.map((user) => (
                  <motion.button
                    key={user.id}
                    whileHover={{ x: 4 }}
                    onClick={() => startChat(user.id)}
                    className="flex items-center gap-2 w-full px-2 py-2 hover:bg-white rounded-lg transition text-left"
                  >
                    <div className="relative">
                      <img
                        src={user.profile || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      {getUserStatus(user.id).online && (
                        <span className={`absolute bottom-0 right-0 w-2 h-2 ${getStatusColor(getUserStatus(user.id).status)} rounded-full border-2 border-white`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {getUserStatus(user.id).customStatus || (getUserStatus(user.id).online ? "Online" : "Offline")}
                      </p>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-3 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full pl-8 pr-3 py-2 text-xs rounded-full bg-gray-100 focus:ring-2 focus:ring-blue-400 outline-none transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 && (
          <div className="text-center text-gray-400 text-xs mt-10 px-4">
            {search ? "No chats match your search" : "No friend chats yet. Add friends and start chatting!"}
          </div>
        )}

        {filteredChats.map((chat) => {
          const friendId = chat.users.find((id) => id !== currentUser.uid);
          const friend = usersMap[friendId];
          if (!friend) return null;

          const status = getUserStatus(friendId);
          const isTyping = chat.typing && chat.typing[friendId];
          const unreadCount = chat.unread?.[currentUser.uid] || 0;

          return (
            <motion.div
              key={chat.id}
              whileHover={{ backgroundColor: "#f9fafb" }}
              onClick={() => {
                startChat(friendId);
                setActiveChat({ chatId: chat.id, user: friend });
              }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer transition border-b border-gray-50"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={friend.profile || `https://ui-avatars.com/api/?name=${friend.name}&background=random`}
                  alt={friend.name}
                  className="w-11 h-11 rounded-full object-cover"
                />
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(status.status)} rounded-full border-2 border-white shadow-sm`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-sm text-gray-800 truncate">{friend.name}</p>
                  {chat.updatedAt?.seconds && (
                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                      {new Date(chat.updatedAt.seconds * 1000).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-0.5">
                  {isTyping ? (
                    <p className="text-xs text-green-500 font-medium">Typing...</p>
                  ) : (
                    <>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.online ? "bg-green-400" : "bg-gray-300"}`} />
                      <p className="text-xs text-gray-500 truncate">{chat.lastMessage || "Start conversation"}</p>
                    </>
                  )}
                </div>
              </div>

              {unreadCount > 0 && (
                <div className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                  {unreadCount}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}