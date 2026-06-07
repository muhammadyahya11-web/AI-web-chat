import { useState, useEffect, useRef, useCallback } from "react";
import { Send, MessageCircle, Smile, Check, CheckCheck } from "lucide-react";
import { db } from "../../firebase/firebase";
import { useChat } from "../../context/ChatContext";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const getStatusColor = (status) => {
  switch (status) {
    case "online": return "bg-green-500";
    case "away": return "bg-yellow-500";
    case "busy": return "bg-red-500";
    default: return "bg-gray-400";
  }
};

export default function ChatCenter() {
  const { activeChat, currentUser, typingUsers, setTyping, onlineUsers } = useChat();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!activeChat) return;
    const q = query(
      collection(db, "chats", activeChat.chatId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      scrollToBottom();
    });
    markMessagesAsRead(messages);
    return () => unsub();
  }, [activeChat, scrollToBottom, messages]);

  useEffect(() => {
    if (!activeChat) return;
    if (text) setTyping(activeChat.chatId, true);
    else setTyping(activeChat.chatId, false);
  }, [text, activeChat, setTyping]);

  const markMessagesAsRead = async (msgs) => {
    if (!currentUser || !activeChat) return;
    const unreadMsgs = msgs.filter(
      (msg) => msg.senderId !== currentUser.uid && !msg.readBy?.includes(currentUser.uid)
    );
    for (const msg of unreadMsgs) {
      await updateDoc(doc(db, "chats", activeChat.chatId, "messages", msg.id), {
        readBy: [...(msg.readBy || []), currentUser.uid],
      });
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || !activeChat) return;
    const message = {
      text: text.trim(),
      senderId: currentUser.uid,
      createdAt: serverTimestamp(),
      reactions: {},
      readBy: [currentUser.uid],
      deliveredTo: [],
      type: "text",
    };
    await addDoc(collection(db, "chats", activeChat.chatId, "messages"), message);
    await setDoc(
      doc(db, "chats", activeChat.chatId),
      {
        lastMessage: text.trim(),
        updatedAt: serverTimestamp(),
        unread: {
          ...activeChat.unread,
          [currentUser.uid]: 0,
          [activeChat.user.id]: (activeChat.unread?.[activeChat.user.id] || 0) + 1,
        },
      },
      { merge: true }
    );
    setText("");
  };

  const addReaction = async (msgId, emoji) => {
    if (!activeChat) return;
    const msgRef = doc(db, "chats", activeChat.chatId, "messages", msgId);
    const snap = await getDoc(msgRef);
    if (snap.exists()) {
      const msg = snap.data();
      const reactions = msg.reactions || {};
      const existingUids = reactions[emoji] || [];
      if (existingUids.includes(currentUser.uid)) {
        await updateDoc(msgRef, {
          [`reactions.${emoji}`]: existingUids.filter((id) => id !== currentUser.uid),
        });
      } else {
        await updateDoc(msgRef, {
          [`reactions.${emoji}`]: [...existingUids, currentUser.uid],
        });
      }
    }
    setShowEmojiPicker(null);
  };

  const filterReactions = useCallback((reactions) => {
    if (!currentUser) return [];
    return Object.entries(reactions).filter(([, uids]) => uids.length > 0).map(([emoji, uids]) => ({
      emoji,
      count: uids.length,
      includesMe: uids.includes(currentUser.uid),
    }));
  }, [currentUser?.uid]);

  const getMessageStatus = (msg) => {
    const isMe = msg.senderId === currentUser.uid;
    if (!isMe) return null;
    const deliveredCount = msg.deliveredTo?.length || 0;
    const readCount = msg.readBy?.length || 0;
    if (readCount > 1) return "read";
    if (deliveredCount > 0) return "delivered";
    return "sent";
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white text-gray-400">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <MessageCircle size={48} className="text-blue-300" />
          </div>
        </motion.div>
        <p className="text-sm font-medium text-gray-500">Select a chat to start messaging</p>
        <p className="text-xs text-gray-400 mt-1">Only friends can chat with you</p>
      </div>
    );
  }

  const filteredMessages = searchQuery
    ? messages.filter((m) => m.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={activeChat.user.profile || "https://ui-avatars.com/api/?name=User&background=random"}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-100"
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                onlineUsers[activeChat.user.id]?.online ? getStatusColor(onlineUsers[activeChat.user.id]?.status || "online") : "bg-gray-400"
              }`}
            />
          </div>
          <div className="flex flex-col">
            <p className="font-semibold text-gray-900 text-sm">{activeChat.user.name}</p>
            <span className="text-xs text-gray-500">
              {typingUsers[activeChat.user.id] ? "Typing..." : onlineUsers[activeChat.user.id]?.online ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-xs border border-gray-200 rounded-full px-3 py-1 w-40 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
        <AnimatePresence>
          {filteredMessages.map((msg) => {
            const isMe = msg.senderId === currentUser.uid;
            const reactions = msg.reactions || {};
            const reactionCounts = filterReactions(reactions);
            const status = getMessageStatus(msg);

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative px-4 py-2.5 max-w-xs sm:max-w-sm md:max-w-md rounded-2xl shadow-sm break-words transition-all ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                    {msg.createdAt?.toDate?.().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {status === "read" && <CheckCheck size={12} className="text-blue-400" />}
                    {status === "delivered" && <CheckCheck size={12} className="text-gray-400" />}
                    {status === "sent" && <Check size={12} className="text-gray-400" />}
                  </div>
                  <button
                    onClick={() => setShowEmojiPicker(msg.id)}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:scale-110 transition"
                  >
                    <Smile size={12} className="text-gray-500" />
                  </button>
                  <AnimatePresence>
                    {showEmojiPicker === msg.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-6 right-2 bg-white rounded-lg shadow-lg p-2 flex gap-1 border"
                      >
                        {REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(msg.id, emoji)}
                            className="text-lg hover:scale-125 transition"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {reactionCounts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 justify-end">
                      {reactionCounts.map((r) => (
                        <span
                          key={r.emoji}
                          className={`text-xs px-1.5 py-0.5 rounded-full ${
                            r.includesMe ? "bg-blue-700 text-white" : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {r.emoji} {r.count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 z-10 px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-2xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-300 transition">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder="Write a message..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim()}
            className={`p-2 rounded-full transition-all duration-200 ${
              text.trim()
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}