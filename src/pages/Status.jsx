import { useState, useEffect, useRef } from "react";
import { db, auth, storage } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Image, Video, X, Heart, Eye, Film, Camera } from "lucide-react";

export default function StatusLayout() {
  const [myStatuses, setMyStatuses] = useState([]);
  const [friendsStatuses, setFriendsStatuses] = useState([]);
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState("my");
  const fileInputRef = useRef(null);
  const onTabChange = (tab) => { setActiveTab(tab); setIsSearchActive(false); };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user?.uid || null);
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const q = query(collection(db, "statuses"), where("userId", "==", currentUserId));
    const unsub = onSnapshot(q, (snap) => {
      setMyStatuses(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    const unsub = onSnapshot(collection(db, "statuses"), (snap) => {
      const statuses = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setFriendsStatuses(statuses.filter((s) => s.userId !== currentUserId));
    });
    return () => unsub();
  }, [currentUserId]);

  const uploadFile = async (file) => {
    if (!file) return null;
    setUploading(true);
    const storageRef = ref(storage, `statuses/${currentUserId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    setUploading(false);
    return downloadURL;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadFile(file).then((url) => {
      if (url) {
        const statusId = `${currentUserId}_${Date.now()}`;
        setDoc(doc(db, "statuses", statusId), {
          userId: currentUserId,
          text: statusText.trim() || "",
          mediaUrl: url,
          mediaType: file.type.startsWith("video/") ? "video" : "image",
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          seenBy: [],
          likes: 0,
        });
        setStatusText("");
        setShowAddStatus(false);
      }
    });
  };

  const addTextStatus = async () => {
    if (!statusText.trim()) return;
    const statusId = `${currentUserId}_${Date.now()}`;
    await setDoc(doc(db, "statuses", statusId), {
      userId: currentUserId,
      text: statusText.trim(),
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      seenBy: [],
      likes: 0,
    });
    setStatusText("");
    setShowAddStatus(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col sm:ml-[76px] items-center justify-center bg-[var(--bg)]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full mb-3"
        ></motion.div>
        <p className="text-sm text-[var(--text-muted)] font-medium">Loading statuses...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col sm:ml-[76px] bg-[var(--bg)]">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text)] tracking-tight">Status</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Share moments with friends</p>
        </div>
        <div className="flex bg-[var(--bg-card)] rounded-xl p-1 border border-[var(--border)] shadow-sm">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setViewMode("my")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === "my"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            My Status
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setViewMode("friends")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === "friends"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            Friends
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 hide-scrollbar">
        {viewMode === "my" && (
          <div className="mb-5">
            <p className="text-[10px] font-bold text-[var(--text-muted)] mb-3 uppercase tracking-wider">Your Status</p>
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="bg-[var(--bg-card)] rounded-2xl p-4 flex items-center gap-4 shadow-sm cursor-pointer border-2 border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 transition"
              onClick={() => setShowAddStatus(true)}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Plus size={28} className="text-white" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-[var(--text)]">Add Status</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {myStatuses.length > 0 ? `${myStatuses.length} updates` : "Share your moment"}
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {viewMode === "friends" && (
          <div className="mb-5">
            <p className="text-[10px] font-bold text-[var(--text-muted)] mb-3 uppercase tracking-wider">Friends' Statuses</p>
            {friendsStatuses.length === 0 ? (
              <div className="text-center py-14 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
                <div className="w-16 h-16 bg-[var(--bg-card-hover)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Eye size={24} className="text-[var(--text-muted)]" />
                </div>
                <p className="text-sm font-semibold text-[var(--text-secondary)]">No friend statuses yet</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {friendsStatuses.slice(0, 10).map((status, idx) => (
                  <StatusCard key={status.id} status={status} isMine={false} onClick={() => setSelectedStatus(status)} />
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === "my" && myStatuses.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] mb-3 uppercase tracking-wider">Your Updates</p>
            <div className="space-y-2.5">
              {myStatuses.map((status) => (
                <StatusCard key={status.id} status={status} isMine onClick={() => setSelectedStatus(status)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Status Modal */}
      <AnimatePresence>
        {showAddStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddStatus(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[var(--bg-card)] rounded-3xl p-5 w-full max-w-sm border border-[var(--border)] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-lg text-[var(--text)]">Create Status</h3>
                <motion.button whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShowAddStatus(false)} className="p-2 rounded-full hover:bg-[var(--bg-card-hover)] transition">
                  <X size={18} className="text-[var(--text-secondary)]" />
                </motion.button>
              </div>

              <textarea
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full border border-[var(--border)] rounded-2xl p-4 text-sm outline-none resize-none mb-4 focus:ring-2 focus:ring-indigo-500/50 bg-[var(--bg-card-hover)] transition text-[var(--text)] placeholder:text-[var(--text-muted)]"
                rows={3}
                autoFocus
              />

              <div className="grid grid-cols-2 gap-3 mb-4">
                <motion.label whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center justify-center gap-2.5 p-3.5 border-2 border-emerald-200 dark:border-emerald-700/50 rounded-2xl cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/10 transition">
                  <Camera size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Image</span>
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" ref={fileInputRef} />
                </motion.label>
                <motion.label whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center justify-center gap-2.5 p-3.5 border-2 border-purple-200 dark:border-purple-700/50 rounded-2xl cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/10 transition">
                  <Video size={18} className="text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Video</span>
                  <input type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
                </motion.label>
              </div>

              {uploading && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <motion.div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2.5 rounded-full" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2 }} />
                  </div>
                  <p className="text-[11px] text-center mt-2 text-[var(--text-muted)] font-medium">Uploading...</p>
                </div>
              )}

              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAddStatus(false)} className="flex-1 px-4 py-2.5 rounded-2xl text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-card-hover)] font-semibold text-sm transition">
                  Cancel
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={addTextStatus} disabled={!statusText.trim() || uploading} className="flex-1 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:shadow-lg disabled:opacity-50 transition">
                  Post
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Status Modal */}
      <AnimatePresence>
        {selectedStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedStatus(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[var(--bg-card)] rounded-3xl p-5 max-w-sm w-full border border-[var(--border)] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-lg text-[var(--text)]">Status</h3>
                <motion.button whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setSelectedStatus(null)} className="p-2 rounded-full hover:bg-[var(--bg-card-hover)] transition">
                  <X size={18} />
                </motion.button>
              </div>

              {selectedStatus.mediaUrl && (
                <div className="mb-4 rounded-2xl overflow-hidden border border-[var(--border)]">
                  {selectedStatus.mediaType === "video" ? (
                    <video src={selectedStatus.mediaUrl} className="w-full max-h-60" controls autoPlay />
                  ) : (
                    <img src={selectedStatus.mediaUrl} alt="status" className="w-full max-h-60 object-cover" />
                  )}
                </div>
              )}

              <p className="text-base font-medium text-[var(--text)] mb-4">{selectedStatus.text || "No text"}</p>

              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[var(--text-muted)] font-medium">
                  {selectedStatus.createdAt?.toDate?.().toLocaleString()}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const statusRef = doc(db, "statuses", selectedStatus.id);
                    setDoc(statusRef, { likes: (selectedStatus.likes || 0) + 1 }, { merge: true });
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-50 dark:bg-pink-950/20 hover:bg-pink-100 dark:hover:bg-pink-950/30 transition border border-pink-200 dark:border-pink-800/30"
                >
                  <Heart size={16} className="text-pink-500" />
                  <span className="text-sm font-bold text-pink-600 dark:text-pink-400">{selectedStatus.likes || 0}</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusCard({ status, isMine, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 2 }}
      whileTap={{ scale: 0.99 }}
      className="bg-[var(--bg-card)] rounded-2xl p-3.5 flex items-center gap-4 shadow-sm cursor-pointer border border-[var(--border)] hover:shadow-md transition-all"
      onClick={onClick}
    >
      {status.mediaUrl ? (
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gradient-to-r from-pink-500 to-purple-600 p-0.5 shadow-md">
          <div className="w-full h-full rounded-full overflow-hidden">
            {status.mediaType === "video" ? (
              <div className="relative w-full h-full">
                <video src={status.mediaUrl} className="w-full h-full object-cover" muted />
                <Film className="absolute bottom-0 right-0 w-4 h-4 text-white bg-black/50 rounded-full p-0.5" />
              </div>
            ) : (
              <img src={status.mediaUrl} alt="status" className="w-full h-full object-cover" />
            )}
          </div>
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
          <span className="text-white font-extrabold text-xl">{status.text?.charAt(0)?.toUpperCase() || "?"}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[var(--text)] truncate">{status.text || "Media Status"}</p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
          {status.createdAt?.toDate?.().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border ${isMine ? "bg-[var(--bg-card-hover)] border-[var(--border)]" : "bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800/30"}`}>
          <Heart size={11} className="text-pink-500" />
          <span className="text-[11px] font-bold text-[var(--text-secondary)]">{status.likes || 0}</span>
        </span>
      </div>
    </motion.div>
  );
}
