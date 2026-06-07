import { useState, useContext } from "react";
import { User, AtSign, Info, Loader2, Globe, Camera } from "lucide-react";
import { UserContext } from "../components/Usercontext";

export default function Profile() {
  const {
    name,
    setName,
    username,
    setUsername,
    bio,
    setBio,
    usernameAvailable,
    saveProfile,
    changePassword,
    logout,
    deleteAccount,
    loading,
    uploadImageToCloudinary,
    friendsCount,
    userStatus,
    setUserOnline,
    setUserAway,
    setUserBusy,
    setUserOffline,
  } = useContext(UserContext);

  const [activeStatusTab, setActiveStatusTab] = useState(userStatus || "online");
  const [customStatusText, setCustomStatusText] = useState("");

  const isDisabled = loading || usernameAvailable === false;

  const handleStatusChange = (status) => {
    setActiveStatusTab(status);
    if (status === "online") setUserOnline();
    else if (status === "away") setUserAway();
    else if (status === "busy") setUserBusy();
    else if (status === "offline") setUserOffline();
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex justify-center items-start overflow-y-auto sm:p-4">
      <div className="w-full h-full max-w-6xl bg-white shadow-xl flex flex-col lg:grid lg:grid-cols-2 lg:gap-8">

        <div className="flex flex-col bg-gradient-to-b from-blue-50 to-white">
          <div className="relative h-48 bg-gray-200 group">
            {bannerImage ? (
              <img
                src={bannerImage}
                alt="banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-100 to-indigo-100">
                <Camera size={32} className="text-gray-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full">Change Banner</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files[0] &&
                uploadImageToCloudinary(e.target.files[0], "banner")
              }
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          <div className="relative -mt-12 flex flex-col items-center px-4">
            <div className="relative w-24 h-24 rounded-full border-4 border-white flex bg-gray-300 overflow-hidden shadow-lg group">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={44} className="text-gray-400 m-auto" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files[0] &&
                  uploadImageToCloudinary(e.target.files[0], "profile")
                }
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                <Camera size={12} className="text-white" />
              </div>
            </div>

            <p className="mt-3 font-semibold text-gray-800 text-lg">{name || "Your Name"}</p>
            <p className="text-gray-500 text-sm">@{username || "username"}</p>

            <div className="mt-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                userStatus === "online" ? "bg-green-100 text-green-700"
                : userStatus === "away" ? "bg-yellow-100 text-yellow-700"
                : userStatus === "busy" ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-600"
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  userStatus === "online" ? "bg-green-500"
                  : userStatus === "away" ? "bg-yellow-500"
                  : userStatus === "busy" ? "bg-red-500"
                  : "bg-gray-400"
                }`} />
                {userStatus === "online" ? "Online" : userStatus === "away" ? "Away" : userStatus === "busy" ? "Busy" : "Offline"}
                {customStatus && ` - ${customStatus}`}
              </span>
            </div>

            <div className="px-6 mt-4 flex flex-col items-center gap-3">
              <p className="text-sm text-gray-700 text-center">{bio || "Add a short bio about yourself."}</p>

              <div className="flex justify-center gap-8 mt-2">
                <div className="flex flex-col items-center">
                  <span className="font-semibold text-gray-800">0</span>
                  <span className="text-gray-500 text-xs">Posts</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-semibold text-gray-800">{friendsCount}</span>
                  <span className="text-gray-500 text-xs">Friends</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col px-6 py-6 bg-white sm:bg-none gap-5">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Globe size={14} />
              Set Your Status
            </h3>
            <div className="flex gap-2">
              {[
                { id: "online", label: "Online", color: "bg-green-500", activeClass: "ring-green-500 bg-green-50" },
                { id: "away", label: "Away", color: "bg-yellow-500", activeClass: "ring-yellow-500 bg-yellow-50" },
                { id: "busy", label: "Busy", color: "bg-red-500", activeClass: "ring-red-500 bg-red-50" },
                { id: "offline", label: "Offline", color: "bg-gray-400", activeClass: "ring-gray-400 bg-gray-50" },
              ].map((status) => (
                <button
                  key={status.id}
                  onClick={() => handleStatusChange(status.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition text-sm font-medium ${
                    activeStatusTab === status.id
                      ? `${status.activeClass} border-current`
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${status.color}`} />
                  {status.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customStatusText}
              onChange={(e) => setCustomStatusText(e.target.value)}
              onBlur={() => {
                if (activeStatusTab === "online") setUserOnline();
                else if (activeStatusTab === "away") setUserAway();
                else if (activeStatusTab === "busy") setUserBusy();
                else setUserOffline();
                setCustomStatus(customStatusText);
              }}
              placeholder="Add custom status message..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-4">
            <InputField
              icon={<User size={16} />}
              value={name}
              setValue={setName}
              placeholder="Full Name"
            />

            <InputField
              icon={<AtSign size={16} />}
              value={username}
              setValue={setUsername}
              placeholder="Username"
            />
            {username && (
              <p className={`text-xs ${usernameAvailable ? "text-green-500" : "text-red-500"}`}>
                {usernameAvailable ? "Username Available" : "Username Taken"}
              </p>
            )}

            <TextAreaField
              icon={<Info size={16} />}
              value={bio}
              setValue={setBio}
              placeholder="Bio"
              rows={3}
            />

            <button
              disabled={isDisabled}
              onClick={(e) => saveProfile(e)}
              className={`mt-2 py-3 rounded-xl w-full text-white font-semibold transition ${
                isDisabled
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-95"
              }`}
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Save Profile"}
            </button>

            <button
              onClick={changePassword}
              className="w-full py-2 rounded-lg text-blue-600 border border-blue-200 hover:bg-blue-50 transition font-medium"
            >
              Change Password
            </button>

            <button
              onClick={logout}
              className="w-full py-2 rounded-lg text-gray-600 border border-gray-200 hover:bg-gray-50 transition font-medium"
            >
              Logout
            </button>

            <button
              onClick={deleteAccount}
              className="w-full py-2 rounded-lg text-red-500 border border-red-200 hover:bg-red-50 transition font-medium"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ icon, value, setValue, placeholder }) {
  return (
    <div className="flex items-center gap-3 bg-gray-100 px-4 py-2.5 rounded-xl text-sm shadow-sm border border-transparent focus-within:border-blue-300 transition">
      {icon}
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent outline-none w-full text-sm text-gray-800 placeholder-gray-400"
      />
    </div>
  );
}

function TextAreaField({ icon, value, setValue, placeholder, rows }) {
  return (
    <div className="flex items-start gap-3 bg-gray-100 px-4 py-2.5 rounded-xl text-sm shadow-sm border border-transparent focus-within:border-blue-300 transition">
      {icon}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={rows || 3}
        className="bg-transparent outline-none w-full text-sm text-gray-800 placeholder-gray-400 resize-none"
      />
    </div>
  );
}