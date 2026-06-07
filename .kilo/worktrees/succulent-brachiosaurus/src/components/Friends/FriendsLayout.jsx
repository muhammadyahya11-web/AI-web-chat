import { useState, useEffect, useMemo } from "react";
import { db, auth } from "../../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, X, UserPlus, Users, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function FriendsLayout() {
  const [activeTab, setActiveTab] = useState("all");
  const [allUsers, setAllUsers] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestNotification, setRequestNotification] = useState(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user?.uid || null);
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const users = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((u) => u.id !== currentUserId);
      setAllUsers(users);
    });
    return () => unsub();
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    const qSent = query(collection(db, "friendRequests"), where("from", "==", currentUserId));
    const qReceived = query(collection(db, "friendRequests"), where("to", "==", currentUserId));
    const qFriends = query(collection(db, "friends"), where("users", "array-contains", currentUserId));

    const unsubSent = onSnapshot(qSent, (snap) => setSentRequests(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))));
    const unsubReceived = onSnapshot(qReceived, (snap) => {
      setReceivedRequests(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    const unsubFriends = onSnapshot(qFriends, (snap) => setFriends(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))));

    return () => {
      unsubSent();
      unsubReceived();
      unsubFriends();
    };
  }, [currentUserId]);

  const sendRequest = async (toId) => {
    try {
      const reqId = `${currentUserId}_${toId}`;
      await setDoc(doc(db, "friendRequests", reqId), {
        from: currentUserId,
        to: toId,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setRequestNotification({ type: "success", message: "Friend request sent!" });
    } catch (err) {
      setRequestNotification({ type: "error", message: "Failed to send request" });
    }
    setTimeout(() => setRequestNotification(null), 3000);
  };

  const cancelRequest = async (id) => {
    await deleteDoc(doc(db, "friendRequests", id));
    setRequestNotification({ type: "info", message: "Request cancelled" });
    setTimeout(() => setRequestNotification(null), 3000);
  };

  const acceptRequest = async (req) => {
    const friendId = req.from === currentUserId ? req.to : req.from;
    await setDoc(doc(db, "friends", req.id), {
      users: [currentUserId, friendId],
      createdAt: serverTimestamp(),
    });
    await deleteDoc(doc(db, "friendRequests", req.id));
    setRequestNotification({ type: "success", message: "Friend request accepted!" });
    setTimeout(() => setRequestNotification(null), 3000);
  };

  const rejectRequest = async (id) => {
    await deleteDoc(doc(db, "friendRequests", id));
    setRequestNotification({ type: "info", message: "Request rejected" });
    setTimeout(() => setRequestNotification(null), 3000);
  };

  const unfriend = async (friendId) => {
    const friend = friends.find((f) => f.users.includes(friendId));
    if (friend && window.confirm("Remove this friend?")) {
      await deleteDoc(doc(db, "friends", friend.id));
      setRequestNotification({ type: "info", message: "Friend removed" });
      setTimeout(() => setRequestNotification(null), 3000);
    }
  };

  const UserCard = ({ user, action, actionLabel, actionColor }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100"
    >
      <div className="flex items-center gap-3">
        {user.profile ? (
          <img
            src={user.profile}
            alt={user.name}
            className="h-10 w-10 rounded-full object-cover border-2 border-blue-200"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
            {user.name?.[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-medium text-sm text-gray-800">{user.name}</p>
          <p className="text-xs text-gray-500">@{user.username || user.email}</p>
        </div>
      </div>
      {action && (
        <button
          onClick={action}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
            actionColor === "red" ? "bg-red-500 hover:bg-red-600 text-white"
            : actionColor === "gray" ? "bg-gray-400 hover:bg-gray-500 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );

  const renderContent = () => {
    if (activeTab === "all") {
      const filtered = allUsers.filter((u) => {
        const isFriend = friends.some((f) => f.users.includes(u.id));
        const hasSent = sentRequests.some((r) => r.to === u.id);
        return !isFriend && !hasSent;
      });
      return filtered.length === 0
        ? <p className="text-center text-gray-400 py-8">No users found</p>
        : filtered.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              action={() => sendRequest(user.id)}
              actionLabel="Add"
              actionColor="blue"
            />
          ));
    }

    if (activeTab === "sent") {
      const pendingUsers = sentRequests
        .map((r) => allUsers.find((u) => u.id === r.to))
        .filter(Boolean);
      return pendingUsers.length === 0
        ? <p className="text-center text-gray-400 py-8">No pending requests</p>
        : pendingUsers.map((user) => {
            const req = sentRequests.find((r) => r.to === user.id);
            return (
              <UserCard
                key={user.id}
                user={user}
                action={() => cancelRequest(req.id)}
                actionLabel="Cancel"
                actionColor="gray"
              />
            );
          });
    }

    if (activeTab === "req") {
      const requestors = receivedRequests
        .map((r) => allUsers.find((u) => u.id === r.from))
        .filter(Boolean);
      return requestors.length === 0
        ? <p className="text-center text-gray-400 py-8">No friend requests</p>
        : requestors.map((user) => {
            const req = receivedRequests.find((r) => r.from === user.id);
            return (
              <div key={user.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  {user.profile ? (
                    <img src={user.profile} alt={user.name} className="h-10 w-10 rounded-full object-cover border-2 border-blue-200" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500">Sent you a friend request</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptRequest(req)}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                  >
                    <Check size={12} /> Accept
                  </button>
                  <button
                    onClick={() => rejectRequest(req.id)}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-400 hover:bg-gray-500 text-white flex items-center gap-1"
                  >
                    <X size={12} /> Reject
                  </button>
                </div>
              </div>
            );
          });
    }

    if (activeTab === "friends") {
      const friendList = friends
        .map((f) => {
          const friendId = f.users.find((id) => id !== currentUserId);
          return friendId ? allUsers.find((u) => u.id === friendId) : null;
        })
        .filter(Boolean);
      return friendList.length === 0
        ? <p className="text-center text-gray-400 py-8">No friends yet</p>
        : friendList.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              action={() => unfriend(user.id)}
              actionLabel="Unfriend"
              actionColor="red"
            />
          ));
    }
  };

  if (loading || !currentUserId) {
    return (
      <div className="w-full mx-auto sm:p-6 bg-blue-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  const tabConfig = [
    { id: "all", label: "All Users", icon: <UserPlus size={14} /> },
    { id: "req", label: "Requests", icon: <Bell size={14} />, badge: receivedRequests.length },
    { id: "sent", label: "Sent", icon: <Clock size={14} />, badge: sentRequests.length },
    { id: "friends", label: "Friends", icon: <Users size={14} />, badge: friends.length },
  ];

  return (
    <div className="w-full mx-auto sm:p-6 bg-blue-50 min-h-screen">
      <div className="bg-white sm:rounded-2xl shadow-lg sm:p-6">
        <AnimatePresence>
          {requestNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm shadow-lg z-50 flex items-center gap-2 ${
                requestNotification.type === "success" ? "bg-green-500 text-white"
                : requestNotification.type === "error" ? "bg-red-500 text-white"
                : "bg-blue-500 text-white"
              }`}
            >
              {requestNotification.type === "success" ? <CheckCircle size={16} />
               : requestNotification.type === "error" ? <AlertCircle size={16} />
               : <Bell size={16} />}
              {requestNotification.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-4 mb-4 sm:mb-6 overflow-hidden">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-xs sm:text-sm font-semibold capitalize transition flex items-center justify-center gap-1 relative ${
                activeTab === tab.id ? "text-black" : "text-blue-700 hover:bg-blue-200"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge > 0 && (
                <span className="absolute top-1 right-4 bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 overflow-y-scroll sm:gap-4 max-h-[60vh]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}