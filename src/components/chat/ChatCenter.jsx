import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Sparkles, Send, Smile, Check, CheckCheck, Paperclip, Mic, Search, Phone, Video, ArrowDown, MoreVertical, Square } from "lucide-react";
import { db, storage } from "../../firebase/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useChat } from "../../Context/ChatContext";
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

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "👎"];

export default function ChatCenter() {
  const { activeChat, currentUser, typingUsers, setTyping, onlineUsers } = useChat();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    if (!activeChat) return;
    const unsub = onSnapshot(
      query(collection(db, "chats", activeChat.chatId, "messages"), orderBy("createdAt", "asc")),
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        scrollToBottom();
      }
    );
    return () => unsub();
  }, [activeChat, scrollToBottom]);

  useEffect(() => {
    if (!activeChat) return;
    setTyping(activeChat.chatId, !!text);
    if (!text.trim()) {
      const stopTyping = setTimeout(() => setTyping(activeChat.chatId, false), 2000);
      return () => clearTimeout(stopTyping);
    }
  }, [text, activeChat, setTyping]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (activeChat) setTyping(activeChat.chatId, false);
    };
  }, [activeChat, setTyping]);

const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    chunksRef.current = [];
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Voice recording not supported in this browser");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        if (chunksRef.current.length === 0) return;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const audioRef = ref(storage, `voice_messages/${Date.now()}_${currentUser.uid}.webm`);
        const uploadTask = uploadBytesResumable(audioRef, blob);
        uploadTask.on("state_changed",
          null,
          (err) => console.error("Upload failed:", err),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            await addDoc(collection(db, "chats", activeChat.chatId, "messages"), {
              type: "voice",
              audioUrl: url,
              duration: recordingTime,
              senderId: currentUser.uid,
              createdAt: serverTimestamp(),
              readBy: [currentUser.uid],
              reactions: {},
            });
            await setDoc(doc(db, "chats", activeChat.chatId), {
              lastMessage: "🎙️ Voice message",
              updatedAt: serverTimestamp(),
              unread: {
                ...activeChat.unread,
                [currentUser.uid]: 0,
                [activeChat.user.id]: (activeChat.unread?.[activeChat.user.id] || 0) + 1,
              },
            }, { merge: true });
            setRecordingTime(0);
          }
        );
      };

      mediaRecorder.start();
      setIsRecording(true);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) {
      console.error("Recording error:", err);
      alert("Microphone permission required. Please allow microphone access.");
    }
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
    setTimeout(() => scrollToBottom(), 50);
  };

  const addReaction = async (msgId, emoji) => {
    if (!activeChat) return;
    const msgRef = doc(db, "chats", activeChat.chatId, "messages", msgId);
    const snap = await getDoc(msgRef);
    if (snap.exists()) {
      const msg = snap.data();
      const reactions = msg.reactions || {};
      const existingUids = reactions[emoji] || [];
      await updateDoc(msgRef, {
        [`reactions.${emoji}`]: existingUids.includes(currentUser.uid)
          ? existingUids.filter((id) => id !== currentUser.uid)
          : [...existingUids, currentUser.uid],
      });
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
    return msg.readBy?.length > 1 ? "read" : msg.deliveredTo?.length > 0 ? "delivered" : "sent";
  };

  const formatTime = (timestamp) => {
    if (!timestamp?.seconds) return "";
    return new Date(timestamp.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateSeparator = (timestamp) => {
    if (!timestamp?.seconds) return "";
    const date = new Date(timestamp.seconds * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const audioRef = ref(storage, `voice_messages/${Date.now()}_${currentUser.uid}.webm`);
        const uploadTask = uploadBytesResumable(audioRef, blob);
        uploadTask.on("state_changed", 
          null,
          (err) => console.error("Upload failed:", err),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            await addDoc(collection(db, "chats", activeChat.chatId, "messages"), {
              type: "voice",
              audioUrl: url,
              duration: recordingTime,
              senderId: currentUser.uid,
              createdAt: serverTimestamp(),
              readBy: [currentUser.uid],
              reactions: {},
            });
            await setDoc(doc(db, "chats", activeChat.chatId), {
              lastMessage: "🎙️ Voice message",
              updatedAt: serverTimestamp(),
              unread: {
                ...activeChat.unread,
                [currentUser.uid]: 0,
                [activeChat.user.id]: (activeChat.unread?.[activeChat.user.id] || 0) + 1,
              },
            }, { merge: true });
            setRecordingTime(0);
          }
        );
      };

      mediaRecorder.start();
      setIsRecording(true);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) {
      console.error("Recording error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50/50 via-white to-purple-50/50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
          className="relative"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-8 shadow-xl">
            <MessageCircle size={56} className="text-indigo-400 dark:text-indigo-500" />
          </div>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center shadow-lg"
          >
            <Sparkles size={20} className="text-white" />
          </motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-xl font-bold text-[var(--text)] mb-2">Welcome to Yahya Connect</h3>
          <p className="text-sm text-[var(--text-muted)] text-center max-w-[260px] leading-relaxed">
            Select a chat from the sidebar to start messaging with your friends
          </p>
        </motion.div>
      </div>
    );
  }

  const filteredMessages = searchQuery
    ? messages.filter((m) => m.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  let currentDate = "";

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[var(--bg-card)]">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[var(--bg-card)]/95 backdrop-blur-xl border-b border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={activeChat.user.profile || `https://ui-avatars.com/api/?name=${activeChat.user.name}&background=random`}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-100 dark:ring-indigo-900/50"
              alt={activeChat.user.name}
            />
            {onlineUsers[activeChat.user.id]?.online && (
              <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[var(--bg-card)] shadow-sm ${
                onlineUsers[activeChat.user.id]?.status === "online" ? "bg-emerald-500" :
                onlineUsers[activeChat.user.id]?.status === "away" ? "bg-amber-500" : "bg-red-500"
              }`} />
            )}
          </div>
          <div>
            <p className="font-bold text-sm text-[var(--text)]">{activeChat.user.name}</p>
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
              {typingUsers[activeChat.user.id] ? (
                <>
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Typing...</span>
                </>
              ) : onlineUsers[activeChat.user.id]?.online ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
                </span>
              ) : (
                "Offline"
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2 text-[var(--text-muted)] w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-[var(--border)] rounded-full w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-[var(--bg-card-hover)] transition text-[var(--text)] placeholder:text-[var(--text-muted)]"
            />
          </div>
          <button className="p-2 rounded-xl hover:bg-[var(--bg-card-hover)] transition text-[var(--text-secondary)]">
            <Phone size={16} />
          </button>
          <button className="p-2 rounded-xl hover:bg-[var(--bg-card-hover)] transition text-[var(--text-secondary)]">
            <Video size={16} />
          </button>
          <button className="p-2 rounded-xl hover:bg-[var(--bg-card-hover)] transition text-[var(--text-secondary)]">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-1 min-h-0 pb-20 sm:pb-4"
      >
        {filteredMessages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser.uid;
          const reactionCounts = filterReactions(msg.reactions || {});
          const status = getMessageStatus(msg);
          const msgDate = formatDateSeparator(msg.createdAt);

          const showDateSeparator = msgDate && msgDate !== currentDate;
          if (showDateSeparator) currentDate = msgDate;

          return (
            <div key={msg.id}>
              {showDateSeparator && (
                <div className="flex items-center justify-center my-4">
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--bg-card-hover)] px-4 py-1.5 rounded-full">
                    {msgDate}
                  </span>
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${isMe ? "justify-end" : "justify-start"} group mb-1`}
              >
<div className={`relative max-w-[78%] sm:max-w-[65%] md:max-w-[55%] ${isMe ? "items-end" : "items-start"}`}>
                    <div
                      className={`relative px-4 py-2.5 rounded-2xl shadow-sm transition-all ${
                        isMe
                          ? "msg-out"
                          : "msg-in"
                      }`}
                    >
                      {msg.type === "voice" ? (
                        <div className="flex items-center gap-3">
                          <audio controls src={msg.audioUrl} className="max-w-[200px]" />
                          <span className="text-[11px]">{msg.duration || 0}s</span>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                      )}
                      <div className={`text-[10px] mt-1.5 flex items-center gap-1 ${isMe ? "justify-end text-white/60" : "justify-end text-[var(--text-muted)]"}`}>
                      <span>{formatTime(msg.createdAt)}</span>
                      {isMe && status === "read" && <CheckCheck size={12} className="text-indigo-200" />}
                      {isMe && status === "delivered" && <CheckCheck size={12} className="text-white/50" />}
                      {isMe && status === "sent" && <Check size={12} className="text-white/50" />}
                    </div>

                    {!isMe && (
                      <button
                        onClick={() => setShowEmojiPicker(msg.id)}
                        className="absolute -top-2 -right-2 bg-[var(--bg-card)] rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 hover:scale-110 transition-all border border-[var(--border)]"
                      >
                        <Smile size={12} className="text-[var(--text-secondary)]" />
                      </button>
                    )}

                    <AnimatePresence>
                      {showEmojiPicker === msg.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className={`absolute ${isMe ? "right-0" : "left-0"} top-8 bg-[var(--bg-card)] rounded-xl shadow-2xl p-2.5 flex gap-1.5 border border-[var(--border)] z-20`}
                        >
                          {REACTION_EMOJIS.map((emoji) => (
                            <motion.button
                              key={emoji}
                              whileHover={{ scale: 1.4 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => addReaction(msg.id, emoji)}
                              className="text-base hover:scale-125 transition-transform"
                            >
                              {emoji}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {reactionCounts.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                      {reactionCounts.map((r) => (
                        <span
                          key={r.emoji}
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            r.includesMe
                              ? "bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300"
                              : "bg-[var(--bg-card-hover)] border-[var(--border)] text-[var(--text-secondary)]"
                          }`}
                        >
                          {r.emoji} {r.count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
        
        {/* Typing Indicator */}
        {typingUsers[activeChat.user.id] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-start mb-2"
          >
            <div className="msg-in px-4 py-2.5 rounded-2xl max-w-[65%]">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 p-2.5 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 transition"
          >
            <ArrowDown size={16} />
          </motion.button>
        )}
      </AnimatePresence>

{/* Input */}
      <div className="fixed bottom-0 left-0 right-0 z-30 sm:sticky sm:bottom-0 px-3 sm:px-4 py-3 bg-[var(--bg-card)]/95 backdrop-blur-xl border-t border-[var(--border)]">
        <div className="flex items-center gap-2 bg-[var(--bg-card-hover)] border border-[var(--border)] rounded-2xl px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all max-w-3xl mx-auto sm:mx-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 text-[var(--text-muted)] hover:text-indigo-600 rounded-full transition"
          >
            <Paperclip size={18} />
          </motion.button>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]"
          />
          {text && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={sendMessage}
              className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </motion.button>
          )}
          {!text && !isRecording && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={startRecording}
              className="p-2 text-[var(--text-muted)] hover:text-indigo-600 rounded-xl transition"
            >
              <Mic size={18} />
            </motion.button>
          )}
          {isRecording && (
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-[var(--text-muted)]">{recordingTime}s</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={stopRecording}
                className="p-1.5 rounded-lg bg-red-500 text-white"
              >
                <Square size={14} />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
