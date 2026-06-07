import { useState, useContext } from "react";
import { User, AtSign, Info, Loader2, Globe, Camera, Settings, Heart, Shield } from "lucide-react";
import { UserContext } from "../components/Usercontext";
import { motion, AnimatePresence } from "framer-motion";

export default function Profile() {
  const {
    name, setName, username, setUsername, bio, setBio,
    profileImage, bannerImage, usernameAvailable, saveProfile,
    changePassword, logout, deleteAccount, loading,
    uploadImageToCloudinary, friendsCount, userStatus,
    setUserOnline, setUserAway, setUserBusy, setUserOffline, setCustomStatus,
  } = useContext(UserContext);

  const [activeStatusTab, setActiveStatusTab] = useState(userStatus || "online");
  const [customStatusText, setCustomStatusText] = useState("");
  const [showDangerZone, setShowDangerZone] = useState(false);

  const isDisabled = loading || usernameAvailable === false;

  const handleStatusChange = (status) => {
    setActiveStatusTab(status);
    const setStatus = { online: setUserOnline, away: setUserAway, busy: setUserBusy }[status];
    if (setStatus) setStatus();
  };

  const motions = {
    container: {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { staggerChildren: 0.06 }
      }
    },
    item: {
      hidden: { opacity: 0, y: 15 },
      show: { opacity: 1, y: 0 }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[var(--bg)] pb-20 sm:pb-6">
      <motion.div
        variants={motions.container}
        initial="hidden"
        animate="show"
        className="w-full max-w-3xl mx-auto space-y-4 p-4 sm:p-6"
      >
        {/* Profile Card */}
        <motion.div variants={motions.item} className="bg-[var(--bg-card)] rounded-3xl overflow-hidden shadow-lg border border-[var(--border)]">
          {/* Banner */}
          <div className="relative h-40 sm:h-52 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 group">
            {bannerImage ? (
              <img
                src={bannerImage}
                alt="banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera size={32} className="text-[var(--text-muted)]" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="text-white text-xs font-bold bg-black/50 px-4 py-2 rounded-full uppercase tracking-wider">Change Banner</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files[0] && uploadImageToCloudinary(e.target.files[0], "banner")}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--bg-card)] to-transparent"></div>
          </div>

          {/* Profile Info */}
          <div className="relative px-6 sm:px-8 pb-6">
            <div className="relative -mt-14 mb-4 flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[var(--bg-card)] flex bg-[var(--bg-card-hover)] overflow-hidden shadow-xl group">
                {profileImage ? (
                  <img src={profileImage} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={40} className="text-[var(--text-muted)]" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && uploadImageToCloudinary(e.target.files[0], "profile")}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="absolute bottom-1 right-1 w-9 h-9 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center border-2 border-[var(--bg-card)] shadow-lg">
                  <Camera size={14} className="text-white" />
                </div>
              </div>
              <div className="flex-1 sm:mb-2">
                <h1 className="font-extrabold text-xl sm:text-2xl text-[var(--text)]">{name || "Your Name"}</h1>
                <p className="text-[var(--text-muted)] text-sm mt-0.5">@{username || "username"}</p>
              </div>
              <div className="flex gap-4 sm:mb-2">
                <div className="text-center">
                  <span className="font-extrabold text-lg text-[var(--text)]">{friendsCount}</span>
                  <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">Friends</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Status Card */}
        <motion.div variants={motions.item} className="bg-[var(--bg-card)] rounded-3xl p-5 sm:p-6 shadow-lg border border-[var(--border)]">
          <h3 className="font-bold text-sm text-[var(--text)] mb-4 flex items-center gap-2">
            <Heart size={16} className="text-pink-500" />
            Set Your Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {["online", "away", "busy", "offline"].map((status) => (
              <motion.button
                key={status}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStatusChange(status)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-xs font-bold ${
                  activeStatusTab === status
                    ? status === "online" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                    : status === "away" ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                    : status === "busy" ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                    : "border-gray-400 bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                    : "border-[var(--border)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)]"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${
                  status === "online" ? "bg-emerald-500" :
                  status === "away" ? "bg-amber-500" :
                  status === "busy" ? "bg-red-500" : "bg-gray-400"
                }`} />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </motion.button>
            ))}
          </div>
          <input
            type="text"
            value={customStatusText}
            onChange={(e) => setCustomStatusText(e.target.value)}
            onBlur={() => { handleStatusChange(activeStatusTab); setCustomStatus(customStatusText); }}
            placeholder="Add custom status message..."
            className="w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-[var(--bg-card-hover)] transition text-[var(--text)] placeholder:text-[var(--text-muted)]"
          />
        </motion.div>

        {/* Edit Profile Card */}
        <motion.div variants={motions.item} className="bg-[var(--bg-card)] rounded-3xl p-5 sm:p-6 shadow-lg border border-[var(--border)]">
          <h3 className="font-bold text-sm text-[var(--text)] mb-4 flex items-center gap-2">
            <Settings size={16} className="text-indigo-500" />
            Edit Profile
          </h3>
          <div className="space-y-3">
            <ProfileInput icon={<User size={16} />} value={name} setValue={setName} placeholder="Full Name" />
            <div>
              <ProfileInput icon={<AtSign size={16} />} value={username} setValue={setUsername} placeholder="Username" />
              <div className="mt-1.5 px-1">
                <p className={`text-[11px] font-semibold flex items-center gap-1.5 ${usernameAvailable ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {usernameAvailable === true ? "Username Available" : usernameAvailable === false ? "Username Taken" : ""}
                </p>
              </div>
            </div>
            <ProfileTextarea icon={<Info size={16} />} value={bio} setValue={setBio} placeholder="Write a short bio..." />
          </div>

          <div className="flex gap-3 mt-5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isDisabled}
              onClick={saveProfile}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all shadow-md ${
                isDisabled
                  ? "bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl hover:shadow-indigo-500/25"
              }`}
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Save Profile"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={changePassword}
              className="px-5 py-3 rounded-2xl text-sm font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition"
            >
              Reset Password
            </motion.button>
          </div>
        </motion.div>

        {/* Account Actions Card */}
        <motion.div variants={motions.item} className="bg-[var(--bg-card)] rounded-3xl overflow-hidden shadow-lg border border-[var(--border)]">
          <button
            onClick={() => setShowDangerZone(!showDangerZone)}
            className="w-full flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-[var(--bg-card-hover)] transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <Shield size={18} className="text-red-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-[var(--text)]">Account Actions</p>
                <p className="text-[11px] text-[var(--text-muted)]">Logout, delete, or manage account</p>
              </div>
            </div>
            <motion.span
              animate={{ rotate: showDangerZone ? 180 : 0 }}
              className="text-[var(--text-muted)]"
            >▼</motion.span>
          </button>
          <AnimatePresence>
            {showDangerZone && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-[var(--border)]"
              >
                <div className="px-5 sm:px-6 py-4 space-y-2">
                  <motion.button
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/30 transition border border-amber-200 dark:border-amber-800/30"
                  >
                    <span className="w-7 h-7 rounded-lg bg-amber-200 dark:bg-amber-900/50 flex items-center justify-center text-[11px]">⏻</span>
                    Logout Account
                  </motion.button>
                  <motion.button
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={deleteAccount}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 transition border border-red-200 dark:border-red-800/30"
                  >
                    <span className="w-7 h-7 rounded-lg bg-red-200 dark:bg-red-900/50 flex items-center justify-center text-[11px]">⚠</span>
                    Delete Account Permanently
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.p variants={motions.item} className="text-center text-[11px] text-[var(--text-muted)] pb-6 font-medium">
          Yahya Connect v2.0 · Made with ❤️ · {new Date().getFullYear()}
        </motion.p>
      </motion.div>
    </div>
  );
}

function ProfileInput({ icon, value, setValue, placeholder }) {
  return (
    <div className="flex items-center gap-3 bg-[var(--bg-card-hover)] px-4 py-3 rounded-2xl text-sm shadow-sm border border-[var(--border)] focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
      <span className="text-[var(--text-muted)]">{icon}</span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent outline-none w-full text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]"
      />
    </div>
  );
}

function ProfileTextarea({ icon, value, setValue, placeholder, rows }) {
  return (
    <div className="flex items-start gap-3 bg-[var(--bg-card-hover)] px-4 py-3 rounded-2xl text-sm shadow-sm border border-[var(--border)] focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
      <span className="text-[var(--text-muted)] mt-0.5">{icon}</span>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={rows || 3}
        className="bg-transparent outline-none w-full text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] resize-none"
      />
    </div>
  );
}
