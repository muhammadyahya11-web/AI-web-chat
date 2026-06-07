import { useState, useEffect, useRef } from "react";
import { Settings, Send, Bot, Copy, RefreshCw, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const aiResponses = {
  friendly: "Hey there! I\'m your friendly AI assistant. How can I help?",
  professional: "I\'m your professional AI assistant. How may I assist you?",
  creative: "Welcome, creative soul! Let\'s brainstorm something amazing together!",
  technical: "Hello! I\'m ready to help with technical questions. What\'s on your mind?",
  funny: "Why did the AI go to school? To get a little byte of knowledge! What can I do for you?",
};

const quickActions = ["Help with Code", "Creative Ideas", "Study Help", "Write an Essay", "Data Analysis"];

const getAIResponse = (input, mode, context) => {
  const modeResponse = aiResponses[mode] || aiResponses.friendly;
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes("hello") || lowerInput.includes("hi")) return `Hello! ${modeResponse}`;
  if (lowerInput.includes("code")) return `I can help with code! What language or problem are you working on?`;
  if (lowerInput.includes("idea")) return `Here\'s an idea: "${input}" — what if you combine it with modern design patterns?`;
  if (lowerInput.includes("write")) return `I\'d be happy to help you write! Share more details about tone and audience.`;

  if (context.length <= 1) return `${modeResponse} You said: "${input}". Tell me more!`;

  return `${modeResponse} Based on our chat, regarding "${input}": it connects to what we discussed before — "${context[context.length - 2]?.substring(0, 40)}...". Want to explore this further?`;
};

export default function AIChatMemory({ userId = "default" }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiMode, setAIMode] = useState("friendly");
  const [showSettings, setShowSettings] = useState(false);
  const bottomRef = useRef(null);
  const modes = ["friendly", "professional", "creative", "technical", "funny"];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), text: input, sender: "user" };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    setInput("");

    setTimeout(() => {
      const aiMsg = {
        id: Date.now() + 1,
        text: getAIResponse(input, aiMode, updated.map(m => m.text)),
        sender: "ai"
      };
      setMessages([...updated, aiMsg]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col sm:ml-[76px] h-full max-h-[95vh] bg-[var(--bg)]">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border)] px-4 py-3 flex items-center gap-3 shadow-sm z-10 relative">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
          <Bot size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-sm text-[var(--text)]">AI Assistant</h2>
          <p className="text-[11px] text-[var(--text-muted)] capitalize">{aiMode} mode</p>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-xl hover:bg-[var(--bg-card-hover)] transition">
          <Settings size={16} className="text-[var(--text-secondary)]" />
        </button>
      </div>

      {/* Settings */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="bg-white border-b overflow-hidden">
            <div className="px-4 py-3">
              <div className="grid grid-cols-5 gap-2">
                {modes.map((mode) => (
                  <button key={mode} onClick={() => setAIMode(mode)} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold capitalize ${aiMode === mode ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <Bot size={36} className="text-indigo-600" />
            </div>
            <h3 className="font-bold text-[var(--text)] mb-1">Start chatting with AI!</h3>
            <p className="text-xs text-[var(--text-muted)]">Ask me anything you like</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} gap-2`}>
              {msg.sender === "ai" && <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0"><Bot size={14} className="text-white" /></div>}
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${msg.sender === "user" ? "bg-indigo-600 text-white rounded-br-sm" : "bg-white border border-gray-200 rounded-bl-sm"}`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center"><Bot size={14} className="text-white" /></div>
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1"><span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span><span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
        <div className="flex gap-2 bg-[var(--bg-card-hover)] border border-[var(--border)] rounded-2xl px-4 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400"
          />
          <button onClick={sendMessage} disabled={!input.trim()} className={`p-2 rounded-xl ${input.trim() ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-400"}`}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
