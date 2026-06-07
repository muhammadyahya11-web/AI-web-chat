import { createContext, useContext, useState, useEffect } from "react";
import { db, auth } from "../firebase/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";

export const ChatContext = createContext();
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState({ sent: [], received: [] });
  const [userStatuses, setUserStatuses] = useState({});
  const [chats, setChats] = useState([]);

  // ================= AUTH LISTENER =================
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // ================= LOAD USERS =================
  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsub = onSnapshot(q, (snap) => {
      const users = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAllUsers(users);
      const map = {};
      users.forEach((u) => {
        map[u.id] = u;
      });
      setUsersMap(map);
    });
    return () => unsub();
  }, []);

  // ================= LOAD FRIENDS =================
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "friends"), where("users", "array-contains", currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      setFriends(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [currentUser]);

  // ================= LOAD FRIEND REQUESTS =================
  useEffect(() => {
    if (!currentUser) return;
    const qSent = query(collection(db, "friendRequests"), where("from", "==", currentUser.uid));
    const qReceived = query(collection(db, "friendRequests"), where("to", "==", currentUser.uid));

    const unsubSent = onSnapshot(qSent, (snap) => {
      setFriendRequests((prev) => ({
        ...prev,
        sent: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      }));
    });

    const unsubReceived = onSnapshot(qReceived, (snap) => {
      setFriendRequests((prev) => ({
        ...prev,
        received: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      }));
    });

    return () => {
      unsubSent();
      unsubReceived();
    };
  }, [currentUser]);

  // ================= LOAD CHATS =================
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "chats"));
    const unsub = onSnapshot(q, (snap) => {
      const userChats = snap.docs
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

  // ================= ONLINE / OFFLINE =================
  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);

    const goOnline = async () => {
      try {
        await updateDoc(userRef, {
          online: true,
          lastSeen: serverTimestamp(),
        });
      } catch {}
    };

    const goOffline = async () => {
      try {
        await updateDoc(userRef, {
          online: false,
          lastSeen: serverTimestamp(),
        });
      } catch {}
    };

    goOnline();
    window.addEventListener("beforeunload", goOffline);
    return () => {
      goOffline();
      window.removeEventListener("beforeunload", goOffline);
    };
  }, [currentUser]);

  // ================= LOAD ONLINE USERS =================
  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.docs.forEach((doc) => {
        const data = doc.data();
        map[doc.id] = {
          online: data.online || false,
          status: data.status || "offline",
          customStatus: data.customStatus || "",
          lastSeen: data.lastSeen || null,
        };
      });
      setOnlineUsers(map);
    });
    return () => unsub();
  }, []);

  // ================= TYPING =================
  const setTyping = async (chatId, isTyping) => {
    if (!currentUser || !chatId) return;
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      [`typing.${currentUser.uid}`]: isTyping,
    });
  };

  // ================= LISTEN ACTIVE CHAT TYPING =================
  useEffect(() => {
    if (!activeChat) return;
    const chatRef = doc(db, "chats", activeChat.chatId);
    const unsub = onSnapshot(chatRef, (snap) => {
      if (snap.exists()) {
        setTypingUsers(snap.data().typing || {});
      }
    });
    return () => unsub();
  }, [activeChat]);

  // ================= HELPER: CHECK IF FRIENDS =================
  const isFriend = (userId) => {
    return friends.some((f) => f.users.includes(userId));
  };

  // ================= HELPER: GET FRIEND IDS =================
  const getFriendIds = () => {
    return friends.map((f) => f.users.find((id) => id !== currentUser?.uid)).filter(Boolean);
  };

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        allUsers,
        usersMap,
        activeChat,
        setActiveChat,
        typingUsers,
        setTyping,
        onlineUsers,
        friends,
        setFriends,
        friendRequests,
        userStatuses,
        setUserStatuses,
        chats,
        setChats,
        isFriend,
        getFriendIds,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
