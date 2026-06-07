// src/components/chat/ChatLayout.jsx
import ChatLeft from "./ChatLeft";
import ChatCenter from "./ChatCenter";
import ChatRight from "./ChatRight";

export default function ChatLayout() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[250px_1fr_300px] max-h-[95vh] overflow-hidden border">
      <ChatLeft />
      <ChatCenter />
      <ChatRight />
    </div>
  );
}
