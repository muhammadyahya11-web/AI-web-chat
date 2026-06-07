import { useState, useEffect } from "react";
import { db, auth } from "../firebase/firebase";
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
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

export default function StatusLayout() {
  const [myStatuses, setMyStatuses] = useState([]);
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const addStatus = async () => {
    if (!statusText.trim()) return;
    const statusId = `${currentUserId}_${Date.now()}`;
    await setDoc(doc(db, "statuses", statusId), {
      userId: currentUserId,
      text: statusText.trim(),
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      seenBy: [],
    });
    setStatusText("");
    setShowAddStatus(false);
  };

  const viewStatus = async (status) => {
    await setDoc(doc(db, "statuses", status.id), {
      seenBy: [...(status.seenBy || []), currentUserId],
    }, { merge: true });
    setSelectedStatus(status);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 p-4 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full">
        <h2 className="text-lg font-semibold mb-4">Status</h2>

        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-2">My Status</p>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm cursor-pointer"
            onClick={() => setShowAddStatus(true)}
          >
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
              <Plus size={24} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-800">Add Status</p>
              <p className="text-xs text-gray-500">
                {myStatuses.length > 0 ? `${myStatuses.length} updates` : "Tap to add status"}
              </p>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {showAddStatus && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowAddStatus(false)}
            >
              <div
                className="bg-white rounded-xl p-4 w-80"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-semibold mb-3">Add Status</h3>
                <textarea
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  placeholder="What&apos;s on your mind?"
                  className="w-full border rounded-lg p-2 text-sm outline-none resize-none"
                  rows={3}
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => setShowAddStatus(false)}
                    className="px-4 py-1 rounded-lg text-gray-600 border border-gray-200 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addStatus}
                    disabled={!statusText.trim()}
                    className="px-4 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Post
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedStatus && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
              onClick={() => setSelectedStatus(null)}
            >
              <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
                <p className="text-lg">{selectedStatus.text}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {selectedStatus.createdAt?.toDate?.().toLocaleString()}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <p className="text-xs text-gray-500 mb-2">Friends' Statuses</p>
          {friendStatuses.length === 0 && (
            <p className="text-xs text-gray-400">No friend statuses yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}