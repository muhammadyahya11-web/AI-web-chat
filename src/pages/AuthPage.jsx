import { useState, useContext } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { db, auth } from "../firebase/firebase";
import { setDoc, doc } from "firebase/firestore";
import { useNavigate, Navigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from "lucide-react";
import { UserContext } from "../components/Usercontext";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [issignup, setissignup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { tooken, settooken } = useContext(UserContext);
  const navigate = useNavigate();

  const pagetoggle = () => {
    setissignup(!issignup);
    setError("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let user;
      if (issignup) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        user = cred.user;
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid, name, email, bio: "", profile: "", cover: "", createdAt: Date.now()
        });
        settooken(user.accessToken);
        localStorage.setItem("tooken", user.accessToken);
        navigate("/profile", { replace: true });
      } else {
        user = await signInWithEmailAndPassword(auth, email, password).then(r => r.user);
        settooken(user.accessToken);
        localStorage.setItem("tooken", user.accessToken);
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  if (tooken) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-100 via-indigo-50 to-purple-100 p-4">
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-400/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-400/20 rounded-full blur-[100px]"></div>

      <div className="relative z-10 w-full max-w-4xl bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden flex flex-col md:flex-row">
        {/* Left - Brand */}
        <div className="md:w-[45%] bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 text-white flex flex-col items-center justify-center p-8 md:p-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Yahya<br/>Connect</h1>
          <p className="text-white/75 text-sm max-w-[260px] leading-relaxed">
            Chat with friends, share moments, and stay connected with your world.
          </p>
        </div>

        {/* Right - Form */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-10">
          <form onSubmit={handleSignup} className="w-full max-w-sm">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-1">{issignup ? "Create Account" : "Welcome Back"}</h2>
            <p className="text-slate-500 text-sm mb-6">{issignup ? "Start your journey" : "Sign in to continue"}</p>

            {issignup && (
              <div className="relative mb-3">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" />
              </div>
            )}

            <div className="relative mb-3">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" />
            </div>

            <div className="relative mb-3">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-50 text-sm shadow-lg flex items-center justify-center gap-2">
              {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : issignup ? "Sign Up" : "Login"}
            </button>

            <p className="text-center text-sm text-slate-500 mt-5">
              {issignup ? "Already have an account?" : "Don't have an account?"}
              <button type="button" onClick={pagetoggle} className="ml-2 text-indigo-600 font-semibold hover:underline">
                {issignup ? "Login" : "Sign Up"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
