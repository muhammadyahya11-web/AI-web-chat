import { useState, useEffect, useRef } from "react";
import { Settings, Send } from "lucide-react";

// Fake AI response simulating memory
const fakeAIReply = async (userMessage, instruction, memory) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Include memory in reply
      const memorySummary =
        memory.length > 0
          ? `Previously we talked about: ${memory
              .slice(-3)
              .map((m) => `"${m.text}"`)
              .join(", ")}`
          : "This is our first chat!";
      resolve(
        `🤖 AI (${instruction || "friendly"}): ${memorySummary} Your message: "${userMessage}"`
      );
    }, 1000 + Math.random() * 1200);
  });
};

export default function AIChatMemory({ userId }) {
  const [messages, setMessages] = useState(
    JSON.parse(localStorage.getItem(`aiChatMemory_${userId}`) || "[]")
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiInstruction, setAIInstruction] = useState(
    localStorage.getItem(`aiInstruction_${userId}`) || "Friendly"
  );
  const [showSettings, setShowSettings] = useState(false);

  const bottomRef = useRef(null);

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Send user message
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now(),
      text: input,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    localStorage.setItem(
      `aiChatMemory_${userId}`,
      JSON.stringify(updatedMessages)
    );

    setInput("");
    setLoading(true);

    // AI reply using memory
    const aiText = await fakeAIReply(input, aiInstruction, updatedMessages);

    const aiMsg = {
      id: Date.now() + 1,
      text: aiText,
      sender: "ai",
      timestamp: new Date().toISOString(),
    };

    const finalMessages = [...updatedMessages, aiMsg];
    setMessages(finalMessages);
    localStorage.setItem(
      `aiChatMemory_${userId}`,
      JSON.stringify(finalMessages)
    );

    setLoading(false);
  };

  // Save AI instruction
  const saveInstruction = () => {
    localStorage.setItem(`aiInstruction_${userId}`, aiInstruction);
    setShowSettings(false);
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-3xl mx-auto bg-gray-50 shadow-lg rounded-xl overflow-hidden">

      {/* Header */}
      <div className="bg-blue-600 text-white flex items-center p-4 gap-3">
        {/* <Robot size={22} /> */}
        <span className="font-semibold text-lg">AI Chat</span>
        <span className="ml-auto text-xs opacity-80">
          {aiInstruction || "Friendly AI"}
        </span>
        <button onClick={() => setShowSettings(!showSettings)} className="ml-2">
          <Settings size={18} />
        </button>
      </div>

      {/* AI Personality Settings */}
      {showSettings && (
        <div className="bg-white p-4 border-b space-y-2">
          <h3 className="font-semibold text-sm text-gray-700">Set AI Personality</h3>
          <input
            type="text"
            value={aiInstruction}
            onChange={(e) => setAIInstruction(e.target.value)}
            placeholder="e.g., Friendly, Teacher, Funny"
            className="w-full border px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={saveInstruction}
            className="bg-blue-600 text-white py-2 px-4 rounded-xl text-sm hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-3 py-2 rounded-xl break-words text-sm ${
                msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
              }`}
            >
              {msg.text}
              <div className="text-[10px] text-gray-500 mt-1 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[75%] px-3 py-2 rounded-xl bg-gray-200 text-black text-sm animate-pulse">
              AI is typing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex p-2 border-t bg-white gap-2">
        <input
          className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
        />
        <button
          className={`bg-blue-600 text-white p-2 rounded-xl ${
            loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
          }`}
          onClick={sendMessage}
          disabled={loading}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
