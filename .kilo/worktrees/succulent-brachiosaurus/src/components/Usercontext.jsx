import { createContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { signOut, deleteUser, sendPasswordResetEmail } from "firebase/auth";

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [Alluser, setAlluser] = useState([]);
  const [tooken, settooken] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [toast, setToast] = useState("");
  const [friendsCount, setFriendsCount] = useState(0);
  const [userStatus, setUserStatus] = useState("online");
  const [customStatus, setCustomStatus] = useState("");

  // ================= AUTH LISTENER =================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ================= FETCH ALL USERS =================
  const getAllUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  };

  useEffect(() => {
    let unsub = null;
    const fetchUsers = async () => {
      const data = await getAllUsers();
      setAlluser(data);
    };
    fetchUsers();
  }, []);

  // ================= LOAD FRIENDS COUNT =================
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(
      query(collection(db, "friends"), where("users", "array-contains", user.uid)),
      (snap) => setFriendsCount(snap.size)
    );
    return () => unsub();
  }, [user]);

  // ================= STATUS MANAGEMENT =================
  const updateStatus = async (status, customMessage = "") => {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        status,
        customStatus: customMessage,
        lastSeen: serverTimestamp(),
        online: status === "online",
      });
      setUserStatus(status);
      setCustomStatus(customMessage);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const setUserOnline = () => updateStatus("online", "");
  const setUserAway = () => updateStatus("away", " Away");
  const setUserBusy = () => updateStatus("busy", "Do not disturb");
  const setUserOffline = async () => {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        status: "offline",
        customStatus: "",
        lastSeen: serverTimestamp(),
        online: false,
      });
    } catch (err) {
      console.error("Error setting offline:", err);
    }
  };

  // ================= LOGOUT =================
  const logout = async () => {
    if (!user) return;
    try {
      await setUserOffline();
      await signOut(auth);
      settooken("");
      localStorage.removeItem("tooken");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ================= CHANGE PASSWORD =================
  const changePassword = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setToast("Reset email sent");
    } catch (error) {
      console.error(error);
      setToast("Failed to send email");
    } finally {
      setTimeout(() => setToast(""), 2000);
    }
  };

  // ================= DELETE ACCOUNT =================
  const deleteAccount = async () => {
    if (!user?.uid || !window.confirm("Delete account permanently?")) return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      localStorage.removeItem("tooken");
      settooken("");
      navigate("/");
    } catch (error) {
      console.error(error);
      setToast("Re-login required");
    } finally {
      setLoading(false);
      setTimeout(() => setToast(""), 3000);
    }
  };

  // ================= CLOUDINARY UPLOAD =================
  const uploadImageToCloudinary = async (file, type) => {
    if (!user?.uid) {
      setToast("User not logged in");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "mychat");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dtq0s174j/image/upload",
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload failed");

      const imageUrl = data.secure_url;
      await updateDoc(doc(db, "users", user.uid), { [type]: imageUrl });

      if (type === "profile") setProfileImage(imageUrl);
      else setBannerImage(imageUrl);

      setToast("Image uploaded successfully");
    } catch (err) {
      console.error(err);
      setToast(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setToast(""), 3000);
    }
  };

  // ================= LOAD USER PROFILE =================
  useEffect(() => {
    if (!user?.uid) return;

    const loadUserProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || "");
          setUsername(data.username || "");
          setBio(data.bio || "");
          setProfileImage(data.profile || "");
          setBannerImage(data.banner || "");
          setUserStatus(data.status || "online");
          setCustomStatus(data.customStatus || "");
        }
      } catch (error) {
        console.error(error);
        setToast("Failed to load profile");
        setTimeout(() => setToast(""), 3000);
      }
    };

    loadUserProfile();
  }, [user]);

  // ================= SAVE PROFILE =================
  const saveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!user?.uid) return setToast("User not logged in");
    if (usernameAvailable === false) return setToast("Username taken");

    try {
      setLoading(true);
      await updateDoc(doc(db, "users", user.uid), {
        name,
        username,
        bio,
        profile: profileImage || "",
        banner: bannerImage || "",
        lastSeen: serverTimestamp(),
        status: userStatus,
        customStatus,
      });
      setToast("Profile saved successfully");
    } catch (err) {
      console.error(err);
      setToast("Error saving profile");
    } finally {
      setLoading(false);
      setTimeout(() => setToast(""), 3000);
    }
  };

  const contextValue = {
    user,
    loading,
    setLoading,
    isAuth: !!user,
    Alluser,
    logout,
    tooken,
    settooken,
    name,
    setName,
    username,
    setUsername,
    bio,
    setBio,
    profileImage,
    setProfileImage,
    bannerImage,
    setBannerImage,
    usernameAvailable,
    setUsernameAvailable,
    toast,
    setToast,
    changePassword,
    deleteAccount,
    uploadImageToCloudinary,
    saveProfile,
    friendsCount,
    setFriendsCount,
    userStatus,
    setUserStatus: updateStatus,
    customStatus,
    setCustomStatus,
    setUserOnline,
    setUserAway,
    setUserBusy,
    setUserOffline,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {!loading && children}
    </UserContext.Provider>
  );
}
