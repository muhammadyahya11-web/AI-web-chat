import { useState, useContext } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { db, auth } from "../firebase/firebase";
import { setDoc, doc } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
} from "lucide-react";
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
  const location = useLocation();

  const pagetoggle = () => {
    setissignup(!issignup);
    setError("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (issignup) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          name,
          email,
          uid: user.uid,
          bio: "",
          profile: "",
          cover: ""
        });

        settooken(user.accessToken)
        localStorage.setItem("tooken", user.accessToken)
        navigate("/profile", { replace: true });
      } else {
        const user = await signInWithEmailAndPassword(auth, email, password);

        settooken(user.user.accessToken)
        localStorage.setItem("tooken", user.user.accessToken)
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  if (tooken) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <div className="h-screen w-screen flex justify-center items-center bg-gradient-to-b from-[#adbeee] to-white overflow-hidden">
      <div className="h-[300px] w-[500px] bg-white rounded-lg overflow-hidden flex 
                      max-md:flex-col max-md:h-screen max-md:w-screen max-md:rounded-none">

        {/* LEFT PANEL */}
        <div className="bg-[#7494ec] h-full w-[45%] 
                        flex flex-col items-center justify-center
                        rounded-tr-[20%] rounded-br-[20%]
                        max-md:w-full max-md:h-[35%]
                        max-md:rounded-tr-none max-md:rounded-br-[20%] max-md:rounded-bl-[20%]">

          <h2 className="text-white text-[1.4rem] font-semibold">
            Hello!
          </h2>

          <p className="text-white text-[0.75rem] mt-2 text-center px-3">
            {issignup
              ? "Don't have an account?"
              : "Already have an account?"}
          </p>

          <button
            onClick={pagetoggle}
            className="mt-4 border border-white text-white 
                       rounded-md font-semibold px-6 py-1.5
                       hover:bg-white hover:text-[#7494ec] transition text-sm"
          >
            {issignup ? "Login" : "Signup"}
          </button>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col items-center justify-center h-full w-[55%] max-md:w-full px-3">

          <form
            onSubmit={handleSignup}
            className="flex flex-col items-center w-full gap-2"
          >
            {issignup && (
              <div className="relative w-[240px]">
                <User className="absolute left-2 top-3 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-8 bg-[#f0f0f0] p-2.5 rounded-md w-full text-sm outline-none"
                />
              </div>
            )}

            {/* EMAIL */}
            <div className="relative w-[240px]">
              <Mail className="absolute left-2 top-3 text-gray-400" size={16} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-8 bg-[#f0f0f0] p-2.5 rounded-md w-full text-sm outline-none"
              />
            </div>

            {/* PASSWORD */}
            <div className="relative w-[240px]">
              <Lock className="absolute left-2 top-3 text-gray-400" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-8 pr-8 bg-[#f0f0f0] p-2.5 rounded-md w-full text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-gray-500"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-[0.7rem] text-center">{error}</p>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-[60%] bg-[#7494ec] p-2.5 text-white font-semibold 
                         mt-2 rounded-md hover:opacity-90 transition 
                         disabled:opacity-50 disabled:cursor-not-allowed 
                         flex items-center justify-center gap-2 text-sm"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              {loading
                ? "Processing..."
                : issignup
                ? "Signup"
                : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
