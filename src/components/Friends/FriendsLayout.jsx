import { useState, useEffect } from "react";
import { db, auth } from "../../firebase/firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, X, UserPlus, Users, Clock } from "lucide-react";

export default function FriendsLayout() {
  const [activeTab, setActiveTab] = useState("all");
  const [allUsers, setAllUsers] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => { setCurrentUserId(u?.uid || null); setLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const u1 = onSnapshot(collection(db, "users"), (s) => setAllUsers(s.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.id !== currentUserId)));
    const qs = query(collection(db, "friendRequests"), where("from", "==", currentUserId));
    const qr = query(collection(db, "friendRequests"), where("to", "==", currentUserId));
    const qf = query(collection(db, "friends"), where("users", "array-contains", currentUserId));
    const u2 = onSnapshot(qs, s => setSentRequests(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u3 = onSnapshot(qr, s => setReceivedRequests(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u4 = onSnapshot(qf, s => setFriends(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); u3(); u4(); };
  }, [currentUserId]);

  const sendRequest = async (toId) => { await setDoc(doc(db, "friendRequests", `${currentUserId}_${toId}`), { from: currentUserId, to: toId, status: "pending", createdAt: serverTimestamp() }); };
  const cancelRequest = async (id) => { await deleteDoc(doc(db, "friendRequests", id)); };
  const acceptRequest = async (req) => {
    const fid = req.from === currentUserId ? req.to : req.from;
    await setDoc(doc(db, "friends", req.id), { users: [currentUserId, fid], createdAt: serverTimestamp() });
    await deleteDoc(doc(db, "friendRequests", req.id));
  };
  const rejectRequest = async (id) => { await deleteDoc(doc(db, "friendRequests", id)); };
  const unfriend = async (fid) => {
    const f = friends.find(fr => fr.users.includes(fid));
    if (f && window.confirm("Remove this friend?")) await deleteDoc(doc(db, "friends", f.id));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg)]">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const tabs = [
    { id: "all", label: "Users", icon: "👥" },
    { id: "req", label: "Requests", icon: "🔔", count: receivedRequests.length },
    { id: "sent", label: "Sent", icon: "⏳", count: sentRequests.length },
    { id: "friends", label: "Friends", icon: "✅", count: friends.length },
  ];

  const filtered = (list) => {
    if (!searchQuery.trim()) return list;
    return list.filter(u => (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()));
  };

  return (
    <div className="flex-1 flex-col md:ml-[76px] sm:ml-0 h-full max-h-[95vh] overflow-hidden bg-[var(--bg)]">
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full h-full overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 pt-5 pb-2 flex-shrink-0">
          <h2 className="text-xl font-extrabold text-[var(--text)] tracking-tight">Friends</h2>
          <p className="text-xs text-[var(--text-muted)]">Manage your connections</p>
        </div>

        {/* Search */}
        <div className="px-4 sm:px-6 pb-2 flex-shrink-0">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b border-[var(--border)] mx-4 sm:mx-6">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-3 text-xs sm:text-sm font-bold transition relative flex items-center justify-center gap-1.5 ${activeTab === tab.id ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50" : "text-[var(--text-muted)]"}`}>
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count > 0 && <span className="absolute -top-1 right-1 sm:relative sm:top-auto sm:right-auto bg-red-500 text-white text-[10px] px-1.5 rounded-full">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 space-y-2 hide-scrollbar">
          {activeTab === "all" && (filtered(allUsers.filter(u => !friends.some(f => f.users.includes(u.id)) && !sentRequests.some(r => r.to === u.id))).length === 0) && <Empty text="No new users found" />}
          {activeTab === "all" && filtered(allUsers.filter(u => !friends.some(f => f.users.includes(u.id)) && !sentRequests.some(r => r.to === u.id))).map((user, idx) => (
            <UserCard key={user.id} user={user} index={idx}
              action={<button onClick={() => sendRequest(user.id)} className="px-5 py-2 rounded-xl text-[11px] font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md">Add</button>}
            />
          ))}

          {activeTab === "req" && (filtered(receivedRequests.map(r => allUsers.find(u => u.id === r.from)).filter(Boolean)).length === 0) && <Empty text="No friend requests" />}
          {activeTab === "req" && filtered(receivedRequests.map(r => allUsers.find(u => u.id === r.from)).filter(Boolean)).map((user) => {
            const req = receivedRequests.find(r => r.from === user.id);
            return (
              <div key={user.id} className="flex items-center justify-between bg-[var(--bg-card)] p-3.5 rounded-2xl border border-[var(--border)] shadow-sm">
                <UserCard user={user} />
                <div className="flex gap-2">
                  <button onClick={() => acceptRequest(req)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white">✓</button>
                  <button onClick={() => rejectRequest(req.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-gray-100 text-gray-600">✕</button>
                </div>
              </div>
            );
          })}

          {activeTab === "sent" && (filtered(sentRequests.map(r => allUsers.find(u => u.id === r.to)).filter(Boolean)).length === 0) && <Empty text="No sent requests" />}
          {activeTab === "sent" && filtered(sentRequests.map(r => allUsers.find(u => u.id === r.to)).filter(Boolean)).map((user, idx) => {
            const req = sentRequests.find(r => r.to === user.id);
            return (
              <div key={user.id} className="flex items-center justify-between bg-[var(--bg-card)] p-3.5 rounded-2xl border border-[var(--border)] shadow-sm">
                <UserCard user={user} index={idx} />
                <button onClick={() => cancelRequest(req.id)} className="px-4 py-2 rounded-xl text-[11px] font-bold text-gray-600 bg-gray-100 border border-gray-200">Cancel</button>
              </div>
            );
          })}

          {activeTab === "friends" && (filtered(friends.map(f => { const fid = f.users.find(id => id !== currentUserId); return fid ? allUsers.find(u => u.id === fid) : null; }).filter(Boolean)).length === 0) && <Empty text="No friends yet" />}
          {activeTab === "friends" && filtered(friends.map(f => { const fid = f.users.find(id => id !== currentUserId); return fid ? allUsers.find(u => u.id === fid) : null; }).filter(Boolean)).map((user) => (
            <UserCard key={user.id} user={user}
              action={<button onClick={() => unfriend(user.id)} className="px-4 py-2 rounded-xl text-[11px] font-bold text-red-600 bg-red-50 border border-red-200">Remove</button>}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function UserCard({ user, index, action }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (index || 0) * 0.03 }} className="flex items-center gap-3 flex-1">
      {user.profile ? (
        <img src={user.profile} className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-100" />
      ) : (
        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">{user.name?.[0]?.toUpperCase()}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[var(--text)] truncate">{user.name}</p>
        <p className="text-[11px] text-[var(--text-muted)] truncate">@{user.username || user.email}</p>
      </div>
      {action}
    </motion.div>
  );
}

function Empty({ text }) {
  return <div className="text-center py-16 text-[var(--text-muted)] text-sm">{text}</div>;
}
